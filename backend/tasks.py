import os
import csv
import smtplib
from datetime import datetime, date, timedelta
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.base import MIMEBase
from email import encoders
from celery import Celery

# Initialize Celery app
celery_app = Celery(
    'backend.tasks',
    broker='redis://localhost:6379/0',
    backend='redis://localhost:6379/0'
)

# Configure celery beat schedule
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

def send_email_helper(subject, recipient, body, is_html=False, attachment_path=None):
    """
    Helper function to send emails via Gmail SMTP using provided app credentials.
    Falls back to writing to local scratch/emails directory if SMTP is offline.
    """
    sender_email = "23f2005399@ds.study.iitm.ac.in"
    sender_password = "fvmj mlwu aabm wmxq"
    
    # Ensure fallback directory exists
    email_dir = os.path.join(os.path.dirname(__file__), '../scratch/emails')
    os.makedirs(email_dir, exist_ok=True)
    
    try:
        # Build MIME message
        if attachment_path:
            msg = MIMEMultipart()
            msg["Subject"] = subject
            msg["From"] = sender_email
            msg["To"] = recipient
            
            # Attach body
            body_part = MIMEText(body, 'html' if is_html else 'plain')
            msg.attach(body_part)
            
            # Attach file
            filename = os.path.basename(attachment_path)
            with open(attachment_path, 'rb') as attachment:
                file_part = MIMEBase("application", "octet-stream")
                file_part.set_payload(attachment.read())
            encoders.encode_base64(file_part)
            file_part.add_header(
                "Content-Disposition",
                f"attachment; filename= {filename}",
            )
            msg.attach(file_part)
        else:
            if is_html:
                msg = MIMEText(body, 'html')
            else:
                msg = MIMEText(body, 'plain')
            msg["Subject"] = subject
            msg["From"] = sender_email
            msg["To"] = recipient
            
        # Send via Gmail SMTP
        with smtplib.SMTP("smtp.gmail.com", 587, timeout=10) as server:
            server.starttls()
            server.login(sender_email, sender_password)
            server.send_message(msg)
            
        print(f"SMTP email sent successfully to {recipient}")
        return True
        
    except Exception as e:
        print(f"SMTP send failed: {e}. Writing to fallback file...")
        
        # Write to local file as fallback
        timestamp = int(datetime.now().timestamp())
        file_ext = "html" if is_html else "txt"
        filepath = os.path.join(email_dir, f"fallback_{recipient}_{timestamp}.{file_ext}")
        
        attachment_info = f"\n[Attachment: {attachment_path}]\n" if attachment_path else ""
        content = f"Subject: {subject}\nTo: {recipient}\nDate: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n{attachment_info}\n{body}"
        with open(filepath, 'w') as f:
            f.write(content)
            
        return False

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
        
        count = 0
        for b in bookings:
            user = b.user
            trek = b.trek
            guide_name = trek.staff.name if trek.staff else "TBD"
            
            body = f"""Hi {user.name},

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
TrailSync Safety Team"""
            
            send_email_helper(
                subject=f"Upcoming Trek Reminder: {trek.name}",
                recipient=user.email,
                body=body
            )
            count += 1
            
        return f"Dispatched {count} daily reminders."

@celery_app.task
def generate_monthly_report():
    from backend.app import app
    from backend.models.models import db, Booking, Trek, User
    
    with app.app_context():
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
    <p>Generated automatically by Celery Beat on {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}.</p>
</body>
</html>"""
        
        admin_email = "23f2005399@ds.study.iitm.ac.in"
        send_email_helper(
            subject=f"TrailSync Monthly Report - {datetime.now().strftime('%B %Y')}",
            recipient=admin_email,
            body=report_html,
            is_html=True
        )
            
        return f"Generated monthly report and emailed to {admin_email}"

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
            writer.writerow(['User ID', 'Trek Name', 'Location', 'Booking Status', 'Dates'])
            for b in bookings:
                dates_str = f"{b.trek.start_date.strftime('%Y-%m-%d')} to {b.trek.end_date.strftime('%Y-%m-%d')}" if (b.trek.start_date and b.trek.end_date) else "N/A"
                writer.writerow([
                    user_id,
                    b.trek.name,
                    b.trek.location,
                    b.status,
                    dates_str
                ])
                
        body = f"""Hi {user.name},

As requested, we have generated your booking and trekking history CSV.
Please find the attached CSV file.

Best regards,
TrailSync Admin Team"""
        
        send_email_helper(
            subject="Your Trekking History CSV Export",
            recipient=email,
            body=body,
            attachment_path=csv_filepath
        )
            
        return f"Exported CSV for user {user_id} and emailed to {email}"

@celery_app.task
def send_staff_creation_email(staff_id, password):
    from backend.app import app
    from backend.models.models import User
    
    with app.app_context():
        staff = User.query.get(staff_id)
        if not staff:
            return f"Staff {staff_id} not found."
            
        body_html = f"""<!DOCTYPE html>
<html>
<head>
    <style>
        body {{ font-family: 'DM Sans', Arial, sans-serif; line-height: 1.6; color: #2d3748; padding: 10px; }}
        .container {{ max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px; background-color: #f7fafc; }}
        .header {{ background-color: #1a2e1a; color: #c8922a; padding: 20px; border-radius: 6px 6px 0 0; text-align: center; }}
        .header h2 {{ margin: 0; color: #c8922a; font-size: 1.5rem; font-weight: 700; }}
        .content {{ padding: 20px 15px; background-color: #ffffff; border-radius: 0 0 6px 6px; }}
        .footer {{ font-size: 0.8rem; text-align: center; color: #718096; margin-top: 20px; }}
        .credential-box {{ background-color: #f7fafc; border: 1px solid #edf2f7; padding: 15px; border-radius: 6px; margin: 15px 0; font-family: monospace; font-size: 0.95rem; }}
        .warning-text {{ color: #e53e3e; font-weight: bold; font-size: 0.95rem; margin: 15px 0; }}
        .cta-title {{ font-weight: 700; color: #1a2e1a; font-size: 1.05rem; margin-top: 20px; margin-bottom: 8px; }}
        .welcome-msg {{ font-size: 1.05rem; margin-bottom: 15px; }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h2>Welcome to TrailSync!</h2>
        </div>
        <div class="content">
            <p class="welcome-msg">Hi <strong>{staff.name}</strong>,</p>
            
            <p>Welcome to the TrailSync Trek Operations Team! We are thrilled to have you join our community of professional guides and outdoor leaders. Your expertise is what keeps our trekkers safe and inspired in the mountains.</p>
            
            <p>A staff account has been set up for you. Below are your temporary login details:</p>
            
            <div class="credential-box">
                <div><strong>Login Email:</strong> {staff.email}</div>
                <div><strong>Temporary Password:</strong> {password}</div>
            </div>
            
            <p class="warning-text">⚠️ IMPORTANT: This is a temporary password. Please log in and change your password immediately in your profile settings for account security.</p>
            
            <div class="cta-title">📋 Mandatory: Complete Your Guide Profile</div>
            <p>To become eligible for scheduling and getting assigned to upcoming trek batches, you must log in to your dashboard and complete your profile details (e.g. wilderness medical certifications, languages, guiding experience years, and core outdoor skills).</p>
            
            <p>If you have any questions, feel free to reply directly to this mail.</p>
            
            <p>Best regards,<br><strong>TrailSync Operations Desk</strong></p>
        </div>
        <div class="footer">
            &copy; 2026 TrailSync Trekking. All rights reserved.
        </div>
    </div>
</body>
</html>"""
        
        send_email_helper(
            subject="Welcome to the TrailSync Staff Team!",
            recipient=staff.email,
            body=body_html,
            is_html=True
        )
            
        return f"Sent welcome email to staff guide {staff.email}"
