import sys
import os

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from backend.tasks import send_email_helper

body_html = """<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: 'DM Sans', Arial, sans-serif; line-height: 1.6; color: #2d3748; padding: 10px; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px; background-color: #f7fafc; }
        .header { background-color: #1a2e1a; color: #c8922a; padding: 20px; border-radius: 6px 6px 0 0; text-align: center; }
        .header h2 { margin: 0; color: #c8922a; font-size: 1.5rem; font-weight: 700; }
        .content { padding: 20px 15px; background-color: #ffffff; border-radius: 0 0 6px 6px; }
        .footer { font-size: 0.8rem; text-align: center; color: #718096; margin-top: 20px; }
        .credential-box { background-color: #f7fafc; border: 1px solid #edf2f7; padding: 15px; border-radius: 6px; margin: 15px 0; font-family: monospace; font-size: 0.95rem; }
        .warning-text { color: #e53e3e; font-weight: bold; font-size: 0.95rem; margin: 15px 0; }
        .cta-title { font-weight: 700; color: #1a2e1a; font-size: 1.05rem; margin-top: 20px; margin-bottom: 8px; }
        .welcome-msg { font-size: 1.05rem; margin-bottom: 15px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h2>Welcome to TrailSync!</h2>
        </div>
        <div class="content">
            <p class="welcome-msg">Hi <strong>Test Guide</strong>,</p>
            
            <p>Welcome to the TrailSync Trek Operations Team! We are thrilled to have you join our community of professional guides and outdoor leaders. Your expertise is what keeps our trekkers safe and inspired in the mountains.</p>
            
            <p>A staff account has been set up for you. Below are your temporary login details:</p>
            
            <div class="credential-box">
                <div><strong>Login Email:</strong> jakharbackup@gmail.com</div>
                <div><strong>Temporary Password:</strong> Trailsync@123</div>
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

print("Attempting to send HTML welcome email to jakharbackup@gmail.com...")
success = send_email_helper(
    subject="Welcome to the TrailSync Staff Team!",
    recipient="jakharbackup@gmail.com",
    body=body_html,
    is_html=True
)

if success:
    print("SUCCESS: SMTP HTML email sent successfully!")
else:
    print("FAILED: SMTP HTML email failed to send.")
