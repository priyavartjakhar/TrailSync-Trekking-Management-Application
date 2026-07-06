<template>
      <div class="ts-topbar">
        <!-- Menu Toggle Button for Mobile -->
        <button class="staff-mobile-menu-btn" @click="sidebarOpen = true">
          <i class="bi bi-list"></i>
        </button>
        <a v-if="sidebarCollapsed" class="topbar-brand-mini topbar-brand-left" href="#" @click.prevent="goTab('dashboard')">Trail<span>Sync</span></a>
        <div v-if="!sidebarCollapsed" class="topbar-breadcrumb">
          TrailSync / <span>{{ activeTab === 'dashboard' ? 'Home' : activeTab.charAt(0).toUpperCase() + activeTab.slice(1) }}</span>
        </div>
        <div class="topbar-spacer"></div>
        <!-- Profile dropdown -->
        <div class="topbar-profile" style="position: relative;">
          <button class="topbar-profile-btn" @click="profileDropdownOpen = !profileDropdownOpen">
            <div class="topbar-avatar">
              <img v-if="profilePhotoUrl" :src="profilePhotoUrl" :alt="staffProfile.name" />
              <span v-else>{{ staffInitial }}</span>
            </div>
            <span class="topbar-profile-name">{{ staffProfile.name ? staffProfile.name.split(' ')[0] : 'Staff' }}</span>
            <i class="bi bi-chevron-down" style="font-size: 0.7rem; margin-left: 4px; opacity: 0.7;"></i>
          </button>
          <!-- Dropdown overlay (closes on outside click) -->
          <div v-if="profileDropdownOpen" class="profile-dropdown-overlay" @click="profileDropdownOpen = false"></div>
          <!-- Dropdown -->
          <div v-if="profileDropdownOpen" class="profile-dropdown" @click.stop>
            <div class="profile-dropdown-header">
              <div class="pd-avatar">
                <img v-if="profilePhotoUrl" :src="profilePhotoUrl" :alt="staffProfile.name" />
                <span v-else>{{ staffInitial }}</span>
              </div>
              <div>
                <div class="pd-name">{{ staffProfile.name }}</div>
                <div class="pd-id">ID: {{ staffProfile.memberId || 'STF-001' }}</div>
              </div>
            </div>
            <div class="pd-email"><i class="bi bi-envelope-fill me-2"></i>{{ staffProfile.email || 'staff@trailsync.in' }}</div>
            <div class="pd-divider"></div>
            <a class="pd-item" @click="goTab('profile'); profileDropdownOpen = false">
              <i class="bi bi-person-fill me-2"></i>View Profile
            </a>
            <a class="pd-item pd-signout" @click="$emit('logout')">
              <i class="bi bi-box-arrow-right me-2"></i>Sign Out
            </a>
          </div>
        </div>
      </div>

      <div v-if="sidebarCollapsed" class="tab-context-bar">
        <div class="topbar-breadcrumb">
          TrailSync / <span>{{ activeTab === 'dashboard' ? 'Home' : activeTab.charAt(0).toUpperCase() + activeTab.slice(1) }}</span>
        </div>
      </div>
</template>

<script>
/**
 * =========================================================================
 * StaffTopbar.vue
 * =========================================================================
 * Top bar component displaying current guide credentials, navigation indicators, support tickets trigger, and user logout.
 * Uses 'staffDashComponent' options proxying to automatically route methods/state
 * read/writes directly to the parent 'StaffDashboard' instance.
 */

import { staffDashComponent } from './staffDashProxy';

export default staffDashComponent('StaffTopbar', { emits: ['logout'] });
</script>
