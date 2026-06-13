// ============================================================
//  admin_data.js — full state & mock data for TrailSync Admin
// ============================================================

const ADMIN_STATS = [];

const TREK_STATUS_OVERVIEW = [];

const MONTHLY_BOOKINGS = [];

const ADMIN_ALERTS = [];

const RECENT_BOOKINGS = [];

const ADMIN_TREKS = [];

const ADMIN_STAFF_LIST = [];

const ADMIN_USERS = [];

const ADMIN_BOOKINGS = [];

const POPULAR_TREKS = [];

const SLOT_UTILIZATION = [];

const UPCOMING_TREKS = [];

const ACTIVITY_FEED = [];

const AUDIT_LOGS = [];

const NOTIFICATIONS = [];

const SCHEDULED_JOBS = [];

const SYSTEM_HEALTH = {
  database: { label: 'SQLite Database', status: 'Offline',    ok: false },
  redis:    { label: 'Redis Cache',     status: 'Disconnected', ok: false },
  celery:   { label: 'Celery Worker',   status: 'Stopped',      ok: false },
  beats:    { label: 'Celery Beat',     status: 'Inactive',     ok: false },
  api:      { label: 'Flask API',       status: 'Offline',      ok: false },
};

const DIFFICULTY_DIST = [];

const USER_GROWTH = [];

const REVENUE_DATA = {
  total:       '₹0',
  monthly:     '₹0',
  topTrek:     'N/A',
  topRevenue:  '₹0',
};

const BLACKLISTED_USERS = [];
