import unittest
import json
import sys
import os

# Adjust path to import backend
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from backend.app import app, db, seed_db
from backend.models.models import User, Trek, Booking

class TestAdminDashboard(unittest.TestCase):
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

    def login_admin(self):
        payload = {
            'email': 'admin@trailsync.com',
            'password': 'admin123'
        }
        res = self.client.post('/api/auth/login',
                               data=json.dumps(payload),
                               content_type='application/json')
        self.assertEqual(res.status_code, 200)

    def test_admin_dashboard_data(self):
        self.login_admin()
        
        res = self.client.get('/api/admin/dashboard_data')
        self.assertEqual(res.status_code, 200)
        data = json.loads(res.data)
        
        # Verify presence of expected dashboard data keys
        expected_keys = [
            'stats', 'trekStatusOverview', 'alerts', 'recentBookings', 
            'treks', 'staffList', 'users', 'allBookings', 'popularTreks',
            'slotUtilization', 'upcomingTreks', 'activityFeed', 'auditLogs',
            'notifications', 'scheduledJobs', 'systemHealth', 'monthlyBookings',
            'difficultyDist', 'userGrowth', 'revenueData', 'blacklistedUsers', 'pendingTreks'
        ]
        for key in expected_keys:
            self.assertIn(key, data, f"Key '{key}' is missing from dashboard data")
            
        # Verify some content structure
        self.assertEqual(data['systemHealth']['database']['status'], 'Online')
        self.assertTrue(len(data['stats']) > 0)

    def test_trek_approvals_and_rejections(self):
        self.login_admin()
        
        # Modify a trek to status='Pending' since none are seeded pending
        trek = Trek.query.first()
        self.assertIsNotNone(trek)
        trek.status = 'Pending'
        db.session.commit()
        
        # Approve trek
        res = self.client.post(f'/api/admin/treks/approve/{trek.id}')
        self.assertEqual(res.status_code, 200)
        
        # Verify approved status in database
        self.assertEqual(Trek.query.get(trek.id).status, 'Approved')
        
        # Reject (set back to pending)
        res_reject = self.client.post(f'/api/admin/treks/reject/{trek.id}')
        self.assertEqual(res_reject.status_code, 200)
        self.assertEqual(Trek.query.get(trek.id).status, 'Pending')

    def test_user_blacklist_and_restore(self):
        self.login_admin()
        
        # Find a regular user
        user = User.query.filter_by(role='user').first()
        self.assertIsNotNone(user)
        
        # Blacklist user
        res = self.client.post(f'/api/admin/users/blacklist/{user.id}')
        self.assertEqual(res.status_code, 200)
        self.assertTrue(User.query.get(user.id).blacklisted)
        
        # Restore user
        res_restore = self.client.post(f'/api/admin/users/restore/{user.id}')
        self.assertEqual(res_restore.status_code, 200)
        self.assertFalse(User.query.get(user.id).blacklisted)

    def test_admin_cancel_booking(self):
        self.login_admin()
        
        # Create a booking since none are seeded by default
        user = User.query.filter_by(role='user').first()
        trek = Trek.query.first()
        self.assertIsNotNone(user)
        self.assertIsNotNone(trek)
        
        booking = Booking(user_id=user.id, trek_id=trek.id, status='Booked')
        db.session.add(booking)
        db.session.commit()
        
        # Cancel booking
        res = self.client.post(f'/api/admin/bookings/cancel/{booking.id}')
        self.assertEqual(res.status_code, 200)
        self.assertEqual(Booking.query.get(booking.id).status, 'Cancelled')

    def test_admin_jobs_and_export(self):
        self.login_admin()
        
        # Trigger job
        payload_job = {'name': 'Daily Reminder Emails'}
        res_job = self.client.post('/api/admin/jobs/trigger',
                                    data=json.dumps(payload_job),
                                    content_type='application/json')
        self.assertEqual(res_job.status_code, 200)
        
        # Export database
        payload_export = {'type': 'users'}
        res_export = self.client.post('/api/admin/export',
                                       data=json.dumps(payload_export),
                                       content_type='application/json')
        self.assertEqual(res_export.status_code, 200)
        
        # Check that file was created in scratch/
        scratch_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '../scratch'))
        files = os.listdir(scratch_dir)
        export_files = [f for f in files if f.startswith('export_users_') and f.endswith('.json')]
        self.assertTrue(len(export_files) > 0, "Export file was not created in scratch/")
        
        # Clean up exported files
        for f in export_files:
            os.remove(os.path.join(scratch_dir, f))

if __name__ == '__main__':
    unittest.main()
