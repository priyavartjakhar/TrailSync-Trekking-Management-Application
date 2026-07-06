<template>
      <div class="tab-content">
        <!-- Page Header -->
        <div class="page-header" style="margin-bottom: 1.5rem;">
          <div>
            <div class="section-eyebrow">Helpdesk</div>
            <div class="section-title">Support & <em>Leaves</em></div>
          </div>
          <button class="btn-back-home" @click="goTab('dashboard')"><i class="bi bi-house-door-fill me-1"></i>Back to Home</button>
        </div>

        <div class="row g-4">
          <!-- Left side: Forms -->
          <div class="col-lg-6">
            <!-- Support Ticket Card -->
            <div class="ts-card p-4 mb-4" style="border: 1px solid rgba(26,46,26,0.08); background: #ffffff;">
              <h3 style="font-family:'Playfair Display',serif; font-size: 1.3rem; color: var(--forest); margin-bottom: 1.25rem; border-bottom: 1px solid rgba(26,46,26,0.08); padding-bottom: 0.5rem">
                <i class="bi bi-envelope-paper-fill me-2" style="color: var(--gold)"></i>Raise a Support Ticket
              </h3>
              <form @submit.prevent="submitStaffTicket" style="display: flex; flex-direction: column; gap: 1rem;">
                <div class="form-group">
                  <label style="font-weight: 600; font-size: 0.82rem; margin-bottom: 0.25rem; display: block; color: var(--forest);">Category</label>
                  <select v-model="newTicket.category" class="form-select" style="font-size: 0.85rem; border: 1.5px solid var(--stone) !important; color: var(--bark) !important; background-color: #ffffff !important;">
                    <option value="General">General Inquiry</option>
                    <option value="Bug">Technical Issue / Bug</option>
                    <option value="Feedback">Feedback & Suggestions</option>
                  </select>
                </div>
                <div class="form-group">
                  <label style="font-weight: 600; font-size: 0.82rem; margin-bottom: 0.25rem; display: block; color: var(--forest);">Subject</label>
                  <input v-model="newTicket.subject" type="text" class="form-control" placeholder="What is the issue about?" style="font-size: 0.85rem; border: 1.5px solid var(--stone) !important; color: var(--bark) !important; background-color: #ffffff !important;" required />
                </div>
                <div class="form-group">
                  <label style="font-weight: 600; font-size: 0.82rem; margin-bottom: 0.25rem; display: block; color: var(--forest);">Description / Message</label>
                  <textarea v-model="newTicket.message" class="form-control" rows="4" placeholder="Describe your concern in detail..." style="font-size: 0.85rem; border: 1.5px solid var(--stone) !important; color: var(--bark) !important; background-color: #ffffff !important;" required></textarea>
                </div>
                <button type="submit" class="btn btn-primary-ts w-100" style="padding: 0.6rem; font-weight: 700;" :disabled="submittingSupport">
                  {{ submittingSupport ? 'Submitting...' : 'Submit Ticket' }}
                </button>
              </form>
            </div>

            <!-- Leave Request Card -->
            <div class="ts-card p-4" style="border: 1px solid rgba(26,46,26,0.08); background: #ffffff;">
              <h3 style="font-family:'Playfair Display',serif; font-size: 1.3rem; color: var(--forest); margin-bottom: 1.25rem; border-bottom: 1px solid rgba(26,46,26,0.08); padding-bottom: 0.5rem">
                <i class="bi bi-calendar-plus-fill me-2" style="color: var(--gold)"></i>Request Leave / Time Off
              </h3>
              <form @submit.prevent="submitLeaveRequest" style="display: flex; flex-direction: column; gap: 1rem;">
                <div class="row g-2">
                  <div class="col-md-6">
                    <div class="form-group">
                      <label style="font-weight: 600; font-size: 0.82rem; margin-bottom: 0.25rem; display: block; color: var(--forest);">Start Date</label>
                      <input v-model="leaveRequest.startDate" type="date" class="form-control" style="font-size: 0.85rem; border: 1.5px solid var(--stone) !important; color: var(--bark) !important; background-color: #ffffff !important;" required />
                    </div>
                  </div>
                  <div class="col-md-6">
                    <div class="form-group">
                      <label style="font-weight: 600; font-size: 0.82rem; margin-bottom: 0.25rem; display: block; color: var(--forest);">End Date</label>
                      <input v-model="leaveRequest.endDate" type="date" class="form-control" style="font-size: 0.85rem; border: 1.5px solid var(--stone) !important; color: var(--bark) !important; background-color: #ffffff !important;" required />
                    </div>
                  </div>
                </div>
                <div class="form-group">
                  <label style="font-weight: 600; font-size: 0.82rem; margin-bottom: 0.25rem; display: block; color: var(--forest);">Reason for Leave</label>
                  <textarea v-model="leaveRequest.reason" class="form-control" rows="3" placeholder="Provide reason for leave (medical, personal etc.)..." style="font-size: 0.85rem; border: 1.5px solid var(--stone) !important; color: var(--bark) !important; background-color: #ffffff !important;" required></textarea>
                </div>
                <div class="alert alert-info py-2 px-3 mb-0" style="font-size: 0.76rem; border-left: 3px solid #0dcaf0; color: #31708f; background: #d9edf7; border-color: #bce8f1;">
                  <strong>Note:</strong> Resolved leave requests will automatically mark your calendar as busy/unavailable.
                </div>
                <button type="submit" class="btn btn-primary-ts w-100" style="padding: 0.6rem; background: var(--forest); border-color: var(--forest); color: #ffffff !important; font-weight: 700;" :disabled="submittingLeave">
                  {{ submittingLeave ? 'Submitting...' : 'Request Leave' }}
                </button>
              </form>
            </div>
          </div>

          <!-- Right side: History -->
          <div class="col-lg-6">
            <div class="ts-card p-4 h-100" style="border: 1px solid rgba(26,46,26,0.08); background: #ffffff; display: flex; flex-direction: column;">
              <div class="d-flex justify-content-between align-items-center mb-3 border-bottom pb-2">
                <h3 style="font-family:'Playfair Display',serif; font-size: 1.3rem; color: var(--forest); margin: 0;">
                  <i class="bi bi-clock-history me-2" style="color: var(--gold)"></i>Request History
                </h3>
                <span class="badge bg-forest text-white" style="font-size: 0.75rem; padding: 4px 8px;">
                  {{ supportTickets.length }} requests
                </span>
              </div>

              <!-- List of tickets -->
              <div style="flex: 1; overflow-y: auto; max-height: 520px; padding-right: 4px;">
                <div v-if="!supportTickets.length" class="text-center py-5 text-muted">
                  <i class="bi bi-ticket-detailed fs-2 mb-2 d-block" style="color: var(--stone); opacity: 0.5;"></i>
                  No support tickets or leave requests submitted yet.
                </div>
                <div v-else class="d-flex flex-column gap-3">
                  <div v-for="t in supportTickets" :key="t.id" class="p-3 rounded" style="border: 1px solid var(--stone-light); background: var(--snow);">
                    <div class="d-flex justify-content-between align-items-center mb-2">
                      <span style="font-family: monospace; font-weight: bold; font-size: 0.8rem; color: var(--forest-light);">
                        {{ t.ticketId || ('TS26AS' + String(t.id).padStart(3, '0')) }}
                      </span>
                      <div class="d-flex gap-2 align-items-center">
                        <span class="category-tag" :class="getCategoryClass(t.category)" style="font-size: 0.6rem; padding: 1px 6px;">
                          {{ t.category || 'General' }}
                        </span>
                        <span class="status-pill font-bold" :class="t.status === 'Resolved' ? 'status-completed' : 'status-pending'" style="font-size: 0.65rem; padding: 2px 6px; border-radius: 4px;">
                          {{ t.status }}
                        </span>
                      </div>
                    </div>
                    <h5 style="font-weight: 700; color: var(--forest); font-size: 0.9rem; margin-bottom: 0.25rem;">
                      {{ t.cleanSubject || t.subject }}
                    </h5>
                    <p class="text-muted mb-2" style="font-size: 0.8rem; white-space: pre-wrap; line-height: 1.4;">
                      {{ t.message }}
                    </p>
                    <div class="text-muted text-end" style="font-size: 0.68rem;">
                      Submitted on: {{ t.createdAt }}
                    </div>
                    <!-- Resolution message -->
                    <div v-if="t.status === 'Resolved'" style="margin-top: 0.6rem; background: rgba(40,167,69,0.06); border: 1px solid rgba(40,167,69,0.2); border-radius: 6px; padding: 0.6rem 0.75rem;">
                      <div style="font-size: 0.65rem; font-weight: 700; color: #28a745; text-transform: uppercase; margin-bottom: 3px;">✓ Admin Response</div>
                      <div style="font-size: 0.8rem; color: var(--bark); line-height: 1.4; white-space: pre-wrap;">{{ t.resolutionMessage || 'Resolved by administrator.' }}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
</template>

<script>
/**
 * =========================================================================
 * TabSupport.vue
 * =========================================================================
 * Inquiries panel where guides raise leave requests or log issues with the administrative office.
 * Uses 'staffDashComponent' options proxying to automatically route methods/state
 * read/writes directly to the parent 'StaffDashboard' instance.
 */

import { staffDashComponent } from './staffDashProxy';

export default staffDashComponent('TabSupport', {
  data() {
    return {
      supportTickets: [],
      submittingSupport: false,
      newTicket: { subject: '', category: 'General', message: '' },
      leaveRequest: { startDate: '', endDate: '', reason: '' },
      submittingLeave: false
    };
  },
  methods: {
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
        this.staffDash.showToast('Please fill in both subject and description.', 'error');
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
          this.staffDash.showToast(data.message || 'Support ticket submitted successfully!');
          this.newTicket = { subject: '', category: 'General', message: '' };
          await this.fetchStaffTickets();
        } else {
          this.staffDash.showToast(data.error || 'Failed to submit support ticket.', 'error');
        }
      } catch (e) {
        console.error("Error submitting support ticket:", e);
        this.staffDash.showToast('Server error while submitting support ticket.', 'error');
      } finally {
        this.submittingSupport = false;
      }
    },

    async submitLeaveRequest() {
      if (!this.leaveRequest.startDate || !this.leaveRequest.endDate || !this.leaveRequest.reason.trim()) {
        this.staffDash.showToast('Please fill in start date, end date, and reason.', 'error');
        return;
      }
      const start = new Date(this.leaveRequest.startDate);
      const end = new Date(this.leaveRequest.endDate);
      if (start > end) {
        this.staffDash.showToast('Start date must be before or equal to end date.', 'error');
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
          this.staffDash.showToast('Leave request submitted successfully for approval!');
          this.leaveRequest = { startDate: '', endDate: '', reason: '' };
          await this.fetchStaffTickets();
        } else {
          this.staffDash.showToast(data.error || 'Failed to submit leave request.', 'error');
        }
      } catch (e) {
        console.error("Error submitting leave request:", e);
        this.staffDash.showToast('Server error while submitting leave request.', 'error');
      } finally {
        this.submittingLeave = false;
      }
    }
  },
  mounted() {
    this.fetchStaffTickets();
  }
});
</script>
