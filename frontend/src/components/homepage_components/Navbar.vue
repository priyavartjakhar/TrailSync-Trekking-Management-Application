<template>
  <nav :class="['ts-nav', { scrolled }]" id="navbar">
    <a href="/" class="brand-name">Trail<span>Sync</span></a>
    <ul class="nav-links d-none d-lg-flex">
      <li><a href="/#treks">Explore Treks</a></li>
      <li><a href="/#map-section">Trek Map</a></li>
      <li><a href="/#difficulty">Difficulty Guide</a></li>
      <li><a href="/#safety">Safety</a></li>
      <li><a href="/#faq">FAQ</a></li>
    </ul>
    <div class="nav-actions">
      <div class="nav-dropdown">
        <a href="#" class="btn-ghost dropdown-toggle-ts" @click.prevent="handleLoginClick('trekker')">Log In</a>
        <div class="dropdown-menu-ts">
          <a href="#" class="dropdown-item-ts" @click.prevent="handleLoginClick('admin')">Admin Login</a>
          <a href="#" class="dropdown-item-ts" @click.prevent="handleLoginClick('staff')">Staff Login</a>
          <a href="#" class="dropdown-item-ts" @click.prevent="handleLoginClick('trekker')">Trekker Login</a>
        </div>
      </div>
      <a href="#" @click.prevent="$router.push('/register')" class="btn-primary-ts">Join Free</a>
    </div>
  </nav>
</template>

<script>
/**
 * =========================================================================
 * Navbar.vue
 * =========================================================================
 * Main header navigation bar providing anchor links to details sections and direct access to authentication endpoints.
 * 
 * Part of the public landing page components. Renders static descriptions
 * and interactive catalog sections prior to authentication.
 */

export default {
  name: 'Navbar',
  data() { return { scrolled: false }; },
  mounted() {
    window.addEventListener('scroll', this.onScroll);
  },
  unmounted() {
    window.removeEventListener('scroll', this.onScroll);
  },
  methods: {
    onScroll() { this.scrolled = window.scrollY > 80; },
    clearAuthState() {
      localStorage.removeItem('ts_token');
      localStorage.removeItem('ts_role');
      localStorage.removeItem('adminActiveTab');
      localStorage.removeItem('staffActiveTab');
      localStorage.removeItem('userActiveTab');
    },
    handleLoginClick(role) {
      this.clearAuthState();
      this.$router.push(`/login?role=${role}&fresh=1`);
    }
  }
};
</script>
