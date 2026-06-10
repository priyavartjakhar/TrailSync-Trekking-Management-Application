import os
import csv
from datetime import datetime, date, timedelta
from celery import Celery

# Initialize Celery app
celery_app = Celery(
    'backend.tasks',
    broker='redis://localhost:6379/0',
    backend='redis://localhost:6379/0'
)

# Optional: configure celery beat schedule
celery_app.conf.beat_schedule = {
    'send-daily-reminders-every-day': {
        'task': 'backend.tasks.send_daily_reminders',
        'schedule': 86400.0, # once a day
    },
    'generate-monthly-report-every-month': {
        'task': 'backend.tasks.generate_monthly_report',
        'schedule': 2592000.0, # once a month
    }
}
celery_app.conf.timezone = 'UTC'

@celery_app.task
def send_daily_reminders():
    from backend.app import app
    from backend.models.models import db, Booking, Trek
    
    with app.app_context():
        # Query bookings where trek starts tomorrow
        tomorrow = date.today() + timedelta(days=1)
        bookings = db.session.query(Booking).join(Trek).filter(
            Trek.start_date == tomorrow,
            Booking.status == 'Booked'
        ).all()
        
        email_dir = os.path.join(os.path.dirname(__file__), '../scratch/emails')
        os.makedirs(email_dir, exist_ok=True)
        
        count = 0
        for b in bookings:
            user = b.user
            trek = b.trek
            guide_name = trek.staff.name if trek.staff else "TBD"
            
            email_content = f"""Subject: Upcoming Trek Reminder: {trek.name}
To: {user.email}
Date: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}

Hi {user.name},

This is a friendly reminder that your trek "{trek.name}" is starting tomorrow ({trek.start_date.strftime('%Y-%m-%d')})!

Meeting Point: {trek.location}
Duration: {trek.duration} Days
Difficulty: {trek.difficulty}
Guide: {guide_name}

Acclimatization Tips:
- Stay hydrated (drink at least 4-5 liters of water daily).
- Walk at a steady, rhythmic pace.
- Avoid sleeping at high altitudes if you feel symptomatic.

Gear Checklist:
- Trekking boots (broken in)
- Warm layers (fleece, down jacket)
- Rain cover / poncho
- Headlamp with extra batteries
- Personal first-aid kit and medications

We wish you a safe and memorable journey!

Best regards,
TrailSync Safety Team
"""
            filename = f"daily_reminder_booking_{b.id}_{int(datetime.now().timestamp())}.txt"
            filepath = os.path.join(email_dir, filename)
            with open(filepath, 'w') as f:
                f.write(email_content)
            count += 1
            
        return f"Sent {count} daily reminders."

@celery_app.task
def generate_monthly_report():
    from backend.app import app
    from backend.models.models import db, Booking, Trek, User
    
    with app.app_context():
        # Compile report stats
        current_month = datetime.now().month
        current_year = datetime.now().year
        
        total_bookings = db.session.query(Booking).filter(
            db.extract('month', Booking.booked_on) == current_month,
            db.extract('year', Booking.booked_on) == current_year
        ).count()
        
        # Popular treks (by booking count)
        all_treks = Trek.query.all()
        trek_stats = []
        for t in all_treks:
            cnt = db.session.query(Booking).filter_by(trek_id=t.id, status='Booked').count()
            trek_stats.append((t.name, cnt))
        
        trek_stats.sort(key=lambda x: x[1], reverse=True)
        popular_treks_html = "".join([f"<li>{name}: {cnt} bookings</li>" for name, cnt in trek_stats[:5]])
        
        # Active staff members
        active_staff = User.query.filter_by(role='staff', active=True).count()
        
        report_html = f"""<!DOCTYPE html>
<html>
<head>
    <title>Monthly Activity Report - TrailSync</title>
    <style>
        body {{ font-family: Arial, sans-serif; margin: 20px; color: #333; }}
        h1 {{ color: #1a2e1a; }}
        .stat {{ font-size: 1.1em; margin: 10px 0; }}
        .highlight {{ font-weight: bold; color: #c8922a; }}
    </style>
</head>
<body>
    <h1>TrailSync Monthly Report - {datetime.now().strftime('%B %Y')}</h1>
    <hr>
    <div class="stat">Total Bookings Made This Month: <span class="highlight">{total_bookings}</span></div>
    <div class="stat">Active Staff Members: <span class="highlight">{active_staff}</span></div>
    <h3>Top 5 Popular Treks:</h3>
    <ul>
        {popular_treks_html if popular_treks_html else "<li>No bookings recorded this month.</li>"}
    </ul>
    <hr>
    <p>Generated automatically by Celery Beat on {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}. Sent to admin@trailsync.com.</p>
</body>
</html>
"""
        email_dir = os.path.join(os.path.dirname(__file__), '../scratch/emails')
        os.makedirs(email_dir, exist_ok=True)
        
        filename = f"monthly_report_{int(datetime.now().timestamp())}.html"
        filepath = os.path.join(email_dir, filename)
        with open(filepath, 'w') as f:
            f.write(report_html)
            
        return f"Generated monthly report at {filepath}"

@celery_app.task
def export_booking_history_csv(user_id, email):
    from backend.app import app
    from backend.models.models import db, Booking, User
    
    with app.app_context():
        user = User.query.get(user_id)
        if not user:
            return f"User {user_id} not found."
            
        bookings = Booking.query.filter_by(user_id=user_id).all()
        
        email_dir = os.path.join(os.path.dirname(__file__), '../scratch/emails')
        os.makedirs(email_dir, exist_ok=True)
        
        timestamp = int(datetime.now().timestamp())
        csv_filename = f"booking_history_user_{user_id}_{timestamp}.csv"
        csv_filepath = os.path.join(email_dir, csv_filename)
        
        # Write CSV
        with open(csv_filepath, 'w', newline='') as csvfile:
            writer = csv.writer(csvfile)
            writer.writerow(['Booking ID', 'Trek Name', 'Location', 'Difficulty', 'Start Date', 'End Date', 'Booked On', 'Status', 'Price', 'Paid'])
            for b in bookings:
                writer.writerow([
                    b.id,
                    b.trek.name,
                    b.trek.location,
                    b.trek.difficulty,
                    b.trek.start_date.strftime('%Y-%m-%d') if b.trek.start_date else '',
                    b.trek.end_date.strftime('%Y-%m-%d') if b.trek.end_date else '',
                    b.booked_on.strftime('%Y-%m-%d') if b.booked_on else '',
                    b.status,
                    b.trek.price,
                    'Paid' if b.paid else 'Pending'
                ])
                
        # Also write the notification email text file
        email_content = f"""Subject: Your Trekking History CSV Export
To: {email}
Date: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}

Hi {user.name},

As requested, we have generated your booking and trekking history CSV.
Attached file: {csv_filename}

Best regards,
TrailSync Admin Team
"""
        txt_filename = f"booking_history_export_{user_id}_{timestamp}.txt"
        txt_filepath = os.path.join(email_dir, txt_filename)
        with open(txt_filepath, 'w') as f:
            f.write(email_content)
            
        return f"Exported CSV for user {user_id} to {csv_filepath}"
