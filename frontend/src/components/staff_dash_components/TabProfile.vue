<template>
      <div class="tab-content">
        <div class="page-header">
          <div>
            <div class="section-eyebrow">Account</div>
            <div class="section-title">My <em>Profile</em></div>
          </div>
          <button class="btn-back-home" @click="goTab('dashboard')"><i class="bi bi-house-door-fill me-1"></i>Back to Home</button>
        </div>
        <div class="profile-layout profile-layout-modern">
          <section class="profile-identity-card">
            <div class="profile-photo-wrap">
              <img v-if="profilePhotoUrl" :src="profilePhotoUrl" :alt="staffProfile.name" class="profile-photo-xl" />
              <div v-else class="profile-avatar-xl">{{ staffInitial }}</div>
              <span class="profile-status-badge" :class="{ inactive: profileStatusLabel !== 'Active' }">{{ profileStatusLabel }}</span>
            </div>
            <div class="profile-name-xl">{{ staffProfile.name || 'Staff Member' }}</div>
            <div class="profile-role-xl">{{ staffProfile.designation || 'Trek Staff' }}</div>
            <div class="profile-id-pill">{{ staffProfile.memberId || 'Staff ID pending' }}</div>

            <div class="profile-contact-list">
              <div class="profile-contact-item">
                <svg viewBox="0 0 24 24"><path d="M4 4h16v16H4z"/><path d="m22 6-10 7L2 6"/></svg>
                <span>{{ staffProfile.email || 'Email not added' }}</span>
              </div>
              <div class="profile-contact-item">
                <svg viewBox="0 0 24 24"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.44 2 2 0 0 1 3.6 1.28h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 9a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                <span>{{ staffProfile.phone || 'Phone not added' }}</span>
              </div>
              <div class="profile-contact-item">
                <svg viewBox="0 0 24 24"><path d="M12 21s7-4.35 7-11a7 7 0 1 0-14 0c0 6.65 7 11 7 11z"/><circle cx="12" cy="10" r="2.5"/></svg>
                <span>{{ staffProfile.city || 'Base not added' }}</span>
              </div>
            </div>
          </section>

          <section class="profile-main-card">
            <div class="profile-section-head">
              <div>
                <div class="profile-kicker">Admin Profile</div>
                <h3>Staff Details</h3>
                <div style="font-size: 0.72rem; color: #dc2626; margin-top: 4px; font-weight: 600;">
                  <i class="bi bi-info-circle-fill"></i> For any correction in profile, raise a ticket from the Support tab.
                </div>
              </div>
              <span class="profile-readonly-pill">Managed by Admin</span>
            </div>

            <div class="profile-detail-grid">
              <div class="profile-detail-item">
                <span>Designation</span>
                <strong>{{ staffProfile.designation || 'Not assigned' }}</strong>
              </div>
              <div class="profile-detail-item">
                <span>Experience</span>
                <strong>{{ perfMetrics.experienceYears }} year{{ perfMetrics.experienceYears === 1 ? '' : 's' }}</strong>
              </div>
              <div class="profile-detail-item">
                <span>Joined</span>
                <strong>{{ staffProfile.joined || 'Not recorded' }}</strong>
              </div>
              <div class="profile-detail-item">
                <span>Account</span>
                <strong>{{ staffProfile.blacklisted ? 'Restricted' : (staffProfile.active === false ? 'Inactive' : 'Active') }}</strong>
              </div>
            </div>

            <div class="profile-copy-block">
              <span>Bio</span>
              <p>{{ staffProfile.bio || 'No bio has been added yet.' }}</p>
            </div>

            <div class="profile-tags-grid">
              <div class="profile-tag-panel">
                <span>Skills</span>
                <div class="profile-tags">
                  <span v-for="skill in profileSkills" :key="skill" class="profile-tag">{{ skill }}</span>
                  <em v-if="!profileSkills.length">No skills added</em>
                </div>
              </div>
              <div class="profile-tag-panel">
                <span>Certifications</span>
                <div class="profile-tags">
                  <span v-for="cert in profileCertifications" :key="cert" class="profile-tag profile-tag-gold">{{ cert }}</span>
                  <em v-if="!profileCertifications.length">No certifications added</em>
                </div>
              </div>
              <div class="profile-tag-panel">
                <span>Languages</span>
                <div class="profile-tags">
                  <span v-for="language in profileLanguages" :key="language" class="profile-tag profile-tag-blue">{{ language }}</span>
                  <em v-if="!profileLanguages.length">No languages added</em>
                </div>
              </div>
            </div>

            <div class="career-panel">
              <div class="profile-section-head compact">
                <div>
                  <div class="profile-kicker">Career Performance</div>
                  <h3>Field Record</h3>
                </div>
              </div>
              <div class="career-stat-grid">
                <div class="career-stat">
                  <span>{{ perfMetrics.treksManaged }}</span>
                  <small>Total Treks Managed</small>
                </div>
                <div class="career-stat">
                  <span>{{ perfMetrics.completedTreks }}</span>
                  <small>Completed Treks</small>
                </div>
                <div class="career-stat">
                  <span>{{ perfMetrics.assignedTreks }}</span>
                  <small>Current Assignments</small>
                </div>
                <div class="career-stat">
                  <span>{{ perfMetrics.participantsManaged }}</span>
                  <small>Current Participants</small>
                </div>
              </div>
              <div class="career-progress-grid">
                <div class="perf-progress">
                  <div class="perf-progress-label"><span>Average Occupancy</span><span>{{ perfMetrics.occupancy }}%</span></div>
                  <div class="progress-track"><div class="progress-fill" :style="{ width: perfMetrics.occupancy + '%' }"></div></div>
                </div>
                <div class="perf-progress">
                  <div class="perf-progress-label"><span>Completion Rate</span><span>{{ perfMetrics.completionRate }}%</span></div>
                  <div class="progress-track"><div class="progress-fill alt" :style="{ width: perfMetrics.completionRate + '%' }"></div></div>
                </div>
              </div>
            </div>
          </section>

          <section class="profile-main-card profile-security-card">
            <div class="profile-section-head">
              <div>
                <div class="profile-kicker">Account Security</div>
                <h3>Change Password</h3>
              </div>
            </div>
            <div class="form-row full"><div class="form-group"><label>Current Password</label><input v-model="pwForm.current" type="password" placeholder="Current password" /></div></div>
            <div class="form-row">
              <div class="form-group"><label>New Password</label><input v-model="pwForm.new" type="password" placeholder="New password" /></div>
              <div class="form-group"><label>Confirm Password</label><input v-model="pwForm.confirm" type="password" placeholder="Confirm password" /></div>
            </div>
            <div class="profile-actions-row">
              <button class="btn-forest" @click="changePassword">Update Password</button>
            </div>
          </section>
        </div>
      </div>
</template>

<script>
import { staffDashComponent } from './staffDashProxy';

export default staffDashComponent('TabProfile');
</script>
