<template>
    <!-- ════════ TREK MODAL ════════ -->
    <!-- ════════ BATCH MODAL (showTrekModal) ════════ -->
    <div v-if="showTrekModal" class="ts-modal-overlay" @click.self="closeTrekModal">
      <div class="ts-modal" :class="{ 'large': editingTrek }">
        <div class="ts-modal-header">
          <h3 class="ts-modal-title">{{ editingTrek ? 'Edit Batch' : 'Schedule New Batch' }}</h3>
          <button class="modal-close" @click="closeTrekModal">✕</button>
        </div>
        <div class="ts-modal-body">
          <div :style="editingTrek ? 'display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; align-items: start;' : ''">
            <!-- Left Side: Batch Details Form Grid -->
            <div class="form-grid">
              <!-- Route Selection (only for new batches) -->
              <div v-if="!editingTrek" class="form-group form-full">
                <div class="custom-select-wrapper" :class="{ 'is-open': showRouteDropdown }">
                  <label>Select Trek Route <span style="color: var(--red); font-weight: bold;">*</span></label>
                  <div class="custom-select-trigger" @click.stop="showRouteDropdown = !showRouteDropdown">
                    <span>{{ selectedRouteName || 'Choose an active trek route...' }}</span>
                    <svg viewBox="0 0 24 24" class="custom-select-arrow" :class="{ open: showRouteDropdown }"><polyline points="6 9 12 15 18 9"/></svg>
                  </div>
                  <div v-if="showRouteDropdown" class="custom-select-dropdown">
                    <input v-model="routeSearchQuery" type="text" class="custom-select-search" placeholder="Search route by name or code..." @click.stop />
                    <div class="custom-select-options">
                      <div v-for="r in matchingActiveRoutes" :key="r.id" class="custom-select-option" :class="{ selected: trekForm.trekRouteId !== undefined && Number(trekForm.trekRouteId) === Number(r.id) }" @click="selectRouteForBatch(r)">
                        <span class="option-code">[{{ r.trekCode }}]</span>
                        <span class="option-name">{{ r.name }}</span>
                        <span class="option-loc">({{ r.location }})</span>
                      </div>
                      <div v-if="!matchingActiveRoutes.length" class="custom-select-no-results">
                        No matching active routes found.
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div v-else class="form-group form-full">
                <label>Trek Route</label>
                <input type="text" :value="'[' + (trekForm.batchCode || '—') + '] ' + trekForm.name + ' (' + trekForm.location + ')'" disabled style="background:var(--snow); color:var(--stone);" />
              </div>

              <div class="form-group">
                <label>Start Date <span style="color: var(--red); font-weight: bold;">*</span></label>
                <input v-model="trekForm.startDate" type="date" />
              </div>
              <div class="form-group">
                <label>End Date <span style="color: var(--red); font-weight: bold;">*</span></label>
                <input v-model="trekForm.endDate" type="date" readonly style="background: var(--snow); color: var(--stone); cursor: not-allowed;" />
                <div v-if="selectedRouteDuration" style="font-size: 0.76rem; color: var(--forest); margin-top: 4px; font-weight: 500;">
                  ⏱ {{ selectedRouteDuration }} days trek duration (Auto-calculated)
                </div>
              </div>
              <div class="form-group">
                <label>Available Slots <span style="color: var(--red); font-weight: bold;">*</span></label>
                <input v-model.number="trekForm.slots" type="number" min="1" />
              </div>
              <div class="form-group">
                <label>Price (INR) <span style="color: var(--red); font-weight: bold;">*</span></label>
                <input v-model.number="trekForm.price" type="number" min="0" />
              </div>
              <div class="form-group form-full">
                <div class="custom-select-wrapper" :class="{ 'is-open': showStaffDropdown }">
                  <label>Assign Staff Guide (Optional)</label>
                  <div class="custom-select-trigger" @click.stop="showStaffDropdown = !showStaffDropdown">
                    <span>{{ selectedStaffName || 'No Staff Assigned' }}</span>
                    <svg viewBox="0 0 24 24" class="custom-select-arrow" :class="{ open: showStaffDropdown }"><polyline points="6 9 12 15 18 9"/></svg>
                  </div>
                  <div v-if="showStaffDropdown" class="custom-select-dropdown">
                    <input v-model="staffSearchQuery" type="text" class="custom-select-search" placeholder="Search staff member..." @click.stop />
                    <div class="custom-select-options">
                      <div class="custom-select-option" :class="{ selected: trekForm.staff_id === null }" @click="selectStaffForBatch(null)">
                        <em>No Staff Assigned</em>
                      </div>
                      <div v-for="s in matchingStaff" :key="s.id" class="custom-select-option" :class="{ selected: trekForm.staff_id === s.id }" @click="selectStaffForBatch(s)">
                        <span class="option-name">{{ s.name }}</span>
                        <span class="option-email">({{ s.contact }})</span>
                      </div>
                      <div v-if="!matchingStaff.length" class="custom-select-no-results">
                        No staff members found.
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Right Side: Manage Batch Trekkers Section (Parallel Layout) -->
            <div v-if="editingTrek" style="border-left: 1px solid #edf2f7; padding-left: 1.5rem; display: flex; flex-direction: column; gap: 1rem; align-self: stretch; position: relative;">
              <h4 style="color: var(--forest); margin: 0; font-size: 1.05rem; display: flex; justify-content: space-between; align-items: center; font-weight: 600;">
                <span>Registered Trekkers ({{ batchTrekkers.length }} / {{ trekForm.slots }})</span>
                <div style="display: flex; gap: 0.5rem;">
                  <button class="act-btn act-assign" style="font-size: 0.75rem; padding: 4px 10px; background-color: #e6fffa; color: #319795; border: 1px solid #b2f5ea; font-weight: 600; border-radius: 4px;" @click.stop="trekkerManageMode === 'add' ? (showTrekSearch = !showTrekSearch) : (showTrekSearch = true, trekkerManageMode = 'add'); trekSearchQuery = '';">
                    + Add
                  </button>
                  <button class="act-btn act-del" style="font-size: 0.75rem; padding: 4px 10px; background-color: #fee2e2; color: #ef4444; border: 1px solid #fca5a5; font-weight: 600; border-radius: 4px;" @click.stop="trekkerManageMode === 'remove' ? (showTrekSearch = !showTrekSearch) : (showTrekSearch = true, trekkerManageMode = 'remove'); trekSearchQuery = '';">
                    ✕ Remove
                  </button>
                </div>
              </h4>

              <!-- Search Bar for adding/removing trekkers -->
              <div v-if="showTrekSearch" style="position: absolute; top: 2.2rem; left: 1.5rem; right: 0; background: #ffffff; border: 1px solid #e2e8f0; padding: 12px; border-radius: 6px; z-index: 100; box-shadow: 0 10px 20px rgba(0,0,0,0.1);">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                  <span style="font-size: 0.82rem; font-weight: bold; color: var(--gold);">
                    {{ trekkerManageMode === 'add' ? 'Search Trekker to Add' : 'Search Registered Trekker to Remove' }}
                  </span>
                  <button style="background: none; border: none; color: #a0aec0; cursor: pointer; font-size: 0.9rem;" @click="showTrekSearch = false">✕ Close</button>
                </div>
                <input v-model="trekSearchQuery" type="text" placeholder="Search by name, ID or email..." class="custom-select-search" style="margin-bottom: 8px; width: 100%;" />
                
                <div style="max-height: 150px; overflow-y: auto; background: #ffffff; border: 1px solid #edf2f7; border-radius: 4px;">
                  <!-- If Add Mode -->
                  <template v-if="trekkerManageMode === 'add'">
                    <div v-for="u in matchingTrekkerSearchResults" :key="u.id" style="display: flex; justify-content: space-between; align-items: center; padding: 8px; border-bottom: 1px solid #edf2f7; font-size: 0.85rem;">
                      <div>
                        <strong>{{ u.name }}</strong> <span style="color: #718096; font-size: 0.76rem;">[{{ u.memberId }}]</span>
                        <div style="font-size: 0.76rem; color: #a0aec0;">{{ u.email }}</div>
                      </div>
                      <button class="act-btn act-assign" style="font-size: 0.76rem; padding: 4px 8px; background-color: #e6fffa; color: #319795; border: 1px solid #b2f5ea; font-weight: 600; border-radius: 4px;" @click="addTrekkerToBatch(u)">
                        + Add
                      </button>
                    </div>
                    <div v-if="!matchingTrekkerSearchResults.length && trekSearchQuery" style="padding: 8px; font-size: 0.82rem; color: #a0aec0; text-align: center;">
                      No trekkers found.
                    </div>
                  </template>

                  <!-- If Remove Mode -->
                  <template v-if="trekkerManageMode === 'remove'">
                    <div v-for="t in matchingBatchTrekkers" :key="t.userId" style="display: flex; justify-content: space-between; align-items: center; padding: 8px; border-bottom: 1px solid #edf2f7; font-size: 0.85rem;">
                      <div>
                        <strong>{{ t.userName }}</strong> <span style="color: #718096; font-size: 0.76rem;">[{{ t.memberId }}]</span>
                        <div style="font-size: 0.76rem; color: #a0aec0;">{{ t.userEmail }}</div>
                      </div>
                      <button class="act-btn act-del" style="font-size: 0.76rem; padding: 4px 8px; background-color: #fee2e2; color: #ef4444; border: 1px solid #fca5a5; font-weight: 600; border-radius: 4px;" @click="removeTrekkerFromBatch(t)">
                        ✕ Remove
                      </button>
                    </div>
                    <div v-if="!matchingBatchTrekkers.length && trekSearchQuery" style="padding: 8px; font-size: 0.82rem; color: #a0aec0; text-align: center;">
                      No matching registered trekkers found.
                    </div>
                  </template>
                </div>
              </div>

              <!-- List of current registered trekkers -->
              <div v-if="batchTrekkers.length" style="background: #ffffff; border: 1px solid #edf2f7; border-radius: 6px; max-height: 200px; overflow-y: auto;">
                <div v-for="t in batchTrekkers" :key="t.userId" style="display: flex; justify-content: space-between; align-items: center; padding: 10px; border-bottom: 1px solid #edf2f7; font-size: 0.88rem;">
                  <div>
                    <strong>{{ t.userName }}</strong> <span style="color: #718096; font-size: 0.78rem;">[{{ t.memberId }}]</span>
                    <div style="font-size: 0.78rem; color: #a0aec0;">{{ t.userEmail }}</div>
                  </div>
                  <div style="display: flex; align-items: center; gap: 8px;">
                    <span class="status-pill status-open" style="font-size: 0.72rem; padding: 2px 8px;">Active</span>
                    <button class="act-btn act-del" style="font-size: 0.76rem; padding: 4px 8px; background-color: #fee2e2; color: #ef4444; border: 1px solid #fca5a5; font-weight: 600; border-radius: 4px;" @click="removeTrekkerFromBatch(t)">
                      ✕ Remove
                    </button>
                  </div>
                </div>
              </div>
              <div v-else style="text-align: center; padding: 15px; background: #fafafa; border: 1px dashed #e2e8f0; border-radius: 6px; font-size: 0.85rem; color: #a0aec0;">
                No trekkers registered in this batch yet.
              </div>
            </div>
          </div>
        </div>
        <div class="ts-modal-footer">
          <button class="btn-ghost" @click="closeTrekModal">Cancel</button>
          <button class="btn-primary-ts" @click="saveTrek">{{ editingTrek ? 'Save Changes' : 'Schedule Batch' }}</button>
        </div>
      </div>
    </div>

    <!-- ════════ ROUTE MODAL ════════ -->
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

    <!-- ════════ ROUTE DETAILS MODAL ════════ -->
    <div v-if="showRouteDetailsModal" class="ts-modal-overlay" @click.self="closeRouteDetails">
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

    <!-- ════════ ASSIGN GUIDE MODAL ════════ -->
    <div v-if="showAssignModal" class="ts-modal-overlay" @click.self="closeAssignModal">
      <div class="ts-modal">
        <div class="ts-modal-header">
          <h3 class="ts-modal-title">Assign Guide to {{ assignTrekObj ? assignTrekObj.name : '' }}</h3>
          <button class="modal-close" @click="closeAssignModal">✕</button>
        </div>
        <div class="ts-modal-body" style="overflow: visible;">
          <div class="form-group form-full">
            <div class="custom-select-wrapper" :class="{ 'is-open': showAssignStaffDropdown }">
              <label>Select Guide <span style="color: var(--red); font-weight: bold;">*</span></label>
              <div class="custom-select-trigger" @click.stop="showAssignStaffDropdown = !showAssignStaffDropdown">
                <span>{{ selectedAssignStaffName || 'No Staff Assigned' }}</span>
                <svg viewBox="0 0 24 24" class="custom-select-arrow" :class="{ open: showAssignStaffDropdown }"><polyline points="6 9 12 15 18 9"/></svg>
              </div>
              <div v-if="showAssignStaffDropdown" class="custom-select-dropdown">
                <input v-model="staffSearchQuery" type="text" class="custom-select-search" placeholder="Search staff member..." @click.stop />
                <div class="custom-select-options">
                  <div class="custom-select-option" :class="{ selected: tempStaffId === null }" @click="selectStaffForAssign(null)">
                    <em>No Staff Assigned</em>
                  </div>
                  <div v-for="s in matchingStaff" :key="s.id" class="custom-select-option" :class="{ selected: tempStaffId === s.id }" @click="selectStaffForAssign(s)">
                    <span class="option-name">{{ s.name }}</span>
                    <span class="option-email">({{ s.contact }})</span>
                  </div>
                  <div v-if="!matchingStaff.length" class="custom-select-no-results">
                    No staff members found.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="ts-modal-footer">
          <button class="btn-ghost" @click="closeAssignModal">Cancel</button>
          <button class="btn-primary-ts" @click="saveAssignGuide">Save Assignment</button>
        </div>
      </div>
    </div>

    <!-- ════════ ASSIGN TREK TO STAFF MODAL ════════ -->
    <div v-if="showAssignTrekModal" class="ts-modal-overlay" @click.self="closeAssignTrekModal">
      <div class="ts-modal">
        <div class="ts-modal-header">
          <h3 class="ts-modal-title">Assign Trek to {{ assignStaffObj ? assignStaffObj.name : '' }}</h3>
          <button class="modal-close" @click="closeAssignTrekModal">✕</button>
        </div>
        <div class="ts-modal-body" style="overflow: visible;">
          <div class="form-group form-full">
            <div class="custom-select-wrapper" :class="{ 'is-open': showAssignTrekDropdown }">
              <label>Select Trek Batch <span style="color: var(--red); font-weight: bold;">*</span></label>
              <div class="custom-select-trigger" @click.stop="showAssignTrekDropdown = !showAssignTrekDropdown">
                <span>{{ selectedAssignTrekCode || 'Choose a trek batch...' }}</span>
                <svg viewBox="0 0 24 24" class="custom-select-arrow" :class="{ open: showAssignTrekDropdown }"><polyline points="6 9 12 15 18 9"/></svg>
              </div>
              <div v-if="showAssignTrekDropdown" class="custom-select-dropdown">
                <input v-model="trekSearchQuery" type="text" class="custom-select-search" placeholder="Search batch by code or name..." @click.stop />
                <div class="custom-select-options">
                  <div v-for="t in matchingActiveTreks" :key="t.id" class="custom-select-option" :class="{ selected: tempTrekId === t.id }" @click="selectTrekForAssign(t)">
                    <span class="option-code">[{{ t.batchCode }}]</span>
                    <span class="option-name">{{ t.name }}</span>
                    <span class="option-loc">({{ formatDate(t.startDate) }})</span>
                  </div>
                  <div v-if="!matchingActiveTreks.length" class="custom-select-no-results">
                    No trek batches found.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="ts-modal-footer">
          <button class="btn-ghost" @click="closeAssignTrekModal">Cancel</button>
          <button class="btn-primary-ts" @click="submitAssignTrek">Assign Trek</button>
        </div>
      </div>
    </div>

    <!-- ════════ BATCH DETAILS MODAL ════════ -->
    <div v-if="showBatchDetailsModal" class="ts-modal-overlay" @click.self="closeBatchDetails">
      <div class="ts-modal large">
        <div class="ts-modal-header">
          <h3 class="ts-modal-title">Batch Details — {{ selectedBatchDetails.batch.batchCode }}</h3>
          <button class="modal-close" @click="closeBatchDetails">✕</button>
        </div>
        <div class="ts-modal-body">
          <div class="details-modal-grid">
            <!-- Left Side: Batch Info -->
            <div>
              <div class="route-detail-img" :style="{ backgroundImage: 'url(' + (selectedBatchDetails.batch.imageUrl || 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&q=80') + ')' }"></div>
              <div class="route-detail-info-block">
                <div><strong>Trek Name:</strong> <span>{{ selectedBatchDetails.batch.name }}</span></div>
                <div><strong>Location:</strong> <span>{{ selectedBatchDetails.batch.location }}</span></div>
                <div><strong>Difficulty:</strong> <span :class="'diff-pill pill-'+selectedBatchDetails.batch.difficulty.toLowerCase()">{{ selectedBatchDetails.batch.difficulty }}</span></div>
                <div><strong>Duration:</strong> <span>{{ selectedBatchDetails.batch.duration }} Days</span></div>
                <div><strong>Start Date:</strong> <span>{{ formatDate(selectedBatchDetails.batch.startDate) }}</span></div>
                <div><strong>End Date:</strong> <span>{{ formatDate(selectedBatchDetails.batch.endDate) }}</span></div>
                <div><strong>Price:</strong> <span>₹{{ selectedBatchDetails.batch.price.toLocaleString() }}</span></div>
                <div><strong>Slots:</strong> <span>{{ selectedBatchDetails.batch.booked }} / {{ selectedBatchDetails.batch.slots }} Booked</span></div>
                <div><strong>Status:</strong> <span :class="'status-pill status-'+selectedBatchDetails.batch.status.toLowerCase()">{{ selectedBatchDetails.batch.status }}</span></div>
                <div><strong>Assigned Guide:</strong> <span>{{ selectedBatchDetails.batch.staff || 'No Staff Assigned' }}</span></div>
              </div>
            </div>
            
            <!-- Right Side: Booked Trekkers -->
            <div>
              <div class="timeline-section-title">Registered Trekkers ({{ selectedBatchDetails.bookings.length }})</div>
              <div class="ts-table-wrap" v-if="selectedBatchDetails.bookings.length" style="max-height: 380px;">
                <table class="ts-table">
                  <thead>
                    <tr>
                      <th>Member ID</th>
                      <th>Trekker Name</th>
                      <th>Contact Details</th>
                      <th>Location</th>
                      <th>Booked On</th>
                      <th>Payment</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="user in selectedBatchDetails.bookings" :key="user.id">
                      <td class="mono" style="font-size: 0.8rem;">{{ user.memberId }}</td>
                      <td>
                        <span style="font-weight:600; color:var(--forest)">{{ user.userName }}</span>
                      </td>
                      <td>
                        <div style="font-size:0.8rem; line-height:1.2;">
                          <div>{{ user.userEmail }}</div>
                          <div class="mono" style="color:var(--stone)">{{ user.userPhone }}</div>
                        </div>
                      </td>
                      <td style="font-size:0.8rem;">{{ user.userCity || '—' }}</td>
                      <td class="mono" style="font-size:0.8rem;">{{ formatDate(user.bookedOn) }}</td>
                      <td>
                        <span :class="['status-pill', user.paid ? 'status-open' : 'status-pending']" style="font-size:0.75rem;">
                          {{ user.paid ? 'Paid' : 'Unpaid' }}
                        </span>
                        <div v-if="user.paid && user.transactionId" class="mono" style="font-size:0.65rem; color:var(--stone); margin-top:2px;">
                          {{ user.transactionId }}
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div v-else style="font-size:0.8rem; color:var(--stone); font-style:italic; text-align:center; padding:2rem;">
                No trekkers have booked this batch yet.
              </div>
            </div>
          </div>
        </div>
        <div class="ts-modal-footer">
          <button class="btn-primary-ts" @click="closeBatchDetails">Close</button>
        </div>
      </div>
    </div>

    <!-- ════════ STAFF MODAL ════════ -->
    <div v-if="showStaffModal" class="ts-modal-overlay" @click.self="closeStaffModal">
      <div class="ts-modal large">
        <div class="ts-modal-header">
          <h3 class="ts-modal-title">{{ editingStaff ? 'Edit Staff Profile' : 'Add Trek Staff' }}</h3>
          <button class="modal-close" @click="closeStaffModal">✕</button>
        </div>
        <div class="ts-modal-body">
          <div class="form-grid">
            <div class="form-group">
              <label>Full Name <span style="color: var(--red); font-weight: bold;">*</span></label>
              <input v-model="staffForm.name" type="text" placeholder="e.g. John Doe" />
            </div>
            <div class="form-group">
              <label>Email <span style="color: var(--red); font-weight: bold;">*</span></label>
              <input v-model="staffForm.email" type="email" placeholder="staff@trailsync.com" />
              <span v-if="emailError" style="color: var(--red); font-size: 0.75rem; margin-top: 4px; display: block;">{{ emailError }}</span>
            </div>
            <div class="form-group">
              <label>Phone Number</label>
              <input v-model="staffForm.phone" type="text" placeholder="e.g. +91 9876543210" />
              <span v-if="phoneError" style="color: var(--red); font-size: 0.75rem; margin-top: 4px; display: block;">{{ phoneError }}</span>
            </div>
            <div class="form-group">
              <label>{{ editingStaff ? 'New Password (optional)' : 'Password (Default: Trailsync@123)' }}</label>
              <input v-model="staffForm.password" type="text" :placeholder="editingStaff ? 'Leave blank to keep unchanged' : 'Trailsync@123'" />
            </div>
            <div class="form-group">
              <label>Designation</label>
              <input v-model="staffForm.designation" type="text" placeholder="e.g. Lead Guide" />
            </div>
            <div class="form-group">
              <label>Experience (Years)</label>
              <input v-model.number="staffForm.experience" type="number" min="0" />
            </div>
            <div class="form-group">
              <label>Skills</label>
              <input v-model="staffForm.skills" type="text" placeholder="e.g. Wilderness First Aid, Navigation" />
            </div>
            <div class="form-group">
              <label>Certifications</label>
              <input v-model="staffForm.certifications" type="text" placeholder="e.g. WFR" />
            </div>
            <div class="form-group">
              <label>Languages</label>
              <input v-model="staffForm.languages" type="text" placeholder="e.g. English, Hindi" />
            </div>
            <div class="form-group">
              <label>Completed Treks Count</label>
              <input v-model.number="staffForm.completedTreksCount" type="number" min="0" />
            </div>
            <div class="form-group form-full">
              <label>Staff Photograph</label>
              <div style="display: flex; gap: 1rem; margin-bottom: 0.5rem;">
                <label style="display: flex; align-items: center; gap: 4px; font-weight: normal; cursor: pointer; font-size: 0.82rem;">
                  <input type="radio" value="link" v-model="staffImageMode" /> Use Image Link
                </label>
                <label style="display: flex; align-items: center; gap: 4px; font-weight: normal; cursor: pointer; font-size: 0.82rem;">
                  <input type="radio" value="upload" v-model="staffImageMode" /> Upload Image
                </label>
              </div>
              <div v-if="staffImageMode === 'link'">
                <input v-model="staffForm.photoUrl" type="text" placeholder="https://images.unsplash.com/photo-..." />
              </div>
              <div v-else style="display: flex; gap: 10px; align-items: center;">
                <input type="file" @change="handleStaffPhotoUpload" accept="image/*" class="form-control" style="font-size: 0.82rem; padding: 4px 8px;" />
              </div>
              <div v-if="staffForm.photoUrl" style="margin-top: 8px;">
                <img :src="staffForm.photoUrl" alt="Preview" style="max-height: 80px; border-radius: 4px; border: 1px solid var(--stone);" />
              </div>
            </div>
          </div>
        </div>
        <div class="ts-modal-footer">
          <button class="btn-ghost" @click="closeStaffModal">Cancel</button>
          <button class="btn-primary-ts" @click="saveStaff">{{ editingStaff ? 'Save Changes' : 'Add Staff Member' }}</button>
        </div>
      </div>
    </div>

    <!-- ════════ TREKKER MODAL ════════ -->
    <div v-if="showTrekkerModal" class="ts-modal-overlay" @click.self="closeTrekkerModal">
      <div class="ts-modal">
        <div class="ts-modal-header">
          <h3 class="ts-modal-title">{{ editingTrekker ? 'Edit User Profile' : 'Add New Trekker' }}</h3>
          <button class="modal-close" @click="closeTrekkerModal">✕</button>
        </div>
        <div class="ts-modal-body">
          <div class="form-grid">
            <div class="form-group form-full">
              <label>Full Name <span style="color: var(--red); font-weight: bold;">*</span></label>
              <input v-model="trekkerForm.name" type="text" placeholder="e.g. John Doe" />
            </div>
            <div class="form-group form-full">
              <label>Email <span style="color: var(--red); font-weight: bold;">*</span></label>
              <input v-model="trekkerForm.email" type="email" placeholder="john.doe@example.com" />
            </div>
            <div class="form-group">
              <label>Phone Number</label>
              <input v-model="trekkerForm.phone" type="text" placeholder="e.g. +91 9876543210" />
            </div>
            <div class="form-group">
              <label>{{ editingTrekker ? 'New Password (optional)' : 'Password (Default: Trekker@123)' }}</label>
              <input v-model="trekkerForm.password" type="text" :placeholder="editingTrekker ? 'Leave blank to keep unchanged' : 'Trekker@123'" />
            </div>
            <div class="form-group">
              <label>City</label>
              <input v-model="trekkerForm.city" type="text" placeholder="e.g. Delhi" />
            </div>
            <div class="form-group">
              <label>Emergency Contact</label>
              <input v-model="trekkerForm.emergency" type="text" placeholder="e.g. +91 9999988888" />
            </div>
            <div class="form-group form-full">
              <label>Bio / Medical Info</label>
              <textarea v-model="trekkerForm.bio" placeholder="e.g. Has previous experience trekking, no medical history." rows="3"></textarea>
            </div>
          </div>
        </div>
        <div class="ts-modal-footer">
          <button class="btn-ghost" @click="closeTrekkerModal">Cancel</button>
          <button class="btn-primary-ts" @click="saveTrekker">{{ editingTrekker ? 'Save Changes' : 'Add Trekker' }}</button>
        </div>
      </div>
    </div>

    <!-- ════════ CUSTOM CONFIRMATION MODAL ════════ -->
    <div v-if="showConfirmModal" class="ts-modal-overlay" @click.self="closeConfirmModal" style="z-index: 3000;">
      <div class="ts-modal" style="max-width: 400px;">
        <div class="ts-modal-header" style="border-bottom: none; padding-bottom: 0;">
          <h3 class="ts-modal-title" style="color: var(--red); display: flex; align-items: center; gap: 8px;">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
            <span>{{ confirmTitle }}</span>
          </h3>
          <button class="modal-close" @click="closeConfirmModal">✕</button>
        </div>
        <div class="ts-modal-body" style="padding-top: 1rem; padding-bottom: 1.5rem; font-size: 0.9rem; color: var(--forest-mid);">
          {{ confirmMessage }}
        </div>
        <div class="ts-modal-footer" style="background: var(--snow); border-top: 1px solid var(--stone-light);">
          <button class="btn-ghost" @click="closeConfirmModal">Cancel</button>
          <button class="btn-primary-ts" style="background: var(--red); border-color: var(--red);" @click="onConfirmYes">{{ confirmBtnLabel }}</button>
        </div>
      </div>
    </div>

    <!-- ════════ BLACKLIST REASON MODAL ════════ -->
    <div v-if="showBlacklistModal" class="ts-modal-overlay" @click.self="closeBlacklistModal" style="z-index: 3000;">
      <div class="ts-modal" style="max-width: 450px;">
        <div class="ts-modal-header" style="border-bottom: none; padding-bottom: 0;">
          <h3 class="ts-modal-title" style="color: var(--red); display: flex; align-items: center; gap: 8px;">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"></line></svg>
            <span>Blacklist Account</span>
          </h3>
          <button class="modal-close" @click="closeBlacklistModal">✕</button>
        </div>
        <div class="ts-modal-body" style="padding-top: 1rem; padding-bottom: 1.5rem; font-size: 0.9rem;">
          <p style="margin-bottom: 0.75rem; color: var(--forest-mid);">
            Are you sure you want to blacklist <strong>{{ blacklistTargetUser ? blacklistTargetUser.name : '' }}</strong>? This will prevent them from logging in and accessing their dashboard.
          </p>
          <div class="form-group" style="margin-top: 1rem;">
            <label style="font-weight: 600; color: var(--forest); display: block; margin-bottom: 0.5rem;">Reason for Blacklisting:</label>
            <textarea 
              v-model="blacklistReasonText" 
              placeholder="Enter reason for blacklisting (e.g. Code of conduct violation, payment fraud)..." 
              rows="4" 
              style="width: 100%; padding: 0.5rem; border: 1px solid var(--stone); border-radius: var(--radius); font-size: 0.85rem; font-family: inherit; resize: vertical;"
            ></textarea>
          </div>
        </div>
        <div class="ts-modal-footer" style="background: var(--snow); border-top: 1px solid var(--stone-light);">
          <button class="btn-ghost" @click="closeBlacklistModal">Cancel</button>
          <button class="btn-primary-ts" style="background: var(--red); border-color: var(--red);" @click="submitBlacklist">Blacklist Account</button>
        </div>
      </div>
    </div>

    <!-- ════════ STAFF DETAILS MODAL ════════ -->
    <div v-if="showStaffDetailsModal" class="ts-modal-overlay" @click.self="closeStaffDetails">
      <div class="ts-modal extra-large">
        <div class="ts-modal-header">
          <h3 class="ts-modal-title">Staff Member Details</h3>
          <button class="modal-close" @click="closeStaffDetails">✕</button>
        </div>
        <div class="ts-modal-body">
          <div class="details-modal-grid" style="grid-template-columns: 1fr 2fr;">
            <!-- Left Side: Profile Photo & Basic Details -->
            <div style="text-align: center; border-right: 1px solid var(--stone-light); padding-right: 1.5rem;">
              <img :src="selectedStaffDetails.photoUrl" style="width: 140px; height: 140px; border-radius: 50%; object-fit: cover; margin: 0 auto 1rem; border: 3px solid var(--forest); box-shadow: 0 4px 10px rgba(0,0,0,0.1);" />
              <h4 style="font-weight: 700; color: var(--forest); margin-bottom: 0.25rem;">{{ selectedStaffDetails.name }}</h4>
              <div style="font-size: 0.85rem; color: var(--stone); font-family: monospace; margin-bottom: 1rem;">ID: {{ selectedStaffDetails.memberId }}</div>
              
              <div class="staff-detail-info" style="text-align: left; background: var(--snow); padding: 1rem; border-radius: 6px; border: 1px solid var(--stone-light); font-size: 0.84rem;">
                <div style="margin-bottom: 8px;"><strong>Designation:</strong> {{ selectedStaffDetails.designation }}</div>
                <div style="margin-bottom: 8px;"><strong>Email:</strong> {{ selectedStaffDetails.contact }}</div>
                <div style="margin-bottom: 8px;"><strong>Phone:</strong> {{ selectedStaffDetails.phone || '—' }}</div>
                <div style="margin-bottom: 8px;"><strong>Joined Date:</strong> {{ formatDate(selectedStaffDetails.joined) }}</div>
                <div style="margin-bottom: 8px;"><strong>Experience:</strong> {{ selectedStaffDetails.experience }} years</div>
                <div style="margin-bottom: 8px;"><strong>Languages:</strong> {{ selectedStaffDetails.languages }}</div>
                <div style="margin-bottom: 8px;"><strong>Certifications:</strong> {{ selectedStaffDetails.certifications }}</div>
                <div><strong>Skills:</strong> {{ selectedStaffDetails.skills }}</div>
              </div>
            </div>
            
            <!-- Right Side: Treks Completed -->
            <div style="min-width: 0;">
              <div class="timeline-section-title" style="font-weight: 700; color: var(--forest); font-size: 1.05rem; margin-bottom: 0.75rem;">
                Treks Completed ({{ selectedStaffDetails.treksDone.length }})
              </div>
              <div class="ts-table-wrap goldish" v-if="selectedStaffDetails.treksDone.length" style="max-height: 360px; overflow: auto; border-radius: 4px;">
                <table class="ts-table" style="min-width: 550px; width: 100%;">
                  <thead>
                    <tr>
                      <th style="padding: 10px 12px; font-size: 0.72rem;">Batch ID</th>
                      <th style="padding: 10px 12px; font-size: 0.72rem;">Trek Name</th>
                      <th style="padding: 10px 12px; font-size: 0.72rem;">Trek location</th>
                      <th style="padding: 10px 12px; font-size: 0.72rem; text-align: center;">Total Trekkers</th>
                      <th style="padding: 10px 12px; font-size: 0.72rem;">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="t in selectedStaffDetails.treksDone" :key="t.batchId">
                      <td class="mono" style="font-weight: 700; color: var(--gold); padding: 10px 12px;">{{ t.batchId }}</td>
                      <td style="font-weight: 600; color: var(--forest); padding: 10px 12px;">{{ t.trekName }}</td>
                      <td style="padding: 10px 12px; font-size: 0.82rem; color: var(--bark);">📍 {{ t.location }}</td>
                      <td class="mono" style="text-align: center; padding: 10px 12px; font-weight: 600; color: var(--forest-mid);">
                        {{ t.trekkersCount }}
                      </td>
                      <td class="mono" style="white-space: nowrap; padding: 10px 12px; font-size: 0.75rem; color: var(--stone);">
                        {{ formatDate(t.startDate) }}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div v-else style="font-size:0.8rem; color:var(--stone); font-style:italic; text-align:center; padding:3rem 1rem; background: var(--snow); border-radius: 6px; border: 1px dashed var(--stone);">
                No treks done or assigned to this staff member yet.
              </div>
            </div>
          </div>
        </div>
        <div class="ts-modal-footer">
          <button class="btn-primary-ts" @click="closeStaffDetails">Close</button>
        </div>
      </div>
    </div>

    <!-- ════════ USER DETAILS MODAL ════════ -->
    <div v-if="showUserDetailsModal" class="ts-modal-overlay" @click.self="closeUserDetails">
      <div class="ts-modal large">
        <div class="ts-modal-header">
          <h3 class="ts-modal-title">User Account Details</h3>
          <button class="modal-close" @click="closeUserDetails">✕</button>
        </div>
        <div class="ts-modal-body">
          <div class="details-modal-grid">
            <!-- Left Side: Profile Photo & Basic Details -->
            <div style="text-align: center; border-right: 1px solid var(--stone-light); padding-right: 1.5rem;">
              <img :src="selectedUserDetails.photoUrl" style="width: 140px; height: 140px; border-radius: 50%; object-fit: cover; margin: 0 auto 1rem; border: 3px solid var(--forest); box-shadow: 0 4px 10px rgba(0,0,0,0.1);" />
              <h4 style="font-weight: 700; color: var(--forest); margin-bottom: 0.25rem;">{{ selectedUserDetails.name }}</h4>
              <div style="font-size: 0.85rem; color: var(--stone); font-family: monospace; margin-bottom: 1rem;">ID: {{ selectedUserDetails.memberId }}</div>
              
              <div class="staff-detail-info" style="text-align: left; background: var(--snow); padding: 1rem; border-radius: 6px; border: 1px solid var(--stone-light); font-size: 0.84rem;">
                <div style="margin-bottom: 8px;"><strong>Email:</strong> {{ selectedUserDetails.email }}</div>
                <div style="margin-bottom: 8px;"><strong>Phone:</strong> {{ selectedUserDetails.phone || '—' }}</div>
                <div style="margin-bottom: 8px;"><strong>City:</strong> {{ selectedUserDetails.city || '—' }}</div>
                <div style="margin-bottom: 8px;"><strong>Emergency Contact:</strong> {{ selectedUserDetails.emergency || '—' }}</div>
                <div style="margin-bottom: 8px;"><strong>Joined:</strong> {{ formatDate(selectedUserDetails.registered) }}</div>
                <div><strong>Bio:</strong> {{ selectedUserDetails.bio || 'No bio provided.' }}</div>
              </div>
            </div>
            
            <!-- Right Side: Booking Details History Table -->
            <div>
              <div class="timeline-section-title" style="font-weight: 700; color: var(--forest); font-size: 1.05rem; margin-bottom: 0.75rem;">
                Trek Bookings History ({{ selectedUserDetails.bookingsList.length }})
              </div>
              <div class="ts-table-wrap" v-if="selectedUserDetails.bookingsList.length" style="max-height: 360px; overflow-y: auto;">
                <table class="ts-table">
                  <thead>
                    <tr>
                      <th>Batch ID</th>
                      <th>Trek Name</th>
                      <th>Paid Amount</th>
                      <th>Paid On</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="b in selectedUserDetails.bookingsList" :key="b.id">
                      <td class="mono font-bold">{{ b.batchCode }}</td>
                      <td style="font-weight: 600; color: var(--forest);">{{ b.trek }}</td>
                      <td class="mono">₹{{ (b.amountPaid || b.bookingPrice || 0).toLocaleString() }}</td>
                      <td class="mono" style="white-space: nowrap;">{{ b.paidOn === '—' ? '—' : formatDate(b.paidOn) }}</td>
                      <td>
                        <span :class="['status-pill', b.status === 'Booked' ? 'status-active' : (b.status === 'Completed' ? 'status-open' : 'status-inactive')]" style="font-size: 0.72rem; padding: 2px 6px;">
                          {{ b.status }}
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div v-else style="font-size:0.8rem; color:var(--stone); font-style:italic; text-align:center; padding:3rem 1rem; background: var(--snow); border-radius: 6px; border: 1px dashed var(--stone);">
                No booking history records found for this user.
              </div>
            </div>
          </div>
        </div>
        <div class="ts-modal-footer">
          <button class="btn-primary-ts" @click="closeUserDetails">Close</button>
        </div>
      </div>
    </div>

    <!-- ════════ BOOKING DETAILS MODAL ════════ -->
    <div v-if="showBookingDetailsModal" class="ts-modal-overlay" @click.self="closeBookingDetails">
      <div class="ts-modal large">
        <div class="ts-modal-header">
          <h3 class="ts-modal-title">Booking Details — {{ selectedBookingDetails.booking.bookingId || ('#' + selectedBookingDetails.booking.id) }}</h3>
          <button class="modal-close" @click="closeBookingDetails">✕</button>
        </div>
        <div class="ts-modal-body" style="max-height: 480px; overflow-y: auto;">
          <div class="details-modal-grid">
            <!-- Left Side: Trekker Profile Info -->
            <div>
              <div class="timeline-section-title" style="margin-bottom: 0.75rem;">Trekker Profile</div>
              <div class="route-detail-info-block" style="margin-bottom: 1.5rem;">
                <div><strong>Member ID:</strong> <span class="mono">{{ selectedBookingDetails.user.memberId }}</span></div>
                <div><strong>Full Name:</strong> <span>{{ selectedBookingDetails.user.name }}</span></div>
                <div><strong>Email:</strong> <span>{{ selectedBookingDetails.user.email }}</span></div>
                <div><strong>Phone Number:</strong> <span class="mono">{{ selectedBookingDetails.user.phone || '—' }}</span></div>
                <div><strong>City / Base:</strong> <span>{{ selectedBookingDetails.user.city || '—' }}</span></div>
                <div><strong>Emergency Contact:</strong> <span class="mono">{{ selectedBookingDetails.user.emergency || '—' }}</span></div>
                <div style="grid-column: 1 / -1; margin-top: 5px;">
                  <strong>Medical Bio / Info:</strong>
                  <div style="font-size:0.8rem; background:var(--cream); padding:0.5rem; border-radius:4px; margin-top:4px; color:var(--bark);">
                    {{ selectedBookingDetails.user.bio || 'No medical bio provided.' }}
                  </div>
                </div>
              </div>

              <div class="timeline-section-title" style="margin-bottom: 0.75rem;">Transaction & Payment</div>
              <div class="route-detail-info-block">
                <div><strong>Payment Status:</strong> 
                  <span :class="['status-pill', 
                    selectedBookingDetails.booking.paymentStatus === 'Paid' ? 'status-open' : 
                    selectedBookingDetails.booking.paymentStatus === 'Refunded' ? 'status-cancelled' : 'status-pending'
                  ]">
                    {{ selectedBookingDetails.booking.paymentStatus }}
                  </span>
                </div>
                <div><strong>Amount Paid:</strong> <span class="mono">₹{{ (selectedBookingDetails.booking.amountPaid || selectedBookingDetails.booking.bookingPrice || 0).toLocaleString() }}</span></div>
                <div v-if="selectedBookingDetails.booking.refundAmount > 0">
                  <strong>Refunded Amount:</strong> <span class="mono" style="color: var(--red); font-weight: 600;">₹{{ selectedBookingDetails.booking.refundAmount.toLocaleString() }}</span>
                </div>
                <div><strong>Paid On Date:</strong> <span class="mono">{{ selectedBookingDetails.booking.paidOn || '—' }}</span></div>
              </div>
            </div>

            <!-- Right Side: Batch Details -->
            <div>
              <div class="timeline-section-title" style="margin-bottom: 0.75rem;">Trek Batch Details</div>
              <div class="route-detail-info-block">
                <div><strong>Batch Code:</strong> <span class="mono">{{ selectedBookingDetails.booking.batchCode }}</span></div>
                <div><strong>Trek Name:</strong> <span>{{ selectedBookingDetails.booking.trek }}</span></div>
                <div><strong>Trek Start Date:</strong> <span class="mono">{{ formatDate(selectedBookingDetails.booking.startDate) }}</span></div>
                <div><strong>Booked On:</strong> <span class="mono">{{ formatDate(selectedBookingDetails.booking.date) }}</span></div>
                <div><strong>Booking Status:</strong> <span :class="'status-pill status-'+selectedBookingDetails.booking.status.toLowerCase()">{{ selectedBookingDetails.booking.status }}</span></div>
              </div>
            </div>
          </div>
        </div>
        <div class="ts-modal-footer">
          <button class="btn-primary-ts" @click="closeBookingDetails">Close</button>
        </div>
      </div>
    </div>

    <!-- ════════ SUPPORT TICKET DETAILS MODAL ════════ -->
    <div v-if="showTicketDetailsModal" class="ts-modal-overlay" @click.self="closeTicketDetails">
      <div class="ts-modal large">
        <div class="ts-modal-header">
          <h3 class="ts-modal-title">Ticket details — {{ selectedTicketDetails.ticketId || ('TS26#' + String(selectedTicketDetails.id).padStart(3, '0')) }}</h3>
          <button class="modal-close" @click="closeTicketDetails">✕</button>
        </div>
        <div class="ts-modal-body" style="padding: 1.5rem; max-height: 480px; overflow-y: auto;">
          <div class="details-modal-grid">
            
            <!-- Left Side: Ticket Description -->
            <div style="border-right: 1px solid var(--stone-light); padding-right: 1.5rem;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem; background: var(--snow); padding: 0.75rem 1rem; border-radius: 6px; border: 1px solid rgba(26,46,26,0.06);">
                <div>
                  <span class="category-tag" :class="getCategoryClass(selectedTicketDetails.category)" style="margin-right: 8px;">
                    {{ selectedTicketDetails.category || 'General Inquiry' }}
                  </span>
                  <span class="status-pill" :class="selectedTicketDetails.status === 'Open' ? 'status-pending' : 'status-approved'">
                    {{ selectedTicketDetails.status }}
                  </span>
                </div>
                <div class="mono" style="font-size: 0.78rem; color: var(--stone);">
                  Submitted: {{ selectedTicketDetails.createdAt ? selectedTicketDetails.createdAt.split(' ')[0] : '—' }}
                </div>
              </div>

              <div style="margin-bottom: 1.25rem;">
                <div style="font-size: 0.8rem; font-weight: 700; color: var(--forest); text-transform: uppercase; margin-bottom: 0.25rem;">Subject</div>
                <div style="font-weight: 600; color: var(--bark); font-size: 1.05rem; line-height: 1.4;">
                  {{ selectedTicketDetails.cleanSubject || selectedTicketDetails.subject }}
                </div>
              </div>

              <div>
                <div style="font-size: 0.8rem; font-weight: 700; color: var(--forest); text-transform: uppercase; margin-bottom: 0.25rem;">Message Description</div>
                <div style="font-size: 0.9rem; color: var(--stone); line-height: 1.5; white-space: pre-wrap; background: var(--snow); padding: 1rem; border-radius: 6px; border: 1px solid rgba(26,46,26,0.06); min-height: 120px; max-height: 200px; overflow-y: auto;">
                  {{ selectedTicketDetails.message }}
                </div>
              </div>
            </div>

            <!-- Right Side: User Profile Details -->
            <div>
              <div v-if="selectedTicketDetails.userDetails">
                <div style="text-align: center; margin-bottom: 1.25rem;">
                  <img :src="selectedTicketDetails.userDetails.photoUrl" style="width: 90px; height: 90px; border-radius: 50%; object-fit: cover; border: 2px solid var(--forest); box-shadow: 0 4px 8px rgba(0,0,0,0.1); margin-bottom: 0.5rem;" />
                  <h4 style="font-weight: 700; color: var(--forest); margin-bottom: 0.1rem;">{{ selectedTicketDetails.userDetails.name }}</h4>
                  <div style="font-size: 0.8rem; color: var(--stone); font-family: monospace;">ID: {{ selectedTicketDetails.userDetails.memberId }}</div>
                </div>

                <div class="staff-detail-info" style="background: var(--snow); padding: 1rem; border-radius: 6px; border: 1px solid var(--stone-light); font-size: 0.82rem;">
                  <div style="margin-bottom: 6px;"><strong>Email:</strong> {{ selectedTicketDetails.userDetails.email }}</div>
                  <div style="margin-bottom: 6px;"><strong>Phone:</strong> {{ selectedTicketDetails.userDetails.phone || '—' }}</div>
                  <div v-if="selectedTicketDetails.userDetails.role === 'staff'">
                    <div style="margin-bottom: 6px;"><strong>Designation:</strong> {{ selectedTicketDetails.userDetails.designation || 'Trek Staff' }}</div>
                    <div style="margin-bottom: 6px;"><strong>Experience:</strong> {{ selectedTicketDetails.userDetails.experience || '—' }} years</div>
                    <div style="margin-bottom: 6px;"><strong>Skills:</strong> {{ selectedTicketDetails.userDetails.skills || '—' }}</div>
                    <div style="margin-bottom: 6px;"><strong>Certifications:</strong> {{ selectedTicketDetails.userDetails.certifications || '—' }}</div>
                  </div>
                  <div v-else>
                    <div style="margin-bottom: 6px;"><strong>City:</strong> {{ selectedTicketDetails.userDetails.city || '—' }}</div>
                    <div style="margin-bottom: 6px;"><strong>Emergency Contact:</strong> {{ selectedTicketDetails.userDetails.emergency || '—' }}</div>
                    <div style="margin-bottom: 6px;"><strong>Total Bookings:</strong> <span class="mono" style="font-weight:700; color:var(--forest);">{{ selectedTicketDetails.userDetails.bookingsList.length }}</span></div>
                  </div>
                  <div style="margin-bottom: 6px;"><strong>Joined:</strong> {{ formatDate(selectedTicketDetails.userDetails.registered) }}</div>
                  <div><strong>Bio:</strong> {{ selectedTicketDetails.userDetails.bio || 'No bio provided.' }}</div>
                </div>
              </div>
              
              <div v-else style="text-align: center; padding: 2rem 1rem; background: var(--snow); border-radius: 6px; border: 1px dashed var(--stone); height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center;">
                <svg viewBox="0 0 24 24" width="36" height="36" style="stroke: var(--stone); opacity: 0.6; margin-bottom: 0.75rem;" fill="none" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                <h5 style="font-size: 0.9rem; color: var(--forest); font-weight: 700; margin-bottom: 0.25rem;">Guest Submitter</h5>
                <p style="font-size: 0.78rem; color: var(--stone); line-height: 1.4; margin: 0;">
                  No registered account matches this ticket's email address ({{ selectedTicketDetails.email }}).
                </p>
              </div>
            </div>

          </div>
        </div>
        <div class="ts-modal-footer" style="display: flex; justify-content: flex-end; gap: 0.5rem; padding: 1rem 1.5rem;">
          <button class="btn-primary-ts" @click="closeTicketDetails" style="background: #e2e8f0; border-color: #cbd5e0; color: #4a5568;">Close</button>
          <button class="btn-primary-ts" v-if="selectedTicketDetails.status === 'Open'" @click="resolveTicket(selectedTicketDetails)">Resolve Ticket</button>
        </div>
      </div>
    </div>

    <!-- ════════ REPORT PREVIEW MODAL ════════ -->
    <div v-if="showReportPreviewModal && reportPreviewData" class="ts-modal-overlay" @click.self="showReportPreviewModal = false">
      <div class="ts-modal large" style="max-width: 960px; width: 95%;">
        <div class="ts-modal-header">
          <h3 class="ts-modal-title">Report Preview</h3>
          <button class="modal-close" @click="showReportPreviewModal = false">✕</button>
        </div>
        <div class="ts-modal-body" style="padding: 0; max-height: 520px; height: 500px; display: flex; flex-direction: column;">
          <iframe :srcdoc="iframeSrcDoc" style="width: 100%; height: 100%; border: none; background: #fff;"></iframe>
        </div>
        <div class="ts-modal-footer" style="display: flex; justify-content: space-between; align-items: center; padding: 1rem 1.5rem;">
          <div style="display: flex; gap: 0.5rem;">
            <button class="btn-primary-ts" @click="downloadReportHTML(reportPreviewData)" style="background: var(--forest); border-color: var(--forest); color: #fff;">
              ↓ Download HTML Report
            </button>
            <button class="btn-primary-ts" @click="downloadReportCSV(reportPreviewData)" style="background: var(--gold); border-color: var(--gold); color: #fff;">
              ↓ Download CSV
            </button>
          </div>
          <button class="btn-primary-ts" @click="showReportPreviewModal = false" style="background: #e2e8f0; border-color: #cbd5e0; color: #4a5568;">Close</button>
        </div>
      </div>
    </div>

    <!-- ════════ TREK HISTORY DETAILS MODAL ════════ -->
    <div v-if="showHistoryModal && selectedHistoryTrek" class="ts-modal-overlay" @click.self="showHistoryModal = false">
      <div class="ts-modal large">
        <div class="ts-modal-header">
          <h3 class="ts-modal-title">Trek Batch History: {{ selectedHistoryTrek.batchCode || ('B' + selectedHistoryTrek.id) }}</h3>
          <button class="modal-close" @click="showHistoryModal = false">✕</button>
        </div>
        <div class="ts-modal-body" style="padding: 1.5rem; max-height: 480px; overflow-y: auto;">
          <div class="details-modal-grid">
            <!-- Left Side: Batch Summary -->
            <div style="border-right: 1px solid var(--stone-light); padding-right: 1.5rem;">
              <h4 style="font-weight: 700; color: var(--forest); margin-bottom: 1rem;">Batch Overview</h4>
              <div class="route-detail-info-block" style="display: flex; flex-direction: column; gap: 0.5rem; font-size: 0.9rem;">
                <div><strong>Trek Name:</strong> <span>{{ selectedHistoryTrek.name }}</span></div>
                <div><strong>Location:</strong> <span>{{ selectedHistoryTrek.location }}</span></div>
                <div v-if="selectedHistoryTrek.place"><strong>Place:</strong> <span>{{ selectedHistoryTrek.place }}</span></div>
                <div><strong>Difficulty:</strong> <span :class="'diff-pill pill-'+selectedHistoryTrek.difficulty.toLowerCase()">{{ selectedHistoryTrek.difficulty }}</span></div>
                <div><strong>Start Date:</strong> <span class="mono">{{ formatDate(selectedHistoryTrek.startDate) }}</span></div>
                <div><strong>End Date:</strong> <span class="mono">{{ formatDate(selectedHistoryTrek.endDate) }}</span></div>
                <div><strong>Duration:</strong> <span class="mono">{{ selectedHistoryTrek.duration }} Days</span></div>
                <div><strong>Price per Participant:</strong> <span class="mono">₹{{ selectedHistoryTrek.price ? selectedHistoryTrek.price.toLocaleString() : '0' }}</span></div>
                <div><strong>Status:</strong> <span :class="'status-pill status-'+selectedHistoryTrek.status.toLowerCase()">{{ selectedHistoryTrek.status }}</span></div>
              </div>

              <h4 style="font-weight: 700; color: var(--forest); margin-top: 1.5rem; margin-bottom: 1rem;">Assigned Staff (Guide)</h4>
              <div v-if="selectedHistoryTrek.staff" class="staff-detail-info" style="background: var(--snow); padding: 1rem; border-radius: 6px; border: 1px solid var(--stone-light); font-size: 0.85rem;">
                <div><strong>Name:</strong> <span>{{ selectedHistoryTrek.staff }}</span></div>
                <div><strong>ID:</strong> <span class="mono">{{ 'TS26S' + String(selectedHistoryTrek.staff_id).padStart(3, '0') }}</span></div>
              </div>
              <div v-else style="color: var(--stone); font-style: italic; background: var(--snow); padding: 1rem; border-radius: 6px; border: 1px dashed var(--stone);">
                No staff member was assigned to this batch.
              </div>
            </div>

            <!-- Right Side: Participant List -->
            <div>
              <h4 style="font-weight: 700; color: var(--forest); margin-bottom: 1rem;">Participants ({{ batchTrekkers.length }})</h4>
              <div v-if="batchTrekkers.length === 0" style="text-align: center; padding: 2rem 1rem; background: var(--snow); border-radius: 6px; border: 1px dashed var(--stone);">
                <p style="color: var(--stone); margin: 0;">No participants registered for this batch.</p>
              </div>
              <div v-else style="max-height: 350px; overflow-y: auto;">
                <table class="ts-table" style="font-size: 0.82rem;">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Member ID</th>
                      <th>Email</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="u in batchTrekkers" :key="u.bookingId || u.userId">
                      <td style="font-weight: 600; color: var(--forest);">{{ u.userName }}</td>
                      <td class="mono" style="font-size: 0.8rem;">{{ u.memberId || ('U' + u.userId) }}</td>
                      <td>{{ u.userEmail }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
        <div class="ts-modal-footer">
          <button class="btn-primary-ts" @click="showHistoryModal = false">Close</button>
        </div>
      </div>
    </div>

    <!-- ════════ REFUND MODAL ════════ -->
    <div v-if="showRefundModal" class="ts-modal-overlay" @click.self="closeRefundModal" style="z-index: 3000;">
      <div class="ts-modal" style="max-width: 450px;">
        <div class="ts-modal-header" style="border-bottom: 1px solid rgba(26,46,26,0.09);">
          <h3 class="ts-modal-title" style="color: var(--forest); display: flex; align-items: center; gap: 8px;">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
            <span>Process Refund</span>
          </h3>
          <button class="modal-close" @click="closeRefundModal">✕</button>
        </div>
        <div class="ts-modal-body" style="padding: 1.5rem; font-size: 0.9rem;">
          <div class="form-grid" style="display: flex; flex-direction: column; gap: 12px;">
            <div style="background: var(--snow); padding: 12px; border-radius: 6px; border: 1px solid rgba(26,46,26,0.08); display: flex; flex-direction: column; gap: 4px;">
              <div><strong>Booking ID:</strong> <span class="mono" style="font-weight: 600; color: var(--bark);">{{ refundTarget ? (refundTarget.bookingId || ('#' + refundTarget.id)) : '' }}</span></div>
              <div><strong>Trekker Name:</strong> <span style="font-weight: 600; color: var(--forest);">{{ refundTarget ? refundTarget.user : '' }}</span></div>
              <div><strong>Trek:</strong> <span style="font-weight: 600;">{{ refundTarget ? refundTarget.trek : '' }}</span></div>
              <div><strong>Original Paid:</strong> <span style="font-weight: 700; color: var(--forest);">₹{{ refundTarget ? (refundTarget.amountPaid || refundTarget.bookingPrice || 5000).toLocaleString() : 0 }}</span></div>
            </div>
            
            <div class="form-group form-full">
              <label for="refund-amount-input">Refund Amount (INR) <span style="color: var(--red); font-weight: bold;">*</span></label>
              <input 
                id="refund-amount-input" 
                v-model.number="refundAmountInput" 
                type="number" 
                min="0" 
                :max="refundTarget ? (refundTarget.amountPaid || refundTarget.bookingPrice || 5000) : 5000" 
                placeholder="Enter refund amount" 
                style="width: 100%; font-family: monospace; font-size: 1rem; padding: 10px;"
              />
              <span style="font-size: 0.74rem; color: var(--stone); margin-top: 4px;">
                Enter custom refund. Maximum: ₹{{ refundTarget ? (refundTarget.amountPaid || refundTarget.bookingPrice || 5000).toLocaleString() : 0 }}
              </span>
            </div>
          </div>
        </div>
        <div class="ts-modal-footer" style="background: var(--snow); border-top: 1px solid rgba(26,46,26,0.09);">
          <button class="btn-ghost" @click="closeRefundModal">Cancel</button>
          <button class="btn-primary-ts" style="background: var(--red); border-color: var(--red);" @click="submitRefund">Confirm Refund</button>
        </div>
      </div>
    </div>

    <!-- ════════ TOAST ════════ -->
    <transition name="toast">
      <div v-if="toast.show" class="ts-toast">{{ toast.msg }}</div>
    </transition>
</template>

<script>
import { adminDashComponent } from './adminDashProxy';

export default adminDashComponent('SAdminModals', {
  computed: {
    emailError() {
      if (!this.staffForm || !this.staffForm.email) return '';
      const email = this.staffForm.email.trim().toLowerCase();
      if (!email) return '';

      // Check for duplicates in staffList
      const isDuplicateStaff = this.staffList && this.staffList.some(s => 
        s.contact && s.contact.trim().toLowerCase() === email && 
        (!this.editingStaff || s.id !== this.editingStaff.id)
      );
      if (isDuplicateStaff) {
        return 'This email address is already assigned to a staff member.';
      }

      // Check for duplicates in users (trekkers)
      const isDuplicateUser = this.users && this.users.some(u => 
        u.email && u.email.trim().toLowerCase() === email
      );
      if (isDuplicateUser) {
        return 'This email address is already assigned to a trekker.';
      }

      return '';
    },
    phoneError() {
      if (!this.staffForm || !this.staffForm.phone) return '';
      const phone = this.staffForm.phone.trim();
      if (!phone) return '';

      // Check for duplicates in staffList
      const isDuplicateStaff = this.staffList && this.staffList.some(s => 
        s.phone && s.phone.trim() === phone && 
        (!this.editingStaff || s.id !== this.editingStaff.id)
      );
      if (isDuplicateStaff) {
        return 'This phone number is already assigned to a staff member.';
      }

      // Check for duplicates in users (trekkers)
      const isDuplicateUser = this.users && this.users.some(u => 
        u.phone && u.phone.trim() === phone
      );
      if (isDuplicateUser) {
        return 'This phone number is already assigned to a trekker.';
      }

      return '';
    }
  },
  methods: {
    saveStaff() {
      if (this.emailError) {
        this.showToast(this.emailError);
        return;
      }
      if (this.phoneError) {
        this.showToast(this.phoneError);
        return;
      }
      this.adminDash.saveStaff();
    }
  }
});
</script>
