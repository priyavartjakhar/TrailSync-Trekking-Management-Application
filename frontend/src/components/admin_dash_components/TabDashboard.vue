<template>
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
</template>

<script>
import { adminDashComponent } from './adminDashProxy';

export default adminDashComponent('TabDashboard');
</script>
