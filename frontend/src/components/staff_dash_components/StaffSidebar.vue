<template>
    <aside class="ts-sidebar" :class="{ open: sidebarOpen, collapsed: sidebarCollapsed }">

      <!-- Sidebar header with toggle -->
      <div class="sidebar-header-row">
        <a class="brand-name" href="#">Trail<span>Sync</span></a>
        <button class="sidebar-toggle-btn" @click="sidebarCollapsed = !sidebarCollapsed; sidebarOpen = false" :title="sidebarCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'">
          <i v-if="!sidebarCollapsed" class="bi bi-x-lg"></i>
          <i v-else class="bi bi-list"></i>
        </button>
      </div>

      <!-- Staff chip (hidden when collapsed) -->
      <div class="sidebar-staff-chip" v-show="!sidebarCollapsed">
        <div class="staff-avatar">
          <img v-if="profilePhotoUrl" :src="profilePhotoUrl" :alt="staffProfile.name" />
          <span v-else>{{ staffInitial }}</span>
        </div>
        <div class="staff-chip-info">
          <div class="staff-chip-name">{{ staffProfile.name }}</div>
          <div class="staff-chip-role">{{ staffProfile.designation || 'Trek Staff' }}</div>
        </div>
      </div>

      <nav class="sidebar-nav">
        <div class="nav-section-label" v-show="!sidebarCollapsed">Operations</div>
        <a class="nav-item" :class="{ active: activeTab === 'dashboard' }" @click="goTab('dashboard')" :title="sidebarCollapsed ? 'Home' : ''">
          <i class="bi bi-house-door-fill nav-icon"></i>
          <span v-show="!sidebarCollapsed">Home</span>
        </a>
        <a class="nav-item" :class="{ active: activeTab === 'treks' }" @click="goTab('treks')" :title="sidebarCollapsed ? 'Assigned Treks' : ''">
          <i class="bi bi-map-fill nav-icon"></i>
          <span v-show="!sidebarCollapsed">Assigned Treks</span>
          <span class="nav-badge" v-show="!sidebarCollapsed">{{ activeAssignedTreks.length }}</span>
        </a>
        <a class="nav-item" :class="{ active: activeTab === 'participants' }" @click="goTab('participants')" :title="sidebarCollapsed ? 'Participants' : ''">
          <i class="bi bi-people-fill nav-icon"></i>
          <span v-show="!sidebarCollapsed">Participants</span>
        </a>
        <div class="nav-section-label" v-show="!sidebarCollapsed">Management</div>
        <a class="nav-item" :class="{ active: activeTab === 'exports' }" @click="goTab('exports')" :title="sidebarCollapsed ? 'Exports' : ''">
          <i class="bi bi-download nav-icon"></i>
          <span v-show="!sidebarCollapsed">Exports</span>
        </a>
        <div class="nav-section-label" v-show="!sidebarCollapsed">Communication</div>
        <a class="nav-item" :class="{ active: activeTab === 'social' }" @click="goTab('social')" :title="sidebarCollapsed ? 'TrailSync Social' : ''">
          <i class="bi bi-chat-left-text-fill nav-icon"></i>
          <span v-show="!sidebarCollapsed">TrailSync Social</span>
        </a>
        <div class="nav-section-label" v-show="!sidebarCollapsed">Helpdesk</div>
        <a class="nav-item" :class="{ active: activeTab === 'support' }" @click="goTab('support')" :title="sidebarCollapsed ? 'Support & Leaves' : ''">
          <i class="bi bi-question-circle-fill nav-icon"></i>
          <span v-show="!sidebarCollapsed">Support & Leaves</span>
        </a>
        <div class="nav-section-label" v-show="!sidebarCollapsed">Account</div>
        <a class="nav-item" :class="{ active: activeTab === 'profile' }" @click="goTab('profile')" :title="sidebarCollapsed ? 'My Profile' : ''">
          <i class="bi bi-person-fill nav-icon"></i>
          <span v-show="!sidebarCollapsed">My Profile</span>
        </a>
      </nav>

      <div class="sidebar-footer">
        <button class="btn-logout-sidebar" @click="$emit('logout')" :title="sidebarCollapsed ? 'Sign Out' : ''">
          <i class="bi bi-box-arrow-right nav-icon"></i>
          <span v-show="!sidebarCollapsed">Sign Out</span>
        </button>
      </div>
    </aside>
</template>

<script>
/**
 * =========================================================================
 * StaffSidebar.vue
 * =========================================================================
 * Sidebar navigation panel for the Guide dashboard, providing collapsible menu tabs for assigned treks, rosters, profiling, and group chats.
 * Uses 'staffDashComponent' options proxying to automatically route methods/state
 * read/writes directly to the parent 'StaffDashboard' instance.
 */

import { staffDashComponent } from './staffDashProxy';

export default staffDashComponent('StaffSidebar', { emits: ['logout'] });
</script>
