<template>
  <section class="hero">
    <div class="hero-video-wrap">
      <video autoplay muted loop playsinline id="hero-video"
        poster="https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1800&q=80">
        <source src="https://assets.mixkit.co/videos/preview/mixkit-hiking-through-a-meadow-with-mountains-in-the-background-41360-large.mp4" type="video/mp4">
      </video>
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
export default {
  name: 'TsHero',
  name: 'TsHero',
  mounted() {
    const hv = document.getElementById('hero-video');
    window.addEventListener('scroll', () => {
      if (window.scrollY < window.innerHeight && hv)
        hv.style.transform = `scale(1.08) translateY(${window.scrollY * 0.22}px)`;
    });
  }
};
</script>
