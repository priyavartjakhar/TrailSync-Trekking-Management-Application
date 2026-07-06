<template>
      <section v-if="activeTab==='jobs'" class="tab-content">
        <h3 class="tab-section-title">Background Scheduled Jobs</h3>
        <div class="jobs-grid">
          <div v-for="j in scheduledJobs" :key="j.name" class="job-detail-card">
            <div class="job-card-header-row">
              <span class="job-card-name">{{ j.name }}</span>
              <span :class="['status-pill', j.status==='Success'?'status-open':j.status==='Running'?'status-pending':'status-closed']">
                {{ j.status }}
              </span>
            </div>
            
            <div class="job-meta">
              <div class="meta-item"><strong>Schedule:</strong> <span>{{ j.schedule }}</span></div>
              <div class="meta-item"><strong>Last Run:</strong> <span>{{ j.lastRun }}</span></div>
            </div>
            
            <div class="job-description">
              <p v-if="j.name.includes('Reminder')">Sends countdown and safety/acclimatization tips to users with active upcoming bookings.</p>
              <p v-if="j.name.includes('Report')">Compiles trekking activity, difficulty breakdown, and revenue, emailing HTML + PDF report to Admin.</p>
              <p v-if="j.name.includes('Campaign')">Triggers daily newsletter at 11:50 AM with popular treks and features for all users.</p>
            </div>
            
            <div class="job-logs-section">
              <div class="logs-header">Execution Logs (Date & Time of Generation)</div>
              <div class="logs-list-box">
                <div v-if="!j.history || j.history.length === 0" class="empty-log-state">No execution logs found.</div>
                <div v-for="logTime in j.history" :key="logTime" class="log-row">
                  <span class="log-icon">⏱️</span>
                  <span class="log-time">{{ logTime }}</span>
                </div>
              </div>
            </div>
            
            <div class="job-actions">
              <button class="act-btn act-assign test-job-btn" @click="triggerJob(j)" :disabled="j.status==='Running'">
                {{ j.status==='Running' ? '⏳ Running...' : '🚀 Test Mail Now' }}
              </button>
            </div>
          </div>
        </div>

        <div class="ts-card" style="margin-top:2rem">
          <div class="dash-card-header"><span class="dash-card-title">Registration Welcome Email Tester</span></div>
          <div class="welcome-tester-grid">
            <!-- User Registration Welcomer -->
            <div class="tester-col">
              <h4 class="tester-subtitle">User Registration Welcome Mail</h4>
              <p class="tester-desc">Sends an aesthetic HTML email welcoming the user, asking them to complete their medical profile, and recommending 3 active treks.</p>
              <div class="tester-form-row">
                <input type="email" v-model="testUserEmail" placeholder="Enter recipient email..." class="tester-input" />
                <button class="act-btn act-assign" @click="triggerWelcomeTest('user', testUserEmail)">Send Test Mail</button>
              </div>
            </div>
            
            <!-- Staff Registration Welcomer -->
            <div class="tester-col">
              <h4 class="tester-subtitle">Staff Registration Welcome Mail</h4>
              <p class="tester-desc">Sends an instructions email welcoming the guide, prompting them to change their password immediately, and details actions needed.</p>
              <div class="tester-form-row">
                <input type="email" v-model="testStaffEmail" placeholder="Enter recipient email..." class="tester-input" />
                <button class="act-btn act-assign" @click="triggerWelcomeTest('staff', testStaffEmail)">Send Test Mail</button>
              </div>
            </div>
          </div>
        </div>
      </section>
</template>

<script>
/**
 * =========================================================================
 * TabJobs.vue
 * =========================================================================
 * Backend celery scheduler manager displaying last runs and statuses of daily reminders, monthly reports, and marketing campaigns.
 * 
 * Uses 'adminDashComponent' dynamic options proxying to link state/methods
 * reactivity directly with the parent 'AdminDashboard' coordinator.
 */

import { adminDashComponent } from './adminDashProxy';

export default adminDashComponent('TabJobs');
</script>
