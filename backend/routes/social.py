"""
Social and Group Chat Routes Module
===================================
This module defines the social Blueprint, implementing group chats automatically created
for upcoming treks, allowing guides to publish announcements, lock/unlock chat groups, 
retrieve membership, and post messages.
"""

from datetime import datetime, timedelta
from flask import Blueprint, request, jsonify

from backend.models.models import (
    db, User, Trek, Booking, ChatMessage, TrekGroupSetting, UserAnnouncementRead
)
from backend.auth_utils import current_user, login_required

# Instantiate the social Blueprint
social_bp = Blueprint('social', __name__)


def auto_create_social_groups():
    """
    Scans the database for treks scheduled to start within 5 days.
    If no group settings or system messages exist for them, automatically creates
    the group setting and inserts a system initialization chat message.

    Returns:
        None
    """
    today = datetime.utcnow().date()
    target_date = today + timedelta(days=5)
    
    # Query all treks scheduled to start on or before the target date
    treks = Trek.query.filter(Trek.start_date <= target_date).all()
    for t in treks:
        msg_count = ChatMessage.query.filter_by(trek_id=t.id).count()
        if msg_count == 0:
            # Check for group settings record, or build one
            settings = TrekGroupSetting.query.filter_by(trek_id=t.id).first()
            if not settings:
                settings = TrekGroupSetting(trek_id=t.id, is_locked=False)
                db.session.add(settings)
            
            # Use staff guide as sender, or fallback to Admin (id=1)
            sender_id = t.staff_id if t.staff_id else 1
            sender_user = User.query.get(sender_id)
            sender_name = sender_user.name if sender_user else "System"
            sender_role = sender_user.role if sender_user else "admin"
            
            msg_text = "Group automatically created before 5 days of trek start. Participants added: all booked trekkers."
            msg = ChatMessage(
                trek_id=t.id,
                sender_id=sender_id,
                sender_name=sender_name,
                sender_role=sender_role,
                message_text=msg_text,
                is_announcement=False
            )
            db.session.add(msg)
    db.session.commit()


@social_bp.route('/api/social/groups', methods=['GET'])
@login_required
def get_social_groups():
    """
    Retrieves all group chat rooms the logged-in user is a member of.
    Triggers auto creation logic beforehand.

    Returns:
        JSON list of active trek chat groups.
    """
    auto_create_social_groups()
    if current_user.role == 'user':
        # Treks the trekker has actively booked
        bookings = Booking.query.filter_by(user_id=current_user.id, status='Booked').all()
        treks = [b.trek for b in bookings if b.trek]
    elif current_user.role == 'staff':
        # Treks assigned to the guide
        treks = Trek.query.filter_by(staff_id=current_user.id).all()
    elif current_user.role == 'admin':
        treks = Trek.query.all()
    else:
        return jsonify({'error': 'Unauthorized'}), 403
        
    groups = []
    for t in treks:
        # Only include active groups (must have at least one message/been created)
        msg_count = ChatMessage.query.filter_by(trek_id=t.id).count()
        if msg_count == 0:
            continue
            
        settings = TrekGroupSetting.query.filter_by(trek_id=t.id).first()
        is_locked = settings.is_locked if settings else False
        
        # Calculate active members: booked trekkers + guide
        member_count = Booking.query.filter_by(trek_id=t.id, status='Booked').count()
        if t.staff_id:
            member_count += 1
            
        # Check if there are any unread announcements for trekkers
        has_unread = False
        if current_user.role == 'user':
            latest_announcement = ChatMessage.query.filter_by(trek_id=t.id, is_announcement=True).order_by(ChatMessage.id.desc()).first()
            if latest_announcement:
                read_record = UserAnnouncementRead.query.filter_by(user_id=current_user.id, trek_id=t.id).first()
                if not read_record or read_record.last_read_message_id < latest_announcement.id:
                    has_unread = True
                    
        groups.append({
            'id': t.id,
            'name': t.name,
            'batchCode': t.batch_code or f"TID{t.id:03d}B01",
            'startDate': t.start_date.strftime('%Y-%m-%d') if t.start_date else '',
            'endDate': t.end_date.strftime('%Y-%m-%d') if t.end_date else '',
            'status': t.status,
            'isLocked': is_locked,
            'memberCount': member_count,
            'hasUnreadAnnouncement': has_unread
        })
        
    return jsonify(groups)


@social_bp.route('/api/social/pending_groups', methods=['GET'])
@login_required
def get_pending_social_groups():
    """
    Retrieves treks assigned to the guide that do not have active groups yet.

    Returns:
        JSON list of pending group details.
    """
    auto_create_social_groups()
    if current_user.role != 'staff':
        return jsonify({'error': 'Unauthorized'}), 403

    treks = Trek.query.filter_by(staff_id=current_user.id).all()
    pending = []
    for t in treks:
        msg_count = ChatMessage.query.filter_by(trek_id=t.id).count()
        if msg_count == 0:
            member_count = Booking.query.filter_by(trek_id=t.id, status='Booked').count()
            if t.staff_id:
                member_count += 1
            pending.append({
                'id': t.id,
                'name': t.name,
                'batchCode': t.batch_code or f"TID{t.id:03d}B01",
                'startDate': t.start_date.strftime('%Y-%m-%d') if t.start_date else '',
                'endDate': t.end_date.strftime('%Y-%m-%d') if t.end_date else '',
                'status': t.status,
                'memberCount': member_count
            })

    return jsonify(pending)


@social_bp.route('/api/social/group/<int:trek_id>/create', methods=['POST'])
@login_required
def create_social_group(trek_id):
    """
    Allows a guide to manually initialize their trek group chat before the 5-day auto limit.

    Parameters:
        trek_id (int): Trek batch ID.

    Returns:
        JSON indicating group creation status.
    """
    trek = Trek.query.get(trek_id)
    if not trek:
        return jsonify({'error': 'Trek not found.'}), 404
    if current_user.role != 'staff' or trek.staff_id != current_user.id:
        return jsonify({'error': 'Unauthorized'}), 403

    msg_count = ChatMessage.query.filter_by(trek_id=trek_id).count()
    if msg_count > 0:
        return jsonify({'error': 'Group already exists'}), 400

    settings = TrekGroupSetting.query.filter_by(trek_id=trek_id).first()
    if not settings:
        settings = TrekGroupSetting(trek_id=trek_id, is_locked=False)
        db.session.add(settings)

    msg_text = f"Group created by guide {current_user.name}. Participants added: all booked trekkers."
    msg = ChatMessage(
        trek_id=trek_id,
        sender_id=current_user.id,
        sender_name=current_user.name,
        sender_role='staff',
        message_text=msg_text,
        is_announcement=False
    )
    db.session.add(msg)
    db.session.commit()
    return jsonify({'success': True, 'message': 'Group created and participants included.', 'trek': trek.to_json()})


@social_bp.route('/api/social/group/<int:trek_id>/messages', methods=['GET'])
@login_required
def get_social_group_messages(trek_id):
    """
    Retrieves all messages for a specific trek chat. Logs announcement read tracking.

    Parameters:
        trek_id (int): Trek batch ID.

    Returns:
        JSON list of chat messages.
    """
    is_member = False
    if current_user.role == 'admin':
        is_member = True
    elif current_user.role == 'staff':
        trek = Trek.query.filter_by(id=trek_id, staff_id=current_user.id).first()
        if trek:
            is_member = True
    else:
        booking = Booking.query.filter_by(user_id=current_user.id, trek_id=trek_id, status='Booked').first()
        if booking:
            is_member = True
            
    if not is_member:
        return jsonify({'error': 'You are not a member of this trek group.'}), 403
        
    messages = ChatMessage.query.filter_by(trek_id=trek_id).order_by(ChatMessage.created_at.asc()).all()
    
    # If the user is a trekker, update their announcement read tracking records
    latest_announcement = ChatMessage.query.filter_by(trek_id=trek_id, is_announcement=True).order_by(ChatMessage.id.desc()).first()
    if latest_announcement and current_user.role == 'user':
        read_record = UserAnnouncementRead.query.filter_by(user_id=current_user.id, trek_id=trek_id).first()
        if not read_record:
            read_record = UserAnnouncementRead(user_id=current_user.id, trek_id=trek_id, last_read_message_id=latest_announcement.id)
            db.session.add(read_record)
        else:
            read_record.last_read_message_id = max(read_record.last_read_message_id, latest_announcement.id)
        db.session.commit()
        
    return jsonify([m.to_json() for m in messages])


@social_bp.route('/api/social/group/<int:trek_id>/messages', methods=['POST'])
@login_required
def send_social_group_message(trek_id):
    """
    Posts a new message to a trek chat group. Restricts non-staff from posting 
    announcements or sending messages if the chat is locked.

    Parameters:
        trek_id (int): Trek batch ID.

    Request Body (JSON):
        messageText (str): Text of the message.
        isAnnouncement (bool, optional): Default False.
        announcementTitle (str, optional): Title.

    Returns:
        JSON representation of the posted message.
    """
    is_member = False
    trek = Trek.query.get(trek_id)
    if not trek:
        return jsonify({'error': 'Trek not found.'}), 404
        
    if current_user.role == 'admin':
        is_member = True
    elif current_user.role == 'staff':
        if trek.staff_id == current_user.id:
            is_member = True
    else:
        booking = Booking.query.filter_by(user_id=current_user.id, trek_id=trek_id, status='Booked').first()
        if booking:
            is_member = True
            
    if not is_member:
        return jsonify({'error': 'You are not a member of this trek group.'}), 403
        
    settings = TrekGroupSetting.query.filter_by(trek_id=trek_id).first()
    is_locked = settings.is_locked if settings else False
    if is_locked and current_user.role == 'user':
        return jsonify({'error': 'This chat has been locked by the guide.'}), 403
        
    data = request.get_json() or {}
    message_text = data.get('messageText', '').strip()
    is_announcement = data.get('isAnnouncement', False)
    announcement_title = data.get('announcementTitle', '').strip()
    
    if not message_text:
        return jsonify({'error': 'Message text is required.'}), 400
        
    # Standard trekkers cannot post announcements
    if current_user.role == 'user':
        is_announcement = False
        announcement_title = None
        
    msg = ChatMessage(
        trek_id=trek_id,
        sender_id=current_user.id,
        sender_name=current_user.name,
        sender_role=current_user.role,
        message_text=message_text,
        is_announcement=is_announcement,
        announcement_title=announcement_title if is_announcement else None
    )
    db.session.add(msg)
    db.session.commit()
    
    return jsonify(msg.to_json())


@social_bp.route('/api/social/group/<int:trek_id>/toggle_lock', methods=['POST'])
@login_required
def toggle_social_group_lock(trek_id):
    """
    Toggles the locked state of the chat room. (Only assigned guide or Admin).

    Parameters:
        trek_id (int): Trek batch ID.

    Returns:
        JSON response indicating new lock status.
    """
    trek = Trek.query.get(trek_id)
    if not trek:
        return jsonify({'error': 'Trek not found.'}), 404
        
    if current_user.role != 'admin' and (current_user.role != 'staff' or trek.staff_id != current_user.id):
        return jsonify({'error': 'Unauthorized'}), 403
        
    settings = TrekGroupSetting.query.filter_by(trek_id=trek_id).first()
    if not settings:
        settings = TrekGroupSetting(trek_id=trek_id, is_locked=True)
        db.session.add(settings)
    else:
        settings.is_locked = not settings.is_locked
        
    db.session.commit()
    return jsonify({'success': True, 'isLocked': settings.is_locked})


@social_bp.route('/api/social/group/<int:trek_id>/members', methods=['GET'])
@login_required
def get_social_group_members(trek_id):
    """
    Retrieves basic profiles for the guide and all active trekkers in the chat group.

    Parameters:
        trek_id (int): Trek batch ID.

    Returns:
        JSON response with guide and trekkers lists.
    """
    trek = Trek.query.get(trek_id)
    if not trek:
        return jsonify({'error': 'Trek not found.'}), 404
        
    # 1. Retrieve guide details
    guide_data = None
    if trek.staff:
        profile = trek.staff.staff_profile
        photos = [
            "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&h=300&fit=crop",
            "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=300&fit=crop",
            "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&h=300&fit=crop"
        ]
        photo_url = (profile.photo_url if (profile and profile.photo_url) else None) or photos[trek.staff.id % len(photos)]
        guide_data = {
            'id': trek.staff.id,
            'name': trek.staff.name,
            'photoUrl': photo_url,
            'designation': profile.designation if profile else 'Lead Guide',
            'role': 'guide'
        }
        
    # 2. Retrieve registered trekkers details
    bookings = Booking.query.filter_by(trek_id=trek_id, status='Booked').all()
    trekkers = []
    photos = [
        "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&h=300&fit=crop",
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=300&fit=crop",
        "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&h=300&fit=crop"
    ]
    for b in bookings:
        u = b.user
        photo_url = photos[u.id % len(photos)]
        trekkers.append({
            'id': u.id,
            'name': u.name,
            'photoUrl': photo_url,
            'bio': u.bio or 'Outdoor enthusiast. Passionate about exploring the trails.',
            'city': u.city or 'Not Specified',
            'joined': u.registered_at.strftime('%Y-%m-%d') if u.registered_at else '',
            'preferredDifficulty': u.preferred_difficulty or 'Moderate',
            'role': 'trekker'
        })
        
    return jsonify({
        'guide': guide_data,
        'trekkers': trekkers
    })
