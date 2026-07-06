<template>
  <!-- ── PAGE WRAPPER ──────────────────────────────── -->
  <section class="tab-section-content">

    <!-- ── PAGE HEADER ───────────────────────────────── -->
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

    <!-- ── SEARCH & FILTER BAR ────────────────────────── -->
    <!-- Search input, desktop filter dropdowns, quick-filter chips, and the bookable-slots toggle -->
    <div class="ts-card" style="margin-bottom:1.5rem; padding:1.25rem 1.5rem; overflow:visible;">
      <div class="explore-toolbar-row">
        <div class="explore-search-column">
          <label style="font-size:0.72rem; font-weight:600; color:var(--forest); text-transform:uppercase; letter-spacing:0.06em; display:block; margin-bottom:5px">Search</label>
          <div class="topbar-search" style="width:100%; max-width:100%; border-radius:var(--radius)">
            <svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input v-model="searchQuery" type="text" placeholder="Trek name, location…" />
          </div>
        </div>
        <!-- On mobile, filters are collapsed behind a toggle button -->
        <button v-if="isMobileView" class="btn-outline explore-filters-toggle" @click="toggleMobileFilters">
          {{ showMobileFilters ? 'Hide Filters' : 'Filters' }}
        </button>
      </div>

      <!-- Advanced filter dropdowns (Difficulty, Location, Duration) — hidden on mobile until toggled -->
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

      <!-- Quick filter chips for difficulty and bookable-slot toggle -->
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

    <!-- ── TREK CARDS GRID ─────────────────────────────── -->
    <!-- Each card is clickable and opens the booking modal for the selected trek -->
    <div class="treks-grid-user">
      <div v-for="t in filteredTreks" :key="t.id" class="trek-card-user" @click="openBookingModal(t)" style="cursor:pointer;">
        <div class="trek-img-user">
          <!-- Display uploaded image if available; otherwise render a gradient placeholder with a mountain icon -->
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

    <!-- ── EMPTY STATE ────────────────────────────────── -->
    <!-- Shown when no treks match the active combination of filters -->
    <div v-if="filteredTreks.length === 0" class="empty-state" style="margin-top:1rem">
      <svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
      <p>No treks match your filters.</p>
      <p><a href="#" @click.prevent="resetFilters" style="color: var(--gold); text-decoration: underline;">Clear all filters</a></p>
    </div>
  </section>
</template>

<script>
/**
 * TabExplore Component (Trekker Dashboard)
 * Renders the search catalog of open treks for registration.
 *
 * Displays all available (open) treks as browsable cards with rich filtering
 * capabilities: full-text search, difficulty, location, duration dropdowns,
 * quick-filter chips, and a bookable-slot toggle. Clicking a card or its
 * "Book Now" button emits `book-trek` so the parent can open PaymentModal.
 *
 * Communication Structure:
 * - Inputs (Props): Receives 'availableTreks' from the parent UserDashboard coordinate state.
 * - Outputs (Events): Emits 'book-trek' (triggers booking modal) and 'change-tab' (navigation).
 */
export default {
  name: 'TabExplore',
  props: {
    availableTreks: { type: Array, default: () => [] },
    initialSearchQuery: { type: String, default: '' }
  },
  emits: ['book-trek', 'change-tab'],
  watch: {
    initialSearchQuery(newVal) {
      this.searchQuery = newVal;
    }
  },
  data() {
    return {
      // ── SEARCH & TEXT FILTER ────────────────────────────
      /** Full-text search string matched against trek name and location. */
      searchQuery: '',

      // ── DROPDOWN FILTERS ────────────────────────────────
      /** Active difficulty filter value — one of 'Easy', 'Moderate', 'Hard', or '' (all). */
      difficultyFilter: '',
      /** Active state/location filter derived from trek location strings. */
      locationFilter: '',
      /** Active duration bucket: '1-5', '6-9', '10+', or '' (any). */
      durationFilter: '',

      // ── QUICK CHIP FILTER ───────────────────────────────
      /** Selected difficulty chip — 'All', 'Easy', 'Moderate', or 'Hard'. */
      quickFilter: 'All',
      /** When true, only treks with at least one batch having open slots are shown. */
      showBookableOnly: false,

      // ── DROPDOWN OPEN/CLOSE STATE ───────────────────────
      /** Controls visibility of the Difficulty custom dropdown. */
      showDiffFilterDropdown: false,
      /** Controls visibility of the Location custom dropdown. */
      showLocFilterDropdown: false,
      /** Controls visibility of the Duration custom dropdown. */
      showDurFilterDropdown: false,

      // ── MOBILE RESPONSIVE STATE ─────────────────────────
      /** True when viewport width is ≤ 900px; collapses filter panel on mobile. */
      showMobileFilters: false,
      /** Tracks whether the current viewport qualifies as mobile. */
      isMobileView: false
    };
  },
  computed: {
    /**
     * Returns a deduplicated, sorted list of state/region names extracted from
     * trek location strings (e.g., "Manali, Himachal Pradesh" → "Himachal Pradesh").
     * Used to populate the Location filter dropdown.
     */
    uniqueLocations() {
      const states = this.availableTreks.map(t => {
        if (!t.location) return '';
        const parts = t.location.split(',');
        return parts.length > 1 ? parts[parts.length - 1].trim() : t.location.trim();
      }).filter(s => s);
      return [...new Set(states)].sort();
    },

    /**
     * Returns the subset of `availableTreks` that satisfy all active filters simultaneously:
     * full-text search, difficulty dropdown, location dropdown, duration range, quick chip,
     * and the bookable-slots toggle.
     */
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

    /**
     * Returns the total count of treks in `availableTreks` that have at least one
     * batch with remaining open slots. Used for the informational label beside the toggle.
     */
    bookableTreksCount() {
      return this.availableTreks.filter(t => this.hasBookableSlots(t)).length;
    }
  },
  mounted() {
    this.searchQuery = this.initialSearchQuery;
    // Determine initial viewport size and listen for window resizes to keep isMobileView in sync.
    this.handleViewport();
    window.addEventListener('resize', this.handleViewport);
    // Close any open filter dropdowns when the user clicks outside a select wrapper.
    document.addEventListener('click', this.clickListener);
  },
  beforeUnmount() {
    // Clean up event listeners to prevent memory leaks after the component is destroyed.
    window.removeEventListener('resize', this.handleViewport);
    document.removeEventListener('click', this.clickListener);
  },
  methods: {
    /**
     * Updates `isMobileView` based on current window width (breakpoint: 900px).
     * Also hides the mobile filter panel when switching back to desktop.
     */
    handleViewport() {
      this.isMobileView = window.innerWidth <= 900;
      if (!this.isMobileView) {
        this.showMobileFilters = false;
      }
    },

    /**
     * Emits 'change-tab' to navigate the user to a different dashboard tab.
     * @param {string} tab - The tab identifier to navigate to (e.g., 'dashboard').
     */
    goTab(tab) {
      this.$emit('change-tab', tab);
    },

    /**
     * Toggles the specified filter dropdown open/closed while closing all others.
     * Ensures only one custom dropdown is open at a time.
     * @param {string} type - Data property name of the dropdown to toggle
     *   ('showDiffFilterDropdown' | 'showLocFilterDropdown' | 'showDurFilterDropdown').
     */
    toggleFilterDropdown(type) {
      const current = this[type];
      this.showDiffFilterDropdown = false;
      this.showLocFilterDropdown = false;
      this.showDurFilterDropdown = false;
      this[type] = !current;
    },

    /**
     * Toggles the visibility of the advanced filter panel on mobile viewports.
     */
    toggleMobileFilters() {
      this.showMobileFilters = !this.showMobileFilters;
    },

    /**
     * Global document click handler that closes all open filter dropdowns when
     * the user clicks anywhere outside a `.custom-select-wrapper` element.
     * @param {MouseEvent} e - The DOM click event.
     */
    clickListener(e) {
      if (!e.target.closest('.custom-select-wrapper')) {
        this.showDiffFilterDropdown = false;
        this.showLocFilterDropdown = false;
        this.showDurFilterDropdown = false;
      }
    },

    /**
     * Resets all filter and search state back to their default (show-all) values.
     * Side effect: re-renders filteredTreks to show the full catalog.
     */
    resetFilters() {
      this.searchQuery = '';
      this.difficultyFilter = '';
      this.locationFilter = '';
      this.durationFilter = '';
      this.quickFilter = 'All';
      this.showBookableOnly = false;
    },

    /**
     * Emits the 'book-trek' event with the selected trek object to trigger
     * the booking/payment modal in the parent component.
     * @param {Object} t - The trek object the user clicked.
     */
    openBookingModal(t) {
      this.$emit('book-trek', t);
    },

    /**
     * Determines whether a trek has at least one batch with remaining bookable seats.
     * Checks nested batches if present, otherwise treats the trek itself as the batch.
     * @param {Object} t - A trek object, optionally containing a `batches` array.
     * @returns {boolean} True if any batch has remaining slots.
     */
    hasBookableSlots(t) {
      if (Array.isArray(t.batches) && t.batches.length) {
        return t.batches.some(b => this.slotsLeft(b) > 0);
      }
      return this.slotsLeft(t) > 0;
    },

    /**
     * Calculates the number of remaining open slots for a batch or trek record.
     * Guards against missing or null slot/booked values.
     * @param {Object} t - A trek or batch object with optional `slots` and `booked` fields.
     * @returns {number} Available slots (minimum 0).
     */
    slotsLeft(t) { 
      return Math.max(0, Number(t?.slots || 0) - Number(t?.booked || 0)); 
    },

    /**
     * Generates a deterministic CSS linear-gradient string for trek image placeholders.
     * The gradient is picked from a fixed palette using the trek's ID as an index,
     * ensuring a consistent color for each trek across renders.
     * @param {Object} t - A trek object with an optional numeric `id`.
     * @returns {string} A CSS `linear-gradient(...)` string.
     */
    getGradient(t) {
      const grads = ['#1a4a3a','#2d6b3d','#2a3a1a','#3d5b2d','#1a3a2a','#2d5b4a','#3a1a1a','#5b2d2d','#1a2a3a','#2d3b5b'];
      const id = t.id || 0;
      return `linear-gradient(135deg, ${grads[id % grads.length]}, rgba(0,0,0,0.5))`;
    },

    /**
     * Truncates a trek's description to a maximum of 120 characters for card display.
     * Appends an ellipsis if the text exceeds the limit.
     * @param {Object} t - A trek object with an optional `description` string.
     * @returns {string} The original or truncated description text.
     */
    cleanDescription(t) {
      if (!t.description) return '';
      if (t.description.length > 120) return t.description.slice(0, 117) + '...';
      return t.description;
    }
  }
};
</script>
