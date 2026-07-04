<template>
      <div class="tab-content">

        <!-- Welcome hero -->
        <div class="staff-hero">
          <div class="hero-left">
            <div class="hero-greeting">Welcome Back, Staff</div>
            <div class="hero-name">Hello, <em>{{ staffProfile.name.split(' ')[0] }}</em></div>
          </div>
          <div class="hero-right">
            <button class="btn-primary-ts" @click="goTab('treks')">Manage Treks</button>
            <button class="btn-ghost" @click="goTab('participants')">Participants</button>
          </div>
        </div>

        <!-- Stats row (exactly 5 stats as requested) -->
        <div class="stats-row">
          <div class="stat-card">
            <div class="stat-icon si-gold">
              <i class="bi bi-signpost-split-fill fs-5"></i>
            </div>
            <div class="stat-info">
              <div class="stat-val">{{ assignedTreks.length }}</div>
              <div class="stat-lbl">Total Assigned Treks</div>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-icon si-green">
              <i class="bi bi-activity fs-5"></i>
            </div>
            <div class="stat-info">
              <div class="stat-val">{{ assignedTreks.filter(t => ['Open', 'Approved', 'Started'].includes(t.status)).length }}</div>
              <div class="stat-lbl">Active Treks</div>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-icon si-gold">
              <i class="bi bi-calendar-event fs-5"></i>
            </div>
            <div class="stat-info">
              <div class="stat-val">
                {{ assignedTreks.filter(t => ['Open', 'Approved', 'Pending'].includes(t.status) && new Date(t.startDate) >= new Date()).length }}
              </div>
              <div class="stat-lbl">Upcoming Treks</div>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-icon si-blue">
              <i class="bi bi-check-circle-fill fs-5"></i>
            </div>
            <div class="stat-info">
              <div class="stat-val">{{ assignedTreks.filter(t => t.status === 'Completed').length }}</div>
              <div class="stat-lbl">Completed Treks</div>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-icon si-forest">
              <i class="bi bi-people-fill fs-5"></i>
            </div>
            <div class="stat-info">
              <div class="stat-val">{{ participants.length }}</div>
              <div class="stat-lbl">Total Participants Managed</div>
            </div>
          </div>
        </div>

        <!-- Dashboard Content Grid -->
        <!-- Row of 3 widgets (only shown if there is an upcoming trek) -->
        <div v-if="nextTrek" class="dashboard-widgets-row" style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 1.5rem; margin-top: 1.5rem;">
          
          <!-- Card 1: Next Trek In -->
          <div class="upcoming-trek d-flex flex-column justify-content-between">
            <div>
              <div class="up-label"><i class="bi bi-clock-history"></i> Next Trek In</div>
              <div class="up-name">{{ nextTrek.name }}</div>
              <div class="up-loc"><i class="bi bi-geo-alt-fill"></i> {{ nextTrek.location }}</div>
              <div class="up-start-date" style="font-size: 0.72rem; color: rgba(255,255,255,0.72); margin-top: -6px; margin-bottom: 12px;">
                <i class="bi bi-calendar3"></i> Starts: {{ formatDate(nextTrek.startDate) }}
              </div>
            </div>
            
            <div class="up-countdown">
              <div class="countdown-unit">
                <span class="cu-val">{{ countdown.days }}</span>
                <span class="cu-lbl">Days</span>
              </div>
              <div class="countdown-unit">
                <span class="cu-val">{{ countdown.hours }}</span>
                <span class="cu-lbl">Hrs</span>
              </div>
              <div class="countdown-unit">
                <span class="cu-val">{{ countdown.minutes }}</span>
                <span class="cu-lbl">Min</span>
              </div>
              <div class="countdown-unit">
                <span class="cu-val">{{ countdown.seconds }}</span>
                <span class="cu-lbl">Sec</span>
              </div>
            </div>

            <!-- Slot Utilization Bar -->
            <div class="slot-utilization-wrap mt-3 text-white" style="font-size: 0.72rem;">
              <div class="d-flex justify-content-between mb-1 opacity-75">
                <span>Slot Utilization</span>
                <span>{{ nextTrek.registered }}/{{ nextTrek.slots }}</span>
              </div>
              <div class="progress" style="height: 6px; background: rgba(255,255,255,0.15); border-radius: 3px; overflow: hidden;">
                <div class="progress-bar" role="progressbar" :style="{ width: (nextTrek.registered / nextTrek.slots * 100) + '%', background: '#e8b84b' }"></div>
              </div>
            </div>

            <button class="btn-up-details" @click="openTrekDetailModal(nextTrek)">
              View Details
            </button>
          </div>

          <!-- Card 2: Weather Snapshot (detailed, blueish theme & animated) -->
          <div class="ts-card weather-card-premium d-flex flex-column justify-content-between" style="color: #ffffff; border: none; border-radius: var(--radius); box-shadow: 0 4px 15px rgba(30, 60, 114, 0.2);">
            <div class="ts-card-header" style="border-bottom: 1px solid rgba(255,255,255,0.12); padding: 1.15rem 1.4rem;">
              <div class="ts-card-title text-white m-0" style="font-weight: 700; font-size: 0.85rem;">
                <i class="bi bi-cloud-sun-fill text-warning animate-spin-slow d-inline-block"></i> Weather Snapshot
              </div>
            </div>
            <div class="ts-card-body d-flex flex-column justify-content-between" style="padding: 1.25rem; flex: 1;">
              <div class="d-flex align-items-center justify-content-between">
                <div>
                  <div class="weather-temp" style="font-size: 2.25rem; font-family: 'Playfair Display', serif; font-weight: 700; line-height: 1.1; color: #ffffff;">
                    {{ getTrekWeather(nextTrek).temp }}
                  </div>
                  <div class="weather-cond" style="font-size: 0.8rem; font-weight: 600; color: rgba(255,255,255,0.8); margin-top: 2px;">
                    {{ getTrekWeather(nextTrek).condition }}
                  </div>
                </div>
                <div class="weather-icon" style="font-size: 3rem; color: #ffffff; line-height: 1; opacity: 0.95;">
                  <i :class="[getTrekWeather(nextTrek).icon, getTrekWeather(nextTrek).icon.includes('sun') ? 'animate-spin-slow d-inline-block' : 'animate-float d-inline-block']"></i>
                </div>
              </div>
              <hr style="margin: 0.75rem 0; opacity: 0.15;" />
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem; font-size: 0.72rem; font-family: 'Space Mono', monospace; color: rgba(255,255,255,0.85);">
                <div>Wind: {{ getTrekWeather(nextTrek).wind }}</div>
                <div>Hum: {{ getTrekWeather(nextTrek).humidity }}</div>
                <div>UV Index: 3 (Mod)</div>
                <div>Vis: 10 km</div>
              </div>
            </div>
          </div>

          <!-- Card 3: Emergency Contacts -->
          <div class="ts-card emergency-panel d-flex flex-column justify-content-between">
            <div class="ts-card-header bg-danger-subtle text-danger-emphasis">
              <div class="ts-card-title text-danger" style="font-weight: 700; font-size: 0.85rem;">
                <i class="bi bi-exclamation-triangle-fill"></i> Emergency Contacts
              </div>
            </div>
            <div class="ts-card-body d-flex flex-column justify-content-between" style="padding: 1rem 1.25rem; flex: 1;">
              <div class="emergency-contact-list" style="display: flex; flex-direction: column; gap: 0.65rem; width: 100%;">
                <div class="emergency-item d-flex justify-content-between align-items-center">
                  <div>
                    <div class="em-name fw-bold" style="font-size: 0.8rem; color: var(--forest);">Dr. Anand Sen</div>
                    <div class="em-role text-muted" style="font-size: 0.65rem;">Basecamp Coordinator</div>
                  </div>
                  <a href="tel:+919876543210" class="btn btn-sm btn-outline-danger py-1 px-2" style="font-size: 0.68rem; font-weight: 600;">
                    <i class="bi bi-telephone"></i> Call
                  </a>
                </div>
                <div class="emergency-item d-flex justify-content-between align-items-center">
                  <div>
                    <div class="em-name fw-bold" style="font-size: 0.8rem; color: var(--forest);">Rescue / Forest Office</div>
                    <div class="em-role text-muted" style="font-size: 0.65rem;">Uttarakhand / HP Dept</div>
                  </div>
                  <a href="tel:+911352712345" class="btn btn-sm btn-outline-danger py-1 px-2" style="font-size: 0.68rem; font-weight: 600;">
                    <i class="bi bi-telephone"></i> Call
                  </a>
                </div>
                <div class="emergency-item d-flex justify-content-between align-items-center" style="border-bottom: none; padding-bottom: 0;">
                  <div>
                    <div class="em-name fw-bold" style="font-size: 0.8rem; color: var(--forest);">TrailSync HQ Operations</div>
                    <div class="em-role text-muted" style="font-size: 0.65rem;">Hotline 24/7</div>
                  </div>
                  <a href="tel:+911800123456" class="btn btn-sm btn-outline-danger py-1 px-2" style="font-size: 0.68rem; font-weight: 600;">
                    <i class="bi bi-telephone"></i> Call
                  </a>
                </div>
              </div>
            </div>
          </div>

        </div>

        <!-- Assigned Treks Summary Table below the row of widgets -->
        <div class="dashboard-table-row" style="margin-top: 1.5rem; margin-bottom: 1rem;">
          <div class="ts-card">
            <div class="ts-card-header">
              <div class="ts-card-title"><i class="bi bi-list-stars"></i> Assigned Active Treks</div>
            </div>
            <div class="ts-card-body" style="padding: 1.25rem;">
              <div class="table-responsive">
                <table class="table ts-table align-middle" style="margin-bottom: 0;">
                  <thead>
                    <tr>
                      <th>Batch ID</th>
                      <th>Trek</th>
                      <th class="col-hide-mobile">Location</th>
                      <th>Date</th>
                      <th class="col-hide-mobile">Status</th>
                      <th class="col-hide-mobile">Slots</th>
                      <th class="text-end" style="width: 320px;">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="t in activeAssignedTreks" :key="t.id">
                      <td class="mono" style="font-size: 0.8rem; font-weight: bold;">{{ t.batchCode }}</td>
                      <td class="fw-bold">{{ t.name }}</td>
                      <td class="col-hide-mobile">{{ t.location }}</td>
                      <td class="mono" style="font-size: 0.8rem; white-space: nowrap;">
                        <span class="desktop-date-range">{{ formatShortDate(t.startDate) }} — {{ formatShortDate(t.endDate) }}</span>
                        <span class="mobile-date-only">{{ formatShortDate(t.startDate) }}</span>
                      </td>
                      <td class="col-hide-mobile">
                        <span :class="'status-pill status-' + t.status.toLowerCase()">{{ t.status }}</span>
                      </td>
                      <td class="mono col-hide-mobile" style="font-size: 0.8rem;">{{ t.registered }}/{{ t.slots }}</td>
                      <td class="text-end">
                        <div class="d-flex gap-1 justify-content-end">
                          <button class="btn btn-sm btn-outline-forest py-1 px-2 btn-hide-text-mobile" style="font-size: 0.72rem; font-weight: 600;" @click="openTrekDetailModal(t)">
                            <i class="bi bi-eye"></i> View Details
                          </button>
                          <button class="btn btn-sm btn-outline-gold py-1 px-2 btn-hide-text-mobile" style="font-size: 0.72rem; font-weight: 600;" @click="openSlotModal(t)">
                            <i class="bi bi-pencil-square"></i> Edit Slots
                          </button>
                          <button class="btn btn-sm btn-outline-primary-ts py-1 px-2 btn-hide-text-mobile" style="font-size: 0.72rem; font-weight: 600;" @click="selectTrekForParticipants(t, { inline: false })">
                            <i class="bi bi-people"></i> Manage Participants
                          </button>
                        </div>
                      </td>
                    </tr>
                    <tr v-if="!activeAssignedTreks.length">
                      <td colspan="6" class="text-center py-4 text-muted" style="font-size: 0.85rem;">
                        No active assigned treks found.
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        <!-- Completed Treks Section -->
        <div class="dashboard-table-row" style="margin-top: 1.5rem; margin-bottom: 1rem;">
          <div class="ts-card">
            <div class="ts-card-header">
              <div class="ts-card-title"><i class="bi bi-check-circle-fill text-success"></i> Completed Treks</div>
            </div>
            <div class="ts-card-body" style="padding: 1.25rem;">
              <div class="table-responsive">
                <table class="table ts-table align-middle" style="margin-bottom: 0;">
                  <thead>
                    <tr>
                      <th>Batch ID</th>
                      <th>Trek Name</th>
                      <th>Dates</th>
                      <th class="col-hide-mobile">Slots</th>
                      <th class="text-end">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="t in completedAssignedTreks" :key="t.id">
                      <td class="mono" style="font-size: 0.8rem; font-weight: bold;">{{ t.batchCode }}</td>
                      <td class="fw-bold">{{ t.name }}</td>
                      <td class="mono" style="font-size: 0.8rem; white-space: nowrap;">
                        <span class="desktop-date-range">{{ formatShortDate(t.startDate) }} — {{ formatShortDate(t.endDate) }}</span>
                        <span class="mobile-date-only">{{ formatShortDate(t.startDate) }}</span>
                      </td>
                      <td class="mono col-hide-mobile" style="font-size: 0.8rem;">{{ t.registered }}/{{ t.slots }}</td>
                      <td class="text-end">
                        <button class="btn btn-sm btn-outline-forest py-1 px-2 btn-hide-text-mobile" style="font-size: 0.72rem; font-weight: 600;" @click="openTrekDetailModal(t)">
                          <i class="bi bi-eye"></i> View Details
                        </button>
                      </td>
                    </tr>
                    <tr v-if="!completedAssignedTreks.length">
                      <td colspan="5" class="text-center py-4 text-muted" style="font-size: 0.85rem;">
                        No completed treks found.
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

      </div>
</template>

<script>
import { staffDashComponent } from './staffDashProxy';

export default staffDashComponent('TabDashboard');
</script>
