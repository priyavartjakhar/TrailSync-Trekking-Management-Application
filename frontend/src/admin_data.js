// ============================================================
//  admin_data.js — full state & mock data for TrailSync Admin
// ============================================================

export const ADMIN_STATS = [];

export const TREK_STATUS_OVERVIEW = [];

export const MONTHLY_BOOKINGS = [];

export const ADMIN_ALERTS = [];

export const RECENT_BOOKINGS = [];

export const ADMIN_TREKS = [];

export const ADMIN_STAFF_LIST = [];

export const ADMIN_USERS = [];

export const ADMIN_BOOKINGS = [];

export const POPULAR_TREKS = [];

export const SLOT_UTILIZATION = [];

export const UPCOMING_TREKS = [];

export const ACTIVITY_FEED = [];

export const AUDIT_LOGS = [];

export const NOTIFICATIONS = [];

export const SCHEDULED_JOBS = [];

export const SYSTEM_HEALTH = {
  database: { label: 'SQLite Database', status: 'Offline',    ok: false },
  redis:    { label: 'Redis Cache',     status: 'Disconnected', ok: false },
  celery:   { label: 'Celery Worker',   status: 'Stopped',      ok: false },
  beats:    { label: 'Celery Beat',     status: 'Inactive',     ok: false },
  api:      { label: 'Flask API',       status: 'Offline',      ok: false },
};

export const DIFFICULTY_DIST = [];

export const USER_GROWTH = [];

export const REVENUE_DATA = {
  total:       '₹0',
  monthly:     '₹0',
  topTrek:     'N/A',
  topRevenue:  '₹0',
};

export const BLACKLISTED_USERS = [];
