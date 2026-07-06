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
                <th class="col-hide-mobile">Trek Name</th>
                <th class="col-hide-mobile">Dates</th>
                <th>Guide (ID)</th>
                <th>Users</th>
                <th class="col-hide-mobile">Price</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="t in completedTreks" :key="t.id">
                <td class="mono font-bold">{{ t.batchCode }}</td>
                <td class="trek-name-cell col-hide-mobile">{{ t.name }}</td>
                <td class="mono col-hide-mobile" style="white-space:nowrap">{{ formatDate(t.startDate) }} → {{ formatDate(t.endDate) }}</td>
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
                <td class="mono col-hide-mobile">₹{{ t.price ? t.price.toLocaleString() : '—' }}</td>
                <td>
                  <div class="batch-actions-layout">
                    <button class="act-btn act-view" @click="openHistoryModal(t)" title="View Details">
                      <svg viewBox="0 0 24 24" class="act-btn-icon" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                      <span class="btn-text-hide-mobile">View Details</span>
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- ════════ TREK HISTORY DETAILS MODAL (Extracted from SAdminModals) ════════ -->
        <div v-if="showHistoryModal && selectedHistoryTrek" class="ts-modal-overlay" @click.self="showHistoryModal = false">
          <div class="ts-modal large">
            <div class="ts-modal-header">
              <h3 class="ts-modal-title">Trek Batch History: {{ selectedHistoryTrek.batchCode || ('B' + selectedHistoryTrek.id) }}</h3>
              <button class="modal-close" @click="showHistoryModal = false">✕</button>
            </div>
            <div class="ts-modal-body" style="padding: 1.5rem; max-height: 480px; overflow-y: auto;">
              <div class="details-modal-grid">
                <!-- Left Side: Batch Summary -->
                <div style="border-right: 1px solid var(--stone-light); padding-right: 1.5rem;">
                  <h4 style="font-weight: 700; color: var(--forest); margin-bottom: 1rem;">Batch Overview</h4>
                  <div class="route-detail-info-block" style="display: flex; flex-direction: column; gap: 0.5rem; font-size: 0.9rem;">
                    <div><strong>Trek Name:</strong> <span>{{ selectedHistoryTrek.name }}</span></div>
                    <div><strong>Location:</strong> <span>{{ selectedHistoryTrek.location }}</span></div>
                    <div v-if="selectedHistoryTrek.place"><strong>Place:</strong> <span>{{ selectedHistoryTrek.place }}</span></div>
                    <div><strong>Difficulty:</strong> <span :class="'diff-pill pill-'+selectedHistoryTrek.difficulty.toLowerCase()">{{ selectedHistoryTrek.difficulty }}</span></div>
                    <div><strong>Start Date:</strong> <span class="mono">{{ formatDate(selectedHistoryTrek.startDate) }}</span></div>
                    <div><strong>End Date:</strong> <span class="mono">{{ formatDate(selectedHistoryTrek.endDate) }}</span></div>
                    <div><strong>Duration:</strong> <span class="mono">{{ selectedHistoryTrek.duration }} Days</span></div>
                    <div><strong>Price per Participant:</strong> <span class="mono">₹{{ selectedHistoryTrek.price ? selectedHistoryTrek.price.toLocaleString() : '0' }}</span></div>
                    <div><strong>Status:</strong> <span :class="'status-pill status-'+selectedHistoryTrek.status.toLowerCase()">{{ selectedHistoryTrek.status }}</span></div>
                  </div>

                  <h4 style="font-weight: 700; color: var(--forest); margin-top: 1.5rem; margin-bottom: 1rem;">Assigned Staff (Guide)</h4>
                  <div v-if="selectedHistoryTrek.staff" class="staff-detail-info" style="background: var(--snow); padding: 1rem; border-radius: 6px; border: 1px solid var(--stone-light); font-size: 0.85rem;">
                    <div><strong>Name:</strong> <span>{{ selectedHistoryTrek.staff }}</span></div>
                    <div><strong>ID:</strong> <span class="mono">{{ 'TS26S' + String(selectedHistoryTrek.staff_id).padStart(3, '0') }}</span></div>
                  </div>
                  <div v-else style="color: var(--stone); font-style: italic; background: var(--snow); padding: 1rem; border-radius: 6px; border: 1px dashed var(--stone);">
                    No staff member was assigned to this batch.
                  </div>
                </div>

                <!-- Right Side: Participant List -->
                <div>
                  <h4 style="font-weight: 700; color: var(--forest); margin-bottom: 1rem;">Participants ({{ batchTrekkers.length }})</h4>
                  <div v-if="batchTrekkers.length === 0" style="text-align: center; padding: 2rem 1rem; background: var(--snow); border-radius: 6px; border: 1px dashed var(--stone);">
                    <p style="color: var(--stone); margin: 0;">No participants registered for this batch.</p>
                  </div>
                  <div v-else style="max-height: 350px; overflow-y: auto;">
                    <table class="ts-table" style="font-size: 0.82rem;">
                      <thead>
                        <tr>
                          <th>Name</th>
                          <th>Member ID</th>
                          <th>Email</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr v-for="u in batchTrekkers" :key="u.bookingId || u.userId">
                          <td style="font-weight: 600; color: var(--forest);">{{ u.userName }}</td>
                          <td class="mono" style="font-size: 0.8rem;">{{ u.memberId || ('U' + u.userId) }}</td>
                          <td>{{ u.userEmail }}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
            <div class="ts-modal-footer">
              <button class="btn-primary-ts" @click="showHistoryModal = false">Close</button>
            </div>
          </div>
        </div>

      </section>
</template>

<script>
/**
 * =========================================================================
 * TabTrekHistory.vue
 * =========================================================================
 * Trek History archive panel — displays a read-only table of all completed
 * and past-date trek batches with summary stats (trekkers, duration, guide),
 * and a detail overlay listing registered trekker participants with their
 * booking IDs and payment status.
 *
 * This component uses Vue 3 Options API with local state for modal management
 * and injects `adminDash` from the root `AdminDashboard.vue` coordinator to
 * access the shared `treks` and `allBookings` lists.
 *
 * Key Sections:
 * - data: showHistoryModal, selectedHistoryTrek
 * - Computed: completedTreks (filter by Completed status or past end date)
 * - Methods: openHistoryModal, closeHistoryModal, formatDate
 */
export default {
  name: 'TabTrekHistory',
  inject: ['adminDash'],
  data() {
    return {
      // Local state
      showHistoryModal: false,
      selectedHistoryTrek: null,
      batchTrekkers: []
    };
  },

  computed: {
    // Injected parent fields
    activeTab() {
      return this.adminDash.activeTab;
    },

    // Filter list for only completed or past date batches
    completedTreks() {
      const todayStr = new Date().toLocaleDateString('en-CA');
      const treksList = this.adminDash.treks || [];
      return treksList.filter(t => t.status === 'Completed' || (t.endDate && t.endDate < todayStr));
    }
  },

  methods: {
    // Date formatting helper
    formatDate(dateStr) {
      if (!dateStr) return '';
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    },

    // View past participants register modal
    async openHistoryModal(trek) {
      this.selectedHistoryTrek = trek;
      this.showHistoryModal = true;
      this.batchTrekkers = [];
      try {
        const res = await fetch(`/api/admin/batches/${trek.id}/trekkers`);
        if (res.ok) {
          const d = await res.json();
          this.batchTrekkers = d.trekkers || [];
        }
      } catch (e) {
        console.error("Error fetching batch trekkers:", e);
      }
    }
  }
};
</script>
