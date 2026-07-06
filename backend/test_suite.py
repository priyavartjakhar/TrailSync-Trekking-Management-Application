# -*- coding: utf-8 -*-
"""
TMA-V2 Automated Integration Test Suite
========================================
This script performs a complete verification of all API routes, authentication logic, 
database models, booking validations, group chat constraints, support tickets,
Redis caching utils, and Celery background tasks.
It uses an in-memory SQLite database to run clean, isolated tests.
"""

import os
import unittest
import json
import csv
from datetime import datetime, date, timedelta
from werkzeug.security import generate_password_hash

# Set testing environment before importing the app
os.environ['TESTING'] = 'true'

from backend.app import app, db
from backend.models.models import User, TrekRoute, Trek, Booking, StaffProfile, ChatMessage, SupportTicket, TrekGroupSetting
from backend.redis_utils import get_open_treks_cached, invalidate_everything, cache_get, cache_set
from backend.tasks import export_booking_history_csv, generate_monthly_report, send_daily_reminders

class TestTMAV2Suite(unittest.TestCase):
    def setUp(self):
        """Set up Flask test client and empty database."""
        self.app = app
        self.client = self.app.test_client()
        self.ctx = self.app.app_context()
        self.ctx.push()
        
        # Recreate tables in memory
        db.create_all()
        
        # Setup common roles/users for testing
        self.seed_test_users()

    def tearDown(self):
        """Clean up database session and tables."""
        db.session.remove()
        db.drop_all()
        self.ctx.pop()

    def seed_test_users(self):
        """Seeds basic admin, staff, and user accounts for JWT tokens."""
        # 1. Admin
        self.admin = User(
            email='admin@test.com',
            password_hash=generate_password_hash('admin123'),
            name='Test Admin',
            role='admin'
        )
        db.session.add(self.admin)
        
        # 2. Guide (Staff)
        self.staff = User(
            email='guide@test.com',
            password_hash=generate_password_hash('guide123'),
            name='Test Guide',
            role='staff',
            phone='+91 9999999999'
        )
        db.session.add(self.staff)
        db.session.flush()
        
        self.staff_profile = StaffProfile(
            user_id=self.staff.id,
            skills='Navigation, First Aid',
            experience_years=5,
            status='Active'
        )
        db.session.add(self.staff_profile)
        
        # 3. Trekker (User)
        self.trekker = User(
            email='trekker@test.com',
            password_hash=generate_password_hash('trekker123'),
            name='Test Trekker',
            role='user',
            phone='+91 8888888888',
            city='Bangalore'
        )
        db.session.add(self.trekker)
        db.session.commit()

    def get_jwt_token(self, email, password, role):
        """Helper to get JWT auth header and set cookie."""
        res = self.client.post('/api/auth/login', json={
            'email': email,
            'password': password,
            'role': role
        })
        self.assertEqual(res.status_code, 200, f"Login failed for {email}")
        data = json.loads(res.data.decode('utf-8'))
        return data['token'], res.headers.get('Set-Cookie', '')

    # =========================================================================
    # TEST CASE 1: Authentication, Registration & Account Security
    # =========================================================================
    def test_01_authentication_flow(self):
        print("\n▶ [TEST 1] Authentication and Access Controls")
        
        # A. Register new Trekker
        print("  - Testing user self-registration...")
        reg_res = self.client.post('/api/auth/register', json={
            'email': 'new_trekker@test.com',
            'password': 'password123',
            'name': 'New Trekker',
            'phone': '9876543210',
            'city': 'Delhi'
        })
        self.assertEqual(reg_res.status_code, 200)
        reg_data = json.loads(reg_res.data.decode('utf-8'))
        self.assertTrue(reg_data['success'])
        self.assertEqual(reg_data['role'], 'user')
        
        # B. Attempt duplicate registration
        print("  - Checking duplicate email registration validation...")
        dup_res = self.client.post('/api/auth/register', json={
            'email': 'new_trekker@test.com',
            'password': 'password123',
            'name': 'New Trekker'
        })
        self.assertEqual(dup_res.status_code, 400)
        self.assertIn('Email already registered', json.loads(dup_res.data.decode('utf-8'))['error'])
        
        # C. Login validation
        print("  - Testing login role and credential checks...")
        login_res = self.client.post('/api/auth/login', json={
            'email': 'new_trekker@test.com',
            'password': 'wrong_password',
            'role': 'trekker'
        })
        self.assertEqual(login_res.status_code, 400)
        
        # Admin Login
        admin_token, _ = self.get_jwt_token('admin@test.com', 'admin123', 'admin')
        self.assertIsNotNone(admin_token)
        print("    ✔ JWT generation and extraction works successfully.")
        
        # D. Role restriction (Trekker accessing admin route)
        print("  - Testing Role-Based Access Control restrictions...")
        trekker_token, _ = self.get_jwt_token('trekker@test.com', 'trekker123', 'trekker')
        headers = {'Authorization': f'Bearer {trekker_token}'}
        restricted_res = self.client.get('/api/admin/dashboard_data', headers=headers)
        self.assertEqual(restricted_res.status_code, 403)
        print("    ✔ Non-admin user blocked from admin endpoint (403).")

    # =========================================================================
    # TEST CASE 2: Trek Catalog & Admin Management Actions
    # =========================================================================
    def test_02_trek_management(self):
        print("\n▶ [TEST 2] Trek Route and Batch Operations (Admin)")
        admin_token, _ = self.get_jwt_token('admin@test.com', 'admin123', 'admin')
        headers = {'Authorization': f'Bearer {admin_token}'}
        
        # A. Create a Trek Route
        print("  - Admin creates new Trek Route...")
        route_res = self.client.post('/api/admin/trek_routes', headers=headers, json={
            'name': 'Roopkund Lake',
            'location': 'Uttarakhand',
            'place': 'Chamoli',
            'difficulty': 'Hard',
            'duration': 8,
            'distance': 53,
            'description': 'Mysterious skeleton lake trek.'
        })
        self.assertEqual(route_res.status_code, 200)
        route_data = json.loads(route_res.data.decode('utf-8'))
        self.assertTrue(route_data['success'])
        route_id = route_data['route']['id']
        print(f"    ✔ Created Route: {route_data['route']['name']} (ID: {route_id})")
        
        # B. Create a Scheduled Batch for the Route
        print("  - Admin schedules a new Trek Batch...")
        start_date = (date.today() + timedelta(days=15)).strftime('%Y-%m-%d')
        end_date = (date.today() + timedelta(days=23)).strftime('%Y-%m-%d')
        batch_res = self.client.post('/api/admin/treks', headers=headers, json={
            'trekRouteId': route_id,
            'name': 'Roopkund Lake - Spring Batch',
            'startDate': start_date,
            'endDate': end_date,
            'slots': 3,  # small count to test overbooking block later
            'price': 8500,
            'status': 'Open',
            'staff_id': self.staff.id
        })
        self.assertEqual(batch_res.status_code, 200)
        batch_data = json.loads(batch_res.data.decode('utf-8'))
        self.assertTrue(batch_data['success'])
        trek_id = batch_data['trek']['id']
        print(f"    ✔ Created Batch ID: {trek_id} with {batch_data['trek']['slots']} slots.")
        
        # Save values on self for subsequent tests
        self.route_id = route_id
        self.trek_id = trek_id

    # =========================================================================
    # TEST CASE 3: Booking System, Validation Guardrails & Capacity Controls
    # =========================================================================
    def test_03_booking_guards(self):
        print("\n▶ [TEST 3] Booking Safeguards & Constraints")
        
        # First, setup route and batch in DB
        route = TrekRoute(trek_code='TID888', name='Triund', location='HP', difficulty='Easy', duration=2)
        db.session.add(route)
        db.session.flush()
        
        start_date = date.today() + timedelta(days=20)
        end_date = date.today() + timedelta(days=22)
        trek = Trek(
            trek_route_id=route.id,
            name='Triund Trek',
            location='HP',
            start_date=start_date,
            end_date=end_date,
            slots=2, # capacity = 2
            price=3000,
            status='Open',
            staff_id=self.staff.id
        )
        db.session.add(trek)
        
        # Create a second trek that is Closed
        closed_trek = Trek(
            trek_route_id=route.id,
            name='Closed Valley Trek',
            location='HP',
            start_date=start_date,
            end_date=end_date,
            slots=10,
            price=3000,
            status='Closed'
        )
        db.session.add(closed_trek)
        
        # Create a third trek in the past
        past_trek = Trek(
            trek_route_id=route.id,
            name='Past Triund Trek',
            location='HP',
            start_date=date.today() - timedelta(days=10),
            end_date=date.today() - timedelta(days=8),
            slots=10,
            price=3000,
            status='Open'
        )
        db.session.add(past_trek)
        db.session.commit()
        
        # Authenticate trekker
        trekker_token, _ = self.get_jwt_token('trekker@test.com', 'trekker123', 'trekker')
        headers = {'Authorization': f'Bearer {trekker_token}'}
        
        # A. Register another trekker to test overbooking
        tk2 = User(email='tk2@test.com', password_hash=generate_password_hash('pwd'), name='Trekker 2', role='user')
        tk3 = User(email='tk3@test.com', password_hash=generate_password_hash('pwd'), name='Trekker 3', role='user')
        db.session.add_all([tk2, tk3])
        db.session.commit()
        
        tk2_token, _ = self.get_jwt_token('tk2@test.com', 'pwd', 'trekker')
        tk3_token, _ = self.get_jwt_token('tk3@test.com', 'pwd', 'trekker')
        
        # B. Test booking a closed trek
        print("  - Attempting to book a Closed trek...")
        b_closed = self.client.post('/api/bookings/book', headers=headers, json={
            'trek_id': closed_trek.id,
            'payment_method': 'UPI'
        })
        self.assertEqual(b_closed.status_code, 400)
        self.assertIn('Trek is not open', json.loads(b_closed.data.decode('utf-8'))['error'])
        print("    ✔ Correctly blocked booking for Closed treks.")
        
        # C. Test booking a past trek
        print("  - Attempting to book a past trek...")
        b_past = self.client.post('/api/bookings/book', headers=headers, json={
            'trek_id': past_trek.id,
            'payment_method': 'UPI'
        })
        self.assertEqual(b_past.status_code, 400)
        self.assertIn('Trek has already started', json.loads(b_past.data.decode('utf-8'))['error'])
        print("    ✔ Correctly blocked booking for past/started treks.")
        
        # D. Success Booking 1
        print("  - Trekker 1 books the Triund Trek (Slot 1)...")
        b1_res = self.client.post('/api/bookings/book', headers=headers, json={
            'trek_id': trek.id,
            'payment_method': 'UPI'
        })
        self.assertEqual(b1_res.status_code, 200)
        b1_data = json.loads(b1_res.data.decode('utf-8'))
        print(f"    ✔ Booking success! ID: {b1_data['booking_id']}")
        
        # E. Duplicate Booking Prevention
        print("  - Testing duplicate booking block...")
        b1_dup = self.client.post('/api/bookings/book', headers=headers, json={
            'trek_id': trek.id,
            'payment_method': 'UPI'
        })
        self.assertEqual(b1_dup.status_code, 400)
        self.assertIn('already booked this trek', json.loads(b1_dup.data.decode('utf-8'))['error'])
        print("    ✔ Correctly blocked duplicate booking request.")
        
        # F. Success Booking 2
        print("  - Trekker 2 books Triund Trek (Slot 2 - Capacity full)...")
        b2_res = self.client.post('/api/bookings/book', headers={'Authorization': f'Bearer {tk2_token}'}, json={
            'trek_id': trek.id,
            'payment_method': 'Card'
        })
        self.assertEqual(b2_res.status_code, 200)
        
        # G. Booking when slots are full (Overbooking block)
        print("  - Trekker 3 attempts booking when capacity is full...")
        b3_res = self.client.post('/api/bookings/book', headers={'Authorization': f'Bearer {tk3_token}'}, json={
            'trek_id': trek.id,
            'payment_method': 'Netbanking'
        })
        self.assertEqual(b3_res.status_code, 400)
        self.assertIn('Trek is full', json.loads(b3_res.data.decode('utf-8'))['error'])
        print("    ✔ Correctly blocked booking request when slots are full.")

    # =========================================================================
    # TEST CASE 4: Social / Group Chat API & Lock Guardrails
    # =========================================================================
    def test_04_social_chat_flow(self):
        print("\n▶ [TEST 4] Social Group Chat & Lock Safeguards")
        
        # Setup route, batch, and group lock settings
        route = TrekRoute(trek_code='TID777', name='Kashmir Lakes', location='J&K', difficulty='Moderate', duration=6)
        db.session.add(route)
        db.session.flush()
        
        # Set start date to be within 5 days to trigger auto group creation
        trek = Trek(
            trek_route_id=route.id,
            name='Kashmir Lakes Trek',
            location='J&K',
            start_date=date.today() + timedelta(days=3),
            end_date=date.today() + timedelta(days=9),
            slots=10,
            price=12000,
            status='Open',
            staff_id=self.staff.id
        )
        db.session.add(trek)
        db.session.flush()
        
        group_setting = TrekGroupSetting(trek_id=trek.id, is_locked=False)
        db.session.add(group_setting)
        
        # Trekker booking
        booking = Booking(user_id=self.trekker.id, trek_id=trek.id, status='Booked', paid=True)
        db.session.add(booking)
        db.session.commit()
        
        trekker_token, _ = self.get_jwt_token('trekker@test.com', 'trekker123', 'trekker')
        guide_token, _ = self.get_jwt_token('guide@test.com', 'guide123', 'staff')
        
        # A. Trigger auto group creation and view group listing
        print("  - Testing group list retrieval...")
        trekker_headers = {'Authorization': f'Bearer {trekker_token}'}
        guide_headers = {'Authorization': f'Bearer {guide_token}'}
        
        list_res = self.client.get('/api/social/groups', headers=trekker_headers)
        self.assertEqual(list_res.status_code, 200)
        groups = json.loads(list_res.data.decode('utf-8'))
        self.assertTrue(len(groups) > 0)
        print(f"    ✔ Retrieve successfully: {len(groups)} group chat(s) found.")
        
        # B. Trekker sends message when unlocked
        print("  - Trekker sending message to unlocked chat group...")
        msg_res = self.client.post(f'/api/social/group/{trek.id}/messages', headers=trekker_headers, json={
            'messageText': 'Hello fellow trekkers! Excited for the climb.'
        })
        self.assertEqual(msg_res.status_code, 200)
        
        # C. Guide locks group chat
        print("  - Staff Guide locks the group chat...")
        lock_res = self.client.post(f'/api/social/group/{trek.id}/toggle_lock', headers=guide_headers)
        self.assertEqual(lock_res.status_code, 200)
        lock_data = json.loads(lock_res.data.decode('utf-8'))
        self.assertTrue(lock_data['isLocked'])
        print("    ✔ Group chat toggled to Locked.")
        
        # D. Trekker attempts message in locked chat
        print("  - Trekker attempting to send message to LOCKED group...")
        blocked_msg = self.client.post(f'/api/social/group/{trek.id}/messages', headers=trekker_headers, json={
            'messageText': 'Can I message now?'
        })
        self.assertEqual(blocked_msg.status_code, 403)
        self.assertIn('locked by the guide', json.loads(blocked_msg.data.decode('utf-8'))['error'])
        print("    ✔ Correctly rejected trekker message on lock guardrail (403).")
        
        # E. Guide is still allowed to post announcements even when locked
        print("  - Staff Guide broadcasts Announcement on locked chat...")
        ann_res = self.client.post(f'/api/social/group/{trek.id}/messages', headers=guide_headers, json={
            'messageText': 'Important: Pack warm layers, temperature drops to zero.',
            'isAnnouncement': True,
            'announcementTitle': 'Weather Alert'
        })
        self.assertEqual(ann_res.status_code, 200)
        ann_data = json.loads(ann_res.data.decode('utf-8'))
        self.assertTrue(ann_data['isAnnouncement'])
        print("    ✔ Guide successfully bypassed lock to publish announcement.")

    # =========================================================================
    # TEST CASE 5: Support Ticketing System
    # =========================================================================
    def test_05_support_tickets(self):
        print("\n▶ [TEST 5] Support Ticket Lifecycle")
        trekker_token, _ = self.get_jwt_token('trekker@test.com', 'trekker123', 'trekker')
        admin_token, _ = self.get_jwt_token('admin@test.com', 'admin123', 'admin')
        
        trekker_headers = {'Authorization': f'Bearer {trekker_token}'}
        admin_headers = {'Authorization': f'Bearer {admin_token}'}
        
        # A. Trekker files support ticket
        print("  - Trekker filing support ticket for booking refund issue...")
        ticket_res = self.client.post('/api/user/tickets', headers=trekker_headers, json={
            'subject': '[Payment] Refund delay',
            'message': 'My payment failed but amount was debited.'
        })
        self.assertEqual(ticket_res.status_code, 200)
        ticket_data = json.loads(ticket_res.data.decode('utf-8'))
        self.assertTrue(ticket_data['success'])
        ticket_id = ticket_data['ticket']['id']
        print(f"    ✔ Ticket created successfully. ID: {ticket_id}")
        
        # B. Admin resolves support ticket
        print("  - Admin resolving ticket and leaving comments...")
        resolve_res = self.client.post(f'/api/admin/support_tickets/resolve/{ticket_id}', headers=admin_headers, json={
            'resolution_message': 'Refund initiated. Check bank within 3 working days.'
        })
        self.assertEqual(resolve_res.status_code, 200)
        resolved_data = json.loads(resolve_res.data.decode('utf-8'))
        self.assertEqual(resolved_data['ticket']['status'], 'Resolved')
        self.assertEqual(resolved_data['ticket']['resolutionMessage'], 'Refund initiated. Check bank within 3 working days.')
        print("    ✔ Ticket resolved and comment logged successfully.")

    # =========================================================================
    # TEST CASE 6: Redis Caching Utilities Verification
    # =========================================================================
    def test_06_redis_caching(self):
        print("\n▶ [TEST 6] Redis Caching and Invalidation")
        
        # Standard Set & Get test
        print("  - Writing value to Redis Cache (key: test_cache)...")
        cache_set("test_cache", {"test_key": "test_val"}, ttl=30)
        val = cache_get("test_cache")
        if val:
            self.assertEqual(val["test_key"], "test_val")
            print("    ✔ Redis read/write cache operations verified.")
        else:
            print("    ℹ Redis offline/unavailable on localhost. Caching utility gracefully skipped.")
        
        # Test get_open_treks_cached fallback to DB
        print("  - Verifying open treks listing caching utilities...")
        routes = get_open_treks_cached()
        self.assertIsNotNone(routes)
        print("    ✔ Cache retrieval & DB fallback works correctly.")

    # =========================================================================
    # TEST CASE 7: Celery Background Job Workers (Synchronous simulation)
    # =========================================================================
    def test_07_celery_background_jobs(self):
        print("\n▶ [TEST 7] Celery Background Batch Tasks")
        
        # Setup route & batch & booking for jobs to parse
        route = TrekRoute(trek_code='TID100', name='Valley of Flowers', location='Uttarakhand', difficulty='Moderate', duration=5)
        db.session.add(route)
        db.session.flush()
        
        trek = Trek(
            trek_route_id=route.id,
            name='Valley of Flowers Batch',
            location='Uttarakhand',
            start_date=date.today() + timedelta(days=2), # starting in 2 days (countdown trigger)
            end_date=date.today() + timedelta(days=7),
            slots=15,
            price=6000,
            status='Open',
            staff_id=self.staff.id
        )
        db.session.add(trek)
        db.session.flush()
        
        booking = Booking(
            user_id=self.trekker.id,
            trek_id=trek.id,
            booked_on=date.today() - timedelta(days=2),
            status='Booked',
            paid=True,
            booking_price=6000,
            amount_paid=6000,
            payment_status='Paid'
        )
        db.session.add(booking)
        db.session.commit()
        
        # A. CSV Export Job (export_booking_history_csv)
        print("  - Executing export_booking_history_csv task...")
        # Run synchronously to check file output
        res_csv = export_booking_history_csv(self.trekker.id, 'trekker@test.com')
        self.assertIn("Exported CSV", res_csv)
        
        # Verify CSV generated
        email_dir = os.path.join(os.path.dirname(__file__), '../scratch/emails')
        files = os.listdir(email_dir)
        csv_files = [f for f in files if f.startswith(f"booking_history_user_{self.trekker.id}") and f.endswith(".csv")]
        self.assertTrue(len(csv_files) > 0)
        csv_filepath = os.path.join(email_dir, csv_files[0])
        
        # Read CSV headers
        with open(csv_filepath, 'r') as csvfile:
            reader = csv.reader(csvfile)
            headers = next(reader)
            self.assertEqual(headers, ['User ID', 'Trek Name', 'Location', 'Booking Status', 'Dates'])
        print(f"    ✔ Asynchronous CSV Export compiled and verified: {csv_files[0]}")
        
        # B. Monthly Report PDF Generation Job (generate_monthly_report)
        print("  - Executing generate_monthly_report task...")
        # Add a completed trek to ensure report metrics are evaluated
        trek.status = 'Completed'
        db.session.commit()
        
        res_report = generate_monthly_report(is_manual=True)
        self.assertIn("Generated monthly report", res_report)
        
        # Verify PDF and HTML generation
        report_dir = os.path.join(os.path.dirname(__file__), '../scratch/reports')
        reports = os.listdir(report_dir)
        pdf_reports = [f for f in reports if f.startswith("monthly_report_") and f.endswith(".pdf")]
        self.assertTrue(len(pdf_reports) > 0)
        print(f"    ✔ HTML to PDF compilation verified: {pdf_reports[0]}")
        
        # C. Daily Prep Reminders (send_daily_reminders)
        print("  - Executing send_daily_reminders task...")
        # Revert status to open and start date to +2 days to trigger reminders
        trek.status = 'Open'
        db.session.commit()
        res_reminders = send_daily_reminders(is_manual=True)
        self.assertIn("Dispatched", res_reminders)
        
        # Check SMS logs
        sms_log_path = os.path.join(os.path.dirname(__file__), '../scratch/emails/sms_log.txt')
        self.assertTrue(os.path.exists(sms_log_path))
        with open(sms_log_path, 'r') as f_sms:
            sms_content = f_sms.read()
            self.assertIn("only 2 days left", sms_content)
        print("    ✔ Countdowns countdown alerts and SMS logs written successfully.")

if __name__ == '__main__':
    unittest.main()
