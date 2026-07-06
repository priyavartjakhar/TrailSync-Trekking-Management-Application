// ============================================================
//  auth/session.js — Client-side authentication state helpers
//  Provides utilities for:
//    • Role normalisation (mapping backend role strings to canonical values)
//    • JWT payload decoding (client-side only — no signature verification)
//    • Reading the current session role from storage
//    • Clearing all auth state on logout
//    • Detecting auth-failure API response payloads
// ============================================================

// ── normalizeRole ─────────────────────────────────────────────
// Converts any role string returned by the backend into the
// canonical role used throughout the frontend:
//   'user'    → 'trekker'  (legacy backend alias)
//   'trekker' → 'trekker'  (already canonical)
//   'admin'   → 'admin'    (unchanged)
//   'staff'   → 'staff'    (unchanged)
//   null/undefined/'' → '' (safe empty default)
export function normalizeRole(role) {
  // Treat legacy/alternate role strings consistently.
  // - Backend may return `user` instead of `trekker`
  // - Frontend uses `trekker` as the canonical role for `/dashboard`
  if (role === 'user' || role === 'trekker') return 'trekker';

  // Return role as-is when it's already `admin`/`staff`.
  // If role is null/undefined/empty, return empty string.
  return role || '';
}

// ── decodeTokenPayload ────────────────────────────────────────
// Decodes the payload segment (middle part) of a JWT string
// without verifying the signature. This is intentionally
// client-side only and is used solely to extract the role
// claim for routing decisions — never for security enforcement.
//
// Returns the parsed payload object, or null if the token is
// missing, malformed, or the payload cannot be parsed as JSON.
export function decodeTokenPayload(token) {
  // Decode the middle segment of a JWT (no signature verification here).
  // Used only for extracting role claims for client-side routing.
  if (!token || typeof token !== 'string') return null;

  const parts = token.split('.');

  // A valid JWT must have exactly 3 dot-separated segments
  if (parts.length < 2) return null;

  try {
    // Convert URL-safe Base64 (base64url) to standard Base64,
    // then pad to a multiple of 4 characters before decoding.
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
    return JSON.parse(window.atob(padded)); // Decode and parse JSON payload
  } catch (_err) {
    return null; // Token is corrupt or not a valid JWT — treat as missing
  }
}

// ── getTokenRole ──────────────────────────────────────────────
// Reads the role embedded in the stored JWT payload (ts_token).
// This is the primary and most reliable source of the current
// user's role; it reflects what the backend authenticated.
// Falls back to '' if the token is absent or invalid.
export function getTokenRole(token = localStorage.getItem('ts_token')) {
  // Prefer role from JWT payload. Falls back to '' if payload is invalid.
  return normalizeRole(decodeTokenPayload(token)?.role);
}

// ── getStoredRole ─────────────────────────────────────────────
// Reads the role from the explicit 'ts_role' localStorage key.
// This is used as a fallback when the token cannot be decoded
// (e.g. opaque / encrypted tokens from some backend configs).
export function getStoredRole() {
  return normalizeRole(localStorage.getItem('ts_role'));
}

// ── getSessionRole ────────────────────────────────────────────
// Returns the canonical role for the currently authenticated
// session. This is the single function that navigation guards
// and access-control logic should call.
//
// Resolution order:
//   1. Role extracted from the JWT payload  (ts_token)
//   2. Fallback role stored separately      (ts_role)
//   3. '' if neither is available
export function getSessionRole() {
  // Canonical role used by the router guards.
  // Order:
  // 1) role inside JWT (ts_token)
  // 2) fallback stored role (ts_role)
  return getTokenRole() || getStoredRole();
}

// ── clearAuthState ────────────────────────────────────────────
// Removes all authentication-related items from localStorage,
// forcing the navigation guards to treat the session as logged
// out on the next route navigation.
//
// Also clears per-dashboard tab persistence keys so each
// dashboard starts on its default tab after a fresh login.
export function clearAuthState() {
  // Clear local auth state so router guards will force re-login.
  // Also clears cached tab routes for each dashboard.
  localStorage.removeItem('ts_token');      // JWT access token
  localStorage.removeItem('ts_role');       // Explicit role fallback

  localStorage.removeItem('adminActiveTab');  // Last-active admin tab
  localStorage.removeItem('staffActiveTab');  // Last-active staff tab
  localStorage.removeItem('userActiveTab');   // Last-active user tab
}

// ── isAuthFailurePayload ──────────────────────────────────────
// Heuristically determines whether a JSON response body
// represents an authentication / authorisation failure.
// Called by the global fetch interceptor in main.js when a
// 401 or 403 response is received.
//
// The check is intentionally broad because different backend
// routes may use slightly different error message wording.
// Returns true if any known auth-failure keyword is found.
export function isAuthFailurePayload(payload) {
  // Used by callers to detect common auth failure responses.
  // This is intentionally heuristic: backend may vary the exact wording.
  const message = String(payload?.error || payload?.message || '').toLowerCase();

  return (
    message.includes('token') ||           // Expired / invalid token
    message.includes('authentication') ||  // Generic auth error
    message.includes('inactive') ||        // Account deactivated
    message.includes('blacklisted') ||     // Account banned
    message === 'unauthorized' ||          // Standard HTTP phrase
    message.includes('access denied')      // Permission denied
  );
}
