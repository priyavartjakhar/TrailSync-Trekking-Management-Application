<template>
      <section v-if="activeTab==='reports'" class="tab-content">
        <div class="reports-layout-grid">
          
          <!-- Left Column: Generated Reports Records -->
          <div class="dash-card">
            <div class="dash-card-header" style="margin-bottom: 1rem;">
              <div>
                <span class="dash-card-title">Records</span>
                <div style="font-size: 0.78rem; color: var(--stone); margin-top: 2px;">
                  History and logs of generated activity and performance reports
                </div>
              </div>
            </div>
            
            <div class="table-responsive" style="max-height: 550px; overflow-y: auto;">
              <table class="ts-table">
                <thead>
                  <tr>
                    <th>Report Name</th>
                    <th class="col-hide-mobile">Parameters</th>
                    <th class="col-hide-mobile">Generated At</th>
                    <th style="text-align: right;">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="r in reportsList" :key="r.id">
                    <td>
                      <div style="font-weight: 600; color: var(--forest);">{{ r.title }}</div>
                      <div class="category-tag tag-system" style="font-size: 0.68rem; margin-top: 4px; display: inline-block;">
                        {{ r.type.replace('_', ' ').toUpperCase() }}
                      </div>
                      <div class="col-show-mobile-only mono" style="font-size: 0.68rem; color: var(--stone); margin-top: 3px;">{{ r.generatedAt }}</div>
                    </td>
                    <td class="col-hide-mobile"><span class="mono" style="font-size: 0.78rem; color: var(--bark);">{{ r.parameters }}</span></td>
                    <td class="mono col-hide-mobile" style="font-size: 0.78rem; color: var(--stone);">{{ r.generatedAt }}</td>
                    <td style="text-align: right;">
                      <div class="report-actions-mobile" style="display: inline-flex; gap: 4px; flex-wrap: wrap; justify-content: flex-end;">
                        <button class="act-btn act-assign" @click="viewReport(r)" style="background: var(--cream); border-color: rgba(26,46,26,0.1); color: var(--forest);" title="View Report">
                          <svg viewBox="0 0 24 24" class="act-btn-icon"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                          <span class="btn-text-hide-mobile">View</span>
                        </button>
                        <button class="act-btn act-assign" @click="downloadReportHTML(r)" style="background: rgba(200, 146, 42, 0.08); border-color: rgba(200,146,42,0.2); color: var(--gold-dark);" title="Download HTML">
                          <svg viewBox="0 0 24 24" class="act-btn-icon" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
                          <span class="btn-text-hide-mobile">HTML</span>
                        </button>
                        <button class="act-btn act-assign" @click="downloadReportCSV(r)" title="Download CSV">
                          <svg viewBox="0 0 24 24" class="act-btn-icon" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
                          <span class="btn-text-hide-mobile">CSV</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          
          <!-- Right Column: Interactive Report Generator Tool -->
          <div class="dash-card" style="position: relative;">
            <div class="dash-card-header" style="margin-bottom: 1.25rem;">
              <div>
                <span class="dash-card-title">Report Generator Tool</span>
                <div style="font-size: 0.78rem; color: var(--stone); margin-top: 2px;">
                  Configure filters and parameters to compile custom reports
                </div>
              </div>
            </div>
            
            <div style="display: flex; flex-direction: column; gap: 1.25rem;">
              
              <!-- Report Type Selector -->
              <div>
                <label style="display: block; font-size: 0.82rem; font-weight: 700; color: var(--forest); margin-bottom: 0.4rem; text-transform: uppercase;">
                  Report Type
                </label>
                <div class="custom-select-wrapper" :class="{ 'is-open': showReportTypeDropdown }">
                  <div class="custom-select-trigger" @click.stop="toggleReportDropdown('showReportTypeDropdown')" style="padding: 10px 14px; font-size: 0.88rem; border-radius: 4px; background: white; border: 1px solid var(--stone); display: flex; justify-content: space-between; align-items: center;">
                    <span>{{ getReportTypeName(selectedReportType) }}</span>
                    <svg viewBox="0 0 24 24" class="custom-select-arrow" :class="{ open: showReportTypeDropdown }" style="width: 14px; height: 14px;"><polyline points="6 9 12 15 18 9"/></svg>
                  </div>
                  <div v-if="showReportTypeDropdown" class="custom-select-dropdown" style="top: 100%; margin-top: 4px; z-index: 1050; width: 100%;">
                    <div class="custom-select-options" style="max-height: 250px; overflow-y: auto;">
                      <div v-for="opt in reportTypeOptions" :key="opt.value" class="custom-select-option" :class="{ selected: selectedReportType === opt.value }" @click="selectedReportType = opt.value; showReportTypeDropdown = false; selectedReportBatch = '';">
                        <span class="option-name">{{ opt.label }}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <!-- Conditional Selectors: Month (For monthly_activity) -->
              <div v-if="selectedReportType === 'monthly_activity'">
                <label style="display: block; font-size: 0.82rem; font-weight: 700; color: var(--forest); margin-bottom: 0.4rem; text-transform: uppercase;">
                  Select Month
                </label>
                <div class="custom-select-wrapper" :class="{ 'is-open': showReportMonthDropdown }">
                  <div class="custom-select-trigger" @click.stop="toggleReportDropdown('showReportMonthDropdown')" style="padding: 10px 14px; font-size: 0.88rem; border-radius: 4px; background: white; border: 1px solid var(--stone); display: flex; justify-content: space-between; align-items: center;">
                    <span>{{ selectedReportMonth }}</span>
                    <svg viewBox="0 0 24 24" class="custom-select-arrow" :class="{ open: showReportMonthDropdown }" style="width: 14px; height: 14px;"><polyline points="6 9 12 15 18 9"/></svg>
                  </div>
                  <div v-if="showReportMonthDropdown" class="custom-select-dropdown" style="top: 100%; margin-top: 4px; z-index: 1050; width: 100%;">
                    <div class="custom-select-options" style="max-height: 200px; overflow-y: auto;">
                      <div v-for="m in ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']" :key="m" class="custom-select-option" :class="{ selected: selectedReportMonth === m }" @click="selectedReportMonth = m; showReportMonthDropdown = false;">
                        <span class="option-name">{{ m }}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <!-- Conditional Selectors: Trek Route + Subtype (For trek_route) -->
              <div v-if="selectedReportType === 'trek_route'" style="display: flex; flex-direction: column; gap: 1rem;">
                <div>
                  <label style="display: block; font-size: 0.82rem; font-weight: 700; color: var(--forest); margin-bottom: 0.4rem; text-transform: uppercase;">
                    Select Trek Route
                  </label>
                  <div class="custom-select-wrapper" :class="{ 'is-open': showReportTrekDropdown }">
                    <div class="custom-select-trigger" @click.stop="toggleReportDropdown('showReportTrekDropdown')" style="padding: 10px 14px; font-size: 0.88rem; border-radius: 4px; background: white; border: 1px solid var(--stone); display: flex; justify-content: space-between; align-items: center;">
                      <span>{{ selectedReportTrek || 'All Trek Routes' }}</span>
                      <svg viewBox="0 0 24 24" class="custom-select-arrow" :class="{ open: showReportTrekDropdown }" style="width: 14px; height: 14px;"><polyline points="6 9 12 15 18 9"/></svg>
                    </div>
                    <div v-if="showReportTrekDropdown" class="custom-select-dropdown" style="top: 100%; margin-top: 4px; z-index: 1050; width: 100%;">
                      <div class="custom-select-options" style="max-height: 200px; overflow-y: auto;">
                        <div class="custom-select-option" :class="{ selected: selectedReportTrek === '' }" @click="selectedReportTrek = ''; showReportTrekDropdown = false;">
                          <span class="option-name">All Trek Routes</span>
                        </div>
                        <div v-for="route in trekRoutes" :key="route.id" class="custom-select-option" :class="{ selected: selectedReportTrek === route.name }" @click="selectedReportTrek = route.name; showReportTrekDropdown = false;">
                          <span class="option-name">{{ route.name }}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div>
                  <label style="display: block; font-size: 0.82rem; font-weight: 700; color: var(--forest); margin-bottom: 0.4rem; text-transform: uppercase;">
                    Report Detail Aspect
                  </label>
                  <div class="custom-select-wrapper" :class="{ 'is-open': showReportTrekSubtypeDropdown }">
                    <div class="custom-select-trigger" @click.stop="toggleReportDropdown('showReportTrekSubtypeDropdown')" style="padding: 10px 14px; font-size: 0.88rem; border-radius: 4px; background: white; border: 1px solid var(--stone); display: flex; justify-content: space-between; align-items: center;">
                      <span>{{ getTrekSubtypeName(selectedReportTrekSubtype) }}</span>
                      <svg viewBox="0 0 24 24" class="custom-select-arrow" :class="{ open: showReportTrekSubtypeDropdown }" style="width: 14px; height: 14px;"><polyline points="6 9 12 15 18 9"/></svg>
                    </div>
                    <div v-if="showReportTrekSubtypeDropdown" class="custom-select-dropdown" style="top: 100%; margin-top: 4px; z-index: 1050; width: 100%;">
                      <div class="custom-select-options" style="max-height: 200px; overflow-y: auto;">
                        <div v-for="opt in trekSubtypeOptions" :key="opt.value" class="custom-select-option" :class="{ selected: selectedReportTrekSubtype === opt.value }" @click="selectedReportTrekSubtype = opt.value; showReportTrekSubtypeDropdown = false;">
                          <span class="option-name">{{ opt.label }}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <!-- Conditional Selectors: Batch (For batch_wise and batch_users) -->
              <div v-if="selectedReportType === 'batch_wise' || selectedReportType === 'batch_users'">
                <label style="display: block; font-size: 0.82rem; font-weight: 700; color: var(--forest); margin-bottom: 0.4rem; text-transform: uppercase;">
                  Select Trek Batch
                </label>
                <div class="custom-select-wrapper" :class="{ 'is-open': showReportBatchDropdown }">
                  <div class="custom-select-trigger" @click.stop="toggleReportDropdown('showReportBatchDropdown')" style="padding: 10px 14px; font-size: 0.88rem; border-radius: 4px; background: white; border: 1px solid var(--stone); display: flex; justify-content: space-between; align-items: center;">
                    <span v-if="selectedReportBatch">{{ selectedReportBatch }}</span>
                    <span v-else>{{ selectedReportType === 'batch_wise' ? 'All Batches' : '-- Choose Batch --' }}</span>
                    <svg viewBox="0 0 24 24" class="custom-select-arrow" :class="{ open: showReportBatchDropdown }" style="width: 14px; height: 14px;"><polyline points="6 9 12 15 18 9"/></svg>
                  </div>
                  <div v-if="showReportBatchDropdown" class="custom-select-dropdown" style="top: 100%; margin-top: 4px; z-index: 1050; width: 100%;">
                    <div class="custom-select-options" style="max-height: 200px; overflow-y: auto;">
                      <div v-if="selectedReportType === 'batch_wise'" class="custom-select-option" :class="{ selected: selectedReportBatch === '' }" @click="selectedReportBatch = ''; showReportBatchDropdown = false;">
                        <span class="option-name">All Batches</span>
                      </div>
                      <div v-for="t in treks" :key="t.id" class="custom-select-option" :class="{ selected: selectedReportBatch === (t.batchCode || 'TID' + String(t.id).padStart(3, '0') + 'B01') }" @click="selectedReportBatch = (t.batchCode || 'TID' + String(t.id).padStart(3, '0') + 'B01'); showReportBatchDropdown = false;">
                        <span class="option-name">{{ t.name }} - {{ t.batchCode || 'TID' + String(t.id).padStart(3, '0') + 'B01' }}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <!-- Conditional Selectors: User Aspect (For user_participation) -->
              <div v-if="selectedReportType === 'user_participation'">
                <label style="display: block; font-size: 0.82rem; font-weight: 700; color: var(--forest); margin-bottom: 0.4rem; text-transform: uppercase;">
                  Report Detail Aspect
                </label>
                <div class="custom-select-wrapper" :class="{ 'is-open': showReportUserSubtypeDropdown }">
                  <div class="custom-select-trigger" @click.stop="toggleReportDropdown('showReportUserSubtypeDropdown')" style="padding: 10px 14px; font-size: 0.88rem; border-radius: 4px; background: white; border: 1px solid var(--stone); display: flex; justify-content: space-between; align-items: center;">
                    <span>{{ getUserSubtypeName(selectedReportUserSubtype) }}</span>
                    <svg viewBox="0 0 24 24" class="custom-select-arrow" :class="{ open: showReportUserSubtypeDropdown }" style="width: 14px; height: 14px;"><polyline points="6 9 12 15 18 9"/></svg>
                  </div>
                  <div v-if="showReportUserSubtypeDropdown" class="custom-select-dropdown" style="top: 100%; margin-top: 4px; z-index: 1050; width: 100%;">
                    <div class="custom-select-options" style="max-height: 200px; overflow-y: auto;">
                      <div v-for="opt in userSubtypeOptions" :key="opt.value" class="custom-select-option" :class="{ selected: selectedReportUserSubtype === opt.value }" @click="selectedReportUserSubtype = opt.value; showReportUserSubtypeDropdown = false;">
                        <span class="option-name">{{ opt.label }}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <!-- Conditional Selectors: Staff Aspect (For staff_performance) -->
              <div v-if="selectedReportType === 'staff_performance'">
                <label style="display: block; font-size: 0.82rem; font-weight: 700; color: var(--forest); margin-bottom: 0.4rem; text-transform: uppercase;">
                  Report Detail Aspect
                </label>
                <div class="custom-select-wrapper" :class="{ 'is-open': showReportStaffSubtypeDropdown }">
                  <div class="custom-select-trigger" @click.stop="toggleReportDropdown('showReportStaffSubtypeDropdown')" style="padding: 10px 14px; font-size: 0.88rem; border-radius: 4px; background: white; border: 1px solid var(--stone); display: flex; justify-content: space-between; align-items: center;">
                    <span>{{ getStaffSubtypeName(selectedReportStaffSubtype) }}</span>
                    <svg viewBox="0 0 24 24" class="custom-select-arrow" :class="{ open: showReportStaffSubtypeDropdown }" style="width: 14px; height: 14px;"><polyline points="6 9 12 15 18 9"/></svg>
                  </div>
                  <div v-if="showReportStaffSubtypeDropdown" class="custom-select-dropdown" style="top: 100%; margin-top: 4px; z-index: 1050; width: 100%;">
                    <div class="custom-select-options" style="max-height: 200px; overflow-y: auto;">
                      <div v-for="opt in staffSubtypeOptions" :key="opt.value" class="custom-select-option" :class="{ selected: selectedReportStaffSubtype === opt.value }" @click="selectedReportStaffSubtype = opt.value; showReportStaffSubtypeDropdown = false;">
                        <span class="option-name">{{ opt.label }}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <!-- Date Range Filters -->
              <div v-if="['trek_route', 'all_treks_combined', 'batch_wise', 'batch_users', 'user_participation'].includes(selectedReportType)" style="display: flex; gap: 0.75rem;">
                <div style="flex: 1;">
                  <label style="display: block; font-size: 0.8rem; font-weight: 700; color: var(--forest); margin-bottom: 0.3rem; text-transform: uppercase;">
                    Start Date
                  </label>
                  <input type="date" v-model="reportStartDate" class="ts-input" style="width: 100%; padding: 0.45rem 0.75rem;" />
                </div>
                <div style="flex: 1;">
                  <label style="display: block; font-size: 0.8rem; font-weight: 700; color: var(--forest); margin-bottom: 0.3rem; text-transform: uppercase;">
                    End Date
                  </label>
                  <input type="date" v-model="reportEndDate" class="ts-input" style="width: 100%; padding: 0.45rem 0.75rem;" />
                </div>
              </div>
              
              <!-- Action Buttons -->
              <div style="display: flex; gap: 0.75rem; margin-top: 1rem; border-top: 1px solid rgba(26,46,26,0.08); padding-top: 1.25rem;">
                <button class="btn-primary-ts" @click="previewCurrentReport()" style="flex: 1; background: var(--cream); border-color: rgba(26,46,26,0.12); color: var(--forest);">
                  Preview Report
                </button>
                <button class="btn-primary-ts" @click="generateReport()" style="flex: 1; background: var(--forest); border-color: var(--forest); color: #fff;">
                  Generate & Save
                </button>
              </div>
              
            </div>
          </div>
          
        </div>

        <!-- ════════ REPORT PREVIEW MODAL (Extracted from SAdminModals) ════════ -->
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

      </section>
</template>

<script>
/**
 * =========================================================================
 * TabReports.vue
 * =========================================================================
 * Reports Center — allows admin to select report type (Monthly Activity,
 * Trek Route, Batch-wise, User Participation, Staff Performance), configure
 * parameters (date range, trek, batch, user, staff), then generate, preview
 * in an iframe, and download reports as HTML or CSV.
 *
 * This component is fully self-contained with its own local data, computed
 * helpers, and methods. It injects `adminDash` only for read-only access to
 * shared lists (treks, trekRoutes, users, staffList, allBookings).
 *
 * Key Sections:
 * - data: Local form state, dropdown toggles, report list, preview state
 * - Computed: Drop-down option labels, staff leaderboard, injected parent fields
 * - Methods: compileReport() — builds rows from shared data by report type
 * - Methods: generateReport() — saves to reportsList
 * - Methods: previewCurrentReport() / viewReport() — renders HTML iframe
 * - Methods: downloadReportHTML() / downloadReportCSV() — triggers file download
 */
export default {
  name: 'TabReports',
  inject: ['adminDash'],
  data() {
    return {
      // Configuration states
      selectedReportType: 'trek_route',
      selectedReportMonth: 'Jul',
      selectedReportTrek: '',
      selectedReportTrekSubtype: 'summary',
      selectedReportBatch: '',
      selectedReportUserSubtype: 'active',
      selectedReportStaffSubtype: 'performance',
      reportStartDate: '',
      reportEndDate: '',

      // Dropdowns toggles
      showReportTypeDropdown: false,
      showReportMonthDropdown: false,
      showReportTrekDropdown: false,
      showReportTrekSubtypeDropdown: false,
      showReportBatchDropdown: false,
      showReportUserSubtypeDropdown: false,
      showReportStaffSubtypeDropdown: false,

      // Preview modal
      showReportPreviewModal: false,
      reportPreviewData: null,
      iframeSrcDoc: '',

      // Constant Option configurations
      reportTypeOptions: [
        { value: 'monthly_activity', label: 'Monthly Activity Report' },
        { value: 'trek_route', label: 'Trek Route Wise' },
        { value: 'all_treks_combined', label: 'All Treks Combined Performance' },
        { value: 'batch_wise', label: 'Batch Wise Performance' },
        { value: 'batch_users', label: 'Batch Participant List' },
        { value: 'user_participation', label: 'User Participation & Trends' },
        { value: 'staff_performance', label: 'Staff Performance & Log' }
      ],
      trekSubtypeOptions: [
        { value: 'summary', label: 'Summary Performance' },
        { value: 'participants', label: 'Registered Trekkers List' },
        { value: 'staff', label: 'Guides & Support Team Log' },
        { value: 'all', label: 'Compiled Monthly Trends' }
      ],
      userSubtypeOptions: [
        { value: 'active', label: 'Leaderboard (Most Active Trekkers)' },
        { value: 'difficulty', label: 'Trek Difficulty Bookings Split' },
        { value: 'trends', label: 'Monthly Trend Breakdown' },
        { value: 'history', label: 'Full Raw Booking History' }
      ],
      staffSubtypeOptions: [
        { value: 'performance', label: 'Guide Performance Statistics' },
        { value: 'assignments', label: 'Batch Assignments List' }
      ]
    };
  },

  computed: {
    // Injected parent fields
    activeTab() {
      return this.adminDash.activeTab;
    },
    treks() {
      return this.adminDash.treks || [];
    },
    trekRoutes() {
      return this.adminDash.trekRoutes || [];
    },
    reportsList() {
      return this.adminDash.reportsList || [];
    }
  },

  methods: {
    // Dropdown labels resolution helpers
    getReportTypeName(val) {
      const opt = this.reportTypeOptions.find(o => o.value === val);
      return opt ? opt.label : 'Select Report Type';
    },
    getTrekSubtypeName(val) {
      const opt = this.trekSubtypeOptions.find(o => o.value === val);
      return opt ? opt.label : 'Select Detail Aspect';
    },
    getUserSubtypeName(val) {
      const opt = this.userSubtypeOptions.find(o => o.value === val);
      return opt ? opt.label : 'Select Detail Aspect';
    },
    getStaffSubtypeName(val) {
      const opt = this.staffSubtypeOptions.find(o => o.value === val);
      return opt ? opt.label : 'Select Detail Aspect';
    },
    toggleReportDropdown(dropdownName) {
      const current = this[dropdownName];
      this.closeAllReportDropdowns();
      this[dropdownName] = !current;
    },
    closeAllReportDropdowns() {
      this.showReportTypeDropdown = false;
      this.showReportMonthDropdown = false;
      this.showReportTrekDropdown = false;
      this.showReportTrekSubtypeDropdown = false;
      this.showReportBatchDropdown = false;
      this.showReportUserSubtypeDropdown = false;
      this.showReportStaffSubtypeDropdown = false;
    },

    // ── Local Report Compilation Logic ──
    compileReport() {
      const rType = this.selectedReportType;
      let headers = [];
      let rows = [];
      let title = "";
      let parameters = "";
      const monthsNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const treksList = this.adminDash.treks || [];
      const bookingsList = this.adminDash.allBookings || [];
      const usersList = this.adminDash.users || [];
      const staffList = this.adminDash.staffList || [];
      const staffLeaderboard = this.adminDash.staffLeaderboard || [];

      if (rType === 'monthly_activity') {
        title = `Monthly Activity Report - ${this.selectedReportMonth || 'All'}`;
        parameters = `Month: ${this.selectedReportMonth || 'All'}`;
        headers = ['Trek Name', 'Batch Code', 'Start Date', 'Booked Slots', 'Total Slots', 'Occupancy %', 'Revenue'];
        
        treksList.forEach(t => {
          let matches = true;
          if (this.selectedReportMonth && t.startDate) {
            const mIdx = new Date(t.startDate).getMonth();
            matches = monthsNames[mIdx] === this.selectedReportMonth;
          }
          if (matches) {
            const booked = t.booked || t.bookedSlots || 0;
            const total = t.slots || 20;
            const occ = total > 0 ? Math.round((booked / total) * 100) : 0;
            const price = t.price || 5000;
            const rev = booked * price;
            rows.push([
              t.name,
              t.batchCode || `TID${String(t.id).padStart(3, '0')}B01`,
              t.startDate,
              booked,
              total,
              `${occ}%`,
              `₹${rev}`
            ]);
          }
        });
      }
      else if (rType === 'trek_route') {
        const trekName = this.selectedReportTrek;
        const subTrek = this.selectedReportTrekSubtype || 'summary';
        parameters = `Trek: ${trekName || 'All'} | Aspect: ${subTrek}`;
        if (this.reportStartDate || this.reportEndDate) {
          parameters += ` | Range: ${this.reportStartDate || 'Any'} to ${this.reportEndDate || 'Any'}`;
        }
        
        if (subTrek === 'summary') {
          title = `Trek Route Summary - ${trekName || 'All'}`;
          headers = ['Batch Code', 'Start Date', 'End Date', 'Status', 'Booked', 'Slots', 'Revenue', 'Assigned Staff'];
          
          treksList.forEach(t => {
            if (!trekName || t.name === trekName) {
              if (this.reportStartDate && t.startDate < this.reportStartDate) return;
              if (this.reportEndDate && t.startDate > this.reportEndDate) return;
              const booked = t.booked || t.bookedSlots || 0;
              const total = t.slots || 20;
              const price = t.price || 5000;
              const rev = booked * price;
              rows.push([
                t.batchCode || `TID${String(t.id).padStart(3, '0')}B01`,
                t.startDate,
                t.endDate,
                t.status,
                booked,
                total,
                `₹${rev}`,
                t.staff || 'Unassigned'
              ]);
            }
          });
        }
        else if (subTrek === 'participants') {
          title = `Trek Route Participants - ${trekName || 'All'}`;
          headers = ['Booking ID', 'Batch Code', 'Trekker Name', 'Email', 'Phone', 'Booking Date', 'Status', 'Amount Paid'];
          
          bookingsList.forEach(b => {
            if (!trekName || b.trek === trekName) {
              if (this.reportStartDate && b.date < this.reportStartDate) return;
              if (this.reportEndDate && b.date > this.reportEndDate) return;
              const userObj = usersList.find(u => u.id === b.userId || u.name === b.user);
              rows.push([
                b.bookingId || `#${b.id}`,
                b.batchCode || '—',
                b.user,
                b.email || (userObj ? userObj.email : '—'),
                b.phone || (userObj ? userObj.phone : '—'),
                b.date,
                b.status,
                `₹${b.amountPaid}`
              ]);
            }
          });
        }
        else if (subTrek === 'staff') {
          title = `Trek Route Staff Details - ${trekName || 'All'}`;
          headers = ['Batch Code', 'Start Date', 'End Date', 'Staff Name', 'Email', 'Phone', 'Designation'];
          
          treksList.forEach(t => {
            if (!trekName || t.name === trekName) {
              if (this.reportStartDate && t.startDate < this.reportStartDate) return;
              if (this.reportEndDate && t.startDate > this.reportEndDate) return;
              const staffName = t.staffName || t.staff;
              if (!staffName || staffName === 'Unassigned') {
                rows.push([
                  t.batchCode || `TID${String(t.id).padStart(3, '0')}B01`,
                  t.startDate,
                  t.endDate,
                  'Unassigned', '—', '—', '—'
                ]);
              } else {
                const sObj = staffList.find(s => s.name === staffName || s.id === t.staff_id);
                rows.push([
                  t.batchCode || `TID${String(t.id).padStart(3, '0')}B01`,
                  t.startDate,
                  t.endDate,
                  staffName,
                  sObj ? sObj.contact : '—',
                  sObj ? sObj.phone : '—',
                  sObj ? sObj.designation : 'Guide'
                ]);
              }
            }
          });
        }
        else if (subTrek === 'all') {
          title = `Trek Route Compiled Performance - ${trekName || 'All'}`;
          headers = ['Period (Month)', 'Trek Route', 'Total Batches', 'Total Bookings', 'Occupancy %', 'Total Revenue'];
          const groups = {};
          treksList.forEach(t => {
            if (!trekName || t.name === trekName) {
              if (this.reportStartDate && t.startDate < this.reportStartDate) return;
              if (this.reportEndDate && t.startDate > this.reportEndDate) return;
              const mIdx = new Date(t.startDate).getMonth();
              const mName = monthsNames[mIdx] || 'Unknown';
              if (!groups[mName]) {
                groups[mName] = { trek: t.name, batches: 0, booked: 0, slots: 0, revenue: 0 };
              }
              const booked = t.booked || t.bookedSlots || 0;
              groups[mName].batches += 1;
              groups[mName].booked += booked;
              groups[mName].slots += (t.slots || 20);
              groups[mName].revenue += booked * (t.price || 5000);
            }
          });
          Object.entries(groups).forEach(([period, data]) => {
            const avgOcc = data.slots > 0 ? Math.round((data.booked / data.slots) * 100) : 0;
            rows.push([period, data.trek, data.batches, data.booked, `${avgOcc}%`, `₹${data.revenue}`]);
          });
        }
      }
      else if (rType === 'all_treks_combined') {
        title = `All Treks Combined Performance Report`;
        parameters = `Date Range: ${this.reportStartDate || 'Any'} to ${this.reportEndDate || 'Any'}`;
        headers = ['Trek Route', 'Total Batches', 'Total Bookings', 'Average Occupancy %', 'Total Revenue'];
        const trekMap = {};
        treksList.forEach(t => {
          if (this.reportStartDate && t.startDate < this.reportStartDate) return;
          if (this.reportEndDate && t.startDate > this.reportEndDate) return;
          if (!trekMap[t.name]) {
            trekMap[t.name] = { batches: 0, booked: 0, slots: 0, revenue: 0 };
          }
          const booked = t.booked || t.bookedSlots || 0;
          trekMap[t.name].batches += 1;
          trekMap[t.name].booked += booked;
          trekMap[t.name].slots += (t.slots || 20);
          trekMap[t.name].revenue += booked * (t.price || 5000);
        });
        Object.entries(trekMap).forEach(([name, data]) => {
          const avgOcc = data.slots > 0 ? Math.round((data.booked / data.slots) * 100) : 0;
          rows.push([name, data.batches, data.booked, `${avgOcc}%`, `₹${data.revenue}`]);
        });
      }
      else if (rType === 'batch_wise') {
        title = `Batch Wise Performance Report`;
        parameters = this.selectedReportBatch ? `Batch: ${this.selectedReportBatch}` : `Date Range: ${this.reportStartDate || 'Any'} to ${this.reportEndDate || 'Any'}`;
        headers = ['Batch ID', 'Trek Route', 'Start Date', 'Status', 'Total Bookings', 'Revenue', 'Staff Assigned'];
        treksList.forEach(t => {
          const bCode = t.batchCode || `TID${String(t.id).padStart(3, '0')}B01`;
          if (this.selectedReportBatch && bCode !== this.selectedReportBatch) return;
          if (this.reportStartDate && t.startDate < this.reportStartDate) return;
          if (this.reportEndDate && t.startDate > this.reportEndDate) return;
          const booked = t.booked || t.bookedSlots || 0;
          rows.push([bCode, t.name, t.startDate, t.status, booked, `₹${booked * (t.price || 5000)}`, t.staff || 'Unassigned']);
        });
      }
      else if (rType === 'batch_users') {
        title = `Batch User List - ${this.selectedReportBatch || 'None'}`;
        parameters = `Batch: ${this.selectedReportBatch || 'None'}`;
        headers = ['Booking ID', 'Member ID', 'Name', 'Email', 'Phone', 'Booking Status', 'Amount Paid', 'Payment Status'];
        if (this.selectedReportBatch) {
          bookingsList.forEach(b => {
            if (b.batchCode === this.selectedReportBatch) {
              const userObj = usersList.find(u => u.id === b.userId || u.name === b.user);
              rows.push([
                b.bookingId || `#${b.id}`,
                b.trekkerId || '—',
                b.user,
                b.email || (userObj ? userObj.email : '—'),
                userObj ? userObj.phone : '—',
                b.status,
                `₹${b.amountPaid}`,
                b.paymentStatus
              ]);
            }
          });
        }
      }
      else if (rType === 'user_participation') {
        const subUser = this.selectedReportUserSubtype || 'active';
        title = `User Participation Report - ${subUser.toUpperCase()}`;
        parameters = `Filters: Aspect ${subUser}`;
        
        if (subUser === 'active') {
          headers = ['Trekker Name', 'Email', 'Phone', 'Member ID', 'Total Bookings', 'Total Spent', 'Last Booking Date'];
          const userMap = {};
          bookingsList.forEach(b => {
            const name = b.user;
            if (!userMap[name]) {
              const uObj = usersList.find(u => u.id === b.userId || u.name === name);
              userMap[name] = {
                email: b.email || (uObj ? uObj.email : '—'),
                phone: uObj ? uObj.phone : '—',
                memberId: b.trekkerId || (uObj ? uObj.memberId : '—'),
                bookings: 0,
                spent: 0,
                lastDate: '2026-06-01'
              };
            }
            userMap[name].bookings += 1;
            if (b.paymentStatus === 'Paid') {
              userMap[name].spent += Number(b.amountPaid) || 0;
            } else if (b.paymentStatus === 'Refunded') {
              const paid = Number(b.amountPaid || b.bookingPrice || 5000);
              const ref = Number(b.refundAmount) || 0;
              userMap[name].spent += Math.max(0, paid - ref);
            }
            if (b.date && b.date > userMap[name].lastDate) {
              userMap[name].lastDate = b.date;
            }
          });
          Object.entries(userMap).forEach(([name, data]) => {
            rows.push([name, data.email, data.phone, data.memberId, data.bookings, `₹${data.spent}`, data.lastDate]);
          });
          rows.sort((a, b) => b[4] - a[4]);
        }
        else if (subUser === 'difficulty') {
          headers = ['Trekker Name', 'Email', 'Easy Bookings', 'Moderate Bookings', 'Hard Bookings', 'Total Bookings'];
          const userMap = {};
          bookingsList.forEach(b => {
            const name = b.user;
            if (!userMap[name]) {
              const uObj = usersList.find(u => u.id === b.userId || u.name === name);
              userMap[name] = {
                email: b.email || (uObj ? uObj.email : '—'),
                easy: 0, moderate: 0, hard: 0, total: 0
              };
            }
            userMap[name].total += 1;
            const diff = (b.difficulty || 'moderate').toLowerCase();
            if (diff === 'easy') userMap[name].easy += 1;
            else if (diff === 'hard') userMap[name].hard += 1;
            else userMap[name].moderate += 1;
          });
          Object.entries(userMap).forEach(([name, data]) => {
            rows.push([name, data.email, data.easy, data.moderate, data.hard, data.total]);
          });
          rows.sort((a, b) => b[5] - a[5]);
        }
        else if (subUser === 'trends') {
          headers = ['Month', 'Total Bookings', 'Paid Bookings', 'Cancelled Bookings', 'Total Revenue'];
          const monthlyMap = {};
          bookingsList.forEach(b => {
            if (!b.date) return;
            const mIdx = new Date(b.date).getMonth();
            const mName = monthsNames[mIdx] || 'Unknown';
            if (!monthlyMap[mName]) {
              monthlyMap[mName] = { total: 0, paid: 0, cancelled: 0, rev: 0 };
            }
            monthlyMap[mName].total += 1;
            if (b.status === 'Cancelled') {
              monthlyMap[mName].cancelled += 1;
            } else {
              monthlyMap[mName].paid += 1;
            }
            if (b.paymentStatus === 'Paid') {
              monthlyMap[mName].rev += Number(b.amountPaid) || 0;
            } else if (b.paymentStatus === 'Refunded') {
              const paid = Number(b.amountPaid || b.bookingPrice || 5000);
              const ref = Number(b.refundAmount) || 0;
              monthlyMap[mName].rev += Math.max(0, paid - ref);
            }
          });
          monthsNames.forEach(m => {
            if (monthlyMap[m]) {
              const data = monthlyMap[m];
              rows.push([m, data.total, data.paid, data.cancelled, `₹${data.rev}`]);
            }
          });
        }
        else if (subUser === 'history') {
          headers = ['Booking ID', 'Member ID', 'Trekker Name', 'Trek Route', 'Batch Code', 'Booking Date', 'Status', 'Paid Amount'];
          bookingsList.forEach(b => {
            rows.push([
              b.bookingId || `#${b.id}`,
              b.trekkerId || '—',
              b.user, b.trek, b.batchCode || '—', b.date, b.status, `₹${b.amountPaid}`
            ]);
          });
        }
      }
      else if (rType === 'staff_performance') {
        const subStaff = this.selectedReportStaffSubtype || 'performance';
        title = `Staff Performance Report - ${subStaff.toUpperCase()}`;
        parameters = `Filters: Aspect ${subStaff}`;
        
        if (subStaff === 'performance') {
          headers = ['Guide Name', 'Email', 'Phone', 'Treks Managed', 'Total Participants Led', 'Avg Occupancy %', 'Avg Rating'];
          staffLeaderboard.forEach(s => {
            const sObj = staffList.find(st => st.name === s.name);
            rows.push([
              s.name,
              s.email || (sObj ? sObj.contact : '—'),
              sObj ? sObj.phone : '—',
              s.treks, s.participants, `${s.avgOccupancy}%`, `★ ${s.rating}`
            ]);
          });
        }
        else if (subStaff === 'assignments') {
          headers = ['Guide Name', 'Batch Code', 'Trek Route', 'Start Date', 'End Date', 'Status'];
          treksList.forEach(t => {
            rows.push([
              t.staff || 'Unassigned',
              t.batchCode || `TID${String(t.id).padStart(3, '0')}B01`,
              t.name, t.startDate, t.endDate, t.status
            ]);
          });
        }
      }
      
      return { title, headers, rows, parameters };
    },

    // ── Save Generated Report ──
    generateReport() {
      const { title, headers, rows, parameters } = this.compileReport();
      if (rows.length === 0) {
        this.adminDash.showToast('No records found matching these parameters.');
        return;
      }
      const newReport = {
        id: Date.now(),
        title: title,
        type: this.selectedReportType,
        generatedAt: new Date().toLocaleString(),
        parameters: parameters,
        headers: headers,
        rows: rows
      };
      
      this.adminDash.reportsList.unshift(newReport);
      this.adminDash.showToast('Report generated successfully!');
    },

    // ── Live Preview & HTML String Construction ──
    previewCurrentReport() {
      const compiled = this.compileReport();
      if (compiled.rows.length === 0) {
        this.adminDash.showToast('No records found matching these parameters.');
        return;
      }
      this.reportPreviewData = compiled;
      this.iframeSrcDoc = this.generateHTMLReportString(compiled.title, compiled.headers, compiled.rows, compiled.parameters);
      this.showReportPreviewModal = true;
    },
    viewReport(report) {
      let headers = [];
      let rows = [];
      let title = report.title;
      let parameters = report.parameters;
      
      if (report.headers && report.rows) {
        headers = report.headers;
        rows = report.rows;
      } else {
        const prevType = this.selectedReportType;
        const prevMonth = this.selectedReportMonth;
        const prevTrek = this.selectedReportTrek;
        const prevBatch = this.selectedReportBatch;
        
        this.selectedReportType = report.type;
        if (report.type === 'monthly_activity') this.selectedReportMonth = 'May';
        if (report.type === 'trek_route') {
          const routes = this.adminDash.trekRoutes || [];
          this.selectedReportTrek = routes[0] ? routes[0].name : '';
        }
        
        const compiled = this.compileReport();
        headers = compiled.headers;
        rows = compiled.rows;
        parameters = compiled.parameters;
        
        this.selectedReportType = prevType;
        this.selectedReportMonth = prevMonth;
        this.selectedReportTrek = prevTrek;
        this.selectedReportBatch = prevBatch;
      }
      
      this.reportPreviewData = { title, headers, rows, parameters };
      this.iframeSrcDoc = this.generateHTMLReportString(title, headers, rows, parameters);
      this.showReportPreviewModal = true;
    },

    generateHTMLReportString(title, headers, dataRows, parameters) {
      let sumPaid = 0;
      let sumBooked = 0;
      let avgOcc = 0;
      let occCount = 0;
      
      dataRows.forEach(row => {
        row.forEach((val, idx) => {
          if (!headers[idx]) return;
          const hName = headers[idx].toLowerCase();
          if (hName.includes('revenue') || hName.includes('spent') || hName.includes('amount')) {
            const num = Number(String(val).replace(/[^0-9.-]+/g, ""));
            if (!isNaN(num)) sumPaid += num;
          }
          if (hName.includes('booked') || hName.includes('participants')) {
            const num = Number(String(val).replace(/[^0-9.-]+/g, ""));
            if (!isNaN(num)) sumBooked += num;
          }
          if (hName.includes('occupancy')) {
            const num = Number(String(val).replace(/[^0-9.-]+/g, ""));
            if (!isNaN(num)) { avgOcc += num; occCount++; }
          }
        });
      });
      
      const averageOccupancy = occCount > 0 ? Math.round(avgOcc / occCount) : null;
      let statCardsHTML = "";
      if (sumPaid > 0) {
        statCardsHTML += `
          <div class="stat-card">
            <div class="stat-title">Total Revenue / Spent</div>
            <div class="stat-value">₹${sumPaid.toLocaleString()}</div>
          </div>
        `;
      }
      if (sumBooked > 0) {
        statCardsHTML += `
          <div class="stat-card">
            <div class="stat-title">Total Participants / Bookings</div>
            <div class="stat-value">${sumBooked}</div>
          </div>
        `;
      }
      if (averageOccupancy !== null) {
        statCardsHTML += `
          <div class="stat-card">
            <div class="stat-title">Average Occupancy</div>
            <div class="stat-value">${averageOccupancy}%</div>
          </div>
        `;
      }
      
      const headerHTML = headers.map(h => `<th>${h}</th>`).join('');
      const rowsHTML = dataRows.map(row => {
        const cells = row.map(cell => `<td>${cell}</td>`).join('');
        return `<tr>${cells}</tr>`;
      }).join('');
      
      return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${title}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Playfair+Display:wght@700&family=Space+Mono&display=swap');
    
    :root {
      --forest: #1A2E1A;
      --forest-light: #2C5E3B;
      --gold: #C8922A;
      --gold-dark: #A47318;
      --snow: #F4F6F4;
      --cream: #F9F6EE;
      --bark: #2E251A;
      --stone: #8C8070;
    }
    
    body {
      font-family: 'DM Sans', sans-serif;
      margin: 0;
      padding: 30px;
      color: var(--bark);
      background-color: #ffffff;
      line-height: 1.5;
    }
    
    .report-container {
      max-width: 1000px;
      margin: 0 auto;
    }
    
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 2px solid var(--forest);
      padding-bottom: 20px;
      margin-bottom: 25px;
    }
    
    .brand {
      display: flex;
      flex-direction: column;
    }
    
    .brand-logo {
      font-family: 'Playfair Display', serif;
      font-size: 24px;
      font-weight: 700;
      color: var(--forest);
      letter-spacing: 0.02em;
    }
    
    .brand-sub {
      font-family: 'Space Mono', monospace;
      font-size: 10px;
      color: var(--stone);
      text-transform: uppercase;
      letter-spacing: 0.1em;
      margin-top: 3px;
    }
    
    .meta-info {
      text-align: right;
      font-family: 'Space Mono', monospace;
      font-size: 11px;
      color: var(--stone);
    }
    
    .title-section {
      margin-bottom: 25px;
    }
    
    .title {
      font-family: 'Playfair Display', serif;
      font-size: 28px;
      font-weight: 700;
      color: var(--forest);
      margin: 0 0 10px 0;
    }
    
    .parameters {
      background-color: var(--snow);
      border-left: 4px solid var(--gold);
      padding: 12px 16px;
      border-radius: 0 4px 4px 0;
      font-size: 13px;
      color: var(--forest);
    }
    
    .stats-row {
      display: flex;
      gap: 15px;
      margin-bottom: 30px;
    }
    
    .stat-card {
      flex: 1;
      background-color: var(--cream);
      border: 1px solid rgba(200, 146, 42, 0.15);
      border-radius: 6px;
      padding: 15px 20px;
    }
    
    .stat-title {
      font-size: 11px;
      font-weight: 700;
      color: var(--stone);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 5px;
    }
    
    .stat-value {
      font-family: 'DM Sans', sans-serif;
      font-size: 22px;
      font-weight: 700;
      color: var(--forest);
    }
    
    .table-container {
      overflow-x: auto;
      border: 1px solid rgba(26, 46, 26, 0.08);
      border-radius: 6px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.01);
      margin-bottom: 30px;
    }
    
    table {
      width: 100%;
      border-collapse: collapse;
      text-align: left;
      font-size: 13px;
    }
    
    th {
      background-color: var(--forest);
      color: var(--cream);
      font-weight: 600;
      text-transform: uppercase;
      font-size: 11px;
      letter-spacing: 0.02em;
      padding: 12px 16px;
    }
    
    td {
      padding: 12px 16px;
      border-bottom: 1px solid rgba(26, 46, 26, 0.05);
      color: var(--bark);
    }
    
    tr:nth-child(even) {
      background-color: var(--snow);
    }
    
    tr:hover {
      background-color: rgba(200, 146, 42, 0.03);
    }
    
    .footer {
      border-top: 1px solid rgba(26, 46, 26, 0.08);
      padding-top: 20px;
      margin-top: 40px;
      display: flex;
      justify-content: space-between;
      font-size: 11px;
      color: var(--stone);
      font-family: 'Space Mono', monospace;
    }
    
    @media print {
      body {
        padding: 0;
      }
      .stat-card {
        border: 1px solid #ddd;
      }
    }
  </style>
</head>
<body>
  <div class="report-container">
    <div class="header">
      <div class="brand">
        <div class="brand-logo">TrailSync</div>
        <div class="brand-sub">Platform Executive Report</div>
      </div>
      <div class="meta-info">
        <div>Generated: ${new Date().toLocaleString()}</div>
        <div>System: ONLINE</div>
      </div>
    </div>
    
    <div class="title-section">
      <h1 class="title">${title}</h1>
      <div class="parameters">
        <strong>Report Parameters:</strong> ${parameters}
      </div>
    </div>
    
    ${statCardsHTML ? `<div class="stats-row">${statCardsHTML}</div>` : ''}
    
    <div class="table-container">
      <table>
        <thead>
          <tr>
            ${headerHTML}
          </tr>
        </thead>
        <tbody>
          ${rowsHTML}
        </tbody>
      </table>
    </div>
    
    <div class="footer">
      <div>© 2026 TrailSync Systems</div>
      <div>Confidential - Admin Portal Access</div>
    </div>
  </div>
</body>
</html>
      `;
    },

    // ── Downloading Handlers ──
    downloadReportHTML(report) {
      let headers = [];
      let rows = [];
      let title = report.title;
      let parameters = report.parameters;
      
      if (report.headers && report.rows) {
        headers = report.headers;
        rows = report.rows;
      } else {
        const prevType = this.selectedReportType;
        const prevMonth = this.selectedReportMonth;
        const prevTrek = this.selectedReportTrek;
        const prevBatch = this.selectedReportBatch;
        
        this.selectedReportType = report.type;
        if (report.type === 'monthly_activity') this.selectedReportMonth = 'May';
        if (report.type === 'trek_route') {
          const routes = this.adminDash.trekRoutes || [];
          this.selectedReportTrek = routes[0] ? routes[0].name : '';
        }
        
        const compiled = this.compileReport();
        headers = compiled.headers;
        rows = compiled.rows;
        parameters = compiled.parameters;
        
        this.selectedReportType = prevType;
        this.selectedReportMonth = prevMonth;
        this.selectedReportTrek = prevTrek;
        this.selectedReportBatch = prevBatch;
      }
      
      const htmlContent = this.generateHTMLReportString(title, headers, rows, parameters);
      const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `${title.replace(/\s+/g, '_')}.html`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      this.adminDash.showToast('HTML report download started');
    },

    downloadReportCSV(report) {
      let headers = [];
      let rows = [];
      let title = report.title;
      
      if (report.headers && report.rows) {
        headers = report.headers;
        rows = report.rows;
      } else {
        const prevType = this.selectedReportType;
        const prevMonth = this.selectedReportMonth;
        const prevTrek = this.selectedReportTrek;
        const prevBatch = this.selectedReportBatch;
        
        this.selectedReportType = report.type;
        if (report.type === 'monthly_activity') this.selectedReportMonth = 'May';
        if (report.type === 'trek_route') {
          const routes = this.adminDash.trekRoutes || [];
          this.selectedReportTrek = routes[0] ? routes[0].name : '';
        }
        
        const compiled = this.compileReport();
        headers = compiled.headers;
        rows = compiled.rows;
        
        this.selectedReportType = prevType;
        this.selectedReportMonth = prevMonth;
        this.selectedReportTrek = prevTrek;
        this.selectedReportBatch = prevBatch;
      }
      
      this.exportReportCSV(title, headers, rows);
    },

    exportReportCSV(title, headers, dataRows) {
      const escapeCSV = val => {
        if (val === null || val === undefined) return '';
        let str = String(val).replace(/"/g, '""');
        if (str.includes(',') || str.includes('\n') || str.includes('"')) {
          str = `"${str}"`;
        }
        return str;
      };
      
      const headerRow = headers.map(escapeCSV).join(',');
      const bodyRows = dataRows.map(row => row.map(escapeCSV).join(','));
      const csvContent = [headerRow, ...bodyRows].join('\n');
      
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `${title.replace(/\s+/g, '_')}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      this.adminDash.showToast('CSV download started');
    }
  }
};
</script>
