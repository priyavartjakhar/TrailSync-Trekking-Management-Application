"""
Public and SPA Routes Module
============================
This module defines the public Blueprint, exposing public trek routes and details, 
as well as the SPA catch-all handler that serves the Vite/HTML frontend static files.
"""

import os
from flask import Blueprint, jsonify, send_from_directory

from backend.redis_utils import get_public_treks_cached, get_public_routes_cached

# Instantiate the public Blueprint
public_bp = Blueprint('public', __name__)

# Define absolute path to the frontend directory relative to this file
FRONTEND_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', 'frontend'))


@public_bp.route('/api/public/treks', methods=['GET'])
def get_public_treks():
    """
    Retrieves all treks available in the system for public view.
    Served from Redis cache (key: 'public_treks', TTL: 300s).
    Falls back to DB on cache miss and repopulates the cache.

    Returns:
        JSON list of serialized Trek records.
    """
    return jsonify(get_public_treks_cached())


@public_bp.route('/api/public/trek_routes', methods=['GET'])
def get_public_trek_routes():
    """
    Retrieves all trek routes in the system for public view.
    Served from Redis cache (key: 'public_trek_routes', TTL: 600s).
    Falls back to DB on cache miss and repopulates the cache.

    Returns:
        JSON list of serialized TrekRoute records.
    """
    return jsonify(get_public_routes_cached())


@public_bp.route('/manifest.webmanifest')
def serve_manifest():
    """Serves the PWA manifest when the Flask server handles the SPA directly."""
    return send_from_directory(os.path.join(FRONTEND_DIR, 'public'), 'manifest.webmanifest')


@public_bp.route('/service-worker.js')
def serve_service_worker():
    """Serves the PWA service worker from the same origin as the app."""
    return send_from_directory(os.path.join(FRONTEND_DIR, 'public'), 'service-worker.js')


@public_bp.route('/', defaults={'path': ''})
@public_bp.route('/<path:path>')
def serve_spa(path):
    """
    Serves the SPA (Single Page Application) frontend index.html for all non-API 
    and non-static paths.

    Parameters:
        path (str): The route path requested by the client.

    Returns:
        The index.html file or a 404 JSON response for missing static/api resources.
    """
    if path.startswith('api/') or path.startswith('static/'):
        return jsonify({'error': 'Not found'}), 404
    return send_from_directory(FRONTEND_DIR, 'index.html')
