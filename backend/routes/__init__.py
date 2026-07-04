"""
Routes Package Initialization Module
====================================
This module initializes the routes package, importing and registering all Flask Blueprints 
to separate route concerns into modular, decoupled files.
"""



def register_blueprints(app):
    """
    Imports and registers all blueprints to the provided Flask application instance.

    Parameters:
        app (Flask): The Flask application instance to register blueprints onto.

    Returns:
        None
    """
    from backend.routes.auth import auth_bp
    from backend.routes.public import public_bp
    from backend.routes.user import user_bp
    from backend.routes.admin import admin_bp
    from backend.routes.staff import staff_bp
    from backend.routes.social import social_bp

    # Register blueprints with appropriate prefixes/settings
    app.register_blueprint(auth_bp)
    app.register_blueprint(public_bp)
    app.register_blueprint(user_bp)
    app.register_blueprint(admin_bp)
    app.register_blueprint(staff_bp)
    app.register_blueprint(social_bp)
