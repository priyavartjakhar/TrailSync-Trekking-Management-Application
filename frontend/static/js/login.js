/* ============================================================
   login.js — TrailSync Login Page Vue 3 App (CDN)
   ============================================================ */

const { createApp, ref, computed, onMounted, reactive } = Vue;

createApp({
  setup() {
    /* ── Role management ── */
    const roles = [
      { value: 'trekker', label: 'Trekker' },
      { value: 'staff',   label: 'Staff'   },
      { value: 'admin',   label: 'Admin'   },
    ];

    const role = ref('trekker');
    const roleLabel = computed(() => {
      const r = roles.find(r => r.value === role.value);
      return r ? r.label : 'Trekker';
    });

    function setRole(val) {
      role.value = val;
      error.value = '';
      v.email = '';
      v.password = '';
    }

    /* ── Form state ── */
    const form = ref({ email: '', password: '', remember: false });
    const showPass = ref(false);
    const loading  = ref(false);
    const error    = ref('');

    /* ── Inline validation errors ── */
    const v = reactive({ email: '', password: '' });

    function validateForm() {
      let ok = true;
      v.email    = '';
      v.password = '';

      if (!form.value.email.trim()) {
        v.email = 'Email is required.'; ok = false;
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.value.email)) {
        v.email = 'Enter a valid email address.'; ok = false;
      }

      if (!form.value.password) {
        v.password = 'Password is required.'; ok = false;
      } else if (form.value.password.length < 6) {
        v.password = 'Password must be at least 6 characters.'; ok = false;
      }

      return ok;
    }

    /* ── Unified authentication API ── */
    const ENDPOINT = '/api/auth/login';

    async function handleLogin() {
      error.value = '';
      if (!validateForm()) return;

      loading.value = true;
      try {
        const res = await fetch(ENDPOINT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email:    form.value.email.trim().toLowerCase(),
            password: form.value.password,
            remember: form.value.remember,
          }),
          credentials: 'include',
        });

        const data = await res.json();

        if (!res.ok) {
          error.value = data.error || 'Invalid credentials. Please try again.';
          return;
        }

        /* Store JWT token if returned */
        if (data.token) {
          localStorage.setItem('ts_token', data.token);
          localStorage.setItem('ts_role',  data.role || role.value);
        }

        /* Force admin dashboard tab on admin login */
        if (role.value === 'admin') {
          localStorage.setItem('adminActiveTab', 'dashboard');
        } else if (role.value === 'trekker') {
          localStorage.setItem('userActiveTab', 'dashboard');
        }

        /* Redirect to role dashboard */
        window.location.href = data.redirect || (role.value === 'trekker' ? '/dashboard' : '/' + role.value);

      } catch (err) {
        console.error('Login error:', err);
        error.value = 'Unable to reach the server. Please try again.';
      } finally {
        loading.value = false;
      }
    }

    onMounted(() => {
      const params = new URLSearchParams(window.location.search);
      const r = params.get('role');
      if (r && ['admin', 'staff', 'trekker'].includes(r)) {
        role.value = r;
      } else {
        const pathParts = window.location.pathname.split('/');
        const lastPart = pathParts[pathParts.length - 1];
        if (['admin', 'staff', 'trekker'].includes(lastPart)) {
          role.value = lastPart;
        }
      }
    });

    return {
      roles, role, roleLabel,
      form, showPass, loading, error, v,
      setRole, handleLogin,
    };
  }
}).mount('#app');
