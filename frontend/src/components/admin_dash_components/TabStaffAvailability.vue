<template>
      <section v-if="activeTab==='staff_availability'" class="tab-content">
        <!-- Visual Timeline Monthly Calendar (TOP) -->
        <div class="calendar-timeline-container" style="margin-top: 0; margin-bottom: 1.5rem;">
          <div class="calendar-timeline-header">
            <h4 style="color: var(--forest); margin: 0; font-size: 1.1rem; font-weight: 600;">
              📅 Monthly Guide Schedule Overview
            </h4>
            <div style="display: flex; align-items: center; gap: 1rem; flex-wrap: wrap;">
              <!-- Calendar Search input -->
              <div class="search-box" style="display: flex; align-items: center; background: #f7fafc; border: 1px solid #cbd5e0; padding: 4px 10px; border-radius: 4px;">
                <svg viewBox="0 0 24 24" style="width: 14px; height: 14px; fill: none; stroke: var(--stone); stroke-width: 2.5; margin-right: 6px;"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                <input v-model="calendarSearchQuery" type="text" placeholder="Search guide by name or ID..." style="border: none; background: transparent; outline: none; font-size: 0.8rem; width: 180px; color: var(--forest);" />
                <button v-if="calendarSearchQuery" @click="calendarSearchQuery = ''" style="background: none; border: none; color: var(--stone); cursor: pointer; font-size: 0.8rem; padding: 0 2px;">✕</button>
              </div>

              <div style="display: flex; align-items: center; gap: 0.5rem;">
                <button class="btn-ghost" style="padding: 4px 12px; font-size: 0.8rem;" @click="changeCalendarMonth(-1)">◀ Prev</button>
                <span style="font-weight: 600; font-size: 0.95rem; color: var(--forest); min-width: 120px; text-align: center;">
                  {{ getMonthName(calendarMonth) }} {{ calendarYear }}
                </span>
                <button class="btn-ghost" style="padding: 4px 12px; font-size: 0.8rem;" @click="changeCalendarMonth(1)">Next ▶</button>
              </div>
            </div>
          </div>

          <div class="calendar-table-wrap">
            <table class="calendar-table">
              <thead>
                <tr>
                  <th class="staff-name-col" style="background: #f7fafc; font-weight: bold;">Trek Guide</th>
                  <th v-for="d in daysInActiveMonth" :key="d" 
                      :class="{ 'weekend': isWeekend(d) }"
                      style="font-size: 0.74rem; padding: 6px 4px;">
                    <div>{{ d }}</div>
                    <div style="font-size: 0.65rem; color: var(--stone); margin-top: 2px; text-transform: uppercase;">{{ getWeekdayLetter(d) }}</div>
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="s in filteredCalendarStaff" :key="s.id">
                  <td class="staff-name-col">
                    <div style="display: flex; gap: 6px; align-items: center; width: 100%; overflow: hidden;">
                      <img :src="s.photoUrl" style="width: 24px; height: 24px; border-radius: 50%; object-fit: cover; flex-shrink: 0;" />
                      <div style="min-width: 0; flex: 1; overflow: hidden;">
                        <div style="font-weight: 600; font-size: 0.76rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" :title="s.name">{{ s.name }}</div>
                        <div style="font-size: 0.65rem; color: var(--stone); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">{{ s.designation }}</div>
                      </div>
                    </div>
                  </td>
                  <td v-for="d in daysInActiveMonth" :key="d"
                      :class="{ 
                        'weekend': isWeekend(d), 
                        'busy-day': isStaffBusyOnDay(s, d), 
                        'custom-blocked-day': isStaffBusyOnDay(s, d) && !getConflictTrekForDay(s, d),
                        'free-day': !isStaffBusyOnDay(s, d)
                      }"
                      class="day-cell"
                      style="height: 36px; cursor: pointer; user-select: none; padding: 0; vertical-align: middle;"
                      @click="toggleDayAvailability(s, d)"
                      @mouseenter="showTooltip($event, s, d)"
                      @mouseleave="hideTooltip">
                    <div class="availability-indicator"
                         :class="{
                           'indicator-free': !isStaffBusyOnDay(s, d),
                           'indicator-busy': isStaffBusyOnDay(s, d) && getConflictTrekForDay(s, d),
                           'indicator-blocked': isStaffBusyOnDay(s, d) && !getConflictTrekForDay(s, d)
                         }">
                    </div>
                  </td>
                </tr>
                <tr v-if="!filteredCalendarStaff.length">
                  <td :colspan="daysInActiveMonth + 1" style="text-align: center; padding: 2.5rem; color: var(--stone); font-style: italic; font-size: 0.9rem; background: #fff;">
                    No staff guides found matching your search.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Quick Date Checker (BOTTOM) -->
        <div style="background: #fff; border-radius: 6px; border: 1px solid rgba(26,46,26,.09); padding: 1.5rem;">
          <h4 style="color: var(--forest); margin: 0 0 1rem 0; font-size: 1.1rem; font-weight: 600;">
            🔍 Quick Date Range Availability Checker
          </h4>
          <div style="display: flex; flex-wrap: wrap; gap: 1rem; align-items: flex-end; margin-bottom: 1.5rem; background: #fcfdfd; border: 1px solid #edf2f7; padding: 15px; border-radius: 6px;">
            <div class="form-group" style="margin-bottom: 0; min-width: 180px; flex: 1;">
              <label style="font-weight: 600; font-size: 0.82rem; color: var(--bark);">Start Date</label>
              <input v-model="availabilityStart" type="date" style="width: 100%;" />
            </div>
            <div class="form-group" style="margin-bottom: 0; min-width: 180px; flex: 1;">
              <label style="font-weight: 600; font-size: 0.82rem; color: var(--bark);">End Date</label>
              <input v-model="availabilityEnd" type="date" style="width: 100%;" />
            </div>
            <button class="btn-primary-ts" style="height: 38px; padding: 0 24px; font-weight: 600;" @click="triggerCheckRange">
              Check Availability
            </button>
          </div>

          <!-- Availability Results list -->
          <div v-if="hasCheckedRange">
            <h5 style="color: var(--forest-mid); font-size: 1rem; margin: 1.5rem 0 0.75rem 0; font-weight: 600; display: flex; justify-content: space-between; align-items: center;">
              <span>Available Guides ({{ checkedStart }} to {{ checkedEnd }})</span>
              <span class="status-pill status-open" style="font-size: 0.76rem; padding: 4px 10px;">{{ availableStaff.length }} Free Guide{{ availableStaff.length !== 1 ? 's' : '' }}</span>
            </h5>

            <div v-if="availableStaff.length" class="ts-table-wrap">
              <table class="ts-table">
                <thead>
                  <tr>
                    <th>Guide Info</th>
                    <th>Designation</th>
                    <th>Experience</th>
                    <th>Languages</th>
                    <th>Certifications</th>
                    <th>Specialty Skills</th>
                    <th style="text-align: center;">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="s in availableStaff" :key="s.id">
                    <td>
                      <div style="display: flex; gap: 10px; align-items: center; cursor: pointer;" @click="viewStaffDetails(s)" title="Click to view full profile">
                        <img :src="s.photoUrl" style="width: 32px; height: 32px; border-radius: 50%; object-fit: cover;" />
                        <div>
                          <div style="font-weight: 600; color: var(--forest); transition: color 0.15s;" @mouseenter="$event.target.style.color = 'var(--gold)'" @mouseleave="$event.target.style.color = 'var(--forest)'">{{ s.name }}</div>
                          <div style="font-size: 0.72rem; color: var(--stone);">{{ s.memberId }}</div>
                        </div>
                      </div>
                    </td>
                    <td>{{ s.designation }}</td>
                    <td class="mono font-bold">{{ s.experience }} Years</td>
                    <td>{{ s.languages }}</td>
                    <td style="font-size: 0.82rem; color: var(--bark);">{{ s.certifications }}</td>
                    <td style="font-size: 0.82rem; color: var(--bark);">{{ s.skills }}</td>
                    <td style="text-align: center;">
                      <div class="action-btns" style="display: flex; justify-content: center; gap: 6px;">
                        <button class="act-btn act-view" style="padding: 4px 10px;" @click="viewStaffDetails(s)">
                          <svg viewBox="0 0 24 24" class="act-btn-icon"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                          View Profile
                        </button>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div v-else style="text-align: center; padding: 3rem 1rem; background: #fff5f5; border: 1px dashed #feb2b2; border-radius: 6px; color: #c53030; font-size: 0.9rem;">
              ⚠️ No staff guides are free between these dates. Try checking a different date range or adjusting existing assignments.
            </div>
          </div>
          <div v-else style="text-align: center; padding: 3rem 1rem; background: #fafafa; border: 1px dashed #e2e8f0; border-radius: 6px; color: var(--stone); font-size: 0.88rem; font-style: italic;">
            Select a start and end date and click "Check Availability" to search for free guides.
          </div>
        </div>

        <!-- Global Floating Tooltip -->
        <div v-if="calendarTooltip.show" 
             :style="{ left: calendarTooltip.x + 'px', top: calendarTooltip.y + 'px' }" 
             class="global-calendar-tooltip">
          <div v-html="calendarTooltip.content"></div>
          <div class="tooltip-arrow"></div>
        </div>
      </section>
</template>

<script>
import { adminDashComponent } from './adminDashProxy';

export default adminDashComponent('TabStaffAvailability');
</script>
