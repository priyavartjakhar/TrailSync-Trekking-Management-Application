<template>
  <!-- ── MODAL OVERLAY (animated via 'toast' transition) ─── -->
  <transition name="toast">
    <div v-if="show" class="ts-modal-overlay" @click.self="$emit('close')">
      <div class="ts-modal ts-modal-sm">

        <!-- ── MODAL HEADER ──────────────────────────────── -->
        <div class="ts-modal-header">
          <span class="ts-modal-title">Guide Profile</span>
          <button class="modal-close" @click="$emit('close')">✕</button>
        </div>

        <!-- ── GUIDE PROFILE BODY ────────────────────────── -->
        <!-- Only rendered when a guide object is provided via prop -->
        <div class="ts-modal-body" style="text-align:center" v-if="guide">
          <!-- Guide avatar photo with gold border accent -->
          <img :src="guide.photoUrl" :alt="guide.name" style="width:100px; height:100px; border-radius:50%; object-fit:cover; margin-bottom:1rem; border:3px solid var(--gold)" />
          <h3 style="font-family:'Playfair Display',serif; font-size:1.3rem; margin-bottom:0.25rem">{{ guide.name }}</h3>
          <div style="font-size:0.8rem; color:var(--stone); margin-bottom:1rem; font-weight:600; text-transform:uppercase; letter-spacing:0.05em">{{ guide.designation }}</div>

          <!-- Professional details: experience, certifications, languages, staff ID -->
          <div style="text-align:left; background:var(--cream); padding:1rem; border-radius:var(--radius); margin-bottom:1rem; font-size:0.85rem">
            <div style="margin-bottom:0.5rem"><strong>Experience:</strong> {{ guide.experienceYears }} years ({{ guide.completedTreksCount }} treks completed)</div>
            <div style="margin-bottom:0.5rem"><strong>Certifications:</strong> {{ guide.certifications }}</div>
            <div style="margin-bottom:0.5rem"><strong>Languages:</strong> {{ guide.languages }}</div>
            <div style="margin-bottom:0.5rem"><strong>Staff ID:</strong> {{ guide.memberId }}</div>
          </div>

          <!-- Contact details: phone and email -->
          <div style="display:flex; flex-direction:column; gap:0.25rem; font-size:0.8rem; color:var(--bark)">
            <div>📞 {{ guide.phone }}</div>
            <div>✉️ {{ guide.email }}</div>
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
 * GuideModal Component (Trekker Dashboard)
 * A read-only modal that displays the assigned guide's full profile for a given booking.
 *
 * Rendered as an overlay when a trekker clicks "View Guide" on their booking card.
 * Shows the guide's photo, designation, professional credentials (experience, certifications,
 * languages), staff ID, and contact details. Closing is handled by emitting 'close'
 * either via the ✕ button or clicking the overlay backdrop.
 *
 * Communication Structure:
 * - Inputs (Props): `show` (Boolean) controls visibility; `guide` (Object) contains
 *   all guide data sourced from the booking record.
 * - Outputs (Events): `close` — emitted when the user dismisses the modal.
 */
export default {
  name: 'GuideModal',
  props: {
    /** Controls whether the modal overlay is visible. */
    show: { type: Boolean, required: true },
    /** Guide data object. Null when no guide is assigned yet. */
    guide: { type: Object, default: null }
  },
  emits: ['close']
};
</script>
