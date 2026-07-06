// ============================================================
//  user_data.js — Initial state and mock data for trekker panel
//  All exports are reactive starting values populated at runtime
//  by the UserDashboard component via API calls.
// ============================================================

// ── Trekker Display Name ──────────────────────────────────────
// The logged-in trekker's display name, shown in the dashboard
// header. Populated from the profile API response on load.
export const USER_INITIAL_NAME = '';

// ── Available Treks ───────────────────────────────────────────
// Treks currently open for booking, fetched from the API.
// Each entry contains trek details (name, date, slots, price, etc.)
// and is displayed in the "Browse Treks" panel.
export const USER_AVAILABLE_TREKS = [];

// ── My Bookings ───────────────────────────────────────────────
// Active / upcoming bookings made by this trekker.
// Displayed in the "My Bookings" tab with status indicators.
export const USER_MY_BOOKINGS = [];

// ── Trek History ──────────────────────────────────────────────
// Past (completed) treks for this trekker, used to populate
// the history panel and inform achievement progress.
export const USER_TREK_HISTORY = [];

// ── User Profile (Initial State) ──────────────────────────────
// Default shape of the trekker profile object, used as the
// v-model binding before the API response is received.
// All fields start empty to prevent stale data from showing.
export const USER_INITIAL_PROFILE = {
  memberId:  '',  // Unique trekker ID (e.g. 'TRK-0117')
  name:      '',  // Full display name
  email:     '',  // Contact email address
  phone:     '',  // Contact phone number
  city:      '',  // Home city
  emergency: '',  // Emergency contact (name and/or number)
  bio:       ''   // Short personal bio shown on the profile card
};

// ── Achievements / Badges ─────────────────────────────────────
// Static definition of all unlockable badges in the app.
// 'earned' starts as false for every achievement; it is set to
// true at runtime when the user's trek history satisfies each
// badge's unlock condition (resolved by the backend).
//
// Achievement shape:
//   id    — Unique numeric identifier
//   icon  — Emoji icon displayed on the badge card
//   name  — Short achievement title
//   desc  — Unlock condition description shown to the user
//   earned — Whether this trekker has unlocked the badge
export const USER_ACHIEVEMENTS = [
  { id: 1, icon: '🏔️', name: 'First Summit',  desc: 'Complete your 1st trek',     earned: false },
  { id: 2, icon: '🌄', name: 'Trail Blazer',  desc: '5 treks completed',           earned: false },
  { id: 3, icon: '❄️', name: 'Snow Walker',   desc: 'Trek in winter',              earned: false },
  { id: 4, icon: '🦅', name: 'Eagle Eye',     desc: 'Reach 4000m+',               earned: false },
  { id: 5, icon: '🗺️', name: 'Explorer',      desc: '3 different states',          earned: false },
  { id: 6, icon: '🏕️', name: 'Camp Expert',   desc: '10 nights outdoors',          earned: false },
  { id: 7, icon: '⛰️', name: 'Hard Core',     desc: 'Complete a Hard trek',        earned: false },
  { id: 8, icon: '🌟', name: 'Legend',        desc: '15 treks total',              earned: false },
  { id: 9, icon: '📸', name: 'Photographer',  desc: 'Upload 10 photos',            earned: false },
];
