// ============================================================
//  router/index.js — Vue Router configuration for TrailSync
//  Handles route definitions, navigation guards, theme
//  switching, and session-aware redirects.
// ============================================================

import { createRouter, createWebHistory } from 'vue-router';
import Home from '../views/Home.vue';
import Login from '../views/Login.vue';
import Register from '../views/Register.vue';
import AdminDashboard from '../views/AdminDashboard.vue';
import StaffDashboard from '../views/StaffDashboard.vue';
import UserDashboard from '../views/UserDashboard.vue';
import { clearAuthState, getSessionRole, normalizeRole } from '../auth/session';

// ── Route Definitions ─────────────────────────────────────────
// Each route maps a URL path to a Vue component.
// '/admin/:tab_slug' allows deep-linking to a specific admin tab.
// '/login/:role' allows pre-selecting the login role from the URL.
const routes = [
  { path: '/', component: Home },               // Public home/landing page
  { path: '/login', component: Login },          // Login page (generic)
  { path: '/login/:role', component: Login },    // Login page with pre-selected role
  { path: '/register', component: Register },    // New user registration
  { path: '/admin', component: AdminDashboard }, // Admin dashboard (default tab)
  { path: '/admin/:tab_slug', component: AdminDashboard }, // Admin dashboard with specific tab
  { path: '/staff', component: StaffDashboard }, // Staff / guide dashboard
  { path: '/dashboard', component: UserDashboard } // Trekker / user dashboard
];

// ── Router Instance ───────────────────────────────────────────
// Use HTML5 History API (no hash in URLs).
const router = createRouter({
  history: createWebHistory(),
  routes
});

// ── Browser Back/Forward Detection ───────────────────────────
// Track whether the current navigation was triggered by the
// browser's back or forward button (popstate event).
// This is used to auto-logout when a user navigates away from
// a protected dashboard via the browser history buttons.
let isHistoryNavigation = false;

if (typeof window !== 'undefined') {
  window.addEventListener('popstate', () => {
    isHistoryNavigation = true; // Mark the next navigation as history-driven
  });
}

// ── Helper: getDashboardPath ──────────────────────────────────
// Returns the correct dashboard URL for a given role string.
// Accepts raw or normalized role values.
function getDashboardPath(role) {
  const normalizedRole = normalizeRole(role);
  if (normalizedRole === 'admin') return '/admin';
  if (normalizedRole === 'staff') return '/staff';
  return '/dashboard'; // Default: trekker / regular user
}

// ── Helper: isProtectedPath ───────────────────────────────────
// Returns true if the given URL path belongs to a dashboard
// that requires authentication (admin, staff, or user).
function isProtectedPath(path) {
  return path.startsWith('/admin') || path.startsWith('/staff') || path.startsWith('/dashboard');
}

// ── Helper: endBackendSession ─────────────────────────────────
// Sends a fire-and-forget POST request to the backend logout
// endpoint. Uses `keepalive: true` so the request completes
// even if the page is being unloaded. Errors are silently
// swallowed since this is a best-effort cleanup.
function endBackendSession(token = localStorage.getItem('ts_token')) {
  fetch('/api/auth/logout', {
    method: 'POST',
    credentials: 'include',
    keepalive: true, // Ensures request survives page unload
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  }).catch(() => {}); // Intentionally ignore errors
}

// ── Exported: logoutSession ───────────────────────────────────
// Public helper called by other modules to perform a full
// logout: invalidates the backend session and clears all
// client-side auth state (token, role, etc.).
export function logoutSession() {
  const token = localStorage.getItem('ts_token');
  endBackendSession(token);
  clearAuthState(); // Remove token and role from localStorage/sessionStorage
}

// ── Helper: updateThemeStylesheet ────────────────────────────
// Dynamically swaps the role-specific CSS stylesheet to avoid
// style collisions in SPA mode (since all views share one DOM).
// - If cssFile is provided: injects or updates the <link> tag.
// - If cssFile is null/undefined: removes the existing tag.
function updateThemeStylesheet(cssFile) {
  let link = document.getElementById('theme-stylesheet');
  if (cssFile) {
    if (link) {
      // Only update href if it has actually changed (avoids flicker)
      if (link.getAttribute('href') !== cssFile) {
        link.setAttribute('href', cssFile);
      }
    } else {
      // Create a new <link> element and inject it into <head>
      link = document.createElement('link');
      link.id = 'theme-stylesheet';
      link.rel = 'stylesheet';
      link.href = cssFile;
      document.head.appendChild(link);
    }
  } else {
    // No CSS required for this route — remove the element entirely
    if (link) {
      link.parentNode.removeChild(link);
    }
  }
}

// ── NAVIGATION GUARDS ─────────────────────────────────────────
// Runs before every route transition to:
//   1. Auto-logout if the user navigates away from a dashboard
//      using the browser history buttons.
//   2. Swap the active theme stylesheet for the target route.
//   3. Enforce role-based access control (redirect to login if
//      the user lacks the required token / role).
router.beforeEach((to, from, next) => {

  // ── Step 1: History-based logout ─────────────────────────
  // If the user pressed Back/Forward from a protected dashboard
  // to a public page, log them out automatically.
  const cameFromDashboard = isProtectedPath(from.path);
  const isLeavingDashboard = cameFromDashboard && !isProtectedPath(to.path);
  if (isHistoryNavigation && isLeavingDashboard) {
    logoutSession();
  }
  isHistoryNavigation = false; // Reset flag for the next navigation

  // ── Step 2: Theme stylesheet switching ───────────────────
  // Load the CSS file appropriate for the destination route.
  if (to.path.startsWith('/admin')) {
    updateThemeStylesheet('/static/css/admin.css');
  } else if (to.path.startsWith('/staff')) {
    updateThemeStylesheet('/static/css/staff.css');
  } else if (to.path.startsWith('/dashboard')) {
    updateThemeStylesheet('/static/css/user.css');
  } else if (to.path.startsWith('/login') || to.path === '/register') {
    updateThemeStylesheet('/static/css/auth.css');
  } else if (to.path === '/') {
    updateThemeStylesheet('/static/css/home.css');
  } else {
    updateThemeStylesheet(null); // Unknown route — remove any active theme
  }

  // ── Step 3: Role-based access control ────────────────────
  const token = localStorage.getItem('ts_token');     // JWT access token
  const normalizedRole = getSessionRole();             // 'admin' | 'staff' | 'trekker' | null

  if (to.path === '/login' || to.path.startsWith('/login/')) {
    // If arriving at login with a role param or 'fresh' flag,
    // clear any stale session first (handles role-switching).
    if (to.query.role || to.params.role || to.query.fresh === '1') {
      logoutSession();
    }
    next(); // Always allow access to the login page

  } else if (to.path.startsWith('/admin')) {
    // Admin dashboard: requires a valid token AND admin role
    if (!token || normalizedRole !== 'admin') {
      next('/login?role=admin'); // Redirect to admin login
    } else {
      next();
    }

  } else if (to.path.startsWith('/staff')) {
    // Staff dashboard: requires a valid token AND staff role
    if (!token || normalizedRole !== 'staff') {
      next('/login?role=staff'); // Redirect to staff login
    } else {
      next();
    }

  } else if (to.path.startsWith('/dashboard')) {
    // User dashboard: requires a valid token AND trekker role
    if (!token || normalizedRole !== 'trekker') {
      next('/login?role=trekker'); // Redirect to trekker login
    } else {
      next();
    }

  } else if (to.path === '/register' && token && normalizedRole) {
    // Already authenticated users visiting /register are
    // redirected to their own dashboard instead.
    next(getDashboardPath(normalizedRole));

  } else {
    next(); // Public route — allow navigation
  }
});

export default router;
