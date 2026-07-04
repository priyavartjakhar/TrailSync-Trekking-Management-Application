<template>
  <aside class="ts-sidebar" :class="{ open: isDrawerVisible, collapsed: sidebarCollapsed }" :style="isDrawerVisible ? 'transform: translateX(0); pointer-events: auto;' : ''">
    <!-- Brand -->
    <div class="sidebar-brand">
      <span class="sidebar-brand-name">Trail<span>Sync</span></span>
      <button class="btn-sidebar-close" @click="$emit('close-sidebar')" title="Close Sidebar">
        <svg viewBox="0 0 24 24">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>
    </div>

    <!-- User chip -->
    <div class="sidebar-user">
      <div class="sidebar-avatar">
        <img v-if="profile.profile_image_url" :src="profile.profile_image_url" alt="avatar" style="width:100%; height:100%; object-fit:cover; border-radius:50%;" />
        <span v-else>{{ userInitial }}</span>
      </div>
      <div class="sidebar-user-info">
        <div class="sidebar-user-name">{{ profile.name }}</div>
        <div class="sidebar-user-role">Trekker</div>
      </div>
    </div>

    <!-- Nav -->
    <nav class="sidebar-nav">
      <div class="sidebar-section-label">Main</div>
      <div class="sidebar-nav-item" :class="{ active: activeTab === 'dashboard' }" @click="goTab('dashboard')">
        <svg viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round" width="16" height="16" stroke="currentColor" fill="none" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>
        <span>Home</span>
      </div>
      <div class="sidebar-nav-item" :class="{ active: activeTab === 'explore' }" @click="goTab('explore')">
        <svg viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round" width="16" height="16" stroke="currentColor" fill="none" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        <span>Explore Treks</span>
      </div>
      <div class="sidebar-nav-item" :class="{ active: activeTab === 'bookings' }" @click="goTab('bookings')">
        <svg viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round" width="16" height="16" stroke="currentColor" fill="none" stroke-width="2"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M16 2v4M8 2v4M3 10h18M10 16l2 2 4-4"/></svg>
        <span>My Bookings</span>
        <span v-if="bookedCount > 0" class="sidebar-badge">
          {{ bookedCount }}
        </span>
      </div>
      <div class="sidebar-nav-item" :class="{ active: activeTab === 'history' }" @click="goTab('history')">
        <svg viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round" width="16" height="16" stroke="currentColor" fill="none" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
        <span>Trek History</span>
      </div>
      <div class="sidebar-nav-item" :class="{ active: activeTab === 'social' }" @click="goTab('social')" style="position: relative;">
        <svg viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round" width="16" height="16" stroke="currentColor" fill="none" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
        <span>TrailSync Social</span>
        <span v-if="unreadCount > 0" class="social-notification-dot" style="position: absolute; top: 12px; right: 15px; width: 8px; height: 8px; background-color: #ef4444; border-radius: 50%;"></span>
      </div>

      <div class="sidebar-section-label" style="margin-top:0.5rem">Account</div>
      <div class="sidebar-nav-item" :class="{ active: activeTab === 'profile' }" @click="goTab('profile')">
        <svg viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round" width="16" height="16" stroke="currentColor" fill="none" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
        <span>My Profile</span>
      </div>
      <div class="sidebar-nav-item" :class="{ active: activeTab === 'support' }" @click="goTab('support')">
        <svg viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round" width="16" height="16" stroke="currentColor" fill="none" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
        <span>Support & Help</span>
      </div>
    </nav>

    <!-- Sidebar footer -->
    <div class="sidebar-footer">
      <button class="btn-logout-sidebar" @click="$emit('logout')">
        Sign Out
        <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" fill="none" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
      </button>
    </div>
  </aside>
</template>

<script>
export default {
  name: 'UserSidebar',
  props: {
    activeTab: { type: String, required: true },
    sidebarOpen: { type: Boolean, default: false },
    sidebarCollapsed: { type: Boolean, default: false },
    profile: { type: Object, required: true },
    myBookings: { type: Array, default: () => [] },
    unreadCount: { type: Number, default: 0 }
  },
  emits: ['close-sidebar', 'change-tab', 'logout'],
  computed: {
    isDrawerVisible() {
      return this.sidebarOpen || (!this.sidebarCollapsed && window.innerWidth > 900);
    },
    userName() {
      return this.profile.name || '';
    },
    userInitial() {
      return this.userName ? this.userName[0].toUpperCase() : '?';
    },
    bookedCount() {
      return this.myBookings.filter(b => b.status === 'Booked').length;
    }
  },
  methods: {
    goTab(tab) {
      this.$emit('change-tab', tab);
      if (window.innerWidth <= 900) {
        this.$emit('close-sidebar');
      }
    }
  }
};
</script>
