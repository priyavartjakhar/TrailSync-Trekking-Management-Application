<template>
      <section v-if="activeTab==='analytics'" class="tab-content">

        <!-- ── KEY PERFORMANCE INDICATORS ────────────────── -->
        <div class="analytics-metrics-grid">
          <div class="metric-card-kpi">
            <div class="card-title">Total Bookings</div>
            <div class="card-value">{{ allBookings.length }}</div>
            <div class="card-formula">LIVE COUNT</div>
            <div class="card-desc">Total volume of trek reservations registered on the TrailSync platform.</div>
          </div>
          <div class="metric-card-kpi">
            <div class="card-title">Confirmed Booking Rate</div>
            <div class="card-value">{{ confirmedBookingRate }}%</div>
            <div class="card-formula">Confirmed / Total Bookings × 100</div>
            <div class="card-desc">Share of bookings with a confirmed paid status in the current mock dataset.</div>
          </div>
          <div class="metric-card-kpi">
            <div class="card-title">Average Occupancy</div>
            <div class="card-value">{{ averageOccupancy }}%</div>
            <div class="card-formula">Booked Slots / Total Slots × 100</div>
            <div class="card-desc">Average capacity utilization across active and completed trek batches.</div>
          </div>
        </div>

        <!-- ── PARTICIPATION TRENDS & DISTRIBUTIONS ──────── -->
        <div class="dash-card" style="margin-bottom:1.5rem">
          <div class="dash-card-header">
            <div>
              <span class="dash-card-title">Monthly Bookings Trend</span>
              <div style="font-size:0.75rem; color:var(--stone); margin-top:2px;">
                Visualizes reservation velocity over time. Tracks seasonal growth.
                <span style="display:inline-block; font-size:0.7rem; font-family:monospace; color:var(--gold-dark); background:rgba(200,146,42,0.06); padding:1px 4px; border-radius:2px; margin-left:6px;">Metric: Sum(Bookings) Grouped By Month</span>
              </div>
            </div>
          </div>
          <div class="chart-svg-wrap">
            <svg viewBox="0 0 700 180" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:auto">
              <defs>
                <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stop-color="#c8922a" stop-opacity="0.25"/>
                  <stop offset="100%" stop-color="#c8922a" stop-opacity="0.02"/>
                </linearGradient>
              </defs>
              <line v-for="i in 4" :key="'g'+i" :x1="30" :y1="30 + (i-1)*35" :x2="670" :y2="30+(i-1)*35" class="chart-grid-line"/>
              <path :d="buildAreaPath(monthlyBookings,'count',700,180,30)" class="chart-area-fill"/>
              <path :d="buildLinePath(monthlyBookings,'count',700,180,30)" class="chart-line-path"/>
              
              <!-- Hover Guide Line -->
              <line
                v-if="hoveredMonthlyBooking"
                :x1="hoveredMonthlyBooking.x"
                y1="30"
                :x2="hoveredMonthlyBooking.x"
                y2="150"
                stroke="var(--gold)"
                stroke-width="1.2"
                stroke-dasharray="3,3"
              />

              <!-- Render dots and axis labels -->
              <g v-for="(m,i) in monthlyBookings" :key="'dot'+i">
                <circle
                  :cx="30 + (i/(monthlyBookings.length-1))*(700-60)"
                  :cy="180 - 30 - (m.count/maxMonthly)*(180-60)"
                  :r="hoveredMonthlyBooking && hoveredMonthlyBooking.index === i ? 5.5 : 3.5"
                  :style="{ fill: hoveredMonthlyBooking && hoveredMonthlyBooking.index === i ? 'var(--gold-light)' : 'var(--gold)' }"
                  class="chart-dot"
                />
                <!-- Invisible hover capture target -->
                <circle
                  :cx="30 + (i/(monthlyBookings.length-1))*(700-60)"
                  :cy="180 - 30 - (m.count/maxMonthly)*(180-60)"
                  r="16"
                  fill="transparent"
                  style="cursor: pointer;"
                  @mouseenter="hoveredMonthlyBooking = { x: 30 + (i/(monthlyBookings.length-1))*(700-60), y: 180 - 30 - (m.count/maxMonthly)*(180-60), data: m, index: i }"
                  @mouseleave="hoveredMonthlyBooking = null"
                />
                <text
                  :x="30 + (i/(monthlyBookings.length-1))*(700-60)"
                  y="172" text-anchor="middle" class="chart-axis-label">{{ m.month }} ({{ m.count }})</text>
              </g>

              <!-- Line Chart Tooltip -->
              <g v-if="hoveredMonthlyBooking" style="pointer-events: none;">
                <rect
                  :x="Math.max(10, Math.min(570, hoveredMonthlyBooking.x - 60))"
                  :y="Math.max(10, hoveredMonthlyBooking.y - 45)"
                  width="120"
                  height="36"
                  rx="5"
                  fill="var(--forest)"
                  stroke="var(--gold)"
                  stroke-width="1.5"
                  opacity="0.95"
                  style="filter: drop-shadow(0 2px 4px rgba(0,0,0,0.15));"
                />
                <text
                  :x="Math.max(10, Math.min(570, hoveredMonthlyBooking.x - 60)) + 60"
                  :y="Math.max(10, hoveredMonthlyBooking.y - 45) + 14"
                  text-anchor="middle"
                  fill="white"
                  font-size="8.5"
                  font-weight="700"
                  font-family="'DM Sans', sans-serif"
                >
                  {{ hoveredMonthlyBooking.data.month }}
                </text>
                <text
                  :x="Math.max(10, Math.min(570, hoveredMonthlyBooking.x - 60)) + 60"
                  :y="Math.max(10, hoveredMonthlyBooking.y - 45) + 27"
                  text-anchor="middle"
                  fill="var(--gold)"
                  font-size="9"
                  font-weight="800"
                  font-family="'Space Mono', monospace"
                >
                  {{ hoveredMonthlyBooking.data.count }} Bookings
                </text>
              </g>
            </svg>
          </div>
        </div>

        <div class="charts-split-layout">
          <!-- Difficulty Donut Chart -->
          <div class="dash-card">
            <div class="dash-card-header">
              <div>
                <span class="dash-card-title">Difficulty Wise Participation</span>
                <div style="font-size:0.75rem; color:var(--stone); margin-top:2px;">
                  User preference share mapped by trek difficulty ratings.
                  <span style="display:inline-block; font-size:0.7rem; font-family:monospace; color:var(--gold-dark); background:rgba(200,146,42,0.06); padding:1px 4px; border-radius:2px; margin-left:6px;">Formula: (Bookings in Level / Total Bookings) × 100</span>
                </div>
              </div>
            </div>
            <div class="donut-wrapper-flex">
              <svg viewBox="0 0 36 36" style="width: 130px; height: 130px;">
                <!-- Background gray ring -->
                <circle cx="18" cy="18" r="15.915" fill="none" stroke="var(--stone-light)" stroke-width="3.5"></circle>
                <!-- Easy Segment -->
                <circle cx="18" cy="18" r="15.915" fill="none" stroke="var(--green)" stroke-width="3.5"
                  :stroke-dasharray="diffDonutData.easy + ' ' + (100 - diffDonutData.easy)" stroke-dashoffset="0" transform="rotate(-90 18 18)"
                  class="interactive-segment"
                  :style="{ strokeWidth: hoveredDifficulty && hoveredDifficulty.name === 'Easy' ? '4.5px' : '3.5' }"
                  @mouseenter="hoveredDifficulty = { name: 'Easy', pct: diffDonutData.easy }"
                  @mouseleave="hoveredDifficulty = null"
                ></circle>
                <!-- Moderate Segment -->
                <circle cx="18" cy="18" r="15.915" fill="none" stroke="var(--gold)" stroke-width="3.5"
                  :stroke-dasharray="diffDonutData.mod + ' ' + (100 - diffDonutData.mod)" :stroke-dashoffset="diffDonutData.offsetMod" transform="rotate(-90 18 18)"
                  class="interactive-segment"
                  :style="{ strokeWidth: hoveredDifficulty && hoveredDifficulty.name === 'Moderate' ? '4.5px' : '3.5' }"
                  @mouseenter="hoveredDifficulty = { name: 'Moderate', pct: diffDonutData.mod }"
                  @mouseleave="hoveredDifficulty = null"
                ></circle>
                <!-- Hard Segment -->
                <circle cx="18" cy="18" r="15.915" fill="none" stroke="var(--red)" stroke-width="3.5"
                  :stroke-dasharray="diffDonutData.hard + ' ' + (100 - diffDonutData.hard)" :stroke-dashoffset="diffDonutData.offsetHard" transform="rotate(-90 18 18)"
                  class="interactive-segment"
                  :style="{ strokeWidth: hoveredDifficulty && hoveredDifficulty.name === 'Hard' ? '4.5px' : '3.5' }"
                  @mouseenter="hoveredDifficulty = { name: 'Hard', pct: diffDonutData.hard }"
                  @mouseleave="hoveredDifficulty = null"
                ></circle>
                
                <text x="18" y="18" text-anchor="middle" fill="var(--forest)">
                  <tspan x="18" dy="-1" font-size="2.8" font-weight="800">{{ hoveredDifficulty ? hoveredDifficulty.name : 'SHARE' }}</tspan>
                  <tspan x="18" dy="3.8" font-size="3.5" font-weight="800" fill="var(--gold-dark)">{{ hoveredDifficulty ? hoveredDifficulty.pct + '%' : 'DIFF' }}</tspan>
                </text>
              </svg>
              <div class="donut-legend">
                <div class="legend-item" 
                  :style="{ opacity: hoveredDifficulty && hoveredDifficulty.name !== 'Easy' ? 0.4 : 1, transform: hoveredDifficulty && hoveredDifficulty.name === 'Easy' ? 'scale(1.05) translateX(3px)' : 'none', transition: 'all 0.2s' }"
                  @mouseenter="hoveredDifficulty = { name: 'Easy', pct: diffDonutData.easy }"
                  @mouseleave="hoveredDifficulty = null"
                ><span class="legend-color" style="background:var(--green)"></span><span>Easy: {{ diffDonutData.easy }}%</span></div>
                <div class="legend-item"
                  :style="{ opacity: hoveredDifficulty && hoveredDifficulty.name !== 'Moderate' ? 0.4 : 1, transform: hoveredDifficulty && hoveredDifficulty.name === 'Moderate' ? 'scale(1.05) translateX(3px)' : 'none', transition: 'all 0.2s' }"
                  @mouseenter="hoveredDifficulty = { name: 'Moderate', pct: diffDonutData.mod }"
                  @mouseleave="hoveredDifficulty = null"
                ><span class="legend-color" style="background:var(--gold)"></span><span>Moderate: {{ diffDonutData.mod }}%</span></div>
                <div class="legend-item"
                  :style="{ opacity: hoveredDifficulty && hoveredDifficulty.name !== 'Hard' ? 0.4 : 1, transform: hoveredDifficulty && hoveredDifficulty.name === 'Hard' ? 'scale(1.05) translateX(3px)' : 'none', transition: 'all 0.2s' }"
                  @mouseenter="hoveredDifficulty = { name: 'Hard', pct: diffDonutData.hard }"
                  @mouseleave="hoveredDifficulty = null"
                ><span class="legend-color" style="background:var(--red)"></span><span>Hard: {{ diffDonutData.hard }}%</span></div>
              </div>
            </div>
          </div>

          <!-- Booking Outcomes Donut Chart -->
          <div class="dash-card">
            <div class="dash-card-header">
              <div>
                <span class="dash-card-title">Booking Status Distribution</span>
                <div style="font-size:0.75rem; color:var(--stone); margin-top:2px;">
                  Breakdown of booking final status and Cancellation Rate.
                  <span style="display:inline-block; font-size:0.7rem; font-family:monospace; color:var(--gold-dark); background:rgba(200,146,42,0.06); padding:1px 4px; border-radius:2px; margin-left:6px;">Formula: Cancel Rate = (Cancelled / Total) × 100</span>
                </div>
              </div>
            </div>
            <div class="donut-wrapper-flex">
              <svg viewBox="0 0 36 36" style="width: 130px; height: 130px;">
                <circle cx="18" cy="18" r="15.915" fill="none" stroke="var(--stone-light)" stroke-width="3.5"></circle>
                <!-- Booked (Paid) Segment -->
                <circle cx="18" cy="18" r="15.915" fill="none" stroke="var(--green)" stroke-width="3.5"
                  :stroke-dasharray="statusDonutData.booked + ' ' + (100 - statusDonutData.booked)" stroke-dashoffset="0" transform="rotate(-90 18 18)"
                  class="interactive-segment"
                  :style="{ strokeWidth: hoveredBookingStatus && hoveredBookingStatus.name === 'Booked' ? '4.5px' : '3.5' }"
                  @mouseenter="hoveredBookingStatus = { name: 'Booked', pct: statusDonutData.booked }"
                  @mouseleave="hoveredBookingStatus = null"
                ></circle>
                <!-- Unpaid (Pending) Segment -->
                <circle cx="18" cy="18" r="15.915" fill="none" stroke="var(--gold)" stroke-width="3.5"
                  :stroke-dasharray="statusDonutData.pending + ' ' + (100 - statusDonutData.pending)" :stroke-dashoffset="statusDonutData.offsetPending" transform="rotate(-90 18 18)"
                  class="interactive-segment"
                  :style="{ strokeWidth: hoveredBookingStatus && hoveredBookingStatus.name === 'Pending' ? '4.5px' : '3.5' }"
                  @mouseenter="hoveredBookingStatus = { name: 'Pending', pct: statusDonutData.pending }"
                  @mouseleave="hoveredBookingStatus = null"
                ></circle>
                <!-- Cancelled Segment -->
                <circle cx="18" cy="18" r="15.915" fill="none" stroke="var(--red)" stroke-width="3.5"
                  :stroke-dasharray="statusDonutData.cancelled + ' ' + (100 - statusDonutData.cancelled)" :stroke-dashoffset="statusDonutData.offsetCancelled" transform="rotate(-90 18 18)"
                  class="interactive-segment"
                  :style="{ strokeWidth: hoveredBookingStatus && hoveredBookingStatus.name === 'Cancelled' ? '4.5px' : '3.5' }"
                  @mouseenter="hoveredBookingStatus = { name: 'Cancelled', pct: statusDonutData.cancelled }"
                  @mouseleave="hoveredBookingStatus = null"
                ></circle>
                
                <text x="18" y="18" text-anchor="middle" fill="var(--forest)">
                  <tspan x="18" dy="-1" font-size="2.6" font-weight="800">{{ hoveredBookingStatus ? hoveredBookingStatus.name : 'STATUS' }}</tspan>
                  <tspan x="18" dy="3.8" font-size="3.5" font-weight="800" fill="var(--gold-dark)">{{ hoveredBookingStatus ? hoveredBookingStatus.pct + '%' : 'DIST' }}</tspan>
                </text>
              </svg>
              <div class="donut-legend">
                <div class="legend-item"
                  :style="{ opacity: hoveredBookingStatus && hoveredBookingStatus.name !== 'Booked' ? 0.4 : 1, transform: hoveredBookingStatus && hoveredBookingStatus.name === 'Booked' ? 'scale(1.05) translateX(3px)' : 'none', transition: 'all 0.2s' }"
                  @mouseenter="hoveredBookingStatus = { name: 'Booked', pct: statusDonutData.booked }"
                  @mouseleave="hoveredBookingStatus = null"
                ><span class="legend-color" style="background:var(--green)"></span><span>Booked: {{ statusDonutData.booked }}%</span></div>
                <div class="legend-item"
                  :style="{ opacity: hoveredBookingStatus && hoveredBookingStatus.name !== 'Pending' ? 0.4 : 1, transform: hoveredBookingStatus && hoveredBookingStatus.name === 'Pending' ? 'scale(1.05) translateX(3px)' : 'none', transition: 'all 0.2s' }"
                  @mouseenter="hoveredBookingStatus = { name: 'Pending', pct: statusDonutData.pending }"
                  @mouseleave="hoveredBookingStatus = null"
                ><span class="legend-color" style="background:var(--gold)"></span><span>Pending: {{ statusDonutData.pending }}%</span></div>
                <div class="legend-item"
                  :style="{ opacity: hoveredBookingStatus && hoveredBookingStatus.name !== 'Cancelled' ? 0.4 : 1, transform: hoveredBookingStatus && hoveredBookingStatus.name === 'Cancelled' ? 'scale(1.05) translateX(3px)' : 'none', transition: 'all 0.2s' }"
                  @mouseenter="hoveredBookingStatus = { name: 'Cancelled', pct: statusDonutData.cancelled }"
                  @mouseleave="hoveredBookingStatus = null"
                ><span class="legend-color" style="background:var(--red)"></span><span>Cancelled: {{ statusDonutData.cancelled }}%</span></div>
                <div style="font-size: 0.72rem; color: var(--stone); border-top: 1px solid var(--stone-light); padding-top: 4px; margin-top: 4px;">
                  Cancel Rate: {{ bookingStatusDist.cancelRate }}%
                  <br><span style="font-size:0.6rem;">(Cancelled / Total × 100)</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- ── POPULARITY & REGIONAL DEMAND ────────────── -->
        <div class="charts-split-layout">
          <!-- Trek Popularity Horizontal Bar Chart -->
          <div class="dash-card">
            <div class="dash-card-header">
              <div>
                <span class="dash-card-title">Trek Popularity Analysis (Yearly)</span>
                <div style="font-size:0.75rem; color:var(--stone); margin-top:2px;">
                  Top performing routes by total reservations.
                  <span style="display:inline-block; font-size:0.7rem; font-family:monospace; color:var(--gold-dark); background:rgba(200,146,42,0.06); padding:1px 4px; border-radius:2px; margin-left:6px;">Metric: SUM(Bookings) Grouped By Trek</span>
                </div>
              </div>
            </div>
            <div class="chart-bars" style="margin-top: 1rem;">
              <div v-for="t in popularTreksWithMock" :key="t.name" class="chart-bar-item interactive-bar-item" style="margin-bottom: 0.75rem;">
                <div class="chart-bar-label" style="font-size:0.8rem; font-weight:600;">{{ t.name }}</div>
                <div class="chart-bar-track" style="height: 12px; border-radius: 6px;">
                  <div class="chart-bar-fill" :style="{ width: (t.bookings/maxPopularBookings*100)+'%', background: 'var(--gold)' }" style="border-radius: 6px;"></div>
                </div>
                <div class="chart-bar-value" style="font-size:0.78rem; width: auto; min-width: 60px;">{{ t.bookings }} pax</div>
              </div>
            </div>
          </div>

          <!-- Location Wise Demand Bar Chart -->
          <div class="dash-card">
            <div class="dash-card-header">
              <div>
                <span class="dash-card-title">Location Wise Demand</span>
                <div style="font-size:0.75rem; color:var(--stone); margin-top:2px;">
                  Regional demand distribution based on route states.
                  <span style="display:inline-block; font-size:0.7rem; font-family:monospace; color:var(--gold-dark); background:rgba(200,146,42,0.06); padding:1px 4px; border-radius:2px; margin-left:6px;">Metric: Participants Grouped By State</span>
                </div>
              </div>
            </div>
            <div class="chart-bars" style="margin-top: 1rem; max-height: 280px; overflow-y: auto; padding-right: 6px;">
              <div v-for="l in locationDemand" :key="l.state" class="chart-bar-item interactive-bar-item" style="margin-bottom: 0.75rem;">
                <div class="chart-bar-label" style="font-size:0.8rem; font-weight:600;">{{ l.state }}</div>
                <div class="chart-bar-track" style="height: 12px; border-radius: 6px;">
                  <div class="chart-bar-fill" :style="{ width: (l.count/maxLocationDemand*100)+'%', background: 'var(--forest-mid)' }" style="border-radius: 6px;"></div>
                </div>
                <div class="chart-bar-value" style="font-size:0.78rem; width: auto; min-width: 60px;">{{ l.count }} pax</div>
              </div>
            </div>
          </div>
        </div>

        <!-- ── CAPACITY & PLANNING ──────────────────────── -->
        <div class="charts-split-layout">
          <!-- Occupancy Progress Bars -->
          <div class="dash-card">
            <div class="dash-card-header">
              <div>
                <span class="dash-card-title">Capacity Occupancy Rate Per Trek</span>
                <div style="font-size:0.75rem; color:var(--stone); margin-top:2px;">
                  Helps plan batch sizes.
                  <span style="display:inline-block; font-size:0.7rem; font-family:monospace; color:var(--gold-dark); background:rgba(200,146,42,0.06); padding:1px 4px; border-radius:2px; margin-left:6px;">Formula: Occupancy = Booked Slots / Total Slots × 100</span>
                </div>
              </div>
            </div>
            <div class="occ-list" style="margin-top: 1rem;">
              <div v-for="s in occupancyRatePerTrek" :key="s.name" class="occ-item interactive-bar-item" style="margin-bottom:0.75rem; padding: 4px; border-radius: 4px;">
                <div class="occ-meta" style="display:flex; justify-content:space-between; font-size:0.8rem; margin-bottom:4px;">
                  <span class="occ-trek" style="font-weight:600; color:var(--forest)">{{ s.name }}</span>
                  <span class="occ-pct font-mono" style="font-weight:700;">{{ s.booked }}/{{ s.total }} ({{ s.pct }}%)</span>
                </div>
                <div class="occ-bar-track" style="height: 10px; border-radius: 5px; background: var(--stone-light);">
                  <div class="occ-bar-fill" :class="occColor(s.pct)" :style="{ width: s.pct+'%' }" style="height:10px; border-radius:5px;"></div>
                </div>
              </div>
            </div>
          </div>

          <!-- Upcoming Treks Seats Inventory -->
          <div class="dash-card">
            <div class="dash-card-header">
              <div>
                <span class="dash-card-title">Upcoming Departures Seat Inventory</span>
                <div style="font-size:0.75rem; color:var(--stone); margin-top:2px;">
                  Provides lookahead visibility into upcoming trek dates.
                  <span style="display:inline-block; font-size:0.7rem; font-family:monospace; color:var(--gold-dark); background:rgba(200,146,42,0.06); padding:1px 4px; border-radius:2px; margin-left:6px;">Formula: Seats Left = Total Slots - Booked Slots</span>
                </div>
              </div>
            </div>
            <div class="ts-table-wrap" style="margin-top: 1rem; max-height: 250px; overflow-y: auto;">
              <table class="ts-table" style="font-size: 0.8rem;">
                <thead>
                  <tr>
                    <th>Trek Batch</th>
                    <th>Date</th>
                    <th>Guide</th>
                    <th>Filled</th>
                    <th>Seats Left</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="ut in enrichedUpcomingTreks" :key="ut.name+ut.startDate">
                    <td style="font-weight:600; color:var(--forest)">{{ ut.name }}</td>
                    <td class="mono">{{ ut.startDate }}</td>
                    <td>{{ ut.staff }}</td>
                    <td class="mono" style="text-align:center;">{{ ut.bookedSlots }}</td>
                    <td class="mono" style="text-align:center;"><span :class="['status-pill', ut.remainingSlots <= 5 ? 'status-closed':'status-open']" style="font-size:0.7rem; padding: 2px 6px;">{{ ut.remainingSlots }} left</span></td>
                  </tr>
                  <tr v-if="!enrichedUpcomingTreks.length">
                    <td colspan="5" style="text-align:center; padding:1.5rem; color:var(--stone)">No upcoming departures starting soon.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- ── STAFF PERFORMANCE LEADERBOARD ───────────── -->
        <div class="dash-card">
          <div class="dash-card-header">
            <div>
              <span class="dash-card-title">Staff Performance Analytics Leaderboard</span>
              <div style="font-size:0.75rem; color:var(--stone); margin-top:2px;">
                Evaluates field staff performance metrics. Highlights top three performant staff members based on total participants led.
                <span style="display:inline-block; font-size:0.7rem; font-family:monospace; color:var(--gold-dark); background:rgba(200,146,42,0.06); padding:1px 4px; border-radius:2px; margin-left:6px;">Avg Occupancy = Booked / Slots | Completion Rate = Completed / Assigned</span>
              </div>
            </div>
          </div>
          <div class="ts-table-wrap" style="margin-top: 1rem;">
            <table class="ts-table">
              <thead>
                <tr>
                  <th style="width: 50px; text-align: center;">Rank</th>
                  <th>Guide Name</th>
                  <th style="text-align: center;">Treks Managed</th>
                  <th style="text-align: center;">Total Participants</th>
                  <th style="text-align: center;">Avg Occupancy</th>
                  <th style="text-align: center;">Completion Rate</th>
                  <th style="text-align: center;">User Rating</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(s, index) in staffLeaderboard" :key="s.name" :class="'leaderboard-row-' + (index + 1)">
                  <td style="text-align: center; font-weight: 700;">
                    <span v-if="index === 0" class="leaderboard-badge">🥇</span>
                    <span v-else-if="index === 1" class="leaderboard-badge">🥈</span>
                    <span v-else-if="index === 2" class="leaderboard-badge">🥉</span>
                    <span v-else>{{ index + 1 }}</span>
                  </td>
                  <td>
                    <div style="display:flex; align-items:center; gap:8px;">
                      <img :src="s.photoUrl" style="width:28px; height:28px; border-radius:50%; object-fit:cover;" />
                      <span style="font-weight: 600; color: var(--forest);">{{ s.name }}</span>
                    </div>
                  </td>
                  <td class="mono" style="text-align: center; font-weight: 600;">{{ s.treks }}</td>
                  <td class="mono" style="text-align: center; font-weight: 600;">{{ s.participants }}</td>
                  <td class="mono" style="text-align: center;">{{ s.avgOccupancy }}%</td>
                  <td class="mono" style="text-align: center;">{{ s.completionRate }}%</td>
                  <td class="mono" style="text-align: center;"><span style="color:var(--gold-dark); font-weight:700;">★ {{ s.rating }}</span></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

      </section>
</template>

<script>
import { adminDashComponent } from './adminDashProxy';

export default adminDashComponent('TabAnalytics');
</script>
