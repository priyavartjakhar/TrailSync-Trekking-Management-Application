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

    <SAdminModals />

  </div>
</template>

<script>
import AdminSidebar from '../components/admin_dash_components/AdminSidebar.vue';
import AdminTopbar from '../components/admin_dash_components/AdminTopbar.vue';
import SAdminModals from '../components/admin_dash_components/SAdminModals.vue';
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
  BLACKLISTED_USERS
} from '../data/admin_data';

export default {
  name: 'TsAdminLayout',
  components: {
    AdminSidebar,
    AdminTopbar,
    SAdminModals,
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
      activeTab: localStorage.getItem('adminActiveTab') || 'dashboard',
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
    activeTab(newTab) {
      localStorage.setItem('adminActiveTab', newTab);
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
    checkScreenSize() {
      const isSmall = window.innerWidth <= 1024;
      if (isSmall !== this.lastIsSmall) {
        this.sidebarCollapsed = isSmall;
        this.lastIsSmall = isSmall;
      }
    },
    selectStateForRoute(state) {
      this.routeForm.location = state;
      this.showRouteStateDropdown = false;
      this.routeStateSearchQuery = '';
    },
    handleGlobalClick(event) {
      if (this.showRouteStateDropdown) {
        const selector = event.target.closest('.route-state-dropdown-wrapper');
        if (!selector) {
          this.showRouteStateDropdown = false;
        }
      }
    },
    selectRouteForBatch(route) {
      this.trekForm.trekRouteId = route.id;
      this.showRouteDropdown = false;
      this.routeSearchQuery = '';
    },
    selectStaffForBatch(staff) {
      this.trekForm.staff_id = staff ? staff.id : null;
      this.showStaffDropdown = false;
      this.staffSearchQuery = '';
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
      if (staff.customBlockedDates) {
        const dates = staff.customBlockedDates.split(',').map(x => x.trim());
        if (dates.includes(dStr)) return true;
      }
      return false;
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
        this.showToast('Network error toggling date availability.');
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
    handleGlobalClick(e) {
      this.showRouteDropdown = false;
      this.showStaffDropdown = false;
      this.showAssignStaffDropdown = false;
      this.showAssignTrekDropdown = false;
      this.showDiffFilterDropdown = false;
      this.showDaysFilterDropdown = false;
      this.showActiveFilterDropdown = false;
      this.showStateFilterDropdown = false;
      this.showDistFilterDropdown = false;
      this.showFormDiffDropdown = false;
      
      this.showReportTypeDropdown = false;
      this.showReportMonthDropdown = false;
      this.showReportTrekDropdown = false;
      this.showReportTrekSubtypeDropdown = false;
      this.showReportBatchDropdown = false;
      this.showReportUserSubtypeDropdown = false;
      this.showReportStaffSubtypeDropdown = false;
    },
    calculateEndDate() {
      const duration = this.selectedRouteDuration;
      const start = this.trekForm.startDate;
      if (start && duration > 0) {
        const dateObj = new Date(start);
        dateObj.setDate(dateObj.getDate() + duration);
        const y = dateObj.getFullYear();
        const m = String(dateObj.getMonth() + 1).padStart(2, '0');
        const d = String(dateObj.getDate()).padStart(2, '0');
        this.trekForm.endDate = `${y}-${m}-${d}`;
      }
    },
    resetRouteFilters() {
      this.tempRouteDiffFilter = 'All';
      this.tempRouteDaysFilter = 'All';
      this.tempRouteActiveFilter = 'All';
      this.tempRouteStateFilter = 'All';
      this.tempRouteDistFilter = 'All';
      this.routeDiffFilter = 'All';
      this.routeDaysFilter = 'All';
      this.routeActiveFilter = 'All';
      this.routeStateFilter = 'All';
      this.routeDistFilter = 'All';
      this.searchQuery = '';
    },
    setRouteFilter(filterKey, value) {
      this[filterKey] = value;
      if (filterKey === 'routeDiffFilter') {
        this.tempRouteDiffFilter = value;
      } else if (filterKey === 'routeDaysFilter') {
        this.tempRouteDaysFilter = value;
      } else if (filterKey === 'routeActiveFilter') {
        this.tempRouteActiveFilter = value;
      } else if (filterKey === 'routeStateFilter') {
        this.tempRouteStateFilter = value;
      } else if (filterKey === 'routeDistFilter') {
        this.tempRouteDistFilter = value;
      }
    },
    applyRouteFilters() {
      this.routeDiffFilter = this.tempRouteDiffFilter;
      this.routeDaysFilter = this.tempRouteDaysFilter;
      this.routeActiveFilter = this.tempRouteActiveFilter;
      this.routeStateFilter = this.tempRouteStateFilter;
      this.routeDistFilter = this.tempRouteDistFilter;
      this.showToast('Filters updated');
    },
    toggleRouteFilterDropdown(type) {
      const current = this[type];
      this.showDiffFilterDropdown = false;
      this.showDaysFilterDropdown = false;
      this.showActiveFilterDropdown = false;
      this.showStateFilterDropdown = false;
      this.showDistFilterDropdown = false;
      this[type] = !current;
    },
    async handleImageUpload(e) {
      const file = e.target.files[0];
      if (!file) return;
      const formData = new FormData();
      formData.append('image', file);
      try {
        this.showToast('Uploading image...');
        const res = await fetch('/api/admin/upload_image', {
          method: 'POST',
          body: formData
        });
        if (res.ok) {
          const data = await res.json();
          if (data.success) {
            this.routeForm.imageUrl = data.imageUrl;
            this.showToast('Image uploaded successfully!');
          } else {
            this.showToast('Upload failed: ' + (data.error || 'unknown error'));
          }
        } else {
          this.showToast('Upload failed');
        }
      } catch (err) {
        this.showToast('Upload failed (connection error)');
      }
    },
    async handleStaffPhotoUpload(e) {
      const file = e.target.files[0];
      if (!file) return;
      const formData = new FormData();
      formData.append('image', file);
      try {
        this.showToast('Uploading photo...');
        const res = await fetch('/api/admin/upload_image', {
          method: 'POST',
          body: formData
        });
        if (res.ok) {
          const data = await res.json();
          if (data.success) {
            this.staffForm.photoUrl = data.imageUrl;
            this.showToast('Photo uploaded successfully!');
          } else {
            this.showToast('Upload failed: ' + (data.error || 'unknown error'));
          }
        } else {
          this.showToast('Upload failed');
        }
      } catch (err) {
        this.showToast('Upload failed (connection error)');
      }
    },
    viewStaffDetails(s) {
      this.selectedStaffDetails = s;
      this.showStaffDetailsModal = true;
    },
    closeStaffDetails() {
      this.showStaffDetailsModal = false;
      this.selectedStaffDetails = null;
    },
    viewUserDetails(u) {
      const photos = [
        "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&h=300&fit=crop",
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=300&fit=crop",
        "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&h=300&fit=crop",
        "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300&h=300&fit=crop",
        "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=300&h=300&fit=crop"
      ];
      u.photoUrl = photos[u.id % photos.length];
      u.bookingsList = this.allBookings.filter(b => b.userId === u.id);
      this.selectedUserDetails = u;
      this.showUserDetailsModal = true;
    },
    closeUserDetails() {
      this.showUserDetailsModal = false;
      this.selectedUserDetails = null;
    },
    openTicketDetails(ticket) {
      const user = this.users.find(u => u.id === ticket.userId);
      if (user) {
        const photos = [
          "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&h=300&fit=crop",
          "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=300&fit=crop",
          "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&h=300&fit=crop",
          "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300&h=300&fit=crop",
          "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=300&h=300&fit=crop"
        ];
        user.photoUrl = photos[user.id % photos.length];
        user.bookingsList = this.allBookings.filter(b => b.userId === user.id);
        ticket.userDetails = user;
      } else {
        const staff = this.staffList ? this.staffList.find(s => s.id === ticket.userId) : null;
        if (staff) {
          ticket.userDetails = {
            id: staff.id,
            memberId: staff.memberId,
            name: staff.name,
            email: staff.contact,
            phone: staff.phone,
            city: '—',
            emergency: '—',
            registered: staff.joined,
            bookingsList: [],
            bio: 'Trek Guide / Staff member',
            photoUrl: staff.photoUrl,
            role: 'staff',
            designation: staff.designation,
            experience: staff.experience,
            skills: staff.skills,
            certifications: staff.certifications
          };
        } else {
          ticket.userDetails = null;
        }
      }
      this.selectedTicketDetails = ticket;
      this.showTicketDetailsModal = true;
    },
    closeTicketDetails() {
      this.showTicketDetailsModal = false;
      this.selectedTicketDetails = null;
    },
    getCategoryClass(category) {
      const map = {
        'General Inquiry': 'cat-general',
        'Booking & Reservation': 'cat-booking',
        'Payments & Refunds': 'cat-payment',
        'Profile & Account Settings': 'cat-profile',
        'Technical Issue / Bug': 'cat-bug',
        'Feedback & Suggestions': 'cat-feedback',
        'Leave Request': 'cat-leave'
      };
      return map[category] || 'cat-general';
    },
    closeBlacklistModal() {
      this.showBlacklistModal = false;
      this.blacklistTargetUser = null;
      this.blacklistReasonText = '';
    },
    async submitBlacklist() {
      if (!this.blacklistTargetUser) return;
      const u = this.blacklistTargetUser;
      const reason = this.blacklistReasonText.trim() || 'Policy violation';
      try {
        const res = await fetch(`/api/admin/users/blacklist/${u.id}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ reason: reason })
        });
        if (res.ok) {
          this.showToast(`${u.name} blacklisted`);
          this.closeBlacklistModal();
          this.loadData();
          return;
        }
      } catch (_) {}
      u.blacklisted = true;
      const idx = this.blacklistedUsers.findIndex(b => b.id === u.id);
      if (idx === -1) {
        this.blacklistedUsers.push({
          id: u.id,
          name: u.name,
          reason: reason,
          date: new Date().toISOString().slice(0, 10)
        });
      }
      this.showToast(`${u.name} blacklisted (mock)`);
      this.closeBlacklistModal();
    },
    async toggleStaffBlacklist(s) {
      if (s.blacklisted) {
        try {
          const res = await fetch(`/api/admin/users/restore/${s.id}`, { method: 'POST' });
          if (res.ok) {
            this.showToast(`Staff ${s.name} restored`);
            this.loadData();
            return;
          }
        } catch (_) {}
        s.blacklisted = false;
        this.showToast(`Staff ${s.name} restored (mock)`);
      } else {
        this.blacklistTargetUser = s;
        this.blacklistReasonText = '';
        this.showBlacklistModal = true;
      }
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

    // ── Trek Route CRUD ─────────────────────────────────────
    openRouteModal(route = null) {
      this.editingRoute = route;
      this.routeForm = route
        ? { ...route }
        : { name:'', location:'', place:'', difficulty:'Moderate', duration:5, distance:15, imageUrl:'', description:'', latitude:null, longitude:null };
      if (route && route.imageUrl && route.imageUrl.startsWith('/static/uploads')) {
        this.imageMode = 'upload';
      } else {
        this.imageMode = 'link';
      }
      this.showRouteModal = true;
    },
    closeRouteModal() {
      this.showRouteModal = false;
      this.showFormDiffDropdown = false;
      this.editingRoute = null;
    },
    async saveRoute() {
      if (!this.routeForm.name || !this.routeForm.name.trim()) {
        this.showToast('Trek Route Name is required');
        return;
      }
      if (!this.routeForm.location || !this.routeForm.location.trim()) {
        this.showToast('Location is required');
        return;
      }
      if (!this.routeForm.difficulty) {
        this.showToast('Difficulty is required');
        return;
      }
      if (!this.routeForm.duration || this.routeForm.duration <= 0) {
        this.showToast('Duration must be greater than 0');
        return;
      }
      if (!this.routeForm.distance || this.routeForm.distance <= 0) {
        this.showToast('Distance must be greater than 0');
        return;
      }
      if (!this.routeForm.imageUrl || !this.routeForm.imageUrl.trim()) {
        this.showToast('Image is required');
        return;
      }
      if (!this.routeForm.description || !this.routeForm.description.trim()) {
        this.showToast('Description is required');
        return;
      }
      try {
        const payload = this.editingRoute ? { id: this.editingRoute.id, ...this.routeForm } : { ...this.routeForm };
        const res = await fetch('/api/admin/trek_routes', {
          method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(payload)
        });
        if (res.ok) {
          this.showToast(this.editingRoute ? 'Route updated' : 'Route created');
          this.loadData();
          this.closeRouteModal();
        } else {
          this.showToast('Failed to save route');
        }
      } catch (_) {
        this.showToast('Failed to save route (error)');
      }
    },
    deleteRoute(id) {
      this.triggerConfirm(
        'Confirm Deletion',
        'Are you sure you want to remove this trek route? All its scheduled batches will be deleted!',
        'Delete',
        async () => {
          try {
            const res = await fetch(`/api/admin/trek_routes/${id}`, { method: 'DELETE' });
            if (res.ok) { this.showToast('Route removed'); this.loadData(); }
            else          this.showToast('Failed to remove route');
          } catch (_) {
            this.showToast('Failed to remove route (error)');
          }
        }
      );
    },
    async toggleRouteStatus(route) {
      try {
        const res = await fetch(`/api/admin/trek_routes/toggle/${route.id}`, { method: 'POST' });
        if (res.ok) {
          const d = await res.json();
          route.active = d.active;
          this.showToast(`Route ${route.active ? 'opened (activated)' : 'closed (deactivated)'}`);
          this.loadData();
        }
      } catch (_) {
        this.showToast('Failed to toggle status');
      }
    },
    async toggleBatchStatus(trek) {
      try {
        const res = await fetch(`/api/admin/batches/toggle/${trek.id}`, { method: 'POST' });
        if (res.ok) {
          const d = await res.json();
          trek.status = d.active ? 'Open' : 'Closed';
          this.showToast(`Batch ${d.active ? 'opened' : 'closed'}`);
          this.loadData();
        } else {
          const err = await res.json();
          this.showToast(err.error || 'Failed to toggle batch status');
        }
      } catch (_) {
        this.showToast('Failed to toggle batch status');
      }
    },
    viewRouteDetails(route) {
      const routeBatches = this.treks.filter(b => 
        (b.trekRouteId !== undefined && b.trekRouteId !== null && route.id !== undefined && route.id !== null && Number(b.trekRouteId) === Number(route.id)) || 
        (b.name && route.name && b.name.trim().toLowerCase() === route.name.trim().toLowerCase())
      );
      const processedCount = routeBatches.length;
      let sumPrice = 0;
      let totalBookings = 0;
      const priceTrends = [];
      const bookedUsers = [];
      
      routeBatches.forEach(b => {
        sumPrice += Number(b.price) || 0;
        totalBookings += Number(b.booked) || 0;
        priceTrends.push({
          batchCode: b.batchCode,
          startDate: b.startDate,
          price: Number(b.price) || 0,
          booked: Number(b.booked) || 0,
          slots: Number(b.slots) || 0,
          status: b.status,
          staff: b.staff
        });
        
        // Get booked users for this batch
        const batchBookings = this.allBookings.filter(bk => bk.trekId !== undefined && b.id !== undefined && Number(bk.trekId) === Number(b.id) && bk.status === 'Booked');
        batchBookings.forEach(bk => {
          bookedUsers.push({
            userName: bk.user,
            userEmail: bk.userEmail || bk.userId,
            batchCode: b.batchCode,
            bookedOn: bk.bookedOn
          });
        });
      });

      const avgPrice = processedCount ? Math.round(sumPrice / processedCount) : 0;
      
      this.selectedRouteDetails = {
        route: route,
        processedCount: processedCount,
        avgPrice: avgPrice,
        totalBookings: totalBookings,
        priceTrends: priceTrends,
        bookedUsers: bookedUsers
      };
      this.showRouteDetailsModal = true;
    },
    closeRouteDetails() {
      this.showRouteDetailsModal = false;
      this.selectedRouteDetails = null;
    },

    // ── Trek CRUD ──────────────────────────────────────────
    openTrekModal(trek = null) {
      this.editingTrek = trek;
      this.routeSearchQuery = '';
      this.staffSearchQuery = '';
      this.showRouteDropdown = false;
      this.showStaffDropdown = false;
      this.batchTrekkers = [];
      this.showTrekSearch = false;
      this.trekkerManageMode = '';
      this.trekSearchQuery = '';
      if (trek) {
        this.trekForm = { ...trek };
        this.fetchBatchTrekkers(trek.id);
      } else {
        this.trekForm = {
          trekRouteId: '',
          startDate: '',
          endDate: '',
          slots: '',
          price: '',
          status: 'Open',
          staff_id: null
        };
      }
      this.showTrekModal = true;
    },
    closeTrekModal() { this.showTrekModal = false; this.editingTrek = null; },

    async fetchBatchTrekkers(trekId) {
      try {
        const res = await fetch(`/api/admin/batches/${trekId}/trekkers`);
        if (res.ok) {
          const d = await res.json();
          this.batchTrekkers = d.trekkers || [];
        }
      } catch (e) {
        console.error("Error fetching batch trekkers:", e);
      }
    },
    async addTrekkerToBatch(user) {
      try {
        const res = await fetch('/api/admin/batches/add_trekker', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ trek_id: this.editingTrek.id, user_id: user.id })
        });
        const d = await res.json();
        if (res.ok) {
          this.showToast(d.message || 'Trekker added successfully.');
          this.fetchBatchTrekkers(this.editingTrek.id);
          this.loadData();
          this.trekSearchQuery = '';
          this.showTrekSearch = false;
        } else {
          this.showToast(d.error || 'Failed to add trekker.');
        }
      } catch (e) {
        this.showToast('Error adding trekker.');
      }
    },
    async removeTrekkerFromBatch(user) {
      try {
        const res = await fetch('/api/admin/batches/remove_trekker', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ trek_id: this.editingTrek.id, user_id: user.userId })
        });
        const d = await res.json();
        if (res.ok) {
          this.showToast(d.message || 'Trekker removed successfully.');
          this.fetchBatchTrekkers(this.editingTrek.id);
          this.loadData();
          this.trekSearchQuery = '';
          this.showTrekSearch = false;
        } else {
          this.showToast(d.error || 'Failed to remove trekker.');
        }
      } catch (e) {
        this.showToast('Error removing trekker.');
      }
    },

    async saveTrek() {
      // Frontend validation
      if (!this.editingTrek && !this.trekForm.trekRouteId) {
        this.showToast('Please select a Trek Route.');
        return;
      }
      if (!this.trekForm.startDate || !this.trekForm.endDate) {
        this.showToast('Start date and End date are required.');
        return;
      }
      if (this.trekForm.slots === '' || this.trekForm.slots === null || this.trekForm.slots <= 0) {
        this.showToast('Available slots must be a positive integer.');
        return;
      }
      if (this.trekForm.price === '' || this.trekForm.price === null || this.trekForm.price < 0) {
        this.showToast('Price must be a positive number.');
        return;
      }
      if (new Date(this.trekForm.startDate) >= new Date(this.trekForm.endDate)) {
        this.showToast('Start date must be before End date.');
        return;
      }

      try {
        const payload = this.editingTrek ? { id: this.editingTrek.id, ...this.trekForm } : { ...this.trekForm };
        const res = await fetch('/api/admin/treks', {
          method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(payload)
        });
        if (res.ok) {
          this.showToast(this.editingTrek ? 'Trek updated' : 'Trek created');
          this.loadData();
          this.closeTrekModal();
        } else {
          const errData = await res.json();
          this.showToast(errData.error || 'Failed to save trek');
        }
      } catch (_) {
        if (this.editingTrek) {
          const i = this.treks.findIndex(t => t.id === this.editingTrek.id);
          if (i !== -1) this.treks[i] = { ...this.editingTrek, ...this.trekForm };
        } else {
          this.treks.push({ id: Date.now(), ...this.trekForm, staff: null, totalSlots: this.trekForm.slots });
        }
        this.showToast(this.editingTrek ? 'Trek updated (mock)' : 'Trek created (mock)');
        this.closeTrekModal();
      }
    },

    deleteTrek(id) {
      this.triggerConfirm(
        'Confirm Deletion',
        'Are you sure you want to remove this trek batch? This action cannot be undone.',
        'Delete',
        async () => {
          try {
            const res = await fetch(`/api/admin/treks/${id}`, { method:'DELETE' });
            if (res.ok) { this.showToast('Trek removed'); this.loadData(); }
            else          this.showToast('Failed to remove trek');
          } catch (_) {
            this.treks = this.treks.filter(t => t.id !== id);
            this.showToast('Trek removed (mock)');
          }
        }
      );
    },

    closeBatch(trek) {
      this.triggerConfirm(
        'Close Batch',
        `Close batch '${trek.name}' (${trek.batchCode})? Users will not be able to book this batch once closed.`,
        'Close Batch',
        async () => {
          try {
            const res = await fetch(`/api/admin/batches/${trek.id}/close`, { method:'POST' });
            if (res.ok) {
              const data = await res.json();
              this.showToast(data.message || 'Batch closed successfully');
              this.loadData();
            } else {
              const err = await res.json();
              this.showToast(err.error || 'Failed to close batch');
            }
          } catch (_) {
            trek.status = 'Closed';
            this.showToast('Batch closed (mock)');
          }
        }
      );
    },

    completeBatch(trek) {
      this.triggerConfirm(
        'Mark as Completed',
        `Are you sure you want to mark batch '${trek.name}' (${trek.batchCode}) as Completed? This will also update the status of all active bookings for this batch to Completed.`,
        'Mark Completed',
        async () => {
          try {
            const res = await fetch(`/api/admin/batches/${trek.id}/complete`, { method:'POST' });
            if (res.ok) {
              const data = await res.json();
              this.showToast(data.message || 'Batch completed successfully');
              this.loadData();
            } else {
              const err = await res.json();
              this.showToast(err.error || 'Failed to complete batch');
            }
          } catch (_) {
            trek.status = 'Completed';
            this.showToast('Batch completed (mock)');
          }
        }
      );
    },



    // ── Staff CRUD ─────────────────────────────────────────
    openStaffModal(staff = null) {
      this.editingStaff = staff;
      if (staff) {
        this.staffForm = {
          id: staff.id,
          name: staff.name,
          email: staff.contact,
          phone: staff.phone || '',
          password: '',
          skills: staff.skills || 'Wilderness First Aid, Navigation',
          experience: staff.experience || 2,
          designation: staff.designation || 'Lead Guide',
          certifications: staff.certifications || 'Wilderness First Responder (WFR)',
          languages: staff.languages || 'English, Hindi',
          completedTreksCount: staff.completedTreksCount || 10,
          photoUrl: staff.photoUrl || ''
        };
        this.staffImageMode = staff.photoUrl ? 'link' : 'upload';
      } else {
        this.staffForm = {
          name: '',
          email: '',
          phone: '',
          password: '',
          skills: 'Wilderness First Aid, Navigation',
          experience: 2,
          designation: 'Lead Guide',
          certifications: 'Wilderness First Responder (WFR)',
          languages: 'English, Hindi',
          completedTreksCount: 10,
          photoUrl: ''
        };
        this.staffImageMode = 'upload';
      }
      this.showStaffModal = true;
    },
    closeStaffModal() {
      this.showStaffModal = false;
      this.editingStaff = null;
    },

    async saveStaff() {
      if (!this.staffForm.name || !this.staffForm.name.trim()) {
        this.showToast('Name is required');
        return;
      }
      if (!this.staffForm.email || !this.staffForm.email.trim()) {
        this.showToast('Email is required');
        return;
      }

      try {
        const res = await fetch('/api/admin/staff', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(this.staffForm)
        });
        if (res.ok) {
          this.showToast(this.editingStaff ? 'Staff profile updated' : 'Staff member added');
          this.loadData();
        } else {
          const d = await res.json();
          this.showToast(d.error || 'Failed to save staff');
        }
      } catch (_) {
        if (this.editingStaff) {
          const idx = this.staffList.findIndex(s => s.id === this.editingStaff.id);
          if (idx !== -1) {
            this.staffList[idx] = { ...this.editingStaff, ...this.staffForm, contact: this.staffForm.email };
          }
        } else {
          this.staffList.push({
            id: Date.now(),
            name: this.staffForm.name,
            contact: this.staffForm.email,
            phone: this.staffForm.phone,
            treks: [],
            active: true,
            joined: new Date().toISOString().slice(0, 10),
            skills: this.staffForm.skills,
            experience: this.staffForm.experience,
            designation: this.staffForm.designation,
            certifications: this.staffForm.certifications,
            languages: this.staffForm.languages,
            completedTreksCount: this.staffForm.completedTreksCount,
            photoUrl: this.staffForm.photoUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&h=300&fit=crop'
          });
        }
        this.showToast(this.editingStaff ? 'Staff profile updated (mock)' : 'Staff added (mock)');
      }
      this.closeStaffModal();
    },

    openTrekkerModal(user = null) {
      this.editingTrekker = user;
      if (user) {
        this.trekkerForm = {
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone || '',
          password: '',
          city: user.city || '',
          emergency: user.emergency || '',
          bio: user.bio || ''
        };
      } else {
        this.trekkerForm = { name: '', email: '', phone: '', password: '', city: '', emergency: '', bio: '' };
      }
      this.showTrekkerModal = true;
    },
    closeTrekkerModal() {
      this.showTrekkerModal = false;
      this.editingTrekker = null;
    },
    async openHistoryModal(trek) {
      this.selectedHistoryTrek = trek;
      this.showHistoryModal = true;
      await this.fetchBatchTrekkers(trek.id);
    },

    async saveTrekker() {
      if (!this.trekkerForm.name || !this.trekkerForm.name.trim()) {
        this.showToast('Name is required');
        return;
      }
      if (!this.trekkerForm.email || !this.trekkerForm.email.trim()) {
        this.showToast('Email is required');
        return;
      }
      try {
        const res = await fetch('/api/admin/trekkers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(this.trekkerForm)
        });
        if (res.ok) {
          this.showToast(this.editingTrekker ? 'Trekker profile updated' : 'Trekker added successfully');
          this.closeTrekkerModal();
          this.loadData();
        } else {
          const err = await res.json();
          this.showToast(err.error || 'Failed to save trekker');
        }
      } catch (_) {
        if (this.editingTrekker) {
          const idx = this.users.findIndex(u => u.id === this.editingTrekker.id);
          if (idx !== -1) {
            this.users[idx] = { ...this.editingTrekker, ...this.trekkerForm };
          }
        } else {
          this.users.push({
            id: Date.now(),
            name: this.trekkerForm.name,
            email: this.trekkerForm.email,
            phone: this.trekkerForm.phone,
            city: this.trekkerForm.city,
            emergency: this.trekkerForm.emergency,
            bio: this.trekkerForm.bio,
            bookings: 0,
            blacklisted: false,
            registered: new Date().toISOString().slice(0, 10),
            memberId: 'TS26T' + Date.now().toString().slice(-4)
          });
        }
        this.showToast(this.editingTrekker ? 'Trekker profile updated (mock)' : 'Trekker added (mock)');
        this.closeTrekkerModal();
      }
    },

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

    async toggleStaffStatus(s) {
      try {
        const res = await fetch(`/api/admin/staff/toggle/${s.id}`, { method:'POST' });
        if (res.ok) { this.showToast(`${s.name} status updated`); this.loadData(); return; }
      } catch (_) {}
      s.active = !s.active;
      this.showToast(`${s.name} ${s.active ? 'activated' : 'deactivated'} (mock)`);
    },

    assignTrekToStaff(s) {
      this.assignStaffObj = s;
      this.trekSearchQuery = '';
      this.showAssignTrekDropdown = false;
      this.tempTrekId = null;
      this.selectedAssignTrekCode = '';
      this.showAssignTrekModal = true;
    },
    closeAssignTrekModal() {
      this.showAssignTrekModal = false;
      this.assignStaffObj = null;
      this.tempTrekId = null;
      this.selectedAssignTrekCode = '';
    },
    selectTrekForAssign(trek) {
      this.tempTrekId = trek ? trek.id : null;
      this.selectedAssignTrekCode = trek ? `[${trek.batchCode}] ${trek.name} (${this.formatDate(trek.startDate)})` : '';
      this.showAssignTrekDropdown = false;
    },
    async submitAssignTrek() {
      if (!this.tempTrekId) {
        this.showToast('Please select a trek batch.');
        return;
      }
      try {
        const res = await fetch(`/api/admin/treks/assign/${this.tempTrekId}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: this.assignStaffObj.contact })
        });
        if (res.ok) {
          this.showToast(`Trek successfully assigned to ${this.assignStaffObj.name}`);
          this.loadData();
        } else {
          const d = await res.json();
          this.showToast(d.error || 'Failed to assign trek');
        }
      } catch (_) {
        const trek = this.treks.find(t => t.id === this.tempTrekId);
        if (trek) {
          if (!this.assignStaffObj.treks.includes(trek.name)) {
            this.assignStaffObj.treks.push(trek.name);
          }
          trek.staff = this.assignStaffObj.name;
        }
        this.showToast(`Trek assigned (mock)`);
      }
      this.closeAssignTrekModal();
    },

    assignStaffToTrek(trek) {
      this.assignTrekObj = trek;
      this.staffSearchQuery = '';
      this.showAssignStaffDropdown = false;
      const currentStaff = this.staffList.find(s => s.name === trek.staff);
      if (currentStaff) {
        this.tempStaffId = currentStaff.id;
        this.selectedAssignStaffName = currentStaff.name;
      } else {
        this.tempStaffId = null;
        this.selectedAssignStaffName = 'No Staff Assigned';
      }
      this.showAssignModal = true;
    },
    closeAssignModal() {
      this.showAssignModal = false;
      this.assignTrekObj = null;
      this.tempStaffId = null;
      this.selectedAssignStaffName = '';
      this.showAssignStaffDropdown = false;
      this.staffSearchQuery = '';
    },
    selectStaffForAssign(s) {
      if (s === null) {
        this.tempStaffId = null;
        this.selectedAssignStaffName = 'No Staff Assigned';
      } else {
        this.tempStaffId = s.id;
        this.selectedAssignStaffName = s.name;
      }
      this.showAssignStaffDropdown = false;
    },
    async saveAssignGuide() {
      if (!this.assignTrekObj) return;
      const trek = this.assignTrekObj;
      const s = this.staffList.find(x => x.id === this.tempStaffId);
      const email = s ? s.contact : null;
      try {
        const res = await fetch(`/api/admin/treks/assign/${trek.id}`, {
          method: 'POST',
          headers: {'Content-Type':'application/json'},
          body: JSON.stringify({ email })
        });
        if (res.ok) {
          this.showToast(email ? `Staff guide assigned to ${trek.name}` : `Staff guide removed from ${trek.name}`);
          this.loadData();
          this.closeAssignModal();
        } else {
          const d = await res.json();
          this.showToast(d.error || 'Assignment failed');
        }
      } catch (_) {
        this.showToast('Failed to assign guide (error)');
      }
    },
    viewBatchDetails(batch) {
      const bookings = this.allBookings.filter(bk => Number(bk.trekId) === Number(batch.id) && bk.status === 'Booked');
      this.selectedBatchDetails = {
        batch: batch,
        bookings: bookings.map(bk => {
          const userObj = this.users.find(usr => Number(usr.id) === Number(bk.userId));
          return {
            id: bk.id,
            userId: bk.userId,
            memberId: userObj ? userObj.memberId : ('TS26T' + bk.userId),
            userName: userObj ? userObj.name : bk.user,
            userEmail: userObj ? userObj.email : '—',
            userPhone: userObj ? userObj.phone : '—',
            userCity: userObj ? userObj.city : '—',
            bookedOn: bk.date,
            paid: bk.paid,
            transactionId: bk.transactionId,
            bookingId: bk.bookingId || ('BK' + bk.id)
          };
        })
      };
      this.showBatchDetailsModal = true;
    },
    closeBatchDetails() {
      this.showBatchDetailsModal = false;
      this.selectedBatchDetails = null;
    },
    formatDate(dateStr) {
      if (!dateStr) return '—';
      const parts = dateStr.split(' ');
      const datePart = parts[0];
      const timePart = parts[1] ? ' ' + parts[1] : '';
      const dParts = datePart.split('-');
      if (dParts.length !== 3) return dateStr;
      const year = dParts[0];
      const monthNum = parseInt(dParts[1], 10);
      const day = parseInt(dParts[2], 10);
      const monthNames = [
        'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
      ];
      if (monthNum >= 1 && monthNum <= 12) {
        return `${day} ${monthNames[monthNum - 1]} ${year}${timePart}`;
      }
      return dateStr;
    },

    // ── User Management ────────────────────────────────────
    async toggleBlacklist(u) {
      if (u.blacklisted) {
        try {
          const res = await fetch(`/api/admin/users/restore/${u.id}`, { method:'POST' });
          if (res.ok) { this.showToast(`${u.name} restored`); this.loadData(); return; }
        } catch (_) {}
        u.blacklisted = false;
        this.blacklistedUsers = this.blacklistedUsers.filter(b => b.id !== u.id);
        this.showToast(`${u.name} restored (mock)`);
      } else {
        this.blacklistTargetUser = u;
        this.blacklistReasonText = '';
        this.showBlacklistModal = true;
      }
    },

    async restoreBlacklist(u) {
      try {
        const res = await fetch(`/api/admin/users/restore/${u.id}`, { method:'POST' });
        if (res.ok) { this.showToast(`${u.name} restored`); this.loadData(); return; }
      } catch (_) {}
      this.blacklistedUsers = this.blacklistedUsers.filter(b => b.id !== u.id);
      const user = this.users.find(usr => usr.id === u.id);
      if (user) user.blacklisted = false;
      this.showToast(`${u.name} restored (mock)`);
    },

    // ── Booking Actions ────────────────────────────────────
    viewBookingDetails(b) {
      const userObj = this.users.find(usr => usr.id === b.userId);
      this.selectedBookingDetails = {
        booking: b,
        user: userObj || {
          memberId: b.trekkerId || ('TS26T' + b.userId),
          name: b.user,
          email: '—',
          phone: '—',
          city: '—',
          emergency: '—',
          bio: '—'
        }
      };
      this.showBookingDetailsModal = true;
    },
    closeBookingDetails() {
      this.showBookingDetailsModal = false;
      this.selectedBookingDetails = null;
    },
    cancelBooking(b) {
      this.triggerConfirm(
        'Cancel Booking',
        `Are you sure you want to cancel booking ${b.bookingId || ('#' + b.id)} for ${b.user}?`,
        'Cancel Booking',
        async () => {
          try {
            const res = await fetch(`/api/admin/bookings/cancel/${b.id}`, { method:'POST' });
            if (res.ok) { this.showToast('Booking cancelled'); this.loadData(); return; }
          } catch (_) {
            b.status = 'Cancelled';
            this.showToast('Booking cancelled (mock)');
          }
        }
      );
    },
    openRefundModal(b) {
      this.refundTarget = b;
      this.refundAmountInput = Number(b.amountPaid || b.bookingPrice || 5000);
      this.showRefundModal = true;
    },
    closeRefundModal() {
      this.showRefundModal = false;
      this.refundTarget = null;
      this.refundAmountInput = 0;
    },
    async submitRefund() {
      if (!this.refundTarget) return;
      const maxRefund = Number(this.refundTarget.amountPaid || this.refundTarget.bookingPrice || 5000);
      if (this.refundAmountInput < 0 || this.refundAmountInput > maxRefund) {
        this.showToast(`Please enter a valid refund amount between 0 and ${maxRefund}.`);
        return;
      }
      try {
        const res = await fetch(`/api/admin/bookings/refund/${this.refundTarget.id}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refund_amount: this.refundAmountInput })
        });
        if (res.ok) {
          this.showToast('Refund processed successfully');
          this.closeRefundModal();
          this.loadData();
        } else {
          const err = await res.json();
          this.showToast(err.error || 'Failed to process refund');
        }
      } catch (_) {
        this.refundTarget.paymentStatus = 'Refunded';
        this.refundTarget.refundAmount = this.refundAmountInput;
        this.showToast('Refund processed successfully (mock)');
        this.closeRefundModal();
      }
    },

    async resolveTicket(ticket, resolutionMessage) {
      let finalMessage = resolutionMessage;
      if (resolutionMessage === undefined) {
        const promptMsg = window.prompt("Enter resolution message (optional):", "");
        if (promptMsg === null) return; // User cancelled
        finalMessage = promptMsg;
      }
      try {
        const res = await fetch(`/api/admin/support_tickets/resolve/${ticket.id}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ resolution_message: finalMessage })
        });
        if (res.ok) {
          const data = await res.json();
          const tId = ticket.ticketId || `TS26AS${String(ticket.id).padStart(3, '0')}`;
          this.showToast(`Ticket ${tId} resolved`);
          if (this.selectedTicketDetails && this.selectedTicketDetails.id === ticket.id) {
            this.selectedTicketDetails.status = 'Resolved';
            this.selectedTicketDetails.resolutionMessage = finalMessage;
          }
          // Update in local list too
          const idx = this.supportTickets ? this.supportTickets.findIndex(t => t.id === ticket.id) : -1;
          if (idx >= 0) {
            this.supportTickets[idx].status = 'Resolved';
            this.supportTickets[idx].resolutionMessage = finalMessage;
          }
          this.loadData();
          return;
        }
      } catch (_) {}
      ticket.status = 'Resolved';
      ticket.resolutionMessage = finalMessage;
      const tId = ticket.ticketId || `TS26AS${String(ticket.id).padStart(3, '0')}`;
      this.showToast(`Ticket ${tId} resolved (mock)`);
    },

    // ── Reports / Jobs ─────────────────────────────────────
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

    compileReport(type = null) {
      const rType = type || this.selectedReportType;
      let headers = [];
      let rows = [];
      let title = "";
      let parameters = "";
      
      const monthsNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      
      if (rType === 'monthly_activity') {
        title = `Monthly Activity Report - ${this.selectedReportMonth || 'All'}`;
        parameters = `Month: ${this.selectedReportMonth || 'All'}`;
        headers = ['Trek Name', 'Batch Code', 'Start Date', 'Booked Slots', 'Total Slots', 'Occupancy %', 'Revenue'];
        
        const filterMonth = this.selectedReportMonth;
        
        this.treks.forEach(t => {
          let matches = true;
          if (filterMonth && t.startDate) {
            const mIdx = new Date(t.startDate).getMonth();
            matches = monthsNames[mIdx] === filterMonth;
          }
          if (matches) {
            const booked = t.booked || t.bookedSlots || 0;
            const total = t.slots || 20;
            const occ = total > 0 ? Math.round((booked / total) * 100) : 0;
            const price = t.price || 5000;
            const rev = booked * price;
            rows.push([
              t.name,
              t.batchCode || `TID${String(t.id).padStart(3, '0')}B01`,
              t.startDate,
              booked,
              total,
              `${occ}%`,
              `₹${rev}`
            ]);
          }
        });
      }
      else if (rType === 'trek_route') {
        const trekName = this.selectedReportTrek;
        const subTrek = this.selectedReportTrekSubtype || 'summary';
        
        parameters = `Trek: ${trekName || 'All'} | Aspect: ${subTrek}`;
        if (this.reportStartDate || this.reportEndDate) {
          parameters += ` | Range: ${this.reportStartDate || 'Any'} to ${this.reportEndDate || 'Any'}`;
        }
        
        if (subTrek === 'summary') {
          title = `Trek Route Summary - ${trekName || 'All'}`;
          headers = ['Batch Code', 'Start Date', 'End Date', 'Status', 'Booked', 'Slots', 'Revenue', 'Assigned Staff'];
          
          this.treks.forEach(t => {
            if (!trekName || t.name === trekName) {
              if (this.reportStartDate && t.startDate < this.reportStartDate) return;
              if (this.reportEndDate && t.startDate > this.reportEndDate) return;
              
              const booked = t.booked || t.bookedSlots || 0;
              const total = t.slots || 20;
              const price = t.price || 5000;
              const rev = booked * price;
              const staffName = t.staffName || t.staff || 'Unassigned';
              rows.push([
                t.batchCode || `TID${String(t.id).padStart(3, '0')}B01`,
                t.startDate,
                t.endDate,
                t.status,
                booked,
                total,
                `₹${rev}`,
                staffName
              ]);
            }
          });
        }
        else if (subTrek === 'participants') {
          title = `Trek Route Participants - ${trekName || 'All'}`;
          headers = ['Booking ID', 'Batch Code', 'Trekker Name', 'Email', 'Phone', 'Booking Date', 'Status', 'Amount Paid'];
          
          this.allBookings.forEach(b => {
            if (!trekName || b.trek === trekName) {
              if (this.reportStartDate && b.date < this.reportStartDate) return;
              if (this.reportEndDate && b.date > this.reportEndDate) return;
              
              const userObj = this.users.find(u => u.id === b.userId || u.name === b.user);
              const email = b.email || (userObj ? userObj.email : '—');
              const phone = b.phone || (userObj ? userObj.phone : '—');
              rows.push([
                b.bookingId || `#${b.id}`,
                b.batchCode || '—',
                b.user,
                email,
                phone,
                b.date,
                b.status,
                `₹${b.amountPaid}`
              ]);
            }
          });
        }
        else if (subTrek === 'staff') {
          title = `Trek Route Staff Details - ${trekName || 'All'}`;
          headers = ['Batch Code', 'Start Date', 'End Date', 'Staff Name', 'Email', 'Phone', 'Designation'];
          
          this.treks.forEach(t => {
            if (!trekName || t.name === trekName) {
              if (this.reportStartDate && t.startDate < this.reportStartDate) return;
              if (this.reportEndDate && t.startDate > this.reportEndDate) return;
              
              const staffName = t.staffName || t.staff;
              if (!staffName || staffName === 'Unassigned') {
                rows.push([
                  t.batchCode || `TID${String(t.id).padStart(3, '0')}B01`,
                  t.startDate,
                  t.endDate,
                  'Unassigned',
                  '—',
                  '—',
                  '—'
                ]);
              } else {
                const sObj = this.staffList.find(s => s.name === staffName || s.id === t.staff_id);
                const email = sObj ? sObj.contact : '—';
                const phone = sObj ? sObj.phone : '—';
                const des = sObj ? sObj.designation : 'Guide';
                rows.push([
                  t.batchCode || `TID${String(t.id).padStart(3, '0')}B01`,
                  t.startDate,
                  t.endDate,
                  staffName,
                  email,
                  phone,
                  des
                ]);
              }
            }
          });
        }
        else if (subTrek === 'all') {
          title = `Trek Route Compiled Performance - ${trekName || 'All'}`;
          headers = ['Period (Month)', 'Trek Route', 'Total Batches', 'Total Bookings', 'Occupancy %', 'Total Revenue'];
          
          const groups = {};
          this.treks.forEach(t => {
            if (!trekName || t.name === trekName) {
              if (this.reportStartDate && t.startDate < this.reportStartDate) return;
              if (this.reportEndDate && t.startDate > this.reportEndDate) return;
              
              const mIdx = new Date(t.startDate).getMonth();
              const mName = monthsNames[mIdx] || 'Unknown';
              const key = `${mName}`;
              
              if (!groups[key]) {
                groups[key] = { trek: t.name, batches: 0, booked: 0, slots: 0, revenue: 0 };
              }
              const booked = t.booked || t.bookedSlots || 0;
              groups[key].batches += 1;
              groups[key].booked += booked;
              groups[key].slots += (t.slots || 20);
              groups[key].revenue += booked * (t.price || 5000);
            }
          });
          
          Object.entries(groups).forEach(([period, data]) => {
            const avgOcc = data.slots > 0 ? Math.round((data.booked / data.slots) * 100) : 0;
            rows.push([
              period,
              data.trek,
              data.batches,
              data.booked,
              `${avgOcc}%`,
              `₹${data.revenue}`
            ]);
          });
        }
      }
      else if (rType === 'all_treks_combined') {
        title = `All Treks Combined Performance Report`;
        parameters = `Date Range: ${this.reportStartDate || 'Any'} to ${this.reportEndDate || 'Any'}`;
        headers = ['Trek Route', 'Total Batches', 'Total Bookings', 'Average Occupancy %', 'Total Revenue'];
        
        const trekMap = {};
        this.treks.forEach(t => {
          if (this.reportStartDate && t.startDate < this.reportStartDate) return;
          if (this.reportEndDate && t.startDate > this.reportEndDate) return;
          
          if (!trekMap[t.name]) {
            trekMap[t.name] = { batches: 0, booked: 0, slots: 0, revenue: 0 };
          }
          const booked = t.booked || t.bookedSlots || 0;
          trekMap[t.name].batches += 1;
          trekMap[t.name].booked += booked;
          trekMap[t.name].slots += (t.slots || 20);
          trekMap[t.name].revenue += booked * (t.price || 5000);
        });
        
        Object.entries(trekMap).forEach(([name, data]) => {
          const avgOcc = data.slots > 0 ? Math.round((data.booked / data.slots) * 100) : 0;
          rows.push([
            name,
            data.batches,
            data.booked,
            `${avgOcc}%`,
            `₹${data.revenue}`
          ]);
        });
      }
      else if (rType === 'batch_wise') {
        const targetBatch = this.selectedReportBatch;
        title = `Batch Wise Performance Report`;
        parameters = targetBatch ? `Batch: ${targetBatch}` : `Date Range: ${this.reportStartDate || 'Any'} to ${this.reportEndDate || 'Any'}`;
        headers = ['Batch ID', 'Trek Route', 'Start Date', 'Status', 'Total Bookings', 'Revenue', 'Staff Assigned'];
        
        this.treks.forEach(t => {
          const bCode = t.batchCode || `TID${String(t.id).padStart(3, '0')}B01`;
          if (targetBatch && bCode !== targetBatch) return;
          if (this.reportStartDate && t.startDate < this.reportStartDate) return;
          if (this.reportEndDate && t.startDate > this.reportEndDate) return;
          
          const booked = t.booked || t.bookedSlots || 0;
          const rev = booked * (t.price || 5000);
          const staffName = t.staffName || t.staff || 'Unassigned';
          rows.push([
            bCode,
            t.name,
            t.startDate,
            t.status,
            booked,
            `₹${rev}`,
            staffName
          ]);
        });
      }
      else if (rType === 'batch_users') {
        const targetBatch = this.selectedReportBatch;
        title = `Batch User List - ${targetBatch || 'None'}`;
        parameters = `Batch: ${targetBatch || 'None'}`;
        headers = ['Booking ID', 'Member ID', 'Name', 'Email', 'Phone', 'Booking Status', 'Amount Paid', 'Payment Status'];
        
        if (targetBatch) {
          this.allBookings.forEach(b => {
            const bCode = b.batchCode || '';
            if (bCode === targetBatch) {
              const userObj = this.users.find(u => u.id === b.userId || u.name === b.user);
              const email = b.email || (userObj ? userObj.email : '—');
              const phone = userObj ? userObj.phone : '—';
              rows.push([
                b.bookingId || `#${b.id}`,
                b.trekkerId || '—',
                b.user,
                email,
                phone,
                b.status,
                `₹${b.amountPaid}`,
                b.paymentStatus
              ]);
            }
          });
        }
      }
      else if (rType === 'user_participation') {
        const subUser = this.selectedReportUserSubtype || 'active';
        title = `User Participation Report - ${subUser.toUpperCase()}`;
        parameters = `Filters: Aspect ${subUser}`;
        
        if (subUser === 'active') {
          headers = ['Trekker Name', 'Email', 'Phone', 'Member ID', 'Total Bookings', 'Total Spent', 'Last Booking Date'];
          const userMap = {};
          this.allBookings.forEach(b => {
            const name = b.user;
            if (!userMap[name]) {
              const uObj = this.users.find(u => u.id === b.userId || u.name === name);
              userMap[name] = {
                email: b.email || (uObj ? uObj.email : '—'),
                phone: uObj ? uObj.phone : '—',
                memberId: b.trekkerId || (uObj ? uObj.memberId : '—'),
                bookings: 0,
                spent: 0,
                lastDate: '2026-06-01'
              };
            }
            userMap[name].bookings += 1;
            if (b.paymentStatus === 'Paid') {
              userMap[name].spent += Number(b.amountPaid) || 0;
            } else if (b.paymentStatus === 'Refunded') {
              const paid = Number(b.amountPaid || b.bookingPrice || 5000);
              const ref = Number(b.refundAmount) || 0;
              userMap[name].spent += Math.max(0, paid - ref);
            }
            if (b.date && b.date > userMap[name].lastDate) {
              userMap[name].lastDate = b.date;
            }
          });
          
          Object.entries(userMap).forEach(([name, data]) => {
            rows.push([
              name,
              data.email,
              data.phone,
              data.memberId,
              data.bookings,
              `₹${data.spent}`,
              data.lastDate
            ]);
          });
          rows.sort((a, b) => b[4] - a[4]); // Sort by bookings descending
        }
        else if (subUser === 'difficulty') {
          headers = ['Trekker Name', 'Email', 'Easy Bookings', 'Moderate Bookings', 'Hard Bookings', 'Total Bookings'];
          const userMap = {};
          this.allBookings.forEach(b => {
            const name = b.user;
            if (!userMap[name]) {
              const uObj = this.users.find(u => u.id === b.userId || u.name === name);
              userMap[name] = {
                email: b.email || (uObj ? uObj.email : '—'),
                easy: 0,
                moderate: 0,
                hard: 0,
                total: 0
              };
            }
            userMap[name].total += 1;
            const diff = (b.difficulty || 'moderate').toLowerCase();
            if (diff === 'easy') userMap[name].easy += 1;
            else if (diff === 'hard') userMap[name].hard += 1;
            else userMap[name].moderate += 1;
          });
          
          Object.entries(userMap).forEach(([name, data]) => {
            rows.push([
              name,
              data.email,
              data.easy,
              data.moderate,
              data.hard,
              data.total
            ]);
          });
          rows.sort((a, b) => b[5] - a[5]);
        }
        else if (subUser === 'trends') {
          headers = ['Month', 'Total Bookings', 'Paid Bookings', 'Cancelled Bookings', 'Total Revenue'];
          const monthlyMap = {};
          this.allBookings.forEach(b => {
            if (!b.date) return;
            const mIdx = new Date(b.date).getMonth();
            const mName = monthsNames[mIdx] || 'Unknown';
            if (!monthlyMap[mName]) {
              monthlyMap[mName] = { total: 0, paid: 0, cancelled: 0, rev: 0 };
            }
            monthlyMap[mName].total += 1;
            if (b.status === 'Cancelled') {
              monthlyMap[mName].cancelled += 1;
            } else {
              monthlyMap[mName].paid += 1;
            }
            if (b.paymentStatus === 'Paid') {
              monthlyMap[mName].rev += Number(b.amountPaid) || 0;
            } else if (b.paymentStatus === 'Refunded') {
              const paid = Number(b.amountPaid || b.bookingPrice || 5000);
              const ref = Number(b.refundAmount) || 0;
              monthlyMap[mName].rev += Math.max(0, paid - ref);
            }
          });
          
          monthsNames.forEach(m => {
            if (monthlyMap[m]) {
              const data = monthlyMap[m];
              rows.push([
                m,
                data.total,
                data.paid,
                data.cancelled,
                `₹${data.rev}`
              ]);
            }
          });
        }
        else if (subUser === 'history') {
          headers = ['Booking ID', 'Member ID', 'Trekker Name', 'Trek Route', 'Batch Code', 'Booking Date', 'Status', 'Paid Amount'];
          this.allBookings.forEach(b => {
            rows.push([
              b.bookingId || `#${b.id}`,
              b.trekkerId || '—',
              b.user,
              b.trek,
              b.batchCode || '—',
              b.date,
              b.status,
              `₹${b.amountPaid}`
            ]);
          });
        }
      }
      else if (rType === 'staff_performance') {
        const subStaff = this.selectedReportStaffSubtype || 'performance';
        title = `Staff Performance Report - ${subStaff.toUpperCase()}`;
        parameters = `Filters: Aspect ${subStaff}`;
        
        if (subStaff === 'performance') {
          headers = ['Guide Name', 'Email', 'Phone', 'Treks Managed', 'Total Participants Led', 'Avg Occupancy %', 'Avg Rating'];
          
          this.staffLeaderboard.forEach(s => {
            const sObj = this.staffList.find(st => st.name === s.name);
            const phone = sObj ? sObj.phone : '—';
            rows.push([
              s.name,
              s.email || (sObj ? sObj.contact : '—'),
              phone,
              s.treks,
              s.participants,
              `${s.avgOccupancy}%`,
              `★ ${s.rating}`
            ]);
          });
        }
        else if (subStaff === 'assignments') {
          headers = ['Guide Name', 'Batch Code', 'Trek Route', 'Start Date', 'End Date', 'Status'];
          
          this.treks.forEach(t => {
            const staffName = t.staffName || t.staff || 'Unassigned';
            rows.push([
              staffName,
              t.batchCode || `TID${String(t.id).padStart(3, '0')}B01`,
              t.name,
              t.startDate,
              t.endDate,
              t.status
            ]);
          });
        }
      }
      
      return { title, headers, rows, parameters };
    },

    generateReport() {
      const { title, headers, rows, parameters } = this.compileReport();
      if (rows.length === 0) {
        this.showToast('No records found matching these parameters.');
        return;
      }
      
      const newReport = {
        id: Date.now(),
        title: title,
        type: this.selectedReportType,
        generatedAt: new Date().toLocaleString(),
        parameters: parameters,
        headers: headers,
        rows: rows
      };
      
      this.reportsList.unshift(newReport);
      this.showToast('Report generated successfully!');
    },

    toggleReportDropdown(dropdownName) {
      const current = this[dropdownName];
      this.closeAllReportDropdowns();
      this[dropdownName] = !current;
    },
    closeAllReportDropdowns() {
      this.showReportTypeDropdown = false;
      this.showReportMonthDropdown = false;
      this.showReportTrekDropdown = false;
      this.showReportTrekSubtypeDropdown = false;
      this.showReportBatchDropdown = false;
      this.showReportUserSubtypeDropdown = false;
      this.showReportStaffSubtypeDropdown = false;
    },
    getReportTypeName(type) {
      const match = this.reportTypeOptions.find(o => o.value === type);
      return match ? match.label : 'Select Report Type';
    },
    getTrekSubtypeName(type) {
      const match = this.trekSubtypeOptions.find(o => o.value === type);
      return match ? match.label : 'Select Aspect';
    },
    getUserSubtypeName(type) {
      const match = this.userSubtypeOptions.find(o => o.value === type);
      return match ? match.label : 'Select Aspect';
    },
    getStaffSubtypeName(type) {
      const match = this.staffSubtypeOptions.find(o => o.value === type);
      return match ? match.label : 'Select Aspect';
    },

    generateHTMLReportString(title, headers, dataRows, parameters) {
      let sumPaid = 0;
      let sumBooked = 0;
      let avgOcc = 0;
      let occCount = 0;
      
      dataRows.forEach(row => {
        row.forEach((val, idx) => {
          if (!headers[idx]) return;
          const hName = headers[idx].toLowerCase();
          if (hName.includes('revenue') || hName.includes('spent') || hName.includes('amount')) {
            const num = Number(String(val).replace(/[^0-9.-]+/g, ""));
            if (!isNaN(num)) sumPaid += num;
          }
          if (hName.includes('booked') || hName.includes('participants')) {
            const num = Number(String(val).replace(/[^0-9.-]+/g, ""));
            if (!isNaN(num)) sumBooked += num;
          }
          if (hName.includes('occupancy')) {
            const num = Number(String(val).replace(/[^0-9.-]+/g, ""));
            if (!isNaN(num)) { avgOcc += num; occCount++; }
          }
        });
      });
      
      const averageOccupancy = occCount > 0 ? Math.round(avgOcc / occCount) : null;
      
      let statCardsHTML = "";
      if (sumPaid > 0) {
        statCardsHTML += `
          <div class="stat-card">
            <div class="stat-title">Total Revenue / Spent</div>
            <div class="stat-value">₹${sumPaid.toLocaleString()}</div>
          </div>
        `;
      }
      if (sumBooked > 0) {
        statCardsHTML += `
          <div class="stat-card">
            <div class="stat-title">Total Participants / Bookings</div>
            <div class="stat-value">${sumBooked}</div>
          </div>
        `;
      }
      if (averageOccupancy !== null) {
        statCardsHTML += `
          <div class="stat-card">
            <div class="stat-title">Average Occupancy</div>
            <div class="stat-value">${averageOccupancy}%</div>
          </div>
        `;
      }
      
      const headerHTML = headers.map(h => `<th>${h}</th>`).join('');
      const rowsHTML = dataRows.map(row => {
        const cells = row.map(cell => `<td>${cell}</td>`).join('');
        return `<tr>${cells}</tr>`;
      }).join('');
      
      return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${title}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Playfair+Display:wght@700&family=Space+Mono&display=swap');
    
    :root {
      --forest: #1A2E1A;
      --forest-light: #2C5E3B;
      --gold: #C8922A;
      --gold-dark: #A47318;
      --snow: #F4F6F4;
      --cream: #F9F6EE;
      --bark: #2E251A;
      --stone: #8C8070;
    }
    
    body {
      font-family: 'DM Sans', sans-serif;
      margin: 0;
      padding: 30px;
      color: var(--bark);
      background-color: #ffffff;
      line-height: 1.5;
    }
    
    .report-container {
      max-width: 1000px;
      margin: 0 auto;
    }
    
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 2px solid var(--forest);
      padding-bottom: 20px;
      margin-bottom: 25px;
    }
    
    .brand {
      display: flex;
      flex-direction: column;
    }
    
    .brand-logo {
      font-family: 'Playfair Display', serif;
      font-size: 24px;
      font-weight: 700;
      color: var(--forest);
      letter-spacing: 0.02em;
    }
    
    .brand-sub {
      font-family: 'Space Mono', monospace;
      font-size: 10px;
      color: var(--stone);
      text-transform: uppercase;
      letter-spacing: 0.1em;
      margin-top: 3px;
    }
    
    .meta-info {
      text-align: right;
      font-family: 'Space Mono', monospace;
      font-size: 11px;
      color: var(--stone);
    }
    
    .title-section {
      margin-bottom: 25px;
    }
    
    .title {
      font-family: 'Playfair Display', serif;
      font-size: 28px;
      font-weight: 700;
      color: var(--forest);
      margin: 0 0 10px 0;
    }
    
    .parameters {
      background-color: var(--snow);
      border-left: 4px solid var(--gold);
      padding: 12px 16px;
      border-radius: 0 4px 4px 0;
      font-size: 13px;
      color: var(--forest);
    }
    
    .stats-row {
      display: flex;
      gap: 15px;
      margin-bottom: 30px;
    }
    
    .stat-card {
      flex: 1;
      background-color: var(--cream);
      border: 1px solid rgba(200, 146, 42, 0.15);
      border-radius: 6px;
      padding: 15px 20px;
    }
    
    .stat-title {
      font-size: 11px;
      font-weight: 700;
      color: var(--stone);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 5px;
    }
    
    .stat-value {
      font-family: 'DM Sans', sans-serif;
      font-size: 22px;
      font-weight: 700;
      color: var(--forest);
    }
    
    .table-container {
      overflow-x: auto;
      border: 1px solid rgba(26, 46, 26, 0.08);
      border-radius: 6px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.01);
      margin-bottom: 30px;
    }
    
    table {
      width: 100%;
      border-collapse: collapse;
      text-align: left;
      font-size: 13px;
    }
    
    th {
      background-color: var(--forest);
      color: var(--cream);
      font-weight: 600;
      text-transform: uppercase;
      font-size: 11px;
      letter-spacing: 0.02em;
      padding: 12px 16px;
    }
    
    td {
      padding: 12px 16px;
      border-bottom: 1px solid rgba(26, 46, 26, 0.05);
      color: var(--bark);
    }
    
    tr:nth-child(even) {
      background-color: var(--snow);
    }
    
    tr:hover {
      background-color: rgba(200, 146, 42, 0.03);
    }
    
    .footer {
      border-top: 1px solid rgba(26, 46, 26, 0.08);
      padding-top: 20px;
      margin-top: 40px;
      display: flex;
      justify-content: space-between;
      font-size: 11px;
      color: var(--stone);
      font-family: 'Space Mono', monospace;
    }
    
    @media print {
      body {
        padding: 0;
      }
      .stat-card {
        border: 1px solid #ddd;
      }
    }
  </style>
</head>
<body>
  <div class="report-container">
    <div class="header">
      <div class="brand">
        <div class="brand-logo">TrailSync</div>
        <div class="brand-sub">Platform Executive Report</div>
      </div>
      <div class="meta-info">
        <div>Generated: ${new Date().toLocaleString()}</div>
        <div>System: ONLINE</div>
      </div>
    </div>
    
    <div class="title-section">
      <h1 class="title">${title}</h1>
      <div class="parameters">
        <strong>Report Parameters:</strong> ${parameters}
      </div>
    </div>
    
    ${statCardsHTML ? `<div class="stats-row">${statCardsHTML}</div>` : ''}
    
    <div class="table-container">
      <table>
        <thead>
          <tr>
            ${headerHTML}
          </tr>
        </thead>
        <tbody>
          ${rowsHTML}
        </tbody>
      </table>
    </div>
    
    <div class="footer">
      <div>© 2026 TrailSync Systems</div>
      <div>Confidential - Admin Portal Access</div>
    </div>
  </div>
</body>
</html>
      `;
    },

    previewCurrentReport() {
      const compiled = this.compileReport();
      if (compiled.rows.length === 0) {
        this.showToast('No records found matching these parameters.');
        return;
      }
      this.reportPreviewData = compiled;
      this.iframeSrcDoc = this.generateHTMLReportString(compiled.title, compiled.headers, compiled.rows, compiled.parameters);
      this.showReportPreviewModal = true;
    },

    viewReport(report) {
      let headers = [];
      let rows = [];
      let title = report.title;
      let parameters = report.parameters;
      
      if (report.headers && report.rows) {
        headers = report.headers;
        rows = report.rows;
      } else {
        const prevType = this.selectedReportType;
        const prevMonth = this.selectedReportMonth;
        const prevTrek = this.selectedReportTrek;
        const prevBatch = this.selectedReportBatch;
        
        this.selectedReportType = report.type;
        if (report.type === 'monthly_activity') this.selectedReportMonth = 'May';
        if (report.type === 'trek_route') this.selectedReportTrek = this.trekRoutes[0] ? this.trekRoutes[0].name : '';
        
        const compiled = this.compileReport();
        headers = compiled.headers;
        rows = compiled.rows;
        parameters = compiled.parameters;
        
        this.selectedReportType = prevType;
        this.selectedReportMonth = prevMonth;
        this.selectedReportTrek = prevTrek;
        this.selectedReportBatch = prevBatch;
      }
      
      this.reportPreviewData = { title, headers, rows, parameters };
      this.iframeSrcDoc = this.generateHTMLReportString(title, headers, rows, parameters);
      this.showReportPreviewModal = true;
    },

    downloadReport(report) {
      this.downloadReportHTML(report);
    },

    downloadReportHTML(report) {
      let headers = [];
      let rows = [];
      let title = report.title;
      let parameters = report.parameters;
      
      if (report.headers && report.rows) {
        headers = report.headers;
        rows = report.rows;
      } else {
        const prevType = this.selectedReportType;
        const prevMonth = this.selectedReportMonth;
        const prevTrek = this.selectedReportTrek;
        const prevBatch = this.selectedReportBatch;
        
        this.selectedReportType = report.type;
        if (report.type === 'monthly_activity') this.selectedReportMonth = 'May';
        if (report.type === 'trek_route') this.selectedReportTrek = this.trekRoutes[0] ? this.trekRoutes[0].name : '';
        
        const compiled = this.compileReport();
        headers = compiled.headers;
        rows = compiled.rows;
        parameters = compiled.parameters;
        
        this.selectedReportType = prevType;
        this.selectedReportMonth = prevMonth;
        this.selectedReportTrek = prevTrek;
        this.selectedReportBatch = prevBatch;
      }
      
      const htmlContent = this.generateHTMLReportString(title, headers, rows, parameters);
      const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `${title.replace(/\s+/g, '_')}.html`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      this.showToast('HTML report download started');
    },

    downloadReportCSV(report) {
      let headers = [];
      let rows = [];
      let title = report.title;
      
      if (report.headers && report.rows) {
        headers = report.headers;
        rows = report.rows;
      } else {
        const prevType = this.selectedReportType;
        const prevMonth = this.selectedReportMonth;
        const prevTrek = this.selectedReportTrek;
        const prevBatch = this.selectedReportBatch;
        
        this.selectedReportType = report.type;
        if (report.type === 'monthly_activity') this.selectedReportMonth = 'May';
        if (report.type === 'trek_route') this.selectedReportTrek = this.trekRoutes[0] ? this.trekRoutes[0].name : '';
        
        const compiled = this.compileReport();
        headers = compiled.headers;
        rows = compiled.rows;
        
        this.selectedReportType = prevType;
        this.selectedReportMonth = prevMonth;
        this.selectedReportTrek = prevTrek;
        this.selectedReportBatch = prevBatch;
      }
      
      this.exportReportCSV(title, headers, rows);
    },

    exportReportCSV(title, headers, dataRows) {
      const escapeCSV = val => {
        if (val === null || val === undefined) return '';
        let str = String(val).replace(/"/g, '""');
        if (str.includes(',') || str.includes('\n') || str.includes('"')) {
          str = `"${str}"`;
        }
        return str;
      };
      
      const headerRow = headers.map(escapeCSV).join(',');
      const bodyRows = dataRows.map(row => row.map(escapeCSV).join(','));
      const csvContent = [headerRow, ...bodyRows].join('\n');
      
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `${title.replace(/\s+/g, '_')}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      this.showToast('CSV download started');
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

    // SVG line chart path builder
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
