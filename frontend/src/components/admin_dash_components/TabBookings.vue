<template>
      <section v-if="activeTab==='bookings'" class="tab-content">
        <div class="filter-bar">
          <button v-for="f in ['All','Booked','Cancelled','Completed']" :key="f"
            class="filter-btn" :class="{ active: bookingFilter===f }" @click="bookingFilter=f">{{ f }}</button>
        </div>
        <div class="ts-table-wrap">
          <table class="ts-table">
            <thead>
              <tr>
                <th>Booking ID</th>
                <th>Trekker ID</th>
                <th class="col-hide-mobile">User</th>
                <th class="col-hide-mobile">Batch ID</th>
                <th class="col-hide-mobile">Trek</th>
                <th class="col-hide-mobile">Booked On</th>
                <th class="col-hide-mobile">Status</th>
                <th class="col-hide-mobile">Payment</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="b in filteredBookings" :key="b.id">
                <td class="mono" style="font-size: 0.8rem;">{{ b.bookingId || ('#' + b.id) }}</td>
                <td class="mono" style="font-size: 0.8rem;">{{ b.trekkerId }}</td>
                <td class="col-hide-mobile"><span style="font-weight:600; color:var(--forest)">{{ b.user }}</span></td>
                <td class="mono col-hide-mobile" style="font-size: 0.8rem;">{{ b.batchCode }}</td>
                <td class="col-hide-mobile" style="font-weight:500;">{{ b.trek }}</td>
                <td class="mono col-hide-mobile">{{ formatDate(b.date) }}</td>
                <td class="col-hide-mobile"><span :class="'status-pill status-'+b.status.toLowerCase()">{{ b.status }}</span></td>
                <td class="col-hide-mobile">
                  <span :class="['status-pill', 
                    b.paymentStatus === 'Paid' ? 'status-open' : 
                    b.paymentStatus === 'Refunded' ? 'status-cancelled' : 'status-pending'
                  ]">{{ b.paymentStatus }}</span>
                </td>
                <td>
                  <div class="action-btns" style="display:flex; gap:6px;">
                    <button class="act-btn act-view" @click="viewBookingDetails(b)" title="View Details">
                      <svg viewBox="0 0 24 24" class="act-btn-icon"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                      <span class="btn-text-hide-mobile">View</span>
                    </button>
                    <button v-if="b.status==='Booked' && isTrekDateNotPassed(b.startDate)" class="act-btn act-delete-btn btn-hide-mobile" @click="cancelBooking(b)" title="Cancel Booking">
                      <svg viewBox="0 0 24 24" class="act-btn-icon" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>
                      <span class="btn-text-hide-mobile">Cancel</span>
                    </button>
                    <button v-if="b.status==='Cancelled' && b.paymentStatus!=='Refunded' && isTrekDateNotPassed(b.startDate)" class="act-btn act-assign btn-hide-mobile" @click="openRefundModal(b)" style="background: rgba(220, 53, 69, 0.1); color: var(--red); border-color: rgba(220, 53, 69, 0.2);" title="Refund Booking">
                      <svg viewBox="0 0 24 24" class="act-btn-icon" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                      <span class="btn-text-hide-mobile">Refund</span>
                    </button>
                  </div>
                </td>
              </tr>
              <tr v-if="!filteredBookings.length">
                <td colspan="9" style="text-align:center; padding:2rem; color:var(--stone)">No bookings match this filter.</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- ════════ BOOKING DETAILS MODAL (Extracted from SAdminModals) ════════ -->
        <div v-if="showBookingDetailsModal && selectedBookingDetails" class="ts-modal-overlay" @click.self="closeBookingDetails">
          <div class="ts-modal large">
            <div class="ts-modal-header">
              <h3 class="ts-modal-title">Booking Details — {{ selectedBookingDetails.booking.bookingId || ('#' + selectedBookingDetails.booking.id) }}</h3>
              <button class="modal-close" @click="closeBookingDetails">✕</button>
            </div>
            <div class="ts-modal-body" style="max-height: 480px; overflow-y: auto;">
              <div class="details-modal-grid">
                <!-- Left Side: Trekker Profile Info -->
                <div>
                  <div class="timeline-section-title" style="margin-bottom: 0.75rem;">Trekker Profile</div>
                  <div class="route-detail-info-block" style="margin-bottom: 1.5rem;">
                    <div><strong>Member ID:</strong> <span class="mono">{{ selectedBookingDetails.user.memberId }}</span></div>
                    <div><strong>Full Name:</strong> <span>{{ selectedBookingDetails.user.name }}</span></div>
                    <div><strong>Email:</strong> <span>{{ selectedBookingDetails.user.email }}</span></div>
                    <div><strong>Phone Number:</strong> <span class="mono">{{ selectedBookingDetails.user.phone || '—' }}</span></div>
                    <div><strong>City / Base:</strong> <span>{{ selectedBookingDetails.user.city || '—' }}</span></div>
                    <div><strong>Emergency Contact:</strong> <span class="mono">{{ selectedBookingDetails.user.emergency || '—' }}</span></div>
                    <div style="grid-column: 1 / -1; margin-top: 5px;">
                      <strong>Medical Bio / Info:</strong>
                      <div style="font-size:0.8rem; background:var(--cream); padding:0.5rem; border-radius:4px; margin-top:4px; color:var(--bark);">
                        {{ selectedBookingDetails.user.bio || 'No medical bio provided.' }}
                      </div>
                    </div>
                  </div>

                  <div class="timeline-section-title" style="margin-bottom: 0.75rem;">Transaction & Payment</div>
                  <div class="route-detail-info-block">
                    <div><strong>Payment Status:</strong> 
                      <span :class="['status-pill', 
                        selectedBookingDetails.booking.paymentStatus === 'Paid' ? 'status-open' : 
                        selectedBookingDetails.booking.paymentStatus === 'Refunded' ? 'status-cancelled' : 'status-pending'
                      ]">
                        {{ selectedBookingDetails.booking.paymentStatus }}
                      </span>
                    </div>
                    <div><strong>Amount Paid:</strong> <span class="mono">₹{{ (selectedBookingDetails.booking.amountPaid || selectedBookingDetails.booking.bookingPrice || 0).toLocaleString() }}</span></div>
                    <div v-if="selectedBookingDetails.booking.refundAmount > 0">
                      <strong>Refunded Amount:</strong> <span class="mono" style="color: var(--red); font-weight: 600;">₹{{ selectedBookingDetails.booking.refundAmount.toLocaleString() }}</span>
                    </div>
                    <div><strong>Paid On Date:</strong> <span class="mono">{{ selectedBookingDetails.booking.paidOn || '—' }}</span></div>
                  </div>
                </div>

                <!-- Right Side: Batch Details -->
                <div>
                  <div class="timeline-section-title" style="margin-bottom: 0.75rem;">Trek Batch Details</div>
                  <div class="route-detail-info-block">
                    <div><strong>Batch Code:</strong> <span class="mono">{{ selectedBookingDetails.booking.batchCode }}</span></div>
                    <div><strong>Trek Name:</strong> <span>{{ selectedBookingDetails.booking.trek }}</span></div>
                    <div><strong>Trek Start Date:</strong> <span class="mono">{{ formatDate(selectedBookingDetails.booking.startDate) }}</span></div>
                    <div><strong>Booked On:</strong> <span class="mono">{{ formatDate(selectedBookingDetails.booking.date) }}</span></div>
                    <div><strong>Booking Status:</strong> <span :class="'status-pill status-'+selectedBookingDetails.booking.status.toLowerCase()">{{ selectedBookingDetails.booking.status }}</span></div>
                  </div>
                </div>
              </div>
            </div>
            <div class="ts-modal-footer">
              <button class="btn-primary-ts" @click="closeBookingDetails">Close</button>
            </div>
          </div>
        </div>

        <!-- ════════ REFUND MODAL (Extracted from SAdminModals) ════════ -->
        <div v-if="showRefundModal" class="ts-modal-overlay" @click.self="closeRefundModal" style="z-index: 3000;">
          <div class="ts-modal" style="max-width: 450px;">
            <div class="ts-modal-header" style="border-bottom: 1px solid rgba(26,46,26,0.09);">
              <h3 class="ts-modal-title" style="color: var(--forest); display: flex; align-items: center; gap: 8px;">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                <span>Process Refund</span>
              </h3>
              <button class="modal-close" @click="closeRefundModal">✕</button>
            </div>
            <div class="ts-modal-body" style="padding: 1.5rem; font-size: 0.9rem;">
              <div class="form-grid" style="display: flex; flex-direction: column; gap: 12px;">
                <div style="background: var(--snow); padding: 12px; border-radius: 6px; border: 1px solid rgba(26,46,26,0.08); display: flex; flex-direction: column; gap: 4px;">
                  <div><strong>Booking ID:</strong> <span class="mono" style="font-weight: 600; color: var(--bark);">{{ refundTarget ? (refundTarget.bookingId || ('#' + refundTarget.id)) : '' }}</span></div>
                  <div><strong>Trekker Name:</strong> <span style="font-weight: 600; color: var(--forest);">{{ refundTarget ? refundTarget.user : '' }}</span></div>
                  <div><strong>Trek:</strong> <span style="font-weight: 600;">{{ refundTarget ? refundTarget.trek : '' }}</span></div>
                  <div><strong>Original Paid:</strong> <span style="font-weight: 700; color: var(--forest);">₹{{ refundTarget ? (refundTarget.amountPaid || refundTarget.bookingPrice || 5000).toLocaleString() : 0 }}</span></div>
                </div>
                
                <div class="form-group form-full">
                  <label for="refund-amount-input">Refund Amount (INR) <span style="color: var(--red); font-weight: bold;">*</span></label>
                  <input 
                    id="refund-amount-input" 
                    v-model.number="refundAmountInput" 
                    type="number" 
                    min="0" 
                    :max="refundTarget ? (refundTarget.amountPaid || refundTarget.bookingPrice || 5000) : 5000" 
                    placeholder="Enter refund amount" 
                    style="width: 100%; font-family: monospace; font-size: 1rem; padding: 10px;"
                  />
                  <span style="font-size: 0.74rem; color: var(--stone); margin-top: 4px;">
                    Enter custom refund. Maximum: ₹{{ refundTarget ? (refundTarget.amountPaid || refundTarget.bookingPrice || 5000).toLocaleString() : 0 }}
                  </span>
                </div>
              </div>
            </div>
            <div class="ts-modal-footer" style="background: var(--snow); border-top: 1px solid rgba(26,46,26,0.09);">
              <button class="btn-ghost" @click="closeRefundModal">Cancel</button>
              <button class="btn-primary-ts" style="background: var(--red); border-color: var(--red);" @click="submitRefund">Confirm Refund</button>
            </div>
          </div>
        </div>

      </section>
</template>

<script>
/**
 * =========================================================================
 * TabBookings.vue
 * =========================================================================
 * Full Booking log manager — lists all trekker bookings across all batches,
 * supports filtering by status (Booked / Cancelled / Completed), cancellation
 * triggers, booking detail overlays, and refund processing modal.
 *
 * This component uses Vue 3 Options API with local state for modal/form
 * management and injects `adminDash` from the root `AdminDashboard.vue`
 * coordinator to access allBookings, users lists, and trigger shared actions.
 *
 * Key Sections:
 * - Computed: filteredBookings (search + status filter)
 * - Methods: Booking detail view (viewBookingDetails, closeBookingDetails)
 * - Methods: Cancellation (cancelBooking via triggerConfirm)
 * - Methods: Refund processing (openRefundModal, submitRefund, closeRefundModal)
 */
export default {
  name: 'TabBookings',
  inject: ['adminDash'],
  data() {
    return {
      // Local state
      bookingFilter: 'All',
      showBookingDetailsModal: false,
      showRefundModal: false,
      selectedBookingDetails: null,
      refundTarget: null,
      refundAmountInput: 0
    };
  },

  computed: {
    // Injected parent fields
    activeTab() {
      return this.adminDash.activeTab;
    },
    allBookings() {
      return this.adminDash.allBookings;
    },
    users() {
      return this.adminDash.users;
    },

    // Filter list based on selected state filter and global search query
    filteredBookings() {
      const allBookings = this.adminDash.allBookings || [];
      let list = allBookings;

      if (this.bookingFilter !== 'All') {
        list = list.filter(b => b.status === this.bookingFilter);
      }

      const q = (this.adminDash.searchQuery || '').toLowerCase().trim();
      if (q) {
        list = list.filter(b =>
          (b.user && b.user.toLowerCase().includes(q)) ||
          (b.trek && b.trek.toLowerCase().includes(q)) ||
          (b.bookingId && b.bookingId.toLowerCase().includes(q)) ||
          String(b.id).includes(q)
        );
      }
      return list;
    }
  },

  methods: {
    // Check if trek start date is in the future
    // Check if trek start date is in the future relative to today
    isTrekDateNotPassed(dateStr) {
      if (!dateStr || dateStr === '—') return false;
      // Parse dates safely from YYYY-MM-DD or similar formats
      const parts = dateStr.split('-');
      const start = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return start >= today;
    },

    // Date formatting helper for UI lists (e.g. Month DD, YYYY)
    formatDate(dateStr) {
      if (!dateStr) return '';
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    },

    // ── Booking Details Actions ──
    // Compiles data for selected booking and details of corresponding trekker user
    viewBookingDetails(b) {
      const usersList = this.adminDash.users || [];
      const userObj = usersList.find(usr => usr.id === b.userId);
      this.selectedBookingDetails = {
        booking: b,
        // Fallback user structure if trekker details aren't synced in the list
        user: userObj || {
          memberId: 'TS26T' + b.userId,
          name: b.user,
          email: '—',
          phone: '—',
          city: '—',
          emergency: '—',
          bio: 'No profile details available (fallback).'
        }
      };
      this.showBookingDetailsModal = true;
    },
    // Dismisses the booking details popup modal
    closeBookingDetails() {
      this.showBookingDetailsModal = false;
      this.selectedBookingDetails = null;
    },

    // ── Booking Cancellation Actions ──
    // Triggers global confirm modal first, then invokes API to cancel booking
    cancelBooking(b) {
      this.adminDash.triggerConfirm(
        'Cancel Booking',
        `Are you sure you want to cancel booking ${b.bookingId || ('#' + b.id)} for ${b.user}?`,
        'Cancel Booking',
        async () => {
          try {
            // Post cancellation request to backend endpoint
            const res = await fetch(`/api/admin/bookings/cancel/${b.id}`, { method: 'POST' });
            if (res.ok) {
              this.adminDash.showToast('Booking cancelled');
              this.adminDash.loadData(); // Refresh coordinator shared data lists
            } else {
              this.adminDash.showToast('Failed to cancel booking');
            }
          } catch (_) {
            this.adminDash.showToast('Failed to cancel booking (error)');
          }
        }
      );
    },

    // ── Refund Processing ──
    // Opens process refund form pre-populated with max paid amount
    openRefundModal(b) {
      this.refundTarget = b;
      this.refundAmountInput = Number(b.amountPaid || b.bookingPrice || 5000);
      this.showRefundModal = true;
    },
    // Closes refund modal and clears temporary variables
    closeRefundModal() {
      this.showRefundModal = false;
      this.refundTarget = null;
      this.refundAmountInput = 0;
    },
    // Submits the refund amount validation and executes refund POST API call
    async submitRefund() {
      if (!this.refundTarget) return;
      const maxRefund = Number(this.refundTarget.amountPaid || this.refundTarget.bookingPrice || 5000);
      // Validate bounds of refund request
      if (this.refundAmountInput < 0 || this.refundAmountInput > maxRefund) {
        this.adminDash.showToast(`Please enter a valid refund amount between 0 and ${maxRefund}.`);
        return;
      }
      try {
        const res = await fetch(`/api/admin/bookings/refund/${this.refundTarget.id}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refund_amount: this.refundAmountInput })
        });
        if (res.ok) {
          this.adminDash.showToast('Refund processed successfully');
          this.closeRefundModal();
          this.adminDash.loadData(); // Sync updated financial metrics & bookings
        } else {
          const err = await res.json();
          this.adminDash.showToast(err.error || 'Failed to process refund');
        }
      } catch (_) {
        this.adminDash.showToast('Failed to process refund (error)');
      }
    }
  }
};
</script>
