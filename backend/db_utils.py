"""
Database Shared Utilities Module
===============================
This module defines common database operations used across multiple routes/blueprints
in Trail Sync.
"""

from datetime import date
from backend.models.models import db, Trek, Booking
from backend.redis_utils import invalidate_all_trek_caches


def update_completed_bookings():
    """
    Checks the system for past treks and active bookings whose end dates have passed,
    and updates their status to 'Completed'. Also invalidates the Redis cache if changes are made.

    Returns:
        None
    """
    try:
        # Find all treks that are still 'Open' or 'Closed' but have already ended
        past_treks = Trek.query.filter(
            Trek.status.in_(['Open', 'Closed']),
            Trek.end_date < date.today()
        ).all()
        
        updated = False
        if past_treks:
            for t in past_treks:
                t.status = 'Completed'
            updated = True
            
        # Find all bookings that are still 'Booked' but the trek has ended
        past_bookings = Booking.query.join(Trek).filter(
            Booking.status == 'Booked',
            Trek.end_date < date.today()
        ).all()
        if past_bookings:
            for b in past_bookings:
                b.status = 'Completed'
            updated = True
            
        # Commit modifications and invalidate all trek-related caches if updates occurred
        if updated:
            db.session.commit()
            invalidate_all_trek_caches()
    except Exception as e:
        print(f"Error updating completed bookings: {e}")
