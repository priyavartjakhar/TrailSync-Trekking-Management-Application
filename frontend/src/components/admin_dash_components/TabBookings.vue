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
                <th>User</th>
                <th>Batch ID</th>
                <th>Trek</th>
                <th>Booked On</th>
                <th>Status</th>
                <th>Payment</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="b in filteredBookings" :key="b.id">
                <td class="mono" style="font-size: 0.8rem;">{{ b.bookingId || ('#' + b.id) }}</td>
                <td class="mono" style="font-size: 0.8rem;">{{ b.trekkerId }}</td>
                <td><span style="font-weight:600; color:var(--forest)">{{ b.user }}</span></td>
                <td class="mono" style="font-size: 0.8rem;">{{ b.batchCode }}</td>
                <td style="font-weight:500;">{{ b.trek }}</td>
                <td class="mono">{{ formatDate(b.date) }}</td>
                <td><span :class="'status-pill status-'+b.status.toLowerCase()">{{ b.status }}</span></td>
                <td>
                  <span :class="['status-pill', 
                    b.paymentStatus === 'Paid' ? 'status-open' : 
                    b.paymentStatus === 'Refunded' ? 'status-cancelled' : 'status-pending'
                  ]">{{ b.paymentStatus }}</span>
                </td>
                <td>
                  <div class="action-btns" style="display:flex; gap:6px;">
                    <button class="act-btn act-view" @click="viewBookingDetails(b)">
                      <svg viewBox="0 0 24 24" class="act-btn-icon"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                      View
                    </button>
                    <button v-if="b.status==='Booked' && isTrekDateNotPassed(b.startDate)" class="act-btn act-delete-btn" @click="cancelBooking(b)">
                      <svg viewBox="0 0 24 24" class="act-btn-icon" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>
                      Cancel
                    </button>
                    <button v-if="b.status==='Cancelled' && b.paymentStatus!=='Refunded' && isTrekDateNotPassed(b.startDate)" class="act-btn act-assign" @click="openRefundModal(b)" style="background: rgba(220, 53, 69, 0.1); color: var(--red); border-color: rgba(220, 53, 69, 0.2);">
                      <svg viewBox="0 0 24 24" class="act-btn-icon" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                      Refund
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
      </section>
</template>

<script>
import { adminDashComponent } from './adminDashProxy';

export default adminDashComponent('TabBookings', {
  methods: {
    isTrekDateNotPassed(dateStr) {
      if (!dateStr || dateStr === '—') return false;
      const parts = dateStr.split('-');
      const start = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return start >= today;
    }
  }
});
</script>
