"""
Trail Sync - Trekking Management Application Entrypoint
======================================================
This is the main Flask entrypoint. It initializes configuration parameters,
sets up the SQLAlchemy database, configures Blueprints routing, and runs 
table migrations and seeding processes before starting the app listener.
"""

import os
from flask import Flask
from backend.models.models import db
from backend.routes import register_blueprints
from backend.seeding import run_migrations_and_seeding

# Initialize Flask application instance
app = Flask(__name__, 
            template_folder=os.path.join(os.path.dirname(__file__), '../frontend'),
            static_folder=os.path.join(os.path.dirname(__file__), '../frontend/static'))

# Configure App Parameters
app.config['SECRET_KEY'] = 'trailsync-secret-key-123456'
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

if __name__ == '__main__':
    # Start development listener
    app.run(host='0.0.0.0', port=8000, debug=True)
