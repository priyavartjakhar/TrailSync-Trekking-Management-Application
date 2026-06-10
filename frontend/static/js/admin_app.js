// ============================================================
//  admin_app.js — Vue 3 app entry point for Admin Dashboard
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

// Register admin layout globally
app.component('ts-admin-layout', TsAdminLayout);

app.mount('#app');
