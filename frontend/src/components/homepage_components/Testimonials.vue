<template>
  <section class="testimonials-section">
    <div class="text-center">
      <div class="section-tag d-inline-block">Trekker Stories</div>
      <h2 class="section-title mt-2">What the community says</h2>
    </div>
    <div class="testi-grid">
      <div v-for="t in testimonials" :key="t.name" class="testi-card">
        <div class="testi-stars">★★★★★</div>
        <div class="testi-quote-mark">"</div>
        <p class="testi-text">{{ t.text }}</p>
        <div class="testi-author">
          <div class="author-avatar">{{ t.initials }}</div>
          <div>
            <div class="author-name">{{ t.name }}</div>
            <div class="author-meta">{{ t.meta }}</div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script>
/**
 * =========================================================================
 * Testimonials.vue
 * =========================================================================
 * Slider container showcasing positive feedback, hiking experiences, and quotes from past trekkers.
 * 
 * Part of the public landing page components. Renders static descriptions
 * and interactive catalog sections prior to authentication.
 */

export default {
  name: 'TsTestimonials',
  name: 'TsTestimonials',
  data() {
    return {
      testimonials: [
        { initials:'AR', name:'Arjun Rawat', meta:'Kedarkantha · Dec 2024 · 7 treks total', text:"I'd googled Kedarkantha six times over two years. Booked it on TrailSync on a Tuesday. Stood on the summit by Saturday. Still can't believe I waited that long." },
        { initials:'MJ', name:'Meera Joshi', meta:'Valley of Flowers · Jun 2024 · 2 treks total', text:"First trek ever. The difficulty guide helped me pick Valley of Flowers — perfect for a beginner. The pre-trek briefing made me feel prepared. Came back completely hooked." },
        { initials:'VK', name:'Vikram Khanna', meta:'Roopkund · Sep 2024 · 12 treks total', text:"Roopkund. 5,029m. 8 days. Zero signal for most of it. Came back a different person. TrailSync made the logistics invisible — I just showed up and climbed." },
      ]
    };
  }
};
</script>
