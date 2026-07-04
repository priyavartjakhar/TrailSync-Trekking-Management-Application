"""
Staff/Guide Routes Module
=========================
This module defines the staff Blueprint, housing guide dashboards, slot limits configuration, 
batch statuses, participant checklists validation, guide-specific profile/password logic,
internal support tickets, and guest exports.
"""

import os
import csv
from datetime import datetime
from flask import Blueprint, request, jsonify, current_app
from werkzeug.security import generate_password_hash, check_password_hash

from backend.models.models import (
    db, Trek, Booking, TrekGuideItem, BookingChecklistItem, SupportTicket
)
from backend.auth_utils import current_user, login_required
from backend.redis_utils import (
    cache_get, cache_set,
    invalidate_all_trek_caches,
    invalidate_staff_cache,
    staff_dashboard_key, TTL_STAFF_DASHBOARD
)
from backend.db_utils import update_completed_bookings

# Instantiate the staff Blueprint
staff_bp = Blueprint('staff', __name__)


@staff_bp.route('/api/staff/dashboard_data', methods=['GET'])
@login_required
def staff_dashboard_data():
    """
    Fetches stats and assigned lists for the guide dashboard, including 
    participant registry info and the guide's personal profile information.
    Served from Redis per-staff cache (key: 'staff_dashboard:{id}', TTL: 120s).
    Falls back to DB on cache miss and repopulates the cache.

    Returns:
        JSON response with staff profile, assigned treks list, and participants registry.
    """
    update_completed_bookings()
    if current_user.role != 'staff':
        return jsonify({'error': 'Unauthorized'}), 403

    # 0. Try to serve from per-staff Redis cache
    cache_key = staff_dashboard_key(current_user.id)
    cached = cache_get(cache_key)
    if cached is not None:
        return jsonify(cached)

    assigned_treks_query = Trek.query.filter_by(staff_id=current_user.id).all()
    assigned_treks = []
    participants = []
    
    for t in assigned_treks_query:
        booked_count = Booking.query.filter(Booking.trek_id == t.id, Booking.status.in_(['Booked', 'Completed'])).count()
        assigned_treks.append({
            'id': t.id,
            'batchCode': t.batch_code or f"TID{t.id:03d}B01",
            'name': t.name,
            'location': t.location,
            'difficulty': t.difficulty,
            'duration': t.duration,
            'startDate': t.start_date.strftime('%Y-%m-%d') if t.start_date else '',
            'endDate': t.end_date.strftime('%Y-%m-%d') if t.end_date else '',
            'slots': t.slots,
            'registered': booked_count,
            'status': t.status
        })
        
        bookings_query = Booking.query.filter(Booking.trek_id == t.id, Booking.status.in_(['Booked', 'Completed'])).all()
        for b in bookings_query:
            user_data = b.user.to_json()
            participants.append({
                'id': b.id,
                'bookingId': b.unique_booking_id,
                'userId': b.user_id,
                'trekkerId': user_data.get('memberId'),
                'trekId': t.id,
                'name': b.user.name,
                'email': b.user.email,
                'phone': b.user.phone or '',
                'bookedOn': b.booked_on.strftime('%Y-%m-%d'),
                'status': b.status,
                'emergencyContact': 'Emergency Contact',
                'emergencyPhone': b.user.emergency or '',
                'bloodGroup': b.user.blood_group or '—',
                'attendance': False,
                'paymentStatus': b.payment_status or ('Paid' if b.paid else 'Pending')
            })
            
    profile = current_user.staff_profile
    staff_profile_data = {
        'memberId': current_user.to_json().get('memberId'),
        'name': current_user.name,
        'email': current_user.email,
        'phone': current_user.phone or '',
        'city': current_user.city or '',
        'bio': current_user.bio or '',
        'joined': current_user.registered_at.strftime('%Y-%m-%d') if current_user.registered_at else '',
        'active': current_user.active,
        'blacklisted': current_user.blacklisted,
        'designation': profile.designation if profile else 'Lead Guide',
        'certifications': profile.certifications if profile else 'Wilderness First Responder (WFR)',
        'languages': profile.languages if profile else 'English, Hindi',
        'skills': profile.skills if profile else 'Wilderness First Aid, Navigation',
        'experienceYears': profile.experience_years if profile else 2,
        'completedTreksCount': profile.completed_treks_count if profile else 10,
        'photoUrl': profile.photo_url if profile else '',
        'status': profile.status if profile else 'Active',
        'customBlockedDates': profile.custom_blocked_dates if profile else '',
    }

    payload = {
        'staffName': current_user.name,
        'staffProfile': staff_profile_data,
        'assignedTreks': assigned_treks,
        'participants': participants
    }

    # Store in Redis per-staff cache before returning
    cache_set(cache_key, payload, TTL_STAFF_DASHBOARD)
    return jsonify(payload)



@staff_bp.route('/api/staff/profile', methods=['POST'])
@login_required
def staff_profile():
    """
    Prevents guides from modifying their profile directly. (Must be completed by Admin).

    Returns:
        JSON response with 403 status code.
    """
    return jsonify({'error': 'Staff profiles can only be edited by administrators.'}), 403


@staff_bp.route('/api/staff/password', methods=['POST'])
@login_required
def staff_password():
    """
    Updates the password for the currently logged-in staff member.

    Request Body (JSON):
        current (str): The current password.
        new (str): The new password.

    Returns:
        JSON confirmation message.
    """
    if current_user.role != 'staff':
        return jsonify({'error': 'Unauthorized'}), 403
        
    data = request.get_json() or {}
    current_pw = data.get('current')
    new_pw = data.get('new')
    
    if not check_password_hash(current_user.password_hash, current_pw):
        return jsonify({'error': 'Incorrect current password.'}), 400
        
    current_user.password_hash = generate_password_hash(new_pw)
    db.session.commit()
    return jsonify({'message': 'Password updated successfully.'})


@staff_bp.route('/api/staff/treks/slots/<int:trek_id>', methods=['POST'])
@login_required
def staff_update_slots(trek_id):
    """
    Allows guides to update the number of available slots for their assigned treks.

    Parameters:
        trek_id (int): The ID of the trek batch.

    Request Body (JSON):
        slots (int): The updated slots capacity.

    Returns:
        JSON indicating success.
    """
    if current_user.role != 'staff':
        return jsonify({'error': 'Unauthorized'}), 403
        
    trek = Trek.query.filter_by(id=trek_id, staff_id=current_user.id).first()
    if not trek:
        return jsonify({'error': 'Trek not found or not assigned to you.'}), 404
        
    data = request.get_json() or {}
    slots = data.get('slots')
    
    booked_count = Booking.query.filter_by(trek_id=trek_id, status='Booked').count()
    if slots < booked_count:
        return jsonify({'error': 'Slots cannot be less than currently registered bookings.'}), 400
        
    trek.slots = slots
    db.session.commit()
    # Clear both global trek caches and this guide's own dashboard cache
    invalidate_all_trek_caches()
    invalidate_staff_cache(current_user.id)
    return jsonify({'success': True})


@staff_bp.route('/api/staff/treks/status/<int:trek_id>', methods=['POST'])
@login_required
def staff_update_status(trek_id):
    """
    Allows guides to update the status of their assigned treks (e.g. Completed). 
    Updates booking statuses appropriately.

    Parameters:
        trek_id (int): The ID of the trek batch.

    Request Body (JSON):
        status (str): The updated status of the trek batch.

    Returns:
        JSON indicating success.
    """
    if current_user.role != 'staff':
        return jsonify({'error': 'Unauthorized'}), 403
        
    trek = Trek.query.filter_by(id=trek_id, staff_id=current_user.id).first()
    if not trek:
        return jsonify({'error': 'Trek not found or not assigned to you.'}), 404
        
    data = request.get_json() or {}
    status = data.get('status')
    
    trek.status = status
    if status == 'Completed':
        # Update all active bookings for this trek to Completed
        bookings = Booking.query.filter_by(trek_id=trek.id, status='Booked').all()
        for b in bookings:
            b.status = 'Completed'
            
    db.session.commit()
    # Clear both global trek caches and this guide's own dashboard cache
    invalidate_all_trek_caches()
    invalidate_staff_cache(current_user.id)
    return jsonify({'success': True})


@staff_bp.route('/api/staff/participants/status/<int:booking_id>', methods=['POST'])
@login_required
def staff_update_participant(booking_id):
    """
    Allows guides to update a participant's booking status (e.g. check-in or cancel).

    Parameters:
        booking_id (int): The booking record ID.

    Request Body (JSON):
        status (str): The target booking status.

    Returns:
        JSON success message.
    """
    if current_user.role != 'staff':
        return jsonify({'error': 'Unauthorized'}), 403
        
    booking = Booking.query.get(booking_id)
    if not booking:
        return jsonify({'error': 'Booking not found.'}), 404
        
    if booking.trek.staff_id != current_user.id:
        return jsonify({'error': 'Unauthorized.'}), 403
        
    data = request.get_json() or {}
    status = data.get('status')
    
    booking.status = status
    db.session.commit()
    # Clear both global trek caches and this guide's own dashboard cache
    invalidate_all_trek_caches()
    invalidate_staff_cache(current_user.id)
    return jsonify({'success': True})


@staff_bp.route('/api/staff/export/<int:trek_id>', methods=['POST'])
@login_required
def staff_export(trek_id):
    """
    Generates and saves a CSV file listing all participants on a specified trek batch.

    Parameters:
        trek_id (int): The trek batch ID.

    Returns:
        JSON showing generated file description.
    """
    if current_user.role != 'staff':
        return jsonify({'error': 'Unauthorized'}), 403
        
    trek = Trek.query.filter_by(id=trek_id, staff_id=current_user.id).first()
    if not trek:
        return jsonify({'error': 'Trek not found or not assigned to you.'}), 404
        
    email_dir = os.path.join(current_app.root_path, '../scratch/emails')
    os.makedirs(email_dir, exist_ok=True)
    
    filename = f"participants_trek_{trek_id}_{int(datetime.now().timestamp())}.csv"
    filepath = os.path.join(email_dir, filename)
    
    bookings = Booking.query.filter(Booking.trek_id == trek_id, Booking.status.in_(['Booked', 'Completed'])).all()
    with open(filepath, 'w', newline='') as f:
        writer = csv.writer(f)
        writer.writerow(['Booking ID', 'Trekker ID', 'Participant Name', 'Participant Email', 'Phone', 'Booked On', 'Blood Group', 'Emergency Contact', 'Status', 'Payment Status'])
        for b in bookings:
            writer.writerow([
                b.unique_booking_id,
                b.user.to_json().get('memberId'),
                b.user.name,
                b.user.email,
                b.user.phone or '',
                b.booked_on.strftime('%Y-%m-%d'),
                b.user.blood_group or '—',
                b.user.emergency or '',
                b.status,
                b.payment_status or ('Paid' if b.paid else 'Pending')
            ])
            
    return jsonify({'message': f'CSV export triggered. File generated: {filename}'})


@staff_bp.route('/api/staff/tickets', methods=['GET'])
@login_required
def get_staff_tickets():
    """
    Retrieves all support tickets filed by the currently logged-in guide.

    Returns:
        JSON list of serialized support ticket records.
    """
    if current_user.role != 'staff':
        return jsonify({'error': 'Unauthorized'}), 403
    tickets = SupportTicket.query.filter_by(user_id=current_user.id).order_by(SupportTicket.created_at.desc()).all()
    return jsonify([ticket.to_json() for ticket in tickets])


@staff_bp.route('/api/staff/tickets', methods=['POST'])
@login_required
def create_staff_ticket():
    """
    Creates a new internal support ticket filed by the staff member.

    Request Body (JSON):
        subject (str): Ticket summary.
        message (str): Ticket details.
        category (str): Ticket category (e.g. Equipment, Logistics).

    Returns:
        JSON success message and serialized ticket object.
    """
    if current_user.role != 'staff':
        return jsonify({'error': 'Unauthorized'}), 403
    data = request.get_json() or {}
    subject = data.get('subject', '').strip()
    message = data.get('message', '').strip()
    category = data.get('category', 'General').strip()
    
    if not subject or not message:
        return jsonify({'error': 'Subject and Message are required'}), 400
        
    full_subject = f"[{category}] {subject}"
    
    ticket = SupportTicket(
        user_id=current_user.id,
        name=current_user.name,
        email=current_user.email,
        subject=full_subject,
        message=message,
        status='Open'
    )
    db.session.add(ticket)
    db.session.commit()
    
    return jsonify({'success': True, 'ticket': ticket.to_json(), 'message': 'Ticket submitted successfully'})


@staff_bp.route('/api/guide/treks/<int:trek_id>/checklist', methods=['GET'])
@login_required
def get_guide_checklist(trek_id):
    """
    Retrieves guide-recommended checklist items for a given trek.

    Parameters:
        trek_id (int): Trek batch ID.

    Returns:
        JSON list of serialized TrekGuideItem records.
    """
    if current_user.role != 'staff' and current_user.role != 'admin':
        return jsonify({'error': 'Unauthorized'}), 403
        
    items = TrekGuideItem.query.filter_by(trek_id=trek_id).all()
    return jsonify([i.to_json() for i in items])


@staff_bp.route('/api/guide/treks/<int:trek_id>/checklist', methods=['POST'])
@login_required
def update_guide_checklist(trek_id):
    """
    Updates the list of recommended checklist items for a trek and synchronizes 
    the checklists of all active participant bookings.

    Parameters:
        trek_id (int): Trek batch ID.

    Request Body (JSON):
        items (list of str): Complete list of updated item names.

    Returns:
        JSON success message.
    """
    if current_user.role != 'staff' and current_user.role != 'admin':
        return jsonify({'error': 'Unauthorized'}), 403
        
    trek = Trek.query.get(trek_id)
    if not trek:
        return jsonify({'error': 'Trek not found'}), 404
        
    data = request.get_json() or {}
    item_names = data.get('items', [])
    
    # 1. Fetch existing items
    current_guide_items = TrekGuideItem.query.filter_by(trek_id=trek_id).all()
    current_names = {i.item_name for i in current_guide_items}
    new_names = set(item_names)
    
    to_add = new_names - current_names
    to_delete = current_names - new_names
    
    # 2. Delete items no longer recommended
    for item in current_guide_items:
        if item.item_name in to_delete:
            db.session.delete(item)
            
    # 3. Add newly recommended items
    for name in to_add:
        db.session.add(TrekGuideItem(trek_id=trek_id, item_name=name))
        
    db.session.commit()
    
    # 4. Synchronize active trekker bookings checklists
    active_bookings = Booking.query.filter_by(trek_id=trek_id, status='Booked').all()
    for booking in active_bookings:
        if to_delete:
            BookingChecklistItem.query.filter(
                BookingChecklistItem.booking_id == booking.id,
                BookingChecklistItem.category == 'guide',
                BookingChecklistItem.item_name.in_(list(to_delete))
            ).delete(synchronize_session=False)
            
        for name in to_add:
            exists = BookingChecklistItem.query.filter_by(
                booking_id=booking.id,
                category='guide',
                item_name=name
            ).first()
            if not exists:
                db.session.add(BookingChecklistItem(
                    booking_id=booking.id,
                    item_name=name,
                    category='guide',
                    is_completed=False
                ))
                
    db.session.commit()
    return jsonify({'success': True, 'message': 'Guide checklist updated and synchronized successfully.'})
