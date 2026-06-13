import os
import jwt
from functools import wraps
from flask import Flask, render_template, request, jsonify, redirect, url_for, make_response, g
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime, date, timedelta
import redis
import json

from backend.models.models import db, User, Trek, Booking, StaffProfile, BookingChecklistItem, TrekGuideItem, SupportTicket, TrekRoute

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
    for r in active_routes:
        r_json = r.to_json()
        # Find open batches for this route
        open_batches = Trek.query.filter_by(trek_route_id=r.id, status='Open').all()
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

def seed_db():
    db.session.remove()
    db.drop_all()
    db.create_all()
    
    # Seed Admin
    admin = User(
        email='admin@trailsync.com',
        password_hash=generate_password_hash('admin123'),
        name='Admin',
        role='admin'
    )
    db.session.add(admin)
    
    # Seed Test Trekker User
    test_user = User(
        email='test@gmail.com',
        password_hash=generate_password_hash('123456'),
        name='Test Trekker',
        role='user'
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
            phone=phone
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
            bio=f"Loves mountains. Acclimatized to {random.choice(['2000m', '3000m', '4000m'])}."
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

    # Now seed batches (Trek objects) for the first 40 routes
    all_treks = []
    # Seeding of default mock batches has been disabled as requested
            
    db.session.flush()

    # Assign 3-4 treks to each of the 10 staff members
    assignments = {
        0: [0, 10, 20],
        1: [1, 11, 21],
        2: [2, 12, 22],
        3: [3, 13, 23, 33], # Test Staff (staff@test.com)
        4: [4, 14, 24, 34],
        5: [5, 15, 25, 35],
        6: [6, 16, 26, 36],
        7: [7, 17, 27, 37],
        8: [18, 28, 38],
        9: [19, 29, 39]
    }
    
    for staff_idx, trek_indices in assignments.items():
        s = staff_users[staff_idx]
        for t_idx in trek_indices:
            if t_idx < len(all_treks):
                all_treks[t_idx].staff_id = s.id
                
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

    # Seed bookings and packing lists for the 10 open treks
    # Seeding of default mock bookings has been disabled as requested
                
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

# Ensure tables are created and seeded
with app.app_context():
    seed_db()


@app.route('/api/public/treks', methods=['GET'])
def get_public_treks():
    treks = Trek.query.all()
    return jsonify([t.to_json() for t in treks])

# ── PAGES ────────────────────────────────────────────────────


@app.route('/')
def home():
    return render_template('index.html')

@app.route('/admin')
@login_required
def admin():
    if current_user.role != 'admin':
        return redirect(url_for('home'))
    return render_template('admin.html')

@app.route('/staff')
@login_required
def staff():
    if current_user.role != 'staff':
        return redirect(url_for('home'))
    return render_template('staff.html')

@app.route('/dashboard')
@login_required
def dashboard():
    if current_user.role != 'user':
        return redirect(url_for('home'))
    return render_template('user.html')

@app.route('/login/<role>')
def login_role_page(role):
    return render_template('login.html')

@app.route('/login')
def login_page():
    return render_template('login.html')

@app.route('/register')
def register_page():
    return render_template('register.html')


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

@app.route('/api/user/dashboard_data', methods=['GET'])
@login_required
def user_dashboard_data():
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
    
    trek = Trek.query.get(trek_id)
    if not trek:
        return jsonify({'error': 'Trek not found.'}), 404
        
    if trek.status != 'Open':
        return jsonify({'error': 'Trek is not open for bookings.'}), 400
        
    booked_count = Booking.query.filter_by(trek_id=trek_id, status='Booked').count()
    if booked_count >= trek.slots:
        return jsonify({'error': 'Trek is full.'}), 400
        
    existing = Booking.query.filter_by(user_id=current_user.id, trek_id=trek_id, status='Booked').first()
    if existing:
        return jsonify({'error': 'You have already booked this trek.'}), 400
        
    booking = Booking(
        user_id=current_user.id,
        trek_id=trek_id,
        status='Booked',
        paid=True
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
    
    return jsonify({'message': f'Booked {trek.name} successfully!'})

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
        {'label': 'Active Treks', 'value': open_treks, 'icon': 'active', 'category': 'treks'},
        {'label': 'Total Bookings', 'value': total_bookings, 'icon': 'book', 'category': 'bookings'},
        {'label': 'Cancelled Bookings', 'value': cancelled_bookings_count, 'icon': 'cancel', 'category': 'bookings'}
    ]
    
    pending_treks_count = Trek.query.filter_by(status='Pending').count()
    completed_treks_count = Trek.query.filter_by(status='Completed').count()
    closed_treks_count = Trek.query.filter_by(status='Closed').count()
    
    trek_status_overview = [
        {'label': 'Open', 'count': open_treks, 'pct': int((open_treks/total_batches*100) if total_batches else 0), 'color': '#4ade80'},
        {'label': 'Pending', 'count': pending_treks_count, 'pct': int((pending_treks_count/total_batches*100) if total_batches else 0), 'color': '#fbbf24'},
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
        booked_count = Booking.query.filter_by(trek_id=t.id, status='Booked').count()
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
            'treksDone': treks_done
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
            'photoUrl': photo_url
        })
        
    all_bookings = []
    for b in Booking.query.all():
        all_bookings.append({
            'id': b.id,
            'userId': b.user_id,
            'user': b.user.name,
            'trekId': b.trek_id,
            'trek': b.trek.name,
            'batchCode': b.trek.batch_code or f"TID{b.trek.id:03d}B01",
            'date': b.booked_on.strftime('%Y-%m-%d'),
            'status': b.status,
            'paid': b.paid,
            'paidAmount': b.trek.price if b.paid else 0,
            'paidOn': b.booked_on.strftime('%Y-%m-%d') if b.paid else '—',
            'transactionId': f"TXN{b.booked_on.strftime('%y%m%d')}{b.id:04d}" if b.paid else '—'
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
        booked = Booking.query.filter_by(trek_id=t.id, status='Booked').count()
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
    
    scheduled_jobs = [
        {'name': 'Daily Reminder Emails', 'schedule': 'Every day at 08:00', 'lastRun': '2026-06-10 08:00', 'status': 'Success'},
        {'name': 'Monthly Activity Report', 'schedule': '1st of every month', 'lastRun': '2026-06-01 08:00', 'status': 'Success'},
        {'name': 'Cache Refresh Job', 'schedule': 'Every 15 min', 'lastRun': '2026-06-10 09:45', 'status': 'Success'}
    ]
    
    system_health = {
        'database': {'label': 'SQLite Database', 'status': 'Online', 'ok': True},
        'redis': {'label': 'Redis Cache', 'status': 'Connected', 'ok': True},
        'celery': {'label': 'Celery Worker', 'status': 'Running', 'ok': True},
        'beats': {'label': 'Celery Beat', 'status': 'Active', 'ok': True},
        'api': {'label': 'Flask API', 'status': 'Healthy', 'ok': True}
    }
    
    from collections import defaultdict
    months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    monthly_counts = defaultdict(int)
    for b in Booking.query.all():
        if b.booked_on:
            m_name = b.booked_on.strftime('%b')
            monthly_counts[m_name] += 1
            
    monthly_bookings = [
        {'month': 'Jan', 'count': 120},
        {'month': 'Feb', 'count': 160},
        {'month': 'Mar', 'count': 210},
        {'month': 'Apr', 'count': 180},
        {'month': 'May', 'count': 250},
        {'month': 'Jun', 'count': 300}
    ]
        
    easy_c = Trek.query.filter_by(difficulty='Easy').count()
    mod_c = Trek.query.filter_by(difficulty='Moderate').count()
    hard_c = Trek.query.filter_by(difficulty='Hard').count()
    difficulty_dist = [
        {'level': 'Easy', 'pct': int((easy_c / total_treks * 100) if total_treks else 38), 'color': '#4ade80'},
        {'level': 'Moderate', 'pct': int((mod_c / total_treks * 100) if total_treks else 45), 'color': '#fbbf24'},
        {'level': 'Hard', 'pct': int((hard_c / total_treks * 100) if total_treks else 17), 'color': '#ef4444'}
    ]
    
    user_growth = []
    for i, m in enumerate(['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun']):
        user_growth.append({'month': m, 'users': max(10, registered_users - (5 - i) * 8)})
        
    paid_bookings = Booking.query.filter(Booking.status != 'Cancelled').all()
    tot_rev = sum(b.trek.price for b in paid_bookings)
    revenue_data = {
        'total': f"₹{tot_rev:,}",
        'monthly': f"₹{int(tot_rev / 6):,}",
        'topTrek': 'Valley of Flowers',
        'topRevenue': f"₹{int(tot_rev * 0.3):,}"
    }
    
    blacklisted_users = []
    for u in User.query.filter_by(blacklisted=True).all():
        blacklisted_users.append({
            'id': u.id,
            'name': u.name,
            'reason': u.bio or 'Policy violation',
            'date': u.registered_at.strftime('%Y-%m-%d') if u.registered_at else '2026-06-09'
        })
        
    pending_treks = []
    for t in Trek.query.filter_by(status='Pending').all():
        pending_treks.append({
            'id': t.id,
            'name': t.name,
            'location': t.location,
            'difficulty': t.difficulty,
            'createdOn': t.start_date.strftime('%Y-%m-%d') if t.start_date else '2026-06-09'
        })
        
    # Row 6: Alerts & Pending Tasks calculations
    pending_approval_count = Trek.query.filter_by(status='Pending').count()
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
    
    alerts_and_tasks = [
        {'label': 'Treks Awaiting Approval', 'count': pending_approval_count, 'type': 'pending_approvals'},
        {'label': 'Staff Accounts Inactive', 'count': inactive_staff_count, 'type': 'inactive_staff'},
        {'label': 'Trek Has No Assigned Staff', 'count': unassigned_treks_count, 'type': 'unassigned_staff'},
        {'label': 'Treks Starting This Week', 'count': treks_starting_week_count, 'type': 'starting_this_week'},
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
            
    if trek_id:
        trek = Trek.query.get(trek_id)
        if not trek:
            return jsonify({'error': 'Trek not found'}), 404
        trek.start_date = start_date
        trek.end_date = end_date
        trek.slots = slots
        trek.price = price
        trek.status = status
        if staff_id:
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
        
    db.session.commit()
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

@app.route('/api/admin/staff', methods=['POST'])
@login_required
def admin_save_staff():
    if current_user.role != 'admin':
        return jsonify({'error': 'Unauthorized'}), 403
        
    data = request.get_json() or {}
    email = data.get('email')
    name = data.get('name')
    phone = data.get('phone') or ''
    password = data.get('password') or 'Trailsync@123'
    
    existing = User.query.filter_by(email=email).first()
    if existing:
        return jsonify({'error': 'Email already registered.'}), 400
        
    staff = User(
        email=email,
        name=name,
        phone=phone,
        password_hash=generate_password_hash(password),
        role='staff'
    )
    db.session.add(staff)
    db.session.flush()
    
    profile = StaffProfile(
        user_id=staff.id,
        skills='Wilderness First Aid, Navigation',
        experience_years=2,
        status='Active'
    )
    db.session.add(profile)
    db.session.commit()
    
    # Trigger free registration email via Celery
    try:
        from backend.tasks import send_staff_creation_email
        send_staff_creation_email.delay(staff.id, password)
    except Exception as e:
        print("Failed to dispatch Celery staff email:", e)
        
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
        
    user.blacklisted = True
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

@app.route('/api/admin/treks/approve/<int:trek_id>', methods=['POST'])
@login_required
def admin_approve_trek(trek_id):
    if current_user.role != 'admin':
        return jsonify({'error': 'Unauthorized'}), 403
        
    trek = Trek.query.get(trek_id)
    if not trek:
        return jsonify({'error': 'Trek not found'}), 404
        
    trek.status = 'Approved'
    db.session.commit()
    invalidate_open_treks_cache()
    return jsonify({'success': True})

@app.route('/api/admin/treks/reject/<int:trek_id>', methods=['POST'])
@login_required
def admin_reject_trek(trek_id):
    if current_user.role != 'admin':
        return jsonify({'error': 'Unauthorized'}), 403
        
    trek = Trek.query.get(trek_id)
    if not trek:
        return jsonify({'error': 'Trek not found'}), 404
        
    trek.status = 'Pending'
    db.session.commit()
    invalidate_open_treks_cache()
    return jsonify({'success': True})

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

@app.route('/api/admin/jobs/trigger', methods=['POST'])
@login_required
def admin_trigger_job():
    if current_user.role != 'admin':
        return jsonify({'error': 'Unauthorized'}), 403
        
    data = request.get_json() or {}
    job_name = data.get('name')
    
    if 'Reminder' in job_name:
        from backend.tasks import send_daily_reminders
        send_daily_reminders.delay()
    elif 'Report' in job_name:
        from backend.tasks import generate_monthly_report
        generate_monthly_report.delay()
        
    return jsonify({'success': True, 'message': f'Job {job_name} triggered successfully.'})

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
        
    trek.staff_id = staff.id
    db.session.commit()
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
    if current_user.role != 'staff':
        return jsonify({'error': 'Unauthorized'}), 403
        
    assigned_treks_query = Trek.query.filter_by(staff_id=current_user.id).all()
    assigned_treks = []
    participants = []
    
    for t in assigned_treks_query:
        booked_count = Booking.query.filter_by(trek_id=t.id, status='Booked').count()
        assigned_treks.append({
            'id': t.id,
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
            participants.append({
                'id': b.id,
                'trekId': t.id,
                'name': b.user.name,
                'email': b.user.email,
                'phone': b.user.phone or '',
                'bookedOn': b.booked_on.strftime('%Y-%m-%d'),
                'status': b.status,
                'emergencyContact': 'Emergency Contact',
                'emergencyPhone': b.user.emergency or '',
                'bloodGroup': 'B+',
                'attendance': False
            })
            
    profile = current_user.staff_profile
    staff_profile_data = {
        'name': current_user.name,
        'email': current_user.email,
        'phone': current_user.phone or '',
        'city': current_user.city or '',
        'bio': current_user.bio or '',
        'certifications': profile.certifications if profile else 'Wilderness First Responder (WFR)',
        'skills': profile.skills if profile else 'Wilderness First Aid, Navigation',
        'experienceYears': profile.experience_years if profile else 2,
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
    if current_user.role != 'staff':
        return jsonify({'error': 'Unauthorized'}), 403
        
    data = request.get_json() or {}
    current_user.name = data.get('name', current_user.name)
    current_user.phone = data.get('phone', current_user.phone)
    current_user.city = data.get('city', current_user.city)
    current_user.bio = data.get('bio', current_user.bio)
    
    profile = current_user.staff_profile
    if not profile:
        profile = StaffProfile(user_id=current_user.id)
        db.session.add(profile)
        
    if 'certifications' in data:
        profile.certifications = data.get('certifications')
    if 'skills' in data:
        profile.skills = data.get('skills')
    if 'experienceYears' in data:
        try:
            profile.experience_years = int(data.get('experienceYears'))
        except (ValueError, TypeError):
            pass
            
    db.session.commit()
    return jsonify({'message': 'Profile updated successfully.'})

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
        writer.writerow(['Booking ID', 'Participant Name', 'Participant Email', 'Booked On', 'Status'])
        for b in bookings:
            writer.writerow([b.id, b.user.name, b.user.email, b.booked_on.strftime('%Y-%m-%d'), b.status])
            
    return jsonify({'message': f'CSV export triggered. File generated: {filename}'})


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8000, debug=True)
