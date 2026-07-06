// ============================================================
//  admin_data.js — full state & mock data for TrailSync Admin
//  All exports are reactive starting values that are populated
//  at runtime by the AdminDashboard component via API calls.
//  When the backend is unavailable, these serve as offline
//  fallback data so the dashboard renders meaningful content.
// ============================================================

// ── Summary / KPI Cards ───────────────────────────────────────
// Top-level statistics displayed in the admin dashboard header
// (e.g. total users, total bookings, revenue).
export const ADMIN_STATS = [
  { label: 'Total Trekkers', value: 142, icon: 'users',    category: 'people' },
  { label: 'Active Staff',   value: 18,  icon: 'staff',    category: 'people' },
  { label: 'Trek Routes',    value: 24,  icon: 'mountain', category: 'treks'  },
  { label: 'Active Batches', value: 9,   icon: 'active',   category: 'treks'  },
  { label: 'Total Bookings', value: 318, icon: 'book',     category: 'bookings' },
  { label: 'Cancellations',  value: 27,  icon: 'cancel',   category: 'bookings' },
];

// ── Trek Status Overview ──────────────────────────────────────
// Aggregate counts of treks grouped by status.
export const TREK_STATUS_OVERVIEW = [
  { label: 'Open',      count: 9,  pct: 38, color: '#4caf50' },
  { label: 'Approved',  count: 5,  pct: 21, color: '#2196f3' },
  { label: 'Completed', count: 7,  pct: 29, color: '#9e9e9e' },
  { label: 'Cancelled', count: 3,  pct: 12, color: '#f44336' },
];

// ── Monthly Bookings Chart ────────────────────────────────────
// Time-series data used to render the bookings trend chart.
export const MONTHLY_BOOKINGS = [
  { month: 'Jan', count: 18 },
  { month: 'Feb', count: 24 },
  { month: 'Mar', count: 31 },
  { month: 'Apr', count: 27 },
  { month: 'May', count: 42 },
  { month: 'Jun', count: 58 },
  { month: 'Jul', count: 48 },
];

// ── Admin Alert Banner ────────────────────────────────────────
// System-level alerts shown at the top of the dashboard.
export const ADMIN_ALERTS = [];

// ── Recent Bookings Feed ──────────────────────────────────────
// The N most-recent booking records shown in the activity panel.
export const RECENT_BOOKINGS = [
  { id: 1, user: 'Arjun Mehta',    trek: 'Kedarkantha Trek', status: 'Booked',    date: '2026-07-04' },
  { id: 2, user: 'Priya Sharma',   trek: 'Hampta Pass',      status: 'Booked',    date: '2026-07-03' },
  { id: 3, user: 'Rohan Gupta',    trek: 'Triund Trek',      status: 'Cancelled', date: '2026-07-02' },
  { id: 4, user: 'Sneha Patil',    trek: 'Valley of Flowers',status: 'Booked',    date: '2026-07-01' },
  { id: 5, user: 'Vikram Singh',   trek: 'Brahmatal Trek',   status: 'Booked',    date: '2026-06-30' },
];

// ── Trek Catalogue (Admin View) ───────────────────────────────
// Full list of treks visible to the admin.
export const ADMIN_TREKS = [
  { id: 1, batchCode: 'KK-JUL01', name: 'Kedarkantha Trek',  location: 'Uttarkashi, Uttarakhand', difficulty: 'Easy',     startDate: '2026-07-10', endDate: '2026-07-15', slots: 20, booked: 14, status: 'Open',      staff: 'Rajan Thapa',     price: 6500  },
  { id: 2, batchCode: 'HP-JUL01', name: 'Hampta Pass',       location: 'Kullu, Himachal Pradesh', difficulty: 'Moderate', startDate: '2026-07-12', endDate: '2026-07-17', slots: 18, booked: 11, status: 'Open',      staff: 'Mohan Bisht',     price: 8500  },
  { id: 3, batchCode: 'VF-JUL01', name: 'Valley of Flowers', location: 'Chamoli, Uttarakhand',    difficulty: 'Moderate', startDate: '2026-07-18', endDate: '2026-07-24', slots: 16, booked: 16, status: 'Approved',  staff: 'Deepak Rawat',    price: 9200  },
  { id: 4, batchCode: 'BT-JUL01', name: 'Brahmatal Trek',    location: 'Chamoli, Uttarakhand',    difficulty: 'Moderate', startDate: '2026-07-20', endDate: '2026-07-25', slots: 15, booked: 8,  status: 'Open',      staff: 'Unassigned',      price: 7000  },
  { id: 5, batchCode: 'TT-JUL01', name: 'Triund Trek',       location: 'Dharamsala, Himachal Pradesh', difficulty: 'Easy', startDate: '2026-07-08', endDate: '2026-07-09', slots: 25, booked: 22, status: 'Open',   staff: 'Sanjeev Negi',    price: 3500  },
  { id: 6, batchCode: 'RP-JUN01', name: 'Roopkund Trek',     location: 'Chamoli, Uttarakhand',    difficulty: 'Hard',     startDate: '2026-06-05', endDate: '2026-06-12', slots: 12, booked: 12, status: 'Completed', staff: 'Arjun Bhandari',  price: 12000 },
  { id: 7, batchCode: 'KPT-JUN01',name: 'Kuari Pass Trek',   location: 'Chamoli, Uttarakhand',    difficulty: 'Moderate', startDate: '2026-06-10', endDate: '2026-06-15', slots: 15, booked: 10, status: 'Completed', staff: 'Rajan Thapa',     price: 8000  },
  { id: 8, batchCode: 'CG-JUL01', name: 'Chadar Trek',       location: 'Leh, Ladakh',             difficulty: 'Hard',     startDate: '2026-07-25', endDate: '2026-08-02', slots: 10, booked: 4,  status: 'Open',      staff: 'Unassigned',      price: 18000 },
  { id: 9, batchCode: 'SP-JUL01', name: 'Sandakphu Trek',    location: 'Darjeeling, West Bengal', difficulty: 'Moderate', startDate: '2026-07-15', endDate: '2026-07-21', slots: 14, booked: 9,  status: 'Approved',  staff: 'Mohan Bisht',     price: 9500  },
];

// ── Staff Directory ───────────────────────────────────────────
// All staff / guide accounts managed by the admin.
export const ADMIN_STAFF_LIST = [
  { id: 1, name: 'Rajan Thapa',    contact: 'rajan@trailsync.in',   designation: 'Senior Guide',  active: true,  blacklisted: false, memberId: 'TS26G001', photoUrl: '', treks: [1, 7], treksDone: [], completedTreksCount: 14, leaves: [] },
  { id: 2, name: 'Mohan Bisht',    contact: 'mohan@trailsync.in',   designation: 'Lead Guide',    active: true,  blacklisted: false, memberId: 'TS26G002', photoUrl: '', treks: [2, 9], treksDone: [], completedTreksCount: 11, leaves: [] },
  { id: 3, name: 'Deepak Rawat',   contact: 'deepak@trailsync.in',  designation: 'Guide',         active: true,  blacklisted: false, memberId: 'TS26G003', photoUrl: '', treks: [3],    treksDone: [], completedTreksCount: 8,  leaves: [] },
  { id: 4, name: 'Sanjeev Negi',   contact: 'sanjeev@trailsync.in', designation: 'Guide',         active: true,  blacklisted: false, memberId: 'TS26G004', photoUrl: '', treks: [5],    treksDone: [], completedTreksCount: 6,  leaves: [] },
  { id: 5, name: 'Arjun Bhandari', contact: 'arjun@trailsync.in',   designation: 'Senior Guide',  active: true,  blacklisted: false, memberId: 'TS26G005', photoUrl: '', treks: [6],    treksDone: [], completedTreksCount: 17, leaves: [] },
  { id: 6, name: 'Kavita Verma',   contact: 'kavita@trailsync.in',  designation: 'Assistant Guide',active: false, blacklisted: false, memberId: 'TS26G006', photoUrl: '', treks: [],     treksDone: [], completedTreksCount: 3,  leaves: [] },
];

// ── User Directory ────────────────────────────────────────────
// All registered trekker accounts, including blacklisted ones.
export const ADMIN_USERS = [
  { id: 1,  name: 'Arjun Mehta',     email: 'arjun@example.com',    phone: '9876543210', city: 'Mumbai',    memberId: 'TS26T001', blacklisted: false, registeredAt: '2026-01-15' },
  { id: 2,  name: 'Priya Sharma',    email: 'priya@example.com',    phone: '9876543211', city: 'Delhi',     memberId: 'TS26T002', blacklisted: false, registeredAt: '2026-01-20' },
  { id: 3,  name: 'Rohan Gupta',     email: 'rohan@example.com',    phone: '9876543212', city: 'Bangalore', memberId: 'TS26T003', blacklisted: false, registeredAt: '2026-02-01' },
  { id: 4,  name: 'Sneha Patil',     email: 'sneha@example.com',    phone: '9876543213', city: 'Pune',      memberId: 'TS26T004', blacklisted: false, registeredAt: '2026-02-10' },
  { id: 5,  name: 'Vikram Singh',    email: 'vikram@example.com',   phone: '9876543214', city: 'Jaipur',    memberId: 'TS26T005', blacklisted: false, registeredAt: '2026-02-18' },
  { id: 6,  name: 'Anjali Nair',     email: 'anjali@example.com',   phone: '9876543215', city: 'Chennai',   memberId: 'TS26T006', blacklisted: false, registeredAt: '2026-03-05' },
  { id: 7,  name: 'Karan Malhotra',  email: 'karan@example.com',    phone: '9876543216', city: 'Chandigarh',memberId: 'TS26T007', blacklisted: false, registeredAt: '2026-03-12' },
  { id: 8,  name: 'Divya Menon',     email: 'divya@example.com',    phone: '9876543217', city: 'Kochi',     memberId: 'TS26T008', blacklisted: false, registeredAt: '2026-03-20' },
  { id: 9,  name: 'Rahul Joshi',     email: 'rahul@example.com',    phone: '9876543218', city: 'Ahmedabad', memberId: 'TS26T009', blacklisted: true,  registeredAt: '2026-04-01' },
  { id: 10, name: 'Pooja Desai',     email: 'pooja@example.com',    phone: '9876543219', city: 'Surat',     memberId: 'TS26T010', blacklisted: false, registeredAt: '2026-04-08' },
];

// ── Bookings Management Table ─────────────────────────────────
// Full booking records used in the admin Bookings tab.
export const ADMIN_BOOKINGS = [
  { id: 1,  user: 'Arjun Mehta',     trek: 'Kedarkantha Trek',  trekId: 1, userId: 1, status: 'Booked',    paymentStatus: 'Paid',    amountPaid: 6500,  bookingPrice: 6500,  paid: true,  date: '2026-07-01', difficulty: 'Easy'     },
  { id: 2,  user: 'Priya Sharma',    trek: 'Hampta Pass',        trekId: 2, userId: 2, status: 'Booked',    paymentStatus: 'Paid',    amountPaid: 8500,  bookingPrice: 8500,  paid: true,  date: '2026-07-02', difficulty: 'Moderate' },
  { id: 3,  user: 'Rohan Gupta',     trek: 'Triund Trek',        trekId: 5, userId: 3, status: 'Cancelled', paymentStatus: 'Refunded',amountPaid: 3500,  bookingPrice: 3500,  paid: false, date: '2026-06-28', difficulty: 'Easy',    refundAmount: 3500 },
  { id: 4,  user: 'Sneha Patil',     trek: 'Valley of Flowers',  trekId: 3, userId: 4, status: 'Booked',    paymentStatus: 'Paid',    amountPaid: 9200,  bookingPrice: 9200,  paid: true,  date: '2026-07-03', difficulty: 'Moderate' },
  { id: 5,  user: 'Vikram Singh',    trek: 'Brahmatal Trek',     trekId: 4, userId: 5, status: 'Booked',    paymentStatus: 'Paid',    amountPaid: 7000,  bookingPrice: 7000,  paid: true,  date: '2026-07-04', difficulty: 'Moderate' },
  { id: 6,  user: 'Anjali Nair',     trek: 'Kedarkantha Trek',   trekId: 1, userId: 6, status: 'Booked',    paymentStatus: 'Pending', amountPaid: 0,     bookingPrice: 6500,  paid: false, date: '2026-07-04', difficulty: 'Easy'     },
  { id: 7,  user: 'Karan Malhotra',  trek: 'Roopkund Trek',      trekId: 6, userId: 7, status: 'Booked',    paymentStatus: 'Paid',    amountPaid: 12000, bookingPrice: 12000, paid: true,  date: '2026-05-20', difficulty: 'Hard'     },
  { id: 8,  user: 'Divya Menon',     trek: 'Sandakphu Trek',     trekId: 9, userId: 8, status: 'Booked',    paymentStatus: 'Paid',    amountPaid: 9500,  bookingPrice: 9500,  paid: true,  date: '2026-07-05', difficulty: 'Moderate' },
  { id: 9,  user: 'Pooja Desai',     trek: 'Hampta Pass',        trekId: 2, userId: 10, status: 'Booked',   paymentStatus: 'Paid',    amountPaid: 8500,  bookingPrice: 8500,  paid: true,  date: '2026-06-25', difficulty: 'Moderate' },
  { id: 10, user: 'Arjun Mehta',     trek: 'Kuari Pass Trek',    trekId: 7, userId: 1, status: 'Booked',    paymentStatus: 'Paid',    amountPaid: 8000,  bookingPrice: 8000,  paid: true,  date: '2026-05-15', difficulty: 'Moderate' },
];

// ── Popular Treks ─────────────────────────────────────────────
// Ranked list of treks sorted by booking volume.
export const POPULAR_TREKS = [
  { name: 'Kedarkantha Trek',  bookings: 45 },
  { name: 'Valley of Flowers', bookings: 38 },
  { name: 'Hampta Pass',       bookings: 34 },
  { name: 'Triund Trek',       bookings: 61 },
  { name: 'Brahmatal Trek',    bookings: 28 },
];

// ── Slot Utilisation Data ─────────────────────────────────────
// Per-trek occupancy percentages used in the capacity chart.
export const SLOT_UTILIZATION = [
  { trek: 'Triund Trek',       booked: 22, total: 25, pct: 88 },
  { trek: 'Valley of Flowers', booked: 16, total: 16, pct: 100 },
  { trek: 'Kedarkantha Trek',  booked: 14, total: 20, pct: 70 },
  { trek: 'Hampta Pass',       booked: 11, total: 18, pct: 61 },
  { trek: 'Brahmatal Trek',    booked: 8,  total: 15, pct: 53 },
];

// ── Upcoming Treks ────────────────────────────────────────────
// Treks scheduled to depart within the next N days.
export const UPCOMING_TREKS = [
  { name: 'Triund Trek',       startDate: '2026-07-08', daysLeft: 2,  staff: 'Sanjeev Negi'  },
  { name: 'Kedarkantha Trek',  startDate: '2026-07-10', daysLeft: 4,  staff: 'Rajan Thapa'   },
  { name: 'Hampta Pass',       startDate: '2026-07-12', daysLeft: 6,  staff: 'Mohan Bisht'   },
  { name: 'Sandakphu Trek',    startDate: '2026-07-15', daysLeft: 9,  staff: 'Mohan Bisht'   },
  { name: 'Valley of Flowers', startDate: '2026-07-18', daysLeft: 12, staff: 'Deepak Rawat'  },
];

// ── Activity Feed ─────────────────────────────────────────────
// Real-time log of user and admin actions.
export const ACTIVITY_FEED = [
  { id: 1, action: 'New booking: Arjun Mehta → Kedarkantha Trek', time: '2 mins ago',  type: 'booking'      },
  { id: 2, action: 'Payment confirmed: Priya Sharma ₹8,500',       time: '15 mins ago', type: 'payment'      },
  { id: 3, action: 'Booking cancelled: Rohan Gupta - Triund Trek', time: '1 hr ago',    type: 'cancellation' },
  { id: 4, action: 'New registration: Divya Menon',                 time: '2 hrs ago',   type: 'registration' },
  { id: 5, action: 'Staff assigned: Deepak Rawat → Valley of Flowers', time: '3 hrs ago', type: 'assignment' },
];

// ── Audit Logs ────────────────────────────────────────────────
// Immutable record of administrative actions.
export const AUDIT_LOGS = [
  { id: 1, actor: 'Admin',        action: 'Assigned staff Deepak Rawat to Valley of Flowers batch', level: 'info',    time: '2026-07-05 14:30' },
  { id: 2, actor: 'Admin',        action: 'Blacklisted user Rahul Joshi for payment fraud',         level: 'warning', time: '2026-07-04 10:15' },
  { id: 3, actor: 'System',       action: 'Monthly report generated for June 2026',                  level: 'info',    time: '2026-07-01 00:05' },
  { id: 4, actor: 'Admin',        action: 'Trek batch Chadar Trek created (CG-JUL01)',               level: 'info',    time: '2026-06-28 16:00' },
  { id: 5, actor: 'System',       action: 'Booking cancellation processed: Rohan Gupta refund',     level: 'info',    time: '2026-06-28 11:45' },
];

// ── Notifications ─────────────────────────────────────────────
// In-app notifications delivered to the admin.
export const NOTIFICATIONS = [
  { id: 1, message: '3 treks have no assigned guide',               read: false, time: '10 mins ago'  },
  { id: 2, message: 'Valley of Flowers batch is fully booked',      read: false, time: '1 hr ago'     },
  { id: 3, message: 'New support ticket from Anjali Nair',          read: false, time: '2 hrs ago'    },
  { id: 4, message: 'Monthly revenue report is ready to download',  read: true,  time: '1 day ago'    },
  { id: 5, message: 'Rohan Gupta cancellation processed ₹3,500',   read: true,  time: '2 days ago'   },
];

// ── Scheduled Jobs ────────────────────────────────────────────
// Celery Beat task statuses shown in the System Health tab.
export const SCHEDULED_JOBS = [
  { name: 'send_daily_reminders',    schedule: 'Every day at 08:00',  status: 'Active',  lastRun: '2026-07-05 08:00' },
  { name: 'generate_monthly_report', schedule: '1st of every month',  status: 'Active',  lastRun: '2026-07-01 00:05' },
  { name: 'clean_expired_sessions',  schedule: 'Every 6 hours',       status: 'Active',  lastRun: '2026-07-06 06:00' },
  { name: 'update_trek_statuses',    schedule: 'Every hour',          status: 'Active',  lastRun: '2026-07-06 11:00' },
  { name: 'send_review_requests',    schedule: 'After trek ends',     status: 'Pending', lastRun: 'N/A'              },
];

// ── System Health ─────────────────────────────────────────────
// Real-time status of each backend service.
export const SYSTEM_HEALTH = {
  database: { label: 'SQLite Database', status: 'Offline',      ok: false },
  redis:    { label: 'Redis Cache',     status: 'Disconnected', ok: false },
  celery:   { label: 'Celery Worker',   status: 'Stopped',      ok: false },
  beats:    { label: 'Celery Beat',     status: 'Inactive',     ok: false },
  api:      { label: 'Flask API',       status: 'Offline',      ok: false },
};

// ── Difficulty Distribution ───────────────────────────────────
// Count of treks per difficulty level (Easy / Moderate / Hard).
export const DIFFICULTY_DIST = [
  { level: 'Easy',     count: 8,  pct: 33 },
  { level: 'Moderate', count: 12, pct: 50 },
  { level: 'Hard',     count: 4,  pct: 17 },
];

// ── User Growth ───────────────────────────────────────────────
// Month-over-month new registration counts.
export const USER_GROWTH = [
  { month: 'Jan', users: 12 },
  { month: 'Feb', users: 18 },
  { month: 'Mar', users: 22 },
  { month: 'Apr', users: 15 },
  { month: 'May', users: 28 },
  { month: 'Jun', users: 35 },
  { month: 'Jul', users: 12 },
];

// ── Revenue Summary ───────────────────────────────────────────
// High-level financial summary displayed in the analytics tab.
export const REVENUE_DATA = {
  total:      '₹2,74,700',
  monthly:    '₹58,200',
  topTrek:    'Roopkund Trek',
  topRevenue: '₹96,000',
};

// ── Blacklisted Users ─────────────────────────────────────────
// List of trekker accounts that have been banned by the admin.
export const BLACKLISTED_USERS = [
  { id: 9, name: 'Rahul Joshi', reason: 'Payment fraud', date: '2026-07-04' },
];

// ── Alerts & Tasks ────────────────────────────────────────────
// Combined list of operational warnings and pending tasks shown
// in the Alerts & Pending Tasks panel on the dashboard.
export const ADMIN_ALERTS_AND_TASKS = [
  { label: 'Trek Has No Assigned Staff',       count: 2, type: 'unassigned_staff'    },
  { label: 'Treks Starting This Week',          count: 2, type: 'starting_this_week'  },
  { label: 'Low Occupancy (<50%) Starting Soon',count: 1, type: 'low_occupancy'       },
  { label: 'Unpaid Bookings',                   count: 1, type: 'unpaid_bookings'      },
  { label: 'Pending Support Tickets',           count: 3, type: 'pending_tickets'      },
  { label: 'Staff Accounts Inactive',           count: 1, type: 'inactive_staff'       },
];
