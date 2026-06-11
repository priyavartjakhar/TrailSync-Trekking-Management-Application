// ============================================================
//  admin_components.js — TrailSync Admin Dashboard (Full)
//  Covers all 25 sections from project spec + extras
// ============================================================

const TsAdminLayout = {
  name: 'TsAdminLayout',
  emits: ['logout'],
  data() {
    return {
      activeTab: 'dashboard',
      sidebarCollapsed: false,
      searchQuery: '',
      trekFilter: 'All',
      bookingFilter: 'All',
      userFilter: 'All',
      auditFilter: 'All',
      showTrekModal: false,
      showStaffModal: false,
      showUserModal: false,
      showAssignModal: false,
      editingTrek: null,
      selectedUser: null,
      assignTrekId: null,
      toast: { show: false, msg: '' },
      notifOpen: false,

      tabTitles: {
        dashboard:    'Overview',
        treks:        'Trek Management',
        approvals:    'Approval Queue',
        staff:        'Trek Staff',
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
        status:'Pending', imageUrl:'', description:''
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
      pendingTreks:       [],
      alertsAndTasks:     [],
      supportTickets:     [],
    };
  },

  computed: {
    searchPlaceholder() {
      const map = {
        treks:'Search treks…', staff:'Search staff…',
        users:'Search users…', bookings:'Search bookings…',
        audit:'Search audit logs…', approvals:'Search pending treks…',
        support_tickets:'Search tickets…',
      };
      return map[this.activeTab] || 'Search…';
    },
    filteredTreks() {
      let list = this.trekFilter === 'All'
        ? this.treks
        : this.treks.filter(t => t.status === this.trekFilter);
      if (this.searchQuery)
        list = list.filter(t => t.name.toLowerCase().includes(this.searchQuery.toLowerCase())
          || t.location.toLowerCase().includes(this.searchQuery.toLowerCase()));
      return list;
    },
    filteredStaff() {
      if (!this.searchQuery) return this.staffList;
      return this.staffList.filter(s =>
        s.name.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        s.contact.toLowerCase().includes(this.searchQuery.toLowerCase()));
    },
    filteredUsers() {
      let list = this.users;
      if (this.userFilter === 'Active')      list = list.filter(u => !u.blacklisted);
      if (this.userFilter === 'Blacklisted') list = list.filter(u => u.blacklisted);
      if (this.searchQuery)
        list = list.filter(u =>
          u.name.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
          u.email.toLowerCase().includes(this.searchQuery.toLowerCase()));
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
    filteredPending() {
      if (!this.searchQuery) return this.pendingTreks;
      return this.pendingTreks.filter(t =>
        t.name.toLowerCase().includes(this.searchQuery.toLowerCase()));
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
    }
  },

  mounted() {
    this.loadData();
  },

  methods: {
    handleTaskAction(type) {
      if (type === 'pending_approvals') {
        this.activeTab = 'approvals';
      } else if (type === 'inactive_staff') {
        this.activeTab = 'staff';
      } else if (type === 'unassigned_staff') {
        this.activeTab = 'treks';
        this.trekFilter = 'All';
      } else if (type === 'starting_this_week') {
        this.activeTab = 'treks';
        this.trekFilter = 'All';
      } else if (type === 'pending_tickets') {
        this.activeTab = 'support_tickets';
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
        pendingTreks: PENDING_TREKS,
        supportTickets: [],
      });
    },

    applyData(d) {
      Object.keys(d).forEach(k => { if (this[k] !== undefined) this[k] = d[k]; });
    },

    // ── Trek CRUD ──────────────────────────────────────────
    openTrekModal(trek = null) {
      this.editingTrek = trek;
      this.trekForm = trek
        ? { ...trek }
        : { name:'', location:'', difficulty:'Moderate', startDate:'', endDate:'', slots:20, price:5000, status:'Pending', imageUrl:'', description:'' };
      this.showTrekModal = true;
    },
    closeTrekModal() { this.showTrekModal = false; this.editingTrek = null; },

    async saveTrek() {
      try {
        const payload = this.editingTrek ? { id: this.editingTrek.id, ...this.trekForm } : { ...this.trekForm };
        const res = await fetch('/api/admin/treks', {
          method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(payload)
        });
        if (res.ok) { this.showToast(this.editingTrek ? 'Trek updated' : 'Trek created'); this.loadData(); }
        else          this.showToast('Failed to save trek');
      } catch (_) {
        if (this.editingTrek) {
          const i = this.treks.findIndex(t => t.id === this.editingTrek.id);
          if (i !== -1) this.treks[i] = { ...this.editingTrek, ...this.trekForm };
        } else {
          this.treks.push({ id: Date.now(), ...this.trekForm, staff: null, totalSlots: this.trekForm.slots });
        }
        this.showToast(this.editingTrek ? 'Trek updated (mock)' : 'Trek created (mock)');
      }
      this.closeTrekModal();
    },

    async deleteTrek(id) {
      if (!confirm('Remove this trek? This cannot be undone.')) return;
      try {
        const res = await fetch(`/api/admin/treks/${id}`, { method:'DELETE' });
        if (res.ok) { this.showToast('Trek removed'); this.loadData(); }
        else          this.showToast('Failed to remove trek');
      } catch (_) {
        this.treks = this.treks.filter(t => t.id !== id);
        this.showToast('Trek removed (mock)');
      }
    },

    async approveTrek(trek) {
      try {
        const res = await fetch(`/api/admin/treks/approve/${trek.id}`, { method:'POST' });
        if (res.ok) { this.showToast(`"${trek.name}" approved`); this.loadData(); return; }
      } catch (_) {}
      this.pendingTreks = this.pendingTreks.filter(t => t.id !== trek.id);
      const t = this.treks.find(t => t.id === trek.id);
      if (t) t.status = 'Approved';
      this.showToast(`"${trek.name}" approved (mock)`);
    },

    async rejectTrek(trek) {
      try {
        const res = await fetch(`/api/admin/treks/reject/${trek.id}`, { method:'POST' });
        if (res.ok) { this.showToast(`"${trek.name}" rejected`); this.loadData(); return; }
      } catch (_) {}
      this.pendingTreks = this.pendingTreks.filter(t => t.id !== trek.id);
      this.showToast(`"${trek.name}" rejected (mock)`);
    },

    // ── Staff CRUD ─────────────────────────────────────────
    openStaffModal() {
      this.staffForm = { name:'', email:'', phone:'', password:'' };
      this.showStaffModal = true;
    },
    closeStaffModal() { this.showStaffModal = false; },

    async saveStaff() {
      try {
        const res = await fetch('/api/admin/staff', {
          method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(this.staffForm)
        });
        if (res.ok) { this.showToast('Staff member added'); this.loadData(); }
        else {
          const d = await res.json();
          this.showToast(d.error || 'Failed to add staff');
        }
      } catch (_) {
        this.staffList.push({ id: Date.now(), name: this.staffForm.name, contact: this.staffForm.email, phone: this.staffForm.phone, treks:[], active:true, joined: new Date().toISOString().slice(0,10) });
        this.showToast('Staff added (mock)');
      }
      this.closeStaffModal();
    },

    async toggleStaffStatus(s) {
      try {
        const res = await fetch(`/api/admin/staff/toggle/${s.id}`, { method:'POST' });
        if (res.ok) { this.showToast(`${s.name} status updated`); this.loadData(); return; }
      } catch (_) {}
      s.active = !s.active;
      this.showToast(`${s.name} ${s.active ? 'activated' : 'deactivated'} (mock)`);
    },

    async assignTrekToStaff(s) {
      const trekName = prompt(`Enter Trek Name to assign to ${s.name}:`);
      if (!trekName) return;
      const trek = this.treks.find(t => t.name.toLowerCase() === trekName.toLowerCase());
      if (!trek) { this.showToast('Trek not found'); return; }
      try {
        const res = await fetch(`/api/admin/treks/assign/${trek.id}`, {
          method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ email: s.contact })
        });
        if (res.ok) { this.showToast(`${trek.name} assigned to ${s.name}`); this.loadData(); return; }
      } catch (_) {}
      if (!s.treks.includes(trek.name)) s.treks.push(trek.name);
      trek.staff = s.name;
      this.showToast(`${trek.name} assigned to ${s.name} (mock)`);
    },

    async assignStaffToTrek(trek) {
      const email = prompt(`Enter staff email to assign to "${trek.name}":`);
      if (!email) return;
      try {
        const res = await fetch(`/api/admin/treks/assign/${trek.id}`, {
          method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ email })
        });
        if (res.ok) { this.showToast(`Staff assigned to ${trek.name}`); this.loadData(); return; }
        else { const d = await res.json(); this.showToast(d.error || 'Assignment failed'); return; }
      } catch (_) {}
      const staff = this.staffList.find(s => s.contact === email);
      if (staff) { trek.staff = staff.name; this.showToast(`Assigned (mock)`); }
      else this.showToast('Staff not found (mock)');
    },

    // ── User Management ────────────────────────────────────
    async toggleBlacklist(u) {
      try {
        const res = await fetch(`/api/admin/users/blacklist/${u.id}`, { method:'POST' });
        if (res.ok) { this.showToast(`${u.name} status updated`); this.loadData(); return; }
      } catch (_) {}
      u.blacklisted = !u.blacklisted;
      if (u.blacklisted) {
        this.blacklistedUsers.push({ id: u.id, name: u.name, reason: 'Manually blacklisted by admin', date: new Date().toISOString().slice(0,10) });
      } else {
        this.blacklistedUsers = this.blacklistedUsers.filter(b => b.id !== u.id);
      }
      this.showToast(`${u.name} ${u.blacklisted ? 'blacklisted' : 'restored'} (mock)`);
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
    async cancelBooking(b) {
      if (!confirm(`Cancel booking #${b.id} for ${b.user}?`)) return;
      try {
        const res = await fetch(`/api/admin/bookings/cancel/${b.id}`, { method:'POST' });
        if (res.ok) { this.showToast('Booking cancelled'); this.loadData(); return; }
      } catch (_) {}
      b.status = 'Cancelled';
      this.showToast('Booking cancelled (mock)');
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
        <a class="nav-item" :class="{ active: activeTab==='approvals' }" @click="activeTab='approvals'">
          <svg viewBox="0 0 24 24"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
          <span>Approvals</span>
          <span v-if="pendingTreks.length" class="nav-badge">{{ pendingTreks.length }}</span>
        </a>

        <div class="nav-section-label">Manage</div>
        <a class="nav-item" :class="{ active: activeTab==='treks' }" @click="activeTab='treks'">
          <svg viewBox="0 0 24 24"><path d="M3 17l4-8 4 4 4-6 4 10"/><path d="M3 20h18"/></svg>
          <span>Trek Routes</span>
        </a>
        <a class="nav-item" :class="{ active: activeTab==='staff' }" @click="activeTab='staff'">
          <svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>
          <span>Trek Staff</span>
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
          <span v-if="blacklistedUsers.length" class="nav-badge">{{ blacklistedUsers.length }}</span>
        </a>
        <a class="nav-item" :class="{ active: activeTab==='support_tickets' }" @click="activeTab='support_tickets'">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
          <span>Support Tickets</span>
          <span v-if="supportTickets.filter(t => t.status==='Open').length" class="nav-badge">{{ supportTickets.filter(t => t.status==='Open').length }}</span>
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
        <a class="nav-item" :class="{ active: activeTab==='notifications' }" @click="activeTab='notifications'">
          <svg viewBox="0 0 24 24"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
          <span>Notifications</span>
          <span v-if="unreadNotifCount" class="nav-badge">{{ unreadNotifCount }}</span>
        </a>
        <a class="nav-item" :class="{ active: activeTab==='jobs' }" @click="activeTab='jobs'">
          <svg viewBox="0 0 24 24"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
          <span>Scheduled Jobs</span>
        </a>
        <a class="nav-item" :class="{ active: activeTab==='system' }" @click="activeTab='system'">
          <svg viewBox="0 0 24 24"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
          <span>System Health</span>
        </a>
        <a class="nav-item" :class="{ active: activeTab==='audit' }" @click="activeTab='audit'">
          <svg viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          <span>Audit Logs</span>
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
          <button v-if="activeTab==='treks'" class="btn-primary-ts" @click="openTrekModal()">+ New Trek</button>
          <button v-if="activeTab==='staff'" class="btn-primary-ts" @click="openStaffModal()">+ Add Staff</button>
          <button v-if="activeTab==='bookings'" class="btn-ghost" @click="exportCSV('bookings')">↓ Export CSV</button>
          <button v-if="activeTab==='audit'" class="btn-ghost" @click="exportCSV('audit')">↓ Export Logs</button>
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
              <div class="task-alert-card" v-for="item in alertsAndTasks" :key="item.label" :class="{ urgent: item.count > 0 }">
                <div class="task-card-icon-col">⚠</div>
                <div class="task-card-body-col">
                  <div class="task-card-num">{{ item.count }}</div>
                  <div class="task-card-label">{{ item.label }}</div>
                </div>
                <button class="btn-ghost task-resolve-btn" style="padding: 4px 10px; font-size: 0.72rem; border-radius: 3px;" @click="handleTaskAction(item.type)">
                  Resolve →
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
                  <button class="console-btn btn-create" @click="openTrekModal()">
                    <svg viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                    <span>Create Trek</span>
                  </button>
                  <button class="console-btn btn-create" @click="openStaffModal()">
                    <svg viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                    <span>Add Staff</span>
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
                    <span class="mono" style="font-size:0.74rem; color:var(--stone);">Start: {{ t.startDate }}</span>
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

      <!-- ══ TREK APPROVAL QUEUE ════════════════════════════ -->
      <section v-if="activeTab==='approvals'" class="tab-content">
        <div style="margin-bottom:1rem; color:var(--stone); font-size:.9rem;">
          {{ pendingTreks.length }} trek{{ pendingTreks.length !== 1 ? 's' : '' }} awaiting approval
        </div>
        <div v-if="filteredPending.length === 0" class="empty-state">
          <svg viewBox="0 0 24 24"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
          <p>No pending treks — queue is clear.</p>
        </div>
        <div v-else class="queue-list">
          <div v-for="t in filteredPending" :key="t.id" class="queue-item">
            <div class="queue-info">
              <div class="queue-name">{{ t.name }}</div>
              <div class="queue-meta">{{ t.location }} · <span :class="'diff-pill pill-'+t.difficulty.toLowerCase()">{{ t.difficulty }}</span> · Submitted {{ t.createdOn }}</div>
            </div>
            <div class="queue-actions">
              <button class="act-btn act-green" @click="approveTrek(t)">✓ Approve</button>
              <button class="act-btn act-del"   @click="rejectTrek(t)">✕ Reject</button>
            </div>
          </div>
        </div>
      </section>

      <!-- ══ TREK MANAGEMENT ════════════════════════════════ -->
      <section v-if="activeTab==='treks'" class="tab-content">
        <div class="filter-bar">
          <button v-for="f in ['All','Open','Pending','Approved','Closed','Completed']" :key="f"
            class="filter-btn" :class="{ active: trekFilter===f }" @click="trekFilter=f">{{ f }}</button>
        </div>
        <div class="ts-table-wrap">
          <table class="ts-table">
            <thead>
              <tr><th>Trek Name</th><th>Location</th><th>Difficulty</th><th>Dates</th><th>Slots</th><th>Staff</th><th>Price</th><th>Status</th><th>Actions</th></tr>
            </thead>
            <tbody>
              <tr v-for="t in filteredTreks" :key="t.id">
                <td class="trek-name-cell">{{ t.name }}</td>
                <td>{{ t.location }}</td>
                <td><span :class="'diff-pill pill-'+t.difficulty.toLowerCase()">{{ t.difficulty }}</span></td>
                <td class="mono" style="white-space:nowrap">{{ t.startDate }} → {{ t.endDate }}</td>
                <td class="mono">{{ t.slots }}<span style="color:var(--stone)">/{{ t.totalSlots }}</span></td>
                <td>{{ t.staff || '—' }}</td>
                <td class="mono">₹{{ t.price ? t.price.toLocaleString() : '—' }}</td>
                <td><span :class="'status-pill status-'+t.status.toLowerCase()">{{ t.status }}</span></td>
                <td>
                  <div class="action-btns">
                    <button class="act-btn act-edit"   @click="openTrekModal(t)">✎ Edit</button>
                    <button class="act-btn act-assign" @click="assignStaffToTrek(t)">⇌ Assign</button>
                    <button class="act-btn act-del"    @click="deleteTrek(t.id)">✕</button>
                  </div>
                </td>
              </tr>
              <tr v-if="!filteredTreks.length">
                <td colspan="9" style="text-align:center; padding:2rem; color:var(--stone)">No treks match this filter.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <!-- ══ STAFF MANAGEMENT ═══════════════════════════════ -->
      <section v-if="activeTab==='staff'" class="tab-content">
        <!-- Workload Monitor -->
        <div class="dash-card" style="margin-bottom:1.5rem">
          <div class="dash-card-header"><span class="dash-card-title">Staff Workload Monitor</span></div>
          <div class="chart-bars">
            <div v-for="s in staffWorkload" :key="s.id" class="chart-bar-item">
              <div class="chart-bar-label">{{ s.name }}</div>
              <div class="chart-bar-track">
                <div class="chart-bar-fill" :style="{ width: (s.trekCount / (maxWorkload || 1) * 100)+'%' }"></div>
              </div>
              <div class="chart-bar-value">{{ s.trekCount }}</div>
            </div>
          </div>
        </div>

        <div class="cards-grid">
          <div class="staff-card" v-for="s in filteredStaff" :key="s.id">
            <div class="staff-card-header">
              <div class="staff-avatar">{{ s.name[0] }}</div>
              <div style="flex:1">
                <div class="staff-name">{{ s.name }}</div>
                <div class="staff-contact">{{ s.contact }}</div>
              </div>
              <span :class="['status-pill', s.active ? 'status-active' : 'status-inactive']">
                {{ s.active ? 'Active' : 'Inactive' }}
              </span>
            </div>
            <div class="staff-treks-label">Assigned Treks ({{ s.treks.length }})</div>
            <div class="staff-trek-list">
              <span v-for="tr in s.treks" :key="tr" class="staff-trek-tag">{{ tr }}</span>
              <span v-if="!s.treks.length" class="no-treks">None assigned</span>
            </div>
            <div class="staff-workload-bar">
              <div class="swb-track"><div class="swb-fill" :style="{ width: (s.treks.length / (maxWorkload || 1) * 100)+'%' }"></div></div>
              <span class="swb-label">{{ s.treks.length }} / {{ maxWorkload }} treks</span>
            </div>
            <div class="staff-actions" style="margin-top:.75rem">
              <button class="btn-ghost"       @click="toggleStaffStatus(s)">{{ s.active ? 'Deactivate' : 'Activate' }}</button>
              <button class="btn-primary-ts"  @click="assignTrekToStaff(s)">Assign Trek</button>
            </div>
          </div>
        </div>
        <div v-if="!filteredStaff.length" class="empty-state">
          <svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>
          <p>No staff match your search.</p>
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
              <tr><th>User</th><th>Email</th><th>Joined</th><th>Bookings</th><th>Status</th><th>Actions</th></tr>
            </thead>
            <tbody>
              <tr v-for="u in filteredUsers" :key="u.id">
                <td>
                  <div class="user-cell">
                    <div class="user-mini-avatar">{{ u.name[0] }}</div>
                    {{ u.name }}
                  </div>
                </td>
                <td class="mono">{{ u.email }}</td>
                <td class="mono">{{ u.registered }}</td>
                <td>{{ u.bookings }}</td>
                <td><span :class="['status-pill', u.blacklisted ? 'status-blacklisted' : 'status-active']">
                  {{ u.blacklisted ? 'Blacklisted' : 'Active' }}
                </span></td>
                <td>
                  <div class="action-btns">
                    <button class="act-btn" :class="u.blacklisted ? 'act-green' : 'act-del'" @click="toggleBlacklist(u)">
                      {{ u.blacklisted ? 'Restore' : 'Blacklist' }}
                    </button>
                  </div>
                </td>
              </tr>
              <tr v-if="!filteredUsers.length">
                <td colspan="6" style="text-align:center; padding:2rem; color:var(--stone)">No users match this filter.</td>
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
              <tr><th>Booking ID</th><th>User</th><th>Trek</th><th>Booked On</th><th>Status</th><th>Payment</th><th>Actions</th></tr>
            </thead>
            <tbody>
              <tr v-for="b in filteredBookings" :key="b.id">
                <td class="mono">#{{ b.id }}</td>
                <td>{{ b.user }}</td>
                <td>{{ b.trek }}</td>
                <td class="mono">{{ b.date }}</td>
                <td><span :class="'status-pill status-'+b.status.toLowerCase()">{{ b.status }}</span></td>
                <td><span :class="['status-pill', b.paid ? 'status-open' : 'status-pending']">{{ b.paid ? 'Paid' : 'Pending' }}</span></td>
                <td>
                  <div class="action-btns">
                    <button v-if="b.status==='Booked'" class="act-btn act-del" @click="cancelBooking(b)">Cancel</button>
                    <button class="act-btn act-assign" @click="exportCSV('booking-'+b.id)">Export</button>
                  </div>
                </td>
              </tr>
              <tr v-if="!filteredBookings.length">
                <td colspan="7" style="text-align:center; padding:2rem; color:var(--stone)">No bookings match this filter.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <!-- ══ ANALYTICS ══════════════════════════════════════ -->
      <section v-if="activeTab==='analytics'" class="tab-content">

        <!-- Monthly Bookings line chart (SVG) -->
        <div class="dash-card" style="margin-bottom:1.5rem">
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

        <!-- User Growth area chart -->
        <div class="dashboard-grid-equal" style="margin-bottom:1.5rem">
          <div class="dash-card">
            <div class="dash-card-header"><span class="dash-card-title">User Growth</span></div>
            <div class="chart-svg-wrap">
              <svg viewBox="0 0 400 140" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:auto">
                <defs>
                  <linearGradient id="growthGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stop-color="#3d6b3d" stop-opacity="0.3"/>
                    <stop offset="100%" stop-color="#3d6b3d" stop-opacity="0.02"/>
                  </linearGradient>
                </defs>
                <path :d="buildAreaPath(userGrowth,'users',400,140,25)" fill="url(#growthGrad)"/>
                <path :d="buildLinePath(userGrowth,'users',400,140,25)" fill="none" stroke="#3d6b3d" stroke-width="2.5" stroke-linecap="round"/>
                <g v-for="(u,i) in userGrowth" :key="'ug'+i">
                  <circle
                    :cx="25+(i/(userGrowth.length-1))*(400-50)"
                    :cy="140-25-(u.users/maxUserGrowth)*(140-50)"
                    r="3" fill="#3d6b3d"/>
                  <text :x="25+(i/(userGrowth.length-1))*(400-50)" y="136" text-anchor="middle" class="chart-axis-label">{{ u.month }}</text>
                </g>
              </svg>
            </div>
          </div>
          <div class="dash-card">
            <div class="dash-card-header"><span class="dash-card-title">Difficulty Distribution</span></div>
            <div class="diff-dist">
              <div v-for="d in difficultyDist" :key="d.level" class="dd-item">
                <div class="dd-meta"><span class="dd-label">{{ d.level }}</span><span class="dd-pct">{{ d.pct }}%</span></div>
                <div class="dd-bar-track"><div class="dd-bar-fill" :style="{ width: d.pct+'%', background: d.color }"></div></div>
              </div>
            </div>
          </div>
        </div>

        <!-- Popular Treks bar + Slot Utilization -->
        <div class="dashboard-grid-equal">
          <div class="dash-card">
            <div class="dash-card-header"><span class="dash-card-title">Popular Treks — Bookings</span></div>
            <div class="chart-bars">
              <div v-for="t in popularTreks" :key="t.name" class="chart-bar-item">
                <div class="chart-bar-label">{{ t.name }}</div>
                <div class="chart-bar-track"><div class="chart-bar-fill" :style="{ width: (t.bookings/maxBookings*100)+'%' }"></div></div>
                <div class="chart-bar-value">{{ t.bookings }}</div>
              </div>
            </div>
          </div>
          <div class="dash-card">
            <div class="dash-card-header"><span class="dash-card-title">Slot Utilization</span></div>
            <div class="occ-list">
              <div v-for="s in slotUtilization" :key="s.trek" class="occ-item">
                <div class="occ-meta">
                  <span class="occ-trek">{{ s.trek }}</span>
                  <span class="occ-pct">{{ s.booked }}/{{ s.total }} ({{ s.pct }}%)</span>
                </div>
                <div class="occ-bar-track">
                  <div class="occ-bar-fill" :class="occColor(s.pct)" :style="{ width: s.pct+'%' }"></div>
                </div>
              </div>
            </div>
          </div>
        </div>

      </section>

      <!-- ══ REVENUE DASHBOARD ══════════════════════════════ -->
      <section v-if="activeTab==='revenue'" class="tab-content">
        <div class="revenue-cards">
          <div class="rev-card"><div class="rev-icon">💰</div><div class="rev-val">{{ revenueData.total }}</div><div class="rev-label">Total Revenue</div></div>
          <div class="rev-card"><div class="rev-icon">📅</div><div class="rev-val">{{ revenueData.monthly }}</div><div class="rev-label">Monthly Revenue</div></div>
          <div class="rev-card"><div class="rev-icon">🏆</div><div class="rev-val">{{ revenueData.topTrek }}</div><div class="rev-label">Highest Revenue Trek</div></div>
          <div class="rev-card"><div class="rev-icon">📊</div><div class="rev-val">{{ revenueData.topRevenue }}</div><div class="rev-label">Trek Revenue</div></div>
        </div>
        <div class="dash-card">
          <div class="dash-card-header"><span class="dash-card-title">Revenue by Trek (Simulated)</span></div>
          <div class="chart-bars" style="margin-top:.5rem">
            <div v-for="t in popularTreks" :key="t.name" class="chart-bar-item">
              <div class="chart-bar-label">{{ t.name }}</div>
              <div class="chart-bar-track"><div class="chart-bar-fill" :style="{ width: (t.bookings/maxBookings*100)+'%' }"></div></div>
              <div class="chart-bar-value" style="width:80px">₹{{ (t.bookings * 6500).toLocaleString() }}</div>
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

      <!-- ══ NOTIFICATIONS ══════════════════════════════════ -->
      <section v-if="activeTab==='notifications'" class="tab-content">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:1.25rem">
          <span style="font-size:.9rem;color:var(--stone)">{{ unreadNotifCount }} unread</span>
          <button class="btn-ghost" @click="markAllRead">Mark all as read</button>
        </div>
        <div class="ts-card">
          <div class="notif-list">
            <div v-for="n in notifications" :key="n.id" class="notif-item" :class="{ unread: !n.read }" @click="n.read=true">
              <div class="notif-dot" :class="{ read: n.read }"></div>
              <div class="act-body">
                <div class="notif-msg">{{ n.msg }}</div>
                <div class="notif-time">{{ n.time }}</div>
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

      <!-- ══ SYSTEM HEALTH ══════════════════════════════════ -->
      <section v-if="activeTab==='system'" class="tab-content">
        <div class="dashboard-grid-equal">
          <div class="dash-card">
            <div class="dash-card-header"><span class="dash-card-title">System Health Monitor</span></div>
            <div class="health-grid">
              <div v-for="(v, k) in systemHealth" :key="k" class="health-item">
                <div class="health-dot" :class="v.ok ? 'ok' : 'fail'"></div>
                <div>
                  <div class="health-label">{{ v.label }}</div>
                  <div class="health-status" :class="v.ok ? 'ok' : 'fail'">{{ v.status }}</div>
                </div>
              </div>
            </div>
          </div>
          <div class="dash-card">
            <div class="dash-card-header"><span class="dash-card-title">Redis Cache Info</span></div>
            <div style="display:flex;flex-direction:column;gap:.75rem">
              <div class="job-item"><span class="job-name">Trek Listings Cache</span><span class="status-pill status-open">Active</span></div>
              <div class="job-item"><span class="job-name">User Session Cache</span><span class="status-pill status-open">Active</span></div>
              <div class="job-item"><span class="job-name">API Response Cache</span><span class="status-pill status-pending">Expiring in 4 min</span></div>
              <div class="job-item"><span class="job-name">Dashboard Stats Cache</span><span class="status-pill status-open">Active</span></div>
            </div>
          </div>
        </div>
        <div class="ts-card" style="margin-top:1.5rem">
          <div class="dash-card-header"><span class="dash-card-title">Recent System Activity</span></div>
          <div class="activity-feed">
            <div v-for="a in activityFeed.filter(x => x.type==='system' || x.type==='report' || x.type==='admin')" :key="a.msg" class="activity-item">
              <div class="act-dot" :class="a.type"></div>
              <div class="act-body"><div class="act-msg">{{ a.msg }}</div><div class="act-time">{{ a.time }}</div></div>
            </div>
          </div>
        </div>
      </section>

      <!-- ══ AUDIT LOGS ══════════════════════════════════════ -->
      <section v-if="activeTab==='audit'" class="tab-content">
        <div class="filter-bar">
          <button v-for="f in ['All','Admin','Staff','User','System']" :key="f"
            class="filter-btn" :class="{ active: auditFilter===f }" @click="auditFilter=f">{{ f }}</button>
        </div>
        <div class="ts-table-wrap">
          <table class="ts-table">
            <thead><tr><th>Timestamp</th><th>Actor</th><th>Level</th><th>Action</th></tr></thead>
            <tbody>
              <tr v-for="log in filteredAudit" :key="log.timestamp+log.action">
                <td class="mono">{{ log.timestamp }}</td>
                <td style="font-weight:500;color:var(--forest)">{{ log.actor }}</td>
                <td><span :class="'audit-level-'+log.level" style="font-family:var(--mono,monospace);font-size:.75rem;text-transform:uppercase;font-weight:700;letter-spacing:.06em">{{ log.level }}</span></td>
                <td style="font-size:.85rem">{{ log.action }}</td>
              </tr>
              <tr v-if="!filteredAudit.length">
                <td colspan="4" style="text-align:center;padding:2rem;color:var(--stone)">No logs match this filter.</td>
              </tr>
            </tbody>
          </table>
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
    <div v-if="showTrekModal" class="ts-modal-overlay" @click.self="closeTrekModal">
      <div class="ts-modal">
        <div class="ts-modal-header">
          <h3 class="ts-modal-title">{{ editingTrek ? 'Edit Trek Route' : 'Create New Trek' }}</h3>
          <button class="modal-close" @click="closeTrekModal">✕</button>
        </div>
        <div class="ts-modal-body">
          <div class="form-grid">
            <div class="form-group form-full">
              <label>Trek Name</label>
              <input v-model="trekForm.name" type="text" placeholder="e.g. Roopkund Lake Trek" />
            </div>
            <div class="form-group">
              <label>Location</label>
              <input v-model="trekForm.location" type="text" placeholder="Uttarakhand" />
            </div>
            <div class="form-group">
              <label>Difficulty</label>
              <select v-model="trekForm.difficulty">
                <option>Easy</option><option>Moderate</option><option>Hard</option>
              </select>
            </div>
            <div class="form-group">
              <label>Start Date</label>
              <input v-model="trekForm.startDate" type="date" />
            </div>
            <div class="form-group">
              <label>End Date</label>
              <input v-model="trekForm.endDate" type="date" />
            </div>
            <div class="form-group">
              <label>Available Slots</label>
              <input v-model.number="trekForm.slots" type="number" min="1" />
            </div>
            <div class="form-group">
              <label>Price (INR)</label>
              <input v-model.number="trekForm.price" type="number" min="0" />
            </div>
            <div class="form-group">
              <label>Status</label>
              <select v-model="trekForm.status">
                <option>Pending</option><option>Approved</option><option>Open</option><option>Closed</option><option>Completed</option>
              </select>
            </div>
            <div class="form-group form-full">
              <label>Image URL</label>
              <input v-model="trekForm.imageUrl" type="text" placeholder="https://images.unsplash.com/…" />
            </div>
            <div class="form-group form-full">
              <label>Description</label>
              <textarea v-model="trekForm.description" rows="3" placeholder="A scenic trek through…"></textarea>
            </div>
          </div>
        </div>
        <div class="ts-modal-footer">
          <button class="btn-ghost" @click="closeTrekModal">Cancel</button>
          <button class="btn-primary-ts" @click="saveTrek">{{ editingTrek ? 'Save Changes' : 'Create Trek' }}</button>
        </div>
      </div>
    </div>

    <!-- ════════ STAFF MODAL ════════ -->
    <div v-if="showStaffModal" class="ts-modal-overlay" @click.self="closeStaffModal">
      <div class="ts-modal">
        <div class="ts-modal-header">
          <h3 class="ts-modal-title">Add Trek Staff</h3>
          <button class="modal-close" @click="closeStaffModal">✕</button>
        </div>
        <div class="ts-modal-body">
          <div class="form-grid">
            <div class="form-group form-full">
              <label>Full Name</label>
              <input v-model="staffForm.name" type="text" placeholder="Staff member name" />
            </div>
            <div class="form-group">
              <label>Email</label>
              <input v-model="staffForm.email" type="email" placeholder="staff@trailsync.com" />
            </div>
            <div class="form-group">
              <label>Phone</label>
              <input v-model="staffForm.phone" type="tel" placeholder="+91 9876543210" />
            </div>
            <div class="form-group form-full">
              <label>Temporary Password</label>
              <input v-model="staffForm.password" type="password" placeholder="Set initial login password" />
            </div>
          </div>
        </div>
        <div class="ts-modal-footer">
          <button class="btn-ghost" @click="closeStaffModal">Cancel</button>
          <button class="btn-primary-ts" @click="saveStaff">Add Staff Member</button>
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
