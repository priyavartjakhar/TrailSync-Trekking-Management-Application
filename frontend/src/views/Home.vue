<template>
  <div>
    <Navbar />
    <Hero />
    <StatsBar />
    <Features />
    <Difficulty />
    <Treks />
    <Map />
    <Safety />
    <TrailSteps />
    <Testimonials />
    <Faq />
    <CtaBanner />
    <Footer />
  </div>
</template>

<script>
import Navbar from '../components/homepage_components/Navbar.vue';
import Hero from '../components/homepage_components/Hero.vue';
import StatsBar from '../components/homepage_components/StatsBar.vue';
import Features from '../components/homepage_components/Features.vue';
import Difficulty from '../components/homepage_components/Difficulty.vue';
import Treks from '../components/homepage_components/Treks.vue';
import Map from '../components/homepage_components/Map.vue';
import Safety from '../components/homepage_components/Safety.vue';
import TrailSteps from '../components/homepage_components/TrailSteps.vue';
import Testimonials from '../components/homepage_components/Testimonials.vue';
import Faq from '../components/homepage_components/Faq.vue';
import CtaBanner from '../components/homepage_components/CtaBanner.vue';
import Footer from '../components/homepage_components/Footer.vue';

export default {
  name: 'TsHome',
  components: {
    Navbar,
    Hero,
    StatsBar,
    Features,
    Difficulty,
    Treks,
    Map,
    Safety,
    TrailSteps,
    Testimonials,
    Faq,
    CtaBanner,
    Footer
  }
};
</script>
