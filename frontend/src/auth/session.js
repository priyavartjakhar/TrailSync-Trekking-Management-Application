export function normalizeRole(role) {
  if (role === 'user' || role === 'trekker') return 'trekker';
  return role || '';
}

export function decodeTokenPayload(token) {
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
  return normalizeRole(decodeTokenPayload(token)?.role);
}

export function getStoredRole() {
  return normalizeRole(localStorage.getItem('ts_role'));
}

export function getSessionRole() {
  return getTokenRole() || getStoredRole();
}

export function clearAuthState() {
  localStorage.removeItem('ts_token');
  localStorage.removeItem('ts_role');
  localStorage.removeItem('adminActiveTab');
  localStorage.removeItem('staffActiveTab');
  localStorage.removeItem('userActiveTab');
}

export function isAuthFailurePayload(payload) {
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
