import os
import jwt
from functools import wraps
from flask import Flask, render_template, request, jsonify, redirect, url_for, make_response, g
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime, date, timedelta
import redis
import json

from backend.models.models import db, User, Trek, Booking, StaffProfile, BookingChecklistItem, TrekGuideItem

app = Flask(__name__, 
            template_folder=os.path.join(os.path.dirname(__file__), '../frontend'),
            static_folder=os.path.join(os.path.dirname(__file__), '../frontend/static'))
app.config['SECRET_KEY'] = 'trailsync-secret-key-123456'
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
            
    # Fallback to database query
    open_treks = Trek.query.filter_by(status='Open').all()
    treks_json = [t.to_json() for t in open_treks]
    
    if redis_client:
        try:
            redis_client.setex('open_treks', 300, json.dumps(treks_json))
        except Exception as e:
            print("Redis set cache error:", e)
            
    return treks_json

def invalidate_open_treks_cache():
    if redis_client:
        try:
            redis_client.delete('open_treks')
        except Exception as e:
            print("Redis delete cache error:", e)

def seed_db():
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
    
    # Seed Staff
    staff1 = User(
        email='ravi@trailsync.com',
        password_hash=generate_password_hash('staff123'),
        name='Ravi Kumar',
        role='staff',
        phone='9876543210'
    )
    staff2 = User(
        email='priya@trailsync.com',
        password_hash=generate_password_hash('staff123'),
        name='Priya Singh',
        role='staff',
        phone='9876543211'
    )
    staff3 = User(
        email='amit@trailsync.com',
        password_hash=generate_password_hash('staff123'),
        name='Amit Verma',
        role='staff',
        phone='9876543212'
    )
    test_staff = User(
        email='staff@test.com',
        password_hash=generate_password_hash('123456'),
        name='Test Staff',
        role='staff',
        phone='9876543219'
    )
    db.session.add_all([staff1, staff2, staff3, test_staff])
    db.session.commit()
    
    # Seed Staff Profiles
    p1 = StaffProfile(
        user_id=staff1.id, 
        skills='High Altitude Trekking, Navigation', 
        experience_years=6, 
        status='Active',
        designation='Lead Guide',
        certifications='Wilderness First Responder (WFR), Basic Mountaineering Course (BMC)',
        languages='English, Hindi, Pahari',
        completed_treks_count=45,
        photo_url='https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&h=300&fit=crop'
    )
    p2 = StaffProfile(
        user_id=staff2.id, 
        skills='Wilderness First Aid, Search & Rescue', 
        experience_years=4, 
        status='Active',
        designation='Assistant Guide',
        certifications='Advanced Mountaineering Course (AMC), Wilderness First Aid',
        languages='English, Hindi, Punjabi',
        completed_treks_count=28,
        photo_url='https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300&h=300&fit=crop'
    )
    p3 = StaffProfile(
        user_id=staff3.id, 
        skills='Acclimatization Training, Camp Management', 
        experience_years=5, 
        status='Active',
        designation='Lead Guide',
        certifications='Basic Mountaineering Course (BMC), Search & Rescue Certified',
        languages='English, Hindi, Garhwali',
        completed_treks_count=32,
        photo_url='https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=300&fit=crop'
    )
    p_test = StaffProfile(
        user_id=test_staff.id,
        skills='High Altitude Trekking, Wilderness Medicine, Camp Management',
        experience_years=8,
        status='Active',
        designation='Lead Guide',
        certifications='Wilderness First Responder (WFR), Basic Mountaineering Course (BMC)',
        languages='English, Hindi, Nepali',
        completed_treks_count=52,
        photo_url='https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=300&h=300&fit=crop'
    )
    db.session.add_all([p1, p2, p3, p_test])
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

    import random
    staff_ids = [staff1.id, staff2.id, staff3.id, test_staff.id]
    
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
    
    i = 0
    for state, treks in trek_map_data.items():
        for t in treks:
            name = t["n"]
            diff = t["diff"]
            dur = t["dur"]
            
            start_offset = (i * 2) % 60
            start_date = date.today() + timedelta(days=5 + start_offset)
            end_date = start_date + timedelta(days=dur)
            
            if diff == 'Easy':
                price = 2500 + dur * 800
            elif diff == 'Moderate':
                price = 4500 + dur * 1000
            else:
                price = 6500 + dur * 1300
                
            status = 'Closed' if (i % 6 == 0) else 'Open'
            staff_id = staff_ids[i % len(staff_ids)] # Guide assigned to EVERY trek
            
            image_url = unsplash_images[i % len(unsplash_images)]
            
            # Determine location, coordinates, and distance
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
                dist = max(5, dur * 8 + (i % 7)) # Auto distance
            
            desc = f"Explore the natural trails, panoramic peaks, and lush wilderness of {name}."
            trek = Trek(
                name=name,
                location=loc,
                difficulty=diff,
                duration=dur,
                start_date=start_date,
                end_date=end_date,
                slots=20,
                price=price,
                status=status,
                image_url=image_url,
                description=desc,
                latitude=lat,
                longitude=lon,
                distance=dist,
                staff_id=staff_id
            )
            db.session.add(trek)
            i += 1
            
    db.session.commit()

    # Seed guide recommended items for popular treks
    for trek_name in ["Valley of Flowers", "Hampta Pass", "Kedarkantha Trek"]:
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
    data = request.get_json() or {}
    email = data.get('email')
    name = data.get('name')
    phone = data.get('phone')
    password = data.get('password')
    
    if not email or not name or not password:
        return jsonify({'error': 'Please fill all required fields.'}), 400
        
    existing = User.query.filter_by(email=email).first()
    if existing:
        return jsonify({'error': 'Email already registered.'}), 400
        
    user = User(
        email=email,
        name=name,
        phone=phone,
        password_hash=generate_password_hash(password),
        role='user',
        city=data.get('city'),
        emergency=data.get('emergency'),
        bio=data.get('bio')
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
    
    profile = {
        'name': current_user.name,
        'email': current_user.email,
        'phone': current_user.phone or '',
        'city': current_user.city or '',
        'emergency': current_user.emergency or '',
        'bio': current_user.bio or ''
    }
    
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
    data = request.get_json() or {}
    current_user.name = data.get('name', current_user.name)
    current_user.phone = data.get('phone', current_user.phone)
    current_user.city = data.get('city', current_user.city)
    current_user.emergency = data.get('emergency', current_user.emergency)
    current_user.bio = data.get('bio', current_user.bio)
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

# ── ADMIN API ────────────────────────────────────────────────

@app.route('/api/admin/dashboard_data', methods=['GET'])
@login_required
def admin_dashboard_data():
    if current_user.role != 'admin':
        return jsonify({'error': 'Unauthorized'}), 403
        
    total_treks = Trek.query.count()
    active_staff = User.query.filter_by(role='staff', active=True).count()
    registered_users = User.query.filter_by(role='user').count()
    total_bookings = Booking.query.count()
    open_treks = Trek.query.filter_by(status='Open').count()
    
    stats = [
        {'label': 'Total Treks', 'value': total_treks},
        {'label': 'Active Staff', 'value': active_staff},
        {'label': 'Registered Users', 'value': registered_users},
        {'label': 'Total Bookings', 'value': total_bookings},
        {'label': 'Open Treks', 'value': open_treks}
    ]
    
    pending_treks = Trek.query.filter_by(status='Pending').count()
    completed_treks = Trek.query.filter_by(status='Completed').count()
    closed_treks = Trek.query.filter_by(status='Closed').count()
    
    trek_status_overview = [
        {'label': 'Open', 'count': open_treks, 'pct': int((open_treks/total_treks*100) if total_treks else 0), 'color': '#4ade80'},
        {'label': 'Pending', 'count': pending_treks, 'pct': int((pending_treks/total_treks*100) if total_treks else 0), 'color': '#fbbf24'},
        {'label': 'Completed', 'count': completed_treks, 'pct': int((completed_treks/total_treks*100) if total_treks else 0), 'color': '#a8c5a0'},
        {'label': 'Closed', 'count': closed_treks, 'pct': int((closed_treks/total_treks*100) if total_treks else 0), 'color': '#ef4444'}
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
        staff_data.append({
            'id': s.id,
            'name': s.name,
            'contact': s.email,
            'treks': [t.name for t in assigned],
            'active': s.active
        })
        
    users = []
    for u in User.query.filter_by(role='user').all():
        ucnt = Booking.query.filter_by(user_id=u.id).count()
        users.append({
            'id': u.id,
            'name': u.name,
            'email': u.email,
            'registered': u.registered_at.strftime('%Y-%m-%d'),
            'bookings': ucnt,
            'blacklisted': u.blacklisted
        })
        
    all_bookings = []
    for b in Booking.query.all():
        all_bookings.append({
            'id': b.id,
            'user': b.user.name,
            'trek': b.trek.name,
            'date': b.booked_on.strftime('%Y-%m-%d'),
            'status': b.status,
            'paid': b.paid
        })
        
    popular_treks = []
    for t in Trek.query.all():
        bcnt = Booking.query.filter_by(trek_id=t.id, status='Booked').count()
        popular_treks.append({
            'name': t.name,
            'bookings': bcnt
        })
    popular_treks.sort(key=lambda x: x['bookings'], reverse=True)
    
    return jsonify({
        'stats': stats,
        'trekStatusOverview': trek_status_overview,
        'alerts': alerts,
        'recentBookings': recent_bookings[:5],
        'treks': treks,
        'staffList': staff_data,
        'users': users,
        'allBookings': all_bookings,
        'popularTreks': popular_treks[:5]
    })

@app.route('/api/admin/treks', methods=['POST'])
@login_required
def admin_save_trek():
    if current_user.role != 'admin':
        return jsonify({'error': 'Unauthorized'}), 403
        
    data = request.get_json() or {}
    trek_id = data.get('id')
    
    name = data.get('name')
    location = data.get('location')
    difficulty = data.get('difficulty')
    start_date_str = data.get('startDate')
    end_date_str = data.get('endDate')
    slots = data.get('slots')
    price = data.get('price', 5000)
    status = data.get('status', 'Open')
    description = data.get('description')
    
    # Load unique Unsplash images for fallback
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
        
    import random
    image_url = data.get('imageUrl') or random.choice(unsplash_images)
    
    start_date = datetime.strptime(start_date_str, '%Y-%m-%d').date() if start_date_str else date.today()
    end_date = datetime.strptime(end_date_str, '%Y-%m-%d').date() if end_date_str else date.today()
    
    dur = (end_date - start_date).days
    if not description:
        description = f"An exciting {difficulty.lower()} {dur}-day trek exploring the scenic beauty of {name} in {location}."
        
    if trek_id:
        trek = Trek.query.get(trek_id)
        if not trek:
            return jsonify({'error': 'Trek not found'}), 404
        trek.name = name
        trek.location = location
        trek.difficulty = difficulty
        trek.start_date = start_date
        trek.end_date = end_date
        trek.slots = slots
        trek.price = price
        trek.status = status
        trek.image_url = image_url
        trek.description = description
    else:
        trek = Trek(
            name=name,
            location=location,
            difficulty=difficulty,
            duration=dur,
            start_date=start_date,
            end_date=end_date,
            slots=slots,
            price=price,
            status=status,
            image_url=image_url,
            description=description
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
    phone = data.get('phone')
    password = data.get('password')
    
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
def admin_toggle_blacklist(user_id):
    if current_user.role != 'admin':
        return jsonify({'error': 'Unauthorized'}), 403
        
    user = User.query.get(user_id)
    if not user or user.role != 'user':
        return jsonify({'error': 'User not found'}), 404
        
    user.blacklisted = not user.blacklisted
    db.session.commit()
    return jsonify({'success': True, 'blacklisted': user.blacklisted})

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
