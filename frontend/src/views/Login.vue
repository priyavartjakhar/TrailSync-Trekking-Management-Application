<template>
  <div id="login-root" :class="'theme-' + role">
<div class="register-bg"></div>

    
    <div class="auth-top-header">
      <a href="/" class="brand-name-link">Trail<span>Sync</span></a>
      <a href="/" class="ts-btn-home"><i class="bi bi-house-door"></i> Home</a>
    </div>

    
    <div class="login-page-wrap d-flex align-items-center justify-content-center min-vh-100">

      <div class="auth-card-wrap" style="margin-top: 3.5rem;">
        <div class="auth-card theme-login-modal" :class="'theme-' + role">

          
          <div class="text-center mb-4">
            <a href="/" class="brand-name-link">Trail<span>Sync</span></a>
            <p class="brand-tagline-modal">Every summit begins with a single step.</p>
          </div>

          
          <div class="role-tabs mb-4" role="tablist" aria-label="Login role">
            <button class="role-tab" :class="{ active: role === 'trekker' }" @click="setRole('trekker')" role="tab">
              <span class="role-icon"><i class="bi bi-compass"></i></span>
              <span>Trekker</span>
            </button>
            <button class="role-tab" :class="{ active: role === 'staff' }" @click="setRole('staff')" role="tab">
              <span class="role-icon"><i class="bi bi-person-badge"></i></span>
              <span>Staff</span>
            </button>
            <button class="role-tab" :class="{ active: role === 'admin' }" @click="setRole('admin')" role="tab">
              <span class="role-icon"><i class="bi bi-shield-lock"></i></span>
              <span>Admin</span>
            </button>
          </div>

          
          <transition name="auth-fade" mode="out-in">
            <div :key="role">
              
              <div class="card-heading mb-4">
                <p class="auth-eyebrow">Welcome back</p>
                <h1 class="auth-title">{{ roleLabel }} Sign In</h1>
                <p class="auth-subtitle" v-if="role === 'trekker'">Book your next adventure.</p>
                <p class="auth-subtitle" v-else-if="role === 'staff'">Manage your assigned treks.</p>
                <p class="auth-subtitle" v-else>Full system access.</p>
              </div>

              <div style="background: rgba(212, 150, 42, 0.1); border: 1px solid rgba(212, 150, 42, 0.25); border-radius: 6px; padding: 0.5rem; margin-bottom: 1.25rem; font-size: 0.78rem; color: #e5a93c; text-align: center; font-weight: 500;">
                ⚠️ Note: Only trekkers can self-register. Staff accounts are created by the system administrator.
              </div>

              
              <div class="error-banner" v-if="error" role="alert">
                <span class="error-icon" aria-hidden="true"><i class="bi bi-exclamation-triangle"></i></span>
                {{ error }}
              </div>

              
              <form @submit.prevent="handleLogin" novalidate>
                <div class="form-field mb-3">
                  <label for="email" class="field-label">Email address</label>
                  <input id="email"
                         type="email"
                         class="ts-input"
                         :class="{ 'is-invalid': v.email }"
                         v-model="form.email"
                         placeholder="you@example.com"
                         autocomplete="email"
                         required />
                  <div class="invalid-msg" v-if="v.email">{{ v.email }}</div>
                </div>

                <div class="form-field mb-3">
                  <div class="d-flex justify-content-between align-items-center mb-1">
                    <label for="password" class="field-label">Password</label>
                    <a href="/forgot-password" class="forgot-link">Forgot password?</a>
                  </div>
                  <div class="password-wrap">
                    <input id="password"
                           :type="showPass ? 'text' : 'password'"
                           class="ts-input"
                           :class="{ 'is-invalid': v.password }"
                           v-model="form.password"
                           placeholder="••••••••"
                           autocomplete="current-password"
                           required />
                    <button type="button" class="pass-toggle" @click="showPass = !showPass" :aria-label="showPass ? 'Hide password' : 'Show password'">
                      <i :class="showPass ? 'bi bi-eye-slash' : 'bi bi-eye'"></i>
                    </button>
                  </div>
                  <div class="invalid-msg" v-if="v.password">{{ v.password }}</div>
                </div>

                <div class="form-check mb-4" v-if="role === 'trekker'">
                  <input class="form-check-input ts-check" type="checkbox" id="rememberMe" v-model="form.remember" />
                  <label class="form-check-label check-label" for="rememberMe">Keep me signed in</label>
                </div>

                <button type="submit" class="ts-btn-submit" :disabled="loading">
                  <span v-if="!loading">SIGN IN AS {{ roleLabel.toUpperCase() }}</span>
                  <span v-else class="loading-dots">
                    <span></span><span></span><span></span>
                  </span>
                </button>
              </form>

              <div class="auth-footer mt-3" v-if="role !== 'trekker'">
                <p class="footer-text footer-muted text-center m-0">
                  {{ role === 'admin' ? 'Admin accounts cannot be self-registered.' : 'Staff accounts are created by the Admin.' }}
                </p>
              </div>
            </div>
          </transition>

          
          <div class="auth-card-nav mt-4 pt-3 text-center" style="border-top: 1px solid rgba(255, 255, 255, 0.08);">
            <p class="footer-text">
              Not registered?
              <a href="/register" class="footer-link" style="font-weight: 600; font-size: 0.84rem;"><i class="bi bi-person-plus"></i> Register as trekker</a>
            </p>
          </div>

        </div>

        
        <div class="register-footer mt-4 text-center">
          <p class="brand-legal">© 2025 TrailSync. All rights reserved.</p>
        </div>
      </div>

    </div>
  </div>
</template>

<script>
import { ref, computed, onBeforeUnmount, reactive, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';

export default {
  name: 'TsLogin',
  setup() {
    const router = useRouter();
    const route = useRoute();
/* ── Role management ── */
    const roles = [
      { value: 'trekker', label: 'Trekker' },
      { value: 'staff',   label: 'Staff'   },
      { value: 'admin',   label: 'Admin'   },
    ];

    function normalizeIncomingRole(input) {
      if (input === 'user' || input === 'trekker') return 'trekker';
      if (input === 'staff' || input === 'admin') return input;
      return '';
    }

    function resolveDashboardPath(input) {
      const normalized = normalizeIncomingRole(input);
      if (normalized === 'admin') return '/admin';
      if (normalized === 'staff') return '/staff';
      return '/dashboard';
    }

    function syncRoleFromRoute() {
      const qRole = route.query.role;
      const pRole = route.params.role;
      const nextRole = normalizeIncomingRole(qRole || pRole);
      if (nextRole) {
        role.value = nextRole;
      }
    }

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
            role:     role.value,
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
          localStorage.setItem('ts_role', data.role || (role.value === 'trekker' ? 'user' : role.value));
        }

        /* Force admin dashboard tab on admin login */
        if (role.value === 'admin') {
          localStorage.setItem('adminActiveTab', 'dashboard');
        } else if (role.value === 'trekker') {
          localStorage.setItem('userActiveTab', 'dashboard');
        }

        /* Redirect to role dashboard */
        const dest = data.redirect || resolveDashboardPath(data.role || role.value);
        router.push(dest);

      } catch (err) {
        console.error('Login error:', err);
        error.value = 'Unable to reach the server. Please try again.';
      } finally {
        loading.value = false;
      }
    }

    const stopRouteWatch = watch(
      () => [route.query.role, route.params.role],
      () => syncRoleFromRoute(),
      { immediate: true }
    );

    onBeforeUnmount(() => {
      stopRouteWatch();
    });

    return {
      roles, role, roleLabel,
      form, showPass, loading, error, v,
      setRole, handleLogin,
    };
  }
};
</script>
