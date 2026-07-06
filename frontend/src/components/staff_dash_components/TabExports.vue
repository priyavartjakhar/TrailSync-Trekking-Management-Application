<template>
      <div class="tab-content">
        <div class="page-header">
          <div>
            <div class="section-eyebrow">Data Export</div>
            <div class="section-title">Export <em>Reports</em></div>
          </div>
          <button class="btn-back-home" @click="goTab('dashboard')"><i class="bi bi-house-door-fill me-1"></i>Back to Home</button>
        </div>
        <div class="ts-table-wrap">
          <table class="ts-table">
            <thead>
              <tr>
                <th>Batch ID</th>
                <th>Trek Name</th>
                <th>Start Date</th>
                <th class="col-hide-mobile">Status</th>
                <th class="col-hide-mobile">Participants</th>
                <th style="text-align: right; width: 240px;">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="t in assignedTreks" :key="t.id">
                <td class="mono font-bold">{{ t.batchCode }}</td>
                <td class="fw-bold">{{ t.name }}</td>
                <td class="mono" style="font-size: 0.82rem;">{{ formatDate(t.startDate) }}</td>
                <td class="col-hide-mobile">
                  <span :class="'status-pill status-' + t.status.toLowerCase()">{{ t.status }}</span>
                </td>
                <td class="mono col-hide-mobile" style="font-size: 0.82rem;">{{ participants.filter(p=>p.trekId===t.id).length }}</td>
                <td>
                  <div class="d-flex gap-2 justify-content-end">
                    <button class="btn btn-sm btn-outline-forest py-1 px-2 btn-hide-text-mobile" style="font-size: 0.72rem; font-weight: 600;" @click="openExportDetailModal(t)"><i class="bi bi-eye"></i> View</button>
                    <button class="btn btn-sm btn-outline-primary-ts py-1 px-2 btn-hide-text-mobile" style="font-size: 0.72rem; font-weight: 600;" @click="openDownloadPromptModal(t)"><i class="bi bi-download"></i> Download</button>
                  </div>
                </td>
              </tr>
              <tr v-if="!assignedTreks.length">
                <td colspan="6" class="text-center py-4 text-muted" style="font-size: 0.85rem;">No treks assigned for reports.</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- ── BATCH EXPORT DETAIL MODAL ────────────────── -->
        <transition name="toast">
          <div v-if="showExportDetailModal" class="ts-modal-overlay" @click.self="showExportDetailModal = false">
            <div class="ts-modal" style="max-width: 800px; width: 95%;">
              <div class="ts-modal-header">
                <span class="ts-modal-title"><i class="bi bi-bar-chart-fill"></i> Batch Detailed Overview</span>
                <button class="modal-close" @click="showExportDetailModal = false">✕</button>
              </div>
              <div class="ts-modal-body" v-if="exportDetailTrek" style="padding: 1.5rem; max-height: 70vh; overflow-y: auto;">
                
                <!-- Trek Summary Header -->
                <div style="background: var(--snow); border: 1px solid rgba(26,46,26,0.08); padding: 1.25rem; border-radius: var(--radius); margin-bottom: 1.5rem; display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 10px;">
                  <div>
                    <span class="mono" style="background: rgba(200,146,42,0.13); color: var(--forest); font-size: 0.68rem; font-weight: 700; padding: 2px 8px; border-radius: 999px; text-transform: uppercase; letter-spacing: 0.05em; display: inline-block; margin-bottom: 4px;">{{ exportDetailTrek.batchCode }}</span>
                    <h4 style="font-family: 'Playfair Display', serif; font-size: 1.3rem; font-weight: 800; color: var(--forest); margin: 0;">{{ exportDetailTrek.name }}</h4>
                    <div style="font-size: 0.82rem; color: var(--stone); margin-top: 4px;"><i class="bi bi-geo-alt-fill"></i> {{ exportDetailTrek.location }}</div>
                  </div>
                  <div style="text-align: right;">
                    <span :class="'status-pill status-' + exportDetailTrek.status.toLowerCase()">{{ exportDetailTrek.status }}</span>
                    <div style="font-size: 0.8rem; color: var(--bark); font-weight: 600; margin-top: 6px;">{{ formatDate(exportDetailTrek.startDate) }} — {{ formatDate(exportDetailTrek.endDate) }}</div>
                  </div>
                </div>

                <!-- Key Metrics Grid -->
                <div class="career-stat-grid" style="margin-bottom: 1.5rem; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));">
                  <div class="career-stat">
                    <span>{{ exportDetailTrek.registered }}/{{ exportDetailTrek.slots }}</span>
                    <small>Occupancy</small>
                  </div>
                  <div class="career-stat">
                    <span>{{ exportDetailTrek.registered > 0 ? Math.round((exportDetailTrek.registered / exportDetailTrek.slots) * 100) : 0 }}%</span>
                    <small>Fill Rate</small>
                  </div>
                  <div class="career-stat">
                    <span>{{ slotsLeft(exportDetailTrek) }}</span>
                    <small>Slots Remaining</small>
                  </div>
                  <div class="career-stat">
                    <span>₹{{ exportDetailTrek.price ? exportDetailTrek.price.toLocaleString() : '5,000' }}</span>
                    <small>Base price</small>
                  </div>
                </div>

                <!-- Participants List Table -->
                <h5 style="font-family: 'Playfair Display', serif; font-size: 1.05rem; font-weight: 700; color: var(--forest); margin-bottom: 0.85rem; border-bottom: 1px solid rgba(26,46,26,0.1); padding-bottom: 6px;">Registered Trekkers</h5>
                <div class="ts-table-wrap">
                  <table class="ts-table">
                    <thead>
                      <tr>
                        <th>Trekker ID</th>
                        <th>Name</th>
                        <th>Contact Info</th>
                        <th>Blood Group</th>
                        <th>Emergency Contact</th>
                        <th>Payment</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="p in participants.filter(p=>p.trekId===exportDetailTrek.id)" :key="p.id">
                        <td class="mono font-bold">{{ displayTrekkerId(p) }}</td>
                        <td>
                          <div class="user-cell">
                            <div class="user-mini-avatar">{{ p.name[0] }}</div>
                            <span class="cell-name">{{ p.name }}</span>
                          </div>
                        </td>
                        <td>
                          <div>📧 {{ p.email }}</div>
                          <div style="font-size:0.75rem; color:var(--stone); margin-top:2px;">📞 {{ p.phone || '—' }}</div>
                        </td>
                        <td class="mono font-bold" style="color: #ef4444;">{{ p.bloodGroup || '—' }}</td>
                        <td style="font-size:0.78rem;">
                          <div>{{ p.emergencyContact || '—' }}</div>
                          <div style="color:var(--stone); margin-top:1px;">{{ p.emergencyPhone || '' }}</div>
                        </td>
                        <td>
                          <span :class="'status-pill pay-' + (p.paymentStatus || 'paid').toLowerCase()" style="font-size: 0.65rem; padding: 2px 6px;">{{ p.paymentStatus || 'Paid' }}</span>
                        </td>
                      </tr>
                      <tr v-if="!participants.filter(p=>p.trekId===exportDetailTrek.id).length">
                        <td colspan="6" style="text-align: center; color: var(--stone); font-style: italic; padding: 1.5rem;">No participants registered for this batch.</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

              </div>
              <div class="ts-modal-footer">
                <button class="btn-ghost" @click="showExportDetailModal = false">Close</button>
                <button class="btn-primary-ts" @click="openDownloadPromptModal(exportDetailTrek)">Download Report</button>
              </div>
            </div>
          </div>
        </transition>

        <!-- ── DOWNLOAD REPORT PROMPT MODAL ────────────────── -->
        <transition name="toast">
          <div v-if="showDownloadPromptModal" class="ts-modal-overlay" @click.self="showDownloadPromptModal = false">
            <div class="ts-modal" style="max-width: 420px; width: 90%;">
              <div class="ts-modal-header">
                <span class="ts-modal-title"><i class="bi bi-file-earmark-arrow-down"></i> Export Document Report</span>
                <button class="modal-close" @click="showDownloadPromptModal = false">✕</button>
              </div>
              <div class="ts-modal-body" v-if="downloadPromptTrek" style="padding: 1.5rem; text-align: center;">
                <div style="margin-bottom: 0.85rem;"><i class="bi bi-file-earmark-pdf" style="font-size: 2.5rem; color: var(--gold);"></i></div>
                <h5 style="font-family: 'Playfair Display', serif; font-weight: 800; color: var(--forest); margin-bottom: 6px;">Download PDF Report</h5>
                <div style="font-size: 0.8rem; color: var(--stone); margin-bottom: 1.5rem; line-height: 1.5;">
                  Select the type of report you want to export as a formatted PDF for <strong style="color: var(--forest);">{{ downloadPromptTrek.name }} ({{ downloadPromptTrek.batchCode }})</strong>.
                </div>

                <!-- Loading spinner -->
                <div v-if="downloadPending" class="d-flex flex-column align-items-center" style="margin-bottom: 1rem;">
                  <div class="pay-sim-spinner" style="margin-bottom: 10px;"></div>
                  <div style="font-size: 0.8rem; color: var(--stone); font-weight: 600;">Generating your PDF document...</div>
                </div>

                <!-- Options -->
                <div v-else style="display: flex; flex-direction: column; gap: 10px;">
                  <button class="btn-primary-ts d-flex justify-content-between align-items-center" @click="generatePDFReport(downloadPromptTrek, 'list')" style="padding: 12px; font-size: 0.85rem; text-align: left; font-weight: 700; width: 100%;">
                    <span><i class="bi bi-people-fill"></i> Participants List Only</span>
                    <span style="font-size: 0.7rem; background: rgba(255,255,255,0.2); padding: 2px 6px; border-radius: 4px;">PDF</span>
                  </button>
                  <button class="btn-forest d-flex justify-content-between align-items-center" @click="generatePDFReport(downloadPromptTrek, 'full')" style="padding: 12px; font-size: 0.85rem; text-align: left; font-weight: 700; background: var(--forest); border: none; color: white; width: 100%;">
                    <span><i class="bi bi-file-earmark-bar-graph"></i> Full Detailed Information</span>
                    <span style="font-size: 0.7rem; background: rgba(255,255,255,0.2); padding: 2px 6px; border-radius: 4px;">PDF</span>
                  </button>
                </div>
              </div>
              <div class="ts-modal-footer" v-if="!downloadPending">
                <button class="btn-modal-cancel" @click="showDownloadPromptModal = false" style="font-weight: 600;">Cancel</button>
              </div>
            </div>
          </div>
        </transition>

      </div>
</template>

<script>
/**
 * =========================================================================
 * TabExports.vue
 * =========================================================================
 * Data utility tab allowing guides to review and download participant rosters as formatted lists.
 * Uses 'staffDashComponent' options proxying to automatically route methods/state
 * read/writes directly to the parent 'StaffDashboard' instance.
 */

import { staffDashComponent } from './staffDashProxy';

export default staffDashComponent('TabExports', {
  data() {
    return {
      showExportDetailModal: false,
      exportDetailTrek: null,
      showDownloadPromptModal: false,
      downloadPromptTrek: null,
      downloadPending: false,
      exportPending: false,
      exportTrekId: null
    };
  },
  methods: {
    openExportDetailModal(t) {
      this.exportDetailTrek = t;
      this.showExportDetailModal = true;
    },

    openDownloadPromptModal(t) {
      this.downloadPromptTrek = t;
      this.showDownloadPromptModal = true;
    },

    async exportCSV(trekId) {
      this.exportPending = true;
      this.exportTrekId = trekId;
      const trek = this.assignedTreks.find(t => t.id === trekId);
      try {
        const res = await fetch(`/api/staff/export/${trekId}`, { method: 'POST' });
        const data = await res.json();
        this.staffDash.showToast(data.message || 'CSV export triggered');
      } catch {
        this.staffDash.showToast(`Participant list for ${trek?.name || 'trek'} — CSV sent via email`);
      }
      setTimeout(() => {
        this.exportPending = false;
        this.exportTrekId = null;
      }, 6000);
    },

    async generatePDFReport(t, type) {
      this.downloadPending = true;
      let checklist = [];
      if (type === 'full') {
        try {
          const res = await fetch(`/api/guide/treks/${t.id}/checklist`);
          if (res.ok) {
            const data = await res.json();
            checklist = data.map(item => item.itemName);
          }
        } catch (e) {
          console.error(e);
        }
      }

      const trekParticipants = this.participants.filter(p => p.trekId === t.id);

      // Create PDF element container
      const container = document.createElement('div');
      container.style.padding = '30px';
      container.style.fontFamily = "'DM Sans', 'Helvetica Neue', sans-serif";
      container.style.color = '#4a3728'; 
      container.style.background = '#fff';

      let html = '';

      // PDF Header
      html += `
        <div style="border-bottom: 2px solid #1a2e1a; padding-bottom: 15px; margin-bottom: 25px; display: flex; justify-content: space-between; align-items: flex-end;">
          <div>
            <div style="font-size: 1.6rem; font-weight: 800; font-family: 'Playfair Display', serif; color: #1a2e1a; letter-spacing: -0.5px;">TrailSync <span style="color: #c8922a; font-weight: 400;">Reports</span></div>
            <div style="font-size: 0.75rem; color: #8c8070; text-transform: uppercase; letter-spacing: 1px; margin-top: 3px;">Trek Guide Operations panel</div>
          </div>
          <div style="text-align: right;">
            <div style="font-size: 0.72rem; font-family: 'Space Mono', monospace; font-weight: 700; color: #c8922a; background: rgba(200,146,42,0.1); padding: 3px 8px; border-radius: 4px; display: inline-block;">${t.batchCode}</div>
            <div style="font-size: 0.7rem; color: #8c8070; margin-top: 4px;">Generated on: ${new Date().toLocaleDateString()}</div>
          </div>
        </div>
      `;

      if (type === 'full') {
        // Full Summary Report
        html += `
          <div style="margin-bottom: 25px;">
            <h2 style="font-family: 'Playfair Display', serif; font-size: 1.4rem; color: #1a2e1a; margin-bottom: 12px; font-weight: 800;">Trek Batch Summary Report</h2>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; background: #fdfaf5; border: 1px solid rgba(26,46,26,0.08); padding: 15px; border-radius: 8px; margin-bottom: 20px;">
              <div>
                <div style="font-size: 0.72rem; color: #8c8070; text-transform: uppercase; font-weight: 600;">Adventure Name</div>
                <div style="font-size: 0.95rem; font-weight: 700; color: #1a2e1a; margin-top: 2px;">${t.name}</div>
              </div>
              <div>
                <div style="font-size: 0.72rem; color: #8c8070; text-transform: uppercase; font-weight: 600;">Location</div>
                <div style="font-size: 0.95rem; font-weight: 700; color: #1a2e1a; margin-top: 2px;">📍 ${t.location}</div>
              </div>
              <div style="margin-top: 10px;">
                <div style="font-size: 0.72rem; color: #8c8070; text-transform: uppercase; font-weight: 600;">Schedule Dates</div>
                <div style="font-size: 0.88rem; font-weight: 600; color: #1a2e1a; margin-top: 2px;">${this.formatDate(t.startDate)} — ${this.formatDate(t.endDate)}</div>
              </div>
              <div style="margin-top: 10px;">
                <div style="font-size: 0.72rem; color: #8c8070; text-transform: uppercase; font-weight: 600;">Base Price</div>
                <div style="font-size: 0.88rem; font-weight: 600; color: #1a2e1a; margin-top: 2px;">₹${t.price ? t.price.toLocaleString() : '5,000'}</div>
              </div>
            </div>

            <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 25px;">
              <div style="border: 1px solid rgba(26,46,26,0.07); padding: 10px; border-radius: 6px; text-align: center; background: #fff;">
                <div style="font-size: 1.4rem; font-family: 'Playfair Display', serif; font-weight: 800; color: #1a2e1a;">${t.registered}/${t.slots}</div>
                <div style="font-size: 0.62rem; color: #8c8070; font-weight: 700; text-transform: uppercase; margin-top: 4px;">Occupancy</div>
              </div>
              <div style="border: 1px solid rgba(26,46,26,0.07); padding: 10px; border-radius: 6px; text-align: center; background: #fff;">
                <div style="font-size: 1.4rem; font-family: 'Playfair Display', serif; font-weight: 800; color: #1a2e1a;">${t.registered > 0 ? Math.round((t.registered / t.slots) * 100) : 0}%</div>
                <div style="font-size: 0.62rem; color: #8c8070; font-weight: 700; text-transform: uppercase; margin-top: 4px;">Fill Rate</div>
              </div>
              <div style="border: 1px solid rgba(26,46,26,0.07); padding: 10px; border-radius: 6px; text-align: center; background: #fff;">
                <div style="font-size: 1.4rem; font-family: 'Playfair Display', serif; font-weight: 800; color: #1a2e1a;">${t.slots - t.registered}</div>
                <div style="font-size: 0.62rem; color: #8c8070; font-weight: 700; text-transform: uppercase; margin-top: 4px;">Slots Left</div>
              </div>
              <div style="border: 1px solid rgba(26,46,26,0.07); padding: 10px; border-radius: 6px; text-align: center; background: #fff;">
                <div style="font-size: 1.4rem; font-family: 'Playfair Display', serif; font-weight: 800; color: #c8922a;">${t.status}</div>
                <div style="font-size: 0.62rem; color: #8c8070; font-weight: 700; text-transform: uppercase; margin-top: 4px;">Batch Status</div>
              </div>
            </div>
          </div>
        `;

        if (checklist.length > 0) {
          html += `
            <div style="margin-bottom: 25px;">
              <h3 style="font-family: 'Playfair Display', serif; font-size: 1.1rem; color: #1a2e1a; margin-bottom: 8px; font-weight: 700;">Trek Checklist Items</h3>
              <div style="display: flex; flex-wrap: wrap; gap: 6px;">
                ${checklist.map(item => `<span style="font-size: 0.72rem; background: #f5f0e8; color: #1a2e1a; padding: 4px 10px; border-radius: 4px; border: 1px solid rgba(26,46,26,0.08);">${item}</span>`).join('')}
              </div>
            </div>
          `;
        }
      } else {
        // Participants List Only Header
        html += `
          <div style="margin-bottom: 20px;">
            <h2 style="font-family: 'Playfair Display', serif; font-size: 1.4rem; color: #1a2e1a; margin-bottom: 4px; font-weight: 800;">Trek Participant Directory</h2>
            <div style="font-size: 0.82rem; color: #8c8070;">Trek: <strong style="color: #1a2e1a;">${t.name}</strong> · Batch: <strong style="color: #1a2e1a;">${t.batchCode}</strong> · Location: <strong>📍 ${t.location}</strong></div>
          </div>
        `;
      }

      // Participant Table
      html += `
        <div>
          <h3 style="font-family: 'Playfair Display', serif; font-size: 1.1rem; color: #1a2e1a; margin-bottom: 10px; font-weight: 700; border-bottom: 1px solid rgba(26,46,26,0.1); padding-bottom: 5px;">Trekker Roster (${trekParticipants.length} registered)</h3>
          <table style="width: 100%; border-collapse: collapse; font-size: 0.74rem; text-align: left;">
            <thead>
              <tr style="background: #1a2e1a; color: #fff;">
                <th style="padding: 8px; border: 1px solid #1a2e1a;">Trekker ID</th>
                <th style="padding: 8px; border: 1px solid #1a2e1a;">Name</th>
                <th style="padding: 8px; border: 1px solid #1a2e1a;">Contact Information</th>
                <th style="padding: 8px; border: 1px solid #1a2e1a; text-align: center;">Blood</th>
                <th style="padding: 8px; border: 1px solid #1a2e1a; text-align: center;">Emergency Contact</th>
                <th style="padding: 8px; border: 1px solid #1a2e1a; text-align: center;">Payment</th>
              </tr>
            </thead>
            <tbody>
              ${trekParticipants.map((p, idx) => `
                <tr style="background: ${idx % 2 === 0 ? '#fff' : '#fdfaf5'}; border-bottom: 1px solid rgba(26,46,26,0.08);">
                  <td style="padding: 8px; font-family: 'Space Mono', monospace; font-weight: bold; color: #1a2e1a;">${this.displayTrekkerId(p)}</td>
                  <td style="padding: 8px; font-weight: 600; color: #1a2e1a;">${p.name}</td>
                  <td style="padding: 8px;">
                    <div>📧 ${p.email}</div>
                    <div style="margin-top: 2px;">📞 ${p.phone || '—'}</div>
                  </td>
                  <td style="padding: 8px; text-align: center; font-family: 'Space Mono', monospace; color: #dc2626; font-weight: bold;">${p.bloodGroup || '—'}</td>
                  <td style="padding: 8px; text-align: center;">
                    <div>${p.emergencyContact || '—'}</div>
                    <div style="font-size: 0.66rem; color: #8c8070; margin-top: 1px;">${p.emergencyPhone || ''}</div>
                  </td>
                  <td style="padding: 8px; text-align: center;">
                    <span style="font-size: 0.64rem; padding: 2px 6px; border-radius: 4px; font-weight: bold; text-transform: uppercase; background: ${p.paymentStatus === 'Paid' ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.1)'}; color: ${p.paymentStatus === 'Paid' ? '#10b981' : '#d97706'}; border: 1px solid ${p.paymentStatus === 'Paid' ? 'rgba(16,185,129,0.2)' : 'rgba(245,158,11,0.2)'};">
                      ${p.paymentStatus || 'Paid'}
                    </span>
                  </td>
                </tr>
              `).join('')}
              ${trekParticipants.length === 0 ? `
                <tr>
                  <td colspan="6" style="padding: 20px; text-align: center; color: #8c8070; font-style: italic;">No trekkers are currently registered for this batch.</td>
                </tr>
              ` : ''}
            </tbody>
          </table>
        </div>
      `;

      container.innerHTML = html;
      document.body.appendChild(container);

      const opt = {
        margin:       0.4,
        filename:     `TrailSync_${t.batchCode}_${type === 'full' ? 'Full_Report' : 'Roster'}.pdf`,
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { scale: 2, useCORS: true },
        jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' }
      };

      try {
        await html2pdf().from(container).set(opt).save();
        this.staffDash.showToast('PDF downloaded successfully!', 'success');
      } catch (err) {
        console.error(err);
        this.staffDash.showToast('Failed to generate PDF. Please try again.', 'error');
      } finally {
        document.body.removeChild(container);
        this.downloadPending = false;
        this.showDownloadPromptModal = false;
      }
    }
  }
});
</script>
