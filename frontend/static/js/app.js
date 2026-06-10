// ============================================================
//  app.js  — Vue 3 app entry point for TrailSync
// ============================================================

const { createApp } = Vue;

const app = createApp({
  data() {
    return {};
  }
});

// Register all components globally
app.component('ts-navbar',        TsNavbar);
app.component('ts-hero',          TsHero);
app.component('ts-stats-bar',     TsStatsBar);
app.component('ts-features',      TsFeatures);
app.component('ts-difficulty',    TsDifficulty);
app.component('ts-treks',         TsTreks);
app.component('ts-map',           TsMap);
app.component('ts-safety',        TsSafety);
app.component('ts-trail-steps',   TsTrailSteps);
app.component('ts-testimonials',  TsTestimonials);
app.component('ts-faq',           TsFaq);
app.component('ts-cta-banner',    TsCtaBanner);
app.component('ts-footer',        TsFooter);

app.mount('#app');
