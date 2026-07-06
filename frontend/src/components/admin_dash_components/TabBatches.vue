<template>
      <section v-if="activeTab==='batches'" class="tab-content">
        <div class="route-filters-bar" style="display:flex; flex-wrap:wrap; gap:1rem; margin-bottom:1.25rem; background:var(--snow); padding:1rem 1.15rem; border-radius:8px; border:1px solid var(--stone-light); align-items:flex-end;">
          <div class="filter-group" style="display:flex; flex-direction:column; gap:4px; flex:1 1 160px; min-width:160px;">
            <label style="font-size:0.72rem; font-weight:600; color:var(--forest-mid);">GUIDE</label>
            <div class="custom-select-wrapper" :class="{ 'is-open': showBatchGuideDropdown }">
              <div class="custom-select-trigger" @click.stop="showBatchGuideDropdown = !showBatchGuideDropdown" style="padding:6px 12px; font-size:0.84rem; border-radius:4px; background:white; border:1px solid var(--stone);">
                <span>{{ batchGuideFilter }}</span>
                <svg viewBox="0 0 24 24" class="custom-select-arrow" :class="{ open: showBatchGuideDropdown }"><polyline points="6 9 12 15 18 9"/></svg>
              </div>
              <div v-if="showBatchGuideDropdown" class="custom-select-dropdown" style="top:100%; margin-top:4px; z-index:1050;">
                <div class="custom-select-options" style="max-height:200px; overflow-y:auto;">
                  <div v-for="opt in ['All','Assigned','Unassigned']" :key="opt" class="custom-select-option" :class="{ selected: batchGuideFilter === opt }" @click="batchGuideFilter = opt; showBatchGuideDropdown = false;">
                    <span class="option-name">{{ opt }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="filter-group" style="display:flex; flex-direction:column; gap:4px; flex:1 1 160px; min-width:160px;">
            <label style="font-size:0.72rem; font-weight:600; color:var(--forest-mid);">DATE</label>
            <div class="custom-select-wrapper" :class="{ 'is-open': showBatchDateDropdown }">
              <div class="custom-select-trigger" @click.stop="showBatchDateDropdown = !showBatchDateDropdown" style="padding:6px 12px; font-size:0.84rem; border-radius:4px; background:white; border:1px solid var(--stone);">
                <span>{{ batchDateFilter }}</span>
                <svg viewBox="0 0 24 24" class="custom-select-arrow" :class="{ open: showBatchDateDropdown }"><polyline points="6 9 12 15 18 9"/></svg>
              </div>
              <div v-if="showBatchDateDropdown" class="custom-select-dropdown" style="top:100%; margin-top:4px; z-index:1050;">
                <div class="custom-select-options" style="max-height:200px; overflow-y:auto;">
                  <div v-for="opt in ['All','Upcoming','This Week','This Month']" :key="opt" class="custom-select-option" :class="{ selected: batchDateFilter === opt }" @click="batchDateFilter = opt; showBatchDateDropdown = false;">
                    <span class="option-name">{{ opt }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="filter-group" style="display:flex; flex-direction:column; gap:4px; flex:1 1 180px; min-width:180px;">
            <label style="font-size:0.72rem; font-weight:600; color:var(--forest-mid);">SORT BY OCCUPANCY</label>
            <div class="custom-select-wrapper" :class="{ 'is-open': showBatchSortDropdown }">
              <div class="custom-select-trigger" @click.stop="showBatchSortDropdown = !showBatchSortDropdown" style="padding:6px 12px; font-size:0.84rem; border-radius:4px; background:white; border:1px solid var(--stone);">
                <span>{{ batchSortFilter }}</span>
                <svg viewBox="0 0 24 24" class="custom-select-arrow" :class="{ open: showBatchSortDropdown }"><polyline points="6 9 12 15 18 9"/></svg>
              </div>
              <div v-if="showBatchSortDropdown" class="custom-select-dropdown" style="top:100%; margin-top:4px; z-index:1050;">
                <div class="custom-select-options" style="max-height:200px; overflow-y:auto;">
                  <div v-for="opt in ['Default','High Occupancy','Low Occupancy']" :key="opt" class="custom-select-option" :class="{ selected: batchSortFilter === opt }" @click="batchSortFilter = opt; showBatchSortDropdown = false;">
                    <span class="option-name">{{ opt }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="ts-table-wrap">
          <table class="ts-table">
            <thead>
              <tr>
                <th>Batch ID</th>
                <th class="col-hide-mobile">Trek Name</th>
                <th class="col-hide-mobile">Difficulty</th>
                <th class="col-hide-mobile">Dates</th>
                <th class="col-hide-mobile">Slots</th>
                <th>Staff</th>
                <th class="col-hide-mobile">Price</th>
                <th class="col-hide-mobile">Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="t in filteredTreks" :key="t.id">
                <td class="mono font-bold">
                  {{ t.batchCode }}
                  <div style="font-size: 0.68rem; font-weight: 400; color: var(--stone); margin-top: 2px;">{{ formatDate(t.startDate) }}</div>
                </td>
                <td class="trek-name-cell col-hide-mobile">{{ t.name }}</td>
                <td class="col-hide-mobile"><span :class="'diff-pill pill-'+t.difficulty.toLowerCase()">{{ t.difficulty }}</span></td>
                <td class="mono col-hide-mobile" style="white-space:nowrap">{{ formatDate(t.startDate) }} → {{ formatDate(t.endDate) }}</td>
                <td class="mono col-hide-mobile">{{ t.booked }}/{{ t.slots }}</td>
                <td>{{ t.staff || '—' }}</td>
                <td class="mono col-hide-mobile">₹{{ t.price ? t.price.toLocaleString() : '—' }}</td>
                <td class="col-hide-mobile"><span :class="'status-pill status-'+t.status.toLowerCase()">{{ t.status }}</span></td>
                <td>
                  <div class="batch-actions-layout">
                    <div class="batch-actions-row">
                      <button class="act-btn act-view" @click="viewBatchDetails(t)" title="View Details">
                        <svg viewBox="0 0 24 24" class="act-btn-icon" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                        <span class="btn-text-hide-mobile">View Details</span>
                      </button>
                      <button class="act-btn act-assign" @click="assignStaffToTrek(t)" title="Assign Guide">
                        <svg viewBox="0 0 24 24" class="act-btn-icon"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></svg>
                        <span class="btn-text-hide-mobile">{{ (t.staff && !t.staff.toLowerCase().includes('unassigned') && !t.staff.toLowerCase().includes('not assigned')) ? 'Change Guide' : 'Assign Guide' }}</span>
                      </button>
                    </div>
                    <div class="batch-actions-row">
                      <button class="act-btn act-edit" @click="openTrekModal(t)" title="Edit">
                        <svg viewBox="0 0 24 24" class="act-btn-icon"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
                        <span class="btn-text-hide-mobile">Edit</span>
                      </button>
                      <button class="act-btn act-delete-btn" @click="deleteTrek(t.id)" title="Delete">
                        <svg viewBox="0 0 24 24" class="act-btn-icon"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
                        <span class="btn-text-hide-mobile">Delete</span>
                      </button>
                    </div>
                    <div class="batch-actions-row" v-if="t.status !== 'Completed'">
                      <button class="act-btn act-complete" @click="completeBatch(t)" title="Complete">
                        <svg viewBox="0 0 24 24" class="act-btn-icon" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                        <span class="btn-text-hide-mobile">Mark as Completed</span>
                      </button>
                    </div>
                  </div>
                </td>
              </tr>
              <tr v-if="!filteredTreks.length">
                <td colspan="10" style="text-align:center; padding:2rem; color:var(--stone)">No batches match this filter.</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- ════════ SCHEDULE NEW BATCH / EDIT BATCH MODAL (Extracted from SAdminModals) ════════ -->
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
                        <strong>{{ t.userName || t.name }}</strong> <span style="color: #718096; font-size: 0.78rem;">[{{ t.memberId }}]</span>
                        <div style="font-size: 0.78rem; color: #a0aec0;">{{ t.userEmail || t.email }}</div>
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

        <!-- ════════ ASSIGN GUIDE TO BATCH MODAL (Extracted from SAdminModals) ════════ -->
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

        <!-- ════════ BATCH DETAILS MODAL (Extracted from SAdminModals) ════════ -->
        <div v-if="showBatchDetailsModal && selectedBatchDetails" class="ts-modal-overlay" @click.self="closeBatchDetails">
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
                            <div v-if="user.bookingId" class="mono" style="font-size:0.65rem; color:var(--stone); margin-top:2px;">
                              ID: {{ user.bookingId }}
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

      </section>
</template>

<script>
/**
 * =========================================================================
 * TabBatches.vue
 * =========================================================================
 * Scheduled Trek Batch manager — handles CRUD for dated batch schedules,
 * guide-to-batch assignment, trekker registration management, and batch
 * status toggling (Open / Closed / Completed).
 *
 * This component uses Vue 3 Options API with local state for modal/form
 * management and injects `adminDash` from the root `AdminDashboard.vue`
 * coordinator to read shared lists (trekRoutes, staffList, users, allBookings)
 * and trigger coordinator-level side-effects (loadData, showToast, triggerConfirm).
 *
 * Key Sections:
 * - Computed: filteredTreks, batch filtering/sorting, route/staff search helpers
 * - Methods: Trek batch CRUD (openTrekModal, saveTrek, deleteTrek)
 * - Methods: Guide assignment (assignStaffToTrek, saveAssignGuide)
 * - Methods: Trekker management (addTrekkerToBatch, removeTrekkerFromBatch)
 * - Methods: Batch details view (viewBatchDetails, completeBatch)
 */
export default {
  name: 'TabBatches',
  inject: ['adminDash'],
  data() {
    return {
      // Filter dropdown visibility
      showBatchGuideDropdown: false,
      showBatchDateDropdown: false,
      showBatchSortDropdown: false,

      // Filter settings
      batchGuideFilter: 'All',
      batchDateFilter: 'All',
      batchSortFilter: 'Default',
      trekFilter: 'All',

      // Modals visibility
      showTrekModal: false,
      showAssignModal: false,
      showBatchDetailsModal: false,
      showRouteDropdown: false,
      showStaffDropdown: false,
      showAssignStaffDropdown: false,
      showTrekSearch: false,

      // Modals form states
      trekForm: {
        name: '',
        location: '',
        difficulty: 'Moderate',
        startDate: '',
        endDate: '',
        slots: 20,
        price: 5000,
        status: 'Open',
        imageUrl: '',
        description: '',
        trekRouteId: null,
        staff_id: null
      },
      editingTrek: null,
      assignTrekObj: null,
      tempStaffId: null,
      selectedAssignStaffName: '',
      selectedBatchDetails: null,
      batchTrekkers: [],
      trekSearchQuery: '',
      trekkerManageMode: '',
      routeSearchQuery: '',
      staffSearchQuery: ''
    };
  },

  watch: {
    showTrekModal(val) {
      if (!val) {
        this.editingTrek = null;
      }
      if (this.adminDash.showTrekModal !== val) {
        this.adminDash.showTrekModal = val;
      }
    },
    'adminDash.showTrekModal': {
      handler(newVal) {
        if (this.showTrekModal !== newVal) {
          this.showTrekModal = newVal;
        }
      },
      immediate: true
    },
    'adminDash.editingTrek': {
      handler(newVal) {
        this.editingTrek = newVal;
        if (newVal) {
          this.trekForm = { ...newVal };
        } else {
          this.trekForm = { name:'', location:'', difficulty:'Moderate', startDate:'', endDate:'', slots:20, price:5000, status:'Open', imageUrl:'', description:'' };
        }
      },
      immediate: true
    },
    'trekForm.startDate'() {
      this.calculateEndDate();
    },
    'trekForm.trekRouteId'() {
      this.calculateEndDate();
    }
  },

  computed: {
    // Injected parent fields
    activeTab() {
      return this.adminDash.activeTab;
    },
    trekRoutes() {
      return this.adminDash.trekRoutes;
    },
    staffList() {
      return this.adminDash.staffList;
    },
    users() {
      return this.adminDash.users;
    },
    allBookings() {
      return this.adminDash.allBookings;
    },

    // Selected Route Info
    selectedRouteName() {
      const routes = this.adminDash.trekRoutes || [];
      const route = routes.find(r => r.id !== undefined && this.trekForm.trekRouteId !== undefined && Number(r.id) === Number(this.trekForm.trekRouteId));
      return route ? `[${route.trekCode}] ${route.name} (${route.location})` : '';
    },
    selectedRouteDuration() {
      const routes = this.adminDash.trekRoutes || [];
      const route = routes.find(r => r.id !== undefined && this.trekForm.trekRouteId !== undefined && Number(r.id) === Number(this.trekForm.trekRouteId));
      return route ? route.duration : 0;
    },
    selectedStaffName() {
      const staffList = this.adminDash.staffList || [];
      const s = staffList.find(x => x.id === this.trekForm.staff_id);
      return s ? `${s.name} (${s.contact})` : 'No Staff Assigned';
    },

    // Search and selection helpers
    matchingActiveRoutes() {
      const routes = this.adminDash.trekRoutes || [];
      return routes.filter(r =>
        r.active &&
        (r.name.toLowerCase().includes(this.routeSearchQuery.toLowerCase()) ||
         r.trekCode.toLowerCase().includes(this.routeSearchQuery.toLowerCase()))
      );
    },
    matchingStaff() {
      const staffList = this.adminDash.staffList || [];
      return staffList.filter(s =>
        s.name.toLowerCase().includes(this.staffSearchQuery.toLowerCase()) ||
        s.contact.toLowerCase().includes(this.staffSearchQuery.toLowerCase())
      );
    },
    matchingTrekkerSearchResults() {
      const q = this.trekSearchQuery.toLowerCase().trim();
      if (!q) return [];
      const usersList = this.adminDash.users || [];
      const registeredIds = new Set(this.batchTrekkers.map(t => t.userId));
      return usersList.filter(u =>
        !u.blacklisted &&
        u.role === 'user' &&
        !registeredIds.has(u.id) &&
        (u.name.toLowerCase().includes(q) ||
         u.email.toLowerCase().includes(q) ||
         (u.memberId && u.memberId.toLowerCase().includes(q)) ||
         String(u.id).includes(q))
      );
    },
    matchingBatchTrekkers() {
      const q = this.trekSearchQuery.toLowerCase().trim();
      if (!q) return this.batchTrekkers;
      return this.batchTrekkers.filter(t =>
        (t.userName && t.userName.toLowerCase().includes(q)) ||
        (t.userEmail && t.userEmail.toLowerCase().includes(q)) ||
        (t.memberId && t.memberId.toLowerCase().includes(q)) ||
        String(t.userId).includes(q)
      );
    },

    // Filtered Batch List
    filteredTreks() {
      const todayStr = new Date().toLocaleDateString('en-CA');
      const today = new Date();
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - today.getDay());
      const endOfWeek = new Date(today);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

      const treksList = this.adminDash.treks || [];
      let activeTreks = treksList.filter(t => t.status !== 'Completed' && (!t.endDate || t.endDate >= todayStr));

      if (this.batchGuideFilter === 'Assigned') {
        activeTreks = activeTreks.filter(t => t.staff && !String(t.staff).toLowerCase().includes('unassigned') && !String(t.staff).toLowerCase().includes('not assigned'));
      } else if (this.batchGuideFilter === 'Unassigned') {
        activeTreks = activeTreks.filter(t => !t.staff || String(t.staff).toLowerCase().includes('unassigned') || String(t.staff).toLowerCase().includes('not assigned'));
      }

      if (this.batchDateFilter === 'Upcoming') {
        activeTreks = activeTreks.filter(t => t.startDate && new Date(t.startDate) >= today);
      } else if (this.batchDateFilter === 'This Week') {
        activeTreks = activeTreks.filter(t => {
          const d = t.startDate ? new Date(t.startDate) : null;
          return d && d >= startOfWeek && d <= endOfWeek;
        });
      } else if (this.batchDateFilter === 'This Month') {
        activeTreks = activeTreks.filter(t => {
          const d = t.startDate ? new Date(t.startDate) : null;
          return d && d >= startOfMonth && d <= endOfMonth;
        });
      }

      let list = this.trekFilter === 'All'
        ? activeTreks
        : activeTreks.filter(t => t.status === this.trekFilter);

      if (this.adminDash.searchQuery) {
        const q = this.adminDash.searchQuery.toLowerCase();
        list = list.filter(t =>
          (t.name && t.name.toLowerCase().includes(q)) ||
          (t.location && t.location.toLowerCase().includes(q)) ||
          (t.batchCode && t.batchCode.toLowerCase().includes(q))
        );
      }

      if (this.batchSortFilter === 'High Occupancy') {
        list = [...list].sort((a, b) => {
          const aPct = a.slots ? (a.booked || 0) / a.slots : 0;
          const bPct = b.slots ? (b.booked || 0) / b.slots : 0;
          return bPct - aPct;
        });
      } else if (this.batchSortFilter === 'Low Occupancy') {
        list = [...list].sort((a, b) => {
          const aPct = a.slots ? (a.booked || 0) / a.slots : 0;
          const bPct = b.slots ? (b.booked || 0) / b.slots : 0;
          return aPct - bPct;
        });
      }

      return list;
    }
  },

  methods: {
    // Format Date string
    formatDate(dateStr) {
      if (!dateStr) return '—';
      const parts = dateStr.split(' ');
      const datePart = parts[0];
      const dateParts = datePart.split('-');
      if (dateParts.length === 3) {
        const year = dateParts[0];
        const month = dateParts[1];
        const day = dateParts[2];
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const mIdx = parseInt(month, 10) - 1;
        if (mIdx >= 0 && mIdx < 12) {
          return `${day} ${months[mIdx]} ${year}`;
        }
      }
      return datePart;
    },

    // ── Date Auto Calculation ──
    calculateEndDate() {
      const duration = this.selectedRouteDuration;
      const start = this.trekForm.startDate;
      if (start && duration > 0) {
        const dateObj = new Date(start);
        dateObj.setDate(dateObj.getDate() + duration);
        const y = dateObj.getFullYear();
        const m = String(dateObj.getMonth() + 1).padStart(2, '0');
        const d = String(dateObj.getDate()).padStart(2, '0');
        this.trekForm.endDate = `${y}-${m}-${d}`;
      }
    },

    // ── Batch Modal actions ──
    openTrekModal(trek = null) {
      this.editingTrek = trek;
      this.routeSearchQuery = '';
      this.staffSearchQuery = '';
      this.showRouteDropdown = false;
      this.showStaffDropdown = false;
      this.showTrekSearch = false;
      this.trekSearchQuery = '';

      if (trek) {
        this.trekForm = {
          name: trek.name,
          location: trek.location,
          difficulty: trek.difficulty,
          startDate: trek.startDate,
          endDate: trek.endDate,
          slots: trek.slots || trek.totalSlots || 20,
          price: trek.price || 5000,
          status: trek.status || 'Open',
          imageUrl: trek.imageUrl || '',
          description: trek.description || '',
          trekRouteId: trek.trekRouteId || null,
          staff_id: trek.staff_id || null,
          batchCode: trek.batchCode
        };
        this.fetchBatchTrekkers(trek.id);
      } else {
        this.trekForm = {
          name: '',
          location: '',
          difficulty: 'Moderate',
          startDate: '',
          endDate: '',
          slots: 20,
          price: 5000,
          status: 'Open',
          imageUrl: '',
          description: '',
          trekRouteId: null,
          staff_id: null
        };
        this.batchTrekkers = [];
      }
      this.showTrekModal = true;
    },
    closeTrekModal() {
      this.showTrekModal = false;
      this.editingTrek = null;
    },

    // ── CRUD Actions ──
    async saveTrek() {
      if (!this.editingTrek && !this.trekForm.trekRouteId) {
        this.adminDash.showToast('Please select a Trek Route.');
        return;
      }
      if (!this.trekForm.startDate || !this.trekForm.endDate) {
        this.adminDash.showToast('Start date and End date are required.');
        return;
      }
      if (this.trekForm.slots === '' || this.trekForm.slots === null || this.trekForm.slots <= 0) {
        this.adminDash.showToast('Available slots must be a positive integer.');
        return;
      }
      if (this.trekForm.price === '' || this.trekForm.price === null || this.trekForm.price < 0) {
        this.adminDash.showToast('Price must be a positive number.');
        return;
      }
      if (new Date(this.trekForm.startDate) >= new Date(this.trekForm.endDate)) {
        this.adminDash.showToast('Start date must be before End date.');
        return;
      }

      try {
        const payload = this.editingTrek ? { id: this.editingTrek.id, ...this.trekForm } : { ...this.trekForm };
        const res = await fetch('/api/admin/treks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (res.ok) {
          this.adminDash.showToast(this.editingTrek ? 'Trek updated' : 'Trek created');
          this.adminDash.loadData();
          this.closeTrekModal();
        } else {
          const errData = await res.json();
          this.adminDash.showToast(errData.error || 'Failed to save trek');
        }
      } catch (_) {
        const tList = this.adminDash.treks;
        if (this.editingTrek) {
          const idx = tList.findIndex(x => x.id === this.editingTrek.id);
          if (idx !== -1) {
            tList[idx] = { ...tList[idx], ...this.trekForm };
          }
          this.adminDash.showToast('Trek updated (offline)');
        } else {
          const newId = tList.length ? Math.max(...tList.map(x => x.id)) + 1 : 1;
          tList.push({
            id: newId,
            batchCode: `TS-B${String(newId).padStart(3, '0')}`,
            name: this.trekForm.name || 'Mock Trek',
            location: this.trekForm.location || 'India',
            difficulty: this.trekForm.difficulty || 'Moderate',
            startDate: this.trekForm.startDate,
            endDate: this.trekForm.endDate,
            slots: Number(this.trekForm.slots || 20),
            booked: 0,
            status: this.trekForm.status || 'Open',
            staff: this.trekForm.staff_id ? (this.adminDash.staffList.find(s => s.id === this.trekForm.staff_id)?.name || 'Unassigned') : 'Unassigned',
            price: Number(this.trekForm.price || 5000),
            imageUrl: this.trekForm.imageUrl || '',
            description: this.trekForm.description || ''
          });
          this.adminDash.showToast('Trek scheduled (offline)');
        }
        this.closeTrekModal();
      }
    },
    deleteTrek(id) {
      this.adminDash.triggerConfirm(
        'Confirm Deletion',
        'Are you sure you want to remove this trek batch? This action cannot be undone.',
        'Delete',
        async () => {
          try {
            const res = await fetch(`/api/admin/treks/${id}`, { method: 'DELETE' });
            if (res.ok) {
              this.adminDash.showToast('Trek removed');
              this.adminDash.loadData();
            } else {
              this.adminDash.showToast('Failed to remove trek');
            }
          } catch (_) {
            this.adminDash.showToast('Failed to remove trek (error)');
          }
        }
      );
    },
    async toggleBatchStatus(trek) {
      try {
        const res = await fetch(`/api/admin/batches/toggle/${trek.id}`, { method: 'POST' });
        if (res.ok) {
          const d = await res.json();
          trek.status = d.active ? 'Open' : 'Closed';
          this.adminDash.showToast(`Batch ${d.active ? 'opened' : 'closed'}`);
          this.adminDash.loadData();
        } else {
          const err = await res.json();
          this.adminDash.showToast(err.error || 'Failed to toggle batch status');
        }
      } catch (_) {
        this.adminDash.showToast('Failed to toggle batch status');
      }
    },
    completeBatch(trek) {
      this.adminDash.triggerConfirm(
        'Mark as Completed',
        `Are you sure you want to mark batch '${trek.name}' (${trek.batchCode}) as Completed? This will also update the status of all active bookings for this batch to Completed.`,
        'Mark Completed',
        async () => {
          try {
            const res = await fetch(`/api/admin/batches/${trek.id}/complete`, { method: 'POST' });
            if (res.ok) {
              const data = await res.json();
              this.adminDash.showToast(data.message || 'Batch completed successfully');
              this.adminDash.loadData();
            } else {
              const err = await res.json();
              this.adminDash.showToast(err.error || 'Failed to complete batch');
            }
          } catch (_) {
            this.adminDash.showToast('Failed to complete batch (error)');
          }
        }
      );
    },

    // ── Batch Details ──
    viewBatchDetails(batch) {
      const allBookings = this.adminDash.allBookings || [];
      const usersList = this.adminDash.users || [];
      const bookings = allBookings.filter(bk => Number(bk.trekId) === Number(batch.id) && bk.status === 'Booked');
      this.selectedBatchDetails = {
        batch: batch,
        bookings: bookings.map(bk => {
          const userObj = usersList.find(usr => Number(usr.id) === Number(bk.userId));
          return {
            id: bk.id,
            userId: bk.userId,
            memberId: userObj ? userObj.memberId : ('TS26T' + bk.userId),
            userName: userObj ? userObj.name : bk.user,
            userEmail: userObj ? userObj.email : '—',
            userPhone: userObj ? userObj.phone : '—',
            userCity: userObj ? userObj.city : '—',
            bookedOn: bk.date,
            paid: bk.paid,
            transactionId: bk.transactionId,
            bookingId: bk.bookingId || ('BK' + bk.id)
          };
        })
      };
      this.showBatchDetailsModal = true;
    },
    closeBatchDetails() {
      this.showBatchDetailsModal = false;
      this.selectedBatchDetails = null;
    },

    // ── Guide Assignment ──
    assignStaffToTrek(trek) {
      this.assignTrekObj = trek;
      this.staffSearchQuery = '';
      this.showAssignStaffDropdown = false;
      const staffList = this.adminDash.staffList || [];
      const currentStaff = staffList.find(s => s.name === trek.staff);
      if (currentStaff) {
        this.tempStaffId = currentStaff.id;
        this.selectedAssignStaffName = currentStaff.name;
      } else {
        this.tempStaffId = null;
        this.selectedAssignStaffName = 'No Staff Assigned';
      }
      this.showAssignModal = true;
    },
    closeAssignModal() {
      this.showAssignModal = false;
      this.assignTrekObj = null;
      this.tempStaffId = null;
      this.selectedAssignStaffName = '';
      this.showAssignStaffDropdown = false;
      this.staffSearchQuery = '';
    },
    selectStaffForAssign(s) {
      if (s === null) {
        this.tempStaffId = null;
        this.selectedAssignStaffName = 'No Staff Assigned';
      } else {
        this.tempStaffId = s.id;
        this.selectedAssignStaffName = s.name;
      }
      this.showAssignStaffDropdown = false;
    },
    async saveAssignGuide() {
      if (!this.assignTrekObj) return;
      const trek = this.assignTrekObj;
      const staffList = this.adminDash.staffList || [];
      const s = staffList.find(x => x.id === this.tempStaffId);
      const email = s ? s.contact : null;
      try {
        const res = await fetch(`/api/admin/treks/assign/${trek.id}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email })
        });
        if (res.ok) {
          this.adminDash.showToast(email ? `Staff guide assigned to ${trek.name}` : `Staff guide removed from ${trek.name}`);
          this.adminDash.loadData();
          this.closeAssignModal();
        } else {
          this.adminDash.showToast('Failed to assign guide');
        }
      } catch (_) {
        this.adminDash.showToast('Failed to assign guide (error)');
      }
    },

    // ── Batch Trekkers CRUD ──
    async fetchBatchTrekkers(trekId) {
      try {
        const res = await fetch(`/api/admin/batches/${trekId}/trekkers`);
        if (res.ok) {
          const d = await res.json();
          this.batchTrekkers = d.trekkers || [];
        }
      } catch (e) {
        console.error("Error fetching batch trekkers:", e);
      }
    },
    async addTrekkerToBatch(user) {
      try {
        const res = await fetch('/api/admin/batches/add_trekker', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ trek_id: this.editingTrek.id, user_id: user.id })
        });
        const d = await res.json();
        if (res.ok) {
          this.adminDash.showToast(d.message || 'Trekker added successfully.');
          this.fetchBatchTrekkers(this.editingTrek.id);
          this.adminDash.loadData();
          this.trekSearchQuery = '';
          this.showTrekSearch = false;
        } else {
          this.adminDash.showToast(d.error || 'Failed to add trekker.');
        }
      } catch (e) {
        this.adminDash.showToast('Error adding trekker.');
      }
    },
    async removeTrekkerFromBatch(user) {
      try {
        const res = await fetch('/api/admin/batches/remove_trekker', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ trek_id: this.editingTrek.id, user_id: user.userId })
        });
        const d = await res.json();
        if (res.ok) {
          this.adminDash.showToast(d.message || 'Trekker removed successfully.');
          this.fetchBatchTrekkers(this.editingTrek.id);
          this.adminDash.loadData();
          this.trekSearchQuery = '';
          this.showTrekSearch = false;
        } else {
          this.adminDash.showToast(d.error || 'Failed to remove trekker.');
        }
      } catch (e) {
        this.adminDash.showToast('Error removing trekker.');
      }
    },

    // ── Form Option Selections ──
    selectRouteForBatch(r) {
      this.trekForm.trekRouteId = r.id;
      this.trekForm.name = r.name;
      this.trekForm.location = r.location;
      this.trekForm.difficulty = r.difficulty;
      this.showRouteDropdown = false;
      this.calculateEndDate();
    },
    selectStaffForBatch(s) {
      if (s === null) {
        this.trekForm.staff_id = null;
      } else {
        this.trekForm.staff_id = s.id;
      }
      this.showStaffDropdown = false;
    }
  }
};
</script>
