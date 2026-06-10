// ============================================================
//  staff_app.js — Vue 3 app entry point for Staff Panel
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

// Register staff layout globally
app.component('ts-staff-layout', TsStaffLayout);

app.mount('#app');
