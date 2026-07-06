<template>
  <section class="faq-section" id="faq">
    <div class="text-center">
      <div class="section-tag d-inline-block">Common Questions</div>
      <h2 class="section-title mt-2">Everything you want to ask</h2>
    </div>
    <div class="faq-wrap">
      <div v-for="(f, i) in faqs" :key="i" :class="['faq-item', { open: openIndex === i }]">
        <button class="faq-q" @click="toggle(i)">
          {{ f.q }}
          <span class="faq-icon">+</span>
        </button>
        <div class="faq-a">
          <div class="faq-a-inner">{{ f.a }}</div>
        </div>
      </div>
    </div>
  </section>
</template>

<script>
/**
 * =========================================================================
 * Faq.vue
 * =========================================================================
 * Interactive FAQ accordion displaying common queries regarding gear, scheduling, safety, and payments.
 * 
 * Part of the public landing page components. Renders static descriptions
 * and interactive catalog sections prior to authentication.
 */

export default {
  name: 'TsFaq',
  name: 'TsFaq',
  data() {
    return {
      openIndex: null,
      faqs: [
        { q:'Do I need prior experience to book a trek?', a:"It depends on the difficulty level. Easy treks need no prior experience — just reasonable fitness. Moderate treks are best if you've done some hiking. Hard treks require documented high-altitude experience." },
        { q:'How do I know if a trek has slots available?', a:"Every trek card shows live slot availability, updated in real time. When it hits zero, the trek closes automatically — no false availability, no waitlists (unless the trek specifically offers one)." },
        { q:'Can I cancel my booking and get a refund?', a:"Yes — cancel directly from your dashboard. Typically 15+ days before departure receives a full refund, 7–15 days gets 50%, and under 7 days is non-refundable. The specific policy is shown on each trek's booking page." },
        { q:"What's included in the trek price?", a:"Generally the price covers guide fees, accommodation, all meals during the trek, permits, and first-aid support. Travel to base camp, personal gear, and travel insurance are typically excluded." },
        { q:'Will I get reminders before my trek date?', a:"Yes. TrailSync sends a reminder 7 days before with packing list and weather info, another 48 hours before with your guide's contact and meeting point, and a final reminder on departure morning." },
        { q:'Are the guides actually qualified?', a:"Every guide on TrailSync is background-verified, wilderness first-aid certified, and has a minimum of 2 years experience leading treks in their specific region. No unverified guide can lead a trek on this platform." },
        { q:'What happens if a trek is cancelled due to weather?', a:"If conditions make a trek unsafe, it will be cancelled and all booked trekkers receive a full refund or option to rebook. You'll be notified via email and dashboard typically 48–72 hours before departure." },
        { q:'Can I export my full trekking history?', a:"Yes. From your dashboard, export your complete trekking history as a CSV anytime — useful for personal records, travel documentation, or sharing your trekking resume with expedition groups." },
      ]
    };
  },
  methods: {
    toggle(i) {
      this.openIndex = this.openIndex === i ? null : i;
    }
  }
};
</script>
