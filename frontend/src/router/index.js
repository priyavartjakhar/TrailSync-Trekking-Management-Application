import { createRouter, createWebHistory } from 'vue-router';
import Home from '../views/Home.vue';
import Login from '../views/Login.vue';
import Register from '../views/Register.vue';
import AdminDashboard from '../views/AdminDashboard.vue';
import StaffDashboard from '../views/StaffDashboard.vue';
import UserDashboard from '../views/UserDashboard.vue';
import { clearAuthState, getSessionRole, normalizeRole } from '../auth/session';

const routes = [
  { path: '/', component: Home },
  { path: '/login', component: Login },
  { path: '/login/:role', component: Login },
  { path: '/register', component: Register },
  { path: '/admin', component: AdminDashboard },
  { path: '/admin/:tab_slug', component: AdminDashboard },
  { path: '/staff', component: StaffDashboard },
  { path: '/dashboard', component: UserDashboard }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

let isHistoryNavigation = false;

if (typeof window !== 'undefined') {
  window.addEventListener('popstate', () => {
    isHistoryNavigation = true;
  });
}

function getDashboardPath(role) {
  const normalizedRole = normalizeRole(role);
  if (normalizedRole === 'admin') return '/admin';
  if (normalizedRole === 'staff') return '/staff';
  return '/dashboard';
}

function isProtectedPath(path) {
  return path.startsWith('/admin') || path.startsWith('/staff') || path.startsWith('/dashboard');
}

function endBackendSession(token = localStorage.getItem('ts_token')) {
  fetch('/api/auth/logout', {
    method: 'POST',
    credentials: 'include',
    keepalive: true,
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  }).catch(() => {});
}

export function logoutSession() {
  const token = localStorage.getItem('ts_token');
  endBackendSession(token);
  clearAuthState();
}

// Helper to switch stylesheets dynamically and avoid CSS collision in SPA mode
function updateThemeStylesheet(cssFile) {
  let link = document.getElementById('theme-stylesheet');
  if (cssFile) {
    if (link) {
      if (link.getAttribute('href') !== cssFile) {
        link.setAttribute('href', cssFile);
      }
    } else {
      link = document.createElement('link');
      link.id = 'theme-stylesheet';
      link.rel = 'stylesheet';
      link.href = cssFile;
      document.head.appendChild(link);
    }
  } else {
    if (link) {
      link.parentNode.removeChild(link);
    }
  }
}

// ── NAVIGATION GUARDS ───────────────────────────────────────
router.beforeEach((to, from, next) => {
  const cameFromDashboard = isProtectedPath(from.path);
  const isLeavingDashboard = cameFromDashboard && !isProtectedPath(to.path);
  if (isHistoryNavigation && isLeavingDashboard) {
    logoutSession();
  }
  isHistoryNavigation = false;

  // Dynamically load the dashboard-specific CSS and unload others
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
    updateThemeStylesheet(null);
  }

  const token = localStorage.getItem('ts_token');
  const normalizedRole = getSessionRole();

  if (to.path === '/login' || to.path.startsWith('/login/')) {
    if (to.query.role || to.params.role || to.query.fresh === '1') {
      logoutSession();
    }
    next();
  } else if (to.path.startsWith('/admin')) {
    if (!token || normalizedRole !== 'admin') {
      next('/login?role=admin');
    } else {
      next();
    }
  } else if (to.path.startsWith('/staff')) {
    if (!token || normalizedRole !== 'staff') {
      next('/login?role=staff');
    } else {
      next();
    }
  } else if (to.path.startsWith('/dashboard')) {
    if (!token || normalizedRole !== 'trekker') {
      next('/login?role=trekker');
    } else {
      next();
    }
  } else if (to.path === '/register' && token && normalizedRole) {
    next(getDashboardPath(normalizedRole));
  } else {
    next();
  }
});

export default router;
