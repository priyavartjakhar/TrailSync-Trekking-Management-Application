<template>
  <section class="tab-section-content">
    <div class="page-header">
      <div class="page-header-left">
        <div class="page-eyebrow">Open Adventures</div>
        <div class="page-title">Explore <em>Treks</em></div>
      </div>
      <button class="btn-back-home" @click="goTab('dashboard')">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
        Back to Home
      </button>
    </div>

    <!-- Search & Filters -->
    <div class="ts-card" style="margin-bottom:1.5rem; padding:1.25rem 1.5rem; overflow:visible;">
      <div class="explore-toolbar-row">
        <div class="explore-search-column">
          <label style="font-size:0.72rem; font-weight:600; color:var(--forest); text-transform:uppercase; letter-spacing:0.06em; display:block; margin-bottom:5px">Search</label>
          <div class="topbar-search" style="width:100%; max-width:100%; border-radius:var(--radius)">
            <svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input v-model="searchQuery" type="text" placeholder="Trek name, location…" />
          </div>
        </div>
        <button v-if="isMobileView" class="btn-outline explore-filters-toggle" @click="toggleMobileFilters">
          {{ showMobileFilters ? 'Hide Filters' : 'Filters' }}
        </button>
      </div>

      <div v-if="!isMobileView || showMobileFilters" class="explore-filter-panel">
        <div class="explore-filter-grid">
          <div style="min-width:160px">
            <label style="font-size:0.72rem; font-weight:600; color:var(--forest); text-transform:uppercase; letter-spacing:0.06em; display:block; margin-bottom:5px">Difficulty</label>
            <div class="custom-select-wrapper" :class="{ 'is-open': showDiffFilterDropdown }">
              <div class="custom-select-trigger" @click.stop="toggleFilterDropdown('showDiffFilterDropdown')">
                <span>{{ difficultyFilter || 'All Levels' }}</span>
                <svg viewBox="0 0 24 24" class="custom-select-arrow" :class="{ open: showDiffFilterDropdown }"><polyline points="6 9 12 15 18 9"/></svg>
              </div>
              <div v-if="showDiffFilterDropdown" class="custom-select-dropdown">
                <div class="custom-select-options">
                  <div class="custom-select-option" :class="{ selected: !difficultyFilter || difficultyFilter === 'All' }" @click="difficultyFilter = ''; showDiffFilterDropdown = false;">All Levels</div>
                  <div v-for="opt in ['Easy', 'Moderate', 'Hard']" :key="opt" class="custom-select-option" :class="{ selected: difficultyFilter === opt }" @click="difficultyFilter = opt; showDiffFilterDropdown = false;">{{ opt }}</div>
                </div>
              </div>
            </div>
          </div>
          <div style="min-width:160px">
            <label style="font-size:0.72rem; font-weight:600; color:var(--forest); text-transform:uppercase; letter-spacing:0.06em; display:block; margin-bottom:5px">Location</label>
            <div class="custom-select-wrapper" :class="{ 'is-open': showLocFilterDropdown }">
              <div class="custom-select-trigger" @click.stop="toggleFilterDropdown('showLocFilterDropdown')">
                <span>{{ locationFilter || 'All Locations' }}</span>
                <svg viewBox="0 0 24 24" class="custom-select-arrow" :class="{ open: showLocFilterDropdown }"><polyline points="6 9 12 15 18 9"/></svg>
              </div>
              <div v-if="showLocFilterDropdown" class="custom-select-dropdown">
                <div class="custom-select-options">
                  <div class="custom-select-option" :class="{ selected: !locationFilter || locationFilter === 'All' }" @click="locationFilter = ''; showLocFilterDropdown = false;">All Locations</div>
                  <div v-for="loc in uniqueLocations" :key="loc" class="custom-select-option" :class="{ selected: locationFilter === loc }" @click="locationFilter = loc; showLocFilterDropdown = false;">{{ loc }}</div>
                </div>
              </div>
            </div>
          </div>
          <div style="min-width:160px">
            <label style="font-size:0.72rem; font-weight:600; color:var(--forest); text-transform:uppercase; letter-spacing:0.06em; display:block; margin-bottom:5px">Duration</label>
            <div class="custom-select-wrapper" :class="{ 'is-open': showDurFilterDropdown }">
              <div class="custom-select-trigger" @click.stop="toggleFilterDropdown('showDurFilterDropdown')">
                <span>{{ durationFilter === '1-5' ? '1–5 days' : durationFilter === '6-9' ? '6–9 days' : durationFilter === '10+' ? '10+ days' : 'Any Duration' }}</span>
                <svg viewBox="0 0 24 24" class="custom-select-arrow" :class="{ open: showDurFilterDropdown }"><polyline points="6 9 12 15 18 9"/></svg>
              </div>
              <div v-if="showDurFilterDropdown" class="custom-select-dropdown">
                <div class="custom-select-options">
                  <div class="custom-select-option" :class="{ selected: !durationFilter }" @click="durationFilter = ''; showDurFilterDropdown = false;">Any Duration</div>
                  <div class="custom-select-option" :class="{ selected: durationFilter === '1-5' }" @click="durationFilter = '1-5'; showDurFilterDropdown = false;">1–5 days</div>
                  <div class="custom-select-option" :class="{ selected: durationFilter === '6-9' }" @click="durationFilter = '6-9'; showDurFilterDropdown = false;">6–9 days</div>
                  <div class="custom-select-option" :class="{ selected: durationFilter === '10+' }" @click="durationFilter = '10+'; showDurFilterDropdown = false;">10+ days</div>
                </div>
              </div>
            </div>
          </div>
          <button class="btn-outline" style="white-space:nowrap; align-self:flex-end" @click="resetFilters">Reset</button>
        </div>
      </div>

      <!-- Quick filter chips -->
      <div class="treks-filter-bar" style="margin-top:1rem; margin-bottom:0">
        <button v-for="f in ['All','Easy','Moderate','Hard']" :key="f"
          class="filter-chip" :class="{ active: quickFilter === f, ['chip-'+f.toLowerCase()]: f !== 'All' }"
          @click="quickFilter = f">{{ f }}</button>
        <span style="margin-left:auto; font-size:0.78rem; color:var(--stone); align-self:center">
          {{ filteredTreks.length }} trek{{ filteredTreks.length !== 1 ? 's' : '' }} found
        </span>
      </div>
      <div style="margin-top:0.75rem; display:flex; flex-wrap:wrap; gap:0.75rem; align-items:center;">
        <button
          class="filter-chip"
          :class="{ active: showBookableOnly }"
          @click="showBookableOnly = !showBookableOnly">
          Slots Available
        </button>
        <span style="font-size:0.78rem; color:var(--stone);">
          {{ bookableTreksCount }} trek{{ bookableTreksCount !== 1 ? 's' : '' }} currently have bookable batch seats
        </span>
      </div>
    </div>

    <!-- Trek cards grid -->
    <div class="treks-grid-user">
      <div v-for="t in filteredTreks" :key="t.id" class="trek-card-user" @click="openBookingModal(t)" style="cursor:pointer;">
        <div class="trek-img-user">
          <img v-if="t.imageUrl" :src="t.imageUrl" :alt="t.name" style="width: 100%; height: 100%; object-fit: cover;" />
          <div v-else class="trek-img-placeholder" :style="{ background: getGradient(t) }">
            <svg viewBox="0 0 24 24"><path d="M3 17l4-8 4 4 4-6 4 10"/></svg>
          </div>
          <span :class="'trek-badge badge-' + t.difficulty.toLowerCase()">{{ t.difficulty }}</span>
          <span class="trek-open-tag">Open</span>
        </div>
        <div class="trek-body" style="display: flex; flex-direction: column; min-height: 220px;">
          <div class="trek-name-user">{{ t.name }}</div>
          <div class="trek-loc-user" style="margin-bottom: 0.4rem;">
            <svg viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
            {{ t.place ? t.place + ", " : "" }}{{ t.location }}
          </div>
          <div style="font-size:0.78rem; color:var(--stone); margin-bottom:0.75rem; line-height:1.5; flex-grow: 1;">{{ cleanDescription(t) }}</div>
          <div class="trek-row-meta" style="margin-bottom:1rem; border-top: 1px solid var(--stone-light); padding-top: 8px;">
            <span class="trek-meta-pill">
              <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              {{ t.duration }} days
            </span>
            <span class="trek-meta-pill">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="12" height="12"><path d="M3 17l4-8 4 4 4-6 4 10"/></svg>
              {{ t.distance || 12 }} km
            </span>
          </div>
          <button class="btn-book" @click.stop="openBookingModal(t)">
            Book Now
          </button>
        </div>
      </div>
    </div>

    <div v-if="filteredTreks.length === 0" class="empty-state" style="margin-top:1rem">
      <svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
      <p>No treks match your filters.</p>
      <p><a href="#" @click.prevent="resetFilters" style="color: var(--gold); text-decoration: underline;">Clear all filters</a></p>
    </div>
  </section>
</template>

<script>
export default {
  name: 'TabExplore',
  props: {
    availableTreks: { type: Array, default: () => [] }
  },
  emits: ['book-trek', 'change-tab'],
  data() {
    return {
      searchQuery: '',
      difficultyFilter: '',
      locationFilter: '',
      durationFilter: '',
      quickFilter: 'All',
      showBookableOnly: false,
      showDiffFilterDropdown: false,
      showLocFilterDropdown: false,
      showDurFilterDropdown: false,
      showMobileFilters: false,
      isMobileView: false
    };
  },
  computed: {
    uniqueLocations() {
      const states = this.availableTreks.map(t => {
        if (!t.location) return '';
        const parts = t.location.split(',');
        return parts.length > 1 ? parts[parts.length - 1].trim() : t.location.trim();
      }).filter(s => s);
      return [...new Set(states)].sort();
    },
    filteredTreks() {
      return this.availableTreks.filter(t => {
        const q = this.searchQuery.toLowerCase();
        const matchSearch = !q || t.name.toLowerCase().includes(q) || t.location.toLowerCase().includes(q);
        const matchDiff = !this.difficultyFilter || this.difficultyFilter === 'All' || t.difficulty === this.difficultyFilter;
        const matchLoc = !this.locationFilter || this.locationFilter === 'All' || (
          t.location && (
            t.location.trim() === this.locationFilter ||
            t.location.split(',').map(s => s.trim()).includes(this.locationFilter)
          )
        );
        const matchDur = !this.durationFilter || this.durationFilter === '' || (
          this.durationFilter === '1-5' ? t.duration <= 5 :
          this.durationFilter === '6-9' ? t.duration >= 6 && t.duration <= 9 :
          t.duration >= 10
        );
        const matchQuick = this.quickFilter === 'All' || t.difficulty === this.quickFilter;
        const matchBookable = !this.showBookableOnly || this.hasBookableSlots(t);
        return matchSearch && matchDiff && matchLoc && matchDur && matchQuick && matchBookable;
      });
    },
    bookableTreksCount() {
      return this.availableTreks.filter(t => this.hasBookableSlots(t)).length;
    }
  },
  mounted() {
    this.handleViewport();
    window.addEventListener('resize', this.handleViewport);
    document.addEventListener('click', this.clickListener);
  },
  beforeUnmount() {
    window.removeEventListener('resize', this.handleViewport);
    document.removeEventListener('click', this.clickListener);
  },
  methods: {
    handleViewport() {
      this.isMobileView = window.innerWidth <= 900;
      if (!this.isMobileView) {
        this.showMobileFilters = false;
      }
    },
    goTab(tab) {
      this.$emit('change-tab', tab);
    },
    toggleFilterDropdown(type) {
      const current = this[type];
      this.showDiffFilterDropdown = false;
      this.showLocFilterDropdown = false;
      this.showDurFilterDropdown = false;
      this[type] = !current;
    },
    toggleMobileFilters() {
      this.showMobileFilters = !this.showMobileFilters;
    },
    clickListener(e) {
      if (!e.target.closest('.custom-select-wrapper')) {
        this.showDiffFilterDropdown = false;
        this.showLocFilterDropdown = false;
        this.showDurFilterDropdown = false;
      }
    },
    resetFilters() {
      this.searchQuery = '';
      this.difficultyFilter = '';
      this.locationFilter = '';
      this.durationFilter = '';
      this.quickFilter = 'All';
      this.showBookableOnly = false;
    },
    openBookingModal(t) {
      this.$emit('book-trek', t);
    },
    hasBookableSlots(t) {
      if (Array.isArray(t.batches) && t.batches.length) {
        return t.batches.some(b => this.slotsLeft(b) > 0);
      }
      return this.slotsLeft(t) > 0;
    },
    slotsLeft(t) { 
      return Math.max(0, Number(t?.slots || 0) - Number(t?.booked || 0)); 
    },
    getGradient(t) {
      const grads = ['#1a4a3a','#2d6b3d','#2a3a1a','#3d5b2d','#1a3a2a','#2d5b4a','#3a1a1a','#5b2d2d','#1a2a3a','#2d3b5b'];
      const id = t.id || 0;
      return `linear-gradient(135deg, ${grads[id % grads.length]}, rgba(0,0,0,0.5))`;
    },
    cleanDescription(t) {
      if (!t.description) return '';
      if (t.description.length > 120) return t.description.slice(0, 117) + '...';
      return t.description;
    }
  }
};
</script>
