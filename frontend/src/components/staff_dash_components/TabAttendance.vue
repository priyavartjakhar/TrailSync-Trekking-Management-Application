<template>
      <div class="tab-content">
        <div class="page-header">
          <div>
            <div class="section-eyebrow">Trek Management</div>
            <div class="section-title">Attendance <em>Tracker</em></div>
          </div>
        </div>

        <button class="ptab-back-btn" @click="backFromAttendanceTrek">
          <svg viewBox="0 0 24 24"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
          Assigned Treks
        </button>

        <div v-if="selectedTrek" class="ptab-trek-banner">
          <div class="ptab-banner-info">
            <div class="ptab-batch-label">{{ selectedTrek.batchCode }}</div>
            <div class="ptab-trek-name">{{ selectedTrek.name }}</div>
            <div class="ptab-trek-meta">
              <span><i class="bi bi-geo-alt-fill"></i> {{ selectedTrek.location }}</span>
              <span class="ptab-date-sep">·</span>
              <span>
                <svg viewBox="0 0 24 24" style="width:11px;height:11px;stroke:var(--gold);fill:none;stroke-width:2;vertical-align:middle;margin-right:2px"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                {{ formatDate(selectedTrek.startDate) }} — {{ formatDate(selectedTrek.endDate) }}
              </span>
            </div>
          </div>
          <div class="ptab-banner-right">
            <div class="ptab-occ-bar-wrap">
              <div class="ptab-occ-label">
                <span style="font-size:0.72rem;color:var(--gold-light);font-weight:600;letter-spacing:0.04em">Attendance</span>
                <span style="font-family:'Space Mono',monospace;font-size:0.72rem;color:var(--gold-light);font-weight:700">{{ attendanceParticipants.filter(p=>p.attendance).length }}/{{ attendanceParticipants.length }}</span>
              </div>
              <div class="slot-bar-wrap" style="height:8px;background:rgba(255,255,255,0.12)">
                <div class="slot-bar-fill" :style="{ width: (attendanceParticipants.length > 0 ? Math.round((attendanceParticipants.filter(p=>p.attendance).length / attendanceParticipants.length) * 100) : 0) + '%', background: 'var(--gold)' }"></div>
              </div>
            </div>
          </div>
        </div>

        <div v-if="!attendanceParticipants.length" class="empty-state">
          <svg viewBox="0 0 24 24"><polyline points="9 11 12 14 22 4"/></svg>
          <p>No participants to mark attendance for.</p>
        </div>

        <div class="ts-table-wrap">
          <table class="ts-table" v-if="attendanceParticipants.length">
            <thead>
              <tr>
                <th>Trekker ID</th>
                <th>Name</th>
                <th>Contact Number</th>
                <th>Attendance</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(p, i) in attendanceParticipants" :key="p.id">
                <td><span class="trekker-id-badge">{{ displayTrekkerId(p) }}</span></td>
                <td>
                  <div class="user-cell">
                    <div class="user-mini-avatar">{{ p.name[0] }}</div>
                    <span class="cell-name">{{ p.name }}</span>
                  </div>
                </td>
                <td>
                  <div style="display:flex;align-items:center;gap:5px">
                    <span class="mono" style="font-size:0.78rem">{{ p.phone || '—' }}</span>
                    <a v-if="p.phone" :href="'tel:' + p.phone" class="ptab-btn ptab-btn-call" title="Call">
                      <svg viewBox="0 0 24 24"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.44 2 2 0 0 1 3.6 1.28h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 9a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                      Call
                    </a>
                  </div>
                </td>
                <td>
                  <div class="attendance-choice-group">
                    <button class="att-choice-btn present" :class="{ active: p.attendance }" @click="setAttendance(p, true)">Present</button>
                    <button class="att-choice-btn absent" :class="{ active: !p.attendance }" @click="setAttendance(p, false)">Absent</button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
</template>

<script>
import { staffDashComponent } from './staffDashProxy';

export default staffDashComponent('TabAttendance');
</script>
