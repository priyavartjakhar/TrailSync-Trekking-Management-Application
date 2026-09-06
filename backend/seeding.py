"""
Database Seeding and Migration Module
====================================
This module handles creating database tables, running basic SQLite column-level migrations,
and seeding mock data for Admin, Users, Staff (Guides), Treks, Support Tickets, etc.
"""

import os
import json
import random
from datetime import datetime, date, timedelta
from werkzeug.security import generate_password_hash
from sqlalchemy import text

from backend.models.models import (
    db, User, Trek, Booking, StaffProfile,
    TrekGuideItem, SupportTicket, TrekRoute
)


def seed_db(force=False):
    """
    Drops all tables (if force is True) and recreates them, then populates the database
    with default Admin accounts, test Trekkers, mock guides, mock routes, batches, 
    bookings, and support tickets.

    Parameters:
        force (bool): If True, drops all existing tables and recreates from scratch.

    Returns:
        None
    """
    if force:
        db.session.remove()
        db.drop_all()
    db.create_all()

    # Guard against concurrent worker seeding race conditions
    if User.query.filter_by(email='admin@trailsync.com').first() is not None:
        return

    
    # 1. Seed Admin user
    admin = User(
        email='admin@trailsync.com',
        password_hash=generate_password_hash('admin123'),
        name='Admin',
        role='admin',
        registered_at=datetime(2026, 6, 1, 10, 0, 0)
    )
    db.session.add(admin)
    
    # 2. Seed Test Trekker user
    test_user = User(
        email='test@gmail.com',
        password_hash=generate_password_hash('123456'),
        name='Test Trekker',
        role='user',
        registered_at=datetime(2026, 6, 1, 10, 30, 0)
    )
    db.session.add(test_user)
    
    # 3. Seed Mock staff members (Guides)
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
        
        # Populate guide profile details
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

    # 4. Seed 20 mock trekkers
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

    # 5. Metadata mapping for states
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

    # Custom coordinate mapping for specific named routes
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

    # Map state -> list of mock trek details
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

    # 6. Load Unsplash images for trek cards
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

    # 7. Seed all TrekRoutes
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

    # 8. Seed Trek batches for the first 10 routes
    all_treks = []
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

    # Assign guides to the treks
    for idx, t in enumerate(all_treks):
        staff_member = staff_users[idx % len(staff_users)]
        t.staff_id = staff_member.id
    db.session.flush()
    db.session.commit()

    # 9. Seed guide recommended items for popular treks
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

    # 10. Seed bookings and checklists for trekkers
    if len(trekkers) >= 8 and len(all_treks) >= 3:
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

    # 11. Seed Support Tickets
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
    """
    Adjusts mock payment amounts and statuses randomly to make analytics reports
    look realistic.

    Returns:
        None
    """
    from random import Random

    bookings = Booking.query.all()
    for booking in bookings:
        if booking.status == 'Cancelled':
            booking.paid = False
            booking.payment_status = 'Refunded'
            paid_amt = booking.amount_paid or booking.booking_price or (booking.trek.price if booking.trek else 5000)
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


def run_migrations_and_seeding(app):
    """
    Creates all tables, applies manual SQLite migrations, seeds default data, 
    and normalizes mock bookings.

    Parameters:
        app (Flask): The Flask application instance.

    Returns:
        None
    """
    with app.app_context():
        try:
            db.create_all()
        except Exception:
            db.session.rollback()

        
        # Migration: Add refund_amount column to bookings table if missing
        try:
            db.session.execute(text("SELECT refund_amount FROM bookings LIMIT 1"))
        except Exception:
            db.session.rollback()
            try:
                db.session.execute(text("ALTER TABLE bookings ADD COLUMN refund_amount INTEGER DEFAULT 0"))
                db.session.commit()
                print("Successfully migrated bookings table with refund_amount column.")
            except Exception as e:
                print("Migration (refund_amount) failed:", e)
                db.session.rollback()
                
        # Seed if there are no users (safe against concurrent WSGI worker boot)
        try:
            if User.query.filter_by(email='admin@trailsync.com').first() is None:
                seed_db(force=False)
        except Exception:
            db.session.rollback()

            
        normalize_mock_booking_payments()
        
        # Migration: Add resolution_message column to support_tickets table if missing
        try:
            db.session.execute(text("SELECT resolution_message FROM support_tickets LIMIT 1"))
        except Exception:
            db.session.rollback()
            try:
                db.session.execute(text("ALTER TABLE support_tickets ADD COLUMN resolution_message TEXT"))
                db.session.commit()
                print("Migrated support_tickets with resolution_message column.")
            except Exception as e:
                print("Migration (resolution_message) failed:", e)
                db.session.rollback()
