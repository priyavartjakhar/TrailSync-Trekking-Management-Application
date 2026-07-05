import { createApp } from 'vue';
import App from './App.vue';
import router from './router';
import { clearAuthState, isAuthFailurePayload } from './auth/session';

// ── Unregister any stale Service Workers ─────────────────────────────────────
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    registrations.forEach((sw) => {
      sw.unregister();
      console.log('[TrailSync] Unregistered stale Service Worker:', sw.scope);
    });
  });
}

// ── Global fetch interceptor ─────────────────────────────────
const _originalFetch = window.fetch.bind(window);
function isApiUrl(url) {
  if (!url) return false;
  try {
    const parsed = new URL(url, window.location.origin);
    return parsed.pathname.startsWith('/api/') && (
      parsed.origin === window.location.origin ||
      parsed.host === 'localhost:8000' ||
      parsed.host === '127.0.0.1:8000'
    );
  } catch (_err) {
    return typeof url === 'string' && url.startsWith('/api/');
  }
}

window.fetch = async function (input, init = {}) {
  const url = typeof input === 'string' ? input : input.url;
  const isApiRequest = isApiUrl(url);

  if (isApiRequest) {
    const token = localStorage.getItem('ts_token');
    init.credentials = init.credentials || 'include';
    if (token) {
      init.headers = {
        ...(init.headers || {}),
        'Authorization': `Bearer ${token}`,
      };
    }
  }

  const response = await _originalFetch(input, init);

  if (isApiRequest && (response.status === 401 || response.status === 403)) {
    let payload = null;
    try {
      payload = await response.clone().json();
    } catch (_err) {
      payload = null;
    }

    if (response.status === 401 || isAuthFailurePayload(payload)) {
      clearAuthState();
      if (!window.location.pathname.startsWith('/login')) {
        router.replace('/login?fresh=1').catch(() => {});
      }
    }
  }

  return response;
};

const app = createApp(App);
app.use(router);
app.mount('#app');
