import sys
import os

# Adjust path to import backend modules
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from backend.tasks import send_email_helper

print("Attempting to send SMTP welcome email to jakharbackup@gmail.com...")
success = send_email_helper(
    subject="TrailSync SMTP Verification Test",
    recipient="jakharbackup@gmail.com",
    body="Hello! This is a test email sent from TrailSync to verify Gmail SMTP configuration."
)

if success:
    print("SUCCESS: SMTP email sent successfully!")
else:
    print("FAILED: SMTP email failed to send. Check logs.")
