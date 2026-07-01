<template>
  <div class="stats-bar">
    <div v-for="(s,i) in stats" :key="i" class="stat-item" :class="i < stats.length-1 ? 'border-end-stat' : ''">
      <div class="stat-num">{{ displayed[i] || '0' }}</div>
      <div class="stat-label">{{ s.label }}</div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'TsStatsBar',
  name: 'TsStatsBar',
  data() {
    return {
      stats: [
        { target: 120, label: 'Trek Routes' },
        { target: 8400, label: 'Trekkers Registered' },
        { target: 340, label: 'Treks Completed' },
        { target: 60, label: 'Certified Guides' },
        { target: 18, label: 'States Covered' },
      ],
      displayed: [0, 0, 0, 0, 0]
    };
  },
  mounted() {
    const obs = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (!e.isIntersecting) return;
        this.stats.forEach((s, i) => this.countUp(i, s.target));
        obs.disconnect();
      });
    }, { threshold: 0.5 });
    obs.observe(this.$el);
  },
  methods: {
    countUp(i, t) {
      const dur = 1600, step = t / (dur / 16);
      let cur = 0;
      const tmr = setInterval(() => {
        cur = Math.min(cur + step, t);
        const v = Math.floor(cur);
        this.displayed[i] = t >= 1000 ? v.toLocaleString() : v + '+';
        if (cur >= t) {
          this.displayed[i] = t >= 1000 ? t.toLocaleString() : t + '+';
          clearInterval(tmr);
        }
      }, 16);
    }
  }
};
</script>
