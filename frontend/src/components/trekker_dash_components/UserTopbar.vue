<template>
  <div class="ts-topbar" :class="{ 'sidebar-closed': sidebarCollapsed }">
    <button v-if="sidebarCollapsed" class="btn-sidebar-open" @click="$emit('open-sidebar')" title="Open Sidebar">
      <svg viewBox="0 0 24 24"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
    </button>
    <div class="topbar-brand-group">
      <template v-if="sidebarCollapsed">
        <span class="topbar-logo-text" @click="goTab('dashboard')">Trail<span>Sync</span></span>
      </template>
      <template v-else>
        <div class="topbar-breadcrumb">
          TrailSync / <span>{{ activeTab === 'dashboard' ? 'Home' : (activeTab.charAt(0).toUpperCase() + activeTab.slice(1)) }}</span>
        </div>
      </template>
    </div>
    <div class="topbar-spacer"></div>
    <div class="topbar-search">
      <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" fill="none" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
      <input 
        :value="searchQuery" 
        @input="$emit('update:searchQuery', $event.target.value)" 
        type="text" 
        placeholder="Search treks…" 
        @keyup.enter="goTab('explore')" 
      />
    </div>
    <div class="topbar-actions">
      <!-- Staff-style profile dropdown -->
      <div class="topbar-profile" style="position: relative;" ref="profileDropdown">
        <button class="topbar-profile-btn" @click="showProfileDropdown = !showProfileDropdown" title="Profile">
          <div class="topbar-avatar">
            <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" fill="none" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
          </div>
          <span class="topbar-profile-name">{{ firstName }}</span>
          <svg viewBox="0 0 24 24" width="10" height="10" stroke="currentColor" fill="none" stroke-width="2" style="margin-left: 4px; opacity: 0.7;"><polyline points="6 9 12 15 18 9"/></svg>
        </button>

        <div v-if="showProfileDropdown" class="profile-dropdown" @click.stop>
          <div class="profile-dropdown-header">
            <div class="pd-avatar">
              <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" fill="none" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            </div>
            <div>
              <div class="pd-name">{{ profile.name }}</div>
              <div class="pd-id">ID: TSM#{{ String(profile.id || 0).padStart(3, '0') }}</div>
            </div>
          </div>
          <div class="pd-email"><i class="bi bi-envelope-fill me-2"></i>{{ profile.email || 'Not provided' }}</div>
          <div class="pd-email"><i class="bi bi-telephone-fill me-2"></i>{{ profile.phone || 'Not provided' }}</div>
          <div class="pd-divider"></div>
          <a class="pd-item" href="#" @click.prevent="goTab('profile')">
            <i class="bi bi-person-fill me-2"></i>Edit Profile
          </a>
          <a class="pd-item pd-signout" href="#" @click.prevent="$emit('logout')">
            <i class="bi bi-box-arrow-right me-2"></i>Sign Out
          </a>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'UserTopbar',
  props: {
    activeTab: { type: String, required: true },
    sidebarCollapsed: { type: Boolean, default: false },
    profile: { type: Object, required: true },
    searchQuery: { type: String, default: '' }
  },
  emits: ['open-sidebar', 'change-tab', 'logout', 'update:searchQuery'],
  data() {
    return {
      showProfileDropdown: false
    };
  },
  computed: {
    firstName() {
      if (!this.profile.name) return 'Trekker';
      return this.profile.name.split(' ')[0];
    }
  },
  mounted() {
    document.addEventListener('click', this.handleClickOutside);
  },
  beforeUnmount() {
    document.removeEventListener('click', this.handleClickOutside);
  },
  methods: {
    goTab(tab) {
      this.$emit('change-tab', tab);
      this.showProfileDropdown = false;
    },
    handleClickOutside(e) {
      if (this.$refs.profileDropdown && !this.$refs.profileDropdown.contains(e.target)) {
        this.showProfileDropdown = false;
      }
    }
  }
};
</script>
