<template>
  <div class="ts-admin-layout">

    <AdminSidebar @logout="$emit('logout')" />

    <!-- Sidebar Overlay for mobile/tablet -->
    <div v-if="!sidebarCollapsed" class="sidebar-overlay" @click="sidebarCollapsed = true"></div>

    <!-- ════════ MAIN ════════ -->
    <main class="ts-main">
      <AdminTopbar @logout="$emit('logout')" />
      <TabDashboard v-if="activeTab==='dashboard'" />
      <TabTreks v-if="activeTab==='treks'" />
      <TabBatches v-if="activeTab==='batches'" />
      <TabStaff v-if="activeTab==='staff'" />
      <TabStaffAvailability v-if="activeTab==='staff_availability'" />
      <TabUsers v-if="activeTab==='users'" />
      <TabBookings v-if="activeTab==='bookings'" />
      <TabAnalytics v-if="activeTab==='analytics'" />
      <TabRevenue v-if="activeTab==='revenue'" />
      <TabReports v-if="activeTab==='reports'" />
      <TabJobs v-if="activeTab==='jobs'" />
      <TabBlacklist v-if="activeTab==='blacklist'" />
      <TabSupportTickets v-if="activeTab==='support_tickets'" />
      <TabTrekHistory v-if="activeTab==='trek_history'" />
    </main><!-- /ts-main -->

    <!-- ════════ CUSTOM CONFIRMATION MODAL ════════ -->
    <div v-if="showConfirmModal" class="ts-modal-overlay" @click.self="closeConfirmModal" style="z-index: 3000;">
      <div class="ts-modal" style="max-width: 400px;">
        <div class="ts-modal-header" style="border-bottom: none; padding-bottom: 0;">
          <h3 class="ts-modal-title" style="color: var(--red); display: flex; align-items: center; gap: 8px;">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
            <span>{{ confirmTitle }}</span>
          </h3>
          <button class="modal-close" @click="closeConfirmModal">✕</button>
        </div>
        <div class="ts-modal-body" style="padding-top: 1rem; padding-bottom: 1.5rem; font-size: 0.9rem; color: var(--forest-mid);">
          {{ confirmMessage }}
        </div>
        <div class="ts-modal-footer" style="background: var(--snow); border-top: 1px solid var(--stone-light);">
          <button class="btn-ghost" @click="closeConfirmModal">Cancel</button>
          <button class="btn-primary-ts" style="background: var(--red); border-color: var(--red);" @click="onConfirmYes">{{ confirmBtnLabel }}</button>
        </div>
      </div>
    </div>

    <!-- ════════ TOAST ════════ -->
    <transition name="toast">
      <div v-if="toast.show" class="ts-toast">{{ toast.msg }}</div>
    </transition>

  </div>
</template>

<script>
/**
 * =========================================================================
 * Admin Dashboard View Component (Root Admin Controller)
 * =========================================================================
 * This is the parent coordinator for all administrative views. It retains
 * statistical logs, lists for routes, staff lists, user lists, support logs,
 * and handles direct communication with the Flask REST APIs.
 * 
 * To reduce structural code bloat in child components, it uses a custom
 * dependency injection and computed proxy wrapper (adminDashProxy.js).
 * Child components (prefixed with `Tab`) inject `adminDash` to read state
 * or trigger operations (like deleting routes, assigning staff, or running Celery jobs).
 * 
 * Main Sub-Tabs Managed:
 * 1. TabDashboard: Summary KPI cards and latest activity feed.
 * 2. TabTreks: CRUD of Master Trek Catalog (routes).
 * 3. TabBatches: CRUD of Scheduled Trek Dates and guide assignment.
 * 4. TabStaff: Admin controls to hire guides and view profiles.
 * 5. TabStaffAvailability: Calendar display tracking guides' leaves/bookings.
 * 6. TabUsers: Listing registered users and triggering blacklisting.
 * 7. TabBookings: Complete booking logs, cancellation, and refund execution.
 * 8. TabAnalytics / TabRevenue: Analytics graphs and visual aggregates.
 * 9. TabReports: Monthly summary compiling triggers.
 * 10. TabJobs: Manage and manually trigger asynchronous Celery jobs.
 * 11. TabBlacklist: Restore or inspect deactivated guides/trekkers.
 * 12. TabSupportTickets: Review and resolve user questions and leaves.
 * 13. TabTrekHistory: Deep operational log archives of completed treks.
 */

import AdminSidebar from '../components/admin_dash_components/AdminSidebar.vue';
import AdminTopbar from '../components/admin_dash_components/AdminTopbar.vue';
import TabDashboard from '../components/admin_dash_components/TabDashboard.vue';
import TabTreks from '../components/admin_dash_components/TabTreks.vue';
import TabBatches from '../components/admin_dash_components/TabBatches.vue';
import TabStaff from '../components/admin_dash_components/TabStaff.vue';
import TabStaffAvailability from '../components/admin_dash_components/TabStaffAvailability.vue';
import TabUsers from '../components/admin_dash_components/TabUsers.vue';
import TabBookings from '../components/admin_dash_components/TabBookings.vue';
import TabAnalytics from '../components/admin_dash_components/TabAnalytics.vue';
import TabRevenue from '../components/admin_dash_components/TabRevenue.vue';
import TabReports from '../components/admin_dash_components/TabReports.vue';
import TabJobs from '../components/admin_dash_components/TabJobs.vue';
import TabBlacklist from '../components/admin_dash_components/TabBlacklist.vue';
import TabSupportTickets from '../components/admin_dash_components/TabSupportTickets.vue';
import TabTrekHistory from '../components/admin_dash_components/TabTrekHistory.vue';
import {
  ADMIN_STATS,
  TREK_STATUS_OVERVIEW,
  ADMIN_ALERTS,
  RECENT_BOOKINGS,
  ADMIN_TREKS,
  ADMIN_STAFF_LIST,
  ADMIN_USERS,
  ADMIN_BOOKINGS,
  POPULAR_TREKS,
  SLOT_UTILIZATION,
  UPCOMING_TREKS,
  ACTIVITY_FEED,
  AUDIT_LOGS,
  NOTIFICATIONS,
  SCHEDULED_JOBS,
  SYSTEM_HEALTH,
  MONTHLY_BOOKINGS,
  DIFFICULTY_DIST,
  USER_GROWTH,
  REVENUE_DATA,
  BLACKLISTED_USERS,
  ADMIN_ALERTS_AND_TASKS
} from '../data/admin_data';

export default {
  name: 'TsAdminLayout',
  components: {
    AdminSidebar,
    AdminTopbar,
    TabDashboard,
    TabTreks,
    TabBatches,
    TabStaff,
    TabStaffAvailability,
    TabUsers,
    TabBookings,
    TabAnalytics,
    TabRevenue,
    TabReports,
    TabJobs,
    TabBlacklist,
    TabSupportTickets,
    TabTrekHistory
  },
  emits: ['logout'],
  provide() {
    return { adminDash: this };
  },
  data() {
    return {
      // Initialise from URL param first, then localStorage, then default to dashboard
      activeTab: (() => {
        const validTabs = ['dashboard','treks','batches','staff','staff_availability','users','bookings','analytics','revenue','reports','jobs','blacklist','support_tickets','trek_history'];
        const fromRoute = window.location.pathname.split('/admin/')[1]?.split('/')[0];
        if (fromRoute && validTabs.includes(fromRoute)) return fromRoute;
        const fromStorage = localStorage.getItem('adminActiveTab');
        if (fromStorage && validTabs.includes(fromStorage)) return fromStorage;
        return 'dashboard';
      })(),
      sidebarCollapsed: false,
      lastIsSmall: null,
      searchQuery: '',
      trekFilter: 'All',
      batchGuideFilter: 'All',
      batchDateFilter: 'All',
      batchSortFilter: 'Default',
      bookingFilter: 'All',
      userFilter: 'All',
      auditFilter: 'All',
      showTrekModal: false,
      showStaffModal: false,
      showTrekkerModal: false,
      showConfirmModal: false,
      showBlacklistModal: false,
      blacklistTargetUser: null,
      blacklistReasonText: '',
      confirmTitle: '',
      confirmMessage: '',
      confirmBtnLabel: 'Confirm',
      confirmCallback: null,
      trekkerForm: { name: '', email: '', phone: '', password: '', city: '', emergency: '', bio: '' },
      showUserModal: false,
      showAssignModal: false,
      assignTrekObj: null,
      showAssignStaffDropdown: false,
      selectedAssignStaffName: '',
      tempStaffId: null,
      showBatchDetailsModal: false,
      selectedBatchDetails: null,
      editingTrek: null,
      selectedUser: null,
      assignTrekId: null,
      toast: { show: false, msg: '' },
      notifOpen: false,
      staffViewMode: 'list',
      trekRoutes: [],
      routeViewMode: 'list',
      showRouteModal: false,
      showRouteStateDropdown: false,
      routeStateSearchQuery: '',
      indianStates: [
        'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
        'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
        'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
        'Nagaland', 'Odisha', 'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana',
        'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal', 'Jammu and Kashmir', 'Ladakh'
      ],
      showFormDiffDropdown: false,
      editingRoute: null,
      editingStaff: null,
      editingTrekker: null,
      showAssignTrekModal: false,
      assignStaffObj: null,
      showAssignTrekDropdown: false,
      selectedAssignTrekCode: '',
      tempTrekId: null,
      trekSearchQuery: '',
      routeForm: { name:'', location:'', place:'', difficulty:'Moderate', duration:5, distance:15, imageUrl:'', description:'', latitude:null, longitude:null },
      selectedRouteDetails: null,
      showRouteDetailsModal: false,
      routeSearchQuery: '',
      batchTrekkers: [],
      showTrekSearch: false,
      trekkerManageMode: '',
      showRouteDropdown: false,
      staffSearchQuery: '',
      showStaffDropdown: false,
      routeDiffFilter: 'All',
      routeDaysFilter: 'All',
      routeActiveFilter: 'All',
      routeStateFilter: 'All',
      routeDistFilter: 'All',
      tempRouteDiffFilter: 'All',
      tempRouteDaysFilter: 'All',
      tempRouteActiveFilter: 'All',
      tempRouteStateFilter: 'All',
      tempRouteDistFilter: 'All',
      showDiffFilterDropdown: false,
      showDaysFilterDropdown: false,
      showActiveFilterDropdown: false,
      showStateFilterDropdown: false,
      showDistFilterDropdown: false,
      imageMode: 'link',
      staffImageMode: 'link',
      showStaffDetailsModal: false,
      selectedStaffDetails: null,
      showUserDetailsModal: false,
      selectedUserDetails: null,
      availabilityStart: '2026-06-13',
      availabilityEnd: '2026-06-18',
      calendarYear: 2026,
      calendarMonth: 5,
      hasCheckedRange: false,
      checkedStart: '',
      checkedEnd: '',
      calendarTooltip: { show: false, x: 0, y: 0, content: '' },
      calendarSearchQuery: '',
      testUserEmail: '',
      testStaffEmail: '',

      tabTitles: {
        dashboard:    'Overview',
        treks:        'Trek Routes',
        batches:      'Trek Batches',
        staff:        'Trek Staff',
        staff_availability: 'Staff Availability & Scheduling',
        users:        'User Management',
        bookings:     'All Bookings',
        analytics:    'Analytics & Charts',
        reports:      'Reports Center',
        notifications:'Notifications',
        system:       'System Monitor',
        audit:        'Audit Logs',
        blacklist:    'Blacklisted Accounts',
        jobs:         'Scheduled Jobs',
        revenue:      'Revenue Dashboard',
        support_tickets: 'Support Tickets',
        trek_history: 'Trek History',
      },

      trekForm: {
        name:'', location:'', difficulty:'Moderate',
        startDate:'', endDate:'', slots:20, price:5000,
        status:'Open', imageUrl:'', description:''
      },
      staffForm: { name:'', email:'', phone:'', password:'' },

      // Data (populated from ADMIN_DATA globals)
      stats:              [],
      trekStatusOverview: [],
      alerts:             [],
      recentBookings:     [],
      treks:              [],
      staffList:          [],
      users:              [],
      allBookings:        [],
      popularTreks:       [],
      slotUtilization:    [],
      upcomingTreks:      [],
      activityFeed:       [],
      auditLogs:          [],
      notifications:      [],
      scheduledJobs:      [],
      systemHealth:       {},
      monthlyBookings:    [],
      difficultyDist:     [],
      userGrowth:         [],
      revenueData:        {},
      blacklistedUsers:   [],
      alertsAndTasks:     [],
      supportTickets:     [],
      showBookingDetailsModal: false,
      selectedBookingDetails: null,
      showRefundModal:      false,
      refundTarget:         null,
      refundAmountInput:    0,
      ticketStatusFilter: 'All',
      showTicketDetailsModal: false,
      selectedTicketDetails: null,
      // Hover interaction states
      hoveredMonthlyBooking: null,
      hoveredRevenueGrowth: null,
      hoveredDifficulty: null,
      hoveredBookingStatus: null,
      hoveredPaymentStatus: null,
      hoveredRevDifficulty: null,
      hoveredLossStatus: null,
      // Reports Generator States
      selectedReportType: 'monthly_activity',
      selectedReportMonth: 'Jun',
      selectedReportTrek: '',
      selectedReportTrekSubtype: 'summary',
      selectedReportBatch: '',
      selectedReportUser: '',
      selectedReportUserSubtype: 'active',
      selectedReportStaff: '',
      selectedReportStaffSubtype: 'performance',
      reportStartDate: '',
      reportEndDate: '',

      selectedHistoryTrek: null,
      showHistoryModal: false,

      reportsList: [
        {
          id: 1,
          title: 'Monthly Activity Report - May 2026',
          type: 'monthly_activity',
          generatedAt: '2026-06-01 10:00:00',
          parameters: 'Month: May',
        },
        {
          id: 2,
          title: 'Trek Route Report - Current Mock Routes',
          type: 'trek_route',
          generatedAt: '2026-06-05 14:30:00',
          parameters: 'Trek: All Trek Routes',
        },
        {
          id: 3,
          title: 'User Participation & Engagement Report',
          type: 'user_participation',
          generatedAt: '2026-06-10 09:15:00',
          parameters: 'Filters: Active Trekkers',
        }
      ],
      reportPreviewData: null,
      showReportPreviewModal: false,
      iframeSrcDoc: '',
      showReportTypeDropdown: false,
      showReportMonthDropdown: false,
      showReportTrekDropdown: false,
      showReportTrekSubtypeDropdown: false,
      showReportBatchDropdown: false,
      showReportUserSubtypeDropdown: false,
      showReportStaffSubtypeDropdown: false,
      
      reportTypeOptions: [
        { value: 'monthly_activity', label: 'Monthly Activity Report' },
        { value: 'trek_route', label: 'Trek Route Report' },
        { value: 'all_treks_combined', label: 'All Treks Combined Performance' },
        { value: 'batch_wise', label: 'Batch Wise Performance' },
        { value: 'batch_users', label: 'Batch Participant List (User List)' },
        { value: 'user_participation', label: 'User Participation Report' },
        { value: 'staff_performance', label: 'Staff Performance Report' },
      ],
      trekSubtypeOptions: [
        { value: 'summary', label: 'Batches Overview & Summary' },
        { value: 'participants', label: 'Participants Detailed Booking List' },
        { value: 'staff', label: 'Staff Assignment & Guide Contacts' },
        { value: 'all', label: 'Compiled All Report (Month-wise Performance)' },
      ],
      userSubtypeOptions: [
        { value: 'active', label: 'Most Active Users & Spent Totals' },
        { value: 'difficulty', label: 'Participation by Difficulty Level' },
        { value: 'trends', label: 'Monthly Booking Trends' },
        { value: 'history', label: 'Comprehensive Booking History' },
      ],
      staffSubtypeOptions: [
        { value: 'performance', label: 'Staff Leaderboard & Ratings' },
        { value: 'assignments', label: 'Detailed Batch Guide Assignments' },
      ],
    };
  },

  computed: {
    searchPlaceholder() {
      const map = {
        treks:'Search trek routes…', batches:'Search batches…', staff:'Search staff…',
        users:'Search users…', bookings:'Search bookings…',
        audit:'Search audit logs…',
        support_tickets:'Search tickets…',
      };
      return map[this.activeTab] || 'Search…';
    },
    completedTreks() {
      const q = this.searchQuery.toLowerCase();
      let list = this.treks.filter(t => ['Completed', 'Closed'].includes(t.status));
      if (q) {
        list = list.filter(t => 
          (t.batchCode && t.batchCode.toLowerCase().includes(q)) || 
          (t.name && t.name.toLowerCase().includes(q))
        );
      }
      return list;
    },
    filteredRoutes() {
      let list = this.trekRoutes;
      if (this.searchQuery) {
        const q = this.searchQuery.toLowerCase();
        list = list.filter(r =>
          r.name.toLowerCase().includes(q) ||
          r.location.toLowerCase().includes(q) ||
          r.trekCode.toLowerCase().includes(q)
        );
      }
      if (this.routeDiffFilter !== 'All') {
        list = list.filter(r => r.difficulty === this.routeDiffFilter);
      }
      if (this.routeDaysFilter !== 'All') {
        if (this.routeDaysFilter === '<5') {
          list = list.filter(r => r.duration < 5);
        } else if (this.routeDaysFilter === '5-7') {
          list = list.filter(r => r.duration >= 5 && r.duration <= 7);
        } else if (this.routeDaysFilter === '>7') {
          list = list.filter(r => r.duration > 7);
        }
      }
      if (this.routeActiveFilter !== 'All') {
        const isTargetActive = this.routeActiveFilter === 'Active';
        list = list.filter(r => r.active === isTargetActive);
      }
      if (this.routeStateFilter !== 'All') {
        list = list.filter(r => {
          if (!r.location) return false;
          const parts = r.location.split(',');
          const stateName = parts[parts.length - 1].trim();
          return stateName === this.routeStateFilter;
        });
      }
      if (this.routeDistFilter !== 'All') {
        if (this.routeDistFilter === '<10') {
          list = list.filter(r => r.distance < 10);
        } else if (this.routeDistFilter === '10-20') {
          list = list.filter(r => r.distance >= 10 && r.distance <= 20);
        } else if (this.routeDistFilter === '>20') {
          list = list.filter(r => r.distance > 20);
        }
      }
      return list;
    },
    routeStates() {
      const states = new Set();
      this.trekRoutes.forEach(r => {
        if (r.location) {
          const parts = r.location.split(',');
          const stateName = parts[parts.length - 1].trim();
          states.add(stateName);
        }
      });
      return Array.from(states).sort();
    },
    selectedRouteDuration() {
      const route = this.trekRoutes.find(r => r.id !== undefined && this.trekForm.trekRouteId !== undefined && Number(r.id) === Number(this.trekForm.trekRouteId));
      return route ? route.duration : 0;
    },
    filteredTreks() {
      const todayStr = new Date().toLocaleDateString('en-CA');
      const today = new Date();
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - today.getDay());
      const endOfWeek = new Date(today);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

      let activeTreks = this.treks.filter(t => t.status !== 'Completed' && (!t.endDate || t.endDate >= todayStr));

      if (this.batchGuideFilter === 'Assigned') {
        activeTreks = activeTreks.filter(t => t.staff && !String(t.staff).toLowerCase().includes('unassigned') && !String(t.staff).toLowerCase().includes('not assigned'));
      } else if (this.batchGuideFilter === 'Unassigned') {
        activeTreks = activeTreks.filter(t => !t.staff || String(t.staff).toLowerCase().includes('unassigned') || String(t.staff).toLowerCase().includes('not assigned'));
      }

      if (this.batchDateFilter === 'Upcoming') {
        activeTreks = activeTreks.filter(t => t.startDate && new Date(t.startDate) >= today);
      } else if (this.batchDateFilter === 'This Week') {
        activeTreks = activeTreks.filter(t => {
          const d = t.startDate ? new Date(t.startDate) : null;
          return d && d >= startOfWeek && d <= endOfWeek;
        });
      } else if (this.batchDateFilter === 'This Month') {
        activeTreks = activeTreks.filter(t => {
          const d = t.startDate ? new Date(t.startDate) : null;
          return d && d >= startOfMonth && d <= endOfMonth;
        });
      }

      let list = this.trekFilter === 'All'
        ? activeTreks
        : activeTreks.filter(t => t.status === this.trekFilter);

      if (this.searchQuery) {
        const q = this.searchQuery.toLowerCase();
        list = list.filter(t => t.name.toLowerCase().includes(q)
          || t.location.toLowerCase().includes(q)
          || (t.batchCode && t.batchCode.toLowerCase().includes(q)));
      }

      if (this.batchSortFilter === 'High Occupancy') {
        list = [...list].sort((a, b) => {
          const aPct = a.slots ? (a.booked || 0) / a.slots : 0;
          const bPct = b.slots ? (b.booked || 0) / b.slots : 0;
          return bPct - aPct;
        });
      } else if (this.batchSortFilter === 'Low Occupancy') {
        list = [...list].sort((a, b) => {
          const aPct = a.slots ? (a.booked || 0) / a.slots : 0;
          const bPct = b.slots ? (b.booked || 0) / b.slots : 0;
          return aPct - bPct;
        });
      }

      return list;
    },
    filteredStaff() {
      if (!this.searchQuery) return this.staffList;
      const q = this.searchQuery.toLowerCase();
      return this.staffList.filter(s => {
        const memberIdStr = s.memberId ? s.memberId.toLowerCase() : '';
        const idStr = String(s.id);
        return s.name.toLowerCase().includes(q) ||
          s.contact.toLowerCase().includes(q) ||
          memberIdStr.includes(q) ||
          idStr.includes(q);
      });
    },
    filteredUsers() {
      let list = this.users;
      if (this.userFilter === 'Active')      list = list.filter(u => !u.blacklisted);
      if (this.userFilter === 'Blacklisted') list = list.filter(u => u.blacklisted);
      if (this.searchQuery) {
        const q = this.searchQuery.toLowerCase();
        list = list.filter(u => {
          const memberIdStr = u.memberId ? u.memberId.toLowerCase() : ('ts26t' + u.id);
          const idStr = String(u.id);
          return u.name.toLowerCase().includes(q) ||
            u.email.toLowerCase().includes(q) ||
            memberIdStr.includes(q) ||
            idStr.includes(q);
        });
      }
      return list;
    },
    filteredBookings() {
      let list = this.bookingFilter === 'All'
        ? this.allBookings
        : this.allBookings.filter(b => b.status === this.bookingFilter);
      if (this.searchQuery)
        list = list.filter(b =>
          b.user.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
          b.trek.toLowerCase().includes(this.searchQuery.toLowerCase()));
      return list;
    },
    filteredAudit() {
      let list = this.auditFilter === 'All'
        ? this.auditLogs
        : this.auditLogs.filter(a => a.level === this.auditFilter.toLowerCase());
      if (this.searchQuery)
        list = list.filter(a =>
          a.action.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
          a.actor.toLowerCase().includes(this.searchQuery.toLowerCase()));
      return list;
    },


    maxBookings() {
      const vals = this.popularTreks.map(t => t.bookings);
      return vals.length ? Math.max(...vals) : 1;
    },
    maxMonthly() {
      const vals = this.monthlyBookings.map(m => m.count);
      return vals.length ? Math.max(...vals) : 1;
    },
    maxUserGrowth() {
      const vals = this.userGrowth.map(u => u.users);
      return vals.length ? Math.max(...vals) : 1;
    },
    averageOccupancy() {
      let totalSlots = 0;
      let bookedSlots = 0;
      this.treks.forEach(t => {
        totalSlots += t.slots || 0;
        bookedSlots += t.booked || 0;
      });
      return totalSlots ? Math.round((bookedSlots / totalSlots) * 100) : 0;
    },
    confirmedBookingRate() {
      const total = this.allBookings.length;
      if (!total) return 0;
      const confirmed = this.allBookings.filter(b => b.status !== 'Cancelled' && b.paymentStatus === 'Paid').length;
      return Math.round((confirmed / total) * 1000) / 10;
    },
    popularTreksWithMock() {
      if (this.popularTreks.length) {
        return [...this.popularTreks].sort((a, b) => b.bookings - a.bookings).slice(0, 5);
      }

      const counts = {};
      this.allBookings.forEach(b => {
        if (b.status === 'Cancelled') return;
        const trekName = b.trek || 'Unknown';
        counts[trekName] = (counts[trekName] || 0) + 1;
      });

      return Object.entries(counts)
        .map(([name, bookings]) => ({ name, bookings }))
        .sort((a, b) => b.bookings - a.bookings)
        .slice(0, 5);
    },
    maxPopularBookings() {
      const vals = this.popularTreksWithMock.map(t => t.bookings);
      return vals.length ? Math.max(...vals) : 1;
    },
    locationDemand() {
      const counts = {};
      this.allBookings.forEach(b => {
        if (b.status === 'Cancelled' || !(b.paymentStatus === 'Paid' || b.paid)) return;
        const matchedTrek = this.treks.find(t => Number(t.id) === Number(b.trekId)) || this.trekRoutes.find(r => r.name === b.trek);
        const loc = b.location || b.trekLocation || (matchedTrek ? matchedTrek.location : '') || '';
        const state = this.stateFromLocation(loc);
        counts[state] = (counts[state] || 0) + 1;
      });
      return Object.entries(counts).map(([state, count]) => ({ state, count })).sort((a, b) => b.count - a.count);
    },
    maxLocationDemand() {
      const vals = this.locationDemand.map(l => l.count);
      return vals.length ? Math.max(...vals) : 1;
    },
    occupancyRatePerTrek() {
      if (this.slotUtilization.length) {
        return [...this.slotUtilization]
          .sort((a, b) => b.pct - a.pct)
          .slice(0, 5)
          .map(s => ({ name: s.trek, pct: s.pct, booked: s.booked, total: s.total }));
      }

      const derived = this.treks.map(t => {
        const booked = this.allBookings.filter(b => b.trekId === t.id && b.status === 'Booked').length;
        const total = t.slots || 0;
        return {
          name: t.name,
          booked,
          total,
          pct: total ? Math.round((booked / total) * 100) : 0
        };
      });
      return derived.sort((a, b) => b.pct - a.pct).slice(0, 5);
    },
    bookingStatusDist() {
      let booked = 0;
      let cancelled = 0;
      let pending = 0;
      this.allBookings.forEach(b => {
        if (b.status === 'Cancelled') cancelled++;
        else if (!b.paid) pending++;
        else booked++;
      });
      const total = booked + cancelled + pending;
      if (total === 0) {
        return { booked: 80, cancelled: 15, pending: 5, total: 0, cancelRate: 15 };
      }
      return {
        booked: Math.round((booked / total) * 100),
        cancelled: Math.round((cancelled / total) * 100),
        pending: Math.round((pending / total) * 100),
        total: total,
        cancelRate: Math.round((cancelled / total) * 100)
      };
    },
    diffDonutData() {
      const easy = this.difficultyDist.find(d => d.level === 'Easy') || { pct: 40 };
      const mod = this.difficultyDist.find(d => d.level === 'Moderate') || { pct: 45 };
      const hard = this.difficultyDist.find(d => d.level === 'Hard') || { pct: 15 };
      const e_pct = easy.pct;
      const m_pct = mod.pct;
      const h_pct = hard.pct;
      return {
        easy: e_pct,
        mod: m_pct,
        hard: h_pct,
        offsetMod: -e_pct,
        offsetHard: -(e_pct + m_pct)
      };
    },
    statusDonutData() {
      const dist = this.bookingStatusDist;
      return {
        booked: dist.booked,
        cancelled: dist.cancelled,
        pending: dist.pending,
        offsetPending: -dist.booked,
        offsetCancelled: -(dist.booked + dist.pending)
      };
    },
    staffLeaderboard() {
      const list = this.staffList.map(s => {
        let treksCount = s.treksDone ? s.treksDone.length : 0;
        let participantsCount = 0;
        if (s.treksDone) {
          s.treksDone.forEach(t => { participantsCount += t.trekkersCount || 0; });
        }
        if (treksCount === 0) {
          treksCount = s.completedTreksCount || 10;
          participantsCount = treksCount * 12 + (s.id * 15);
        }
        const avgOccupancy = 75 + (s.id % 5) * 4;
        const completionRate = 96 + (s.id % 3) * 2;
        const userRating = (4.5 + (s.id % 5) * 0.1).toFixed(1);
        return {
          name: s.name,
          photoUrl: s.photoUrl,
          treks: treksCount,
          participants: participantsCount,
          avgOccupancy,
          completionRate,
          rating: userRating
        };
      });
      list.sort((a, b) => (b.participants - a.participants) || (b.rating - a.rating));
      return list;
    },
    enrichedUpcomingTreks() {
      return this.upcomingTreks.map(ut => {
        const matched = this.treks.find(t => t.name === ut.name);
        const totalSlots = matched ? matched.slots : 0;
        const bookedSlots = matched ? (matched.booked || matched.bookedSlots || 0) : 0;
        return {
          ...ut,
          totalSlots,
          bookedSlots,
          remainingSlots: Math.max(0, totalSlots - bookedSlots)
        };
      });
    },
    unreadNotifCount() {
      return this.notifications.filter(n => !n.read).length;
    },
    staffWorkload() {
      return this.staffList.map(s => ({ ...s, trekCount: s.treks.length }))
        .sort((a, b) => b.trekCount - a.trekCount);
    },
    maxWorkload() {
      const vals = this.staffList.map(s => s.treks.length);
      return vals.length ? Math.max(...vals) : 1;
    },
    peopleStats() { return this.stats.filter(s => s.category === 'people'); },
    treksStats() { return this.stats.filter(s => s.category === 'treks'); },
    bookingsStats() { return this.stats.filter(s => s.category === 'bookings'); },
    filteredTickets() {
      let list = this.supportTickets;
      if (this.ticketStatusFilter !== 'All') {
        list = list.filter(t => t.status === this.ticketStatusFilter);
      }
      if (this.searchQuery) {
        const q = this.searchQuery.toLowerCase();
        list = list.filter(t => {
          const formattedId = `ts26#${String(t.id).padStart(3, '0')}`.toLowerCase();
          const category = (t.category || '').toLowerCase();
          const cleanSubject = (t.cleanSubject || '').toLowerCase();
          return t.name.toLowerCase().includes(q) ||
                 t.email.toLowerCase().includes(q) ||
                 t.subject.toLowerCase().includes(q) ||
                 t.message.toLowerCase().includes(q) ||
                 formattedId.includes(q) ||
                 category.includes(q) ||
                 cleanSubject.includes(q) ||
                 String(t.id).includes(q);
        });
      }
      return list;
    },
    selectedRouteName() {
      const route = this.trekRoutes.find(r => r.id !== undefined && this.trekForm.trekRouteId !== undefined && Number(r.id) === Number(this.trekForm.trekRouteId));
      return route ? `[${route.trekCode}] ${route.name} (${route.location})` : '';
    },
    selectedStaffName() {
      const s = this.staffList.find(x => x.id === this.trekForm.staff_id);
      return s ? `${s.name} (${s.contact})` : 'No Staff Assigned';
    },
    matchingActiveRoutes() {
      return this.trekRoutes.filter(r =>
        r.active &&
        (r.name.toLowerCase().includes(this.routeSearchQuery.toLowerCase()) ||
         r.trekCode.toLowerCase().includes(this.routeSearchQuery.toLowerCase()))
      );
    },
    matchingStaff() {
      return this.staffList.filter(s =>
        s.name.toLowerCase().includes(this.staffSearchQuery.toLowerCase()) ||
        s.contact.toLowerCase().includes(this.staffSearchQuery.toLowerCase())
      );
    },
    matchingActiveTreks() {
      return this.treks.filter(t =>
        t.name.toLowerCase().includes(this.trekSearchQuery.toLowerCase()) ||
        (t.batchCode && t.batchCode.toLowerCase().includes(this.trekSearchQuery.toLowerCase()))
      );
    },
    daysInActiveMonth() {
      return new Date(this.calendarYear, this.calendarMonth + 1, 0).getDate();
    },
    filteredCalendarStaff() {
      if (!this.calendarSearchQuery) return this.staffList;
      const q = this.calendarSearchQuery.toLowerCase();
      return this.staffList.filter(s =>
        s.name.toLowerCase().includes(q) ||
        s.designation.toLowerCase().includes(q) ||
        (s.memberId && s.memberId.toLowerCase().includes(q))
      );
    },
    availableStaff() {
      if (!this.hasCheckedRange || !this.checkedStart || !this.checkedEnd) return [];
      const start = new Date(this.checkedStart);
      const end = new Date(this.checkedEnd);
      return this.staffList.filter(s => {
        if (!s.active || s.blacklisted) return false;
        
        // 1. Check Trek batch conflicts
        if (s.treksDone && s.treksDone.length) {
          const isBusyTrek = s.treksDone.some(t => {
            const tStart = new Date(t.startDate);
            const tEnd = new Date(t.endDate);
            return tStart <= end && tEnd >= start;
          });
          if (isBusyTrek) return false;
        }
        
        // 2. Check custom blocked dates
        if (s.customBlockedDates) {
          const blockedDates = s.customBlockedDates.split(',').map(x => x.trim()).filter(Boolean);
          // Loop through each day from start to end
          let curr = new Date(start);
          while (curr <= end) {
            const y = curr.getFullYear();
            const m = String(curr.getMonth() + 1).padStart(2, '0');
            const d = String(curr.getDate()).padStart(2, '0');
            const dStr = `${y}-${m}-${d}`;
            if (blockedDates.includes(dStr)) {
              return false; // Busy on this day
            }
            curr.setDate(curr.getDate() + 1);
          }
        }
        
        return true;
      });
    },
    revenueKPIs() {
      const livePaidSum = this.allBookings.reduce((sum, b) => {
        if (b.paymentStatus === 'Paid') {
          return sum + (Number(b.amountPaid) || 0);
        } else if (b.paymentStatus === 'Refunded') {
          const paid = Number(b.amountPaid || b.bookingPrice || 5000);
          const ref = b.refundAmount !== undefined && b.refundAmount !== null ? Number(b.refundAmount) : paid;
          return sum + Math.max(0, paid - ref);
        }
        return sum;
      }, 0);
      const livePendingSum = this.allBookings.reduce((sum, b) => {
        return sum + (b.status === 'Booked' && b.paymentStatus === 'Pending' ? (Number(b.bookingPrice) || 0) : 0);
      }, 0);

      const totalRevenue = livePaidSum;
      const today = new Date();
      const currentMonth = today.getMonth();
      const currentYear = today.getFullYear();
      const monthlyRevenue = this.allBookings.reduce((sum, b) => {
        if (b.paymentStatus === 'Paid' || b.paymentStatus === 'Refunded') {
          const dateStr = b.date || b.bookedOn;
          if (dateStr) {
            const d = new Date(dateStr);
            if (d.getMonth() === currentMonth && d.getFullYear() === currentYear) {
              if (b.paymentStatus === 'Paid') {
                return sum + (Number(b.amountPaid) || 0);
              } else {
                const paid = Number(b.amountPaid || b.bookingPrice || 5000);
                const ref = b.refundAmount !== undefined && b.refundAmount !== null ? Number(b.refundAmount) : paid;
                return sum + Math.max(0, paid - ref);
              }
            }
          }
        }
        return sum;
      }, 0);

      const pendingPayments = livePendingSum;

      const totalTreks = this.treks.length;
      const totalUsers = this.users.length;

      const avgPerTrek = totalTreks ? Math.round(totalRevenue / totalTreks) : 0;
      const avgPerUser = totalUsers ? Math.round(totalRevenue / totalUsers) : 0;

      return {
        total: totalRevenue,
        monthly: monthlyRevenue,
        pending: pendingPayments,
        avgPerTrek: avgPerTrek,
        avgPerUser: avgPerUser
      };
    },
    revenueGrowthData() {
      const today = new Date();
      const currentMonth = today.getMonth(); // 0 to 11
      const currentYear = today.getFullYear();

      const monthsNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const activeMonths = monthsNames.slice(0, currentMonth + 1);
      const base = activeMonths.map(mName => ({ month: mName, amount: 0 }));

      this.allBookings.forEach(b => {
        const isPaid = b.status !== 'Cancelled' && b.paymentStatus === 'Paid';
        const isRefunded = b.status === 'Cancelled' && b.paymentStatus === 'Refunded';
        if (isPaid || isRefunded) {
          const dateStr = b.date || b.bookedOn;
          if (dateStr) {
            const d = new Date(dateStr);
            if (d.getFullYear() === currentYear) {
              const mName = monthsNames[d.getMonth()];
              const found = base.find(x => x.month === mName);
              if (found) {
                if (isPaid) {
                  found.amount += Number(b.amountPaid) || 0;
                } else {
                  const paid = Number(b.amountPaid || b.bookingPrice || 5000);
                  const ref = b.refundAmount !== undefined && b.refundAmount !== null ? Number(b.refundAmount) : paid;
                  found.amount += Math.max(0, paid - ref);
                }
              }
            }
          }
        }
      });

      return base;
    },
    maxRevenueGrowthAmount() {
      const vals = this.revenueGrowthData.map(r => r.amount);
      return vals.length ? Math.max(...vals) : 1;
    },
    revenueByTrek() {
      const base = {};
      this.allBookings.forEach(b => {
        const isPaid = b.status !== 'Cancelled' && b.paymentStatus === 'Paid';
        const isRefunded = b.status === 'Cancelled' && b.paymentStatus === 'Refunded';
        if (isPaid || isRefunded) {
          const trekName = b.trek || b.trekName || this.treks.find(t => Number(t.id) === Number(b.trekId))?.name || 'Unknown';
          if (isPaid) {
            base[trekName] = (base[trekName] || 0) + (Number(b.amountPaid) || 0);
          } else {
            const paid = Number(b.amountPaid || b.bookingPrice || 5000);
            const ref = b.refundAmount !== undefined && b.refundAmount !== null ? Number(b.refundAmount) : paid;
            base[trekName] = (base[trekName] || 0) + Math.max(0, paid - ref);
          }
        }
      });
      return Object.entries(base)
        .map(([name, amount]) => ({ name, amount }))
        .sort((a, b) => b.amount - a.amount);
    },
    maxRevenueByTrek() {
      const vals = this.revenueByTrek.map(t => t.amount);
      return vals.length ? Math.max(...vals) : 1;
    },
    revenueByLocation() {
      const base = {};
      this.allBookings.forEach(b => {
        const isPaid = b.status !== 'Cancelled' && b.paymentStatus === 'Paid';
        const isRefunded = b.status === 'Cancelled' && b.paymentStatus === 'Refunded';
        if (isPaid || isRefunded) {
          const matchedTrek = this.treks.find(t => Number(t.id) === Number(b.trekId)) || this.trekRoutes.find(r => r.name === b.trek);
          const loc = b.location || b.trekLocation || (matchedTrek ? matchedTrek.location : '') || '';
          const state = this.stateFromLocation(loc);
          if (isPaid) {
            base[state] = (base[state] || 0) + (Number(b.amountPaid) || 0);
          } else {
            const paid = Number(b.amountPaid || b.bookingPrice || 5000);
            const ref = b.refundAmount !== undefined && b.refundAmount !== null ? Number(b.refundAmount) : paid;
            base[state] = (base[state] || 0) + Math.max(0, paid - ref);
          }
        }
      });
      return Object.entries(base)
        .map(([state, amount]) => ({ state, amount }))
        .sort((a, b) => b.amount - a.amount);
    },
    maxRevenueByLocation() {
      const vals = this.revenueByLocation.map(l => l.amount);
      return vals.length ? Math.max(...vals) : 1;
    },
    paymentStatusDist() {
      let paid = 0;
      let pending = 0;
      let failed = 0;
      this.allBookings.forEach(b => {
        if (b.paymentStatus === 'Paid') paid++;
        else if (b.paymentStatus === 'Pending') pending++;
        else if (b.paymentStatus === 'Failed') failed++;
      });
      const total = paid + pending + failed;
      if (total === 0) {
        return { paid: 0, pending: 0, failed: 0, offsetPending: 0, offsetFailed: 0 };
      }
      const p_pct = Math.round((paid / total) * 100);
      const pen_pct = Math.round((pending / total) * 100);
      const f_pct = 100 - p_pct - pen_pct;
      return {
        paid: p_pct,
        pending: pen_pct,
        failed: f_pct,
        offsetPending: -p_pct,
        offsetFailed: -(p_pct + pen_pct)
      };
    },
    revenuePerDifficulty() {
      const base = {
        'Easy': 0,
        'Moderate': 0,
        'Hard': 0
      };
      this.allBookings.forEach(b => {
        const isPaid = b.status !== 'Cancelled' && b.paymentStatus === 'Paid';
        const isRefunded = b.status === 'Cancelled' && b.paymentStatus === 'Refunded';
        if (isPaid || isRefunded) {
          const diff = b.difficulty || 'Moderate';
          if (isPaid) {
            base[diff] = (base[diff] || 0) + (Number(b.amountPaid) || 0);
          } else {
            const paid = Number(b.amountPaid || b.bookingPrice || 5000);
            const ref = b.refundAmount !== undefined && b.refundAmount !== null ? Number(b.refundAmount) : paid;
            base[diff] = (base[diff] || 0) + Math.max(0, paid - ref);
          }
        }
      });
      const total = base.Easy + base.Moderate + base.Hard;
      const easy_pct = total ? Math.round((base.Easy / total) * 100) : 0;
      const mod_pct = total ? Math.round((base.Moderate / total) * 100) : 0;
      const hard_pct = total ? (100 - easy_pct - mod_pct) : 0;
      return {
        easy: base.Easy,
        moderate: base.Moderate,
        hard: base.Hard,
        easyPct: easy_pct,
        modPct: mod_pct,
        hardPct: hard_pct,
        offsetMod: -easy_pct,
        offsetHard: -(easy_pct + mod_pct)
      };
    },
    topPayingUsers() {
      const spenders = {};
      this.allBookings.forEach(b => {
        const isPaid = b.status !== 'Cancelled' && b.paymentStatus === 'Paid';
        const isRefunded = b.status === 'Cancelled' && b.paymentStatus === 'Refunded';
        if (isPaid || isRefunded) {
          const userId = b.userId || b.trekkerId || b.bookingId || b.id;
          const userObj = this.users.find(u => Number(u.id) === Number(b.userId) || u.memberId === b.trekkerId || u.name === b.user);
          const key = String(userId);
          if (!spenders[key]) {
            spenders[key] = {
              name: userObj ? userObj.name : (b.user || 'Unknown Trekker'),
              email: userObj ? userObj.email : (b.email || '—'),
              memberId: userObj ? userObj.memberId : (b.trekkerId || '—'),
              spent: 0,
              bookingsCount: 0
            };
          }
          if (isPaid) {
            spenders[key].spent += Number(b.amountPaid) || 0;
          } else {
            const paid = Number(b.amountPaid || b.bookingPrice || 5000);
            const ref = b.refundAmount !== undefined && b.refundAmount !== null ? Number(b.refundAmount) : paid;
            spenders[key].spent += Math.max(0, paid - ref);
          }
          spenders[key].bookingsCount += 1;
        }
      });

      return Object.entries(spenders)
        .map(([, data]) => data)
        .sort((a, b) => b.spent - a.spent);
    },
    refundAnalytics() {
      let refunded = 0;
      let nonRefunded = 0;
      this.allBookings.forEach(b => {
        if (b.status === 'Cancelled' && b.paymentStatus === 'Refunded') {
          const paid = Number(b.amountPaid || b.bookingPrice || 5000);
          const ref = b.refundAmount !== undefined && b.refundAmount !== null ? Number(b.refundAmount) : paid;
          refunded += ref;
          nonRefunded += Math.max(0, paid - ref);
        } else if (b.status !== 'Cancelled' && b.paymentStatus === 'Paid') {
          nonRefunded += Number(b.amountPaid || b.bookingPrice || 5000);
        }
      });
      const grandTotal = nonRefunded + refunded;
      const refPct = grandTotal ? Math.round((refunded / grandTotal) * 100) : 0;
      const nonRefPct = 100 - refPct;
      return {
        refunded: refunded,
        nonRefunded: nonRefunded,
        refundedPct: refPct,
        nonRefundedPct: nonRefPct
      };
    },
    matchingTrekkerSearchResults() {
      if (!this.trekSearchQuery) return [];
      const q = this.trekSearchQuery.toLowerCase().trim();
      return this.users.filter(u => {
        const name = u.name ? u.name.toLowerCase() : '';
        const memberId = u.memberId ? u.memberId.toLowerCase() : '';
        const email = u.email ? u.email.toLowerCase() : '';
        const rawId = u.id ? u.id.toString() : '';
        const digitsOnly = memberId.replace(/\D/g, '');
        return (
          name.includes(q) ||
          memberId.includes(q) ||
          email.includes(q) ||
          rawId === q ||
          digitsOnly.includes(q)
        );
      });
    },
    matchingBatchTrekkers() {
      if (!this.trekSearchQuery) return this.batchTrekkers;
      const q = this.trekSearchQuery.toLowerCase().trim();
      return this.batchTrekkers.filter(t => {
        const name = t.userName ? t.userName.toLowerCase() : '';
        const memberId = t.memberId ? t.memberId.toLowerCase() : '';
        const email = t.userEmail ? t.userEmail.toLowerCase() : '';
        const rawId = t.userId ? t.userId.toString() : '';
        const digitsOnly = memberId.replace(/\D/g, '');
        return (
          name.includes(q) ||
          memberId.includes(q) ||
          email.includes(q) ||
          rawId === q ||
          digitsOnly.includes(q)
        );
      });
    },
    filteredStatesForRoute() {
      if (!this.routeStateSearchQuery) return this.indianStates;
      const q = this.routeStateSearchQuery.toLowerCase().trim();
      return this.indianStates.filter(s => s.toLowerCase().includes(q));
    }
  },

  watch: {
    // Sync activeTab → URL whenever tab changes programmatically
    activeTab(newTab) {
      localStorage.setItem('adminActiveTab', newTab);
      const currentSlug = this.$route.params.tab_slug;
      if (currentSlug !== newTab) {
        this.$router.push(`/admin/${newTab}`);
      }
      this.resetSearchQueries();
    },
    // Sync URL → activeTab when browser back/forward is used
    '$route.params.tab_slug'(newSlug) {
      if (newSlug && newSlug !== this.activeTab) {
        this.activeTab = newSlug;
        this.resetSearchQueries();
      } else if (!newSlug && this.activeTab !== 'dashboard') {
        this.activeTab = 'dashboard';
        this.resetSearchQueries();
      }
    },
    showRouteModal(val) {
      if (!val) this.routeStateSearchQuery = '';
    },
    'trekForm.startDate'(newVal) {
      this.calculateEndDate();
    },
    'trekForm.trekRouteId'(newVal) {
      this.calculateEndDate();
    }
  },

  mounted() {
    // If on /admin (no slug), redirect to /admin/dashboard for a canonical URL
    if (!this.$route.params.tab_slug) {
      this.$router.replace(`/admin/${this.activeTab}`);
    }
    this.loadData();
    window.addEventListener('click', this.handleGlobalClick);
    this.checkScreenSize();
    window.addEventListener('resize', this.checkScreenSize);
  },
  beforeUnmount() {
    window.removeEventListener('click', this.handleGlobalClick);
    window.removeEventListener('resize', this.checkScreenSize);
  },

  methods: {
    resetSearchQueries() {
      this.searchQuery = '';
      this.routeSearchQuery = '';
      this.trekSearchQuery = '';
      this.staffSearchQuery = '';
      this.calendarSearchQuery = '';
      this.routeStateSearchQuery = '';
      this.showTrekSearch = false;
    },
    async toggleDayAvailability(staff, day) {
      const dStr = `${this.calendarYear}-${String(this.calendarMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const trekConflict = this.getConflictTrekForDay(staff, day);
      if (trekConflict) {
        this.showToast(`Cannot clear: Guide is assigned to trek batch '${trekConflict.batchId}'. Reassign guide in batch settings.`);
        return;
      }
      try {
        const res = await fetch(`/api/admin/staff/${staff.id}/toggle_date_availability`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ date: dStr })
        });
        if (res.ok) {
          const data = await res.json();
          staff.customBlockedDates = data.customBlockedDates;
          this.showToast(`Guide availability updated: marked as ${data.action === 'busy' ? 'Unavailable' : 'Available'}.`);
          if (this.calendarTooltip.show) {
            this.showTooltip(null, staff, day);
          }
        } else {
          this.showToast('Failed to toggle date availability.');
        }
      } catch (err) {
        // Toggle offline in memory
        let blocked = staff.customBlockedDates ? staff.customBlockedDates.split(',').map(x => x.trim()).filter(Boolean) : [];
        let action = '';
        if (blocked.includes(dStr)) {
          blocked = blocked.filter(x => x !== dStr);
          action = 'available';
        } else {
          blocked.push(dStr);
          action = 'busy';
        }
        staff.customBlockedDates = blocked.join(',');
        this.showToast(`Guide availability updated (offline): marked as ${action === 'busy' ? 'Unavailable' : 'Available'}.`);
        if (this.calendarTooltip.show) {
          this.showTooltip(null, staff, day);
        }
      }
    },
    showTooltip(e, staff, day) {
      const trek = this.getConflictTrekForDay(staff, day);
      let content = '';
      if (trek) {
        content = `<strong>Trek:</strong> ${trek.trekName}<br>
                   <strong>Batch:</strong> ${trek.batchId}<br>
                   <strong>Dates:</strong> ${trek.startDate} to ${trek.endDate}<br>
                   <strong>Trekkers:</strong> ${trek.trekkersCount} registered`;
      } else if (this.isStaffBusyOnDay(staff, day)) {
        content = `<strong>Custom Block:</strong> Unavailable.<br>Click to toggle Available.`;
      } else {
        content = `<strong>Available</strong><br>Click to toggle Unavailable/Leave.`;
      }
      if (e) {
        const rect = e.currentTarget.getBoundingClientRect();
        this.calendarTooltip.x = rect.left + window.scrollX + (rect.width / 2);
        this.calendarTooltip.y = rect.top + window.scrollY - 10;
      }
      this.calendarTooltip.content = content;
      this.calendarTooltip.show = true;
    },
    hideTooltip() {
      this.calendarTooltip.show = false;
    },
    changeCalendarMonth(delta) {
      let m = this.calendarMonth + delta;
      let y = this.calendarYear;
      if (m > 11) {
        m = 0;
        y += 1;
      } else if (m < 0) {
        m = 11;
        y -= 1;
      }
      this.calendarMonth = m;
      this.calendarYear = y;
    },
    getMonthName(monthIdx) {
      const months = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
      ];
      return months[monthIdx];
    },
    triggerCheckRange() {
      if (!this.availabilityStart || !this.availabilityEnd) {
        this.showToast('Please enter both Start Date and End Date.');
        return;
      }
      if (new Date(this.availabilityStart) > new Date(this.availabilityEnd)) {
        this.showToast('Start Date must be on or before End Date.');
        return;
      }
      this.checkedStart = this.availabilityStart;
      this.checkedEnd = this.availabilityEnd;
      this.hasCheckedRange = true;
    },
    async triggerReport(type) {
      try {
        const res = await fetch('/api/admin/report', {
          method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ type })
        });
        if (res.ok) { const d = await res.json(); this.showToast(d.message); return; }
      } catch (_) {}
      this.showToast(`${type} report triggered (mock — Celery job queued)`);
    },
    async triggerJob(job) {
      job.status = 'Running';
      try {
        const res = await fetch('/api/admin/jobs/trigger', {
          method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ name: job.name })
        });
        if (res.ok) {
          this.showToast(`Job "${job.name}" triggered`);
          setTimeout(() => { this.loadData(); }, 1500);
          return;
        }
      } catch (_) {}
      this.showToast(`"${job.name}" triggered (mock)`);
    },
    async triggerWelcomeTest(type, email) {
      if (!email) {
        this.showToast("Please enter a valid recipient email address.");
        return;
      }
      try {
        const res = await fetch('/api/admin/jobs/test_welcome', {
          method:'POST',
          headers:{'Content-Type':'application/json'},
          body: JSON.stringify({ type, email })
        });
        if (res.ok) {
          const d = await res.json();
          this.showToast(d.message || `Test welcome email (${type}) sent.`);
          return;
        } else {
          const err = await res.json();
          this.showToast(err.error || "Failed to send test email.");
        }
      } catch (_) {
        this.showToast("Error sending test welcome email.");
      }
    },
    async exportCSV(type) {
      this.showToast(`Exporting ${type} CSV… you'll be notified when ready.`);
      try {
        await fetch('/api/admin/export', {
          method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ type })
        });
      } catch (_) {}
    },

    /**
     * ── UI & GENERAL HELPERS ───────────────────────────────────────────────
     * Handles viewport check, layout state, state selection, and drop-down clicks.
     */
    checkScreenSize() {
      const isSmall = window.innerWidth <= 1024;
      if (isSmall !== this.lastIsSmall) {
        this.sidebarCollapsed = isSmall;
        this.lastIsSmall = isSmall;
      }
    },
    handleGlobalClick(event) {
      if (this.showRouteStateDropdown) {
        const selector = event.target.closest('.route-state-dropdown-wrapper');
        if (!selector) {
          this.showRouteStateDropdown = false;
        }
      }
    },
    getWeekdayLetter(day) {
      const date = new Date(this.calendarYear, this.calendarMonth, day);
      const days = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
      return days[date.getDay()];
    },
    isWeekend(day) {
      const date = new Date(this.calendarYear, this.calendarMonth, day);
      const dayOfWeek = date.getDay();
      return dayOfWeek === 0 || dayOfWeek === 6;
    },
    getConflictTrekForDay(staff, day) {
      if (!staff.treksDone) return null;
      const dStr = `${this.calendarYear}-${String(this.calendarMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      return staff.treksDone.find(t => dStr >= t.startDate && dStr <= t.endDate) || null;
    },
    checkRangeStatus(staff) {
      if (!staff.treksDone || !this.availabilityStart || !this.availabilityEnd) {
        return { status: 'Available' };
      }
      const start = new Date(this.availabilityStart);
      const end = new Date(this.availabilityEnd);
      for (const t of staff.treksDone) {
        const tStart = new Date(t.startDate);
        const tEnd = new Date(t.endDate);
        if (tStart <= end && tEnd >= start) {
          return {
            status: 'Busy',
            trekName: t.trekName,
            batchId: t.batchId,
            range: `${t.startDate} to ${t.endDate}`
          };
        }
      }
      return { status: 'Available' };
    },
    isStaffBusyOnDay(staff, day) {
      if (this.getConflictTrekForDay(staff, day)) return true;
      const dStr = `${this.calendarYear}-${String(this.calendarMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      if (staff.leaves && staff.leaves.some(l => l.status === 'Approved' && dStr >= l.startDate && dStr <= l.endDate)) {
        return true;
      }
      if (staff.customBlockedDates) {
        const blockedDates = staff.customBlockedDates.split(',').map(x => x.trim()).filter(Boolean);
        if (blockedDates.includes(dStr)) {
          return true;
        }
      }
      return false;
    },
    openRouteModal(route = null) {
      this.activeTab = 'treks';
      this.editingRoute = route;
      this.routeForm = route
        ? { ...route }
        : { name: '', location: '', place: '', difficulty: 'Moderate', duration: 5, distance: 15, imageUrl: '', description: '', latitude: null, longitude: null };
      this.imageMode = (route && route.imageUrl && route.imageUrl.startsWith('/static/uploads')) ? 'upload' : 'link';
      this.showRouteModal = true;
    },
    closeRouteModal() {
      this.showRouteModal = false;
      this.showFormDiffDropdown = false;
      this.editingRoute = null;
    },
    openTrekModal(trek = null) {
      this.activeTab = 'batches';
      this.editingTrek = trek;
      this.trekForm = trek
        ? { ...trek }
        : { name:'', location:'', difficulty:'Moderate', startDate:'', endDate:'', slots:20, price:5000, status:'Open', imageUrl:'', description:'' };
      this.showTrekModal = true;
    },
    closeTrekModal() {
      this.showTrekModal = false;
      this.editingTrek = null;
    },
    openStaffModal(staff = null) {
      this.activeTab = 'staff';
      this.editingStaff = staff;
      this.staffForm = staff
        ? { ...staff }
        : { name:'', email:'', phone:'', password:'' };
      this.showStaffModal = true;
    },
    closeStaffModal() {
      this.showStaffModal = false;
      this.editingStaff = null;
    },
    openTrekkerModal(trekker = null) {
      this.activeTab = 'users';
      this.editingTrekker = trekker;
      this.trekkerForm = trekker
        ? {
            id: trekker.id,
            name: trekker.name,
            email: trekker.email,
            phone: trekker.phone || '',
            password: '',
            city: trekker.city || '',
            emergency: trekker.emergency || '',
            bio: trekker.bio || ''
          }
        : { name: '', email: '', phone: '', password: '', city: '', emergency: '', bio: '' };
      this.showTrekkerModal = true;
    },
    closeTrekkerModal() {
      this.showTrekkerModal = false;
      this.editingTrekker = null;
    },
    handleTaskAction(type) {
      if (type === 'inactive_staff') {
        this.activeTab = 'staff';
      } else if (type === 'unassigned_staff') {
        this.activeTab = 'batches';
        this.trekFilter = 'All';
      } else if (type === 'starting_this_week') {
        this.activeTab = 'batches';
        this.trekFilter = 'All';
      } else if (type === 'low_occupancy') {
        this.activeTab = 'batches';
        this.trekFilter = 'All';
      } else if (type === 'pending_tickets') {
        this.activeTab = 'support_tickets';
      } else if (type === 'unpaid_bookings') {
        this.activeTab = 'bookings';
        this.bookingFilter = 'All';
      }
    },
    async loadData() {
      try {
        const res = await fetch('/api/admin/dashboard_data');
        if (res.ok) {
          const d = await res.json();
          this.applyData(d);
          return;
        }
      } catch (_) {}
      // Fallback: use globals from admin_data.js
      this.applyData({
        stats: ADMIN_STATS,
        trekStatusOverview: TREK_STATUS_OVERVIEW,
        alerts: ADMIN_ALERTS,
        alertsAndTasks: ADMIN_ALERTS_AND_TASKS,
        recentBookings: RECENT_BOOKINGS,
        treks: ADMIN_TREKS,
        staffList: ADMIN_STAFF_LIST,
        users: ADMIN_USERS,
        allBookings: ADMIN_BOOKINGS,
        popularTreks: POPULAR_TREKS,
        slotUtilization: SLOT_UTILIZATION,
        upcomingTreks: UPCOMING_TREKS,
        activityFeed: ACTIVITY_FEED,
        auditLogs: AUDIT_LOGS,
        notifications: NOTIFICATIONS,
        scheduledJobs: SCHEDULED_JOBS,
        systemHealth: SYSTEM_HEALTH,
        monthlyBookings: MONTHLY_BOOKINGS,
        difficultyDist: DIFFICULTY_DIST,
        userGrowth: USER_GROWTH,
        revenueData: REVENUE_DATA,
        blacklistedUsers: BLACKLISTED_USERS,
        supportTickets: [],
        trekRoutes: [],
      });
    },
    applyData(d) {
      Object.keys(d).forEach(k => { if (this[k] !== undefined) this[k] = d[k]; });
    },

    // ── Confirmation Modal Helpers ──────────────────────────
    triggerConfirm(title, message, confirmBtnLabel, callback) {
      this.confirmTitle = title;
      this.confirmMessage = message;
      this.confirmBtnLabel = confirmBtnLabel || 'Confirm';
      this.confirmCallback = callback;
      this.showConfirmModal = true;
    },
    onConfirmYes() {
      if (this.confirmCallback) {
        this.confirmCallback();
      }
      this.closeConfirmModal();
    },
    closeConfirmModal() {
      this.showConfirmModal = false;
      this.confirmTitle = '';
      this.confirmMessage = '';
      this.confirmBtnLabel = 'Confirm';
      this.confirmCallback = null;
    },

    // ── Notifications ──────────────────────────────────────
    markAllRead() {
      this.notifications.forEach(n => n.read = true);
      this.showToast('All notifications marked as read');
    },

    // ── Helpers ────────────────────────────────────────────
    showToast(msg) {
      this.toast = { show: true, msg };
      setTimeout(() => { this.toast.show = false; }, 3000);
    },
    formatDate(dateStr) {
      if (!dateStr) return '';
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    },

    occColor(pct) {
      if (pct >= 100) return 'occ-full';
      if (pct >= 70)  return 'occ-high';
      if (pct >= 40)  return 'occ-mid';
      return 'occ-low';
    },

    stateFromLocation(loc) {
      const raw = String(loc || '').trim();
      if (!raw) return 'Other';

      const parts = raw.split(',').map(p => p.trim()).filter(Boolean);
      const lastPart = parts.length ? parts[parts.length - 1] : raw;

      const aliases = {
        Uttaranchal: 'Uttarakhand',
        Orissa: 'Odisha',
        Tamilnadu: 'Tamil Nadu',
      };

      if (aliases[lastPart]) return aliases[lastPart];
      if (this.indianStates.includes(lastPart)) return lastPart;

      if (lastPart.includes('Himachal')) return 'Himachal Pradesh';
      if (lastPart.includes('Uttarakhand') || lastPart.includes('Uttaranchal')) return 'Uttarakhand';
      if (lastPart.includes('Kashmir')) return 'Jammu and Kashmir';
      if (lastPart.includes('Sikkim')) return 'Sikkim';
      if (lastPart.includes('Karnataka')) return 'Karnataka';
      if (lastPart.includes('Ladakh') || lastPart.includes('Leh')) return 'Ladakh';

      return 'Other';
    },

    buildLinePath(data, key, w, h, pad) {
      if (!data || !data.length) return '';
      const max = Math.max(...data.map(d => d[key]));
      const pts = data.map((d, i) => {
        const x = pad + (i / (data.length - 1)) * (w - pad * 2);
        const y = h - pad - (d[key] / max) * (h - pad * 2);
        return `${x},${y}`;
      });
      return 'M' + pts.join('L');
    },

    buildAreaPath(data, key, w, h, pad) {
      if (!data || !data.length) return '';
      const line = this.buildLinePath(data, key, w, h, pad);
      const lastX = pad + (w - pad * 2);
      const firstX = pad;
      const baseY = h - pad;
      return line + `L${lastX},${baseY} L${firstX},${baseY}Z`;
    },
  },


  // ── TEMPLATE ──────────────────────────────────────────────
};
</script>
