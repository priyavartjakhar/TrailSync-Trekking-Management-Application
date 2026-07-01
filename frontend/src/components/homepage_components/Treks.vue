<template>
  <section class="treks-section" id="treks">
    <div class="treks-header">
      <div><div class="section-tag">Open Now</div><h2 class="section-title">Featured Treks</h2></div>
      <a href="/login?role=trekker" class="btn-ghost" style="border-color:rgba(26,46,26,0.28);color:var(--forest);">Book Treks →</a>
    </div>
    <div class="filter-bar">
      <button v-for="f in filters" :key="f.key"
        :class="['filter-btn', { active: activeFilter === f.key }]"
        @click="activeFilter = f.key">{{ f.label }}</button>
    </div>
    <div class="treks-grid">
      <div v-for="t in filteredTreks" :key="t.id" class="trek-card">
        <div class="trek-img">
          <img v-if="t.imageUrl" :src="t.imageUrl" :alt="t.name">
          <div v-else class="trek-img-placeholder" :style="{ background: getGradient(t) }" style="height:100%; display:flex; align-items:center; justify-content:center;">
            <svg viewBox="0 0 24 24" style="width:44px; height:44px; stroke:rgba(255,255,255,0.25); fill:none; stroke-width:1.5;"><path d="M3 17l4-8 4 4 4-6 4 10"/></svg>
          </div>
          <div :class="['trek-badge', badgeClass(t.difficulty)]">{{ diffLabel(t.difficulty) }}</div>
          <div :class="['trek-open-tag', t.status === 'Open' ? 'tag-open' : 'tag-closed']">● {{ t.status }}</div>
        </div>
        <div class="trek-body" style="display: flex; flex-direction: column; height: 260px;">
          <div class="trek-name" style="font-size: 1.15rem; font-weight: 700; color: var(--forest); margin-bottom: 0.25rem;">{{ t.name }}</div>
          <div class="trek-loc" style="display: flex; align-items: center; gap: 4px; font-size: 0.8rem; color: var(--stone); margin-bottom: 0.5rem;">
            <svg viewBox="0 0 24 24" width="12" height="12" stroke="currentColor" fill="none" stroke-width="2"><path d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><circle cx="12" cy="11" r="3"/></svg>
            {{ t.location }} State
          </div>
          <div class="trek-desc" style="font-size: 0.78rem; color: var(--stone); line-height: 1.45; margin-bottom: 0.75rem; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; text-overflow: ellipsis; flex-grow: 1;">
            {{ t.description }}
          </div>
          <div class="trek-guide-strip" style="display: flex; align-items: center; gap: 6px; font-size: 0.78rem; color: var(--bark); margin-bottom: 0.75rem;">
            <svg viewBox="0 0 24 24" width="12" height="12" stroke="currentColor" fill="none" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            <span>{{ t.staff ? 'Guide: ' + t.staff : 'Self-guided' }}</span>
          </div>
          <div class="trek-date" style="font-size: 0.75rem; color: var(--stone); margin-bottom: 0.75rem; font-family: monospace; display: flex; align-items: center; gap: 6px;">
            <svg viewBox="0 0 24 24" width="12" height="12" stroke="currentColor" fill="none" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            {{ t.startDate }} → {{ t.endDate }}
          </div>
          <div class="trek-meta" style="border-top: 1px solid rgba(26,46,26,0.08); padding-top: 0.75rem; margin-top: auto; display: flex; align-items: center; justify-content: space-between;">
            <div style="display: flex; flex-direction: column;">
              <div style="font-size: 0.75rem; color: var(--stone);">
                {{ t.duration }} Days • {{ t.slots - t.booked }} left
              </div>
              <div style="font-size: 0.7rem; color: var(--gold); font-weight: 600;">
                ~₹{{ Math.round(t.price / t.duration).toLocaleString() }}/day
              </div>
            </div>
            <div class="trek-price" style="font-size: 1.15rem; font-weight: 800; color: var(--forest);">₹{{ t.price.toLocaleString() }}</div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script>
export default {
  name: 'TsTreks',
  name: 'TsTreks',
  data() {
    return {
      activeFilter: 'all',
      filters: [
        { key:'all', label:'All Treks' },
        { key:'easy', label:'Easy' },
        { key:'moderate', label:'Moderate' },
        { key:'hard', label:'Hard' },
        { key:'short', label:'Under 5 Days' },
        { key:'long', label:'7+ Days' },
      ],
      treks: []
    };
  },
  computed: {
    filteredTreks() {
      let list = this.treks.filter(t => {
        const f = this.activeFilter;
        if (f === 'all') return true;
        if (f === 'easy') return t.difficulty.toLowerCase() === 'easy';
        if (f === 'moderate') return t.difficulty.toLowerCase() === 'moderate';
        if (f === 'hard') return t.difficulty.toLowerCase() === 'hard';
        if (f === 'short') return t.duration < 5;
        if (f === 'long') return t.duration >= 7;
        return true;
      });
      return list.slice(0, 6);
    }
  },
  mounted() {
    this.fetchTreks();
  },
  methods: {
    async fetchTreks() {
      try {
        const res = await fetch('/api/public/treks');
        if (res.ok) {
          this.treks = await res.json();
        }
      } catch (e) {
        console.error('Error fetching featured treks:', e);
      }
    },
    badgeClass(diff) {
      return { easy:'badge-easy', moderate:'badge-moderate', hard:'badge-hard' }[diff.toLowerCase()] || '';
    },
    diffLabel(diff) {
      return diff.charAt(0).toUpperCase() + diff.slice(1).toLowerCase();
    },
    getGradient(t) {
      const grads = ['#1a4a3a','#2d6b3d','#2a3a1a','#3d5b2d','#1a3a2a','#2d5b4a','#3a1a1a','#5b2d2d','#1a2a3a','#2d3b5b'];
      const id = t.id || 0;
      return `linear-gradient(135deg, ${grads[id % grads.length]}, rgba(0,0,0,0.5))`;
    }
  }
};
</script>
