import unittest
import json
import sys
import os

# Adjust path to import backend
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from backend.app import app, db
from backend.models.models import User

class TestAuthAndRegistration(unittest.TestCase):
    def setUp(self):
        # Configure app for testing
        app.config['TESTING'] = True
        app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///:memory:'
        app.config['WTF_CSRF_ENABLED'] = False
        
        self.client = app.test_client()
        self.ctx = app.app_context()
        self.ctx.push()
        
        db.create_all()

    def tearDown(self):
        db.session.remove()
        db.drop_all()
        self.ctx.pop()

    def test_pages_render(self):
        # Test GET /login renders login page directly
        response = self.client.get('/login')
        self.assertEqual(response.status_code, 200)
        self.assertIn(b'Sign In', response.data)
        
        # Test GET /login/admin renders login page directly
        response_admin = self.client.get('/login/admin')
        self.assertEqual(response_admin.status_code, 200)
        self.assertIn(b'Sign In', response_admin.data)
        
        # Test GET /register
        response_register = self.client.get('/register')
        self.assertEqual(response_register.status_code, 200)
        self.assertIn(b'Create your account', response_register.data)

    def test_api_registration_saves_advanced_fields(self):
        # Test POST /api/auth/register
        payload = {
            'email': 'trekker_test@trailsync.com',
            'name': 'Test Trekker',
            'phone': '+91 99999 88888',
            'password': 'securepassword123',
            'city': 'Manali, Himachal Pradesh',
            'emergency': 'Family Member (+91 99999 77777)',
            'bio': 'Fitness: beginner | Blood: O+ | DOB: 1998-05-15 | Medical: Asthma | Treks done: 2 | Difficulty pref: moderate | Duration pref: medium | Regions: Himachal Pradesh | Bio: Excited to climb!'
        }
        
        response = self.client.post('/api/auth/register',
                                    data=json.dumps(payload),
                                    content_type='application/json')
        
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.assertTrue(data['success'])
        self.assertEqual(data['role'], 'user')
        self.assertEqual(data['redirect'], '/dashboard')
        self.assertIn('token', data)
        
        # Check database record
        user = User.query.filter_by(email='trekker_test@trailsync.com').first()
        self.assertIsNotNone(user)
        self.assertEqual(user.name, 'Test Trekker')
        self.assertEqual(user.phone, '+91 99999 88888')
        self.assertEqual(user.city, 'Manali, Himachal Pradesh')
        self.assertEqual(user.emergency, 'Family Member (+91 99999 77777)')
        self.assertEqual(user.bio, payload['bio'])

if __name__ == '__main__':
    unittest.main()
