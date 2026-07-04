import os
import jwt
from functools import wraps
from flask import Flask, send_from_directory, request, jsonify, redirect, url_for, make_response, g
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime, date, timedelta
import redis
import json

from backend.models.models import db, User, Trek, Booking, StaffProfile, BookingChecklistItem, TrekGuideItem, SupportTicket, TrekRoute, ChatMessage, TrekGroupSetting, UserAnnouncementRead

app = Flask(__name__, 
            template_folder=os.path.join(os.path.dirname(__file__), '../frontend'),
            static_folder=os.path.join(os.path.dirname(__file__), '../frontend/static'))
app.config['SECRET_KEY'] = 'trailsync-secret-key-123456'
if os.environ.get('TESTING') == 'true':
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///:memory:'
else:
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///' + os.path.join(os.path.dirname(__file__), 'tma.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db.init_app(app)

# ── JWT AUTHENTICATION UTILITIES ──────────────────────────────
JWT_SECRET = app.config['SECRET_KEY']

def generate_token(user_id, role):
    payload = {
        'user_id': user_id,
        'role': role,
        'exp': datetime.utcnow() + timedelta(days=1)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm='HS256')

def decode_token(token):
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=['HS256'])
        return payload
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None

def jwt_required(roles=None):
    def decorator(f):
        @wraps(f)
        def decorated(*args, **kwargs):
            token = None
            
            # Check Authorization Header
            auth_header = request.headers.get('Authorization')
            if auth_header and auth_header.startswith('Bearer '):
                token = auth_header.split(' ')[1]
            
            # Fallback to Cookie
            if not token:
                token = request.cookies.get('access_token')
                
            if not token:
                if request.path.startswith('/api/'):
                    return jsonify({'error': 'Authentication token is missing.'}), 401
                return redirect(url_for('home'))
                
            payload = decode_token(token)
            if not payload:
                if request.path.startswith('/api/'):
                    return jsonify({'error': 'Token is invalid or expired.'}), 401
                return redirect(url_for('home'))
                
            # Fetch user
            user = db.session.get(User, payload['user_id'])
            if not user or not user.active or user.blacklisted:
                if request.path.startswith('/api/'):
                    return jsonify({'error': 'User account is inactive or blacklisted.'}), 403
                return redirect(url_for('home'))
                
            # Check role
            if roles and payload['role'] not in roles:
                if request.path.startswith('/api/'):
                    return jsonify({'error': 'Access denied. Insufficient permissions.'}), 403
                return redirect(url_for('home'))
                
            g.current_user = user
            return f(*args, **kwargs)
        return decorated
    return decorator

from werkzeug.local import LocalProxy
current_user = LocalProxy(lambda: getattr(g, 'current_user', None))

def login_required(f):
    return jwt_required()(f)


# Redis client configuration
try:
    redis_client = redis.StrictRedis(host='localhost', port=6379, db=0, decode_responses=True)
except Exception as e:
    print("Redis failed to initialize:", e)
    redis_client = None

def get_open_treks_cached():
    if redis_client:
        try:
            cached = redis_client.get('open_treks')
            if cached:
                return json.loads(cached)
        except Exception as e:
            print("Redis get cache error:", e)
            
    # Fallback to database query: fetch active TrekRoutes
    active_routes = TrekRoute.query.filter_by(active=True).all()
    routes_json = []
    from datetime import date
    for r in active_routes:
        r_json = r.to_json()
        # Find open batches for this route whose start date is not in the past
        open_batches = Trek.query.filter(
            Trek.trek_route_id == r.id,
            Trek.status == 'Open',
            Trek.start_date >= date.today()
        ).all()
        r_json['batches'] = [b.to_json() for b in open_batches]
        routes_json.append(r_json)
        
    if redis_client:
        try:
            redis_client.setex('open_treks', 300, json.dumps(routes_json))
        except Exception as e:
            print("Redis set cache error:", e)
            
    return routes_json

def invalidate_open_treks_cache():
    if redis_client:
        try:
            redis_client.delete('open_treks')
        except Exception as e:
            print("Redis delete cache error:", e)

def dispatch_guide_assignment_email(staff_id, trek_id):
    try:
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
            
            import threading
            def run_async():
                try:
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
                    app.logger.error(f"Error dispatching celery guide assignment email task: {e}")
                    try:
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
                        app.logger.error(f"Error sending guide assignment email synchronously: {ex}")
            
            threading.Thread(target=run_async, daemon=True).start()
        else:
            print(f"[EMAIL] ERROR: Cannot dispatch — Staff {staff_id} or Trek {trek_id} not found in DB")
            app.logger.error(f"Cannot dispatch email: Staff {staff_id} or Trek {trek_id} not found in DB")
    except Exception as e:
        print(f"[EMAIL] ERROR preparing dispatch: {e}")
        app.logger.error(f"Error preparing guide assignment email dispatch: {e}")



def seed_db(force=False):
    if force:
        db.session.remove()
        db.drop_all()
    db.create_all()
    
    # Seed Admin
    admin = User(
        email='admin@trailsync.com',
        password_hash=generate_password_hash('admin123'),
        name='Admin',
        role='admin',
        registered_at=datetime(2026, 6, 1, 10, 0, 0)
    )
    db.session.add(admin)
    
    # Seed Test Trekker User
    test_user = User(
        email='test@gmail.com',
        password_hash=generate_password_hash('123456'),
        name='Test Trekker',
        role='user',
        registered_at=datetime(2026, 6, 1, 10, 30, 0)
    )
    db.session.add(test_user)
    
    # Seed 10 mock staff members
    staff_emails = [
        ('ravi@trailsync.com', 'Ravi Kumar', '+91 9876543210', 'Lead Guide', 'High Altitude Trekking, Navigation', 6, 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&h=300&fit=crop'),
        ('priya@trailsync.com', 'Priya Singh', '+91 9823456789', 'Assistant Guide', 'Wilderness First Aid, Search & Rescue', 4, 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300&h=300&fit=crop'),
        ('amit@trailsync.com', 'Amit Verma', '+91 9812345678', 'Lead Guide', 'Acclimatization Training, Camp Management', 5, 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=300&fit=crop'),
        ('staff@test.com', 'Test Staff', '+91 9876543219', 'Lead Guide', 'High Altitude Trekking, Wilderness Medicine, Camp Management', 8, 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=300&h=300&fit=crop'),
        ('sunita@trailsync.com', 'Sunita Rao', '+91 9845612378', 'Assistant Guide', 'Navigation, Flora & Fauna Identification', 3, 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&h=300&fit=crop'),
        ('dev@trailsync.com', 'Dev Sharma', '+91 9867543219', 'Lead Guide', 'Alpine Climbing, Glacier Travel', 7, 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&h=300&fit=crop'),
        ('vikram@trailsync.com', 'Vikram Malhotra', '+91 9854321098', 'Lead Guide', 'Winter Mountaineering, Avalanche Rescue', 8, 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=300&h=300&fit=crop'),
        ('neha@trailsync.com', 'Neha Gupta', '+91 9865432109', 'Assistant Guide', 'First Aid, Camp Cookery', 2, 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300&h=300&fit=crop'),
        ('rajesh@trailsync.com', 'Rajesh Patel', '+91 9876541230', 'Lead Guide', 'Trekking Leadership, Photography', 6, 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=300&h=300&fit=crop'),
        ('kavita@trailsync.com', 'Kavita Reddy', '+91 9898765432', 'Assistant Guide', 'Birdwatching, Map & Compass', 3, 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=300&h=300&fit=crop')
    ]
    
    staff_users = []
    for email, name, phone, des, skills, exp, photo in staff_emails:
        u = User(
            email=email,
            password_hash=generate_password_hash('123456' if email == 'staff@test.com' else 'staff123'),
            name=name,
            role='staff',
            phone=phone,
            registered_at=datetime(2026, 6, 5, 9, 0, 0)
        )
        db.session.add(u)
        db.session.flush()
        
        if email == 'staff@test.com':
            prof = StaffProfile(
                user_id=u.id,
                skills=skills,
                experience_years=exp,
                status='Active',
                designation=des,
                certifications='Wilderness First Responder (WFR), Basic Mountaineering Course (BMC)',
                languages='English, Hindi, Nepali',
                completed_treks_count=52,
                photo_url=photo
            )
        else:
            prof = StaffProfile(
                user_id=u.id,
                skills=skills,
                experience_years=exp,
                status='Active',
                designation=des,
                certifications='Wilderness First Responder (WFR)' if 'First' in skills or exp > 5 else 'Basic Mountaineering Course (BMC)',
                languages='English, Hindi, Nepali' if exp > 5 else 'English, Hindi',
                completed_treks_count=exp * 8,
                photo_url=photo
            )
        db.session.add(prof)
        staff_users.append(u)
        
    db.session.commit()

    import random
    # Seed 20 mock trekker users
    trekker_names = [
        ('aryan@mail.com', 'Aryan Mehta'),
        ('sneha@mail.com', 'Sneha Rao'),
        ('kabir@mail.com', 'Kabir Shah'),
        ('ananya@mail.com', 'Ananya Singh'),
        ('riya@mail.com', 'Riya Joshi'),
        ('dev@mail.com', 'Dev Nair'),
        ('priya.k@mail.com', 'Priya Kapoor'),
        ('aditya@mail.com', 'Aditya Sharma'),
        ('rohan@mail.com', 'Rohan Desai'),
        ('meera@mail.com', 'Meera Patel'),
        ('vishal@mail.com', 'Vishal Gupta'),
        ('nisha@mail.com', 'Nisha Tiwari'),
        ('sanjay@mail.com', 'Sanjay Sen'),
        ('divya@mail.com', 'Divya Rao'),
        ('nitin@mail.com', 'Nitin Kumar'),
        ('pooja@mail.com', 'Pooja Shah'),
        ('aarav@mail.com', 'Aarav Mehta'),
        ('ishaan@mail.com', 'Ishaan Verma'),
        ('diya@mail.com', 'Diya Iyer'),
        ('arjun@mail.com', 'Arjun Das')
    ]
    
    trekkers = []
    for email, name in trekker_names:
        u = User(
            email=email,
            password_hash=generate_password_hash('123456'),
            name=name,
            role='user',
            phone=f"98765{random.randint(10000, 99999)}",
            city=random.choice(['Delhi', 'Mumbai', 'Bangalore', 'Pune', 'Kolkata', 'Hyderabad', 'Chennai']),
            emergency=f"+91 90000 {random.randint(10000, 99999)}",
            bio=f"Loves mountains. Acclimatized to {random.choice(['2000m', '3000m', '4000m'])}.",
            registered_at=datetime(2026, 6, 10, 14, 0, 0)
        )
        db.session.add(u)
        trekkers.append(u)
    db.session.commit()

    state_meta = {
      "Andhra Pradesh": {"loc": "Visakhapatnam District, Andhra Pradesh", "lat": 17.6868, "lon": 83.2185},
      "Arunachal Pradesh": {"loc": "Tawang District, Arunachal Pradesh", "lat": 27.5859, "lon": 91.8594},
      "Assam": {"loc": "Guwahati Region, Assam", "lat": 26.1445, "lon": 91.7362},
      "Bihar": {"loc": "Rajgir Hills, Bihar", "lat": 25.0300, "lon": 85.4180},
      "Chhattisgarh": {"loc": "Bastar District, Chhattisgarh", "lat": 19.0700, "lon": 82.0300},
      "Goa": {"loc": "Sattari Taluka, Goa", "lat": 15.5400, "lon": 74.1200},
      "Gujarat": {"loc": "Junagadh District, Gujarat", "lat": 21.5200, "lon": 70.4500},
      "Haryana": {"loc": "Panchkula District, Haryana", "lat": 30.6900, "lon": 76.8600},
      "Himachal Pradesh": {"loc": "Kullu District, Himachal Pradesh", "lat": 32.2396, "lon": 77.1887},
      "Jharkhand": {"loc": "Giridih District, Jharkhand", "lat": 24.1800, "lon": 86.3000},
      "Karnataka": {"loc": "Chikmagalur District, Karnataka", "lat": 13.3161, "lon": 75.7720},
      "Kerala": {"loc": "Wayanad District, Kerala", "lat": 11.6854, "lon": 76.1320},
      "Madhya Pradesh": {"loc": "Hoshangabad District, Madhya Pradesh", "lat": 22.7500, "lon": 77.7200},
      "Maharashtra": {"loc": "Satara District, Maharashtra", "lat": 17.6800, "lon": 73.9800},
      "Manipur": {"loc": "Senapati District, Manipur", "lat": 25.2600, "lon": 94.0100},
      "Meghalaya": {"loc": "East Khasi Hills, Meghalaya", "lat": 25.5700, "lon": 91.8800},
      "Mizoram": {"loc": "Champhai District, Mizoram", "lat": 23.4700, "lon": 93.3200},
      "Nagaland": {"loc": "Kohima District, Nagaland", "lat": 25.6700, "lon": 94.1000},
      "Odisha": {"loc": "Gajapati District, Odisha", "lat": 18.8100, "lon": 84.2200},
      "Rajasthan": {"loc": "Sirohi District, Rajasthan", "lat": 24.8800, "lon": 72.8600},
      "Sikkim": {"loc": "West Sikkim District, Sikkim", "lat": 27.3300, "lon": 88.3000},
      "Tamil Nadu": {"loc": "Nilgiris District, Tamil Nadu", "lat": 11.4100, "lon": 76.7000},
      "Telangana": {"loc": "Vikarabad District, Telangana", "lat": 17.3300, "lon": 77.9000},
      "Tripura": {"loc": "North Tripura District, Tripura", "lat": 24.2600, "lon": 92.1700},
      "Uttar Pradesh": {"loc": "Sonbhadra District, Uttar Pradesh", "lat": 24.6800, "lon": 83.0700},
      "Uttarakhand": {"loc": "Chamoli District, Uttarakhand", "lat": 30.7280, "lon": 79.6053},
      "West Bengal": {"loc": "Darjeeling District, West Bengal", "lat": 27.0500, "lon": 88.2600},
      "Jammu and Kashmir": {"loc": "Sonamarg, Jammu and Kashmir", "lat": 34.3023, "lon": 75.2934},
      "Ladakh": {"loc": "Leh, Ladakh", "lat": 34.1526, "lon": 77.5771}
    }

    custom_trek_meta = {
      "Hampta Pass": {"loc": "Manali, Himachal Pradesh", "lat": 32.2396, "lon": 77.1887, "dist": 35},
      "Kheerganga Trek": {"loc": "Parvati Valley, Himachal Pradesh", "lat": 32.0097, "lon": 77.3486, "dist": 24},
      "Pin Parvati Pass": {"loc": "Kullu, Himachal Pradesh", "lat": 31.8656, "lon": 77.8225, "dist": 110},
      "Triund Trek": {"loc": "Dharamshala, Himachal Pradesh", "lat": 32.2591, "lon": 76.3533, "dist": 18},
      "Buran Ghati": {"loc": "Shimla, Himachal Pradesh", "lat": 31.3283, "lon": 78.1189, "dist": 32},
      "Bhrigu Lake": {"loc": "Manali, Himachal Pradesh", "lat": 32.2921, "lon": 77.2341, "dist": 25},
      "Prashar Lake": {"loc": "Mandi, Himachal Pradesh", "lat": 31.7547, "lon": 77.1021, "dist": 16},
      "Rupin Pass": {"loc": "Sangla, Himachal Pradesh", "lat": 31.1892, "lon": 78.1492, "dist": 52},
      "Friendship Peak": {"loc": "Manali, Himachal Pradesh", "lat": 32.3912, "lon": 77.1481, "dist": 34},
      "Roopkund Trek": {"loc": "Chamoli District, Uttarakhand", "lat": 30.2652, "lon": 79.7324, "dist": 53},
      "Valley of Flowers": {"loc": "Chamoli District, Uttarakhand", "lat": 30.7280, "lon": 79.6053, "dist": 38},
      "Kedarkantha Trek": {"loc": "Uttarkashi, Uttarakhand", "lat": 31.0229, "lon": 78.1723, "dist": 20},
      "Har Ki Dun Trek": {"loc": "Uttarkashi, Uttarakhand", "lat": 31.1444, "lon": 78.4414, "dist": 47},
      "Brahmatal Trek": {"loc": "Chamoli District, Uttarakhand", "lat": 30.1345, "lon": 79.6455, "dist": 28},
      "Kuari Pass Trek": {"loc": "Chamoli District, Uttarakhand", "lat": 30.5414, "lon": 79.5621, "dist": 33},
      "Nanda Devi E.B.C.": {"loc": "Pithoragarh, Uttarakhand", "lat": 30.4356, "lon": 80.0245, "dist": 112},
      "Bali Pass Trek": {"loc": "Uttarkashi, Uttarakhand", "lat": 31.0824, "lon": 78.2934, "dist": 56},
      "Pangarchulla Peak": {"loc": "Chamoli District, Uttarakhand", "lat": 30.5292, "lon": 79.6012, "dist": 36},
      "Kashmir Great Lakes": {"loc": "Sonamarg, Jammu and Kashmir", "lat": 34.3023, "lon": 75.2934, "dist": 72},
      "Tarsar Marsar": {"loc": "Aru Valley, Jammu and Kashmir", "lat": 34.1481, "lon": 75.1481, "dist": 48},
      "Kolahoi Glacier": {"loc": "Pahalgam, Jammu and Kashmir", "lat": 34.1834, "lon": 75.3189, "dist": 26},
      "Tulian Lake": {"loc": "Pahalgam, Jammu and Kashmir", "lat": 33.9912, "lon": 75.3412, "dist": 16},
      "Chadar Trek": {"loc": "Leh, Ladakh", "lat": 34.1526, "lon": 77.5771, "dist": 65},
      "Markha Valley": {"loc": "Leh, Ladakh", "lat": 33.9723, "lon": 77.4225, "dist": 75},
      "Stok Kangri": {"loc": "Leh, Ladakh", "lat": 34.0152, "lon": 77.5852, "dist": 40},
      "Sham Valley Trek": {"loc": "Leh, Ladakh", "lat": 34.2981, "lon": 77.2012, "dist": 32}
    }

    trek_map_data = {
      "Andhra Pradesh":[{"n":"Nagalapuram Falls Trek","diff":"Easy","dur":1},{"n":"Tada Falls Trek","diff":"Easy","dur":1},{"n":"Jindhagada Peak","diff":"Moderate","dur":2},{"n":"Talakona Waterfalls","diff":"Easy","dur":1}],
      "Arunachal Pradesh":[{"n":"Bailey Trail","diff":"Hard","dur":14},{"n":"Seven Lakes Trek","diff":"Hard","dur":12},{"n":"Talle Valley Trek","diff":"Moderate","dur":7},{"n":"Gorichen Base Camp","diff":"Hard","dur":18},{"n":"Mechuka Trek","diff":"Moderate","dur":4}],
      "Assam":[{"n":"Garbhanga Forest","diff":"Moderate","dur":1},{"n":"Nilachal Hill","diff":"Easy","dur":1},{"n":"Joypur Rainforest","diff":"Easy","dur":1}],
      "Bihar":[{"n":"Gurpa Peak","diff":"Easy","dur":1},{"n":"Brahmajuni Hill","diff":"Easy","dur":1},{"n":"Mandar Hill","diff":"Easy","dur":1}],
      "Chhattisgarh":[{"n":"Dholkal Ganesha","diff":"Moderate","dur":1},{"n":"Tirathgarh Waterfall","diff":"Easy","dur":1}],
      "Goa":[{"n":"Dudhsagar Waterfalls","diff":"Moderate","dur":2},{"n":"Todo Waterfalls","diff":"Moderate","dur":1},{"n":"Tambdi Surla","diff":"Moderate","dur":1}],
      "Gujarat":[{"n":"Mount Girnar","diff":"Moderate","dur":1},{"n":"Polo Forest","diff":"Easy","dur":1},{"n":"Saputara Hill","diff":"Easy","dur":1}],
      "Haryana":[{"n":"Morni Hills","diff":"Easy","dur":1},{"n":"Karoh Peak","diff":"Moderate","dur":1}],
      "Himachal Pradesh":[{"n":"Hampta Pass","diff":"Moderate","dur":5},{"n":"Kheerganga Trek","diff":"Easy","dur":2},{"n":"Pin Parvati Pass","diff":"Hard","dur":11},{"n":"Triund Trek","diff":"Easy","dur":2},{"n":"Buran Ghati","diff":"Hard","dur":7},{"n":"Bhrigu Lake","diff":"Moderate","dur":4},{"n":"Prashar Lake","diff":"Easy","dur":2},{"n":"Rupin Pass","diff":"Hard","dur":8},{"n":"Friendship Peak","diff":"Hard","dur":8}],
      "Jharkhand":[{"n":"Parasnath Hill","diff":"Moderate","dur":1},{"n":"Dalma Hill","diff":"Easy","dur":1}],
      "Karnataka":[{"n":"Kumara Parvatha","diff":"Hard","dur":2},{"n":"Kudremukh Trek","diff":"Moderate","dur":2},{"n":"Tadiandamol Peak","diff":"Moderate","dur":2},{"n":"Mullayanagiri Trek","diff":"Easy","dur":1},{"n":"Skandagiri Night Trek","diff":"Moderate","dur":1}],
      "Kerala":[{"n":"Chembra Peak","diff":"Moderate","dur":1},{"n":"Meesapulimala","diff":"Moderate","dur":2},{"n":"Agasthyakoodam","diff":"Hard","dur":3},{"n":"Silent Valley","diff":"Moderate","dur":1},{"n":"Illikkal Kallu","diff":"Easy","dur":1}],
      "Madhya Pradesh":[{"n":"Dhoopgarh","diff":"Easy","dur":1},{"n":"Patalkot Valley","diff":"Moderate","dur":2},{"n":"Chauragarh Peak","diff":"Moderate","dur":1}],
      "Maharashtra":[{"n":"Harishchandragad","diff":"Moderate","dur":2},{"n":"Kalsubai Peak","diff":"Moderate","dur":1},{"n":"Rajmachi Fort","diff":"Easy","dur":2},{"n":"Torna Fort","diff":"Hard","dur":1},{"n":"Andharban Forest","diff":"Moderate","dur":1}],
      "Manipur":[{"n":"Mount Iso","diff":"Moderate","dur":2},{"n":"Shirui Kashong","diff":"Easy","dur":1}],
      "Meghalaya":[{"n":"Double Decker Bridge","diff":"Moderate","dur":1},{"n":"David Scott Trail","diff":"Easy","dur":1},{"n":"Laitlum Canyons","diff":"Easy","dur":1}],
      "Mizoram":[{"n":"Phawngpui","diff":"Moderate","dur":2},{"n":"Reiek Tlang","diff":"Easy","dur":1}],
      "Nagaland":[{"n":"Dzukou Valley","diff":"Moderate","dur":2},{"n":"Mount Saramati","diff":"Hard","dur":4},{"n":"Mount Japfu","diff":"Moderate","dur":2}],
      "Odisha":[{"n":"Mahendragiri","diff":"Moderate","dur":2},{"n":"Deomali Peak","diff":"Easy","dur":1},{"n":"Daringbadi Trails","diff":"Easy","dur":1}],
      "Rajasthan":[{"n":"Guru Shikhar","diff":"Easy","dur":1},{"n":"Kumbhalgarh","diff":"Moderate","dur":2},{"n":"Alwar/Sariska","diff":"Easy","dur":1}],
      "Sikkim":[{"n":"Goechala Trek","diff":"Hard","dur":11},{"n":"Dzongri Trek","diff":"Moderate","dur":7},{"n":"Kanchenjunga B.C.","diff":"Hard","dur":12}],
      "Tamil Nadu":[{"n":"Velliangiri Mountains","diff":"Hard","dur":1},{"n":"Perumal Peak","diff":"Moderate","dur":1},{"n":"Kolli Hills","diff":"Moderate","dur":1},{"n":"Mukurthi Peak","diff":"Moderate","dur":2}],
      "Telangana":[{"n":"Ananthagiri Hills","diff":"Easy","dur":1},{"n":"Bhongir Fort","diff":"Easy","dur":1}],
      "Tripura":[{"n":"Jampui Hills","diff":"Easy","dur":1},{"n":"Chabimura Trek","diff":"Moderate","dur":1}],
      "Uttar Pradesh":[{"n":"Govardhan Hill","diff":"Easy","dur":1},{"n":"Kaimur Wildlife","diff":"Easy","dur":1}],
      "Uttarakhand":[{"n":"Roopkund Trek","diff":"Hard","dur":8},{"n":"Valley of Flowers","diff":"Moderate","dur":6},{"n":"Kedarkantha Trek","diff":"Easy","dur":6},{"n":"Har Ki Dun Trek","diff":"Moderate","dur":7},{"n":"Brahmatal Trek","diff":"Moderate","dur":6},{"n":"Kuari Pass Trek","diff":"Moderate","dur":6},{"n":"Nanda Devi E.B.C.","diff":"Hard","dur":12},{"n":"Bali Pass Trek","diff":"Hard","dur":8},{"n":"Pangarchulla Peak","diff":"Hard","dur":7}],
      "West Bengal":[{"n":"Sandakphu Trek","diff":"Moderate","dur":6},{"n":"Phalut Trek","diff":"Moderate","dur":7},{"n":"Neora Valley","diff":"Moderate","dur":4},{"n":"Tonglu Trek","diff":"Easy","dur":2}],
      "Jammu and Kashmir":[{"n":"Kashmir Great Lakes","diff":"Moderate","dur":8},{"n":"Tarsar Marsar","diff":"Moderate","dur":7},{"n":"Kolahoi Glacier","diff":"Moderate","dur":5},{"n":"Tulian Lake","diff":"Moderate","dur":3}],
      "Ladakh":[{"n":"Chadar Trek","diff":"Hard","dur":9},{"n":"Markha Valley","diff":"Moderate","dur":8},{"n":"Stok Kangri","diff":"Hard","dur":9},{"n":"Sham Valley Trek","diff":"Easy","dur":4}]
    }

    # Load unique Unsplash images
    unsplash_images = []
    json_path = os.path.join(os.path.dirname(__file__), 'unsplash_images.json')
    if os.path.exists(json_path):
        try:
            with open(json_path, 'r') as f:
                unsplash_images = json.load(f)
        except Exception as e:
            print("Error loading unsplash_images.json:", e)
            
    if not unsplash_images:
        unsplash_images = [
            "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&q=80",
            "https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=800&q=80",
            "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=800&q=80",
            "https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?w=800&q=80",
            "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800&q=80",
            "https://images.unsplash.com/photo-1472214222541-d510753a4907?w=800&q=80",
            "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&q=80",
            "https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=800&q=80",
            "https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?w=800&q=80",
            "https://images.unsplash.com/photo-1502082553048-f009c37129b9?w=800&q=80"
        ]

    # Seed all trek routes
    route_list = []
    i = 0
    for state, treks_list in trek_map_data.items():
        for t in treks_list:
            name = t["n"]
            diff = t["diff"]
            dur = t["dur"]
            
            image_url = unsplash_images[i % len(unsplash_images)]
            
            if name in custom_trek_meta:
                meta = custom_trek_meta[name]
                loc = meta["loc"]
                lat = meta["lat"]
                lon = meta["lon"]
                dist = meta["dist"]
            else:
                meta = state_meta.get(state, {"loc": f"{state}", "lat": 20.0, "lon": 78.0})
                loc = meta["loc"]
                lat = meta["lat"]
                lon = meta["lon"]
                dist = max(5, dur * 8 + (i % 7))
                
            desc = f"Explore the natural trails, panoramic peaks, and wilderness of {name}."
            route = TrekRoute(
                trek_code=f"TID{i+1:03d}",
                name=name,
                location=loc,
                difficulty=diff,
                duration=dur,
                distance=dist,
                image_url=image_url,
                description=desc,
                latitude=lat,
                longitude=lon,
                active=True
            )
            db.session.add(route)
            route_list.append(route)
            i += 1
            
    db.session.flush()

    # Now seed batches (Trek objects) for the first 10 routes
    all_treks = []
    from datetime import date, timedelta
    routes_to_seed = route_list[:10]
    for idx, r in enumerate(routes_to_seed):
        start = date.today() + timedelta(days=10 + idx * 5)
        end = start + timedelta(days=r.duration)
        t_price = 4500 + (idx * 1500)
        t = Trek(
            trek_route_id=r.id,
            batch_code=f"{r.trek_code}B01",
            name=r.name,
            location=r.location,
            difficulty=r.difficulty,
            duration=r.duration,
            start_date=start,
            end_date=end,
            slots=20,
            price=t_price,
            status='Open',
            image_url=r.image_url,
            description=r.description,
            latitude=r.latitude,
            longitude=r.longitude,
            distance=r.distance
        )
        db.session.add(t)
        all_treks.append(t)
    db.session.flush()

    for idx, t in enumerate(all_treks):
        staff_member = staff_users[idx % len(staff_users)]
        t.staff_id = staff_member.id
    db.session.flush()
    db.session.commit()

    # Seed guide recommended items for popular treks first
    popular_trek_names = ["Valley of Flowers", "Hampta Pass", "Kedarkantha Trek"]
    for trek_name in popular_trek_names:
        t_obj = Trek.query.filter_by(name=trek_name).first()
        if t_obj:
            guide_items = [
                "High-SPF sunscreen & UV-protection sunglasses",
                "Warm gloves and woolen cap",
                "Energy bars and ORS hydration packets"
            ]
            for gi in guide_items:
                db.session.add(TrekGuideItem(trek_id=t_obj.id, item_name=gi))
    db.session.commit()

    # Seed bookings and packing lists for the seeded treks
    if len(trekkers) >= 8 and len(all_treks) >= 3:
        # Trek 1 bookings:
        b1 = Booking(
            user_id=trekkers[0].id,
            trek_id=all_treks[0].id,
            booked_on=date.today() - timedelta(days=5),
            status='Booked',
            paid=True,
            booking_price=all_treks[0].price,
            amount_paid=all_treks[0].price,
            payment_status='Paid'
        )
        b2 = Booking(
            user_id=trekkers[1].id,
            trek_id=all_treks[0].id,
            booked_on=date.today() - timedelta(days=4),
            status='Booked',
            paid=True,
            booking_price=all_treks[0].price,
            amount_paid=all_treks[0].price,
            payment_status='Paid'
        )
        b3 = Booking(
            user_id=trekkers[2].id,
            trek_id=all_treks[0].id,
            booked_on=date.today() - timedelta(days=3),
            status='Booked',
            paid=False,
            booking_price=all_treks[0].price,
            amount_paid=0,
            payment_status='Pending'
        )
        db.session.add_all([b1, b2, b3])

        # Trek 2 bookings:
        b4 = Booking(
            user_id=trekkers[3].id,
            trek_id=all_treks[1].id,
            booked_on=date.today() - timedelta(days=6),
            status='Booked',
            paid=True,
            booking_price=all_treks[1].price,
            amount_paid=all_treks[1].price,
            payment_status='Paid'
        )
        b5 = Booking(
            user_id=trekkers[4].id,
            trek_id=all_treks[1].id,
            booked_on=date.today() - timedelta(days=2),
            status='Booked',
            paid=False,
            booking_price=all_treks[1].price,
            amount_paid=0,
            payment_status='Failed'
        )
        db.session.add_all([b4, b5])

        # Trek 3 bookings:
        b6 = Booking(
            user_id=trekkers[5].id,
            trek_id=all_treks[2].id,
            booked_on=date.today() - timedelta(days=7),
            status='Booked',
            paid=True,
            booking_price=all_treks[2].price,
            amount_paid=all_treks[2].price,
            payment_status='Paid'
        )
        b7 = Booking(
            user_id=trekkers[6].id,
            trek_id=all_treks[2].id,
            booked_on=date.today() - timedelta(days=10),
            status='Cancelled',
            paid=False,
            booking_price=all_treks[2].price,
            amount_paid=all_treks[2].price,
            refund_amount=all_treks[2].price,
            payment_status='Refunded'
        )
        db.session.add_all([b6, b7])
    
    db.session.commit()

    # Seed mock support tickets
    tickets = [
        SupportTicket(
            name='Kabir Shah',
            email='kabir@mail.com',
            subject='Refund query for cancelled trek',
            message='Hi, I cancelled my booking for Kedarkantha Trek 3 days ago but I have not received the refund yet. Can you please check?',
            status='Open'
        ),
        SupportTicket(
            name='Sneha Rao',
            email='sneha@mail.com',
            subject='Difficulty query for Hampta Pass',
            message='Is Hampta Pass trek suitable for beginners with no prior trekking experience? What kind of preparation is required?',
            status='Open'
        ),
        SupportTicket(
            name='Aryan Mehta',
            email='aryan@mail.com',
            subject='Medical certificate upload failure',
            message='I am trying to upload my medical fitness certificate but it keeps throwing an error: Invalid File Format. The file is a PDF.',
            status='Open'
        ),
        SupportTicket(
            name='Riya Joshi',
            email='riya@mail.com',
            subject='Guide contact info',
            message='Hello, where can I find the contact details of the guide assigned to my upcoming trek next week?',
            status='Resolved'
        )
    ]
    for tk in tickets:
        db.session.add(tk)
    db.session.commit()

def normalize_mock_booking_payments():
    from random import Random

    bookings = Booking.query.all()
    for booking in bookings:
        if booking.status == 'Cancelled':
            booking.paid = False
            booking.payment_status = 'Refunded'
            paid_amt = booking.amount_paid or booking.booking_price or (booking.trek.price if booking.trek else 5000)
            if not paid_amt:
                paid_amt = 5000
            booking.amount_paid = paid_amt
            booking.refund_amount = paid_amt
            continue

        base_price = booking.booking_price or (booking.trek.price if booking.trek else 5000)
        seed = (booking.id or 1) * 7919
        rng = Random(seed)
        delta = rng.randint(-650, 1600)
        amount = max(0, base_price + delta)

        booking.booking_price = base_price
        booking.amount_paid = amount
        booking.paid = True
        booking.payment_status = 'Paid'

    db.session.commit()

# Ensure tables are created and seeded
with app.app_context():
    db.create_all()
    try:
        from sqlalchemy import text
        db.session.execute(text("SELECT refund_amount FROM bookings LIMIT 1"))
    except Exception:
        db.session.rollback()
        try:
            db.session.execute(text("ALTER TABLE bookings ADD COLUMN refund_amount INTEGER DEFAULT 0"))
            db.session.commit()
            print("Successfully migrated bookings table with refund_amount column.")
        except Exception as e:
            print("Migration failed:", e)
            db.session.rollback()
            
    if User.query.first() is None:
        seed_db(force=False)
    normalize_mock_booking_payments()


@app.route('/api/public/treks', methods=['GET'])
def get_public_treks():
    treks = Trek.query.all()
    return jsonify([t.to_json() for t in treks])

@app.route('/api/public/trek_routes', methods=['GET'])
def get_public_trek_routes():
    routes = TrekRoute.query.all()
    return jsonify([r.to_json() for r in routes])

# ── SPA CATCH-ALL ─────────────────────────────────────────────
FRONTEND_DIR = os.path.join(os.path.dirname(__file__), '..', 'frontend')

@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve_spa(path):
    if path.startswith('api/') or path.startswith('static/'):
        return jsonify({'error': 'Not found'}), 404
    return send_from_directory(FRONTEND_DIR, 'index.html')



# ── AUTH API ─────────────────────────────────────────────────

@app.route('/api/auth/login', methods=['POST'])
def api_login():
    data = request.get_json() or {}
    email = data.get('email')
    password = data.get('password')
    
    user = User.query.filter_by(email=email).first()
    if not user or not check_password_hash(user.password_hash, password):
        return jsonify({'error': 'Invalid email or password.'}), 400
        
    if user.blacklisted:
        return jsonify({'error': 'This account is blacklisted.'}), 403
        
    if not user.active:
        return jsonify({'error': 'This account is inactive.'}), 403
        
    token = generate_token(user.id, user.role)
    response = make_response(jsonify({
        'success': True,
        'role': user.role,
        'redirect': '/' + user.role if user.role != 'user' else '/dashboard',
        'token': token
    }))
    response.set_cookie('access_token', token, httponly=True, max_age=86400, samesite='Lax')
    return response

@app.route('/api/auth/check-availability', methods=['GET'])
def api_check_availability():
    email = request.args.get('email')
    phone = request.args.get('phone')
    
    response = {}
    if email:
        email_clean = email.strip().lower()
        existing = User.query.filter_by(email=email_clean).first()
        response['email'] = {
            'available': existing is None,
            'message': 'Email is available to register.' if existing is None else 'Email is already registered.'
        }
    if phone:
        phone_clean = phone.strip()
        existing = User.query.filter_by(phone=phone_clean).first() if phone_clean else None
        response['phone'] = {
            'available': existing is None,
            'message': 'Phone number is available to register.' if existing is None else 'Phone number is already registered.'
        }
    return jsonify(response)

@app.route('/api/auth/register', methods=['POST'])
def api_register():
    import os
    import time
    from werkzeug.utils import secure_filename
    
    if request.is_json:
        data = request.get_json() or {}
    else:
        data = request.form
        
    email = data.get('email')
    name = data.get('name')
    phone = data.get('phone')
    password = data.get('password')
    
    if not email or not name or not password:
        return jsonify({'error': 'Please fill all required fields.'}), 400
        
    existing = User.query.filter_by(email=email).first()
    if existing:
        return jsonify({'error': 'Email already registered.'}), 400
        
    profile_image_url = None
    if 'profile_image' in request.files:
        file = request.files['profile_image']
        if file and file.filename != '':
            filename = secure_filename(f"{int(time.time())}_{file.filename}")
            upload_dir = os.path.join(app.root_path, '..', 'frontend', 'static', 'uploads', 'profiles')
            os.makedirs(upload_dir, exist_ok=True)
            file.save(os.path.join(upload_dir, filename))
            profile_image_url = f"/static/uploads/profiles/{filename}"
            
    try:
        treks_done_val = int(data.get('treks_done', 0) or 0)
    except ValueError:
        treks_done_val = 0
        
    user = User(
        email=email,
        name=name,
        phone=phone,
        password_hash=generate_password_hash(password),
        role='user',
        city=data.get('city'),
        emergency=data.get('emergency'),
        bio=data.get('bio'),
        dob=data.get('dob'),
        blood_group=data.get('blood_group'),
        medical_info=data.get('medical_info'),
        fitness_level=data.get('fitness_level'),
        treks_done=treks_done_val,
        preferred_difficulty=data.get('preferred_difficulty'),
        preferred_duration=data.get('preferred_duration'),
        preferred_regions=data.get('preferred_regions'),
        profile_image_url=profile_image_url
    )
    db.session.add(user)
    db.session.commit()
    
    try:
        from backend.tasks import send_welcome_email
        send_welcome_email.delay(user.id)
    except Exception as e:
        app.logger.error(f"Error dispatching welcome email task: {e}")
        
    token = generate_token(user.id, user.role)
    response = make_response(jsonify({
        'success': True,
        'role': user.role,
        'redirect': '/dashboard',
        'token': token
    }))
    response.set_cookie('access_token', token, httponly=True, max_age=86400, samesite='Lax')
    return response

@app.route('/api/auth/logout', methods=['POST'])
@login_required
def api_logout():
    response = make_response(jsonify({'success': True}))
    response.delete_cookie('access_token')
    return response

# ── USER (TREKKER) API ────────────────────────────────────────

def update_completed_bookings():
    try:
        past_bookings = Booking.query.join(Trek).filter(
            Booking.status == 'Booked',
            Trek.start_date < date.today()
        ).all()
        if past_bookings:
            for b in past_bookings:
                b.status = 'Completed'
            db.session.commit()
    except Exception as e:
        print(f"Error updating completed bookings: {e}")

@app.route('/api/user/dashboard_data', methods=['GET'])
@login_required
def user_dashboard_data():
    update_completed_bookings()
    if current_user.role != 'user':
        return jsonify({'error': 'Unauthorized'}), 403
        
    available_treks = get_open_treks_cached()
    
    my_bookings_query = Booking.query.filter_by(user_id=current_user.id, status='Booked').all()
    my_bookings = [b.to_json() for b in my_bookings_query]
    
    history_query = Booking.query.filter(
        Booking.user_id == current_user.id,
        Booking.status.in_(['Completed', 'Cancelled'])
    ).all()
    trek_history = [b.to_json() for b in history_query]
    
    profile = current_user.to_json()
    
    return jsonify({
        'available_treks': available_treks,
        'my_bookings': my_bookings,
        'trek_history': trek_history,
        'profile': profile
    })

@app.route('/api/bookings/book', methods=['POST'])
@login_required
def book_trek():
    if current_user.role != 'user':
        return jsonify({'error': 'Unauthorized'}), 403
        
    data = request.get_json() or {}
    trek_id = data.get('trek_id')
    payment_method = data.get('payment_method')
    payment_details = data.get('payment_details')
    
    trek = Trek.query.get(trek_id)
    if not trek:
        return jsonify({'error': 'Trek not found.'}), 404
        
    if trek.status != 'Open':
        return jsonify({'error': 'Trek is not open for bookings.'}), 400
        
    from datetime import date
    if trek.start_date and trek.start_date < date.today():
        return jsonify({'error': 'Trek has already started. Booking is closed.'}), 400
        
    booked_count = Booking.query.filter_by(trek_id=trek_id, status='Booked').count()
    if booked_count >= trek.slots:
        return jsonify({'error': 'Trek is full.'}), 400
        
    existing = Booking.query.filter_by(user_id=current_user.id, trek_id=trek_id, status='Booked').first()
    if existing:
        return jsonify({'error': 'You have already booked this trek.'}), 400
        
    payment_status = data.get('payment_status', 'Paid')
    booking_price = trek.price
    paid = (payment_status == 'Paid')
    amount_paid = booking_price if paid else 0

    booking = Booking(
        user_id=current_user.id,
        trek_id=trek_id,
        status='Booked',
        paid=paid,
        booking_price=booking_price,
        amount_paid=amount_paid,
        payment_status=payment_status,
        payment_method=payment_method,
        payment_details=json.dumps(payment_details) if payment_details else None
    )
    db.session.add(booking)
    db.session.commit()
    
    # Initialize checklist default items for this booking
    default_items = [
        "High-quality trekking shoes (broken in)",
        "Backpack (50L-60L) with rain cover",
        "Warm layers (fleece jacket, thermal innerwear)",
        "Waterproof poncho or windcheater",
        "Refillable water bottle or hydration pack (2 Liters)",
        "Headlamp or torch with extra batteries",
        "Personal first aid kit & prescription medicines",
        "Trekking poles (highly recommended)",
        "Quick-dry towels and basic toiletries"
    ]
    for item in default_items:
        chk = BookingChecklistItem(booking_id=booking.id, item_name=item, category='default', is_completed=False)
        db.session.add(chk)
        
    # Copy trek guide-recommended items
    guide_items = TrekGuideItem.query.filter_by(trek_id=trek.id).all()
    for gi in guide_items:
        chk = BookingChecklistItem(booking_id=booking.id, item_name=gi.item_name, category='guide', is_completed=False)
        db.session.add(chk)
        
    db.session.commit()
    
    invalidate_open_treks_cache()
    
    # Dispatch booking email
    try:
        from backend.tasks import send_booking_email
        send_booking_email.delay(booking.id, payment_method, payment_details)
    except Exception as e:
        app.logger.error(f"Failed to dispatch booking email: {e}")
        
    return jsonify({
        'message': f'Booked {trek.name} successfully!',
        'booking_id': booking.id,
        'unique_booking_id': booking.unique_booking_id
    })

# ── CHECKLIST & GUIDE API ENDPOINTS ──────────────────────────

@app.route('/api/bookings/<int:booking_id>/checklist', methods=['GET'])
@login_required
def get_booking_checklist(booking_id):
    booking = Booking.query.get(booking_id)
    if not booking:
        return jsonify({'error': 'Booking not found'}), 404
        
    if current_user.role != 'admin' and current_user.role != 'staff' and booking.user_id != current_user.id:
        return jsonify({'error': 'Unauthorized'}), 403
        
    items = BookingChecklistItem.query.filter_by(booking_id=booking_id).all()
    return jsonify([i.to_json() for i in items])

@app.route('/api/bookings/checklist/toggle', methods=['POST'])
@login_required
def toggle_checklist_item():
    data = request.get_json() or {}
    item_id = data.get('item_id')
    item = BookingChecklistItem.query.get(item_id)
    if not item:
        return jsonify({'error': 'Item not found'}), 404
        
    booking = Booking.query.get(item.booking_id)
    if current_user.role != 'admin' and current_user.role != 'staff' and booking.user_id != current_user.id:
        return jsonify({'error': 'Unauthorized'}), 403
        
    item.is_completed = not item.is_completed
    db.session.commit()
    return jsonify({'success': True, 'item': item.to_json()})

@app.route('/api/guide/treks/<int:trek_id>/checklist', methods=['GET'])
@login_required
def get_guide_checklist(trek_id):
    if current_user.role != 'staff' and current_user.role != 'admin':
        return jsonify({'error': 'Unauthorized'}), 403
        
    items = TrekGuideItem.query.filter_by(trek_id=trek_id).all()
    return jsonify([i.to_json() for i in items])

@app.route('/api/guide/treks/<int:trek_id>/checklist', methods=['POST'])
@login_required
def update_guide_checklist(trek_id):
    if current_user.role != 'staff' and current_user.role != 'admin':
        return jsonify({'error': 'Unauthorized'}), 403
        
    trek = Trek.query.get(trek_id)
    if not trek:
        return jsonify({'error': 'Trek not found'}), 404
        
    data = request.get_json() or {}
    item_names = data.get('items', [])
    
    # Fetch current guide items
    current_guide_items = TrekGuideItem.query.filter_by(trek_id=trek_id).all()
    current_names = {i.item_name for i in current_guide_items}
    new_names = set(item_names)
    
    # Items to add & delete
    to_add = new_names - current_names
    to_delete = current_names - new_names
    
    # Delete removed items
    for item in current_guide_items:
        if item.item_name in to_delete:
            db.session.delete(item)
            
    # Add new items
    for name in to_add:
        db.session.add(TrekGuideItem(trek_id=trek_id, item_name=name))
        
    db.session.commit()
    
    # Synchronize participant checklists for active bookings of this trek
    active_bookings = Booking.query.filter_by(trek_id=trek_id, status='Booked').all()
    for booking in active_bookings:
        # Delete deleted items
        if to_delete:
            BookingChecklistItem.query.filter(
                BookingChecklistItem.booking_id == booking.id,
                BookingChecklistItem.category == 'guide',
                BookingChecklistItem.item_name.in_(list(to_delete))
            ).delete(synchronize_session=False)
            
        # Add new items if they don't already exist
        for name in to_add:
            exists = BookingChecklistItem.query.filter_by(
                booking_id=booking.id,
                category='guide',
                item_name=name
            ).first()
            if not exists:
                db.session.add(BookingChecklistItem(
                    booking_id=booking.id,
                    item_name=name,
                    category='guide',
                    is_completed=False
                ))
                
    db.session.commit()
    return jsonify({'success': True, 'message': 'Guide checklist updated and synchronized successfully.'})

@app.route('/api/bookings/cancel/<int:booking_id>', methods=['POST'])
@login_required
def cancel_booking(booking_id):
    booking = Booking.query.get(booking_id)
    if not booking:
        return jsonify({'error': 'Booking not found.'}), 404
        
    if current_user.role != 'admin' and current_user.role != 'staff' and booking.user_id != current_user.id:
        return jsonify({'error': 'Unauthorized.'}), 403
        
    booking.status = 'Cancelled'
    db.session.commit()
    
    invalidate_open_treks_cache()
    
    return jsonify({'message': 'Booking cancelled successfully.'})

@app.route('/api/bookings/pay/<int:booking_id>', methods=['POST'])
@login_required
def pay_booking(booking_id):
    booking = Booking.query.get(booking_id)
    if not booking or (current_user.role != 'admin' and booking.user_id != current_user.id):
        return jsonify({'error': 'Booking not found.'}), 404
    
    data = request.get_json() or {}
    payment_status = data.get('payment_status', 'Paid')
    payment_method = data.get('payment_method')
    payment_details = data.get('payment_details')
    
    booking.payment_status = payment_status
    booking.paid = (payment_status == 'Paid')
    booking.amount_paid = booking.booking_price if booking.paid else 0
    if payment_method:
        booking.payment_method = payment_method
    if payment_details:
        booking.payment_details = json.dumps(payment_details)
    
    db.session.commit()
    invalidate_open_treks_cache()
    
    # Dispatch booking email
    try:
        from backend.tasks import send_booking_email
        send_booking_email.delay(booking.id, payment_method, payment_details)
    except Exception as e:
        app.logger.error(f"Failed to dispatch booking email: {e}")
        
    return jsonify({
        'message': f'Simulated payment outcome: {payment_status}.',
        'booking_id': booking.id,
        'unique_booking_id': booking.unique_booking_id
    })

@app.route('/api/user/export', methods=['POST'])
@login_required
def user_export():
    from backend.tasks import export_booking_history_csv
    export_booking_history_csv.delay(current_user.id, current_user.email)
    return jsonify({'message': 'CSV export triggered. You will receive an email with your CSV shortly.'})

@app.route('/api/user/profile', methods=['POST'])
@login_required
def user_profile():
    import os
    import time
    from werkzeug.utils import secure_filename
    
    if request.is_json:
        data = request.get_json() or {}
    else:
        data = request.form
        
    current_user.name = data.get('name', current_user.name)
    current_user.phone = data.get('phone', current_user.phone)
    current_user.city = data.get('city', current_user.city)
    current_user.emergency = data.get('emergency', current_user.emergency)
    current_user.bio = data.get('bio', current_user.bio)
    
    current_user.dob = data.get('dob', current_user.dob)
    current_user.blood_group = data.get('blood_group', current_user.blood_group)
    current_user.medical_info = data.get('medical_info', current_user.medical_info)
    current_user.fitness_level = data.get('fitness_level', current_user.fitness_level)
    
    if 'treks_done' in data:
        try:
            current_user.treks_done = int(data.get('treks_done', 0) or 0)
        except ValueError:
            pass
            
    current_user.preferred_difficulty = data.get('preferred_difficulty', current_user.preferred_difficulty)
    current_user.preferred_duration = data.get('preferred_duration', current_user.preferred_duration)
    current_user.preferred_regions = data.get('preferred_regions', current_user.preferred_regions)
    
    if 'profile_image' in request.files:
        file = request.files['profile_image']
        if file and file.filename != '':
            filename = secure_filename(f"{int(time.time())}_{file.filename}")
            upload_dir = os.path.join(app.root_path, '..', 'frontend', 'static', 'uploads', 'profiles')
            os.makedirs(upload_dir, exist_ok=True)
            file.save(os.path.join(upload_dir, filename))
            current_user.profile_image_url = f"/static/uploads/profiles/{filename}"
            
    db.session.commit()
    return jsonify({'message': 'Profile updated successfully.'})

@app.route('/api/user/password', methods=['POST'])
@login_required
def user_password():
    data = request.get_json() or {}
    current_pw = data.get('current')
    new_pw = data.get('new')
    
    if not check_password_hash(current_user.password_hash, current_pw):
        return jsonify({'error': 'Incorrect current password.'}), 400
        
    current_user.password_hash = generate_password_hash(new_pw)
    db.session.commit()
    return jsonify({'message': 'Password updated successfully.'})

@app.route('/api/user/delete', methods=['DELETE'])
@login_required
def delete_user_account():
    import os
    import glob
    
    user = current_user
    user_id = user.id
    user_email = user.email
    
    # 1. Delete user profile image file if exists
    if user.profile_image_url:
        try:
            relative_path = user.profile_image_url.lstrip('/')
            file_path = os.path.join(app.root_path, '..', 'frontend', relative_path)
            if os.path.exists(file_path):
                os.remove(file_path)
        except Exception as e:
            app.logger.error(f"Failed to delete profile image file: {e}")
            
    # 2. Delete generated CSV exports for user from scratch/emails directory
    try:
        email_dir = os.path.join(app.root_path, '../scratch/emails')
        if os.path.exists(email_dir):
            pattern = os.path.join(email_dir, f"booking_history_user_{user_id}_*")
            for f in glob.glob(pattern):
                os.remove(f)
    except Exception as e:
        app.logger.error(f"Failed to delete booking CSVs: {e}")
        
    # 3. Delete matching records in the leads table by email
    try:
        db.session.execute(db.text("DELETE FROM leads WHERE email = :email"), {"email": user_email})
    except Exception as e:
        app.logger.error(f"Failed to delete leads for email {user_email}: {e}")
        
    # 4. Delete User database entry (triggers SQLAlchemy ORM cascade deletes)
    db.session.delete(user)
    db.session.commit()
    
    # 5. Clear the access token cookie and return response
    response = make_response(jsonify({'message': 'Your account and all associated data have been permanently deleted.'}))
    response.delete_cookie('access_token')
    return response



@app.route('/api/user/tickets', methods=['GET'])
@login_required
def get_user_tickets():
    if current_user.role != 'user':
        return jsonify({'error': 'Unauthorized'}), 403
    tickets = SupportTicket.query.filter_by(user_id=current_user.id).order_by(SupportTicket.created_at.desc()).all()
    return jsonify([ticket.to_json() for ticket in tickets])

@app.route('/api/user/tickets', methods=['POST'])
@login_required
def create_user_ticket():
    if current_user.role != 'user':
        return jsonify({'error': 'Unauthorized'}), 403
    data = request.get_json() or {}
    subject = data.get('subject', '').strip()
    message = data.get('message', '').strip()
    category = data.get('category', 'General').strip()
    
    if not subject or not message:
        return jsonify({'error': 'Subject and Message are required'}), 400
        
    full_subject = f"[{category}] {subject}"
    
    ticket = SupportTicket(
        user_id=current_user.id,
        name=current_user.name,
        email=current_user.email,
        subject=full_subject,
        message=message,
        status='Open'
    )
    db.session.add(ticket)
    db.session.commit()
    
    return jsonify({'success': True, 'ticket': ticket.to_json(), 'message': 'Ticket submitted successfully'})

# ── ADMIN API ────────────────────────────────────────────────

@app.route('/api/admin/dashboard_data', methods=['GET'])
@login_required
def admin_dashboard_data():
    update_completed_bookings()
    if current_user.role != 'admin':
        return jsonify({'error': 'Unauthorized'}), 403
        
    total_treks = TrekRoute.query.count()
    total_batches = Trek.query.count()
    registered_users = User.query.filter_by(role='user').count()
    total_bookings = Booking.query.count()
    open_treks = Trek.query.filter_by(status='Open').count()
    cancelled_bookings_count = Booking.query.filter_by(status='Cancelled').count()
    staff_count = User.query.filter_by(role='staff').count()
    
    stats = [
        {'label': 'Total Trekkers', 'value': registered_users, 'icon': 'users', 'category': 'people'},
        {'label': 'Total Staff', 'value': staff_count, 'icon': 'staff', 'category': 'people'},
        {'label': 'Total Treks', 'value': total_treks, 'icon': 'mountain', 'category': 'treks'},
        {'label': 'Active Batches', 'value': open_treks, 'icon': 'active', 'category': 'treks'},
        {'label': 'Total Bookings', 'value': total_bookings, 'icon': 'book', 'category': 'bookings'},
        {'label': 'Cancelled Bookings', 'value': cancelled_bookings_count, 'icon': 'cancel', 'category': 'bookings'}
    ]
    
    completed_treks_count = Trek.query.filter_by(status='Completed').count()
    closed_treks_count = Trek.query.filter_by(status='Closed').count()
    
    trek_status_overview = [
        {'label': 'Open', 'count': open_treks, 'pct': int((open_treks/total_batches*100) if total_batches else 0), 'color': '#4ade80'},
        {'label': 'Completed', 'count': completed_treks_count, 'pct': int((completed_treks_count/total_batches*100) if total_batches else 0), 'color': '#a8c5a0'},
        {'label': 'Closed', 'count': closed_treks_count, 'pct': int((closed_treks_count/total_batches*100) if total_batches else 0), 'color': '#ef4444'}
    ]
    
    recent_bookings_query = Booking.query.order_by(Booking.booked_on.desc()).limit(10).all()
    recent_bookings = []
    for rb in recent_bookings_query:
        recent_bookings.append({
            'id': rb.id,
            'user': rb.user.name,
            'trek': rb.trek.name,
            'date': rb.booked_on.strftime('%Y-%m-%d'),
            'status': rb.status
        })
        
    alerts = []
    low_slots_treks = Trek.query.filter(Trek.status == 'Open').all()
    low_slots_count = 0
    for t in low_slots_treks:
        booked_count = Booking.query.filter(
            Booking.trek_id == t.id,
            Booking.status == 'Booked',
            (Booking.payment_status != 'Failed') | (Booking.payment_status == None)
        ).count()
        if t.slots - booked_count < 5:
            low_slots_count += 1
    if low_slots_count > 0:
        alerts.append({'msg': f'{low_slots_count} treks have slots below 5 remaining', 'type': 'warn'})
      
    staff_list = User.query.filter_by(role='staff').all()
    for s in staff_list:
        assigned = Trek.query.filter_by(staff_id=s.id).count()
        if assigned == 0:
            alerts.append({'msg': f'Staff member {s.name} has no trek assigned', 'type': 'warn'})
      
    alerts.append({'msg': 'Monthly report scheduled for 1st of next month', 'type': 'info'})
    
    treks = [t.to_json() for t in Trek.query.all()]
    
    staff_data = []
    for s in staff_list:
        assigned = Trek.query.filter_by(staff_id=s.id).all()
        treks_done = []
        for t in assigned:
            booked_cnt = Booking.query.filter_by(trek_id=t.id, status='Booked').count()
            treks_done.append({
                'batchId': t.batch_code or f"TID{t.id:03d}B01",
                'trekName': t.name,
                'location': t.location,
                'trekkersCount': booked_cnt,
                'startDate': t.start_date.strftime('%Y-%m-%d') if t.start_date else '',
                'endDate': t.end_date.strftime('%Y-%m-%d') if t.end_date else ''
            })
        profile = s.staff_profile
        skills = profile.skills if profile else 'Wilderness First Aid, Navigation'
        experience = profile.experience_years if profile else 2
        designation = profile.designation if profile else 'Lead Guide'
        certifications = profile.certifications if profile else 'Wilderness First Responder (WFR)'
        languages = profile.languages if profile else 'English, Hindi'
        completed_count = profile.completed_treks_count if profile else 10
        photos = [
            "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&h=300&fit=crop",
            "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=300&fit=crop",
            "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&h=300&fit=crop",
            "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300&h=300&fit=crop",
            "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=300&h=300&fit=crop",
            "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300&h=300&fit=crop",
            "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=300&h=300&fit=crop",
            "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=300&h=300&fit=crop"
        ]
        photo_url = (profile.photo_url if (profile and profile.photo_url) else None) or photos[s.id % len(photos)]
        staff_data.append({
            'id': s.id,
            'memberId': f"TS26S{s.id:03d}",
            'name': s.name,
            'contact': s.email,
            'phone': s.phone or '',
            'treks': [t.name for t in assigned],
            'active': s.active,
            'blacklisted': s.blacklisted,
            'joined': s.registered_at.strftime('%Y-%m-%d') if s.registered_at else '2026-06-09',
            'skills': skills,
            'experience': experience,
            'designation': designation,
            'certifications': certifications,
            'languages': languages,
            'completedTreksCount': completed_count + len(assigned),
            'photoUrl': photo_url,
            'treksDone': treks_done,
            'customBlockedDates': profile.custom_blocked_dates if (profile and profile.custom_blocked_dates) else ''
        })
        
    users = []
    user_photos = [
        "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&h=300&fit=crop",
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=300&fit=crop",
        "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&h=300&fit=crop",
        "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300&h=300&fit=crop",
        "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=300&h=300&fit=crop",
        "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300&h=300&fit=crop",
        "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=300&h=300&fit=crop",
        "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=300&h=300&fit=crop"
    ]
    for u in User.query.filter_by(role='user').all():
        ucnt = Booking.query.filter_by(user_id=u.id).count()
        photo_url = user_photos[u.id % len(user_photos)]
        users.append({
            'id': u.id,
            'memberId': f"TS26T{u.id:04d}",
            'name': u.name,
            'email': u.email,
            'phone': u.phone or '',
            'city': u.city or '',
            'emergency': u.emergency or '',
            'bio': u.bio or '',
            'registered': u.registered_at.strftime('%Y-%m-%d'),
            'bookings': ucnt,
            'blacklisted': u.blacklisted,
            'photoUrl': photo_url,
            'role': 'user'
        })
        
    all_bookings = []
    for b in Booking.query.all():
        u = b.user
        year_str = u.registered_at.strftime('%y') if u.registered_at else '26'
        member_id = f"TS{year_str}T{u.id:04d}" if u.role == 'user' else f"TS{year_str}S{u.id:03d}"
        all_bookings.append({
            'id': b.id,
            'bookingId': b.unique_booking_id,
            'userId': b.user_id,
            'trekkerId': member_id,
            'user': b.user.name,
            'trekId': b.trek_id,
            'trek': b.trek.name,
            'batchCode': b.trek.batch_code or f"TID{b.trek.id:03d}B01",
            'date': b.booked_on.strftime('%Y-%m-%d'),
            'status': b.status,
            'paid': b.paid,
            'bookingPrice': b.booking_price or (b.trek.price if b.trek else 5000),
            'amountPaid': b.amount_paid if b.amount_paid not in (None, 0)
                else (
                    b.booking_price if (b.paid or b.payment_status == 'Paid')
                    else (b.trek.price if (b.paid and b.trek) else 0)
                ),
            'paymentStatus': b.payment_status or ('Paid' if b.paid else 'Pending'),
            'paidOn': b.booked_on.strftime('%Y-%m-%d') if b.paid else '—',
            'transactionId': f"TXN{b.booked_on.strftime('%y%m%d')}{b.id:04d}" if b.paid else '—',
            'difficulty': b.trek.difficulty if b.trek else 'Moderate',
            'location': b.trek.location if b.trek else '',
            'startDate': b.trek.start_date.strftime('%Y-%m-%d') if (b.trek and b.trek.start_date) else '—',
            'refundAmount': b.refund_amount or 0
        })
        
    popular_treks = []
    for t in Trek.query.all():
        bcnt = Booking.query.filter_by(trek_id=t.id, status='Booked').count()
        popular_treks.append({
            'name': t.name,
            'bookings': bcnt
        })
    popular_treks.sort(key=lambda x: x['bookings'], reverse=True)
    
    # ── EXTRA FIELDS FOR ADVANCED ADMIN DASHBOARD ───────────────────
    slot_utilization = []
    for t in Trek.query.filter_by(status='Open').all():
        booked = Booking.query.filter(
            Booking.trek_id == t.id,
            Booking.status == 'Booked',
            (Booking.payment_status != 'Failed') | (Booking.payment_status == None)
        ).count()
        slot_utilization.append({
            'trek': t.name,
            'total': t.slots,
            'booked': booked,
            'pct': int((booked / t.slots * 100) if t.slots else 0)
        })
        
    upcoming_treks = []
    from datetime import date
    open_and_approved = Trek.query.filter(Trek.status.in_(['Open', 'Approved'])).all()
    for t in open_and_approved:
        if t.end_date and t.end_date < date.today():
            continue
        days_left = (t.start_date - date.today()).days if t.start_date else 0
        upcoming_treks.append({
            'name': t.name,
            'startDate': t.start_date.strftime('%Y-%m-%d') if t.start_date else '',
            'daysLeft': max(0, days_left),
            'staff': t.staff.name if t.staff else 'Unassigned'
        })
    upcoming_treks.sort(key=lambda x: x['daysLeft'])
    
    activity_feed = []
    for b in Booking.query.order_by(Booking.id.desc()).limit(5).all():
        days_diff = (date.today() - b.booked_on).days if b.booked_on else 0
        time_str = 'just now' if days_diff == 0 else f"{days_diff}d ago"
        activity_feed.append({
            'time': time_str,
            'msg': f"{b.user.name} booked {b.trek.name} Trek",
            'type': 'booking'
        })
    if len(activity_feed) < 5:
        activity_feed.extend([
            {'time': '1 hr ago', 'msg': 'Daily reminder emails sent to all users', 'type': 'system'},
            {'time': '2 hr ago', 'msg': 'Redis cache refreshed for trek listings', 'type': 'system'},
            {'time': '5 hr ago', 'msg': 'Trek slot synchronization job succeeded', 'type': 'system'}
        ])
        
    audit_logs = [
        {'timestamp': '2026-06-10 09:23', 'actor': 'Admin', 'action': 'System startup and database verify', 'level': 'system'},
        {'timestamp': '2026-06-10 08:55', 'actor': 'System', 'action': 'Backup database and sync tasks', 'level': 'system'}
    ]
    for b in Booking.query.order_by(Booking.id.desc()).limit(5).all():
        audit_logs.append({
            'timestamp': b.booked_on.strftime('%Y-%m-%d %H:%M') if b.booked_on else '2026-06-10 12:00',
            'actor': b.user.name,
            'action': f"Booked trek: {b.trek.name} (ID #{b.id})",
            'level': 'user'
        })
        
    notifications = [
        {'id': 1, 'msg': 'System running normally', 'time': 'just now', 'read': False, 'type': 'system'},
        {'id': 2, 'msg': 'Welcome to TrailSync Admin', 'time': '1 hr ago', 'read': True, 'type': 'admin'}
    ]
    
    try:
        from backend.tasks import get_job_runs
        scheduled_jobs = get_job_runs()
    except Exception:
        scheduled_jobs = [
            {'name': 'Daily Reminder Emails', 'schedule': 'Every day at 09:00', 'lastRun': '2026-06-10 09:00:00', 'status': 'Success'},
            {'name': 'Monthly Activity Report', 'schedule': '1st of every month at 09:00', 'lastRun': '2026-06-01 09:00:00', 'status': 'Success'},
            {'name': 'Cache Refresh Job', 'schedule': 'Every 15 min', 'lastRun': '2026-06-13 14:45:00', 'status': 'Success'}
        ]
    
    system_health = {
        'database': {'label': 'SQLite Database', 'status': 'Online', 'ok': True},
        'redis': {'label': 'Redis Cache', 'status': 'Connected', 'ok': True},
        'celery': {'label': 'Celery Worker', 'status': 'Running', 'ok': True},
        'beats': {'label': 'Celery Beat', 'status': 'Active', 'ok': True},
        'api': {'label': 'Flask API', 'status': 'Healthy', 'ok': True}
    }
    
    from collections import defaultdict
    from datetime import date
    current_year = date.today().year
    current_month_num = date.today().month
    
    months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    active_months = months[:current_month_num]
    
    monthly_counts = defaultdict(int)
    for b in Booking.query.filter(db.extract('year', Booking.booked_on) == current_year).all():
        if b.booked_on:
            m_name = b.booked_on.strftime('%b')
            monthly_counts[m_name] += 1
            
    monthly_bookings = []
    for m in active_months:
        monthly_bookings.append({
            'month': m,
            'count': monthly_counts[m]
        })
        
    easy_c = Trek.query.filter_by(difficulty='Easy').count()
    mod_c = Trek.query.filter_by(difficulty='Moderate').count()
    hard_c = Trek.query.filter_by(difficulty='Hard').count()
    total_batches = Trek.query.count()
    difficulty_dist = [
        {'level': 'Easy', 'pct': int((easy_c / total_batches * 100) if total_batches else 0), 'color': '#4ade80'},
        {'level': 'Moderate', 'pct': int((mod_c / total_batches * 100) if total_batches else 0), 'color': '#fbbf24'},
        {'level': 'Hard', 'pct': int((hard_c / total_batches * 100) if total_batches else 0), 'color': '#ef4444'}
    ]
    
    user_growth = []
    monthly_users = defaultdict(int)
    for u in User.query.filter(db.extract('year', User.registered_at) == current_year, User.role == 'user').all():
        if u.registered_at:
            m_name = u.registered_at.strftime('%b')
            monthly_users[m_name] += 1
    cumulative = 0
    for m in active_months:
        cumulative += monthly_users[m]
        user_growth.append({
            'month': m,
            'users': cumulative
        })
        
    paid_bookings = Booking.query.filter(Booking.status != 'Cancelled', Booking.payment_status == 'Paid').all()
    tot_rev = sum(b.amount_paid or b.booking_price or (b.trek.price if b.trek else 5000) for b in paid_bookings)
    
    trek_revenue = defaultdict(int)
    for b in paid_bookings:
        if b.trek:
            trek_revenue[b.trek.name] += b.amount_paid or b.booking_price or b.trek.price
            
    top_trek = 'None'
    top_rev_val = 0
    if trek_revenue:
        top_trek = max(trek_revenue, key=trek_revenue.get)
        top_rev_val = trek_revenue[top_trek]

    from datetime import date
    current_month_name = date.today().strftime('%b')
    monthly_rev_val = 0
    for b in paid_bookings:
        if b.booked_on and b.booked_on.strftime('%b') == current_month_name:
            monthly_rev_val += b.amount_paid or b.booking_price or b.trek.price

    revenue_data = {
        'total': f"₹{tot_rev:,}",
        'monthly': f"₹{monthly_rev_val:,}",
        'topTrek': top_trek,
        'topRevenue': f"₹{top_rev_val:,}"
    }
    
    blacklisted_users = []
    for u in User.query.filter_by(blacklisted=True).all():
        blacklisted_users.append({
            'id': u.id,
            'name': u.name,
            'reason': u.blacklist_reason or 'Policy violation',
            'date': u.registered_at.strftime('%Y-%m-%d') if u.registered_at else '2026-06-09'
        })
        
    pending_treks = []
        
    # Row 6: Alerts & Pending Tasks calculations
    inactive_staff_count = User.query.filter_by(role='staff', active=False).count()
    unassigned_treks_count = Trek.query.filter(Trek.status.in_(['Open', 'Approved']), Trek.staff_id == None).count()
    pending_tickets_count = SupportTicket.query.filter_by(status='Open').count()
    
    from datetime import date, timedelta
    today_val = date.today()
    next_week = today_val + timedelta(days=7)
    treks_starting_week_count = Trek.query.filter(
        Trek.start_date >= today_val,
        Trek.start_date <= next_week
    ).count()

    # Calculate low occupancy starting soon (less than 50% slots booked and starting in 5 days)
    low_occupancy_count = 0
    starting_soon_treks = Trek.query.filter(
        Trek.status.in_(['Open', 'Approved']),
        Trek.start_date >= today_val,
        Trek.start_date <= today_val + timedelta(days=5)
    ).all()
    for t in starting_soon_treks:
        booked = Booking.query.filter(
            Booking.trek_id == t.id,
            Booking.status == 'Booked',
            (Booking.payment_status != 'Failed') | (Booking.payment_status == None)
        ).count()
        util_pct = (booked / t.slots) if t.slots else 0.0
        if util_pct < 0.50:
            low_occupancy_count += 1
            
    unpaid_bookings_count = Booking.query.filter_by(status='Booked', paid=False).count()
    
    alerts_and_tasks = [
        {'label': 'Staff Accounts Inactive', 'count': inactive_staff_count, 'type': 'inactive_staff'},
        {'label': 'Trek Has No Assigned Staff', 'count': unassigned_treks_count, 'type': 'unassigned_staff'},
        {'label': 'Low Occupancy (<50%) Starting Soon', 'count': low_occupancy_count, 'type': 'low_occupancy'},
        {'label': 'Treks Starting This Week', 'count': treks_starting_week_count, 'type': 'starting_this_week'},
        {'label': 'Unpaid Bookings', 'count': unpaid_bookings_count, 'type': 'unpaid_bookings'},
        {'label': 'Pending Support Tickets', 'count': pending_tickets_count, 'type': 'pending_tickets'}
    ]

    support_tickets = [st.to_json() for st in SupportTicket.query.order_by(SupportTicket.created_at.desc()).all()]
        
    return jsonify({
        'stats': stats,
        'alertsAndTasks': alerts_and_tasks,
        'trekStatusOverview': trek_status_overview,
        'alerts': alerts,
        'recentBookings': recent_bookings[:5],
        'treks': treks,
        'staffList': staff_data,
        'users': users,
        'allBookings': all_bookings,
        'popularTreks': popular_treks[:5],
        'slotUtilization': slot_utilization,
        'upcomingTreks': upcoming_treks,
        'activityFeed': activity_feed,
        'auditLogs': audit_logs,
        'notifications': notifications,
        'scheduledJobs': scheduled_jobs,
        'systemHealth': system_health,
        'monthlyBookings': monthly_bookings,
        'difficultyDist': difficulty_dist,
        'userGrowth': user_growth,
        'revenueData': revenue_data,
        'blacklistedUsers': blacklisted_users,
        'pendingTreks': pending_treks,
        'supportTickets': support_tickets,
        'trekRoutes': [r.to_json() for r in TrekRoute.query.all()]
    })

@app.route('/api/admin/upload_image', methods=['POST'])
@login_required
def admin_upload_image():
    if current_user.role != 'admin':
        return jsonify({'error': 'Unauthorized'}), 403
    if 'image' not in request.files:
        return jsonify({'error': 'No image file provided'}), 400
    file = request.files['image']
    if file.filename == '':
        return jsonify({'error': 'Empty filename'}), 400
    import uuid
    from werkzeug.utils import secure_filename
    filename = secure_filename(file.filename)
    ext = os.path.splitext(filename)[1]
    unique_filename = f"{uuid.uuid4().hex}{ext}"
    uploads_dir = os.path.join(app.root_path, '../frontend/static/uploads')
    os.makedirs(uploads_dir, exist_ok=True)
    file.save(os.path.join(uploads_dir, unique_filename))
    return jsonify({
        'success': True,
        'imageUrl': f"/static/uploads/{unique_filename}"
    })

@app.route('/api/admin/trek_routes', methods=['POST'])
@login_required
def admin_save_trek_route():
    if current_user.role != 'admin':
        return jsonify({'error': 'Unauthorized'}), 403
        
    data = request.get_json() or {}
    route_id = data.get('id')
    name = data.get('name')
    location = data.get('location')
    place = data.get('place')
    difficulty = data.get('difficulty', 'Moderate')
    duration = data.get('duration', 5)
    distance = data.get('distance', 15)
    image_url = data.get('imageUrl')
    description = data.get('description')
    latitude = data.get('latitude')
    longitude = data.get('longitude')

    if not name or not location:
        return jsonify({'error': 'Name and Location are required.'}), 400

    # Load unique Unsplash images fallback
    if not image_url:
        image_url = "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&q=80"

    if route_id:
        route = TrekRoute.query.get(route_id)
        if not route:
            return jsonify({'error': 'Trek Route not found'}), 404
        route.name = name
        route.location = location
        route.place = place
        route.difficulty = difficulty
        route.duration = duration
        route.distance = distance
        route.image_url = image_url
        route.description = description
        route.latitude = latitude
        route.longitude = longitude
    else:
        # Generate TIDxxx
        max_id = db.session.query(db.func.max(TrekRoute.id)).scalar() or 0
        trek_code = f"TID{max_id + 1:03d}"
        route = TrekRoute(
            trek_code=trek_code,
            name=name,
            location=location,
            place=place,
            difficulty=difficulty,
            duration=duration,
            distance=distance,
            image_url=image_url,
            description=description,
            latitude=latitude,
            longitude=longitude,
            active=True
        )
        db.session.add(route)

    db.session.commit()
    invalidate_open_treks_cache()
    return jsonify({'success': True, 'route': route.to_json()})

@app.route('/api/admin/trek_routes/<int:route_id>', methods=['DELETE'])
@login_required
def admin_delete_trek_route(route_id):
    if current_user.role != 'admin':
        return jsonify({'error': 'Unauthorized'}), 403
        
    route = TrekRoute.query.get(route_id)
    if not route:
        return jsonify({'error': 'Trek Route not found'}), 404
        
    db.session.delete(route)
    db.session.commit()
    invalidate_open_treks_cache()
    return jsonify({'success': True, 'message': 'Trek Route removed.'})

@app.route('/api/admin/trek_routes/toggle/<int:route_id>', methods=['POST'])
@login_required
def admin_toggle_trek_route(route_id):
    if current_user.role != 'admin':
        return jsonify({'error': 'Unauthorized'}), 403
        
    route = TrekRoute.query.get(route_id)
    if not route:
        return jsonify({'error': 'Trek Route not found'}), 404
        
    route.active = not route.active
    db.session.commit()
    invalidate_open_treks_cache()
    return jsonify({'success': True, 'active': route.active})

@app.route('/api/admin/treks', methods=['POST'])
@login_required
def admin_save_trek():
    if current_user.role != 'admin':
        return jsonify({'error': 'Unauthorized'}), 403
        
    data = request.get_json() or {}
    trek_id = data.get('id')
    trek_route_id = data.get('trekRouteId')
    
    start_date_str = data.get('startDate')
    end_date_str = data.get('endDate')
    slots = data.get('slots')
    price = data.get('price')
    status = data.get('status', 'Open')
    staff_id = data.get('staff_id')
    staff_id = int(staff_id) if staff_id else None
    
    # 1. Compulsory fields validation
    if not trek_id and not trek_route_id:
        return jsonify({'error': 'Trek Route selection is required.'}), 400
    if not start_date_str or not end_date_str:
        return jsonify({'error': 'Start date and End date are required.'}), 400
    if slots is None or slots <= 0:
        return jsonify({'error': 'Available slots must be a positive integer.'}), 400
    if price is None or price < 0:
        return jsonify({'error': 'Price must be a positive number.'}), 400
        
    start_date = datetime.strptime(start_date_str, '%Y-%m-%d').date()
    end_date = datetime.strptime(end_date_str, '%Y-%m-%d').date()
    
    if start_date >= end_date:
        return jsonify({'error': 'Start date must be before End date.'}), 400
        
    # 2. Redundancy check (same route on the same start date)
    if not trek_id:
        existing_batch = Trek.query.filter_by(
            trek_route_id=trek_route_id,
            start_date=start_date
        ).first()
        if existing_batch:
            return jsonify({'error': f'A batch starting on {start_date_str} is already scheduled (Redundant batch).'}), 400
            
    if staff_id:
        conflict = Trek.query.filter(
            Trek.staff_id == staff_id,
            Trek.id != trek_id,
            Trek.start_date <= end_date,
            Trek.end_date >= start_date
        ).first()
        if conflict:
            return jsonify({'error': f"Conflict: Guide is already assigned to batch '{conflict.name}' ({conflict.batch_code}) from {conflict.start_date} to {conflict.end_date}."}), 400
            
        guide = User.query.get(staff_id)
        if guide and guide.staff_profile and guide.staff_profile.custom_blocked_dates:
            blocked_str = guide.staff_profile.custom_blocked_dates
            blocked_dates = [d.strip() for d in blocked_str.split(',') if d.strip()]
            from datetime import timedelta
            curr = start_date
            while curr <= end_date:
                curr_str = curr.strftime('%Y-%m-%d')
                if curr_str in blocked_dates:
                    return jsonify({'error': f"Conflict: Guide is marked Unavailable (Leave/Off Day) on {curr_str}. Clear unavailability first."}), 400
                curr += timedelta(days=1)

    if trek_id:
        trek = Trek.query.get(trek_id)
        if not trek:
            return jsonify({'error': 'Trek not found'}), 404
        previous_staff_id = trek.staff_id
        trek.start_date = start_date
        trek.end_date = end_date
        trek.slots = slots
        trek.price = price
        trek.status = status
        trek.staff_id = staff_id
    else:
        # Create a new batch from a TrekRoute
        route = TrekRoute.query.get(trek_route_id)
        if not route:
            return jsonify({'error': 'Trek Route not found'}), 404
            
        # 3. Only active routes can be made into batches
        if not route.active:
            return jsonify({'error': 'Cannot schedule batches for inactive/closed trek routes.'}), 400
            
        # Count existing batches for this route to generate code: e.g. TID001B02
        num_batches = Trek.query.filter_by(trek_route_id=route.id).count()
        batch_code = f"{route.trek_code}B{num_batches+1:02d}"
        dur = (end_date - start_date).days
        
        trek = Trek(
            trek_route_id=route.id,
            batch_code=batch_code,
            name=route.name,
            location=route.location,
            difficulty=route.difficulty,
            duration=route.duration or dur or 5,
            start_date=start_date,
            end_date=end_date,
            slots=slots,
            price=price,
            status=status,
            image_url=route.image_url,
            description=route.description,
            latitude=route.latitude,
            longitude=route.longitude,
            distance=route.distance,
            staff_id=staff_id
        )
        db.session.add(trek)
        previous_staff_id = None
        
    db.session.commit()
    if staff_id:
        # Notify staff whenever they are assigned during batch creation/editing
        dispatch_guide_assignment_email(staff_id, trek.id)
    invalidate_open_treks_cache()
    return jsonify({'success': True, 'trek': trek.to_json()})

@app.route('/api/admin/treks/<int:trek_id>', methods=['DELETE'])
@login_required
def admin_delete_trek(trek_id):
    if current_user.role != 'admin':
        return jsonify({'error': 'Unauthorized'}), 403
        
    trek = Trek.query.get(trek_id)
    if not trek:
        return jsonify({'error': 'Trek not found'}), 404
        
    db.session.delete(trek)
    db.session.commit()
    invalidate_open_treks_cache()
    return jsonify({'success': True})

@app.route('/api/admin/batches/<int:trek_id>/close', methods=['POST'])
@login_required
def admin_close_batch(trek_id):
    if current_user.role != 'admin':
        return jsonify({'error': 'Unauthorized'}), 403
        
    trek = Trek.query.get(trek_id)
    if not trek:
        return jsonify({'error': 'Trek not found'}), 404
    
    if trek.status == 'Closed':
        return jsonify({'error': 'Batch is already closed'}), 400
    
    trek.status = 'Closed'
    db.session.commit()
    invalidate_open_treks_cache()
    return jsonify({'success': True, 'message': f"Batch '{trek.name}' has been closed. No further bookings are allowed.", 'trek': trek.to_json()})

@app.route('/api/admin/batches/<int:trek_id>/complete', methods=['POST'])
@login_required
def admin_complete_batch(trek_id):
    if current_user.role != 'admin':
        return jsonify({'error': 'Unauthorized'}), 403
        
    trek = Trek.query.get(trek_id)
    if not trek:
        return jsonify({'error': 'Trek not found'}), 404
    
    if trek.status == 'Completed':
        return jsonify({'error': 'Batch is already completed'}), 400
        
    trek.status = 'Completed'
    
    # Update all active bookings for this trek to Completed
    bookings = Booking.query.filter_by(trek_id=trek.id, status='Booked').all()
    for b in bookings:
        b.status = 'Completed'
        
    db.session.commit()
    invalidate_open_treks_cache()
    return jsonify({
        'success': True, 
        'message': f"Batch '{trek.name}' has been marked as Completed.", 
        'trek': trek.to_json()
    })


@app.route('/api/admin/batches/toggle/<int:trek_id>', methods=['POST'])
@login_required
def admin_toggle_batch(trek_id):
    if current_user.role != 'admin':
        return jsonify({'error': 'Unauthorized'}), 403
        
    trek = Trek.query.get(trek_id)
    if not trek:
        return jsonify({'error': 'Trek not found'}), 404

    # Toggle between Open and Closed (leave Completed unchanged)
    if trek.status == 'Open':
        trek.status = 'Closed'
    elif trek.status == 'Closed':
        trek.status = 'Open'
    else:
        # For other statuses like 'Completed', don't change
        return jsonify({'error': 'Cannot toggle status for this batch'}), 400

    db.session.commit()
    invalidate_open_treks_cache()
    return jsonify({'success': True, 'active': trek.status == 'Open', 'trek': trek.to_json()})

@app.route('/api/admin/batches/<int:trek_id>/trekkers', methods=['GET'])
@login_required
def admin_get_batch_trekkers(trek_id):
    if current_user.role != 'admin':
        return jsonify({'error': 'Unauthorized'}), 403
        
    bookings = Booking.query.filter_by(trek_id=trek_id).all()
    trekkers = []
    for b in bookings:
        user = b.user
        member_id = user.to_json()['memberId']
        trekkers.append({
            'userId': user.id,
            'userName': user.name,
            'userEmail': user.email,
            'memberId': member_id,
            'bookingId': b.id,
            'status': b.status,
            'paymentStatus': b.payment_status or 'Paid'
        })
    return jsonify({'success': True, 'trekkers': trekkers})

@app.route('/api/admin/batches/add_trekker', methods=['POST'])
@login_required
def admin_add_trekker_to_batch():
    if current_user.role != 'admin':
        return jsonify({'error': 'Unauthorized'}), 403
        
    data = request.get_json() or {}
    trek_id = data.get('trek_id')
    user_id = data.get('user_id')
    
    if not trek_id or not user_id:
        return jsonify({'error': 'Trek ID and User ID are required.'}), 400
        
    trek = Trek.query.get(trek_id)
    if not trek:
        return jsonify({'error': 'Trek batch not found.'}), 404
        
    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': 'Trekker user not found.'}), 404
        
    # Check if user already booked
    existing = Booking.query.filter_by(trek_id=trek_id, user_id=user_id, status='Booked').first()
    if existing:
        return jsonify({'error': 'User is already registered/booked in this batch.'}), 400
        
    # Check if slot is available
    booked_count = db.session.query(Booking).filter(
        Booking.trek_id == trek_id,
        Booking.status == 'Booked',
        (Booking.payment_status != 'Failed') | (Booking.payment_status == None)
    ).count()
    if booked_count >= trek.slots:
        return jsonify({'error': 'Trek batch is already full. Increase slots first.'}), 400
        
    # Create booking
    booking = Booking(
        user_id=user_id,
        trek_id=trek_id,
        booked_on=date.today(),
        status='Booked',
        paid=True,
        booking_price=trek.price,
        amount_paid=trek.price,
        payment_status='Paid'
    )
    db.session.add(booking)
    db.session.commit()
    invalidate_open_treks_cache()
    
    return jsonify({
        'success': True,
        'message': f'Trekker {user.name} successfully added to batch.',
        'booking': {
            'id': booking.id,
            'userId': user.id,
            'userName': user.name,
            'userEmail': user.email,
            'memberId': user.to_json()['memberId']
        }
    })

@app.route('/api/admin/batches/remove_trekker', methods=['POST'])
@login_required
def admin_remove_trekker_from_batch():
    if current_user.role != 'admin':
        return jsonify({'error': 'Unauthorized'}), 403
        
    data = request.get_json() or {}
    trek_id = data.get('trek_id')
    user_id = data.get('user_id')
    
    if not trek_id or not user_id:
        return jsonify({'error': 'Trek ID and User ID are required.'}), 400
        
    booking = Booking.query.filter_by(trek_id=trek_id, user_id=user_id).first()
    if not booking:
        return jsonify({'error': 'No booking found for this user in this batch.'}), 404
        
    db.session.delete(booking)
    db.session.commit()
    invalidate_open_treks_cache()
    
    return jsonify({'success': True, 'message': 'Trekker removed from batch successfully.'})

@app.route('/api/admin/staff', methods=['POST'])
@login_required
def admin_save_staff():
    if current_user.role != 'admin':
        return jsonify({'error': 'Unauthorized'}), 403
        
    data = request.get_json() or {}
    staff_id = data.get('id')
    email = data.get('email')
    name = data.get('name')
    phone = data.get('phone') or ''
    password = data.get('password')
    
    if not name or not email:
        return jsonify({'error': 'Name and Email are required.'}), 400

    if staff_id:
        staff = User.query.get(staff_id)
        if not staff or staff.role != 'staff':
            return jsonify({'error': 'Staff member not found.'}), 404
            
        existing = User.query.filter(User.email == email, User.id != staff_id).first()
        if existing:
            return jsonify({'error': 'Email already registered by another user.'}), 400
            
        staff.email = email
        staff.name = name
        staff.phone = phone
        if password:
            staff.password_hash = generate_password_hash(password)
            
        profile = staff.staff_profile
        if not profile:
            profile = StaffProfile(user_id=staff.id)
            db.session.add(profile)
            
        profile.skills = data.get('skills', 'Wilderness First Aid, Navigation')
        try:
            profile.experience_years = int(data.get('experience', 2))
        except (ValueError, TypeError):
            profile.experience_years = 2
            
        profile.designation = data.get('designation', 'Lead Guide')
        profile.certifications = data.get('certifications', 'Wilderness First Responder (WFR)')
        profile.languages = data.get('languages', 'English, Hindi')
        try:
            profile.completed_treks_count = int(data.get('completedTreksCount', 10))
        except (ValueError, TypeError):
            profile.completed_treks_count = 10
            
        profile.photo_url = data.get('photoUrl')
        
    else:
        existing = User.query.filter_by(email=email).first()
        if existing:
            return jsonify({'error': 'Email already registered.'}), 400
            
        staff = User(
            email=email,
            name=name,
            phone=phone,
            password_hash=generate_password_hash(password or 'Trailsync@123'),
            role='staff'
        )
        db.session.add(staff)
        db.session.flush()
        
        profile = StaffProfile(
            user_id=staff.id,
            skills=data.get('skills', 'Wilderness First Aid, Navigation'),
            experience_years=int(data.get('experience', 2)) if data.get('experience') else 2,
            designation=data.get('designation', 'Lead Guide'),
            certifications=data.get('certifications', 'Wilderness First Responder (WFR)'),
            languages=data.get('languages', 'English, Hindi'),
            completed_treks_count=int(data.get('completedTreksCount', 10)) if data.get('completedTreksCount') else 10,
            photo_url=data.get('photoUrl'),
            status='Active'
        )
        db.session.add(profile)
        
        # Trigger free registration email via Celery
        try:
            from backend.tasks import send_staff_creation_email
            send_staff_creation_email.delay(staff.id, password or 'Trailsync@123')
        except Exception as e:
            print("Failed to dispatch Celery staff email:", e)
            
    db.session.commit()
    return jsonify({'success': True})

@app.route('/api/admin/staff/<int:staff_id>/toggle_date_availability', methods=['POST'])
@login_required
def admin_toggle_staff_date_availability(staff_id):
    if current_user.role != 'admin':
        return jsonify({'error': 'Unauthorized'}), 403
        
    data = request.get_json() or {}
    date_str = data.get('date')
    if not date_str:
        return jsonify({'error': 'Date is required.'}), 400
        
    staff = User.query.get(staff_id)
    if not staff or staff.role != 'staff':
        return jsonify({'error': 'Staff member not found.'}), 404
        
    profile = staff.staff_profile
    if not profile:
        profile = StaffProfile(user_id=staff.id)
        db.session.add(profile)
        
    blocked_dates = profile.custom_blocked_dates or ''
    dates_list = [d.strip() for d in blocked_dates.split(',') if d.strip()]
    
    if date_str in dates_list:
        dates_list.remove(date_str)
        action = 'free'
    else:
        dates_list.append(date_str)
        action = 'busy'
        
    profile.custom_blocked_dates = ','.join(dates_list)
    db.session.commit()
    
    return jsonify({
        'success': True,
        'action': action,
        'customBlockedDates': profile.custom_blocked_dates
    })

@app.route('/api/admin/trekkers', methods=['POST'])
@login_required
def admin_save_trekker():
    if current_user.role != 'admin':
        return jsonify({'error': 'Unauthorized'}), 403
        
    data = request.get_json() or {}
    trekker_id = data.get('id')
    email = data.get('email')
    name = data.get('name')
    phone = data.get('phone') or ''
    password = data.get('password')
    city = data.get('city') or ''
    emergency = data.get('emergency') or ''
    bio = data.get('bio') or ''
    
    if not email or not name:
        return jsonify({'error': 'Email and Name are required.'}), 400

    if trekker_id:
        trekker = User.query.get(trekker_id)
        if not trekker or trekker.role != 'user':
            return jsonify({'error': 'Trekker not found.'}), 404
            
        existing = User.query.filter(User.email == email, User.id != trekker_id).first()
        if existing:
            return jsonify({'error': 'Email already registered by another user.'}), 400
            
        trekker.email = email
        trekker.name = name
        trekker.phone = phone
        trekker.city = city
        trekker.emergency = emergency
        trekker.bio = bio
        if password:
            trekker.password_hash = generate_password_hash(password)
    else:
        existing = User.query.filter_by(email=email).first()
        if existing:
            return jsonify({'error': 'Email already registered.'}), 400
            
        trekker = User(
            email=email,
            name=name,
            phone=phone,
            password_hash=generate_password_hash(password or 'Trekker@123'),
            role='user',
            city=city,
            emergency=emergency,
            bio=bio
        )
        db.session.add(trekker)
        
    db.session.commit()
    return jsonify({'success': True})

@app.route('/api/admin/staff/toggle/<int:staff_id>', methods=['POST'])
@login_required
def admin_toggle_staff(staff_id):
    if current_user.role != 'admin':
        return jsonify({'error': 'Unauthorized'}), 403
        
    staff = User.query.get(staff_id)
    if not staff or staff.role != 'staff':
        return jsonify({'error': 'Staff member not found'}), 404
        
    staff.active = not staff.active
    db.session.commit()
    return jsonify({'success': True, 'active': staff.active})

@app.route('/api/admin/users/blacklist/<int:user_id>', methods=['POST'])
@login_required
def admin_blacklist_user(user_id):
    if current_user.role != 'admin':
        return jsonify({'error': 'Unauthorized'}), 403
        
    user = db.session.get(User, user_id)
    if not user or user.role not in ('user', 'staff'):
        return jsonify({'error': 'User not found'}), 404
        
    reason = 'Policy violation'
    if request.is_json:
        data = request.get_json() or {}
        reason = data.get('reason', 'Policy violation')
    elif request.form:
        reason = request.form.get('reason', 'Policy violation')
        
    user.blacklisted = True
    user.blacklist_reason = reason
    db.session.commit()
    return jsonify({'success': True, 'blacklisted': True})

@app.route('/api/admin/users/restore/<int:user_id>', methods=['POST'])
@login_required
def admin_restore_user(user_id):
    if current_user.role != 'admin':
        return jsonify({'error': 'Unauthorized'}), 403
        
    user = db.session.get(User, user_id)
    if not user or user.role not in ('user', 'staff'):
        return jsonify({'error': 'User not found'}), 404
        
    user.blacklisted = False
    db.session.commit()
    return jsonify({'success': True, 'blacklisted': False})

# Trek approvals/rejections endpoints removed as admin creates treks directly

@app.route('/api/admin/bookings/cancel/<int:booking_id>', methods=['POST'])
@login_required
def admin_cancel_booking(booking_id):
    if current_user.role != 'admin':
        return jsonify({'error': 'Unauthorized'}), 403
        
    booking = Booking.query.get(booking_id)
    if not booking:
        return jsonify({'error': 'Booking not found'}), 404
        
    booking.status = 'Cancelled'
    db.session.commit()
    invalidate_open_treks_cache()
    return jsonify({'success': True})

@app.route('/api/admin/bookings/refund/<int:booking_id>', methods=['POST'])
@login_required
def admin_refund_booking(booking_id):
    if current_user.role != 'admin':
        return jsonify({'error': 'Unauthorized'}), 403
        
    booking = Booking.query.get(booking_id)
    if not booking:
        return jsonify({'error': 'Booking not found'}), 404
        
    data = request.get_json() or {}
    refund_amount = data.get('refund_amount', 0)
    
    # Check bounds
    paid_amt = booking.amount_paid or booking.booking_price or (booking.trek.price if booking.trek else 5000)
    if refund_amount < 0 or refund_amount > paid_amt:
        return jsonify({'error': f'Invalid refund amount. Must be between 0 and {paid_amt}.'}), 400
        
    booking.status = 'Cancelled'
    booking.payment_status = 'Refunded'
    booking.refund_amount = refund_amount
    booking.paid = False
    
    db.session.commit()
    invalidate_open_treks_cache()
    return jsonify({'success': True})

@app.route('/api/admin/jobs/trigger', methods=['POST'])
@login_required
def admin_trigger_job():
    if current_user.role != 'admin':
        return jsonify({'error': 'Unauthorized'}), 403
        
    data = request.get_json() or {}
    job_name = data.get('name')
    
    if 'Reminder' in job_name or 'Prep' in job_name:
        from backend.tasks import send_daily_reminders, update_job_run
        update_job_run('Daily Prep Reminders', 'Running')
        send_daily_reminders.delay(is_manual=True)
    elif 'Report' in job_name:
        from backend.tasks import generate_monthly_report, update_job_run
        update_job_run('Monthly Activity Report', 'Running')
        generate_monthly_report.delay(is_manual=True)
    elif 'Marketing' in job_name or 'Campaign' in job_name:
        from backend.tasks import send_marketing_campaign, update_job_run
        update_job_run('Daily Marketing Campaign', 'Running')
        send_marketing_campaign.delay(is_manual=True)
        
    return jsonify({'success': True, 'message': f'Job "{job_name}" triggered successfully.'})

@app.route('/api/admin/jobs/test_welcome', methods=['POST'])
@login_required
def admin_test_welcome_email():
    if current_user.role != 'admin':
        return jsonify({'error': 'Unauthorized'}), 403
        
    data = request.get_json() or {}
    email_type = data.get('type')  # 'user' or 'staff'
    email_address = data.get('email')
    
    if not email_address:
        return jsonify({'error': 'Recipient email address is required'}), 400
        
    if email_type == 'user':
        from backend.tasks import send_test_user_welcome
        send_test_user_welcome.delay(email_address)
    elif email_type == 'staff':
        from backend.tasks import send_test_staff_welcome
        send_test_staff_welcome.delay(email_address)
    else:
        return jsonify({'error': 'Invalid welcome email type'}), 400
        
    return jsonify({'success': True, 'message': f'Test welcome email ({email_type}) triggered successfully to {email_address}.'})

@app.route('/api/admin/export', methods=['POST'])
@login_required
def admin_export():
    if current_user.role != 'admin':
        return jsonify({'error': 'Unauthorized'}), 403
        
    data = request.get_json() or {}
    export_type = data.get('type', 'database')
    
    import json
    scratch_dir = os.path.join(os.path.dirname(__file__), '../scratch')
    os.makedirs(scratch_dir, exist_ok=True)
    filepath = os.path.join(scratch_dir, f"export_{export_type}_{int(datetime.now().timestamp())}.json")
    
    export_data = {}
    if export_type == 'users':
        export_data = [u.to_json() for u in User.query.all()]
    elif export_type == 'bookings':
        export_data = [b.to_json() for b in Booking.query.all()]
    else:
        export_data = {
            'users': [u.to_json() for u in User.query.all()],
            'treks': [t.to_json() for t in Trek.query.all()],
            'bookings': [b.to_json() for b in Booking.query.all()]
        }
        
    with open(filepath, 'w') as f:
        json.dump(export_data, f, indent=4)
        
    return jsonify({'success': True, 'message': f'Exported {export_type} database successfully.'})

@app.route('/api/admin/support_tickets/resolve/<int:ticket_id>', methods=['POST'])
@login_required
def admin_resolve_support_ticket(ticket_id):
    if current_user.role != 'admin':
        return jsonify({'error': 'Unauthorized'}), 403
    ticket = SupportTicket.query.get(ticket_id)
    if not ticket:
        return jsonify({'error': 'Ticket not found'}), 404
    ticket.status = 'Resolved'
    
    # Auto-block dates for leave requests
    import re
    if ticket.subject and '[Leave Request]' in ticket.subject:
        dates_found = re.findall(r'\d{4}-\d{2}-\d{2}', ticket.subject)
        if not dates_found and ticket.message:
            dates_found = re.findall(r'\d{4}-\d{2}-\d{2}', ticket.message)
            
        if dates_found and ticket.user_id:
            staff = User.query.get(ticket.user_id)
            if staff and staff.role == 'staff':
                profile = staff.staff_profile
                if not profile:
                    profile = StaffProfile(user_id=staff.id)
                    db.session.add(profile)
                    
                from datetime import datetime, timedelta
                all_leave_dates = []
                if len(dates_found) == 2:
                    try:
                        start_dt = datetime.strptime(dates_found[0], '%Y-%m-%d')
                        end_dt = datetime.strptime(dates_found[1], '%Y-%m-%d')
                        if start_dt <= end_dt:
                            curr = start_dt
                            while curr <= end_dt:
                                all_leave_dates.append(curr.strftime('%Y-%m-%d'))
                                curr += timedelta(days=1)
                        else:
                            all_leave_dates = dates_found
                    except ValueError:
                        all_leave_dates = dates_found
                else:
                    all_leave_dates = dates_found
                    
                existing_blocked = profile.custom_blocked_dates or ''
                existing_list = [d.strip() for d in existing_blocked.split(',') if d.strip()]
                for d in all_leave_dates:
                    if d not in existing_list:
                        existing_list.append(d)
                profile.custom_blocked_dates = ','.join(sorted(existing_list))

    db.session.commit()
    return jsonify({'success': True, 'message': f'Ticket #{ticket_id} resolved.'})

@app.route('/api/admin/treks/assign/<int:trek_id>', methods=['POST'])
@login_required
def admin_assign_trek(trek_id):
    if current_user.role != 'admin':
        return jsonify({'error': 'Unauthorized'}), 403
        
    data = request.get_json() or {}
    email = data.get('email')
    
    trek = Trek.query.get(trek_id)
    if not trek:
        return jsonify({'error': 'Trek not found'}), 404
        
    if not email:
        trek.staff_id = None
        db.session.commit()
        invalidate_open_treks_cache()
        return jsonify({'success': True})
        
    staff = User.query.filter_by(email=email, role='staff').first()
    if not staff:
        return jsonify({'error': 'Staff member not found'}), 404
        
    # Check conflict
    conflict = Trek.query.filter(
        Trek.staff_id == staff.id,
        Trek.id != trek_id,
        Trek.start_date <= trek.end_date,
        Trek.end_date >= trek.start_date
    ).first()
    if conflict:
        return jsonify({'error': f"Conflict: Guide is already assigned to batch '{conflict.name}' ({conflict.batch_code}) from {conflict.start_date} to {conflict.end_date}."}), 400
        
    if staff.staff_profile and staff.staff_profile.custom_blocked_dates:
        blocked_str = staff.staff_profile.custom_blocked_dates
        blocked_dates = [d.strip() for d in blocked_str.split(',') if d.strip()]
        from datetime import timedelta
        curr = trek.start_date
        while curr <= trek.end_date:
            curr_str = curr.strftime('%Y-%m-%d')
            if curr_str in blocked_dates:
                return jsonify({'error': f"Conflict: Guide is marked Unavailable (Leave/Off Day) on {curr_str}. Clear unavailability first."}), 400
            curr += timedelta(days=1)
        
    trek.staff_id = staff.id
    db.session.commit()
    # Always notify staff when admin explicitly assigns them to a trek
    dispatch_guide_assignment_email(staff.id, trek.id)
    invalidate_open_treks_cache()
    return jsonify({'success': True})

@app.route('/api/admin/report', methods=['POST'])
@login_required
def admin_trigger_report():
    if current_user.role != 'admin':
        return jsonify({'error': 'Unauthorized'}), 403
        
    data = request.get_json() or {}
    report_type = data.get('type')
    
    if report_type == 'monthly':
        from backend.tasks import generate_monthly_report
        generate_monthly_report.delay()
        return jsonify({'message': 'Monthly HTML report triggered via Celery.'})
    else:
        from backend.tasks import send_daily_reminders
        send_daily_reminders.delay()
        return jsonify({'message': 'Daily reminders triggered via Celery.'})

# ── STAFF API ────────────────────────────────────────────────

@app.route('/api/staff/dashboard_data', methods=['GET'])
@login_required
def staff_dashboard_data():
    update_completed_bookings()
    if current_user.role != 'staff':
        return jsonify({'error': 'Unauthorized'}), 403
        
    assigned_treks_query = Trek.query.filter_by(staff_id=current_user.id).all()
    assigned_treks = []
    participants = []
    
    for t in assigned_treks_query:
        booked_count = Booking.query.filter_by(trek_id=t.id, status='Booked').count()
        assigned_treks.append({
            'id': t.id,
            'batchCode': t.batch_code or f"TID{t.id:03d}B01",
            'name': t.name,
            'location': t.location,
            'difficulty': t.difficulty,
            'duration': t.duration,
            'startDate': t.start_date.strftime('%Y-%m-%d') if t.start_date else '',
            'endDate': t.end_date.strftime('%Y-%m-%d') if t.end_date else '',
            'slots': t.slots,
            'registered': booked_count,
            'status': t.status
        })
        
        bookings_query = Booking.query.filter_by(trek_id=t.id).all()
        for b in bookings_query:
            user_data = b.user.to_json()
            participants.append({
                'id': b.id,
                'bookingId': b.unique_booking_id,
                'userId': b.user_id,
                'trekkerId': user_data.get('memberId'),
                'trekId': t.id,
                'name': b.user.name,
                'email': b.user.email,
                'phone': b.user.phone or '',
                'bookedOn': b.booked_on.strftime('%Y-%m-%d'),
                'status': b.status,
                'emergencyContact': 'Emergency Contact',
                'emergencyPhone': b.user.emergency or '',
                'bloodGroup': b.user.blood_group or '—',
                'attendance': False,
                'paymentStatus': b.payment_status or ('Paid' if b.paid else 'Pending')
            })
            
    profile = current_user.staff_profile
    staff_profile_data = {
        'memberId': current_user.to_json().get('memberId'),
        'name': current_user.name,
        'email': current_user.email,
        'phone': current_user.phone or '',
        'city': current_user.city or '',
        'bio': current_user.bio or '',
        'joined': current_user.registered_at.strftime('%Y-%m-%d') if current_user.registered_at else '',
        'active': current_user.active,
        'blacklisted': current_user.blacklisted,
        'designation': profile.designation if profile else 'Lead Guide',
        'certifications': profile.certifications if profile else 'Wilderness First Responder (WFR)',
        'languages': profile.languages if profile else 'English, Hindi',
        'skills': profile.skills if profile else 'Wilderness First Aid, Navigation',
        'experienceYears': profile.experience_years if profile else 2,
        'completedTreksCount': profile.completed_treks_count if profile else 10,
        'photoUrl': profile.photo_url if profile else '',
        'status': profile.status if profile else 'Active',
        'customBlockedDates': profile.custom_blocked_dates if profile else '',
    }
            
    return jsonify({
        'staffName': current_user.name,
        'staffProfile': staff_profile_data,
        'assignedTreks': assigned_treks,
        'participants': participants
    })

@app.route('/api/staff/profile', methods=['POST'])
@login_required
def staff_profile():
    return jsonify({'error': 'Staff profiles can only be edited by administrators.'}), 403

@app.route('/api/staff/password', methods=['POST'])
@login_required
def staff_password():
    if current_user.role != 'staff':
        return jsonify({'error': 'Unauthorized'}), 403
        
    data = request.get_json() or {}
    current_pw = data.get('current')
    new_pw = data.get('new')
    
    if not check_password_hash(current_user.password_hash, current_pw):
        return jsonify({'error': 'Incorrect current password.'}), 400
        
    current_user.password_hash = generate_password_hash(new_pw)
    db.session.commit()
    return jsonify({'message': 'Password updated successfully.'})

@app.route('/api/staff/treks/slots/<int:trek_id>', methods=['POST'])
@login_required
def staff_update_slots(trek_id):
    if current_user.role != 'staff':
        return jsonify({'error': 'Unauthorized'}), 403
        
    trek = Trek.query.filter_by(id=trek_id, staff_id=current_user.id).first()
    if not trek:
        return jsonify({'error': 'Trek not found or not assigned to you.'}), 404
        
    data = request.get_json() or {}
    slots = data.get('slots')
    
    booked_count = Booking.query.filter_by(trek_id=trek_id, status='Booked').count()
    if slots < booked_count:
        return jsonify({'error': 'Slots cannot be less than currently registered bookings.'}), 400
        
    trek.slots = slots
    db.session.commit()
    invalidate_open_treks_cache()
    return jsonify({'success': True})

@app.route('/api/staff/treks/status/<int:trek_id>', methods=['POST'])
@login_required
def staff_update_status(trek_id):
    if current_user.role != 'staff':
        return jsonify({'error': 'Unauthorized'}), 403
        
    trek = Trek.query.filter_by(id=trek_id, staff_id=current_user.id).first()
    if not trek:
        return jsonify({'error': 'Trek not found or not assigned to you.'}), 404
        
    data = request.get_json() or {}
    status = data.get('status')
    
    trek.status = status
    if status == 'Completed':
        # Update all active bookings for this trek to Completed
        bookings = Booking.query.filter_by(trek_id=trek.id, status='Booked').all()
        for b in bookings:
            b.status = 'Completed'
            
    db.session.commit()
    invalidate_open_treks_cache()
    return jsonify({'success': True})

@app.route('/api/staff/participants/status/<int:booking_id>', methods=['POST'])
@login_required
def staff_update_participant(booking_id):
    if current_user.role != 'staff':
        return jsonify({'error': 'Unauthorized'}), 403
        
    booking = Booking.query.get(booking_id)
    if not booking:
        return jsonify({'error': 'Booking not found.'}), 404
        
    if booking.trek.staff_id != current_user.id:
        return jsonify({'error': 'Unauthorized.'}), 403
        
    data = request.get_json() or {}
    status = data.get('status')
    
    booking.status = status
    db.session.commit()
    invalidate_open_treks_cache()
    return jsonify({'success': True})

@app.route('/api/staff/export/<int:trek_id>', methods=['POST'])
@login_required
def staff_export(trek_id):
    if current_user.role != 'staff':
        return jsonify({'error': 'Unauthorized'}), 403
        
    trek = Trek.query.filter_by(id=trek_id, staff_id=current_user.id).first()
    if not trek:
        return jsonify({'error': 'Trek not found or not assigned to you.'}), 404
        
    # Generate CSV and write to scratch/emails/
    from backend.tasks import export_booking_history_csv
    # We can reuse the export_booking_history_csv task structure or make a simple file export
    # For a trek-specific export, let's write participants to a CSV
    import csv
    email_dir = os.path.join(os.path.dirname(__file__), '../scratch/emails')
    os.makedirs(email_dir, exist_ok=True)
    
    filename = f"participants_trek_{trek_id}_{int(datetime.now().timestamp())}.csv"
    filepath = os.path.join(email_dir, filename)
    
    bookings = Booking.query.filter_by(trek_id=trek_id).all()
    with open(filepath, 'w', newline='') as f:
        writer = csv.writer(f)
        writer.writerow(['Booking ID', 'Trekker ID', 'Participant Name', 'Participant Email', 'Booked On', 'Status'])
        for b in bookings:
            writer.writerow([b.unique_booking_id, b.user.to_json()['memberId'], b.user.name, b.user.email, b.booked_on.strftime('%Y-%m-%d'), b.status])
            
    return jsonify({'message': f'CSV export triggered. File generated: {filename}'})


# ── STAFF SUPPORT TICKETS ──────────────────────────────────────

@app.route('/api/staff/tickets', methods=['GET'])
@login_required
def get_staff_tickets():
    if current_user.role != 'staff':
        return jsonify({'error': 'Unauthorized'}), 403
    tickets = SupportTicket.query.filter_by(user_id=current_user.id).order_by(SupportTicket.created_at.desc()).all()
    return jsonify([ticket.to_json() for ticket in tickets])

@app.route('/api/staff/tickets', methods=['POST'])
@login_required
def create_staff_ticket():
    if current_user.role != 'staff':
        return jsonify({'error': 'Unauthorized'}), 403
    data = request.get_json() or {}
    subject = data.get('subject', '').strip()
    message = data.get('message', '').strip()
    category = data.get('category', 'General').strip()
    
    if not subject or not message:
        return jsonify({'error': 'Subject and Message are required'}), 400
        
    full_subject = f"[{category}] {subject}"
    
    ticket = SupportTicket(
        user_id=current_user.id,
        name=current_user.name,
        email=current_user.email,
        subject=full_subject,
        message=message,
        status='Open'
    )
    db.session.add(ticket)
    db.session.commit()
    
    return jsonify({'success': True, 'ticket': ticket.to_json(), 'message': 'Ticket submitted successfully'})


# ── TRAILSYNC SOCIAL ───────────────────────────────────────────

@app.route('/api/social/groups', methods=['GET'])
@login_required
def get_social_groups():
    if current_user.role == 'user':
        # Treks the user has booked
        bookings = Booking.query.filter_by(user_id=current_user.id, status='Booked').all()
        treks = [b.trek for b in bookings if b.trek]
    elif current_user.role == 'staff':
        # Treks the guide is assigned to
        treks = Trek.query.filter_by(staff_id=current_user.id).all()
    elif current_user.role == 'admin':
        treks = Trek.query.all()
    else:
        return jsonify({'error': 'Unauthorized'}), 403
        
    groups = []
    for t in treks:
        # Only include active groups (must have at least one message/been created)
        msg_count = ChatMessage.query.filter_by(trek_id=t.id).count()
        if msg_count == 0:
            continue
            
        # Check locked state
        settings = TrekGroupSetting.query.filter_by(trek_id=t.id).first()
        is_locked = settings.is_locked if settings else False
        
        # Count total members (booked trekkers + guide)
        member_count = Booking.query.filter_by(trek_id=t.id, status='Booked').count()
        if t.staff_id:
            member_count += 1
            
        # Check for unread announcements
        has_unread = False
        if current_user.role == 'user':
            latest_announcement = ChatMessage.query.filter_by(trek_id=t.id, is_announcement=True).order_by(ChatMessage.id.desc()).first()
            if latest_announcement:
                read_record = UserAnnouncementRead.query.filter_by(user_id=current_user.id, trek_id=t.id).first()
                if not read_record or read_record.last_read_message_id < latest_announcement.id:
                    has_unread = True
                    
        groups.append({
            'id': t.id,
            'name': t.name,
            'batchCode': t.batch_code or f"TID{t.id:03d}B01",
            'startDate': t.start_date.strftime('%Y-%m-%d') if t.start_date else '',
            'endDate': t.end_date.strftime('%Y-%m-%d') if t.end_date else '',
            'status': t.status,
            'isLocked': is_locked,
            'memberCount': member_count,
            'hasUnreadAnnouncement': has_unread
        })
        
    return jsonify(groups)


@app.route('/api/social/pending_groups', methods=['GET'])
@login_required
def get_pending_social_groups():
    # Only staff should use this endpoint
    if current_user.role != 'staff':
        return jsonify({'error': 'Unauthorized'}), 403

    # Treks where this staff is assigned but no chat messages exist yet
    treks = Trek.query.filter_by(staff_id=current_user.id).all()
    pending = []
    for t in treks:
        msg_count = ChatMessage.query.filter_by(trek_id=t.id).count()
        if msg_count == 0:
            member_count = Booking.query.filter_by(trek_id=t.id, status='Booked').count()
            if t.staff_id:
                member_count += 1
            pending.append({
                'id': t.id,
                'name': t.name,
                'batchCode': t.batch_code or f"TID{t.id:03d}B01",
                'startDate': t.start_date.strftime('%Y-%m-%d') if t.start_date else '',
                'endDate': t.end_date.strftime('%Y-%m-%d') if t.end_date else '',
                'status': t.status,
                'memberCount': member_count
            })

    return jsonify(pending)


@app.route('/api/social/group/<int:trek_id>/create', methods=['POST'])
@login_required
def create_social_group(trek_id):
    # Only the assigned staff can create the group for their trek
    trek = Trek.query.get(trek_id)
    if not trek:
        return jsonify({'error': 'Trek not found.'}), 404
    if current_user.role != 'staff' or trek.staff_id != current_user.id:
        return jsonify({'error': 'Unauthorized'}), 403

    # If group already has messages, return
    msg_count = ChatMessage.query.filter_by(trek_id=trek_id).count()
    if msg_count > 0:
        return jsonify({'error': 'Group already exists'}), 400

    # Create a TrekGroupSetting record to mark group as initialized (optional)
    settings = TrekGroupSetting.query.filter_by(trek_id=trek_id).first()
    if not settings:
        settings = TrekGroupSetting(trek_id=trek_id, is_locked=False)
        db.session.add(settings)

    # Create an initial system message indicating group creation
    msg_text = f"Group created by guide {current_user.name}. Participants added: all booked trekkers."
    msg = ChatMessage(
        trek_id=trek_id,
        sender_id=current_user.id,
        sender_name=current_user.name,
        sender_role='staff',
        message_text=msg_text,
        is_announcement=False
    )
    db.session.add(msg)
    db.session.commit()
    return jsonify({'success': True, 'message': 'Group created and participants included.', 'trek': trek.to_json()})

@app.route('/api/social/group/<int:trek_id>/messages', methods=['GET'])
@login_required
def get_social_group_messages(trek_id):
    # Verify membership
    is_member = False
    if current_user.role == 'admin':
        is_member = True
    elif current_user.role == 'staff':
        trek = Trek.query.filter_by(id=trek_id, staff_id=current_user.id).first()
        if trek:
            is_member = True
    else:
        booking = Booking.query.filter_by(user_id=current_user.id, trek_id=trek_id, status='Booked').first()
        if booking:
            is_member = True
            
    if not is_member:
        return jsonify({'error': 'You are not a member of this trek group.'}), 403
        
    messages = ChatMessage.query.filter_by(trek_id=trek_id).order_by(ChatMessage.created_at.asc()).all()
    
    # Update unread count / read state for user
    latest_announcement = ChatMessage.query.filter_by(trek_id=trek_id, is_announcement=True).order_by(ChatMessage.id.desc()).first()
    if latest_announcement and current_user.role == 'user':
        read_record = UserAnnouncementRead.query.filter_by(user_id=current_user.id, trek_id=trek_id).first()
        if not read_record:
            read_record = UserAnnouncementRead(user_id=current_user.id, trek_id=trek_id, last_read_message_id=latest_announcement.id)
            db.session.add(read_record)
        else:
            read_record.last_read_message_id = max(read_record.last_read_message_id, latest_announcement.id)
        db.session.commit()
        
    return jsonify([m.to_json() for m in messages])

@app.route('/api/social/group/<int:trek_id>/messages', methods=['POST'])
@login_required
def send_social_group_message(trek_id):
    # Verify membership
    is_member = False
    trek = Trek.query.get(trek_id)
    if not trek:
        return jsonify({'error': 'Trek not found.'}), 404
        
    if current_user.role == 'admin':
        is_member = True
    elif current_user.role == 'staff':
        if trek.staff_id == current_user.id:
            is_member = True
    else:
        booking = Booking.query.filter_by(user_id=current_user.id, trek_id=trek_id, status='Booked').first()
        if booking:
            is_member = True
            
    if not is_member:
        return jsonify({'error': 'You are not a member of this trek group.'}), 403
        
    # Check lock status
    settings = TrekGroupSetting.query.filter_by(trek_id=trek_id).first()
    is_locked = settings.is_locked if settings else False
    if is_locked and current_user.role == 'user':
        return jsonify({'error': 'This chat has been locked by the guide.'}), 403
        
    data = request.get_json() or {}
    message_text = data.get('messageText', '').strip()
    is_announcement = data.get('isAnnouncement', False)
    announcement_title = data.get('announcementTitle', '').strip()
    
    if not message_text:
        return jsonify({'error': 'Message text is required.'}), 400
        
    # Standard users cannot post announcements
    if current_user.role == 'user':
        is_announcement = False
        announcement_title = None
        
    msg = ChatMessage(
        trek_id=trek_id,
        sender_id=current_user.id,
        sender_name=current_user.name,
        sender_role=current_user.role,
        message_text=message_text,
        is_announcement=is_announcement,
        announcement_title=announcement_title if is_announcement else None
    )
    db.session.add(msg)
    db.session.commit()
    
    return jsonify(msg.to_json())

@app.route('/api/social/group/<int:trek_id>/toggle_lock', methods=['POST'])
@login_required
def toggle_social_group_lock(trek_id):
    # Verify permissions (Only the assigned guide or admin)
    trek = Trek.query.get(trek_id)
    if not trek:
        return jsonify({'error': 'Trek not found.'}), 404
        
    if current_user.role != 'admin' and (current_user.role != 'staff' or trek.staff_id != current_user.id):
        return jsonify({'error': 'Unauthorized'}), 403
        
    settings = TrekGroupSetting.query.filter_by(trek_id=trek_id).first()
    if not settings:
        settings = TrekGroupSetting(trek_id=trek_id, is_locked=True)
        db.session.add(settings)
    else:
        settings.is_locked = not settings.is_locked
        
    db.session.commit()
    return jsonify({'success': True, 'isLocked': settings.is_locked})

@app.route('/api/social/group/<int:trek_id>/members', methods=['GET'])
@login_required
def get_social_group_members(trek_id):
    trek = Trek.query.get(trek_id)
    if not trek:
        return jsonify({'error': 'Trek not found.'}), 404
        
    # Get guide details
    guide_data = None
    if trek.staff:
        profile = trek.staff.staff_profile
        photos = [
            "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&h=300&fit=crop",
            "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=300&fit=crop",
            "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&h=300&fit=crop"
        ]
        photo_url = (profile.photo_url if (profile and profile.photo_url) else None) or photos[trek.staff.id % len(photos)]
        guide_data = {
            'id': trek.staff.id,
            'name': trek.staff.name,
            'photoUrl': photo_url,
            'designation': profile.designation if profile else 'Lead Guide',
            'role': 'guide'
        }
        
    # Get registered trekkers
    bookings = Booking.query.filter_by(trek_id=trek_id, status='Booked').all()
    trekkers = []
    photos = [
        "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&h=300&fit=crop",
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=300&fit=crop",
        "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&h=300&fit=crop"
    ]
    for b in bookings:
        u = b.user
        photo_url = photos[u.id % len(photos)]
        trekkers.append({
            'id': u.id,
            'name': u.name,
            'photoUrl': photo_url,
            'bio': u.bio or 'Outdoor enthusiast. Passionate about exploring the trails.',
            'city': u.city or 'Not Specified',
            'joined': u.registered_at.strftime('%Y-%m-%d') if u.registered_at else '',
            'preferredDifficulty': u.preferred_difficulty or 'Moderate',
            'role': 'trekker'
        })
        
    return jsonify({
        'guide': guide_data,
        'trekkers': trekkers
    })


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8000, debug=True)
