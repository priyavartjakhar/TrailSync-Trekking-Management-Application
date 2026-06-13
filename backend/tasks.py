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
    }
}
celery_app.conf.timezone = 'Asia/Kolkata'

def get_job_runs():
    filepath = os.path.join(os.path.dirname(__file__), '../scratch/job_runs.json')
    if os.path.exists(filepath):
        try:
            with open(filepath, 'r') as f:
                data = json.load(f)
                # Ensure structure is consistent
                res = []
                for k, v in data.items():
                    res.append(v)
                return res
        except Exception:
            pass
    # Fallback default values (as a list)
    return [
        {'name': 'Daily Reminder Emails', 'schedule': 'Every day at 09:00', 'lastRun': '2026-06-10 09:00:00', 'status': 'Success'},
        {'name': 'Monthly Activity Report', 'schedule': '1st of every month at 09:00', 'lastRun': '2026-06-01 09:00:00', 'status': 'Success'},
        {'name': 'Cache Refresh Job', 'schedule': 'Every 15 min', 'lastRun': '2026-06-13 14:45:00', 'status': 'Success'}
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
            'Daily Reminder Emails': {'name': 'Daily Reminder Emails', 'schedule': 'Every day at 09:00', 'lastRun': '2026-06-10 09:00:00', 'status': 'Success'},
            'Monthly Activity Report': {'name': 'Monthly Activity Report', 'schedule': '1st of every month at 09:00', 'lastRun': '2026-06-01 09:00:00', 'status': 'Success'},
            'Cache Refresh Job': {'name': 'Cache Refresh Job', 'schedule': 'Every 15 min', 'lastRun': '2026-06-13 14:45:00', 'status': 'Success'}
        }
    
    if name in runs:
        runs[name]['lastRun'] = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        runs[name]['status'] = status
    else:
        runs[name] = {
            'name': name,
            'schedule': 'Manual' if 'Monthly' not in name and 'Daily' not in name else ('1st of every month at 09:00' if 'Monthly' in name else 'Every day at 09:00'),
            'lastRun': datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
            'status': status
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
def send_daily_reminders(is_manual=False):
    import random
    import urllib.request
    import urllib.parse
    from backend.app import app
    from backend.models.models import db, Booking, Trek
    
    if is_manual:
        update_job_run('Daily Reminder Emails', 'Running')
        
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
                
            if is_manual:
                update_job_run('Daily Reminder Emails', 'Success')
            return f"Dispatched {count} daily reminders."
    except Exception as e:
        if is_manual:
            update_job_run('Daily Reminder Emails', 'Failed')
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
    from reportlab.lib.pagesizes import letter
    from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.lib import colors
    
    if is_manual:
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
                
            # Treks conducted (starts within the period)
            conducted_treks = Trek.query.filter(Trek.start_date.between(start_date, end_date)).all()
            conducted_trek_ids = [t.id for t in conducted_treks]
            
            if conducted_trek_ids:
                total_participants = db.session.query(Booking).filter(
                    Booking.trek_id.in_(conducted_trek_ids),
                    Booking.status == 'Booked',
                    (Booking.payment_status != 'Failed') | (Booking.payment_status == None)
                ).count()
            else:
                total_participants = 0
                
            # Compute trek stats (bookings count)
            trek_stats = []
            for t in conducted_treks:
                cnt = db.session.query(Booking).filter(
                    Booking.trek_id == t.id,
                    Booking.status == 'Booked',
                    (Booking.payment_status != 'Failed') | (Booking.payment_status == None)
                ).count()
                trek_stats.append((t, cnt))
            
            trek_stats.sort(key=lambda x: x[1], reverse=True)
            popular_treks = trek_stats[:5]
            
            # 1. Generate PDF Report using reportlab
            pdf_dir = os.path.join(os.path.dirname(__file__), '../scratch/reports')
            os.makedirs(pdf_dir, exist_ok=True)
            pdf_filename = f"monthly_report_{int(datetime.now().timestamp())}.pdf"
            pdf_path = os.path.join(pdf_dir, pdf_filename)
            
            doc = SimpleDocTemplate(pdf_path, pagesize=letter, rightMargin=40, leftMargin=40, topMargin=40, bottomMargin=40)
            styles = getSampleStyleSheet()
            
            title_style = ParagraphStyle(
                'TitleStyle',
                parent=styles['Heading1'],
                textColor=colors.HexColor('#1e3f20'),
                fontSize=22,
                spaceAfter=10,
                fontName='Helvetica-Bold'
            )
            subtitle_style = ParagraphStyle(
                'SubTitleStyle',
                parent=styles['Normal'],
                textColor=colors.HexColor('#c8922a'),
                fontSize=11,
                spaceAfter=20,
                fontName='Helvetica-Bold'
            )
            heading_style = ParagraphStyle(
                'HeadingStyle',
                parent=styles['Heading2'],
                textColor=colors.HexColor('#1e3f20'),
                fontSize=13,
                spaceBefore=15,
                spaceAfter=8,
                fontName='Helvetica-Bold'
            )
            body_style = ParagraphStyle(
                'BodyStyle',
                parent=styles['Normal'],
                textColor=colors.HexColor('#2d3748'),
                fontSize=9.5,
                leading=13,
                fontName='Helvetica'
            )
            header_style = ParagraphStyle(
                'HeaderStyle',
                parent=styles['Normal'],
                textColor=colors.white,
                fontSize=9.5,
                fontName='Helvetica-Bold'
            )
            
            story = []
            story.append(Paragraph("TrailSync Monthly Activity Report", title_style))
            story.append(Paragraph(f"Period: {start_date.strftime('%B %d, %Y')} to {end_date.strftime('%B %d, %Y')} ({report_type_label})", subtitle_style))
            story.append(Spacer(1, 10))
            
            # KPI Metrics Table
            story.append(Paragraph("Key Metrics", heading_style))
            kpi_data = [
                [Paragraph("Metric", body_style), Paragraph("Value", body_style)],
                [Paragraph("Treks Conducted", body_style), Paragraph(str(len(conducted_treks)), body_style)],
                [Paragraph("Total Participants", body_style), Paragraph(str(total_participants), body_style)],
                [Paragraph("Average Participants Per Trek", body_style), Paragraph(f"{total_participants / len(conducted_treks):.1f}" if conducted_treks else "0.0", body_style)]
            ]
            t_kpi = Table(kpi_data, colWidths=[200, 100])
            t_kpi.setStyle(TableStyle([
                ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#f7faf7')),
                ('GRID', (0,0), (-1,-1), 1, colors.HexColor('#e2e8f0')),
                ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
                ('PADDING', (0,0), (-1,-1), 8),
            ]))
            story.append(t_kpi)
            story.append(Spacer(1, 15))
            
            # Conducted Treks Table
            story.append(Paragraph("Conducted Treks Details", heading_style))
            trek_data = [
                [
                    Paragraph("Trek Name", header_style),
                    Paragraph("Location", header_style),
                    Paragraph("Start Date", header_style),
                    Paragraph("Duration", header_style),
                    Paragraph("Slots Booked", header_style)
                ]
            ]
            for t, cnt in trek_stats:
                trek_data.append([
                    Paragraph(t.name, body_style),
                    Paragraph(t.location, body_style),
                    Paragraph(t.start_date.strftime('%Y-%m-%d'), body_style),
                    Paragraph(f"{t.duration} Days", body_style),
                    Paragraph(str(cnt), body_style)
                ])
                
            if len(trek_stats) == 0:
                trek_data.append([Paragraph("No treks conducted during this period.", body_style), "", "", "", ""])
                
            t_treks = Table(trek_data, colWidths=[150, 110, 80, 80, 80])
            t_treks.setStyle(TableStyle([
                ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#1e3f20')),
                ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#cbd5e0')),
                ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
                ('PADDING', (0,0), (-1,-1), 6),
            ]))
            story.append(t_treks)
            story.append(Spacer(1, 15))
            
            # Popular Treks Summary
            story.append(Paragraph("Top Popular Treks", heading_style))
            for idx, (t, cnt) in enumerate(popular_treks):
                story.append(Paragraph(f"<b>{idx+1}. {t.name}</b> - {cnt} active bookings ({t.location})", body_style))
                story.append(Spacer(1, 4))
            if not popular_treks:
                story.append(Paragraph("No treks recorded during this period.", body_style))
                
            doc.build(story)
            
            # 2. HTML Email Body
            report_html = f"""<!DOCTYPE html>
<html>
<head>
    <style>
        body {{ font-family: 'Outfit', 'DM Sans', Arial, sans-serif; line-height: 1.6; color: #2d3748; background-color: #f4f7f4; padding: 20px 10px; margin: 0; }}
        .container {{ max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05); border: 1px solid #e2e8f0; }}
        .header {{ background: linear-gradient(135deg, #1e3f20, #0f2411); padding: 35px 20px; text-align: center; color: #ffffff; }}
        .header h1 {{ margin: 0; font-size: 2.0rem; font-weight: 700; color: #f3e5ab; }}
        .content {{ padding: 30px 25px; }}
        .kpi-row {{ display: flex; gap: 15px; margin: 20px 0; justify-content: space-between; }}
        .kpi-card {{ flex: 1; background-color: #f7faf7; border: 1px solid #edf2f7; padding: 15px; border-radius: 8px; text-align: center; }}
        .kpi-val {{ font-size: 1.8rem; font-weight: bold; color: #1e3f20; }}
        .kpi-lbl {{ font-size: 0.8rem; color: #718096; text-transform: uppercase; margin-top: 4px; }}
        .list-item {{ padding: 10px; border-bottom: 1px solid #edf2f7; font-size: 0.95rem; }}
        .footer {{ background-color: #f7faf7; padding: 20px; text-align: center; font-size: 0.8rem; color: #718096; border-top: 1px solid #edf2f7; }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>TrailSync Monthly Report</h1>
            <p style="margin: 5px 0 0 0; color: #c8922a; font-weight: bold;">{start_date.strftime('%B %d, %Y')} to {end_date.strftime('%B %d, %Y')}</p>
        </div>
        <div class="content">
            <p>Hello Admin,</p>
            <p>The monthly trekking activity report has been compiled successfully. Below is a high-level summary of operations and participation. A detailed PDF version is attached to this email.</p>
            
            <div class="kpi-row">
                <div class="kpi-row">
                    <div class="kpi-card">
                        <div class="kpi-val">{len(conducted_treks)}</div>
                        <div class="kpi-lbl">Treks Conducted</div>
                    </div>
                    <div class="kpi-card">
                        <div class="kpi-val">{total_participants}</div>
                        <div class="kpi-lbl">Participants</div>
                    </div>
                </div>
            </div>
            
            <h3 style="color: #1e3f20; margin-top: 25px; border-bottom: 1px solid #e2e8f0; padding-bottom: 5px;">🔥 Top Popular Treks:</h3>
            <div style="margin-top: 10px;">
                {"".join([f'<div class="list-item"><strong>{idx+1}. {t[0].name}</strong> - {t[1]} bookings ({t[0].location})</div>' for idx, t in enumerate(popular_treks)]) if popular_treks else '<div class="list-item">No bookings recorded.</div>'}
            </div>
            
            <p style="margin-top: 25px; font-size: 0.9rem; color: #718096;">The full report includes a breakdown of each trek batch conducted and is saved locally at <code>scratch/reports/</code>.</p>
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
                is_html=True,
                attachment_path=pdf_path
            )
            
            if is_manual:
                update_job_run('Monthly Activity Report', 'Success')
            return f"Generated monthly report and emailed to {admin_email} with PDF attached."
    except Exception as e:
        if is_manual:
            update_job_run('Monthly Activity Report', 'Failed')
        raise e

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
