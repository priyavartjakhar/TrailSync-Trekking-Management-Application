<template>
  <!-- ── PAGE WRAPPER ──────────────────────────────── -->
  <section  class="tab-section-content">

    <!-- ── PAGE HEADER ───────────────────────────────── -->
    <div class="page-header" style="display: flex; justify-content: space-between; align-items: center; gap: 1rem; flex-wrap: wrap;">
      <div class="page-header-left">
        <div class="page-eyebrow">Past Journeys</div>
        <div class="page-title">Trek <em>History</em></div>
      </div>
      <!-- Export button — disabled while the async CSV job is pending -->
      <button class="btn-outline" style="padding: 0.45rem 0.9rem; font-size: 0.82rem; display: inline-flex; align-items: center; gap: 0.45rem;" :disabled="exportPending" @click="requestExport">
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
        {{ exportPending ? 'Preparing CSV...' : 'Export as CSV' }}
      </button>
    </div>

    <!-- ── COMPLETED TREKS LIST ───────────────────────── -->
    <div style="max-width: 900px;">
      <div class="ts-card">
        <div class="ts-card-header">
          <div class="ts-card-title">Completed Treks</div>
        </div>
        <div class="ts-card-body">
          <!-- Empty state when no completed treks exist in history -->
          <div v-if="trekHistory.filter(h => h.status === 'Completed').length === 0" class="empty-state">
            <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            <p>No past treks found.</p>
          </div>

          <!-- Stacked booking rows for each completed trek record -->
          <div class="bookings-stack">
            <div v-for="h in trekHistory.filter(h => h.status === 'Completed')" :key="h.id" class="booking-row" style="opacity: 0.85">
              <div class="booking-accent" style="background: var(--stone)"></div>
              <div class="booking-main">
                <div class="booking-trek-name">{{ h.trekName }}</div>
                <div class="booking-loc"><span class="css-loc-pin"></span>{{ h.place ? h.place + ', ' : '' }}{{ h.location }}</div>
                <div class="booking-dates mono">{{ formatDate(h.startDate) }} → {{ formatDate(h.endDate) }}</div>

                <!-- Detailed booking metadata grid: IDs, payment info -->
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
/**
 * =========================================================================
 * TabHistory.vue
 * =========================================================================
 * Completed treks archive list enabling hikers to view historical paths and request async CSV exports.
 * Refactored to handle API calls locally.
 *
 * Receives the full booking history array from the parent and filters it
 * client-side to display only "Completed" records. The CSV export is
 * triggered via a POST to `/api/user/export` and the `exportPending` flag
 * prevents duplicate submissions while the server prepares the file.
 *
 * Communication Structure:
 * - Inputs (Props): `trekHistory` — full booking history array from UserDashboard.
 * - Outputs (Events): `change-tab` (navigation), `show-toast` (status messages).
 */

export default {
  name: 'TabHistory',
  props: {
    trekHistory: { type: Array, default: () => [] }
  },
  emits: ['change-tab', 'show-toast'],
  data() {
    return {
      // ── EXPORT STATE ──────────────────────────────────────
      /** True while the CSV export request is in flight; disables the Export button. */
      exportPending: false
    };
  },
  methods: {
    /**
     * Emits 'change-tab' to navigate the user to another dashboard tab.
     * @param {string} tab - The target tab identifier (e.g., 'dashboard').
     */
    goTab(tab) {
      this.$emit('change-tab', tab);
    },

    /**
     * Formats an ISO date string into a human-readable short date.
     * Returns an empty string if `dateStr` is falsy.
     * @param {string} dateStr - An ISO 8601 date string (e.g., '2025-11-15T00:00:00Z').
     * @returns {string} Formatted date string (e.g., 'Nov 15, 2025'), or '' if absent.
     */
    formatDate(dateStr) {
      if (!dateStr) return '';
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    },

    /**
     * Posts to `/api/user/export` to trigger an async server-side CSV generation
     * of the user's trek history. Sets `exportPending` for 8 seconds to prevent
     * duplicate requests. Emits a toast notification on success or failure.
     * Side effect: updates `exportPending`; emits 'show-toast'.
     */
    async requestExport() {
      this.exportPending = true;
      try {
        const res = await fetch('/api/user/export', { method: 'POST' });
        const data = await res.json();
        if (res.ok) {
          this.$emit('show-toast', data.message || 'CSV export triggered.', 'success');
        } else {
          this.$emit('show-toast', data.error || 'Export failed.', 'error');
          this.exportPending = false;
        }
      } catch (e) {
        console.error('Export error:', e);
        this.$emit('show-toast', 'Failed to contact server. Export could not be completed.', 'error');
        this.exportPending = false;
      }
      // Auto-reset the pending flag after 8 seconds as a safety net in case the server is slow.
      setTimeout(() => { this.exportPending = false; }, 8000);
    }
  }
};
</script>
