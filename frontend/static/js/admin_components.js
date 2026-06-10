// ============================================================
//  admin_components.js — Admin panel Vue 3 component tree
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
      showTrekModal: false,
      showStaffModal: false,
      editingTrek: null,
      toast: { show: false, msg: '' },

      tabTitles: {
        dashboard: 'Overview', treks: 'Trek Routes', staff: 'Trek Staff',
        users: 'Registered Users', bookings: 'All Bookings', reports: 'Reports & Analytics'
      },

      trekForm: { name: '', location: '', difficulty: 'Moderate', startDate: '', endDate: '', slots: 20, price: 5000, status: 'Pending', imageUrl: '', description: '' },
      staffForm: { name: '', email: '', phone: '', password: '' },

      stats: [],
      trekStatusOverview: [],
      alerts: [],
      recentBookings: [],
      treks: [],
      staffList: [],
      users: [],
      allBookings: [],
      popularTreks: [],
    };
  },
  computed: {
    searchPlaceholder() {
      const map = { treks: 'Search treks…', staff: 'Search staff…', users: 'Search users…', bookings: 'Search bookings…' };
      return map[this.activeTab] || 'Search…';
    },
    filteredTreks() {
      let list = this.trekFilter === 'All' ? this.treks : this.treks.filter(t => t.status === this.trekFilter);
      if (this.searchQuery) list = list.filter(t => t.name.toLowerCase().includes(this.searchQuery.toLowerCase()));
      return list;
    },
    filteredStaff() {
      if (!this.searchQuery) return this.staffList;
      return this.staffList.filter(s => s.name.toLowerCase().includes(this.searchQuery.toLowerCase()));
    },
    filteredUsers() {
      if (!this.searchQuery) return this.users;
      return this.users.filter(u => u.name.toLowerCase().includes(this.searchQuery.toLowerCase()) || u.email.toLowerCase().includes(this.searchQuery.toLowerCase()));
    },
    filteredBookings() {
      let list = this.bookingFilter === 'All' ? this.allBookings : this.allBookings.filter(b => b.status === this.bookingFilter);
      if (this.searchQuery) list = list.filter(b => b.user.toLowerCase().includes(this.searchQuery.toLowerCase()) || b.trek.toLowerCase().includes(this.searchQuery.toLowerCase()));
      return list;
    },
    maxBookings() {
      return Math.max(...this.popularTreks.map(t => t.bookings));
    }
  },
  mounted() {
    this.fetchAdminData();
  },
  methods: {
    async fetchAdminData() {
      try {
        const res = await fetch('/api/admin/dashboard_data');
        if (res.ok) {
          const data = await res.json();
          this.stats = data.stats;
          this.trekStatusOverview = data.trekStatusOverview;
          this.alerts = data.alerts;
          this.recentBookings = data.recentBookings;
          this.treks = data.treks;
          this.staffList = data.staffList;
          this.users = data.users;
          this.allBookings = data.allBookings;
          this.popularTreks = data.popularTreks;
        }
      } catch (e) {
        console.warn('API error, using local fallback state:', e);
      }
    },
    openTrekModal(trek = null) {
      this.editingTrek = trek;
      this.trekForm = trek ? { ...trek } : { name: '', location: '', difficulty: 'Moderate', startDate: '', endDate: '', slots: 20, price: 5000, status: 'Pending', imageUrl: '', description: '' };
      this.showTrekModal = true;
    },
    closeTrekModal() { this.showTrekModal = false; this.editingTrek = null; },
    async saveTrek() {
      const trekPayload = this.editingTrek 
        ? { id: this.editingTrek.id, ...this.trekForm }
        : { ...this.trekForm };
      try {
        const res = await fetch('/api/admin/treks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(trekPayload)
        });
        if (res.ok) {
          this.showToast(this.editingTrek ? 'Trek updated successfully' : 'Trek created successfully');
          this.fetchAdminData();
        } else {
          this.showToast('Failed to save trek');
        }
      } catch (e) {
        if (this.editingTrek) {
          const idx = this.treks.findIndex(t => t.id === this.editingTrek.id);
          if (idx !== -1) this.treks[idx] = { ...this.editingTrek, ...this.trekForm };
        } else {
          this.treks.push({ id: Date.now(), ...this.trekForm, staff: null });
        }
        this.showToast('Saved (Mock Mode)');
      }
      this.closeTrekModal();
    },
    async deleteTrek(id) {
      try {
        const res = await fetch(`/api/admin/treks/${id}`, { method: 'DELETE' });
        if (res.ok) {
          this.showToast('Trek removed');
          this.fetchAdminData();
        } else {
          this.showToast('Failed to remove trek');
        }
      } catch (e) {
        this.treks = this.treks.filter(t => t.id !== id);
        this.showToast('Trek removed (Mock Mode)');
      }
    },
    openStaffModal() { this.staffForm = { name: '', email: '', phone: '', password: '' }; this.showStaffModal = true; },
    closeStaffModal() { this.showStaffModal = false; },
    async saveStaff() {
      try {
        const res = await fetch('/api/admin/staff', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(this.staffForm)
        });
        if (res.ok) {
          this.showToast('Staff member added');
          this.fetchAdminData();
        } else {
          const data = await res.json();
          this.showToast(data.error || 'Failed to add staff');
        }
      } catch (e) {
        this.staffList.push({ id: Date.now(), name: this.staffForm.name, contact: this.staffForm.email, treks: [], active: true });
        this.showToast('Staff member added (Mock Mode)');
      }
      this.closeStaffModal();
    },
    async toggleStaffStatus(s) {
      try {
        const res = await fetch(`/api/admin/staff/toggle/${s.id}`, { method: 'POST' });
        if (res.ok) {
          this.showToast(`${s.name} status updated`);
          this.fetchAdminData();
        }
      } catch (e) {
        s.active = !s.active;
        this.showToast(`${s.name} ${s.active ? 'activated' : 'deactivated'} (Mock Mode)`);
      }
    },
    async toggleBlacklist(u) {
      try {
        const res = await fetch(`/api/admin/users/blacklist/${u.id}`, { method: 'POST' });
        if (res.ok) {
          this.showToast(`${u.name} blacklist status updated`);
          this.fetchAdminData();
        }
      } catch (e) {
        u.blacklisted = !u.blacklisted;
        this.showToast(`${u.name} ${u.blacklisted ? 'blacklisted' : 'unbanned'} (Mock Mode)`);
      }
    },
    async openAssignModal(trek) {
      const email = prompt(`Enter staff email to assign to ${trek.name}:`);
      if (!email) return;
      try {
        const res = await fetch(`/api/admin/treks/assign/${trek.id}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email })
        });
        if (res.ok) {
          this.showToast(`Staff assigned to ${trek.name}`);
          this.fetchAdminData();
        } else {
          const data = await res.json();
          this.showToast(data.error || 'Assignment failed');
        }
      } catch (e) {
        this.showToast('Assignment error (Mock Mode)');
      }
    },
    async openAssignStaffModal(s) {
      const trekName = prompt(`Enter Trek Name to assign to ${s.name}:`);
      if (!trekName) return;
      const trek = this.treks.find(t => t.name.toLowerCase() === trekName.toLowerCase());
      if (!trek) {
        this.showToast('Trek not found');
        return;
      }
      try {
        const res = await fetch(`/api/admin/treks/assign/${trek.id}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: s.contact })
        });
        if (res.ok) {
          this.showToast(`Trek assigned to ${s.name}`);
          this.fetchAdminData();
        } else {
          const data = await res.json();
          this.showToast(data.error || 'Assignment failed');
        }
      } catch (e) {
        this.showToast('Assignment error (Mock Mode)');
      }
    },
    async triggerReport(type) {
      try {
        const res = await fetch('/api/admin/report', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type })
        });
        if (res.ok) {
          const data = await res.json();
          this.showToast(data.message);
        }
      } catch (e) {
        this.showToast(`${type === 'monthly' ? 'Monthly report' : 'Stats report'} triggered (Mock Mode)`);
      }
    },
    showToast(msg) {
      this.toast = { show: true, msg };
      setTimeout(() => { this.toast.show = false; }, 3000);
    }
  },
  template: `
  <div class="ts-admin-layout">

    <!-- ── SIDEBAR ─────────────────────────────── -->
    <aside class="ts-sidebar" :class="{ collapsed: sidebarCollapsed }">
      <div class="sidebar-brand">
        <a class="brand-name" href="#">Trail<span>Sync</span></a>
        <button class="sidebar-toggle" @click="sidebarCollapsed = !sidebarCollapsed">
          <svg viewBox="0 0 24 24"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
        </button>
      </div>

      <nav class="sidebar-nav">
        <div class="nav-section-label">Management</div>
        <a class="nav-item" :class="{ active: activeTab === 'dashboard' }" @click="activeTab = 'dashboard'">
          <svg viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>
          <span>Dashboard</span>
        </a>
        <a class="nav-item" :class="{ active: activeTab === 'treks' }" @click="activeTab = 'treks'">
          <svg viewBox="0 0 24 24"><path d="M3 17l4-8 4 4 4-6 4 10"/><path d="M3 20h18"/></svg>
          <span>Trek Routes</span>
        </a>
        <a class="nav-item" :class="{ active: activeTab === 'staff' }" @click="activeTab = 'staff'">
          <svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>
          <span>Trek Staff</span>
        </a>
        <a class="nav-item" :class="{ active: activeTab === 'users' }" @click="activeTab = 'users'">
          <svg viewBox="0 0 24 24"><circle cx="9" cy="8" r="3"/><path d="M2 19c0-3 3-5 7-5"/><circle cx="16" cy="10" r="3"/><path d="M13 19c0-3 2.7-5 6-5"/></svg>
          <span>Users</span>
        </a>
        <a class="nav-item" :class="{ active: activeTab === 'bookings' }" @click="activeTab = 'bookings'">
          <svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
          <span>Bookings</span>
        </a>
        <div class="nav-section-label">Analytics</div>
        <a class="nav-item" :class="{ active: activeTab === 'reports' }" @click="activeTab = 'reports'">
          <svg viewBox="0 0 24 24"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
          <span>Reports</span>
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

    <!-- ── MAIN CONTENT ────────────────────────── -->
    <main class="ts-main">
      <!-- Top bar -->
      <header class="ts-topbar">
        <div class="topbar-title">
          <div class="section-tag">Admin Panel</div>
          <h1 class="topbar-heading">{{ tabTitles[activeTab] }}</h1>
        </div>
        <div class="topbar-actions">
          <div class="search-box">
            <svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input v-model="searchQuery" type="text" :placeholder="searchPlaceholder" />
          </div>
          <button v-if="activeTab === 'treks'" class="btn-primary-ts" @click="openTrekModal()">+ New Trek</button>
          <button v-if="activeTab === 'staff'" class="btn-primary-ts" @click="openStaffModal()">+ Add Staff</button>
        </div>
      </header>

      <!-- ── DASHBOARD TAB ── -->
      <section v-if="activeTab === 'dashboard'" class="tab-content">
        <div class="stats-bar-inline">
          <div class="stat-item" v-for="s in stats" :key="s.label">
            <div class="stat-num">{{ s.value }}</div>
            <div class="stat-label">{{ s.label }}</div>
          </div>
        </div>

        <div class="dashboard-grid">
          <!-- Recent Bookings -->
          <div class="dash-card dash-wide">
            <div class="dash-card-header">
              <span class="dash-card-title">Recent Bookings</span>
              <a class="dash-link" @click="activeTab = 'bookings'">View all →</a>
            </div>
            <table class="ts-table">
              <thead><tr><th>User</th><th>Trek</th><th>Date</th><th>Status</th></tr></thead>
              <tbody>
                <tr v-for="b in recentBookings" :key="b.id">
                  <td>{{ b.user }}</td>
                  <td>{{ b.trek }}</td>
                  <td class="mono">{{ b.date }}</td>
                  <td><span :class="'status-pill status-' + b.status.toLowerCase()">{{ b.status }}</span></td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Trek Status Overview -->
          <div class="dash-card">
            <div class="dash-card-header"><span class="dash-card-title">Trek Status</span></div>
            <div class="status-overview">
              <div v-for="s in trekStatusOverview" :key="s.label" class="status-overview-item">
                <div class="so-bar-wrap">
                  <div class="so-bar" :style="{ width: s.pct + '%', background: s.color }"></div>
                </div>
                <div class="so-meta">
                  <span class="so-label">{{ s.label }}</span>
                  <span class="so-count">{{ s.count }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Alerts -->
          <div class="dash-card">
            <div class="dash-card-header"><span class="dash-card-title">Alerts</span></div>
            <div class="alert-list">
              <div v-for="a in alerts" :key="a.msg" class="alert-item" :class="'alert-' + a.type">
                <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                <span>{{ a.msg }}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- ── TREKS TAB ── -->
      <section v-if="activeTab === 'treks'" class="tab-content">
        <div class="filter-bar">
          <button v-for="f in ['All', 'Open', 'Pending', 'Closed', 'Completed']" :key="f"
            class="filter-btn" :class="{ active: trekFilter === f }" @click="trekFilter = f">{{ f }}</button>
        </div>
        <table class="ts-table ts-table-full">
          <thead>
            <tr><th>Trek Name</th><th>Location</th><th>Difficulty</th><th>Dates</th><th>Slots</th><th>Staff</th><th>Status</th><th>Actions</th></tr>
          </thead>
          <tbody>
            <tr v-for="t in filteredTreks" :key="t.id">
              <td class="trek-name-cell">{{ t.name }}</td>
              <td>{{ t.location }}</td>
              <td><span :class="'diff-pill pill-' + t.difficulty.toLowerCase()">{{ t.difficulty }}</span></td>
              <td class="mono">{{ t.startDate }} → {{ t.endDate }}</td>
              <td>{{ t.slots }}</td>
              <td>{{ t.staff || '—' }}</td>
              <td><span :class="'status-pill status-' + t.status.toLowerCase()">{{ t.status }}</span></td>
              <td>
                <div class="action-btns">
                  <button class="act-btn act-edit" @click="openTrekModal(t)" title="Edit">✎</button>
                  <button class="act-btn act-assign" @click="openAssignModal(t)" title="Assign Staff">⇌</button>
                  <button class="act-btn act-del" @click="deleteTrek(t.id)" title="Delete">✕</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </section>

      <!-- ── STAFF TAB ── -->
      <section v-if="activeTab === 'staff'" class="tab-content">
        <div class="cards-grid">
          <div class="staff-card" v-for="s in filteredStaff" :key="s.id">
            <div class="staff-card-header">
              <div class="staff-avatar">{{ s.name[0] }}</div>
              <div>
                <div class="staff-name">{{ s.name }}</div>
                <div class="staff-contact">{{ s.contact }}</div>
              </div>
              <span :class="['status-pill', s.active ? 'status-open' : 'status-closed']" style="margin-left:auto">
                {{ s.active ? 'Active' : 'Inactive' }}
              </span>
            </div>
            <div class="staff-treks-label">Assigned Treks</div>
            <div class="staff-trek-list">
              <span v-for="tr in s.treks" :key="tr" class="staff-trek-tag">{{ tr }}</span>
              <span v-if="!s.treks.length" class="no-treks">None assigned</span>
            </div>
            <div class="staff-actions">
              <button class="btn-ghost" @click="toggleStaffStatus(s)">{{ s.active ? 'Deactivate' : 'Activate' }}</button>
              <button class="btn-primary-ts" @click="openAssignStaffModal(s)">Assign Trek</button>
            </div>
          </div>
        </div>
      </section>

      <!-- ── USERS TAB ── -->
      <section v-if="activeTab === 'users'" class="tab-content">
        <table class="ts-table ts-table-full">
          <thead>
            <tr><th>User</th><th>Email</th><th>Registered</th><th>Bookings</th><th>Status</th><th>Actions</th></tr>
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
              <td><span :class="['status-pill', u.blacklisted ? 'status-hard' : 'status-open']">{{ u.blacklisted ? 'Blacklisted' : 'Active' }}</span></td>
              <td>
                <div class="action-btns">
                  <button class="act-btn" :class="u.blacklisted ? 'act-edit' : 'act-del'" @click="toggleBlacklist(u)">
                    {{ u.blacklisted ? 'Unban' : 'Blacklist' }}
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </section>

      <!-- ── BOOKINGS TAB ── -->
      <section v-if="activeTab === 'bookings'" class="tab-content">
        <div class="filter-bar">
          <button v-for="f in ['All', 'Booked', 'Cancelled', 'Completed']" :key="f"
            class="filter-btn" :class="{ active: bookingFilter === f }" @click="bookingFilter = f">{{ f }}</button>
        </div>
        <table class="ts-table ts-table-full">
          <thead>
            <tr><th>ID</th><th>User</th><th>Trek</th><th>Booked On</th><th>Status</th><th>Payment</th></tr>
          </thead>
          <tbody>
            <tr v-for="b in filteredBookings" :key="b.id">
              <td class="mono">#{{ b.id }}</td>
              <td>{{ b.user }}</td>
              <td>{{ b.trek }}</td>
              <td class="mono">{{ b.date }}</td>
              <td><span :class="'status-pill status-' + b.status.toLowerCase()">{{ b.status }}</span></td>
              <td><span :class="['status-pill', b.paid ? 'status-open' : 'status-pending']">{{ b.paid ? 'Paid' : 'Pending' }}</span></td>
            </tr>
          </tbody>
        </table>
      </section>

      <!-- ── REPORTS TAB ── -->
      <section v-if="activeTab === 'reports'" class="tab-content">
        <div class="reports-grid">
          <div class="report-card">
            <div class="report-icon">
              <svg viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
            </div>
            <div class="report-info">
              <div class="report-title">Monthly Activity Report</div>
              <div class="report-desc">HTML report sent to admin on 1st of every month via Celery beat.</div>
            </div>
            <button class="btn-primary-ts" @click="triggerReport('monthly')">Generate Now</button>
          </div>
          <div class="report-card">
            <div class="report-icon">
              <svg viewBox="0 0 24 24"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
            </div>
            <div class="report-info">
              <div class="report-title">Trek Participation Stats</div>
              <div class="report-desc">Overview of popular treks and user participation this season.</div>
            </div>
            <button class="btn-primary-ts" @click="triggerReport('stats')">View Stats</button>
          </div>
        </div>

        <!-- Participation Chart (CSS bars) -->
        <div class="ts-card" style="margin-top:2rem;">
          <div class="dash-card-header"><span class="dash-card-title">Popular Treks — Bookings</span></div>
          <div class="chart-bars">
            <div v-for="t in popularTreks" :key="t.name" class="chart-bar-item">
              <div class="chart-bar-label">{{ t.name }}</div>
              <div class="chart-bar-track">
                <div class="chart-bar-fill" :style="{ width: (t.bookings / maxBookings * 100) + '%' }"></div>
              </div>
              <div class="chart-bar-value">{{ t.bookings }}</div>
            </div>
          </div>
        </div>
      </section>
    </main>

    <!-- ── TREK MODAL ────────────────────────────── -->
    <div v-if="showTrekModal" class="ts-modal-overlay" @click.self="closeTrekModal">
      <div class="ts-modal">
        <div class="ts-modal-header">
          <h3 class="ts-modal-title">{{ editingTrek ? 'Edit Trek' : 'Create New Trek' }}</h3>
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
              <input v-model="trekForm.imageUrl" type="text" placeholder="e.g. https://images.unsplash.com/... or Google Images link" />
            </div>
            <div class="form-group form-full">
              <label>Description</label>
              <textarea v-model="trekForm.description" placeholder="Enter a beautiful description for the trek route..." rows="3" style="width: 100%; padding: 0.5rem 0.75rem; border: 1px solid rgba(26,46,26,0.14); border-radius: var(--radius); font-family: inherit; font-size: 0.87rem; color: var(--bark); outline: none; background: #fff; resize: vertical;"></textarea>
            </div>
          </div>
        </div>
        <div class="ts-modal-footer">
          <button class="btn-ghost" @click="closeTrekModal">Cancel</button>
          <button class="btn-primary-ts" @click="saveTrek">{{ editingTrek ? 'Save Changes' : 'Create Trek' }}</button>
        </div>
      </div>
    </div>

    <!-- ── STAFF MODAL ───────────────────────────── -->
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
              <label>Password (initial)</label>
              <input v-model="staffForm.password" type="password" placeholder="Temporary password" />
            </div>
          </div>
        </div>
        <div class="ts-modal-footer">
          <button class="btn-ghost" @click="closeStaffModal">Cancel</button>
          <button class="btn-primary-ts" @click="saveStaff">Add Staff Member</button>
        </div>
      </div>
    </div>

    <!-- Toast -->
    <transition name="toast">
      <div v-if="toast.show" class="ts-toast">{{ toast.msg }}</div>
    </transition>
  </div>
  `
};
