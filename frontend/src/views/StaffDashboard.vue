<template>
  <div class="ts-staff-layout" :class="{ 'sidebar-collapsed': sidebarCollapsed }">

    <!-- Mobile sidebar overlay -->
    <div class="sidebar-overlay" :class="{ visible: sidebarOpen }" @click="sidebarOpen = false"></div>

    <!-- ── SIDEBAR ────────────────────────────────── -->
    <StaffSidebar @logout="$emit('logout')" />

    <!-- ── MAIN ───────────────────────────────────── -->
    <div class="ts-main">
      <StaffTopbar @logout="$emit('logout')" />
      <TabDashboard v-if="activeTab === 'dashboard'" />
      <TabTreks v-if="activeTab === 'treks' && !participantsInTreksTab && !attendanceInTreksTab" />
      <TabParticipants v-if="activeTab === 'participants' || (activeTab === 'treks' && participantsInTreksTab)" />
      <TabAttendance v-if="activeTab === 'treks' && attendanceInTreksTab" />
      <TabExports v-if="activeTab === 'exports'" />
      <TabProfile v-if="activeTab === 'profile'" />
      <TabSupport v-if="activeTab === 'support'" />
      <TabSocial v-if="activeTab === 'social'" />
    </div><!-- /ts-main -->

    <!-- ════════ MODALS ════════ -->

    <!-- Slot Edit Modal -->
    <div v-if="showSlotModal" class="ts-modal-overlay" @click.self="showSlotModal = false">
      <div class="ts-modal ts-modal-sm">
        <div class="ts-modal-header">
          <h3 class="ts-modal-title">Update Slots</h3>
          <button class="modal-close" @click="showSlotModal = false">✕</button>
        </div>
        <div class="ts-modal-body" v-if="slotTarget">
          <div class="modal-info-row"><span class="modal-info-label">Batch ID</span><span class="modal-info-val">{{ slotTarget.batchCode }}</span></div>
          <div class="modal-info-row"><span class="modal-info-label">Trek</span><span class="modal-info-val">{{ slotTarget.name }}</span></div>
          <div class="modal-info-row"><span class="modal-info-label">Currently Booked</span><span class="modal-info-val">{{ slotTarget.registered }}</span></div>
          <div class="modal-info-row"><span class="modal-info-label">Available</span><span class="modal-info-val">{{ slotTarget.slots - slotTarget.registered }}</span></div>
          <div class="form-group" style="margin-top:1rem">
            <label>New Total Slots (min: {{ slotTarget.registered }})</label>
            <input v-model.number="newSlots" type="number" :min="slotTarget.registered" style="padding:0.55rem 0.8rem; border:1px solid rgba(26,46,26,0.14); border-radius:4px; font-family:'DM Sans',sans-serif; font-size:0.87rem; outline:none; width:100%" />
          </div>
        </div>
        <div class="ts-modal-footer">
          <button class="btn-ghost" @click="showSlotModal = false">Cancel</button>
          <button class="btn-primary-ts" @click="saveSlots">Update Slots</button>
        </div>
      </div>
    </div>

    <!-- Status Change Modal -->
    <div v-if="showStatusModal" class="ts-modal-overlay" @click.self="showStatusModal = false">
      <div class="ts-modal ts-modal-sm">
        <div class="ts-modal-header">
          <h3 class="ts-modal-title">Change Trek Status</h3>
          <button class="modal-close" @click="showStatusModal = false">✕</button>
        </div>
        <div class="ts-modal-body" v-if="statusTarget">
          <div class="modal-info-row"><span class="modal-info-label">Batch ID</span><span class="modal-info-val">{{ statusTarget.batchCode }}</span></div>
          <div class="modal-info-row"><span class="modal-info-label">Trek</span><span class="modal-info-val">{{ statusTarget.name }}</span></div>
          <div class="modal-info-row"><span class="modal-info-label">Current</span><span :class="'status-pill status-' + statusTarget.status.toLowerCase()">{{ statusTarget.status }}</span></div>
          <div class="status-options">
            <label v-for="s in ['Pending','Approved','Open','Closed','Started','Completed']" :key="s" class="status-radio">
              <input type="radio" :value="s" v-model="newStatus" :disabled="!isStatusAllowed(s)" :title="!isStatusAllowed(s) ? (s === 'Started' ? 'Cannot start before trek start date' : s === 'Completed' ? 'Cannot complete until trek end date has passed' : '') : ''" />
              <span :class="'status-pill status-' + s.toLowerCase()">{{ s }}</span>
            </label>
          </div>
        </div>
        <div class="ts-modal-footer">
          <button class="btn-ghost" @click="showStatusModal = false">Cancel</button>
          <button class="btn-primary-ts" @click="saveStatus">Apply</button>
        </div>
      </div>
    </div>



    <!-- Trek Detail Modal -->
    <div v-if="showTrekDetailModal && detailTrek" class="ts-modal-overlay" @click.self="showTrekDetailModal = false">
      <div class="ts-modal ts-modal-lg">
        <div class="ts-modal-header">
          <h3 class="ts-modal-title">Trek Details</h3>
          <button class="modal-close" @click="showTrekDetailModal = false">✕</button>
        </div>
        <div class="ts-modal-body">
          <!-- Trek name & status -->
          <div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:1.25rem;flex-wrap:wrap;gap:0.75rem">
            <div>
              <div style="font-family:'Playfair Display',serif;font-size:1.4rem;font-weight:800;color:var(--forest);line-height:1.2">{{ detailTrek.name }}</div>
              <div style="font-size:0.82rem;color:var(--stone);margin-top:4px;display:flex;align-items:center;gap:6px">
                <svg viewBox="0 0 24 24" style="width:13px;height:13px;stroke:var(--gold);fill:none;stroke-width:2"><path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                {{ detailTrek.location }}
              </div>
            </div>
            <div style="display:flex;gap:0.5rem;flex-wrap:wrap;align-items:center">
              <span :class="'diff-pill pill-' + detailTrek.difficulty.toLowerCase()">{{ detailTrek.difficulty }}</span>
              <span :class="'status-pill status-' + detailTrek.status.toLowerCase()">{{ detailTrek.status }}</span>
            </div>
          </div>

          <!-- Key details grid -->
          <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:0.85rem;margin-bottom:1.25rem">

            <!-- Batch ID -->
            <div class="trek-detail-stat">
              <div class="trek-detail-stat-icon">
                <svg viewBox="0 0 24 24"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/><line x1="12" y1="12" x2="12" y2="16"/><line x1="10" y1="14" x2="14" y2="14"/></svg>
              </div>
              <div class="trek-detail-stat-label">Batch ID</div>
              <div class="trek-detail-stat-val">{{ detailTrek.batchCode }}</div>
            </div>

            <!-- Start Date -->
            <div class="trek-detail-stat">
              <div class="trek-detail-stat-icon">
                <svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><line x1="8" y1="14" x2="8" y2="14"/></svg>
              </div>
              <div class="trek-detail-stat-label">Start Date</div>
              <div class="trek-detail-stat-val">{{ formatDate(detailTrek.startDate) }}</div>
            </div>

            <!-- End Date -->
            <div class="trek-detail-stat">
              <div class="trek-detail-stat-icon">
                <svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><polyline points="9 16 11 18 15 14"/></svg>
              </div>
              <div class="trek-detail-stat-label">End Date</div>
              <div class="trek-detail-stat-val">{{ formatDate(detailTrek.endDate) }}</div>
            </div>

            <!-- Duration -->
            <div class="trek-detail-stat">
              <div class="trek-detail-stat-icon">
                <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              </div>
              <div class="trek-detail-stat-label">Duration</div>
              <div class="trek-detail-stat-val">{{ detailTrek.duration }} Days</div>
            </div>

            <!-- Registered -->
            <div class="trek-detail-stat">
              <div class="trek-detail-stat-icon">
                <svg viewBox="0 0 24 24"><circle cx="9" cy="8" r="3"/><path d="M2 19c0-3 3-5 7-5"/><circle cx="16" cy="10" r="3"/><path d="M13 19c0-3 2.7-5 6-5"/></svg>
              </div>
              <div class="trek-detail-stat-label">Registered</div>
              <div class="trek-detail-stat-val">{{ detailTrek.registered }} / {{ detailTrek.slots }}</div>
            </div>

            <!-- Slots Left -->
            <div class="trek-detail-stat">
              <div class="trek-detail-stat-icon">
                <svg viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/><path d="M9 21V9"/></svg>
              </div>
              <div class="trek-detail-stat-label">Slots Left</div>
              <div class="trek-detail-stat-val">{{ slotsLeft(detailTrek) }}</div>
            </div>

            <!-- Occupancy -->
            <div class="trek-detail-stat">
              <div class="trek-detail-stat-icon">
                <svg viewBox="0 0 24 24"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
              </div>
              <div class="trek-detail-stat-label">Occupancy</div>
              <div class="trek-detail-stat-val">{{ slotPct(detailTrek) }}%</div>
            </div>

          </div>

          <!-- Slot fill bar -->
          <div style="margin-bottom:1.25rem">
            <div style="display:flex;justify-content:space-between;font-size:0.75rem;color:var(--stone);margin-bottom:5px">
              <span>Slot Occupancy</span>
              <span>{{ detailTrek.registered }}/{{ detailTrek.slots }} filled</span>
            </div>
            <div class="slot-bar-wrap" style="height:10px">
              <div class="slot-bar-fill" :style="{ width: slotPct(detailTrek) + '%', background: slotColor(detailTrek) }"></div>
            </div>
          </div>



          <!-- Description -->
          <div v-if="detailTrek.description" style="background:var(--cream);border-radius:6px;padding:0.85rem 1rem;font-size:0.83rem;color:var(--bark);line-height:1.6">
            <div style="font-size:0.68rem;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:var(--stone);margin-bottom:0.4rem">About this trek</div>
            {{ detailTrek.description }}
          </div>
        </div>
        <div class="ts-modal-footer">
          <button class="btn-ghost" @click="showTrekDetailModal = false">Close</button>
          <button class="btn-primary-ts" @click="selectTrekForParticipants(detailTrek, { inline: activeTab === 'treks' }); showTrekDetailModal = false">
            <svg viewBox="0 0 24 24" style="width:14px;height:14px"><circle cx="9" cy="8" r="3"/><path d="M2 19c0-3 3-5 7-5"/><circle cx="16" cy="10" r="3"/><path d="M13 19c0-3 2.7-5 6-5"/></svg>
            Manage Participants
          </button>
        </div>
      </div>
    </div>

    <!-- Add Participant Modal -->
    <div v-if="showAddParticipantModal" class="ts-modal-overlay" @click.self="showAddParticipantModal = false">
      <div class="ts-modal ts-modal-sm">
        <div class="ts-modal-header">
          <h3 class="ts-modal-title">Add Participant</h3>
          <button class="modal-close" @click="showAddParticipantModal = false">✕</button>
        </div>
        <div class="ts-modal-body">
          <div style="background:linear-gradient(120deg,var(--forest),var(--forest-mid));border-radius:8px;padding:0.85rem 1rem;margin-bottom:1.25rem;">
            <div style="font-family:'Space Mono',monospace;font-size:0.6rem;font-weight:700;color:var(--gold);letter-spacing:0.12em;text-transform:uppercase;margin-bottom:4px">
              {{ assignedTreks.find(t => t.id === newParticipantTrekId)?.batchCode || '—' }}
            </div>
            <div style="font-family:'Playfair Display',serif;font-size:0.95rem;font-weight:700;color:#fff">
              {{ assignedTreks.find(t => t.id === newParticipantTrekId)?.name || '—' }}
            </div>
          </div>
          <div class="add-p-form">
            <div class="form-group">
              <label>Full Name <span style="color:#ef4444">*</span></label>
              <input v-model="newParticipantName" type="text" placeholder="e.g. Rahul Sharma" />
            </div>
            <div class="form-group">
              <label>Email Address <span style="color:#ef4444">*</span></label>
              <input v-model="newParticipantEmail" type="email" placeholder="e.g. rahul@example.com" />
            </div>
            <div class="form-group">
              <label>Contact Number</label>
              <input v-model="newParticipantPhone" type="tel" placeholder="e.g. +91 98765 43210" />
            </div>
            <div class="form-group">
              <label>Payment Status</label>
              <div class="pay-toggle-row">
                <button :class="['pay-toggle-btn', newParticipantPayment === 'paid' ? 'active-paid' : '']" @click="newParticipantPayment = 'paid'">✓ Paid</button>
                <button :class="['pay-toggle-btn', newParticipantPayment === 'pending' ? 'active-pending' : '']" @click="newParticipantPayment = 'pending'">⏳ Pending</button>
              </div>
            </div>
          </div>
        </div>
        <div class="ts-modal-footer">
          <button class="btn-ghost" @click="showAddParticipantModal = false">Cancel</button>
          <button class="btn-primary-ts" @click="addParticipant">
            <svg viewBox="0 0 24 24" style="width:14px;height:14px;stroke:currentColor;fill:none;stroke-width:2;margin-right:4px;vertical-align:middle"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg>
            Add to Trek
          </button>
        </div>
      </div>
    </div>

    <!-- Trek Completion Modal -->
    <div v-if="showCompletionModal && completionTrek" class="ts-modal-overlay" @click.self="showCompletionModal = false">
      <div class="ts-modal ts-modal-sm">
        <div class="ts-modal-header">
          <h3 class="ts-modal-title">Mark Trek Complete</h3>
          <button class="modal-close" @click="showCompletionModal = false">✕</button>
        </div>
        <div class="ts-modal-body">
          <div style="text-align:center; padding:1rem 0">
            <div style="font-size:2.5rem; margin-bottom:0.75rem">🏆</div>
            <div style="font-family:'Playfair Display',serif; font-size:1.2rem; font-weight:700; color:var(--forest); margin-bottom:0.5rem">{{ completionTrek.name }}</div>
            <div style="font-size:0.85rem; color:var(--stone); line-height:1.6">
              This will mark the trek as <strong>Completed</strong> and update the status of all active participants to Completed.
            </div>
          </div>
        </div>
        <div class="ts-modal-footer">
          <button class="btn-ghost" @click="showCompletionModal = false">Cancel</button>
          <button class="btn-primary-ts" @click="confirmCompletion">✓ Confirm Completion</button>
        </div>
      </div>
    </div>



    <!-- Toast -->
    <transition name="toast">
      <div v-if="toast.show" class="ts-toast">
        <svg viewBox="0 0 24 24">
          <path v-if="toast.type==='success'" d="M20 6L9 17l-5-5"/>
          <circle v-else-if="toast.type==='error'" cx="12" cy="12" r="10"/>
          <circle v-else cx="12" cy="12" r="10"/>
        </svg>
        {{ toast.msg }}
      </div>
    </transition>



  </div>
</template>

<script>
/**
 * =========================================================================
 * Trek Staff (Guide) Dashboard View Component
 * =========================================================================
 * This is the root wrapper for the Trek Staff / Guide dashboard. It processes
 * assigned treks, participants lists, checklist modifications, and schedules:
 * 
 * 1. TabDashboard: Summary statistics of assigned treks and participants count.
 * 2. TabTreks: List assigned treks, update capacity slots, and start/finish status.
 * 3. TabParticipants: Detailed roster of registered trekkers per batch.
 * 4. TabAttendance: Guide checklist to track hiker checklist completion.
 * 5. TabExports: Export participant rosters in text format.
 * 6. TabProfile: Edit contact specs, experience years, and skills.
 * 7. TabSupport: Raise leave applications or technical issue tickets with admin.
 * 8. TabSocial: Group communication channel linking guide to registered hikers.
 */

import {
  STAFF_INITIAL_NAME,
  STAFF_ASSIGNED_TREKS,
  STAFF_PARTICIPANTS,
  STAFF_ACTIVITY_LOG,
  STAFF_PROFILE_INITIAL
} from '../data/staff_data';
import StaffSidebar from '../components/staff_dash_components/StaffSidebar.vue';
import StaffTopbar from '../components/staff_dash_components/StaffTopbar.vue';
import TabDashboard from '../components/staff_dash_components/TabDashboard.vue';
import TabTreks from '../components/staff_dash_components/TabTreks.vue';
import TabParticipants from '../components/staff_dash_components/TabParticipants.vue';
import TabAttendance from '../components/staff_dash_components/TabAttendance.vue';
import TabExports from '../components/staff_dash_components/TabExports.vue';
import TabProfile from '../components/staff_dash_components/TabProfile.vue';
import TabSupport from '../components/staff_dash_components/TabSupport.vue';
import TabSocial from '../components/staff_dash_components/TabSocial.vue';

export default {
  name: 'TsStaffLayout',
  components: {
    StaffSidebar,
    StaffTopbar,
    TabDashboard,
    TabTreks,
    TabParticipants,
    TabAttendance,
    TabExports,
    TabProfile,
    TabSupport,
    TabSocial
  },
  emits: ['logout'],
  provide() {
    return { staffDash: this };
  },

  data() {
    return {
      // ── UI STATE ──────────────────────────────────
      activeTab: 'dashboard',
      sidebarOpen: false,
      sidebarCollapsed: false,
      profileDropdownOpen: false,
      toast: { show: false, msg: '', type: 'success' },

      // ── DATA ──────────────────────────────────────
      staffName: STAFF_INITIAL_NAME,
      staffProfile: { ...STAFF_PROFILE_INITIAL },
      assignedTreks: JSON.parse(JSON.stringify(STAFF_ASSIGNED_TREKS)),
      participants: JSON.parse(JSON.stringify(STAFF_PARTICIPANTS)),
      activityLog: JSON.parse(JSON.stringify(STAFF_ACTIVITY_LOG)),

      // ── NAVIGATION / HASH ROUTING ────────────────
      participantTrekId: null,
      participantsInTreksTab: false,
      attendanceInTreksTab: false,

      // ── SHARED STATE FOR CENTRAL MODALS ───────────
      showSlotModal: false,
      showStatusModal: false,
      showCompletionModal: false,
      showTrekDetailModal: false,
      showAddParticipantModal: false,

      slotTarget: null,
      statusTarget: null,
      completionTrek: null,
      detailTrek: null,

      newSlots: 0,
      newStatus: '',
      selectedTrekId: null,
      
      newParticipantEmail: '',
      newParticipantTrekId: null,
      newParticipantName: '',
      newParticipantPhone: '',
      newParticipantPayment: 'paid',
    };
  },

  computed: {
    staffInitial() {
      return this.staffProfile.name ? this.staffProfile.name[0].toUpperCase() : 'S';
    },

    profilePhotoUrl() {
      return this.staffProfile.photoUrl || this.staffProfile.profile_image_url || '';
    },

    nextTrek() {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const open = this.assignedTreks.filter(t => {
        if (t.status !== 'Open' && t.status !== 'Approved') return false;
        if (!t.endDate) return true;
        const parts = t.endDate.split('-');
        if (parts.length !== 3) return true;
        const end = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
        return end >= today;
      });
      if (!open.length) return null;
      return open.sort((a, b) => new Date(a.startDate) - new Date(b.startDate))[0];
    },

    activeAssignedTreks() {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return this.assignedTreks.filter(t => {
        if (!t.endDate) return true;
        const parts = t.endDate.split('-');
        if (parts.length !== 3) return true;
        const end = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
        end.setHours(23, 59, 59, 999);
        return t.status !== 'Completed' && end >= today;
      }).sort((a, b) => new Date(a.startDate) - new Date(b.startDate));
    },

    completedAssignedTreks() {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return this.assignedTreks.filter(t => {
        if (!t.endDate) return false;
        const parts = t.endDate.split('-');
        if (parts.length !== 3) return false;
        const end = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
        end.setHours(23, 59, 59, 999);
        return t.status === 'Completed' || end < today;
      }).sort((a, b) => new Date(b.endDate) - new Date(a.endDate));
    },

    attendanceParticipants() {
      return this.participants.filter(p => p.trekId === this.selectedTrekId && p.status === 'Booked');
    },

    selectedTrek() {
      return this.assignedTreks.find(t => t.id === this.selectedTrekId) || null;
    },

    participantTrek() {
      return this.assignedTreks.find(t => t.id === this.participantTrekId) || null;
    }
  },

  methods: {
    // ── NAVIGATION CONTROLLERS ──────────────────
    goTab(tab, options = {}) {
      this.sidebarOpen = false;
      const validTabs = ['dashboard', 'treks', 'participants', 'exports', 'profile', 'social', 'support'];
      if (!validTabs.includes(tab)) return;

      let targetHash = tab;
      if (tab === 'treks') {
        if (options.keepParticipantsInline && this.participantTrekId) {
          targetHash = `treks/participants/${this.participantTrekId}`;
        } else if (options.keepAttendanceInline && this.selectedTrekId) {
          targetHash = `treks/attendance/${this.selectedTrekId}`;
        }
      } else if (tab === 'participants') {
        if (options.keepTrek && this.participantTrekId) {
          targetHash = `participants/trek/${this.participantTrekId}`;
        }
      } else if (tab === 'social') {
        targetHash = 'social';
      }

      if (window.location.hash.slice(1) === targetHash) {
        this.handleHashChange();
      } else {
        window.location.hash = targetHash;
      }
    },

    handleHashChange() {
      const hash = window.location.hash.slice(1);
      if (!hash) {
        window.location.hash = 'dashboard';
        return;
      }

      if (hash.startsWith('treks/participants/')) {
        const trekId = parseInt(hash.replace('treks/participants/', ''), 10);
        this.activeTab = 'treks';
        this.participantsInTreksTab = true;
        this.attendanceInTreksTab = false;
        this.participantTrekId = isNaN(trekId) ? null : trekId;
        this.selectedTrekId = null;
      } else if (hash.startsWith('treks/attendance/')) {
        const trekId = parseInt(hash.replace('treks/attendance/', ''), 10);
        this.activeTab = 'treks';
        this.participantsInTreksTab = false;
        this.attendanceInTreksTab = true;
        this.selectedTrekId = isNaN(trekId) ? null : trekId;
        this.participantTrekId = null;
      } else if (hash.startsWith('participants/trek/')) {
        const trekId = parseInt(hash.replace('participants/trek/', ''), 10);
        this.activeTab = 'participants';
        this.participantsInTreksTab = false;
        this.attendanceInTreksTab = false;
        this.participantTrekId = isNaN(trekId) ? null : trekId;
        this.selectedTrekId = null;
      } else if (hash.startsWith('social/group/')) {
        this.activeTab = 'social';
      } else {
        const validTabs = ['dashboard', 'treks', 'participants', 'exports', 'profile', 'social', 'support'];
        if (validTabs.includes(hash)) {
          this.activeTab = hash;
          this.participantsInTreksTab = false;
          this.attendanceInTreksTab = false;
          this.participantTrekId = null;
          this.selectedTrekId = null;
        } else {
          window.location.hash = 'dashboard';
          return;
        }
      }

      this.sidebarOpen = false;
      if (this.activeTab) {
        localStorage.setItem('staffActiveTab', this.activeTab);
      }
      this.resetPageScroll();
    },

    resetPageScroll() {
      this.$nextTick(() => {
        window.scrollTo(0, 0);
        const el = this.$el ? this.$el.querySelector('.ts-main') : document.querySelector('.ts-main');
        if (el) {
          el.scrollTop = 0;
          requestAnimationFrame(() => { el.scrollTop = 0; });
        }
      });
    },

    // ── DATA FETCH ────────────────────────────────
    async fetchStaffData() {
      try {
        const res = await fetch('/api/staff/dashboard_data');
        if (res.ok) {
          const data = await res.json();
          this.staffName = data.staffName || this.staffName;
          if (data.staffProfile) {
            this.staffProfile = data.staffProfile;
          } else {
            this.staffProfile.name = data.staffName || this.staffProfile.name;
          }
          this.assignedTreks = data.assignedTreks || this.assignedTreks;
          this.participants = data.participants || this.participants;
        }
      } catch (e) {
        console.error("Error fetching staff data:", e);
      }
    },

    // ── TREK METRIC HELPERS ───────────────────────
    slotColor(t) {
      const pct = t.registered / t.slots;
      return pct >= 0.9 ? '#ef4444' : pct >= 0.7 ? '#fbbf24' : '#4ade80';
    },
    slotPct(t) { return Math.min(100, Math.round((t.registered / t.slots) * 100)); },
    slotsLeft(t) { return t.slots - t.registered; },

    formatDate(dateStr) {
      if (!dateStr) return '';
      const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
      const d = new Date(dateStr);
      if (isNaN(d)) return dateStr;
      return String(d.getUTCDate()).padStart(2,'0') + ' ' + months[d.getUTCMonth()] + ' ' + d.getUTCFullYear();
    },
    formatShortDate(dateStr) {
      if (!dateStr) return '';
      const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
      const d = new Date(dateStr);
      if (isNaN(d)) return dateStr;
      return String(d.getUTCDate()).padStart(2,'0') + ' ' + months[d.getUTCMonth()];
    },

    displayTrekkerId(p) {
      if (!p) return '—';
      return p.trekkerId || (p.userId ? `#${p.userId}` : (p.id ? `#${p.id}` : '—'));
    },
    paymentStatusLabel(p) {
      const raw = (p && p.paymentStatus) || (p && p.paid === false ? 'Pending' : 'Paid');
      const normalized = String(raw).trim() || 'Paid';
      return normalized.charAt(0).toUpperCase() + normalized.slice(1).toLowerCase();
    },
    paymentStatusClass(p) {
      return 'pay-pill pay-' + this.paymentStatusLabel(p).toLowerCase();
    },

    // ── STATUS MODAL & TRANSITIONS ────────────────
    openStatusModal(t) { this.statusTarget = t; this.newStatus = t.status; this.showStatusModal = true; },
    async saveStatus() {
      if (!this.isStatusAllowed(this.newStatus)) {
        this.showToast('Cannot set this status due to trek dates.', 'error');
        return;
      }
      try {
        const res = await fetch(`/api/staff/treks/status/${this.statusTarget.id}`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: this.newStatus })
        });
        if (res.ok) { this.showToast(`Trek status → ${this.newStatus}`); this.fetchStaffData(); }
        else this.showToast('Failed to update status', 'error');
      } catch {
        this.statusTarget.status = this.newStatus;
        this.activityLog.unshift({ id: Date.now(), text: `Changed <strong>${this.statusTarget.name}</strong> status to ${this.newStatus}`, type: 'status', time: 'just now' });
        this.showToast(`Status updated to ${this.newStatus}`);
      }
      this.showStatusModal = false;
    },

    parseDateOnly(d) {
      if (!d) return null;
      const dt = new Date(d);
      if (isNaN(dt)) return null;
      return new Date(dt.getFullYear(), dt.getMonth(), dt.getDate());
    },

    isStatusAllowed(s, trek = null) {
      const target = trek || this.statusTarget;
      if (!target) return true;
      const start = this.parseDateOnly(target.startDate);
      const end = this.parseDateOnly(target.endDate);
      const today = this.parseDateOnly(new Date());
      if (s === 'Started') {
        if (!start) return false;
        return today >= start;
      }
      if (s === 'Completed') {
        if (!end) return false;
        return today >= end;
      }
      return true;
    },

    // ── START / COMPLETE TREK ─────────────────────
    async markStarted(t) {
      if (!this.isStatusAllowed('Started', t)) {
        this.showToast('Cannot start before trek start date', 'error');
        return;
      }
      try {
        const res = await fetch(`/api/staff/treks/status/${t.id}`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'Started' })
        });
        if (res.ok) { this.showToast(`${t.name} marked as Started!`); this.fetchStaffData(); }
        else this.showToast('Failed to update status', 'error');
      } catch {
        t.status = 'Started';
        this.activityLog.unshift({ id: Date.now(), text: `Marked <strong>${t.name}</strong> as Started`, type: 'status', time: 'just now' });
        this.showToast(`${t.name} marked as Started!`);
      }
    },

    openCompletionModal(t) {
      if (!this.isStatusAllowed('Completed', t)) {
        this.showToast('Cannot complete until trek end date', 'error');
        return;
      }
      this.completionTrek = t;
      this.showCompletionModal = true;
    },

    async confirmCompletion() {
      const t = this.completionTrek;
      try {
        const res = await fetch(`/api/staff/treks/status/${t.id}`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'Completed' })
        });
        if (res.ok) { this.showToast(`${t.name} marked as Completed!`); this.fetchStaffData(); }
      } catch {
        t.status = 'Completed';
        this.participants.filter(p => p.trekId === t.id && p.status === 'Booked').forEach(p => { p.status = 'Completed'; });
        this.activityLog.unshift({ id: Date.now(), text: `Marked <strong>${t.name}</strong> as Completed`, type: 'status', time: 'just now' });
        this.showToast(`${t.name} marked as Completed!`);
      }
      this.showCompletionModal = false;
    },

    // ── CAPACITY SLOTS MODAL ──────────────────────
    openSlotModal(t) { this.slotTarget = t; this.newSlots = t.slots; this.showSlotModal = true; },
    async saveSlots() {
      if (this.newSlots < this.slotTarget.registered) { this.showToast('Slots cannot be less than registered count', 'error'); return; }
      try {
        const res = await fetch(`/api/staff/treks/slots/${this.slotTarget.id}`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ slots: this.newSlots })
        });
        if (res.ok) { this.showToast('Slots updated successfully'); this.fetchStaffData(); }
        else this.showToast('Failed to update slots', 'error');
      } catch {
        this.slotTarget.slots = parseInt(this.newSlots);
        this.activityLog.unshift({ id: Date.now(), text: `Updated <strong>${this.slotTarget.name}</strong> slots to ${this.newSlots}`, type: 'update', time: 'just now' });
        this.showToast('Slots updated successfully');
      }
      this.showSlotModal = false;
    },

    // ── ATTENDANCE ACTIONS ────────────────────────
    setAttendance(p, present) {
      const alreadySet = p.attendance === present;
      p.attendance = present;
      const action = present ? 'marked present' : 'marked absent';
      if (alreadySet) {
        this.showToast(`${p.name} already ${present ? 'present' : 'absent'}`);
        return;
      }
      this.activityLog.unshift({ id: Date.now(), text: `<strong>${p.name}</strong> ${action} for ${this.selectedTrek?.name}`, type: 'attendance', time: 'just now' });
      this.showToast(`${p.name} ${action}`);
    },

    // ── CROSS-TAB PARTICIPANTS & ATTENDANCE ───────
    selectTrekForParticipants(t, options = {}) {
      if (!t) return;
      this.participantTrekId = t.id;
      this.participantsInTreksTab = Boolean(options.inline);
      this.attendanceInTreksTab = false;
      this.goTab(options.inline ? 'treks' : 'participants', {
        keepParticipantsInline: options.inline,
        keepTrek: !options.inline
      });
    },
    backFromParticipantTrek() {
      if (this.participantsInTreksTab) {
        window.location.hash = 'treks';
      } else {
        window.location.hash = 'participants';
      }
    },
    selectTrekForAttendance(t) {
      if (!t) return;
      this.selectedTrekId = t.id;
      this.participantsInTreksTab = false;
      this.attendanceInTreksTab = true;
      this.goTab('treks', { keepAttendanceInline: true });
    },
    backFromAttendanceTrek() {
      window.location.hash = 'treks';
    },

    // ── CENTRAL MODAL: ADD PARTICIPANT ────────────
    openAddParticipantModal(trekId) {
      this.newParticipantTrekId = trekId;
      this.newParticipantEmail = '';
      this.newParticipantName = '';
      this.newParticipantPhone = '';
      this.newParticipantPayment = 'paid';
      this.showAddParticipantModal = true;
    },
    async addParticipant() {
      if (!this.newParticipantName.trim()) { this.showToast('Please enter a name', 'error'); return; }
      if (!this.newParticipantEmail.trim()) { this.showToast('Please enter an email', 'error'); return; }
      try {
        const res = await fetch(`/api/staff/participants/add`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: this.newParticipantName.trim(),
            email: this.newParticipantEmail.trim(),
            phone: this.newParticipantPhone.trim(),
            paymentStatus: this.newParticipantPayment,
            trekId: this.newParticipantTrekId
          })
        });
        const data = await res.json();
        if (res.ok) {
          this.showToast(data.message || 'Participant added successfully');
          this.participants.push({
            id: Date.now(), trekId: this.newParticipantTrekId,
            name: this.newParticipantName.trim(),
            email: this.newParticipantEmail.trim(),
            phone: this.newParticipantPhone.trim(),
            bookedOn: new Date().toISOString().slice(0,10),
            status: 'Booked', attendance: false,
            bloodGroup: '—', emergencyContact: '—', emergencyPhone: '—',
            paymentStatus: this.newParticipantPayment
          });
          const trek = this.assignedTreks.find(t => t.id === this.newParticipantTrekId);
          if (trek) trek.registered++;
        } else this.showToast(data.error || 'Failed to add participant', 'error');
      } catch {
        this.participants.push({
          id: Date.now(), trekId: this.newParticipantTrekId,
          name: this.newParticipantName.trim(),
          email: this.newParticipantEmail.trim(),
          phone: this.newParticipantPhone.trim(),
          bookedOn: new Date().toISOString().slice(0,10),
          status: 'Booked', attendance: false,
          bloodGroup: '—', emergencyContact: '—', emergencyPhone: '—',
          paymentStatus: this.newParticipantPayment
        });
        const trek = this.assignedTreks.find(t => t.id === this.newParticipantTrekId);
        if (trek) trek.registered++;
        this.showToast('Participant added successfully');
      }
      this.showAddParticipantModal = false;
    },

    // ── CENTRALIZED CANCEL BOOKING ────────────────
    async cancelParticipant(p) {
      if (!confirm(`Cancel booking for ${p.name}?`)) return;
      try {
        const res = await fetch(`/api/staff/participants/status/${p.id}`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'Cancelled' })
        });
        if (res.ok) { this.showToast(`${p.name}'s booking cancelled`); this.fetchStaffData(); }
      } catch {
        p.status = 'Cancelled';
        const trek = this.assignedTreks.find(t => t.id === p.trekId);
        if (trek && trek.registered > 0) trek.registered--;
        this.activityLog.unshift({ id: Date.now(), text: `<strong>${p.name}</strong> booking cancelled`, type: 'cancel', time: 'just now' });
        this.showToast(`${p.name}'s booking cancelled`);
      }
    },

    openTrekDetailModal(t) { this.detailTrek = t; this.showTrekDetailModal = true; },

    showToast(msg, type = 'success') {
      this.toast = { show: true, msg, type };
      setTimeout(() => { this.toast.show = false; }, 3500);
    }
  },

  mounted() {
    this.fetchStaffData();

    this.hashListener = this.handleHashChange.bind(this);
    window.addEventListener('hashchange', this.hashListener);

    const hash = window.location.hash.slice(1);
    if (hash) {
      if (hash.startsWith('social/group/')) {
        window.location.hash = 'social';
        this.handleHashChange();
      } else {
        this.handleHashChange();
      }
    } else {
      const savedTab = localStorage.getItem('staffActiveTab');
      const validTabs = ['dashboard', 'treks', 'participants', 'exports', 'profile', 'social', 'support'];
      if (savedTab && validTabs.includes(savedTab)) {
        window.location.hash = savedTab === 'attendance' ? 'treks' : savedTab;
      } else {
        window.location.hash = 'dashboard';
      }
    }
  },

  beforeUnmount() {
    window.removeEventListener('hashchange', this.hashListener);
  },
};
</script>
