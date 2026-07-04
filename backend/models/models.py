"""
Database Models Module
======================
This module defines the SQLAlchemy ORM models for the Trail Sync database.
All three dashboards (Trekker/User, Staff/Guide, Admin) share this same unified database structure.

Table Architecture & Roles Mapping:
-----------------------------------
1. Users table ('users') stores all accounts. The 'role' column differentiates between:
   - 'user': Standard trekker users (User dashboard).
   - 'staff': Guides and instructors (Staff/Guide dashboard).
   - 'admin': Administrators (Admin dashboard).
2. Staff Profiles table ('staff_profiles') extends the 'users' table with guide-specific 
   qualifications, linked via a 1-to-1 relationship.
3. Trek Routes table ('trek_routes') represents the master catalog of destinations.
4. Scheduled Trek Batches table ('treks') contains scheduled route instances with dates, prices, 
   and assigned staff.
5. Bookings table ('bookings') matches trekkers to scheduled trek batches.
6. Checklists, support tickets, group chats, and read receipts have specific tables mapped below.
"""

from flask_sqlalchemy import SQLAlchemy
from flask_login import UserMixin
from datetime import datetime

# Initialize the SQLAlchemy interface instance
db = SQLAlchemy()


class User(db.Model, UserMixin):
    """
    Represents a unified user account in Trail Sync.
    Stores general profile settings for Trekkers, Guides, and Administrators.
    """
    __tablename__ = 'users'
    
    # Primary Key
    id = db.Column(db.Integer, primary_key=True)
    
    # Account Credentials & Identity
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(256), nullable=False)
    name = db.Column(db.String(100), nullable=False)
    
    # Role Selector ('admin', 'staff', 'user') determines dashboard routing
    role = db.Column(db.String(20), nullable=False, default='user')
    
    # Contact Info
    phone = db.Column(db.String(20))
    city = db.Column(db.String(100))
    emergency = db.Column(db.String(20)) # Emergency contact number
    
    # Profile Customizations
    bio = db.Column(db.Text)
    profile_image_url = db.Column(db.String(255))
    dob = db.Column(db.String(50))
    
    # Medical & Trekker Fitness Specs
    blood_group = db.Column(db.String(20))
    medical_info = db.Column(db.Text)
    fitness_level = db.Column(db.String(50))
    
    # Trekking Experience Metrics
    treks_done = db.Column(db.Integer, default=0)
    preferred_difficulty = db.Column(db.String(50))
    preferred_duration = db.Column(db.String(50))
    preferred_regions = db.Column(db.Text)
    
    # Administrative Controls
    active = db.Column(db.Boolean, default=True) # Account status toggle
    blacklisted = db.Column(db.Boolean, default=False) # Blacklisted blocks log in
    blacklist_reason = db.Column(db.Text, nullable=True)
    registered_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Relationships
    # A User (trekker role) can have multiple booking records. Deletes cascade to clean orphan rows.
    bookings = db.relationship('Booking', backref='user', lazy=True, cascade="all, delete-orphan")
    
    # A User (staff role) can be assigned to guide multiple trek batches.
    assigned_treks = db.relationship('Trek', backref='staff', lazy=True)

    def effective_paid_amount(self):
        """
        Calculates the active financial payment amount this user paid across active bookings.
        Ignores cancelled bookings.

        Returns:
            int: Total active paid booking amount.
        """
        if self.role in ('staff', 'admin'):
            return 0

        for booking in self.bookings:
            if booking.status == 'Cancelled':
                continue
            if booking.payment_status == 'Paid' or booking.paid:
                if booking.amount_paid not in (None, 0):
                    return booking.amount_paid
                if booking.booking_price is not None:
                    return booking.booking_price
                if booking.trek and booking.trek.price is not None:
                    return booking.trek.price
        return 0

    def to_json(self):
        """
        Serializes User record details to a JSON-compatible dictionary.
        Generates Member ID code formatting based on role registration year.

        Returns:
            dict: Serialized profile data.
        """
        year_str = self.registered_at.strftime('%y') if self.registered_at else '26'
        if self.role in ('staff', 'admin'):
            member_id = f"TS{year_str}S{self.id:03d}"  # Staff ID e.g., TS26S001
            total_spent = 0
        else:
            member_id = f"TS{year_str}T{self.id:04d}"  # Trekker ID e.g., TS26T0001
            paid_bookings = [
                b for b in self.bookings
                if b.status != 'Cancelled' and (b.payment_status == 'Paid' or b.paid)
            ]
            total_spent = sum(
                b.amount_paid if b.amount_paid not in (None, 0)
                else (b.booking_price or (b.trek.price if b.trek else 0))
                for b in paid_bookings
            )
        return {
            'id': self.id,
            'memberId': member_id,
            'email': self.email,
            'name': self.name,
            'role': self.role,
            'phone': self.phone or '',
            'city': self.city or '',
            'emergency': self.emergency or '',
            'bio': self.bio or '',
            'profile_image_url': self.profile_image_url,
            'dob': self.dob,
            'blood_group': self.blood_group,
            'medical_info': self.medical_info,
            'fitness_level': self.fitness_level,
            'treks_done': self.treks_done,
            'preferred_difficulty': self.preferred_difficulty,
            'preferred_duration': self.preferred_duration,
            'preferred_regions': self.preferred_regions,
            'totalSpent': total_spent,
            'active': self.active,
            'blacklisted': self.blacklisted,
            'blacklistReason': self.blacklist_reason or '',
            'registered': self.registered_at.strftime('%Y-%m-%d') if self.registered_at else ''
        }


class TrekRoute(db.Model):
    """
    Represents the master catalog definition of Trek Routes (Destinations).
    Does not specify dates or schedule batches; defines difficulty, geographical
    coordinates, and default duration descriptors.
    """
    __tablename__ = 'trek_routes'
    
    # Primary Key
    id = db.Column(db.Integer, primary_key=True)
    
    # Catalog Code and Metadata
    trek_code = db.Column(db.String(20), unique=True, nullable=False) # e.g. 'TID001'
    name = db.Column(db.String(150), nullable=False)
    location = db.Column(db.String(150), nullable=False)
    place = db.Column(db.String(200), nullable=True)  # e.g. 'Chamoli district'
    difficulty = db.Column(db.String(20), nullable=False, default='Moderate')
    duration = db.Column(db.Integer, nullable=False, default=5) # In days
    distance = db.Column(db.Integer, nullable=True, default=15) # In km
    image_url = db.Column(db.String(250), nullable=True)
    description = db.Column(db.Text, nullable=True)
    
    # Coordinates for mapping visuals
    latitude = db.Column(db.Float, nullable=True)
    longitude = db.Column(db.Float, nullable=True)
    
    # Master listing visibility toggle
    active = db.Column(db.Boolean, default=True)

    # Relationship to scheduled batches (Trek). Deletes cascade to batch listings.
    batches = db.relationship('Trek', backref='route', lazy=True, cascade="all, delete-orphan")

    def to_json(self):
        """
        Serializes TrekRoute catalog record to a JSON-compatible dictionary.

        Returns:
            dict: Serialized route data.
        """
        return {
            'id': self.id,
            'trekCode': self.trek_code,
            'name': self.name,
            'location': self.location,
            'place': self.place or '',
            'difficulty': self.difficulty,
            'duration': self.duration,
            'distance': self.distance,
            'imageUrl': self.image_url,
            'description': self.description or '',
            'latitude': self.latitude,
            'longitude': self.longitude,
            'active': self.active
        }


class Trek(db.Model):
    """
    Represents a specific scheduled trek batch (instance of a TrekRoute).
    Specifies exact departure/arrival dates, slots capacity, ticket price, 
    assigned guide, and booking registries.
    """
    __tablename__ = 'treks'
    
    # Primary Key
    id = db.Column(db.Integer, primary_key=True)
    
    # ForeignKey links to route definition
    trek_route_id = db.Column(db.Integer, db.ForeignKey('trek_routes.id', ondelete='CASCADE'), nullable=True)
    
    # Batch unique identity code
    batch_code = db.Column(db.String(50), nullable=True) # e.g. 'TID001B02'
    
    # Duplicate route descriptive columns for indexing/speed
    name = db.Column(db.String(150), nullable=False)
    location = db.Column(db.String(150), nullable=False)
    difficulty = db.Column(db.String(20), nullable=False, default='Moderate')
    duration = db.Column(db.Integer, nullable=False, default=5)
    
    # Scheduling & Logistics
    start_date = db.Column(db.Date, nullable=False)
    end_date = db.Column(db.Date, nullable=False)
    slots = db.Column(db.Integer, nullable=False, default=20) # Max registration count
    price = db.Column(db.Integer, nullable=False, default=5000)
    status = db.Column(db.String(20), nullable=False, default='Open') # 'Open', 'Closed', 'Completed'
    
    # Card visual assets
    image_url = db.Column(db.String(250), nullable=True)
    description = db.Column(db.Text, nullable=True)
    latitude = db.Column(db.Float, nullable=True)
    longitude = db.Column(db.Float, nullable=True)
    distance = db.Column(db.Integer, nullable=True, default=15) # in km
    
    # ForeignKey links to assigned guide User
    staff_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)

    # Relationships
    # Bookings made for this batch. Cascade delete booked seats if batch gets deleted.
    bookings = db.relationship('Booking', backref='trek', lazy=True, cascade="all, delete-orphan")

    def to_json(self):
        """
        Serializes Trek batch record to JSON dict. Calculates occupancy slots counts.

        Returns:
            dict: Serialized batch schedule.
        """
        booked_count = db.session.query(Booking).filter(
            Booking.trek_id == self.id,
            Booking.status.in_(['Booked', 'Completed']),
            (Booking.payment_status != 'Failed') | (Booking.payment_status == None)
        ).count()
        return {
            'id': self.id,
            'trekRouteId': self.trek_route_id,
            'batchCode': self.batch_code or f"TID{self.id:03d}B01",
            'name': self.name,
            'location': self.location,
            'place': self.route.place if self.route else '',
            'difficulty': self.difficulty,
            'duration': self.duration,
            'startDate': self.start_date.strftime('%Y-%m-%d') if self.start_date else '',
            'endDate': self.end_date.strftime('%Y-%m-%d') if self.end_date else '',
            'slots': self.slots,
            'booked': booked_count,
            'price': self.price,
            'status': self.status,
            'imageUrl': self.image_url,
            'description': self.description or '',
            'latitude': self.latitude,
            'longitude': self.longitude,
            'distance': self.distance,
            'staff': self.staff.name if self.staff else None,
            'staff_id': self.staff_id
        }


class Booking(db.Model):
    """
    Represents an individual trek batch reservation registry.
    Connects a Trekker User to a scheduled Trek batch. Stores transactional logs,
    payment statuses, and refund states.
    """
    __tablename__ = 'bookings'
    
    # Primary Key
    id = db.Column(db.Integer, primary_key=True)
    
    # User and Batch ForeignKey links
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    trek_id = db.Column(db.Integer, db.ForeignKey('treks.id'), nullable=False)
    
    # Transactional dates & states
    booked_on = db.Column(db.Date, nullable=False, default=datetime.utcnow().date)
    status = db.Column(db.String(20), nullable=False, default='Booked') # 'Booked', 'Cancelled', 'Completed'
    paid = db.Column(db.Boolean, default=True) # General paid status indicator
    
    # Financial metrics logs
    booking_price = db.Column(db.Integer, nullable=True)
    amount_paid = db.Column(db.Integer, nullable=True)
    payment_status = db.Column(db.String(20), nullable=True) # 'Paid', 'Pending', 'Failed'
    payment_method = db.Column(db.String(50), nullable=True, default='—') # Card, UPI, etc.
    payment_details = db.Column(db.Text, nullable=True) # JSON raw logging
    refund_amount = db.Column(db.Integer, nullable=True, default=0)

    @property
    def formatted_payment_details(self):
        """
        Parses payment JSON logging payload to human-readable labels.

        Returns:
            str: Pretty formatting of payment info or 'Pending'/'—'.
        """
        import json
        pm = (self.payment_method or '').lower()
        if not self.payment_method or pm in ('paylater', 'pending', '—') or (self.payment_status and self.payment_status.lower() == 'pending'):
            return 'Pending'
        
        if not self.payment_details:
            return 'Pending' if (self.payment_status and self.payment_status.lower() == 'pending') else '—'
            
        try:
            details = json.loads(self.payment_details) if isinstance(self.payment_details, str) else self.payment_details
            if not isinstance(details, dict):
                return str(details)
            if pm == 'card':
                return f"Card: {details.get('cardName', '')} ({details.get('cardNumber', '')})"
            elif pm == 'upi':
                return f"UPI ID: {details.get('upiId', '')}"
            elif pm == 'netbanking':
                return f"Netbanking: {details.get('bank', '')} ({details.get('bankUserId', '')})"
            elif pm == 'emi':
                return f"EMI: {details.get('emiProvider', '')} - {details.get('emiTenure', '')}"
            else:
                parts = []
                for k, v in details.items():
                    # Format cardName -> Card Name
                    k_nice = ''.join([(' ' + c) if c.isupper() else c for c in k]).strip().title()
                    parts.append(f"{k_nice}: {v}")
                return ", ".join(parts) or '—'
        except Exception:
            return str(self.payment_details)

    @property
    def clean_payment_method(self):
        """
        Sanitizes raw payment method strings to consistent dashboard labels.

        Returns:
            str: Simplified payment channel.
        """
        if not self.payment_method:
            return 'Pending'
        pm = self.payment_method.lower()
        if pm in ('paylater', 'pending', '—'):
            return 'Pending'
        if pm == 'netbanking':
            return 'Netbanking'
        if pm == 'card':
            return 'Card'
        if pm == 'upi':
            return 'UPI'
        if pm == 'emi':
            return 'EMI'
        return self.payment_method

    @property
    def unique_booking_id(self):
        """
        Generates a unique tracking key for this registration voucher.
        Format: [TrekCode][BatchYear][BatchSequence][BookingYear][SequenceDigits]
        E.g. 'TID00126B0126002'

        Returns:
            str: Formatted registration booking key.
        """
        route_code = self.trek.route.trek_code if (self.trek and self.trek.route) else 'TID000'
        batch_year = self.trek.start_date.strftime('%y') if (self.trek and self.trek.start_date) else '26'
        batch_full_code = self.trek.batch_code if self.trek else 'B01'
        batch_code_part = 'B01'
        if batch_full_code and 'B' in batch_full_code:
            idx = batch_full_code.index('B')
            batch_code_part = batch_full_code[idx:]
        elif batch_full_code:
            batch_code_part = batch_full_code[-3:] if len(batch_full_code) >= 3 else 'B01'
        booking_year = self.booked_on.strftime('%y') if self.booked_on else '26'
        seq_digits = f"{self.id:03d}"
        return f"{route_code}{batch_year}{batch_code_part}{booking_year}{seq_digits}"

    def to_json(self):
        """
        Serializes booking dataset items to a JSON-compatible dictionary.

        Returns:
            dict: Serialized booking transaction data.
        """
        guide_info = None
        if self.trek.staff:
            staff_user = self.trek.staff
            profile = staff_user.staff_profile
            year_str = staff_user.registered_at.strftime('%y') if staff_user.registered_at else '26'
            guide_info = {
                'id': staff_user.id,
                'memberId': f"TS{year_str}S{staff_user.id:03d}",
                'name': staff_user.name,
                'phone': staff_user.phone or '',
                'email': staff_user.email,
                'designation': profile.designation if profile else 'Lead Guide',
                'certifications': profile.certifications if profile else 'Wilderness First Responder (WFR)',
                'languages': profile.languages if profile else 'English, Hindi',
                'experienceYears': profile.experience_years if profile else 2,
                'completedTreksCount': profile.completed_treks_count if profile else 10,
                'photoUrl': profile.photo_url if profile else 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&h=300&fit=crop'
            }
        u = self.user
        year_str = u.registered_at.strftime('%y') if u.registered_at else '26'
        member_id = f"TS{year_str}T{u.id:04d}" if u.role == 'user' else f"TS{year_str}S{u.id:03d}"
        return {
            'id': self.id,
            'bookingId': self.unique_booking_id,
            'userId': self.user_id,
            'trekkerId': member_id,
            'trekId': self.trek_id,
            'trekName': self.trek.name,
            'location': self.trek.location,
            'place': self.trek.route.place if self.trek and self.trek.route else '',
            'difficulty': self.trek.difficulty,
            'startDate': self.trek.start_date.strftime('%Y-%m-%d') if self.trek.start_date else '',
            'endDate': self.trek.end_date.strftime('%Y-%m-%d') if self.trek.end_date else '',
            'bookedOn': self.booked_on.strftime('%Y-%m-%d') if self.booked_on else '',
            'status': self.status,
            'price': self.trek.price,
            'paid': self.paid,
            'bookingPrice': self.booking_price or (self.trek.price if self.trek else 5000),
            'amountPaid': self.amount_paid if self.amount_paid not in (None, 0)
                else (self.booking_price if (self.paid or self.payment_status == 'Paid') else (self.trek.price if (self.paid and self.trek) else 0)),
            'paymentStatus': self.payment_status or ('Paid' if self.paid else 'Pending'),
            'paymentMethod': self.clean_payment_method,
            'paymentDetails': self.formatted_payment_details,
            'transactionId': f"TXN{self.booked_on.strftime('%y%m%d')}{self.id:04d}" if (self.paid or self.payment_status == 'Paid') else '—',
            'trekCode': self.trek.route.trek_code if (self.trek and self.trek.route) else f"TID{self.trek_id:03d}",
            'batchId': self.trek.batch_code or f"TID{self.trek_id:03d}B01",
            'batchCode': self.trek.batch_code or f"TID{self.trek_id:03d}B01",
            'latitude': self.trek.latitude,
            'longitude': self.trek.longitude,
            'distance': self.trek.distance,
            'guide': guide_info,
            'refundAmount': self.refund_amount or 0
        }


class StaffProfile(db.Model):
    """
    Extends generic User attributes for staff users (Guides).
    Linked via a 1-to-1 relationship to standard Users database rows where role = 'staff'.
    Holds skills, availability, blocked dates, photo URLs, and historical completions.
    """
    __tablename__ = 'staff_profiles'
    
    # Primary Key
    id = db.Column(db.Integer, primary_key=True)
    
    # User ForeignKey link
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, unique=True)
    
    # Guide Qualifications & Registry info
    skills = db.Column(db.String(250), nullable=True, default='Wilderness First Aid, Navigation')
    experience_years = db.Column(db.Integer, default=2)
    status = db.Column(db.String(20), nullable=False, default='Active') # 'Active', 'Inactive'
    designation = db.Column(db.String(100), nullable=True, default='Lead Guide')
    certifications = db.Column(db.String(250), nullable=True, default='Wilderness First Responder (WFR)')
    languages = db.Column(db.String(200), nullable=True, default='English, Hindi')
    completed_treks_count = db.Column(db.Integer, default=10)
    photo_url = db.Column(db.String(250), nullable=True)
    
    # Comma-separated date string tracking off days or leaves (e.g. '2026-06-15,2026-06-16')
    custom_blocked_dates = db.Column(db.Text, nullable=True, default='')
    
    # Relationship - 1-to-1 link back to User model
    user = db.relationship('User', backref=db.backref('staff_profile', uselist=False, cascade="all, delete-orphan"))

    def to_json(self):
        """
        Serializes StaffProfile details to a JSON dict.

        Returns:
            dict: Serialized profile data.
        """
        return {
            'id': self.id,
            'userId': self.user_id,
            'skills': self.skills or '',
            'experienceYears': self.experience_years,
            'status': self.status,
            'designation': self.designation,
            'certifications': self.certifications,
            'languages': self.languages,
            'completedTreksCount': self.completed_treks_count,
            'photoUrl': self.photo_url,
            'customBlockedDates': self.custom_blocked_dates or ''
        }


class BookingChecklistItem(db.Model):
    """
    Represents an individual packing checklist item assigned to a specific Booking.
    Trekker users toggle completion states on their dashboard.
    """
    __tablename__ = 'booking_checklist_items'
    
    # Primary Key
    id = db.Column(db.Integer, primary_key=True)
    
    # Booking ForeignKey link
    booking_id = db.Column(db.Integer, db.ForeignKey('bookings.id', ondelete='CASCADE'), nullable=False)
    
    # Item info & state
    item_name = db.Column(db.String(150), nullable=False)
    category = db.Column(db.String(50), nullable=False, default='default') # 'default' (system) or 'guide' (custom recommended)
    is_completed = db.Column(db.Boolean, default=False)
    
    # Relationship linked to booking
    booking = db.relationship('Booking', backref=db.backref('checklist_items', lazy=True, cascade="all, delete-orphan"))

    def to_json(self):
        """
        Serializes the checklist item to JSON.

        Returns:
            dict: Serialized checklist item details.
        """
        return {
            'id': self.id,
            'bookingId': self.booking_id,
            'itemName': self.item_name,
            'category': self.category,
            'isCompleted': self.is_completed
        }


class TrekGuideItem(db.Model):
    """
    Represents custom items recommended by the assigned guide for a specific Trek batch.
    Whenever a guide adds/removes items, they are synchronized to the packing lists
    of all active trekker bookings for that batch.
    """
    __tablename__ = 'trek_guide_items'
    
    # Primary Key
    id = db.Column(db.Integer, primary_key=True)
    
    # Trek ForeignKey link
    trek_id = db.Column(db.Integer, db.ForeignKey('treks.id', ondelete='CASCADE'), nullable=False)
    item_name = db.Column(db.String(150), nullable=False)
    
    # Relationship linked to trek
    trek = db.relationship('Trek', backref=db.backref('guide_items', lazy=True, cascade="all, delete-orphan"))

    def to_json(self):
        """
        Serializes guide recommendation item to JSON.

        Returns:
            dict: Serialized item details.
        """
        return {
            'id': self.id,
            'trekId': self.trek_id,
            'itemName': self.item_name
        }


class SupportTicket(db.Model):
    """
    Represents customer support tickets opened by trekkers or staff members.
    Administrators resolve tickets and provide comments (which block dates for leave requests).
    """
    __tablename__ = 'support_tickets'
    
    # Primary Key
    id = db.Column(db.Integer, primary_key=True)
    
    # User ForeignKey link (Nullable for anonymous inquiries if needed)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=True)
    
    # Submitter identity
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120), nullable=False)
    
    # Message content
    subject = db.Column(db.String(150), nullable=False)
    message = db.Column(db.Text, nullable=False)
    
    # Resolution state
    status = db.Column(db.String(20), nullable=False, default='Open') # 'Open', 'Resolved'
    resolution_message = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Relationship back link to user
    user = db.relationship('User', backref=db.backref('support_tickets', lazy=True, cascade="all, delete-orphan"))

    def to_json(self):
        """
        Serializes ticket database details to JSON, parsing the Bracket prefix
        category indicator tags. E.g. '[Payment] refund' parses category as Payments.

        Returns:
            dict: Serialized ticket records.
        """
        import re
        CATEGORY_MAP = {
            'General': 'General Inquiry',
            'Booking': 'Booking & Reservation',
            'Payment': 'Payments & Refunds',
            'Profile': 'Profile & Account Settings',
            'Bug': 'Technical Issue / Bug',
            'Feedback': 'Feedback & Suggestions',
            'Inquiry': 'General Inquiry'
        }
        category = 'General Inquiry'
        clean_subject = self.subject
        if self.subject:
            match = re.match(r'^\[(.*?)\]\s*(.*)$', self.subject)
            if match:
                raw_cat = match.group(1)
                category = CATEGORY_MAP.get(raw_cat, raw_cat)
                clean_subject = match.group(2)
            else:
                category = 'General Inquiry'
                clean_subject = self.subject

        return {
            'id': self.id,
            'ticketId': f"TS26AS{self.id:03d}" if self.id else "TS26AS000",
            'userId': self.user_id,
            'name': self.name,
            'email': self.email,
            'subject': self.subject,
            'cleanSubject': clean_subject,
            'category': category,
            'message': self.message,
            'status': self.status,
            'resolutionMessage': self.resolution_message or '',
            'createdAt': self.created_at.strftime('%Y-%m-%d %H:%M:%S') if self.created_at else ''
        }


class ChatMessage(db.Model):
    """
    Represents an individual text message sent within a specific trek chat room.
    Chat rooms correspond directly to a Trek batch instance. Supports system alerts
    and guide announcement tags.
    """
    __tablename__ = 'chat_messages'
    
    # Primary Key
    id = db.Column(db.Integer, primary_key=True)
    
    # Trek batch and Sender ForeignKey links
    trek_id = db.Column(db.Integer, db.ForeignKey('treks.id', ondelete='CASCADE'), nullable=False)
    sender_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    
    # Cached sender metadata
    sender_name = db.Column(db.String(100), nullable=False)
    sender_role = db.Column(db.String(20), nullable=False)
    
    # Message metadata
    message_text = db.Column(db.Text, nullable=False)
    is_announcement = db.Column(db.Boolean, default=False)
    announcement_title = db.Column(db.String(150), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Relationships
    trek = db.relationship('Trek', backref=db.backref('chat_messages', lazy=True, cascade="all, delete-orphan"))
    sender = db.relationship('User', backref=db.backref('chat_messages', lazy=True, cascade="all, delete-orphan"))

    def to_json(self):
        """
        Serializes chat messages data.

        Returns:
            dict: Serialized message.
        """
        return {
            'id': self.id,
            'trekId': self.trek_id,
            'senderId': self.sender_id,
            'senderName': self.sender_name,
            'senderRole': self.sender_role,
            'messageText': self.message_text,
            'isAnnouncement': self.is_announcement,
            'announcementTitle': self.announcement_title,
            'createdAt': self.created_at.strftime('%Y-%m-%d %H:%M:%S') if self.created_at else ''
        }


class TrekGroupSetting(db.Model):
    """
    Represents chat settings specific to a trek chat room (e.g. locked state).
    Only assigned guides or administrators can unlock/lock groups.
    """
    __tablename__ = 'trek_group_settings'
    
    # Primary Key
    id = db.Column(db.Integer, primary_key=True)
    
    # Trek ForeignKey links
    trek_id = db.Column(db.Integer, db.ForeignKey('treks.id', ondelete='CASCADE'), nullable=False, unique=True)
    is_locked = db.Column(db.Boolean, default=False) # Locked blocks trekkers from sending messages
    
    # Relationship
    trek = db.relationship('Trek', backref=db.backref('chat_settings', uselist=False, cascade="all, delete-orphan"))


class UserAnnouncementRead(db.Model):
    """
    Tracks the last read announcement ID for a user in a specific trek group chat.
    Used to prompt visual unread notifications on the trekker's dashboard.
    """
    __tablename__ = 'user_announcement_reads'
    
    # Primary Key
    id = db.Column(db.Integer, primary_key=True)
    
    # ForeignKey links
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    trek_id = db.Column(db.Integer, db.ForeignKey('treks.id', ondelete='CASCADE'), nullable=False)
    
    # Tracking marker index
    last_read_message_id = db.Column(db.Integer, default=0)

    # Relationships
    user = db.relationship('User', backref=db.backref('announcement_reads', lazy=True, cascade="all, delete-orphan"))
    trek = db.relationship('Trek', backref=db.backref('announcement_reads', lazy=True, cascade="all, delete-orphan"))
