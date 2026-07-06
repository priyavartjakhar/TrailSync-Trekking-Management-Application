<template>
  <section class="safety-section" id="safety">
    <div class="text-center">
      <div class="section-tag d-inline-block">Your Safety First</div>
      <h2 class="section-title mt-2">How we keep you safe<br>on every trail</h2>
      <p class="section-lead mx-auto mb-2">Trekking involves real risk. Here's exactly what TrailSync does to manage it — before, during, and after every trek.</p>
    </div>
    <div class="safety-grid">
      <div v-for="c in cards" :key="c.title" class="safety-card">
        <div class="safety-icon" v-html="getIcon(c.icon)"></div>
        <div class="safety-title">{{ c.title }}</div>
        <div class="safety-desc">{{ c.desc }}</div>
      </div>
    </div>
  </section>
</template>

<script>
/**
 * =========================================================================
 * Safety.vue
 * =========================================================================
 * Essential safety regulations section listing rules for altitude sickness prevention, clothing layers, and communication.
 * 
 * Part of the public landing page components. Renders static descriptions
 * and interactive catalog sections prior to authentication.
 */

export default {
  name: 'TsSafety',
  name: 'TsSafety',
  data() {
    return {
      cards: [
        { title:'Certified Guides Only', desc:'Every trek leader is background-verified and wilderness first-aid certified. No unverified person can lead a trek on TrailSync — ever.', icon:'shield' },
        { title:'Strict Slot Limits', desc:'Every trek has a maximum group size enforced by the system. When it\'s full, it closes automatically — no exceptions, no overrides.', icon:'group' },
        { title:'Pre-Trek Briefings', desc:'48 hours before departure you receive a full briefing — gear checklist, weather forecast, acclimatisation tips, and your guide\'s contact details.', icon:'cal' },
        { title:'Emergency Protocols', desc:'Every guide carries a satellite communicator. Evacuation routes are pre-planned. Your emergency contact is notified if anything changes on trail.', icon:'phone' },
      ]
    };
  },
  methods: {
    getIcon(t) {
      const icons = {
        shield:`<svg viewBox="0 0 24 24"><path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>`,
        group:`<svg viewBox="0 0 24 24"><path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0"/></svg>`,
        cal:`<svg viewBox="0 0 24 24"><path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>`,
        phone:`<svg viewBox="0 0 24 24"><path d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg>`,
      };
      return icons[t] || '';
    }
  }
};
</script>
