import { createApp } from 'vue';
import App from './App.vue';
import router from './router';

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
window.fetch = function (input, init = {}) {
  const url = typeof input === 'string' ? input : input.url;
  if (url && (url.startsWith('/api/') || url.includes('localhost:8000/api/'))) {
    const token = localStorage.getItem('ts_token');
    if (token) {
      init.headers = {
        ...(init.headers || {}),
        'Authorization': `Bearer ${token}`,
      };
    }
  }
  return _originalFetch(input, init);
};

const app = createApp(App);
app.use(router);
app.mount('#app');
