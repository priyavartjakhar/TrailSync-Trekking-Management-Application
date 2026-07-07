<template>
        <section  class="tab-section-content">
          <div class="page-header">
            <div class="page-header-left">
              <div class="page-eyebrow">Your Adventures</div>
              <div class="page-title">My <em>Bookings</em></div>
            </div>
            <button class="btn-back-home" @click="goTab('dashboard')">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
              Back to Home
            </button>
          </div>
          <div class="ts-card" style="max-width: 900px;">
            <div class="ts-card-body">
              <div v-if="myBookings.filter(b=>b.status==='Booked').length === 0" class="empty-state" style="display:flex; flex-direction:column; align-items:center;">
                <svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                <p>You have no active bookings.</p>
                <button class="btn-book" style="margin-top: 1rem; max-width: 220px; display:inline-flex; align-items:center; justify-content:center;" @click="goTab('explore')">Find a Trek</button>
              </div>
              <div class="bookings-stack">
                <div v-for="b in myBookings.filter(b=>b.status==='Booked')" :key="b.id" class="booking-row">
                  <div class="booking-accent" :class="'ba-' + b.difficulty.toLowerCase()"></div>
                  <div class="booking-main">
                    <div class="booking-trek-name">{{ b.trekName }}</div>
                    <div class="booking-loc"><span class="css-loc-pin"></span>{{ b.place ? b.place + ', ' : '' }}{{ b.location }}</div>
                    <div class="booking-dates mono">{{ formatDate(b.startDate) }} → {{ formatDate(b.endDate) }}</div>
                    <div v-if="b.guide" class="booking-guide-info" style="font-size: 0.78rem; color: var(--stone); margin-top: 6px; display: flex; align-items: center; gap: 8px;">
                      <span>👤 Guide: <strong>{{ b.guide.name }}</strong> ({{ b.guide.phone }})</span>
                      <button style="color: var(--forest); font-weight: 600; cursor: pointer; border: none; background: none; padding: 0; font-size: 0.78rem; text-decoration: underline;" @click="openGuideModal(b.guide)">View Profile</button>
                    </div>
                    <div class="booking-details-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 8px; margin-top: 10px; padding-top: 8px; border-top: 1px dashed rgba(26,46,26,0.08); font-size: 0.78rem; color: var(--stone);">
                      <div><strong>Booking ID:</strong> <span class="mono" style="color: var(--bark);">{{ b.bookingId || ('#' + b.id) }}</span></div>
                      <div><strong>Trek ID:</strong> <span class="mono" style="color: var(--bark);">{{ b.trekCode || ('TID' + String(b.trekId).padStart(3, '0')) }}</span></div>
                      <div><strong>Batch ID:</strong> <span class="mono" style="color: var(--bark);">{{ b.batchCode || b.batchId || '—' }}</span></div>
                      <div><strong>Payment Method:</strong> <span style="color: var(--bark);">{{ b.paymentMethod || 'Pending' }}</span></div>
                      <div><strong>Payment Details:</strong> <span style="color: var(--bark);">{{ b.paymentDetails || 'Pending' }}</span></div>
                    </div>
                  </div>
                  <div class="booking-meta">
                    <div class="bm-row">
                      <span class="bm-label">Payment</span>
                      <span :class="['status-pill', 
                        b.paymentStatus === 'Paid' ? 'status-open' : 
                        b.paymentStatus === 'Pending' ? 'status-closed' : 'status-closed'
                      ]" style="font-size:0.75rem; padding: 2px 8px; font-weight:700;">
                        {{ b.paymentStatus }}
                      </span>
                    </div>
                    <div class="bm-row">
                      <span class="bm-label">Amount</span>
                      <span class="bm-price">₹{{ (b.amountPaid || b.bookingPrice || b.price || 0).toLocaleString() }}</span>
                    </div>
                    <div class="bm-row">
                      <span class="bm-label">Paid</span>
                      <span style="font-weight:600; color:var(--forest);">₹{{ (b.amountPaid || b.bookingPrice || b.price || 0).toLocaleString() }}</span>
                    </div>
                    <div class="bm-row">
                      <span class="bm-label">Difficulty</span>
                      <span :class="'diff-pill pill-'+b.difficulty.toLowerCase()">{{b.difficulty}}</span>
                    </div>
                    <div style="display: flex; flex-direction: column; gap: 0.5rem; margin-top: 0.5rem; width: 100%;">
                      <div style="display: flex; gap: 0.5rem; width: 100%;">
                        <button v-if="isTrekDateNotPassed(b.startDate)" class="btn-cancel" @click="cancelBooking(b)" style="flex: 1;">Cancel</button>
                        <button class="btn-outline" @click="openChecklistModal(b)" style="flex: 1.5; padding: 0.35rem 0.5rem; font-size: 0.72rem; border-radius: 4px; border: 1px solid var(--forest); color: var(--forest); background: transparent; cursor: pointer; font-weight: 600; display: flex; align-items: center; justify-content: center; gap: 2px;"><i class="bi bi-list-check"></i> Checklist</button>
                      </div>
                      <button v-if="b.paymentStatus === 'Pending'" class="btn-book" @click="payPendingBooking(b)" style="width: 100%; padding: 6px; font-size: 0.78rem; background: var(--gold); border-radius: 4px; border: none; font-weight: 700; color: var(--forest); cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 4px;">
                        <i class="bi bi-credit-card"></i> Pay Now
                      </button>
                      <button v-else-if="b.paymentStatus === 'Failed'" class="btn-book" @click="payPendingBooking(b)" style="width: 100%; padding: 6px; font-size: 0.78rem; background: var(--red); border-radius: 4px; border: none; font-weight: 700; color: white; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 4px;">
                        <i class="bi bi-arrow-repeat"></i> Retry Payment
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Completed Bookings Sub-section -->
              <div v-if="trekHistory.filter(h => h.status === 'Completed').length > 0" class="completed-bookings-section" style="margin-top: 2rem; border-top: 1px dashed rgba(26,46,26,0.15); padding-top: 1.5rem;">
                <h4 style="color: var(--stone); margin-bottom: 1.25rem; font-family: 'Playfair Display', serif; font-size: 1.2rem; font-weight: 700;">Completed Bookings</h4>
                <div class="bookings-stack">
                  <div v-for="h in trekHistory.filter(h => h.status === 'Completed')" :key="h.id" class="booking-row completed-booking-row" style="opacity: 0.85; border: 1px dashed rgba(26,46,26,0.18); background: #fbfbfc; box-shadow: none;">
                    <div class="booking-accent" style="background: var(--stone);"></div>
                    <div class="booking-main">
                      <div class="booking-trek-name" style="color: var(--stone);">{{ h.trekName }}</div>
                      <div class="booking-loc"><span class="css-loc-pin"></span>{{ h.place ? h.place + ', ' : '' }}{{ h.location }}</div>
                      <div class="booking-dates mono">{{ formatDate(h.startDate) }} → {{ formatDate(h.endDate) }}</div>
                      <div class="booking-details-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 8px; margin-top: 10px; padding-top: 8px; border-top: 1px dashed rgba(26,46,26,0.08); font-size: 0.78rem; color: var(--stone);">
                        <div><strong>Booking ID:</strong> <span class="mono" style="color: var(--bark);">{{ h.bookingId || ('#' + h.id) }}</span></div>
                        <div><strong>Trek ID:</strong> <span class="mono" style="color: var(--bark);">{{ h.trekCode || ('TID' + String(h.trekId).padStart(3, '0')) }}</span></div>
                        <div><strong>Batch ID:</strong> <span class="mono" style="color: var(--bark);">{{ h.batchCode || h.batchId || '—' }}</span></div>
                        <div><strong>Payment Method:</strong> <span style="color: var(--bark);">{{ h.paymentMethod || 'Pending' }}</span></div>
                        <div><strong>Payment Details:</strong> <span style="color: var(--bark);">{{ h.paymentDetails || 'Pending' }}</span></div>
                      </div>
                    </div>
                    <div class="booking-meta" style="min-width: 120px;">
                      <div class="bm-row">
                        <span class="bm-label">Status</span>
                        <span class="status-pill status-completed" style="font-size:0.75rem; padding: 2px 8px; font-weight:700; background: var(--mist); color: var(--forest)">Completed</span>
                      </div>
                      <div class="bm-row" style="margin-top: 8px;">
                        <span class="bm-label">Amount Paid</span>
                        <span style="font-weight:700; color: var(--forest);">₹{{ (h.amountPaid || h.bookingPrice || h.price || 0).toLocaleString() }}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Cancelled Bookings Sub-section -->
              <div v-if="myBookings.filter(b=>b.status==='Cancelled').length > 0" class="cancelled-bookings-section" style="margin-top: 2rem; border-top: 1px dashed rgba(26,46,26,0.15); padding-top: 1.5rem;">
                <h4 style="color: var(--stone); margin-bottom: 1.25rem; font-family: 'Playfair Display', serif; font-size: 1.2rem; font-weight: 700;">Cancelled Bookings</h4>
                <div class="bookings-stack">
                  <div v-for="b in myBookings.filter(b=>b.status==='Cancelled')" :key="b.id" class="booking-row cancelled-booking-row" style="opacity: 0.85; border: 1px dashed rgba(26,46,26,0.18); background: #fbfbfc; box-shadow: none;">
                    <div class="booking-accent" style="background: var(--stone);"></div>
                    <div class="booking-main">
                      <div class="booking-trek-name" style="text-decoration: line-through; color: var(--stone);">{{ b.trekName }}</div>
                      <div class="booking-loc"><span class="css-loc-pin"></span>{{ b.place ? b.place + ', ' : '' }}{{ b.location }}</div>
                      <div class="booking-dates mono">{{ formatDate(b.startDate) }} → {{ formatDate(b.endDate) }}</div>
                      
                      <!-- Notice message requested by user -->
                      <div style="margin-top: 12px; padding: 10px 12px; background: rgba(220,53,69,0.04); border-radius: 6px; border: 1px solid rgba(220,53,69,0.12); color: var(--stone); font-size: 0.82rem; line-height: 1.45; display: flex; align-items: start; gap: 8px;">
                        <span style="color: var(--red); font-weight: 700; font-size: 0.9rem; line-height: 1;">⚠️</span>
                        <span>refund related updates will be sent to you via email for any query raise a ticket from support tab</span>
                      </div>
                    </div>
                    <div class="booking-meta" style="min-width: 120px;">
                      <div class="bm-row">
                        <span class="bm-label">Status</span>
                        <span class="status-pill status-closed" style="font-size:0.75rem; padding: 2px 8px; font-weight:700; background: var(--stone); color: white;">Cancelled</span>
                      </div>
                      <div v-if="b.refundAmount > 0" class="bm-row" style="margin-top: 8px;">
                        <span class="bm-label" style="color: var(--forest); font-weight: 600;">Refunded</span>
                        <span style="font-weight:700; color: var(--forest);">₹{{ b.refundAmount.toLocaleString() }}</span>
                      </div>
                    </div>
                  </div>
                </div>
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
 * Reservations management view displaying trek vouchers, pending/paid transactions, checklist progress, and cancellation forms.
 * Standard Vue component using custom props parameters input and events emitters
 * to communicate with parent 'UserDashboard'.
 */

export default {
  name: 'TabBookings',
  props: {
    myBookings: { type: Array, default: () => [] },
    trekHistory: { type: Array, default: () => [] }
  },
  emits: ['cancel-booking', 'view-checklist', 'view-guide', 'pay-booking', 'change-tab'],
  methods: {
    goTab(tab) {
      this.$emit('change-tab', tab);
    },
    cancelBooking(booking) {
      this.$emit('cancel-booking', booking);
    },
    openChecklistModal(booking) {
      this.$emit('view-checklist', booking);
    },
    openGuideModal(guide) {
      this.$emit('view-guide', guide);
    },
    payPendingBooking(booking) {
      this.$emit('pay-booking', booking);
    },
    formatDate(dateStr) {
      if (!dateStr) return '';
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    },
    isTrekDateNotPassed(dateStr) {
      if (!dateStr || dateStr === '—') return false;
      const parts = dateStr.split('-');
      const start = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return start >= today;
    }
  }
};
</script>
