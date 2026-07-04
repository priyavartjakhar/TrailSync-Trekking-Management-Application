<template>
    <!-- ════════ SIDEBAR ════════ -->
    <aside class="ts-sidebar" :class="{ collapsed: sidebarCollapsed }">
      <div class="sidebar-brand">
        <a class="brand-name" href="#">Trail<span>Sync</span></a>
        <button class="sidebar-toggle" @click="sidebarCollapsed = !sidebarCollapsed" :title="sidebarCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'">
          <svg viewBox="0 0 24 24">
            <template v-if="sidebarCollapsed">
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <line x1="3" y1="12" x2="21" y2="12"></line>
              <line x1="3" y1="18" x2="21" y2="18"></line>
            </template>
            <template v-else>
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </template>
          </svg>
        </button>
      </div>

      <div class="sidebar-user sidebar-user-top">
        <div class="su-avatar">A</div>
        <div class="su-info">
          <div class="su-name">Admin</div>
          <div class="su-role">Superuser</div>
        </div>
      </div>

      <nav class="sidebar-nav">
        <div class="nav-section-label">Command Centre</div>
        <a class="nav-item" :class="{ active: activeTab==='dashboard' }" @click="activeTab='dashboard'">
          <svg viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>
          <span>Dashboard</span>
        </a>


        <div class="nav-section-label">Treks</div>
        <a class="nav-item" :class="{ active: activeTab==='treks' }" @click="activeTab='treks'">
          <svg viewBox="0 0 24 24"><path d="M3 17l4-8 4 4 4-6 4 10"/><path d="M3 20h18"/></svg>
          <span>Trek Routes</span>
        </a>
        <a class="nav-item" :class="{ active: activeTab==='batches' }" @click="activeTab='batches'">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
          <span>Trek Batches</span>
        </a>
        <a class="nav-item" :class="{ active: activeTab==='trek_history' }" @click="activeTab='trek_history'">
          <svg viewBox="0 0 24 24"><path d="M3 12a9 9 0 1 0 3-6.7"/><polyline points="3 3 3 9 9 9"/><polyline points="12 7 12 12 15 14"/></svg>
          <span>Trek History</span>
        </a>

        <div class="nav-section-label">Staff</div>
        <a class="nav-item" :class="{ active: activeTab==='staff' }" @click="activeTab='staff'">
          <svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>
          <span>Trek Staff</span>
        </a>
        <a class="nav-item" :class="{ active: activeTab==='staff_availability' }" @click="activeTab='staff_availability'">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line><path d="M8 14h.01"></path><path d="M12 14h.01"></path><path d="M16 14h.01"></path><path d="M8 18h.01"></path><path d="M12 18h.01"></path><path d="M16 18h.01"></path></svg>
          <span>Staff Availability</span>
        </a>

        <div class="nav-section-label">Users</div>
        <a class="nav-item" :class="{ active: activeTab==='users' }" @click="activeTab='users'">
          <svg viewBox="0 0 24 24"><circle cx="9" cy="8" r="3"/><path d="M2 19c0-3 3-5 7-5"/><circle cx="16" cy="10" r="3"/><path d="M13 19c0-3 2.7-5 6-5"/></svg>
          <span>Users</span>
        </a>
        <a class="nav-item" :class="{ active: activeTab==='bookings' }" @click="activeTab='bookings'">
          <svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
          <span>Bookings</span>
        </a>

        <div class="nav-section-label">Support</div>
        <a class="nav-item" :class="{ active: activeTab==='blacklist' }" @click="activeTab='blacklist'">
          <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>
          <span>Blacklisted Accounts</span>
        </a>
        <a class="nav-item" :class="{ active: activeTab==='support_tickets' }" @click="activeTab='support_tickets'">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
          <span>Support Tickets</span>
        </a>

        <div class="nav-section-label">Insights</div>
        <a class="nav-item" :class="{ active: activeTab==='analytics' }" @click="activeTab='analytics'">
          <svg viewBox="0 0 24 24"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
          <span>Analytics</span>
        </a>
        <a class="nav-item" :class="{ active: activeTab==='revenue' }" @click="activeTab='revenue'">
          <svg viewBox="0 0 24 24"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
          <span>Revenue</span>
        </a>
        <a class="nav-item" :class="{ active: activeTab==='reports' }" @click="activeTab='reports'">
          <svg viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
          <span>Reports</span>
        </a>

        <div class="nav-section-label">System</div>
        <a class="nav-item" :class="{ active: activeTab==='jobs' }" @click="activeTab='jobs'">
          <svg viewBox="0 0 24 24"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
          <span>Scheduled Jobs</span>
        </a>
      </nav>

      <div class="sidebar-signout">
        <button class="sidebar-signout-btn" title="Logout" @click="$emit('logout')">
          <svg viewBox="0 0 24 24"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
</template>

<script>
import { adminDashComponent } from './adminDashProxy';

export default adminDashComponent('AdminSidebar', { emits: ['logout'] });
</script>
