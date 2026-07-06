"""
Authentication Routes Module
===========================
This module defines the authentication Blueprint and handlers for user registration,
login, logout, and checking registration availability of email/phone.
"""

import os
import time
from flask import Blueprint, request, jsonify, make_response, current_app
from werkzeug.security import generate_password_hash, check_password_hash
from werkzeug.utils import secure_filename

from backend.models.models import db, User
from backend.auth_utils import generate_token

# Instantiate the authentication Blueprint
auth_bp = Blueprint('auth', __name__)


@auth_bp.route('/api/auth/login', methods=['POST'])
def api_login():
    """
    Handles user login by validating user credentials and setting a JWT cookie.

    Request Body (JSON):
        email (str): User's email.
        password (str): User's plain-text password.

    Returns:
        JSON response with success status, user role, token, and redirect URL.
    """
    data = request.get_json() or {}
    email = data.get('email')
    password = data.get('password')
    expected_role = data.get('role')
    
    user = User.query.filter_by(email=email).first()
    if not user or not check_password_hash(user.password_hash, password):
        return jsonify({'error': 'Invalid email or password.'}), 400
        
    if expected_role:
        normalized_expected = 'user' if expected_role == 'trekker' else expected_role
        if user.role != normalized_expected:
            return jsonify({'error': 'Invalid email or password.'}), 400
        
    if user.blacklisted:
        return jsonify({'error': 'This account is blacklisted.'}), 403
        
    if not user.active:
        return jsonify({'error': 'This account is inactive.'}), 403
        
    # Generate token using dynamically-loaded SECRET_KEY
    token = generate_token(user.id, user.role)
    response = make_response(jsonify({
        'success': True,
        'role': user.role,
        'redirect': '/' + user.role if user.role != 'user' else '/dashboard',
        'token': token
    }))
    
    # Set httponly secure-ish cookie
    response.set_cookie('access_token', token, httponly=True, max_age=86400, samesite='Lax')
    return response


@auth_bp.route('/api/auth/check-availability', methods=['GET'])
def api_check_availability():
    """
    Checks if a given email or phone number is already registered in the system.

    Query Parameters:
        email (str): The email address to check.
        phone (str): The phone number to check.

    Returns:
        JSON response indicating availability of input fields.
    """
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


@auth_bp.route('/api/auth/register', methods=['POST'])
def api_register():
    """
    Registers a new trekker (user), handles profile image uploading, 
    and sends a welcome email asynchronously.

    Request (multipart/form-data or JSON):
        Required fields: email, name, password.
        Optional fields: phone, city, emergency, bio, dob, blood_group, 
        medical_info, fitness_level, treks_done, preferred_difficulty, etc.
        Optional file: profile_image.

    Returns:
        JSON response on success and log token cookie.
    """
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
        
    # Handle Profile Image Upload
    profile_image_url = None
    if 'profile_image' in request.files:
        file = request.files['profile_image']
        if file and file.filename != '':
            filename = secure_filename(f"{int(time.time())}_{file.filename}")
            upload_dir = os.path.join(current_app.root_path, '..', 'frontend', 'static', 'uploads', 'profiles')
            os.makedirs(upload_dir, exist_ok=True)
            file.save(os.path.join(upload_dir, filename))
            profile_image_url = f"/static/uploads/profiles/{filename}"
            
    try:
        treks_done_val = int(data.get('treks_done', 0) or 0)
    except ValueError:
        treks_done_val = 0
        
    # Create trekker User
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
    
    # Send welcome email asynchronously via Celery
    try:
        from backend.tasks import send_welcome_email
        send_welcome_email.delay(user.id)
    except Exception as e:
        current_app.logger.error(f"Error dispatching welcome email task: {e}")
        
    token = generate_token(user.id, user.role)
    response = make_response(jsonify({
        'success': True,
        'role': user.role,
        'redirect': '/dashboard',
        'token': token
    }))
    response.set_cookie('access_token', token, httponly=True, max_age=86400, samesite='Lax')
    return response


@auth_bp.route('/api/auth/logout', methods=['POST'])
def api_logout():
    """
    Logs out the browser session by deleting its access token cookie.
    This endpoint is intentionally idempotent so stale tabs and expired tokens
    can still clear their browser session without producing noisy 401/403 logs.

    Returns:
        JSON response indicating logout success.
    """
    response = make_response(jsonify({'success': True}))
    response.delete_cookie('access_token')
    return response
