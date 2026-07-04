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
      </div>
</template>

<script>
import { staffDashComponent } from './staffDashProxy';

export default staffDashComponent('TabExports');
</script>
