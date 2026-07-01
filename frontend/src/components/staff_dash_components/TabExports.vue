<template>
      <div class="tab-content">
        <div class="page-header">
          <div>
            <div class="section-eyebrow">Data Export</div>
            <div class="section-title">Export <em>Reports</em></div>
          </div>
          <button class="btn-back-home" @click="goTab('dashboard')"><i class="bi bi-house-door-fill me-1"></i>Back to Home</button>
        </div>
        <div style="display:grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap:1.25rem">
          <div v-for="t in assignedTreks" :key="t.id" class="ts-card">
            <div class="ts-card-header">
              <div>
                <div class="ts-card-title">{{ t.name }}</div>
                <div class="ts-card-sub">{{ t.location }} · {{ participants.filter(p=>p.trekId===t.id).length }} participants</div>
              </div>
              <span :class="'status-pill status-' + t.status.toLowerCase()">{{ t.status }}</span>
            </div>
            <div class="ts-card-body">
              <div style="font-size:0.78rem; color:var(--stone); margin-bottom:1rem; line-height:1.6">
                Export includes: participant name, email, phone, booking status, booking date, blood group, emergency contact.
              </div>
              <div style="display:flex; justify-content:space-between; gap:0.5rem; margin-top:0.5rem">
                <button class="btn-ghost btn-sm" @click="openExportDetailModal(t)" style="flex:1; text-align:center"><i class="bi bi-eye"></i> View</button>
                <button class="btn-primary-ts btn-sm" @click="openDownloadPromptModal(t)" style="flex:1; text-align:center"><i class="bi bi-download"></i> Download</button>
              </div>
            </div>
          </div>
        </div>
      </div>
</template>

<script>
import { staffDashComponent } from './staffDashProxy';

export default staffDashComponent('TabExports');
</script>
