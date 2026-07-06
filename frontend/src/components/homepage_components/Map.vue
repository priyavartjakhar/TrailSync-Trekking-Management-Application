<template>
  <section class="map-section" id="map-section">
    <div class="section-tag">Trek Across India</div>
    <h2 class="section-title">We cover the whole country</h2>
    <p class="section-lead">From the Himalayas in the north to the Western Ghats in the south — hover any state to preview its treks, click to pin the detail panel.</p>
    <div class="map-wrap">
      <div>
        <div id="map-container" ref="mapContainer" @mouseleave="hideTooltip">
          <div v-if="loading" class="map-loading">
            <div class="map-loading-spinner"></div>
            <span style="font-size:0.78rem;color:var(--stone);font-family:'Space Mono',monospace;letter-spacing:0.1em;">Loading map boundaries…</span>
          </div>
          <div v-else-if="mapError" class="map-error">
            Could not load map. Check your connection.
          </div>
          <svg v-else-if="mapFeatures.length" viewBox="0 0 460 480" width="100%" class="india-map-svg" aria-label="Interactive India trek map">
            <g>
              <path
                v-for="feature in mapFeatures"
                :key="feature.key"
                :d="feature.path"
                :class="['map-state', { 'active-state': pinnedState === feature.name }]"
                @mouseenter="showTooltip($event, feature)"
                @mousemove="moveTooltip($event)"
                @mouseleave="hideTooltip"
                @click="toggleState(feature)"
              />
            </g>
            <g>
              <text
                v-for="feature in labelFeatures"
                :key="`${feature.key}-label`"
                class="state-label"
                :x="feature.labelX"
                :y="feature.labelY"
              >
                {{ feature.label }}
              </text>
            </g>
          </svg>
          <div
            v-if="tooltipVisible"
            class="map-tooltip"
            :style="{ left: `${tooltipX}px`, top: `${tooltipY}px`, opacity: 1 }"
          >
            <div class="map-tooltip-state">{{ tooltipName }}</div>
            <template v-if="tooltipTreks.length">
              <div class="tooltip-count-badge">{{ tooltipCount }}</div>
              <ul class="map-tooltip-treks">
                <li v-for="t in tooltipTreks" :key="t.id">
                  <span class="tooltip-trek-name">
                    {{ t.name }}
                    <span :class="t.status === 'Open' ? 'status-tag-open' : 'status-tag-closed'">{{ t.status }}</span>
                  </span>
                  <span class="tooltip-trek-meta">{{ t.difficulty }}<br>{{ t.duration }} days</span>
                </li>
              </ul>
            </template>
            <div v-else class="tooltip-no-treks">No treks listed for this state.</div>
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
/**
 * =========================================================================
 * Map.vue
 * =========================================================================
 * Interactive coordinate visualizer showcasing the geographic placement of routes using lightweight responsive SVGs.
 * 
 * Part of the public landing page components. Renders static descriptions
 * and interactive catalog sections prior to authentication.
 */

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
      mapError: false,
      mapFeatures: [],
      tooltipVisible: false,
      tooltipName: '',
      tooltipTreks: [],
      tooltipX: 0,
      tooltipY: 0,
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
    },
    labelFeatures() {
      return this.mapFeatures.filter(feature => feature.label);
    },
    tooltipCount() {
      const count = this.tooltipTreks.length;
      return `${count} trek${count !== 1 ? 's' : ''}`;
    }
  },
  mounted() {
    this.loadMapData();
  },
  methods: {
    pillClass(d) { return pillClass(d); },
    async loadMapData() {
      this.loading = true;
      this.mapError = false;
      try {
        await Promise.all([this.fetchTreks(), this.fetchBoundaries()]);
      } catch (e) {
        this.mapError = true;
        console.error('Error loading map:', e);
      } finally {
        this.loading = false;
      }
    },
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
      }
    },
    async fetchBoundaries() {
      const geoJsonUrl = 'https://raw.githubusercontent.com/Subhash9325/GeoJson-Data-of-Indian-States/master/Indian_States';
      const res = await fetch(geoJsonUrl);
      if (!res.ok) throw new Error(`Map boundaries request failed with ${res.status}`);
      const data = await res.json();
      this.mapFeatures = (data.features || [])
        .map((feature, index) => this.buildFeature(feature, index))
        .filter(feature => feature && feature.name);
    },
    buildFeature(feature, index) {
      const rawName = feature?.properties?.NAME_1 || '';
      const name = normalizeName(rawName);
      if (!name) return null;

      const path = this.geometryToPath(feature.geometry);
      if (!path) return null;

      const centroid = this.geometryCentroid(feature.geometry);
      const label = SKIP_LABELS.has(rawName) ? '' : (SHORT_NAMES[rawName] || SHORT_NAMES[name] || rawName);

      return {
        key: `${rawName}-${index}`,
        rawName,
        name,
        path,
        label,
        labelX: centroid.x,
        labelY: centroid.y
      };
    },
    geometryToPath(geometry) {
      if (!geometry) return '';
      if (geometry.type === 'Polygon') {
        return this.polygonToPath(geometry.coordinates);
      }
      if (geometry.type === 'MultiPolygon') {
        return geometry.coordinates.map(polygon => this.polygonToPath(polygon)).join(' ');
      }
      return '';
    },
    polygonToPath(rings = []) {
      return rings.map((ring) => {
        const points = ring
          .map(point => this.project(point))
          .filter(Boolean);
        if (!points.length) return '';
        const [first, ...rest] = points;
        return `M${this.fmt(first.x)},${this.fmt(first.y)}${rest.map(p => `L${this.fmt(p.x)},${this.fmt(p.y)}`).join('')}Z`;
      }).join(' ');
    },
    geometryCentroid(geometry) {
      const points = this.collectProjectedPoints(geometry);
      if (!points.length) return { x: 0, y: 0 };
      const totals = points.reduce((acc, point) => {
        acc.x += point.x;
        acc.y += point.y;
        return acc;
      }, { x: 0, y: 0 });
      return {
        x: this.fmt(totals.x / points.length),
        y: this.fmt(totals.y / points.length)
      };
    },
    collectProjectedPoints(geometry) {
      const points = [];
      const addRing = (ring = []) => {
        ring.forEach((coord) => {
          const projected = this.project(coord);
          if (projected) points.push(projected);
        });
      };
      if (geometry?.type === 'Polygon') {
        (geometry.coordinates || []).forEach(addRing);
      } else if (geometry?.type === 'MultiPolygon') {
        (geometry.coordinates || []).forEach(polygon => polygon.forEach(addRing));
      }
      return points;
    },
    project(coord) {
      if (!Array.isArray(coord) || coord.length < 2) return null;
      const [lng, lat] = coord;
      const toRad = Math.PI / 180;
      const scale = 870;
      const centerLng = 82;
      const centerLat = 22.5;
      const translateX = 460 / 2 - 15;
      const translateY = 480 / 2 + 10;
      const mercY = (value) => Math.log(Math.tan(Math.PI / 4 + (value * toRad) / 2));
      return {
        x: translateX + (lng - centerLng) * toRad * scale,
        y: translateY + (mercY(centerLat) - mercY(lat)) * scale
      };
    },
    fmt(value) {
      return Number(value.toFixed(2));
    },
    showPanel(sn) {
      const treks = this.trekDataMap[sn] || [];
      this.panelName = sn;
      this.panelCount = treks.length > 0 ? `${treks.length} trek${treks.length !== 1 ? 's' : ''} listed` : 'No treks listed';
      this.panelTreks = treks;
      this.panelVisible = true;
    },
    showTooltip(event, feature) {
      this.tooltipName = feature.name;
      this.tooltipTreks = this.trekDataMap[feature.name] || [];
      this.tooltipVisible = true;
      this.moveTooltip(event);
    },
    moveTooltip(event) {
      const container = this.$refs.mapContainer;
      if (!container) return;
      const rect = container.getBoundingClientRect();
      let x = event.clientX - rect.left + 14;
      let y = event.clientY - rect.top + 14;
      if (x + 280 > rect.width) x = x - 280 - 28;
      this.tooltipX = x;
      this.tooltipY = y;
    },
    hideTooltip() {
      this.tooltipVisible = false;
    },
    toggleState(feature) {
      if (this.pinnedState === feature.name) {
        this.pinnedState = null;
        this.panelVisible = false;
        return;
      }
      this.pinnedState = feature.name;
      this.showPanel(feature.name);
      this.hideTooltip();
    }
  }
};
</script>
