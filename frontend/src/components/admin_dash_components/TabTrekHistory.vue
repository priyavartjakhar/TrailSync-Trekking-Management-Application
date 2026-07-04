<template>
      <section v-if="activeTab==='trek_history'" class="tab-content">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1.25rem;">
          <div style="font-weight:600; color:var(--forest)">Completed and Closed Batches</div>
        </div>

        <div v-if="completedTreks.length === 0" class="empty-state">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
          <p>No completed or closed trek history found.</p>
        </div>
        <div v-else class="ts-table-wrap">
          <table class="ts-table">
            <thead>
              <tr>
                <th>Batch ID</th>
                <th>Trek Name</th>
                <th>Dates</th>
                <th>Guide (ID)</th>
                <th>Total Participants</th>
                <th>Price</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="t in completedTreks" :key="t.id">
                <td class="mono font-bold">{{ t.batchCode }}</td>
                <td class="trek-name-cell">{{ t.name }}</td>
                <td class="mono" style="white-space:nowrap">{{ formatDate(t.startDate) }} → {{ formatDate(t.endDate) }}</td>
                <td>
                  <template v-if="t.staff">
                    <div style="font-weight:600; color:var(--forest)">{{ t.staff }}</div>
                    <div style="font-size:0.75rem; color:var(--stone)">ID: {{ 'TS26S' + String(t.staff_id).padStart(3, '0') }}</div>
                  </template>
                  <template v-else>
                    <span style="color:var(--stone); font-style:italic;">Not Assigned</span>
                  </template>
                </td>
                <td class="mono">{{ t.booked }}/{{ t.slots }}</td>
                <td class="mono">₹{{ t.price ? t.price.toLocaleString() : '—' }}</td>
                <td>
                  <div class="batch-actions-layout">
                    <button class="act-btn act-view" @click="openHistoryModal(t)">
                      <svg viewBox="0 0 24 24" class="act-btn-icon" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                      View Details
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
</template>

<script>
import { adminDashComponent } from './adminDashProxy';

export default adminDashComponent('TabTrekHistory');
</script>
