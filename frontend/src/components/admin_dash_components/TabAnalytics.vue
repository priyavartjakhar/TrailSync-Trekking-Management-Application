<template>
  <section v-if="activeTab === 'analytics'" class="tab-content">
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
        <div class="card-formula">Paid Active Bookings / Total Bookings x 100</div>
        <div class="card-desc">Share of all bookings that are confirmed and paid.</div>
      </div>
      <div class="metric-card-kpi">
        <div class="card-title">Average Occupancy</div>
        <div class="card-value">{{ averageOccupancy }}%</div>
        <div class="card-formula">Booked Slots / Total Slots x 100</div>
        <div class="card-desc">Average capacity utilization across scheduled trek batches.</div>
      </div>
    </div>

    <div class="dash-card" style="margin-bottom:1.5rem">
      <div class="dash-card-header">
        <div>
          <span class="dash-card-title">Monthly Bookings Trend</span>
          <div style="font-size:0.75rem; color:var(--stone); margin-top:2px;">
            Metric: bookings grouped by booking month.
          </div>
        </div>
      </div>
      <AdminChart
        :config="monthlyBookingsChartConfig"
        :height="280"
        label="Monthly bookings trend"
      />
    </div>

    <div class="charts-split-layout">
      <div class="dash-card">
        <div class="dash-card-header">
          <div>
            <span class="dash-card-title">Difficulty Wise Participation</span>
            <div style="font-size:0.75rem; color:var(--stone); margin-top:2px;">
              Formula: bookings in difficulty / active bookings x 100.
            </div>
          </div>
        </div>
        <AdminChart
          :config="difficultyParticipationChartConfig"
          :height="260"
          label="Difficulty wise participation"
        />
      </div>

      <div class="dash-card">
        <div class="dash-card-header">
          <div>
            <span class="dash-card-title">Booking Status Distribution</span>
            <div style="font-size:0.75rem; color:var(--stone); margin-top:2px;">
              Booked, pending payment, completed, and cancelled booking outcomes.
            </div>
          </div>
        </div>
        <AdminChart
          :config="bookingStatusChartConfig"
          :height="260"
          label="Booking status distribution"
        />
      </div>
    </div>

    <div class="charts-split-layout">
      <div class="dash-card">
        <div class="dash-card-header">
          <div>
            <span class="dash-card-title">Trek Popularity Analysis</span>
            <div style="font-size:0.75rem; color:var(--stone); margin-top:2px;">
              Metric: active bookings grouped by trek route.
            </div>
          </div>
        </div>
        <AdminChart
          :config="trekPopularityChartConfig"
          :height="300"
          label="Trek popularity analysis"
        />
      </div>

      <div class="dash-card">
        <div class="dash-card-header">
          <div>
            <span class="dash-card-title">Location Wise Demand</span>
            <div style="font-size:0.75rem; color:var(--stone); margin-top:2px;">
              Metric: paid participant demand grouped by route state.
            </div>
          </div>
        </div>
        <AdminChart
          :config="locationDemandChartConfig"
          :height="300"
          label="Location wise demand"
        />
      </div>
    </div>

    <div class="charts-split-layout">
      <div class="dash-card">
        <div class="dash-card-header">
          <div>
            <span class="dash-card-title">Capacity Occupancy Rate Per Trek</span>
            <div style="font-size:0.75rem; color:var(--stone); margin-top:2px;">
              Formula: booked seats / total seats x 100.
            </div>
          </div>
        </div>
        <AdminChart
          :config="occupancyChartConfig"
          :height="300"
          label="Capacity occupancy rate per trek"
        />
      </div>

      <div class="dash-card">
        <div class="dash-card-header">
          <div>
            <span class="dash-card-title">Upcoming Departures Seat Inventory</span>
            <div style="font-size:0.75rem; color:var(--stone); margin-top:2px;">
              Lookahead visibility into upcoming trek seats.
            </div>
          </div>
        </div>
        <div class="ts-table-wrap" style="margin-top: 1rem; max-height: 300px; overflow-y: auto;">
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
              <tr v-for="ut in enrichedUpcomingTreks" :key="ut.name + ut.startDate">
                <td style="font-weight:600; color:var(--forest)">{{ ut.name }}</td>
                <td class="mono">{{ ut.startDate }}</td>
                <td>{{ ut.staff }}</td>
                <td class="mono" style="text-align:center;">{{ ut.bookedSlots }}</td>
                <td class="mono" style="text-align:center;">
                  <span :class="['status-pill', ut.remainingSlots <= 5 ? 'status-closed' : 'status-open']" style="font-size:0.7rem; padding: 2px 6px;">
                    {{ ut.remainingSlots }} left
                  </span>
                </td>
              </tr>
              <tr v-if="!enrichedUpcomingTreks.length">
                <td colspan="5" style="text-align:center; padding:1.5rem; color:var(--stone)">No upcoming departures starting soon.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <div class="dash-card">
      <div class="dash-card-header">
        <div>
          <span class="dash-card-title">Staff Performance Analytics Leaderboard</span>
          <div style="font-size:0.75rem; color:var(--stone); margin-top:2px;">
            Ranks guides by participants led, assigned treks, occupancy, completion rate, and rating.
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
              <td style="text-align: center; font-weight: 700;">{{ index + 1 }}</td>
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
              <td class="mono" style="text-align: center;"><span style="color:var(--gold-dark); font-weight:700;">{{ s.rating }}</span></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </section>
</template>

<script>
/**
 * =========================================================================
 * TabAnalytics.vue
 * =========================================================================
 * Analytics metrics view showing statistical graphs for popular routes, user growth, booking channels, and difficulty distributions.
 * 
 * Uses 'adminDashComponent' dynamic options proxying to link state/methods
 * reactivity directly with the parent 'AdminDashboard' coordinator.
 */

import { adminDashComponent } from './adminDashProxy';
import AdminChart from './AdminChart.vue';

const COLORS = {
  forest: '#1a2e1a',
  forestMid: '#2f6b3d',
  gold: '#c8922a',
  goldLight: '#e5b84c',
  green: '#22c55e',
  red: '#dc3545',
  stone: '#8c8070',
  cream: '#f3e5ab'
};

function activeBookings(bookings) {
  return bookings.filter((b) => b.status !== 'Cancelled');
}

function emptyChart(type = 'bar') {
  return {
    type,
    data: {
      labels: ['No data'],
      datasets: [{ data: [0], backgroundColor: [COLORS.stone], borderColor: [COLORS.stone] }]
    }
  };
}

export default adminDashComponent('TabAnalytics', {
  components: { AdminChart },
  computed: {
    monthlyBookingsChartConfig() {
      const source = this.monthlyBookings && this.monthlyBookings.length
        ? this.monthlyBookings
        : [];
      if (!source.length) return emptyChart('line');

      return {
        type: 'line',
        data: {
          labels: source.map((m) => m.month),
          datasets: [{
            label: 'Bookings',
            data: source.map((m) => Number(m.count) || 0),
            borderColor: COLORS.gold,
            backgroundColor: 'rgba(200, 146, 42, 0.18)',
            pointBackgroundColor: COLORS.forest,
            pointBorderColor: '#ffffff',
            pointRadius: 4,
            tension: 0.35,
            fill: true
          }]
        }
      };
    },
    difficultyParticipationChartConfig() {
      const counts = { Easy: 0, Moderate: 0, Hard: 0 };
      activeBookings(this.allBookings).forEach((booking) => {
        const difficulty = counts[booking.difficulty] !== undefined ? booking.difficulty : 'Moderate';
        counts[difficulty] += 1;
      });

      return {
        type: 'doughnut',
        data: {
          labels: ['Easy', 'Moderate', 'Hard'],
          datasets: [{
            label: 'Bookings',
            data: [counts.Easy, counts.Moderate, counts.Hard],
            backgroundColor: [COLORS.green, COLORS.gold, COLORS.red],
            borderColor: '#ffffff',
            borderWidth: 2
          }]
        },
        options: { cutout: '58%' }
      };
    },
    bookingStatusChartConfig() {
      const counts = { Booked: 0, Pending: 0, Completed: 0, Cancelled: 0 };
      this.allBookings.forEach((booking) => {
        if (booking.status === 'Cancelled') counts.Cancelled += 1;
        else if (booking.status === 'Completed') counts.Completed += 1;
        else if (booking.paymentStatus === 'Pending' || booking.paid === false) counts.Pending += 1;
        else counts.Booked += 1;
      });

      return {
        type: 'doughnut',
        data: {
          labels: ['Booked', 'Pending', 'Completed', 'Cancelled'],
          datasets: [{
            label: 'Bookings',
            data: [counts.Booked, counts.Pending, counts.Completed, counts.Cancelled],
            backgroundColor: [COLORS.green, COLORS.gold, COLORS.forestMid, COLORS.red],
            borderColor: '#ffffff',
            borderWidth: 2
          }]
        },
        options: { cutout: '58%' }
      };
    },
    trekPopularityChartConfig() {
      const rows = this.popularTreksWithMock.length
        ? this.popularTreksWithMock
        : [];
      if (!rows.length) return emptyChart('bar');

      return {
        type: 'bar',
        data: {
          labels: rows.map((row) => row.name),
          datasets: [{
            label: 'Bookings',
            data: rows.map((row) => Number(row.bookings) || 0),
            backgroundColor: COLORS.gold,
            borderRadius: 5
          }]
        },
        options: {
          indexAxis: 'y',
          plugins: { legend: { display: false } },
          scales: {
            x: { beginAtZero: true, ticks: { precision: 0, color: '#6b746b' }, grid: { color: 'rgba(26, 46, 26, 0.07)' } },
            y: { ticks: { color: '#4d5a4d', font: { size: 10, weight: 600 } }, grid: { display: false } }
          }
        }
      };
    },
    locationDemandChartConfig() {
      const rows = this.locationDemand.slice(0, 8);
      if (!rows.length) return emptyChart('bar');

      return {
        type: 'bar',
        data: {
          labels: rows.map((row) => row.state),
          datasets: [{
            label: 'Paid participants',
            data: rows.map((row) => Number(row.count) || 0),
            backgroundColor: COLORS.forestMid,
            borderRadius: 5
          }]
        },
        options: {
          indexAxis: 'y',
          plugins: { legend: { display: false } },
          scales: {
            x: { beginAtZero: true, ticks: { precision: 0, color: '#6b746b' }, grid: { color: 'rgba(26, 46, 26, 0.07)' } },
            y: { ticks: { color: '#4d5a4d', font: { size: 10, weight: 600 } }, grid: { display: false } }
          }
        }
      };
    },
    occupancyChartConfig() {
      const rows = this.occupancyRatePerTrek;
      if (!rows.length) return emptyChart('bar');

      return {
        type: 'bar',
        data: {
          labels: rows.map((row) => row.name),
          datasets: [{
            label: 'Occupancy %',
            data: rows.map((row) => Number(row.pct) || 0),
            backgroundColor: rows.map((row) => {
              if (row.pct >= 90) return COLORS.red;
              if (row.pct >= 70) return COLORS.gold;
              return COLORS.green;
            }),
            borderRadius: 5
          }]
        },
        options: {
          indexAxis: 'y',
          plugins: { legend: { display: false } },
          scales: {
            x: { beginAtZero: true, max: 100, ticks: { callback: (value) => `${value}%`, color: '#6b746b' }, grid: { color: 'rgba(26, 46, 26, 0.07)' } },
            y: { ticks: { color: '#4d5a4d', font: { size: 10, weight: 600 } }, grid: { display: false } }
          }
        }
      };
    }
  }
});
</script>
