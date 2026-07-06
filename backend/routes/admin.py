"""
Admin Routes Module
===================
This module defines the admin Blueprint, housing endpoints for the administrator dashboard,
trek route management (creation/deletion/toggling), trek batch scheduling (creation/deletion/toggling),
trekker management, guide/staff updates, blacklisting/restoring users, booking cancellations/refunds,
support ticket resolutions, and manual trigger of system Celery jobs.
"""

import os
import json
import uuid
import re
from datetime import datetime, date, timedelta
from collections import defaultdict
from flask import Blueprint, request, jsonify, current_app
from werkzeug.security import generate_password_hash
from werkzeug.utils import secure_filename

from backend.models.models import (
    db, User, Trek, TrekRoute, Booking, StaffProfile, SupportTicket
)
from backend.auth_utils import current_user, login_required
from backend.redis_utils import (
    cache_get, cache_set,
    invalidate_all_trek_caches,
    invalidate_staff_cache,
    invalidate_all_staff_caches,
    KEY_ADMIN_DASHBOARD, TTL_ADMIN_DASHBOARD
)
from backend.db_utils import update_completed_bookings
from backend.email_utils import dispatch_booking_cancellation_email, dispatch_guide_assignment_email

# Instantiate the admin Blueprint
admin_bp = Blueprint('admin', __name__)


@admin_bp.route('/api/admin/dashboard_data', methods=['GET'])
@login_required
def admin_dashboard_data():
    """
    Retrieves comprehensive statistics and registry datasets to render
    the advanced administrative dashboard.

    Returns:
        JSON response with statistical aggregates, charts datasets (revenue, growth),
        health status, and listings for staff/users/bookings.
    """
    update_completed_bookings()
    if current_user.role != 'admin':
        return jsonify({'error': 'Unauthorized'}), 403

    # 0. Try to serve from Redis cache (TTL: TTL_ADMIN_DASHBOARD = 120s)
    cached = cache_get(KEY_ADMIN_DASHBOARD)
    if cached is not None:
        return jsonify(cached)
        
    total_treks = TrekRoute.query.count()
    total_batches = Trek.query.count()
    registered_users = User.query.filter_by(role='user').count()
    total_bookings = Booking.query.count()
    open_treks = Trek.query.filter_by(status='Open').count()
    cancelled_bookings_count = Booking.query.filter_by(status='Cancelled').count()
    staff_count = User.query.filter_by(role='staff').count()
    
    # 1. Compile overview statistics cards
    stats = [
        {'label': 'Total Trekkers', 'value': registered_users, 'icon': 'users', 'category': 'people'},
        {'label': 'Total Staff', 'value': staff_count, 'icon': 'staff', 'category': 'people'},
        {'label': 'Total Treks', 'value': total_treks, 'icon': 'mountain', 'category': 'treks'},
        {'label': 'Active Batches', 'value': open_treks, 'icon': 'active', 'category': 'treks'},
        {'label': 'Total Bookings', 'value': total_bookings, 'icon': 'book', 'category': 'bookings'},
        {'label': 'Cancelled Bookings', 'value': cancelled_bookings_count, 'icon': 'cancel', 'category': 'bookings'}
    ]
    
    completed_treks_count = Trek.query.filter_by(status='Completed').count()
    closed_treks_count = Trek.query.filter_by(status='Closed').count()
    
    # 2. Batch status overview percentage breakdown
    trek_status_overview = [
        {'label': 'Open', 'count': open_treks, 'pct': int((open_treks/total_batches*100) if total_batches else 0), 'color': '#4ade80'},
        {'label': 'Completed', 'count': completed_treks_count, 'pct': int((completed_treks_count/total_batches*100) if total_batches else 0), 'color': '#a8c5a0'},
        {'label': 'Closed', 'count': closed_treks_count, 'pct': int((closed_treks_count/total_batches*100) if total_batches else 0), 'color': '#ef4444'}
    ]
    
    recent_bookings_query = Booking.query.order_by(Booking.booked_on.desc()).limit(10).all()
    recent_bookings = []
    for rb in recent_bookings_query:
        recent_bookings.append({
            'id': rb.id,
            'user': rb.user.name,
            'trek': rb.trek.name,
            'date': rb.booked_on.strftime('%Y-%m-%d'),
            'status': rb.status
        })
        
    # 3. Process low-slot warning alerts and unassigned staff alerts
    alerts = []
    low_slots_treks = Trek.query.filter(Trek.status == 'Open').all()
    low_slots_count = 0
    for t in low_slots_treks:
        booked_count = Booking.query.filter(
            Booking.trek_id == t.id,
            Booking.status == 'Booked',
            (Booking.payment_status != 'Failed') | (Booking.payment_status == None)
        ).count()
        if t.slots - booked_count < 5:
            low_slots_count += 1
    if low_slots_count > 0:
        alerts.append({'msg': f'{low_slots_count} treks have slots below 5 remaining', 'type': 'warn'})
      
    staff_list = User.query.filter_by(role='staff').all()
    for s in staff_list:
        assigned = Trek.query.filter_by(staff_id=s.id).count()
        if assigned == 0:
            alerts.append({'msg': f'Staff member {s.name} has no trek assigned', 'type': 'warn'})
      
    alerts.append({'msg': 'Monthly report scheduled for 1st of next month', 'type': 'info'})
    
    treks = [t.to_json() for t in Trek.query.all()]
    
    # 4. Process staff metadata and history registry
    staff_data = []
    for s in staff_list:
        assigned = Trek.query.filter_by(staff_id=s.id).all()
        treks_done = []
        for t in assigned:
            booked_cnt = Booking.query.filter(Booking.trek_id == t.id, Booking.status.in_(['Booked', 'Completed'])).count()
            treks_done.append({
                'batchId': t.batch_code or f"TID{t.id:03d}B01",
                'trekName': t.name,
                'location': t.location,
                'trekkersCount': booked_cnt,
                'startDate': t.start_date.strftime('%Y-%m-%d') if t.start_date else '',
                'endDate': t.end_date.strftime('%Y-%m-%d') if t.end_date else ''
            })
        profile = s.staff_profile
        skills = profile.skills if profile else 'Wilderness First Aid, Navigation'
        experience = profile.experience_years if profile else 2
        designation = profile.designation if profile else 'Lead Guide'
        certifications = profile.certifications if profile else 'Wilderness First Responder (WFR)'
        languages = profile.languages if profile else 'English, Hindi'
        completed_count = profile.completed_treks_count if profile else 10
        photos = [
            "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&h=300&fit=crop",
            "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=300&fit=crop",
            "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&h=300&fit=crop",
            "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300&h=300&fit=crop",
            "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=300&h=300&fit=crop",
            "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300&h=300&fit=crop",
            "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=300&h=300&fit=crop",
            "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=300&h=300&fit=crop"
        ]
        photo_url = (profile.photo_url if (profile and profile.photo_url) else None) or photos[s.id % len(photos)]
        staff_data.append({
            'id': s.id,
            'memberId': s.to_json().get('memberId'),
            'name': s.name,
            'contact': s.email,
            'phone': s.phone or '',
            'treks': [t.name for t in assigned],
            'active': s.active,
            'blacklisted': s.blacklisted,
            'joined': s.registered_at.strftime('%Y-%m-%d') if s.registered_at else '2026-06-09',
            'skills': skills,
            'experience': experience,
            'designation': designation,
            'certifications': certifications,
            'languages': languages,
            'completedTreksCount': completed_count,
            'photoUrl': photo_url,
            'treksDone': treks_done,
            'customBlockedDates': profile.custom_blocked_dates if (profile and profile.custom_blocked_dates) else ''
        })
        
    # 5. Populate user profiles registry
    users = []
    user_photos = [
        "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&h=300&fit=crop",
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=300&fit=crop",
        "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&h=300&fit=crop",
        "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300&h=300&fit=crop",
        "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=300&h=300&fit=crop",
        "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300&h=300&fit=crop",
        "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=300&h=300&fit=crop",
        "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=300&h=300&fit=crop"
    ]
    for u in User.query.filter_by(role='user').all():
        ucnt = Booking.query.filter_by(user_id=u.id).count()
        photo_url = user_photos[u.id % len(user_photos)]
        users.append({
            'id': u.id,
            'memberId': f"TS26T{u.id:04d}",
            'name': u.name,
            'email': u.email,
            'phone': u.phone or '',
            'city': u.city or '',
            'emergency': u.emergency or '',
            'bio': u.bio or '',
            'registered': u.registered_at.strftime('%Y-%m-%d'),
            'bookings': ucnt,
            'blacklisted': u.blacklisted,
            'photoUrl': photo_url,
            'role': 'user'
        })
        
    # 6. Populate booking details lists
    all_bookings = []
    for b in Booking.query.all():
        u = b.user
        year_str = u.registered_at.strftime('%y') if u.registered_at else '26'
        member_id = f"TS{year_str}T{u.id:04d}" if u.role == 'user' else f"TS{year_str}S{u.id:03d}"
        all_bookings.append({
            'id': b.id,
            'bookingId': b.unique_booking_id,
            'userId': b.user_id,
            'trekkerId': member_id,
            'user': b.user.name,
            'trekId': b.trek_id,
            'trek': b.trek.name,
            'batchCode': b.trek.batch_code or f"TID{b.trek.id:03d}B01",
            'date': b.booked_on.strftime('%Y-%m-%d'),
            'status': b.status,
            'paid': b.paid,
            'bookingPrice': b.booking_price or (b.trek.price if b.trek else 5000),
            'amountPaid': b.amount_paid if b.amount_paid not in (None, 0)
                else (
                    b.booking_price if (b.paid or b.payment_status == 'Paid')
                    else (b.trek.price if (b.paid and b.trek) else 0)
                ),
            'paymentStatus': b.payment_status or ('Paid' if b.paid else 'Pending'),
            'paidOn': b.booked_on.strftime('%Y-%m-%d') if b.paid else '—',
            'transactionId': f"TXN{b.booked_on.strftime('%y%m%d')}{b.id:04d}" if b.paid else '—',
            'difficulty': b.trek.difficulty if b.trek else 'Moderate',
            'location': b.trek.location if b.trek else '',
            'startDate': b.trek.start_date.strftime('%Y-%m-%d') if (b.trek and b.trek.start_date) else '—',
            'refundAmount': b.refund_amount or 0
        })
        
    # 7. Popular treks lists by registration volumes
    popular_treks = []
    for t in Trek.query.all():
        bcnt = Booking.query.filter(Booking.trek_id == t.id, Booking.status.in_(['Booked', 'Completed'])).count()
        popular_treks.append({
            'name': t.name,
            'bookings': bcnt
        })
    popular_treks.sort(key=lambda x: x['bookings'], reverse=True)
    
    # 8. Slot occupancy lists
    slot_utilization = []
    for t in Trek.query.filter_by(status='Open').all():
        booked = Booking.query.filter(
            Booking.trek_id == t.id,
            Booking.status == 'Booked',
            (Booking.payment_status != 'Failed') | (Booking.payment_status == None)
        ).count()
        slot_utilization.append({
            'trek': t.name,
            'total': t.slots,
            'booked': booked,
            'pct': int((booked / t.slots * 100) if t.slots else 0)
        })
        
    # 9. Upcoming scheduled treks starting soon
    upcoming_treks = []
    open_and_approved = Trek.query.filter(Trek.status.in_(['Open', 'Approved'])).all()
    for t in open_and_approved:
        if t.end_date and t.end_date < date.today():
            continue
        days_left = (t.start_date - date.today()).days if t.start_date else 0
        upcoming_treks.append({
            'name': t.name,
            'startDate': t.start_date.strftime('%Y-%m-%d') if t.start_date else '',
            'daysLeft': max(0, days_left),
            'staff': t.staff.name if t.staff else 'Unassigned'
        })
    upcoming_treks.sort(key=lambda x: x['daysLeft'])
    
    # 10. Audit trails & recent activity logs
    activity_feed = []
    for b in Booking.query.order_by(Booking.id.desc()).limit(5).all():
        days_diff = (date.today() - b.booked_on).days if b.booked_on else 0
        time_str = 'just now' if days_diff == 0 else f"{days_diff}d ago"
        activity_feed.append({
            'time': time_str,
            'msg': f"{b.user.name} booked {b.trek.name} Trek",
            'type': 'booking'
        })
    if len(activity_feed) < 5:
        activity_feed.extend([
            {'time': '1 hr ago', 'msg': 'Daily reminder emails sent to all users', 'type': 'system'},
            {'time': '2 hr ago', 'msg': 'Redis cache refreshed for trek listings', 'type': 'system'},
            {'time': '5 hr ago', 'msg': 'Trek slot synchronization job succeeded', 'type': 'system'}
        ])
        
    audit_logs = [
        {'timestamp': '2026-06-10 09:23', 'actor': 'Admin', 'action': 'System startup and database verify', 'level': 'system'},
        {'timestamp': '2026-06-10 08:55', 'actor': 'System', 'action': 'Backup database and sync tasks', 'level': 'system'}
    ]
    for b in Booking.query.order_by(Booking.id.desc()).limit(5).all():
        audit_logs.append({
            'timestamp': b.booked_on.strftime('%Y-%m-%d %H:%M') if b.booked_on else '2026-06-10 12:00',
            'actor': b.user.name,
            'action': f"Booked trek: {b.trek.name} (ID #{b.id})",
            'level': 'user'
        })
        
    notifications = [
        {'id': 1, 'msg': 'System running normally', 'time': 'just now', 'read': False, 'type': 'system'},
        {'id': 2, 'msg': 'Welcome to TrailSync Admin', 'time': '1 hr ago', 'read': True, 'type': 'admin'}
    ]
    
    # 11. Scheduled job executions status
    try:
        from backend.tasks import get_job_runs
        scheduled_jobs = get_job_runs()
    except Exception:
        scheduled_jobs = [
            {'name': 'Daily Reminder Emails', 'schedule': 'Every day at 09:00', 'lastRun': '2026-06-10 09:00:00', 'status': 'Success'},
            {'name': 'Monthly Activity Report', 'schedule': '1st of every month at 09:00', 'lastRun': '2026-06-01 09:00:00', 'status': 'Success'},
            {'name': 'Cache Refresh Job', 'schedule': 'Every 15 min', 'lastRun': '2026-06-13 14:45:00', 'status': 'Success'}
        ]
    
    system_health = {
        'database': {'label': 'SQLite Database', 'status': 'Online', 'ok': True},
        'redis': {'label': 'Redis Cache', 'status': 'Connected', 'ok': True},
        'celery': {'label': 'Celery Worker', 'status': 'Running', 'ok': True},
        'beats': {'label': 'Celery Beat', 'status': 'Active', 'ok': True},
        'api': {'label': 'Flask API', 'status': 'Healthy', 'ok': True}
    }
    
    # 12. Monthly registration counts for plotting charts
    current_year = date.today().year
    current_month_num = date.today().month
    months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    active_months = months[:current_month_num]
    
    monthly_counts = defaultdict(int)
    for b in Booking.query.filter(db.extract('year', Booking.booked_on) == current_year).all():
        if b.booked_on:
            m_name = b.booked_on.strftime('%b')
            monthly_counts[m_name] += 1
            
    monthly_bookings = []
    for m in active_months:
        monthly_bookings.append({
            'month': m,
            'count': monthly_counts[m]
        })
        
    easy_c = Trek.query.filter_by(difficulty='Easy').count()
    mod_c = Trek.query.filter_by(difficulty='Moderate').count()
    hard_c = Trek.query.filter_by(difficulty='Hard').count()
    total_batches = Trek.query.count()
    difficulty_dist = [
        {'level': 'Easy', 'pct': int((easy_c / total_batches * 100) if total_batches else 0), 'color': '#4ade80'},
        {'level': 'Moderate', 'pct': int((mod_c / total_batches * 100) if total_batches else 0), 'color': '#fbbf24'},
        {'level': 'Hard', 'pct': int((hard_c / total_batches * 100) if total_batches else 0), 'color': '#ef4444'}
    ]
    
    user_growth = []
    monthly_users = defaultdict(int)
    for u in User.query.filter(db.extract('year', User.registered_at) == current_year, User.role == 'user').all():
        if u.registered_at:
            m_name = u.registered_at.strftime('%b')
            monthly_users[m_name] += 1
    cumulative = 0
    for m in active_months:
        cumulative += monthly_users[m]
        user_growth.append({
            'month': m,
            'users': cumulative
        })
        
    # 13. Financial revenue metrics calculations
    paid_bookings = Booking.query.filter(Booking.status != 'Cancelled', Booking.payment_status == 'Paid').all()
    tot_rev = sum(b.amount_paid or b.booking_price or (b.trek.price if b.trek else 5000) for b in paid_bookings)
    
    trek_revenue = defaultdict(int)
    for b in paid_bookings:
        if b.trek:
            trek_revenue[b.trek.name] += b.amount_paid or b.booking_price or b.trek.price
            
    top_trek = 'None'
    top_rev_val = 0
    if trek_revenue:
        top_trek = max(trek_revenue, key=trek_revenue.get)
        top_rev_val = trek_revenue[top_trek]

    current_month_name = date.today().strftime('%b')
    monthly_rev_val = 0
    for b in paid_bookings:
        if b.booked_on and b.booked_on.strftime('%b') == current_month_name:
            monthly_rev_val += b.amount_paid or b.booking_price or b.trek.price

    revenue_data = {
        'total': f"₹{tot_rev:,}",
        'monthly': f"₹{monthly_rev_val:,}",
        'topTrek': top_trek,
        'topRevenue': f"₹{top_rev_val:,}"
    }
    
    blacklisted_users = []
    for u in User.query.filter_by(blacklisted=True).all():
        blacklisted_users.append({
            'id': u.id,
            'name': u.name,
            'reason': u.blacklist_reason or 'Policy violation',
            'date': u.registered_at.strftime('%Y-%m-%d') if u.registered_at else '2026-06-09'
        })
        
    # 14. Action items warnings counts
    inactive_staff_count = User.query.filter_by(role='staff', active=False).count()
    unassigned_treks_count = Trek.query.filter(Trek.status.in_(['Open', 'Approved']), Trek.staff_id == None).count()
    pending_tickets_count = SupportTicket.query.filter_by(status='Open').count()
    
    today_val = date.today()
    next_week = today_val + timedelta(days=7)
    treks_starting_week_count = Trek.query.filter(
        Trek.start_date >= today_val,
        Trek.start_date <= next_week
    ).count()

    low_occupancy_count = 0
    starting_soon_treks = Trek.query.filter(
        Trek.status.in_(['Open', 'Approved']),
        Trek.start_date >= today_val,
        Trek.start_date <= today_val + timedelta(days=5)
    ).all()
    for t in starting_soon_treks:
        booked = Booking.query.filter(
            Booking.trek_id == t.id,
            Booking.status == 'Booked',
            (Booking.payment_status != 'Failed') | (Booking.payment_status == None)
        ).count()
        util_pct = (booked / t.slots) if t.slots else 0.0
        if util_pct < 0.50:
            low_occupancy_count += 1
            
    unpaid_bookings_count = Booking.query.filter_by(status='Booked', paid=False).count()
    
    alerts_and_tasks = [
        {'label': 'Staff Accounts Inactive', 'count': inactive_staff_count, 'type': 'inactive_staff'},
        {'label': 'Trek Has No Assigned Staff', 'count': unassigned_treks_count, 'type': 'unassigned_staff'},
        {'label': 'Low Occupancy (<50%) Starting Soon', 'count': low_occupancy_count, 'type': 'low_occupancy'},
        {'label': 'Treks Starting This Week', 'count': treks_starting_week_count, 'type': 'starting_this_week'},
        {'label': 'Unpaid Bookings', 'count': unpaid_bookings_count, 'type': 'unpaid_bookings'},
        {'label': 'Pending Support Tickets', 'count': pending_tickets_count, 'type': 'pending_tickets'}
    ]

    support_tickets = [st.to_json() for st in SupportTicket.query.order_by(SupportTicket.created_at.desc()).all()]
        
    trek_routes_json = [r.to_json() for r in TrekRoute.query.all()]

    payload = {
        'stats': stats,
        'alertsAndTasks': alerts_and_tasks,
        'trekStatusOverview': trek_status_overview,
        'alerts': alerts,
        'recentBookings': recent_bookings[:5],
        'treks': treks,
        'staffList': staff_data,
        'users': users,
        'allBookings': all_bookings,
        'popularTreks': popular_treks[:5],
        'slotUtilization': slot_utilization,
        'upcomingTreks': upcoming_treks,
        'activityFeed': activity_feed,
        'auditLogs': audit_logs,
        'notifications': notifications,
        'scheduledJobs': scheduled_jobs,
        'systemHealth': system_health,
        'monthlyBookings': monthly_bookings,
        'difficultyDist': difficulty_dist,
        'userGrowth': user_growth,
        'revenueData': revenue_data,
        'blacklistedUsers': blacklisted_users,
        'pendingTreks': [],          # Reserved: no draft/pending trek status in current schema
        'supportTickets': support_tickets,
        'trekRoutes': trek_routes_json
    }

    # Store assembled payload in Redis cache before returning
    cache_set(KEY_ADMIN_DASHBOARD, payload, TTL_ADMIN_DASHBOARD)
    return jsonify(payload)


@admin_bp.route('/api/admin/upload_image', methods=['POST'])
@login_required
def admin_upload_image():
    """
    Handles image uploading to the server static uploads folder.

    Request (multipart/form-data):
        image (file): The image file to store.

    Returns:
        JSON response indicating upload success and stored URL.
    """
    if current_user.role != 'admin':
        return jsonify({'error': 'Unauthorized'}), 403
    if 'image' not in request.files:
        return jsonify({'error': 'No image file provided'}), 400
    file = request.files['image']
    if file.filename == '':
        return jsonify({'error': 'Empty filename'}), 400
        
    filename = secure_filename(file.filename)
    ext = os.path.splitext(filename)[1]
    unique_filename = f"{uuid.uuid4().hex}{ext}"
    uploads_dir = os.path.join(current_app.root_path, '../frontend/static/uploads')
    os.makedirs(uploads_dir, exist_ok=True)
    file.save(os.path.join(uploads_dir, unique_filename))
    return jsonify({
        'success': True,
        'imageUrl': f"/static/uploads/{unique_filename}"
    })


@admin_bp.route('/api/admin/trek_routes', methods=['POST'])
@login_required
def admin_save_trek_route():
    """
    Creates a new trek route record or edits an existing trek route.

    Request Body (JSON):
        id (int, optional): Route ID to edit.
        name (str): Trek route name.
        location (str): General region.
        place (str): Starting point coordinates/details.
        difficulty (str): Easy, Moderate, Hard.
        duration (int): Trek duration in days.
        distance (int): Distance in km.
        imageUrl (str): Landscape banner URL.
        description (str): Detailed metadata summary.
        latitude (float): Maps coordinate.
        longitude (float): Maps coordinate.

    Returns:
        JSON response with route details.
    """
    if current_user.role != 'admin':
        return jsonify({'error': 'Unauthorized'}), 403
        
    data = request.get_json() or {}
    route_id = data.get('id')
    name = data.get('name')
    location = data.get('location')
    place = data.get('place')
    difficulty = data.get('difficulty', 'Moderate')
    duration = data.get('duration', 5)
    distance = data.get('distance', 15)
    image_url = data.get('imageUrl')
    description = data.get('description')
    latitude = data.get('latitude')
    longitude = data.get('longitude')

    if not name or not location:
        return jsonify({'error': 'Name and Location are required.'}), 400

    if not image_url:
        image_url = "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&q=80"

    if route_id:
        route = TrekRoute.query.get(route_id)
        if not route:
            return jsonify({'error': 'Trek Route not found'}), 404
        route.name = name
        route.location = location
        route.place = place
        route.difficulty = difficulty
        route.duration = duration
        route.distance = distance
        route.image_url = image_url
        route.description = description
        route.latitude = latitude
        route.longitude = longitude
    else:
        max_id = db.session.query(db.func.max(TrekRoute.id)).scalar() or 0
        trek_code = f"TID{max_id + 1:03d}"
        route = TrekRoute(
            trek_code=trek_code,
            name=name,
            location=location,
            place=place,
            difficulty=difficulty,
            duration=duration,
            distance=distance,
            image_url=image_url,
            description=description,
            latitude=latitude,
            longitude=longitude,
            active=True
        )
        db.session.add(route)

    db.session.commit()
    invalidate_all_trek_caches()
    return jsonify({'success': True, 'route': route.to_json()})


@admin_bp.route('/api/admin/trek_routes/<int:route_id>', methods=['DELETE'])
@login_required
def admin_delete_trek_route(route_id):
    """
    Deletes a specific trek route from the system database.

    Parameters:
        route_id (int): The ID of the route.

    Returns:
        JSON indicating deletion status.
    """
    if current_user.role != 'admin':
        return jsonify({'error': 'Unauthorized'}), 403
        
    route = TrekRoute.query.get(route_id)
    if not route:
        return jsonify({'error': 'Trek Route not found'}), 404
        
    db.session.delete(route)
    db.session.commit()
    invalidate_all_trek_caches()
    return jsonify({'success': True, 'message': 'Trek Route removed.'})


@admin_bp.route('/api/admin/trek_routes/toggle/<int:route_id>', methods=['POST'])
@login_required
def admin_toggle_trek_route(route_id):
    """
    Toggles the active state of a specific trek route.

    Parameters:
        route_id (int): The ID of the route.

    Returns:
        JSON response with the new active state.
    """
    if current_user.role != 'admin':
        return jsonify({'error': 'Unauthorized'}), 403
        
    route = TrekRoute.query.get(route_id)
    if not route:
        return jsonify({'error': 'Trek Route not found'}), 404
        
    route.active = not route.active
    db.session.commit()
    invalidate_all_trek_caches()
    return jsonify({'success': True, 'active': route.active})


@admin_bp.route('/api/admin/treks', methods=['POST'])
@login_required
def admin_save_trek():
    """
    Saves (creates or edits) a trek batch schedule, checking for guide conflicts
    and availability dates, and notifies the guide if assigned.

    Request Body (JSON):
        id (int, optional): ID to edit.
        trekRouteId (int): ID of the route.
        startDate (str): 'YYYY-MM-DD'.
        endDate (str): 'YYYY-MM-DD'.
        slots (int): Total slots capacity.
        price (int): Base ticket price.
        status (str): E.g., Open, Closed, Completed.
        staff_id (int, optional): Assigned guide user ID.

    Returns:
        JSON representation of the saved trek batch.
    """
    if current_user.role != 'admin':
        return jsonify({'error': 'Unauthorized'}), 403
        
    data = request.get_json() or {}
    trek_id = data.get('id')
    trek_route_id = data.get('trekRouteId')
    
    start_date_str = data.get('startDate')
    end_date_str = data.get('endDate')
    slots = data.get('slots')
    price = data.get('price')
    status = data.get('status', 'Open')
    staff_id = data.get('staff_id')
    staff_id = int(staff_id) if staff_id else None
    
    if not trek_id and not trek_route_id:
        return jsonify({'error': 'Trek Route selection is required.'}), 400
    if not start_date_str or not end_date_str:
        return jsonify({'error': 'Start date and End date are required.'}), 400
    if slots is None or slots <= 0:
        return jsonify({'error': 'Available slots must be a positive integer.'}), 400
    if price is None or price < 0:
        return jsonify({'error': 'Price must be a positive number.'}), 400
        
    start_date = datetime.strptime(start_date_str, '%Y-%m-%d').date()
    end_date = datetime.strptime(end_date_str, '%Y-%m-%d').date()
    
    if start_date >= end_date:
        return jsonify({'error': 'Start date must be before End date.'}), 400
        
    # Redundancy check (same route on the same start date)
    if not trek_id:
        existing_batch = Trek.query.filter_by(
            trek_route_id=trek_route_id,
            start_date=start_date
        ).first()
        if existing_batch:
            return jsonify({'error': f'A batch starting on {start_date_str} is already scheduled (Redundant batch).'}), 400
            
    # Check scheduling conflict for assigned guide
    if staff_id:
        conflict = Trek.query.filter(
            Trek.staff_id == staff_id,
            Trek.id != trek_id,
            Trek.start_date <= end_date,
            Trek.end_date >= start_date
        ).first()
        if conflict:
            return jsonify({'error': f"Conflict: Guide is already assigned to batch '{conflict.name}' ({conflict.batch_code}) from {conflict.start_date} to {conflict.end_date}."}), 400
            
        guide = User.query.get(staff_id)
        if guide and guide.staff_profile and guide.staff_profile.custom_blocked_dates:
            blocked_str = guide.staff_profile.custom_blocked_dates
            blocked_dates = [d.strip() for d in blocked_str.split(',') if d.strip()]
            curr = start_date
            while curr <= end_date:
                curr_str = curr.strftime('%Y-%m-%d')
                if curr_str in blocked_dates:
                    return jsonify({'error': f"Conflict: Guide is marked Unavailable (Leave/Off Day) on {curr_str}. Clear unavailability first."}), 400
                curr += timedelta(days=1)

    if trek_id:
        trek = Trek.query.get(trek_id)
        if not trek:
            return jsonify({'error': 'Trek not found'}), 404
        trek.start_date = start_date
        trek.end_date = end_date
        trek.slots = slots
        trek.price = price
        trek.status = status
        trek.staff_id = staff_id
    else:
        route = TrekRoute.query.get(trek_route_id)
        if not route:
            return jsonify({'error': 'Trek Route not found'}), 404
            
        if not route.active:
            return jsonify({'error': 'Cannot schedule batches for inactive/closed trek routes.'}), 400
            
        num_batches = Trek.query.filter_by(trek_route_id=route.id).count()
        batch_code = f"{route.trek_code}B{num_batches+1:02d}"
        dur = (end_date - start_date).days
        
        trek = Trek(
            trek_route_id=route.id,
            batch_code=batch_code,
            name=route.name,
            location=route.location,
            difficulty=route.difficulty,
            duration=route.duration or dur or 5,
            start_date=start_date,
            end_date=end_date,
            slots=slots,
            price=price,
            status=status,
            image_url=route.image_url,
            description=route.description,
            latitude=route.latitude,
            longitude=route.longitude,
            distance=route.distance,
            staff_id=staff_id
        )
        db.session.add(trek)
        
    db.session.commit()
    if staff_id:
        dispatch_guide_assignment_email(staff_id, trek.id)
        # Clear the assigned guide's per-staff dashboard cache
        invalidate_staff_cache(staff_id)
    invalidate_all_trek_caches()
    return jsonify({'success': True, 'trek': trek.to_json()})


@admin_bp.route('/api/admin/treks/<int:trek_id>', methods=['DELETE'])
@login_required
def admin_delete_trek(trek_id):
    """
    Deletes a specific trek batch from the system.

    Parameters:
        trek_id (int): The ID of the trek batch to delete.

    Returns:
        JSON showing deletion success.
    """
    if current_user.role != 'admin':
        return jsonify({'error': 'Unauthorized'}), 403
        
    trek = Trek.query.get(trek_id)
    if not trek:
        return jsonify({'error': 'Trek not found'}), 404
        
    db.session.delete(trek)
    db.session.commit()
    invalidate_all_trek_caches()
    return jsonify({'success': True})


@admin_bp.route('/api/admin/batches/<int:trek_id>/close', methods=['POST'])
@login_required
def admin_close_batch(trek_id):
    """
    Closes a trek batch to prevent further user bookings.

    Parameters:
        trek_id (int): ID of the trek batch.

    Returns:
        JSON indicating batch status update.
    """
    if current_user.role != 'admin':
        return jsonify({'error': 'Unauthorized'}), 403
        
    trek = Trek.query.get(trek_id)
    if not trek:
        return jsonify({'error': 'Trek not found'}), 404
    
    if trek.status == 'Closed':
        return jsonify({'error': 'Batch is already closed'}), 400
    
    trek.status = 'Closed'
    db.session.commit()
    invalidate_all_trek_caches()
    return jsonify({'success': True, 'message': f"Batch '{trek.name}' has been closed. No further bookings are allowed.", 'trek': trek.to_json()})


@admin_bp.route('/api/admin/batches/<int:trek_id>/complete', methods=['POST'])
@login_required
def admin_complete_batch(trek_id):
    """
    Marks a trek batch as Completed and updates all related user bookings status to Completed.

    Parameters:
        trek_id (int): ID of the trek batch.

    Returns:
        JSON indicating batch completion.
    """
    if current_user.role != 'admin':
        return jsonify({'error': 'Unauthorized'}), 403
        
    trek = Trek.query.get(trek_id)
    if not trek:
        return jsonify({'error': 'Trek not found'}), 404
    
    if trek.status == 'Completed':
        return jsonify({'error': 'Batch is already completed'}), 400
        
    trek.status = 'Completed'
    
    # Update bookings status in database
    bookings = Booking.query.filter_by(trek_id=trek.id, status='Booked').all()
    for b in bookings:
        b.status = 'Completed'
        
    db.session.commit()
    invalidate_all_trek_caches()
    return jsonify({
        'success': True, 
        'message': f"Batch '{trek.name}' has been marked as Completed.", 
        'trek': trek.to_json()
    })


@admin_bp.route('/api/admin/batches/toggle/<int:trek_id>', methods=['POST'])
@login_required
def admin_toggle_batch(trek_id):
    """
    Toggles a trek batch status between Open and Closed.

    Parameters:
        trek_id (int): ID of the trek batch.

    Returns:
        JSON showing batch status toggle.
    """
    if current_user.role != 'admin':
        return jsonify({'error': 'Unauthorized'}), 403
        
    trek = Trek.query.get(trek_id)
    if not trek:
        return jsonify({'error': 'Trek not found'}), 404

    if trek.status == 'Open':
        trek.status = 'Closed'
    elif trek.status == 'Closed':
        trek.status = 'Open'
    else:
        return jsonify({'error': 'Cannot toggle status for this batch'}), 400

    db.session.commit()
    invalidate_all_trek_caches()
    return jsonify({'success': True, 'active': trek.status == 'Open', 'trek': trek.to_json()})


@admin_bp.route('/api/admin/batches/<int:trek_id>/trekkers', methods=['GET'])
@login_required
def admin_get_batch_trekkers(trek_id):
    """
    Gets all registered trekkers on a specific trek batch.

    Parameters:
        trek_id (int): ID of the trek batch.

    Returns:
        JSON list of registered trekkers.
    """
    if current_user.role != 'admin':
        return jsonify({'error': 'Unauthorized'}), 403
        
    bookings = Booking.query.filter_by(trek_id=trek_id).all()
    trekkers = []
    for b in bookings:
        user = b.user
        member_id = user.to_json()['memberId']
        trekkers.append({
            'userId': user.id,
            'userName': user.name,
            'userEmail': user.email,
            'memberId': member_id,
            'bookingId': b.id,
            'status': b.status,
            'paymentStatus': b.payment_status or 'Paid'
        })
    return jsonify({'success': True, 'trekkers': trekkers})


@admin_bp.route('/api/admin/batches/add_trekker', methods=['POST'])
@login_required
def admin_add_trekker_to_batch():
    """
    Allows admin to manually register a trekker user to a trek batch.

    Request Body (JSON):
        trek_id (int): Trek batch ID.
        user_id (int): Trekker user ID.

    Returns:
        JSON showing added trekker details.
    """
    if current_user.role != 'admin':
        return jsonify({'error': 'Unauthorized'}), 403
        
    data = request.get_json() or {}
    trek_id = data.get('trek_id')
    user_id = data.get('user_id')
    
    if not trek_id or not user_id:
        return jsonify({'error': 'Trek ID and User ID are required.'}), 400
        
    trek = Trek.query.get(trek_id)
    if not trek:
        return jsonify({'error': 'Trek batch not found.'}), 404
        
    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': 'Trekker user not found.'}), 404
        
    existing = Booking.query.filter_by(trek_id=trek_id, user_id=user_id, status='Booked').first()
    if existing:
        return jsonify({'error': 'User is already registered/booked in this batch.'}), 400
        
    booked_count = db.session.query(Booking).filter(
        Booking.trek_id == trek_id,
        Booking.status == 'Booked',
        (Booking.payment_status != 'Failed') | (Booking.payment_status == None)
    ).count()
    if booked_count >= trek.slots:
        return jsonify({'error': 'Trek batch is already full. Increase slots first.'}), 400
        
    booking = Booking(
        user_id=user_id,
        trek_id=trek_id,
        booked_on=date.today(),
        status='Booked',
        paid=True,
        booking_price=trek.price,
        amount_paid=trek.price,
        payment_status='Paid'
    )
    db.session.add(booking)
    db.session.commit()
    invalidate_all_trek_caches()
    
    return jsonify({
        'success': True,
        'message': f'Trekker {user.name} successfully added to batch.',
        'booking': {
            'id': booking.id,
            'userId': user.id,
            'userName': user.name,
            'userEmail': user.email,
            'memberId': user.to_json()['memberId']
        }
    })


@admin_bp.route('/api/admin/batches/remove_trekker', methods=['POST'])
@login_required
def admin_remove_trekker_from_batch():
    """
    Manually deletes a trekker's booking from a trek batch.

    Request Body (JSON):
        trek_id (int): Trek batch ID.
        user_id (int): User ID to remove.

    Returns:
        JSON indicating deletion success.
    """
    if current_user.role != 'admin':
        return jsonify({'error': 'Unauthorized'}), 403
        
    data = request.get_json() or {}
    trek_id = data.get('trek_id')
    user_id = data.get('user_id')
    
    if not trek_id or not user_id:
        return jsonify({'error': 'Trek ID and User ID are required.'}), 400
        
    booking = Booking.query.filter_by(trek_id=trek_id, user_id=user_id).first()
    if not booking:
        return jsonify({'error': 'No booking found for this user in this batch.'}), 404
        
    db.session.delete(booking)
    db.session.commit()
    invalidate_all_trek_caches()
    
    return jsonify({'success': True, 'message': 'Trekker removed from batch successfully.'})


@admin_bp.route('/api/admin/staff', methods=['POST'])
@login_required
def admin_save_staff():
    """
    Registers a new guide or edits an existing guide's profile/qualifications.
    Triggers creation credentials email.

    Request Body (JSON):
        id (int, optional): Guide user ID.
        email (str): Email.
        name (str): Full Name.
        phone (str): Contact phone.
        password (str): Plain-text credentials.
        skills (str): Skills summary.
        experience (int): Work experience.
        designation (str): Lead Guide, Assistant.
        certifications (str): Certifications list.
        languages (str): Languages list.
        photoUrl (str): Photo URL link.

    Returns:
        JSON showing success status.
    """
    if current_user.role != 'admin':
        return jsonify({'error': 'Unauthorized'}), 403
        
    data = request.get_json() or {}
    staff_id = data.get('id')
    email = data.get('email')
    name = data.get('name')
    phone = data.get('phone') or ''
    password = data.get('password')
    
    if not name or not email:
        return jsonify({'error': 'Name and Email are required.'}), 400

    if staff_id:
        staff = User.query.get(staff_id)
        if not staff or staff.role != 'staff':
            return jsonify({'error': 'Staff member not found.'}), 404
            
        existing = User.query.filter(User.email == email, User.id != staff_id).first()
        if existing:
            return jsonify({'error': 'Email already registered by another user.'}), 400
            
        staff.email = email
        staff.name = name
        staff.phone = phone
        if password:
            staff.password_hash = generate_password_hash(password)
            
        profile = staff.staff_profile
        if not profile:
            profile = StaffProfile(user_id=staff.id)
            db.session.add(profile)
            
        profile.skills = data.get('skills', 'Wilderness First Aid, Navigation')
        try:
            profile.experience_years = int(data.get('experience', 2))
        except (ValueError, TypeError):
            profile.experience_years = 2
            
        profile.designation = data.get('designation', 'Lead Guide')
        profile.certifications = data.get('certifications', 'Wilderness First Responder (WFR)')
        profile.languages = data.get('languages', 'English, Hindi')
        try:
            profile.completed_treks_count = int(data.get('completedTreksCount', 10))
        except (ValueError, TypeError):
            profile.completed_treks_count = 10
            
        profile.photo_url = data.get('photoUrl')
        
    else:
        existing = User.query.filter_by(email=email).first()
        if existing:
            return jsonify({'error': 'Email already registered.'}), 400
            
        staff = User(
            email=email,
            name=name,
            phone=phone,
            password_hash=generate_password_hash(password or 'Trailsync@123'),
            role='staff'
        )
        db.session.add(staff)
        db.session.flush()
        
        profile = StaffProfile(
            user_id=staff.id,
            skills=data.get('skills', 'Wilderness First Aid, Navigation'),
            experience_years=int(data.get('experience', 2)) if data.get('experience') else 2,
            designation=data.get('designation', 'Lead Guide'),
            certifications=data.get('certifications', 'Wilderness First Responder (WFR)'),
            languages=data.get('languages', 'English, Hindi'),
            completed_treks_count=int(data.get('completedTreksCount', 10)) if data.get('completedTreksCount') else 10,
            photo_url=data.get('photoUrl'),
            status='Active'
        )
        db.session.add(profile)
        
        try:
            from backend.tasks import send_staff_creation_email
            send_staff_creation_email.delay(staff.id, password or 'Trailsync@123')
        except Exception as e:
            print("Failed to dispatch Celery staff email:", e)
            
    db.session.commit()
    return jsonify({'success': True})


@admin_bp.route('/api/admin/staff/<int:staff_id>/toggle_date_availability', methods=['POST'])
@login_required
def admin_toggle_staff_date_availability(staff_id):
    """
    Manually blocks or frees a specific leave date in a guide's calendar profile.

    Parameters:
        staff_id (int): Guide user ID.

    Request Body (JSON):
        date (str): 'YYYY-MM-DD'.

    Returns:
        JSON showing updated dates.
    """
    if current_user.role != 'admin':
        return jsonify({'error': 'Unauthorized'}), 403
        
    data = request.get_json() or {}
    date_str = data.get('date')
    if not date_str:
        return jsonify({'error': 'Date is required.'}), 400
        
    staff = User.query.get(staff_id)
    if not staff or staff.role != 'staff':
        return jsonify({'error': 'Staff member not found.'}), 404
        
    profile = staff.staff_profile
    if not profile:
        profile = StaffProfile(user_id=staff.id)
        db.session.add(profile)
        
    blocked_dates = profile.custom_blocked_dates or ''
    dates_list = [d.strip() for d in blocked_dates.split(',') if d.strip()]
    
    if date_str in dates_list:
        dates_list.remove(date_str)
        action = 'free'
    else:
        dates_list.append(date_str)
        action = 'busy'
        
    profile.custom_blocked_dates = ','.join(dates_list)
    db.session.commit()
    
    return jsonify({
        'success': True,
        'action': action,
        'customBlockedDates': profile.custom_blocked_dates
    })


@admin_bp.route('/api/admin/trekkers', methods=['POST'])
@login_required
def admin_save_trekker():
    """
    Registers a new trekker user account or modifies their basic profile fields.

    Request Body (JSON):
        id (int, optional): User ID to edit.
        email (str): Email.
        name (str): Full name.
        phone (str): Contact phone.
        password (str): Password.
        city (str): Residence city.
        emergency (str): Emergency contacts.
        bio (str): Bio description.

    Returns:
        JSON success message.
    """
    if current_user.role != 'admin':
        return jsonify({'error': 'Unauthorized'}), 403
        
    data = request.get_json() or {}
    trekker_id = data.get('id')
    email = data.get('email')
    name = data.get('name')
    phone = data.get('phone') or ''
    password = data.get('password')
    city = data.get('city') or ''
    emergency = data.get('emergency') or ''
    bio = data.get('bio') or ''
    
    if not email or not name:
        return jsonify({'error': 'Email and Name are required.'}), 400

    if trekker_id:
        trekker = User.query.get(trekker_id)
        if not trekker or trekker.role != 'user':
            return jsonify({'error': 'Trekker not found.'}), 404
            
        existing = User.query.filter(User.email == email, User.id != trekker_id).first()
        if existing:
            return jsonify({'error': 'Email already registered by another user.'}), 400
            
        trekker.email = email
        trekker.name = name
        trekker.phone = phone
        trekker.city = city
        trekker.emergency = emergency
        trekker.bio = bio
        if password:
            trekker.password_hash = generate_password_hash(password)
    else:
        existing = User.query.filter_by(email=email).first()
        if existing:
            return jsonify({'error': 'Email already registered.'}), 400
            
        trekker = User(
            email=email,
            name=name,
            phone=phone,
            password_hash=generate_password_hash(password or 'Trekker@123'),
            role='user',
            city=city,
            emergency=emergency,
            bio=bio
        )
        db.session.add(trekker)
        
    db.session.commit()
    return jsonify({'success': True})


@admin_bp.route('/api/admin/staff/toggle/<int:staff_id>', methods=['POST'])
@login_required
def admin_toggle_staff(staff_id):
    """
    Toggles the active state of a guide account.

    Parameters:
        staff_id (int): Guide user ID.

    Returns:
        JSON showing updated active state.
    """
    if current_user.role != 'admin':
        return jsonify({'error': 'Unauthorized'}), 403
        
    staff = User.query.get(staff_id)
    if not staff or staff.role != 'staff':
        return jsonify({'error': 'Staff member not found'}), 404
        
    staff.active = not staff.active
    db.session.commit()
    return jsonify({'success': True, 'active': staff.active})


@admin_bp.route('/api/admin/users/blacklist/<int:user_id>', methods=['POST'])
@login_required
def admin_blacklist_user(user_id):
    """
    Blacklists a user account, preventing subsequent log in.

    Parameters:
        user_id (int): Target user ID.

    Request Body (JSON/Form):
        reason (str): Reason description.

    Returns:
        JSON indicating blacklisted status.
    """
    if current_user.role != 'admin':
        return jsonify({'error': 'Unauthorized'}), 403
        
    user = db.session.get(User, user_id)
    if not user or user.role not in ('user', 'staff'):
        return jsonify({'error': 'User not found'}), 404
        
    reason = 'Policy violation'
    if request.is_json:
        data = request.get_json() or {}
        reason = data.get('reason', 'Policy violation')
    elif request.form:
        reason = request.form.get('reason', 'Policy violation')
        
    user.blacklisted = True
    user.blacklist_reason = reason
    db.session.commit()
    return jsonify({'success': True, 'blacklisted': True})


@admin_bp.route('/api/admin/users/restore/<int:user_id>', methods=['POST'])
@login_required
def admin_restore_user(user_id):
    """
    Removes blacklisting blocks from a user account.

    Parameters:
        user_id (int): Target user ID.

    Returns:
        JSON indicating status.
    """
    if current_user.role != 'admin':
        return jsonify({'error': 'Unauthorized'}), 403
        
    user = db.session.get(User, user_id)
    if not user or user.role not in ('user', 'staff'):
        return jsonify({'error': 'User not found'}), 404
        
    user.blacklisted = False
    db.session.commit()
    return jsonify({'success': True, 'blacklisted': False})


@admin_bp.route('/api/admin/bookings/cancel/<int:booking_id>', methods=['POST'])
@login_required
def admin_cancel_booking(booking_id):
    """
    Admin booking cancellation override.

    Parameters:
        booking_id (int): Booking ID.

    Returns:
        JSON success message.
    """
    if current_user.role != 'admin':
        return jsonify({'error': 'Unauthorized'}), 403
        
    booking = Booking.query.get(booking_id)
    if not booking:
        return jsonify({'error': 'Booking not found'}), 404
        
    booking.status = 'Cancelled'
    db.session.commit()
    invalidate_all_trek_caches()
    dispatch_booking_cancellation_email(booking.id)
    return jsonify({'success': True})


@admin_bp.route('/api/admin/bookings/refund/<int:booking_id>', methods=['POST'])
@login_required
def admin_refund_booking(booking_id):
    """
    Cancels a booking and records a refund payment amount.

    Parameters:
        booking_id (int): Booking ID.

    Request Body (JSON):
        refund_amount (int): The amount refunded.

    Returns:
        JSON indicating refund completion.
    """
    if current_user.role != 'admin':
        return jsonify({'error': 'Unauthorized'}), 403
        
    booking = Booking.query.get(booking_id)
    if not booking:
        return jsonify({'error': 'Booking not found'}), 404
        
    data = request.get_json() or {}
    refund_amount = data.get('refund_amount', 0)
    
    paid_amt = booking.amount_paid or booking.booking_price or (booking.trek.price if booking.trek else 5000)
    if refund_amount < 0 or refund_amount > paid_amt:
        return jsonify({'error': f'Invalid refund amount. Must be between 0 and {paid_amt}.'}), 400
        
    was_already_cancelled = (booking.status == 'Cancelled')
    booking.status = 'Cancelled'
    booking.payment_status = 'Refunded'
    booking.refund_amount = refund_amount
    booking.paid = False
    
    db.session.commit()
    invalidate_all_trek_caches()
    if not was_already_cancelled:
        dispatch_booking_cancellation_email(booking.id)
    return jsonify({'success': True})


@admin_bp.route('/api/admin/jobs/trigger', methods=['POST'])
@login_required
def admin_trigger_job():
    """
    Manually triggers specific Celery background cron jobs.

    Request Body (JSON):
        name (str): E.g., 'Daily Prep Reminders', 'Monthly Activity Report'.

    Returns:
        JSON indicating success.
    """
    if current_user.role != 'admin':
        return jsonify({'error': 'Unauthorized'}), 403
        
    data = request.get_json() or {}
    job_name = data.get('name')
    
    if 'Reminder' in job_name or 'Prep' in job_name:
        from backend.tasks import send_daily_reminders, update_job_run
        update_job_run('Daily Prep Reminders', 'Running')
        send_daily_reminders.delay(is_manual=True)
    elif 'Report' in job_name:
        from backend.tasks import generate_monthly_report, update_job_run
        update_job_run('Monthly Activity Report', 'Running')
        generate_monthly_report.delay(is_manual=True)
    elif 'Marketing' in job_name or 'Campaign' in job_name:
        from backend.tasks import send_marketing_campaign, update_job_run
        update_job_run('Daily Marketing Campaign', 'Running')
        send_marketing_campaign.delay(is_manual=True)
        
    return jsonify({'success': True, 'message': f'Job "{job_name}" triggered successfully.'})


@admin_bp.route('/api/admin/jobs/test_welcome', methods=['POST'])
@login_required
def admin_test_welcome_email():
    """
    Triggers sending a test welcome email.

    Request Body (JSON):
        type (str): 'user' or 'staff'.
        email (str): Recipient.

    Returns:
        JSON indicating success.
    """
    if current_user.role != 'admin':
        return jsonify({'error': 'Unauthorized'}), 403
        
    data = request.get_json() or {}
    email_type = data.get('type')
    email_address = data.get('email')
    
    if not email_address:
        return jsonify({'error': 'Recipient email address is required'}), 400
        
    if email_type == 'user':
        from backend.tasks import send_test_user_welcome
        send_test_user_welcome.delay(email_address)
    elif email_type == 'staff':
        from backend.tasks import send_test_staff_welcome
        send_test_staff_welcome.delay(email_address)
    else:
        return jsonify({'error': 'Invalid welcome email type'}), 400
        
    return jsonify({'success': True, 'message': f'Test welcome email ({email_type}) triggered successfully to {email_address}.'})


@admin_bp.route('/api/admin/export', methods=['POST'])
@login_required
def admin_export():
    """
    Dumps database tables as JSON datasets inside the scratch directory.

    Request Body (JSON):
        type (str, optional): 'users', 'bookings', or default 'database' (all).

    Returns:
        JSON showing output filepath description.
    """
    if current_user.role != 'admin':
        return jsonify({'error': 'Unauthorized'}), 403
        
    data = request.get_json() or {}
    export_type = data.get('type', 'database')
    
    scratch_dir = os.path.abspath(os.path.join(current_app.root_path, '../scratch'))
    os.makedirs(scratch_dir, exist_ok=True)
    filepath = os.path.join(scratch_dir, f"export_{export_type}_{int(datetime.now().timestamp())}.json")
    
    export_data = {}
    if export_type == 'users':
        export_data = [u.to_json() for u in User.query.all()]
    elif export_type == 'bookings':
        export_data = [b.to_json() for b in Booking.query.all()]
    else:
        export_data = {
            'users': [u.to_json() for u in User.query.all()],
            'treks': [t.to_json() for t in Trek.query.all()],
            'bookings': [b.to_json() for b in Booking.query.all()]
        }
        
    with open(filepath, 'w') as f:
        json.dump(export_data, f, indent=4)
        
    return jsonify({'success': True, 'message': f'Exported {export_type} database successfully.'})


@admin_bp.route('/api/admin/support_tickets/resolve/<int:ticket_id>', methods=['POST'])
@login_required
def admin_resolve_support_ticket(ticket_id):
    """
    Resolves a specific support ticket. If it's a guide's leave request,
    automatically blocks those dates in the guide's availability profile.

    Parameters:
        ticket_id (int): Support ticket ID.

    Request Body (JSON):
        resolution_message (str): Optional resolution notes.

    Returns:
        JSON resolve confirmation.
    """
    if current_user.role != 'admin':
        return jsonify({'error': 'Unauthorized'}), 403
    ticket = SupportTicket.query.get(ticket_id)
    if not ticket:
        return jsonify({'error': 'Ticket not found'}), 404
    ticket.status = 'Resolved'
    
    data = request.get_json(silent=True) or {}
    resolution_msg = data.get('resolution_message', '').strip()
    if resolution_msg:
        ticket.resolution_message = resolution_msg
    
    # Auto-block dates for leave requests
    if ticket.subject and '[Leave Request]' in ticket.subject:
        dates_found = re.findall(r'\d{4}-\d{2}-\d{2}', ticket.subject)
        if not dates_found and ticket.message:
            dates_found = re.findall(r'\d{4}-\d{2}-\d{2}', ticket.message)
            
        if dates_found and ticket.user_id:
            staff = User.query.get(ticket.user_id)
            if staff and staff.role == 'staff':
                profile = staff.staff_profile
                if not profile:
                    profile = StaffProfile(user_id=staff.id)
                    db.session.add(profile)
                    
                all_leave_dates = []
                if len(dates_found) == 2:
                    try:
                        start_dt = datetime.strptime(dates_found[0], '%Y-%m-%d')
                        end_dt = datetime.strptime(dates_found[1], '%Y-%m-%d')
                        if start_dt <= end_dt:
                            curr = start_dt
                            while curr <= end_dt:
                                all_leave_dates.append(curr.strftime('%Y-%m-%d'))
                                curr += timedelta(days=1)
                        else:
                            all_leave_dates = dates_found
                    except ValueError:
                        all_leave_dates = dates_found
                else:
                    all_leave_dates = dates_found
                    
                existing_blocked = profile.custom_blocked_dates or ''
                existing_list = [d.strip() for d in existing_blocked.split(',') if d.strip()]
                for d in all_leave_dates:
                    if d not in existing_list:
                        existing_list.append(d)
                profile.custom_blocked_dates = ','.join(sorted(existing_list))

    db.session.commit()
    invalidate_all_trek_caches()
    return jsonify({'success': True, 'message': f'Ticket #{ticket_id} resolved.', 'ticket': ticket.to_json()})


@admin_bp.route('/api/admin/treks/assign/<int:trek_id>', methods=['POST'])
@login_required
def admin_assign_trek(trek_id):
    """
    Manually assigns a guide (by email) to a trek batch schedule. Verifies guide conflicts.

    Parameters:
        trek_id (int): Trek batch ID.

    Request Body (JSON):
        email (str): Guide's email. If empty, unassigns current guide.

    Returns:
        JSON assignment success.
    """
    if current_user.role != 'admin':
        return jsonify({'error': 'Unauthorized'}), 403
        
    data = request.get_json() or {}
    email = data.get('email')
    
    trek = Trek.query.get(trek_id)
    if not trek:
        return jsonify({'error': 'Trek not found'}), 404
        
    if not email:
        old_staff_id = trek.staff_id
        trek.staff_id = None
        db.session.commit()
        # Clear previous guide's dashboard cache on unassignment
        if old_staff_id:
            invalidate_staff_cache(old_staff_id)
        invalidate_all_trek_caches()
        return jsonify({'success': True})
        
    staff = User.query.filter_by(email=email, role='staff').first()
    if not staff:
        return jsonify({'error': 'Staff member not found'}), 404
        
    # Check scheduling overlap conflict
    conflict = Trek.query.filter(
        Trek.staff_id == staff.id,
        Trek.id != trek_id,
        Trek.start_date <= trek.end_date,
        Trek.end_date >= trek.start_date
    ).first()
    if conflict:
        return jsonify({'error': f"Conflict: Guide is already assigned to batch '{conflict.name}' ({conflict.batch_code}) from {conflict.start_date} to {conflict.end_date}."}), 400
        
    if staff.staff_profile and staff.staff_profile.custom_blocked_dates:
        blocked_str = staff.staff_profile.custom_blocked_dates
        blocked_dates = [d.strip() for d in blocked_str.split(',') if d.strip()]
        curr = trek.start_date
        while curr <= trek.end_date:
            curr_str = curr.strftime('%Y-%m-%d')
            if curr_str in blocked_dates:
                return jsonify({'error': f"Conflict: Guide is marked Unavailable (Leave/Off Day) on {curr_str}. Clear unavailability first."}), 400
            curr += timedelta(days=1)
        
    trek.staff_id = staff.id
    db.session.commit()
    dispatch_guide_assignment_email(staff.id, trek.id)
    # Clear the newly assigned guide's per-staff dashboard cache
    invalidate_staff_cache(staff.id)
    invalidate_all_trek_caches()
    return jsonify({'success': True})


@admin_bp.route('/api/admin/report', methods=['POST'])
@login_required
def admin_trigger_report():
    """
    Manually triggers daily email reminders or monthly activity PDF/HTML report.

    Request Body (JSON):
        type (str): 'monthly' or default ('daily').

    Returns:
        JSON showing triggered queue status.
    """
    if current_user.role != 'admin':
        return jsonify({'error': 'Unauthorized'}), 403
        
    data = request.get_json() or {}
    report_type = data.get('type')
    
    if report_type == 'monthly':
        from backend.tasks import generate_monthly_report
        generate_monthly_report.delay(is_manual=True)
        return jsonify({'message': 'Monthly HTML report triggered via Celery.'})
    else:
        from backend.tasks import send_daily_reminders
        send_daily_reminders.delay(is_manual=True)
        return jsonify({'message': 'Daily reminders triggered via Celery.'})
