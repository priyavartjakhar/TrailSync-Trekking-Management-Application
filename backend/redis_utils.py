# -*- coding: utf-8 -*-
"""
Redis Caching Utilities
=======================

This module centralises all interactions with the Redis cache used by the
TrailSync application. It provides thin wrappers for getting, setting and
deleting JSON‑serialised values, as well as higher‑level helpers for the
specific cache keys required by the front‑end dashboards.

It provides functions for setting/getting cached responses, invalidating
outdated keys on updates, and managing dashboard-specific cache entries.
"""

import redis
import json
from datetime import date

from backend.models.models import db, TrekRoute, Trek
from sqlalchemy import event

# ---------------------------------------------------------------------------
# TTL Constants (seconds) – adjust here to tune cache expiry.
# ---------------------------------------------------------------------------
TTL_OPEN_TREKS = 300          # 5 minutes – open treks for user dashboard
TTL_PUBLIC_TREKS = 300        # 5 minutes – public trek listings
TTL_PUBLIC_ROUTES = 600       # 10 minutes – public route catalogue (rarely changes)
TTL_ADMIN_DASHBOARD = 120     # 2 minutes – admin dashboard (live data)
TTL_STAFF_DASHBOARD = 120     # 2 minutes – per‑guide dashboard

# ---------------------------------------------------------------------------
# Cache key constants
# ---------------------------------------------------------------------------
KEY_OPEN_TREKS = 'open_treks'
KEY_PUBLIC_TREKS = 'public_treks'
KEY_PUBLIC_ROUTES = 'public_trek_routes'
KEY_ADMIN_DASHBOARD = 'admin_dashboard'

def staff_dashboard_key(staff_id: int) -> str:
    """Construct the Redis key for a specific staff member's dashboard.

    Args:
        staff_id: The integer identifier of the staff/guide user.

    Returns:
        A string of the form ``"staff_dashboard:{staff_id}"``.
    """
    return f'staff_dashboard:{staff_id}'

# ---------------------------------------------------------------------------
# Redis client initialisation – fails gracefully if Redis is unavailable.
# ---------------------------------------------------------------------------
import os

try:
    redis_host = os.environ.get('REDIS_HOST', 'localhost')
    redis_port = int(os.environ.get('REDIS_PORT', 6379))
    redis_client = redis.StrictRedis(host=redis_host, port=redis_port, db=0, decode_responses=True)
    # Verify connection at start‑up.
    redis_client.ping()
except Exception as e:
    print("Redis failed to initialize:", e)
    redis_client = None


# ---------------------------------------------------------------------------
# Generic cache helpers
# ---------------------------------------------------------------------------

def cache_get(key: str):
    """Retrieve a JSON‑deserialised value from Redis.

    Returns ``None`` if the key does not exist, Redis is unavailable, or an
    error occurs during deserialisation.
    """
    if not redis_client:
        return None
    try:
        raw = redis_client.get(key)
        return json.loads(raw) if raw else None
    except Exception as e:
        print(f"Redis GET error [{key}]:", e)
        return None


def cache_set(key: str, value, ttl: int):
    """Serialise ``value`` to JSON and store it under ``key`` with the given TTL.
    Silently skips the operation if Redis is unavailable.
    """
    if not redis_client:
        return
    try:
        redis_client.setex(key, ttl, json.dumps(value))
    except Exception as e:
        print(f"Redis SET error [{key}]:", e)


def cache_delete(*keys: str):
    """Delete one or more Redis keys.

    Supports glob‑style patterns (e.g. ``"staff_dashboard:*"``) which are
    expanded via ``KEYS`` before deletion.
    """
    if not redis_client:
        return
    try:
        all_keys = []
        for k in keys:
            if '*' in k:
                matched = redis_client.keys(k)
                all_keys.extend(matched)
            else:
                all_keys.append(k)
        if all_keys:
            redis_client.delete(*all_keys)
    except Exception as e:
        print(f"Redis DELETE error {keys}:", e)

# ---------------------------------------------------------------------------
# Specific cache retrieval functions
# ---------------------------------------------------------------------------

def get_open_treks_cached():
    """Return cached open trek batches for the trekker dashboard.

    On a cache miss the function queries the database, builds the JSON payload
    and stores it under :data:`KEY_OPEN_TREKS` with :data:`TTL_OPEN_TREKS`.
    """
    cached = cache_get(KEY_OPEN_TREKS)
    if cached is not None:
        return cached
    # Cache miss – query DB
    active_routes = TrekRoute.query.filter_by(active=True).all()
    routes_json = []
    for r in active_routes:
        r_json = r.to_json()
        open_batches = Trek.query.filter(
            Trek.trek_route_id == r.id,
            Trek.status == 'Open',
            Trek.start_date >= date.today()
        ).all()
        r_json['batches'] = [b.to_json() for b in open_batches]
        routes_json.append(r_json)
    cache_set(KEY_OPEN_TREKS, routes_json, TTL_OPEN_TREKS)
    return routes_json


def get_public_treks_cached():
    """Return cached public trek records for the landing page.

    Falls back to a DB query on a cache miss and stores the result under
    :data:`KEY_PUBLIC_TREKS`.
    """
    cached = cache_get(KEY_PUBLIC_TREKS)
    if cached is not None:
        return cached
    treks = [t.to_json() for t in Trek.query.all()]
    cache_set(KEY_PUBLIC_TREKS, treks, TTL_PUBLIC_TREKS)
    return treks


def get_public_routes_cached():
    """Return cached public trek routes for the landing page.

    Cache key: :data:`KEY_PUBLIC_ROUTES`.
    """
    cached = cache_get(KEY_PUBLIC_ROUTES)
    if cached is not None:
        return cached
    routes = [r.to_json() for r in TrekRoute.query.all()]
    cache_set(KEY_PUBLIC_ROUTES, routes, TTL_PUBLIC_ROUTES)
    return routes

# ---------------------------------------------------------------------------
# Cache invalidation helpers
# ---------------------------------------------------------------------------

def invalidate_open_treks_cache():
    """Invalidate the open‑treks cache used on the trekker dashboard.
    Use :func:`invalidate_all_trek_caches` for broader invalidation.
    """
    cache_delete(KEY_OPEN_TREKS)


def invalidate_all_trek_caches():
    """Invalidate all trek‑related cache keys in one operation.
    This should be called after any write that changes trek, route, booking or
    user data affecting the public or admin views.
    """
    cache_delete(
        KEY_OPEN_TREKS,
        KEY_PUBLIC_TREKS,
        KEY_PUBLIC_ROUTES,
        KEY_ADMIN_DASHBOARD
    )


def invalidate_staff_cache(staff_id: int):
    """Invalidate the cached dashboard for a specific staff member.
    Args:
        staff_id: The integer ID of the guide whose cache should be cleared.
    """
    cache_delete(staff_dashboard_key(staff_id))


def invalidate_all_staff_caches():
    """Invalidate all per‑staff dashboard caches.
    This is useful after a global change affecting every guide, such as a new
    policy or system‑wide status update.
    """
    cache_delete('staff_dashboard:*')


def invalidate_everything():
    """Invalidates all cached keys in the application immediately."""
    cache_delete(
        KEY_OPEN_TREKS,
        KEY_PUBLIC_TREKS,
        KEY_PUBLIC_ROUTES,
        KEY_ADMIN_DASHBOARD,
        'staff_dashboard:*'
    )


@event.listens_for(db.session, 'after_commit')
def auto_invalidate_on_commit(session):
    """Automatically clear all Redis caches whenever database session transaction commits."""
    invalidate_everything()

