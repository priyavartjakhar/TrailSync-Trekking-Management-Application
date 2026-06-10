// ============================================================
//  admin_data.js — initial state and mock data for admin panel
// ============================================================

const ADMIN_STATS = [
  { label: 'Total Treks', value: 24 },
  { label: 'Active Staff', value: 11 },
  { label: 'Registered Users', value: 348 },
  { label: 'Total Bookings', value: 892 },
  { label: 'Open Treks', value: 7 },
];

const TREK_STATUS_OVERVIEW = [
  { label: 'Open', count: 7, pct: 29, color: '#4ade80' },
  { label: 'Pending', count: 5, pct: 21, color: '#fbbf24' },
  { label: 'Completed', count: 9, pct: 37, color: '#a8c5a0' },
  { label: 'Closed', count: 3, pct: 13, color: '#ef4444' },
];

const ADMIN_ALERTS = [
  { msg: '3 treks have slots below 5 remaining', type: 'warn' },
  { msg: 'Monthly report scheduled for Jun 1', type: 'info' },
  { msg: 'Staff member Priya has no trek assigned', type: 'warn' },
];

const RECENT_BOOKINGS = [
  { id: 1, user: 'Aryan Mehta', trek: 'Kedarkantha', date: '2026-05-20', status: 'Booked' },
  { id: 2, user: 'Sneha Rao', trek: 'Roopkund', date: '2026-05-19', status: 'Booked' },
  { id: 3, user: 'Dev Nair', trek: 'Hampta Pass', date: '2026-05-18', status: 'Cancelled' },
  { id: 4, user: 'Riya Joshi', trek: 'Valley of Flowers', date: '2026-05-17', status: 'Completed' },
  { id: 5, user: 'Kabir Shah', trek: 'Pin Parvati', date: '2026-05-16', status: 'Booked' },
];

const ADMIN_TREKS = [
  { id: 1, name: 'Kedarkantha', location: 'Uttarakhand', difficulty: 'Moderate', startDate: '2026-06-10', endDate: '2026-06-16', slots: 18, staff: 'Ravi Kumar', status: 'Open' },
  { id: 2, name: 'Roopkund Lake', location: 'Uttarakhand', difficulty: 'Hard', startDate: '2026-07-01', endDate: '2026-07-10', slots: 12, staff: 'Priya Singh', status: 'Pending' },
  { id: 3, name: 'Hampta Pass', location: 'Himachal Pradesh', difficulty: 'Moderate', startDate: '2026-06-20', endDate: '2026-06-26', slots: 20, staff: 'Amit Verma', status: 'Open' },
  { id: 4, name: 'Valley of Flowers', location: 'Uttarakhand', difficulty: 'Easy', startDate: '2026-07-15', endDate: '2026-07-19', slots: 25, staff: null, status: 'Pending' },
  { id: 5, name: 'Pin Parvati', location: 'Himachal Pradesh', difficulty: 'Hard', startDate: '2026-08-01', endDate: '2026-08-12', slots: 10, staff: 'Ravi Kumar', status: 'Closed' },
];

const ADMIN_STAFF_LIST = [
  { id: 1, name: 'Ravi Kumar', contact: 'ravi@trailsync.com', treks: ['Kedarkantha', 'Pin Parvati'], active: true },
  { id: 2, name: 'Priya Singh', contact: 'priya@trailsync.com', treks: ['Roopkund Lake'], active: true },
  { id: 3, name: 'Amit Verma', contact: 'amit@trailsync.com', treks: ['Hampta Pass'], active: true },
  { id: 4, name: 'Sunita Rao', contact: 'sunita@trailsync.com', treks: [], active: false },
];

const ADMIN_USERS = [
  { id: 1, name: 'Aryan Mehta', email: 'aryan@mail.com', registered: '2026-01-10', bookings: 3, blacklisted: false },
  { id: 2, name: 'Sneha Rao', email: 'sneha@mail.com', registered: '2026-02-14', bookings: 5, blacklisted: false },
  { id: 3, name: 'Dev Nair', email: 'dev@mail.com', registered: '2026-01-28', bookings: 1, blacklisted: true },
  { id: 4, name: 'Riya Joshi', email: 'riya@mail.com', registered: '2026-03-05', bookings: 7, blacklisted: false },
];

const ADMIN_BOOKINGS = [
  { id: 1001, user: 'Aryan Mehta', trek: 'Kedarkantha', date: '2026-05-20', status: 'Booked', paid: true },
  { id: 1002, user: 'Sneha Rao', trek: 'Roopkund Lake', date: '2026-05-19', status: 'Booked', paid: false },
  { id: 1003, user: 'Dev Nair', trek: 'Hampta Pass', date: '2026-05-18', status: 'Cancelled', paid: false },
  { id: 1004, user: 'Riya Joshi', trek: 'Valley of Flowers', date: '2026-05-17', status: 'Completed', paid: true },
  { id: 1005, user: 'Kabir Shah', trek: 'Pin Parvati', date: '2026-05-16', status: 'Booked', paid: true },
];

const POPULAR_TREKS = [
  { name: 'Kedarkantha', bookings: 142 },
  { name: 'Roopkund Lake', bookings: 98 },
  { name: 'Hampta Pass', bookings: 87 },
  { name: 'Valley of Flowers', bookings: 75 },
  { name: 'Pin Parvati', bookings: 54 },
];
