"""
Redis Caching Utilities Module
==============================
This module initializes the Redis client and defines centralized helpers for
caching, retrieving, and invalidating data to reduce database load across the app.

Cache Keys Managed Here:
    - "open_treks"               : Open trek batches for trekker dashboard (TTL: 300s)
    - "public_treks"             : All Trek records for the public landing page (TTL: 300s)
    - "public_trek_routes"       : All TrekRoute catalog records for public view (TTL: 600s)
    - "admin_dashboard"          : Full admin dashboard payload (TTL: 120s)
    - "staff_dashboard:{id}"     : Per-guide dashboard payload, keyed by user ID (TTL: 120s)

Invalidation Strategy:
    - Any write that changes trek/route/booking state calls `invalidate_all_trek_caches()`,
      which clears open_treks, public_treks, public_trek_routes, and admin_dashboard in one shot.
    - Guide-specific dashboard cache is cleared via `invalidate_staff_cache(staff_id)`.
"""

import redis
import json
from datetime import date

from backend.models.models import TrekRoute, Trek

# ---------------------------------------------------------------------------
# TTL Constants (seconds) — change here to tune all cache expiry times
# ---------------------------------------------------------------------------
TTL_OPEN_TREKS = 300          # 5 minutes  — open treks for user dashboard
TTL_PUBLIC_TREKS = 300        # 5 minutes  — public treks listing
TTL_PUBLIC_ROUTES = 600       # 10 minutes — public route catalog (changes rarely)
TTL_ADMIN_DASHBOARD = 120     # 2 minutes  — admin dashboard (live operational data)
TTL_STAFF_DASHBOARD = 120     # 2 minutes  — per-guide dashboard

# ---------------------------------------------------------------------------
# Cache Key Constants
# ---------------------------------------------------------------------------
KEY_OPEN_TREKS = 'open_treks'
KEY_PUBLIC_TREKS = 'public_treks'
KEY_PUBLIC_ROUTES = 'public_trek_routes'
KEY_ADMIN_DASHBOARD = 'admin_dashboard'


def staff_dashboard_key(staff_id):
    """
    Builds the per-guide cache key for a given staff user ID.

    Args:
        staff_id (int): The user ID of the staff/guide member.

    Returns:
        str: Redis key string in the format "staff_dashboard:{staff_id}".
    """
    return f'staff_dashboard:{staff_id}'


# ---------------------------------------------------------------------------
# Redis Client Initialization
# ---------------------------------------------------------------------------
try:
    redis_client = redis.StrictRedis(host='localhost', port=6379, db=0, decode_responses=True)
    # Ping to verify the connection at startup
    redis_client.ping()
except Exception as e:
    print("Redis failed to initialize:", e)
    redis_client = None


# ---------------------------------------------------------------------------
# Generic Cache Helpers
# ---------------------------------------------------------------------------

def cache_get(key):
    """
    Retrieves a JSON-parsed value from Redis by key.
    Returns None on cache miss, Redis error, or if Redis is unavailable.

    Args:
        key (str): Redis key to look up.

    Returns:
        Any | None: Deserialized Python object, or None on miss/error.
    """
    if not redis_client:
        return None
    try:
        raw = redis_client.get(key)
        return json.loads(raw) if raw else None
    except Exception as e:
        print(f"Redis GET error [{key}]:", e)
        return None


def cache_set(key, value, ttl):
    """
    Serializes a Python object to JSON and stores it in Redis with a TTL.
    Silently skips if Redis is unavailable.

    Args:
        key (str): Redis key to write.
        value (Any): JSON-serializable Python object to store.
        ttl (int): Time-to-live in seconds.

    Returns:
        None
    """
    if not redis_client:
        return
    try:
        redis_client.setex(key, ttl, json.dumps(value))
    except Exception as e:
        print(f"Redis SET error [{key}]:", e)


def cache_delete(*keys):
    """
    Deletes one or more Redis keys. Pattern keys (e.g. "staff_dashboard:*")
    are expanded via a KEYS scan before deletion.
    Silently skips if Redis is unavailable.

    Args:
        *keys (str): One or more Redis key strings. Supports glob patterns.

    Returns:
        None
    """
    if not redis_client:
        return
    try:
        all_keys = []
        for k in keys:
            if '*' in k:
                # Expand glob patterns
                matched = redis_client.keys(k)
                all_keys.extend(matched)
            else:
                all_keys.append(k)
        if all_keys:
            redis_client.delete(*all_keys)
    except Exception as e:
        print(f"Redis DELETE error {keys}:", e)


# ---------------------------------------------------------------------------
# Specific Cache Functions
# ---------------------------------------------------------------------------

def get_open_treks_cached():
    """
    Fetches open trek batches for the trekker dashboard.
    Tries Redis cache first (key: 'open_treks'). Falls back to DB on miss
    and repopulates the cache (TTL: TTL_OPEN_TREKS).

    Returns:
        list: JSON-compatible list of route dicts each with their open batches.
    """
    # 1. Try cache
    cached = cache_get(KEY_OPEN_TREKS)
    if cached is not None:
        return cached

    # 2. Cache miss — query DB
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

    # 3. Store in cache
    cache_set(KEY_OPEN_TREKS, routes_json, TTL_OPEN_TREKS)
    return routes_json


def get_public_treks_cached():
    """
    Fetches all Trek records for the public-facing landing page.
    Tries Redis cache first (key: 'public_treks'). Falls back to DB on miss
    and repopulates the cache (TTL: TTL_PUBLIC_TREKS).

    Returns:
        list: JSON-compatible list of all serialized Trek records.
    """
    cached = cache_get(KEY_PUBLIC_TREKS)
    if cached is not None:
        return cached

    treks = [t.to_json() for t in Trek.query.all()]
    cache_set(KEY_PUBLIC_TREKS, treks, TTL_PUBLIC_TREKS)
    return treks


def get_public_routes_cached():
    """
    Fetches all active TrekRoute catalog records for the public-facing landing page.
    Tries Redis cache first (key: 'public_trek_routes'). Falls back to DB on miss
    and repopulates the cache (TTL: TTL_PUBLIC_ROUTES).

    Returns:
        list: JSON-compatible list of all serialized TrekRoute records.
    """
    cached = cache_get(KEY_PUBLIC_ROUTES)
    if cached is not None:
        return cached

    routes = [r.to_json() for r in TrekRoute.query.all()]
    cache_set(KEY_PUBLIC_ROUTES, routes, TTL_PUBLIC_ROUTES)
    return routes


# ---------------------------------------------------------------------------
# Cache Invalidation Functions
# ---------------------------------------------------------------------------

def invalidate_open_treks_cache():
    """
    Invalidates only the open treks trekker-dashboard cache key.
    Prefer `invalidate_all_trek_caches()` for write operations that affect
    public or admin views as well.

    Returns:
        None
    """
    cache_delete(KEY_OPEN_TREKS)


def invalidate_all_trek_caches():
    """
    Invalidates all trek-related cache keys in one shot:
        - open_treks         (trekker dashboard)
        - public_treks       (public landing page)
        - public_trek_routes (public route catalog)
        - admin_dashboard    (admin dashboard payload)

    Call this on any write that changes trek routes, batches, bookings, or user data.

    Returns:
        None
    """
    cache_delete(
        KEY_OPEN_TREKS,
        KEY_PUBLIC_TREKS,
        KEY_PUBLIC_ROUTES,
        KEY_ADMIN_DASHBOARD
    )


def invalidate_staff_cache(staff_id):
    """
    Invalidates the per-guide dashboard cache for a specific staff member.
    Call this when a guide's assigned trek, slots, or participant list changes.

    Args:
        staff_id (int): The user ID of the staff/guide member whose cache to clear.

    Returns:
        None
    """
    cache_delete(staff_dashboard_key(staff_id))


def invalidate_all_staff_caches():
    """
    Invalidates dashboard caches for ALL staff members at once.
    Used for broad operations like global trek status changes.

    Returns:
        None
    """
    cache_delete('staff_dashboard:*')
