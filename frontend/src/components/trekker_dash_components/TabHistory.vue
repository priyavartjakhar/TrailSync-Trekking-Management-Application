<template>
        <section  class="tab-section-content">
          <div class="page-header">
            <div class="page-header-left">
              <div class="page-eyebrow">Past Journeys</div>
              <div class="page-title">Trek <em>History</em></div>
            </div>
          </div>

          <div style="max-width: 900px;">
            <div class="ts-card">
              <div class="ts-card-header">
                <div class="ts-card-title">Completed Treks</div>
              </div>
              <div class="ts-card-body">
                <div v-if="trekHistory.length === 0" class="empty-state">
                  <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                  <p>No past treks found.</p>
                </div>
                <div class="bookings-stack">
                  <div v-for="h in trekHistory" :key="h.id" class="booking-row" style="opacity: 0.85">
                    <div class="booking-accent" style="background: var(--stone)"></div>
                    <div class="booking-main">
                      <div class="booking-trek-name">{{ h.trekName }}</div>
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
                    <div class="booking-meta">
                      <div class="bm-row"><span class="bm-label">Status</span><span class="status-pill status-completed" style="background: var(--mist); color: var(--forest)">{{ h.status }}</span></div>
                      <div class="bm-row"><span class="bm-label">Amount</span><span class="bm-price">₹{{ (h.amountPaid || h.bookingPrice || h.price || 0).toLocaleString() }}</span></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
</template>

<script>
export default {
  name: 'TabHistory',
  props: {
    trekHistory: { type: Array, default: () => [] }
  },
  emits: ['change-tab'],
  methods: {
    goTab(tab) {
      this.$emit('change-tab', tab);
    },
    formatDate(dateStr) {
      if (!dateStr) return '';
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }
  }
};
</script>
