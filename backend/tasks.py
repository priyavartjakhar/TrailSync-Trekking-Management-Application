# -*- coding: utf-8 -*-
"""
Celery Background Tasks Module
==============================

This module configures the Celery worker and Beat scheduler for the TrailSync
application and defines all asynchronous background jobs used throughout the
system. The tasks include scheduled notifications (daily reminders, monthly
reports, marketing campaigns) as well as on‑demand operations such as welcome
emails, CSV exports, and booking confirmations.

It supports sending emails, logs SMS status entries, and manages webhook alerts.
"""

import os
import csv
import smtplib
from datetime import datetime, date, timedelta
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.base import MIMEBase
from email import encoders
from celery import Celery
from celery.schedules import crontab
import json
import random
import urllib.request
import urllib.parse

# ---------------------------------------------------------------------------
# Celery application initialisation
# ---------------------------------------------------------------------------
broker_url = os.environ.get('CELERY_BROKER_URL', 'redis://localhost:6379/0')
result_backend = os.environ.get('CELERY_RESULT_BACKEND', broker_url)

celery_app = Celery(
    'backend.tasks',
    broker=broker_url,
    backend=result_backend
)

# ---------------------------------------------------------------------------
# Beat schedule – defines recurring tasks
# ---------------------------------------------------------------------------
celery_app.conf.beat_schedule = {
    'send-daily-reminders-every-day': {
        'task': 'backend.tasks.send_daily_reminders',
        'schedule': crontab(hour=9, minute=0),
    },
    'generate-monthly-report-every-month': {
        'task': 'backend.tasks.generate_monthly_report',
        'schedule': crontab(day_of_month=1, hour=9, minute=0),
    },
    'send-marketing-campaign-every-day': {
        'task': 'backend.tasks.send_marketing_campaign',
        'schedule': crontab(hour=11, minute=50),
    }
}
celery_app.conf.timezone = 'Asia/Kolkata'

# ---------------------------------------------------------------------------
# Helper functions for job run tracking (read/write JSON file)
# ---------------------------------------------------------------------------

def get_job_runs():
    """Read scheduled job execution records from ``scratch/job_runs.json``.

    Returns a list of job metadata dictionaries. If the file is missing or
    unreadable, a hard‑coded fallback list is provided.
    """
    filepath = os.path.join(os.path.dirname(__file__), '../scratch/job_runs.json')
    if os.path.exists(filepath):
        try:
            with open(filepath, 'r') as f:
                data = json.load(f)
                res = []
                for k, v in data.items():
                    if 'history' not in v:
                        v['history'] = []
                    res.append(v)
                return res
        except Exception:
            pass
    # Fallback defaults
    return [
        {'name': 'Daily Prep Reminders', 'schedule': 'Every day at 09:00', 'lastRun': '2026-06-10 09:00:00', 'status': 'Success', 'history': ['2026-06-10 09:00:00', '2026-06-09 09:00:00']},
        {'name': 'Monthly Activity Report', 'schedule': '1st of every month at 09:00', 'lastRun': '2026-06-01 09:00:00', 'status': 'Success', 'history': ['2026-06-01 09:00:00', '2026-05-01 09:00:00']},
        {'name': 'Daily Marketing Campaign', 'schedule': 'Every day at 11:50', 'lastRun': '2026-06-13 11:50:00', 'status': 'Success', 'history': ['2026-06-13 11:50:00', '2026-06-12 11:50:00']}
    ]

def update_job_run(name, status):
    """Update ``scratch/job_runs.json`` with the latest run timestamp and status.

    If the file does not exist, it is initialised with default job definitions.
    """
    filepath = os.path.join(os.path.dirname(__file__), '../scratch/job_runs.json')
    runs = {}
    if os.path.exists(filepath):
        try:
            with open(filepath, 'r') as f:
                runs = json.load(f)
        except Exception:
            pass
    if not runs:
        # Seed initial values
        runs = {
            'Daily Prep Reminders': {'name': 'Daily Prep Reminders', 'schedule': 'Every day at 09:00', 'lastRun': '2026-06-10 09:00:00', 'status': 'Success', 'history': ['2026-06-10 09:00:00', '2026-06-09 09:00:00']},
            'Monthly Activity Report': {'name': 'Monthly Activity Report', 'schedule': '1st of every month at 09:00', 'lastRun': '2026-06-01 09:00:00', 'status': 'Success', 'history': ['2026-06-01 09:00:00', '2026-05-01 09:00:00']},
            'Daily Marketing Campaign': {'name': 'Daily Marketing Campaign', 'schedule': 'Every day at 11:50', 'lastRun': '2026-06-13 11:50:00', 'status': 'Success', 'history': ['2026-06-13 11:50:00', '2026-06-12 11:50:00']}
        }
    timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    if name in runs:
        runs[name]['lastRun'] = timestamp
        runs[name]['status'] = status
        if 'history' not in runs[name]:
            runs[name]['history'] = []
        if status == 'Success':
            runs[name]['history'].append(timestamp)
            runs[name]['history'] = runs[name]['history'][-20:]
    else:
        runs[name] = {
            'name': name,
            'schedule': 'Every day at 11:50' if 'Marketing' in name else ('1st of every month at 09:00' if 'Monthly' in name else 'Every day at 09:00'),
            'lastRun': timestamp,
            'status': status,
            'history': [timestamp] if status == 'Success' else []
        }
    os.makedirs(os.path.dirname(filepath), exist_ok=True)
    try:
        with open(filepath, 'w') as f:
            json.dump(runs, f, indent=2)
    except Exception:
        pass

# ---------------------------------------------------------------------------
# Email helper – centralised SMTP sending with fallback to local file
# ---------------------------------------------------------------------------

def send_email_helper(subject, recipient, body, is_html=False, attachment_path=None):
    """Send an email via Gmail SMTP, optionally attaching a file.

    The function retries up to three times with exponential back‑off. If all
    attempts fail, the email content is written to a local fallback file under
    ``scratch/emails`` so that the message is not lost.
    """
    import time
    from email.utils import formataddr
    # TODO: Move credentials to environment variables before production deployment.
    sender_email = "23f2005399@ds.study.iitm.ac.in"
    sender_password = "fvmj mlwu aabm wmxq"  # Gmail App Password (placeholder)
    from_addr = formataddr(("TrailSync", sender_email))

    # Ensure fallback directory exists
    email_dir = os.path.join(os.path.dirname(__file__), '../scratch/emails')
    os.makedirs(email_dir, exist_ok=True)

    for attempt in range(1, 4):
        try:
            if attachment_path:
                msg = MIMEMultipart()
                msg["Subject"] = subject
                msg["From"] = from_addr
                msg["To"] = recipient
                body_part = MIMEText(body, 'html' if is_html else 'plain')
                msg.attach(body_part)
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
                msg = MIMEText(body, 'html' if is_html else 'plain')
                msg["Subject"] = subject
                msg["From"] = from_addr
                msg["To"] = recipient
            with smtplib.SMTP("smtp.gmail.com", 587, timeout=15) as server:
                server.ehlo()
                server.starttls()
                server.ehlo()
                server.login(sender_email, sender_password)
                server.send_message(msg)
            print(f"SMTP email sent successfully to {recipient} (attempt {attempt})")
            return True
        except Exception as e:
            print(f"SMTP send attempt {attempt}/3 failed for {recipient}: {e}")
            if attempt < 3:
                time.sleep(2 * attempt)  # exponential back‑off
    # All attempts failed – write to fallback file
    print(f"All SMTP attempts failed for {recipient}. Writing to fallback file...")
    timestamp = int(datetime.now().timestamp())
    file_ext = "html" if is_html else "txt"
    filepath = os.path.join(email_dir, f"fallback_{recipient}_{timestamp}.{file_ext}")
    attachment_info = f"\n[Attachment: {attachment_path}]\n" if attachment_path else ""
    content = f"Subject: {subject}\nTo: {recipient}\nDate: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n{attachment_info}\n{body}"
    with open(filepath, 'w') as f:
        f.write(content)
    return False

# ---------------------------------------------------------------------------
# Celery background tasks implementation
# ---------------------------------------------------------------------------

@celery_app.task
def send_daily_reminders(is_manual=False):
    """Send daily preparation reminder emails to trekkers with upcoming bookings.

    The task queries active bookings, builds a personalized HTML email for each
    user, logs a mock SMS entry, and optionally posts a Google Chat webhook.
    """
    from backend.app import app
    from backend.models.models import db, Booking, Trek
    update_job_run('Daily Prep Reminders', 'Running')
    try:
        with app.app_context():
            today = date.today()
            # Select active bookings for upcoming treks (starting today or later)
            bookings = db.session.query(Booking).join(Trek).filter(
                Trek.start_date >= today,
                Booking.status == 'Booked',
                (Booking.payment_status != 'Failed') | (Booking.payment_status == None)
            ).all()
            count = 0
            for b in bookings:
                user = b.user
                trek = b.trek
                days_left = (trek.start_date - today).days
                guide_name = trek.staff.name if trek.staff else "To Be Assigned"
                # Random tip/fact/gear for email content
                tip = random.choice([
                    "Stay hydrated: Drink at least 4-5 liters of water daily to prevent AMS (Acute Mountain Sickness).",
                    "Pace yourself: Walk at a slow, steady, and rhythmic pace. It's a trek, not a race.",
                    "Layer up: Keep your warm fleece and down jacket handy. Temperatures drop quickly in the shade and at night.",
                    "Protect from sun: Apply high SPF sunscreen and wear UV-protection sunglasses to avoid high-altitude sunburn.",
                    "Listen to your body: Report any headaches, dizziness, or nausea to your trek guide immediately."
                ])
                fact = random.choice([
                    "The Himalayas contain 9 of the 10 highest peaks on Earth, including Mount Everest.",
                    "Trekking increases cardiovascular strength and improves your mental well-being and stress levels.",
                    "At 3,000 meters above sea level, each breath contains about 30% less oxygen than at sea level.",
                    "Lichens, which are composite organisms, are among the few things that grow above 5,000 meters in the cold desert.",
                    "The air pressure at the peak of Mount Everest is only about one-third of the pressure at sea level."
                ])
                gear_item = random.choice([
                    "Trekking Poles: They reduce impact on your knees by up to 25% on steep descents.",
                    "Proper Hiking Boots: Make sure they are broken in before the trek to avoid painful blisters.",
                    "Headlamp: Essential for early morning summit climbs. Always carry spare batteries.",
                    "Dry Bags: Keep your extra clothes and electronics inside dry bags inside your backpack.",
                    "Reusable Water Bottle: Help protect pristine mountain trails by avoiding single-use plastics."
                ])
                # Build beautiful HTML email matching other emails sent
                body_html = f"""<!DOCTYPE html>
<html>
<head>
    <style>
        body {{ font-family: 'Outfit', 'DM Sans', Arial, sans-serif; line-height: 1.6; color: #2d3748; background-color: #f4f7f4; padding: 20px 10px; margin: 0; }}
        .email-container {{ max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05); border: 1px solid #e2e8f0; }}
        .header {{ background: linear-gradient(135deg, #1e3f20, #0f2411); padding: 35px 20px; text-align: center; color: #ffffff; }}
        .header h1 {{ margin: 0; font-size: 2.2rem; font-weight: 700; letter-spacing: -0.5px; color: #f3e5ab; }}
        .countdown-badge {{ display: inline-block; background-color: #c8922a; color: #ffffff; font-weight: bold; font-size: 1.1rem; padding: 8px 18px; border-radius: 50px; margin-top: 15px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }}
        .content {{ padding: 30px 25px; }}
        .welcome-msg {{ font-size: 1.15rem; font-weight: 600; color: #1e3f20; margin-top: 0; }}
        .trek-card {{ background-color: #f7faf7; border-left: 4px solid #c8922a; padding: 20px; border-radius: 6px; margin: 20px 0; }}
        .trek-title {{ font-size: 1.25rem; font-weight: 700; color: #1e3f20; margin-top: 0; margin-bottom: 8px; }}
        .trek-meta {{ font-size: 0.9rem; color: #4a5568; margin: 4px 0; }}
        .tips-grid {{ display: flex; flex-direction: column; gap: 15px; margin-top: 25px; }}
        .tip-box {{ background-color: #ffffff; border: 1px solid #edf2f7; padding: 15px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.02); }}
        .tip-title {{ font-weight: bold; color: #c8922a; margin-bottom: 4px; font-size: 0.95rem; text-transform: uppercase; letter-spacing: 0.5px; }}
        .tip-text {{ font-size: 0.9rem; color: #4d5d4d; margin: 0; }}
        .footer {{ background-color: #f7faf7; padding: 20px; text-align: center; font-size: 0.8rem; color: #718096; border-top: 1px solid #edf2f7; }}
        .footer p {{ margin: 5px 0; }}
    </style>
</head>
<body>
    <div class="email-container">
        <div class="header">
            <h1>TrailSync Countdown</h1>
            <div class="countdown-badge">⏳ {days_left} Days to Adventure!</div>
        </div>
        <div class="content">
            <p class="welcome-msg">Hi {user.name},</p>
            <p>Your upcoming wilderness trek is just around the corner! Get ready to step into the wild and experience breathtaking sights.</p>
            
            <div class="trek-card">
                <div class="trek-title">{trek.name}</div>
                <div class="trek-meta"><strong>📍 Location:</strong> {trek.location}</div>
                <div class="trek-meta"><strong>📅 Start Date:</strong> {trek.start_date.strftime('%A, %B %d, %Y')}</div>
                <div class="trek-meta"><strong>🧭 Duration:</strong> {trek.duration} Days</div>
                <div class="trek-meta"><strong>🥾 Guide Assigned:</strong> {guide_name}</div>
            </div>
            
            <h3>💡 Daily Preparation Spotlight:</h3>
            <div class="tips-grid">
                <div class="tip-box">
                    <div class="tip-title">⛰️ Acclimatization & Safety Tip</div>
                    <p class="tip-text">{tip}</p>
                </div>
                <div class="tip-box">
                    <div class="tip-title">🎒 Gear Spotlight</div>
                    <p class="tip-text">{gear_item}</p>
                </div>
                <div class="tip-box">
                    <div class="tip-title">🧐 Mountain Fun Fact</div>
                    <p class="tip-text">{fact}</p>
                </div>
            </div>
            
            <p style="margin-top: 25px;">Please verify your health condition, pack your mandatory layers, and coordinate with your guide if you have any questions before departure.</p>
            
            <p>Happy trails,<br><strong>TrailSync Operations Team</strong></p>
        </div>
        <div class="footer">
            <p>This is an automated reminder email for your active booking #{b.id}.</p>
            <p>&copy; 2026 TrailSync Inc. All rights reserved.</p>
        </div>
    </div>
</body>
</html>"""
                send_email_helper(
                    subject=f"Trek Countdown: {days_left} days left for {trek.name}!",
                    recipient=user.email,
                    body=body_html,
                    is_html=True
                )
                # Log SMS draft
                sms_log_path = os.path.join(os.path.dirname(__file__), '../scratch/emails/sms_log.txt')
                os.makedirs(os.path.dirname(sms_log_path), exist_ok=True)
                sms_content = f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] SMS Sent to {user.phone or 'N/A'}: Hey {user.name}, only {days_left} days left until your trek {trek.name} starts on {trek.start_date}! Prepare your gear."
                with open(sms_log_path, 'a') as f_sms:
                    f_sms.write(sms_content + "\n")
                # Optional G-Chat webhook
                gchat_url = os.environ.get('GCHAT_WEBHOOK_URL')
                webhook_msg = {
                    "text": f"🏔️ *Upcoming Trek Countdown Reminder* 🏔️\n\nHello *{user.name}*, your trek *{trek.name}* is starting in *{days_left}* days!\n📅 *Start Date:* {trek.start_date.strftime('%Y-%m-%d')}\n📍 *Location:* {trek.location}\n💡 *Tip:* {tip}\n🏕️ *Fun Fact:* {fact}\n🎒 *Gear Spotlight:* {gear_item}"
                }
                webhook_payload = json.dumps(webhook_msg).encode('utf-8')
                gchat_log_path = os.path.join(os.path.dirname(__file__), '../scratch/emails/gchat_webhooks.log')
                os.makedirs(os.path.dirname(gchat_log_path), exist_ok=True)
                log_entry = f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] User: {user.email} | Trek: {trek.name} | Payload: {json.dumps(webhook_msg)}\n"
                with open(gchat_log_path, 'a') as f_log:
                    f_log.write(log_entry)
                if gchat_url:
                    try:
                        req = urllib.request.Request(
                            gchat_url,
                            data=webhook_payload,
                            headers={'Content-Type': 'application/json; charset=UTF-8'},
                            method='POST'
                        )
                        with urllib.request.urlopen(req, timeout=5):
                            pass
                    except Exception as e:
                        print(f"Failed to post to G-Chat webhook: {e}")
                count += 1
            update_job_run('Daily Prep Reminders', 'Success')
            return f"Dispatched {count} daily reminders."
    except Exception as e:
        update_job_run('Daily Prep Reminders', 'Failed')
        raise e

@celery_app.task
def send_welcome_email(user_id):
    """Send a welcome email to a newly registered user with curated trek suggestions.
    """
    from backend.app import app
    from backend.models.models import db, User, Trek
    with app.app_context():
        user = User.query.get(user_id)
        if not user:
            return f"User {user_id} not found."
        today = date.today()
        recommended_treks = Trek.query.filter_by(status='Open').filter(
            Trek.start_date > today
        ).order_by(Trek.start_date.asc()).limit(3).all()
        if len(recommended_treks) < 3:
            more_treks = Trek.query.filter(Trek.id.notin_([t.id for t in recommended_treks])).limit(3 - len(recommended_treks)).all()
            recommended_treks.extend(more_treks)
        trek_cards_html = ""
        for t in recommended_treks:
            price_str = f"₹{t.price:,}"
            start_date_str = t.start_date.strftime('%b %d, %Y') if t.start_date else 'N/A'
            trek_cards_html += f"""
            <div class=\"trek-item\" style=\"border: 1px solid #edf2f7; border-radius: 8px; padding: 15px; margin-bottom: 15px; background-color: #ffffff;\">\n<h4 style=\"margin: 0 0 5px 0; color: #1e3f20; font-size: 1.1rem;\">{t.name}</h4>\n<p style=\"margin: 3px 0; font-size: 0.88rem; color: #4a5568;\"><strong>📍 Location:</strong> {t.location} | <strong>🧭 Duration:</strong> {t.duration} Days</p>\n<p style=\"margin: 3px 0; font-size: 0.88rem; color: #4a5568;\"><strong>📅 Starts:</strong> {start_date_str} | <strong>Difficulty:</strong> {t.difficulty}</p>\n<div style=\"margin-top: 10px; display: flex; justify-content: space-between; align-items: center;\"><span style=\"font-weight: 700; color: #c8922a; font-size: 1.05rem;\">{price_str}</span>\n<a href=\"/trek/{t.id}\" style=\"background-color: #1e3f20; color: #ffffff; text-decoration: none; padding: 5px 12px; border-radius: 4px; font-size: 0.82rem; font-weight: 600;\">View Details</a>\n</div></div>\n"""
        body_html = f"""<!DOCTYPE html>
<html>
<head>
    <style>
        body {{ font-family: 'Outfit', 'DM Sans', Arial, sans-serif; line-height: 1.6; color: #2d3748; background-color: #f4f7f4; padding: 20px 10px; margin: 0; }}
        .email-container {{ max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05); border: 1px solid #e2e8f0; }}
        .header {{ background: linear-gradient(135deg, #1e3f20, #0f2411); padding: 35px 20px; text-align: center; color: #ffffff; }}
        .header h1 {{ margin: 0; font-size: 2.2rem; font-weight: 700; letter-spacing: -0.5px; color: #f3e5ab; }}
        .content {{ padding: 30px 25px; }}
        .welcome-msg {{ font-size: 1.15rem; font-weight: 600; color: #1e3f20; margin-top: 0; }}
        .trek-list {{ margin-top: 20px; }}
        .footer {{ background-color: #f7faf7; padding: 20px; text-align: center; font-size: 0.8rem; color: #718096; border-top: 1px solid #edf2f7; }}
        .footer p {{ margin: 5px 0; }}
    </style>
</head>
<body>
    <div class="email-container">
        <div class="header">
            <h1>Welcome to TrailSync!</h1>
        </div>
        <div class="content">
            <p class="welcome-msg">Hi {user.name},</p>
            <p>Welcome to TrailSync! Your mountain adventure awaits 🏔️</p>
            <p>Ready to start your journey? Log in to your dashboard to complete your medical profile, explore more destinations, and book your next adventure.</p>
            
            <h3 style="color: #1e3f20; border-bottom: 2px solid #edf2f7; padding-bottom: 8px; margin-top: 25px;">🏔️ Recommended Treks for You</h3>
            <div class="trek-list">
                {trek_cards_html}
            </div>
            
            <p style="margin-top: 25px;">See you on the trail,<br><strong>The TrailSync Team</strong></p>
        </div>
        <div class="footer">
            <p>You received this email because you registered an account on TrailSync.</p>
            <p>&copy; 2026 TrailSync Trekking. All rights reserved.</p>
        </div>
    </div>
</body>
</html>"""
        send_email_helper(
            subject="Welcome to TrailSync! Your mountain adventure awaits 🏔️",
            recipient=user.email,
            body=body_html,
            is_html=True
        )
        return f"Welcome email sent to {user.email} with {len(recommended_treks)} recommended treks."

@celery_app.task
def generate_monthly_report(is_manual=False):
    """Generate a monthly activity report and email it to the admin.
    """
    from backend.app import app
    from backend.models.models import db, Booking, Trek, User
    from xhtml2pdf import pisa
    update_job_run('Monthly Activity Report', 'Running')
    try:
        with app.app_context():
            today = date.today()
            if is_manual or today.day != 1:
                start_date = date(today.year, today.month, 1)
                end_date = today
                report_type_label = "Real-time (Up to Current Date/Time)"
            else:
                first_of_this_month = date(today.year, today.month, 1)
                last_day_of_prev_month = first_of_this_month - timedelta(days=1)
                start_date = date(last_day_of_prev_month.year, last_day_of_prev_month.month, 1)
                end_date = last_day_of_prev_month
                report_type_label = "Automated Monthly Summary"
            
            start_datetime = datetime.combine(start_date, datetime.min.time())
            end_datetime = datetime.combine(end_date, datetime.max.time())
            
            # 1. Number of treks conducted: 1 batch = 1 trek, when batch is completed
            conducted_treks = Trek.query.filter(
                Trek.status == 'Completed',
                Trek.start_date.between(start_date, end_date)
            ).all()
            conducted_treks_count = len(conducted_treks)
            
            # 2. Number of users participated: total participants across completed treks this month
            total_participants = 0
            for t in conducted_treks:
                trekkers_count = db.session.query(Booking).filter(
                    Booking.trek_id == t.id,
                    Booking.status.in_(['Booked', 'Completed']),
                    (Booking.payment_status != 'Failed') | (Booking.payment_status == None)
                ).count()
                total_participants += trekkers_count
            
            # 3. Bookings made this month for ranking and revenue
            bookings_this_month = db.session.query(Booking).filter(
                Booking.booked_on.between(start_datetime, end_datetime),
                Booking.status.in_(['Booked', 'Completed']),
                (Booking.payment_status != 'Failed') | (Booking.payment_status == None)
            ).all()
            
            # Total Revenue: total of amount_paid of bookings made this month
            total_revenue = db.session.query(db.func.sum(Booking.amount_paid)).filter(
                Booking.booked_on.between(start_datetime, end_datetime),
                Booking.status.in_(['Booked', 'Completed']),
                (Booking.payment_status != 'Failed') | (Booking.payment_status == None)
            ).scalar() or 0
            
            # Popular treks ranking based on bookings of this month
            popular_treks_dict = {}
            for b in bookings_this_month:
                if b.trek and b.trek.route:
                    key = f"{b.trek.route.trek_code} - {b.trek.name}"
                elif b.trek:
                    key = b.trek.name
                else:
                    key = "Unknown Trek"
                popular_treks_dict[key] = popular_treks_dict.get(key, 0) + 1
            
            popular_treks_ranked = sorted(popular_treks_dict.items(), key=lambda x: x[1], reverse=True)
            
            popular_treks_html = ""
            for rank, (trek_info, count) in enumerate(popular_treks_ranked, 1):
                popular_treks_html += f"""
                <div class="list-item">
                    <span class="rank-badge">#{rank}</span>
                    <strong>{trek_info}</strong> — {count} booking{'s' if count > 1 else ''} this month
                </div>"""
            if not popular_treks_ranked:
                popular_treks_html = '<div class="list-item" style="text-align: center; color: #718096;">No bookings recorded for this month.</div>'
                
            # 4. Table including: batch id; start date; total trekkers; assigned staff
            conducted_treks_rows = ""
            for t in conducted_treks:
                trekkers_count = db.session.query(Booking).filter(
                    Booking.trek_id == t.id,
                    Booking.status.in_(['Booked', 'Completed']),
                    (Booking.payment_status != 'Failed') | (Booking.payment_status == None)
                ).count()
                staff_name = t.staff.name if t.staff else "To Be Assigned"
                batch_id = t.batch_code or f"TID{t.id:03d}B01"
                start_date_str = t.start_date.strftime('%Y-%m-%d') if t.start_date else 'N/A'
                conducted_treks_rows += f"""
                <tr>
                    <td style="font-family: monospace; font-weight: bold;">{batch_id}</td>
                    <td>{start_date_str}</td>
                    <td align="center">{trekkers_count}</td>
                    <td>{staff_name}</td>
                </tr>"""
            if not conducted_treks:
                conducted_treks_rows = """
                <tr>
                    <td colspan="4" align="center" style="color: #718096; font-style: italic;">No conducted treks recorded for this period.</td>
                </tr>"""
                
            # 5. New registered users/trekkers count
            new_users = User.query.filter(
                User.registered_at.between(start_datetime, end_datetime),
                User.role == 'user'
            ).count()
            
            # Render HTML report template
            report_html = f"""<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>TrailSync Monthly Report</title>
    <style>
        body {{
            font-family: 'Outfit', 'DM Sans', Arial, sans-serif;
            line-height: 1.6;
            color: #2d3748;
            background-color: #f4f7f4;
            margin: 0;
            padding: 20px 10px;
        }}
        .container {{
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 12px;
            overflow: hidden;
            border: 1px solid #e2e8f0;
        }}
        .header {{
            background: linear-gradient(135deg, #1e3f20, #0f2411);
            padding: 30px 20px;
            text-align: center;
            color: #ffffff;
        }}
        .header h1 {{
            margin: 0;
            font-size: 1.8rem;
            font-weight: 700;
            color: #f3e5ab;
        }}
        .header p {{
            margin: 5px 0 0 0;
            color: #c8922a;
            font-weight: bold;
            font-size: 0.95rem;
        }}
        .content {{
            padding: 25px 20px;
        }}
        .section-title {{
            color: #1e3f20;
            border-bottom: 2px solid #e2e8f0;
            padding-bottom: 6px;
            margin-top: 25px;
            margin-bottom: 15px;
            font-size: 1.15rem;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }}
        .kpi-table {{
            width: 100%;
            border-collapse: collapse;
            margin: 15px 0;
        }}
        .kpi-card {{
            background-color: #f7faf7;
            border: 1px solid #edf2f7;
            padding: 12px 6px;
            border-radius: 8px;
            text-align: center;
        }}
        .kpi-val {{
            font-size: 1.25rem;
            font-weight: bold;
            color: #1e3f20;
            margin-bottom: 2px;
        }}
        .kpi-lbl {{
            font-size: 0.7rem;
            color: #718096;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }}
        .list-item {{
            padding: 10px;
            border-bottom: 1px solid #edf2f7;
            font-size: 0.9rem;
        }}
        .list-item:last-child {{
            border-bottom: none;
        }}
        .rank-badge {{
            display: inline-block;
            background-color: #c8922a;
            color: #ffffff;
            font-weight: bold;
            font-size: 0.78rem;
            padding: 2px 8px;
            border-radius: 12px;
            margin-right: 8px;
        }}
        .report-table {{
            width: 100%;
            border-collapse: collapse;
            margin-top: 10px;
            font-size: 0.85rem;
        }}
        .report-table th {{
            background-color: #1e3f20;
            color: #ffffff;
            text-align: left;
            padding: 8px;
            font-weight: 600;
            border: 1px solid #edf2f7;
        }}
        .report-table td {{
            padding: 8px;
            border: 1px solid #edf2f7;
        }}
        .report-table tr:nth-child(even) {{
            background-color: #f7faf7;
        }}
        .footer {{
            background-color: #f7faf7;
            padding: 15px 20px;
            text-align: center;
            font-size: 0.75rem;
            color: #718096;
            border-top: 1px solid #edf2f7;
        }}
        .footer p {{
            margin: 4px 0;
        }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>TrailSync Monthly Report</h1>
            <p>{start_date.strftime('%B %d, %Y')} to {end_date.strftime('%B %d, %Y')}</p>
        </div>
        <div class="content">
            <p style="font-size: 0.95rem; margin-top: 0;">Hello Admin,</p>
            <p style="font-size: 0.92rem;">The monthly trekking operations and activity report has been compiled. Below is the summary for the current period.</p>
            
            <div class="section-title">📊 Key Metrics</div>
            <table class="kpi-table" cellpadding="0" cellspacing="5">
                <tr>
                    <td width="25%">
                        <div class="kpi-card">
                            <div class="kpi-val">{conducted_treks_count}</div>
                            <div class="kpi-lbl">Treks Conducted</div>
                        </div>
                    </td>
                    <td width="25%">
                        <div class="kpi-card">
                            <div class="kpi-val">{total_participants}</div>
                            <div class="kpi-lbl">Total Bookings</div>
                        </div>
                    </td>
                    <td width="25%">
                        <div class="kpi-card">
                            <div class="kpi-val">+{new_users}</div>
                            <div class="kpi-lbl">New Trekkers Registered</div>
                        </div>
                    </td>
                    <td width="25%">
                        <div class="kpi-card">
                            <div class="kpi-val">₹{total_revenue:,}</div>
                            <div class="kpi-lbl">Total Revenue</div>
                        </div>
                    </td>
                </tr>
            </table>
            
            <div class="section-title">🔥 Popular Treks (Ranked)</div>
            <div style="background-color: #f7faf7; border-radius: 8px; border: 1px solid #edf2f7; padding: 5px 10px; margin-bottom: 20px;">
                {popular_treks_html}
            </div>
            
            <div class="section-title">🧭 Conducted Treks Registry</div>
            <table class="report-table">
                <thead>
                  <tr>
                    <th>Batch ID</th>
                    <th>Start Date</th>
                    <th>Total Trekkers</th>
                    <th>Assigned Staff</th>
                  </tr>
                </thead>
                <tbody>
                  {conducted_treks_rows}
                </tbody>
            </table>
        </div>
        <div class="footer">
            <p>Generated automatically on {datetime.now().strftime('%Y-%m-%d %H:%M:%S')} ({report_type_label}).</p>
            <p>&copy; 2026 TrailSync. All rights reserved.</p>
        </div>
    </div>
</body>
</html>"""
            
            # Generate PDF using xhtml2pdf
            pdf_dir = os.path.join(os.path.dirname(__file__), '../scratch/reports')
            os.makedirs(pdf_dir, exist_ok=True)
            pdf_filename = f"monthly_report_{int(datetime.now().timestamp())}.pdf"
            pdf_path = os.path.join(pdf_dir, pdf_filename)
            
            with open(pdf_path, "wb") as pdf_file:
                pisa_status = pisa.CreatePDF(report_html, dest=pdf_file)
                
            admin_email = "jakharpriyavart@gmail.com"
            send_email_helper(
                subject=f"TrailSync Monthly Report - {start_date.strftime('%B %Y')}",
                recipient=admin_email,
                body=report_html,
                is_html=True,
                attachment_path=pdf_path
            )
            
            # Save HTML locally too
            report_dir = os.path.join(os.path.dirname(__file__), '../scratch/emails')
            os.makedirs(report_dir, exist_ok=True)
            report_path = os.path.join(report_dir, f"monthly_report_{int(datetime.now().timestamp())}.html")
            with open(report_path, 'w') as f_out:
                f_out.write(report_html)
                
            update_job_run('Monthly Activity Report', 'Success')
            return f"Generated monthly report and emailed to {admin_email} with PDF attached."
    except Exception as e:
        update_job_run('Monthly Activity Report', 'Failed')
        raise e

@celery_app.task
def send_marketing_campaign(is_manual=False):
    """Send a daily marketing campaign email to all regular users.
    """
    from backend.app import app
    from backend.models.models import db, User, Trek
    update_job_run('Daily Marketing Campaign', 'Running')
    try:
        with app.app_context():
            users = User.query.filter_by(role='user').all()
            upcoming_treks = Trek.query.filter(
                Trek.start_date > date.today(),
                Trek.status == 'Open'
            ).order_by(Trek.start_date.asc()).limit(3).all()
            if len(upcoming_treks) < 3:
                more = Trek.query.filter(
                    Trek.start_date > date.today(),
                    Trek.id.notin_([t.id for t in upcoming_treks])
                ).limit(3 - len(upcoming_treks)).all()
                upcoming_treks.extend(more)
            
            trek_items_html = ""
            for t in upcoming_treks:
                price_str = f"₹{t.price:,}"
                start_date_str = t.start_date.strftime('%b %d, %Y') if t.start_date else 'N/A'
                trek_items_html += f"""
                <div class="trek-item" style="border: 1px solid #edf2f7; border-radius: 8px; padding: 15px; margin-bottom: 15px; background-color: #ffffff;">
                    <h4 style="margin: 0 0 5px 0; color: #1e3f20; font-size: 1.1rem;">{t.name}</h4>
                    <p style="margin: 3px 0; font-size: 0.88rem; color: #4a5568;"><strong>📍 Location:</strong> {t.location} | <strong>🧭 Duration:</strong> {t.duration} Days</p>
                    <p style="margin: 3px 0; font-size: 0.88rem; color: #4a5568;"><strong>📅 Starts:</strong> {start_date_str} | <strong>Difficulty:</strong> {t.difficulty}</p>
                    <div style="margin-top: 10px; display: flex; justify-content: space-between; align-items: center;">
                        <span style="font-weight: 700; color: #c8922a; font-size: 1.05rem;">{price_str}</span>
                        <a href="/trek/{t.id}" style="background-color: #1e3f20; color: #ffffff; text-decoration: none; padding: 5px 12px; border-radius: 4px; font-size: 0.82rem; font-weight: 600;">View Details</a>
                    </div>
                </div>
                """
                
            newsletter_template = f"""<!DOCTYPE html>
<html>
<head>
    <style>
        body {{ font-family: 'Outfit', 'DM Sans', Arial, sans-serif; line-height: 1.6; color: #2d3748; background-color: #f4f7f4; padding: 20px 10px; margin: 0; }}
        .email-container {{ max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05); border: 1px solid #e2e8f0; }}
        .header {{ background: linear-gradient(135deg, #1e3f20, #0f2411); padding: 35px 20px; text-align: center; color: #ffffff; }}
        .header h1 {{ margin: 0; font-size: 2.2rem; font-weight: 700; letter-spacing: -0.5px; color: #f3e5ab; }}
        .content {{ padding: 30px 25px; }}
        .welcome-msg {{ font-size: 1.15rem; font-weight: 600; color: #1e3f20; margin-top: 0; }}
        .promo-box {{ background-color: #fcf8e3; border: 2px dashed #c8922a; padding: 15px; border-radius: 8px; text-align: center; margin: 20px 0; }}
        .promo-title {{ font-size: 0.9rem; color: #8a6d3b; text-transform: uppercase; letter-spacing: 1px; font-weight: bold; margin-bottom: 5px; }}
        .promo-code {{ font-size: 1.6rem; font-weight: 800; color: #c8922a; letter-spacing: 2px; }}
        .section-header {{ font-size: 1.25rem; font-weight: 700; color: #1e3f20; border-bottom: 2px solid #edf2f7; padding-bottom: 8px; margin-top: 30px; margin-bottom: 20px; }}
        .footer {{ background-color: #f7faf7; padding: 20px; text-align: center; font-size: 0.8rem; color: #718096; border-top: 1px solid #edf2f7; }}
        .footer p {{ margin: 5px 0; }}
    </style>
</head>
<body>
    <div class="email-container">
        <div class="header">
            <h1>TrailSync Explorer</h1>
        </div>
        <div class="content">
            <p class="welcome-msg">Hi {{name}},</p>
            <p>Adventure awaits! Discover our handpicked list of upcoming wilderness treks. Use our exclusive launch promo code below for a special discount on your next booking.</p>
            
            <div class="promo-box">
                <div class="promo-title">Use Promo Code For 10% Off:</div>
                <div class="promo-code">FIRSTTRAIL10</div>
            </div>
            
            <div class="section-header">🏔&nbsp;&nbsp;Recommended Treks for You</div>
            <div class="trek-list">
                {trek_items_html}
            </div>
            
            <p style="margin-top: 25px;">Ready to start your journey? Log in to your dashboard to complete your medical profile, explore more destinations, and book your next adventure.</p>
            
            <p>See you on the trail,<br><strong>The TrailSync Team</strong></p>
        </div>
        <div class="footer">
            <p>You received this email because you registered an account on TrailSync.</p>
            <p>&copy; 2026 TrailSync Trekking. All rights reserved.</p>
        </div>
    </div>
</body>
</html>"""
            count = 0
            for u in users:
                user_html = newsletter_template.replace("{name}", u.name)
                send_email_helper(
                    subject="TrailSync Explorer: Discover Upcoming Wilderness Treks! 🥾",
                    recipient=u.email,
                    body=user_html,
                    is_html=True
                )
                count += 1
            update_job_run('Daily Marketing Campaign', 'Success')
            return f"Marketing campaign sent to {count} users."
    except Exception as e:
        update_job_run('Daily Marketing Campaign', 'Failed')
        raise e

@celery_app.task
def send_test_user_welcome(recipient_email):
    """Send a test welcome email to a user (used by admins for verification)."""
    from backend.app import app
    from backend.models.models import Trek
    with app.app_context():
        today = date.today()
        recommended_treks = Trek.query.filter_by(status='Open').filter(Trek.start_date > today).order_by(Trek.start_date.asc()).limit(3).all()
        if len(recommended_treks) < 3:
            more_treks = Trek.query.limit(3).all()
            recommended_treks = list(set(recommended_treks + more_treks))[:3]
        trek_cards_html = ""
        for t in recommended_treks:
            price_str = f"₹{t.price:,}"
            start_date_str = t.start_date.strftime('%b %d, %Y') if t.start_date else 'N/A'
            trek_cards_html += f"""
            <div class=\"trek-item\" style=\"border: 1px solid #edf2f7; border-radius: 8px; padding: 15px; margin-bottom: 15px; background-color: #ffffff;\">\n<h4 style=\"margin: 0 0 5px 0; color: #1e3f20; font-size: 1.1rem;\">{t.name}</h4>\n<p style=\"margin: 3px 0; font-size: 0.88rem; color: #4a5568;\"><strong>📍 Location:</strong> {t.location} | <strong>🧭 Duration:</strong> {t.duration} Days</p>\n<p style=\"margin: 3px 0; font-size: 0.88rem; color: #4a5568;\"><strong>📅 Starts:</strong> {start_date_str} | <strong>Difficulty:</strong> {t.difficulty}</p>\n<div style=\"margin-top: 10px; display: flex; justify-content: space-between; align-items: center;\"><span style=\"font-weight: 700; color: #c8922a; font-size: 1.05rem;\">{price_str}</span>\n<a href=\"http://localhost:8000\" style=\"background-color: #1e3f20; color: #ffffff; text-decoration: none; padding: 5px 12px; border-radius: 4px; font-size: 0.82rem; font-weight: 600;\">View Details</a>\n</div></div>\n"""
        body_html = f"""<!DOCTYPE html>
<html>
<head>
    <style>
        body {{ font-family: 'Outfit', 'DM Sans', Arial, sans-serif; line-height: 1.6; color: #2d3748; background-color: #f4f7f4; padding: 20px 10px; margin: 0; }}
        .email-container {{ max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05); border: 1px solid #e2e8f0; }}
        .header {{ background: linear-gradient(135deg, #1e3f20, #0f2411); padding: 35px 20px; text-align: center; color: #ffffff; }}
        .header h1 {{ margin: 0; font-size: 2.2rem; font-weight: 700; letter-spacing: -0.5px; color: #f3e5ab; }}
        .content {{ padding: 30px 25px; }}
        .welcome-msg {{ font-size: 1.15rem; font-weight: 600; color: #1e3f20; margin-top: 0; }}
        .trek-list {{ margin-top: 20px; }}
        .footer {{ background-color: #f7faf7; padding: 20px; text-align: center; font-size: 0.8rem; color: #718096; border-top: 1px solid #edf2f7; }}
        .footer p {{ margin: 5px 0; }}
    </style>
</head>
<body>
    <div class="email-container">
        <div class="header">
            <h1>Welcome to TrailSync!</h1>
        </div>
        <div class="content">
            <p class="welcome-msg">Hi Explorer,</p>
            <p>Welcome to TrailSync! Your mountain adventure awaits 🏔️</p>
            <p>Ready to start your journey? Log in to your dashboard to complete your medical profile, explore more destinations, and book your next adventure.</p>
            
            <h3 style="color: #1e3f20; border-bottom: 2px solid #edf2f7; padding-bottom: 8px; margin-top: 25px;">🏔️ Recommended Treks for You</h3>
            <div class="trek-list">
                {trek_cards_html}
            </div>
            
            <p style="margin-top: 25px;">See you on the trail,<br><strong>The TrailSync Team</strong></p>
        </div>
        <div class="footer">
            <p>You received this email because you registered an account on TrailSync.</p>
            <p>&copy; 2026 TrailSync Trekking. All rights reserved.</p>
        </div>
    </div>
</body>
</html>"""
        send_email_helper(
            subject="Welcome to TrailSync! Your mountain adventure awaits 🏔️",
            recipient=recipient_email,
            body=body_html,
            is_html=True
        )
        return f"Test user welcome email sent to {recipient_email}."

@celery_app.task
def send_test_staff_welcome(recipient_email):
    """Send a test welcome email to a staff (guide) account."""
    body_html = f"""<!DOCTYPE html>
<html>
<head>
    <style>
        body {{ font-family: 'Outfit', 'DM Sans', Arial, sans-serif; line-height: 1.6; color: #2d3748; background-color: #f4f7f4; padding: 20px 10px; margin: 0; }}
        .email-container {{ max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05); border: 1px solid #e2e8f0; }}
        .header {{ background: linear-gradient(135deg, #1e3f20, #0f2411); padding: 35px 20px; text-align: center; color: #ffffff; }}
        .header h1 {{ margin: 0; font-size: 2.2rem; font-weight: 700; letter-spacing: -0.5px; color: #f3e5ab; }}
        .content {{ padding: 30px 25px; }}
        .welcome-msg {{ font-size: 1.15rem; font-weight: 600; color: #1e3f20; margin-top: 0; }}
        .credentials-box {{ background-color: #f7faf7; border: 1px solid #e2e8f0; border-left: 4px solid #1e3f20; padding: 20px; border-radius: 8px; margin: 20px 0; }}
        .cred-label {{ font-size: 0.9rem; color: #4a5568; font-weight: bold; margin-bottom: 2px; }}
        .cred-value {{ font-family: monospace; font-size: 1.1rem; color: #1e3f20; font-weight: bold; margin-bottom: 12px; word-break: break-all; }}
        .cred-value:last-child {{ margin-bottom: 0; }}
        .warning-box {{ background-color: #fffaf0; border: 1px solid #feebc8; border-left: 4px solid #dd6b20; padding: 15px; border-radius: 8px; margin: 20px 0; color: #c05621; font-size: 0.95rem; }}
        .instruction-box {{ background-color: #f7faf7; border: 1px solid #e2e8f0; border-left: 4px solid #c8922a; padding: 20px; border-radius: 8px; margin: 20px 0; }}
        .instruction-title {{ font-weight: bold; color: #1e3f20; margin-bottom: 8px; }}
        .footer {{ background-color: #f7faf7; padding: 20px; text-align: center; font-size: 0.8rem; color: #718096; border-top: 1px solid #edf2f7; }}
        .footer p {{ margin: 5px 0; }}
    </style>
</head>
<body>
    <div class="email-container">
        <div class="header">
            <h1>Welcome to TrailSync!</h1>
        </div>
        <div class="content">
            <p class="welcome-msg">Hi test,</p>
            <p>Welcome to the TrailSync Trek Staff Team! We are thrilled to have you join our community of professional guides and outdoor leaders. Your expertise is what keeps our trekkers safe and inspired in the mountains.</p>
            <p>A staff account has been set up for you. Below are your temporary login details:</p>
            
            <div class="credentials-box">
                <div class="cred-label">Login Email:</div>
                <div class="cred-value">{recipient_email}</div>
                <div class="cred-label">Temporary Password:</div>
                <div class="cred-value" style="letter-spacing: 1px;">Trailsync@123</div>
            </div>
            
            <div class="warning-box">
                <strong>⚠️ IMPORTANT:</strong> This is a temporary password. Please log in and change your password immediately in your profile settings for account security.
            </div>
            
            <div class="instruction-box">
                <div class="instruction-title">📋 Mandatory: Complete Your Guide Profile</div>
                <p style="margin: 0; font-size: 0.95rem; color: #4a5568;">To become eligible for scheduling and getting assigned to upcoming trek batches, you must log in to your dashboard and complete your profile details (e.g. wilderness medical certifications, languages, guiding experience years, and core outdoor skills).</p>
            </div>
            
            <p style="margin-top: 25px;">If you have any questions, feel free to reply directly to this mail.</p>
            
            <p>Best regards,<br><strong>TrailSync Operations Desk</strong></p>
        </div>
        <div class="footer">
            <p>&copy; 2026 TrailSync Trekking. All rights reserved.</p>
        </div>
    </div>
</body>
</html>"""
    send_email_helper(
        subject="Welcome to the TrailSync Staff Team! 🏔️",
        recipient=recipient_email,
        body=body_html,
        is_html=True
    )
    return f"Test staff welcome email sent to {recipient_email}."

@celery_app.task
def export_booking_history_csv(user_id, email):
    """Export a user's booking history to CSV and email the file to the provided address."""
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
        with open(csv_filepath, 'w', newline='') as csvfile:
            writer = csv.writer(csvfile)
            writer.writerow(['User ID', 'Trek Name', 'Location', 'Booking Status', 'Dates'])
            for b in bookings:
                dates_str = f"{b.trek.start_date.strftime('%Y-%m-%d')} to {b.trek.end_date.strftime('%Y-%m-%d')}" if (b.trek.start_date and b.trek.end_date) else "N/A"
                writer.writerow([user_id, b.trek.name, b.trek.location, b.status, dates_str])
        body = f"Hi {user.name},\n\nAs requested, we have generated your booking and trekking history CSV. Please find the attached file.\n\nBest regards,\nTrailSync Admin Team"
        send_email_helper(
            subject="Your Trekking History CSV Export",
            recipient=email,
            body=body,
            attachment_path=csv_filepath
        )
        return f"Exported CSV for user {user_id} and emailed to {email}"

@celery_app.task
def send_staff_creation_email(staff_id, password):
    """Notify a newly created staff member of their login credentials."""
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
        body {{ font-family: 'Outfit', 'DM Sans', Arial, sans-serif; line-height: 1.6; color: #2d3748; background-color: #f4f7f4; padding: 20px 10px; margin: 0; }}
        .email-container {{ max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05); border: 1px solid #e2e8f0; }}
        .header {{ background: linear-gradient(135deg, #1e3f20, #0f2411); padding: 35px 20px; text-align: center; color: #ffffff; }}
        .header h1 {{ margin: 0; font-size: 2.2rem; font-weight: 700; letter-spacing: -0.5px; color: #f3e5ab; }}
        .content {{ padding: 30px 25px; }}
        .welcome-msg {{ font-size: 1.15rem; font-weight: 600; color: #1e3f20; margin-top: 0; }}
        .credentials-box {{ background-color: #f7faf7; border: 1px solid #e2e8f0; border-left: 4px solid #1e3f20; padding: 20px; border-radius: 8px; margin: 20px 0; }}
        .cred-label {{ font-size: 0.9rem; color: #4a5568; font-weight: bold; margin-bottom: 2px; }}
        .cred-value {{ font-family: monospace; font-size: 1.1rem; color: #1e3f20; font-weight: bold; margin-bottom: 12px; word-break: break-all; }}
        .cred-value:last-child {{ margin-bottom: 0; }}
        .warning-box {{ background-color: #fffaf0; border: 1px solid #feebc8; border-left: 4px solid #dd6b20; padding: 15px; border-radius: 8px; margin: 20px 0; color: #c05621; font-size: 0.95rem; }}
        .instruction-box {{ background-color: #f7faf7; border: 1px solid #e2e8f0; border-left: 4px solid #c8922a; padding: 20px; border-radius: 8px; margin: 20px 0; }}
        .instruction-title {{ font-weight: bold; color: #1e3f20; margin-bottom: 8px; }}
        .footer {{ background-color: #f7faf7; padding: 20px; text-align: center; font-size: 0.8rem; color: #718096; border-top: 1px solid #edf2f7; }}
        .footer p {{ margin: 5px 0; }}
    </style>
</head>
<body>
    <div class="email-container">
        <div class="header">
            <h1>Welcome to TrailSync!</h1>
        </div>
        <div class="content">
            <p class="welcome-msg">Hi {staff.name},</p>
            <p>Welcome to the TrailSync Trek Staff Team! We are thrilled to have you join our community of professional guides and outdoor leaders. Your expertise is what keeps our trekkers safe and inspired in the mountains.</p>
            <p>A staff account has been set up for you. Below are your temporary login details:</p>
            
            <div class="credentials-box">
                <div class="cred-label">Login Email:</div>
                <div class="cred-value">{staff.email}</div>
                <div class="cred-label">Temporary Password:</div>
                <div class="cred-value" style="letter-spacing: 1px;">{password}</div>
            </div>
            
            <div class="warning-box">
                <strong>⚠️ IMPORTANT:</strong> This is a temporary password. Please log in and change your password immediately in your profile settings for account security.
            </div>
            
            <div class="instruction-box">
                <div class="instruction-title">📋 Mandatory: Complete Your Guide Profile</div>
                <p style="margin: 0; font-size: 0.95rem; color: #4a5568;">To become eligible for scheduling and getting assigned to upcoming trek batches, you must log in to your dashboard and complete your profile details (e.g. wilderness medical certifications, languages, guiding experience years, and core outdoor skills).</p>
            </div>
            
            <p style="margin-top: 25px;">If you have any questions, feel free to reply directly to this mail.</p>
            
            <p>Best regards,<br><strong>TrailSync Operations Desk</strong></p>
        </div>
        <div class="footer">
            <p>&copy; 2026 TrailSync Trekking. All rights reserved.</p>
        </div>
    </div>
</body>
</html>"""
        send_email_helper(
            subject="Welcome to TrailSync!",
            recipient=staff.email,
            body=body_html,
            is_html=True
        )
        return f"Sent welcome email to staff guide {staff.email}"

@celery_app.task
def send_guide_assignment_email(staff_id, trek_id, recipient_email=None, trek_name=None, batch_code=None, start_date_str=None, end_date_str=None, total_slots=None):
    """Email a guide about a trek assignment.
    If explicit parameters are supplied, the database is not queried.
    """
    if recipient_email and trek_name:
        body = f"{trek_name} trek is assigned to you\n\nTrek details\nTrek id: {trek_id}\nTrek name: {trek_name}\nBatch id: {batch_code or f'TID{trek_id:03d}B01'}\nBatch dates : {start_date_str or 'N/A'} - {end_date_str or 'N/A'}\nTotal slots : {total_slots if total_slots is not None else 'N/A'}\n\nThank you\nTrailSync Team\nFor any query contact: support@trailsync.com"
        send_email_helper(
            subject=f"{trek_name} trek is assigned to you",
            recipient=recipient_email,
            body=body,
            is_html=False
        )
        return f"Sent assignment email to {recipient_email} for trek {trek_id}"
    from backend.app import app
    from backend.models.models import User, Trek
    with app.app_context():
        staff = User.query.get(staff_id)
        trek = Trek.query.get(trek_id)
        if not staff:
            return f"Staff {staff_id} not found."
        if not trek:
            return f"Trek {trek_id} not found."
        batch_id = trek.batch_code or f"TID{trek.id:03d}B01"
        start_date = trek.start_date.strftime('%Y-%m-%d') if trek.start_date else 'N/A'
        end_date = trek.end_date.strftime('%Y-%m-%d') if trek.end_date else 'N/A'
        total_slots = trek.slots if trek.slots is not None else 'N/A'
        body = f"{trek.name} trek is assigned to you\n\nTrek details\ntrek id: {trek.id}\ntrek name: {trek.name}\nbatch id: {batch_id}\nbatch dates : {start_date} - {end_date}\ntotal slots : {total_slots}\n\nfor any query contact support@trailsync.com\nthank you\nTrailSync Team"
        send_email_helper(
            subject=f"{trek.name} trek is assigned to you",
            recipient=staff.email,
            body=body,
            is_html=False
        )
        return f"Sent assignment email to {staff.email} for trek {trek.id}"

@celery_app.task
def send_booking_email(booking_id, payment_method=None, payment_details=None):
    """Send a booking confirmation email to the user for a given booking ID."""
    from backend.app import app
    from backend.models.models import Booking, User, Trek
    import random
    with app.app_context():
        booking = Booking.query.get(booking_id)
        if not booking:
            return f"Booking {booking_id} not found."
        user = booking.user
        trek = booking.trek
        batch_id = trek.batch_code or f"TID{trek.id:03d}B01"
        start_date = trek.start_date.strftime('%Y-%m-%d') if trek.start_date else 'N/A'
        end_date = trek.end_date.strftime('%Y-%m-%d') if trek.end_date else 'N/A'
        txn_id = f"TS-TXN-{random.randint(10000000, 99999999)}" if booking.paid else None
        # Prepare payment details string (masked where needed)
        details_list = []
        if payment_details and isinstance(payment_details, dict):
            for k, v in payment_details.items():
                pretty_key = k.replace('_', ' ').title()
                if 'Number' in pretty_key and len(str(v)) > 4:
                    v = f"•••• •••• •••• {str(v)[-4:]}"
                details_list.append(f"{pretty_key}: {v}")
        details_str = "\n".join(details_list) if details_list else "N/A"
        booking_id_str = booking.unique_booking_id
        trek_id_str = trek.route.trek_code if (trek and trek.route) else f"TID{trek.id:03d}"
        payment_method_str = booking.clean_payment_method
        payment_details_str = booking.formatted_payment_details
        body = f"Booking ID : {booking_id_str}\nTrek ID : {trek_id_str}\nTrek name: {trek.name}\nBatch id: {batch_id}\nTrek Start Date: {start_date}\nTrek End Date: {end_date}\nPayment status : {booking.payment_status or ('Paid' if booking.paid else 'Pending')}\nAmount Paid : ₹{(booking.amount_paid or 0):.2f}\nPayment Method : {payment_method_str}\nPayment details : {payment_details_str}\n\nFor any query please contact : support@trailsync.com\nThank you\nTrailSync Team"
        send_email_helper(
            subject=f"Booking Confirmation: {trek.name}",
            recipient=user.email,
            body=body,
            is_html=False
        )
        return f"Sent booking confirmation email to {user.email} for booking {booking.id}"

@celery_app.task
def send_booking_cancellation_email(booking_id):
    """Notify the user that a booking has been cancelled.
    """
    from backend.app import app
    from backend.models.models import Booking
    with app.app_context():
        booking = Booking.query.get(booking_id)
        if not booking:
            return f"Booking {booking_id} not found."
        user = booking.user
        trek = booking.trek
        trek_name = trek.name if trek else "N/A"
        subject = f"Booking Cancelled - {trek_name}"
        body = f"Hi {user.name},\n\nYour booking has been cancelled. Here are the details:\n\nBooking ID: {booking.unique_booking_id}\nTrek Name: {trek_name}\nTrek Date: {trek.start_date.strftime('%Y-%m-%d') if trek and trek.start_date else 'N/A'}\nAmount Paid: ₹{(booking.amount_paid or 0):.2f}\n\nPending refund will be initiated within 5 working days.\n\nThank you\nTrailSync Team\nFor any query contact us at: support@trailsync.com\nor raise a support ticket from dashboard"
        send_email_helper(
            subject=subject,
            recipient=user.email,
            body=body,
            is_html=False
        )
        return f"Sent booking cancellation email to {user.email} for booking {booking.id}"
