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
                    <th>Parameters</th>
                    <th>Generated At</th>
                    <th style="text-align: right; width: 170px;">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="r in reportsList" :key="r.id">
                    <td>
                      <div style="font-weight: 600; color: var(--forest);">{{ r.title }}</div>
                      <div class="category-tag tag-system" style="font-size: 0.68rem; margin-top: 4px; display: inline-block;">
                        {{ r.type.replace('_', ' ').toUpperCase() }}
                      </div>
                    </td>
                    <td><span class="mono" style="font-size: 0.78rem; color: var(--bark);">{{ r.parameters }}</span></td>
                    <td class="mono" style="font-size: 0.78rem; color: var(--stone);">{{ r.generatedAt }}</td>
                    <td style="text-align: right; white-space: nowrap;">
                      <button class="act-btn act-assign" @click="viewReport(r)" style="margin-right: 0.25rem; background: var(--cream); border-color: rgba(26,46,26,0.1); color: var(--forest);">
                        View
                      </button>
                      <button class="act-btn act-assign" @click="downloadReportHTML(r)" style="margin-right: 0.25rem; background: rgba(200, 146, 42, 0.08); border-color: rgba(200,146,42,0.2); color: var(--gold-dark);">
                        HTML
                      </button>
                      <button class="act-btn act-assign" @click="downloadReportCSV(r)">
                        CSV
                      </button>
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
      </section>
</template>

<script>
import { adminDashComponent } from './adminDashProxy';

export default adminDashComponent('TabReports');
</script>
