from flask_sqlalchemy import SQLAlchemy
from flask_login import UserMixin
from datetime import datetime

db = SQLAlchemy()

class User(db.Model, UserMixin):
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(256), nullable=False)
    name = db.Column(db.String(100), nullable=False)
    role = db.Column(db.String(20), nullable=False, default='user') # 'admin', 'staff', 'user'
    phone = db.Column(db.String(20))
    city = db.Column(db.String(100))
    emergency = db.Column(db.String(20))
    bio = db.Column(db.Text)
    profile_image_url = db.Column(db.String(255))
    dob = db.Column(db.String(50))
    blood_group = db.Column(db.String(20))
    medical_info = db.Column(db.Text)
    fitness_level = db.Column(db.String(50))
    treks_done = db.Column(db.Integer, default=0)
    preferred_difficulty = db.Column(db.String(50))
    preferred_duration = db.Column(db.String(50))
    preferred_regions = db.Column(db.Text)
    active = db.Column(db.Boolean, default=True)
    blacklisted = db.Column(db.Boolean, default=False)
    blacklist_reason = db.Column(db.Text, nullable=True)
    registered_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Relationships
    bookings = db.relationship('Booking', backref='user', lazy=True, cascade="all, delete-orphan")
    assigned_treks = db.relationship('Trek', backref='staff', lazy=True)

    def to_json(self):
        year_str = self.registered_at.strftime('%y') if self.registered_at else '26'
        if self.role in ('staff', 'admin'):
            member_id = f"TS{year_str}S{self.id:03d}"
        else:
            member_id = f"TS{year_str}T{self.id:04d}"
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
            'active': self.active,
            'blacklisted': self.blacklisted,
            'blacklistReason': self.blacklist_reason or '',
            'registered': self.registered_at.strftime('%Y-%m-%d') if self.registered_at else ''
        }

class TrekRoute(db.Model):
    __tablename__ = 'trek_routes'
    
    id = db.Column(db.Integer, primary_key=True)
    trek_code = db.Column(db.String(20), unique=True, nullable=False) # e.g. 'TID001'
    name = db.Column(db.String(150), nullable=False)
    location = db.Column(db.String(150), nullable=False)
    difficulty = db.Column(db.String(20), nullable=False, default='Moderate')
    duration = db.Column(db.Integer, nullable=False, default=5)
    distance = db.Column(db.Integer, nullable=True, default=15)
    image_url = db.Column(db.String(250), nullable=True)
    description = db.Column(db.Text, nullable=True)
    latitude = db.Column(db.Float, nullable=True)
    longitude = db.Column(db.Float, nullable=True)
    active = db.Column(db.Boolean, default=True)

    # Relationship to scheduled batches (Trek)
    batches = db.relationship('Trek', backref='route', lazy=True, cascade="all, delete-orphan")

    def to_json(self):
        return {
            'id': self.id,
            'trekCode': self.trek_code,
            'name': self.name,
            'location': self.location,
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
    __tablename__ = 'treks'
    
    id = db.Column(db.Integer, primary_key=True)
    trek_route_id = db.Column(db.Integer, db.ForeignKey('trek_routes.id', ondelete='CASCADE'), nullable=True)
    batch_code = db.Column(db.String(50), nullable=True)
    name = db.Column(db.String(150), nullable=False)
    location = db.Column(db.String(150), nullable=False)
    difficulty = db.Column(db.String(20), nullable=False, default='Moderate') # 'Easy', 'Moderate', 'Hard'
    duration = db.Column(db.Integer, nullable=False, default=5)
    start_date = db.Column(db.Date, nullable=False)
    end_date = db.Column(db.Date, nullable=False)
    slots = db.Column(db.Integer, nullable=False, default=20)
    price = db.Column(db.Integer, nullable=False, default=5000)
    status = db.Column(db.String(20), nullable=False, default='Open') # 'Open', 'Closed', 'Completed'
    image_url = db.Column(db.String(250), nullable=True)
    description = db.Column(db.Text, nullable=True)
    latitude = db.Column(db.Float, nullable=True)
    longitude = db.Column(db.Float, nullable=True)
    distance = db.Column(db.Integer, nullable=True, default=15) # in km
    staff_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)

    # Relationships
    bookings = db.relationship('Booking', backref='trek', lazy=True, cascade="all, delete-orphan")

    def to_json(self):
        booked_count = db.session.query(Booking).filter(
            Booking.trek_id == self.id,
            Booking.status == 'Booked',
            (Booking.payment_status != 'Failed') | (Booking.payment_status == None)
        ).count()
        return {
            'id': self.id,
            'trekRouteId': self.trek_route_id,
            'batchCode': self.batch_code or f"TID{self.id:03d}B01",
            'name': self.name,
            'location': self.location,
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
    __tablename__ = 'bookings'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    trek_id = db.Column(db.Integer, db.ForeignKey('treks.id'), nullable=False)
    booked_on = db.Column(db.Date, nullable=False, default=datetime.utcnow().date)
    status = db.Column(db.String(20), nullable=False, default='Booked') # 'Booked', 'Cancelled', 'Completed'
    paid = db.Column(db.Boolean, default=True)
    booking_price = db.Column(db.Integer, nullable=True)
    amount_paid = db.Column(db.Integer, nullable=True)
    payment_status = db.Column(db.String(20), nullable=True) # 'Paid', 'Pending', 'Failed'

    @property
    def unique_booking_id(self):
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
            'difficulty': self.trek.difficulty,
            'startDate': self.trek.start_date.strftime('%Y-%m-%d') if self.trek.start_date else '',
            'endDate': self.trek.end_date.strftime('%Y-%m-%d') if self.trek.end_date else '',
            'bookedOn': self.booked_on.strftime('%Y-%m-%d') if self.booked_on else '',
            'status': self.status,
            'price': self.trek.price,
            'paid': self.paid,
            'bookingPrice': self.booking_price or (self.trek.price if self.trek else 5000),
            'amountPaid': self.amount_paid or (self.trek.price if (self.paid and self.trek) else 0),
            'paymentStatus': self.payment_status or ('Paid' if self.paid else 'Pending'),
            'latitude': self.trek.latitude,
            'longitude': self.trek.longitude,
            'distance': self.trek.distance,
            'guide': guide_info
        }

class StaffProfile(db.Model):
    __tablename__ = 'staff_profiles'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, unique=True)
    skills = db.Column(db.String(250), nullable=True, default='Wilderness First Aid, Navigation')
    experience_years = db.Column(db.Integer, default=2)
    status = db.Column(db.String(20), nullable=False, default='Active') # 'Active', 'Inactive'
    designation = db.Column(db.String(100), nullable=True, default='Lead Guide')
    certifications = db.Column(db.String(250), nullable=True, default='Wilderness First Responder (WFR)')
    languages = db.Column(db.String(200), nullable=True, default='English, Hindi')
    completed_treks_count = db.Column(db.Integer, default=10)
    photo_url = db.Column(db.String(250), nullable=True)
    
    # Relationship
    user = db.relationship('User', backref=db.backref('staff_profile', uselist=False, cascade="all, delete-orphan"))

    def to_json(self):
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
            'photoUrl': self.photo_url
        }

class BookingChecklistItem(db.Model):
    __tablename__ = 'booking_checklist_items'
    
    id = db.Column(db.Integer, primary_key=True)
    booking_id = db.Column(db.Integer, db.ForeignKey('bookings.id', ondelete='CASCADE'), nullable=False)
    item_name = db.Column(db.String(150), nullable=False)
    category = db.Column(db.String(50), nullable=False, default='default') # 'default' or 'guide'
    is_completed = db.Column(db.Boolean, default=False)
    
    # Relationship
    booking = db.relationship('Booking', backref=db.backref('checklist_items', lazy=True, cascade="all, delete-orphan"))

    def to_json(self):
        return {
            'id': self.id,
            'bookingId': self.booking_id,
            'itemName': self.item_name,
            'category': self.category,
            'isCompleted': self.is_completed
        }

class TrekGuideItem(db.Model):
    __tablename__ = 'trek_guide_items'
    
    id = db.Column(db.Integer, primary_key=True)
    trek_id = db.Column(db.Integer, db.ForeignKey('treks.id', ondelete='CASCADE'), nullable=False)
    item_name = db.Column(db.String(150), nullable=False)
    
    # Relationship
    trek = db.relationship('Trek', backref=db.backref('guide_items', lazy=True, cascade="all, delete-orphan"))
    def to_json(self):
        return {
            'id': self.id,
            'trekId': self.trek_id,
            'itemName': self.item_name
        }

class SupportTicket(db.Model):
    __tablename__ = 'support_tickets'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120), nullable=False)
    subject = db.Column(db.String(150), nullable=False)
    message = db.Column(db.Text, nullable=False)
    status = db.Column(db.String(20), nullable=False, default='Open') # 'Open', 'Resolved'
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Relationship to user
    user = db.relationship('User', backref=db.backref('support_tickets', lazy=True, cascade="all, delete-orphan"))

    def to_json(self):
        return {
            'id': self.id,
            'userId': self.user_id,
            'name': self.name,
            'email': self.email,
            'subject': self.subject,
            'message': self.message,
            'status': self.status,
            'createdAt': self.created_at.strftime('%Y-%m-%d %H:%M:%S') if self.created_at else ''
        }
