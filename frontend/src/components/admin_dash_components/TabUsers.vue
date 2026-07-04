<template>
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
</template>

<script>
import { adminDashComponent } from './adminDashProxy';

export default adminDashComponent('TabUsers');
</script>
