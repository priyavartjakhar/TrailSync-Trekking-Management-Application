// ============================================================
//  user_app.js — Vue 3 app entry point for Trekker Dashboard
// ============================================================

const { createApp } = Vue;

const app = createApp({
  methods: {
    async handleLogout() {
      try {
        const res = await fetch('/api/auth/logout', { method: 'POST' });
        if (res.ok) {
          window.location.href = '/';
        }
      } catch (e) {
        console.error('Logout error:', e);
        window.location.href = '/';
      }
    }
  }
});

// Register the user layout component globally
app.component('ts-user-layout', TsUserLayout);

// Mount the app
app.mount('#app');
