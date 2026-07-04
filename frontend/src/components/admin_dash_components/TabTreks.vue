<template>
      <section v-if="activeTab==='treks'" class="tab-content">
        <!-- Collapsible Filters Toggle Button for Mobile -->
        <button class="mobile-filters-toggle btn-primary-ts" style="display: none; width: 100%; margin-bottom: 1rem; padding: 8px 16px; font-size: 0.85rem;" @click="showMobileFilters = !showMobileFilters">
          <svg viewBox="0 0 24 24" style="width: 15px; height: 15px; margin-right: 6px; fill: none; stroke: currentColor; stroke-width: 2.2;"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          {{ showMobileFilters ? 'Hide Filters' : 'Show Filters' }}
        </button>

        <!-- Filters Bar -->
        <div class="route-filters-bar" :class="{ 'show-mobile': showMobileFilters }" style="flex-wrap: wrap; gap: 1rem; margin-bottom: 1.25rem; background: var(--snow); padding: 1.25rem; border-radius: 8px; border: 1px solid var(--stone-light); align-items: flex-end;">
          
          <!-- Difficulty Dropdown -->
          <div class="filter-group" style="display: flex; flex-direction: column; gap: 4px; min-width: 140px;">
            <label style="font-size: 0.72rem; font-weight: 600; color: var(--forest-mid);">DIFFICULTY</label>
            <div class="custom-select-wrapper" :class="{ 'is-open': showDiffFilterDropdown }">
              <div class="custom-select-trigger" @click.stop="toggleRouteFilterDropdown('showDiffFilterDropdown')" style="padding: 6px 12px; font-size: 0.84rem; border-radius: 4px; background: white; border: 1px solid var(--stone);">
                <span>{{ tempRouteDiffFilter }}</span>
                <svg viewBox="0 0 24 24" class="custom-select-arrow" :class="{ open: showDiffFilterDropdown }"><polyline points="6 9 12 15 18 9"/></svg>
              </div>
              <div v-if="showDiffFilterDropdown" class="custom-select-dropdown" style="top: 100%; margin-top: 4px; z-index: 1050;">
                <div class="custom-select-options" style="max-height: 200px; overflow-y: auto;">
                  <div v-for="opt in ['All', 'Easy', 'Moderate', 'Hard']" :key="opt" class="custom-select-option" :class="{ selected: tempRouteDiffFilter === opt }" @click="tempRouteDiffFilter = opt; showDiffFilterDropdown = false;">
                    <span class="option-name">{{ opt }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Duration Dropdown -->
          <div class="filter-group" style="display: flex; flex-direction: column; gap: 4px; min-width: 140px;">
            <label style="font-size: 0.72rem; font-weight: 600; color: var(--forest-mid);">DURATION</label>
            <div class="custom-select-wrapper" :class="{ 'is-open': showDaysFilterDropdown }">
              <div class="custom-select-trigger" @click.stop="toggleRouteFilterDropdown('showDaysFilterDropdown')" style="padding: 6px 12px; font-size: 0.84rem; border-radius: 4px; background: white; border: 1px solid var(--stone);">
                <span>{{ tempRouteDaysFilter === 'All' ? 'All' : (tempRouteDaysFilter === '<5' ? '< 5 Days' : (tempRouteDaysFilter === '5-7' ? '5 - 7 Days' : '> 7 Days')) }}</span>
                <svg viewBox="0 0 24 24" class="custom-select-arrow" :class="{ open: showDaysFilterDropdown }"><polyline points="6 9 12 15 18 9"/></svg>
              </div>
              <div v-if="showDaysFilterDropdown" class="custom-select-dropdown" style="top: 100%; margin-top: 4px; z-index: 1050;">
                <div class="custom-select-options" style="max-height: 200px; overflow-y: auto;">
                  <div class="custom-select-option" :class="{ selected: tempRouteDaysFilter === 'All' }" @click="tempRouteDaysFilter = 'All'; showDaysFilterDropdown = false;">
                    <span class="option-name">All</span>
                  </div>
                  <div class="custom-select-option" :class="{ selected: tempRouteDaysFilter === '<5' }" @click="tempRouteDaysFilter = '<5'; showDaysFilterDropdown = false;">
                    <span class="option-name">&lt; 5 Days</span>
                  </div>
                  <div class="custom-select-option" :class="{ selected: tempRouteDaysFilter === '5-7' }" @click="tempRouteDaysFilter = '5-7'; showDaysFilterDropdown = false;">
                    <span class="option-name">5 - 7 Days</span>
                  </div>
                  <div class="custom-select-option" :class="{ selected: tempRouteDaysFilter === '>7' }" @click="tempRouteDaysFilter = '>7'; showDaysFilterDropdown = false;">
                    <span class="option-name">&gt; 7 Days</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Status Dropdown -->
          <div class="filter-group" style="display: flex; flex-direction: column; gap: 4px; min-width: 140px;">
            <label style="font-size: 0.72rem; font-weight: 600; color: var(--forest-mid);">STATUS</label>
            <div class="custom-select-wrapper" :class="{ 'is-open': showActiveFilterDropdown }">
              <div class="custom-select-trigger" @click.stop="toggleRouteFilterDropdown('showActiveFilterDropdown')" style="padding: 6px 12px; font-size: 0.84rem; border-radius: 4px; background: white; border: 1px solid var(--stone);">
                <span>{{ tempRouteActiveFilter }}</span>
                <svg viewBox="0 0 24 24" class="custom-select-arrow" :class="{ open: showActiveFilterDropdown }"><polyline points="6 9 12 15 18 9"/></svg>
              </div>
              <div v-if="showActiveFilterDropdown" class="custom-select-dropdown" style="top: 100%; margin-top: 4px; z-index: 1050;">
                <div class="custom-select-options" style="max-height: 200px; overflow-y: auto;">
                  <div v-for="opt in ['All', 'Active', 'Closed']" :key="opt" class="custom-select-option" :class="{ selected: tempRouteActiveFilter === opt }" @click="tempRouteActiveFilter = opt; showActiveFilterDropdown = false;">
                    <span class="option-name">{{ opt }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- State Dropdown -->
          <div class="filter-group" style="display: flex; flex-direction: column; gap: 4px; min-width: 160px;">
            <label style="font-size: 0.72rem; font-weight: 600; color: var(--forest-mid);">STATE</label>
            <div class="custom-select-wrapper" :class="{ 'is-open': showStateFilterDropdown }">
              <div class="custom-select-trigger" @click.stop="toggleRouteFilterDropdown('showStateFilterDropdown')" style="padding: 6px 12px; font-size: 0.84rem; border-radius: 4px; background: white; border: 1px solid var(--stone);">
                <span>{{ tempRouteStateFilter === 'All' ? 'All States' : tempRouteStateFilter }}</span>
                <svg viewBox="0 0 24 24" class="custom-select-arrow" :class="{ open: showStateFilterDropdown }"><polyline points="6 9 12 15 18 9"/></svg>
              </div>
              <div v-if="showStateFilterDropdown" class="custom-select-dropdown" style="top: 100%; margin-top: 4px; z-index: 1050; max-height: 400px;">
                <div class="custom-select-options" style="max-height: 380px; overflow-y: auto;">
                  <div class="custom-select-option" :class="{ selected: tempRouteStateFilter === 'All' }" @click="tempRouteStateFilter = 'All'; showStateFilterDropdown = false;">
                    <span class="option-name">All States</span>
                  </div>
                  <div v-for="st in routeStates" :key="st" class="custom-select-option" :class="{ selected: tempRouteStateFilter === st }" @click="tempRouteStateFilter = st; showStateFilterDropdown = false;">
                    <span class="option-name">{{ st }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Distance Dropdown -->
          <div class="filter-group" style="display: flex; flex-direction: column; gap: 4px; min-width: 150px;">
            <label style="font-size: 0.72rem; font-weight: 600; color: var(--forest-mid);">DISTANCE RANGE</label>
            <div class="custom-select-wrapper" :class="{ 'is-open': showDistFilterDropdown }">
              <div class="custom-select-trigger" @click.stop="toggleRouteFilterDropdown('showDistFilterDropdown')" style="padding: 6px 12px; font-size: 0.84rem; border-radius: 4px; background: white; border: 1px solid var(--stone);">
                <span>{{ tempRouteDistFilter === 'All' ? 'All' : (tempRouteDistFilter === '<10' ? '< 10 km' : (tempRouteDistFilter === '10-20' ? '10 - 20 km' : '> 20 km')) }}</span>
                <svg viewBox="0 0 24 24" class="custom-select-arrow" :class="{ open: showDistFilterDropdown }"><polyline points="6 9 12 15 18 9"/></svg>
              </div>
              <div v-if="showDistFilterDropdown" class="custom-select-dropdown" style="top: 100%; margin-top: 4px; z-index: 1050;">
                <div class="custom-select-options" style="max-height: 200px; overflow-y: auto;">
                  <div class="custom-select-option" :class="{ selected: tempRouteDistFilter === 'All' }" @click="tempRouteDistFilter = 'All'; showDistFilterDropdown = false;">
                    <span class="option-name">All</span>
                  </div>
                  <div class="custom-select-option" :class="{ selected: tempRouteDistFilter === '<10' }" @click="tempRouteDistFilter = '<10'; showDistFilterDropdown = false;">
                    <span class="option-name">&lt; 10 km</span>
                  </div>
                  <div class="custom-select-option" :class="{ selected: tempRouteDistFilter === '10-20' }" @click="tempRouteDistFilter = '10-20'; showDistFilterDropdown = false;">
                    <span class="option-name">10 - 20 km</span>
                  </div>
                  <div class="custom-select-option" :class="{ selected: tempRouteDistFilter === '>20' }" @click="tempRouteDistFilter = '>20'; showDistFilterDropdown = false;">
                    <span class="option-name">&gt; 20 km</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Buttons Group -->
          <div style="display: flex; gap: 0.5rem; align-self: flex-end;">
            <button class="filter-btn reset-btn" style="padding: 6px 14px; font-size: 0.8rem; border-radius: 4px; background: white; border: 1px solid var(--stone); color: var(--stone-dark);" @click="resetRouteFilters">
              Clear Filters
            </button>
            <button class="btn-primary-ts" style="padding: 6px 16px; font-size: 0.8rem; border-radius: 4px;" @click="applyRouteFilters">
              Apply Filters
            </button>
          </div>
        </div>
        <!-- View switch controls -->
        <div style="display: flex; justify-content: flex-end; margin-bottom: 1.25rem;">
          <div class="view-switch-btns" style="display: flex; gap: 0.5rem;">
            <button class="filter-btn" :class="{ active: routeViewMode === 'cards' }" @click="routeViewMode = 'cards'">
              Card View
            </button>
            <button class="filter-btn" :class="{ active: routeViewMode === 'list' }" @click="routeViewMode = 'list'">
              List View
            </button>
          </div>
        </div>

        <!-- Card View -->
        <div v-if="routeViewMode==='cards' && filteredRoutes.length" class="cards-grid">
          <div class="trek-route-card" v-for="r in filteredRoutes" :key="r.id">
            <div class="route-card-img" :style="{ backgroundImage: 'url(' + (r.imageUrl || 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&q=80') + ')' }">
              <div class="route-card-badge" :class="'difficulty-' + r.difficulty.toLowerCase()">{{ r.difficulty }}</div>
              <div class="route-card-status" :class="r.active ? 'status-active' : 'status-inactive'">
                {{ r.active ? 'Active' : 'Closed' }}
              </div>
            </div>
            <div class="route-card-content">
              <div class="route-card-code">{{ r.trekCode }}</div>
              <h4 class="route-card-name">{{ r.name }}</h4>
              <div class="route-card-meta">
                <span>📍 {{ r.place ? r.place + ', ' : '' }}{{ r.location }}</span>
                <span>⏱ {{ r.duration }} days</span>
                <span>⛰ {{ r.distance }} km</span>
              </div>
              <p class="route-card-desc">{{ r.description || 'No description provided.' }}</p>
              <div class="route-card-actions">
                <button class="act-btn act-view" @click="viewRouteDetails(r)">
                  <svg viewBox="0 0 24 24" class="act-btn-icon"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                  View Details
                </button>
                <div class="action-group-ops">
                  <button class="act-btn" :class="r.active ? 'act-close' : 'act-open'" @click="toggleRouteStatus(r)">
                    <svg v-if="r.active" viewBox="0 0 24 24" class="act-btn-icon"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                    <svg v-else viewBox="0 0 24 24" class="act-btn-icon"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 9.9-1"/></svg>
                    {{ r.active ? 'Close' : 'Open' }}
                  </button>
                  <button class="act-btn act-edit" @click="openRouteModal(r)">
                    <svg viewBox="0 0 24 24" class="act-btn-icon"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
                    Edit
                  </button>
                  <button class="act-btn act-delete-btn" @click="deleteRoute(r.id)">
                    <svg viewBox="0 0 24 24" class="act-btn-icon"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
                    Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- List View -->
        <div v-if="routeViewMode==='list' && filteredRoutes.length" class="ts-table-wrap">
          <table class="ts-table">
            <thead>
              <tr>
                <th>Trek ID</th>
                <th>Trek Name</th>
                <th class="col-hide-mobile">Location</th>
                <th class="col-hide-mobile">Difficulty</th>
                <th class="col-hide-mobile">Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="r in filteredRoutes" :key="r.id">
                <td class="mono font-bold">{{ r.trekCode }}</td>
                <td class="trek-name-cell">{{ r.name }}</td>
                <td class="col-hide-mobile">{{ r.place ? r.place + ', ' : '' }}{{ r.location }}</td>
                <td class="col-hide-mobile"><span :class="'diff-pill pill-'+r.difficulty.toLowerCase()">{{ r.difficulty }}</span></td>
                <td class="col-hide-mobile">
                  <span :class="['status-pill', r.active ? 'status-active' : 'status-inactive']">
                    {{ r.active ? 'Active' : 'Inactive' }}
                  </span>
                </td>
                <td>
                  <div class="action-group-container">
                    <div class="action-group-mgmt">
                      <button class="act-btn act-edit" @click="openRouteModal(r)" title="Edit">
                        <svg viewBox="0 0 24 24" class="act-btn-icon"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
                        <span class="btn-text-hide-mobile">Edit</span>
                      </button>
                      <button class="act-btn act-view" @click="viewRouteDetails(r)" title="View Details">
                        <svg viewBox="0 0 24 24" class="act-btn-icon"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                        <span class="btn-text-hide-mobile">View Details</span>
                      </button>
                    </div>
                    <div class="action-group-ops">
                      <button class="act-btn" :class="r.active ? 'act-close' : 'act-open'" @click="toggleRouteStatus(r)" :title="r.active ? 'Close' : 'Open'">
                        <svg v-if="r.active" viewBox="0 0 24 24" class="act-btn-icon"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                        <svg v-else viewBox="0 0 24 24" class="act-btn-icon"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 9.9-1"/></svg>
                        <span class="btn-text-hide-mobile">{{ r.active ? 'Close' : 'Open' }}</span>
                      </button>
                      <button class="act-btn act-delete-btn" @click="deleteRoute(r.id)" title="Delete">
                        <svg viewBox="0 0 24 24" class="act-btn-icon"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
                        <span class="btn-text-hide-mobile">Delete</span>
                      </button>
                    </div>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div v-if="!filteredRoutes.length" class="empty-state">
          <svg viewBox="0 0 24 24"><path d="M3 17l4-8 4 4 4-6 4 10"/><path d="M3 20h18"/></svg>
          <p>No trek routes found.</p>
        </div>
      </section>
</template>

<script>
import { adminDashComponent } from './adminDashProxy';

export default {
  ...adminDashComponent('TabTreks'),
  data() {
    return {
      showMobileFilters: false
    };
  }
};
</script>
