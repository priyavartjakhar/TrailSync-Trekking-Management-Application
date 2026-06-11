import unittest
import json
import sys
import os

# Adjust path to import backend
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from backend.app import app, db, seed_db
from backend.models.models import User, StaffProfile, Trek, Booking, TrekGuideItem, BookingChecklistItem
from flask_login import login_user

class TestStaffDashboard(unittest.TestCase):
    def setUp(self):
        app.config['TESTING'] = True
        app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///:memory:'
        app.config['WTF_CSRF_ENABLED'] = False
        
        self.client = app.test_client()
        self.ctx = app.app_context()
        self.ctx.push()
        
        db.session.rollback()
        db.session.close()
        db.create_all()
        seed_db()

    def tearDown(self):
        db.session.rollback()
        db.session.close()
        db.drop_all()
        self.ctx.pop()

    def login_staff(self):
        # We can authenticate by hitting POST /api/auth/login
        payload = {
            'email': 'staff@test.com',
            'password': '123456'
        }
        res = self.client.post('/api/auth/login',
                               data=json.dumps(payload),
                               content_type='application/json')
        self.assertEqual(res.status_code, 200)
        return json.loads(res.data)

    def test_staff_dashboard_data(self):
        self.login_staff()
        
        # Get dashboard data
        res = self.client.get('/api/staff/dashboard_data')
        self.assertEqual(res.status_code, 200)
        data = json.loads(res.data)
        
        self.assertIn('staffName', data)
        self.assertIn('staffProfile', data)
        self.assertIn('assignedTreks', data)
        self.assertIn('participants', data)
        
        profile = data['staffProfile']
        self.assertEqual(profile['email'], 'staff@test.com')
        self.assertEqual(profile['certifications'], 'Wilderness First Responder (WFR), Basic Mountaineering Course (BMC)')

    def test_staff_profile_update(self):
        self.login_staff()
        
        # Update profile
        payload = {
            'name': 'Updated Guide Name',
            'phone': '+91 9999911111',
            'city': 'Dehradun',
            'bio': 'New updated bio information.',
            'certifications': 'BMC, FMC, WFR certified',
            'skills': 'Advanced rescue, GPS Navigation',
            'experienceYears': 5
        }
        res = self.client.post('/api/staff/profile',
                               data=json.dumps(payload),
                               content_type='application/json')
        self.assertEqual(res.status_code, 200)
        
        # Retrieve dashboard data again to verify persistence
        res2 = self.client.get('/api/staff/dashboard_data')
        data2 = json.loads(res2.data)
        profile = data2['staffProfile']
        
        self.assertEqual(profile['name'], 'Updated Guide Name')
        self.assertEqual(profile['phone'], '+91 9999911111')
        self.assertEqual(profile['city'], 'Dehradun')
        self.assertEqual(profile['bio'], 'New updated bio information.')
        self.assertEqual(profile['certifications'], 'BMC, FMC, WFR certified')
        self.assertEqual(profile['skills'], 'Advanced rescue, GPS Navigation')
        self.assertEqual(profile['experienceYears'], 5)

    def test_staff_password_update(self):
        self.login_staff()
        
        # Update password
        payload = {
            'current': '123456',
            'new': 'newpassword123'
        }
        res = self.client.post('/api/staff/password',
                               data=json.dumps(payload),
                               content_type='application/json')
        self.assertEqual(res.status_code, 200)
        
        # Log out by creating a new client to clear session/cookies
        self.client = app.test_client()
        
        payload_login = {
            'email': 'staff@test.com',
            'password': 'newpassword123'
        }
        res_login = self.client.post('/api/auth/login',
                                     data=json.dumps(payload_login),
                                     content_type='application/json')
        self.assertEqual(res_login.status_code, 200)

    def test_checklist_management(self):
        self.login_staff()
        
        # Get one of the treks
        trek = Trek.query.filter_by(staff_id=4).first() # staff@test.com id is typically 4 (admin=1, user=2, staff_ravi=3, staff_test=4)
        self.assertIsNotNone(trek)
        
        # Fetch current guide checklist (should be empty initially or have defaults)
        res = self.client.get(f'/api/guide/treks/{trek.id}/checklist')
        self.assertEqual(res.status_code, 200)
        initial_items = json.loads(res.data)
        
        # Update guide checklist
        payload = {
            'items': ['Waterproof cover', 'Power bank', 'Extra gloves']
        }
        res_update = self.client.post(f'/api/guide/treks/{trek.id}/checklist',
                                      data=json.dumps(payload),
                                      content_type='application/json')
        self.assertEqual(res_update.status_code, 200)
        
        # Fetch again to verify updates
        res_fetch = self.client.get(f'/api/guide/treks/{trek.id}/checklist')
        updated_items = json.loads(res_fetch.data)
        item_names = [item['itemName'] for item in updated_items]
        
        self.assertEqual(len(item_names), 3)
        self.assertIn('Power bank', item_names)
        self.assertIn('Extra gloves', item_names)

if __name__ == '__main__':
    unittest.main()
