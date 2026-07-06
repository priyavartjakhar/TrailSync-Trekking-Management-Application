<template>
      <section v-if="activeTab==='treks'" class="tab-content">
        <!-- Collapsible Filters Toggle Button for Mobile -->
        <button class="mobile-filters-toggle btn-primary-ts" style="display: none; width: 100%; margin-bottom: 1rem; padding: 8px 16px; font-size: 0.85rem;" @click="showMobileFilters = !showMobileFilters">
          <svg viewBox="0 0 24 24" style="width: 15px; height: 15px; margin-right: 6px; fill: none; stroke: currentColor; stroke-width: 2.2;"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          {{ showMobileFilters ? 'Hide Filters' : 'Show Filters' }}
        </button>

        <!-- Filters Bar -->
        <div class="route-filters-bar" :class="{ 'show-mobile': showMobileFilters }" style="display: flex; flex-wrap: wrap; gap: 1rem; margin-bottom: 1.25rem; background: var(--snow); padding: 1.25rem; border-radius: 8px; border: 1px solid var(--stone-light); align-items: flex-end;">
          
          <!-- Difficulty Dropdown -->
          <div class="filter-group" style="display: flex; flex-direction: column; gap: 4px; flex: 1 1 150px; min-width: 140px; max-width: 190px;">
            <label style="font-size: 0.72rem; font-weight: 600; color: var(--forest-mid);">DIFFICULTY</label>
            <div class="custom-select-wrapper" :class="{ 'is-open': showDiffFilterDropdown }">
              <div class="custom-select-trigger" @click.stop="toggleRouteFilterDropdown('showDiffFilterDropdown')" style="padding: 6px 12px; font-size: 0.84rem; border-radius: 4px; background: white; border: 1px solid var(--stone);">
                <span>{{ routeDiffFilter }}</span>
                <svg viewBox="0 0 24 24" class="custom-select-arrow" :class="{ open: showDiffFilterDropdown }"><polyline points="6 9 12 15 18 9"/></svg>
              </div>
              <div v-if="showDiffFilterDropdown" class="custom-select-dropdown" style="top: 100%; margin-top: 4px; z-index: 1050;">
                <div class="custom-select-options" style="max-height: 200px; overflow-y: auto;">
                  <div v-for="opt in ['All', 'Easy', 'Moderate', 'Hard']" :key="opt" class="custom-select-option" :class="{ selected: routeDiffFilter === opt }" @click="setRouteFilter('routeDiffFilter', opt); showDiffFilterDropdown = false;">
                    <span class="option-name">{{ opt }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Duration Dropdown -->
          <div class="filter-group" style="display: flex; flex-direction: column; gap: 4px; flex: 1 1 150px; min-width: 140px; max-width: 190px;">
            <label style="font-size: 0.72rem; font-weight: 600; color: var(--forest-mid);">DURATION</label>
            <div class="custom-select-wrapper" :class="{ 'is-open': showDaysFilterDropdown }">
              <div class="custom-select-trigger" @click.stop="toggleRouteFilterDropdown('showDaysFilterDropdown')" style="padding: 6px 12px; font-size: 0.84rem; border-radius: 4px; background: white; border: 1px solid var(--stone);">
                <span>{{ routeDaysFilter === 'All' ? 'All' : (routeDaysFilter === '<5' ? '< 5 Days' : (routeDaysFilter === '5-7' ? '5 - 7 Days' : '> 7 Days')) }}</span>
                <svg viewBox="0 0 24 24" class="custom-select-arrow" :class="{ open: showDaysFilterDropdown }"><polyline points="6 9 12 15 18 9"/></svg>
              </div>
              <div v-if="showDaysFilterDropdown" class="custom-select-dropdown" style="top: 100%; margin-top: 4px; z-index: 1050;">
                <div class="custom-select-options" style="max-height: 200px; overflow-y: auto;">
                  <div class="custom-select-option" :class="{ selected: routeDaysFilter === 'All' }" @click="setRouteFilter('routeDaysFilter', 'All'); showDaysFilterDropdown = false;">
                    <span class="option-name">All</span>
                  </div>
                  <div class="custom-select-option" :class="{ selected: routeDaysFilter === '<5' }" @click="setRouteFilter('routeDaysFilter', '<5'); showDaysFilterDropdown = false;">
                    <span class="option-name">&lt; 5 Days</span>
                  </div>
                  <div class="custom-select-option" :class="{ selected: routeDaysFilter === '5-7' }" @click="setRouteFilter('routeDaysFilter', '5-7'); showDaysFilterDropdown = false;">
                    <span class="option-name">5 - 7 Days</span>
                  </div>
                  <div class="custom-select-option" :class="{ selected: routeDaysFilter === '>7' }" @click="setRouteFilter('routeDaysFilter', '>7'); showDaysFilterDropdown = false;">
                    <span class="option-name">&gt; 7 Days</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Status Dropdown -->
          <div class="filter-group" style="display: flex; flex-direction: column; gap: 4px; flex: 1 1 150px; min-width: 140px; max-width: 190px;">
            <label style="font-size: 0.72rem; font-weight: 600; color: var(--forest-mid);">STATUS</label>
            <div class="custom-select-wrapper" :class="{ 'is-open': showActiveFilterDropdown }">
              <div class="custom-select-trigger" @click.stop="toggleRouteFilterDropdown('showActiveFilterDropdown')" style="padding: 6px 12px; font-size: 0.84rem; border-radius: 4px; background: white; border: 1px solid var(--stone);">
                <span>{{ routeActiveFilter }}</span>
                <svg viewBox="0 0 24 24" class="custom-select-arrow" :class="{ open: showActiveFilterDropdown }"><polyline points="6 9 12 15 18 9"/></svg>
              </div>
              <div v-if="showActiveFilterDropdown" class="custom-select-dropdown" style="top: 100%; margin-top: 4px; z-index: 1050;">
                <div class="custom-select-options" style="max-height: 200px; overflow-y: auto;">
                  <div v-for="opt in ['All', 'Active', 'Closed']" :key="opt" class="custom-select-option" :class="{ selected: routeActiveFilter === opt }" @click="setRouteFilter('routeActiveFilter', opt); showActiveFilterDropdown = false;">
                    <span class="option-name">{{ opt }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- State Dropdown -->
          <div class="filter-group" style="display: flex; flex-direction: column; gap: 4px; flex: 1 1 170px; min-width: 160px; max-width: 220px;">
            <label style="font-size: 0.72rem; font-weight: 600; color: var(--forest-mid);">STATE</label>
            <div class="custom-select-wrapper" :class="{ 'is-open': showStateFilterDropdown }">
              <div class="custom-select-trigger" @click.stop="toggleRouteFilterDropdown('showStateFilterDropdown')" style="padding: 6px 12px; font-size: 0.84rem; border-radius: 4px; background: white; border: 1px solid var(--stone);">
                <span>{{ routeStateFilter === 'All' ? 'All States' : routeStateFilter }}</span>
                <svg viewBox="0 0 24 24" class="custom-select-arrow" :class="{ open: showStateFilterDropdown }"><polyline points="6 9 12 15 18 9"/></svg>
              </div>
              <div v-if="showStateFilterDropdown" class="custom-select-dropdown" style="top: 100%; margin-top: 4px; z-index: 1050; max-height: 400px;">
                <div class="custom-select-options" style="max-height: 380px; overflow-y: auto;">
                  <div class="custom-select-option" :class="{ selected: routeStateFilter === 'All' }" @click="setRouteFilter('routeStateFilter', 'All'); showStateFilterDropdown = false;">
                    <span class="option-name">All States</span>
                  </div>
                  <div v-for="st in routeStates" :key="st" class="custom-select-option" :class="{ selected: routeStateFilter === st }" @click="setRouteFilter('routeStateFilter', st); showStateFilterDropdown = false;">
                    <span class="option-name">{{ st }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Distance Dropdown -->
          <div class="filter-group" style="display: flex; flex-direction: column; gap: 4px; flex: 1 1 160px; min-width: 150px; max-width: 200px;">
            <label style="font-size: 0.72rem; font-weight: 600; color: var(--forest-mid);">DISTANCE RANGE</label>
            <div class="custom-select-wrapper" :class="{ 'is-open': showDistFilterDropdown }">
              <div class="custom-select-trigger" @click.stop="toggleRouteFilterDropdown('showDistFilterDropdown')" style="padding: 6px 12px; font-size: 0.84rem; border-radius: 4px; background: white; border: 1px solid var(--stone);">
                <span>{{ routeDistFilter === 'All' ? 'All' : (routeDistFilter === '<10' ? '< 10 km' : (routeDistFilter === '10-20' ? '10 - 20 km' : '> 20 km')) }}</span>
                <svg viewBox="0 0 24 24" class="custom-select-arrow" :class="{ open: showDistFilterDropdown }"><polyline points="6 9 12 15 18 9"/></svg>
              </div>
              <div v-if="showDistFilterDropdown" class="custom-select-dropdown" style="top: 100%; margin-top: 4px; z-index: 1050;">
                <div class="custom-select-options" style="max-height: 200px; overflow-y: auto;">
                  <div class="custom-select-option" :class="{ selected: routeDistFilter === 'All' }" @click="setRouteFilter('routeDistFilter', 'All'); showDistFilterDropdown = false;">
                    <span class="option-name">All</span>
                  </div>
                  <div class="custom-select-option" :class="{ selected: routeDistFilter === '<10' }" @click="setRouteFilter('routeDistFilter', '<10'); showDistFilterDropdown = false;">
                    <span class="option-name">&lt; 10 km</span>
                  </div>
                  <div class="custom-select-option" :class="{ selected: routeDistFilter === '10-20' }" @click="setRouteFilter('routeDistFilter', '10-20'); showDistFilterDropdown = false;">
                    <span class="option-name">10 - 20 km</span>
                  </div>
                  <div class="custom-select-option" :class="{ selected: routeDistFilter === '>20' }" @click="setRouteFilter('routeDistFilter', '>20'); showDistFilterDropdown = false;">
                    <span class="option-name">&gt; 20 km</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Buttons Group -->
          <div style="display: flex; gap: 0.5rem; align-self: flex-end; margin-left: auto; flex-wrap: wrap;">
            <button class="filter-btn reset-btn" style="padding: 6px 14px; font-size: 0.8rem; border-radius: 4px; background: white; border: 1px solid var(--stone); color: var(--stone-dark);" @click="resetRouteFilters">
              Clear Filters
            </button>
            <button class="btn-primary-ts" style="padding: 6px 16px; font-size: 0.8rem; border-radius: 4px;" @click="applyRouteFilters">
              Apply Filters
            </button>
          </div>
        </div>
        <div style="display: flex; justify-content: space-between; align-items: center; gap: 1rem; margin-bottom: 1.25rem; flex-wrap: wrap;">
          <div style="font-size: 0.85rem; color: var(--stone-dark);">
            Showing <strong>{{ filteredRoutes.length }}</strong> of <strong>{{ trekRoutes.length }}</strong> routes
          </div>
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

        <!-- ════════ ROUTE MODAL (Extracted from SAdminModals) ════════ -->
        <div v-if="showRouteModal" class="ts-modal-overlay" @click.self="closeRouteModal">
          <div class="ts-modal">
            <div class="ts-modal-header">
              <h3 class="ts-modal-title">{{ editingRoute ? 'Edit Trek Route' : 'Create Trek Route' }}</h3>
              <button class="modal-close" @click="closeRouteModal">✕</button>
            </div>
            <div class="ts-modal-body">
              <div class="form-grid">
                <div class="form-group form-full">
                  <label>Trek Route Name <span style="color: var(--red); font-weight: bold;">*</span></label>
                  <input v-model="routeForm.name" type="text" placeholder="e.g. Garbhanga Forest Trek" />
                </div>
                <div class="form-group">
                  <label>Location (State) <span style="color: var(--red); font-weight: bold;">*</span></label>
                  <div class="route-state-dropdown-wrapper" :class="{ 'is-open': showRouteStateDropdown }">
                    <div class="route-state-trigger" @click.stop="showRouteStateDropdown = !showRouteStateDropdown">
                      <span>{{ routeForm.location || 'Select State...' }}</span>
                      <svg viewBox="0 0 24 24" class="route-state-arrow" :class="{ open: showRouteStateDropdown }"><polyline points="6 9 12 15 18 9"/></svg>
                    </div>
                    <div v-if="showRouteStateDropdown" class="route-state-dropdown">
                      <input
                        v-model="routeStateSearchQuery"
                        type="text"
                        class="route-state-search"
                        placeholder="Search states…"
                        @click.stop
                      />
                      <div class="route-state-options">
                        <div v-if="filteredStatesForRoute.length === 0" class="route-state-no-match">No states match</div>
                        <div
                          v-for="state in filteredStatesForRoute"
                          :key="state"
                          class="route-state-option"
                          :class="{ selected: routeForm.location === state }"
                          @click="selectStateForRoute(state)"
                        >
                          {{ state }}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div class="form-group">
                  <label>Place (e.g., Chamoli district) <span style="color: var(--stone); font-weight: normal;">*</span></label>
                  <input v-model="routeForm.place" type="text" placeholder="e.g., Chamoli district, Uttarakhand" />
                </div>
                <div class="form-group">
                  <label>Difficulty <span style="color: var(--red); font-weight: bold;">*</span></label>
                  <div class="custom-select-wrapper" :class="{ 'is-open': showFormDiffDropdown }">
                    <div class="custom-select-trigger" @click.stop="showFormDiffDropdown = !showFormDiffDropdown">
                      <span>{{ routeForm.difficulty || 'Moderate' }}</span>
                      <svg viewBox="0 0 24 24" class="custom-select-arrow" :class="{ open: showFormDiffDropdown }"><polyline points="6 9 12 15 18 9"/></svg>
                    </div>
                    <div v-if="showFormDiffDropdown" class="custom-select-dropdown" style="top: 100%; margin-top: 4px; z-index: 1050;">
                      <div class="custom-select-options">
                        <div v-for="opt in ['Easy', 'Moderate', 'Hard']" :key="opt" class="custom-select-option" :class="{ selected: routeForm.difficulty === opt }" @click="routeForm.difficulty = opt; showFormDiffDropdown = false;">
                          <span class="option-name">{{ opt }}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div class="form-group">
                  <label>Duration (Days) <span style="color: var(--red); font-weight: bold;">*</span></label>
                  <input v-model.number="routeForm.duration" type="number" min="1" />
                </div>
                <div class="form-group">
                  <label>Distance (km) <span style="color: var(--red); font-weight: bold;">*</span></label>
                  <input v-model.number="routeForm.distance" type="number" min="1" />
                </div>
                <div class="form-group form-full">
                  <label>Image Source <span style="color: var(--red); font-weight: bold;">*</span></label>
                  <div style="display: flex; gap: 1rem; margin-bottom: 0.5rem;">
                    <label style="display: flex; align-items: center; gap: 4px; font-weight: normal; cursor: pointer; font-size: 0.82rem;">
                      <input type="radio" value="link" v-model="imageMode" /> Use Image Link
                    </label>
                    <label style="display: flex; align-items: center; gap: 4px; font-weight: normal; cursor: pointer; font-size: 0.82rem;">
                      <input type="radio" value="upload" v-model="imageMode" /> Upload Image
                    </label>
                  </div>
                  <div v-if="imageMode === 'link'">
                    <input v-model="routeForm.imageUrl" type="text" placeholder="https://images.unsplash.com/…" />
                  </div>
                  <div v-else style="display: flex; gap: 10px; align-items: center;">
                    <input type="file" @change="handleImageUpload" accept="image/*" class="form-control" style="font-size: 0.82rem; padding: 4px 8px;" />
                  </div>
                  <div v-if="routeForm.imageUrl" style="margin-top: 8px;">
                    <img :src="routeForm.imageUrl" alt="Preview" style="max-height: 80px; border-radius: 4px; border: 1px solid var(--stone);" />
                  </div>
                </div>
                <div class="form-group form-full">
                  <label>Description <span style="color: var(--red); font-weight: bold;">*</span></label>
                  <textarea v-model="routeForm.description" rows="3" placeholder="Description of the route..."></textarea>
                </div>
              </div>
            </div>
            <div class="ts-modal-footer">
              <button class="btn-ghost" @click="closeRouteModal">Cancel</button>
              <button class="btn-primary-ts" @click="saveRoute">{{ editingRoute ? 'Save Changes' : 'Create Route' }}</button>
            </div>
          </div>
        </div>

        <!-- ════════ ROUTE DETAILS MODAL (Extracted from SAdminModals) ════════ -->
        <div v-if="showRouteDetailsModal && selectedRouteDetails" class="ts-modal-overlay" @click.self="closeRouteDetails">
          <div class="ts-modal large">
            <div class="ts-modal-header">
              <h3 class="ts-modal-title">[{{ selectedRouteDetails.route.trekCode }}] {{ selectedRouteDetails.route.name }} Details</h3>
              <button class="modal-close" @click="closeRouteDetails">✕</button>
            </div>
            <div class="ts-modal-body">
              <div class="details-modal-grid">
                <!-- Left Side: Profile & Coordinates -->
                <div>
                  <div class="route-detail-img" :style="{ backgroundImage: 'url(' + (selectedRouteDetails.route.imageUrl || 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&q=80') + ')' }"></div>
                  <div class="route-detail-info-block">
                    <div><strong>Location:</strong> <span>{{ selectedRouteDetails.route.location }}</span></div>
                    <div><strong>Place:</strong> <span>{{ selectedRouteDetails.route.place || '—' }}</span></div>
                    <div><strong>Difficulty:</strong> <span :class="'diff-pill pill-'+selectedRouteDetails.route.difficulty.toLowerCase()">{{ selectedRouteDetails.route.difficulty }}</span></div>
                    <div><strong>Duration:</strong> <span>{{ selectedRouteDetails.route.duration }} Days</span></div>
                    <div><strong>Distance:</strong> <span>{{ selectedRouteDetails.route.distance }} km</span></div>
                    <div><strong>Status:</strong> <span :class="['status-pill', selectedRouteDetails.route.active ? 'status-active' : 'status-inactive']">{{ selectedRouteDetails.route.active ? 'Active (Open)' : 'Inactive (Closed)' }}</span></div>
                  </div>
                  
                  <div class="timeline-section-title" style="margin-top:1rem">Description</div>
                  <p style="font-size:0.84rem; color:var(--stone); line-height:1.5; margin:0;">{{ selectedRouteDetails.route.description || 'No description provided.' }}</p>
                </div>
                
                <!-- Right Side: Stats, Timelines & Trekkers -->
                <div>
                  <div style="display:grid; grid-template-columns:repeat(3,1fr); gap:10px; margin-bottom:1.25rem;">
                    <div class="rev-card" style="padding:0.75rem;">
                      <div style="font-size:1.2rem; font-weight:700; color:var(--forest);">{{ selectedRouteDetails.processedCount }}</div>
                      <div style="font-size:0.7rem; color:var(--stone);">Batches</div>
                    </div>
                    <div class="rev-card" style="padding:0.75rem;">
                      <div style="font-size:1.2rem; font-weight:700; color:var(--forest);">₹{{ selectedRouteDetails.avgPrice.toLocaleString() }}</div>
                      <div style="font-size:0.7rem; color:var(--stone);">Avg Price</div>
                    </div>
                    <div class="rev-card" style="padding:0.75rem;">
                      <div style="font-size:1.2rem; font-weight:700; color:var(--forest);">{{ selectedRouteDetails.totalBookings }}</div>
                      <div style="font-size:0.7rem; color:var(--stone);">Bookings</div>
                    </div>
                  </div>

                  <!-- Price Trend Table -->
                  <div class="timeline-section-title">Batch History & Pricing Details</div>
                  <div v-if="selectedRouteDetails.priceTrends.length" class="ts-table-wrap" style="margin-top: 0.5rem; max-height: 250px; overflow-y: auto;">
                    <table class="ts-table" style="font-size: 0.78rem;">
                      <thead>
                        <tr>
                          <th style="padding: 6px 10px;">Batch</th>
                          <th style="padding: 6px 10px;">Start Date</th>
                          <th style="padding: 6px 10px; text-align: right;">Price</th>
                          <th style="padding: 6px 10px; text-align: center;">Occupancy</th>
                          <th style="padding: 6px 10px;">Status</th>
                          <th style="padding: 6px 10px;">Staff Guide</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr v-for="trend in selectedRouteDetails.priceTrends" :key="trend.batchCode">
                          <td class="mono font-bold" style="padding: 6px 10px;">{{ trend.batchCode }}</td>
                          <td style="padding: 6px 10px;">{{ formatDate(trend.startDate) }}</td>
                          <td style="padding: 6px 10px; text-align: right; font-weight: 600; color: var(--forest);">₹{{ trend.price.toLocaleString() }}</td>
                          <td style="padding: 6px 10px; text-align: center;" class="mono">{{ trend.booked }}/{{ trend.slots }}</td>
                          <td style="padding: 6px 10px;">
                            <span class="status-pill" :class="'status-' + trend.status.toLowerCase()" style="font-size: 0.68rem; padding: 2px 6px;">
                              {{ trend.status }}
                            </span>
                          </td>
                          <td style="padding: 6px 10px; font-style: italic; color: var(--forest-mid);">{{ trend.staff || 'Unassigned' }}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  <div v-else style="font-size:0.8rem; color:var(--stone); font-style:italic; text-align:center; padding:1rem;">
                    No scheduled batches for this route.
                  </div>
                </div>
              </div>
            </div>
            <div class="ts-modal-footer">
              <button class="btn-primary-ts" @click="closeRouteDetails">Close</button>
            </div>
          </div>
        </div>

      </section>
</template>

<script>
/**
 * =========================================================================
 * TabTreks.vue
 * =========================================================================
 * Master Trek Routes catalog manager — handles CRUD for core trek routes,
 * including location, difficulty, typical duration, price range, route maps,
 * route image uploads, and itinerary descriptions.
 *
 * This component uses Vue 3 Options API with local state for route modal/form
 * management and injects `adminDash` from the root `AdminDashboard.vue`
 * coordinator to access shared lists (trekRoutes) and trigger
 * coordinator-level actions (loadData, showToast, triggerConfirm).
 *
 * Key Sections:
 * - data: Local filters (search, difficulty, cost, duration), route form state
 * - Computed: filteredRoutes (filtering + sorting), state list extraction
 * - Methods: Route CRUD (openRouteModal, saveRoute, deleteRoute)
 * - Methods: Image upload handler (handleImageUpload via /api/admin/upload_image)
 */
export default {
  name: 'TabTreks',
  inject: ['adminDash'],
  data() {
    return {
      // Local filter states
      showMobileFilters: false,
      routeDiffFilter: 'All',
      routeDaysFilter: 'All',
      routeActiveFilter: 'All',
      routeStateFilter: 'All',
      routeDistFilter: 'All',
      tempRouteDiffFilter: 'All',
      tempRouteDaysFilter: 'All',
      tempRouteActiveFilter: 'All',
      tempRouteStateFilter: 'All',
      tempRouteDistFilter: 'All',
      showDiffFilterDropdown: false,
      showDaysFilterDropdown: false,
      showActiveFilterDropdown: false,
      showStateFilterDropdown: false,
      showDistFilterDropdown: false,

      // Local route modal/form state
      showRouteModal: false,
      showRouteDetailsModal: false,
      routeForm: {
        name: '',
        location: '',
        place: '',
        difficulty: 'Moderate',
        duration: 5,
        distance: 15,
        imageUrl: '',
        description: '',
        latitude: null,
        longitude: null
      },
      editingRoute: null,
      selectedRouteDetails: null,
      indianStates: [
        'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
        'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
        'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
        'Nagaland', 'Odisha', 'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana',
        'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal', 'Jammu and Kashmir', 'Ladakh'
      ],
      showFormDiffDropdown: false,
      showRouteStateDropdown: false,
      routeStateSearchQuery: '',
      imageMode: 'link',
      routeViewMode: 'list'
    };
  },

  watch: {
    showRouteModal(val) {
      if (!val) this.routeStateSearchQuery = '';
      if (this.adminDash.showRouteModal !== val) {
        this.adminDash.showRouteModal = val;
      }
    },
    'adminDash.showRouteModal': {
      handler(newVal) {
        if (this.showRouteModal !== newVal) {
          this.showRouteModal = newVal;
        }
      },
      immediate: true
    },
    'adminDash.editingRoute': {
      handler(newVal) {
        this.editingRoute = newVal;
        if (newVal) {
          this.routeForm = { ...newVal };
        } else {
          this.routeForm = { name: '', location: '', place: '', difficulty: 'Moderate', duration: 5, distance: 15, imageUrl: '', description: '', latitude: null, longitude: null };
        }
      },
      immediate: true
    }
  },

  computed: {
    // Access parent coordinator state
    activeTab() {
      return this.adminDash.activeTab;
    },
    trekRoutes() {
      return this.adminDash.trekRoutes;
    },

    // Filter states within the dropdown
    filteredStatesForRoute() {
      if (!this.routeStateSearchQuery) return this.indianStates;
      const q = this.routeStateSearchQuery.toLowerCase().trim();
      return this.indianStates.filter(s => s.toLowerCase().includes(q));
    },

    // Primary search and filter operations logic
    filteredRoutes() {
      let list = this.adminDash.trekRoutes || [];
      if (this.adminDash.searchQuery) {
        const q = this.adminDash.searchQuery.toLowerCase();
        list = list.filter(r =>
          (r.name && r.name.toLowerCase().includes(q)) ||
          (r.location && r.location.toLowerCase().includes(q)) ||
          (r.trekCode && r.trekCode.toLowerCase().includes(q))
        );
      }
      if (this.routeDiffFilter !== 'All') {
        list = list.filter(r => r.difficulty === this.routeDiffFilter);
      }
      if (this.routeDaysFilter !== 'All') {
        if (this.routeDaysFilter === '<5') {
          list = list.filter(r => r.duration < 5);
        } else if (this.routeDaysFilter === '5-7') {
          list = list.filter(r => r.duration >= 5 && r.duration <= 7);
        } else if (this.routeDaysFilter === '>7') {
          list = list.filter(r => r.duration > 7);
        }
      }
      if (this.routeActiveFilter !== 'All') {
        const isTargetActive = this.routeActiveFilter === 'Active';
        list = list.filter(r => r.active === isTargetActive);
      }
      if (this.routeStateFilter !== 'All') {
        list = list.filter(r => {
          if (!r.location) return false;
          const parts = r.location.split(',');
          const stateName = parts[parts.length - 1].trim();
          return stateName === this.routeStateFilter;
        });
      }
      if (this.routeDistFilter !== 'All') {
        if (this.routeDistFilter === '<10') {
          list = list.filter(r => r.distance < 10);
        } else if (this.routeDistFilter === '10-20') {
          list = list.filter(r => r.distance >= 10 && r.distance <= 20);
        } else if (this.routeDistFilter === '>20') {
          list = list.filter(r => r.distance > 20);
        }
      }
      return list;
    },

    // Extract list of unique states where active routes exist
    routeStates() {
      const states = new Set();
      const routes = this.adminDash.trekRoutes || [];
      routes.forEach(r => {
        if (r.location) {
          const parts = r.location.split(',');
          const stateName = parts[parts.length - 1].trim();
          states.add(stateName);
        }
      });
      return Array.from(states).sort();
    }
  },

  methods: {
    // Format dates for UI lists
    formatDate(dateStr) {
      if (!dateStr) return '';
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    },

    // ── Filter Management ──
    toggleRouteFilterDropdown(type) {
      const current = this[type];
      this.showDiffFilterDropdown = false;
      this.showDaysFilterDropdown = false;
      this.showActiveFilterDropdown = false;
      this.showStateFilterDropdown = false;
      this.showDistFilterDropdown = false;
      this[type] = !current;
    },
    setRouteFilter(filterKey, value) {
      this[filterKey] = value;
      if (filterKey === 'routeDiffFilter') {
        this.tempRouteDiffFilter = value;
      } else if (filterKey === 'routeDaysFilter') {
        this.tempRouteDaysFilter = value;
      } else if (filterKey === 'routeActiveFilter') {
        this.tempRouteActiveFilter = value;
      } else if (filterKey === 'routeStateFilter') {
        this.tempRouteStateFilter = value;
      } else if (filterKey === 'routeDistFilter') {
        this.tempRouteDistFilter = value;
      }
    },
    applyRouteFilters() {
      this.routeDiffFilter = this.tempRouteDiffFilter;
      this.routeDaysFilter = this.tempRouteDaysFilter;
      this.routeActiveFilter = this.tempRouteActiveFilter;
      this.routeStateFilter = this.tempRouteStateFilter;
      this.routeDistFilter = this.tempRouteDistFilter;
      this.adminDash.showToast('Filters updated');
    },
    resetRouteFilters() {
      this.tempRouteDiffFilter = 'All';
      this.tempRouteDaysFilter = 'All';
      this.tempRouteActiveFilter = 'All';
      this.tempRouteStateFilter = 'All';
      this.tempRouteDistFilter = 'All';
      this.routeDiffFilter = 'All';
      this.routeDaysFilter = 'All';
      this.routeActiveFilter = 'All';
      this.routeStateFilter = 'All';
      this.routeDistFilter = 'All';
      this.adminDash.searchQuery = '';
    },

    // ── Image Upload ──
    async handleImageUpload(e) {
      const file = e.target.files[0];
      if (!file) return;
      const formData = new FormData();
      formData.append('image', file);
      try {
        this.adminDash.showToast('Uploading image...');
        const res = await fetch('/api/admin/upload_image', {
          method: 'POST',
          body: formData
        });
        if (res.ok) {
          const data = await res.json();
          if (data.success) {
            this.routeForm.imageUrl = data.imageUrl;
            this.adminDash.showToast('Image uploaded successfully!');
          } else {
            this.adminDash.showToast('Upload failed: ' + (data.error || 'unknown error'));
          }
        } else {
          this.adminDash.showToast('Upload failed');
        }
      } catch (err) {
        this.adminDash.showToast('Upload failed (connection error)');
      }
    },

    // ── CRUD Actions ──
    openRouteModal(route = null) {
      this.editingRoute = route;
      this.routeForm = route
        ? { ...route }
        : { name: '', location: '', place: '', difficulty: 'Moderate', duration: 5, distance: 15, imageUrl: '', description: '', latitude: null, longitude: null };
      if (route && route.imageUrl && route.imageUrl.startsWith('/static/uploads')) {
        this.imageMode = 'upload';
      } else {
        this.imageMode = 'link';
      }
      this.showRouteModal = true;
    },
    closeRouteModal() {
      this.showRouteModal = false;
      this.showFormDiffDropdown = false;
      this.editingRoute = null;
    },
    async saveRoute() {
      if (!this.routeForm.name || !this.routeForm.name.trim()) {
        this.adminDash.showToast('Trek Route Name is required');
        return;
      }
      if (!this.routeForm.location || !this.routeForm.location.trim()) {
        this.adminDash.showToast('Location (State) is required');
        return;
      }
      if (!this.routeForm.difficulty) {
        this.adminDash.showToast('Difficulty is required');
        return;
      }
      if (!this.routeForm.duration || this.routeForm.duration <= 0) {
        this.adminDash.showToast('Duration must be greater than 0');
        return;
      }
      if (!this.routeForm.distance || this.routeForm.distance <= 0) {
        this.adminDash.showToast('Distance must be greater than 0');
        return;
      }
      if (!this.routeForm.imageUrl || !this.routeForm.imageUrl.trim()) {
        this.adminDash.showToast('Image is required');
        return;
      }
      if (!this.routeForm.description || !this.routeForm.description.trim()) {
        this.adminDash.showToast('Description is required');
        return;
      }
      try {
        const payload = this.editingRoute ? { id: this.editingRoute.id, ...this.routeForm } : { ...this.routeForm };
        const res = await fetch('/api/admin/trek_routes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (res.ok) {
          this.adminDash.showToast(this.editingRoute ? 'Route updated' : 'Route created');
          this.adminDash.loadData();
          this.closeRouteModal();
        } else {
          this.adminDash.showToast('Failed to save route');
        }
      } catch (_) {
        const rList = this.adminDash.trekRoutes;
        if (this.editingRoute) {
          const idx = rList.findIndex(x => x.id === this.editingRoute.id);
          if (idx !== -1) {
            rList[idx] = { ...rList[idx], ...this.routeForm };
          }
          this.adminDash.showToast('Route updated (offline)');
        } else {
          const newId = rList.length ? Math.max(...rList.map(x => x.id)) + 1 : 1;
          rList.push({
            id: newId,
            trekCode: `TR${String(newId).padStart(3, '0')}`,
            name: this.routeForm.name,
            location: this.routeForm.location,
            place: this.routeForm.place || 'India',
            difficulty: this.routeForm.difficulty,
            duration: Number(this.routeForm.duration),
            distance: Number(this.routeForm.distance),
            imageUrl: this.routeForm.imageUrl,
            description: this.routeForm.description,
            active: true
          });
          this.adminDash.showToast('Route created (offline)');
        }
        this.closeRouteModal();
      }
    },
    deleteRoute(id) {
      this.adminDash.triggerConfirm(
        'Confirm Deletion',
        'Are you sure you want to remove this trek route? All its scheduled batches will be deleted!',
        'Delete',
        async () => {
          try {
            const res = await fetch(`/api/admin/trek_routes/${id}`, { method: 'DELETE' });
            if (res.ok) {
              this.adminDash.showToast('Route removed');
              this.adminDash.loadData();
            } else {
              this.adminDash.showToast('Failed to remove route');
            }
          } catch (_) {
            this.adminDash.showToast('Failed to remove route (error)');
          }
        }
      );
    },
    async toggleRouteStatus(route) {
      try {
        const res = await fetch(`/api/admin/trek_routes/toggle/${route.id}`, { method: 'POST' });
        if (res.ok) {
          const d = await res.json();
          route.active = d.active;
          this.adminDash.showToast(`Route ${route.active ? 'opened (activated)' : 'closed (deactivated)'}`);
          this.adminDash.loadData();
        }
      } catch (_) {
        this.adminDash.showToast('Failed to toggle status');
      }
    },
    viewRouteDetails(route) {
      const activeTreks = this.adminDash.treks || [];
      const routeBatches = activeTreks.filter(b =>
        (b.trekRouteId !== undefined && b.trekRouteId !== null && route.id !== undefined && route.id !== null && Number(b.trekRouteId) === Number(route.id)) ||
        (b.name && route.name && b.name.trim().toLowerCase() === route.name.trim().toLowerCase())
      );
      const processedCount = routeBatches.length;
      let sumPrice = 0;
      let totalBookings = 0;
      const priceTrends = [];

      routeBatches.forEach(b => {
        sumPrice += Number(b.price) || 0;
        totalBookings += Number(b.booked) || 0;
        priceTrends.push({
          batchCode: b.batchCode,
          startDate: b.startDate,
          price: Number(b.price) || 0,
          booked: Number(b.booked) || 0,
          slots: Number(b.slots) || 0,
          status: b.status,
          staff: b.staff
        });
      });

      const avgPrice = processedCount ? Math.round(sumPrice / processedCount) : 0;

      this.selectedRouteDetails = {
        route,
        processedCount,
        avgPrice,
        totalBookings,
        priceTrends
      };
      this.showRouteDetailsModal = true;
    },
    closeRouteDetails() {
      this.showRouteDetailsModal = false;
      this.selectedRouteDetails = null;
    },
    selectStateForRoute(state) {
      this.routeForm.location = state;
      this.showRouteStateDropdown = false;
      this.routeStateSearchQuery = '';
    }
  }
};
</script>
