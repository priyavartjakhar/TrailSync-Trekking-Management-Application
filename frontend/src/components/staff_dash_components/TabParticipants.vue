<template>
      <div class="tab-content">
        <div class="page-header">
          <div>
            <div class="section-eyebrow">Participant Management</div>
            <div class="section-title">Trek <em>Participants</em></div>
          </div>
          <div class="d-flex gap-2 align-items-center">
            <button class="btn-back-home" @click="goTab('dashboard')"><i class="bi bi-house-door-fill me-1"></i>Back to Home</button>
            <button v-if="participantTrekId" class="btn-primary-ts btn-sm" @click="exportCSV(participantTrekId)" :disabled="exportPending && exportTrekId === participantTrekId">
              <i class="bi" :class="exportPending && exportTrekId === participantTrekId ? 'bi-hourglass-split' : 'bi-download'"></i>
              {{ exportPending && exportTrekId === participantTrekId ? 'Exporting…' : 'Export CSV' }}
            </button>
          </div>
        </div>

        <!-- No trek selected: search bar + trek card grid -->
        <template v-if="!participantTrekId">
          <div class="ptab-search-box" style="margin-bottom:1.1rem">
            <svg viewBox="0 0 24 24" class="ptab-search-icon"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input
              v-model="trekSearchQuery"
              type="text"
              placeholder="Search treks by name, location or batch…"
              class="ptab-search-input"
            />
            <button v-if="trekSearchQuery" class="ptab-chip-clear" style="position:absolute;right:12px;top:50%;transform:translateY(-50%);font-size:1rem" @mousedown.prevent="trekSearchQuery = ''">×</button>
          </div>

          <!-- Active Treks Section -->
          <div class="active-treks-section" style="margin-bottom: 2rem;">
            <h3 style="font-family:'Playfair Display',serif; font-size: 1.25rem; color: var(--forest); margin-bottom: 1rem;"><i class="bi bi-compass-fill"></i> Active Assigned Treks</h3>
            <div class="ptab-trek-cards">
              <div
                v-for="t in filteredTrekOptions" :key="t.id"
                class="ptab-trek-card"
                @click="selectTrekForParticipants(t, { inline: false })"
              >
                <div class="ptab-tc-batch">{{ t.batchCode }}</div>
                <div class="ptab-tc-name">{{ t.name }}</div>
                <div class="ptab-tc-loc"><i class="bi bi-geo-alt-fill"></i> {{ t.location }}</div>
                <div class="ptab-tc-dates">
                  <svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                  {{ formatDate(t.startDate) }} — {{ formatDate(t.endDate) }}
                </div>
                <div class="ptab-tc-footer">
                  <span :class="'status-pill status-' + t.status.toLowerCase()">{{ t.status }}</span>
                  <div class="ptab-tc-slots">
                    <span class="ptab-tc-slot-num">{{ t.registered }}/{{ t.slots }}</span>
                    <div class="ptab-tc-bar-wrap">
                      <div class="ptab-tc-bar-fill" :style="{ width: slotPct(t) + '%', background: slotColor(t) }"></div>
                    </div>
                  </div>
                </div>
              </div>
              <div v-if="!filteredTrekOptions.length" class="ptab-empty-state" style="grid-column:1/-1">
                <svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                <p>No active treks match your search.</p>
              </div>
            </div>
          </div>

          <!-- Completed/Past Treks Section -->
          <div style="margin-top: 2.5rem;">
            <h3 style="font-family:'Playfair Display',serif; font-size: 1.25rem; color: var(--forest); margin-bottom: 1rem;"><i class="bi bi-check-circle-fill text-success"></i> Completed / Past Treks</h3>
            <div class="ts-table-wrap">
              <table class="ts-table">
                <thead>
                  <tr>
                    <th>Batch ID</th>
                    <th>Trek Name</th>
                    <th>Dates</th>
                    <th>Slots</th>
                    <th style="text-align: right;">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="t in completedTrekOptions" :key="t.id">
                    <td class="mono font-bold">{{ t.batchCode }}</td>
                    <td>{{ t.name }}</td>
                    <td class="mono" style="font-size: 0.8rem;">{{ formatShortDate(t.startDate) }} — {{ formatShortDate(t.endDate) }}</td>
                    <td class="mono" style="font-size: 0.8rem;">{{ t.registered }}/{{ t.slots }}</td>
                    <td style="text-align: right;">
                      <button class="btn btn-sm btn-outline-forest py-1 px-2" style="font-size: 0.72rem; font-weight: 600;" @click="selectTrekForParticipants(t, { inline: false })">
                        <i class="bi bi-people"></i> View Participants
                      </button>
                    </td>
                  </tr>
                  <tr v-if="!completedTrekOptions.length">
                    <td colspan="5" class="text-center py-3 text-muted" style="font-size: 0.82rem;">No completed treks found.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </template>

        <template v-else>
          <!-- Back link -->
          <button class="ptab-back-btn" @click="backFromParticipantTrek">
            <svg viewBox="0 0 24 24"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
            {{ participantsInTreksTab ? 'Assigned Treks' : 'All Treks' }}
          </button>
          <!-- Selected Trek Banner -->
          <div class="ptab-trek-banner">
            <div class="ptab-banner-info">
              <div class="ptab-batch-label">{{ participantTrek.batchCode }}</div>
              <div class="ptab-trek-name">{{ participantTrek.name }}</div>
              <div class="ptab-trek-meta">
                <span><i class="bi bi-geo-alt-fill"></i> {{ participantTrek.location }}</span>
                <span class="ptab-date-sep">·</span>
                <span>
                  <svg viewBox="0 0 24 24" style="width:11px;height:11px;stroke:var(--gold);fill:none;stroke-width:2;vertical-align:middle;margin-right:2px"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                  {{ formatDate(participantTrek.startDate) }} — {{ formatDate(participantTrek.endDate) }}
                </span>
              </div>
            </div>
            <div class="ptab-banner-right">
              <div class="ptab-occ-bar-wrap">
                <div class="ptab-occ-label">
                  <span style="font-size:0.72rem;color:var(--gold-light);font-weight:600;letter-spacing:0.04em">Slot Occupancy</span>
                  <span style="font-family:'Space Mono',monospace;font-size:0.72rem;color:var(--gold-light);font-weight:700">{{ participantTrek.registered }}/{{ participantTrek.slots }}</span>
                </div>
                <div class="slot-bar-wrap" style="height:8px;background:rgba(255,255,255,0.12)">
                  <div class="slot-bar-fill" :style="{ width: slotPct(participantTrek) + '%', background: 'var(--gold)' }"></div>
                </div>
              </div>
              <button class="ptab-add-btn" @click="openAddParticipantModal(participantTrekId)">
                <svg viewBox="0 0 24 24"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg>
                Add Participant
              </button>
            </div>
          </div>

          <!-- Participant search -->
          <div style="display:flex; gap:0.5rem; margin-bottom:1.25rem; flex-wrap:wrap; align-items:center">
            <div class="search-bar-inline" style="margin-left:auto; min-width:200px">
              <svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              <input v-model="participantSearch" type="text" placeholder="Search name, email, trekker ID…" />
            </div>
            <span style="font-size:0.75rem; color:var(--stone); font-family:'Space Mono',monospace; white-space:nowrap">
              {{ filteredParticipants.length }} trekker{{ filteredParticipants.length !== 1 ? 's' : '' }}
            </span>
          </div>

          <!-- Participant Table -->
          <div class="ts-table-wrap">
            <table class="ts-table" v-if="filteredParticipants.length">
              <thead>
                <tr>
                  <th>Trekker ID</th>
                  <th>Name &amp; Email</th>
                  <th>Contact</th>
                  <th>Payment</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(p, i) in filteredParticipants" :key="p.id">
                  <td>
                    <span class="trekker-id-badge">{{ displayTrekkerId(p) }}</span>
                  </td>
                  <td>
                    <div class="user-cell">
                      <div class="user-mini-avatar">{{ p.name[0] }}</div>
                      <div>
                        <div class="cell-name">{{ p.name }}</div>
                        <div style="font-size:0.72rem;color:var(--stone)">{{ p.email }}</div>
                      </div>
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
                    <span :class="paymentStatusClass(p)">{{ paymentStatusLabel(p) }}</span>
                  </td>

                  <td>
                    <div class="ptab-action-btns">
                      <button class="ptab-btn ptab-btn-view" @click="openParticipantModal(p)">
                        <svg viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                        View Details
                      </button>
                      <button class="ptab-btn ptab-btn-sos" @click="openEmergencyModal(p)">
                        <svg viewBox="0 0 24 24"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.44 2 2 0 0 1 3.6 1.28h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 9a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                        SOS
                      </button>
                      <button v-if="p.status === 'Booked'" class="ptab-btn ptab-btn-remove" @click="cancelParticipant(p)">
                        <svg viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>
                        Remove
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
            <div v-else class="empty-state" style="border:none">
              <svg viewBox="0 0 24 24"><circle cx="9" cy="8" r="3"/><path d="M2 19c0-3 3-5 7-5s7 2 7 5"/></svg>
              <p>No participants found for this trek.</p>
            </div>
          </div>

          <div v-if="exportPending && exportTrekId === participantTrekId" class="export-notice">
            <svg viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            CSV export triggered — sent to your email shortly.
          </div>
        </template>
      </div>
</template>

<script>
import { staffDashComponent } from './staffDashProxy';

export default staffDashComponent('TabParticipants');
</script>
