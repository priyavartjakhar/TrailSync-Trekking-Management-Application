<template>
  <section class="hero">
    <div class="hero-video-wrap">
      <img ref="heroMedia" src="/static/images/trek_hero_bg.png" alt="">
    </div>
    <div class="hero-overlay"></div>
    <div class="hero-grain"></div>
    <div class="hero-content">
      <div class="hero-eyebrow">Navigate the World</div>
      <h1 class="hero-title">Every Mountain Has a Story</h1>
      <span class="hero-title-italic">Explore. Trek. Conquer.</span>
      <p class="hero-desc">Plan, manage, and experience unforgettable trekking adventures with a smart platform built for trekkers, guides, and explorers.</p>
      <div class="hero-cta">
        <a href="#treks" class="btn-primary-ts btn-large">Explore Treks</a>
        <a href="#difficulty" class="btn-ghost btn-large">Find My Level</a>
      </div>
    </div>
  </section>
</template>

<script>
/**
 * =========================================================================
 * Hero.vue
 * =========================================================================
 * High-impact greeting section containing the brand tagline, background visual layers, and core navigation buttons.
 * 
 * Part of the public landing page components. Renders static descriptions
 * and interactive catalog sections prior to authentication.
 */

export default {
  name: 'TsHero',
  mounted() {
    this.handleScroll = () => {
      const heroMedia = this.$refs.heroMedia;
      if (window.scrollY < window.innerHeight && heroMedia) {
        heroMedia.style.transform = `scale(1.08) translateY(${window.scrollY * 0.22}px)`;
      }
    };
    window.addEventListener('scroll', this.handleScroll);
  },
  beforeUnmount() {
    window.removeEventListener('scroll', this.handleScroll);
  }
};
</script>
