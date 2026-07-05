export function normalizeRole(role) {
  // Treat legacy/alternate role strings consistently.
  // - Backend may return `user` instead of `trekker`
  // - Frontend uses `trekker` as the canonical role for `/dashboard`
  if (role === 'user' || role === 'trekker') return 'trekker';

  // Return role as-is when it's already `admin`/`staff`.
  // If role is null/undefined/empty, return empty string.
  return role || '';
}

export function decodeTokenPayload(token) {
  // Decode the middle segment of a JWT (no signature verification here).
  // Used only for extracting role claims for client-side routing.
  if (!token || typeof token !== 'string') return null;

  const parts = token.split('.');

  if (parts.length < 2) return null;

  try {
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
    return JSON.parse(window.atob(padded));
  } catch (_err) {
    return null;
  }
}

export function getTokenRole(token = localStorage.getItem('ts_token')) {
  // Prefer role from JWT payload. Falls back to '' if payload is invalid.
  return normalizeRole(decodeTokenPayload(token)?.role);
}


export function getStoredRole() {
  return normalizeRole(localStorage.getItem('ts_role'));
}

export function getSessionRole() {
  // Canonical role used by the router guards.
  // Order:
  // 1) role inside JWT (ts_token)
  // 2) fallback stored role (ts_role)
  return getTokenRole() || getStoredRole();
}


export function clearAuthState() {
  // Clear local auth state so router guards will force re-login.
  // Also clears cached tab routes for each dashboard.
  localStorage.removeItem('ts_token');
  localStorage.removeItem('ts_role');

  localStorage.removeItem('adminActiveTab');
  localStorage.removeItem('staffActiveTab');
  localStorage.removeItem('userActiveTab');
}


export function isAuthFailurePayload(payload) {
  // Used by callers to detect common auth failure responses.
  // This is intentionally heuristic: backend may vary the exact wording.
  const message = String(payload?.error || payload?.message || '').toLowerCase();

  return (
    message.includes('token') ||
    message.includes('authentication') ||
    message.includes('inactive') ||
    message.includes('blacklisted') ||
    message === 'unauthorized' ||
    message.includes('access denied')
  );
}
