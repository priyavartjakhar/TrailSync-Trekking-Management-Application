<template>
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
  </section>
</template>

<script>
import {
  SHORT_NAMES,
  SKIP_LABELS,
  normalizeName,
  pillClass
} from '../../data/trek_data.js';

export default {
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
        let state = t.location || '';
        if (state.includes(',')) {
          const parts = state.split(',');
          state = parts[parts.length - 1].trim();
        }
        state = normalizeName(state);
        if (state) {
          if (!map[state]) {
            map[state] = [];
          }
          map[state].push(t);
        }
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
        const res = await fetch('/api/public/trek_routes');
        if (res.ok) {
          const routes = await res.json();
          this.treksList = routes.map(r => ({
            ...r,
            status: r.active ? 'Open' : 'Closed'
          }));
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
              treks.forEach(t => {
                const statusTag = t.status === 'Open' ? '<span class="status-tag-open">Open</span>' : '<span class="status-tag-closed">Closed</span>';
                html += `<li><span class="tooltip-trek-name">${t.name} ${statusTag}</span><span class="tooltip-trek-meta">${t.difficulty}<br>${t.duration} days</span></li>`;
              });
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
  }
};
</script>
