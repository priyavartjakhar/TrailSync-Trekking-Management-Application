<template>
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
</template>

<script>
import { adminDashComponent } from './adminDashProxy';

export default adminDashComponent('TabStaff');
</script>
