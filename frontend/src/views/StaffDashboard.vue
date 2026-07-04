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

    <!-- Participant Detail Modal -->
    <div v-if="showParticipantModal && participantTarget" class="ts-modal-overlay" @click.self="showParticipantModal = false">
      <div class="ts-modal">
        <div class="ts-modal-header">
          <h3 class="ts-modal-title">Trekker Profile</h3>
          <button class="modal-close" @click="showParticipantModal = false">✕</button>
        </div>
        <div class="ts-modal-body">
          <!-- Avatar + Name -->
          <div class="pmodal-hero">
            <div class="pmodal-avatar">{{ participantTarget.name[0] }}</div>
            <div>
              <div class="pmodal-name">{{ participantTarget.name }}</div>
              <div class="pmodal-email">{{ participantTarget.email }}</div>
              <div class="pmodal-trekker-id">Trekker ID {{ displayTrekkerId(participantTarget) }}</div>
              <div style="margin-top:4px;display:flex;gap:6px;align-items:center">
                <span :class="'status-pill status-' + participantTarget.status.toLowerCase()">{{ participantTarget.status }}</span>
                <span :class="paymentStatusClass(participantTarget)">{{ paymentStatusLabel(participantTarget) }}</span>
              </div>
            </div>
          </div>
          <!-- Info grid -->
          <div class="pmodal-grid">
            <div class="pmodal-field">
              <div class="pmodal-field-label">Trekker ID</div>
              <div class="pmodal-field-val mono">{{ displayTrekkerId(participantTarget) }}</div>
            </div>
            <div class="pmodal-field">
              <div class="pmodal-field-label">Phone</div>
              <div class="pmodal-field-val">{{ participantTarget.phone || '—' }}</div>
            </div>
            <div class="pmodal-field">
              <div class="pmodal-field-label">Booked On</div>
              <div class="pmodal-field-val">{{ participantTarget.bookedOn }}</div>
            </div>
            <div class="pmodal-field">
              <div class="pmodal-field-label">Blood Group</div>
              <div class="pmodal-field-val" style="color:#dc2626;font-weight:700">{{ participantTarget.bloodGroup || '—' }}</div>
            </div>
            <div class="pmodal-field">
              <div class="pmodal-field-label">Attendance</div>
              <div class="pmodal-field-val">{{ participantTarget.attendance ? '✓ Present' : 'Not marked' }}</div>
            </div>
            <div class="pmodal-field">
              <div class="pmodal-field-label">Payment</div>
              <div class="pmodal-field-val">
                <span :class="paymentStatusClass(participantTarget)">{{ paymentStatusLabel(participantTarget) }}</span>
              </div>
            </div>
          </div>
          <!-- Emergency box -->
          <div class="pmodal-emergency">
            <div class="pmodal-emergency-title">🚑 Emergency Contact</div>
            <div class="pmodal-grid" style="margin-top:0.5rem">
              <div class="pmodal-field"><div class="pmodal-field-label">Name</div><div class="pmodal-field-val">{{ participantTarget.emergencyContact || '—' }}</div></div>
              <div class="pmodal-field"><div class="pmodal-field-label">Phone</div><div class="pmodal-field-val">{{ participantTarget.emergencyPhone || '—' }}</div></div>
            </div>
          </div>
        </div>
        <div class="ts-modal-footer">
          <button class="btn-ghost" @click="showParticipantModal = false">Close</button>
          <button v-if="participantTarget.status==='Booked'" class="btn-danger" @click="cancelParticipant(participantTarget); showParticipantModal = false">Remove</button>
          <button v-if="participantTarget.status==='Booked'" class="btn-primary-ts" @click="markParticipantComplete(participantTarget); showParticipantModal = false">Mark Completed</button>
        </div>
      </div>
    </div>

    <!-- Emergency Contacts Modal -->
    <div v-if="showEmergencyModal && participantTarget" class="ts-modal-overlay" @click.self="showEmergencyModal = false">
      <div class="ts-modal ts-modal-sm">
        <div class="ts-modal-header">
          <h3 class="ts-modal-title">🚑 Emergency Info</h3>
          <button class="modal-close" @click="showEmergencyModal = false">✕</button>
        </div>
        <div class="ts-modal-body">
          <div style="font-weight:600; color:var(--forest); margin-bottom:1rem">{{ participantTarget.name }}</div>
          <div class="emergency-row">
            <span class="emergency-icon">🏥</span>
            <div>
              <div class="ec-name">{{ participantTarget.emergencyContact }}</div>
              <div class="ec-phone">{{ participantTarget.emergencyPhone }}</div>
            </div>
            <span class="ec-blood">{{ participantTarget.bloodGroup }}</span>
          </div>
          <div style="font-size:0.78rem; color:var(--stone); margin-top:0.75rem; padding:0.65rem; background:rgba(239,68,68,0.04); border-radius:4px">
            In case of emergency, contact the above number. Blood type {{ participantTarget.bloodGroup }} noted.
          </div>
        </div>
        <div class="ts-modal-footer">
          <button class="btn-primary-ts" @click="showEmergencyModal = false">Close</button>
        </div>
      </div>
    </div>

    <!-- Checklist Modal -->
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

    <!-- ── BATCH EXPORT DETAIL MODAL ────────────────── -->
    <transition name="toast">
      <div v-if="showExportDetailModal" class="ts-modal-overlay" @click.self="showExportDetailModal = false">
        <div class="ts-modal" style="max-width: 800px; width: 95%;">
          <div class="ts-modal-header">
            <span class="ts-modal-title"><i class="bi bi-bar-chart-fill"></i> Batch Detailed Overview</span>
            <button class="modal-close" @click="showExportDetailModal = false">✕</button>
          </div>
          <div class="ts-modal-body" v-if="exportDetailTrek" style="padding: 1.5rem; max-height: 70vh; overflow-y: auto;">
            
            <!-- Trek Summary Header -->
            <div style="background: var(--snow); border: 1px solid rgba(26,46,26,0.08); padding: 1.25rem; border-radius: var(--radius); margin-bottom: 1.5rem; display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 10px;">
              <div>
                <span class="mono" style="background: rgba(200,146,42,0.13); color: var(--forest); font-size: 0.68rem; font-weight: 700; padding: 2px 8px; border-radius: 999px; text-transform: uppercase; letter-spacing: 0.05em; display: inline-block; margin-bottom: 4px;">{{ exportDetailTrek.batchCode }}</span>
                <h4 style="font-family: 'Playfair Display', serif; font-size: 1.3rem; font-weight: 800; color: var(--forest); margin: 0;">{{ exportDetailTrek.name }}</h4>
                <div style="font-size: 0.82rem; color: var(--stone); margin-top: 4px;"><i class="bi bi-geo-alt-fill"></i> {{ exportDetailTrek.location }}</div>
              </div>
              <div style="text-align: right;">
                <span :class="'status-pill status-' + exportDetailTrek.status.toLowerCase()">{{ exportDetailTrek.status }}</span>
                <div style="font-size: 0.8rem; color: var(--bark); font-weight: 600; margin-top: 6px;">{{ formatDate(exportDetailTrek.startDate) }} — {{ formatDate(exportDetailTrek.endDate) }}</div>
              </div>
            </div>

            <!-- Key Metrics Grid -->
            <div class="career-stat-grid" style="margin-bottom: 1.5rem; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));">
              <div class="career-stat">
                <span>{{ exportDetailTrek.registered }}/{{ exportDetailTrek.slots }}</span>
                <small>Occupancy</small>
              </div>
              <div class="career-stat">
                <span>{{ exportDetailTrek.registered > 0 ? Math.round((exportDetailTrek.registered / exportDetailTrek.slots) * 100) : 0 }}%</span>
                <small>Fill Rate</small>
              </div>
              <div class="career-stat">
                <span>{{ slotsLeft(exportDetailTrek) }}</span>
                <small>Slots Remaining</small>
              </div>
              <div class="career-stat">
                <span>₹{{ exportDetailTrek.price ? exportDetailTrek.price.toLocaleString() : '5,000' }}</span>
                <small>Base price</small>
              </div>
            </div>

            <!-- Participants List Table -->
            <h5 style="font-family: 'Playfair Display', serif; font-size: 1.05rem; font-weight: 700; color: var(--forest); margin-bottom: 0.85rem; border-bottom: 1px solid rgba(26,46,26,0.1); padding-bottom: 6px;">Registered Trekkers</h5>
            <div class="ts-table-wrap">
              <table class="ts-table">
                <thead>
                  <tr>
                    <th>Trekker ID</th>
                    <th>Name</th>
                    <th>Contact Info</th>
                    <th>Blood Group</th>
                    <th>Emergency Contact</th>
                    <th>Payment</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="p in participants.filter(p=>p.trekId===exportDetailTrek.id)" :key="p.id">
                    <td class="mono font-bold">{{ displayTrekkerId(p) }}</td>
                    <td>
                      <div class="user-cell">
                        <div class="user-mini-avatar">{{ p.name[0] }}</div>
                        <span class="cell-name">{{ p.name }}</span>
                      </div>
                    </td>
                    <td>
                      <div>📧 {{ p.email }}</div>
                      <div style="font-size:0.75rem; color:var(--stone); margin-top:2px;">📞 {{ p.phone || '—' }}</div>
                    </td>
                    <td class="mono font-bold" style="color: #ef4444;">{{ p.bloodGroup || '—' }}</td>
                    <td style="font-size:0.78rem;">
                      <div>{{ p.emergencyContact || '—' }}</div>
                      <div style="color:var(--stone); margin-top:1px;">{{ p.emergencyPhone || '' }}</div>
                    </td>
                    <td>
                      <span :class="'status-pill pay-' + (p.paymentStatus || 'paid').toLowerCase()" style="font-size: 0.65rem; padding: 2px 6px;">{{ p.paymentStatus || 'Paid' }}</span>
                    </td>
                  </tr>
                  <tr v-if="!participants.filter(p=>p.trekId===exportDetailTrek.id).length">
                    <td colspan="6" style="text-align: center; color: var(--stone); font-style: italic; padding: 1.5rem;">No participants registered for this batch.</td>
                  </tr>
                </tbody>
              </table>
            </div>

          </div>
          <div class="ts-modal-footer">
            <button class="btn-ghost" @click="showExportDetailModal = false">Close</button>
            <button class="btn-primary-ts" @click="openDownloadPromptModal(exportDetailTrek)">Download Report</button>
          </div>
        </div>
      </div>
    </transition>

    <!-- ── DOWNLOAD REPORT PROMPT MODAL ────────────────── -->
    <transition name="toast">
      <div v-if="showDownloadPromptModal" class="ts-modal-overlay" @click.self="showDownloadPromptModal = false">
        <div class="ts-modal" style="max-width: 420px; width: 90%;">
          <div class="ts-modal-header">
            <span class="ts-modal-title"><i class="bi bi-file-earmark-arrow-down"></i> Export Document Report</span>
            <button class="modal-close" @click="showDownloadPromptModal = false">✕</button>
          </div>
          <div class="ts-modal-body" v-if="downloadPromptTrek" style="padding: 1.5rem; text-align: center;">
            <div style="margin-bottom: 0.85rem;"><i class="bi bi-file-earmark-pdf" style="font-size: 2.5rem; color: var(--gold);"></i></div>
            <h5 style="font-family: 'Playfair Display', serif; font-weight: 800; color: var(--forest); margin-bottom: 6px;">Download PDF Report</h5>
            <div style="font-size: 0.8rem; color: var(--stone); margin-bottom: 1.5rem; line-height: 1.5;">
              Select the type of report you want to export as a formatted PDF for <strong style="color: var(--forest);">{{ downloadPromptTrek.name }} ({{ downloadPromptTrek.batchCode }})</strong>.
            </div>

            <!-- Loading spinner -->
            <div v-if="downloadPending" class="d-flex flex-column align-items-center" style="margin-bottom: 1rem;">
              <div class="pay-sim-spinner" style="margin-bottom: 10px;"></div>
              <div style="font-size: 0.8rem; color: var(--stone); font-weight: 600;">Generating your PDF document...</div>
            </div>

            <!-- Options -->
            <div v-else style="display: flex; flex-direction: column; gap: 10px;">
              <button class="btn-primary-ts d-flex justify-content-between align-items-center" @click="generatePDFReport(downloadPromptTrek, 'list')" style="padding: 12px; font-size: 0.85rem; text-align: left; font-weight: 700; width: 100%;">
                <span><i class="bi bi-people-fill"></i> Participants List Only</span>
                <span style="font-size: 0.7rem; background: rgba(255,255,255,0.2); padding: 2px 6px; border-radius: 4px;">PDF</span>
              </button>
              <button class="btn-forest d-flex justify-content-between align-items-center" @click="generatePDFReport(downloadPromptTrek, 'full')" style="padding: 12px; font-size: 0.85rem; text-align: left; font-weight: 700; background: var(--forest); border: none; color: white; width: 100%;">
                <span><i class="bi bi-file-earmark-bar-graph"></i> Full Detailed Information</span>
                <span style="font-size: 0.7rem; background: rgba(255,255,255,0.2); padding: 2px 6px; border-radius: 4px;">PDF</span>
              </button>
            </div>
          </div>
          <div class="ts-modal-footer" v-if="!downloadPending">
            <button class="btn-modal-cancel" @click="showDownloadPromptModal = false" style="font-weight: 600;">Cancel</button>
          </div>
        </div>
      </div>
    </transition>

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

    <!-- Social Profile Detail Modal -->
    <div v-if="showSocialProfileModal && socialProfileTarget" class="ts-modal-overlay" @click.self="showSocialProfileModal = false">
      <div class="ts-modal" style="max-width: 460px; width: 90%;">
        <div class="ts-modal-header">
          <h3 class="ts-modal-title">Trekker Profile (Social)</h3>
          <button class="modal-close" @click="showSocialProfileModal = false">✕</button>
        </div>
        <div class="ts-modal-body">
          <div class="pmodal-hero">
            <div class="pmodal-avatar">{{ socialProfileTarget.name[0] }}</div>
            <div>
              <div class="pmodal-name">{{ socialProfileTarget.name }}</div>
              <div class="pmodal-email">{{ socialProfileTarget.email }}</div>
              <div class="pmodal-trekker-id">Trekker ID {{ displayTrekkerId(socialProfileTarget) }}</div>
              <div style="margin-top:4px;">
                <span :class="'status-pill status-' + socialProfileTarget.status.toLowerCase()">{{ socialProfileTarget.status }}</span>
              </div>
            </div>
          </div>
          <div class="pmodal-grid mt-3">
            <div class="pmodal-field">
              <div class="pmodal-field-label">Phone</div>
              <div class="pmodal-field-val">{{ socialProfileTarget.phone || '—' }}</div>
            </div>
            <div class="pmodal-field">
              <div class="pmodal-field-label">Blood Group</div>
              <div class="pmodal-field-val" style="color:#dc2626;font-weight:700">{{ socialProfileTarget.bloodGroup || '—' }}</div>
            </div>
          </div>
          <div class="pmodal-emergency mt-3">
            <div class="pmodal-emergency-title fw-bold" style="font-size: 0.82rem; color: var(--forest);"><i class="bi bi-exclamation-triangle-fill text-danger"></i> Emergency Contact</div>
            <div class="pmodal-grid mt-2">
              <div class="pmodal-field"><div class="pmodal-field-label">Name</div><div class="pmodal-field-val">{{ socialProfileTarget.emergencyContact || '—' }}</div></div>
              <div class="pmodal-field"><div class="pmodal-field-label">Phone</div><div class="pmodal-field-val">{{ socialProfileTarget.emergencyPhone || '—' }}</div></div>
            </div>
          </div>
        </div>
        <div class="ts-modal-footer">
          <button class="btn-ghost" @click="showSocialProfileModal = false">Close</button>
          <button v-if="socialProfileTarget?.status === 'Booked'" class="btn-danger" @click="cancelParticipant(socialProfileTarget); showSocialProfileModal = false">Remove</button>
        </div>
      </div>
    </div>

  </div>
</template>

<script>
import {
  STAFF_INITIAL_NAME,
  STAFF_ASSIGNED_TREKS,
  STAFF_PARTICIPANTS,
  STAFF_ACTIVITY_LOG,
  STAFF_PROFILE_INITIAL,
  CHECKLIST_DEFAULTS
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
      showMobileMembers: false,
      toast: { show: false, msg: '', type: 'success' },

      // ── DATA ──────────────────────────────────────
      staffName: STAFF_INITIAL_NAME,
      staffProfile: { ...STAFF_PROFILE_INITIAL },
      assignedTreks: JSON.parse(JSON.stringify(STAFF_ASSIGNED_TREKS)),
      participants: JSON.parse(JSON.stringify(STAFF_PARTICIPANTS)),
      activityLog: JSON.parse(JSON.stringify(STAFF_ACTIVITY_LOG)),
      checklistItems: [...CHECKLIST_DEFAULTS],
      newChecklistItem: '',

      // ── SEARCH / FILTER ───────────────────────────
      searchQuery: '',
      participantSearch: '',
      selectedTrekId: null,
      participantTrekId: null,
      participantsInTreksTab: false,
      attendanceInTreksTab: false,

      // ── COUNTDOWN ─────────────────────────────────
      countdownTimer: null,
      countdown: { days: 0, hours: 0, minutes: 0, seconds: 0 },

      // ── MODALS ────────────────────────────────────
      showSlotModal: false,
      showStatusModal: false,
      showParticipantModal: false,
      showChecklistModal: false,
      showEmergencyModal: false,
      showCompletionModal: false,
      showTrekDetailModal: false,
      showAddParticipantModal: false,
      showExportDetailModal: false,
      exportDetailTrek: null,
      showDownloadPromptModal: false,
      downloadPromptTrek: null,
      downloadPending: false,

      slotTarget: null,
      statusTarget: null,
      participantTarget: null,
      checklistTrek: null,
      completionTrek: null,
      detailTrek: null,

      newSlots: 0,
      newStatus: '',
      newParticipantEmail: '',
      newParticipantTrekId: null,
      newParticipantName: '',
      newParticipantPhone: '',
      newParticipantPayment: 'paid',

      // ── PARTICIPANTS TAB SEARCH ────────────────────
      trekSearchQuery: '',
      trekSearchFocused: false,

      // ── EXPORT ────────────────────────────────────
      exportPending: false,
      exportTrekId: null,

      // ── PASSWORD FORM ─────────────────────────────
      pwForm: { current: '', new: '', confirm: '' },

      // ── SOCIAL TAB STATE ──────────────────────────
      selectedSocialTrekId: null,
      socialMessages: [
        { id: 1, trekId: 1, sender: 'guide', name: 'Lead Guide', text: 'Hey trekkers! Please make sure you bring proper high-ankle trekking shoes. The weather at Kedarkantha is snowy right now.', timestamp: '10:00 AM' },
        { id: 2, trekId: 1, sender: 'trekker', name: 'Aarav Sharma', text: 'Thanks for the update, guide! Are microspikes provided at basecamp?', timestamp: '10:15 AM' },
        { id: 3, trekId: 1, sender: 'guide', name: 'Lead Guide', text: 'Yes, Aarav! We will distribute microspikes and gaiters at Sankri basecamp.', timestamp: '10:18 AM' },
        { id: 4, trekId: 1, sender: 'trekker', name: 'Neha Gupta', text: 'Awesome! Can we rent warm jackets too?', timestamp: '10:20 AM' },
        { id: 5, trekId: 1, sender: 'guide', name: 'Lead Guide', text: 'Yes, heavy down jackets are available for rent at Sankri. Make sure to pre-book.', timestamp: '10:22 AM' },

        { id: 6, trekId: 2, sender: 'guide', name: 'Lead Guide', text: 'Welcome to the Hampta Pass group chat! We start in 5 days. Ensure your physical prep matches the routine.', timestamp: '09:00 AM' },
        { id: 7, trekId: 2, sender: 'trekker', name: 'Rohan Mehta', text: 'Looking forward to it! How cold will it get at Balu ka Ghera camp?', timestamp: '09:12 AM' },
        { id: 8, trekId: 2, sender: 'guide', name: 'Lead Guide', text: 'It will dip to around 2°C at night, Rohan. Make sure you have at least 3 warm layers.', timestamp: '09:20 AM' }
      ],
      newSocialMessageText: '',
      showSocialProfileModal: false,
      socialProfileTarget: null,

      // ── SUPPORT & LEAVE STATE ──────────────────────
      supportTickets: [],
      submittingSupport: false,
      newTicket: { subject: '', category: 'General', message: '' },
      leaveRequest: { startDate: '', endDate: '', reason: '' },
      submittingLeave: false,

      // ── SOCIAL DATABASE STATE ──────────────────────
      socialGroups: [],
      pendingGroups: [],
      loadingSocial: false
    };
  },

  computed: {
    staffInitial() {
      return this.staffProfile.name ? this.staffProfile.name[0].toUpperCase() : 'S';
    },

    // Summary stats for topbar
    summaryStats() {
      const totalParticipants = this.participants.filter(p => p.status === 'Booked' || p.status === 'Completed').length;
      const upcoming = this.assignedTreks.filter(t => t.status === 'Open' || t.status === 'Approved').length;
      const completed = this.assignedTreks.filter(t => t.status === 'Completed').length;
      const pending = this.assignedTreks.filter(t => t.status === 'Pending').length;
      return [
        { label: 'Assigned Treks', value: this.assignedTreks.length, icon: 'mountain', color: 'si-gold' },
        { label: 'Total Participants', value: totalParticipants, icon: 'users', color: 'si-forest' },
        { label: 'Upcoming Treks', value: upcoming, icon: 'calendar', color: 'si-green' },
        { label: 'Completed', value: completed, icon: 'check', color: 'si-blue' },
        { label: 'Pending Actions', value: pending, icon: 'alert', color: 'si-red' },
      ];
    },

    // Next upcoming trek
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

    // Filtered treks for search
    filteredTreks() {
      if (!this.searchQuery) return this.assignedTreks;
      const q = this.searchQuery.toLowerCase();
      return this.assignedTreks.filter(t => t.name.toLowerCase().includes(q) || t.location.toLowerCase().includes(q));
    },

    // Selected trek object
    selectedTrek() {
      return this.assignedTreks.find(t => t.id === this.selectedTrekId) || null;
    },

    // Resolved trek for the participants tab
    participantTrek() {
      return this.assignedTreks.find(t => t.id === this.participantTrekId) || null;
    },

    // Filtered participants for selected trek
    filteredParticipants() {
      return this.participants.filter(p => {
        const matchTrek = p.trekId === this.participantTrekId;
        const q = this.participantSearch.toLowerCase();
        const trekkerId = this.displayTrekkerId(p).toLowerCase();
        const matchSearch = !q || p.name.toLowerCase().includes(q) || p.email.toLowerCase().includes(q) || trekkerId.includes(q);
        return matchTrek && matchSearch;
      });
    },

    // Attendance participants (booked only)
    attendanceParticipants() {
      return this.participants.filter(p => p.trekId === this.selectedTrekId && p.status === 'Booked');
    },

    // Trek progress steps
    trekProgressSteps() {
      return ['Planning', 'Approved', 'Open', 'Started', 'Completed'];
    },

    // Performance metrics
    perfMetrics() {
      const totalSlots = this.assignedTreks.reduce((a, t) => a + t.slots, 0);
      const totalRegistered = this.assignedTreks.reduce((a, t) => a + t.registered, 0);
      const occupancy = totalSlots > 0 ? Math.round((totalRegistered / totalSlots) * 100) : 0;
      const completionRate = this.assignedTreks.length > 0
        ? Math.round((this.assignedTreks.filter(t => t.status === 'Completed').length / this.assignedTreks.length) * 100)
        : 0;
      const completedTreks = Number(this.staffProfile.completedTreksCount || 0);
      const experienceYears = Number(this.staffProfile.experienceYears || 0);
      const activeTreks = this.assignedTreks.filter(t => ['Open', 'Approved', 'Started'].includes(t.status)).length;
      return {
        treksManaged: completedTreks + this.assignedTreks.length,
        completedTreks,
        assignedTreks: this.assignedTreks.length,
        activeTreks,
        participantsManaged: this.participants.length,
        occupancy,
        completionRate,
        experienceYears
      };
    },

    profilePhotoUrl() {
      return this.staffProfile.photoUrl || this.staffProfile.profile_image_url || '';
    },

    profileStatusLabel() {
      if (this.staffProfile.blacklisted) return 'Restricted';
      return this.staffProfile.status || (this.staffProfile.active === false ? 'Inactive' : 'Active');
    },

    profileSkills() {
      return this.splitProfileList(this.staffProfile.skills);
    },

    profileCertifications() {
      return this.splitProfileList(this.staffProfile.certifications);
    },

    profileLanguages() {
      return this.splitProfileList(this.staffProfile.languages);
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

    // Trek options filtered by search query (name, location, batch code)
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
    },

    // ── SOCIAL COMPUTED ───────────────────────────
    selectedSocialGroupTrek() {
      return this.socialGroups.find(t => t.id === this.selectedSocialTrekId) || this.assignedTreks.find(t => t.id === this.selectedSocialTrekId) || null;
    },
    currentGroupMessages() {
      return this.socialMessages.filter(m => m.trekId === this.selectedSocialTrekId).map(m => {
        return {
          id: m.id,
          trekId: m.trekId,
          sender: m.senderRole === 'staff' || m.senderRole === 'admin' ? 'guide' : 'trekker',
          senderRole: m.senderRole,
          name: m.senderName,
          text: m.messageText,
          isAnnouncement: false,
          timestamp: m.createdAt ? new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''
        };
      });
    },
    socialGroupMembers() {
      if (!this.selectedSocialTrekId) return [];
      return this.participants.filter(p => p.trekId === this.selectedSocialTrekId && (p.status === 'Booked' || p.status === 'Completed'));
    },
  },

  methods: {
    // ── NAV ────────────────────────────────────────
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
      } else if (tab === 'participants' && this.participantTrekId) {
        targetHash = `participants/trek/${this.participantTrekId}`;
      } else if (tab === 'social') {
        this.selectedSocialTrekId = null;
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

      // Check sub-routes for treks
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
        const trekId = parseInt(hash.replace('social/group/', ''), 10);
        this.activeTab = 'social';
        this.selectedSocialTrekId = isNaN(trekId) ? null : trekId;
      } else {
        const validTabs = ['dashboard', 'treks', 'participants', 'exports', 'profile', 'social', 'support'];
        if (validTabs.includes(hash)) {
          this.activeTab = hash;
          this.participantsInTreksTab = false;
          this.attendanceInTreksTab = false;
          this.participantTrekId = null;
          this.selectedTrekId = null;
          if (hash === 'social') {
            this.selectedSocialTrekId = null;
            this.fetchSocialGroups();
          } else if (hash === 'support') {
            this.fetchStaffTickets();
          }
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

          if (this.assignedTreks.length > 0) {
            const firstId = this.assignedTreks[0].id;
            const secondId = this.assignedTreks[1] ? this.assignedTreks[1].id : firstId;
            
            this.socialMessages.forEach(m => {
              if (m.trekId === 1) m.trekId = firstId;
              else if (m.trekId === 2) m.trekId = secondId;
            });
            
            // Don't auto-open chat of group by default
          }
        }
      } catch (e) {
        console.error("Error fetching staff data:", e);
      }
    },

    // ── TREK HELPERS ──────────────────────────────
    slotColor(t) {
      const pct = t.registered / t.slots;
      return pct >= 0.9 ? '#ef4444' : pct >= 0.7 ? '#fbbf24' : '#4ade80';
    },
    slotPct(t) { return Math.min(100, Math.round((t.registered / t.slots) * 100)); },
    slotsLeft(t) { return t.slots - t.registered; },
    daysUntil(dateStr) { return Math.ceil((new Date(dateStr) - new Date()) / 86400000); },

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
    getTrekWeather(trek) {
      if (!trek) return { temp: '—', condition: 'Sunny', icon: 'bi-sun', wind: '—', humidity: '—' };
      const name = trek.name.toLowerCase();
      if (name.includes('kedarkantha')) {
        return { temp: '4°C', condition: 'Snowy / Wind Chill', icon: 'bi-snow', wind: '18 km/h', humidity: '82%' };
      } else if (name.includes('hampta')) {
        return { temp: '12°C', condition: 'Rainy / Cloudy', icon: 'bi-cloud-rain-heavy', wind: '12 km/h', humidity: '90%' };
      } else if (name.includes('roopkund')) {
        return { temp: '-2°C', condition: 'Freezing / Snow', icon: 'bi-thermometer-snow', wind: '22 km/h', humidity: '85%' };
      }
      return { temp: '16°C', condition: 'Clear Skies', icon: 'bi-sun-fill', wind: '8 km/h', humidity: '45%' };
    },
    getCategoryClass(category) {
      const normalized = String(category || 'General').toLowerCase();
      if (normalized.includes('leave')) return 'cat-leave';
      if (normalized.includes('bug') || normalized.includes('technical')) return 'cat-bug';
      if (normalized.includes('feedback')) return 'cat-feedback';
      if (normalized.includes('payment')) return 'cat-payment';
      if (normalized.includes('profile')) return 'cat-profile';
      if (normalized.includes('booking')) return 'cat-booking';
      return 'cat-general';
    },
    async fetchStaffTickets() {
      try {
        const res = await fetch('/api/staff/tickets');
        if (res.ok) {
          this.supportTickets = await res.json();
        }
      } catch (e) {
        console.error("Error fetching staff tickets:", e);
      }
    },
    async submitStaffTicket() {
      if (!this.newTicket.subject.trim() || !this.newTicket.message.trim()) {
        this.showToast('Please fill in both subject and description.', 'error');
        return;
      }
      this.submittingSupport = true;
      try {
        const res = await fetch('/api/staff/tickets', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            subject: this.newTicket.subject.trim(),
            category: this.newTicket.category,
            message: this.newTicket.message.trim()
          })
        });
        const data = await res.json();
        if (res.ok && data.success) {
          this.showToast(data.message || 'Support ticket submitted successfully!');
          this.newTicket = { subject: '', category: 'General', message: '' };
          await this.fetchStaffTickets();
        } else {
          this.showToast(data.error || 'Failed to submit support ticket.', 'error');
        }
      } catch (e) {
        console.error("Error submitting support ticket:", e);
        this.showToast('Server error while submitting support ticket.', 'error');
      } finally {
        this.submittingSupport = false;
      }
    },
    async submitLeaveRequest() {
      if (!this.leaveRequest.startDate || !this.leaveRequest.endDate || !this.leaveRequest.reason.trim()) {
        this.showToast('Please fill in start date, end date, and reason.', 'error');
        return;
      }
      const start = new Date(this.leaveRequest.startDate);
      const end = new Date(this.leaveRequest.endDate);
      if (start > end) {
        this.showToast('Start date must be before or equal to end date.', 'error');
        return;
      }
      this.submittingLeave = true;
      try {
        const dateRangeStr = `${this.leaveRequest.startDate} to ${this.leaveRequest.endDate}`;
        const subject = `Leave Request: ${dateRangeStr}`;
        const message = `Leave Dates: ${dateRangeStr}\nReason: ${this.leaveRequest.reason.trim()}`;
        
        const res = await fetch('/api/staff/tickets', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            subject: subject,
            category: 'Leave Request',
            message: message
          })
        });
        const data = await res.json();
        if (res.ok && data.success) {
          this.showToast('Leave request submitted successfully for approval!');
          this.leaveRequest = { startDate: '', endDate: '', reason: '' };
          await this.fetchStaffTickets();
        } else {
          this.showToast(data.error || 'Failed to submit leave request.', 'error');
        }
      } catch (e) {
        console.error("Error submitting leave request:", e);
        this.showToast('Server error while submitting leave request.', 'error');
      } finally {
        this.submittingLeave = false;
      }
    },
    async fetchSocialGroups() {
      try {
        const res = await fetch('/api/social/groups');
        if (res.ok) {
          this.socialGroups = await res.json();
          // Don't auto-open chat of group by default
          // Refresh pending groups as well
          this.fetchPendingGroups();
        }
      } catch (e) {
        console.error("Error fetching social groups:", e);
      }
    },
    async fetchPendingGroups() {
      try {
        const res = await fetch('/api/social/pending_groups');
        if (res.ok) {
          this.pendingGroups = await res.json();
        }
      } catch (e) {
        console.error('Error fetching pending groups:', e);
      }
    },
    async fetchSocialGroupMessages(trekId, options = {}) {
      if (!options.silent) this.loadingSocial = true;
      try {
        const res = await fetch(`/api/social/group/${trekId}/messages`);
        if (res.ok) {
          const msgs = await res.json();
          this.socialMessages = msgs;
          if (!options.silent) {
            this.$nextTick(() => {
              const feed = this.$el ? this.$el.querySelector('.social-chat-feed') : document.querySelector('.social-chat-feed');
              if (feed) feed.scrollTop = feed.scrollHeight;
            });
          }
        }
      } catch (e) {
        console.error("Error fetching social messages:", e);
      } finally {
        if (!options.silent) this.loadingSocial = false;
      }
    },
    async toggleSocialGroupLock(trekId) {
      try {
        const res = await fetch(`/api/social/group/${trekId}/toggle_lock`, { method: 'POST' });
        const data = await res.json();
        if (res.ok && data.success) {
          this.showToast(data.isLocked ? 'Group chat locked (view only for trekkers).' : 'Group chat unlocked successfully!');
          await this.fetchSocialGroups();
        } else {
          this.showToast(data.error || 'Failed to toggle group lock.', 'error');
        }
      } catch (e) {
        console.error("Error toggling group lock:", e);
      }
    },
    selectSocialGroup(trekId) {
      this.selectedSocialTrekId = trekId;
      window.location.hash = `social/group/${trekId}`;
      this.fetchSocialGroupMessages(trekId);
    },
    closeSocialChat() {
      this.selectedSocialTrekId = null;
      this.newSocialMessageText = '';
      this.showMobileMembers = false;
      window.location.hash = 'social';
    },
    async sendSocialMessage() {
      if (!this.newSocialMessageText.trim()) return;
      try {
        const text = this.newSocialMessageText.trim();
        this.newSocialMessageText = '';
        const res = await fetch(`/api/social/group/${this.selectedSocialTrekId}/messages`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messageText: text })
        });
        if (res.ok) {
          const data = await res.json();
          await this.fetchSocialGroupMessages(this.selectedSocialTrekId);
        } else {
          const errData = await res.json();
          this.showToast(errData.error || 'Failed to send message.', 'error');
        }
      } catch (e) {
        console.error("Error sending message:", e);
      }
    },

    async createGroup(trekId) {
      try {
        const res = await fetch(`/api/social/group/${trekId}/create`, { method: 'POST' });
        if (res.ok) {
          const d = await res.json();
          this.showToast(d.message || 'Group created');
          await this.fetchSocialGroups();
          await this.fetchPendingGroups();
        } else {
          const err = await res.json();
          this.showToast(err.error || 'Failed to create group', 'error');
        }
      } catch (e) {
        console.error('Error creating group:', e);
      }
    },
    openSocialProfileModal(p) {
      this.socialProfileTarget = p;
      this.showSocialProfileModal = true;
    },
    getTrekkerCount(trekId) {
      const trekkers = this.participants.filter(p => p.trekId === trekId && (p.status === 'Booked' || p.status === 'Completed')).length;
      return trekkers + 1; // including guide
    },
    getChatBubbleStyle(m) {
      if (m.sender === 'system' || m.name === 'System') {
        return {
          background: 'rgba(255, 238, 207, 0.95)',
          color: '#513c1a',
          alignSelf: 'center',
          borderRadius: '6px',
          fontSize: '0.72rem',
          fontWeight: '600',
          textAlign: 'center',
          boxShadow: '0 1px 3px rgba(0,0,0,0.06)'
        };
      }
      if (m.sender === 'guide') {
        return {
          background: 'var(--cream)',
          border: '1px solid rgba(200, 146, 42, 0.25)',
          color: 'var(--bark)',
          borderTopRightRadius: '0px'
        };
      }
      return {
        background: '#ffffff',
        border: '1px solid rgba(26, 46, 26, 0.08)',
        color: 'var(--bark)',
        borderTopLeftRadius: '0px'
      };
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

    getProgressStep(status) {
      const map = { Pending: 0, Approved: 1, Open: 2, Started: 3, Completed: 4 };
      return map[status] ?? 0;
    },

    // ── SLOT MODAL ────────────────────────────────
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

    // ── STATUS MODAL ─────────────────────────────
    openStatusModal(t) { this.statusTarget = t; this.newStatus = t.status; this.showStatusModal = true; },
    async saveStatus() {
      // Validate allowed transition based on trek dates
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

    // ── PARTICIPANT ACTIONS ────────────────────────
    openParticipantModal(p) { this.participantTarget = p; this.showParticipantModal = true; },
    openEmergencyModal(p) { this.participantTarget = p; this.showEmergencyModal = true; },

    async markParticipantComplete(p) {
      try {
        const res = await fetch(`/api/staff/participants/status/${p.id}`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'Completed' })
        });
        if (res.ok) { this.showToast(`${p.name} marked completed`); this.fetchStaffData(); }
      } catch {
        p.status = 'Completed';
        this.showToast(`${p.name} marked as completed`);
      }
    },
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
    // Helpers for status validation
    parseDateOnly(d) {
      if (!d) return null;
      const dt = new Date(d);
      if (isNaN(dt)) return null;
      // zero time for date-only comparison
      return new Date(dt.getFullYear(), dt.getMonth(), dt.getDate());
    },
    isStatusAllowed(s, trek = null) {
      const target = trek || this.statusTarget;
      if (!target) return true;
      const start = this.parseDateOnly(target.startDate);
      const end = this.parseDateOnly(target.endDate);
      const today = this.parseDateOnly(new Date());
      if (s === 'Started') {
        // allow Started only when start date is today or earlier
        if (!start) return false;
        return today >= start;
      }
      if (s === 'Completed') {
        // allow Completed only on the end date or later
        if (!end) return false;
        return today >= end;
      }
      return true;
    },

    toggleAttendance(p) {
      this.setAttendance(p, !p.attendance);
    },

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

    selectTrekForParticipants(t, options = {}) {
      if (!t) return;
      this.participantTrekId = t.id;
      this.participantSearch = '';
      this.trekSearchQuery = '';
      this.participantsInTreksTab = Boolean(options.inline);
      this.attendanceInTreksTab = false;
      this.goTab(options.inline ? 'treks' : 'participants', { keepParticipantsInline: options.inline });
    },

    backFromParticipantTrek() {
      this.participantSearch = '';
      this.trekSearchQuery = '';
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

    isGroupCompleted(t) {
      if (!t) return false;
      if (t.status === 'Completed') return true;
      if (!t.endDate) return false;
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const end = new Date(t.endDate);
      end.setHours(23, 59, 59, 999);
      return end < today;
    },

    // ── CHECKLIST MODAL ───────────────────────────
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
          this.showToast('Failed to load checklist', 'error');
        }
      } catch (e) {
        console.error(e);
        this.showToast('Error loading checklist', 'error');
      }
    },
    addChecklistItem() {
      const item = this.newChecklistItem.trim();
      if (!item) return;
      if (this.checklistItems.includes(item)) { this.showToast('Item already in list', 'error'); return; }
      this.checklistItems.push(item); this.newChecklistItem = '';
    },
    removeChecklistItem(i) { this.checklistItems.splice(i, 1); },
    async saveChecklist() {
      try {
        const res = await fetch(`/api/guide/treks/${this.checklistTrek.id}/checklist`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ items: this.checklistItems })
        });
        if (res.ok) {
          this.showToast('Checklist saved and synced to participants');
          this.showChecklistModal = false;
        } else {
          this.showToast('Failed to save checklist', 'error');
        }
      } catch (e) {
        console.error(e);
        this.showToast('Error saving checklist', 'error');
      }
    },

    // ── MARK AS STARTED ───────────────────────────
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

    // ── TREK DETAIL MODAL ─────────────────────────
    openTrekDetailModal(t) { this.detailTrek = t; this.showTrekDetailModal = true; },

    // ── ADD PARTICIPANT MODAL ─────────────────────
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
          // Optimistic add
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

    // ── TREK COMPLETION ───────────────────────────
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

    // ── EXPORT ───────────────────────────────────
    async exportCSV(trekId) {
      const tid = trekId || this.selectedTrekId;
      this.exportPending = true; this.exportTrekId = tid;
      const trek = this.assignedTreks.find(t => t.id === tid);
      try {
        const res = await fetch(`/api/staff/export/${tid}`, { method: 'POST' });
        const data = await res.json();
        this.showToast(data.message || 'CSV export triggered');
      } catch {
        this.showToast(`Participant list for ${trek?.name || 'trek'} — CSV sent via email`);
      }
      setTimeout(() => { this.exportPending = false; this.exportTrekId = null; }, 6000);
    },

    // ── PROFILE SAVE ─────────────────────────────
    async saveProfile() {
      this.showToast('Staff profiles can only be edited by administrators.', 'error');
    },

    splitProfileList(value) {
      return (value || '')
        .split(',')
        .map(v => v.trim())
        .filter(Boolean);
    },

    async changePassword() {
      if (!this.pwForm.current || !this.pwForm.new) { this.showToast('Fill all fields', 'error'); return; }
      if (this.pwForm.new !== this.pwForm.confirm) { this.showToast("Passwords don't match", 'error'); return; }
      try {
        const res = await fetch('/api/staff/password', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ current: this.pwForm.current, new: this.pwForm.new })
        });
        const data = await res.json();
        if (res.ok) { this.pwForm = { current: '', new: '', confirm: '' }; this.showToast(data.message || 'Password updated'); }
        else this.showToast(data.error || 'Update failed', 'error');
      } catch {
        this.pwForm = { current: '', new: '', confirm: '' };
        this.showToast('Password changed successfully');
      }
    },

    // ── COUNTDOWN ─────────────────────────────────
    startCountdown() {
      if (this.countdownTimer) clearInterval(this.countdownTimer);
      this.countdownTimer = setInterval(() => {
        const trek = this.nextTrek;
        if (!trek) return;
        const diff = new Date(trek.startDate).getTime() - Date.now();
        if (diff <= 0) { this.countdown = { days: 0, hours: 0, minutes: 0, seconds: 0 }; return; }
        this.countdown = {
          days: Math.floor(diff / 86400000),
          hours: Math.floor((diff % 86400000) / 3600000),
          minutes: Math.floor((diff % 3600000) / 60000),
          seconds: Math.floor((diff % 60000) / 1000),
        };
      }, 1000);
    },

    // ── TOAST ─────────────────────────────────────
    showToast(msg, type = 'success') {
      this.toast = { show: true, msg, type };
      setTimeout(() => { this.toast.show = false; }, 3500);
    },

    buildLinePath(data, key, w, h, pad) {
      if (!data || !data.length) return '';
      const max = Math.max(...data.map(d => d[key]));
      const pts = data.map((d, i) => {
        const x = pad + (i / (data.length - 1)) * (w - pad * 2);
        const y = h - pad - (d[key] / (max || 1)) * (h - pad * 2);
        return `${x},${y}`;
      });
      return 'M' + pts.join('L');
    },

    buildAreaPath(data, key, w, h, pad) {
      if (!data || !data.length) return '';
      const line = this.buildLinePath(data, key, w, h, pad);
      const lastX = pad + (w - pad * 2);
      const firstX = pad;
      const baseY = h - pad;
      return line + `L${lastX},${baseY} L${firstX},${baseY}Z`;
    },

    resolvePriorityAction(p) {
      if (!p.actionType) return;
      if (p.trekId) {
        this.selectedTrekId = p.trekId;
      }
      if (p.actionType === 'slots') {
        const trek = this.assignedTreks.find(t => t.id === p.trekId);
        if (trek) this.openSlotModal(trek);
      } else if (p.actionType === 'status') {
        const trek = this.assignedTreks.find(t => t.id === p.trekId);
        if (trek) this.openStatusModal(trek);
      } else if (p.actionType === 'attendance') {
        const trek = this.assignedTreks.find(t => t.id === p.trekId) || this.assignedTreks[0];
        if (trek) this.selectTrekForAttendance(trek);
      } else if (p.actionType === 'participants') {
        this.goTab('participants');
      } else if (p.actionType === 'checklist') {
        const trek = this.assignedTreks.find(t => t.id === p.trekId);
        if (trek) this.openChecklistModal(trek);
      }
    },

    openExportDetailModal(t) {
      this.exportDetailTrek = t;
      this.showExportDetailModal = true;
    },

    openDownloadPromptModal(t) {
      this.downloadPromptTrek = t;
      this.showDownloadPromptModal = true;
    },

    async generatePDFReport(t, type) {
      this.downloadPending = true;
      let checklist = [];
      if (type === 'full') {
        try {
          const res = await fetch(`/api/guide/treks/${t.id}/checklist`);
          if (res.ok) {
            const data = await res.json();
            checklist = data.map(item => item.itemName);
          }
        } catch (e) {
          console.error(e);
        }
      }

      const trekParticipants = this.participants.filter(p => p.trekId === t.id);

      // Create PDF element container
      const container = document.createElement('div');
      container.style.padding = '30px';
      container.style.fontFamily = "'DM Sans', 'Helvetica Neue', sans-serif";
      container.style.color = '#4a3728'; 
      container.style.background = '#fff';

      let html = '';

      // PDF Header
      html += `
        <div style="border-bottom: 2px solid #1a2e1a; padding-bottom: 15px; margin-bottom: 25px; display: flex; justify-content: space-between; align-items: flex-end;">
          <div>
            <div style="font-size: 1.6rem; font-weight: 800; font-family: 'Playfair Display', serif; color: #1a2e1a; letter-spacing: -0.5px;">TrailSync <span style="color: #c8922a; font-weight: 400;">Reports</span></div>
            <div style="font-size: 0.75rem; color: #8c8070; text-transform: uppercase; letter-spacing: 1px; margin-top: 3px;">Trek Guide Operations panel</div>
          </div>
          <div style="text-align: right;">
            <div style="font-size: 0.72rem; font-family: 'Space Mono', monospace; font-weight: 700; color: #c8922a; background: rgba(200,146,42,0.1); padding: 3px 8px; border-radius: 4px; display: inline-block;">${t.batchCode}</div>
            <div style="font-size: 0.7rem; color: #8c8070; margin-top: 4px;">Generated on: ${new Date().toLocaleDateString()}</div>
          </div>
        </div>
      `;

      if (type === 'full') {
        // Full Summary Report
        html += `
          <div style="margin-bottom: 25px;">
            <h2 style="font-family: 'Playfair Display', serif; font-size: 1.4rem; color: #1a2e1a; margin-bottom: 12px; font-weight: 800;">Trek Batch Summary Report</h2>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; background: #fdfaf5; border: 1px solid rgba(26,46,26,0.08); padding: 15px; border-radius: 8px; margin-bottom: 20px;">
              <div>
                <div style="font-size: 0.72rem; color: #8c8070; text-transform: uppercase; font-weight: 600;">Adventure Name</div>
                <div style="font-size: 0.95rem; font-weight: 700; color: #1a2e1a; margin-top: 2px;">${t.name}</div>
              </div>
              <div>
                <div style="font-size: 0.72rem; color: #8c8070; text-transform: uppercase; font-weight: 600;">Location</div>
                <div style="font-size: 0.95rem; font-weight: 700; color: #1a2e1a; margin-top: 2px;">📍 ${t.location}</div>
              </div>
              <div style="margin-top: 10px;">
                <div style="font-size: 0.72rem; color: #8c8070; text-transform: uppercase; font-weight: 600;">Schedule Dates</div>
                <div style="font-size: 0.88rem; font-weight: 600; color: #1a2e1a; margin-top: 2px;">${this.formatDate(t.startDate)} — ${this.formatDate(t.endDate)}</div>
              </div>
              <div style="margin-top: 10px;">
                <div style="font-size: 0.72rem; color: #8c8070; text-transform: uppercase; font-weight: 600;">Base Price</div>
                <div style="font-size: 0.88rem; font-weight: 600; color: #1a2e1a; margin-top: 2px;">₹${t.price ? t.price.toLocaleString() : '5,000'}</div>
              </div>
            </div>

            <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 25px;">
              <div style="border: 1px solid rgba(26,46,26,0.07); padding: 10px; border-radius: 6px; text-align: center; background: #fff;">
                <div style="font-size: 1.4rem; font-family: 'Playfair Display', serif; font-weight: 800; color: #1a2e1a;">${t.registered}/${t.slots}</div>
                <div style="font-size: 0.62rem; color: #8c8070; font-weight: 700; text-transform: uppercase; margin-top: 4px;">Occupancy</div>
              </div>
              <div style="border: 1px solid rgba(26,46,26,0.07); padding: 10px; border-radius: 6px; text-align: center; background: #fff;">
                <div style="font-size: 1.4rem; font-family: 'Playfair Display', serif; font-weight: 800; color: #1a2e1a;">${t.registered > 0 ? Math.round((t.registered / t.slots) * 100) : 0}%</div>
                <div style="font-size: 0.62rem; color: #8c8070; font-weight: 700; text-transform: uppercase; margin-top: 4px;">Fill Rate</div>
              </div>
              <div style="border: 1px solid rgba(26,46,26,0.07); padding: 10px; border-radius: 6px; text-align: center; background: #fff;">
                <div style="font-size: 1.4rem; font-family: 'Playfair Display', serif; font-weight: 800; color: #1a2e1a;">${t.slots - t.registered}</div>
                <div style="font-size: 0.62rem; color: #8c8070; font-weight: 700; text-transform: uppercase; margin-top: 4px;">Slots Left</div>
              </div>
              <div style="border: 1px solid rgba(26,46,26,0.07); padding: 10px; border-radius: 6px; text-align: center; background: #fff;">
                <div style="font-size: 1.4rem; font-family: 'Playfair Display', serif; font-weight: 800; color: #c8922a;">${t.status}</div>
                <div style="font-size: 0.62rem; color: #8c8070; font-weight: 700; text-transform: uppercase; margin-top: 4px;">Batch Status</div>
              </div>
            </div>
          </div>
        `;

        if (checklist.length > 0) {
          html += `
            <div style="margin-bottom: 25px;">
              <h3 style="font-family: 'Playfair Display', serif; font-size: 1.1rem; color: #1a2e1a; margin-bottom: 8px; font-weight: 700;">Trek Checklist Items</h3>
              <div style="display: flex; flex-wrap: wrap; gap: 6px;">
                ${checklist.map(item => `<span style="font-size: 0.72rem; background: #f5f0e8; color: #1a2e1a; padding: 4px 10px; border-radius: 4px; border: 1px solid rgba(26,46,26,0.08);">${item}</span>`).join('')}
              </div>
            </div>
          `;
        }
      } else {
        // Participants List Only Header
        html += `
          <div style="margin-bottom: 20px;">
            <h2 style="font-family: 'Playfair Display', serif; font-size: 1.4rem; color: #1a2e1a; margin-bottom: 4px; font-weight: 800;">Trek Participant Directory</h2>
            <div style="font-size: 0.82rem; color: #8c8070;">Trek: <strong style="color: #1a2e1a;">${t.name}</strong> · Batch: <strong style="color: #1a2e1a;">${t.batchCode}</strong> · Location: <strong>📍 ${t.location}</strong></div>
          </div>
        `;
      }

      // Participant Table
      html += `
        <div>
          <h3 style="font-family: 'Playfair Display', serif; font-size: 1.1rem; color: #1a2e1a; margin-bottom: 10px; font-weight: 700; border-bottom: 1px solid rgba(26,46,26,0.1); padding-bottom: 5px;">Trekker Roster (${trekParticipants.length} registered)</h3>
          <table style="width: 100%; border-collapse: collapse; font-size: 0.74rem; text-align: left;">
            <thead>
              <tr style="background: #1a2e1a; color: #fff;">
                <th style="padding: 8px; border: 1px solid #1a2e1a;">Trekker ID</th>
                <th style="padding: 8px; border: 1px solid #1a2e1a;">Name</th>
                <th style="padding: 8px; border: 1px solid #1a2e1a;">Contact Information</th>
                <th style="padding: 8px; border: 1px solid #1a2e1a; text-align: center;">Blood</th>
                <th style="padding: 8px; border: 1px solid #1a2e1a; text-align: center;">Emergency Contact</th>
                <th style="padding: 8px; border: 1px solid #1a2e1a; text-align: center;">Payment</th>
              </tr>
            </thead>
            <tbody>
              ${trekParticipants.map((p, idx) => `
                <tr style="background: ${idx % 2 === 0 ? '#fff' : '#fdfaf5'}; border-bottom: 1px solid rgba(26,46,26,0.08);">
                  <td style="padding: 8px; font-family: 'Space Mono', monospace; font-weight: bold; color: #1a2e1a;">${this.displayTrekkerId(p)}</td>
                  <td style="padding: 8px; font-weight: 600; color: #1a2e1a;">${p.name}</td>
                  <td style="padding: 8px;">
                    <div>📧 ${p.email}</div>
                    <div style="margin-top: 2px;">📞 ${p.phone || '—'}</div>
                  </td>
                  <td style="padding: 8px; text-align: center; font-family: 'Space Mono', monospace; color: #dc2626; font-weight: bold;">${p.bloodGroup || '—'}</td>
                  <td style="padding: 8px; text-align: center;">
                    <div>${p.emergencyContact || '—'}</div>
                    <div style="font-size: 0.66rem; color: #8c8070; margin-top: 1px;">${p.emergencyPhone || ''}</div>
                  </td>
                  <td style="padding: 8px; text-align: center;">
                    <span style="font-size: 0.64rem; padding: 2px 6px; border-radius: 4px; font-weight: bold; text-transform: uppercase; background: ${p.paymentStatus === 'Paid' ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.1)'}; color: ${p.paymentStatus === 'Paid' ? '#10b981' : '#d97706'}; border: 1px solid ${p.paymentStatus === 'Paid' ? 'rgba(16,185,129,0.2)' : 'rgba(245,158,11,0.2)'};">
                      ${p.paymentStatus || 'Paid'}
                    </span>
                  </td>
                </tr>
              `).join('')}
              ${trekParticipants.length === 0 ? `
                <tr>
                  <td colspan="6" style="padding: 20px; text-align: center; color: #8c8070; font-style: italic;">No trekkers are currently registered for this batch.</td>
                </tr>
              ` : ''}
            </tbody>
          </table>
        </div>
      `;

      container.innerHTML = html;
      document.body.appendChild(container);

      const opt = {
        margin:       0.4,
        filename:     `TrailSync_${t.batchCode}_${type === 'full' ? 'Full_Report' : 'Roster'}.pdf`,
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { scale: 2, useCORS: true },
        jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' }
      };

      try {
        await html2pdf().from(container).set(opt).save();
        this.showToast('PDF downloaded successfully!', 'success');
      } catch (err) {
        console.error(err);
        this.showToast('Failed to generate PDF. Please try again.', 'error');
      } finally {
        document.body.removeChild(container);
        this.downloadPending = false;
        this.showDownloadPromptModal = false;
      }
    },
  },

  mounted() {
    this.fetchStaffData();
    this.fetchSocialGroups();
    this.fetchStaffTickets();
    this.startCountdown();

    this.hashListener = this.handleHashChange.bind(this);
    window.addEventListener('hashchange', this.hashListener);

    const hash = window.location.hash.slice(1);
    if (hash) {
      // When the page is loaded/refreshed, never auto-open a group chat
      // If the URL points to a specific group (social/group/:id) reset to the social overview
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

    // Polling interval for social groups & messages
    this.socialPollInterval = setInterval(() => {
      this.fetchSocialGroups();
      if (this.activeTab === 'social' && this.selectedSocialTrekId) {
        this.fetchSocialGroupMessages(this.selectedSocialTrekId, { silent: true });
      }
    }, 15000);
  },

  beforeUnmount() {
    if (this.countdownTimer) clearInterval(this.countdownTimer);
    if (this.socialPollInterval) clearInterval(this.socialPollInterval);
    window.removeEventListener('hashchange', this.hashListener);
  },
};
</script>
