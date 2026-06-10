// ============================================================
//  components.js  — all Vue 3 components for TrailSync
// ============================================================

// ── NAVBAR ──────────────────────────────────────────────────
const TsNavbar = {
  name: 'TsNavbar',
  data() { return { scrolled: false }; },
  mounted() {
    window.addEventListener('scroll', this.onScroll);
  },
  unmounted() {
    window.removeEventListener('scroll', this.onScroll);
  },
  methods: {
    onScroll() { this.scrolled = window.scrollY > 80; },
    handleLoginClick(role) {
      window.location.href = `/login?role=${role}`;
    }
  },
  template: `
  <nav :class="['ts-nav', { scrolled }]" id="navbar">
    <a href="/" class="brand-name">Trail<span>Sync</span></a>
    <ul class="nav-links d-none d-lg-flex">
      <li><a href="/#treks">Explore Treks</a></li>
      <li><a href="/#map-section">Trek Map</a></li>
      <li><a href="/#difficulty">Difficulty Guide</a></li>
      <li><a href="/#safety">Safety</a></li>
      <li><a href="/#faq">FAQ</a></li>
    </ul>
    <div class="nav-actions">
      <div class="nav-dropdown">
        <a href="#" class="btn-ghost dropdown-toggle-ts" @click.prevent="handleLoginClick('trekker')">Log In</a>
        <div class="dropdown-menu-ts">
          <a href="#" class="dropdown-item-ts" @click.prevent="handleLoginClick('admin')">Admin Login</a>
          <a href="#" class="dropdown-item-ts" @click.prevent="handleLoginClick('staff')">Staff Login</a>
          <a href="#" class="dropdown-item-ts" @click.prevent="handleLoginClick('trekker')">Trekker Login</a>
        </div>
      </div>
      <a href="/register" class="btn-primary-ts">Join Free</a>
    </div>
  </nav>`
};

// ── HERO ────────────────────────────────────────────────────
const TsHero = {
  name: 'TsHero',
  mounted() {
    const hv = document.getElementById('hero-video');
    window.addEventListener('scroll', () => {
      if (window.scrollY < window.innerHeight && hv)
        hv.style.transform = `scale(1.08) translateY(${window.scrollY * 0.22}px)`;
    });
  },
  template: `
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
  </section>`
};

// ── STATS BAR ───────────────────────────────────────────────
const TsStatsBar = {
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
  },
  template: `
  <div class="stats-bar">
    <div v-for="(s,i) in stats" :key="i" class="stat-item" :class="i < stats.length-1 ? 'border-end-stat' : ''">
      <div class="stat-num">{{ displayed[i] || '0' }}</div>
      <div class="stat-label">{{ s.label }}</div>
    </div>
  </div>`
};

// ── FEATURES ────────────────────────────────────────────────
const TsFeatures = {
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
  },
  template: `
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
  </section>`
};

// ── DIFFICULTY ──────────────────────────────────────────────
const TsDifficulty = {
  name: 'TsDifficulty',
  data() {
    return {
      levels: [
        {
          cls:'diff-easy', badge:'badge-e', dot:'●', label:'Easy',
          title:'First-timer Friendly',
          desc:'Perfect for beginners and families. Well-marked trails, gentle elevation gain, no technical climbing.',
          specs:['3–5 hours of walking per day','Elevation up to 3,500m','No prior trekking experience needed','Duration: 3–5 days typically'],
          treks:'Valley of Flowers · Tungnath · Nag Tibba · Kheerganga'
        },
        {
          cls:'diff-moderate', badge:'badge-m', dot:'●●', label:'Moderate',
          title:'Ready to Push Further',
          desc:'For those comfortable with longer days and higher altitude. Some steep sections and unpredictable weather.',
          specs:['5–7 hours of walking per day','Elevation 3,500m – 4,500m','Prior hiking experience helpful','Duration: 5–8 days typically'],
          treks:'Kedarkantha · Hampta Pass · Brahmatal · Kuari Pass'
        },
        {
          cls:'diff-hard', badge:'badge-h', dot:'●●●', label:'Hard',
          title:'For the Committed',
          desc:'High altitude, long days, technical terrain. These treks will test everything you have.',
          specs:['6–9 hours of walking per day','Elevation above 4,500m','Prior high-altitude experience mandatory','Duration: 7–12 days typically'],
          treks:'Roopkund · Pin Bhaba · Goecha La · Sandakphu'
        }
      ]
    };
  },
  template: `
  <section class="difficulty" id="difficulty">
    <div class="section-tag">Know Before You Go</div>
    <h2 class="section-title">Which difficulty<br>is right for you?</h2>
    <p class="section-lead">Not sure where to start? Here's an honest breakdown of what each level actually demands — fitness, time, and experience.</p>
    <div class="diff-grid">
      <div v-for="l in levels" :key="l.label" :class="['diff-card', l.cls]">
        <div class="diff-level-bar"></div>
        <div :class="['diff-badge', l.badge]">{{ l.dot }} {{ l.label }}</div>
        <div class="diff-title">{{ l.title }}</div>
        <p class="diff-desc">{{ l.desc }}</p>
        <ul class="diff-specs">
          <li v-for="s in l.specs" :key="s">{{ s }}</li>
        </ul>
        <div class="diff-treks">
          <div class="diff-treks-label">Popular Treks</div>
          <div class="diff-trek-names">{{ l.treks }}</div>
        </div>
      </div>
    </div>
  </section>`
};

// ── TREKS ───────────────────────────────────────────────────
const TsTreks = {
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
  },
  template: `
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
  </section>`
};

// ── MAP ─────────────────────────────────────────────────────
const TsMap = {
  name: 'TsMap',
  data() {
    return {
      pinnedState: null,
      panelVisible: false,
      panelName: '',
      panelCount: '',
      panelTreks: [],
      loading: true,
      treksList: []
    };
  },
  computed: {
    trekDataMap() {
      const map = {};
      this.treksList.forEach(t => {
        const state = t.location;
        if (!map[state]) {
          map[state] = [];
        }
        map[state].push(t);
      });
      return map;
    }
  },
  mounted() {
    this.fetchTreks();
  },
  methods: {
    pillClass(d) { return pillClass(d); },
    async fetchTreks() {
      try {
        const res = await fetch('/api/public/treks');
        if (res.ok) {
          this.treksList = await res.json();
        }
      } catch (e) {
        console.error('Error fetching map treks:', e);
      } finally {
        this.loading = false;
        this.$nextTick(() => this.initMap());
      }
    },
    showPanel(sn) {
      const treks = this.trekDataMap[sn] || [];
      this.panelName = sn;
      this.panelCount = treks.length > 0 ? `${treks.length} trek${treks.length !== 1 ? 's' : ''} listed` : 'No treks listed';
      this.panelTreks = treks;
      this.panelVisible = true;
    },
    initMap() {
      const container = this.$refs.mapContainer;
      if (!container || typeof d3 === 'undefined') return;

      const W = 460, H = 480;
      const svg = d3.select(container).append('svg')
        .attr('viewBox', `0 0 ${W} ${H}`)
        .attr('width', '100%')
        .style('display', 'none');

      const tooltip = d3.select(container).append('div').attr('class', 'map-tooltip');
      const projection = d3.geoMercator().center([82, 22.5]).scale(870).translate([W / 2 - 15, H / 2 + 10]);
      const path = d3.geoPath().projection(projection);
      const pG = svg.append('g');
      const lG = svg.append('g');
      const vm = this;

      const GEOJSON = 'https://raw.githubusercontent.com/Subhash9325/GeoJson-Data-of-Indian-States/master/Indian_States';

      d3.json(GEOJSON).then(data => {
        vm.loading = false;
        svg.style('display', 'block');

        pG.selectAll('path').data(data.features).enter().append('path')
          .attr('d', path).attr('class', 'map-state')
          .on('mouseover', function(event, d) {
            const sn = normalizeName(d.properties.NAME_1);
            if (!sn) return;
            const treks = vm.trekDataMap[sn] || [];
            let html = `<div class="map-tooltip-state">${sn}</div>`;
            if (treks.length > 0) {
              html += `<div class="tooltip-count-badge">${treks.length} trek${treks.length !== 1 ? 's' : ''}</div><ul class="map-tooltip-treks">`;
              treks.slice(0, 5).forEach(t => {
                const statusTag = t.status === 'Open' ? '<span class="status-tag-open">Open</span>' : '<span class="status-tag-closed">Closed</span>';
                html += `<li><span class="tooltip-trek-name">${t.name} ${statusTag}</span><span class="tooltip-trek-meta">${t.difficulty}<br>${t.duration} days</span></li>`;
              });
              if (treks.length > 5) html += `<li style="font-size:0.72rem;color:var(--stone);font-style:italic;">+${treks.length - 5} more — click to see all</li>`;
              html += `</ul>`;
            } else {
              html += `<div class="tooltip-no-treks">No treks listed for this state.</div>`;
            }
            tooltip.html(html).style('opacity', 1);
            d3.select(this).raise(); lG.raise();
          })
          .on('mousemove', function(event) {
            const r = container.getBoundingClientRect();
            let x = event.clientX - r.left + 14, y = event.clientY - r.top + 14;
            if (x + 280 > r.width) x = x - 280 - 28;
            tooltip.style('left', x + 'px').style('top', y + 'px');
          })
          .on('mouseout', function() {
            tooltip.style('opacity', 0);
          })
          .on('click', function(event, d) {
            const sn = normalizeName(d.properties.NAME_1);
            if (!sn) return;
            if (vm.pinnedState === sn) {
              vm.pinnedState = null;
              pG.selectAll('.map-state').classed('active-state', false);
              vm.panelVisible = false;
              return;
            }
            vm.pinnedState = sn;
            pG.selectAll('.map-state').classed('active-state', false);
            d3.select(this).classed('active-state', true);
            vm.showPanel(sn);
            tooltip.style('opacity', 0);
          });

        lG.selectAll('text').data(data.features).enter().append('text')
          .attr('class', 'state-label')
          .attr('transform', d => { const c = path.centroid(d); return `translate(${c[0]},${c[1]})`; })
          .text(d => { const n = d.properties.NAME_1; if (SKIP_LABELS.has(n)) return ''; return SHORT_NAMES[n] || n; })
          .attr('pointer-events', 'none');

      }).catch(err => {
        vm.loading = false;
        container.innerHTML = '<div style="text-align:center;padding:2rem;color:var(--stone);font-size:0.88rem;">Could not load map. Check your connection.</div>';
        console.error(err);
      });
    }
  },
  template: `
  <section class="map-section" id="map-section">
    <div class="section-tag">Trek Across India</div>
    <h2 class="section-title">We cover the whole country</h2>
    <p class="section-lead">From the Himalayas in the north to the Western Ghats in the south — hover any state to preview its treks, click to pin the detail panel.</p>
    <div class="map-wrap">
      <div>
        <div id="d3-map-container" ref="mapContainer">
          <div v-if="loading" class="map-loading">
            <div class="map-loading-spinner"></div>
            <span style="font-size:0.78rem;color:var(--stone);font-family:'Space Mono',monospace;letter-spacing:0.1em;">Loading map boundaries…</span>
          </div>
        </div>
        <div class="map-hint" v-if="!loading">HOVER to preview treks &nbsp;·&nbsp; CLICK to pin details &nbsp;·&nbsp; CLICK again to unpin</div>
      </div>
      <div class="map-info-panel">
        <div class="map-panel-placeholder" v-if="!panelVisible">
          <svg viewBox="0 0 24 24"><path d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"/></svg>
          <strong>Hover a state</strong>
          <p>Move over any state to see available treks. Click to pin the details panel.</p>
        </div>
        <div class="region-detail-panel" :class="{ visible: panelVisible }" v-if="panelVisible">
          <div class="rdp-header">
            <div class="rdp-region-name">{{ panelName }}</div>
            <div class="rdp-count">{{ panelCount }}</div>
          </div>
          <ul class="rdp-treks">
            <li v-if="panelTreks.length === 0" style="padding:1rem 1.5rem;color:var(--stone);font-size:0.85rem;font-style:italic;">No treks listed for this state.</li>
            <li v-for="t in panelTreks" :key="t.id" class="rdp-trek-item" style="display:flex; align-items:center; gap:8px;">
              <span class="rdp-trek-name" style="flex:1;">{{ t.name }}</span>
              <span class="rdp-trek-sub" style="margin-right:8px;">{{ t.duration }} days</span>
              <span :class="['diff-pill', pillClass(t.difficulty)]">{{ t.difficulty }}</span>
              <span :class="['status-badge-inline', t.status === 'Open' ? 'status-open' : 'status-closed']">{{ t.status }}</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  </section>`
};

// ── SAFETY ──────────────────────────────────────────────────
const TsSafety = {
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
  },
  template: `
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
  </section>`
};

// ── TRAIL STEPS ─────────────────────────────────────────────
const TsTrailSteps = {
  name: 'TsTrailSteps',
  template: `
  <div class="trail" id="about">
    <div class="trail-image">
      <img src="https://images.unsplash.com/photo-1551632811-561732d1e306?w=800&q=80" alt="Trekkers on trail">
    </div>
    <div class="trail-content">
      <div class="section-tag">Getting Started</div>
      <h2 class="section-title">Summit in<br>3 steps</h2>
      <p class="section-lead">From sign-up to summit — deliberately simple.</p>
      <div class="steps">
        <div class="step">
          <div class="step-num">01</div>
          <div class="step-text"><strong>Create your free account</strong>Register in 90 seconds. No approval, no waiting — just your email and a password.</div>
        </div>
        <div class="step">
          <div class="step-num">02</div>
          <div class="step-text"><strong>Find your trail</strong>Filter by difficulty, duration, and location. See live slots. When you find the right one, you'll know.</div>
        </div>
        <div class="step">
          <div class="step-num">03</div>
          <div class="step-text"><strong>Book and prepare</strong>Confirm in seconds. We'll send reminders, your gear list, and briefing details as the date approaches.</div>
        </div>
      </div>
      <a href="/register" class="btn-primary-ts btn-large mt-4 d-inline-block">Start Free →</a>
    </div>
  </div>`
};

// ── TESTIMONIALS ────────────────────────────────────────────
const TsTestimonials = {
  name: 'TsTestimonials',
  data() {
    return {
      testimonials: [
        { initials:'AR', name:'Arjun Rawat', meta:'Kedarkantha · Dec 2024 · 7 treks total', text:"I'd googled Kedarkantha six times over two years. Booked it on TrailSync on a Tuesday. Stood on the summit by Saturday. Still can't believe I waited that long." },
        { initials:'MJ', name:'Meera Joshi', meta:'Valley of Flowers · Jun 2024 · 2 treks total', text:"First trek ever. The difficulty guide helped me pick Valley of Flowers — perfect for a beginner. The pre-trek briefing made me feel prepared. Came back completely hooked." },
        { initials:'VK', name:'Vikram Khanna', meta:'Roopkund · Sep 2024 · 12 treks total', text:"Roopkund. 5,029m. 8 days. Zero signal for most of it. Came back a different person. TrailSync made the logistics invisible — I just showed up and climbed." },
      ]
    };
  },
  template: `
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
  </section>`
};

// ── FAQ ─────────────────────────────────────────────────────
const TsFaq = {
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
  },
  template: `
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
  </section>`
};

// ── CTA BANNER ──────────────────────────────────────────────
const TsCtaBanner = {
  name: 'TsCtaBanner',
  template: `
  <div class="cta-banner">
    <h2>The trail is open right now.</h2>
    <p>Stop saving it for someday. Join 8,400+ trekkers already planning their next ascent on TrailSync.</p>
    <a href="/register" class="btn-dark">Create Free Account</a>
  </div>`
};

// ── FOOTER ──────────────────────────────────────────────────
const TsFooter = {
  name: 'TsFooter',
  template: `
  <footer>
    <div class="footer-grid">
      <div>
        <span class="footer-brand-name">Trail<span>Sync</span></span>
        <p class="footer-tagline">India's trekking platform. 120+ verified trails across 18 states. Real-time bookings, certified guides, zero spreadsheets.</p>
        <div class="footer-social">
          <a href="#" class="social-link" aria-label="Instagram">
            <svg viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
          </a>
          <a href="#" class="social-link" aria-label="Twitter">
            <svg viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
          </a>
          <a href="#" class="social-link" aria-label="YouTube">
            <svg viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
          </a>
          <a href="#" class="social-link" aria-label="LinkedIn">
            <svg viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
          </a>
        </div>
      </div>
      <div class="footer-col">
        <h4>Explore</h4>
        <ul>
          <li><a href="#">All Treks</a></li>
          <li><a href="#">Easy Treks</a></li>
          <li><a href="#">Moderate Treks</a></li>
          <li><a href="#">Hard Treks</a></li>
          <li><a href="#">Trek Calendar</a></li>
          <li><a href="#">Trek Map</a></li>
        </ul>
      </div>
      <div class="footer-col">
        <h4>Information</h4>
        <ul>
          <li><a href="#">How It Works</a></li>
          <li><a href="#">Difficulty Guide</a></li>
          <li><a href="#">Safety Standards</a></li>
          <li><a href="#">Booking Policy</a></li>
          <li><a href="#">Cancellation Policy</a></li>
        </ul>
      </div>
      <div class="footer-col">
        <h4>Account</h4>
        <ul>
          <li><a href="/register">Register Free</a></li>
          <li><a href="/login">Log In</a></li>
          <li><a href="#">My Bookings</a></li>
          <li><a href="#">Trek History</a></li>
          <li><a href="#">Export CSV</a></li>
          <li><a href="#">Edit Profile</a></li>
        </ul>
      </div>
    </div>
    <div class="footer-bottom">
      <span>© 2025 TrailSync · India's Trekking Platform</span>
      <div style="display:flex;gap:1.5rem;">
        <a href="#">Privacy Policy</a>
        <a href="#">Terms of Use</a>
        <a href="#">Contact</a>
      </div>
    </div>
  </footer>`
};
