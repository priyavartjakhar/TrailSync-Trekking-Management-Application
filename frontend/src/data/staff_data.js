// ============================================================
//  staff_data.js — Initial state and mock data for staff panel
//  All exports are reactive starting values populated at runtime
//  by the StaffDashboard component via API calls.
// ============================================================

// ── Staff Display Name ────────────────────────────────────────
// The logged-in staff member's display name, shown in the
// dashboard header. Set to empty string until the profile
// is fetched from the API.
export const STAFF_INITIAL_NAME = '';

// ── Assigned Treks ────────────────────────────────────────────
// Treks currently assigned to this staff member as a guide.
// Each entry contains trek details (name, date, slots, etc.).
export const STAFF_ASSIGNED_TREKS = [];

// ── Participants List ─────────────────────────────────────────
// Trekkers enrolled in the staff member's active treks.
// Used to render the participants management panel.
export const STAFF_PARTICIPANTS = [];

// ── Activity Log ──────────────────────────────────────────────
// Recent actions performed by or involving this staff member
// (e.g. check-ins completed, notes added, bookings confirmed).
export const STAFF_ACTIVITY_LOG = [];

// ── Staff Profile (Initial State) ─────────────────────────────
// Default shape of the staff profile object used as the
// v-model binding before the API response is received.
// All string fields start empty; booleans reflect safe defaults.
export const STAFF_PROFILE_INITIAL = {
  memberId: '',           // Unique staff member ID (e.g. 'STF-0042')
  name: '',              // Full display name
  email: '',             // Contact email address
  phone: '',             // Contact phone number
  city: '',              // City / base location
  joined: '',            // Account creation / joining date (ISO string)
  active: true,          // Whether the staff member is currently active
  blacklisted: false,    // Whether the account has been flagged by admin
  designation: '',       // Job title (e.g. 'Senior Trek Guide')
  certifications: '',    // Comma-separated certifications (e.g. 'WFA, CPR')
  languages: '',         // Languages spoken (comma-separated)
  skills: '',            // Relevant skills (e.g. 'Navigation, First Aid')
  experienceYears: 0,    // Years of professional trekking experience
  completedTreksCount: 0, // Total number of treks completed as a guide
  photoUrl: '',          // URL to the profile photo
  status: '',            // Account status label (e.g. 'Active', 'On Leave')
  customBlockedDates: '', // Dates the staff member is unavailable (comma-sep)
  bio: ''                // Free-text personal / professional biography
};

// ── Pre-Trek Checklist Defaults ───────────────────────────────
// Standard equipment checklist sent to trekkers before each trek.
// Staff can customise this list per assignment; these are the
// application-wide defaults used as a starting template.
export const CHECKLIST_DEFAULTS = [
  'Trekking boots (ankle support)',
  'Warm jacket & thermals',
  'Rain poncho / windproof jacket',
  'Sun cream SPF 50+',
  'Personal first aid kit',
  'Water bottle (2L minimum)',
  'Energy bars / dry fruits',
  'Trekking poles (recommended)',
  'Head torch with extra batteries',
  'Government-issued photo ID',
];
