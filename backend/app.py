"""
Trail Sync - Trekking Management Application Entrypoint
======================================================
This is the main Flask entrypoint. It initializes configuration parameters,
sets up the SQLAlchemy database, configures Blueprints routing, and runs 
table migrations and seeding processes before starting the app listener.
"""

import os
from flask import Flask, send_from_directory
from backend.models.models import db
from backend.routes import register_blueprints
from backend.seeding import run_migrations_and_seeding
from backend import redis_utils

# Determine frontend static dist directory path
DIST_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '../frontend/dist'))

# Initialize Flask application instance
app = Flask(__name__, 
            template_folder=DIST_DIR if os.path.exists(DIST_DIR) else os.path.join(os.path.dirname(__file__), '../frontend'),
            static_folder=os.path.join(DIST_DIR, 'assets') if os.path.exists(DIST_DIR) else os.path.join(os.path.dirname(__file__), '../frontend/static'))

# Configure App Parameters
app.config['SECRET_KEY'] = os.environ.get(
    'SECRET_KEY',
    'trailsync-dev-secret-key-2026-change-me-local-only'
)
if os.environ.get('TESTING') == 'true':
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///:memory:'
else:
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///' + os.path.join(os.path.dirname(__file__), 'tma.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Bind database instance
db.init_app(app)

# Register application routes via Blueprints
register_blueprints(app)

# Perform database setup, seeding and migration checks
run_migrations_and_seeding(app)

# Serve production frontend dist files & SPA routing fallback
@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve_frontend(path):
    if path != "" and os.path.exists(os.path.join(DIST_DIR, path)):
        return send_from_directory(DIST_DIR, path)
    elif path.startswith("api/"):
        return {"error": "Endpoint not found"}, 404
    else:
        if os.path.exists(os.path.join(DIST_DIR, 'index.html')):
            return send_from_directory(DIST_DIR, 'index.html')
        return "TrailSync API is running!"

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 8000))
    debug = os.environ.get('FLASK_DEBUG', 'false').lower() == 'true'
    app.run(host='0.0.0.0', port=port, debug=debug)

