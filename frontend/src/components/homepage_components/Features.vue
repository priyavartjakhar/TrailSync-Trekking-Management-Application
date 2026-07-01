<template>
  <section class="features-section" id="features">
    <div class="features-intro">
      <div>
        <div class="section-tag">What TrailSync Does</div>
        <h2 class="section-title">Everything your trek needs,<br>in one place</h2>
      </div>
      <p class="section-lead">Everything from first click to summit — booking, reminders, history, safety — all in one place. No calls, no waiting.</p>
    </div>
    <div class="features-grid">
      <div v-for="f in features" :key="f.title" class="feature-card">
        <div class="feature-icon" v-html="getIcon(f.icon)"></div>
        <div class="feature-title">{{ f.title }}</div>
        <div class="feature-desc">{{ f.desc }}</div>
      </div>
    </div>
  </section>
</template>

<script>
export default {
  name: 'TsFeatures',
  name: 'TsFeatures',
  data() {
    return {
      features: [
        { title:'Smart Trek Search', desc:'Filter by difficulty, duration, location, and live slot count. Find what fits your schedule and fitness today.', icon:'search' },
        { title:'Instant Booking', desc:'Lock your slot in under 2 minutes. What you see is what\'s actually left — no overbooking, ever.', icon:'calendar' },
        { title:'Trek Reminders', desc:'Automated email reminders before your trek — gear checklist, weather, meeting point, guide contact.', icon:'bell' },
        { title:'Trek History', desc:'Every trek you\'ve done, logged forever. Export your full history as CSV anytime.', icon:'chart' },
        { title:'Live Slot Tracking', desc:'See exactly how many spots remain, updated in real time. When it hits zero, the trek closes.', icon:'pin' },
        { title:'Verified Guides', desc:'Every trek is led by certified, background-verified staff. Safety is built into the system.', icon:'shield' },
        { title:'Easy Cancellations', desc:'Cancel from your dashboard — no calls, no emails, no awkward back-and-forth.', icon:'cancel' },
        { title:'Full Transparency', desc:'Slot limits, difficulty ratings, pre-trek briefings, and emergency contacts — all visible before booking.', icon:'lock' },
      ]
    };
  },
  methods: {
    getIcon(type) {
      const icons = {
        search:`<svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>`,
        calendar:`<svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>`,
        bell:`<svg viewBox="0 0 24 24"><path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/></svg>`,
        chart:`<svg viewBox="0 0 24 24"><path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg>`,
        pin:`<svg viewBox="0 0 24 24"><path d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><circle cx="12" cy="11" r="3"/></svg>`,
        shield:`<svg viewBox="0 0 24 24"><path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>`,
        cancel:`<svg viewBox="0 0 24 24"><path d="M9 14l-4-4 4-4M15 10h-4M15 14l4-4-4-4" stroke-width="1.7"/></svg>`,
        lock:`<svg viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>`,
      };
      return icons[type] || '';
    }
  }
};
</script>
