"""
User and Booking Routes Module
==============================
This module defines the user Blueprint, hosting trekker dashboard data APIs, 
booking management, personal checklist item toggling, profile/password updates,
account deletion, and support ticket creation.
"""

import os
import json
import glob
import time
from datetime import date
from flask import Blueprint, request, jsonify, make_response, current_app
from werkzeug.security import generate_password_hash, check_password_hash
from werkzeug.utils import secure_filename

from backend.models.models import (
    db, Trek, Booking, BookingChecklistItem, TrekGuideItem, SupportTicket
)
from backend.auth_utils import current_user, login_required
from backend.redis_utils import get_open_treks_cached, invalidate_all_trek_caches
from backend.db_utils import update_completed_bookings
from backend.email_utils import dispatch_booking_cancellation_email

# Instantiate the user Blueprint
user_bp = Blueprint('user', __name__)


@user_bp.route('/api/user/dashboard_data', methods=['GET'])
@login_required
def user_dashboard_data():
    """
    Fetches required details for the trekker dashboard. 
    Triggers DB synchronization of completed status.

    Returns:
        JSON response with open treks, user bookings, completed history, and profile.
    """
    update_completed_bookings()
    if current_user.role != 'user':
        return jsonify({'error': 'Unauthorized'}), 403
        
    available_treks = get_open_treks_cached()
    
    my_bookings_query = Booking.query.filter(
        Booking.user_id == current_user.id,
        Booking.status.in_(['Booked', 'Cancelled'])
    ).all()
    my_bookings = [b.to_json() for b in my_bookings_query]
    
    history_query = Booking.query.filter_by(
        user_id=current_user.id,
        status='Completed'
    ).all()
    trek_history = [b.to_json() for b in history_query]
    
    profile = current_user.to_json()
    
    return jsonify({
        'available_treks': available_treks,
        'my_bookings': my_bookings,
        'trek_history': trek_history,
        'profile': profile
    })


@user_bp.route('/api/bookings/book', methods=['POST'])
@login_required
def book_trek():
    """
    Processes a booking request for a trek, registers default checklist items,
    updates Redis cache, and queues an email notification.

    Request Body (JSON):
        trek_id (int): ID of the trek to book.
        payment_method (str): E.g., 'UPI', 'Card', 'Netbanking'.
        payment_details (dict): Structured dictionary of transaction details.
        payment_status (str, optional): Default 'Paid'.

    Returns:
        JSON response with success details.
    """
    if current_user.role != 'user':
        return jsonify({'error': 'Unauthorized'}), 403
        
    data = request.get_json() or {}
    trek_id = data.get('trek_id')
    payment_method = data.get('payment_method')
    payment_details = data.get('payment_details')
    
    trek = Trek.query.get(trek_id)
    if not trek:
        return jsonify({'error': 'Trek not found.'}), 404
        
    if trek.status != 'Open':
        return jsonify({'error': 'Trek is not open for bookings.'}), 400
        
    if trek.start_date and trek.start_date < date.today():
        return jsonify({'error': 'Trek has already started. Booking is closed.'}), 400
        
    booked_count = Booking.query.filter_by(trek_id=trek_id, status='Booked').count()
    if booked_count >= trek.slots:
        return jsonify({'error': 'Trek is full.'}), 400
        
    existing = Booking.query.filter_by(user_id=current_user.id, trek_id=trek_id, status='Booked').first()
    if existing:
        return jsonify({'error': 'You have already booked this trek.'}), 400
        
    payment_status = data.get('payment_status', 'Paid')
    booking_price = trek.price
    paid = (payment_status == 'Paid')
    amount_paid = booking_price if paid else 0

    booking = Booking(
        user_id=current_user.id,
        trek_id=trek_id,
        status='Booked',
        paid=paid,
        booking_price=booking_price,
        amount_paid=amount_paid,
        payment_status=payment_status,
        payment_method=payment_method,
        payment_details=json.dumps(payment_details) if payment_details else None
    )
    db.session.add(booking)
    db.session.commit()
    
    # 1. Add general default items to the booking checklist
    default_items = [
        "High-quality trekking shoes (broken in)",
        "Backpack (50L-60L) with rain cover",
        "Warm layers (fleece jacket, thermal innerwear)",
        "Waterproof poncho or windcheater",
        "Refillable water bottle or hydration pack (2 Liters)",
        "Headlamp or torch with extra batteries",
        "Personal first aid kit & prescription medicines",
        "Trekking poles (highly recommended)",
        "Quick-dry towels and basic toiletries"
    ]
    for item in default_items:
        chk = BookingChecklistItem(booking_id=booking.id, item_name=item, category='default', is_completed=False)
        db.session.add(chk)
        
    # 2. Add guide-recommended items for this specific trek route
    guide_items = TrekGuideItem.query.filter_by(trek_id=trek.id).all()
    for gi in guide_items:
        chk = BookingChecklistItem(booking_id=booking.id, item_name=gi.item_name, category='guide', is_completed=False)
        db.session.add(chk)
        
    db.session.commit()
    invalidate_all_trek_caches()
    
    # Send booking confirmation email asynchronously via Celery
    try:
        from backend.tasks import send_booking_email
        send_booking_email.delay(booking.id, payment_method, payment_details)
    except Exception as e:
        current_app.logger.error(f"Failed to dispatch booking email: {e}")
        
    return jsonify({
        'message': f'Booked {trek.name} successfully!',
        'booking_id': booking.id,
        'unique_booking_id': booking.unique_booking_id
    })


@user_bp.route('/api/bookings/<int:booking_id>/checklist', methods=['GET'])
@login_required
def get_booking_checklist(booking_id):
    """
    Retrieves the packing checklist items for a specific booking.

    Parameters:
        booking_id (int): The ID of the booking.

    Returns:
        JSON list of serialized checklist items.
    """
    booking = Booking.query.get(booking_id)
    if not booking:
        return jsonify({'error': 'Booking not found'}), 404
        
    if current_user.role != 'admin' and current_user.role != 'staff' and booking.user_id != current_user.id:
        return jsonify({'error': 'Unauthorized'}), 403
        
    items = BookingChecklistItem.query.filter_by(booking_id=booking_id).all()
    return jsonify([i.to_json() for i in items])


@user_bp.route('/api/bookings/checklist/toggle', methods=['POST'])
@login_required
def toggle_checklist_item():
    """
    Toggles the checklist item's completion status.

    Request Body (JSON):
        item_id (int): ID of the checklist item to toggle.

    Returns:
        JSON response with item state.
    """
    data = request.get_json() or {}
    item_id = data.get('item_id')
    item = BookingChecklistItem.query.get(item_id)
    if not item:
        return jsonify({'error': 'Item not found'}), 404
        
    booking = Booking.query.get(item.booking_id)
    if current_user.role != 'admin' and current_user.role != 'staff' and booking.user_id != current_user.id:
        return jsonify({'error': 'Unauthorized'}), 403
        
    item.is_completed = not item.is_completed
    db.session.commit()
    return jsonify({'success': True, 'item': item.to_json()})


@user_bp.route('/api/bookings/cancel/<int:booking_id>', methods=['POST'])
@login_required
def cancel_booking(booking_id):
    """
    Cancels a trek booking, clears caching, and triggers a cancellation email.

    Parameters:
        booking_id (int): ID of the booking.

    Returns:
        JSON success message.
    """
    booking = Booking.query.get(booking_id)
    if not booking:
        return jsonify({'error': 'Booking not found.'}), 404
        
    if current_user.role != 'admin' and current_user.role != 'staff' and booking.user_id != current_user.id:
        return jsonify({'error': 'Unauthorized.'}), 403
        
    booking.status = 'Cancelled'
    db.session.commit()
    
    invalidate_all_trek_caches()
    dispatch_booking_cancellation_email(booking.id)
    
    return jsonify({'message': 'Booking cancelled successfully.'})


@user_bp.route('/api/bookings/pay/<int:booking_id>', methods=['POST'])
@login_required
def pay_booking(booking_id):
    """
    Simulates a payment outcome for a booking that was in 'Pending' state.

    Parameters:
        booking_id (int): ID of the booking to pay.

    Request Body (JSON):
        payment_status (str, optional): Default 'Paid'.
        payment_method (str): E.g., 'UPI', 'Netbanking'.
        payment_details (dict): Structured transaction logs.

    Returns:
        JSON confirmation.
    """
    booking = Booking.query.get(booking_id)
    if not booking or (current_user.role != 'admin' and booking.user_id != current_user.id):
        return jsonify({'error': 'Booking not found.'}), 404
    
    data = request.get_json() or {}
    payment_status = data.get('payment_status', 'Paid')
    payment_method = data.get('payment_method')
    payment_details = data.get('payment_details')
    
    booking.payment_status = payment_status
    booking.paid = (payment_status == 'Paid')
    booking.amount_paid = booking.booking_price if booking.paid else 0
    if payment_method:
        booking.payment_method = payment_method
    if payment_details:
        booking.payment_details = json.dumps(payment_details)
    
    db.session.commit()
    invalidate_all_trek_caches()
    
    try:
        from backend.tasks import send_booking_email
        send_booking_email.delay(booking.id, payment_method, payment_details)
    except Exception as e:
        current_app.logger.error(f"Failed to dispatch booking email: {e}")
        
    return jsonify({
        'message': f'Simulated payment outcome: {payment_status}.',
        'booking_id': booking.id,
        'unique_booking_id': booking.unique_booking_id
    })


@user_bp.route('/api/user/export', methods=['POST'])
@login_required
def user_export():
    """
    Triggers an asynchronous CSV export of booking history emailed to the user.

    Returns:
        JSON indicating queue success.
    """
    from backend.tasks import export_booking_history_csv
    export_booking_history_csv.delay(current_user.id, current_user.email)
    return jsonify({'message': 'CSV export triggered. You will receive an email with your CSV shortly.'})


@user_bp.route('/api/user/profile', methods=['POST'])
@login_required
def user_profile():
    """
    Updates the current trekker profile, including bio and profile picture uploads.

    Request Form/JSON:
        Various fields: name, phone, city, emergency, bio, dob, blood_group,
        medical_info, fitness_level, preferred_difficulty/duration/regions.
        File: profile_image.

    Returns:
        JSON profile update success.
    """
    if request.is_json:
        data = request.get_json() or {}
    else:
        data = request.form
        
    current_user.name = data.get('name', current_user.name)
    current_user.phone = data.get('phone', current_user.phone)
    current_user.city = data.get('city', current_user.city)
    current_user.emergency = data.get('emergency', current_user.emergency)
    current_user.bio = data.get('bio', current_user.bio)
    current_user.dob = data.get('dob', current_user.dob)
    current_user.blood_group = data.get('blood_group', current_user.blood_group)
    current_user.medical_info = data.get('medical_info', current_user.medical_info)
    current_user.fitness_level = data.get('fitness_level', current_user.fitness_level)
    
    if 'treks_done' in data:
        try:
            current_user.treks_done = int(data.get('treks_done', 0) or 0)
        except ValueError:
            pass
            
    current_user.preferred_difficulty = data.get('preferred_difficulty', current_user.preferred_difficulty)
    current_user.preferred_duration = data.get('preferred_duration', current_user.preferred_duration)
    current_user.preferred_regions = data.get('preferred_regions', current_user.preferred_regions)
    
    if 'profile_image' in request.files:
        file = request.files['profile_image']
        if file and file.filename != '':
            filename = secure_filename(f"{int(time.time())}_{file.filename}")
            upload_dir = os.path.join(current_app.root_path, '..', 'frontend', 'static', 'uploads', 'profiles')
            os.makedirs(upload_dir, exist_ok=True)
            file.save(os.path.join(upload_dir, filename))
            current_user.profile_image_url = f"/static/uploads/profiles/{filename}"
            
    db.session.commit()
    return jsonify({'message': 'Profile updated successfully.'})


@user_bp.route('/api/user/password', methods=['POST'])
@login_required
def user_password():
    """
    Updates the current user's password after verifying their current password.

    Request Body (JSON):
        current (str): Current password.
        new (str): New password.

    Returns:
        JSON success message.
    """
    data = request.get_json() or {}
    current_pw = data.get('current')
    new_pw = data.get('new')
    
    if not check_password_hash(current_user.password_hash, current_pw):
        return jsonify({'error': 'Incorrect current password.'}), 400
        
    current_user.password_hash = generate_password_hash(new_pw)
    db.session.commit()
    return jsonify({'message': 'Password updated successfully.'})


@user_bp.route('/api/user/delete', methods=['DELETE'])
@login_required
def delete_user_account():
    """
    Permanently deletes a user account, cascade-deleting associated database rows,
    removing static profile picture files, clearing generated CSVs, and deleting 
    the session cookie.

    Returns:
        JSON confirmation and clear token cookie.
    """
    user = current_user
    user_id = user.id
    user_email = user.email
    
    # 1. Delete user profile image file if exists
    if user.profile_image_url:
        try:
            relative_path = user.profile_image_url.lstrip('/')
            file_path = os.path.join(current_app.root_path, '..', 'frontend', relative_path)
            if os.path.exists(file_path):
                os.remove(file_path)
        except Exception as e:
            current_app.logger.error(f"Failed to delete profile image file: {e}")
            
    # 2. Delete generated CSV exports for user from scratch/emails directory
    try:
        email_dir = os.path.join(current_app.root_path, '../scratch/emails')
        if os.path.exists(email_dir):
            pattern = os.path.join(email_dir, f"booking_history_user_{user_id}_*")
            for f in glob.glob(pattern):
                os.remove(f)
    except Exception as e:
        current_app.logger.error(f"Failed to delete booking CSVs: {e}")
        
    # 3. Delete matching records in the leads table by email
    try:
        db.session.execute(db.text("DELETE FROM leads WHERE email = :email"), {"email": user_email})
    except Exception as e:
        current_app.logger.error(f"Failed to delete leads for email {user_email}: {e}")
        
    # 4. Delete User database entry (triggers cascade deletes)
    db.session.delete(user)
    db.session.commit()
    
    # 5. Clear the access token cookie
    response = make_response(jsonify({'message': 'Your account and all associated data have been permanently deleted.'}))
    response.delete_cookie('access_token')
    return response


@user_bp.route('/api/user/tickets', methods=['GET'])
@login_required
def get_user_tickets():
    """
    Retrieves all support tickets opened by the current trekker.

    Returns:
        JSON list of support tickets.
    """
    if current_user.role != 'user':
        return jsonify({'error': 'Unauthorized'}), 403
    tickets = SupportTicket.query.filter_by(user_id=current_user.id).order_by(SupportTicket.created_at.desc()).all()
    return jsonify([ticket.to_json() for ticket in tickets])


@user_bp.route('/api/user/tickets', methods=['POST'])
@login_required
def create_user_ticket():
    """
    Creates a new support ticket under the trekker's account.

    Request Body (JSON):
        subject (str): Title of the issue.
        message (str): Body detailing the issue.
        category (str): General category (e.g. 'Payment', 'Medical').

    Returns:
        JSON indicating creation status.
    """
    if current_user.role != 'user':
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
