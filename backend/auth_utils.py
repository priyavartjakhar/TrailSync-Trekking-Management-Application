"""
Authentication Utilities Module
==============================
This module handles JSON Web Token (JWT) generation, validation, and route protection decorators
for the Trail Sync application. It leverages Flask's application context dynamically to avoid 
circular dependency issues.
"""

import jwt
from functools import wraps
from datetime import datetime, timedelta
from flask import request, jsonify, redirect, url_for, g, current_app
from werkzeug.local import LocalProxy

from backend.models.models import db, User

# Define a LocalProxy for current_user so it can be accessed dynamically
# throughout the request lifecycle, proxying to Flask's global request object 'g'.
current_user = LocalProxy(lambda: getattr(g, 'current_user', None))


def generate_token(user_id, role):
    """
    Generates a JWT token for a given user ID and role, valid for 24 hours.

    Parameters:
        user_id (int): The ID of the user.
        role (str): The role of the user (e.g., 'user', 'staff', 'admin').

    Returns:
        str: Encoded JWT token.
    """
    secret = current_app.config['SECRET_KEY']
    payload = {
        'user_id': user_id,
        'role': role,
        'exp': datetime.utcnow() + timedelta(days=1)
    }
    return jwt.encode(payload, secret, algorithm='HS256')


def decode_token(token):
    """
    Decodes and validates a JWT token.

    Parameters:
        token (str): The JWT token to decode.

    Returns:
        dict: The decoded payload if the token is valid, otherwise None.
    """
    secret = current_app.config['SECRET_KEY']
    try:
        payload = jwt.decode(token, secret, algorithms=['HS256'])
        return payload
    except jwt.ExpiredSignatureError:
        # Token has expired
        return None
    except jwt.InvalidTokenError:
        # Token is malformed or invalid
        return None


def jwt_required(roles=None):
    """
    Decorator to restrict access to endpoints based on JWT authentication and roles.

    Parameters:
        roles (list, optional): Allowed roles. If None, any authenticated user is allowed.

    Returns:
        function: Decorated route handler.
    """
    def decorator(f):
        @wraps(f)
        def decorated(*args, **kwargs):
            token = None
            
            # 1. Attempt to retrieve token from Authorization Header
            auth_header = request.headers.get('Authorization')
            if auth_header and auth_header.startswith('Bearer '):
                token = auth_header.split(' ')[1]
            
            # 2. Fallback to access_token Cookie if not in headers
            if not token:
                token = request.cookies.get('access_token')
                
            # If no token is provided, reject or redirect
            if not token:
                if request.path.startswith('/api/'):
                    return jsonify({'error': 'Authentication token is missing.'}), 401
                return redirect(url_for('public.serve_spa'))  # Redirect to home/login page
                
            # Decode token payload
            payload = decode_token(token)
            if not payload:
                if request.path.startswith('/api/'):
                    return jsonify({'error': 'Token is invalid or expired.'}), 401
                return redirect(url_for('public.serve_spa'))
                
            # Fetch user from the database
            user = db.session.get(User, payload['user_id'])
            if not user or not user.active or user.blacklisted:
                if request.path.startswith('/api/'):
                    return jsonify({'error': 'User account is inactive or blacklisted.'}), 403
                return redirect(url_for('public.serve_spa'))
                
            # Verify user has the required roles if roles list is specified
            if roles and payload['role'] not in roles:
                if request.path.startswith('/api/'):
                    return jsonify({'error': 'Access denied. Insufficient permissions.'}), 403
                return redirect(url_for('public.serve_spa'))
                
            # Store user in Flask's global context object 'g'
            g.current_user = user
            return f(*args, **kwargs)
        return decorated
    return decorator


def login_required(f):
    """
    Decorator requiring any valid authentication token to access the route.

    Parameters:
        f (function): Route handler to decorate.

    Returns:
        function: Decorated route handler.
    """
    return jwt_required()(f)
