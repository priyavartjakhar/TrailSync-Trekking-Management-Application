<template>
      <section v-if="activeTab==='revenue'" class="tab-content">

        <!-- KPI Metrics Grid -->
        <div class="analytics-metrics-grid" style="margin-bottom: 1.5rem;">
          <div class="metric-card-kpi">
            <div class="card-title">Total Revenue</div>
            <div class="card-value">₹{{ revenueKPIs.total.toLocaleString() }}</div>
            <div class="card-formula">Formula: SUM(amount_paid)</div>
            <div class="card-desc">Total cumulative revenue received from completed and active bookings.</div>
          </div>
          <div class="metric-card-kpi">
            <div class="card-title">Monthly Revenue</div>
            <div class="card-value">₹{{ revenueKPIs.monthly.toLocaleString() }}</div>
            <div class="card-formula">Formula: Current Month paid</div>
            <div class="card-desc">Total revenue collected in the current calendar month.</div>
          </div>
          <div class="metric-card-kpi">
            <div class="card-title">Avg Revenue Per Trek</div>
            <div class="card-value">₹{{ revenueKPIs.avgPerTrek.toLocaleString() }}</div>
            <div class="card-formula">Formula: Revenue / Treks</div>
            <div class="card-desc">Average billing collected per scheduled trek batch.</div>
          </div>
          <div class="metric-card-kpi">
            <div class="card-title">Avg Revenue Per User</div>
            <div class="card-value">₹{{ revenueKPIs.avgPerUser.toLocaleString() }}</div>
            <div class="card-formula">Formula: Revenue / Users</div>
            <div class="card-desc">Average lifetime value (LTV) spent per registered trekker.</div>
          </div>
          <div class="metric-card-kpi">
            <div class="card-title">Pending Payments</div>
            <div class="card-value" style="color: var(--gold-dark);">₹{{ revenueKPIs.pending.toLocaleString() }}</div>
            <div class="card-formula">Formula: SUM(unpaid amounts)</div>
            <div class="card-desc">Accounts receivable currently pending from offline/pending bookings.</div>
          </div>
        </div>

        <!-- Revenue Growth Chart -->
        <div class="dash-card" style="margin-bottom: 1.5rem;">
          <div class="dash-card-header">
            <div>
              <span class="dash-card-title">Revenue Growth Trend</span>
              <div style="font-size:0.75rem; color:var(--stone); margin-top:2px;">
                Shows monthly business revenue from the seeded bookings in the mock database.
                <span style="display:inline-block; font-size:0.7rem; font-family:monospace; color:var(--gold-dark); background:rgba(200,146,42,0.06); padding:1px 4px; border-radius:2px; margin-left:6px;">Metric: SUM(amount_paid) Grouped By Month</span>
              </div>
            </div>
            <div class="forecast-badge" style="background: var(--cream); border: 1px solid var(--gold-mid); padding: 6px 12px; border-radius: 4px; font-size: 0.8rem; font-weight: 700; color: var(--forest);">
              Latest Month: ₹{{ revenueGrowthData.length ? revenueGrowthData[revenueGrowthData.length - 1].amount.toLocaleString() : '0' }}
            </div>
          </div>
          <div class="chart-svg-wrap">
            <svg viewBox="0 0 700 180" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:auto">
              <defs>
                <linearGradient id="revAreaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stop-color="#1a2e1a" stop-opacity="0.2"/>
                  <stop offset="100%" stop-color="#1a2e1a" stop-opacity="0.01"/>
                </linearGradient>
              </defs>
              <line v-for="i in 4" :key="'rg'+i" :x1="30" :y1="30 + (i-1)*35" :x2="670" :y2="30+(i-1)*35" class="chart-grid-line"/>
              <!-- Area fill for historical line -->
              <path :d="buildAreaPath(revenueGrowthData, 'amount', 700, 180, 30)" fill="url(#revAreaGrad)"/>
              <!-- Solid line for historical -->
              <path :d="buildLinePath(revenueGrowthData, 'amount', 700, 180, 30)" class="chart-line-path"/>
              
              <!-- Hover Guide Line -->
              <line
                v-if="hoveredRevenueGrowth"
                :x1="hoveredRevenueGrowth.x"
                y1="30"
                :x2="hoveredRevenueGrowth.x"
                y2="150"
                stroke="var(--gold)"
                stroke-width="1.2"
                stroke-dasharray="3,3"
              />

              <!-- Draw circles and labels -->
              <g v-for="(r,i) in revenueGrowthData" :key="'revdot'+i">
                <circle
                  :cx="30 + (i/(revenueGrowthData.length-1))*(700-60)"
                  :cy="180 - 30 - (r.amount/maxRevenueGrowthAmount)*(180-60)"
                  :r="hoveredRevenueGrowth && hoveredRevenueGrowth.index === i ? 6.5 : 3.5" 
                  :style="{
                    fill: hoveredRevenueGrowth && hoveredRevenueGrowth.index === i ? 'var(--gold-light)' : 'var(--forest)',
                    stroke: 'white',
                    strokeWidth: '1px'
                  }"
                  class="chart-dot"
                />
                <!-- Invisible hover capture target -->
                <circle
                  :cx="30 + (i/(revenueGrowthData.length-1))*(700-60)"
                  :cy="180 - 30 - (r.amount/maxRevenueGrowthAmount)*(180-60)"
                  r="16"
                  fill="transparent"
                  style="cursor: pointer;"
                  @mouseenter="hoveredRevenueGrowth = { x: 30 + (i/(revenueGrowthData.length-1))*(700-60), y: 180 - 30 - (r.amount/maxRevenueGrowthAmount)*(180-60), data: r, index: i }"
                  @mouseleave="hoveredRevenueGrowth = null"
                />
                <text
                  :x="30 + (i/(revenueGrowthData.length-1))*(700-60)"
                  y="172" text-anchor="middle" class="chart-axis-label">{{ r.month }} (₹{{ (r.amount/1000).toFixed(0) }}k)</text>
              </g>

              <!-- Line Chart Tooltip -->
              <g v-if="hoveredRevenueGrowth" style="pointer-events: none;">
                <rect
                  :x="Math.max(10, Math.min(570, hoveredRevenueGrowth.x - 65))"
                  :y="Math.max(10, hoveredRevenueGrowth.y - 45)"
                  width="130"
                  height="36"
                  rx="5"
                  fill="var(--forest)"
                  stroke="var(--gold)"
                  stroke-width="1.5"
                  opacity="0.95"
                  style="filter: drop-shadow(0 2px 4px rgba(0,0,0,0.15));"
                />
                <text
                  :x="Math.max(10, Math.min(570, hoveredRevenueGrowth.x - 65)) + 65"
                  :y="Math.max(10, hoveredRevenueGrowth.y - 45) + 14"
                  text-anchor="middle"
                  fill="white"
                  font-size="8.5"
                  font-weight="700"
                  font-family="'DM Sans', sans-serif"
                >
                  {{ hoveredRevenueGrowth.data.month }}
                </text>
                <text
                  :x="Math.max(10, Math.min(570, hoveredRevenueGrowth.x - 65)) + 65"
                  :y="Math.max(10, hoveredRevenueGrowth.y - 45) + 27"
                  text-anchor="middle"
                  fill="var(--gold)"
                  font-size="9"
                  font-weight="800"
                  font-family="'Space Mono', monospace"
                >
                  ₹{{ hoveredRevenueGrowth.data.amount.toLocaleString() }}
                </text>
              </g>
            </svg>
          </div>
        </div>

        <!-- split: Revenue by Trek & Revenue by Location -->
        <div class="charts-split-layout" style="margin-bottom: 1.5rem;">
          <!-- Revenue by Trek -->
            <div class="dash-card">
              <div class="dash-card-header">
                <div>
                  <span class="dash-card-title">Revenue by Trek</span>
                  <div style="font-size:0.75rem; color:var(--stone); margin-top:2px;">
                  Top performing treks by total billing collected.
                  <span style="display:inline-block; font-size:0.7rem; font-family:monospace; color:var(--gold-dark); background:rgba(200,146,42,0.06); padding:1px 4px; border-radius:2px; margin-left:6px;">Formula: SUM(amount_paid) GROUP BY trek</span>
                </div>
                </div>
              </div>
            <div class="chart-bars" style="margin-top: 1rem; max-height: 280px; overflow-y: auto; padding-right: 6px;">
              <div v-for="t in revenueByTrek" :key="t.name" class="chart-bar-item interactive-bar-item" style="margin-bottom: 0.75rem;">
                <div class="chart-bar-label" style="font-size:0.8rem; font-weight:600;">{{ t.name }}</div>
                <div class="chart-bar-track" style="height: 12px; border-radius: 6px;">
                  <div class="chart-bar-fill" :style="{ width: (t.amount/maxRevenueByTrek*100)+'%', background: 'var(--gold)' }" style="border-radius: 6px;"></div>
                </div>
                <div class="chart-bar-value" style="font-size:0.78rem; width: auto; min-width: 80px;">₹{{ t.amount.toLocaleString() }}</div>
              </div>
            </div>
          </div>

          <!-- Revenue by Location -->
            <div class="dash-card">
              <div class="dash-card-header">
                <div>
                  <span class="dash-card-title">Revenue by Location</span>
                <div style="font-size:0.75rem; color:var(--stone); margin-top:2px;">
                  Regional billing totals grouped by route states.
                  <span style="display:inline-block; font-size:0.7rem; font-family:monospace; color:var(--gold-dark); background:rgba(200,146,42,0.06); padding:1px 4px; border-radius:2px; margin-left:6px;">Formula: SUM(amount_paid) GROUP BY State</span>
                </div>
                </div>
              </div>
            <div class="chart-bars" style="margin-top: 1rem; max-height: 280px; overflow-y: auto; padding-right: 6px;">
              <div v-for="l in revenueByLocation" :key="l.state" class="chart-bar-item interactive-bar-item" style="margin-bottom: 0.75rem;">
                <div class="chart-bar-label" style="font-size:0.8rem; font-weight:600;">{{ l.state }}</div>
                <div class="chart-bar-track" style="height: 12px; border-radius: 6px;">
                  <div class="chart-bar-fill" :style="{ width: (l.amount/maxRevenueByLocation*100)+'%', background: 'var(--forest-mid)' }" style="border-radius: 6px;"></div>
                </div>
                <div class="chart-bar-value" style="font-size:0.78rem; width: auto; min-width: 80px;">₹{{ l.amount.toLocaleString() }}</div>
              </div>
            </div>
          </div>
        </div>

        <!-- split: Payment Status Distribution & Revenue Per Difficulty -->
        <div class="charts-split-layout" style="margin-bottom: 1.5rem;">
          <!-- Payment Status Distribution -->
          <div class="dash-card">
            <div class="dash-card-header">
              <div>
                <span class="dash-card-title">Payment Status Share</span>
                <div style="font-size:0.75rem; color:var(--stone); margin-top:2px;">
                  Distributing volume share across payment outcomes.
                  <span style="display:inline-block; font-size:0.7rem; font-family:monospace; color:var(--gold-dark); background:rgba(200,146,42,0.06); padding:1px 4px; border-radius:2px; margin-left:6px;">Formula: (Count / Total Bookings) × 100</span>
                </div>
              </div>
            </div>
            <div class="donut-wrapper-flex">
              <svg viewBox="0 0 36 36" style="width: 130px; height: 130px;">
                <circle cx="18" cy="18" r="15.915" fill="none" stroke="var(--stone-light)" stroke-width="3.5"></circle>
                <!-- Paid Segment -->
                <circle cx="18" cy="18" r="15.915" fill="none" stroke="var(--green)" stroke-width="3.5"
                  :stroke-dasharray="paymentStatusDist.paid + ' ' + (100 - paymentStatusDist.paid)" stroke-dashoffset="0" transform="rotate(-90 18 18)"
                  class="interactive-segment"
                  :style="{ strokeWidth: hoveredPaymentStatus && hoveredPaymentStatus.name === 'Paid' ? '4.5px' : '3.5' }"
                  @mouseenter="hoveredPaymentStatus = { name: 'Paid', pct: paymentStatusDist.paid }"
                  @mouseleave="hoveredPaymentStatus = null"
                ></circle>
                <!-- Pending Segment -->
                <circle cx="18" cy="18" r="15.915" fill="none" stroke="var(--gold)" stroke-width="3.5"
                  :stroke-dasharray="paymentStatusDist.pending + ' ' + (100 - paymentStatusDist.pending)" :stroke-dashoffset="paymentStatusDist.offsetPending" transform="rotate(-90 18 18)"
                  class="interactive-segment"
                  :style="{ strokeWidth: hoveredPaymentStatus && hoveredPaymentStatus.name === 'Pending' ? '4.5px' : '3.5' }"
                  @mouseenter="hoveredPaymentStatus = { name: 'Pending', pct: paymentStatusDist.pending }"
                  @mouseleave="hoveredPaymentStatus = null"
                ></circle>
                <!-- Failed Segment -->
                <circle cx="18" cy="18" r="15.915" fill="none" stroke="var(--red)" stroke-width="3.5"
                  :stroke-dasharray="paymentStatusDist.failed + ' ' + (100 - paymentStatusDist.failed)" :stroke-dashoffset="paymentStatusDist.offsetFailed" transform="rotate(-90 18 18)"
                  class="interactive-segment"
                  :style="{ strokeWidth: hoveredPaymentStatus && hoveredPaymentStatus.name === 'Failed' ? '4.5px' : '3.5' }"
                  @mouseenter="hoveredPaymentStatus = { name: 'Failed', pct: paymentStatusDist.failed }"
                  @mouseleave="hoveredPaymentStatus = null"
                ></circle>
                
                <text x="18" y="18" text-anchor="middle" fill="var(--forest)">
                  <tspan x="18" dy="-1" font-size="2.6" font-weight="800">{{ hoveredPaymentStatus ? hoveredPaymentStatus.name : 'STATUS' }}</tspan>
                  <tspan x="18" dy="3.8" font-size="3.5" font-weight="800" fill="var(--gold-dark)">{{ hoveredPaymentStatus ? hoveredPaymentStatus.pct + '%' : 'SHARE' }}</tspan>
                </text>
              </svg>
              <div class="donut-legend">
                <div class="legend-item"
                  :style="{ opacity: hoveredPaymentStatus && hoveredPaymentStatus.name !== 'Paid' ? 0.4 : 1, transform: hoveredPaymentStatus && hoveredPaymentStatus.name === 'Paid' ? 'scale(1.05) translateX(3px)' : 'none', transition: 'all 0.2s' }"
                  @mouseenter="hoveredPaymentStatus = { name: 'Paid', pct: paymentStatusDist.paid }"
                  @mouseleave="hoveredPaymentStatus = null"
                ><span class="legend-color" style="background:var(--green)"></span><span>Paid: {{ paymentStatusDist.paid }}%</span></div>
                <div class="legend-item"
                  :style="{ opacity: hoveredPaymentStatus && hoveredPaymentStatus.name !== 'Pending' ? 0.4 : 1, transform: hoveredPaymentStatus && hoveredPaymentStatus.name === 'Pending' ? 'scale(1.05) translateX(3px)' : 'none', transition: 'all 0.2s' }"
                  @mouseenter="hoveredPaymentStatus = { name: 'Pending', pct: paymentStatusDist.pending }"
                  @mouseleave="hoveredPaymentStatus = null"
                ><span class="legend-color" style="background:var(--gold)"></span><span>Pending: {{ paymentStatusDist.pending }}%</span></div>
                <div class="legend-item"
                  :style="{ opacity: hoveredPaymentStatus && hoveredPaymentStatus.name !== 'Failed' ? 0.4 : 1, transform: hoveredPaymentStatus && hoveredPaymentStatus.name === 'Failed' ? 'scale(1.05) translateX(3px)' : 'none', transition: 'all 0.2s' }"
                  @mouseenter="hoveredPaymentStatus = { name: 'Failed', pct: paymentStatusDist.failed }"
                  @mouseleave="hoveredPaymentStatus = null"
                ><span class="legend-color" style="background:var(--red)"></span><span>Failed: {{ paymentStatusDist.failed }}%</span></div>
              </div>
            </div>
          </div>

          <!-- Revenue Per Difficulty -->
          <div class="dash-card">
            <div class="dash-card-header">
              <div>
                <span class="dash-card-title">Revenue by Difficulty</span>
                <div style="font-size:0.75rem; color:var(--stone); margin-top:2px;">
                  Profitable trek category mapping.
                  <span style="display:inline-block; font-size:0.7rem; font-family:monospace; color:var(--gold-dark); background:rgba(200,146,42,0.06); padding:1px 4px; border-radius:2px; margin-left:6px;">Formula: SUM(amount_paid) GROUP BY difficulty</span>
                </div>
              </div>
            </div>
            <div class="donut-wrapper-flex">
              <svg viewBox="0 0 36 36" style="width: 130px; height: 130px;">
                <circle cx="18" cy="18" r="15.915" fill="none" stroke="var(--stone-light)" stroke-width="3.5"></circle>
                <!-- Easy Segment -->
                <circle cx="18" cy="18" r="15.915" fill="none" stroke="var(--green)" stroke-width="3.5"
                  :stroke-dasharray="revenuePerDifficulty.easyPct + ' ' + (100 - revenuePerDifficulty.easyPct)" stroke-dashoffset="0" transform="rotate(-90 18 18)"
                  class="interactive-segment"
                  :style="{ strokeWidth: hoveredRevDifficulty && hoveredRevDifficulty.name === 'Easy' ? '4.5px' : '3.5' }"
                  @mouseenter="hoveredRevDifficulty = { name: 'Easy', pct: revenuePerDifficulty.easyPct, val: revenuePerDifficulty.easy }"
                  @mouseleave="hoveredRevDifficulty = null"
                ></circle>
                <!-- Moderate Segment -->
                <circle cx="18" cy="18" r="15.915" fill="none" stroke="var(--gold)" stroke-width="3.5"
                  :stroke-dasharray="revenuePerDifficulty.modPct + ' ' + (100 - revenuePerDifficulty.modPct)" :stroke-dashoffset="revenuePerDifficulty.offsetMod" transform="rotate(-90 18 18)"
                  class="interactive-segment"
                  :style="{ strokeWidth: hoveredRevDifficulty && hoveredRevDifficulty.name === 'Moderate' ? '4.5px' : '3.5' }"
                  @mouseenter="hoveredRevDifficulty = { name: 'Moderate', pct: revenuePerDifficulty.modPct, val: revenuePerDifficulty.moderate }"
                  @mouseleave="hoveredRevDifficulty = null"
                ></circle>
                <!-- Hard Segment -->
                <circle cx="18" cy="18" r="15.915" fill="none" stroke="var(--red)" stroke-width="3.5"
                  :stroke-dasharray="revenuePerDifficulty.hardPct + ' ' + (100 - revenuePerDifficulty.hardPct)" :stroke-dashoffset="revenuePerDifficulty.offsetHard" transform="rotate(-90 18 18)"
                  class="interactive-segment"
                  :style="{ strokeWidth: hoveredRevDifficulty && hoveredRevDifficulty.name === 'Hard' ? '4.5px' : '3.5' }"
                  @mouseenter="hoveredRevDifficulty = { name: 'Hard', pct: revenuePerDifficulty.hardPct, val: revenuePerDifficulty.hard }"
                  @mouseleave="hoveredRevDifficulty = null"
                ></circle>
                
                <text x="18" y="18" text-anchor="middle" fill="var(--forest)">
                  <tspan x="18" dy="-1.5" font-size="2.4" font-weight="800">{{ hoveredRevDifficulty ? hoveredRevDifficulty.name : 'DIFF' }}</tspan>
                  <tspan x="18" dy="3.4" font-size="2.6" font-weight="800" fill="var(--gold-dark)">{{ hoveredRevDifficulty ? hoveredRevDifficulty.pct + '%' : 'REVENUE' }}</tspan>
                  <tspan x="18" dy="3.0" font-size="1.8" font-weight="600" fill="var(--stone)" v-if="hoveredRevDifficulty">₹{{ (hoveredRevDifficulty.val/100000).toFixed(1) }}L</tspan>
                </text>
              </svg>
              <div class="donut-legend">
                <div class="legend-item"
                  :style="{ opacity: hoveredRevDifficulty && hoveredRevDifficulty.name !== 'Easy' ? 0.4 : 1, transform: hoveredRevDifficulty && hoveredRevDifficulty.name === 'Easy' ? 'scale(1.05) translateX(3px)' : 'none', transition: 'all 0.2s' }"
                  @mouseenter="hoveredRevDifficulty = { name: 'Easy', pct: revenuePerDifficulty.easyPct, val: revenuePerDifficulty.easy }"
                  @mouseleave="hoveredRevDifficulty = null"
                ><span class="legend-color" style="background:var(--green)"></span><span>Easy: {{ revenuePerDifficulty.easyPct }}% (₹{{ (revenuePerDifficulty.easy/100000).toFixed(1) }}L)</span></div>
                <div class="legend-item"
                  :style="{ opacity: hoveredRevDifficulty && hoveredRevDifficulty.name !== 'Moderate' ? 0.4 : 1, transform: hoveredRevDifficulty && hoveredRevDifficulty.name === 'Moderate' ? 'scale(1.05) translateX(3px)' : 'none', transition: 'all 0.2s' }"
                  @mouseenter="hoveredRevDifficulty = { name: 'Moderate', pct: revenuePerDifficulty.modPct, val: revenuePerDifficulty.moderate }"
                  @mouseleave="hoveredRevDifficulty = null"
                ><span class="legend-color" style="background:var(--gold)"></span><span>Mod: {{ revenuePerDifficulty.modPct }}% (₹{{ (revenuePerDifficulty.moderate/100000).toFixed(1) }}L)</span></div>
                <div class="legend-item"
                  :style="{ opacity: hoveredRevDifficulty && hoveredRevDifficulty.name !== 'Hard' ? 0.4 : 1, transform: hoveredRevDifficulty && hoveredRevDifficulty.name === 'Hard' ? 'scale(1.05) translateX(3px)' : 'none', transition: 'all 0.2s' }"
                  @mouseenter="hoveredRevDifficulty = { name: 'Hard', pct: revenuePerDifficulty.hardPct, val: revenuePerDifficulty.hard }"
                  @mouseleave="hoveredRevDifficulty = null"
                ><span class="legend-color" style="background:var(--red)"></span><span>Hard: {{ revenuePerDifficulty.hardPct }}% (₹{{ (revenuePerDifficulty.hard/100000).toFixed(1) }}L)</span></div>
              </div>
            </div>
          </div>
        </div>

        <!-- split: Top Spenders & Refund Analytics -->
        <div class="charts-split-layout">
          <!-- Top Paying Users -->
            <div class="dash-card">
              <div class="dash-card-header">
                <div>
                  <span class="dash-card-title">Top Paying Trekkers</span>
                <div style="font-size:0.75rem; color:var(--stone); margin-top:2px;">
                  Highest lifetime spenders based on cumulative checkout transactions.
                  <span style="display:inline-block; font-size:0.7rem; font-family:monospace; color:var(--gold-dark); background:rgba(200,146,42,0.06); padding:1px 4px; border-radius:2px; margin-left:6px;">Metric: SUM(amount_paid) Grouped By User</span>
                </div>
                </div>
              </div>
            <div class="ts-table-wrap" style="margin-top: 1rem; max-height: 300px; overflow-y: auto;">
              <table class="ts-table" style="font-size: 0.8rem;">
                <thead>
                  <tr>
                    <th style="width: 50px; text-align: center;">Rank</th>
                    <th>Trekker Name</th>
                    <th>Email / ID</th>
                    <th style="text-align: center;">Bookings</th>
                    <th style="text-align: right;">Total Spent</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(u, index) in topPayingUsers" :key="u.name">
                    <td style="text-align: center; font-weight: 700;">{{ index + 1 }}</td>
                    <td style="font-weight: 600; color: var(--forest)">{{ u.name }}</td>
                    <td class="mono" style="font-size: 0.75rem;">{{ u.email }}<span v-if="u.memberId"> / {{ u.memberId }}</span></td>
                    <td class="mono" style="text-align: center;">{{ u.bookingsCount }}</td>
                    <td class="mono" style="text-align: right; font-weight: 700; color: var(--gold-dark);">₹{{ u.spent.toLocaleString() }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- Refund Analytics -->
          <div class="dash-card">
            <div class="dash-card-header">
              <div>
                <span class="dash-card-title">Refund & Loss Analytics</span>
                <div style="font-size:0.75rem; color:var(--stone); margin-top:2px;">
                  Evaluating refunds processed versus retained platform net revenue.
                  <span style="display:inline-block; font-size:0.7rem; font-family:monospace; color:var(--gold-dark); background:rgba(200,146,42,0.06); padding:1px 4px; border-radius:2px; margin-left:6px;">Formula: (Refunded / Retention Total) × 100</span>
                </div>
              </div>
            </div>
            <div class="donut-wrapper-flex">
              <svg viewBox="0 0 36 36" style="width: 130px; height: 130px;">
                <circle cx="18" cy="18" r="15.915" fill="none" stroke="var(--stone-light)" stroke-width="3.5"></circle>
                <!-- Non-Refunded (Retained) Segment -->
                <circle cx="18" cy="18" r="15.915" fill="none" stroke="var(--green)" stroke-width="3.5"
                  :stroke-dasharray="refundAnalytics.nonRefundedPct + ' ' + (100 - refundAnalytics.nonRefundedPct)" stroke-dashoffset="0" transform="rotate(-90 18 18)"
                  class="interactive-segment"
                  :style="{ strokeWidth: hoveredLossStatus && hoveredLossStatus.name === 'Retained' ? '4.5px' : '3.5' }"
                  @mouseenter="hoveredLossStatus = { name: 'Retained', pct: refundAnalytics.nonRefundedPct, val: refundAnalytics.nonRefunded }"
                  @mouseleave="hoveredLossStatus = null"
                ></circle>
                <!-- Refunded Segment -->
                <circle cx="18" cy="18" r="15.915" fill="none" stroke="var(--red)" stroke-width="3.5"
                  :stroke-dasharray="refundAnalytics.refundedPct + ' ' + (100 - refundAnalytics.refundedPct)" :stroke-dashoffset="-refundAnalytics.nonRefundedPct" transform="rotate(-90 18 18)"
                  class="interactive-segment"
                  :style="{ strokeWidth: hoveredLossStatus && hoveredLossStatus.name === 'Refunded' ? '4.5px' : '3.5' }"
                  @mouseenter="hoveredLossStatus = { name: 'Refunded', pct: refundAnalytics.refundedPct, val: refundAnalytics.refunded }"
                  @mouseleave="hoveredLossStatus = null"
                ></circle>
                
                <text x="18" y="18" text-anchor="middle" fill="var(--forest)">
                  <tspan x="18" dy="-1.5" font-size="2.4" font-weight="800">{{ hoveredLossStatus ? hoveredLossStatus.name : 'LOSS' }}</tspan>
                  <tspan x="18" dy="3.4" font-size="2.6" font-weight="800" fill="var(--gold-dark)">{{ hoveredLossStatus ? hoveredLossStatus.pct + '%' : 'ANALYTICS' }}</tspan>
                  <tspan x="18" dy="3.0" font-size="1.8" font-weight="600" fill="var(--stone)" v-if="hoveredLossStatus">₹{{ hoveredLossStatus.val >= 100000 ? (hoveredLossStatus.val/100000).toFixed(1) + 'L' : (hoveredLossStatus.val/1000).toFixed(0) + 'k' }}</tspan>
                </text>
              </svg>
              <div class="donut-legend">
                <div class="legend-item"
                  :style="{ opacity: hoveredLossStatus && hoveredLossStatus.name !== 'Retained' ? 0.4 : 1, transform: hoveredLossStatus && hoveredLossStatus.name === 'Retained' ? 'scale(1.05) translateX(3px)' : 'none', transition: 'all 0.2s' }"
                  @mouseenter="hoveredLossStatus = { name: 'Retained', pct: refundAnalytics.nonRefundedPct, val: refundAnalytics.nonRefunded }"
                  @mouseleave="hoveredLossStatus = null"
                ><span class="legend-color" style="background:var(--green)"></span><span>Retained: {{ refundAnalytics.nonRefundedPct }}% (₹{{ (refundAnalytics.nonRefunded/100000).toFixed(1) }}L)</span></div>
                <div class="legend-item"
                  :style="{ opacity: hoveredLossStatus && hoveredLossStatus.name !== 'Refunded' ? 0.4 : 1, transform: hoveredLossStatus && hoveredLossStatus.name === 'Refunded' ? 'scale(1.05) translateX(3px)' : 'none', transition: 'all 0.2s' }"
                  @mouseenter="hoveredLossStatus = { name: 'Refunded', pct: refundAnalytics.refundedPct, val: refundAnalytics.refunded }"
                  @mouseleave="hoveredLossStatus = null"
                ><span class="legend-color" style="background:var(--red)"></span><span>Refunded: {{ refundAnalytics.refundedPct }}% (₹{{ (refundAnalytics.refunded/1000).toFixed(0) }}k)</span></div>
              </div>
            </div>
          </div>
        </div>

      </section>
</template>

<script>
import { adminDashComponent } from './adminDashProxy';

export default adminDashComponent('TabRevenue');
</script>
