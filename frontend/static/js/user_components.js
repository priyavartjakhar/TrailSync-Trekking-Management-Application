// ============================================================
//  user_components.js — Trekker Dashboard Vue 3 component tree
//  TrailSync — Full-featured trekker dashboard
// ============================================================

const TsUserLayout = {
  name: 'TsUserLayout',
  emits: ['logout'],

  data() {
    return {
      // ── UI STATE ──────────────────────────────────
      activeTab: 'dashboard',
      sidebarOpen: false,
      toast: { show: false, msg: '', type: 'success' },

      // ── DATA ──────────────────────────────────────
      userName: USER_INITIAL_NAME,
      profile: { ...USER_INITIAL_PROFILE },
      pwForm: { current: '', new: '', confirm: '' },
      availableTreks: JSON.parse(JSON.stringify(USER_AVAILABLE_TREKS)),
      myBookings: JSON.parse(JSON.stringify(USER_MY_BOOKINGS)),
      trekHistory: JSON.parse(JSON.stringify(USER_TREK_HISTORY)),
      achievements: JSON.parse(JSON.stringify(USER_ACHIEVEMENTS)),

      // ── BOOKING MODAL ─────────────────────────────
      showBookingModal: false,
      bookingTarget: null,
      termsAccepted: false,

      // ── SEARCH / FILTERS ─────────────────────────
      searchQuery: '',
      difficultyFilter: '',
      locationFilter: '',
      durationFilter: '',
      quickFilter: 'All',

      // ── CALENDAR ─────────────────────────────────
      calYear: new Date().getFullYear(),
      calMonth: new Date().getMonth(),

      // ── COUNTDOWN ─────────────────────────────────
      countdownTimer: null,
      countdownVals: { days: 0, hours: 0, minutes: 0, seconds: 0 },

      // ── EXPORT ────────────────────────────────────
      exportPending: false,

      // ── CUSTOM MODALS ─────────────────────────────
      showGuideModal: false,
      guideTarget: null,
      showChecklistModal: false,
      checklistTargetBooking: null,
      checklistItems: [],

      // ── WEATHER ───────────────────────────────────
      weather: {
        loading: false,
        error: false,
        temp: null,
        humidity: null,
        windSpeed: null,
        desc: '',
        icon: '⛅',
        locationName: '',
      },
    };
  },

  computed: {
    // Current user initial
    userInitial() {
      return this.profile.name ? this.profile.name[0].toUpperCase() : '?';
    },

    // Stats for dashboard
    userStats() {
      const active = this.myBookings.filter(b => b.status === 'Booked').length;
      const completed = this.trekHistory.filter(h => h.status === 'Completed').length;
      const totalSpent = this.trekHistory
        .filter(h => h.status === 'Completed')
        .reduce((a, h) => a + h.price, 0)
        + this.myBookings.filter(b => b.status === 'Booked').reduce((a, b) => a + b.price, 0);
      return [
        { label: 'Active Bookings', value: active, icon: 'calendar', color: 'si-gold', trend: '' },
        { label: 'Treks Completed', value: completed, icon: 'check', color: 'si-forest', trend: '' },
        { label: 'Available Treks', value: this.availableTreks.length, icon: 'map', color: 'si-green', trend: '' },
        { label: 'Total Invested', value: '₹' + totalSpent.toLocaleString(), icon: 'rupee', color: 'si-blue', trend: '' },
      ];
    },

    // Next upcoming booked trek
    nextTrek() {
      const booked = this.myBookings.filter(b => b.status === 'Booked');
      if (!booked.length) return null;
      return booked.sort((a, b) => new Date(a.startDate) - new Date(b.startDate))[0];
    },

    // Unique locations for filter dropdown
    uniqueLocations() {
      return [...new Set(this.availableTreks.map(t => t.location))].sort();
    },

    // Filtered treks list
    filteredTreks() {
      return this.availableTreks.filter(t => {
        const q = this.searchQuery.toLowerCase();
        const matchSearch = !q || t.name.toLowerCase().includes(q) || t.location.toLowerCase().includes(q);
        const matchDiff = !this.difficultyFilter || t.difficulty === this.difficultyFilter;
        const matchLoc = !this.locationFilter || t.location === this.locationFilter;
        const matchDur = !this.durationFilter || (
          this.durationFilter === '1-5' ? t.duration <= 5 :
          this.durationFilter === '6-9' ? t.duration >= 6 && t.duration <= 9 :
          t.duration >= 10
        );
        const matchQuick = this.quickFilter === 'All' || t.difficulty === this.quickFilter;
        return matchSearch && matchDiff && matchLoc && matchDur && matchQuick;
      });
    },

    // Calendar days for current month view
    calendarDays() {
      const year = this.calYear, month = this.calMonth;
      const firstDay = new Date(year, month, 1).getDay();
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      const daysInPrev = new Date(year, month, 0).getDate();
      const days = [];

      // Previous month padding
      for (let i = firstDay - 1; i >= 0; i--) {
        days.push({ day: daysInPrev - i, month: 'prev', date: null });
      }
      // Current month
      for (let d = 1; d <= daysInMonth; d++) {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        const today = new Date();
        const isToday = today.getFullYear() === year && today.getMonth() === month && today.getDate() === d;
        const hasTrek = this.allTrekDates.some(range => dateStr >= range.start && dateStr <= range.end);
        days.push({ day: d, month: 'current', date: dateStr, isToday, hasTrek });
      }
      // Next month padding
      const remaining = 42 - days.length;
      for (let d = 1; d <= remaining; d++) {
        days.push({ day: d, month: 'next', date: null });
      }
      return days;
    },

    calMonthLabel() {
      return new Date(this.calYear, this.calMonth, 1).toLocaleString('default', { month: 'long', year: 'numeric' });
    },

    // All trek dates for calendar highlight
    allTrekDates() {
      const ranges = [];
      this.myBookings.filter(b => b.status === 'Booked').forEach(b => {
        ranges.push({ start: b.startDate, end: b.endDate, name: b.trekName });
      });
      return ranges;
    },

    // This month's calendar events
    calendarEvents() {
      const monthStr = `${this.calYear}-${String(this.calMonth + 1).padStart(2, '0')}`;
      const events = [];
      this.myBookings.filter(b => b.status === 'Booked').forEach(b => {
        if (b.startDate.startsWith(monthStr) || b.endDate.startsWith(monthStr)) {
          events.push({ name: b.trekName, date: b.startDate });
        }
      });
      return events;
    },

    // Booked trek IDs set
    bookedTrekIds() {
      return new Set(this.myBookings.filter(b => b.status === 'Booked').map(b => b.trekId));
    },

    // Trek completion %
    completionPct() {
      const total = this.trekHistory.length + this.myBookings.filter(b => b.status === 'Booked').length;
      if (!total) return 0;
      const done = this.trekHistory.filter(h => h.status === 'Completed').length;
      return Math.round((done / Math.max(total, 1)) * 100);
    },

    // Available treks with open batches sorted by start date
    upcomingAvailableTreks() {
      if (!this.availableTreks) return [];
      const list = [];
      this.availableTreks.forEach(route => {
        if (route.batches && route.batches.length > 0) {
          const sorted = [...route.batches].sort((a, b) => new Date(a.startDate) - new Date(b.startDate));
          const primaryBatch = sorted[0];
          list.push({
            id: route.id,
            name: route.name,
            difficulty: route.difficulty,
            startDate: primaryBatch.startDate,
            slotsLeft: primaryBatch.slots - primaryBatch.booked,
            batch: primaryBatch,
            route: route
          });
        }
      });
      return list.sort((a, b) => new Date(a.startDate) - new Date(b.startDate));
    },
  },

  methods: {
    // ── NAV ────────────────────────────────────────
    goTab(tab) {
      this.activeTab = tab;
      this.sidebarOpen = false;
    },

    // ── TREK HELPERS ──────────────────────────────
    isBooked(trekId) { return this.bookedTrekIds.has(trekId); },
    isFull(t) { return t.booked >= t.slots; },
    slotsLeft(t) { return t.slots - t.booked; },
    slotsPct(t) { return Math.min(100, Math.round((t.booked / t.slots) * 100)); },
    slotsClass(t) {
      const p = t.booked / t.slots;
      return p >= 0.9 ? 'slots-red-fill' : p >= 0.6 ? 'slots-amber-fill' : 'slots-green-fill';
    },
    diffColor(d) {
      return d === 'Easy' ? '#22c55e' : d === 'Moderate' ? '#f59e0b' : '#ef4444';
    },
    getGradient(t) {
      const grads = ['#1a4a3a','#2d6b3d','#2a3a1a','#3d5b2d','#1a3a2a','#2d5b4a','#3a1a1a','#5b2d2d','#1a2a3a','#2d3b5b'];
      const id = t.id || 0;
      return `linear-gradient(135deg, ${grads[id % grads.length]}, rgba(0,0,0,0.5))`;
    },
    formatDate(dateStr) {
      if (!dateStr) return '—';
      const parts = dateStr.split(' ');
      const datePart = parts[0];
      const timePart = parts[1] ? ' ' + parts[1] : '';
      const dParts = datePart.split('-');
      if (dParts.length !== 3) return dateStr;
      const year = dParts[0];
      const monthNum = parseInt(dParts[1], 10);
      const day = parseInt(dParts[2], 10);
      const monthNames = [
        'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
      ];
      if (monthNum >= 1 && monthNum <= 12) {
        return `${day} ${monthNames[monthNum - 1]} ${year}${timePart}`;
      }
      return dateStr;
    },
    async bookBatch(batch) {
      try {
        const res = await fetch('/api/bookings/book', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ trek_id: batch.id })
        });
        const data = await res.json();
        if (res.ok) {
          this.showToast(data.message || `${batch.name} booked!`, 'success');
          this.showBookingModal = false;
          await this.fetchUserData();
        } else {
          this.showToast(data.error || 'Booking failed', 'error');
        }
      } catch (e) {
        console.error('Booking error:', e);
        this.showToast('Failed to contact server. Booking could not be completed.', 'error');
      }
    },


    // ── BOOKING ───────────────────────────────────
    openBookingModal(t) {
      this.bookingTarget = t;
      this.termsAccepted = false;
      this.showBookingModal = true;
    },

    async confirmBooking() {
      if (!this.termsAccepted || !this.bookingTarget) return;
      const t = this.bookingTarget;
      try {
        const res = await fetch('/api/bookings/book', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ trek_id: t.id })
        });
        const data = await res.json();
        if (res.ok) {
          this.showToast(data.message || `${t.name} booked!`, 'success');
          await this.fetchUserData();
        } else {
          this.showToast(data.error || 'Booking failed', 'error');
        }
      } catch (e) {
        console.error('Booking error:', e);
        this.showToast('Failed to contact server. Booking could not be completed.', 'error');
      }
      this.showBookingModal = false;
    },

    async cancelBooking(b) {
      if (!confirm(`Cancel booking for ${b.trekName}? This cannot be undone.`)) return;
      try {
        const res = await fetch(`/api/bookings/cancel/${b.id}`, { method: 'POST' });
        const data = await res.json();
        if (res.ok) {
          this.showToast(data.message || 'Booking cancelled', 'info');
          await this.fetchUserData();
        } else {
          this.showToast(data.error || 'Cancel failed', 'error');
        }
      } catch (e) {
        console.error('Cancellation error:', e);
        this.showToast('Failed to contact server. Booking could not be cancelled.', 'error');
      }
    },

    // ── EXPORT ───────────────────────────────────
    async requestExport() {
      this.exportPending = true;
      try {
        const res = await fetch('/api/user/export', { method: 'POST' });
        const data = await res.json();
        if (res.ok) {
          this.showToast(data.message || 'CSV export triggered.', 'success');
        } else {
          this.showToast(data.error || 'Export failed.', 'error');
          this.exportPending = false;
        }
      } catch (e) {
        console.error('Export error:', e);
        this.showToast('Failed to contact server. Export could not be completed.', 'error');
        this.exportPending = false;
      }
      setTimeout(() => { this.exportPending = false; }, 8000);
    },

    // ── PROFILE ──────────────────────────────────
    async saveProfile() {
      try {
        const res = await fetch('/api/user/profile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(this.profile)
        });
        const data = await res.json();
        if (res.ok) {
          this.userName = this.profile.name;
          this.showToast(data.message || 'Profile saved.', 'success');
          await this.fetchUserData();
        } else {
          this.showToast(data.error || 'Save failed.', 'error');
        }
      } catch (e) {
        console.error('Profile save error:', e);
        this.showToast('Failed to contact server. Profile changes not saved.', 'error');
      }
    },

    async changePassword() {
      if (!this.pwForm.current || !this.pwForm.new) {
        this.showToast('Please fill all password fields', 'error'); return;
      }
      if (this.pwForm.new !== this.pwForm.confirm) {
        this.showToast("New passwords don't match", 'error'); return;
      }
      if (this.pwForm.new.length < 6) {
        this.showToast('Password must be at least 6 characters', 'error'); return;
      }
      try {
        const res = await fetch('/api/user/password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ current: this.pwForm.current, new: this.pwForm.new })
        });
        const data = await res.json();
        if (res.ok) {
          this.pwForm = { current: '', new: '', confirm: '' };
          this.showToast(data.message || 'Password updated.', 'success');
        } else {
          this.showToast(data.error || 'Update failed.', 'error');
        }
      } catch (e) {
        console.error('Password change error:', e);
        this.showToast('Failed to contact server. Password not updated.', 'error');
      }
    },

    // ── DATA FETCH ────────────────────────────────
    async fetchUserData() {
      try {
        const res = await fetch('/api/user/dashboard_data');
        if (res.ok) {
          const data = await res.json();
          this.availableTreks = data.available_treks || this.availableTreks;
          this.myBookings = data.my_bookings || this.myBookings;
          this.trekHistory = data.trek_history || this.trekHistory;
          this.profile = data.profile || this.profile;
          this.userName = this.profile.name;
          this.updateAchievements();
          this.fetchWeather();
        } else {
          console.error('Fetch user data returned status:', res.status);
        }
      } catch (e) {
        console.error('Fetch user data error:', e);
      }
    },

    cleanDescription(t) {
      if (!t || !t.description) return '';
      let desc = t.description;
      if (desc.startsWith("An exciting ")) {
        desc = desc.replace(/^An exciting (?:easy|moderate|hard) \d+-day trek exploring /i, "Explore ");
        desc = desc.charAt(0).toUpperCase() + desc.slice(1);
      }
      return desc;
    },

    openGuideModal(guide) {
      if (!guide) return;
      this.guideTarget = guide;
      this.showGuideModal = true;
    },

    async openChecklistModal(booking) {
      this.checklistTargetBooking = booking;
      this.showChecklistModal = true;
      this.checklistItems = [];
      try {
        const res = await fetch(`/api/bookings/${booking.id}/checklist`);
        if (res.ok) {
          this.checklistItems = await res.json();
        } else {
          this.showToast('Failed to load checklist', 'error');
        }
      } catch (e) {
        console.error('Checklist load error:', e);
        this.showToast('Failed to contact server for checklist.', 'error');
      }
    },

    async toggleChecklistItem(item) {
      try {
        const res = await fetch('/api/bookings/checklist/toggle', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ item_id: item.id })
        });
        if (res.ok) {
          const data = await res.json();
          item.isCompleted = data.item.isCompleted;
        } else {
          this.showToast('Failed to update checklist item', 'error');
        }
      } catch (e) {
        console.error('Checklist toggle error:', e);
        this.showToast('Failed to contact server to update item.', 'error');
      }
    },

    async fetchWeather() {
      const trek = this.nextTrek;
      if (!trek || trek.latitude === undefined || trek.longitude === undefined) {
        return;
      }
      this.weather.loading = true;
      this.weather.error = false;
      try {
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${trek.latitude}&longitude=${trek.longitude}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code`;
        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          const current = data.current;
          this.weather.temp = Math.round(current.temperature_2m);
          this.weather.humidity = current.relative_humidity_2m;
          this.weather.windSpeed = current.wind_speed_10m;
          
          const code = current.weather_code;
          let desc = 'Clear sky';
          let icon = '☀️';
          if (code === 0) { desc = 'Clear Sky'; icon = '☀️'; }
          else if (code === 1) { desc = 'Mainly Clear'; icon = '🌤️'; }
          else if (code === 2) { desc = 'Partly Cloudy'; icon = '⛅'; }
          else if (code === 3) { desc = 'Overcast'; icon = '☁️'; }
          else if ([45, 48].includes(code)) { desc = 'Foggy'; icon = '🌫️'; }
          else if ([51, 53, 55].includes(code)) { desc = 'Drizzle'; icon = '🌧️'; }
          else if ([61, 63, 65].includes(code)) { desc = 'Rainy'; icon = '🌧️'; }
          else if ([71, 73, 75, 77].includes(code)) { desc = 'Snowy'; icon = '❄️'; }
          else if ([80, 81, 82].includes(code)) { desc = 'Rain Showers'; icon = '🌦️'; }
          else if ([85, 86].includes(code)) { desc = 'Snow Showers'; icon = '❄️'; }
          else if (code >= 95) { desc = 'Thunderstorm'; icon = '⛈️'; }
          
          this.weather.desc = desc;
          this.weather.icon = icon;
          this.weather.locationName = trek.location;
        } else {
          this.weather.error = true;
        }
      } catch (e) {
        console.error('Weather fetch error:', e);
        this.weather.error = true;
      } finally {
        this.weather.loading = false;
      }
    },

    updateAchievements() {
      const completedTreks = this.trekHistory.filter(h => h.status === 'Completed');
      const completedCount = completedTreks.length;
      
      const firstSummit = completedCount >= 1;
      const trailBlazer = completedCount >= 5;
      
      const hasWinterTrek = completedTreks.some(t => {
        if (!t.startDate) return false;
        const month = new Date(t.startDate).getMonth(); // 0 = Jan, 11 = Dec
        return month === 11 || month === 0 || month === 1 || month === 10; // Nov, Dec, Jan, Feb
      });
      
      const locations = completedTreks.map(t => t.location);
      const uniqueLocations = [...new Set(locations)];
      const explorer = uniqueLocations.length >= 3;
      
      const hasHardTrek = completedTreks.some(t => t.difficulty === 'Hard');
      
      let totalNights = 0;
      completedTreks.forEach(t => {
        if (t.startDate && t.endDate) {
          const start = new Date(t.startDate);
          const end = new Date(t.endDate);
          const diffDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
          if (diffDays > 0) totalNights += diffDays;
        }
      });
      const campExpert = totalNights >= 10;
      const legend = completedCount >= 15;

      this.achievements = this.achievements.map(a => {
        let earned = false;
        if (a.name === 'First Summit') earned = firstSummit;
        else if (a.name === 'Trail Blazer') earned = trailBlazer;
        else if (a.name === 'Snow Walker') earned = hasWinterTrek;
        else if (a.name === 'Explorer') earned = explorer;
        else if (a.name === 'Hard Core') earned = hasHardTrek;
        else if (a.name === 'Camp Expert') earned = campExpert;
        else if (a.name === 'Legend') earned = legend;
        return { ...a, earned };
      });
    },

    // ── CALENDAR ─────────────────────────────────
    prevMonth() {
      if (this.calMonth === 0) { this.calMonth = 11; this.calYear--; }
      else this.calMonth--;
    },
    nextMonth() {
      if (this.calMonth === 11) { this.calMonth = 0; this.calYear++; }
      else this.calMonth++;
    },

    // ── COUNTDOWN ─────────────────────────────────
    startCountdown() {
      if (this.countdownTimer) clearInterval(this.countdownTimer);
      this.countdownTimer = setInterval(() => {
        const trek = this.nextTrek;
        if (!trek) return;
        const diff = new Date(trek.startDate).getTime() - Date.now();
        if (diff <= 0) {
          this.countdownVals = { days: 0, hours: 0, minutes: 0, seconds: 0 };
          return;
        }
        this.countdownVals = {
          days: Math.floor(diff / 86400000),
          hours: Math.floor((diff % 86400000) / 3600000),
          minutes: Math.floor((diff % 3600000) / 60000),
          seconds: Math.floor((diff % 60000) / 1000),
        };
      }, 1000);
    },

    // ── TOAST ─────────────────────────────────────
    showToast(msg, type = 'success') {
      this.toast = { show: true, msg, type };
      setTimeout(() => { this.toast.show = false; }, 4000);
    },

    // ── LOGOUT ────────────────────────────────────
    handleLogout() { this.$emit('logout'); },
  },

  mounted() {
    this.fetchUserData();
    this.startCountdown();
  },

  beforeUnmount() {
    if (this.countdownTimer) clearInterval(this.countdownTimer);
  },

  template: `
  <div class="ts-user-layout">

    <!-- Mobile sidebar overlay -->
    <div class="sidebar-overlay" :class="{ visible: sidebarOpen }" @click="sidebarOpen = false"></div>

    <!-- Mobile toggle -->
    <button class="sidebar-mobile-toggle" @click="sidebarOpen = !sidebarOpen">
      <svg viewBox="0 0 24 24"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
    </button>

    <!-- ── SIDEBAR ─────────────────────────────────── -->
    <aside class="ts-sidebar" :class="{ open: sidebarOpen }">
      <!-- Brand -->
      <div class="sidebar-brand">
        <div class="sidebar-brand-icon">
          <svg viewBox="0 0 24 24"><path d="M3 17l4-8 4 4 4-6 4 10"/></svg>
        </div>
        <span class="sidebar-brand-name">Trail<span>Sync</span></span>
      </div>

      <!-- User chip -->
      <div class="sidebar-user">
        <div class="sidebar-avatar">{{ userInitial }}</div>
        <div class="sidebar-user-info">
          <div class="sidebar-user-name">{{ profile.name }}</div>
          <div class="sidebar-user-role">Trekker</div>
        </div>
      </div>

      <!-- Nav -->
      <nav class="sidebar-nav">
        <div class="sidebar-section-label">Main</div>
        <div class="sidebar-nav-item" :class="{ active: activeTab === 'dashboard' }" @click="goTab('dashboard')">
          <svg viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>
          Dashboard
        </div>
        <div class="sidebar-nav-item" :class="{ active: activeTab === 'explore' }" @click="goTab('explore')">
          <svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          Explore Treks
        </div>
        <div class="sidebar-nav-item" :class="{ active: activeTab === 'bookings' }" @click="goTab('bookings')">
          <svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
          My Bookings
          <span v-if="myBookings.filter(b=>b.status==='Booked').length" class="sidebar-badge">
            {{ myBookings.filter(b=>b.status==='Booked').length }}
          </span>
        </div>
        <div class="sidebar-nav-item" :class="{ active: activeTab === 'history' }" @click="goTab('history')">
          <svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"/></svg>
          Trek History
        </div>
        <div class="sidebar-nav-item" :class="{ active: activeTab === 'calendar' }" @click="goTab('calendar')">
          <svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
          Trek Calendar
        </div>
        <div class="sidebar-section-label" style="margin-top:0.5rem">Account</div>
        <div class="sidebar-nav-item" :class="{ active: activeTab === 'profile' }" @click="goTab('profile')">
          <svg viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
          My Profile
        </div>
      </nav>

      <!-- Sidebar footer -->
      <div class="sidebar-footer">
        <button class="btn-logout-sidebar" @click="handleLogout">
          <svg viewBox="0 0 24 24"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
          Sign Out
        </button>
      </div>
    </aside>

    <!-- ── MAIN CONTENT ─────────────────────────────── -->
    <div class="ts-main-content">

      <!-- Top bar -->
      <div class="ts-topbar">
        <div class="topbar-breadcrumb">
          TrailSync / <span>{{ activeTab.charAt(0).toUpperCase() + activeTab.slice(1) }}</span>
        </div>
        <div class="topbar-spacer"></div>
        <div class="topbar-search">
          <svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input v-model="searchQuery" type="text" placeholder="Search treks…" @keyup.enter="goTab('explore')" />
        </div>
        <div class="topbar-actions">
          <div class="topbar-icon-btn" @click="goTab('bookings')" title="Bookings">
            <svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            <span v-if="myBookings.filter(b=>b.status==='Booked').length" class="notif-dot"></span>
          </div>
          <div class="topbar-icon-btn" @click="goTab('profile')" title="Profile">
            <svg viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
          </div>
        </div>
      </div>

      <!-- ── PAGE CONTENT ─────────────────────────── -->
      <div class="page-content">

        <!-- ════════ DASHBOARD TAB ════════ -->
        <section v-if="activeTab === 'dashboard'">
          <!-- Hero strip -->
          <div class="dash-hero">
            <div class="dash-hero-text">
              <div class="dash-hero-greeting">Welcome back, Trekker</div>
              <div class="dash-hero-name">Hello, <em>{{ profile.name ? profile.name.split(' ')[0] : 'Trekker' }}</em> 🏔️</div>
              <div class="dash-hero-sub">Your next adventure is waiting. {{ filteredTreks.length }} treks open for booking right now.</div>
            </div>
            <div class="dash-hero-cta">
              <button class="btn-hero-primary" @click="goTab('explore')">Explore Treks</button>
              <button class="btn-hero-ghost" @click="goTab('bookings')">My Bookings</button>
            </div>
          </div>

          <!-- Stats row -->
          <div class="stats-row">
            <div v-for="s in userStats" :key="s.label" class="stat-card">
              <div class="stat-icon" :class="s.color">
                <!-- Active Bookings: Calendar with grid details -->
                <svg v-if="s.icon==='calendar'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line><path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01M16 18h.01"></path></svg>
                <!-- Treks Completed: Mountain Summit Checkmark -->
                <svg v-if="s.icon==='check'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 20L12 4l9 16H3z"></path><path d="M9 12l2 2 4-4"></path></svg>
                <!-- Available Treks: Folded Map routes -->
                <svg v-if="s.icon==='map'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21"></polygon><line x1="9" y1="3" x2="9" y2="18"></line><line x1="15" y1="6" x2="15" y2="21"></line></svg>
                <!-- Total Invested: Correct, fully visible Indian Rupee Symbol -->
                <svg v-if="s.icon==='rupee'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 5h12M6 10h12M6 5a5 5 0 0 1 0 10H6M12 10L6 20"/></svg>
              </div>
              <div class="stat-info">
                <div class="stat-val">{{ s.value }}</div>
                <div class="stat-lbl">{{ s.label }}</div>
                <div v-if="s.trend" class="stat-trend">{{ s.trend }}</div>
              </div>
            </div>
          </div>

          <!-- Main two-column grid -->
          <div class="dashboard-grid">
            <!-- Left column -->
            <div class="dashboard-main">

              <!-- Upcoming Treks panel -->
              <div class="ts-card" style="margin-bottom:1.75rem">
                <div class="ts-card-header">
                  <div>
                    <div class="ts-card-title">Upcoming Booked Treks</div>
                    <div class="ts-card-subtitle">Your confirmed adventures ahead</div>
                  </div>
                  <button class="ts-card-action" @click="goTab('bookings')">View all →</button>
                </div>
                <div class="ts-card-body">
                  <div v-if="myBookings.filter(b=>b.status==='Booked').length === 0" class="empty-state">
                    <svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                    <p>No upcoming treks. <a @click="goTab('explore')">Browse open treks →</a></p>
                  </div>
                  <div class="bookings-stack">
                    <div v-for="b in myBookings.filter(b=>b.status==='Booked')" :key="b.id" class="booking-row">
                      <div class="booking-accent" :class="'ba-' + b.difficulty.toLowerCase()"></div>
                      <div class="booking-main">
                        <div class="booking-trek-name">{{ b.trekName }}</div>
                        <div class="booking-loc">📍 {{ b.location }}</div>
                        <div class="booking-dates mono">{{ b.startDate }} → {{ b.endDate }}</div>
                        <div v-if="b.guide" class="booking-guide-info" style="font-size: 0.78rem; color: var(--stone); margin-top: 6px; display: flex; align-items: center; gap: 8px;">
                          <span>👤 Guide: <strong>{{ b.guide.name }}</strong> ({{ b.guide.phone }})</span>
                          <button style="color: var(--forest); font-weight: 600; cursor: pointer; border: none; background: none; padding: 0; font-size: 0.78rem; text-decoration: underline;" @click="openGuideModal(b.guide)">View Profile</button>
                        </div>
                      </div>
                      <div class="booking-meta">
                        <div class="bm-row"><span class="bm-label">Status</span><span class="status-pill status-booked">Booked</span></div>
                        <div class="bm-row"><span class="bm-label">Amount</span><span class="bm-price">₹{{ b.price.toLocaleString() }}</span></div>
                        <div class="bm-row"><span class="bm-label">Difficulty</span><span :class="'diff-pill pill-'+b.difficulty.toLowerCase()">{{b.difficulty}}</span></div>
                        <div style="display: flex; gap: 0.5rem; margin-top: 0.5rem; width: 100%;">
                          <button class="btn-cancel" @click="cancelBooking(b)" style="flex: 1;">Cancel</button>
                          <button class="btn-outline" @click="openChecklistModal(b)" style="flex: 1.5; padding: 0.35rem 0.5rem; font-size: 0.72rem; border-radius: 4px; border: 1px solid var(--forest); color: var(--forest); background: transparent; cursor: pointer; font-weight: 600; display: flex; align-items: center; justify-content: center; gap: 2px;">📋 Checklist</button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Recommended Treks -->
              <div class="ts-card">
                <div class="ts-card-header">
                  <div>
                    <div class="ts-card-title">Recommended For You</div>
                    <div class="ts-card-subtitle">Based on your trekking history</div>
                  </div>
                  <button class="ts-card-action" @click="goTab('explore')">See all →</button>
                </div>
                <div class="ts-card-body">
                  <div class="treks-grid-user">
                    <div v-for="t in availableTreks.slice(0, 3)" :key="t.id" class="trek-card-user">
                      <div class="trek-img-user">
                        <img v-if="t.imageUrl" :src="t.imageUrl" :alt="t.name" style="width: 100%; height: 100%; object-fit: cover;" />
                        <div v-else class="trek-img-placeholder" :style="{ background: getGradient(t) }">
                          <svg viewBox="0 0 24 24"><path d="M3 17l4-8 4 4 4-6 4 10"/></svg>
                        </div>
                        <span :class="'trek-badge badge-' + t.difficulty.toLowerCase()">{{ t.difficulty }}</span>
                        <span class="trek-open-tag">Open</span>
                      </div>
                      <div class="trek-body" style="display: flex; flex-direction: column; min-height: 220px;">
                        <div class="trek-name-user">{{ t.name }}</div>
                        <div class="trek-loc-user" style="margin-bottom: 0.4rem;">
                          <svg viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                          {{ t.location }}
                        </div>
                        <div style="font-size:0.75rem; color:var(--stone); line-height:1.4; margin-bottom:0.75rem; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden; text-overflow:ellipsis; flex-grow:1;">
                          {{ cleanDescription(t) }}
                        </div>
                        <div class="trek-row-meta" style="margin-bottom:1rem; border-top: 1px solid var(--stone-light); padding-top: 8px;">
                          <span class="trek-meta-pill">
                            <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                            {{ t.duration }} days
                          </span>
                          <span class="trek-meta-pill">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="12" height="12"><path d="M3 17l4-8 4 4 4-6 4 10"/></svg>
                            {{ t.distance }} km
                          </span>
                        </div>
                        <button class="btn-book" @click="openBookingModal(t)">
                          Book Now
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Right sidebar panel -->
            <div class="dashboard-sidebar-panel">

              <!-- Countdown to next trek -->
              <div v-if="nextTrek" class="upcoming-trek" style="margin-bottom:1.25rem">
                <div class="up-label">⏱ Next Trek In</div>
                <div class="up-name">{{ nextTrek.trekName }}</div>
                <div class="up-loc">📍 {{ nextTrek.location }}</div>
                <div class="up-countdown">
                  <div class="countdown-unit">
                    <span class="cu-val">{{ countdownVals.days }}</span>
                    <span class="cu-lbl">Days</span>
                  </div>
                  <div class="countdown-unit">
                    <span class="cu-val">{{ countdownVals.hours }}</span>
                    <span class="cu-lbl">Hrs</span>
                  </div>
                  <div class="countdown-unit">
                    <span class="cu-val">{{ countdownVals.minutes }}</span>
                    <span class="cu-lbl">Min</span>
                  </div>
                  <div class="countdown-unit">
                    <span class="cu-val">{{ countdownVals.seconds }}</span>
                    <span class="cu-lbl">Sec</span>
                  </div>
                </div>
              </div>

              <!-- Weather Widget -->
              <div v-if="nextTrek" class="weather-widget" style="margin-bottom:1.25rem">
                <div v-if="weather.loading" style="text-align: center; padding: 1.5rem 0;">
                  <div class="spinner" style="margin-bottom: 0.5rem;"></div>
                  <div style="font-size: 0.8rem; color: rgba(255,255,255,0.6);">Fetching real-time weather...</div>
                </div>
                <div v-else-if="weather.error" style="text-align: center; padding: 1.5rem 0; color: rgba(255,255,255,0.6); font-size: 0.85rem;">
                  ⚠️ Failed to load weather data
                </div>
                <div v-else>
                  <div class="weather-header">
                    <div>
                      <div class="weather-loc">📍 {{ weather.locationName }}</div>
                      <div class="weather-temp">{{ weather.temp }}<span class="weather-unit">°C</span></div>
                    </div>
                    <div class="weather-icon">{{ weather.icon }}</div>
                  </div>
                  <div class="weather-desc">{{ weather.desc }} — Live Forecast</div>
                  <div class="weather-metrics">
                    <div class="weather-metric"><strong>{{ weather.humidity }}%</strong>Humidity</div>
                    <div class="weather-metric"><strong>{{ weather.windSpeed }} km/h</strong>Wind</div>
                    <div class="weather-metric">
                      <strong>{{ nextTrek.latitude ? nextTrek.latitude.toFixed(2) : '0.0' }}°, {{ nextTrek.longitude ? nextTrek.longitude.toFixed(2) : '0.0' }}°</strong>
                      Coords
                    </div>
                  </div>
                </div>
              </div>

              <!-- Mini Calendar -->
              <div class="ts-card" style="margin-bottom:1.25rem">
                <div class="ts-card-header">
                  <div class="ts-card-title">Trek Calendar</div>
                  <button class="ts-card-action" @click="goTab('calendar')">Expand →</button>
                </div>
                <div class="ts-card-body" style="padding-top:0.75rem">
                  <div class="mini-calendar">
                    <div class="calendar-nav">
                      <div class="cal-nav-btn" @click="prevMonth">
                        <svg viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6"/></svg>
                      </div>
                      <div class="calendar-month">{{ calMonthLabel }}</div>
                      <div class="cal-nav-btn" @click="nextMonth">
                        <svg viewBox="0 0 24 24"><polyline points="9 18 15 12 9 6"/></svg>
                      </div>
                    </div>
                    <div class="calendar-grid">
                      <div v-for="d in ['Su','Mo','Tu','We','Th','Fr','Sa']" :key="d" class="cal-day-header">{{ d }}</div>
                      <div
                        v-for="(day, i) in calendarDays"
                        :key="i"
                        class="cal-day"
                        :class="{
                          today: day.isToday,
                          'has-trek': day.hasTrek,
                          'other-month': day.month !== 'current'
                        }"
                      >{{ day.day }}</div>
                    </div>
                    <div class="calendar-legend">
                      <div class="calendar-legend-item">
                        <div class="legend-dot ld-today"></div> Today
                      </div>
                      <div class="calendar-legend-item">
                        <div class="legend-dot ld-trek"></div> Trek Day
                      </div>
                    </div>
                    <!-- Events this month -->
                    <div v-if="calendarEvents.length" class="calendar-events">
                      <div v-for="e in calendarEvents" :key="e.name" class="cal-event">
                        <div class="cal-event-dot" style="background: var(--forest)"></div>
                        <span class="cal-event-name">{{ e.name }}</span>
                        <span class="cal-event-date">{{ e.date }}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>



            </div>
          </div>
        </section>

        <!-- ════════ EXPLORE TREKS TAB ════════ -->
        <section v-if="activeTab === 'explore'">
          <div class="page-header">
            <div class="page-header-left">
              <div class="page-eyebrow">Open Adventures</div>
              <div class="page-title">Explore <em>Treks</em></div>
            </div>
          </div>

          <!-- Search & Filters -->
          <div class="ts-card" style="margin-bottom:1.5rem; padding:1.25rem 1.5rem">
            <div style="display:flex; gap:1rem; flex-wrap:wrap; align-items:flex-end">
              <div style="flex:1; min-width:200px">
                <label style="font-size:0.72rem; font-weight:600; color:var(--forest); text-transform:uppercase; letter-spacing:0.06em; display:block; margin-bottom:5px">Search</label>
                <div class="topbar-search" style="width:100%; max-width:100%; border-radius:var(--radius)">
                  <svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                  <input v-model="searchQuery" type="text" placeholder="Trek name, location…" />
                </div>
              </div>
              <div style="min-width:160px">
                <label style="font-size:0.72rem; font-weight:600; color:var(--forest); text-transform:uppercase; letter-spacing:0.06em; display:block; margin-bottom:5px">Difficulty</label>
                <select v-model="difficultyFilter" style="padding:0.5rem 0.75rem; border:1px solid rgba(26,46,26,0.14); border-radius:var(--radius); font-family:'DM Sans',sans-serif; font-size:0.87rem; color:var(--bark); width:100%; outline:none; background:#fff">
                  <option value="">All Levels</option>
                  <option>Easy</option><option>Moderate</option><option>Hard</option>
                </select>
              </div>
              <div style="min-width:160px">
                <label style="font-size:0.72rem; font-weight:600; color:var(--forest); text-transform:uppercase; letter-spacing:0.06em; display:block; margin-bottom:5px">Location</label>
                <select v-model="locationFilter" style="padding:0.5rem 0.75rem; border:1px solid rgba(26,46,26,0.14); border-radius:var(--radius); font-family:'DM Sans',sans-serif; font-size:0.87rem; color:var(--bark); width:100%; outline:none; background:#fff">
                  <option value="">All Locations</option>
                  <option v-for="loc in uniqueLocations" :key="loc">{{ loc }}</option>
                </select>
              </div>
              <div style="min-width:140px">
                <label style="font-size:0.72rem; font-weight:600; color:var(--forest); text-transform:uppercase; letter-spacing:0.06em; display:block; margin-bottom:5px">Duration</label>
                <select v-model="durationFilter" style="padding:0.5rem 0.75rem; border:1px solid rgba(26,46,26,0.14); border-radius:var(--radius); font-family:'DM Sans',sans-serif; font-size:0.87rem; color:var(--bark); width:100%; outline:none; background:#fff">
                  <option value="">Any Duration</option>
                  <option value="1-5">1–5 days</option>
                  <option value="6-9">6–9 days</option>
                  <option value="10+">10+ days</option>
                </select>
              </div>
              <button class="btn-outline" style="white-space:nowrap; align-self:flex-end" @click="searchQuery=''; difficultyFilter=''; locationFilter=''; durationFilter=''; quickFilter='All'">Reset</button>
            </div>

            <!-- Quick filter chips -->
            <div class="treks-filter-bar" style="margin-top:1rem; margin-bottom:0">
              <button v-for="f in ['All','Easy','Moderate','Hard']" :key="f"
                class="filter-chip" :class="{ active: quickFilter === f, ['chip-'+f.toLowerCase()]: f !== 'All' }"
                @click="quickFilter = f">{{ f }}</button>
              <span style="margin-left:auto; font-size:0.78rem; color:var(--stone); align-self:center">
                {{ filteredTreks.length }} trek{{ filteredTreks.length !== 1 ? 's' : '' }} found
              </span>
            </div>
          </div>

          <!-- Trek cards grid -->
          <div class="treks-grid-user">
            <div v-for="t in filteredTreks" :key="t.id" class="trek-card-user">
              <div class="trek-img-user">
                <img v-if="t.imageUrl" :src="t.imageUrl" :alt="t.name" style="width: 100%; height: 100%; object-fit: cover;" />
                <div v-else class="trek-img-placeholder" :style="{ background: getGradient(t) }">
                  <svg viewBox="0 0 24 24"><path d="M3 17l4-8 4 4 4-6 4 10"/></svg>
                </div>
                <span :class="'trek-badge badge-' + t.difficulty.toLowerCase()">{{ t.difficulty }}</span>
                <span class="trek-open-tag">Open</span>
              </div>
              <div class="trek-body" style="display: flex; flex-direction: column; min-height: 220px;">
                <div class="trek-name-user">{{ t.name }}</div>
                <div class="trek-loc-user" style="margin-bottom: 0.4rem;">
                  <svg viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                  {{ t.location }}
                </div>
                <div style="font-size:0.78rem; color:var(--stone); margin-bottom:0.75rem; line-height:1.5; flex-grow: 1;">{{ cleanDescription(t) }}</div>
                <div class="trek-row-meta" style="margin-bottom:1rem; border-top: 1px solid var(--stone-light); padding-top: 8px;">
                  <span class="trek-meta-pill">
                    <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                    {{ t.duration }} days
                  </span>
                  <span class="trek-meta-pill">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="12" height="12"><path d="M3 17l4-8 4 4 4-6 4 10"/></svg>
                    {{ t.distance }} km
                  </span>
                </div>
                <button class="btn-book" @click="openBookingModal(t)">
                  Book Now
                </button>
              </div>
            </div>
          </div>
            </div>
          </div>

          <div v-if="filteredTreks.length === 0" class="empty-state" style="margin-top:1rem">
            <svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <p>No treks match your filters.</p>
            <p><a @click="searchQuery=''; difficultyFilter=''; locationFilter=''; durationFilter=''; quickFilter='All'">Clear all filters</a></p>
          </div>
        </section>

        <!-- ════════ MY BOOKINGS TAB ════════ -->
        <section v-if="activeTab === 'bookings'">
          <div class="page-header">
            <div class="page-header-left">
              <div class="page-eyebrow">Trekker</div>
              <div class="page-title">My <em>Bookings</em></div>
            </div>
          </div>

          <div v-if="myBookings.length === 0" class="empty-state">
            <svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            <p>No bookings yet.</p>
            <p><a @click="goTab('explore')">Explore open treks →</a></p>
          </div>

          <div class="bookings-stack">
            <div v-for="b in myBookings" :key="b.id" class="booking-row">
              <div class="booking-accent" :class="'ba-' + b.difficulty.toLowerCase()"></div>
              <div class="booking-main">
                <div class="booking-trek-name">{{ b.trekName }}</div>
                <div class="booking-loc">📍 {{ b.location }}</div>
                <div class="booking-dates mono">{{ b.startDate }} → {{ b.endDate }}</div>
                <div v-if="b.guide" class="booking-guide-info" style="font-size: 0.78rem; color: var(--stone); margin-top: 6px; display: flex; align-items: center; gap: 8px;">
                  <span>👤 Guide: <strong>{{ b.guide.name }}</strong> ({{ b.guide.phone }})</span>
                  <button style="color: var(--forest); font-weight: 600; cursor: pointer; border: none; background: none; padding: 0; font-size: 0.78rem; text-decoration: underline;" @click="openGuideModal(b.guide)">View Profile</button>
                </div>
              </div>
              <div class="booking-meta">
                <div class="bm-row">
                  <span class="bm-label">Booking ID</span>
                  <span class="mono">#{{ b.id }}</span>
                </div>
                <div class="bm-row">
                  <span class="bm-label">Booked On</span>
                  <span class="mono">{{ b.bookedOn }}</span>
                </div>
                <div class="bm-row">
                  <span class="bm-label">Difficulty</span>
                  <span :class="'diff-pill pill-' + b.difficulty.toLowerCase()">{{ b.difficulty }}</span>
                </div>
                <div class="bm-row">
                  <span class="bm-label">Amount</span>
                  <span class="bm-price">₹{{ b.price.toLocaleString() }}</span>
                </div>
                <div class="bm-row">
                  <span class="bm-label">Status</span>
                  <span :class="'status-pill status-' + b.status.toLowerCase()">{{ b.status }}</span>
                </div>
                <div v-if="b.status === 'Booked'" style="display: flex; gap: 0.5rem; margin-top: 0.5rem; width: 100%;">
                  <button class="btn-cancel" @click="cancelBooking(b)" style="flex: 1;">Cancel</button>
                  <button class="btn-outline" @click="openChecklistModal(b)" style="flex: 1.5; padding: 0.35rem 0.5rem; font-size: 0.72rem; border-radius: 4px; border: 1px solid var(--forest); color: var(--forest); background: transparent; cursor: pointer; font-weight: 600; display: flex; align-items: center; justify-content: center; gap: 2px;">📋 Checklist</button>
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- ════════ TREK HISTORY TAB ════════ -->
        <section v-if="activeTab === 'history'">
          <div class="page-header">
            <div class="page-header-left">
              <div class="page-eyebrow">Trekker</div>
              <div class="page-title">Trek <em>History</em></div>
            </div>
            <button class="btn-gold" @click="requestExport" :disabled="exportPending">
              {{ exportPending ? '⏳ Exporting…' : '⬇ Export CSV' }}
            </button>
          </div>

          <div v-if="trekHistory.length === 0" class="empty-state">
            <svg viewBox="0 0 24 24"><path d="M3 17l4-8 4 4 4-6 4 10"/></svg>
            <p>No completed treks yet. Your history will appear here.</p>
          </div>

          <div class="ts-table-wrap">
            <table class="ts-table">
              <thead>
                <tr>
                  <th>Trek</th>
                  <th>Location</th>
                  <th>Dates</th>
                  <th>Duration</th>
                  <th>Difficulty</th>
                  <th>Paid</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="h in trekHistory" :key="h.id">
                  <td class="cell-name">{{ h.trekName }}</td>
                  <td>{{ h.location }}</td>
                  <td class="mono">{{ h.startDate }}<br>→ {{ h.endDate }}</td>
                  <td>—</td>
                  <td><span :class="'diff-pill pill-' + h.difficulty.toLowerCase()">{{ h.difficulty }}</span></td>
                  <td class="mono">{{ h.price > 0 ? '₹' + h.price.toLocaleString() : '—' }}</td>
                  <td><span :class="'status-pill status-' + h.status.toLowerCase()">{{ h.status }}</span></td>
                </tr>
              </tbody>
            </table>
          </div>

          <div v-if="exportPending" class="export-notice">
            <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            CSV export triggered — you'll receive an email with your data shortly.
          </div>
        </section>

        <!-- ════════ TREK CALENDAR TAB ════════ -->
        <section v-if="activeTab === 'calendar'">
          <div class="page-header">
            <div class="page-header-left">
              <div class="page-eyebrow">Schedule</div>
              <div class="page-title">Trek <em>Calendar</em></div>
            </div>
          </div>

          <div style="display:grid; grid-template-columns:1fr 320px; gap:1.75rem; align-items:start">
            <!-- Large calendar -->
            <div class="ts-card">
              <div class="ts-card-header">
                <div class="ts-card-title">{{ calMonthLabel }}</div>
                <div style="display:flex; gap:0.5rem">
                  <div class="cal-nav-btn" @click="prevMonth">
                    <svg viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6"/></svg>
                  </div>
                  <div class="cal-nav-btn" @click="nextMonth">
                    <svg viewBox="0 0 24 24"><polyline points="9 18 15 12 9 6"/></svg>
                  </div>
                </div>
              </div>
              <div class="ts-card-body">
                <div class="calendar-grid" style="gap:4px">
                  <div v-for="d in ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']" :key="d"
                    class="cal-day-header" style="font-size:0.7rem; padding:8px 0">{{ d }}</div>
                  <div
                    v-for="(day, i) in calendarDays"
                    :key="i"
                    class="cal-day"
                    style="font-size:0.88rem; border-radius:8px"
                    :class="{
                      today: day.isToday,
                      'has-trek': day.hasTrek,
                      'other-month': day.month !== 'current'
                    }"
                    :title="day.hasTrek ? 'Trek day!' : ''"
                  >{{ day.day }}</div>
                </div>
                <div class="calendar-legend" style="margin-top:1.25rem; gap:1.5rem">
                  <div class="calendar-legend-item">
                    <div class="legend-dot ld-today"></div> Today
                  </div>
                  <div class="calendar-legend-item">
                    <div class="legend-dot ld-trek"></div> Booked Trek Day
                  </div>
                </div>
              </div>
            </div>

            <!-- Side panel: scheduled treks -->
            <div>
              <div class="ts-card" style="margin-bottom:1.25rem">
                <div class="ts-card-header">
                  <div class="ts-card-title">Scheduled Treks</div>
                </div>
                <div class="ts-card-body">
                  <div v-if="!myBookings.filter(b=>b.status==='Booked').length" class="empty-state" style="padding:2rem">
                    <svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                    <p>No upcoming treks.</p>
                  </div>
                  <div v-for="b in myBookings.filter(b=>b.status==='Booked')" :key="b.id"
                    style="padding:1rem 0; border-bottom:1px solid rgba(26,46,26,0.06)">
                    <div style="font-family:'Playfair Display',serif; font-size:1rem; font-weight:700; color:var(--forest); margin-bottom:0.25rem">{{ b.trekName }}</div>
                    <div style="font-size:0.78rem; color:var(--stone); margin-bottom:0.35rem">📍 {{ b.location }}</div>
                    <div style="font-family:'Space Mono',monospace; font-size:0.72rem; color:var(--bark)">{{ b.startDate }} → {{ b.endDate }}</div>
                  </div>
                </div>
              </div>

              <!-- All available trek dates -->
              <div v-if="upcomingAvailableTreks.length" class="ts-card">
                <div class="ts-card-header">
                  <div class="ts-card-title">Available This Month</div>
                </div>
                <div class="ts-card-body">
                  <div v-for="t in upcomingAvailableTreks.slice(0,4)" :key="t.id"
                    style="padding:0.75rem 0; border-bottom:1px solid rgba(26,46,26,0.05); display:flex; gap:10px; align-items:center">
                    <div :class="'trek-badge badge-'+t.difficulty.toLowerCase()" style="position:static; font-size:0.55rem; padding:2px 6px">{{ t.difficulty }}</div>
                    <div style="flex:1">
                      <div style="font-weight:600; font-size:0.85rem; color:var(--forest)">{{ t.name }}</div>
                      <div style="font-family:'Space Mono',monospace; font-size:0.65rem; color:var(--stone)">{{ formatDate(t.startDate) }}</div>
                    </div>
                    <span style="font-size:0.8rem; color:var(--gold); font-weight:600">{{ t.slotsLeft }} slots</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- ════════ PROFILE TAB ════════ -->
        <section v-if="activeTab === 'profile'">
          <div class="page-header">
            <div class="page-header-left">
              <div class="page-eyebrow">Account</div>
              <div class="page-title">My <em>Profile</em></div>
            </div>
          </div>

          <div class="profile-layout">
            <!-- Left: avatar card -->
            <div class="profile-card-left">
              <div class="profile-avatar-xl">{{ userInitial }}</div>
              <div class="profile-name-xl">{{ profile.name }}</div>
              <div class="profile-email-xl" style="margin-bottom:0.25rem">{{ profile.email }}</div>
              <div class="profile-id-xl" style="font-family:'Space Mono',monospace; font-size:0.75rem; color:var(--gold); font-weight:700; margin-bottom:1rem">Trekker ID: {{ profile.memberId }}</div>
              <div class="profile-badges">
                <div class="profile-badge-item">
                  <svg viewBox="0 0 24 24"><path d="M3 17l4-8 4 4 4-6 4 10"/></svg>
                  Treks Completed <strong>{{ trekHistory.filter(h=>h.status==='Completed').length }}</strong>
                </div>
                <div class="profile-badge-item">
                  <svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                  Active Bookings <strong>{{ myBookings.filter(b=>b.status==='Booked').length }}</strong>
                </div>
                <div class="profile-badge-item">
                  <svg viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                  City <strong>{{ profile.city || '—' }}</strong>
                </div>
              </div>
            </div>

            <!-- Right: forms -->
            <div>
              <div class="profile-form-section">
                <div class="form-section-title">Edit Profile</div>
                <div class="form-row">
                  <div class="form-group">
                    <label>Full Name</label>
                    <input v-model="profile.name" type="text" placeholder="Your full name" />
                  </div>
                  <div class="form-group">
                    <label>Phone</label>
                    <input v-model="profile.phone" type="tel" placeholder="+91 XXXXX XXXXX" />
                  </div>
                </div>
                <div class="form-row full">
                  <div class="form-group">
                    <label>Email</label>
                    <input v-model="profile.email" type="email" placeholder="you@email.com" />
                  </div>
                </div>
                <div class="form-row">
                  <div class="form-group">
                    <label>City</label>
                    <input v-model="profile.city" type="text" placeholder="Your city" />
                  </div>
                  <div class="form-group">
                    <label>Emergency Contact</label>
                    <input v-model="profile.emergency" type="tel" placeholder="+91 XXXXX XXXXX" />
                  </div>
                </div>
                <div class="form-row full">
                  <div class="form-group">
                    <label>About Me</label>
                    <textarea v-model="profile.bio" rows="3" placeholder="Tell us about your trekking experience…"></textarea>
                  </div>
                </div>
                <div style="display:flex; justify-content:flex-end; margin-top:1rem">
                  <button class="btn-gold" @click="saveProfile">Save Changes</button>
                </div>
              </div>

              <!-- Password -->
              <div class="profile-form-section" style="margin-bottom:0">
                <div class="form-section-title">Change Password</div>
                <div class="form-row full">
                  <div class="form-group">
                    <label>Current Password</label>
                    <input v-model="pwForm.current" type="password" placeholder="••••••••" />
                  </div>
                </div>
                <div class="form-row">
                  <div class="form-group">
                    <label>New Password</label>
                    <input v-model="pwForm.new" type="password" placeholder="••••••••" />
                  </div>
                  <div class="form-group">
                    <label>Confirm New Password</label>
                    <input v-model="pwForm.confirm" type="password" placeholder="••••••••" />
                  </div>
                </div>
                <div style="display:flex; justify-content:flex-end; margin-top:1rem">
                  <button class="btn-primary" @click="changePassword">Update Password</button>
                </div>
              </div>
            </div>
          </div>
        </section>



      </div><!-- /page-content -->
    </div><!-- /ts-main-content -->

    <!-- ── BOOKING MODAL ────────────────────────────── -->
    <transition name="toast">
      <div v-if="showBookingModal" class="ts-modal-overlay" @click.self="showBookingModal = false">
        <div class="ts-modal" style="max-width: 800px; width: 100%;">
          <div class="ts-modal-header">
            <span class="ts-modal-title">Trek Details & Booking</span>
            <button class="modal-close" @click="showBookingModal = false">✕</button>
          </div>
          <div class="ts-modal-body" v-if="bookingTarget">
            <div style="display: grid; grid-template-columns: 1.2fr 1.8fr; gap: 1.5rem;">
              <!-- Left Column: Trek Info -->
              <div style="border-right: 1px solid var(--stone-light); padding-right: 1.5rem;">
                <div v-if="bookingTarget.imageUrl" style="width: 100%; height: 160px; border-radius: 4px; overflow: hidden; margin-bottom: 1rem; border: 1px solid var(--stone-light);">
                  <img :src="bookingTarget.imageUrl" :alt="bookingTarget.name" style="width: 100%; height: 100%; object-fit: cover;" />
                </div>
                <div style="font-size: 1.2rem; font-weight: 700; color: var(--forest); margin-bottom: 4px;">{{ bookingTarget.name }}</div>
                <div style="font-size: 0.85rem; color: var(--stone); margin-bottom: 0.75rem;">📍 {{ bookingTarget.location }}</div>
                
                <div style="margin-top: 0.5rem; background: var(--snow); padding: 10px; border-radius: 4px; border: 1px solid var(--stone-light); font-size: 0.82rem; display: flex; flex-direction: column; gap: 6px;">
                  <div style="display: flex; justify-content: space-between;"><strong>Difficulty:</strong> <span :class="'diff-pill pill-'+bookingTarget.difficulty.toLowerCase()">{{ bookingTarget.difficulty }}</span></div>
                  <div style="display: flex; justify-content: space-between;"><strong>Duration:</strong> <span>{{ bookingTarget.duration }} days</span></div>
                  <div style="display: flex; justify-content: space-between;"><strong>Distance:</strong> <span>{{ bookingTarget.distance }} km</span></div>
                </div>
                
                <div style="font-size: 0.8rem; color: var(--stone); margin-top: 1rem; line-height: 1.5;">
                  {{ bookingTarget.description }}
                </div>
              </div>
              
              <!-- Right Column: Batches list -->
              <div style="display: flex; flex-direction: column; min-width: 0;">
                <h4 style="font-weight: 700; color: var(--forest); font-size: 1rem; margin-bottom: 0.75rem;">Available Batches</h4>
                
                <div v-if="bookingTarget.batches && bookingTarget.batches.length" style="max-height: 340px; overflow-y: auto; display: flex; flex-direction: column; gap: 10px; padding-right: 4px;">
                  <div v-for="b in bookingTarget.batches" :key="b.id" style="border: 1px solid rgba(200, 146, 42, 0.25); background: var(--snow); border-radius: 4px; padding: 12px; display: flex; flex-direction: column; gap: 8px;">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                      <span class="mono" style="font-weight: 700; color: var(--gold); font-size: 0.85rem;">{{ b.batchCode }}</span>
                      <span style="font-weight: 700; color: var(--forest); font-size: 1.05rem;">₹{{ b.price.toLocaleString() }}</span>
                    </div>
                    
                    <div style="display: flex; justify-content: space-between; font-size: 0.8rem; color: var(--stone);">
                      <span>📅 {{ formatDate(b.startDate) }}</span>
                      <span>👥 {{ b.slots - b.booked }} slots left</span>
                    </div>
                    
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 4px; border-top: 1px dashed rgba(26,46,26,0.08); padding-top: 8px;">
                      <span style="font-size: 0.78rem; color: var(--stone);">👤 Guide: <strong>{{ b.staff || 'TBD' }}</strong></span>
                      <button 
                        class="btn-book"
                        :class="{ 'btn-booked': isBooked(b.id), 'btn-full': !isBooked(b.id) && b.booked >= b.slots }"
                        :disabled="isBooked(b.id) || b.booked >= b.slots"
                        style="padding: 4px 12px; font-size: 0.78rem; border-radius: 3px;"
                        @click="bookBatch(b)">
                        {{ isBooked(b.id) ? '✔ Booked' : b.booked >= b.slots ? 'Full' : 'Book Batch' }}
                      </button>
                    </div>
                  </div>
                </div>
                
                <div v-else style="display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; padding: 2.5rem 1rem; border: 1px dashed rgba(26,46,26,0.18); border-radius: 4px; background: var(--snow);">
                  <div style="font-size: 2.5rem; margin-bottom: 0.5rem;">🎒</div>
                  <div style="font-size: 0.85rem; font-weight: 600; color: var(--forest); margin-bottom: 6px;">No Batches Available</div>
                  <div style="font-size: 0.78rem; color: var(--stone); line-height: 1.5; max-width: 280px;">
                    No batches are available at this moment. Please wait for batches to open or contact our support team at <a href="mailto:support@trailsync.com" style="color: var(--gold); text-decoration: underline; font-weight: 600;">support@trailsync.com</a> for more details.
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div class="ts-modal-footer">
            <button class="btn-modal-cancel" @click="showBookingModal = false">Close</button>
          </div>
        </div>
      </div>
    </transition>

    <!-- ── GUIDE PROFILE MODAL ────────────────────── -->
    <transition name="toast">
      <div v-if="showGuideModal" class="ts-modal-overlay" @click.self="showGuideModal = false">
        <div class="ts-modal ts-modal-sm">
          <div class="ts-modal-header">
            <span class="ts-modal-title">Guide Profile</span>
            <button class="modal-close" @click="showGuideModal = false">✕</button>
          </div>
          <div class="ts-modal-body" style="text-align:center" v-if="guideTarget">
            <img :src="guideTarget.photoUrl" :alt="guideTarget.name" style="width:100px; height:100px; border-radius:50%; object-fit:cover; margin-bottom:1rem; border:3px solid var(--gold)" />
            <h3 style="font-family:'Playfair Display',serif; font-size:1.3rem; margin-bottom:0.25rem">{{ guideTarget.name }}</h3>
            <div style="font-size:0.8rem; color:var(--stone); margin-bottom:1rem; font-weight:600; text-transform:uppercase; letter-spacing:0.05em">{{ guideTarget.designation }}</div>
            
            <div style="text-align:left; background:var(--cream); padding:1rem; border-radius:var(--radius); margin-bottom:1rem; font-size:0.85rem">
              <div style="margin-bottom:0.5rem"><strong>Experience:</strong> {{ guideTarget.experienceYears }} years ({{ guideTarget.completedTreksCount }} treks completed)</div>
              <div style="margin-bottom:0.5rem"><strong>Certifications:</strong> {{ guideTarget.certifications }}</div>
              <div style="margin-bottom:0.5rem"><strong>Languages:</strong> {{ guideTarget.languages }}</div>
              <div style="margin-bottom:0.5rem"><strong>Staff ID:</strong> {{ guideTarget.memberId }}</div>
            </div>
            
            <div style="display:flex; flex-direction:column; gap:0.25rem; font-size:0.8rem; color:var(--bark)">
              <div>📞 {{ guideTarget.phone }}</div>
              <div>✉️ {{ guideTarget.email }}</div>
            </div>
          </div>
          <div class="ts-modal-footer">
            <button class="btn-modal-cancel" @click="showGuideModal = false">Close</button>
          </div>
        </div>
      </div>
    </transition>

    <!-- ── CHECKLIST MODAL ────────────────────────── -->
    <transition name="toast">
      <div v-if="showChecklistModal" class="ts-modal-overlay" @click.self="showChecklistModal = false">
        <div class="ts-modal" style="max-width:550px">
          <div class="ts-modal-header">
            <span class="ts-modal-title">Trek Checklist</span>
            <button class="modal-close" @click="showChecklistModal = false">✕</button>
          </div>
          <div class="ts-modal-body" v-if="checklistTargetBooking">
            <h3 style="font-family:'Playfair Display',serif; font-size:1.2rem; margin-bottom:0.5rem">{{ checklistTargetBooking.trekName }}</h3>
            <p style="font-size:0.8rem; color:var(--stone); margin-bottom:1.5rem">
              Carry these items to ensure a safe and comfortable trek. Your checked items will persist automatically.
            </p>
            
            <!-- Section 1: Standard Packing List -->
            <div style="margin-bottom:1.5rem">
              <h4 style="font-size:0.85rem; text-transform:uppercase; color:var(--forest); letter-spacing:0.05em; margin-bottom:0.75rem; border-bottom:1px solid rgba(0,0,0,0.06); padding-bottom:4px">🎒 Standard Packing List</h4>
              <div style="display:flex; flex-direction:column; gap:0.5rem">
                <div v-if="!checklistItems.filter(i => i.category === 'default').length" style="font-size:0.8rem; color:var(--stone)">No standard items.</div>
                <label v-for="item in checklistItems.filter(i => i.category === 'default')" :key="item.id" style="display:flex; align-items:flex-start; gap:8px; font-size:0.85rem; cursor:pointer">
                  <input type="checkbox" :checked="item.isCompleted" @change="toggleChecklistItem(item)" style="margin-top:3px" />
                  <span :style="{ textDecoration: item.isCompleted ? 'line-through' : 'none', color: item.isCompleted ? 'var(--stone)' : 'inherit' }">{{ item.itemName }}</span>
                </label>
              </div>
            </div>

            <!-- Section 2: Guide Recommended Gear -->
            <div>
              <h4 style="font-size:0.85rem; text-transform:uppercase; color:var(--gold); letter-spacing:0.05em; margin-bottom:0.75rem; border-bottom:1px solid rgba(0,0,0,0.06); padding-bottom:4px">👤 Guide Recommended Gear</h4>
              <div style="display:flex; flex-direction:column; gap:0.5rem">
                <div v-if="!checklistItems.filter(i => i.category === 'guide').length" style="font-size:0.8rem; color:var(--stone); font-style:italic">No additional recommendations from the guide yet.</div>
                <label v-for="item in checklistItems.filter(i => i.category === 'guide')" :key="item.id" style="display:flex; align-items:flex-start; gap:8px; font-size:0.85rem; cursor:pointer">
                  <input type="checkbox" :checked="item.isCompleted" @change="toggleChecklistItem(item)" style="margin-top:3px" />
                  <span :style="{ textDecoration: item.isCompleted ? 'line-through' : 'none', color: item.isCompleted ? 'var(--stone)' : 'inherit' }">{{ item.itemName }}</span>
                </label>
              </div>
            </div>
          </div>
          <div class="ts-modal-footer">
            <button class="btn-modal-cancel" @click="showChecklistModal = false">Close</button>
          </div>
        </div>
      </div>
    </transition>

    <!-- ── TOAST NOTIFICATIONS ──────────────────────── -->
    <div class="ts-toast-wrap">
      <transition name="toast">
        <div v-if="toast.show" class="ts-toast">
          <svg viewBox="0 0 24 24">
            <path v-if="toast.type==='success'" d="M20 6L9 17l-5-5"/>
            <circle v-else cx="12" cy="12" r="10"/>
          </svg>
          {{ toast.msg }}
        </div>
      </transition>
    </div>
  </div>
  `
};
