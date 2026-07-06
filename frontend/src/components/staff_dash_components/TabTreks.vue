<template>
      <div class="tab-content">
        <div class="page-header">
          <div>
            <div class="section-eyebrow">Staff Panel</div>
            <div class="section-title">Assigned <em>Treks</em></div>
          </div>
          <button class="btn-back-home" @click="goTab('dashboard')"><i class="bi bi-house-door-fill me-1"></i>Back to Home</button>
        </div>

        <!-- Search Bar for both mobile & desktop -->
        <div style="position:relative; max-width: 480px; margin-bottom: 1.5rem;">
          <i class="bi bi-search" style="position:absolute; left:12px; top:50%; transform:translateY(-50%); color:var(--stone); font-size:0.85rem"></i>
          <input
            v-model="trekSearchQuery"
            type="text"
            placeholder="Search treks by name, location or batch…"
            style="width:100%; padding:0.6rem 0.8rem 0.6rem 2.2rem; border:1.5px solid var(--stone); border-radius:6px; font-family:'DM Sans',sans-serif; font-size:0.88rem; outline:none; transition:var(--transition);"
          />
          <button v-if="trekSearchQuery" style="position:absolute; right:12px; top:50%; transform:translateY(-50%); border:none; background:none; color:var(--stone); font-size:1.1rem; cursor:pointer;" @click="trekSearchQuery = ''">×</button>
        </div>

        <div class="active-treks-section">
          <h3 style="font-family:'Playfair Display',serif; font-size: 1.35rem; color: var(--forest); margin-bottom: 1rem;"><i class="bi bi-compass-fill"></i> Active Assigned Treks</h3>
          
          <div v-if="!filteredTrekOptions.length" class="empty-state" style="margin-bottom: 2rem;">
            <svg viewBox="0 0 24 24"><path d="M3 17l4-8 4 4 4-6 4 10"/></svg>
            <p>No active treks found.</p>
          </div>

          <div v-else class="treks-grid-staff" style="margin-bottom: 2.5rem;">
            <div v-for="t in filteredTrekOptions" :key="t.id" class="trek-staff-card">
              <!-- Batch Badge above name -->
              <div class="tsc-batch-badge">Batch {{ t.batchCode }}</div>

              <!-- Header -->
              <div class="tsc-header">
                <div>
                  <div class="tsc-name">{{ t.name }}</div>
                  <div class="tsc-loc">
                    <svg viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                    {{ t.location }}
                  </div>
                </div>
                <div style="display:flex;flex-direction:column;align-items:flex-end;gap:4px">
                  <span :class="'status-pill status-' + t.status.toLowerCase()">{{ t.status }}</span>
                  <span :class="'diff-pill pill-' + t.difficulty.toLowerCase()" style="font-size:0.68rem">{{ t.difficulty }}</span>
                </div>
              </div>

              <!-- Stats Row 1: Dates + Duration -->
              <div class="tsc-stats-row">
                <div class="tsc-stat-cell">
                  <div class="tsc-stat-cell-label">Start Date</div>
                  <div class="tsc-stat-cell-val">{{ formatDate(t.startDate) }}</div>
                </div>
                <div class="tsc-stat-divider"></div>
                <div class="tsc-stat-cell">
                  <div class="tsc-stat-cell-label">End Date</div>
                  <div class="tsc-stat-cell-val">{{ formatDate(t.endDate) }}</div>
                </div>
                <div class="tsc-stat-divider"></div>
                <div class="tsc-stat-cell">
                  <div class="tsc-stat-cell-label">Duration</div>
                  <div class="tsc-stat-cell-val">{{ t.duration }}d</div>
                </div>
              </div>

              <!-- Stats Row 2: Slots + Registered + Occupancy -->
              <div class="tsc-stats-row tsc-stats-row-2">
                <div class="tsc-stat-cell">
                  <div class="tsc-stat-cell-label">Total Slots</div>
                  <div class="tsc-stat-cell-val">{{ t.slots }}</div>
                </div>
                <div class="tsc-stat-divider"></div>
                <div class="tsc-stat-cell">
                  <div class="tsc-stat-cell-label">Registered</div>
                  <div class="tsc-stat-cell-val tsc-stat-registered">{{ t.registered }}</div>
                </div>
                <div class="tsc-stat-divider"></div>
                <div class="tsc-stat-cell">
                  <div class="tsc-stat-cell-label">Occupancy</div>
                  <div class="tsc-stat-cell-val" :style="{ color: slotColor(t) }">{{ slotPct(t) }}%</div>
                </div>
              </div>

              <!-- Slot bar -->
              <div class="slot-bar-wrap" style="margin:0.5rem 0 0.2rem">
                <div class="slot-bar-fill" :style="{ width: slotPct(t) + '%', background: slotColor(t) }"></div>
              </div>

              <!-- Actions -->
              <div class="tsc-actions-grid">
                <div class="tsc-btn-row tsc-btn-row-pair tsc-btn-row-manage">
                  <button class="btn-ghost btn-sm tsc-icon-btn tsc-btn-participants" @click="selectTrekForParticipants(t, { inline: true })">
                    <svg viewBox="0 0 24 24"><circle cx="9" cy="8" r="3"/><path d="M2 19c0-3 3-5 7-5"/><circle cx="16" cy="10" r="3"/><path d="M13 19c0-3 2.7-5 6-5"/></svg>
                    Manage Participants
                  </button>
                  <button class="btn-ghost btn-sm tsc-icon-btn tsc-btn-attendance" @click="selectTrekForAttendance(t)">
                    <svg viewBox="0 0 24 24"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
                    Mark Attendance
                  </button>
                </div>
                <div class="tsc-btn-row tsc-btn-row-pair tsc-btn-row-prep">
                  <button class="btn-ghost btn-sm tsc-icon-btn tsc-btn-slots" @click="openSlotModal(t)">
                    <svg viewBox="0 0 24 24"><path d="M11 5H6a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2v-5m-1.414-9.414a2 2 0 1 1 2.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                    Edit Slots
                  </button>
                  <button class="btn-ghost btn-sm tsc-icon-btn tsc-btn-checklist" @click="openChecklistModal(t)">
                    <svg viewBox="0 0 24 24"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
                    Checklist
                  </button>
                </div>
                <div class="tsc-btn-row tsc-btn-row-status tsc-btn-row-launch">
                  <button v-if="t.status !== 'Started' && t.status !== 'Completed'" class="btn-forest btn-sm tsc-icon-btn tsc-btn-start" :disabled="!isStatusAllowed('Started', t)" :title="!isStatusAllowed('Started', t) ? 'Cannot start before trek start date' : ''" @click="markStarted(t)">
                    <svg viewBox="0 0 24 24"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                    Mark as Started
                  </button>
                  <button v-if="t.status === 'Started'" class="btn-primary-ts btn-sm tsc-icon-btn tsc-btn-complete" :disabled="!isStatusAllowed('Completed', t)" :title="!isStatusAllowed('Completed', t) ? 'Cannot complete until trek end date' : ''" @click="openCompletionModal(t)">
                    <svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
                    Mark as Completed
                  </button>
                  <div v-if="t.status === 'Completed'" class="tsc-completed-chip">
                    <svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
                    Completed
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Completed/Past Treks Section in Assigned Treks Tab -->
        <div style="margin-top: 2.5rem; margin-bottom: 2rem;">
          <h3 style="font-family:'Playfair Display',serif; font-size: 1.35rem; color: var(--forest); margin-bottom: 1rem;"><i class="bi bi-check-circle-fill text-success"></i> Completed / Past Treks</h3>
          <div class="ts-table-wrap">
            <table class="ts-table">
              <thead>
                <tr>
                  <th>Batch ID</th>
                  <th>Trek Name</th>
                  <th>Dates</th>
                  <th class="col-hide-mobile">Slots</th>
                  <th style="text-align: right; width: 340px;">Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="t in completedTrekOptions" :key="t.id">
                  <td class="mono font-bold">{{ t.batchCode }}</td>
                  <td class="fw-bold">{{ t.name }}</td>
                  <td class="mono" style="font-size: 0.8rem; white-space: nowrap;">
                    <span class="desktop-date-range">{{ formatShortDate(t.startDate) }} — {{ formatShortDate(t.endDate) }}</span>
                    <span class="mobile-date-only">{{ formatShortDate(t.startDate) }}</span>
                  </td>
                  <td class="mono col-hide-mobile" style="font-size: 0.8rem;">{{ t.registered }}/{{ t.slots }}</td>
                  <td style="text-align: right;">
                    <div class="d-flex gap-2 justify-content-end">
                      <button class="btn btn-sm btn-outline-forest py-1 px-2 btn-hide-text-mobile" style="font-size: 0.72rem; font-weight: 600;" @click="openTrekDetailModal(t)">
                        <i class="bi bi-eye"></i> View Details
                      </button>
                      <button class="btn btn-sm btn-outline-primary-ts py-1 px-2 btn-hide-text-mobile" style="font-size: 0.72rem; font-weight: 600;" @click="selectTrekForParticipants(t, { inline: true })">
                        <i class="bi bi-people"></i> Manage Participants
                      </button>
                    </div>
                  </td>
                </tr>
                <tr v-if="!completedTrekOptions.length">
                  <td colspan="5" class="text-center py-4 text-muted" style="font-size: 0.85rem;">No completed treks found.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Gear Checklist Modal -->
        <div v-if="showChecklistModal" class="ts-modal-overlay" @click.self="showChecklistModal = false">
          <div class="ts-modal ts-modal-lg">
            <div class="ts-modal-header">
              <h3 class="ts-modal-title"><i class="bi bi-list-check"></i> Gear Checklist — {{ checklistTrek?.name }}</h3>
              <button class="modal-close" @click="showChecklistModal = false">✕</button>
            </div>
            <div class="ts-modal-body">
              <p style="font-size:0.83rem; color:var(--stone); margin-bottom:1rem; line-height:1.5">
                Manage the recommended gear list for participants. Changes sync to all active bookings.
              </p>
              <div style="display:flex; gap:0.5rem; margin-bottom:1rem">
                <input v-model="newChecklistItem" @keyup.enter="addChecklistItem" type="text" placeholder="Add item (e.g. Thermal flask)…" style="flex:1; padding:0.55rem 0.85rem; border:1px solid rgba(26,46,26,0.14); border-radius:4px; font-family:'DM Sans',sans-serif; font-size:0.87rem; outline:none" />
                <button class="btn-primary-ts btn-sm" @click="addChecklistItem">+ Add</button>
              </div>
              <div style="max-height:260px; overflow-y:auto; border:1px solid rgba(26,46,26,0.08); border-radius:4px; padding:0.5rem">
                <div v-if="!checklistItems.length" style="text-align:center; padding:1.5rem; color:var(--stone); font-size:0.85rem">No items yet.</div>
                <div v-for="(item, idx) in checklistItems" :key="idx"
                  style="display:flex; justify-content:space-between; align-items:center; padding:0.45rem 0.75rem; border-bottom:1px solid rgba(26,46,26,0.05)">
                  <span style="font-size:0.85rem">{{ idx + 1 }}. {{ item }}</span>
                  <button @click="removeChecklistItem(idx)" style="color:#ef4444; border:none; background:none; cursor:pointer; font-size:0.82rem; padding:2px 6px">✕</button>
                </div>
              </div>
            </div>
            <div class="ts-modal-footer">
              <button class="btn-ghost" @click="showChecklistModal = false">Cancel</button>
              <button class="btn-primary-ts" @click="saveChecklist">Save &amp; Sync</button>
            </div>
          </div>
        </div>

      </div>
</template>

<script>
/**
 * =========================================================================
 * TabTreks.vue
 * =========================================================================
 * Assigned treks panel allowing guides to update availability slots capacity and toggle started/completed states.
 * Uses 'staffDashComponent' options proxying to automatically route methods/state
 * read/writes directly to the parent 'StaffDashboard' instance.
 */

import { staffDashComponent } from './staffDashProxy';

export default staffDashComponent('TabTreks', {
  data() {
    return {
      trekSearchQuery: '',
      showChecklistModal: false,
      checklistItems: [],
      newChecklistItem: '',
      checklistTrek: null
    };
  },
  computed: {
    /**
     * Trek options filtered by local search query (name, location, batch code)
     */
    filteredTrekOptions() {
      const q = this.trekSearchQuery.toLowerCase().trim();
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const filtered = this.assignedTreks.filter(t =>
        !q ||
        t.name.toLowerCase().includes(q) ||
        (t.location && t.location.toLowerCase().includes(q)) ||
        (t.batchCode && t.batchCode.toLowerCase().includes(q))
      );
      return filtered.filter(t => {
        if (!t.endDate) return true;
        const parts = t.endDate.split('-');
        if (parts.length !== 3) return true;
        const end = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
        end.setHours(23, 59, 59, 999);
        return t.status !== 'Completed' && end >= today;
      }).sort((a, b) => new Date(a.startDate) - new Date(b.startDate));
    },

    completedTrekOptions() {
      const q = this.trekSearchQuery.toLowerCase().trim();
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const filtered = this.assignedTreks.filter(t =>
        !q ||
        t.name.toLowerCase().includes(q) ||
        (t.location && t.location.toLowerCase().includes(q)) ||
        (t.batchCode && t.batchCode.toLowerCase().includes(q))
      );
      return filtered.filter(t => {
        if (!t.endDate) return false;
        const parts = t.endDate.split('-');
        if (parts.length !== 3) return false;
        const end = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
        end.setHours(23, 59, 59, 999);
        return t.status === 'Completed' || end < today;
      }).sort((a, b) => new Date(b.endDate) - new Date(a.endDate));
    }
  },
  methods: {
    /**
     * Open checklist modal and fetch items from backend
     */
    async openChecklistModal(trek) {
      this.checklistTrek = trek;
      this.newChecklistItem = '';
      this.showChecklistModal = true;
      this.checklistItems = [];
      try {
        const res = await fetch(`/api/guide/treks/${trek.id}/checklist`);
        if (res.ok) {
          const data = await res.json();
          this.checklistItems = data.map(item => item.itemName);
        } else {
          this.staffDash.showToast('Failed to load checklist', 'error');
        }
      } catch (e) {
        console.error(e);
        this.staffDash.showToast('Error loading checklist', 'error');
      }
    },
    addChecklistItem() {
      const item = this.newChecklistItem.trim();
      if (!item) return;
      if (this.checklistItems.includes(item)) {
        this.staffDash.showToast('Item already in list', 'error');
        return;
      }
      this.checklistItems.push(item);
      this.newChecklistItem = '';
    },
    removeChecklistItem(i) {
      this.checklistItems.splice(i, 1);
    },
    async saveChecklist() {
      try {
        const res = await fetch(`/api/guide/treks/${this.checklistTrek.id}/checklist`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ items: this.checklistItems })
        });
        if (res.ok) {
          this.staffDash.showToast('Checklist saved and synced to participants');
          this.showChecklistModal = false;
        } else {
          this.staffDash.showToast('Failed to save checklist', 'error');
        }
      } catch (e) {
        console.error(e);
        this.staffDash.showToast('Error saving checklist', 'error');
      }
    }
  }
});
</script>
