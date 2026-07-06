<template>
      <section v-if="activeTab==='support_tickets'" class="tab-content">
        <!-- Filter Tabs Bar -->
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1.25rem;">
          <div class="ticket-tabs" style="margin-bottom:0; border-bottom:none; padding-bottom:0;">
            <button class="ticket-tab-btn" :class="{ active: ticketStatusFilter === 'All' }" @click="ticketStatusFilter = 'All'">
              All
              <span class="ticket-tab-count">{{ supportTickets.length }}</span>
            </button>
            <button class="ticket-tab-btn" :class="{ active: ticketStatusFilter === 'Open' }" @click="ticketStatusFilter = 'Open'">
              Open
              <span class="ticket-tab-count">{{ supportTickets.filter(t => t.status === 'Open').length }}</span>
            </button>
            <button class="ticket-tab-btn" :class="{ active: ticketStatusFilter === 'Resolved' }" @click="ticketStatusFilter = 'Resolved'">
              Resolved
              <span class="ticket-tab-count">{{ supportTickets.filter(t => t.status === 'Resolved').length }}</span>
            </button>
          </div>
        </div>

        <div v-if="filteredTickets.length === 0" class="empty-state">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
          <p>No support tickets found.</p>
        </div>
        <div v-else class="ts-table-wrap">
          <table class="ts-table">
            <thead>
              <tr>
                <th class="col-hide-mobile">Ticket ID</th>
                <th>Date</th>
                <th>Sender</th>
                <th class="col-hide-mobile">Category</th>
                <th class="col-hide-mobile">Subject</th>
                <th class="col-hide-mobile">Status</th>
                <th style="text-align:right;">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="t in filteredTickets" :key="t.id">
                <td class="mono font-bold col-hide-mobile" style="color:var(--forest)">{{ t.ticketId || ('TS26AS' + String(t.id).padStart(3, '0')) }}</td>
                <td class="mono" style="font-size:0.78rem; white-space:nowrap;">{{ t.createdAt ? t.createdAt.split(' ')[0] : '—' }}</td>
                <td>
                  <div style="font-weight:600; color:var(--forest)">{{ t.name }}</div>
                  <div style="font-size:0.75rem; color:var(--stone)" class="col-hide-mobile">{{ t.email }}</div>
                </td>
                <td class="col-hide-mobile">
                  <span class="category-tag" :class="getCategoryClass(t.category)">
                    {{ t.category || 'General Inquiry' }}
                  </span>
                </td>
                <td class="col-hide-mobile" style="font-weight:600; font-size:0.85rem; max-width:260px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">
                  {{ t.cleanSubject || t.subject }}
                </td>
                <td class="col-hide-mobile">
                  <span class="status-pill" :class="t.status === 'Open' ? 'status-pending' : 'status-approved'">
                    {{ t.status }}
                  </span>
                </td>
                <td>
                  <div class="action-btns" style="justify-content:flex-end;">
                    <button class="act-btn act-view" style="border: 1px solid rgba(61,107,61,0.25); padding: 4px 10px; display: inline-flex; align-items: center; gap: 4px;" @click="openTicketDetails(t)" title="View Details">
                      <svg viewBox="0 0 24 24" class="act-btn-icon"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                      <span class="btn-text-hide-mobile">View</span>
                    </button>
                    <button class="act-btn act-assign" v-if="t.status === 'Open'" style="display: inline-flex; align-items: center; gap: 4px;" @click="resolveTicket(t)" title="Resolve Ticket">
                      <svg viewBox="0 0 24 24" class="act-btn-icon" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                      <span class="btn-text-hide-mobile">Resolve</span>
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- ════════ SUPPORT TICKET DETAILS MODAL (Extracted from SAdminModals) ════════ -->
        <div v-if="showTicketDetailsModal && selectedTicketDetails" class="ts-modal-overlay" @click.self="closeTicketDetails">
          <div class="ts-modal large">
            <div class="ts-modal-header">
              <h3 class="ts-modal-title">Ticket — {{ selectedTicketDetails.ticketId || ('TS26AS' + String(selectedTicketDetails.id).padStart(3, '0')) }}</h3>
              <button class="modal-close" @click="closeTicketDetails">✕</button>
            </div>
            <div class="ts-modal-body" style="padding: 1.5rem; max-height: 480px; overflow-y: auto;">
              <div class="details-modal-grid">
                
                <!-- Left Side: Ticket Description -->
                <div style="border-right: 1px solid var(--stone-light); padding-right: 1.5rem;">
                  <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem; background: var(--snow); padding: 0.75rem 1rem; border-radius: 6px; border: 1px solid rgba(26,46,26,0.06);">
                    <div>
                      <span class="category-tag" :class="getCategoryClass(selectedTicketDetails.category)" style="margin-right: 8px;">
                        {{ selectedTicketDetails.category || 'General Inquiry' }}
                      </span>
                      <span class="status-pill" :class="selectedTicketDetails.status === 'Open' ? 'status-pending' : 'status-approved'">
                        {{ selectedTicketDetails.status }}
                      </span>
                    </div>
                    <div class="mono" style="font-size: 0.78rem; color: var(--stone);">
                      Submitted: {{ selectedTicketDetails.createdAt ? selectedTicketDetails.createdAt.split(' ')[0] : '—' }}
                    </div>
                  </div>

                  <div style="margin-bottom: 1.25rem;">
                    <div style="font-size: 0.8rem; font-weight: 700; color: var(--forest); text-transform: uppercase; margin-bottom: 0.25rem;">Subject</div>
                    <div style="font-weight: 600; color: var(--bark); font-size: 1.05rem; line-height: 1.4;">
                      {{ selectedTicketDetails.cleanSubject || selectedTicketDetails.subject }}
                    </div>
                  </div>

                  <div>
                    <div style="font-size: 0.8rem; font-weight: 700; color: var(--forest); text-transform: uppercase; margin-bottom: 0.25rem;">Message Description</div>
                    <div style="font-size: 0.9rem; color: var(--stone); line-height: 1.5; white-space: pre-wrap; background: var(--snow); padding: 1rem; border-radius: 6px; border: 1px solid rgba(26,46,26,0.06); min-height: 120px; max-height: 200px; overflow-y: auto;">
                      {{ selectedTicketDetails.message }}
                    </div>
                  </div>
                </div>

                <!-- Right Side: User Profile Details -->
                <div>
                  <div v-if="selectedTicketDetails.userDetails">
                    <div style="text-align: center; margin-bottom: 1.25rem;">
                      <img :src="selectedTicketDetails.userDetails.photoUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&h=300&fit=crop'" style="width: 90px; height: 90px; border-radius: 50%; object-fit: cover; border: 2px solid var(--forest); box-shadow: 0 4px 8px rgba(0,0,0,0.1); margin-bottom: 0.5rem;" />
                      <h4 style="font-weight: 700; color: var(--forest); margin-bottom: 0.1rem;">{{ selectedTicketDetails.userDetails.name }}</h4>
                      <div style="font-size: 0.8rem; color: var(--stone); font-family: monospace;">ID: {{ selectedTicketDetails.userDetails.memberId }}</div>
                    </div>

                    <div class="staff-detail-info" style="background: var(--snow); padding: 1rem; border-radius: 6px; border: 1px solid var(--stone-light); font-size: 0.82rem;">
                      <div><strong>Email:</strong> {{ selectedTicketDetails.userDetails.email }}</div>
                      <div><strong>Phone:</strong> {{ selectedTicketDetails.userDetails.phone || '—' }}</div>
                      <div v-if="selectedTicketDetails.userDetails.role === 'staff'">
                        <div><strong>Designation:</strong> {{ selectedTicketDetails.userDetails.designation || 'Trek Staff' }}</div>
                        <div><strong>Experience:</strong> {{ selectedTicketDetails.userDetails.experience || '—' }} years</div>
                        <div><strong>Skills:</strong> {{ selectedTicketDetails.userDetails.skills || '—' }}</div>
                        <div><strong>Certifications:</strong> {{ selectedTicketDetails.userDetails.certifications || '—' }}</div>
                      </div>
                      <div v-else>
                        <div><strong>City:</strong> {{ selectedTicketDetails.userDetails.city || '—' }}</div>
                        <div><strong>Emergency Contact:</strong> {{ selectedTicketDetails.userDetails.emergency || '—' }}</div>
                        <div><strong>Total Bookings:</strong> <span class="mono" style="font-weight:700; color:var(--forest);">{{ selectedTicketDetails.userDetails.bookingsList ? selectedTicketDetails.userDetails.bookingsList.length : 0 }}</span></div>
                      </div>
                      <div><strong>Joined:</strong> {{ formatDate(selectedTicketDetails.userDetails.registered) }}</div>
                      <div><strong>Bio:</strong> {{ selectedTicketDetails.userDetails.bio || 'No bio provided.' }}</div>
                    </div>
                  </div>
                  
                  <div v-else style="text-align: center; padding: 2rem 1rem; background: var(--snow); border-radius: 6px; border: 1px dashed var(--stone); height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center;">
                    <svg viewBox="0 0 24 24" width="36" height="36" style="stroke: var(--stone); opacity: 0.6; margin-bottom: 0.75rem;" fill="none" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                    <h5 style="font-size: 0.9rem; color: var(--forest); font-weight: 700; margin-bottom: 0.25rem;">Guest Submitter</h5>
                    <p style="font-size: 0.78rem; color: var(--stone); line-height: 1.4; margin: 0;">
                      No registered account matches this ticket's email address ({{ selectedTicketDetails.email }}).
                    </p>
                  </div>
                </div>

                <!-- Resolution Message (show when resolved or when resolving) -->
                <div v-if="selectedTicketDetails.status === 'Resolved' && selectedTicketDetails.resolutionMessage" style="margin-top: 1.25rem; background: rgba(40,167,69,0.06); border: 1px solid rgba(40,167,69,0.2); border-radius: 8px; padding: 1rem; grid-column: 1 / -1;">
                  <div style="font-size: 0.78rem; font-weight: 700; color: #28a745; text-transform: uppercase; margin-bottom: 0.5rem;">✓ Admin Resolution Note</div>
                  <div style="font-size: 0.88rem; color: var(--bark); line-height: 1.5; white-space: pre-wrap;">{{ selectedTicketDetails.resolutionMessage }}</div>
                </div>

                <!-- Resolution message input (only when Open) -->
                <div v-if="selectedTicketDetails.status === 'Open'" style="margin-top: 1.25rem; grid-column: 1 / -1;">
                  <div style="font-size: 0.8rem; font-weight: 700; color: var(--forest); text-transform: uppercase; margin-bottom: 0.4rem;">Resolution Note (Optional)</div>
                  <textarea v-model="resolutionInput" rows="3" placeholder="Add a message to the user about this resolution..." style="width: 100%; padding: 0.65rem 0.85rem; border: 1px solid rgba(26,46,26,0.15); border-radius: 6px; background: #fff; font-size: 0.85rem; resize: vertical; font-family: inherit;"></textarea>
                </div>
              </div>
            </div>
            <div class="ts-modal-footer" style="display: flex; justify-content: flex-end; gap: 0.5rem; padding: 1rem 1.5rem;">
              <button class="btn-primary-ts" @click="closeTicketDetails" style="background: #e2e8f0; border-color: #cbd5e0; color: #4a5568;">Close</button>
              <button class="btn-primary-ts" v-if="selectedTicketDetails.status === 'Open'" @click="resolveTicket(selectedTicketDetails, resolutionInput)">Resolve Ticket</button>
            </div>
          </div>
        </div>

      </section>
</template>

<script>
/**
 * =========================================================================
 * TabSupportTickets.vue
 * =========================================================================
 * Support Tickets panel — lists all user and staff support submissions,
 * leave requests, and bug reports with filtering by status (Open / Resolved)
 * and category. Provides ticket detail overlays with user profile, booking
 * history, and an admin resolution message field.
 *
 * This component uses Vue 3 Options API with local state for modal management
 * and injects `adminDash` from the root `AdminDashboard.vue` coordinator to
 * access supportTickets, users, staffList, allBookings, and trigger shared
 * actions (loadData, showToast).
 *
 * Key Sections:
 * - data: ticketStatusFilter, showTicketDetailsModal, selectedTicketDetails
 * - Computed: filteredTickets (status + search), getCategoryClass
 * - Methods: Ticket detail (openTicketDetails, closeTicketDetails)
 * - Methods: Resolution (resolveTicket — POST /api/admin/support_tickets/resolve)
 */
export default {
  name: 'TabSupportTickets',
  inject: ['adminDash'],
  data() {
    return {
      // Local state
      ticketStatusFilter: 'All',
      showTicketDetailsModal: false,
      selectedTicketDetails: null,
      resolutionInput: ''
    };
  },

  computed: {
    // Injected parent fields
    activeTab() {
      return this.adminDash.activeTab;
    },
    supportTickets() {
      return this.adminDash.supportTickets || [];
    },

    // Filter tickets based on status tab and global search query
    filteredTickets() {
      const ticketsList = this.adminDash.supportTickets || [];
      let list = ticketsList;

      if (this.ticketStatusFilter !== 'All') {
        list = list.filter(t => t.status === this.ticketStatusFilter);
      }

      const q = (this.adminDash.searchQuery || '').toLowerCase().trim();
      if (q) {
        list = list.filter(t => {
          const formattedId = `ts26#${String(t.id).padStart(3, '0')}`.toLowerCase();
          const category = (t.category || '').toLowerCase();
          const cleanSubject = (t.cleanSubject || '').toLowerCase();
          return t.name.toLowerCase().includes(q) ||
                 t.email.toLowerCase().includes(q) ||
                 t.subject.toLowerCase().includes(q) ||
                 t.message.toLowerCase().includes(q) ||
                 formattedId.includes(q) ||
                 category.includes(q) ||
                 cleanSubject.includes(q) ||
                 String(t.id).includes(q);
        });
      }
      return list;
    }
  },

  methods: {
    // Date formatting helper
    formatDate(dateStr) {
      if (!dateStr) return '';
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    },

    // Category style class helper
    getCategoryClass(category) {
      const cat = (category || '').toLowerCase();
      if (cat.includes('payment') || cat.includes('refund')) return 'tag-payment';
      if (cat.includes('leave') || cat.includes('availability') || cat.includes('sick')) return 'tag-leave';
      return 'tag-general';
    },

    // ── Ticket Detail Actions ──
    openTicketDetails(ticket) {
      const usersList = this.adminDash.users || [];
      const staffList = this.adminDash.staffList || [];
      const allBookings = this.adminDash.allBookings || [];

      const user = usersList.find(u => u.id === ticket.userId);
      if (user) {
        const photos = [
          "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&h=300&fit=crop",
          "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=300&fit=crop",
          "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&h=300&fit=crop",
          "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300&h=300&fit=crop",
          "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=300&h=300&fit=crop"
        ];
        user.photoUrl = photos[user.id % photos.length];
        user.bookingsList = allBookings.filter(b => b.userId === user.id);
        ticket.userDetails = user;
      } else {
        const staff = staffList.find(s => s.id === ticket.userId);
        if (staff) {
          ticket.userDetails = {
            id: staff.id,
            memberId: staff.memberId,
            name: staff.name,
            email: staff.contact,
            phone: staff.phone,
            city: '—',
            emergency: '—',
            registered: staff.joined,
            bookingsList: [],
            bio: 'Trek Guide / Staff member',
            photoUrl: staff.photoUrl
          };
        } else {
          ticket.userDetails = null;
        }
      }
      this.selectedTicketDetails = ticket;
      this.resolutionInput = ticket.resolutionMessage || '';
      this.showTicketDetailsModal = true;
    },
    closeTicketDetails() {
      this.showTicketDetailsModal = false;
      this.selectedTicketDetails = null;
      this.resolutionInput = '';
    },

    // ── Ticket Resolution ──
    async resolveTicket(ticket, resolutionMessage) {
      let finalMessage = resolutionMessage;
      if (resolutionMessage === undefined) {
        const promptMsg = window.prompt("Enter resolution message (optional):", "");
        if (promptMsg === null) return;
        finalMessage = promptMsg;
      }
      try {
        const res = await fetch(`/api/admin/support_tickets/resolve/${ticket.id}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ resolution_message: finalMessage })
        });
        if (res.ok) {
          const tId = ticket.ticketId || `TS26AS${String(ticket.id).padStart(3, '0')}`;
          this.adminDash.showToast(`Ticket ${tId} resolved`);
          if (this.selectedTicketDetails && this.selectedTicketDetails.id === ticket.id) {
            this.selectedTicketDetails.status = 'Resolved';
            this.selectedTicketDetails.resolutionMessage = finalMessage;
          }
          this.adminDash.loadData();
          this.closeTicketDetails();
        } else {
          this.adminDash.showToast('Failed to resolve ticket');
        }
      } catch (_) {
        this.adminDash.showToast('Failed to resolve ticket (error)');
      }
    }
  }
};
</script>
