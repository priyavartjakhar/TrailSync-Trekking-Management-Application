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

def get_job_runs():
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
    # Fallback default values (as a list)
    return [
        {'name': 'Daily Prep Reminders', 'schedule': 'Every day at 09:00', 'lastRun': '2026-06-10 09:00:00', 'status': 'Success', 'history': ['2026-06-10 09:00:00', '2026-06-09 09:00:00']},
        {'name': 'Monthly Activity Report', 'schedule': '1st of every month at 09:00', 'lastRun': '2026-06-01 09:00:00', 'status': 'Success', 'history': ['2026-06-01 09:00:00', '2026-05-01 09:00:00']},
        {'name': 'Daily Marketing Campaign', 'schedule': 'Every day at 11:50', 'lastRun': '2026-06-13 11:50:00', 'status': 'Success', 'history': ['2026-06-13 11:50:00', '2026-06-12 11:50:00']}
    ]

def update_job_run(name, status):
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
            runs[name]['history'] = runs[name]['history'][-20:] # Keep last 20 runs
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

def send_email_helper(subject, recipient, body, is_html=False, attachment_path=None):
    """
    Helper function to send emails via Gmail SMTP using provided app credentials.
    Retries up to 3 times with 2s backoff before falling back to a local file.
    """
    import time
    from email.utils import formataddr
    sender_email = "23f2005399@ds.study.iitm.ac.in"
    sender_password = "fvmj mlwu aabm wmxq"
    from_addr = formataddr(("TrailSync", sender_email))
    
    # Ensure fallback directory exists
    email_dir = os.path.join(os.path.dirname(__file__), '../scratch/emails')
    os.makedirs(email_dir, exist_ok=True)
    
    last_error = None
    for attempt in range(1, 4):  # Try up to 3 times
        try:
            # Build MIME message
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
                if is_html:
                    msg = MIMEText(body, 'html')
                else:
                    msg = MIMEText(body, 'plain')
                msg["Subject"] = subject
                msg["From"] = from_addr
                msg["To"] = recipient
                
            # Send via Gmail SMTP
            with smtplib.SMTP("smtp.gmail.com", 587, timeout=15) as server:
                server.ehlo()
                server.starttls()
                server.ehlo()
                server.login(sender_email, sender_password)
                server.send_message(msg)
                
            print(f"SMTP email sent successfully to {recipient} (attempt {attempt})")
            return True
            
        except Exception as e:
            last_error = e
            print(f"SMTP send attempt {attempt}/3 failed for {recipient}: {e}")
            if attempt < 3:
                time.sleep(2 * attempt)  # 2s, then 4s backoff
    
    print(f"All SMTP attempts failed for {recipient}. Writing to fallback file...")
    
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
def send_daily_reminders(is_manual=False):
    import random
    import urllib.request
    import urllib.parse
    from backend.app import app
    from backend.models.models import db, Booking, Trek
    
    update_job_run('Daily Prep Reminders', 'Running')
        
    TIPS = [
        "Stay hydrated: Drink at least 4-5 liters of water daily to prevent AMS (Acute Mountain Sickness).",
        "Pace yourself: Walk at a slow, steady, and rhythmic pace. It's a trek, not a race.",
        "Layer up: Keep your warm fleece and down jacket handy. Temperatures drop quickly in the shade and at night.",
        "Protect from sun: Apply high SPF sunscreen and wear UV-protection sunglasses to avoid high-altitude sunburn.",
        "Listen to your body: Report any headaches, dizziness, or nausea to your trek guide immediately."
    ]

    FACTS = [
        "The Himalayas contain 9 of the 10 highest peaks on Earth, including Mount Everest.",
        "Trekking increases cardiovascular strength and improves your mental well-being and stress levels.",
        "At 3,000 meters above sea level, each breath contains about 30% less oxygen than at sea level.",
        "Lichens, which are composite organisms, are among the few things that grow above 5,000 meters in the cold desert.",
        "The air pressure at the peak of Mount Everest is only about one-third of the pressure at sea level."
    ]

    GEAR = [
        "Trekking Poles: They reduce impact on your knees by up to 25% on steep descents.",
        "Proper Hiking Boots: Make sure they are broken in before the trek to avoid painful blisters.",
        "Headlamp: Essential for early morning summit climbs. Always carry spare batteries.",
        "Dry Bags: Keep your extra clothes and electronics inside dry bags inside your backpack.",
        "Reusable Water Bottle: Help protect pristine mountain trails by avoiding single-use plastics."
    ]
    
    try:
        with app.app_context():
            today = date.today()
            # Query all active bookings for future treks
            bookings = db.session.query(Booking).join(Trek).filter(
                Trek.start_date > today,
                Booking.status == 'Booked',
                (Booking.payment_status != 'Failed') | (Booking.payment_status == None)
            ).all()
            
            count = 0
            for b in bookings:
                user = b.user
                trek = b.trek
                days_left = (trek.start_date - today).days
                guide_name = trek.staff.name if trek.staff else "To Be Assigned"
                
                # Choose random tip, fact, and gear item
                tip = random.choice(TIPS)
                fact = random.choice(FACTS)
                gear_item = random.choice(GEAR)
                
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
                
                # SMS logging to scratch/emails/sms_log.txt
                sms_log_path = os.path.join(os.path.dirname(__file__), '../scratch/emails/sms_log.txt')
                os.makedirs(os.path.dirname(sms_log_path), exist_ok=True)
                sms_content = f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] SMS Sent to {user.phone or 'N/A'}: Hey {user.name}, only {days_left} days left until your trek {trek.name} starts on {trek.start_date}! Prepare your gear."
                with open(sms_log_path, 'a') as f_sms:
                    f_sms.write(sms_content + "\n")
                    
                # G-Chat Webhook
                gchat_url = os.environ.get('GCHAT_WEBHOOK_URL')
                webhook_msg = {
                    "text": f"🏔️ *Upcoming Trek Countdown Reminder* 🏔️\n\n"
                            f"Hello *{user.name}*, your trek *{trek.name}* is starting in *{days_left}* days!\n"
                            f"📅 *Start Date:* {trek.start_date.strftime('%Y-%m-%d')}\n"
                            f"📍 *Location:* {trek.location}\n"
                            f"💡 *Tip:* {tip}\n"
                            f"🏕️ *Fun Fact:* {fact}\n"
                            f"🎒 *Gear Spotlight:* {gear_item}"
                }
                webhook_payload = json.dumps(webhook_msg).encode('utf-8')
                
                # Log to scratch/emails/gchat_webhooks.log
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
                        with urllib.request.urlopen(req, timeout=5) as response:
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
    from backend.app import app
    from backend.models.models import db, User, Trek
    
    with app.app_context():
        user = User.query.get(user_id)
        if not user:
            return f"User {user_id} not found."
            
        today = date.today()
        # Recommend 3 upcoming open treks
        recommended_treks = Trek.query.filter_by(status='Open').filter(
            Trek.start_date > today
        ).order_by(Trek.start_date.asc()).limit(3).all()
        
        # Fallback if no upcoming open treks
        if len(recommended_treks) < 3:
            more_treks = Trek.query.filter(Trek.id.notin_([t.id for t in recommended_treks])).limit(3 - len(recommended_treks)).all()
            recommended_treks.extend(more_treks)
            
        trek_cards_html = ""
        for t in recommended_treks:
            price_str = f"₹{t.price:,}"
            start_date_str = t.start_date.strftime('%b %d, %Y') if t.start_date else 'N/A'
            trek_cards_html += f"""
            <div class="trek-item" style="border: 1px solid #edf2f7; border-radius: 8px; padding: 15px; margin-bottom: 15px; background-color: #ffffff;">
                <h4 style="margin: 0 0 5px 0; color: #1e3f20; font-size: 1.1rem;">{t.name}</h4>
                <p style="margin: 3px 0; font-size: 0.88rem; color: #4a5568;"><strong>📍 Location:</strong> {t.location} | <strong>🧭 Duration:</strong> {t.duration} Days</p>
                <p style="margin: 3px 0; font-size: 0.88rem; color: #4a5568;"><strong>📅 Starts:</strong> {start_date_str} | <strong>Difficulty:</strong> {t.difficulty}</p>
                <div style="margin-top: 10px; display: flex; justify-content: space-between; align-items: center;">
                    <span style="font-weight: 700; color: #c8922a; font-size: 1.05rem;">{price_str}</span>
                    <a href="/trek/{t.id}" style="background-color: #1e3f20; color: #ffffff; text-decoration: none; padding: 5px 12px; border-radius: 4px; font-size: 0.82rem; font-weight: 600;">View Details</a>
                </div>
            </div>"""

        body_html = f"""<!DOCTYPE html>
<html>
<head>
    <style>
        body {{ font-family: 'Outfit', 'DM Sans', Arial, sans-serif; line-height: 1.6; color: #2d3748; background-color: #f4f7f4; padding: 20px 10px; margin: 0; }}
        .container {{ max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05); border: 1px solid #e2e8f0; }}
        .header {{ background: linear-gradient(135deg, #1e3f20, #0f2411); padding: 40px 20px; text-align: center; color: #ffffff; }}
        .header h2 {{ margin: 0; color: #f3e5ab; font-size: 1.8rem; font-weight: 700; letter-spacing: -0.5px; }}
        .content {{ padding: 30px 25px; }}
        .welcome-msg {{ font-size: 1.2rem; font-weight: 600; color: #1e3f20; margin-top: 0; }}
        .promo-box {{ background-color: #fcf8eb; border: 1px dashed #c8922a; padding: 15px; border-radius: 8px; text-align: center; margin: 20px 0; }}
        .promo-code {{ font-family: monospace; font-size: 1.4rem; font-weight: bold; color: #c8922a; margin: 5px 0; letter-spacing: 1px; }}
        .footer {{ background-color: #f7faf7; padding: 20px; text-align: center; font-size: 0.8rem; color: #718096; border-top: 1px solid #edf2f7; }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h2>Welcome to TrailSync!</h2>
        </div>
        <div class="content">
            <p class="welcome-msg">Hi {user.name},</p>
            <p>Welcome to TrailSync, the ultimate platform for trekkers and mountain enthusiasts. We are thrilled to have you join our community! Whether you are a beginner looking for a weekend hike or a seasoned trekker seeking high-altitude challenges, we have the perfect trail for you.</p>
            
            <div class="promo-box">
                <p style="margin: 0; font-size: 0.95rem; color: #78350f; font-weight: 600;">🎒 Get 10% Off Your First Booking!</p>
                <p style="margin: 5px 0; font-size: 0.85rem; color: #4a5568;">Use this exclusive coupon code during checkout:</p>
                <div class="promo-code">FIRSTTRAIL10</div>
            </div>
            
            <h3 style="color: #1e3f20; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px; margin-top: 30px;">🏔️ Recommended Treks for You</h3>
            <div class="trek-list" style="margin-top: 15px;">
                {trek_cards_html if trek_cards_html else "<p>No treks currently available. Check back soon!</p>"}
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
        
        send_email_helper(
            subject="Welcome to TrailSync! Your mountain adventure awaits 🏔️",
            recipient=user.email,
            body=body_html,
            is_html=True
        )
        return f"Welcome email sent to {user.email} with {len(recommended_treks)} recommended treks."

@celery_app.task
def generate_monthly_report(is_manual=False):
    from backend.app import app
    from backend.models.models import db, Booking, Trek, User
    
    update_job_run('Monthly Activity Report', 'Running')
        
    try:
        with app.app_context():
            today = date.today()
            
            # Determine start and end dates
            if is_manual or today.day != 1:
                # Manual trigger or mid-month: from 1st of current month to today
                start_date = date(today.year, today.month, 1)
                end_date = today
                report_type_label = "Real-time (Up to Current Date/Time)"
            else:
                # Scheduled run on the 1st: cover the whole previous month
                first_of_this_month = date(today.year, today.month, 1)
                last_day_of_prev_month = first_of_this_month - timedelta(days=1)
                start_date = date(last_day_of_prev_month.year, last_day_of_prev_month.month, 1)
                end_date = last_day_of_prev_month
                report_type_label = "Automated Monthly Summary"
                
            # Treks conducted (completed batches starting within the period)
            conducted_treks = Trek.query.filter(
                Trek.status == 'Completed',
                Trek.start_date.between(start_date, end_date)
            ).all()
            
            start_datetime = datetime.combine(start_date, datetime.min.time())
            end_datetime = datetime.combine(end_date, datetime.max.time())
            
            # Total Trekkers (registered this month)
            total_trekkers_joined = User.query.filter(
                User.registered_at.between(start_datetime, end_datetime),
                User.role == 'user'
            ).count()
            
            # Total Staff (added this month)
            total_staff_added = User.query.filter(
                User.registered_at.between(start_datetime, end_datetime),
                User.role == 'staff'
            ).count()
            
            # Total Bookings (this month)
            total_bookings_count = Booking.query.filter(
                Booking.booked_on.between(start_date, end_date)
            ).count()
            
            # Total Revenue Generated (bookings made in this period)
            bookings_in_period = Booking.query.filter(
                Booking.booked_on.between(start_date, end_date)
            ).all()
            total_revenue = 0
            for b in bookings_in_period:
                if b.payment_status == 'Paid':
                    total_revenue += b.amount_paid or b.booking_price or 5000
                elif b.payment_status == 'Refunded':
                    paid = b.amount_paid or b.booking_price or 5000
                    ref = b.refund_amount or 0
                    total_revenue += max(0, paid - ref)
            
            # Active Staff Guide count
            active_staff = User.query.filter_by(role='staff', active=True).count()
            
            # Difficulty breakdown of bookings made in period
            difficulty_counts = {'Easy': 0, 'Moderate': 0, 'Hard': 0}
            difficulty_breakdown = db.session.query(Trek.difficulty, db.func.count(Booking.id)).join(Trek).filter(
                Booking.booked_on.between(start_date, end_date),
                Booking.status.in_(['Booked', 'Completed']),
                (Booking.payment_status != 'Failed') | (Booking.payment_status == None)
            ).group_by(Trek.difficulty).all()
            
            for diff, cnt in difficulty_breakdown:
                if diff in difficulty_counts:
                    difficulty_counts[diff] = cnt
            
            # Popular treks booked this month (grouped by TrekRoute)
            bookings_this_month = Booking.query.filter(
                Booking.booked_on.between(start_date, end_date),
                Booking.status.in_(['Booked', 'Completed']),
                (Booking.payment_status != 'Failed') | (Booking.payment_status == None)
            ).all()
            
            trek_route_booking_counts = {}
            for b in bookings_this_month:
                if b.trek and b.trek.route:
                    route = b.trek.route
                    if route.id not in trek_route_booking_counts:
                        trek_route_booking_counts[route.id] = {
                            'route': route,
                            'count': 0
                        }
                    trek_route_booking_counts[route.id]['count'] += 1
            
            popular_routes_list = sorted(trek_route_booking_counts.values(), key=lambda x: x['count'], reverse=True)
            
            # Conducted treks ranked: completed batches this month ranked by participant count
            conducted_trek_stats = []
            for t in conducted_treks:
                cnt = db.session.query(Booking).filter(
                    Booking.trek_id == t.id,
                    Booking.status.in_(['Booked', 'Completed']),
                    (Booking.payment_status != 'Failed') | (Booking.payment_status == None)
                ).count()
                conducted_trek_stats.append((t, cnt))
            conducted_trek_stats.sort(key=lambda x: x[1], reverse=True)
            
            # Difficulty stats visual bars
            total_b = max(1, sum(difficulty_counts.values()))
            easy_pct = int((difficulty_counts['Easy'] / total_b) * 100)
            mod_pct = int((difficulty_counts['Moderate'] / total_b) * 100)
            hard_pct = int((difficulty_counts['Hard'] / total_b) * 100)
            
            difficulty_bars_html = f"""
            <div style="margin: 15px 0;">
                <div style="font-size: 0.88rem; color: #4a5568; margin-bottom: 3px;">
                    <strong>🟢 Easy difficulty:</strong> {difficulty_counts['Easy']} bookings ({easy_pct}%)
                </div>
                <div style="background-color: #edf2f7; border-radius: 4px; height: 10px; overflow: hidden; margin-bottom: 12px;">
                    <div style="background-color: #4ade80; width: {easy_pct}%; height: 100%;"></div>
                </div>
                
                <div style="font-size: 0.88rem; color: #4a5568; margin-bottom: 3px;">
                    <strong>🟡 Moderate difficulty:</strong> {difficulty_counts['Moderate']} bookings ({mod_pct}%)
                </div>
                <div style="background-color: #edf2f7; border-radius: 4px; height: 10px; overflow: hidden; margin-bottom: 12px;">
                    <div style="background-color: #facc15; width: {mod_pct}%; height: 100%;"></div>
                </div>
                
                <div style="font-size: 0.88rem; color: #4a5568; margin-bottom: 3px;">
                    <strong>🔴 Hard difficulty:</strong> {difficulty_counts['Hard']} bookings ({hard_pct}%)
                </div>
                <div style="background-color: #edf2f7; border-radius: 4px; height: 10px; overflow: hidden;">
                    <div style="background-color: #f87171; width: {hard_pct}%; height: 100%;"></div>
                </div>
            </div>"""
            
            # HTML popular treks segment
            popular_treks_html = ""
            for idx, item in enumerate(popular_routes_list[:5]):
                r = item['route']
                cnt = item['count']
                popular_treks_html += f"""
                <div style="padding: 10px; border-bottom: 1px solid #edf2f7; font-size: 0.95rem;">
                    <span style="font-weight: bold; color: #1e3f20;">#{idx+1} {r.name}</span> 
                    <span style="color: #718096; font-size: 0.85rem;">({r.trek_code})</span> - 
                    <strong>{cnt}</strong> bookings this month ({r.location})
                </div>"""
            if not popular_treks_html:
                popular_treks_html = '<div style="padding: 10px; color: #718096;">No bookings recorded for any treks this month.</div>'
                
            # HTML conducted treks ranked segment
            conducted_ranked_html = ""
            for idx, (t, cnt) in enumerate(conducted_trek_stats):
                conducted_ranked_html += f"""
                <div style="padding: 10px; border-bottom: 1px solid #edf2f7; font-size: 0.95rem;">
                    <span style="font-weight: bold; color: #c8922a;">Rank {idx+1}. {t.name}</span> 
                    <span style="color: #718096; font-size: 0.85rem;">({t.batch_code or 'B01'})</span> - 
                    <strong>{cnt}</strong> trekkers participated
                </div>"""
            if not conducted_ranked_html:
                conducted_ranked_html = '<div style="padding: 10px; color: #718096;">No completed treks recorded in this range.</div>'

            # Detail of batches conducted this month segment
            conducted_details_html = ""
            for idx, t in enumerate(conducted_treks):
                start_date_str = t.start_date.strftime('%B %d, %Y') if t.start_date else 'N/A'
                conducted_details_html += f"""
                <div style="margin-bottom: 10px; padding: 10px; border: 1px solid #e2e8f0; border-radius: 6px; background-color: #fcfcfc;">
                    <p style="margin: 4px 0; font-size: 0.95rem; color: #1e3f20;">
                        <strong>Batch ID:</strong> {t.batch_code or 'B01'} | <strong>Start Date:</strong> {start_date_str}
                    </p>
                </div>"""
            if not conducted_details_html:
                conducted_details_html = '<div style="padding: 15px; border: 1px dashed #cbd5e0; border-radius: 8px; color: #718096; text-align: center;">No batches completed during this period.</div>'
                
            report_html = f"""<!DOCTYPE html>
<html>
<head>
    <style>
        body {{ font-family: 'Outfit', 'DM Sans', Arial, sans-serif; line-height: 1.6; color: #2d3748; background-color: #f4f7f4; padding: 20px 10px; margin: 0; }}
        .container {{ max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05); border: 1px solid #e2e8f0; }}
        .header {{ background: linear-gradient(135deg, #1e3f20, #0f2411); padding: 35px 20px; text-align: center; color: #ffffff; }}
        .header h1 {{ margin: 0; font-size: 2.0rem; font-weight: 700; color: #f3e5ab; }}
        .content {{ padding: 30px 25px; }}
        .kpi-row {{ display: flex; flex-wrap: wrap; gap: 12px; margin: 20px 0; }}
        .kpi-card {{ flex: 1; min-width: 130px; background-color: #f7faf7; border: 1px solid #edf2f7; padding: 12px; border-radius: 8px; text-align: center; }}
        .kpi-val {{ font-size: 1.5rem; font-weight: bold; color: #1e3f20; }}
        .kpi-lbl {{ font-size: 0.75rem; color: #718096; text-transform: uppercase; margin-top: 4px; }}
        .footer {{ background-color: #f7faf7; padding: 20px; text-align: center; font-size: 0.8rem; color: #718096; border-top: 1px solid #edf2f7; }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>TrailSync Monthly Report</h1>
            <p style="margin: 5px 0 0 0; color: #c8922a; font-weight: bold;">{start_date.strftime('%B %d, %Y')} to {end_date.strftime('%B %d, %Y')} ({report_type_label})</p>
        </div>
        <div class="content">
            <p>Hello Admin,</p>
            <p>The monthly trekking activity report has been compiled successfully. Below is a high-level summary of operations, participation, and popularity rankings.</p>
            
            <h3 style="color: #1e3f20; border-bottom: 1px solid #e2e8f0; padding-bottom: 5px; margin-top: 20px;">📊 Key Metrics</h3>
            <div class="kpi-row">
                <div class="kpi-card">
                    <div class="kpi-val">{len(conducted_treks)}</div>
                    <div class="kpi-lbl">Treks Conducted</div>
                </div>
                <div class="kpi-card">
                    <div class="kpi-val">{total_bookings_count}</div>
                    <div class="kpi-lbl">Total Bookings</div>
                </div>
                <div class="kpi-card">
                    <div class="kpi-val">₹{total_revenue:,}</div>
                    <div class="kpi-lbl">Revenue Generated</div>
                </div>
            </div>
            <div class="kpi-row" style="margin-top: 0;">
                <div class="kpi-card">
                    <div class="kpi-val">+{total_trekkers_joined}</div>
                    <div class="kpi-lbl">Trekkers Joined</div>
                </div>
                <div class="kpi-card">
                    <div class="kpi-val">+{total_staff_added}</div>
                    <div class="kpi-lbl">Staff Added</div>
                </div>
                <div class="kpi-card">
                    <div class="kpi-val">{active_staff}</div>
                    <div class="kpi-lbl">Active Guides</div>
                </div>
            </div>
            
            <h3 style="color: #1e3f20; margin-top: 25px; border-bottom: 1px solid #e2e8f0; padding-bottom: 5px;">🔥 Popular Treks (Bookings Created This Month)</h3>
            <div style="margin-top: 10px; margin-bottom: 25px;">
                {popular_treks_html}
            </div>
            
            <h3 style="color: #1e3f20; margin-top: 25px; border-bottom: 1px solid #e2e8f0; padding-bottom: 5px;">🏆 Conducted Treks Rank-Wise (Conducted This Month)</h3>
            <div style="margin-top: 10px; margin-bottom: 25px;">
                {conducted_ranked_html}
            </div>
            
            <h3 style="color: #1e3f20; margin-top: 25px; border-bottom: 1px solid #e2e8f0; padding-bottom: 5px;">🏔️ Detailed Conducted Batches</h3>
            <div style="margin-top: 15px;">
                {conducted_details_html}
            </div>
            
            <h3 style="color: #1e3f20; margin-top: 25px; border-bottom: 1px solid #e2e8f0; padding-bottom: 5px;">🟢 Difficulty Analytics (Bookings Created This Month)</h3>
            {difficulty_bars_html}
            
        </div>
        <div class="footer">
            <p>Generated automatically on {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}.</p>
            <p>&copy; 2026 TrailSync. All rights reserved.</p>
        </div>
    </div>
</body>
</html>"""
            
            admin_email = "jakharpriyavart@gmail.com"
            send_email_helper(
                subject=f"TrailSync Monthly Report - {start_date.strftime('%B %Y')}",
                recipient=admin_email,
                body=report_html,
                is_html=True
            )
            
            # Save HTML locally as history/cache in scratch
            report_dir = os.path.join(os.path.dirname(__file__), '../scratch/emails')
            os.makedirs(report_dir, exist_ok=True)
            report_path = os.path.join(report_dir, f"monthly_report_{int(datetime.now().timestamp())}.html")
            with open(report_path, 'w') as f_out:
                f_out.write(report_html)
            
            update_job_run('Monthly Activity Report', 'Success')
            return f"Generated monthly report and emailed to {admin_email}."
    except Exception as e:
        update_job_run('Monthly Activity Report', 'Failed')
        raise e

@celery_app.task
def send_marketing_campaign(is_manual=False):
    from backend.app import app
    from backend.models.models import db, User, Trek
    
    update_job_run('Daily Marketing Campaign', 'Running')
        
    try:
        with app.app_context():
            # Query all active users
            users = User.query.filter_by(role='user').all()
            
            # Fetch some upcoming treks to feature
            upcoming_treks = Trek.query.filter(
                Trek.start_date > date.today(),
                Trek.status == 'Open'
            ).order_by(Trek.start_date.asc()).limit(3).all()
            
            # If fewer than 3 open treks, get any future treks
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
                <div style="background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 15px; margin-bottom: 15px;">
                    <h4 style="margin: 0 0 5px 0; color: #1e3f20; font-size: 1.1rem;">{t.name}</h4>
                    <p style="margin: 3px 0; font-size: 0.88rem; color: #4a5568;"><strong>📍 Location:</strong> {t.location} | <strong>🧭 Difficulty:</strong> {t.difficulty}</p>
                    <p style="margin: 3px 0; font-size: 0.88rem; color: #4a5568;"><strong>📅 Start Date:</strong> {start_date_str} | <strong>Price:</strong> {price_str}</p>
                </div>"""
                
            newsletter_html = f"""<!DOCTYPE html>
<html>
<head>
    <style>
        body {{ font-family: 'Outfit', 'DM Sans', Arial, sans-serif; line-height: 1.6; color: #2d3748; background-color: #f4f7f4; padding: 20px 10px; margin: 0; }}
        .email-container {{ max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05); border: 1px solid #e2e8f0; }}
        .header {{ background: linear-gradient(135deg, #1e3f20, #0c200d); padding: 40px 20px; text-align: center; color: #ffffff; }}
        .header h1 {{ margin: 0; font-size: 2.0rem; font-weight: 700; color: #f3e5ab; }}
        .header p {{ margin: 5px 0 0 0; color: #c8922a; font-size: 1.05rem; font-weight: 600; }}
        .content {{ padding: 30px 25px; }}
        .hero-text {{ font-size: 1.1rem; color: #2d3748; font-weight: 500; text-align: center; margin-bottom: 25px; }}
        .feature-box {{ background-color: #f7faf7; border-radius: 8px; padding: 20px; border: 1px solid #edf2f7; margin-top: 25px; }}
        .footer {{ background-color: #f7faf7; padding: 20px; text-align: center; font-size: 0.8rem; color: #718096; border-top: 1px solid #edf2f7; }}
    </style>
</head>
<body>
    <div class="email-container">
        <div class="header">
            <h1>TrailSync Explorer</h1>
            <p>Your Next Adventure Awaits 🏔️</p>
        </div>
        <div class="content">
            <p class="hero-text">"Jobs fill your pocket, but adventures fill your soul." – Join TrailSync on our featured treks and explore the magnificent trails with expert guiding, premium safety protocols, and a vibrant community of trekkers!</p>
            
            <h3 style="color: #1e3f20; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px; margin-top: 20px;">🔥 Trending Upcoming Treks</h3>
            <div style="margin-top: 15px;">
                {trek_items_html if trek_items_html else "<p>Check our dashboard for upcoming trek batches!</p>"}
            </div>
            
            <div class="feature-box">
                <h4 style="margin: 0 0 10px 0; color: #1e3f20;">🌟 Why Trek with TrailSync?</h4>
                <ul style="margin: 0; padding-left: 20px; font-size: 0.9rem; color: #4a5568;">
                    <li style="margin-bottom: 6px;">Certified Wilderness First Responder (WFR) guides.</li>
                    <li style="margin-bottom: 6px;">Small batch sizes for safety and personalized attention.</li>
                    <li style="margin-bottom: 6px;">Eco-friendly trekking: We practice Leave No Trace principles.</li>
                </ul>
            </div>
            
            <p style="margin-top: 25px; text-align: center;">
                <a href="http://localhost:8000" style="display: inline-block; background-color: #1e3f20; color: #ffffff; text-decoration: none; padding: 12px 25px; border-radius: 6px; font-weight: bold; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">Book Your Trek Now</a>
            </p>
        </div>
        <div class="footer">
            <p>You received this newsletter because you are a registered explorer at TrailSync.</p>
            <p>&copy; 2026 TrailSync. All rights reserved.</p>
        </div>
    </div>
</body>
</html>"""
            
            # Send to all users
            count = 0
            for u in users:
                send_email_helper(
                    subject="TrailSync Explorer: Discover Upcoming Wilderness Treks! 🥾",
                    recipient=u.email,
                    body=newsletter_html,
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
    from backend.app import app
    from backend.models.models import Trek
    
    with app.app_context():
        today = date.today()
        # Recommend 3 upcoming treks
        recommended_treks = Trek.query.filter_by(status='Open').filter(
            Trek.start_date > today
        ).order_by(Trek.start_date.asc()).limit(3).all()
        
        if len(recommended_treks) < 3:
            more_treks = Trek.query.limit(3).all()
            recommended_treks = list(set(recommended_treks + more_treks))[:3]
            
        trek_cards_html = ""
        for t in recommended_treks:
            price_str = f"₹{t.price:,}"
            start_date_str = t.start_date.strftime('%b %d, %Y') if t.start_date else 'N/A'
            trek_cards_html += f"""
            <div class="trek-item" style="border: 1px solid #edf2f7; border-radius: 8px; padding: 15px; margin-bottom: 15px; background-color: #ffffff;">
                <h4 style="margin: 0 0 5px 0; color: #1e3f20; font-size: 1.1rem;">{t.name}</h4>
                <p style="margin: 3px 0; font-size: 0.88rem; color: #4a5568;"><strong>📍 Location:</strong> {t.location} | <strong>🧭 Duration:</strong> {t.duration} Days</p>
                <p style="margin: 3px 0; font-size: 0.88rem; color: #4a5568;"><strong>📅 Starts:</strong> {start_date_str} | <strong>Difficulty:</strong> {t.difficulty}</p>
                <div style="margin-top: 10px; display: flex; justify-content: space-between; align-items: center;">
                    <span style="font-weight: 700; color: #c8922a; font-size: 1.05rem;">{price_str}</span>
                    <a href="http://localhost:8000" style="background-color: #1e3f20; color: #ffffff; text-decoration: none; padding: 5px 12px; border-radius: 4px; font-size: 0.82rem; font-weight: 600;">View Details</a>
                </div>
            </div>"""

        body_html = f"""<!DOCTYPE html>
<html>
<head>
    <style>
        body {{ font-family: 'Outfit', 'DM Sans', Arial, sans-serif; line-height: 1.6; color: #2d3748; background-color: #f4f7f4; padding: 20px 10px; margin: 0; }}
        .container {{ max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05); border: 1px solid #e2e8f0; }}
        .header {{ background: linear-gradient(135deg, #1e3f20, #0f2411); padding: 40px 20px; text-align: center; color: #ffffff; }}
        .header h2 {{ margin: 0; color: #f3e5ab; font-size: 1.8rem; font-weight: 700; letter-spacing: -0.5px; }}
        .content {{ padding: 30px 25px; }}
        .welcome-msg {{ font-size: 1.2rem; font-weight: 600; color: #1e3f20; margin-top: 0; }}
        .promo-box {{ background-color: #fcf8eb; border: 1px dashed #c8922a; padding: 15px; border-radius: 8px; text-align: center; margin: 20px 0; }}
        .promo-code {{ font-family: monospace; font-size: 1.4rem; font-weight: bold; color: #c8922a; margin: 5px 0; letter-spacing: 1px; }}
        .footer {{ background-color: #f7faf7; padding: 20px; text-align: center; font-size: 0.8rem; color: #718096; border-top: 1px solid #edf2f7; }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h2>Welcome to TrailSync!</h2>
        </div>
        <div class="content">
            <p class="welcome-msg">Hi Explorer,</p>
            <p>Welcome to TrailSync, the ultimate platform for trekkers and mountain enthusiasts. We are thrilled to have you join our community! Whether you are a beginner looking for a weekend hike or a seasoned trekker seeking high-altitude challenges, we have the perfect trail for you.</p>
            
            <div class="promo-box">
                <p style="margin: 0; font-size: 0.95rem; color: #78350f; font-weight: 600;">🎒 Get 10% Off Your First Booking!</p>
                <p style="margin: 5px 0; font-size: 0.85rem; color: #4a5568;">Use this exclusive coupon code during checkout:</p>
                <div class="promo-code">FIRSTTRAIL10</div>
            </div>
            
            <h3 style="color: #1e3f20; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px; margin-top: 30px;">🏔️ Recommended Treks for You</h3>
            <div class="trek-list" style="margin-top: 15px;">
                {trek_cards_html if trek_cards_html else "<p>No treks currently available. Check back soon!</p>"}
            </div>
            
            <p style="margin-top: 25px;">Ready to start your journey? Log in to your dashboard to complete your profile, explore more destinations, and book your next adventure.</p>
            
            <p>See you on the trail,<br><strong>The TrailSync Team</strong></p>
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
    body_html = f"""<!DOCTYPE html>
<html>
<head>
    <style>
        body {{ font-family: 'Outfit', 'DM Sans', Arial, sans-serif; line-height: 1.6; color: #2d3748; padding: 20px 10px; margin: 0; background-color: #f4f7f4; }}
        .container {{ max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }}
        .header {{ background: linear-gradient(135deg, #102a11, #1e3f20); color: #f3e5ab; padding: 30px 20px; border-radius: 8px 8px 0 0; text-align: center; }}
        .header h2 {{ margin: 0; color: #f3e5ab; font-size: 1.7rem; font-weight: 700; }}
        .content {{ padding: 25px 15px; }}
        .footer {{ font-size: 0.8rem; text-align: center; color: #718096; margin-top: 20px; border-top: 1px solid #edf2f7; padding-top: 15px; }}
        .credential-box {{ background-color: #f7fafc; border: 1px solid #edf2f7; padding: 15px; border-radius: 8px; margin: 15px 0; font-family: monospace; font-size: 0.95rem; }}
        .warning-text {{ color: #e53e3e; font-weight: bold; font-size: 0.95rem; margin: 15px 0; }}
        .cta-title {{ font-weight: 700; color: #1e3f20; font-size: 1.1rem; margin-top: 20px; margin-bottom: 8px; border-bottom: 1px solid #e2e8f0; padding-bottom: 5px; }}
        .welcome-msg {{ font-size: 1.1rem; font-weight: 600; color: #1e3f20; margin-bottom: 15px; }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h2>Welcome to TrailSync!</h2>
        </div>
        <div class="content">
            <p class="welcome-msg">Hi Guide,</p>
            
            <p>Welcome to the TrailSync Trek Staff Team! We are thrilled to have you join our community of professional guides and outdoor leaders. Your expertise is what keeps our trekkers safe and inspired in the mountains.</p>
            
            <p>A staff account has been set up for you. Below are your temporary login details:</p>
            
            <div class="credential-box">
                <div><strong>Login Email:</strong> {recipient_email}</div>
                <div><strong>Temporary Password:</strong> [TEMPORARY_SECURE_PASSWORD]</div>
            </div>
            
            <p class="warning-text">⚠️ IMPORTANT: This is a temporary password. Please log in and change your password immediately in your profile settings for account security.</p>
            
            <div class="cta-title">📋 Mandatory Action Items</div>
            <ul style="margin: 0; padding-left: 20px; font-size: 0.9rem; color: #4a5568;">
                <li style="margin-bottom: 8px;">Log in and change your temporary password immediately.</li>
                <li style="margin-bottom: 8px;">Upload wilderness medical / rescue certifications.</li>
                <li style="margin-bottom: 8px;">Specify your language and rescue specialties in profile settings.</li>
            </ul>
            
            <p style="margin-top: 20px;">If you have any questions, feel free to reply directly to this mail.</p>
            
            <p>Best regards,<br><strong>TrailSync Operations Desk</strong></p>
        </div>
        <div class="footer">
            &copy; 2026 TrailSync Trekking. All rights reserved.
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
            
            <p>Welcome to the TrailSync Trek Staff Team! We are thrilled to have you join our community of professional guides and outdoor leaders. Your expertise is what keeps our trekkers safe and inspired in the mountains.</p>
            
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

@celery_app.task
def send_guide_assignment_email(staff_id, trek_id, recipient_email=None, trek_name=None, batch_code=None, start_date_str=None, end_date_str=None, total_slots=None):
    if recipient_email and trek_name:
        # Use passed parameters directly to avoid database queries and transaction lag
        body = f"""{trek_name} trek is assigned to you
Trek details
trek id: {trek_id}
trek name: {trek_name}
batch id: {batch_code or f"TID{trek_id:03d}B01"}
batch dates : {start_date_str or 'N/A'} - {end_date_str or 'N/A'}
total slots : {total_slots if total_slots is not None else 'N/A'}
for any query contact support@trailsync.com
thankyou
TrailSync Team"""
        
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
        
        body = f"""{trek.name} trek is assigned to you
Trek details
trek id: {trek.id}
trek name: {trek.name}
batch id: {batch_id}
batch dates : {start_date} - {end_date}
total slots : {total_slots}
for any query contact support@trailsync.com
thankyou
TrailSync Team"""
        
        send_email_helper(
            subject=f"{trek.name} trek is assigned to you",
            recipient=staff.email,
            body=body,
            is_html=False
        )
        
        return f"Sent assignment email to {staff.email} for trek {trek.id}"

@celery_app.task
def send_booking_email(booking_id, payment_method=None, payment_details=None):
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
        
        # Format payment details
        details_list = []
        if payment_details and isinstance(payment_details, dict):
            for k, v in payment_details.items():
                pretty_key = k.replace('_', ' ').title()
                if 'Number' in pretty_key and len(str(v)) > 4:
                    val_str = str(v)
                    v = f"•••• •••• •••• {val_str[-4:]}"
                details_list.append(f"{pretty_key}: {v}")
        details_str = "\n".join(details_list) if details_list else "N/A"
        
        booking_id_str = booking.unique_booking_id
        trek_id_str = trek.route.trek_code if (trek and trek.route) else f"TID{trek.id:03d}"
        payment_method_str = booking.clean_payment_method
        payment_details_str = booking.formatted_payment_details
        
        body = f"""Booking ID : {booking_id_str}
Trek ID : {trek_id_str}
Trek name: {trek.name}
Batch id: {batch_id}
Trek Start Date: {start_date} 
Trek End Date: {end_date}
Payment status : {booking.payment_status or ('Paid' if booking.paid else 'Pending')}
Amount Paid : ₹{(booking.amount_paid or 0):.2f}
Payment Method : {payment_method_str}
Payment details : {payment_details_str}


For any query please contact : support@trailsync.com
Thankyou
TrailSync Team"""

        send_email_helper(
            subject=f"Booking Confirmation: {trek.name}",
            recipient=user.email,
            body=body,
            is_html=False
        )
        return f"Sent booking confirmation email to {user.email} for booking {booking.id}"
