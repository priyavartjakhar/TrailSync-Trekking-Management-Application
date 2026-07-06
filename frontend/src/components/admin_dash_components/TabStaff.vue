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
                <img :src="s.photoUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&h=300&fit=crop'" class="staff-card-photo" style="width: 50px; height: 50px; border-radius: 50%; object-fit: cover; border: 2px solid var(--forest);" />
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
                <th class="col-hide-mobile">Contact Info</th>
                <th class="col-hide-mobile" style="text-align: center;">Treks Completed</th>
                <th class="col-hide-mobile">Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="s in filteredStaff" :key="s.id">
                <td class="mono" style="font-size: 0.8rem;">{{ s.memberId || 'TS26S' + s.id }}</td>
                <td>
                  <span style="font-weight:600; color:var(--forest)">{{ s.name }}</span>
                </td>
                <td class="col-hide-mobile">
                  <div class="mono" style="font-size:0.8rem; color:var(--forest-mid)">{{ s.contact }}</div>
                  <div style="font-size:0.75rem; color:var(--stone)">{{ s.phone || 'No phone' }}</div>
                </td>
                <td class="mono font-bold col-hide-mobile" style="text-align: center;">{{ s.completedTreksCount }}</td>
                <td class="col-hide-mobile">
                  <span :class="['status-pill', s.blacklisted ? 'status-inactive' : (s.active ? 'status-active' : 'status-pending')]">
                    {{ s.blacklisted ? 'Blacklisted' : (s.active ? 'Active' : 'Inactive') }}
                  </span>
                </td>
                <td>
                  <div class="action-btns" style="display:flex; gap:6px;">
                    <button class="act-btn act-view" @click="viewStaffDetails(s)" title="View Details">
                      <svg viewBox="0 0 24 24" class="act-btn-icon"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                      <span class="btn-text-hide-mobile">View Details</span>
                    </button>
                    <button class="act-btn act-edit" @click="openStaffModal(s)" title="Edit">
                      <svg viewBox="0 0 24 24" class="act-btn-icon"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
                      <span class="btn-text-hide-mobile">Edit</span>
                    </button>
                    <button class="act-btn act-assign" @click="assignTrekToStaff(s)" title="Assign Trek">
                      <svg viewBox="0 0 24 24" class="act-btn-icon" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                      <span class="btn-text-hide-mobile">Assign Trek</span>
                    </button>
                    <button class="act-btn" :class="s.blacklisted ? 'act-open' : 'act-blacklist-btn'" @click="toggleStaffBlacklist(s)" :title="s.blacklisted ? 'Restore' : 'Blacklist'">
                      <svg viewBox="0 0 24 24" class="act-btn-icon" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"></line></svg>
                      <span class="btn-text-hide-mobile">{{ s.blacklisted ? 'Restore' : 'Blacklist' }}</span>
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

        <!-- ════════ ADD/EDIT STAFF MODAL (Extracted from SAdminModals) ════════ -->
        <div v-if="showStaffModal" class="ts-modal-overlay" @click.self="closeStaffModal">
          <div class="ts-modal large">
            <div class="ts-modal-header">
              <h3 class="ts-modal-title">{{ editingStaff ? 'Edit Staff Profile' : 'Add Trek Staff' }}</h3>
              <button class="modal-close" @click="closeStaffModal">✕</button>
            </div>
            <div class="ts-modal-body">
              <div class="form-grid">
                <div class="form-group">
                  <label>Full Name <span style="color: var(--red); font-weight: bold;">*</span></label>
                  <input v-model="staffForm.name" type="text" placeholder="e.g. John Doe" />
                </div>
                <div class="form-group">
                  <label>Email <span style="color: var(--red); font-weight: bold;">*</span></label>
                  <input v-model="staffForm.email" type="email" placeholder="staff@trailsync.com" />
                </div>
                <div class="form-group">
                  <label>Phone Number</label>
                  <input v-model="staffForm.phone" type="text" placeholder="e.g. +91 9876543210" />
                </div>
                <div class="form-group">
                  <label>Password (Default: Trailsync@123)</label>
                  <input v-model="staffForm.password" type="text" placeholder="Leave blank to keep unchanged" />
                </div>
                <div class="form-group">
                  <label>Designation</label>
                  <input v-model="staffForm.designation" type="text" placeholder="e.g. Lead Guide" />
                </div>
                <div class="form-group">
                  <label>Experience (Years)</label>
                  <input v-model.number="staffForm.experience" type="number" min="0" />
                </div>
                <div class="form-group">
                  <label>Skills</label>
                  <input v-model="staffForm.skills" type="text" placeholder="e.g. Wilderness First Aid, Navigation" />
                </div>
                <div class="form-group">
                  <label>Certifications</label>
                  <input v-model="staffForm.certifications" type="text" placeholder="e.g. WFR" />
                </div>
                <div class="form-group">
                  <label>Languages</label>
                  <input v-model="staffForm.languages" type="text" placeholder="e.g. English, Hindi" />
                </div>
                <div class="form-group">
                  <label>Completed Treks Count</label>
                  <input v-model.number="staffForm.completedTreksCount" type="number" min="0" />
                </div>
                <div class="form-group form-full">
                  <label>Staff Photograph</label>
                  <div style="display: flex; gap: 1rem; margin-bottom: 0.5rem;">
                    <label style="display: flex; align-items: center; gap: 4px; font-weight: normal; cursor: pointer; font-size: 0.82rem;">
                      <input type="radio" value="link" v-model="staffImageMode" /> Use Image Link
                    </label>
                    <label style="display: flex; align-items: center; gap: 4px; font-weight: normal; cursor: pointer; font-size: 0.82rem;">
                      <input type="radio" value="upload" v-model="staffImageMode" /> Upload Image
                    </label>
                  </div>
                  <div v-if="staffImageMode === 'link'">
                    <input v-model="staffForm.photoUrl" type="text" placeholder="https://images.unsplash.com/photo-..." />
                  </div>
                  <div v-else style="display: flex; gap: 10px; align-items: center;">
                    <input type="file" @change="handleStaffPhotoUpload" accept="image/*" class="form-control" style="font-size: 0.82rem; padding: 4px 8px;" />
                  </div>
                  <div v-if="staffForm.photoUrl" style="margin-top: 8px;">
                    <img :src="staffForm.photoUrl" alt="Preview" style="max-height: 80px; border-radius: 4px; border: 1px solid var(--stone);" />
                  </div>
                </div>
              </div>
            </div>
            <div class="ts-modal-footer">
              <button class="btn-ghost" @click="closeStaffModal">Cancel</button>
              <button class="btn-primary-ts" @click="saveStaff">{{ editingStaff ? 'Save Changes' : 'Add Staff Member' }}</button>
            </div>
          </div>
        </div>

        <!-- ════════ STAFF DETAILS MODAL (Extracted from SAdminModals) ════════ -->
        <div v-if="showStaffDetailsModal && selectedStaffDetails" class="ts-modal-overlay" @click.self="closeStaffDetails">
          <div class="ts-modal extra-large">
            <div class="ts-modal-header">
              <h3 class="ts-modal-title">Staff Member Details</h3>
              <button class="modal-close" @click="closeStaffDetails">✕</button>
            </div>
            <div class="ts-modal-body">
              <div class="details-modal-grid" style="grid-template-columns: 1fr 2fr;">
                <!-- Left Side: Profile Photo & Basic Details -->
                <div style="text-align: center; border-right: 1px solid var(--stone-light); padding-right: 1.5rem;">
                  <img :src="selectedStaffDetails.photoUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&h=300&fit=crop'" style="width: 140px; height: 140px; border-radius: 50%; object-fit: cover; margin: 0 auto 1rem; border: 3px solid var(--forest); box-shadow: 0 4px 10px rgba(0,0,0,0.1);" />
                  <h4 style="font-weight: 700; color: var(--forest); margin-bottom: 0.25rem;">{{ selectedStaffDetails.name }}</h4>
                  <div style="font-size: 0.85rem; color: var(--stone); font-family: monospace; margin-bottom: 1rem;">ID: {{ selectedStaffDetails.memberId }}</div>
                  
                  <div class="staff-detail-info" style="text-align: left; background: var(--snow); padding: 1rem; border-radius: 6px; border: 1px solid var(--stone-light); font-size: 0.84rem;">
                    <div><strong>Designation:</strong> {{ selectedStaffDetails.designation }}</div>
                    <div><strong>Email:</strong> {{ selectedStaffDetails.contact }}</div>
                    <div><strong>Phone:</strong> {{ selectedStaffDetails.phone || '—' }}</div>
                    <div><strong>Joined Date:</strong> {{ formatDate(selectedStaffDetails.joined) }}</div>
                    <div><strong>Experience:</strong> {{ selectedStaffDetails.experience }} years</div>
                    <div><strong>Languages:</strong> {{ selectedStaffDetails.languages }}</div>
                    <div><strong>Certifications:</strong> {{ selectedStaffDetails.certifications }}</div>
                    <div><strong>Skills:</strong> {{ selectedStaffDetails.skills }}</div>
                  </div>
                </div>
                
                <!-- Right Side: Treks Completed -->
                <div style="min-width: 0;">
                  <div class="timeline-section-title" style="font-weight: 700; color: var(--forest); font-size: 1.05rem; margin-bottom: 0.75rem;">
                    Treks Completed ({{ selectedStaffDetails.treksDone ? selectedStaffDetails.treksDone.length : 0 }})
                  </div>
                  <div class="ts-table-wrap goldish" v-if="selectedStaffDetails.treksDone && selectedStaffDetails.treksDone.length" style="max-height: 360px; overflow: auto; border-radius: 4px;">
                    <table class="ts-table" style="min-width: 550px; width: 100%;">
                      <thead>
                        <tr>
                          <th style="padding: 10px 12px; font-size: 0.72rem;">Batch ID</th>
                          <th style="padding: 10px 12px; font-size: 0.72rem;">Trek Name</th>
                          <th style="padding: 10px 12px; font-size: 0.72rem;">Trek location</th>
                          <th style="padding: 10px 12px; font-size: 0.72rem; text-align: center;">Total Trekkers</th>
                          <th style="padding: 10px 12px; font-size: 0.72rem;">Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr v-for="t in selectedStaffDetails.treksDone" :key="t.batchId">
                          <td class="mono" style="font-weight: 700; color: var(--gold); padding: 10px 12px;">{{ t.batchId }}</td>
                          <td style="font-weight: 600; color: var(--forest); padding: 10px 12px;">{{ t.trekName }}</td>
                          <td style="padding: 10px 12px; font-size: 0.82rem; color: var(--bark);">📍 {{ t.location }}</td>
                          <td class="mono" style="text-align: center; padding: 10px 12px; font-weight: 600; color: var(--forest-mid);">
                            {{ t.trekkersCount }}
                          </td>
                          <td class="mono" style="white-space: nowrap; padding: 10px 12px; font-size: 0.75rem; color: var(--stone);">
                            {{ formatDate(t.startDate) }}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  <div v-else style="font-size:0.8rem; color:var(--stone); font-style:italic; text-align:center; padding:3rem 1rem; background: var(--snow); border-radius: 6px; border: 1px dashed var(--stone);">
                    No treks completed or assigned to this staff member yet.
                  </div>
                </div>
              </div>
            </div>
            <div class="ts-modal-footer">
              <button class="btn-primary-ts" @click="closeStaffDetails">Close</button>
            </div>
          </div>
        </div>

        <!-- ════════ ASSIGN TREK TO STAFF MODAL (Extracted from SAdminModals) ════════ -->
        <div v-if="showAssignTrekModal" class="ts-modal-overlay" @click.self="closeAssignTrekModal">
          <div class="ts-modal">
            <div class="ts-modal-header">
              <h3 class="ts-modal-title">Assign Trek to {{ assignStaffObj ? assignStaffObj.name : '' }}</h3>
              <button class="modal-close" @click="closeAssignTrekModal">✕</button>
            </div>
            <div class="ts-modal-body" style="overflow: visible;">
              <div class="form-group form-full">
                <div class="custom-select-wrapper" :class="{ 'is-open': showAssignTrekDropdown }">
                  <label>Select Trek Batch <span style="color: var(--red); font-weight: bold;">*</span></label>
                  <div class="custom-select-trigger" @click.stop="showAssignTrekDropdown = !showAssignTrekDropdown">
                    <span>{{ selectedAssignTrekCode || 'Choose a trek batch...' }}</span>
                    <svg viewBox="0 0 24 24" class="custom-select-arrow" :class="{ open: showAssignTrekDropdown }"><polyline points="6 9 12 15 18 9"/></svg>
                  </div>
                  <div v-if="showAssignTrekDropdown" class="custom-select-dropdown">
                    <input v-model="trekSearchQuery" type="text" class="custom-select-search" placeholder="Search batch by code or name..." @click.stop />
                    <div class="custom-select-options">
                      <div v-for="t in matchingActiveTreks" :key="t.id" class="custom-select-option" :class="{ selected: tempTrekId === t.id }" @click="selectTrekForAssign(t)">
                        <span class="option-code">[{{ t.batchCode }}]</span>
                        <span class="option-name">{{ t.name }}</span>
                        <span class="option-loc">({{ formatDate(t.startDate) }})</span>
                      </div>
                      <div v-if="!matchingActiveTreks.length" class="custom-select-no-results">
                        No trek batches found.
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div class="ts-modal-footer">
              <button class="btn-ghost" @click="closeAssignTrekModal">Cancel</button>
              <button class="btn-primary-ts" @click="submitAssignTrek">Assign Trek</button>
            </div>
          </div>
        </div>

        <!-- ════════ BLACKLIST REASON MODAL (Staff specific) ════════ -->
        <div v-if="showBlacklistModal" class="ts-modal-overlay" @click.self="closeBlacklistModal" style="z-index: 3000;">
          <div class="ts-modal" style="max-width: 450px;">
            <div class="ts-modal-header" style="border-bottom: none; padding-bottom: 0;">
              <h3 class="ts-modal-title" style="color: var(--red); display: flex; align-items: center; gap: 8px;">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"></line></svg>
                <span>Blacklist Staff Account</span>
              </h3>
              <button class="modal-close" @click="closeBlacklistModal">✕</button>
            </div>
            <div class="ts-modal-body" style="padding-top: 1rem; padding-bottom: 1.5rem; font-size: 0.9rem;">
              <p style="margin-bottom: 0.75rem; color: var(--forest-mid);">
                Are you sure you want to blacklist <strong>{{ blacklistTargetUser ? blacklistTargetUser.name : '' }}</strong>? This will prevent them from logging in and accessing their dashboard.
              </p>
              <div class="form-group" style="margin-top: 1rem;">
                <label style="font-weight: 600; color: var(--forest); display: block; margin-bottom: 0.5rem;">Reason for Blacklisting:</label>
                <textarea 
                  v-model="blacklistReasonText" 
                  placeholder="Enter reason for blacklisting..." 
                  rows="4" 
                  style="width: 100%; padding: 0.5rem; border: 1px solid var(--stone); border-radius: var(--radius); font-size: 0.85rem; font-family: inherit; resize: vertical;"
                ></textarea>
              </div>
            </div>
            <div class="ts-modal-footer" style="background: var(--snow); border-top: 1px solid var(--stone-light);">
              <button class="btn-ghost" @click="closeBlacklistModal">Cancel</button>
              <button class="btn-primary-ts" style="background: var(--red); border-color: var(--red);" @click="submitBlacklist">Blacklist Account</button>
            </div>
          </div>
        </div>

      </section>
</template>

<script>
/**
 * =========================================================================
 * TabStaff.vue
 * =========================================================================
 * Trek Staff (Guide) management panel — handles CRUD for guide accounts,
 * profile detail overlays, photo uploads, trek batch assignments, and
 * staff blacklisting/restoration.
 *
 * This component uses Vue 3 Options API with local state for modal/form
 * management and injects `adminDash` from the root `AdminDashboard.vue`
 * coordinator to read shared lists (staffList, treks, trekRoutes) and
 * trigger coordinator-level side-effects (loadData, showToast, triggerConfirm).
 *
 * Key Sections:
 * - data: Local form/modal state, staffViewMode, editingStaff, assignStaffObj
 * - Computed: filteredStaff, matchingActiveRoutes for assignment dropdown
 * - Methods: CRUD (openStaffModal, saveStaff, closeStaffModal)
 * - Methods: Photo upload (handleStaffPhotoUpload via /api/admin/upload_image)
 * - Methods: Details (viewStaffDetails, closeStaffDetails)
 * - Methods: Assignment (assignTrekToStaff, selectTrekForAssign, submitAssignTrek)
 * - Methods: Blacklisting (toggleStaffBlacklist via submitBlacklist)
 */
export default {
  name: 'TabStaff',
  inject: ['adminDash'],
  data() {
    return {
      // Local UI toggles
      staffViewMode: 'list',
      showStaffModal: false,
      showStaffDetailsModal: false,
      showAssignTrekModal: false,
      showAssignTrekDropdown: false,
      showBlacklistModal: false,

      // Local forms / details state
      staffForm: {
        id: null,
        name: '',
        email: '',
        phone: '',
        password: '',
        skills: 'Wilderness First Aid, Navigation',
        experience: 2,
        designation: 'Lead Guide',
        certifications: 'Wilderness First Responder (WFR)',
        languages: 'English, Hindi',
        completedTreksCount: 10,
        photoUrl: ''
      },
      editingStaff: null,
      selectedStaffDetails: null,
      assignStaffObj: null,
      selectedAssignTrekCode: '',
      tempTrekId: null,
      staffImageMode: 'upload',
      trekSearchQuery: '',
      blacklistTargetUser: null,
      blacklistReasonText: ''
    };
  },

  watch: {
    showStaffModal(val) {
      if (!val) {
        this.editingStaff = null;
      }
      if (this.adminDash.showStaffModal !== val) {
        this.adminDash.showStaffModal = val;
      }
    },
    'adminDash.showStaffModal': {
      handler(newVal) {
        if (this.showStaffModal !== newVal) {
          this.showStaffModal = newVal;
        }
      },
      immediate: true
    },
    'adminDash.editingStaff': {
      handler(newVal) {
        this.editingStaff = newVal;
        if (newVal) {
          this.staffForm = { ...newVal };
        } else {
          this.staffForm = { name:'', email:'', phone:'', password:'', skills: 'Wilderness First Aid, Navigation', experience: 2, designation: 'Lead Guide', certifications: 'Wilderness First Responder (WFR)', languages: 'English, Hindi', completedTreksCount: 10, photoUrl: '' };
        }
      },
      immediate: true
    }
  },

  computed: {
    // Access parent context fields
    activeTab() {
      return this.adminDash.activeTab;
    },
    staffList() {
      return this.adminDash.staffList;
    },
    treks() {
      return this.adminDash.treks;
    },

    // Filter staff members based on top-bar search query
    filteredStaff() {
      const staffList = this.adminDash.staffList || [];
      const q = (this.adminDash.searchQuery || '').toLowerCase().trim();
      if (!q) return staffList;
      return staffList.filter(s => {
        const memberIdStr = s.memberId ? s.memberId.toLowerCase() : '';
        const idStr = String(s.id);
        return s.name.toLowerCase().includes(q) ||
          s.contact.toLowerCase().includes(q) ||
          memberIdStr.includes(q) ||
          idStr.includes(q);
      });
    },

    // Filter active treks for guides assignment dropdown
    matchingActiveTreks() {
      const treksList = this.adminDash.treks || [];
      return treksList.filter(t =>
        (t.name && t.name.toLowerCase().includes(this.trekSearchQuery.toLowerCase())) ||
        (t.batchCode && t.batchCode.toLowerCase().includes(this.trekSearchQuery.toLowerCase()))
      );
    }
  },

  methods: {
    // Date Formatter
    formatDate(dateStr) {
      if (!dateStr) return '';
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    },

    // ── Staff Photo Upload ──
    async handleStaffPhotoUpload(e) {
      const file = e.target.files[0];
      if (!file) return;
      const formData = new FormData();
      formData.append('image', file);
      try {
        this.adminDash.showToast('Uploading photo...');
        const res = await fetch('/api/admin/upload_image', {
          method: 'POST',
          body: formData
        });
        if (res.ok) {
          const data = await res.json();
          if (data.success) {
            this.staffForm.photoUrl = data.imageUrl;
            this.adminDash.showToast('Photo uploaded successfully!');
          } else {
            this.adminDash.showToast('Upload failed: ' + (data.error || 'unknown error'));
          }
        } else {
          this.adminDash.showToast('Upload failed');
        }
      } catch (err) {
        this.adminDash.showToast('Upload failed (connection error)');
      }
    },

    // ── CRUD Actions ──
    openStaffModal(staff = null) {
      this.editingStaff = staff;
      this.staffImageMode = 'upload';
      if (staff) {
        this.staffForm = {
          id: staff.id,
          name: staff.name,
          email: staff.contact,
          phone: staff.phone || '',
          password: '',
          skills: staff.skills || 'Wilderness First Aid, Navigation',
          experience: staff.experience || 2,
          designation: staff.designation || 'Lead Guide',
          certifications: staff.certifications || 'Wilderness First Responder (WFR)',
          languages: staff.languages || 'English, Hindi',
          completedTreksCount: staff.completedTreksCount || 10,
          photoUrl: staff.photoUrl || ''
        };
        if (staff.photoUrl && !staff.photoUrl.startsWith('/static/uploads')) {
          this.staffImageMode = 'link';
        }
      } else {
        this.staffForm = {
          name: '',
          email: '',
          phone: '',
          password: '',
          skills: 'Wilderness First Aid, Navigation',
          experience: 2,
          designation: 'Lead Guide',
          certifications: 'Wilderness First Responder (WFR)',
          languages: 'English, Hindi',
          completedTreksCount: 10,
          photoUrl: ''
        };
      }
      this.showStaffModal = true;
    },
    closeStaffModal() {
      this.showStaffModal = false;
      this.editingStaff = null;
    },
    async saveStaff() {
      if (!this.staffForm.name || !this.staffForm.name.trim()) {
        this.adminDash.showToast('Name is required');
        return;
      }
      if (!this.staffForm.email || !this.staffForm.email.trim()) {
        this.adminDash.showToast('Email is required');
        return;
      }

      try {
        const res = await fetch('/api/admin/staff', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(this.staffForm)
        });
        if (res.ok) {
          this.adminDash.showToast(this.editingStaff ? 'Staff profile updated' : 'Staff member added');
          this.adminDash.loadData();
          this.closeStaffModal();
        } else {
          const d = await res.json();
          this.adminDash.showToast(d.error || 'Failed to save staff');
        }
      } catch (_) {
        const sList = this.adminDash.staffList;
        if (this.editingStaff) {
          const idx = sList.findIndex(x => x.id === this.editingStaff.id);
          if (idx !== -1) {
            sList[idx] = { ...sList[idx], ...this.staffForm };
          }
          this.adminDash.showToast('Staff profile updated (offline)');
        } else {
          const newId = sList.length ? Math.max(...sList.map(x => x.id)) + 1 : 1;
          sList.push({
            id: newId,
            memberId: `TS26G${String(newId).padStart(3, '0')}`,
            name: this.staffForm.name,
            contact: this.staffForm.email,
            phone: this.staffForm.phone || '9876543210',
            designation: this.staffForm.designation || 'Guide',
            active: true,
            blacklisted: false,
            photoUrl: '',
            treks: [],
            treksDone: [],
            completedTreksCount: 0,
            leaves: []
          });
          this.adminDash.showToast('Staff member added (offline)');
        }
        this.closeStaffModal();
      }
    },

    // ── Staff Details ──
    viewStaffDetails(s) {
      this.selectedStaffDetails = s;
      this.showStaffDetailsModal = true;
    },
    closeStaffDetails() {
      this.showStaffDetailsModal = false;
      this.selectedStaffDetails = null;
    },

    // ── Assign Trek to Staff ──
    assignTrekToStaff(s) {
      this.assignStaffObj = s;
      this.trekSearchQuery = '';
      this.showAssignTrekDropdown = false;
      this.tempTrekId = null;
      this.selectedAssignTrekCode = '';
      this.showAssignTrekModal = true;
    },
    closeAssignTrekModal() {
      this.showAssignTrekModal = false;
      this.assignStaffObj = null;
      this.tempTrekId = null;
      this.selectedAssignTrekCode = '';
    },
    selectTrekForAssign(trek) {
      this.tempTrekId = trek ? trek.id : null;
      this.selectedAssignTrekCode = trek ? `[${trek.batchCode}] ${trek.name} (${this.formatDate(trek.startDate)})` : '';
      this.showAssignTrekDropdown = false;
    },
    async submitAssignTrek() {
      if (!this.tempTrekId) {
        this.adminDash.showToast('Please select a trek batch.');
        return;
      }
      try {
        const res = await fetch(`/api/admin/treks/assign/${this.tempTrekId}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: this.assignStaffObj.contact })
        });
        if (res.ok) {
          this.adminDash.showToast(`Trek successfully assigned to ${this.assignStaffObj.name}`);
          this.adminDash.loadData();
        } else {
          const d = await res.json();
          this.adminDash.showToast(d.error || 'Failed to assign trek');
        }
      } catch (_) {
        this.adminDash.showToast('Failed to assign trek (error)');
      }
      this.closeAssignTrekModal();
    },

    // ── Blacklisting Actions ──
    async toggleStaffBlacklist(s) {
      if (s.blacklisted) {
        try {
          const res = await fetch(`/api/admin/users/restore/${s.id}`, { method: 'POST' });
          if (res.ok) {
            this.adminDash.showToast(`Staff ${s.name} restored`);
            this.adminDash.loadData();
            return;
          }
        } catch (_) {}
        this.adminDash.showToast('Failed to restore staff member');
      } else {
        this.blacklistTargetUser = s;
        this.blacklistReasonText = '';
        this.showBlacklistModal = true;
      }
    },
    closeBlacklistModal() {
      this.showBlacklistModal = false;
      this.blacklistTargetUser = null;
      this.blacklistReasonText = '';
    },
    async submitBlacklist() {
      if (!this.blacklistTargetUser) return;
      const u = this.blacklistTargetUser;
      const reason = this.blacklistReasonText.trim() || 'Policy violation';
      try {
        const res = await fetch(`/api/admin/users/blacklist/${u.id}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ reason: reason })
        });
        if (res.ok) {
          this.adminDash.showToast(`${u.name} has been blacklisted.`);
          this.adminDash.loadData();
          this.closeBlacklistModal();
        } else {
          const d = await res.json();
          this.adminDash.showToast(d.error || 'Failed to blacklist user.');
        }
      } catch (_) {
        this.adminDash.showToast('Failed to blacklist user (error).');
      }
    }
  }
};
</script>
