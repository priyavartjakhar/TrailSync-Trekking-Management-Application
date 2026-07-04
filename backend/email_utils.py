"""
Email Utilities Module
=====================
This module contains helper functions to asynchronously dispatch emails (guide assignment 
and booking cancellation) using background Celery workers, with synchronous fallbacks.
"""

import threading
from flask import current_app
from backend.models.models import User, Trek, Booking


def dispatch_guide_assignment_email(staff_id, trek_id):
    """
    Dispatches a guide assignment notification email asynchronously via Celery.
    If Celery is unavailable, falls back to sending the email synchronously in a daemon thread.

    Parameters:
        staff_id (int): The ID of the assigned staff member.
        trek_id (int): The ID of the assigned trek batch.

    Returns:
        None
    """
    try:
        # Import tasks here to avoid circular imports during celery setup
        from backend.tasks import send_guide_assignment_email
        staff = User.query.get(staff_id)
        trek = Trek.query.get(trek_id)
        if staff and trek:
            recipient_email = staff.email
            trek_name = trek.name
            batch_code = trek.batch_code or f"TID{trek.id:03d}B01"
            start_date_str = trek.start_date.strftime('%Y-%m-%d') if trek.start_date else 'N/A'
            end_date_str = trek.end_date.strftime('%Y-%m-%d') if trek.end_date else 'N/A'
            total_slots = trek.slots if trek.slots is not None else 'N/A'
            
            print(f"[EMAIL] Dispatching assignment email → {recipient_email} for trek '{trek_name}' ({batch_code})")
            
            # Using current_app context inside thread run
            app_context = current_app._get_current_object()
            
            def run_async():
                with app_context.app_context():
                    try:
                        # Queue Celery task
                        send_guide_assignment_email.delay(
                            staff_id, trek_id,
                            recipient_email=recipient_email,
                            trek_name=trek_name,
                            batch_code=batch_code,
                            start_date_str=start_date_str,
                            end_date_str=end_date_str,
                            total_slots=total_slots
                        )
                        print(f"[EMAIL] Celery task queued for {recipient_email}")
                    except Exception as e:
                        print(f"[EMAIL] Celery unavailable ({e}), sending synchronously to {recipient_email}...")
                        current_app.logger.error(f"Error dispatching celery guide assignment email task: {e}")
                        try:
                            # Synchronous fallback
                            send_guide_assignment_email(
                                staff_id, trek_id,
                                recipient_email=recipient_email,
                                trek_name=trek_name,
                                batch_code=batch_code,
                                start_date_str=start_date_str,
                                end_date_str=end_date_str,
                                total_slots=total_slots
                            )
                            print(f"[EMAIL] Synchronous send completed for {recipient_email}")
                        except Exception as ex:
                            print(f"[EMAIL] ERROR: Synchronous send also failed for {recipient_email}: {ex}")
                            current_app.logger.error(f"Error sending guide assignment email synchronously: {ex}")
            
            # Start the background thread
            threading.Thread(target=run_async, daemon=True).start()
        else:
            print(f"[EMAIL] ERROR: Cannot dispatch — Staff {staff_id} or Trek {trek_id} not found in DB")
            current_app.logger.error(f"Cannot dispatch email: Staff {staff_id} or Trek {trek_id} not found in DB")
    except Exception as e:
        print(f"[EMAIL] ERROR preparing dispatch: {e}")
        current_app.logger.error(f"Error preparing guide assignment email dispatch: {e}")


def dispatch_booking_cancellation_email(booking_id):
    """
    Dispatches a booking cancellation confirmation email asynchronously via Celery.
    If Celery is unavailable, falls back to sending the email synchronously in a daemon thread.

    Parameters:
        booking_id (int): The ID of the cancelled booking.

    Returns:
        None
    """
    try:
        # Import tasks here to avoid circular imports during celery setup
        from backend.tasks import send_booking_cancellation_email
        booking = Booking.query.get(booking_id)
        if booking:
            recipient_email = booking.user.email
            print(f"[EMAIL] Dispatching booking cancellation email → {recipient_email} for booking {booking_id}")
            
            # Using current_app context inside thread run
            app_context = current_app._get_current_object()
            
            def run_async():
                with app_context.app_context():
                    try:
                        # Queue Celery task
                        send_booking_cancellation_email.delay(booking_id)
                        print(f"[EMAIL] Celery task queued for cancellation email to {recipient_email}")
                    except Exception as e:
                        print(f"[EMAIL] Celery unavailable ({e}), sending cancellation email synchronously to {recipient_email}...")
                        current_app.logger.error(f"Error dispatching celery booking cancellation email task: {e}")
                        try:
                            # Synchronous fallback
                            send_booking_cancellation_email(booking_id)
                            print(f"[EMAIL] Synchronous cancellation email send completed for {recipient_email}")
                        except Exception as ex:
                            print(f"[EMAIL] ERROR: Synchronous cancellation email send also failed for {recipient_email}: {ex}")
                            current_app.logger.error(f"Error sending booking cancellation email synchronously: {ex}")
            
            # Start the background thread
            threading.Thread(target=run_async, daemon=True).start()
        else:
            print(f"[EMAIL] ERROR: Cannot dispatch cancellation email — Booking {booking_id} not found in DB")
            current_app.logger.error(f"Cannot dispatch cancellation email: Booking {booking_id} not found in DB")
    except Exception as e:
        print(f"[EMAIL] ERROR preparing cancellation email dispatch: {e}")
        current_app.logger.error(f"Error preparing booking cancellation email dispatch: {e}")
