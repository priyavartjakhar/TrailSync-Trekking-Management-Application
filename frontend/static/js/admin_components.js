// ============================================================
//  admin_components.js — TrailSync Admin Dashboard (Full)
//  Covers all 25 sections from project spec + extras
// ============================================================

const TsAdminLayout = {
  name: 'TsAdminLayout',
  emits: ['logout'],
  data() {
    return {
      activeTab: localStorage.getItem('adminActiveTab') || 'dashboard',
      sidebarCollapsed: false,
      searchQuery: '',
      trekFilter: 'All',
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
      routeForm: { name:'', location:'', difficulty:'Moderate', duration:5, distance:15, imageUrl:'', description:'', latitude:null, longitude:null },
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
      let list = this.trekFilter === 'All'
        ? this.treks
        : this.treks.filter(t => t.status === this.trekFilter);
      if (this.searchQuery)
        list = list.filter(t => t.name.toLowerCase().includes(this.searchQuery.toLowerCase())
          || t.location.toLowerCase().includes(this.searchQuery.toLowerCase())
          || (t.batchCode && t.batchCode.toLowerCase().includes(this.searchQuery.toLowerCase())));
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
      return totalSlots ? Math.round((bookedSlots / totalSlots) * 100) : 72;
    },
    popularTreksWithMock() {
      const base = [
        { name: 'Everest Base Camp', bookings: 250 },
        { name: 'Triund Trek', bookings: 180 },
        { name: 'Kedarkantha Trek', bookings: 160 }
      ];
      this.popularTreks.forEach(pt => {
        if (!base.find(b => b.name === pt.name)) {
          base.push({ name: pt.name, bookings: pt.bookings });
        }
      });
      base.sort((a, b) => b.bookings - a.bookings);
      return base.slice(0, 5);
    },
    maxPopularBookings() {
      const vals = this.popularTreksWithMock.map(t => t.bookings);
      return vals.length ? Math.max(...vals) : 1;
    },
    locationDemand() {
      const counts = { 'Himachal': 420, 'Uttarakhand': 380, 'Kashmir': 150, 'Sikkim': 90, 'Karnataka': 120 };
      this.allBookings.forEach(b => {
        const loc = b.location || '';
        let state = 'Other';
        if (loc.includes('Himachal')) state = 'Himachal';
        else if (loc.includes('Uttarakhand')) state = 'Uttarakhand';
        else if (loc.includes('Kashmir') || loc.includes('Sonamarg')) state = 'Kashmir';
        else if (loc.includes('Sikkim')) state = 'Sikkim';
        else if (loc.includes('Karnataka')) state = 'Karnataka';
        else if (loc.includes('Ladakh') || loc.includes('Leh')) state = 'Ladakh';
        counts[state] = (counts[state] || 0) + 1;
      });
      return Object.entries(counts).map(([state, count]) => ({ state, count })).sort((a, b) => b.count - a.count);
    },
    maxLocationDemand() {
      const vals = this.locationDemand.map(l => l.count);
      return vals.length ? Math.max(...vals) : 1;
    },
    occupancyRatePerTrek() {
      const base = [
        { name: 'Triund Trek', pct: 95, booked: 19, total: 20 },
        { name: 'Kedarkantha Trek', pct: 82, booked: 41, total: 50 },
        { name: 'Hampta Pass', pct: 60, booked: 12, total: 20 }
      ];
      this.slotUtilization.forEach(s => {
        if (!base.find(b => b.name === s.trek)) {
          base.push({ name: s.trek, pct: s.pct, booked: s.booked, total: s.total });
        }
      });
      return base.sort((a, b) => b.pct - a.pct).slice(0, 5);
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
        const totalSlots = matched ? matched.slots : 20;
        const bookedSlots = matched ? matched.booked : Math.floor(totalSlots * 0.6);
        return {
          ...ut,
          totalSlots,
          bookedSlots,
          remainingSlots: totalSlots - bookedSlots
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
      if (this.searchQuery) {
        const q = this.searchQuery.toLowerCase();
        list = list.filter(t =>
          t.name.toLowerCase().includes(q) ||
          t.email.toLowerCase().includes(q) ||
          t.subject.toLowerCase().includes(q) ||
          t.message.toLowerCase().includes(q)
        );
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
        return sum + (b.status !== 'Cancelled' && b.paymentStatus === 'Paid' ? (Number(b.amountPaid) || 0) : 0);
      }, 0);
      const livePendingSum = this.allBookings.reduce((sum, b) => {
        return sum + (b.status === 'Booked' && b.paymentStatus === 'Pending' ? (Number(b.bookingPrice) || 0) : 0);
      }, 0);

      const totalRevenue = 1245000 + livePaidSum;
      const monthlyRevenue = 185000 + livePaidSum;
      const pendingPayments = 42000 + livePendingSum;

      const totalTreks = 15 + this.treks.length;
      const totalUsers = 80 + this.users.length;

      const avgPerTrek = Math.round(totalRevenue / totalTreks);
      const avgPerUser = Math.round(totalRevenue / totalUsers);

      return {
        total: totalRevenue,
        monthly: monthlyRevenue,
        pending: pendingPayments,
        avgPerTrek: avgPerTrek,
        avgPerUser: avgPerUser
      };
    },
    revenueGrowthData() {
      const base = [
        { month: 'Jan', amount: 50000 },
        { month: 'Feb', amount: 70000 },
        { month: 'Mar', amount: 110000 },
        { month: 'Apr', amount: 180000 },
        { month: 'May', amount: 250000 },
        { month: 'Jun', amount: 290000 }
      ];

      this.allBookings.forEach(b => {
        if (b.status !== 'Cancelled' && b.paymentStatus === 'Paid') {
          const dateStr = b.date || b.bookedOn;
          if (dateStr) {
            const m = new Date(dateStr).getMonth();
            const monthsNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            const mName = monthsNames[m];
            const found = base.find(x => x.month === mName);
            if (found) {
              found.amount += Number(b.amountPaid) || 0;
            } else if (mName) {
              base.push({ month: mName, amount: Number(b.amountPaid) || 0 });
            }
          }
        }
      });

      const lastSixSum = base.slice(-6).reduce((sum, item) => sum + item.amount, 0);
      const forecastVal = Math.round(lastSixSum / Math.min(base.length, 6));

      const result = base.map(x => ({ ...x, isForecast: false }));
      result.push({ month: 'Jul (F)', amount: forecastVal, isForecast: true });

      return result;
    },
    maxRevenueGrowthAmount() {
      const vals = this.revenueGrowthData.map(r => r.amount);
      return vals.length ? Math.max(...vals) : 1;
    },
    revenueByTrek() {
      const base = {
        'Everest Base Camp': 450000,
        'Triund Trek': 220000,
        'Kedarkantha Trek': 180000
      };
      this.allBookings.forEach(b => {
        if (b.status !== 'Cancelled' && b.paymentStatus === 'Paid') {
          base[b.trekName] = (base[b.trekName] || 0) + (Number(b.amountPaid) || 0);
        }
      });
      return Object.entries(base)
        .map(([name, amount]) => ({ name, amount }))
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 5);
    },
    maxRevenueByTrek() {
      const vals = this.revenueByTrek.map(t => t.amount);
      return vals.length ? Math.max(...vals) : 1;
    },
    revenueByLocation() {
      const base = {
        'Himachal': 560000,
        'Uttarakhand': 410000,
        'Kashmir': 180000
      };
      this.allBookings.forEach(b => {
        if (b.status !== 'Cancelled' && b.paymentStatus === 'Paid') {
          const loc = b.location || '';
          let state = 'Other';
          if (loc.includes('Himachal')) state = 'Himachal';
          else if (loc.includes('Uttarakhand')) state = 'Uttarakhand';
          else if (loc.includes('Kashmir') || loc.includes('Sonamarg')) state = 'Kashmir';
          else if (loc.includes('Sikkim')) state = 'Sikkim';
          else if (loc.includes('Karnataka')) state = 'Karnataka';
          else if (loc.includes('Ladakh') || loc.includes('Leh')) state = 'Ladakh';
          base[state] = (base[state] || 0) + (Number(b.amountPaid) || 0);
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
        return { paid: 78, pending: 15, failed: 7, offsetPending: -78, offsetFailed: -93 };
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
        'Easy': 240000,
        'Moderate': 610000,
        'Hard': 480000
      };
      this.allBookings.forEach(b => {
        if (b.status !== 'Cancelled' && b.paymentStatus === 'Paid') {
          const diff = b.difficulty || 'Moderate';
          base[diff] = (base[diff] || 0) + (Number(b.amountPaid) || 0);
        }
      });
      const total = base.Easy + base.Moderate + base.Hard;
      const easy_pct = Math.round((base.Easy / total) * 100);
      const mod_pct = Math.round((base.Moderate / total) * 100);
      const hard_pct = 100 - easy_pct - mod_pct;
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
      spenders['Priyavart Jakhar'] = { spent: 25000, bookingsCount: 3, email: 'priyavart@gmail.com' };
      spenders['Amit Verma'] = { spent: 18000, bookingsCount: 2, email: 'amit@trailsync.com' };
      spenders['Rohan Desai'] = { spent: 15000, bookingsCount: 2, email: 'rohan@mail.com' };
      
      this.allBookings.forEach(b => {
        if (b.status !== 'Cancelled' && b.paymentStatus === 'Paid') {
          const name = b.user || 'Unknown Trekker';
          if (!spenders[name]) {
            spenders[name] = { spent: 0, bookingsCount: 0, email: b.trekkerId || 'TS26T0000' };
          }
          spenders[name].spent += Number(b.amountPaid) || 0;
          spenders[name].bookingsCount += 1;
        }
      });

      return Object.entries(spenders)
        .map(([name, data]) => ({ name, ...data }))
        .sort((a, b) => b.spent - a.spent)
        .slice(0, 5);
    },
    refundAnalytics() {
      let liveRefunded = 0;
      this.allBookings.forEach(b => {
        if (b.status === 'Cancelled' && b.paymentStatus === 'Refunded') {
          liveRefunded += Number(b.bookingPrice || b.price || 5000);
        }
      });
      const totalNonRefunded = 1200000 + (this.revenueKPIs.total - 1245000);
      const totalRefunded = 45000 + liveRefunded;
      const grandTotal = totalNonRefunded + totalRefunded;
      const refPct = Math.round((totalRefunded / grandTotal) * 100);
      const nonRefPct = 100 - refPct;
      return {
        refunded: totalRefunded,
        nonRefunded: totalNonRefunded,
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
    }
  },

  watch: {
    activeTab(newTab) {
      localStorage.setItem('adminActiveTab', newTab);
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
  },
  beforeUnmount() {
    window.removeEventListener('click', this.handleGlobalClick);
  },

  methods: {
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
    applyRouteFilters() {
      this.routeDiffFilter = this.tempRouteDiffFilter;
      this.routeDaysFilter = this.tempRouteDaysFilter;
      this.routeActiveFilter = this.tempRouteActiveFilter;
      this.routeStateFilter = this.tempRouteStateFilter;
      this.routeDistFilter = this.tempRouteDistFilter;
      this.showToast('Filters applied');
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
        : { name:'', location:'', difficulty:'Moderate', duration:5, distance:15, imageUrl:'', description:'', latitude:null, longitude:null };
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
      const bookings = this.allBookings.filter(bk => bk.trekId === batch.id && bk.status === 'Booked');
      this.selectedBatchDetails = {
        batch: batch,
        bookings: bookings.map(bk => {
          const userObj = this.users.find(usr => usr.id === bk.userId);
          return {
            id: bk.id,
            userId: bk.userId,
            memberId: userObj ? userObj.memberId : ('TS26T' + bk.userId),
            userName: bk.user,
            userEmail: userObj ? userObj.email : '—',
            userPhone: userObj ? userObj.phone : '—',
            userCity: userObj ? userObj.city : '—',
            bookedOn: bk.date,
            paid: bk.paid,
            transactionId: bk.transactionId
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

    async resolveTicket(ticket) {
      try {
        const res = await fetch(`/api/admin/support_tickets/resolve/${ticket.id}`, { method:'POST' });
        if (res.ok) {
          this.showToast(`Ticket #${ticket.id} resolved`);
          this.loadData();
          return;
        }
      } catch (_) {}
      ticket.status = 'Resolved';
      this.showToast(`Ticket #${ticket.id} resolved (mock)`);
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
      try {
        const res = await fetch('/api/admin/jobs/trigger', {
          method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ name: job.name })
        });
        if (res.ok) { this.showToast(`Job "${job.name}" triggered`); return; }
      } catch (_) {}
      this.showToast(`"${job.name}" triggered (mock)`);
    },

    async exportCSV(type) {
      this.showToast(`Exporting ${type} CSV… you'll be notified when ready.`);
      try {
        await fetch('/api/admin/export', {
          method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ type })
        });
      } catch (_) {}
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
  template: `
  <div class="ts-admin-layout">

    <!-- ════════ SIDEBAR ════════ -->
    <aside class="ts-sidebar" :class="{ collapsed: sidebarCollapsed }">
      <div class="sidebar-brand">
        <a class="brand-name" href="#">Trail<span>Sync</span></a>
      </div>

      <nav class="sidebar-nav">
        <div class="nav-section-label">Command Centre</div>
        <a class="nav-item" :class="{ active: activeTab==='dashboard' }" @click="activeTab='dashboard'">
          <svg viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>
          <span>Dashboard</span>
        </a>


        <div class="nav-section-label">Manage</div>
        <a class="nav-item" :class="{ active: activeTab==='treks' }" @click="activeTab='treks'">
          <svg viewBox="0 0 24 24"><path d="M3 17l4-8 4 4 4-6 4 10"/><path d="M3 20h18"/></svg>
          <span>Trek Routes</span>
        </a>
        <a class="nav-item" :class="{ active: activeTab==='batches' }" @click="activeTab='batches'">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
          <span>Trek Batches</span>
        </a>
        <a class="nav-item" :class="{ active: activeTab==='staff' }" @click="activeTab='staff'">
          <svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>
          <span>Trek Staff</span>
        </a>
        <a class="nav-item" :class="{ active: activeTab==='staff_availability' }" @click="activeTab='staff_availability'">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line><path d="M8 14h.01"></path><path d="M12 14h.01"></path><path d="M16 14h.01"></path><path d="M8 18h.01"></path><path d="M12 18h.01"></path><path d="M16 18h.01"></path></svg>
          <span>Staff Availability</span>
        </a>
        <a class="nav-item" :class="{ active: activeTab==='users' }" @click="activeTab='users'">
          <svg viewBox="0 0 24 24"><circle cx="9" cy="8" r="3"/><path d="M2 19c0-3 3-5 7-5"/><circle cx="16" cy="10" r="3"/><path d="M13 19c0-3 2.7-5 6-5"/></svg>
          <span>Users</span>
        </a>
        <a class="nav-item" :class="{ active: activeTab==='bookings' }" @click="activeTab='bookings'">
          <svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
          <span>Bookings</span>
        </a>
        <a class="nav-item" :class="{ active: activeTab==='blacklist' }" @click="activeTab='blacklist'">
          <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>
          <span>Blacklist</span>
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

      <div class="sidebar-user">
        <div class="su-avatar">A</div>
        <div class="su-info">
          <div class="su-name">Admin</div>
          <div class="su-role">Superuser</div>
        </div>
        <button class="su-logout" title="Logout" @click="$emit('logout')">
          <svg viewBox="0 0 24 24"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
        </button>
      </div>
    </aside>

    <!-- ════════ MAIN ════════ -->
    <main class="ts-main">

      <!-- Top Bar -->
      <header class="ts-topbar">
        <div class="topbar-title">
          <div class="section-tag">Admin Panel</div>
          <h1 class="topbar-heading">{{ tabTitles[activeTab] || activeTab }}</h1>
        </div>
        <div class="topbar-actions">
          <div class="search-box">
            <svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input v-model="searchQuery" type="text" :placeholder="searchPlaceholder" />
          </div>
          <button v-if="activeTab==='treks'" class="btn-primary-ts" @click="openRouteModal()">+ New Route</button>
          <button v-if="activeTab==='batches'" class="btn-primary-ts" @click="openTrekModal()">+ New Batch</button>
          <button v-if="activeTab==='staff'" class="btn-primary-ts" @click="openStaffModal()">+ Add Staff</button>
          <button v-if="activeTab==='users'" class="btn-primary-ts" @click="openTrekkerModal()">+ Add Trekker</button>
          <button v-if="activeTab==='bookings'" class="btn-ghost" @click="exportCSV('bookings')">↓ Export CSV</button>
        </div>
      </header>

      <!-- ══ DASHBOARD ══════════════════════════════════════ -->
      <section v-if="activeTab==='dashboard'" class="tab-content">

        <!-- Row 1: Grouped Stats Row -->
        <div class="stats-grouped-container">
          <!-- Group 1: People & Accounts -->
          <div class="stats-group">
            <div class="stats-group-title">People & Accounts</div>
            <div class="stats-group-cards">
              <div class="stat-item-grouped" v-for="s in peopleStats" :key="s.label">
                <div class="stat-card-header-row">
                  <div class="stat-num">{{ s.value }}</div>
                  <div class="stat-icon-wrapper" :class="'stat-icon-'+s.icon">
                    <svg v-if="s.icon === 'users'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
                    <svg v-else-if="s.icon === 'staff'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="8.5" cy="7" r="4"></circle><polyline points="17 11 19 13 23 9"></polyline></svg>
                  </div>
                </div>
                <div class="stat-label">{{ s.label }}</div>
              </div>
            </div>
          </div>
          <!-- Group 2: Trek Operations -->
          <div class="stats-group">
            <div class="stats-group-title">Trek Operations</div>
            <div class="stats-group-cards">
              <div class="stat-item-grouped" v-for="s in treksStats" :key="s.label">
                <div class="stat-card-header-row">
                  <div class="stat-num">{{ s.value }}</div>
                  <div class="stat-icon-wrapper" :class="'stat-icon-'+s.icon">
                    <svg v-if="s.icon === 'mountain'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"></path><path d="M12 8l-6 10h12l-6-10z"></path></svg>
                    <svg v-else-if="s.icon === 'active'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                  </div>
                </div>
                <div class="stat-label">{{ s.label }}</div>
              </div>
            </div>
          </div>
          <!-- Group 3: Bookings Status -->
          <div class="stats-group">
            <div class="stats-group-title">Bookings Status</div>
            <div class="stats-group-cards">
              <div class="stat-item-grouped" v-for="s in bookingsStats" :key="s.label">
                <div class="stat-card-header-row">
                  <div class="stat-num">{{ s.value }}</div>
                  <div class="stat-icon-wrapper" :class="'stat-icon-'+s.icon">
                    <svg v-if="s.icon === 'book'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>
                    <svg v-else-if="s.icon === 'cancel'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>
                  </div>
                </div>
                <div class="stat-label">{{ s.label }}</div>
              </div>
            </div>
          </div>
        </div>



        <!-- Row 3: Alerts & Pending Tasks + Console Actions -->
        <div class="dashboard-grid-2col" style="margin-bottom:1.5rem">
          <!-- Left side: Alerts & Pending Tasks -->
          <div class="dash-card">
            <div class="dash-card-header">
              <span class="dash-card-title">Alerts & Pending Tasks</span>
            </div>
            <div class="alerts-tasks-dashboard-grid">
              <div class="task-alert-card" v-for="item in alertsAndTasks" :key="item.label" :class="{ warning: item.count > 0 && item.count <= 5, danger: item.count > 5 }">
                <div class="task-card-icon-col">{{ item.type === 'starting_this_week' ? 'ℹ' : '⚠' }}</div>
                <div class="task-card-body-col">
                  <div class="task-card-num">{{ item.count }}</div>
                  <div class="task-card-label">{{ item.label }}</div>
                </div>
                <button class="btn-ghost task-resolve-btn" style="padding: 4px 10px; font-size: 0.72rem; border-radius: 3px;" @click="handleTaskAction(item.type)">
                  {{ item.type === 'starting_this_week' ? 'Manage' : 'Resolve' }} →
                </button>
              </div>
            </div>
          </div>

          <!-- Right side: Operations Control Deck -->
          <div class="dash-card">
            <div class="dash-card-header"><span class="dash-card-title">Operations Console</span></div>
            <div class="console-groups-container">
              <!-- Group 1: Creation Tools -->
              <div class="console-group">
                <div class="console-group-label">Creation Tools</div>
                <div class="console-group-buttons">
                  <button class="console-btn btn-create" @click="openRouteModal()">
                    <svg viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                    <span>Create Trek Route</span>
                  </button>
                  <button class="console-btn btn-create" @click="openTrekModal()">
                    <svg viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                    <span>Schedule Batch</span>
                  </button>
                  <button class="console-btn btn-create" @click="openStaffModal()">
                    <svg viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                    <span>Add Staff</span>
                  </button>
                  <button class="console-btn btn-create" @click="openTrekkerModal()">
                    <svg viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                    <span>Add Trekker</span>
                  </button>
                </div>
              </div>

              <!-- Group 2: Directory Management -->
              <div class="console-group">
                <div class="console-group-label">Directory Management</div>
                <div class="console-group-buttons">
                  <button class="console-btn btn-manage" @click="activeTab='users'">
                    <svg viewBox="0 0 24 24"><circle cx="9" cy="8" r="3"/><path d="M2 19c0-3 3-5 7-5"/><circle cx="16" cy="10" r="3"/><path d="M13 19c0-3 2.7-5 6-5"/></svg>
                    <span>Manage Trekkers</span>
                  </button>
                  <button class="console-btn btn-manage" @click="activeTab='staff'">
                    <svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>
                    <span>Manage Staff</span>
                  </button>
                </div>
              </div>

              <!-- Group 3: Data & Insights -->
              <div class="console-group">
                <div class="console-group-label">Data & Insights</div>
                <div class="console-group-buttons">
                  <button class="console-btn btn-data" @click="activeTab='reports'">
                    <svg viewBox="0 0 24 24"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
                    <span>Reports Center</span>
                  </button>
                  <button class="console-btn btn-data" @click="exportCSV('all')">
                    <svg viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                    <span>Export Data</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Row 4: Monthly Bookings Trend (Line Chart) + Trek Status Distribution -->
        <div class="dashboard-grid-equal" style="margin-bottom:1.5rem">
          <!-- Left side: Monthly Bookings Trend -->
          <div class="dash-card">
            <div class="dash-card-header"><span class="dash-card-title">Monthly Bookings Trend</span></div>
            <div class="chart-svg-wrap">
              <svg viewBox="0 0 700 180" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:auto">
                <defs>
                  <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stop-color="#c8922a" stop-opacity="0.25"/>
                    <stop offset="100%" stop-color="#c8922a" stop-opacity="0.02"/>
                  </linearGradient>
                </defs>
                <!-- grid -->
                <line v-for="i in 4" :key="'g'+i" :x1="30" :y1="30 + (i-1)*35" :x2="670" :y2="30+(i-1)*35" class="chart-grid-line"/>
                <!-- area -->
                <path :d="buildAreaPath(monthlyBookings,'count',700,180,30)" class="chart-area-fill"/>
                <!-- line -->
                <path :d="buildLinePath(monthlyBookings,'count',700,180,30)" class="chart-line-path"/>
                <!-- dots & labels -->
                <g v-for="(m,i) in monthlyBookings" :key="'dot'+i">
                  <circle
                    :cx="30 + (i/(monthlyBookings.length-1))*(700-60)"
                    :cy="180 - 30 - (m.count/maxMonthly)*(180-60)"
                    r="3.5" class="chart-dot"/>
                  <text
                    :x="30 + (i/(monthlyBookings.length-1))*(700-60)"
                    y="172" text-anchor="middle" class="chart-axis-label">{{ m.month }}</text>
                </g>
              </svg>
            </div>
          </div>
          <!-- Right side: Trek Status Distribution -->
          <div class="dash-card">
            <div class="dash-card-header"><span class="dash-card-title">Trek Status Distribution</span></div>
            <div class="status-overview">
              <div v-for="s in trekStatusOverview" :key="s.label" class="status-overview-item">
                <div class="so-bar-wrap"><div class="so-bar" :style="{ width: s.pct+'%', background: s.color }"></div></div>
                <div class="so-meta"><span class="so-label">{{ s.label }}</span><span class="so-count">{{ s.count }}</span></div>
              </div>
            </div>
          </div>
        </div>

        <!-- Row 5: Upcoming Treks + Slot Utilization -->
        <div class="dashboard-grid-equal">
          <div class="dash-card">
            <div class="dash-card-header">
              <span class="dash-card-title">Upcoming Treks</span>
              <button class="btn-ghost" style="padding: 2px 8px; font-size: 0.72rem; border-radius: 3px;" @click="activeTab='treks'">View All →</button>
            </div>
            <div class="upcoming-list">
              <div v-for="t in upcomingTreks" :key="t.name" class="upcoming-item">
                <div style="display:flex; flex-direction:column; align-items:center; min-width:80px; border-right:1px solid rgba(26,46,26,.08); padding-right:10px; margin-right:10px;">
                  <span class="upcoming-days" style="font-size:1.2rem; display:block;">{{ t.daysLeft }}</span>
                  <span class="upcoming-label" style="font-size:0.58rem; text-transform:uppercase; letter-spacing:0.05em;">{{ t.daysLeft === 1 ? 'day left' : 'days left' }}</span>
                </div>
                <div class="upcoming-info">
                  <div class="upcoming-name" style="font-weight:600; color:var(--forest); font-size:0.88rem;">{{ t.name }}</div>
                  <div style="display:flex; justify-content:space-between; flex-wrap:wrap; gap:8px; margin-top:4px;">
                    <span class="upcoming-staff" style="font-size:0.75rem; color:var(--stone);">Staff: <strong style="color:var(--forest-mid)">{{ (!t.staff || t.staff.toLowerCase().includes('unassigned') || t.staff.toLowerCase().includes('not assigned')) ? 'not assigned' : t.staff }}</strong></span>
                    <span class="mono" style="font-size:0.74rem; color:var(--stone);">Start: {{ formatDate(t.startDate) }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div class="dash-card">
            <div class="dash-card-header">
              <span class="dash-card-title">Slot Utilization</span>
              <button class="btn-ghost" style="padding: 2px 8px; font-size: 0.72rem; border-radius: 3px;" @click="activeTab='analytics'">View All →</button>
            </div>
            <div class="occ-list">
              <div v-for="s in slotUtilization" :key="s.trek" class="occ-item">
                <div class="occ-meta">
                  <span class="occ-trek">{{ s.trek }}</span>
                  <span class="occ-pct">{{ s.pct }}% ({{ s.booked }}/{{ s.total }})</span>
                </div>
                <div class="occ-bar-track">
                  <div class="occ-bar-fill" :class="occColor(s.pct)" :style="{ width: s.pct+'%' }"></div>
                </div>
              </div>
            </div>
          </div>
        </div>

      </section>



      <!-- ══ TREK ROUTES ════════════════════════════════ -->
      <section v-if="activeTab==='treks'" class="tab-content">
        <!-- Filters Bar -->
        <!-- Filters Bar -->
        <div class="route-filters-bar" style="display: flex; flex-wrap: wrap; gap: 1rem; margin-bottom: 1.25rem; background: var(--snow); padding: 1.25rem; border-radius: 8px; border: 1px solid var(--stone-light); align-items: flex-end;">
          
          <!-- Difficulty Dropdown -->
          <div class="filter-group" style="display: flex; flex-direction: column; gap: 4px; min-width: 140px;">
            <label style="font-size: 0.72rem; font-weight: 600; color: var(--forest-mid);">DIFFICULTY</label>
            <div class="custom-select-wrapper" :class="{ 'is-open': showDiffFilterDropdown }">
              <div class="custom-select-trigger" @click.stop="toggleRouteFilterDropdown('showDiffFilterDropdown')" style="padding: 6px 12px; font-size: 0.84rem; border-radius: 4px; background: white; border: 1px solid var(--stone);">
                <span>{{ tempRouteDiffFilter }}</span>
                <svg viewBox="0 0 24 24" class="custom-select-arrow" :class="{ open: showDiffFilterDropdown }"><polyline points="6 9 12 15 18 9"/></svg>
              </div>
              <div v-if="showDiffFilterDropdown" class="custom-select-dropdown" style="top: 100%; margin-top: 4px; z-index: 1050;">
                <div class="custom-select-options" style="max-height: 200px; overflow-y: auto;">
                  <div v-for="opt in ['All', 'Easy', 'Moderate', 'Hard']" :key="opt" class="custom-select-option" :class="{ selected: tempRouteDiffFilter === opt }" @click="tempRouteDiffFilter = opt; showDiffFilterDropdown = false;">
                    <span class="option-name">{{ opt }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Duration Dropdown -->
          <div class="filter-group" style="display: flex; flex-direction: column; gap: 4px; min-width: 140px;">
            <label style="font-size: 0.72rem; font-weight: 600; color: var(--forest-mid);">DURATION</label>
            <div class="custom-select-wrapper" :class="{ 'is-open': showDaysFilterDropdown }">
              <div class="custom-select-trigger" @click.stop="toggleRouteFilterDropdown('showDaysFilterDropdown')" style="padding: 6px 12px; font-size: 0.84rem; border-radius: 4px; background: white; border: 1px solid var(--stone);">
                <span>{{ tempRouteDaysFilter === 'All' ? 'All' : (tempRouteDaysFilter === '<5' ? '< 5 Days' : (tempRouteDaysFilter === '5-7' ? '5 - 7 Days' : '> 7 Days')) }}</span>
                <svg viewBox="0 0 24 24" class="custom-select-arrow" :class="{ open: showDaysFilterDropdown }"><polyline points="6 9 12 15 18 9"/></svg>
              </div>
              <div v-if="showDaysFilterDropdown" class="custom-select-dropdown" style="top: 100%; margin-top: 4px; z-index: 1050;">
                <div class="custom-select-options" style="max-height: 200px; overflow-y: auto;">
                  <div class="custom-select-option" :class="{ selected: tempRouteDaysFilter === 'All' }" @click="tempRouteDaysFilter = 'All'; showDaysFilterDropdown = false;">
                    <span class="option-name">All</span>
                  </div>
                  <div class="custom-select-option" :class="{ selected: tempRouteDaysFilter === '<5' }" @click="tempRouteDaysFilter = '<5'; showDaysFilterDropdown = false;">
                    <span class="option-name">&lt; 5 Days</span>
                  </div>
                  <div class="custom-select-option" :class="{ selected: tempRouteDaysFilter === '5-7' }" @click="tempRouteDaysFilter = '5-7'; showDaysFilterDropdown = false;">
                    <span class="option-name">5 - 7 Days</span>
                  </div>
                  <div class="custom-select-option" :class="{ selected: tempRouteDaysFilter === '>7' }" @click="tempRouteDaysFilter = '>7'; showDaysFilterDropdown = false;">
                    <span class="option-name">&gt; 7 Days</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Status Dropdown -->
          <div class="filter-group" style="display: flex; flex-direction: column; gap: 4px; min-width: 140px;">
            <label style="font-size: 0.72rem; font-weight: 600; color: var(--forest-mid);">STATUS</label>
            <div class="custom-select-wrapper" :class="{ 'is-open': showActiveFilterDropdown }">
              <div class="custom-select-trigger" @click.stop="toggleRouteFilterDropdown('showActiveFilterDropdown')" style="padding: 6px 12px; font-size: 0.84rem; border-radius: 4px; background: white; border: 1px solid var(--stone);">
                <span>{{ tempRouteActiveFilter }}</span>
                <svg viewBox="0 0 24 24" class="custom-select-arrow" :class="{ open: showActiveFilterDropdown }"><polyline points="6 9 12 15 18 9"/></svg>
              </div>
              <div v-if="showActiveFilterDropdown" class="custom-select-dropdown" style="top: 100%; margin-top: 4px; z-index: 1050;">
                <div class="custom-select-options" style="max-height: 200px; overflow-y: auto;">
                  <div v-for="opt in ['All', 'Active', 'Closed']" :key="opt" class="custom-select-option" :class="{ selected: tempRouteActiveFilter === opt }" @click="tempRouteActiveFilter = opt; showActiveFilterDropdown = false;">
                    <span class="option-name">{{ opt }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- State Dropdown -->
          <div class="filter-group" style="display: flex; flex-direction: column; gap: 4px; min-width: 160px;">
            <label style="font-size: 0.72rem; font-weight: 600; color: var(--forest-mid);">STATE</label>
            <div class="custom-select-wrapper" :class="{ 'is-open': showStateFilterDropdown }">
              <div class="custom-select-trigger" @click.stop="toggleRouteFilterDropdown('showStateFilterDropdown')" style="padding: 6px 12px; font-size: 0.84rem; border-radius: 4px; background: white; border: 1px solid var(--stone);">
                <span>{{ tempRouteStateFilter === 'All' ? 'All States' : tempRouteStateFilter }}</span>
                <svg viewBox="0 0 24 24" class="custom-select-arrow" :class="{ open: showStateFilterDropdown }"><polyline points="6 9 12 15 18 9"/></svg>
              </div>
              <div v-if="showStateFilterDropdown" class="custom-select-dropdown" style="top: 100%; margin-top: 4px; z-index: 1050; max-height: 400px;">
                <div class="custom-select-options" style="max-height: 380px; overflow-y: auto;">
                  <div class="custom-select-option" :class="{ selected: tempRouteStateFilter === 'All' }" @click="tempRouteStateFilter = 'All'; showStateFilterDropdown = false;">
                    <span class="option-name">All States</span>
                  </div>
                  <div v-for="st in routeStates" :key="st" class="custom-select-option" :class="{ selected: tempRouteStateFilter === st }" @click="tempRouteStateFilter = st; showStateFilterDropdown = false;">
                    <span class="option-name">{{ st }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Distance Dropdown -->
          <div class="filter-group" style="display: flex; flex-direction: column; gap: 4px; min-width: 150px;">
            <label style="font-size: 0.72rem; font-weight: 600; color: var(--forest-mid);">DISTANCE RANGE</label>
            <div class="custom-select-wrapper" :class="{ 'is-open': showDistFilterDropdown }">
              <div class="custom-select-trigger" @click.stop="toggleRouteFilterDropdown('showDistFilterDropdown')" style="padding: 6px 12px; font-size: 0.84rem; border-radius: 4px; background: white; border: 1px solid var(--stone);">
                <span>{{ tempRouteDistFilter === 'All' ? 'All' : (tempRouteDistFilter === '<10' ? '< 10 km' : (tempRouteDistFilter === '10-20' ? '10 - 20 km' : '> 20 km')) }}</span>
                <svg viewBox="0 0 24 24" class="custom-select-arrow" :class="{ open: showDistFilterDropdown }"><polyline points="6 9 12 15 18 9"/></svg>
              </div>
              <div v-if="showDistFilterDropdown" class="custom-select-dropdown" style="top: 100%; margin-top: 4px; z-index: 1050;">
                <div class="custom-select-options" style="max-height: 200px; overflow-y: auto;">
                  <div class="custom-select-option" :class="{ selected: tempRouteDistFilter === 'All' }" @click="tempRouteDistFilter = 'All'; showDistFilterDropdown = false;">
                    <span class="option-name">All</span>
                  </div>
                  <div class="custom-select-option" :class="{ selected: tempRouteDistFilter === '<10' }" @click="tempRouteDistFilter = '<10'; showDistFilterDropdown = false;">
                    <span class="option-name">&lt; 10 km</span>
                  </div>
                  <div class="custom-select-option" :class="{ selected: tempRouteDistFilter === '10-20' }" @click="tempRouteDistFilter = '10-20'; showDistFilterDropdown = false;">
                    <span class="option-name">10 - 20 km</span>
                  </div>
                  <div class="custom-select-option" :class="{ selected: tempRouteDistFilter === '>20' }" @click="tempRouteDistFilter = '>20'; showDistFilterDropdown = false;">
                    <span class="option-name">&gt; 20 km</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Buttons Group -->
          <div style="display: flex; gap: 0.5rem; align-self: flex-end;">
            <button class="filter-btn reset-btn" style="padding: 6px 14px; font-size: 0.8rem; border-radius: 4px; background: white; border: 1px solid var(--stone); color: var(--stone-dark);" @click="resetRouteFilters">
              Clear Filters
            </button>
            <button class="btn-primary-ts" style="padding: 6px 16px; font-size: 0.8rem; border-radius: 4px;" @click="applyRouteFilters">
              Apply Filters
            </button>
          </div>
        </div>
        <!-- View switch controls -->
        <div style="display: flex; justify-content: flex-end; margin-bottom: 1.25rem;">
          <div class="view-switch-btns" style="display: flex; gap: 0.5rem;">
            <button class="filter-btn" :class="{ active: routeViewMode === 'cards' }" @click="routeViewMode = 'cards'">
              Card View
            </button>
            <button class="filter-btn" :class="{ active: routeViewMode === 'list' }" @click="routeViewMode = 'list'">
              List View
            </button>
          </div>
        </div>

        <!-- Card View -->
        <div v-if="routeViewMode==='cards' && filteredRoutes.length" class="cards-grid">
          <div class="trek-route-card" v-for="r in filteredRoutes" :key="r.id">
            <div class="route-card-img" :style="{ backgroundImage: 'url(' + (r.imageUrl || 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&q=80') + ')' }">
              <div class="route-card-badge" :class="'difficulty-' + r.difficulty.toLowerCase()">{{ r.difficulty }}</div>
              <div class="route-card-status" :class="r.active ? 'status-active' : 'status-inactive'">
                {{ r.active ? 'Active' : 'Closed' }}
              </div>
            </div>
            <div class="route-card-content">
              <div class="route-card-code">{{ r.trekCode }}</div>
              <h4 class="route-card-name">{{ r.name }}</h4>
              <div class="route-card-meta">
                <span>📍 {{ r.location }}</span>
                <span>⏱ {{ r.duration }} days</span>
                <span>⛰ {{ r.distance }} km</span>
              </div>
              <p class="route-card-desc">{{ r.description || 'No description provided.' }}</p>
              <div class="route-card-actions">
                <button class="act-btn act-view" @click="viewRouteDetails(r)">
                  <svg viewBox="0 0 24 24" class="act-btn-icon"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                  View Details
                </button>
                <div class="action-group-ops">
                  <button class="act-btn" :class="r.active ? 'act-close' : 'act-open'" @click="toggleRouteStatus(r)">
                    <svg v-if="r.active" viewBox="0 0 24 24" class="act-btn-icon"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                    <svg v-else viewBox="0 0 24 24" class="act-btn-icon"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 9.9-1"/></svg>
                    {{ r.active ? 'Close' : 'Open' }}
                  </button>
                  <button class="act-btn act-edit" @click="openRouteModal(r)">
                    <svg viewBox="0 0 24 24" class="act-btn-icon"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
                    Edit
                  </button>
                  <button class="act-btn act-delete-btn" @click="deleteRoute(r.id)">
                    <svg viewBox="0 0 24 24" class="act-btn-icon"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
                    Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- List View -->
        <div v-if="routeViewMode==='list' && filteredRoutes.length" class="ts-table-wrap">
          <table class="ts-table">
            <thead>
              <tr>
                <th>Trek ID</th>
                <th>Trek Name</th>
                <th>Location</th>
                <th>Difficulty</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="r in filteredRoutes" :key="r.id">
                <td class="mono font-bold">{{ r.trekCode }}</td>
                <td class="trek-name-cell">{{ r.name }}</td>
                <td>{{ r.location }}</td>
                <td><span :class="'diff-pill pill-'+r.difficulty.toLowerCase()">{{ r.difficulty }}</span></td>
                <td>
                  <span :class="['status-pill', r.active ? 'status-active' : 'status-inactive']">
                    {{ r.active ? 'Active' : 'Inactive' }}
                  </span>
                </td>
                <td>
                  <div class="action-group-container">
                    <div class="action-group-mgmt">
                      <button class="act-btn act-edit" @click="openRouteModal(r)">
                        <svg viewBox="0 0 24 24" class="act-btn-icon"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
                        Edit
                      </button>
                      <button class="act-btn act-view" @click="viewRouteDetails(r)">
                        <svg viewBox="0 0 24 24" class="act-btn-icon"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                        View Details
                      </button>
                    </div>
                    <div class="action-group-ops">
                      <button class="act-btn" :class="r.active ? 'act-close' : 'act-open'" @click="toggleRouteStatus(r)">
                        <svg v-if="r.active" viewBox="0 0 24 24" class="act-btn-icon"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                        <svg v-else viewBox="0 0 24 24" class="act-btn-icon"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 9.9-1"/></svg>
                        {{ r.active ? 'Close' : 'Open' }}
                      </button>
                      <button class="act-btn act-delete-btn" @click="deleteRoute(r.id)">
                        <svg viewBox="0 0 24 24" class="act-btn-icon"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
                        Delete
                      </button>
                    </div>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div v-if="!filteredRoutes.length" class="empty-state">
          <svg viewBox="0 0 24 24"><path d="M3 17l4-8 4 4 4-6 4 10"/><path d="M3 20h18"/></svg>
          <p>No trek routes found.</p>
        </div>
      </section>

      <!-- ══ TREK BATCHES ════════════════════════════════ -->
      <section v-if="activeTab==='batches'" class="tab-content">
        <div class="filter-bar">
          <button v-for="f in ['All','Open','Closed','Completed']" :key="f"
            class="filter-btn" :class="{ active: trekFilter===f }" @click="trekFilter=f">{{ f }}</button>
        </div>
        <div class="ts-table-wrap">
          <table class="ts-table">
            <thead>
              <tr>
                <th>Batch ID</th>
                <th>Trek Name</th>
                <th>Location</th>
                <th>Difficulty</th>
                <th>Dates</th>
                <th>Slots</th>
                <th>Staff</th>
                <th>Price</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="t in filteredTreks" :key="t.id">
                <td class="mono font-bold">{{ t.batchCode }}</td>
                <td class="trek-name-cell">{{ t.name }}</td>
                <td>{{ t.location }}</td>
                <td><span :class="'diff-pill pill-'+t.difficulty.toLowerCase()">{{ t.difficulty }}</span></td>
                <td class="mono" style="white-space:nowrap">{{ formatDate(t.startDate) }} → {{ formatDate(t.endDate) }}</td>
                <td class="mono">{{ t.booked }}/{{ t.slots }}</td>
                <td>{{ t.staff || '—' }}</td>
                <td class="mono">₹{{ t.price ? t.price.toLocaleString() : '—' }}</td>
                <td><span :class="'status-pill status-'+t.status.toLowerCase()">{{ t.status }}</span></td>
                <td>
                  <div class="batch-actions-layout">
                    <div class="batch-actions-row">
                      <button class="act-btn act-view" @click="viewBatchDetails(t)">
                        <svg viewBox="0 0 24 24" class="act-btn-icon" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                        View Details
                      </button>
                      <button class="act-btn act-assign" @click="assignStaffToTrek(t)">
                        <svg viewBox="0 0 24 24" class="act-btn-icon"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></svg>
                        {{ (t.staff && !t.staff.toLowerCase().includes('unassigned') && !t.staff.toLowerCase().includes('not assigned')) ? 'Change Guide' : 'Assign Guide' }}
                      </button>
                    </div>
                    <div class="batch-actions-row">
                      <button class="act-btn act-edit" @click="openTrekModal(t)">
                        <svg viewBox="0 0 24 24" class="act-btn-icon"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
                        Edit
                      </button>
                      <button class="act-btn act-delete-btn" @click="deleteTrek(t.id)">
                        <svg viewBox="0 0 24 24" class="act-btn-icon"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
                        Delete
                      </button>
                    </div>
                  </div>
                </td>
              </tr>
              <tr v-if="!filteredTreks.length">
                <td colspan="10" style="text-align:center; padding:2rem; color:var(--stone)">No batches match this filter.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <!-- ══ STAFF MANAGEMENT ═══════════════════════════════ -->
      <section v-if="activeTab==='staff'" class="tab-content">
        <!-- View Toggle Controls -->
        <div style="display: flex; justify-content: flex-end; margin-bottom: 1.25rem;">
          <div class="view-switch-btns" style="display: flex; gap: 0.5rem;">
            <button class="filter-btn" :class="{ active: staffViewMode === 'cards' }" @click="staffViewMode = 'cards'">
              Card View
            </button>
            <button class="filter-btn" :class="{ active: staffViewMode === 'list' }" @click="staffViewMode = 'list'">
              List View
            </button>
          </div>
        </div>

        <!-- Card Grid View -->
        <div v-if="staffViewMode==='cards' && filteredStaff.length" class="cards-grid">
          <div class="staff-card" v-for="s in filteredStaff" :key="s.id">
            <div class="staff-card-header" style="display: flex; justify-content: space-between; align-items: center;">
              <div style="display: flex; align-items: center;">
                <img :src="s.photoUrl" class="staff-card-photo" style="width: 50px; height: 50px; border-radius: 50%; object-fit: cover; border: 2px solid var(--forest);" />
                <div style="margin-left: 10px;">
                  <div class="staff-card-name" style="font-weight: 700; color: var(--forest);">{{ s.name }}</div>
                  <div class="staff-card-role" style="font-size: 0.75rem; color: var(--stone);">{{ s.designation || 'Trek Guide' }}</div>
                </div>
              </div>
              <!-- Goldish theme badge for completed treks -->
              <div class="treks-completed-badge" style="background: rgba(200, 146, 42, 0.08); border: 1px solid rgba(200, 146, 42, 0.25); border-radius: 6px; padding: 6px 10px; text-align: center; min-width: 60px;">
                <div style="font-size: 1.1rem; font-weight: 800; color: var(--gold); line-height: 1;">{{ s.completedTreksCount }}</div>
                <div style="font-size: 0.55rem; font-weight: 600; color: var(--gold); text-transform: uppercase; letter-spacing: 0.05em; margin-top: 2px;">Treks Done</div>
              </div>
            </div>

            <div style="padding: 10px 0; border-top: 1px solid var(--stone-light); border-bottom: 1px solid var(--stone-light); margin: 8px 0; font-size: 0.82rem;">
              <div><strong>Email:</strong> {{ s.contact }}</div>
              <div><strong>Phone:</strong> {{ s.phone || '—' }}</div>
              <div><strong>Joined:</strong> {{ formatDate(s.joined) }}</div>
            </div>

            <div class="staff-actions" style="margin-top:.75rem; display: flex; gap: 4px; flex-wrap: wrap;">
              <button class="act-btn act-view" style="flex: 1; min-width: 70px; padding: 4px;" @click="viewStaffDetails(s)">
                <svg viewBox="0 0 24 24" class="act-btn-icon"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                Details
              </button>
              <button class="act-btn act-edit" style="flex: 1; min-width: 70px; padding: 4px;" @click="openStaffModal(s)">
                <svg viewBox="0 0 24 24" class="act-btn-icon"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
                Edit
              </button>
              <button class="act-btn act-assign" style="flex: 1.2; min-width: 80px; padding: 4px;" @click="assignTrekToStaff(s)">
                <svg viewBox="0 0 24 24" class="act-btn-icon" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                Assign
              </button>
              <button class="act-btn" :class="s.blacklisted ? 'act-open' : 'act-blacklist-btn'" style="flex: 1; min-width: 70px; padding: 4px;" @click="toggleStaffBlacklist(s)">
                <svg viewBox="0 0 24 24" class="act-btn-icon" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"></line></svg>
                {{ s.blacklisted ? 'Restore' : 'Black' }}
              </button>
            </div>
          </div>
        </div>

        <!-- List View Table -->
        <div v-if="staffViewMode==='list' && filteredStaff.length" class="ts-table-wrap">
          <table class="ts-table">
            <thead>
              <tr>
                <th>Staff ID</th>
                <th>Name</th>
                <th>Contact Info</th>
                <th style="text-align: center;">Treks Completed</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="s in filteredStaff" :key="s.id">
                <td class="mono" style="font-size: 0.8rem;">{{ s.memberId || 'TS26S' + s.id }}</td>
                <td>
                  <span style="font-weight:600; color:var(--forest)">{{ s.name }}</span>
                </td>
                <td>
                  <div class="mono" style="font-size:0.8rem; color:var(--forest-mid)">{{ s.contact }}</div>
                  <div style="font-size:0.75rem; color:var(--stone)">{{ s.phone || 'No phone' }}</div>
                </td>
                <td class="mono font-bold" style="text-align: center;">{{ s.completedTreksCount }}</td>
                <td>
                  <span :class="['status-pill', s.blacklisted ? 'status-inactive' : (s.active ? 'status-active' : 'status-pending')]">
                    {{ s.blacklisted ? 'Blacklisted' : (s.active ? 'Active' : 'Inactive') }}
                  </span>
                </td>
                <td>
                  <div class="action-btns" style="display:flex; gap:6px;">
                    <button class="act-btn act-view" @click="viewStaffDetails(s)">
                      <svg viewBox="0 0 24 24" class="act-btn-icon"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                      View Details
                    </button>
                    <button class="act-btn act-edit" @click="openStaffModal(s)">
                      <svg viewBox="0 0 24 24" class="act-btn-icon"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
                      Edit
                    </button>
                    <button class="act-btn act-assign" @click="assignTrekToStaff(s)">
                      <svg viewBox="0 0 24 24" class="act-btn-icon" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                      Assign Trek
                    </button>
                    <button class="act-btn" :class="s.blacklisted ? 'act-open' : 'act-blacklist-btn'" @click="toggleStaffBlacklist(s)">
                      <svg viewBox="0 0 24 24" class="act-btn-icon" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"></line></svg>
                      {{ s.blacklisted ? 'Restore' : 'Blacklist' }}
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div v-if="!filteredStaff.length" class="empty-state">
          <svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>
          <p>No staff match your search.</p>
        </div>
      </section>

      <!-- ══ STAFF AVAILABILITY CALENDAR ═══════════════════ -->
      <section v-if="activeTab==='staff_availability'" class="tab-content">
        <!-- Visual Timeline Monthly Calendar (TOP) -->
        <div class="calendar-timeline-container" style="margin-top: 0; margin-bottom: 1.5rem;">
          <div class="calendar-timeline-header">
            <h4 style="color: var(--forest); margin: 0; font-size: 1.1rem; font-weight: 600;">
              📅 Monthly Guide Schedule Overview
            </h4>
            <div style="display: flex; align-items: center; gap: 1rem;">
              <button class="btn-ghost" style="padding: 4px 12px; font-size: 0.8rem;" @click="changeCalendarMonth(-1)">◀ Prev</button>
              <span style="font-weight: 600; font-size: 0.95rem; color: var(--forest); min-width: 120px; text-align: center;">
                {{ getMonthName(calendarMonth) }} {{ calendarYear }}
              </span>
              <button class="btn-ghost" style="padding: 4px 12px; font-size: 0.8rem;" @click="changeCalendarMonth(1)">Next ▶</button>
            </div>
          </div>

          <div class="calendar-table-wrap">
            <table class="calendar-table">
              <thead>
                <tr>
                  <th class="staff-name-col" style="background: #f7fafc; font-weight: bold;">Trek Guide</th>
                  <th v-for="d in daysInActiveMonth" :key="d" 
                      :class="{ 'weekend': isWeekend(d) }"
                      style="font-size: 0.74rem; padding: 6px 4px; min-width: 30px;">
                    <div>{{ d }}</div>
                    <div style="font-size: 0.65rem; color: var(--stone); margin-top: 2px; text-transform: uppercase;">{{ getWeekdayLetter(d) }}</div>
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="s in staffList" :key="s.id">
                  <td class="staff-name-col">
                    <div style="display: flex; gap: 8px; align-items: center;">
                      <img :src="s.photoUrl" style="width: 28px; height: 28px; border-radius: 50%; object-fit: cover;" />
                      <div>
                        <div style="font-weight: 600; font-size: 0.82rem; white-space: nowrap;">{{ s.name }}</div>
                        <div style="font-size: 0.7rem; color: var(--stone); white-space: nowrap;">{{ s.designation }}</div>
                      </div>
                    </div>
                  </td>
                  <td v-for="d in daysInActiveMonth" :key="d"
                      :class="{ 
                        'weekend': isWeekend(d), 
                        'busy-day': isStaffBusyOnDay(s, d), 
                        'custom-blocked-day': isStaffBusyOnDay(s, d) && !getConflictTrekForDay(s, d),
                        'free-day': !isStaffBusyOnDay(s, d)
                      }"
                      class="day-cell"
                      style="height: 36px; min-width: 32px; cursor: pointer; user-select: none;"
                      @click="toggleDayAvailability(s, d)"
                      @mouseenter="showTooltip($event, s, d)"
                      @mouseleave="hideTooltip">
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Quick Date Checker (BOTTOM) -->
        <div style="background: #fff; border-radius: 6px; border: 1px solid rgba(26,46,26,.09); padding: 1.5rem;">
          <h4 style="color: var(--forest); margin: 0 0 1rem 0; font-size: 1.1rem; font-weight: 600;">
            🔍 Quick Date Range Availability Checker
          </h4>
          <div style="display: flex; flex-wrap: wrap; gap: 1rem; align-items: flex-end; margin-bottom: 1.5rem; background: #fcfdfd; border: 1px solid #edf2f7; padding: 15px; border-radius: 6px;">
            <div class="form-group" style="margin-bottom: 0; min-width: 180px; flex: 1;">
              <label style="font-weight: 600; font-size: 0.82rem; color: var(--bark);">Start Date</label>
              <input v-model="availabilityStart" type="date" style="width: 100%;" />
            </div>
            <div class="form-group" style="margin-bottom: 0; min-width: 180px; flex: 1;">
              <label style="font-weight: 600; font-size: 0.82rem; color: var(--bark);">End Date</label>
              <input v-model="availabilityEnd" type="date" style="width: 100%;" />
            </div>
            <button class="btn-primary-ts" style="height: 38px; padding: 0 24px; font-weight: 600;" @click="triggerCheckRange">
              Check Availability
            </button>
          </div>

          <!-- Availability Results list -->
          <div v-if="hasCheckedRange">
            <h5 style="color: var(--forest-mid); font-size: 1rem; margin: 1.5rem 0 0.75rem 0; font-weight: 600; display: flex; justify-content: space-between; align-items: center;">
              <span>Available Guides ({{ checkedStart }} to {{ checkedEnd }})</span>
              <span class="status-pill status-open" style="font-size: 0.76rem; padding: 4px 10px;">{{ availableStaff.length }} Free Guide{{ availableStaff.length !== 1 ? 's' : '' }}</span>
            </h5>

            <div v-if="availableStaff.length" class="ts-table-wrap">
              <table class="ts-table">
                <thead>
                  <tr>
                    <th>Guide Info</th>
                    <th>Designation</th>
                    <th>Experience</th>
                    <th>Languages</th>
                    <th>Certifications</th>
                    <th>Specialty Skills</th>
                    <th style="text-align: center;">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="s in availableStaff" :key="s.id">
                    <td>
                      <div style="display: flex; gap: 10px; align-items: center; cursor: pointer;" @click="viewStaffDetails(s)" title="Click to view full profile">
                        <img :src="s.photoUrl" style="width: 32px; height: 32px; border-radius: 50%; object-fit: cover;" />
                        <div>
                          <div style="font-weight: 600; color: var(--forest); transition: color 0.15s;" @mouseenter="$event.target.style.color = 'var(--gold)'" @mouseleave="$event.target.style.color = 'var(--forest)'">{{ s.name }}</div>
                          <div style="font-size: 0.72rem; color: var(--stone);">{{ s.memberId }}</div>
                        </div>
                      </div>
                    </td>
                    <td>{{ s.designation }}</td>
                    <td class="mono font-bold">{{ s.experience }} Years</td>
                    <td>{{ s.languages }}</td>
                    <td style="font-size: 0.82rem; color: var(--bark);">{{ s.certifications }}</td>
                    <td style="font-size: 0.82rem; color: var(--bark);">{{ s.skills }}</td>
                    <td style="text-align: center;">
                      <div class="action-btns" style="display: flex; justify-content: center; gap: 6px;">
                        <button class="act-btn act-view" style="padding: 4px 10px;" @click="viewStaffDetails(s)">
                          <svg viewBox="0 0 24 24" class="act-btn-icon"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                          View Profile
                        </button>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div v-else style="text-align: center; padding: 3rem 1rem; background: #fff5f5; border: 1px dashed #feb2b2; border-radius: 6px; color: #c53030; font-size: 0.9rem;">
              ⚠️ No staff guides are free between these dates. Try checking a different date range or adjusting existing assignments.
            </div>
          </div>
          <div v-else style="text-align: center; padding: 3rem 1rem; background: #fafafa; border: 1px dashed #e2e8f0; border-radius: 6px; color: var(--stone); font-size: 0.88rem; font-style: italic;">
            Select a start and end date and click "Check Availability" to search for free guides.
          </div>
        </div>

        <!-- Global Floating Tooltip -->
        <div v-if="calendarTooltip.show" 
             :style="{ left: calendarTooltip.x + 'px', top: calendarTooltip.y + 'px' }" 
             class="global-calendar-tooltip">
          <div v-html="calendarTooltip.content"></div>
          <div class="tooltip-arrow"></div>
        </div>
      </section>

      <!-- ══ USER MANAGEMENT ════════════════════════════════ -->
      <section v-if="activeTab==='users'" class="tab-content">
        <div class="filter-bar">
          <button v-for="f in ['All','Active','Blacklisted']" :key="f"
            class="filter-btn" :class="{ active: userFilter===f }" @click="userFilter=f">{{ f }}</button>
        </div>
        <div class="ts-table-wrap">
          <table class="ts-table">
            <thead>
              <tr>
                <th>User ID</th>
                <th>Name</th>
                <th>Email</th>
                <th>Contact</th>
                <th>Joined</th>
                <th>Treks</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="u in filteredUsers" :key="u.id">
                <td class="mono" style="font-size: 0.8rem;">{{ u.memberId || 'TS26T' + u.id }}</td>
                <td>
                  <span style="font-weight:600; color:var(--forest)">{{ u.name }}</span>
                </td>
                <td class="mono">{{ u.email }}</td>
                <td class="mono" style="font-size: 0.8rem;">{{ u.phone || '—' }}</td>
                <td class="mono">{{ formatDate(u.registered) }}</td>
                <td>{{ u.bookings }}</td>
                <td>
                  <span :class="['status-pill', u.blacklisted ? 'status-inactive' : 'status-active']">
                    {{ u.blacklisted ? 'Blacklisted' : 'Active' }}
                  </span>
                </td>
                <td>
                  <div class="action-btns" style="display:flex; gap:6px;">
                    <button class="act-btn act-view" @click="viewUserDetails(u)">
                      <svg viewBox="0 0 24 24" class="act-btn-icon"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                      View Details
                    </button>
                    <button class="act-btn act-edit" @click="openTrekkerModal(u)">
                      <svg viewBox="0 0 24 24" class="act-btn-icon"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
                      Edit
                    </button>
                    <button class="act-btn" :class="u.blacklisted ? 'act-open' : 'act-blacklist-btn'" @click="toggleBlacklist(u)">
                      <svg viewBox="0 0 24 24" class="act-btn-icon" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"></line></svg>
                      {{ u.blacklisted ? 'Restore' : 'Blacklist' }}
                    </button>
                  </div>
                </td>
              </tr>
              <tr v-if="!filteredUsers.length">
                <td colspan="8" style="text-align:center; padding:2rem; color:var(--stone)">No users match this filter.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <!-- ══ BOOKINGS ═══════════════════════════════════════ -->
      <section v-if="activeTab==='bookings'" class="tab-content">
        <div class="filter-bar">
          <button v-for="f in ['All','Booked','Cancelled','Completed']" :key="f"
            class="filter-btn" :class="{ active: bookingFilter===f }" @click="bookingFilter=f">{{ f }}</button>
        </div>
        <div class="ts-table-wrap">
          <table class="ts-table">
            <thead>
              <tr>
                <th>Booking ID</th>
                <th>Trekker ID</th>
                <th>User</th>
                <th>Batch ID</th>
                <th>Trek</th>
                <th>Booked On</th>
                <th>Status</th>
                <th>Payment</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="b in filteredBookings" :key="b.id">
                <td class="mono" style="font-size: 0.8rem;">{{ b.bookingId || ('#' + b.id) }}</td>
                <td class="mono" style="font-size: 0.8rem;">{{ b.trekkerId }}</td>
                <td><span style="font-weight:600; color:var(--forest)">{{ b.user }}</span></td>
                <td class="mono" style="font-size: 0.8rem;">{{ b.batchCode }}</td>
                <td style="font-weight:500;">{{ b.trek }}</td>
                <td class="mono">{{ formatDate(b.date) }}</td>
                <td><span :class="'status-pill status-'+b.status.toLowerCase()">{{ b.status }}</span></td>
                <td><span :class="['status-pill', b.paid ? 'status-open' : 'status-pending']">{{ b.paid ? 'Paid' : 'Pending' }}</span></td>
                <td>
                  <div class="action-btns" style="display:flex; gap:6px;">
                    <button class="act-btn act-view" @click="viewBookingDetails(b)">
                      <svg viewBox="0 0 24 24" class="act-btn-icon"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                      View
                    </button>
                    <button class="act-btn act-assign" @click="exportCSV('booking-'+b.id)">
                      <svg viewBox="0 0 24 24" class="act-btn-icon" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                      Export
                    </button>
                    <button v-if="b.status==='Booked'" class="act-btn act-delete-btn" @click="cancelBooking(b)">
                      <svg viewBox="0 0 24 24" class="act-btn-icon" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>
                      Cancel
                    </button>
                  </div>
                </td>
              </tr>
              <tr v-if="!filteredBookings.length">
                <td colspan="9" style="text-align:center; padding:2rem; color:var(--stone)">No bookings match this filter.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <!-- ══ ANALYTICS ══════════════════════════════════════ -->
      <section v-if="activeTab==='analytics'" class="tab-content">

        <!-- ── KEY PERFORMANCE INDICATORS ────────────────── -->
        <div class="analytics-metrics-grid">
          <div class="metric-card-kpi">
            <div class="card-title">Total Bookings</div>
            <div class="card-value">{{ allBookings.length || 124 }}</div>
            <div class="card-formula">LIVE COUNT</div>
            <div class="card-desc">Total volume of trek reservations registered on the TrailSync platform.</div>
          </div>
          <div class="metric-card-kpi">
            <div class="card-title">Booking Conversion Rate</div>
            <div class="card-value">{{ (((allBookings.length || 124) / 2500) * 100).toFixed(1) }}%</div>
            <div class="card-formula">Bookings / Trek Views × 100</div>
            <div class="card-desc">Traffic conversion based on route listing views (Base traffic: 2,500 views).</div>
          </div>
          <div class="metric-card-kpi">
            <div class="card-title">Average Occupancy</div>
            <div class="card-value">{{ averageOccupancy }}%</div>
            <div class="card-formula">Booked Slots / Total Slots × 100</div>
            <div class="card-desc">Average capacity utilization across active and completed trek batches.</div>
          </div>
        </div>

        <!-- ── PARTICIPATION TRENDS & DISTRIBUTIONS ──────── -->
        <div class="dash-card" style="margin-bottom:1.5rem">
          <div class="dash-card-header">
            <div>
              <span class="dash-card-title">Monthly Bookings Trend</span>
              <div style="font-size:0.75rem; color:var(--stone); margin-top:2px;">
                Visualizes reservation velocity over time. Tracks seasonal growth.
                <span style="display:inline-block; font-size:0.7rem; font-family:monospace; color:var(--gold-dark); background:rgba(200,146,42,0.06); padding:1px 4px; border-radius:2px; margin-left:6px;">Metric: Sum(Bookings) Grouped By Month</span>
              </div>
            </div>
          </div>
          <div class="chart-svg-wrap">
            <svg viewBox="0 0 700 180" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:auto">
              <defs>
                <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stop-color="#c8922a" stop-opacity="0.25"/>
                  <stop offset="100%" stop-color="#c8922a" stop-opacity="0.02"/>
                </linearGradient>
              </defs>
              <line v-for="i in 4" :key="'g'+i" :x1="30" :y1="30 + (i-1)*35" :x2="670" :y2="30+(i-1)*35" class="chart-grid-line"/>
              <path :d="buildAreaPath(monthlyBookings,'count',700,180,30)" class="chart-area-fill"/>
              <path :d="buildLinePath(monthlyBookings,'count',700,180,30)" class="chart-line-path"/>
              <g v-for="(m,i) in monthlyBookings" :key="'dot'+i">
                <circle
                  :cx="30 + (i/(monthlyBookings.length-1))*(700-60)"
                  :cy="180 - 30 - (m.count/maxMonthly)*(180-60)"
                  r="3.5" class="chart-dot"/>
                <text
                  :x="30 + (i/(monthlyBookings.length-1))*(700-60)"
                  y="172" text-anchor="middle" class="chart-axis-label">{{ m.month }} ({{ m.count }})</text>
              </g>
            </svg>
          </div>
        </div>

        <div class="charts-split-layout">
          <!-- Difficulty Donut Chart -->
          <div class="dash-card">
            <div class="dash-card-header">
              <div>
                <span class="dash-card-title">Difficulty Wise Participation</span>
                <div style="font-size:0.75rem; color:var(--stone); margin-top:2px;">
                  User preference share mapped by trek difficulty ratings.
                  <span style="display:inline-block; font-size:0.7rem; font-family:monospace; color:var(--gold-dark); background:rgba(200,146,42,0.06); padding:1px 4px; border-radius:2px; margin-left:6px;">Formula: (Bookings in Level / Total Bookings) × 100</span>
                </div>
              </div>
            </div>
            <div class="donut-wrapper-flex">
              <svg viewBox="0 0 36 36" style="width: 130px; height: 130px;">
                <!-- Background gray ring -->
                <circle cx="18" cy="18" r="15.915" fill="none" stroke="var(--stone-light)" stroke-width="3.5"></circle>
                <!-- Easy Segment -->
                <circle cx="18" cy="18" r="15.915" fill="none" stroke="var(--green)" stroke-width="3.5"
                  :stroke-dasharray="diffDonutData.easy + ' ' + (100 - diffDonutData.easy)" stroke-dashoffset="0" transform="rotate(-90 18 18)"></circle>
                <!-- Moderate Segment -->
                <circle cx="18" cy="18" r="15.915" fill="none" stroke="var(--gold)" stroke-width="3.5"
                  :stroke-dasharray="diffDonutData.mod + ' ' + (100 - diffDonutData.mod)" :stroke-dashoffset="diffDonutData.offsetMod" transform="rotate(-90 18 18)"></circle>
                <!-- Hard Segment -->
                <circle cx="18" cy="18" r="15.915" fill="none" stroke="var(--red)" stroke-width="3.5"
                  :stroke-dasharray="diffDonutData.hard + ' ' + (100 - diffDonutData.hard)" :stroke-dashoffset="diffDonutData.offsetHard" transform="rotate(-90 18 18)"></circle>
                
                <text x="18" y="20.5" text-anchor="middle" font-size="5.5" font-weight="700" fill="var(--forest)">SHARE</text>
              </svg>
              <div class="donut-legend">
                <div class="legend-item"><span class="legend-color" style="background:var(--green)"></span><span>Easy: {{ diffDonutData.easy }}%</span></div>
                <div class="legend-item"><span class="legend-color" style="background:var(--gold)"></span><span>Moderate: {{ diffDonutData.mod }}%</span></div>
                <div class="legend-item"><span class="legend-color" style="background:var(--red)"></span><span>Hard: {{ diffDonutData.hard }}%</span></div>
              </div>
            </div>
          </div>

          <!-- Booking Outcomes Donut Chart -->
          <div class="dash-card">
            <div class="dash-card-header">
              <div>
                <span class="dash-card-title">Booking Status Distribution</span>
                <div style="font-size:0.75rem; color:var(--stone); margin-top:2px;">
                  Breakdown of booking final status and Cancellation Rate.
                  <span style="display:inline-block; font-size:0.7rem; font-family:monospace; color:var(--gold-dark); background:rgba(200,146,42,0.06); padding:1px 4px; border-radius:2px; margin-left:6px;">Formula: Cancel Rate = (Cancelled / Total) × 100</span>
                </div>
              </div>
            </div>
            <div class="donut-wrapper-flex">
              <svg viewBox="0 0 36 36" style="width: 130px; height: 130px;">
                <circle cx="18" cy="18" r="15.915" fill="none" stroke="var(--stone-light)" stroke-width="3.5"></circle>
                <!-- Booked (Paid) Segment -->
                <circle cx="18" cy="18" r="15.915" fill="none" stroke="var(--green)" stroke-width="3.5"
                  :stroke-dasharray="statusDonutData.booked + ' ' + (100 - statusDonutData.booked)" stroke-dashoffset="0" transform="rotate(-90 18 18)"></circle>
                <!-- Unpaid (Pending) Segment -->
                <circle cx="18" cy="18" r="15.915" fill="none" stroke="var(--gold)" stroke-width="3.5"
                  :stroke-dasharray="statusDonutData.pending + ' ' + (100 - statusDonutData.pending)" :stroke-dashoffset="statusDonutData.offsetPending" transform="rotate(-90 18 18)"></circle>
                <!-- Cancelled Segment -->
                <circle cx="18" cy="18" r="15.915" fill="none" stroke="var(--red)" stroke-width="3.5"
                  :stroke-dasharray="statusDonutData.cancelled + ' ' + (100 - statusDonutData.cancelled)" :stroke-dashoffset="statusDonutData.offsetCancelled" transform="rotate(-90 18 18)"></circle>
                
                <text x="18" y="20.5" text-anchor="middle" font-size="5" font-weight="700" fill="var(--forest)">STATUS</text>
              </svg>
              <div class="donut-legend">
                <div class="legend-item"><span class="legend-color" style="background:var(--green)"></span><span>Booked: {{ statusDonutData.booked }}%</span></div>
                <div class="legend-item"><span class="legend-color" style="background:var(--gold)"></span><span>Pending: {{ statusDonutData.pending }}%</span></div>
                <div class="legend-item"><span class="legend-color" style="background:var(--red)"></span><span>Cancelled: {{ statusDonutData.cancelled }}%</span></div>
                <div style="font-size: 0.72rem; color: var(--stone); border-top: 1px solid var(--stone-light); padding-top: 4px; margin-top: 4px;">
                  Cancel Rate: {{ bookingStatusDist.cancelRate }}%
                  <br><span style="font-size:0.6rem;">(Cancelled / Total × 100)</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- ── POPULARITY & REGIONAL DEMAND ────────────── -->
        <div class="charts-split-layout">
          <!-- Trek Popularity Horizontal Bar Chart -->
          <div class="dash-card">
            <div class="dash-card-header">
              <div>
                <span class="dash-card-title">Trek Popularity Analysis (Yearly)</span>
                <div style="font-size:0.75rem; color:var(--stone); margin-top:2px;">
                  Top performing routes by total reservations.
                  <span style="display:inline-block; font-size:0.7rem; font-family:monospace; color:var(--gold-dark); background:rgba(200,146,42,0.06); padding:1px 4px; border-radius:2px; margin-left:6px;">Metric: SUM(Bookings) Grouped By Trek</span>
                </div>
              </div>
            </div>
            <div class="chart-bars" style="margin-top: 1rem;">
              <div v-for="t in popularTreksWithMock" :key="t.name" class="chart-bar-item" style="margin-bottom: 0.75rem;">
                <div class="chart-bar-label" style="font-size:0.8rem; font-weight:600;">{{ t.name }}</div>
                <div class="chart-bar-track" style="height: 12px; border-radius: 6px;">
                  <div class="chart-bar-fill" :style="{ width: (t.bookings/maxPopularBookings*100)+'%', background: 'var(--gold)' }" style="border-radius: 6px;"></div>
                </div>
                <div class="chart-bar-value" style="font-size:0.78rem;">{{ t.bookings }} bookings</div>
              </div>
            </div>
          </div>

          <!-- Location Wise Demand Bar Chart -->
          <div class="dash-card">
            <div class="dash-card-header">
              <div>
                <span class="dash-card-title">Location Wise Demand</span>
                <div style="font-size:0.75rem; color:var(--stone); margin-top:2px;">
                  Regional demand distribution based on route states.
                  <span style="display:inline-block; font-size:0.7rem; font-family:monospace; color:var(--gold-dark); background:rgba(200,146,42,0.06); padding:1px 4px; border-radius:2px; margin-left:6px;">Metric: Participants Grouped By State</span>
                </div>
              </div>
            </div>
            <div class="chart-bars" style="margin-top: 1rem;">
              <div v-for="l in locationDemand" :key="l.state" class="chart-bar-item" style="margin-bottom: 0.75rem;">
                <div class="chart-bar-label" style="font-size:0.8rem; font-weight:600;">{{ l.state }}</div>
                <div class="chart-bar-track" style="height: 12px; border-radius: 6px;">
                  <div class="chart-bar-fill" :style="{ width: (l.count/maxLocationDemand*100)+'%', background: 'var(--forest-mid)' }" style="border-radius: 6px;"></div>
                </div>
                <div class="chart-bar-value" style="font-size:0.78rem;">{{ l.count }} pax</div>
              </div>
            </div>
          </div>
        </div>

        <!-- ── CAPACITY & PLANNING ──────────────────────── -->
        <div class="charts-split-layout">
          <!-- Occupancy Progress Bars -->
          <div class="dash-card">
            <div class="dash-card-header">
              <div>
                <span class="dash-card-title">Capacity Occupancy Rate Per Trek</span>
                <div style="font-size:0.75rem; color:var(--stone); margin-top:2px;">
                  Helps plan batch sizes.
                  <span style="display:inline-block; font-size:0.7rem; font-family:monospace; color:var(--gold-dark); background:rgba(200,146,42,0.06); padding:1px 4px; border-radius:2px; margin-left:6px;">Formula: Occupancy = Booked Slots / Total Slots × 100</span>
                </div>
              </div>
            </div>
            <div class="occ-list" style="margin-top: 1rem;">
              <div v-for="s in occupancyRatePerTrek" :key="s.name" class="occ-item" style="margin-bottom:0.75rem;">
                <div class="occ-meta" style="display:flex; justify-content:space-between; font-size:0.8rem; margin-bottom:4px;">
                  <span class="occ-trek" style="font-weight:600; color:var(--forest)">{{ s.name }}</span>
                  <span class="occ-pct font-mono" style="font-weight:700;">{{ s.booked }}/{{ s.total }} ({{ s.pct }}%)</span>
                </div>
                <div class="occ-bar-track" style="height: 10px; border-radius: 5px; background: var(--stone-light);">
                  <div class="occ-bar-fill" :class="occColor(s.pct)" :style="{ width: s.pct+'%' }" style="height:10px; border-radius:5px;"></div>
                </div>
              </div>
            </div>
          </div>

          <!-- Upcoming Treks Seats Inventory -->
          <div class="dash-card">
            <div class="dash-card-header">
              <div>
                <span class="dash-card-title">Upcoming Departures Seat Inventory</span>
                <div style="font-size:0.75rem; color:var(--stone); margin-top:2px;">
                  Provides lookahead visibility into upcoming trek dates.
                  <span style="display:inline-block; font-size:0.7rem; font-family:monospace; color:var(--gold-dark); background:rgba(200,146,42,0.06); padding:1px 4px; border-radius:2px; margin-left:6px;">Formula: Seats Left = Total Slots - Booked Slots</span>
                </div>
              </div>
            </div>
            <div class="ts-table-wrap" style="margin-top: 1rem; max-height: 250px; overflow-y: auto;">
              <table class="ts-table" style="font-size: 0.8rem;">
                <thead>
                  <tr>
                    <th>Trek Batch</th>
                    <th>Date</th>
                    <th>Guide</th>
                    <th>Filled</th>
                    <th>Seats Left</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="ut in enrichedUpcomingTreks" :key="ut.name+ut.startDate">
                    <td style="font-weight:600; color:var(--forest)">{{ ut.name }}</td>
                    <td class="mono">{{ ut.startDate }}</td>
                    <td>{{ ut.staff }}</td>
                    <td class="mono" style="text-align:center;">{{ ut.bookedSlots }}</td>
                    <td class="mono" style="text-align:center;"><span :class="['status-pill', ut.remainingSlots <= 5 ? 'status-closed':'status-open']" style="font-size:0.7rem; padding: 2px 6px;">{{ ut.remainingSlots }} left</span></td>
                  </tr>
                  <tr v-if="!enrichedUpcomingTreks.length">
                    <td colspan="5" style="text-align:center; padding:1.5rem; color:var(--stone)">No upcoming departures starting soon.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- ── STAFF PERFORMANCE LEADERBOARD ───────────── -->
        <div class="dash-card">
          <div class="dash-card-header">
            <div>
              <span class="dash-card-title">Staff Performance Analytics Leaderboard</span>
              <div style="font-size:0.75rem; color:var(--stone); margin-top:2px;">
                Evaluates field staff performance metrics. Highlights top three performant staff members based on total participants led.
                <span style="display:inline-block; font-size:0.7rem; font-family:monospace; color:var(--gold-dark); background:rgba(200,146,42,0.06); padding:1px 4px; border-radius:2px; margin-left:6px;">Avg Occupancy = Booked / Slots | Completion Rate = Completed / Assigned</span>
              </div>
            </div>
          </div>
          <div class="ts-table-wrap" style="margin-top: 1rem;">
            <table class="ts-table">
              <thead>
                <tr>
                  <th style="width: 50px; text-align: center;">Rank</th>
                  <th>Guide Name</th>
                  <th style="text-align: center;">Treks Managed</th>
                  <th style="text-align: center;">Total Participants</th>
                  <th style="text-align: center;">Avg Occupancy</th>
                  <th style="text-align: center;">Completion Rate</th>
                  <th style="text-align: center;">User Rating</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(s, index) in staffLeaderboard" :key="s.name" :class="'leaderboard-row-' + (index + 1)">
                  <td style="text-align: center; font-weight: 700;">
                    <span v-if="index === 0" class="leaderboard-badge">🥇</span>
                    <span v-else-if="index === 1" class="leaderboard-badge">🥈</span>
                    <span v-else-if="index === 2" class="leaderboard-badge">🥉</span>
                    <span v-else>{{ index + 1 }}</span>
                  </td>
                  <td>
                    <div style="display:flex; align-items:center; gap:8px;">
                      <img :src="s.photoUrl" style="width:28px; height:28px; border-radius:50%; object-fit:cover;" />
                      <span style="font-weight: 600; color: var(--forest);">{{ s.name }}</span>
                    </div>
                  </td>
                  <td class="mono" style="text-align: center; font-weight: 600;">{{ s.treks }}</td>
                  <td class="mono" style="text-align: center; font-weight: 600;">{{ s.participants }}</td>
                  <td class="mono" style="text-align: center;">{{ s.avgOccupancy }}%</td>
                  <td class="mono" style="text-align: center;">{{ s.completionRate }}%</td>
                  <td class="mono" style="text-align: center;"><span style="color:var(--gold-dark); font-weight:700;">★ {{ s.rating }}</span></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

      </section>

      <!-- ══ REVENUE DASHBOARD ══════════════════════════════ -->
      <section v-if="activeTab==='revenue'" class="tab-content">

        <!-- KPI Metrics Grid -->
        <div class="analytics-metrics-grid" style="margin-bottom: 1.5rem;">
          <div class="metric-card-kpi">
            <div class="card-title">Total Revenue</div>
            <div class="card-value">₹{{ revenueKPIs.total.toLocaleString() }}</div>
            <div class="card-formula">Formula: SUM(amount_paid)</div>
            <div class="card-desc">Total cumulative revenue received from completed and active bookings.</div>
          </div>
          <div class="metric-card-kpi">
            <div class="card-title">Monthly Revenue</div>
            <div class="card-value">₹{{ revenueKPIs.monthly.toLocaleString() }}</div>
            <div class="card-formula">Formula: Current Month paid</div>
            <div class="card-desc">Total revenue collected in the current calendar month.</div>
          </div>
          <div class="metric-card-kpi">
            <div class="card-title">Avg Revenue Per Trek</div>
            <div class="card-value">₹{{ revenueKPIs.avgPerTrek.toLocaleString() }}</div>
            <div class="card-formula">Formula: Revenue / Treks</div>
            <div class="card-desc">Average billing collected per scheduled trek batch.</div>
          </div>
          <div class="metric-card-kpi">
            <div class="card-title">Avg Revenue Per User</div>
            <div class="card-value">₹{{ revenueKPIs.avgPerUser.toLocaleString() }}</div>
            <div class="card-formula">Formula: Revenue / Users</div>
            <div class="card-desc">Average lifetime value (LTV) spent per registered trekker.</div>
          </div>
          <div class="metric-card-kpi">
            <div class="card-title">Pending Payments</div>
            <div class="card-value" style="color: var(--gold-dark);">₹{{ revenueKPIs.pending.toLocaleString() }}</div>
            <div class="card-formula">Formula: SUM(unpaid amounts)</div>
            <div class="card-desc">Accounts receivable currently pending from offline/pending bookings.</div>
          </div>
        </div>

        <!-- Revenue Growth Chart -->
        <div class="dash-card" style="margin-bottom: 1.5rem;">
          <div class="dash-card-header">
            <div>
              <span class="dash-card-title">Revenue Growth Trend & Forecast</span>
              <div style="font-size:0.75rem; color:var(--stone); margin-top:2px;">
                Shows monthly business revenue scaling and projecting the upcoming month using a Simple Moving Average (SMA).
                <span style="display:inline-block; font-size:0.7rem; font-family:monospace; color:var(--gold-dark); background:rgba(200,146,42,0.06); padding:1px 4px; border-radius:2px; margin-left:6px;">Formula: SMA Forecast = (Sum of last 6 Months) / 6</span>
              </div>
            </div>
            <div class="forecast-badge" style="background: var(--cream); border: 1px solid var(--gold-mid); padding: 6px 12px; border-radius: 4px; font-size: 0.8rem; font-weight: 700; color: var(--forest);">
              🔮 Next Month Forecast: ₹{{ revenueGrowthData[revenueGrowthData.length - 1].amount.toLocaleString() }}
            </div>
          </div>
          <div class="chart-svg-wrap">
            <svg viewBox="0 0 700 180" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:auto">
              <defs>
                <linearGradient id="revAreaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stop-color="#1a2e1a" stop-opacity="0.2"/>
                  <stop offset="100%" stop-color="#1a2e1a" stop-opacity="0.01"/>
                </linearGradient>
              </defs>
              <line v-for="i in 4" :key="'rg'+i" :x1="30" :y1="30 + (i-1)*35" :x2="670" :y2="30+(i-1)*35" class="chart-grid-line"/>
              <!-- Area fill for historical line -->
              <path :d="buildAreaPath(revenueGrowthData.slice(0, 6), 'amount', 700, 180, 30)" fill="url(#revAreaGrad)"/>
              <!-- Solid line for historical -->
              <path :d="buildLinePath(revenueGrowthData.slice(0, 6), 'amount', 700, 180, 30)" class="chart-line-path"/>
              <!-- Dotted line for forecast -->
              <path :d="buildLinePath(revenueGrowthData.slice(5), 'amount', 700, 180, 30)" class="chart-line-path" stroke-dasharray="5,5" style="stroke: var(--gold-dark);"/>
              
              <!-- Draw circles and labels -->
              <g v-for="(r,i) in revenueGrowthData" :key="'revdot'+i">
                <circle
                  :cx="30 + (i/(revenueGrowthData.length-1))*(700-60)"
                  :cy="180 - 30 - (r.amount/maxRevenueGrowthAmount)*(180-60)"
                  :r="r.isForecast ? 4.5 : 3.5" 
                  :style="{
                    fill: r.isForecast ? 'var(--gold)' : 'var(--forest)',
                    stroke: r.isForecast ? 'var(--forest)' : 'white',
                    strokeWidth: r.isForecast ? '1.5px' : '1px'
                  }"/>
                <text
                  :x="30 + (i/(revenueGrowthData.length-1))*(700-60)"
                  y="172" text-anchor="middle" class="chart-axis-label">{{ r.month }} (₹{{ (r.amount/1000).toFixed(0) }}k)</text>
              </g>
            </svg>
          </div>
        </div>

        <!-- split: Revenue by Trek & Revenue by Location -->
        <div class="charts-split-layout" style="margin-bottom: 1.5rem;">
          <!-- Revenue by Trek -->
          <div class="dash-card">
            <div class="dash-card-header">
              <div>
                <span class="dash-card-title">Revenue by Trek</span>
                <div style="font-size:0.75rem; color:var(--stone); margin-top:2px;">
                  Top performing treks by total billing collected.
                  <span style="display:inline-block; font-size:0.7rem; font-family:monospace; color:var(--gold-dark); background:rgba(200,146,42,0.06); padding:1px 4px; border-radius:2px; margin-left:6px;">Formula: SUM(amount_paid) GROUP BY trek</span>
                </div>
              </div>
            </div>
            <div class="chart-bars" style="margin-top: 1rem;">
              <div v-for="t in revenueByTrek" :key="t.name" class="chart-bar-item" style="margin-bottom: 0.75rem;">
                <div class="chart-bar-label" style="font-size:0.8rem; font-weight:600;">{{ t.name }}</div>
                <div class="chart-bar-track" style="height: 12px; border-radius: 6px;">
                  <div class="chart-bar-fill" :style="{ width: (t.amount/maxRevenueByTrek*100)+'%', background: 'var(--gold)' }" style="border-radius: 6px;"></div>
                </div>
                <div class="chart-bar-value" style="font-size:0.78rem;">₹{{ t.amount.toLocaleString() }}</div>
              </div>
            </div>
          </div>

          <!-- Revenue by Location -->
          <div class="dash-card">
            <div class="dash-card-header">
              <div>
                <span class="dash-card-title">Revenue by Location</span>
                <div style="font-size:0.75rem; color:var(--stone); margin-top:2px;">
                  Regional billing totals grouped by route states.
                  <span style="display:inline-block; font-size:0.7rem; font-family:monospace; color:var(--gold-dark); background:rgba(200,146,42,0.06); padding:1px 4px; border-radius:2px; margin-left:6px;">Formula: SUM(amount_paid) GROUP BY State</span>
                </div>
              </div>
            </div>
            <div class="chart-bars" style="margin-top: 1rem;">
              <div v-for="l in revenueByLocation" :key="l.state" class="chart-bar-item" style="margin-bottom: 0.75rem;">
                <div class="chart-bar-label" style="font-size:0.8rem; font-weight:600;">{{ l.state }}</div>
                <div class="chart-bar-track" style="height: 12px; border-radius: 6px;">
                  <div class="chart-bar-fill" :style="{ width: (l.amount/maxRevenueByLocation*100)+'%', background: 'var(--forest-mid)' }" style="border-radius: 6px;"></div>
                </div>
                <div class="chart-bar-value" style="font-size:0.78rem;">₹{{ l.amount.toLocaleString() }}</div>
              </div>
            </div>
          </div>
        </div>

        <!-- split: Payment Status Distribution & Revenue Per Difficulty -->
        <div class="charts-split-layout" style="margin-bottom: 1.5rem;">
          <!-- Payment Status Distribution -->
          <div class="dash-card">
            <div class="dash-card-header">
              <div>
                <span class="dash-card-title">Payment Status Share</span>
                <div style="font-size:0.75rem; color:var(--stone); margin-top:2px;">
                  Distributing volume share across payment outcomes.
                  <span style="display:inline-block; font-size:0.7rem; font-family:monospace; color:var(--gold-dark); background:rgba(200,146,42,0.06); padding:1px 4px; border-radius:2px; margin-left:6px;">Formula: (Count / Total Bookings) × 100</span>
                </div>
              </div>
            </div>
            <div class="donut-wrapper-flex">
              <svg viewBox="0 0 36 36" style="width: 130px; height: 130px;">
                <circle cx="18" cy="18" r="15.915" fill="none" stroke="var(--stone-light)" stroke-width="3.5"></circle>
                <!-- Paid Segment -->
                <circle cx="18" cy="18" r="15.915" fill="none" stroke="var(--green)" stroke-width="3.5"
                  :stroke-dasharray="paymentStatusDist.paid + ' ' + (100 - paymentStatusDist.paid)" stroke-dashoffset="0" transform="rotate(-90 18 18)"></circle>
                <!-- Pending Segment -->
                <circle cx="18" cy="18" r="15.915" fill="none" stroke="var(--gold)" stroke-width="3.5"
                  :stroke-dasharray="paymentStatusDist.pending + ' ' + (100 - paymentStatusDist.pending)" :stroke-dashoffset="paymentStatusDist.offsetPending" transform="rotate(-90 18 18)"></circle>
                <!-- Failed Segment -->
                <circle cx="18" cy="18" r="15.915" fill="none" stroke="var(--red)" stroke-width="3.5"
                  :stroke-dasharray="paymentStatusDist.failed + ' ' + (100 - paymentStatusDist.failed)" :stroke-dashoffset="paymentStatusDist.offsetFailed" transform="rotate(-90 18 18)"></circle>
                
                <text x="18" y="20.5" text-anchor="middle" font-size="5" font-weight="700" fill="var(--forest)">STATUS</text>
              </svg>
              <div class="donut-legend">
                <div class="legend-item"><span class="legend-color" style="background:var(--green)"></span><span>Paid: {{ paymentStatusDist.paid }}%</span></div>
                <div class="legend-item"><span class="legend-color" style="background:var(--gold)"></span><span>Pending: {{ paymentStatusDist.pending }}%</span></div>
                <div class="legend-item"><span class="legend-color" style="background:var(--red)"></span><span>Failed: {{ paymentStatusDist.failed }}%</span></div>
              </div>
            </div>
          </div>

          <!-- Revenue Per Difficulty -->
          <div class="dash-card">
            <div class="dash-card-header">
              <div>
                <span class="dash-card-title">Revenue by Difficulty</span>
                <div style="font-size:0.75rem; color:var(--stone); margin-top:2px;">
                  Profitable trek category mapping.
                  <span style="display:inline-block; font-size:0.7rem; font-family:monospace; color:var(--gold-dark); background:rgba(200,146,42,0.06); padding:1px 4px; border-radius:2px; margin-left:6px;">Formula: SUM(amount_paid) GROUP BY difficulty</span>
                </div>
              </div>
            </div>
            <div class="donut-wrapper-flex">
              <svg viewBox="0 0 36 36" style="width: 130px; height: 130px;">
                <circle cx="18" cy="18" r="15.915" fill="none" stroke="var(--stone-light)" stroke-width="3.5"></circle>
                <!-- Easy Segment -->
                <circle cx="18" cy="18" r="15.915" fill="none" stroke="var(--green)" stroke-width="3.5"
                  :stroke-dasharray="revenuePerDifficulty.easyPct + ' ' + (100 - revenuePerDifficulty.easyPct)" stroke-dashoffset="0" transform="rotate(-90 18 18)"></circle>
                <!-- Moderate Segment -->
                <circle cx="18" cy="18" r="15.915" fill="none" stroke="var(--gold)" stroke-width="3.5"
                  :stroke-dasharray="revenuePerDifficulty.modPct + ' ' + (100 - revenuePerDifficulty.modPct)" :stroke-dashoffset="revenuePerDifficulty.offsetMod" transform="rotate(-90 18 18)"></circle>
                <!-- Hard Segment -->
                <circle cx="18" cy="18" r="15.915" fill="none" stroke="var(--red)" stroke-width="3.5"
                  :stroke-dasharray="revenuePerDifficulty.hardPct + ' ' + (100 - revenuePerDifficulty.hardPct)" :stroke-dashoffset="revenuePerDifficulty.offsetHard" transform="rotate(-90 18 18)"></circle>
                
                <text x="18" y="20.5" text-anchor="middle" font-size="5" font-weight="700" fill="var(--forest)">DIFF</text>
              </svg>
              <div class="donut-legend">
                <div class="legend-item"><span class="legend-color" style="background:var(--green)"></span><span>Easy: {{ revenuePerDifficulty.easyPct }}% (₹{{ (revenuePerDifficulty.easy/100000).toFixed(1) }}L)</span></div>
                <div class="legend-item"><span class="legend-color" style="background:var(--gold)"></span><span>Moderate: {{ revenuePerDifficulty.modPct }}% (₹{{ (revenuePerDifficulty.moderate/100000).toFixed(1) }}L)</span></div>
                <div class="legend-item"><span class="legend-color" style="background:var(--red)"></span><span>Hard: {{ revenuePerDifficulty.hardPct }}% (₹{{ (revenuePerDifficulty.hard/100000).toFixed(1) }}L)</span></div>
              </div>
            </div>
          </div>
        </div>

        <!-- split: Top Spenders & Refund Analytics -->
        <div class="charts-split-layout">
          <!-- Top Paying Users -->
          <div class="dash-card">
            <div class="dash-card-header">
              <div>
                <span class="dash-card-title">Top Paying Trekkers</span>
                <div style="font-size:0.75rem; color:var(--stone); margin-top:2px;">
                  Highest lifetime spenders based on cumulative checkout transactions.
                  <span style="display:inline-block; font-size:0.7rem; font-family:monospace; color:var(--gold-dark); background:rgba(200,146,42,0.06); padding:1px 4px; border-radius:2px; margin-left:6px;">Metric: SUM(amount_paid) Grouped By User</span>
                </div>
              </div>
            </div>
            <div class="ts-table-wrap" style="margin-top: 1rem;">
              <table class="ts-table" style="font-size: 0.8rem;">
                <thead>
                  <tr>
                    <th style="width: 50px; text-align: center;">Rank</th>
                    <th>Trekker Name</th>
                    <th>Email / ID</th>
                    <th style="text-align: center;">Bookings</th>
                    <th style="text-align: right;">Total Spent</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(u, index) in topPayingUsers" :key="u.name">
                    <td style="text-align: center; font-weight: 700;">{{ index + 1 }}</td>
                    <td style="font-weight: 600; color: var(--forest)">{{ u.name }}</td>
                    <td class="mono" style="font-size: 0.75rem;">{{ u.email }}</td>
                    <td class="mono" style="text-align: center;">{{ u.bookingsCount }}</td>
                    <td class="mono" style="text-align: right; font-weight: 700; color: var(--gold-dark);">₹{{ u.spent.toLocaleString() }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- Refund Analytics -->
          <div class="dash-card">
            <div class="dash-card-header">
              <div>
                <span class="dash-card-title">Refund & Loss Analytics</span>
                <div style="font-size:0.75rem; color:var(--stone); margin-top:2px;">
                  Evaluating refunds processed versus retained platform net revenue.
                  <span style="display:inline-block; font-size:0.7rem; font-family:monospace; color:var(--gold-dark); background:rgba(200,146,42,0.06); padding:1px 4px; border-radius:2px; margin-left:6px;">Formula: (Refunded / Retention Total) × 100</span>
                </div>
              </div>
            </div>
            <div class="donut-wrapper-flex">
              <svg viewBox="0 0 36 36" style="width: 130px; height: 130px;">
                <circle cx="18" cy="18" r="15.915" fill="none" stroke="var(--stone-light)" stroke-width="3.5"></circle>
                <!-- Non-Refunded (Retained) Segment -->
                <circle cx="18" cy="18" r="15.915" fill="none" stroke="var(--green)" stroke-width="3.5"
                  :stroke-dasharray="refundAnalytics.nonRefundedPct + ' ' + (100 - refundAnalytics.nonRefundedPct)" stroke-dashoffset="0" transform="rotate(-90 18 18)"></circle>
                <!-- Refunded Segment -->
                <circle cx="18" cy="18" r="15.915" fill="none" stroke="var(--red)" stroke-width="3.5"
                  :stroke-dasharray="refundAnalytics.refundedPct + ' ' + (100 - refundAnalytics.refundedPct)" :stroke-dashoffset="-refundAnalytics.nonRefundedPct" transform="rotate(-90 18 18)"></circle>
                
                <text x="18" y="20.5" text-anchor="middle" font-size="5" font-weight="700" fill="var(--forest)">LOSS</text>
              </svg>
              <div class="donut-legend">
                <div class="legend-item"><span class="legend-color" style="background:var(--green)"></span><span>Retained: {{ refundAnalytics.nonRefundedPct }}% (₹{{ (refundAnalytics.nonRefunded/100000).toFixed(1) }}L)</span></div>
                <div class="legend-item"><span class="legend-color" style="background:var(--red)"></span><span>Refunded: {{ refundAnalytics.refundedPct }}% (₹{{ (refundAnalytics.refunded/1000).toFixed(0) }}k)</span></div>
              </div>
            </div>
          </div>
        </div>

      </section>

      <!-- ══ REPORTS ════════════════════════════════════════ -->
      <section v-if="activeTab==='reports'" class="tab-content">
        <div class="reports-grid">
          <div class="report-card">
            <div class="report-icon"><svg viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg></div>
            <div class="report-info">
              <div class="report-title">Monthly Activity Report</div>
              <div class="report-desc">HTML report emailed to admin on 1st of every month via Celery Beat. Includes treks conducted, user participation, and popular treks.</div>
            </div>
            <button class="btn-primary-ts" @click="triggerReport('monthly')">Generate Now</button>
          </div>
          <div class="report-card">
            <div class="report-icon"><svg viewBox="0 0 24 24"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg></div>
            <div class="report-info">
              <div class="report-title">Staff Performance Report</div>
              <div class="report-desc">Overview of how each staff member is performing — treks managed, completion rates, and participant counts.</div>
            </div>
            <button class="btn-primary-ts" @click="triggerReport('staff')">Generate</button>
          </div>
          <div class="report-card">
            <div class="report-icon"><svg viewBox="0 0 24 24"><path d="M3 17l4-8 4 4 4-6 4 10"/><path d="M3 20h18"/></svg></div>
            <div class="report-info">
              <div class="report-title">Trek Route Report</div>
              <div class="report-desc">Detailed stats per trek: bookings, cancellations, occupancy rates, revenue, and staff assignment history.</div>
            </div>
            <button class="btn-primary-ts" @click="triggerReport('trek')">Generate</button>
          </div>
          <div class="report-card">
            <div class="report-icon"><svg viewBox="0 0 24 24"><circle cx="9" cy="8" r="3"/><path d="M2 19c0-3 3-5 7-5"/><circle cx="16" cy="10" r="3"/><path d="M13 19c0-3 2.7-5 6-5"/></svg></div>
            <div class="report-info">
              <div class="report-title">User Participation Report</div>
              <div class="report-desc">Most active users, participation by difficulty level, monthly trends, and booking history.</div>
            </div>
            <button class="btn-primary-ts" @click="triggerReport('users')">Generate</button>
          </div>
        </div>

        <div class="dashboard-grid-equal">
          <div class="dash-card">
            <div class="dash-card-header"><span class="dash-card-title">Export Data</span></div>
            <div style="display:flex;flex-direction:column;gap:.75rem">
              <div style="display:flex;align-items:center;justify-content:space-between;padding:.75rem 1rem;background:var(--snow);border-radius:var(--radius);border:1px solid rgba(26,46,26,.08)">
                <span style="font-size:.88rem;color:var(--forest);font-weight:500">All Bookings</span>
                <button class="act-btn act-assign" @click="exportCSV('bookings')">↓ CSV</button>
              </div>
              <div style="display:flex;align-items:center;justify-content:space-between;padding:.75rem 1rem;background:var(--snow);border-radius:var(--radius);border:1px solid rgba(26,46,26,.08)">
                <span style="font-size:.88rem;color:var(--forest);font-weight:500">Trek Routes</span>
                <button class="act-btn act-assign" @click="exportCSV('treks')">↓ CSV</button>
              </div>
              <div style="display:flex;align-items:center;justify-content:space-between;padding:.75rem 1rem;background:var(--snow);border-radius:var(--radius);border:1px solid rgba(26,46,26,.08)">
                <span style="font-size:.88rem;color:var(--forest);font-weight:500">User List</span>
                <button class="act-btn act-assign" @click="exportCSV('users')">↓ CSV</button>
              </div>
              <div style="display:flex;align-items:center;justify-content:space-between;padding:.75rem 1rem;background:var(--snow);border-radius:var(--radius);border:1px solid rgba(26,46,26,.08)">
                <span style="font-size:.88rem;color:var(--forest);font-weight:500">Staff List</span>
                <button class="act-btn act-assign" @click="exportCSV('staff')">↓ CSV</button>
              </div>
              <div style="display:flex;align-items:center;justify-content:space-between;padding:.75rem 1rem;background:var(--snow);border-radius:var(--radius);border:1px solid rgba(26,46,26,.08)">
                <span style="font-size:.88rem;color:var(--forest);font-weight:500">Audit Logs</span>
                <button class="act-btn act-assign" @click="exportCSV('audit')">↓ CSV</button>
              </div>
            </div>
          </div>
          <div class="dash-card">
            <div class="dash-card-header"><span class="dash-card-title">Popular Treks</span></div>
            <div class="chart-bars">
              <div v-for="t in popularTreks" :key="t.name" class="chart-bar-item">
                <div class="chart-bar-label">{{ t.name }}</div>
                <div class="chart-bar-track"><div class="chart-bar-fill" :style="{ width: (t.bookings/maxBookings*100)+'%' }"></div></div>
                <div class="chart-bar-value">{{ t.bookings }}</div>
              </div>
            </div>
          </div>
        </div>
      </section>



      <!-- ══ SCHEDULED JOBS ═════════════════════════════════ -->
      <section v-if="activeTab==='jobs'" class="tab-content">
        <div class="ts-card" style="margin-bottom:1.5rem">
          <div class="dash-card-header"><span class="dash-card-title">Celery Scheduled Jobs</span></div>
          <div class="jobs-list">
            <div v-for="j in scheduledJobs" :key="j.name" class="job-item">
              <div>
                <div class="job-name">{{ j.name }}</div>
                <div class="job-schedule">{{ j.schedule }} · Last run: {{ j.lastRun }}</div>
              </div>
              <span :class="['status-pill', j.status==='Success'?'status-open':j.status==='Running'?'status-pending':'status-closed']">
                {{ j.status }}
              </span>
              <button class="act-btn act-assign" @click="triggerJob(j)">▶ Run Now</button>
            </div>
          </div>
        </div>
        <div class="dashboard-grid-equal">
          <div class="dash-card">
            <div class="dash-card-header"><span class="dash-card-title">About Daily Reminder Job</span></div>
            <p style="font-size:.85rem;color:var(--stone);line-height:1.6">Sends trekking reminder messages to registered users via Google Chat Webhook / Email / SMS each morning at 08:00. Includes trek name, start date, and preparation tips. Triggered by Celery Beat.</p>
          </div>
          <div class="dash-card">
            <div class="dash-card-header"><span class="dash-card-title">About Monthly Report Job</span></div>
            <p style="font-size:.85rem;color:var(--stone);line-height:1.6">Auto-generates an HTML activity report on the 1st of every month and emails it to admin. Contains treks conducted, total participants, most popular treks, and booking trends. Powered by Celery Beat.</p>
          </div>
        </div>
      </section>





      <!-- ══ BLACKLIST ═══════════════════════════════════════ -->
      <section v-if="activeTab==='blacklist'" class="tab-content">
        <div v-if="blacklistedUsers.length === 0" class="empty-state">
          <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>
          <p>No blacklisted accounts.</p>
        </div>
        <div style="display:flex;flex-direction:column;gap:1rem">
          <div v-for="u in blacklistedUsers" :key="u.id" class="blacklist-card">
            <div class="bl-icon"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg></div>
            <div class="bl-info">
              <div class="bl-name">{{ u.name }}</div>
              <div class="bl-meta">Reason: {{ u.reason }} · Banned on {{ u.date }}</div>
            </div>
            <div class="action-btns">
              <button class="act-btn act-green" @click="restoreBlacklist(u)">Restore</button>
              <button class="act-btn act-del"   @click="blacklistedUsers = blacklistedUsers.filter(b=>b.id!==u.id); showToast(u.name+' permanently removed')">Remove</button>
            </div>
          </div>
        </div>
      </section>

      <!-- ══ SUPPORT TICKETS ════════════════════════════════ -->
      <section v-if="activeTab==='support_tickets'" class="tab-content">
        <div style="margin-bottom:1rem; color:var(--stone); font-size:.9rem;">
          {{ supportTickets.filter(t => t.status === 'Open').length }} open support ticket{{ supportTickets.filter(t => t.status === 'Open').length !== 1 ? 's' : '' }}
        </div>
        <div v-if="filteredTickets.length === 0" class="empty-state">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
          <p>No support tickets found.</p>
        </div>
        <div v-else class="ts-table-wrap">
          <table class="ts-table">
            <thead>
              <tr>
                <th>Ticket ID</th>
                <th>Sender</th>
                <th>Subject</th>
                <th>Message</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="t in filteredTickets" :key="t.id">
                <td class="mono">#{{ t.id }}</td>
                <td>
                  <div style="font-weight:600; color:var(--forest)">{{ t.name }}</div>
                  <div style="font-size:0.75rem; color:var(--stone)">{{ t.email }}</div>
                </td>
                <td style="font-weight:500">{{ t.subject }}</td>
                <td style="max-width:300px; font-size:0.82rem; color:var(--stone)">{{ t.message }}</td>
                <td>
                  <span class="status-pill" :class="t.status === 'Open' ? 'status-pending' : 'status-approved'">
                    {{ t.status }}
                  </span>
                </td>
                <td>
                  <div class="action-btns" v-if="t.status === 'Open'">
                    <button class="act-btn act-green" @click="resolveTicket(t)">Resolve</button>
                  </div>
                  <span v-else style="color:var(--stone); font-size:0.8rem; font-style:italic">No actions</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

    </main><!-- /ts-main -->

    <!-- ════════ TREK MODAL ════════ -->
    <!-- ════════ BATCH MODAL (showTrekModal) ════════ -->
    <div v-if="showTrekModal" class="ts-modal-overlay" @click.self="closeTrekModal">
      <div class="ts-modal" :class="{ 'large': editingTrek }">
        <div class="ts-modal-header">
          <h3 class="ts-modal-title">{{ editingTrek ? 'Edit Batch' : 'Schedule New Batch' }}</h3>
          <button class="modal-close" @click="closeTrekModal">✕</button>
        </div>
        <div class="ts-modal-body">
          <div :style="editingTrek ? 'display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; align-items: start;' : ''">
            <!-- Left Side: Batch Details Form Grid -->
            <div class="form-grid">
              <!-- Route Selection (only for new batches) -->
              <div v-if="!editingTrek" class="form-group form-full">
                <div class="custom-select-wrapper" :class="{ 'is-open': showRouteDropdown }">
                  <label>Select Trek Route <span style="color: var(--red); font-weight: bold;">*</span></label>
                  <div class="custom-select-trigger" @click.stop="showRouteDropdown = !showRouteDropdown">
                    <span>{{ selectedRouteName || 'Choose an active trek route...' }}</span>
                    <svg viewBox="0 0 24 24" class="custom-select-arrow" :class="{ open: showRouteDropdown }"><polyline points="6 9 12 15 18 9"/></svg>
                  </div>
                  <div v-if="showRouteDropdown" class="custom-select-dropdown">
                    <input v-model="routeSearchQuery" type="text" class="custom-select-search" placeholder="Search route by name or code..." @click.stop />
                    <div class="custom-select-options">
                      <div v-for="r in matchingActiveRoutes" :key="r.id" class="custom-select-option" :class="{ selected: trekForm.trekRouteId !== undefined && Number(trekForm.trekRouteId) === Number(r.id) }" @click="selectRouteForBatch(r)">
                        <span class="option-code">[{{ r.trekCode }}]</span>
                        <span class="option-name">{{ r.name }}</span>
                        <span class="option-loc">({{ r.location }})</span>
                      </div>
                      <div v-if="!matchingActiveRoutes.length" class="custom-select-no-results">
                        No matching active routes found.
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div v-else class="form-group form-full">
                <label>Trek Route</label>
                <input type="text" :value="'[' + (trekForm.batchCode || '—') + '] ' + trekForm.name + ' (' + trekForm.location + ')'" disabled style="background:var(--snow); color:var(--stone);" />
              </div>

              <div class="form-group">
                <label>Start Date <span style="color: var(--red); font-weight: bold;">*</span></label>
                <input v-model="trekForm.startDate" type="date" />
              </div>
              <div class="form-group">
                <label>End Date <span style="color: var(--red); font-weight: bold;">*</span></label>
                <input v-model="trekForm.endDate" type="date" readonly style="background: var(--snow); color: var(--stone); cursor: not-allowed;" />
                <div v-if="selectedRouteDuration" style="font-size: 0.76rem; color: var(--forest); margin-top: 4px; font-weight: 500;">
                  ⏱ {{ selectedRouteDuration }} days trek duration (Auto-calculated)
                </div>
              </div>
              <div class="form-group">
                <label>Available Slots <span style="color: var(--red); font-weight: bold;">*</span></label>
                <input v-model.number="trekForm.slots" type="number" min="1" />
              </div>
              <div class="form-group">
                <label>Price (INR) <span style="color: var(--red); font-weight: bold;">*</span></label>
                <input v-model.number="trekForm.price" type="number" min="0" />
              </div>
              <div class="form-group form-full">
                <div class="custom-select-wrapper" :class="{ 'is-open': showStaffDropdown }">
                  <label>Assign Staff Guide (Optional)</label>
                  <div class="custom-select-trigger" @click.stop="showStaffDropdown = !showStaffDropdown">
                    <span>{{ selectedStaffName || 'No Staff Assigned' }}</span>
                    <svg viewBox="0 0 24 24" class="custom-select-arrow" :class="{ open: showStaffDropdown }"><polyline points="6 9 12 15 18 9"/></svg>
                  </div>
                  <div v-if="showStaffDropdown" class="custom-select-dropdown">
                    <input v-model="staffSearchQuery" type="text" class="custom-select-search" placeholder="Search staff member..." @click.stop />
                    <div class="custom-select-options">
                      <div class="custom-select-option" :class="{ selected: trekForm.staff_id === null }" @click="selectStaffForBatch(null)">
                        <em>No Staff Assigned</em>
                      </div>
                      <div v-for="s in matchingStaff" :key="s.id" class="custom-select-option" :class="{ selected: trekForm.staff_id === s.id }" @click="selectStaffForBatch(s)">
                        <span class="option-name">{{ s.name }}</span>
                        <span class="option-email">({{ s.contact }})</span>
                      </div>
                      <div v-if="!matchingStaff.length" class="custom-select-no-results">
                        No staff members found.
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Right Side: Manage Batch Trekkers Section (Parallel Layout) -->
            <div v-if="editingTrek" style="border-left: 1px solid #edf2f7; padding-left: 1.5rem; display: flex; flex-direction: column; gap: 1rem; align-self: stretch; position: relative;">
              <h4 style="color: var(--forest); margin: 0; font-size: 1.05rem; display: flex; justify-content: space-between; align-items: center; font-weight: 600;">
                <span>Registered Trekkers ({{ batchTrekkers.length }} / {{ trekForm.slots }})</span>
                <div style="display: flex; gap: 0.5rem;">
                  <button class="act-btn act-assign" style="font-size: 0.75rem; padding: 4px 10px; background-color: #e6fffa; color: #319795; border: 1px solid #b2f5ea; font-weight: 600; border-radius: 4px;" @click.stop="trekkerManageMode === 'add' ? (showTrekSearch = !showTrekSearch) : (showTrekSearch = true, trekkerManageMode = 'add'); trekSearchQuery = '';">
                    + Add
                  </button>
                  <button class="act-btn act-del" style="font-size: 0.75rem; padding: 4px 10px; background-color: #fee2e2; color: #ef4444; border: 1px solid #fca5a5; font-weight: 600; border-radius: 4px;" @click.stop="trekkerManageMode === 'remove' ? (showTrekSearch = !showTrekSearch) : (showTrekSearch = true, trekkerManageMode = 'remove'); trekSearchQuery = '';">
                    ✕ Remove
                  </button>
                </div>
              </h4>

              <!-- Search Bar for adding/removing trekkers -->
              <div v-if="showTrekSearch" style="position: absolute; top: 2.2rem; left: 1.5rem; right: 0; background: #ffffff; border: 1px solid #e2e8f0; padding: 12px; border-radius: 6px; z-index: 100; box-shadow: 0 10px 20px rgba(0,0,0,0.1);">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                  <span style="font-size: 0.82rem; font-weight: bold; color: var(--gold);">
                    {{ trekkerManageMode === 'add' ? 'Search Trekker to Add' : 'Search Registered Trekker to Remove' }}
                  </span>
                  <button style="background: none; border: none; color: #a0aec0; cursor: pointer; font-size: 0.9rem;" @click="showTrekSearch = false">✕ Close</button>
                </div>
                <input v-model="trekSearchQuery" type="text" placeholder="Search by name, ID or email..." class="custom-select-search" style="margin-bottom: 8px; width: 100%;" />
                
                <div style="max-height: 150px; overflow-y: auto; background: #ffffff; border: 1px solid #edf2f7; border-radius: 4px;">
                  <!-- If Add Mode -->
                  <template v-if="trekkerManageMode === 'add'">
                    <div v-for="u in matchingTrekkerSearchResults" :key="u.id" style="display: flex; justify-content: space-between; align-items: center; padding: 8px; border-bottom: 1px solid #edf2f7; font-size: 0.85rem;">
                      <div>
                        <strong>{{ u.name }}</strong> <span style="color: #718096; font-size: 0.76rem;">[{{ u.memberId }}]</span>
                        <div style="font-size: 0.76rem; color: #a0aec0;">{{ u.email }}</div>
                      </div>
                      <button class="act-btn act-assign" style="font-size: 0.76rem; padding: 4px 8px; background-color: #e6fffa; color: #319795; border: 1px solid #b2f5ea; font-weight: 600; border-radius: 4px;" @click="addTrekkerToBatch(u)">
                        + Add
                      </button>
                    </div>
                    <div v-if="!matchingTrekkerSearchResults.length && trekSearchQuery" style="padding: 8px; font-size: 0.82rem; color: #a0aec0; text-align: center;">
                      No trekkers found.
                    </div>
                  </template>

                  <!-- If Remove Mode -->
                  <template v-if="trekkerManageMode === 'remove'">
                    <div v-for="t in matchingBatchTrekkers" :key="t.userId" style="display: flex; justify-content: space-between; align-items: center; padding: 8px; border-bottom: 1px solid #edf2f7; font-size: 0.85rem;">
                      <div>
                        <strong>{{ t.userName }}</strong> <span style="color: #718096; font-size: 0.76rem;">[{{ t.memberId }}]</span>
                        <div style="font-size: 0.76rem; color: #a0aec0;">{{ t.userEmail }}</div>
                      </div>
                      <button class="act-btn act-del" style="font-size: 0.76rem; padding: 4px 8px; background-color: #fee2e2; color: #ef4444; border: 1px solid #fca5a5; font-weight: 600; border-radius: 4px;" @click="removeTrekkerFromBatch(t)">
                        ✕ Remove
                      </button>
                    </div>
                    <div v-if="!matchingBatchTrekkers.length && trekSearchQuery" style="padding: 8px; font-size: 0.82rem; color: #a0aec0; text-align: center;">
                      No matching registered trekkers found.
                    </div>
                  </template>
                </div>
              </div>

              <!-- List of current registered trekkers -->
              <div v-if="batchTrekkers.length" style="background: #ffffff; border: 1px solid #edf2f7; border-radius: 6px; max-height: 200px; overflow-y: auto;">
                <div v-for="t in batchTrekkers" :key="t.userId" style="display: flex; justify-content: space-between; align-items: center; padding: 10px; border-bottom: 1px solid #edf2f7; font-size: 0.88rem;">
                  <div>
                    <strong>{{ t.userName }}</strong> <span style="color: #718096; font-size: 0.78rem;">[{{ t.memberId }}]</span>
                    <div style="font-size: 0.78rem; color: #a0aec0;">{{ t.userEmail }}</div>
                  </div>
                  <div style="display: flex; align-items: center; gap: 8px;">
                    <span class="status-pill status-open" style="font-size: 0.72rem; padding: 2px 8px;">Active</span>
                    <button class="act-btn act-del" style="font-size: 0.76rem; padding: 4px 8px; background-color: #fee2e2; color: #ef4444; border: 1px solid #fca5a5; font-weight: 600; border-radius: 4px;" @click="removeTrekkerFromBatch(t)">
                      ✕ Remove
                    </button>
                  </div>
                </div>
              </div>
              <div v-else style="text-align: center; padding: 15px; background: #fafafa; border: 1px dashed #e2e8f0; border-radius: 6px; font-size: 0.85rem; color: #a0aec0;">
                No trekkers registered in this batch yet.
              </div>
            </div>
          </div>
        </div>
        <div class="ts-modal-footer">
          <button class="btn-ghost" @click="closeTrekModal">Cancel</button>
          <button class="btn-primary-ts" @click="saveTrek">{{ editingTrek ? 'Save Changes' : 'Schedule Batch' }}</button>
        </div>
      </div>
    </div>

    <!-- ════════ ROUTE MODAL ════════ -->
    <div v-if="showRouteModal" class="ts-modal-overlay" @click.self="closeRouteModal">
      <div class="ts-modal">
        <div class="ts-modal-header">
          <h3 class="ts-modal-title">{{ editingRoute ? 'Edit Trek Route' : 'Create Trek Route' }}</h3>
          <button class="modal-close" @click="closeRouteModal">✕</button>
        </div>
        <div class="ts-modal-body">
          <div class="form-grid">
            <div class="form-group form-full">
              <label>Trek Route Name <span style="color: var(--red); font-weight: bold;">*</span></label>
              <input v-model="routeForm.name" type="text" placeholder="e.g. Garbhanga Forest Trek" />
            </div>
            <div class="form-group">
              <label>Location <span style="color: var(--red); font-weight: bold;">*</span></label>
              <input v-model="routeForm.location" type="text" placeholder="Assam" />
            </div>
            <div class="form-group">
              <label>Difficulty <span style="color: var(--red); font-weight: bold;">*</span></label>
              <div class="custom-select-wrapper" :class="{ 'is-open': showFormDiffDropdown }">
                <div class="custom-select-trigger" @click.stop="showFormDiffDropdown = !showFormDiffDropdown">
                  <span>{{ routeForm.difficulty || 'Moderate' }}</span>
                  <svg viewBox="0 0 24 24" class="custom-select-arrow" :class="{ open: showFormDiffDropdown }"><polyline points="6 9 12 15 18 9"/></svg>
                </div>
                <div v-if="showFormDiffDropdown" class="custom-select-dropdown" style="top: 100%; margin-top: 4px; z-index: 1050;">
                  <div class="custom-select-options">
                    <div v-for="opt in ['Easy', 'Moderate', 'Hard']" :key="opt" class="custom-select-option" :class="{ selected: routeForm.difficulty === opt }" @click="routeForm.difficulty = opt; showFormDiffDropdown = false;">
                      <span class="option-name">{{ opt }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div class="form-group">
              <label>Duration (Days) <span style="color: var(--red); font-weight: bold;">*</span></label>
              <input v-model.number="routeForm.duration" type="number" min="1" />
            </div>
            <div class="form-group">
              <label>Distance (km) <span style="color: var(--red); font-weight: bold;">*</span></label>
              <input v-model.number="routeForm.distance" type="number" min="1" />
            </div>
            <div class="form-group form-full">
              <label>Image Source <span style="color: var(--red); font-weight: bold;">*</span></label>
              <div style="display: flex; gap: 1rem; margin-bottom: 0.5rem;">
                <label style="display: flex; align-items: center; gap: 4px; font-weight: normal; cursor: pointer; font-size: 0.82rem;">
                  <input type="radio" value="link" v-model="imageMode" /> Use Image Link
                </label>
                <label style="display: flex; align-items: center; gap: 4px; font-weight: normal; cursor: pointer; font-size: 0.82rem;">
                  <input type="radio" value="upload" v-model="imageMode" /> Upload Image
                </label>
              </div>
              <div v-if="imageMode === 'link'">
                <input v-model="routeForm.imageUrl" type="text" placeholder="https://images.unsplash.com/…" />
              </div>
              <div v-else style="display: flex; gap: 10px; align-items: center;">
                <input type="file" @change="handleImageUpload" accept="image/*" class="form-control" style="font-size: 0.82rem; padding: 4px 8px;" />
              </div>
              <div v-if="routeForm.imageUrl" style="margin-top: 8px;">
                <img :src="routeForm.imageUrl" alt="Preview" style="max-height: 80px; border-radius: 4px; border: 1px solid var(--stone);" />
              </div>
            </div>
            <div class="form-group form-full">
              <label>Description <span style="color: var(--red); font-weight: bold;">*</span></label>
              <textarea v-model="routeForm.description" rows="3" placeholder="Description of the route..."></textarea>
            </div>
          </div>
        </div>
        <div class="ts-modal-footer">
          <button class="btn-ghost" @click="closeRouteModal">Cancel</button>
          <button class="btn-primary-ts" @click="saveRoute">{{ editingRoute ? 'Save Changes' : 'Create Route' }}</button>
        </div>
      </div>
    </div>

    <!-- ════════ ROUTE DETAILS MODAL ════════ -->
    <div v-if="showRouteDetailsModal" class="ts-modal-overlay" @click.self="closeRouteDetails">
      <div class="ts-modal large">
        <div class="ts-modal-header">
          <h3 class="ts-modal-title">[{{ selectedRouteDetails.route.trekCode }}] {{ selectedRouteDetails.route.name }} Details</h3>
          <button class="modal-close" @click="closeRouteDetails">✕</button>
        </div>
        <div class="ts-modal-body">
          <div class="details-modal-grid">
            <!-- Left Side: Profile & Coordinates -->
            <div>
              <div class="route-detail-img" :style="{ backgroundImage: 'url(' + (selectedRouteDetails.route.imageUrl || 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&q=80') + ')' }"></div>
              <div class="route-detail-info-block">
                <div><strong>Location:</strong> <span>{{ selectedRouteDetails.route.location }}</span></div>
                <div><strong>Difficulty:</strong> <span :class="'diff-pill pill-'+selectedRouteDetails.route.difficulty.toLowerCase()">{{ selectedRouteDetails.route.difficulty }}</span></div>
                <div><strong>Duration:</strong> <span>{{ selectedRouteDetails.route.duration }} Days</span></div>
                <div><strong>Distance:</strong> <span>{{ selectedRouteDetails.route.distance }} km</span></div>
                <div><strong>Status:</strong> <span :class="['status-pill', selectedRouteDetails.route.active ? 'status-active' : 'status-inactive']">{{ selectedRouteDetails.route.active ? 'Active (Open)' : 'Inactive (Closed)' }}</span></div>
              </div>
              
              <div class="timeline-section-title" style="margin-top:1rem">Description</div>
              <p style="font-size:0.84rem; color:var(--stone); line-height:1.5; margin:0;">{{ selectedRouteDetails.route.description || 'No description provided.' }}</p>
            </div>
            
            <!-- Right Side: Stats, Timelines & Trekkers -->
            <div>
              <div style="display:grid; grid-template-columns:repeat(3,1fr); gap:10px; margin-bottom:1.25rem;">
                <div class="rev-card" style="padding:0.75rem;">
                  <div style="font-size:1.2rem; font-weight:700; color:var(--forest);">{{ selectedRouteDetails.processedCount }}</div>
                  <div style="font-size:0.7rem; color:var(--stone);">Batches</div>
                </div>
                <div class="rev-card" style="padding:0.75rem;">
                  <div style="font-size:1.2rem; font-weight:700; color:var(--forest);">₹{{ selectedRouteDetails.avgPrice.toLocaleString() }}</div>
                  <div style="font-size:0.7rem; color:var(--stone);">Avg Price</div>
                </div>
                <div class="rev-card" style="padding:0.75rem;">
                  <div style="font-size:1.2rem; font-weight:700; color:var(--forest);">{{ selectedRouteDetails.totalBookings }}</div>
                  <div style="font-size:0.7rem; color:var(--stone);">Bookings</div>
                </div>
              </div>

              <!-- Price Trend Table -->
              <div class="timeline-section-title">Batch History & Pricing Details</div>
              <div v-if="selectedRouteDetails.priceTrends.length" class="ts-table-wrap" style="margin-top: 0.5rem; max-height: 250px; overflow-y: auto;">
                <table class="ts-table" style="font-size: 0.78rem;">
                  <thead>
                    <tr>
                      <th style="padding: 6px 10px;">Batch</th>
                      <th style="padding: 6px 10px;">Start Date</th>
                      <th style="padding: 6px 10px; text-align: right;">Price</th>
                      <th style="padding: 6px 10px; text-align: center;">Occupancy</th>
                      <th style="padding: 6px 10px;">Status</th>
                      <th style="padding: 6px 10px;">Staff Guide</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="trend in selectedRouteDetails.priceTrends" :key="trend.batchCode">
                      <td class="mono font-bold" style="padding: 6px 10px;">{{ trend.batchCode }}</td>
                      <td style="padding: 6px 10px;">{{ formatDate(trend.startDate) }}</td>
                      <td style="padding: 6px 10px; text-align: right; font-weight: 600; color: var(--forest);">₹{{ trend.price.toLocaleString() }}</td>
                      <td style="padding: 6px 10px; text-align: center;" class="mono">{{ trend.booked }}/{{ trend.slots }}</td>
                      <td style="padding: 6px 10px;">
                        <span class="status-pill" :class="'status-' + trend.status.toLowerCase()" style="font-size: 0.68rem; padding: 2px 6px;">
                          {{ trend.status }}
                        </span>
                      </td>
                      <td style="padding: 6px 10px; font-style: italic; color: var(--forest-mid);">{{ trend.staff || 'Unassigned' }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div v-else style="font-size:0.8rem; color:var(--stone); font-style:italic; text-align:center; padding:1rem;">
                No scheduled batches for this route.
              </div>
            </div>
          </div>
        </div>
        <div class="ts-modal-footer">
          <button class="btn-primary-ts" @click="closeRouteDetails">Close</button>
        </div>
      </div>
    </div>

    <!-- ════════ ASSIGN GUIDE MODAL ════════ -->
    <div v-if="showAssignModal" class="ts-modal-overlay" @click.self="closeAssignModal">
      <div class="ts-modal">
        <div class="ts-modal-header">
          <h3 class="ts-modal-title">Assign Guide to {{ assignTrekObj ? assignTrekObj.name : '' }}</h3>
          <button class="modal-close" @click="closeAssignModal">✕</button>
        </div>
        <div class="ts-modal-body" style="overflow: visible;">
          <div class="form-group form-full">
            <div class="custom-select-wrapper" :class="{ 'is-open': showAssignStaffDropdown }">
              <label>Select Guide <span style="color: var(--red); font-weight: bold;">*</span></label>
              <div class="custom-select-trigger" @click.stop="showAssignStaffDropdown = !showAssignStaffDropdown">
                <span>{{ selectedAssignStaffName || 'No Staff Assigned' }}</span>
                <svg viewBox="0 0 24 24" class="custom-select-arrow" :class="{ open: showAssignStaffDropdown }"><polyline points="6 9 12 15 18 9"/></svg>
              </div>
              <div v-if="showAssignStaffDropdown" class="custom-select-dropdown">
                <input v-model="staffSearchQuery" type="text" class="custom-select-search" placeholder="Search staff member..." @click.stop />
                <div class="custom-select-options">
                  <div class="custom-select-option" :class="{ selected: tempStaffId === null }" @click="selectStaffForAssign(null)">
                    <em>No Staff Assigned</em>
                  </div>
                  <div v-for="s in matchingStaff" :key="s.id" class="custom-select-option" :class="{ selected: tempStaffId === s.id }" @click="selectStaffForAssign(s)">
                    <span class="option-name">{{ s.name }}</span>
                    <span class="option-email">({{ s.contact }})</span>
                  </div>
                  <div v-if="!matchingStaff.length" class="custom-select-no-results">
                    No staff members found.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="ts-modal-footer">
          <button class="btn-ghost" @click="closeAssignModal">Cancel</button>
          <button class="btn-primary-ts" @click="saveAssignGuide">Save Assignment</button>
        </div>
      </div>
    </div>

    <!-- ════════ ASSIGN TREK TO STAFF MODAL ════════ -->
    <div v-if="showAssignTrekModal" class="ts-modal-overlay" @click.self="closeAssignTrekModal">
      <div class="ts-modal">
        <div class="ts-modal-header">
          <h3 class="ts-modal-title">Assign Trek to {{ assignStaffObj ? assignStaffObj.name : '' }}</h3>
          <button class="modal-close" @click="closeAssignTrekModal">✕</button>
        </div>
        <div class="ts-modal-body" style="overflow: visible;">
          <div class="form-group form-full">
            <div class="custom-select-wrapper" :class="{ 'is-open': showAssignTrekDropdown }">
              <label>Select Trek Batch <span style="color: var(--red); font-weight: bold;">*</span></label>
              <div class="custom-select-trigger" @click.stop="showAssignTrekDropdown = !showAssignTrekDropdown">
                <span>{{ selectedAssignTrekCode || 'Choose a trek batch...' }}</span>
                <svg viewBox="0 0 24 24" class="custom-select-arrow" :class="{ open: showAssignTrekDropdown }"><polyline points="6 9 12 15 18 9"/></svg>
              </div>
              <div v-if="showAssignTrekDropdown" class="custom-select-dropdown">
                <input v-model="trekSearchQuery" type="text" class="custom-select-search" placeholder="Search batch by code or name..." @click.stop />
                <div class="custom-select-options">
                  <div v-for="t in matchingActiveTreks" :key="t.id" class="custom-select-option" :class="{ selected: tempTrekId === t.id }" @click="selectTrekForAssign(t)">
                    <span class="option-code">[{{ t.batchCode }}]</span>
                    <span class="option-name">{{ t.name }}</span>
                    <span class="option-loc">({{ formatDate(t.startDate) }})</span>
                  </div>
                  <div v-if="!matchingActiveTreks.length" class="custom-select-no-results">
                    No trek batches found.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="ts-modal-footer">
          <button class="btn-ghost" @click="closeAssignTrekModal">Cancel</button>
          <button class="btn-primary-ts" @click="submitAssignTrek">Assign Trek</button>
        </div>
      </div>
    </div>

    <!-- ════════ BATCH DETAILS MODAL ════════ -->
    <div v-if="showBatchDetailsModal" class="ts-modal-overlay" @click.self="closeBatchDetails">
      <div class="ts-modal large">
        <div class="ts-modal-header">
          <h3 class="ts-modal-title">Batch Details — {{ selectedBatchDetails.batch.batchCode }}</h3>
          <button class="modal-close" @click="closeBatchDetails">✕</button>
        </div>
        <div class="ts-modal-body">
          <div class="details-modal-grid">
            <!-- Left Side: Batch Info -->
            <div>
              <div class="route-detail-img" :style="{ backgroundImage: 'url(' + (selectedBatchDetails.batch.imageUrl || 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&q=80') + ')' }"></div>
              <div class="route-detail-info-block">
                <div><strong>Trek Name:</strong> <span>{{ selectedBatchDetails.batch.name }}</span></div>
                <div><strong>Location:</strong> <span>{{ selectedBatchDetails.batch.location }}</span></div>
                <div><strong>Difficulty:</strong> <span :class="'diff-pill pill-'+selectedBatchDetails.batch.difficulty.toLowerCase()">{{ selectedBatchDetails.batch.difficulty }}</span></div>
                <div><strong>Duration:</strong> <span>{{ selectedBatchDetails.batch.duration }} Days</span></div>
                <div><strong>Start Date:</strong> <span>{{ formatDate(selectedBatchDetails.batch.startDate) }}</span></div>
                <div><strong>End Date:</strong> <span>{{ formatDate(selectedBatchDetails.batch.endDate) }}</span></div>
                <div><strong>Price:</strong> <span>₹{{ selectedBatchDetails.batch.price.toLocaleString() }}</span></div>
                <div><strong>Slots:</strong> <span>{{ selectedBatchDetails.batch.booked }} / {{ selectedBatchDetails.batch.slots }} Booked</span></div>
                <div><strong>Status:</strong> <span :class="'status-pill status-'+selectedBatchDetails.batch.status.toLowerCase()">{{ selectedBatchDetails.batch.status }}</span></div>
                <div><strong>Assigned Guide:</strong> <span>{{ selectedBatchDetails.batch.staff || 'No Staff Assigned' }}</span></div>
              </div>
            </div>
            
            <!-- Right Side: Booked Trekkers -->
            <div>
              <div class="timeline-section-title">Registered Trekkers ({{ selectedBatchDetails.bookings.length }})</div>
              <div class="ts-table-wrap" v-if="selectedBatchDetails.bookings.length" style="max-height: 380px;">
                <table class="ts-table">
                  <thead>
                    <tr>
                      <th>Member ID</th>
                      <th>Trekker Name</th>
                      <th>Contact Details</th>
                      <th>Location</th>
                      <th>Booked On</th>
                      <th>Payment</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="user in selectedBatchDetails.bookings" :key="user.id">
                      <td class="mono" style="font-size: 0.8rem;">{{ user.memberId }}</td>
                      <td>
                        <span style="font-weight:600; color:var(--forest)">{{ user.userName }}</span>
                      </td>
                      <td>
                        <div style="font-size:0.8rem; line-height:1.2;">
                          <div>{{ user.userEmail }}</div>
                          <div class="mono" style="color:var(--stone)">{{ user.userPhone }}</div>
                        </div>
                      </td>
                      <td style="font-size:0.8rem;">{{ user.userCity || '—' }}</td>
                      <td class="mono" style="font-size:0.8rem;">{{ formatDate(user.bookedOn) }}</td>
                      <td>
                        <span :class="['status-pill', user.paid ? 'status-open' : 'status-pending']" style="font-size:0.75rem;">
                          {{ user.paid ? 'Paid' : 'Unpaid' }}
                        </span>
                        <div v-if="user.paid && user.transactionId" class="mono" style="font-size:0.65rem; color:var(--stone); margin-top:2px;">
                          {{ user.transactionId }}
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div v-else style="font-size:0.8rem; color:var(--stone); font-style:italic; text-align:center; padding:2rem;">
                No trekkers have booked this batch yet.
              </div>
            </div>
          </div>
        </div>
        <div class="ts-modal-footer">
          <button class="btn-primary-ts" @click="closeBatchDetails">Close</button>
        </div>
      </div>
    </div>

    <!-- ════════ STAFF MODAL ════════ -->
    <div v-if="showStaffModal" class="ts-modal-overlay" @click.self="closeStaffModal">
      <div class="ts-modal large">
        <div class="ts-modal-header">
          <h3 class="ts-modal-title">{{ editingStaff ? 'Edit Staff Profile' : 'Add Trek Staff' }}</h3>
          <button class="modal-close" @click="closeStaffModal">✕</button>
        </div>
        <div class="ts-modal-body">
          <div class="form-grid">
            <div class="form-group">
              <label>Full Name <span style="color: var(--red); font-weight: bold;">*</span></label>
              <input v-model="staffForm.name" type="text" placeholder="e.g. John Doe" />
            </div>
            <div class="form-group">
              <label>Email <span style="color: var(--red); font-weight: bold;">*</span></label>
              <input v-model="staffForm.email" type="email" placeholder="staff@trailsync.com" />
            </div>
            <div class="form-group">
              <label>Phone Number</label>
              <input v-model="staffForm.phone" type="text" placeholder="e.g. +91 9876543210" />
            </div>
            <div class="form-group">
              <label>{{ editingStaff ? 'New Password (optional)' : 'Password (Default: Trailsync@123)' }}</label>
              <input v-model="staffForm.password" type="text" :placeholder="editingStaff ? 'Leave blank to keep unchanged' : 'Trailsync@123'" />
            </div>
            <div class="form-group">
              <label>Designation</label>
              <input v-model="staffForm.designation" type="text" placeholder="e.g. Lead Guide" />
            </div>
            <div class="form-group">
              <label>Experience (Years)</label>
              <input v-model.number="staffForm.experience" type="number" min="0" />
            </div>
            <div class="form-group">
              <label>Skills</label>
              <input v-model="staffForm.skills" type="text" placeholder="e.g. Wilderness First Aid, Navigation" />
            </div>
            <div class="form-group">
              <label>Certifications</label>
              <input v-model="staffForm.certifications" type="text" placeholder="e.g. WFR" />
            </div>
            <div class="form-group">
              <label>Languages</label>
              <input v-model="staffForm.languages" type="text" placeholder="e.g. English, Hindi" />
            </div>
            <div class="form-group">
              <label>Completed Treks Count</label>
              <input v-model.number="staffForm.completedTreksCount" type="number" min="0" />
            </div>
            <div class="form-group form-full">
              <label>Staff Photograph</label>
              <div style="display: flex; gap: 1rem; margin-bottom: 0.5rem;">
                <label style="display: flex; align-items: center; gap: 4px; font-weight: normal; cursor: pointer; font-size: 0.82rem;">
                  <input type="radio" value="link" v-model="staffImageMode" /> Use Image Link
                </label>
                <label style="display: flex; align-items: center; gap: 4px; font-weight: normal; cursor: pointer; font-size: 0.82rem;">
                  <input type="radio" value="upload" v-model="staffImageMode" /> Upload Image
                </label>
              </div>
              <div v-if="staffImageMode === 'link'">
                <input v-model="staffForm.photoUrl" type="text" placeholder="https://images.unsplash.com/photo-..." />
              </div>
              <div v-else style="display: flex; gap: 10px; align-items: center;">
                <input type="file" @change="handleStaffPhotoUpload" accept="image/*" class="form-control" style="font-size: 0.82rem; padding: 4px 8px;" />
              </div>
              <div v-if="staffForm.photoUrl" style="margin-top: 8px;">
                <img :src="staffForm.photoUrl" alt="Preview" style="max-height: 80px; border-radius: 4px; border: 1px solid var(--stone);" />
              </div>
            </div>
          </div>
        </div>
        <div class="ts-modal-footer">
          <button class="btn-ghost" @click="closeStaffModal">Cancel</button>
          <button class="btn-primary-ts" @click="saveStaff">{{ editingStaff ? 'Save Changes' : 'Add Staff Member' }}</button>
        </div>
      </div>
    </div>

    <!-- ════════ TREKKER MODAL ════════ -->
    <div v-if="showTrekkerModal" class="ts-modal-overlay" @click.self="closeTrekkerModal">
      <div class="ts-modal">
        <div class="ts-modal-header">
          <h3 class="ts-modal-title">{{ editingTrekker ? 'Edit User Profile' : 'Add New Trekker' }}</h3>
          <button class="modal-close" @click="closeTrekkerModal">✕</button>
        </div>
        <div class="ts-modal-body">
          <div class="form-grid">
            <div class="form-group form-full">
              <label>Full Name <span style="color: var(--red); font-weight: bold;">*</span></label>
              <input v-model="trekkerForm.name" type="text" placeholder="e.g. John Doe" />
            </div>
            <div class="form-group form-full">
              <label>Email <span style="color: var(--red); font-weight: bold;">*</span></label>
              <input v-model="trekkerForm.email" type="email" placeholder="john.doe@example.com" />
            </div>
            <div class="form-group">
              <label>Phone Number</label>
              <input v-model="trekkerForm.phone" type="text" placeholder="e.g. +91 9876543210" />
            </div>
            <div class="form-group">
              <label>{{ editingTrekker ? 'New Password (optional)' : 'Password (Default: Trekker@123)' }}</label>
              <input v-model="trekkerForm.password" type="text" :placeholder="editingTrekker ? 'Leave blank to keep unchanged' : 'Trekker@123'" />
            </div>
            <div class="form-group">
              <label>City</label>
              <input v-model="trekkerForm.city" type="text" placeholder="e.g. Delhi" />
            </div>
            <div class="form-group">
              <label>Emergency Contact</label>
              <input v-model="trekkerForm.emergency" type="text" placeholder="e.g. +91 9999988888" />
            </div>
            <div class="form-group form-full">
              <label>Bio / Medical Info</label>
              <textarea v-model="trekkerForm.bio" placeholder="e.g. Has previous experience trekking, no medical history." rows="3"></textarea>
            </div>
          </div>
        </div>
        <div class="ts-modal-footer">
          <button class="btn-ghost" @click="closeTrekkerModal">Cancel</button>
          <button class="btn-primary-ts" @click="saveTrekker">{{ editingTrekker ? 'Save Changes' : 'Add Trekker' }}</button>
        </div>
      </div>
    </div>

    <!-- ════════ CUSTOM CONFIRMATION MODAL ════════ -->
    <div v-if="showConfirmModal" class="ts-modal-overlay" @click.self="closeConfirmModal" style="z-index: 3000;">
      <div class="ts-modal" style="max-width: 400px;">
        <div class="ts-modal-header" style="border-bottom: none; padding-bottom: 0;">
          <h3 class="ts-modal-title" style="color: var(--red); display: flex; align-items: center; gap: 8px;">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
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

    <!-- ════════ BLACKLIST REASON MODAL ════════ -->
    <div v-if="showBlacklistModal" class="ts-modal-overlay" @click.self="closeBlacklistModal" style="z-index: 3000;">
      <div class="ts-modal" style="max-width: 450px;">
        <div class="ts-modal-header" style="border-bottom: none; padding-bottom: 0;">
          <h3 class="ts-modal-title" style="color: var(--red); display: flex; align-items: center; gap: 8px;">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"></line></svg>
            <span>Blacklist Account</span>
          </h3>
          <button class="modal-close" @click="closeBlacklistModal">✕</button>
        </div>
        <div class="ts-modal-body" style="padding-top: 1rem; padding-bottom: 1.5rem; font-size: 0.9rem;">
          <p style="margin-bottom: 0.75rem; color: var(--forest-mid);">
            Are you sure you want to blacklist <strong>{{ blacklistTargetUser ? blacklistTargetUser.name : '' }}</strong>? This will prevent them from logging in and accessing their dashboard.
          </p>
          <div class="form-group" style="margin-top: 1rem;">
            <label style="font-weight: 600; color: var(--forest); display: block; margin-bottom: 0.5rem;">Reason for Blacklisting:</label>
            <textarea 
              v-model="blacklistReasonText" 
              placeholder="Enter reason for blacklisting (e.g. Code of conduct violation, payment fraud)..." 
              rows="4" 
              style="width: 100%; padding: 0.5rem; border: 1px solid var(--stone); border-radius: var(--radius); font-size: 0.85rem; font-family: inherit; resize: vertical;"
            ></textarea>
          </div>
        </div>
        <div class="ts-modal-footer" style="background: var(--snow); border-top: 1px solid var(--stone-light);">
          <button class="btn-ghost" @click="closeBlacklistModal">Cancel</button>
          <button class="btn-primary-ts" style="background: var(--red); border-color: var(--red);" @click="submitBlacklist">Blacklist Account</button>
        </div>
      </div>
    </div>

    <!-- ════════ STAFF DETAILS MODAL ════════ -->
    <div v-if="showStaffDetailsModal" class="ts-modal-overlay" @click.self="closeStaffDetails">
      <div class="ts-modal extra-large">
        <div class="ts-modal-header">
          <h3 class="ts-modal-title">Staff Member Details</h3>
          <button class="modal-close" @click="closeStaffDetails">✕</button>
        </div>
        <div class="ts-modal-body">
          <div class="details-modal-grid" style="grid-template-columns: 1fr 2fr;">
            <!-- Left Side: Profile Photo & Basic Details -->
            <div style="text-align: center; border-right: 1px solid var(--stone-light); padding-right: 1.5rem;">
              <img :src="selectedStaffDetails.photoUrl" style="width: 140px; height: 140px; border-radius: 50%; object-fit: cover; margin: 0 auto 1rem; border: 3px solid var(--forest); box-shadow: 0 4px 10px rgba(0,0,0,0.1);" />
              <h4 style="font-weight: 700; color: var(--forest); margin-bottom: 0.25rem;">{{ selectedStaffDetails.name }}</h4>
              <div style="font-size: 0.85rem; color: var(--stone); font-family: monospace; margin-bottom: 1rem;">ID: {{ selectedStaffDetails.memberId }}</div>
              
              <div class="staff-detail-info" style="text-align: left; background: var(--snow); padding: 1rem; border-radius: 6px; border: 1px solid var(--stone-light); font-size: 0.84rem;">
                <div style="margin-bottom: 8px;"><strong>Designation:</strong> {{ selectedStaffDetails.designation }}</div>
                <div style="margin-bottom: 8px;"><strong>Email:</strong> {{ selectedStaffDetails.contact }}</div>
                <div style="margin-bottom: 8px;"><strong>Phone:</strong> {{ selectedStaffDetails.phone || '—' }}</div>
                <div style="margin-bottom: 8px;"><strong>Joined Date:</strong> {{ formatDate(selectedStaffDetails.joined) }}</div>
                <div style="margin-bottom: 8px;"><strong>Experience:</strong> {{ selectedStaffDetails.experience }} years</div>
                <div style="margin-bottom: 8px;"><strong>Languages:</strong> {{ selectedStaffDetails.languages }}</div>
                <div style="margin-bottom: 8px;"><strong>Certifications:</strong> {{ selectedStaffDetails.certifications }}</div>
                <div><strong>Skills:</strong> {{ selectedStaffDetails.skills }}</div>
              </div>
            </div>
            
            <!-- Right Side: Treks Completed -->
            <div style="min-width: 0;">
              <div class="timeline-section-title" style="font-weight: 700; color: var(--forest); font-size: 1.05rem; margin-bottom: 0.75rem;">
                Treks Completed ({{ selectedStaffDetails.treksDone.length }})
              </div>
              <div class="ts-table-wrap goldish" v-if="selectedStaffDetails.treksDone.length" style="max-height: 360px; overflow: auto; border-radius: 4px;">
                <table class="ts-table" style="min-width: 550px; width: 100%;">
                  <thead>
                    <tr>
                      <th style="padding: 10px 12px; font-size: 0.72rem;">Batch ID</th>
                      <th style="padding: 10px 12px; font-size: 0.72rem;">Trek Name</th>
                      <th style="padding: 10px 12px; font-size: 0.72rem;">Trek location</th>
                      <th style="padding: 10px 12px; font-size: 0.72rem; text-align: center;">Total Trekkers</th>
                      <th style="padding: 10px 12px; font-size: 0.72rem;">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="t in selectedStaffDetails.treksDone" :key="t.batchId">
                      <td class="mono" style="font-weight: 700; color: var(--gold); padding: 10px 12px;">{{ t.batchId }}</td>
                      <td style="font-weight: 600; color: var(--forest); padding: 10px 12px;">{{ t.trekName }}</td>
                      <td style="padding: 10px 12px; font-size: 0.82rem; color: var(--bark);">📍 {{ t.location }}</td>
                      <td class="mono" style="text-align: center; padding: 10px 12px; font-weight: 600; color: var(--forest-mid);">
                        {{ t.trekkersCount }}
                      </td>
                      <td class="mono" style="white-space: nowrap; padding: 10px 12px; font-size: 0.75rem; color: var(--stone);">
                        {{ formatDate(t.startDate) }}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div v-else style="font-size:0.8rem; color:var(--stone); font-style:italic; text-align:center; padding:3rem 1rem; background: var(--snow); border-radius: 6px; border: 1px dashed var(--stone);">
                No treks done or assigned to this staff member yet.
              </div>
            </div>
          </div>
        </div>
        <div class="ts-modal-footer">
          <button class="btn-primary-ts" @click="closeStaffDetails">Close</button>
        </div>
      </div>
    </div>

    <!-- ════════ USER DETAILS MODAL ════════ -->
    <div v-if="showUserDetailsModal" class="ts-modal-overlay" @click.self="closeUserDetails">
      <div class="ts-modal large">
        <div class="ts-modal-header">
          <h3 class="ts-modal-title">User Account Details</h3>
          <button class="modal-close" @click="closeUserDetails">✕</button>
        </div>
        <div class="ts-modal-body">
          <div class="details-modal-grid">
            <!-- Left Side: Profile Photo & Basic Details -->
            <div style="text-align: center; border-right: 1px solid var(--stone-light); padding-right: 1.5rem;">
              <img :src="selectedUserDetails.photoUrl" style="width: 140px; height: 140px; border-radius: 50%; object-fit: cover; margin: 0 auto 1rem; border: 3px solid var(--forest); box-shadow: 0 4px 10px rgba(0,0,0,0.1);" />
              <h4 style="font-weight: 700; color: var(--forest); margin-bottom: 0.25rem;">{{ selectedUserDetails.name }}</h4>
              <div style="font-size: 0.85rem; color: var(--stone); font-family: monospace; margin-bottom: 1rem;">ID: {{ selectedUserDetails.memberId }}</div>
              
              <div class="staff-detail-info" style="text-align: left; background: var(--snow); padding: 1rem; border-radius: 6px; border: 1px solid var(--stone-light); font-size: 0.84rem;">
                <div style="margin-bottom: 8px;"><strong>Email:</strong> {{ selectedUserDetails.email }}</div>
                <div style="margin-bottom: 8px;"><strong>Phone:</strong> {{ selectedUserDetails.phone || '—' }}</div>
                <div style="margin-bottom: 8px;"><strong>City:</strong> {{ selectedUserDetails.city || '—' }}</div>
                <div style="margin-bottom: 8px;"><strong>Emergency Contact:</strong> {{ selectedUserDetails.emergency || '—' }}</div>
                <div style="margin-bottom: 8px;"><strong>Joined:</strong> {{ formatDate(selectedUserDetails.registered) }}</div>
                <div><strong>Bio:</strong> {{ selectedUserDetails.bio || 'No bio provided.' }}</div>
              </div>
            </div>
            
            <!-- Right Side: Booking Details History Table -->
            <div>
              <div class="timeline-section-title" style="font-weight: 700; color: var(--forest); font-size: 1.05rem; margin-bottom: 0.75rem;">
                Trek Bookings History ({{ selectedUserDetails.bookingsList.length }})
              </div>
              <div class="ts-table-wrap" v-if="selectedUserDetails.bookingsList.length" style="max-height: 360px; overflow-y: auto;">
                <table class="ts-table">
                  <thead>
                    <tr>
                      <th>Batch ID</th>
                      <th>Trek Name</th>
                      <th>Paid Amount</th>
                      <th>Paid On</th>
                      <th>Transaction ID</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="b in selectedUserDetails.bookingsList" :key="b.id">
                      <td class="mono font-bold">{{ b.batchCode }}</td>
                      <td style="font-weight: 600; color: var(--forest);">{{ b.trek }}</td>
                      <td class="mono">₹{{ b.paidAmount ? b.paidAmount.toLocaleString() : '0' }}</td>
                      <td class="mono" style="white-space: nowrap;">{{ b.paidOn === '—' ? '—' : formatDate(b.paidOn) }}</td>
                      <td class="mono" style="font-size: 0.8rem;">{{ b.transactionId }}</td>
                      <td>
                        <span :class="['status-pill', b.status === 'Booked' ? 'status-active' : (b.status === 'Completed' ? 'status-open' : 'status-inactive')]" style="font-size: 0.72rem; padding: 2px 6px;">
                          {{ b.status }}
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div v-else style="font-size:0.8rem; color:var(--stone); font-style:italic; text-align:center; padding:3rem 1rem; background: var(--snow); border-radius: 6px; border: 1px dashed var(--stone);">
                No booking history records found for this user.
              </div>
            </div>
          </div>
        </div>
        <div class="ts-modal-footer">
          <button class="btn-primary-ts" @click="closeUserDetails">Close</button>
        </div>
      </div>
    </div>

    <!-- ════════ BOOKING DETAILS MODAL ════════ -->
    <div v-if="showBookingDetailsModal" class="ts-modal-overlay" @click.self="closeBookingDetails">
      <div class="ts-modal large">
        <div class="ts-modal-header">
          <h3 class="ts-modal-title">Booking Details — {{ selectedBookingDetails.booking.bookingId || ('#' + selectedBookingDetails.booking.id) }}</h3>
          <button class="modal-close" @click="closeBookingDetails">✕</button>
        </div>
        <div class="ts-modal-body" style="max-height: 480px; overflow-y: auto;">
          <div class="details-modal-grid">
            <!-- Left Side: Trekker Profile Info -->
            <div>
              <div class="timeline-section-title" style="margin-bottom: 0.75rem;">Trekker Profile</div>
              <div class="route-detail-info-block" style="margin-bottom: 1.5rem;">
                <div><strong>Member ID:</strong> <span class="mono">{{ selectedBookingDetails.user.memberId }}</span></div>
                <div><strong>Full Name:</strong> <span>{{ selectedBookingDetails.user.name }}</span></div>
                <div><strong>Email:</strong> <span>{{ selectedBookingDetails.user.email }}</span></div>
                <div><strong>Phone Number:</strong> <span class="mono">{{ selectedBookingDetails.user.phone || '—' }}</span></div>
                <div><strong>City / Base:</strong> <span>{{ selectedBookingDetails.user.city || '—' }}</span></div>
                <div><strong>Emergency Contact:</strong> <span class="mono">{{ selectedBookingDetails.user.emergency || '—' }}</span></div>
                <div style="grid-column: 1 / -1; margin-top: 5px;">
                  <strong>Medical Bio / Info:</strong>
                  <div style="font-size:0.8rem; background:var(--cream); padding:0.5rem; border-radius:4px; margin-top:4px; color:var(--bark);">
                    {{ selectedBookingDetails.user.bio || 'No medical bio provided.' }}
                  </div>
                </div>
              </div>

              <div class="timeline-section-title" style="margin-bottom: 0.75rem;">Transaction & Payment</div>
              <div class="route-detail-info-block">
                <div><strong>Payment Status:</strong> 
                  <span :class="['status-pill', selectedBookingDetails.booking.paid ? 'status-open' : 'status-pending']">
                    {{ selectedBookingDetails.booking.paid ? 'Paid' : 'Pending' }}
                  </span>
                </div>
                <div><strong>Amount Paid:</strong> <span class="mono">₹{{ selectedBookingDetails.booking.paidAmount ? selectedBookingDetails.booking.paidAmount.toLocaleString() : '0' }}</span></div>
                <div><strong>Transaction ID:</strong> <span class="mono">{{ selectedBookingDetails.booking.transactionId || '—' }}</span></div>
                <div><strong>Paid On Date:</strong> <span class="mono">{{ selectedBookingDetails.booking.paidOn || '—' }}</span></div>
              </div>
            </div>

            <!-- Right Side: Batch Details -->
            <div>
              <div class="timeline-section-title" style="margin-bottom: 0.75rem;">Trek Batch Details</div>
              <div class="route-detail-info-block">
                <div><strong>Batch Code:</strong> <span class="mono">{{ selectedBookingDetails.booking.batchCode }}</span></div>
                <div><strong>Trek Name:</strong> <span>{{ selectedBookingDetails.booking.trek }}</span></div>
                <div><strong>Booked On:</strong> <span class="mono">{{ formatDate(selectedBookingDetails.booking.date) }}</span></div>
                <div><strong>Booking Status:</strong> <span :class="'status-pill status-'+selectedBookingDetails.booking.status.toLowerCase()">{{ selectedBookingDetails.booking.status }}</span></div>
              </div>
            </div>
          </div>
        </div>
        <div class="ts-modal-footer">
          <button class="btn-primary-ts" @click="closeBookingDetails">Close</button>
        </div>
      </div>
    </div>

    <!-- ════════ TOAST ════════ -->
    <transition name="toast">
      <div v-if="toast.show" class="ts-toast">{{ toast.msg }}</div>
    </transition>

  </div>
  `
};
