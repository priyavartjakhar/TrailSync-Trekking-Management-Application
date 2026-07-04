<template>
      <section v-if="activeTab==='batches'" class="tab-content">
        <div class="filter-bar">
          <button v-for="f in ['All','Open','Closed']" :key="f"
            class="filter-btn" :class="{ active: trekFilter===f }" @click="trekFilter=f">{{ f }}</button>
        </div>
        <div class="ts-table-wrap">
          <table class="ts-table">
            <thead>
              <tr>
                <th>Batch ID</th>
                <th class="col-hide-mobile">Trek Name</th>
                <th class="col-hide-mobile">Difficulty</th>
                <th class="col-hide-mobile">Dates</th>
                <th class="col-hide-mobile">Slots</th>
                <th>Staff</th>
                <th class="col-hide-mobile">Price</th>
                <th class="col-hide-mobile">Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="t in filteredTreks" :key="t.id">
                <td class="mono font-bold">
                  {{ t.batchCode }}
                  <div style="font-size: 0.68rem; font-weight: 400; color: var(--stone); margin-top: 2px;">{{ formatDate(t.startDate) }}</div>
                </td>
                <td class="trek-name-cell col-hide-mobile">{{ t.name }}</td>
                <td class="col-hide-mobile"><span :class="'diff-pill pill-'+t.difficulty.toLowerCase()">{{ t.difficulty }}</span></td>
                <td class="mono col-hide-mobile" style="white-space:nowrap">{{ formatDate(t.startDate) }} → {{ formatDate(t.endDate) }}</td>
                <td class="mono col-hide-mobile">{{ t.booked }}/{{ t.slots }}</td>
                <td>{{ t.staff || '—' }}</td>
                <td class="mono col-hide-mobile">₹{{ t.price ? t.price.toLocaleString() : '—' }}</td>
                <td class="col-hide-mobile"><span :class="'status-pill status-'+t.status.toLowerCase()">{{ t.status }}</span></td>
                <td>
                  <div class="batch-actions-layout">
                    <div class="batch-actions-row">
                      <button class="act-btn act-view" @click="viewBatchDetails(t)" title="View Details">
                        <svg viewBox="0 0 24 24" class="act-btn-icon" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                        <span class="btn-text-hide-mobile">View Details</span>
                      </button>
                      <button class="act-btn act-assign" @click="assignStaffToTrek(t)" title="Assign Guide">
                        <svg viewBox="0 0 24 24" class="act-btn-icon"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></svg>
                        <span class="btn-text-hide-mobile">{{ (t.staff && !t.staff.toLowerCase().includes('unassigned') && !t.staff.toLowerCase().includes('not assigned')) ? 'Change Guide' : 'Assign Guide' }}</span>
                      </button>
                    </div>
                    <div class="batch-actions-row">
                      <button class="act-btn act-edit" @click="openTrekModal(t)" title="Edit">
                        <svg viewBox="0 0 24 24" class="act-btn-icon"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
                        <span class="btn-text-hide-mobile">Edit</span>
                      </button>
                      <button class="act-btn" :class="t.status === 'Open' ? 'act-close' : 'act-open'" @click="toggleBatchStatus(t)" :title="t.status === 'Open' ? 'Close' : 'Open'">
                        <svg v-if="t.status === 'Open'" viewBox="0 0 24 24" class="act-btn-icon"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                        <svg v-else viewBox="0 0 24 24" class="act-btn-icon"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 9.9-1"/></svg>
                        <span class="btn-text-hide-mobile">{{ t.status === 'Open' ? 'Close' : 'Open' }}</span>
                      </button>
                      <button class="act-btn act-delete-btn" @click="deleteTrek(t.id)" title="Delete">
                        <svg viewBox="0 0 24 24" class="act-btn-icon"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
                        <span class="btn-text-hide-mobile">Delete</span>
                      </button>
                    </div>
                    <div class="batch-actions-row" v-if="t.status !== 'Completed'">
                      <button class="act-btn act-complete" @click="completeBatch(t)" title="Complete">
                        <svg viewBox="0 0 24 24" class="act-btn-icon" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                        <span class="btn-text-hide-mobile">Mark as Completed</span>
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
</template>

<script>
import { adminDashComponent } from './adminDashProxy';

export default adminDashComponent('TabBatches');
</script>
