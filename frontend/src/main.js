// ============================================================
//  main.js — Application entry point for TrailSync Vue SPA
//  Responsibilities:
//    • Register / unregister the PWA service worker
//    • Install a global fetch interceptor that:
//        - Attaches the JWT auth token to every API request
//        - Handles 401/403 responses by clearing auth and
//          redirecting the user to the login page
//    • Bootstrap and mount the Vue application
// ============================================================

import { createApp } from 'vue';
import App from './App.vue';
import router from './router';
import { clearAuthState, isAuthFailurePayload } from './auth/session';

// ── PWA Service Worker ─────────────────────────────────────
// In production builds the service worker is registered so the
// app can work offline and cache static assets.
// In development builds any existing registrations are removed
// and TrailSync-specific caches are purged to prevent stale
// data from interfering with hot-module-replacement.
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  // PRODUCTION: register the compiled service worker
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js').catch((err) => {
      console.warn('[TrailSync] Service worker registration failed:', err);
    });
  });
} else if ('serviceWorker' in navigator) {
  // DEVELOPMENT: unregister all existing service workers
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    registrations.forEach((registration) => registration.unregister());
  });

  // Also purge any TrailSync-prefixed cache entries so the
  // browser always fetches fresh assets during development
  if ('caches' in window) {
    caches.keys().then((keys) => {
      keys
        .filter((key) => key.startsWith('trailsync-'))
        .forEach((key) => caches.delete(key));
    });
  }
}

// ── Global fetch interceptor ─────────────────────────────────
// We wrap the native window.fetch to transparently:
//   1. Attach the JWT Authorization header to every /api/* request
//   2. Detect 401 / 403 responses and clear auth state,
//      then redirect to /login if the user is not already there.
//
// NOTE: Only requests targeting the TrailSync backend (same
// origin or localhost:8000) are intercepted; third-party
// requests (e.g. Unsplash image URLs) pass through untouched.

const _originalFetch = window.fetch.bind(window); // Save the native fetch

// isApiUrl — returns true if the given URL targets the
// TrailSync Flask API (/api/ prefix on the expected hosts).
function isApiUrl(url) {
  if (!url) return false;
  try {
    const parsed = new URL(url, window.location.origin);
    return parsed.pathname.startsWith('/api/') && (
      parsed.origin === window.location.origin ||  // Same origin (production)
      parsed.host === 'localhost:8000' ||           // Local Flask dev server
      parsed.host === '127.0.0.1:8000'             // Loopback alias
    );
  } catch (_err) {
    // URL constructor failed — fall back to simple string check
    return typeof url === 'string' && url.startsWith('/api/');
  }
}

// Override window.fetch with an intercepting wrapper
window.fetch = async function (input, init = {}) {
  const url = typeof input === 'string' ? input : input.url;
  const isApiRequest = isApiUrl(url);

  // ── Step 1: Inject auth credentials ─────────────────────
  if (isApiRequest) {
    const token = localStorage.getItem('ts_token'); // Retrieve stored JWT
    init.credentials = init.credentials || 'include'; // Always send cookies

    if (token) {
      // Merge the Authorization header into whatever headers the
      // caller may have already provided
      init.headers = {
        ...(init.headers || {}),
        'Authorization': `Bearer ${token}`,
      };
    }
  }

  // Forward the (possibly modified) request to the real fetch
  const response = await _originalFetch(input, init);

  // ── Step 2: Handle authentication errors ─────────────────
  // Only inspect API responses; ignore non-API requests.
  if (isApiRequest && (response.status === 401 || response.status === 403)) {
    let payload = null;
    try {
      // Clone the response before reading it so the original
      // stream is still available to the caller
      payload = await response.clone().json();
    } catch (_err) {
      payload = null; // Response body is not JSON — that's fine
    }

    // Clear auth state and redirect if:
    //  • The status is 401 (Unauthorized), OR
    //  • The JSON body matches a known auth-failure shape
    if (response.status === 401 || isAuthFailurePayload(payload)) {
      clearAuthState(); // Remove token and role from storage

      // Avoid redirect loops by checking current path first
      if (!window.location.pathname.startsWith('/login')) {
        router.replace('/login?fresh=1').catch(() => {});
      }
    }
  }

  // Return the response (unmodified) to the original caller
  return response;
};

// ── Vue Application Bootstrap ─────────────────────────────────
// Create the root Vue app instance, register the router plugin,
// and mount it onto the #app element defined in index.html.
const app = createApp(App);
app.use(router); // Register vue-router for SPA navigation
app.mount('#app'); // Attach the app to the DOM
