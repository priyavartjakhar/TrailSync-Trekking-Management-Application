<template>
  <!-- ── MODAL OVERLAY (animated via 'toast' transition) ─── -->
  <transition name="toast">
    <div v-if="show" class="ts-modal-overlay" @click.self="$emit('close')">
      <div class="ts-modal" style="max-width:550px">

        <!-- ── MODAL HEADER ──────────────────────────────── -->
        <div class="ts-modal-header">
          <span class="ts-modal-title">Trek Checklist</span>
          <button class="modal-close" @click="$emit('close')">✕</button>
        </div>

        <!-- ── CHECKLIST BODY ────────────────────────────── -->
        <!-- Only rendered when a booking object is present -->
        <div class="ts-modal-body" v-if="booking">
          <h3 style="font-family:'Playfair Display',serif; font-size:1.2rem; margin-bottom:0.5rem">{{ booking.trekName }}</h3>
          <p style="font-size:0.8rem; color:var(--stone); margin-bottom:1.5rem">
            Carry these items to ensure a safe and comfortable trek. Your checked items will persist automatically.
          </p>

          <!-- ── SECTION 1: Standard Packing List ─────────── -->
          <!-- Items with category 'default' come from the platform's standard gear list -->
          <div style="margin-bottom:1.5rem">
            <h4 style="font-size:0.85rem; text-transform:uppercase; color:var(--forest); letter-spacing:0.05em; margin-bottom:0.75rem; border-bottom:1px solid rgba(0,0,0,0.06); padding-bottom:4px">🎒 Standard Packing List</h4>
            <div style="display:flex; flex-direction:column; gap:0.5rem">
              <div v-if="!checklistItems.filter(i => i.category === 'default').length" style="font-size:0.8rem; color:var(--stone)">No standard items.</div>
              <!-- Each label wraps a checkbox + item text; checked state is persisted to the server on toggle -->
              <label v-for="item in checklistItems.filter(i => i.category === 'default')" :key="item.id" style="display:flex; align-items:flex-start; gap:8px; font-size:0.85rem; cursor:pointer">
                <input type="checkbox" :checked="item.isCompleted" @change="toggleChecklistItem(item)" style="margin-top:3px" />
                <span :style="{ textDecoration: item.isCompleted ? 'line-through' : 'none', color: item.isCompleted ? 'var(--stone)' : 'inherit' }">{{ item.itemName }}</span>
              </label>
            </div>
          </div>

          <!-- ── SECTION 2: Guide Recommended Gear ──────────── -->
          <!-- Items with category 'guide' are added by the assigned guide for this specific trek -->
          <div>
            <h4 style="font-size:0.85rem; text-transform:uppercase; color:var(--gold); letter-spacing:0.05em; margin-bottom:0.75rem; border-bottom:1px solid rgba(0,0,0,0.06); padding-bottom:4px">👤 Guide Recommended Gear</h4>
            <div style="display:flex; flex-direction:column; gap:0.5rem">
              <div v-if="!checklistItems.filter(i => i.category === 'guide').length" style="font-size:0.8rem; color:var(--stone); font-style:italic">No additional recommendations from the guide yet.</div>
              <label v-for="item in checklistItems.filter(i => i.category === 'guide')" :key="item.id" style="display:flex; align-items:flex-start; gap:8px; font-size:0.85rem; cursor:pointer">
                <input type="checkbox" :checked="item.isCompleted" @change="toggleChecklistItem(item)" style="margin-top:3px" />
                <span :style="{ textDecoration: item.isCompleted ? 'line-through' : 'none', color: item.isCompleted ? 'var(--stone)' : 'inherit' }">{{ item.itemName }}</span>
              </label>
            </div>
          </div>
        </div>

        <!-- ── MODAL FOOTER ──────────────────────────────── -->
        <div class="ts-modal-footer">
          <button class="btn-modal-cancel" @click="$emit('close')">Close</button>
        </div>
      </div>
    </div>
  </transition>
</template>

<script>
/**
 * ChecklistModal Component (Trekker Dashboard)
 * A modal displaying a two-section packing checklist for a specific booking.
 *
 * Fetches checklist items from the server when a booking is provided, and persists
 * each item's checked/unchecked state in real time via API toggle calls. Items are
 * divided into two categories:
 *  - 'default': Platform-standard gear (common across all treks).
 *  - 'guide': Items specifically recommended by the assigned trek guide.
 *
 * Communication Structure:
 * - Inputs (Props): `show` (Boolean) controls visibility; `booking` (Object) provides
 *   the booking ID and trek name used to fetch and identify the checklist.
 * - Outputs (Events): `close` — dismisses the modal; `show-toast` — reports errors.
 */
export default {
  name: 'ChecklistModal',
  props: {
    /** Controls whether the modal overlay is visible. */
    show: { type: Boolean, required: true },
    /** The booking object whose checklist should be loaded. Null if not yet set. */
    booking: { type: Object, default: null }
  },
  emits: ['close', 'show-toast'],
  data() {
    return {
      // ── CHECKLIST DATA ───────────────────────────────────
      /** Array of checklist item objects fetched from `/api/bookings/:id/checklist`.
       *  Each item has: id, itemName, category ('default' | 'guide'), isCompleted. */
      checklistItems: []
    };
  },
  watch: {
    // Re-fetch the checklist whenever the booking prop changes (e.g., when the modal
    // is opened for a different booking). `immediate: true` also handles the initial load.
    booking: {
      immediate: true,
      handler(newBooking) {
        if (newBooking) {
          this.fetchChecklist(newBooking.id);
        } else {
          this.checklistItems = [];
        }
      }
    }
  },
  methods: {
    /**
     * Fetches the checklist items for a given booking from the API.
     * Clears the current list before loading to avoid showing stale data.
     * Emits a toast on network or server errors.
     * @param {number} bookingId - The ID of the booking whose checklist to load.
     */
    async fetchChecklist(bookingId) {
      this.checklistItems = [];
      try {
        const res = await fetch(`/api/bookings/${bookingId}/checklist`);
        if (res.ok) {
          this.checklistItems = await res.json();
        } else {
          this.$emit('show-toast', 'Failed to load checklist', 'error');
        }
      } catch (e) {
        console.error('Checklist load error:', e);
        this.$emit('show-toast', 'Failed to contact server for checklist.', 'error');
      }
    },

    /**
     * Toggles the completed state of a single checklist item by POSTing to
     * `/api/bookings/checklist/toggle`. On success, updates the item's `isCompleted`
     * field in-place from the server response to keep local state authoritative.
     * Side effect: mutates `item.isCompleted`; emits 'show-toast' on failure.
     * @param {Object} item - The checklist item object to toggle. Must have an `id`.
     */
    async toggleChecklistItem(item) {
      try {
        const res = await fetch('/api/bookings/checklist/toggle', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ item_id: item.id })
        });
        if (res.ok) {
          const data = await res.json();
          // Update the item state from the server's authoritative response
          item.isCompleted = data.item.isCompleted;
        } else {
          this.$emit('show-toast', 'Failed to update checklist item', 'error');
        }
      } catch (e) {
        console.error('Checklist toggle error:', e);
        this.$emit('show-toast', 'Failed to contact server to update item.', 'error');
      }
    }
  }
};
</script>
