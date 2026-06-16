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
      sidebarCollapsed: true,
      toast: { show: false, msg: '', type: 'success' },
      showProfileDropdown: false,

      // ── DATA ──────────────────────────────────────
      userName: USER_INITIAL_NAME,
      isEditingProfile: false,
      editProfile: { ...USER_INITIAL_PROFILE },
      profileImageFile: null,
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
      showPaymentModal: false,
      paymentTrekBatch: null,
      selectedPaymentMethod: 'UPI',
      isPendingRetry: false,
      retryBookingId: null,

      // ── SIMULATED PAYMENT GATEWAY STATE ───────────
      paymentProcessing: false,
      paymentProcessingMsg: '',
      paymentProcessingProgress: 0,
      paymentResultState: null,
      paymentDetails: {
        cardNumber: '',
        cardName: '',
        cardExpiry: '',
        cardCvv: '',
        upiId: '',
        bank: 'State Bank of India'
      },

      // ── SEARCH / FILTERS ─────────────────────────
      searchQuery: '',
      difficultyFilter: '',
      locationFilter: '',
      durationFilter: '',
      quickFilter: 'All',
      showDiffFilterDropdown: false,
      showLocFilterDropdown: false,
      showDurFilterDropdown: false,

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

      // ── SUPPORT STATE ─────────────────────────────
      supportTickets: [],
      supportForm: { subject: '', message: '', category: 'General' },
      submittingSupport: false,
      loadingSupport: false,
      expandedFaq: null,
      showCategoryDropdown: false,

      // ── INTERACTIVE WIDGETS STATE ──────────────────
      showPrepDrawer: false,
      guideMessage: '',
      guideChatHistory: [
        { sender: 'guide', text: 'Hello! I am your guide for the upcoming Tada Falls Trek. Feel free to ask me any questions about prep, gear, or conditions!' }
      ],
      guideIsTyping: false,
      communityPosts: [
        { id: 1, author: 'Aarav Mehta', avatar: 'AM', title: 'Tada Falls Wonder', trekName: 'Tada Falls Trek', text: 'Navigating the rocky stream beds and slippery boulders of Tada Falls was challenging but incredibly rewarding. The final pool of crystal-clear water cascading down the red cliffs was the perfect reward. We spent hours swimming and enjoying the absolute tranquility of the deep forest.', likes: 24, comments: 5, img: 'https://images.unsplash.com/photo-1544644181-1484b3fdfc62?w=600&fit=crop' },
        { id: 2, author: 'Nisha Sharma', avatar: 'NS', title: 'Kedarkantha Summit!', trekName: 'Kedarkantha Trek', text: 'The summit climb started at 3 AM under a canopy of brilliant stars. The temperature dropped to -6°C, freezing our water bottles, but the final push to the top was magical. Watching the golden sun rise over the snow-capped Himalayan peaks was a deeply spiritual experience I will cherish forever.', likes: 142, comments: 18, img: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=600&fit=crop' },
        { id: 3, author: 'Kabir Dev', avatar: 'KD', title: 'Valley of Flowers Bloom', trekName: 'Valley of Flowers', text: 'Trekking through the valley in late July was like walking into a painting. Hundreds of varieties of wild alpine flowers carpeted the landscape as far as the eye could see. The gentle mist rolling over the mountains and the absolute silence made the journey feel like a dream.', likes: 89, comments: 12, img: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=600&fit=crop' },
        { id: 4, author: 'Priya Verma', avatar: 'PV', title: 'Crossing Hampta Pass', trekName: 'Hampta Pass', text: 'The dramatic transition of scenery on this trek is mind-blowing. One day you are walking through the lush green forests of Kullu, and the next you cross the pass into the cold, barren, rock-strewn desert of Spiti. Camping next to the turquoise waters of Chandratal lake was the highlight of our trip.', likes: 76, comments: 9, img: 'https://images.unsplash.com/photo-1454496522488-7a8e488e8606?w=600&fit=crop' },
        { id: 5, author: 'Rohan Sen', avatar: 'RS', title: 'Nagalapuram Ridge Climb', trekName: 'Nagalapuram Falls Trek', text: 'The trail started with dry deciduous scrubs but soon transitioned into a lush gorge filled with deep water pools. Climbing the steep ridges gave us panoramic views of the Andhra plains below. Jumping into the cool, deep freshwater pools at the end of the day made all the sweat worthwhile.', likes: 53, comments: 7, img: 'https://images.unsplash.com/photo-1501555088652-021faa106b9b?w=600&fit=crop' },
        { id: 6, author: 'Meera Joshi', avatar: 'MJ', title: 'Mystical Talle Valley', trekName: 'Talle Valley Trek', text: "Arunachal's dense bamboo and pine forests are unlike anything else in India. The trail was covered in rich moss and giant ferns, with occasional rains adding to the mystical atmosphere. Spotting a rare cloud leopard track in the soft mud made us realize how wild and untouched this sanctuary is.", likes: 110, comments: 14, img: 'https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?w=600&fit=crop' }
      ],
      // ── SOCIAL STATE ──────────────────────────────
      socialGroups: [],
      socialMessages: [],
      selectedSocialTrekId: null,
      newSocialMessageText: '',
      loadingSocial: false,
      socialGroupMembersList: [],
      showSocialProfileModal: false,
      socialProfileTarget: null,
      hasUnreadAnnouncements: false
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
      const states = this.availableTreks.map(t => {
        if (!t.location) return '';
        const parts = t.location.split(',');
        return parts.length > 1 ? parts[parts.length - 1].trim() : t.location.trim();
      }).filter(s => s);
      return [...new Set(states)].sort();
    },

    // Filtered treks list
    filteredTreks() {
      return this.availableTreks.filter(t => {
        const q = this.searchQuery.toLowerCase();
        const matchSearch = !q || t.name.toLowerCase().includes(q) || t.location.toLowerCase().includes(q);
        const matchDiff = !this.difficultyFilter || t.difficulty === this.difficultyFilter;
        const matchLoc = !this.locationFilter || (
          t.location && (
            t.location.trim() === this.locationFilter ||
            t.location.split(',').map(s => s.trim()).includes(this.locationFilter)
          )
        );
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
    dashboardEasyTreks() {
      const list = this.availableTreks.filter(t => t.difficulty.toLowerCase() === 'easy');
      if (list.length >= 3) return list.slice(0, 3);
      const fallbacks = [
        { name: 'Triund Trek', location: 'Dharamshala, HP', duration: 2, distance: 9, difficulty: 'Easy', price: 2500, imageUrl: 'https://images.unsplash.com/photo-1596831167051-11c67bd1fc73?w=500&q=80' },
        { name: 'Kheerganga Trek', location: 'Kasol, HP', duration: 2, distance: 12, difficulty: 'Easy', price: 1800, imageUrl: 'https://images.unsplash.com/photo-1626621422471-eb1fa6fc1816?w=500&q=80' },
        { name: 'Nag Tibba', location: 'Mussoorie, UK', duration: 2, distance: 10, difficulty: 'Easy', price: 2200, imageUrl: 'https://images.unsplash.com/photo-1544644181-1484b3fdfc62?w=500&q=80' }
      ];
      return [...list, ...fallbacks].slice(0, 3);
    },
    dashboardModerateTreks() {
      const list = this.availableTreks.filter(t => t.difficulty.toLowerCase() === 'moderate');
      if (list.length >= 3) return list.slice(0, 3);
      const fallbacks = [
        { name: 'Valley of Flowers', location: 'Chamoli, UK', duration: 6, distance: 38, difficulty: 'Moderate', price: 8200, imageUrl: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=500&q=80' },
        { name: 'Hampta Pass', location: 'Manali, HP', duration: 5, distance: 35, difficulty: 'Moderate', price: 8200, imageUrl: 'https://images.unsplash.com/photo-1544644181-1484b3fdfc62?w=500&q=80' },
        { name: 'Kuari Pass', location: 'Joshimath, UK', duration: 6, distance: 33, difficulty: 'Moderate', price: 7800, imageUrl: 'https://images.unsplash.com/photo-1454496522488-7a8e488e8606?w=500&q=80' }
      ];
      return [...list, ...fallbacks].slice(0, 3);
    },
    dashboardHardTreks() {
      const list = this.availableTreks.filter(t => t.difficulty.toLowerCase() === 'hard' || t.difficulty.toLowerCase() === 'difficult');
      if (list.length >= 3) return list.slice(0, 3);
      const fallbacks = [
        { name: 'Roopkund Trek', location: 'Chamoli, UK', duration: 8, distance: 53, difficulty: 'Hard', price: 11000, imageUrl: 'https://images.unsplash.com/photo-1585409677983-0f6c41ca9c3b?w=500&q=80' },
        { name: 'Pin Parvati Pass', location: 'Kullu, HP', duration: 11, distance: 110, difficulty: 'Hard', price: 24000, imageUrl: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=500&q=80' },
        { name: 'Rupin Pass', location: 'Sangla, HP', duration: 8, distance: 52, difficulty: 'Hard', price: 13500, imageUrl: 'https://images.unsplash.com/photo-1454496522488-7a8e488e8606?w=500&q=80' }
      ];
      return [...list, ...fallbacks].slice(0, 3);
    },
    selectedSocialGroupTrek() {
      return this.socialGroups.find(t => t.id === this.selectedSocialTrekId) || null;
    },
    currentGroupMessages() {
      return this.socialMessages.filter(m => m.trekId === this.selectedSocialTrekId).map(m => {
        return {
          id: m.id,
          trekId: m.trekId,
          sender: m.senderRole === 'staff' || m.senderRole === 'admin' ? 'guide' : 'trekker',
          senderRole: m.senderRole,
          name: m.senderName,
          text: m.messageText,
          isAnnouncement: m.isAnnouncement,
          timestamp: m.createdAt ? new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''
        };
      });
    },
    currentGroupAnnouncements() {
      return this.socialMessages
        .filter(m => m.isAnnouncement && m.trekId === this.selectedSocialTrekId)
        .map(m => ({
          id: m.id,
          trekId: m.trekId,
          title: m.announcementTitle || 'Announcement',
          content: m.messageText,
          date: m.createdAt ? new Date(m.createdAt).toLocaleDateString([], { day: '2-digit', month: 'short' }) : ''
        }));
    },
  },

  methods: {
    // ── NAV ────────────────────────────────────────
    goTab(tab, options = {}) {
      const validTabs = ['dashboard', 'explore', 'bookings', 'history', 'profile', 'support', 'social'];
      if (!validTabs.includes(tab)) return;

      this.selectedSocialTrekId = null;
      let targetHash = tab;

      if (window.location.hash.slice(1) === targetHash) {
        this.activateTab(tab);
        return;
      }

      window.location.hash = targetHash;
    },
    getCategoryClass(category) {
      const map = {
        'General Inquiry': 'cat-general',
        'Booking & Reservation': 'cat-booking',
        'Payments & Refunds': 'cat-payment',
        'Profile & Account Settings': 'cat-profile',
        'Technical Issue / Bug': 'cat-bug',
        'Feedback & Suggestions': 'cat-feedback'
      };
      return map[category] || 'cat-general';
    },
    activateTab(tab) {
      const validTabs = ['dashboard', 'explore', 'bookings', 'history', 'profile', 'support', 'social'];
      if (!tab || !validTabs.includes(tab)) return;

      this.activeTab = tab;
      if (tab === 'support') {
        this.fetchUserTickets();
      } else if (tab === 'social') {
        this.selectedSocialTrekId = null;
        this.fetchSocialGroups();
      }
      if (window.innerWidth <= 900) {
        this.sidebarOpen = false;
        this.sidebarCollapsed = true;
      }
      localStorage.setItem('userActiveTab', tab);

      this.resetPageScroll();
    },
    handleHashChange() {
      const hash = window.location.hash.slice(1);
      if (hash.startsWith('social/group/')) {
        const trekId = parseInt(hash.replace('social/group/', ''), 10);
        this.activeTab = 'social';
        this.selectedSocialTrekId = isNaN(trekId) ? null : trekId;
        if (this.selectedSocialTrekId) {
          this.fetchSocialGroupMessages(this.selectedSocialTrekId);
          this.fetchSocialGroupMembers(this.selectedSocialTrekId);
        }
      } else {
        this.activateTab(hash);
      }
    },
    resetPageScroll() {
      this.$nextTick(() => {
        window.scrollTo(0, 0);
        const el = this.$el ? this.$el.querySelector('.page-content') : document.querySelector('.page-content');
        if (el) {
          el.scrollTop = 0;
          requestAnimationFrame(() => { el.scrollTop = 0; });
        }
      });
    },
    openSidebar() {
      this.sidebarOpen = false;
      this.sidebarCollapsed = false;
    },
    closeSidebar() {
      this.sidebarOpen = false;
      this.sidebarCollapsed = true;
    },
    toggleMobileSidebar() {
      this.sidebarOpen = !this.sidebarOpen;
      this.sidebarCollapsed = !this.sidebarOpen;
    },
    goProfileTab() {
      this.showProfileDropdown = false;
      this.goTab('profile');
    },
    toggleFilterDropdown(type) {
      const current = this[type];
      this.showDiffFilterDropdown = false;
      this.showLocFilterDropdown = false;
      this.showDurFilterDropdown = false;
      this.showCategoryDropdown = false;
      this[type] = !current;
    },
    closeDropdowns() {
      this.showProfileDropdown = false;
      this.showDiffFilterDropdown = false;
      this.showLocFilterDropdown = false;
      this.showDurFilterDropdown = false;
      this.showCategoryDropdown = false;
    },
    sendGuideMessage() {
      if (!this.guideMessage.trim()) return;
      const userTxt = this.guideMessage.trim();
      this.guideChatHistory.push({ sender: 'user', text: userTxt });
      this.guideMessage = '';
      this.guideIsTyping = true;
      setTimeout(() => {
        this.guideIsTyping = false;
        let reply = '';
        const txtLower = userTxt.toLowerCase();
        if (txtLower.includes('woolen') || txtLower.includes('cold') || txtLower.includes('jacket') || txtLower.includes('sweater')) {
          reply = "Yes, temperatures can drop down to 10°C or lower near the waterfalls at night, especially if it rains. I highly recommend packing at least one warm fleece or a light jacket and a waterproof outer layer!";
        } else if (txtLower.includes('shoes') || txtLower.includes('boot') || txtLower.includes('gear')) {
          reply = "For Tada Falls, the trail involves walking over wet, slippery boulders and river crossings. Good trekking shoes with excellent grip (like Vibram soles) are a must. Avoid normal trainers if possible!";
        } else if (txtLower.includes('weather') || txtLower.includes('rain') || txtLower.includes('storm')) {
          reply = "There is a live thunderstorm warning for the district. The water levels in the pools can rise quickly. We will monitor the conditions closely on the morning of departure and take safety precautions.";
        } else {
          reply = "I've noted your query! Make sure you carry a 20-30L daypack, a raincoat, and energy bars. Let me know if you need help with anything else for your Tada Falls trip.";
        }
        this.guideChatHistory.push({ sender: 'guide', text: reply });
      }, 1500);
    },
    navigateToTrek(trekName) {
      this.goTab('explore');
      this.searchQuery = trekName;
      setTimeout(() => {
        const trek = this.availableTreks.find(t => t.name.toLowerCase() === trekName.toLowerCase());
        if (trek) {
          this.openBookingModal(trek);
        }
      }, 100);
    },

    // ── TREK HELPERS ──────────────────────────────
    bookFeaturedTrek(trekName) {
      if (!this.availableTreks) return;
      const trek = this.availableTreks.find(t => t.name.toLowerCase() === trekName.toLowerCase());
      if (trek) {
        this.openBookingModal(trek);
      } else {
        this.goTab('explore');
        this.showToast(`Looking for "${trekName}" in the catalog...`, 'info');
      }
    },
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
    bookBatch(batch) {
      this.paymentTrekBatch = batch;
      this.isPendingRetry = false;
      this.retryBookingId = null;
      this.resetPaymentForm();
      this.showPaymentModal = true;
    },
    payPendingBooking(b) {
      this.paymentTrekBatch = {
        id: b.trekId,
        name: b.trekName,
        location: b.location,
        price: b.price || b.bookingPrice || 5000,
        batchCode: b.batchCode || 'N/A'
      };
      this.isPendingRetry = true;
      this.retryBookingId = b.id;
      this.resetPaymentForm();
      this.showPaymentModal = true;
    },
    resetPaymentForm() {
      this.paymentResultState = null;
      this.paymentProcessing = false;
      this.paymentProcessingProgress = 0;
      this.paymentProcessingMsg = '';
      this.paymentDetails = {
        cardNumber: '',
        cardName: '',
        cardExpiry: '',
        cardCvv: '',
        upiId: '',
        bank: 'State Bank of India'
      };
    },
    async dismissPaymentModal(shouldFetch = true) {
      this.showPaymentModal = false;
      this.showBookingModal = false;
      this.paymentResultState = null;
      if (shouldFetch) {
        await this.fetchUserData();
      }
    },
    onCardNumberInput(e) {
      let val = e.target.value.replace(/\D/g, '');
      if (val.length > 16) val = val.slice(0, 16);
      let formatted = '';
      for (let i = 0; i < val.length; i++) {
        if (i > 0 && i % 4 === 0) formatted += ' ';
        formatted += val[i];
      }
      this.paymentDetails.cardNumber = formatted;
    },
    onCardExpiryInput(e) {
      let val = e.target.value.replace(/\D/g, '');
      if (val.length > 4) val = val.slice(0, 4);
      if (val.length > 2) {
        this.paymentDetails.cardExpiry = val.slice(0, 2) + '/' + val.slice(2);
      } else {
        this.paymentDetails.cardExpiry = val;
      }
    },
    onCardCvvInput(e) {
      let val = e.target.value.replace(/\D/g, '');
      if (val.length > 3) val = val.slice(0, 3);
      this.paymentDetails.cardCvv = val;
    },
    async processSimulatedPayment(status) {
      if (!this.paymentTrekBatch) return;

      // Start simulated loading screen
      this.paymentProcessing = true;
      this.paymentProcessingProgress = 15;
      this.paymentProcessingMsg = 'Establishing secure handshake with payment gateway...';

      const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

      await sleep(600);
      this.paymentProcessingProgress = 45;
      this.paymentProcessingMsg = 'Encrypting payment credentials (256-bit AES)...';

      await sleep(600);
      this.paymentProcessingProgress = 75;
      this.paymentProcessingMsg = 'Authorizing transaction with bank servers...';

      await sleep(600);
      this.paymentProcessingProgress = 90;
      this.paymentProcessingMsg = 'Finalizing reservation details...';

      try {
        let res, data;
        if (this.isPendingRetry) {
          res = await fetch(`/api/bookings/pay/${this.retryBookingId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ payment_status: status })
          });
          data = await res.json();
        } else {
          res = await fetch('/api/bookings/book', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              trek_id: this.paymentTrekBatch.id,
              payment_status: status
            })
          });
          data = await res.json();
        }

        this.paymentProcessingProgress = 100;
        await sleep(350);

        if (res.ok) {
          this.paymentProcessing = false;
          this.paymentResultState = status;

          if (status === 'Paid') {
            this.showToast(data.message || 'Payment successful! Trek booked.', 'success');
          } else if (status === 'Pending') {
            this.showToast(data.message || 'Payment is pending. You can complete it later.', 'warning');
          } else {
            this.showToast(data.message || 'Payment failed status simulated.', 'error');
          }
        } else {
          this.paymentProcessing = false;
          this.paymentResultState = 'Failed';
          this.showToast(data.error || 'Transaction failed', 'error');
        }
      } catch (e) {
        console.error('Payment error:', e);
        this.paymentProcessing = false;
        this.paymentResultState = 'Failed';
        this.showToast('Failed to contact server. Payment could not be processed.', 'error');
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
    handleProfileImageChange(e) {
      if (e.target.files && e.target.files.length > 0) {
        this.profileImageFile = e.target.files[0];
      } else {
        this.profileImageFile = null;
      }
    },
    async saveProfile() {
      try {
        const formData = new FormData();
        Object.keys(this.editProfile).forEach(key => {
          if (this.editProfile[key] !== null && this.editProfile[key] !== undefined) {
            formData.append(key, this.editProfile[key]);
          }
        });
        if (this.profileImageFile) {
          formData.append('profile_image', this.profileImageFile);
        }

        const res = await fetch('/api/user/profile', {
          method: 'POST',
          body: formData
        });
        const data = await res.json();
        if (res.ok) {
          this.profile = { ...this.editProfile };
          if (data.profile_image_url) {
            this.profile.profile_image_url = data.profile_image_url;
          }
          this.userName = this.profile.name;
          this.isEditingProfile = false;
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
          this.editProfile = { ...this.profile };
          this.userName = this.profile.name;
          this.fetchWeather();
        } else {
          console.error('Fetch user data returned status:', res.status);
        }
      } catch (e) {
        console.error('Fetch user data error:', e);
      }
    },
    async fetchUserTickets() {
      this.loadingSupport = true;
      try {
        const res = await fetch('/api/user/tickets');
        if (res.ok) {
          this.supportTickets = await res.json();
        } else {
          console.error('Fetch tickets status:', res.status);
        }
      } catch (e) {
        console.error('Fetch tickets error:', e);
      } finally {
        this.loadingSupport = false;
      }
    },
    async submitSupportTicket() {
      if (!this.supportForm.subject.trim() || !this.supportForm.message.trim()) {
        this.showToast('Please fill in both Subject and Message.', 'error');
        return;
      }
      this.submittingSupport = true;
      try {
        const res = await fetch('/api/user/tickets', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(this.supportForm)
        });
        if (res.ok) {
          const data = await res.json();
          this.showToast(data.message || 'Ticket submitted successfully!', 'success');
          this.supportForm = { subject: '', message: '', category: 'General' };
          await this.fetchUserTickets();
        } else {
          const data = await res.json();
          this.showToast(data.error || 'Failed to submit ticket.', 'error');
        }
      } catch (e) {
        console.error('Submit ticket error:', e);
        this.showToast('Server connection failed.', 'error');
      } finally {
        this.submittingSupport = false;
      }
    },
    async fetchSocialGroups() {
      try {
        const res = await fetch('/api/social/groups');
        if (res.ok) {
          this.socialGroups = await res.json();
          this.hasUnreadAnnouncements = this.socialGroups.some(g => g.hasUnreadAnnouncement);
        }
      } catch (e) {
        console.error("Error fetching social groups:", e);
      }
    },
    async fetchSocialGroupMessages(trekId, options = {}) {
      if (!options.silent) this.loadingSocial = true;
      try {
        const res = await fetch(`/api/social/group/${trekId}/messages`);
        if (res.ok) {
          const msgs = await res.json();
          this.socialMessages = msgs;
          if (!options.silent) {
            this.$nextTick(() => {
              const feed = this.$el ? this.$el.querySelector('.social-chat-feed') : document.querySelector('.social-chat-feed');
              if (feed) feed.scrollTop = feed.scrollHeight;
            });
          }
          this.fetchSocialGroupsSilent();
        }
      } catch (e) {
        console.error("Error fetching social messages:", e);
      } finally {
        if (!options.silent) this.loadingSocial = false;
      }
    },
    async fetchSocialGroupsSilent() {
      try {
        const res = await fetch('/api/social/groups');
        if (res.ok) {
          this.socialGroups = await res.json();
          this.hasUnreadAnnouncements = this.socialGroups.some(g => g.hasUnreadAnnouncement);
        }
      } catch (_) {}
    },
    async sendSocialMessage() {
      if (!this.newSocialMessageText.trim()) return;
      try {
        const text = this.newSocialMessageText.trim();
        this.newSocialMessageText = '';
        const res = await fetch(`/api/social/group/${this.selectedSocialTrekId}/messages`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messageText: text })
        });
        if (res.ok) {
          await this.fetchSocialGroupMessages(this.selectedSocialTrekId);
        } else {
          const errData = await res.json();
          this.showToast(errData.error || 'Failed to send message.', 'error');
        }
      } catch (e) {
        console.error("Error sending message:", e);
      }
    },
    async fetchSocialGroupMembers(trekId) {
      try {
        const res = await fetch(`/api/social/group/${trekId}/members`);
        if (res.ok) {
          const data = await res.json();
          const members = [];
          if (data.guide) {
            members.push(data.guide);
          }
          if (data.trekkers) {
            members.push(...data.trekkers);
          }
          this.socialGroupMembersList = members;
        }
      } catch (e) {
        console.error("Error fetching group members:", e);
      }
    },
    selectSocialGroup(trekId) {
      this.selectedSocialTrekId = trekId;
      window.location.hash = `social/group/${trekId}`;
      this.fetchSocialGroupMessages(trekId);
      this.fetchSocialGroupMembers(trekId);
    },
    openSocialProfileModal(p) {
      this.socialProfileTarget = p;
      this.showSocialProfileModal = true;
    },
    getChatBubbleStyle(m) {
      if (m.isAnnouncement) {
        return {
          background: '#fef2f2',
          border: '1px solid #fca5a5',
          color: '#991b1b',
          borderTopRightRadius: m.sender === 'guide' ? '0px' : '8px',
          borderTopLeftRadius: m.sender === 'guide' ? '8px' : '0px'
        };
      }
      if (m.sender === 'guide') {
        return {
          background: 'var(--cream)',
          border: '1px solid rgba(200, 146, 42, 0.25)',
          color: 'var(--bark)',
          borderTopRightRadius: '0px'
        };
      }
      return {
        background: '#ffffff',
        border: '1px solid rgba(26, 46, 26, 0.08)',
        color: 'var(--bark)',
        borderTopLeftRadius: '0px'
      };
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
    handleLogout() {
      localStorage.removeItem('userActiveTab');
      this.$emit('logout');
    },
  },

  mounted() {
    this.fetchUserData();
    this.startCountdown();

    // Cache bound event handler references to avoid Vue 3 method proxy reference mismatches
    this.hashListener = this.handleHashChange.bind(this);
    this.clickListener = this.closeDropdowns.bind(this);

    window.addEventListener('hashchange', this.hashListener);
    document.addEventListener('click', this.clickListener);

    const hash = window.location.hash.slice(1);
    const validTabs = ['dashboard', 'explore', 'bookings', 'history', 'profile', 'support', 'social'];
    if (hash && (validTabs.includes(hash) || hash.startsWith('social/group/'))) {
      if (!hash.startsWith('social/group/')) {
        this.activeTab = hash;
        localStorage.setItem('userActiveTab', hash);
      }
    } else {
      const savedTab = localStorage.getItem('userActiveTab');
      if (savedTab && validTabs.includes(savedTab)) {
        this.activeTab = savedTab;
        window.location.hash = savedTab;
      } else {
        window.location.hash = 'dashboard';
      }
    }
    if (this.activeTab === 'support') {
      this.fetchUserTickets();
    } else if (this.activeTab === 'social') {
      this.fetchSocialGroups();
    }

    // SILENT POLLING for social chat updates
    this.socialPollInterval = setInterval(() => {
      this.fetchSocialGroupsSilent();
      if (this.activeTab === 'social' && this.selectedSocialTrekId) {
        this.fetchSocialGroupMessages(this.selectedSocialTrekId, { silent: true });
      }
    }, 15000);
  },

  beforeUnmount() {
    if (this.countdownTimer) clearInterval(this.countdownTimer);
    if (this.socialPollInterval) clearInterval(this.socialPollInterval);
    window.removeEventListener('hashchange', this.hashListener);
    document.removeEventListener('click', this.clickListener);
  },

  template: `
  <div class="ts-user-layout">

    <!-- Mobile sidebar overlay -->
    <div class="sidebar-overlay" :class="{ visible: sidebarOpen }" @click="closeSidebar"></div>

    <!-- Mobile toggle -->
    <button class="sidebar-mobile-toggle" @click="toggleMobileSidebar">
      <svg viewBox="0 0 24 24"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
    </button>

    <aside class="ts-sidebar" :class="{ open: sidebarOpen, collapsed: sidebarCollapsed }">
      <!-- Brand -->
      <div class="sidebar-brand">
        <span class="sidebar-brand-name">Trail<span>Sync</span></span>
        <button class="btn-sidebar-close" @click="closeSidebar" title="Close Sidebar">
          <svg viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        </button>
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
          <svg viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>
          <span>Home</span>
        </div>
        <div class="sidebar-nav-item" :class="{ active: activeTab === 'explore' }" @click="goTab('explore')">
          <svg viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <span>Explore Treks</span>
        </div>
        <div class="sidebar-nav-item" :class="{ active: activeTab === 'bookings' }" @click="goTab('bookings')">
          <svg viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M16 2v4M8 2v4M3 10h18M10 16l2 2 4-4"/></svg>
          <span>My Bookings</span>
          <span v-if="myBookings.filter(b=>b.status==='Booked').length" class="sidebar-badge">
            {{ myBookings.filter(b=>b.status==='Booked').length }}
          </span>
        </div>
        <div class="sidebar-nav-item" :class="{ active: activeTab === 'history' }" @click="goTab('history')">
          <svg viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          <span>Trek History</span>
        </div>
        <div class="sidebar-nav-item" :class="{ active: activeTab === 'social' }" @click="goTab('social')" style="position: relative;">
          <svg viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
          <span>TrailSync Social</span>
          <span v-if="hasUnreadAnnouncements" class="social-notification-dot" style="position: absolute; top: 12px; right: 15px; width: 8px; height: 8px; background-color: #ef4444; border-radius: 50%;"></span>
        </div>

        <div class="sidebar-section-label" style="margin-top:0.5rem">Account</div>
        <div class="sidebar-nav-item" :class="{ active: activeTab === 'profile' }" @click="goTab('profile')">
          <svg viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
          <span>My Profile</span>
        </div>
        <div class="sidebar-nav-item" :class="{ active: activeTab === 'support' }" @click="goTab('support')">
          <svg viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
          <span>Support & Help</span>
        </div>
      </nav>

      <!-- Sidebar footer -->
      <div class="sidebar-footer">
        <button class="btn-logout-sidebar" @click="handleLogout">
          Sign Out
          <svg viewBox="0 0 24 24"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
        </button>
      </div>
    </aside>

    <!-- ── MAIN CONTENT ─────────────────────────────── -->
    <div class="ts-main-content" :class="{ expanded: sidebarCollapsed }">

      <!-- Top bar -->
      <div class="ts-topbar" :class="{ 'sidebar-closed': sidebarCollapsed }">
        <button v-if="sidebarCollapsed" class="btn-sidebar-open" @click="openSidebar" title="Open Sidebar">
          <svg viewBox="0 0 24 24"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
        </button>
        <div class="topbar-brand-group">
          <template v-if="sidebarCollapsed">
            <span class="topbar-logo-text" @click="goTab('dashboard')">Trail<span>Sync</span></span>
          </template>
          <template v-else>
            <div class="topbar-breadcrumb">
              TrailSync / <span>{{ activeTab === 'dashboard' ? 'Home' : (activeTab.charAt(0).toUpperCase() + activeTab.slice(1)) }}</span>
            </div>
          </template>
        </div>
        <div class="topbar-spacer"></div>
        <div class="topbar-search">
          <svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input v-model="searchQuery" type="text" placeholder="Search treks…" @keyup.enter="goTab('explore')" />
        </div>
        <div class="topbar-actions">
          <!-- Staff-style profile dropdown -->
          <div class="topbar-profile" style="position: relative;">
            <button class="topbar-profile-btn" @click.stop="showProfileDropdown = !showProfileDropdown" title="Profile">
              <div class="topbar-avatar">
                <svg viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              </div>
              <span class="topbar-profile-name">{{ profile.name ? profile.name.split(' ')[0] : 'Trekker' }}</span>
              <i class="bi bi-chevron-down" style="font-size: 0.7rem; margin-left: 4px; opacity: 0.7;"></i>
            </button>

            <div v-if="showProfileDropdown" class="profile-dropdown-overlay" @click="showProfileDropdown = false"></div>
            <div v-if="showProfileDropdown" class="profile-dropdown" @click.stop>
              <div class="profile-dropdown-header">
                <div class="pd-avatar">
                  <svg viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                </div>
                <div>
                  <div class="pd-name">{{ profile.name }}</div>
                  <div class="pd-id">ID: {{ profile.memberId || 'N/A' }}</div>
                </div>
              </div>
              <div class="pd-email"><i class="bi bi-envelope-fill me-2"></i>{{ profile.email || 'Not provided' }}</div>
              <div class="pd-email"><i class="bi bi-telephone-fill me-2"></i>{{ profile.phone || 'Not provided' }}</div>
              <div class="pd-divider"></div>
              <a class="pd-item" @click="goProfileTab">
                <i class="bi bi-person-fill me-2"></i>Edit Profile
              </a>
              <a class="pd-item pd-signout" @click="handleLogout">
                <i class="bi bi-box-arrow-right me-2"></i>Sign Out
              </a>
            </div>
          </div>
        </div>
      </div>

      <!-- ── PAGE CONTENT ─────────────────────────── -->
      <div class="page-content">

        <!-- ════════ DASHBOARD TAB ════════ -->
        <section v-if="activeTab === 'dashboard'">

          <!-- ── TALL HERO BANNER ────────────────────── -->
          <div class="dash-hero">

            <!-- Background image slideshow layers -->
            <div class="dash-hero-bg-layer dash-hero-bg-layer-1"></div>
            <div class="dash-hero-bg-layer dash-hero-bg-layer-2"></div>
            <div class="dash-hero-bg-layer dash-hero-bg-layer-3"></div>

            <!-- Dark gradient overlay -->
            <div class="dash-hero-overlay"></div>

            <!-- Slideshow indicator dots -->
            <div class="hero-slide-dots">
              <div class="hero-dot" id="hero-dot-1"></div>
              <div class="hero-dot" id="hero-dot-2"></div>
              <div class="hero-dot" id="hero-dot-3"></div>
            </div>

            <!-- Two-column content layout inside hero -->
            <div class="dash-hero-inner">
              <!-- Left: Greeting + CTA Buttons -->
              <div class="dash-hero-left">
                <div class="dash-hero-greeting">Welcome back, Trekker</div>
                <div class="dash-hero-name">Hello, <em>{{ profile.name ? profile.name.split(' ')[0] : 'Trekker' }}</em></div>
                <div class="dash-hero-punchline">Scale new heights. Discover your next epic journey.</div>

                <div class="dash-hero-left-cta">
                  <button class="btn-hero-primary" @click="goTab('explore')">Explore Treks</button>
                  <button class="btn-hero-ghost" @click="goTab('bookings')">My Bookings</button>
                </div>
              </div>

              <!-- Right: Stats Grid -->
              <div class="dash-hero-right" style="display:flex; align-items:center; justify-content:center;">
                <div class="dash-hero-stats-grid">
                  <div v-for="s in userStats" :key="s.label" class="hero-stat-item">
                    <div class="hero-stat-icon" :class="s.color">
                      <svg v-if="s.icon==='calendar'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line><path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01M16 18h.01"></path></svg>
                      <svg v-if="s.icon==='check'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 20L12 4l9 16H3z"></path><path d="M9 12l2 2 4-4"></path></svg>
                      <svg v-if="s.icon==='map'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21"></polygon><line x1="9" y1="3" x2="9" y2="18"></line><line x1="15" y1="6" x2="15" y2="21"></line></svg>
                      <svg v-if="s.icon==='rupee'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 3h12M6 8h12M6 3a6 6 0 0 1 6 6 6 6 0 0 1-6 6m15 6-9-9"/></svg>
                    </div>
                    <div class="hero-stat-info">
                      <div class="hero-stat-val">{{ s.value }}</div>
                      <div class="hero-stat-lbl">{{ s.label }}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div><!-- /dash-hero -->

          <!-- Main two-column grid -->
          <div class="dashboard-grid">
            <!-- Left column -->
            <div class="dashboard-main">

              <!-- Upcoming Treks panel -->
              <div class="ts-card">
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
                        <div class="booking-loc"><span class="css-loc-pin"></span>{{ b.location }}</div>
                        <div class="booking-dates mono">{{ formatDate(b.startDate) }} → {{ formatDate(b.endDate) }}</div>
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

            </div>

            <!-- Right sidebar panel -->
            <div class="dashboard-sidebar-panel">

              <!-- Countdown to next trek -->
              <div v-if="nextTrek" class="upcoming-trek">
                <div>
                  <div class="up-label">⏱ Next Trek In</div>
                  <div class="up-name">{{ nextTrek.trekName }}</div>
                  <div class="up-loc"><span class="css-loc-pin"></span>{{ nextTrek.location }}</div>
                </div>
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
                <button class="btn-up-details" @click="goTab('bookings')">
                  View Details
                </button>
              </div>

            </div>
          </div>

          <!-- ── CATEGORIZED TREK ROWS ── -->
          <div class="dashboard-trek-categories" style="margin-top: 3.5rem;">

            <!-- Easy Treks Row -->
            <div class="category-row-wrapper" style="margin-bottom: 3rem;">
              <div class="category-row-header" style="display:flex; justify-content:space-between; align-items:baseline; margin-bottom:1.25rem; border-bottom:1px solid rgba(26,46,26,0.08); padding-bottom:8px;">
                <div class="category-row-title" style="font-family:'Playfair Display',serif; font-size:1.4rem; font-weight:700; color:var(--forest);">Easy Trails <span style="font-family:'Space Mono',monospace; font-size:0.7rem; color:var(--gold); text-transform:uppercase; margin-left:10px; letter-spacing:0.05em; font-weight:600;">Beginner Friendly</span></div>
                <button class="btn-category-view-all" @click="goTab('explore')" style="background:none; border:none; color:var(--gold); font-weight:600; font-size:0.85rem; cursor:pointer; text-decoration:none; transition: all 0.2s ease;">View All Easy Treks →</button>
              </div>
              <div class="treks-grid-user">
                <div v-for="t in dashboardEasyTreks" :key="t.name" class="trek-card-user" @click="navigateToTrek(t.name)" style="cursor:pointer;">
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
                        {{ t.distance || 12 }} km
                      </span>
                    </div>
                    <button class="btn-book" @click.stop="navigateToTrek(t.name)">
                      Book Now
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <!-- Moderate Treks Row -->
            <div class="category-row-wrapper" style="margin-bottom: 3rem;">
              <div class="category-row-header" style="display:flex; justify-content:space-between; align-items:baseline; margin-bottom:1.25rem; border-bottom:1px solid rgba(26,46,26,0.08); padding-bottom:8px;">
                <div class="category-row-title" style="font-family:'Playfair Display',serif; font-size:1.4rem; font-weight:700; color:var(--forest);">Moderate Passages <span style="font-family:'Space Mono',monospace; font-size:0.7rem; color:var(--gold); text-transform:uppercase; margin-left:10px; letter-spacing:0.05em; font-weight:600;">Epic Journeys</span></div>
                <button class="btn-category-view-all" @click="goTab('explore')" style="background:none; border:none; color:var(--gold); font-weight:600; font-size:0.85rem; cursor:pointer; text-decoration:none; transition: all 0.2s ease;">View All Moderate Treks →</button>
              </div>
              <div class="treks-grid-user">
                <div v-for="t in dashboardModerateTreks" :key="t.name" class="trek-card-user" @click="navigateToTrek(t.name)" style="cursor:pointer;">
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
                        {{ t.distance || 35 }} km
                      </span>
                    </div>
                    <button class="btn-book" @click.stop="navigateToTrek(t.name)">
                      Book Now
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <!-- Hard Treks Row -->
            <div class="category-row-wrapper" style="margin-bottom: 3rem;">
              <div class="category-row-header" style="display:flex; justify-content:space-between; align-items:baseline; margin-bottom:1.25rem; border-bottom:1px solid rgba(26,46,26,0.08); padding-bottom:8px;">
                <div class="category-row-title" style="font-family:'Playfair Display',serif; font-size:1.4rem; font-weight:700; color:var(--forest);"> Challenging Summits <span style="font-family:'Space Mono',monospace; font-size:0.7rem; color:var(--gold); text-transform:uppercase; margin-left:10px; letter-spacing:0.05em; font-weight:600;">For Experienced Climbers</span></div>
                <button class="btn-category-view-all" @click="goTab('explore')" style="background:none; border:none; color:var(--gold); font-weight:600; font-size:0.85rem; cursor:pointer; text-decoration:none; transition: all 0.2s ease;">View All Hard Treks →</button>
              </div>
              <div class="treks-grid-user">
                <div v-for="t in dashboardHardTreks" :key="t.name" class="trek-card-user" @click="navigateToTrek(t.name)" style="cursor:pointer;">
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
                        {{ t.distance || 53 }} km
                      </span>
                    </div>
                    <button class="btn-book" @click.stop="navigateToTrek(t.name)">
                      Book Now
                    </button>
                  </div>
                </div>
              </div>
            </div>

          </div>

          <!-- ── Tales from the Trail (Community Feed) ── -->
          <div class="dashboard-community-feed" style="margin-top: 3.5rem;">
            <div class="feed-header" style="border-bottom:1px solid rgba(26,46,26,0.08); padding-bottom:8px; margin-bottom:1.5rem;">
              <div class="feed-title" style="font-family:'Playfair Display',serif; font-size:1.45rem; font-weight:700; color:var(--forest); display:flex; align-items:center;">
                <i class="bi bi-book" style="color:var(--gold); margin-right:10px; font-size:1.25rem;"></i>
                Tales from the Trail
                <span style="font-family:'Space Mono',monospace; font-size:0.7rem; color:var(--gold); text-transform:uppercase; margin-left:10px; letter-spacing:0.05em; font-weight:600;">Stories & Reviews from fellow Trekkers</span>
              </div>
            </div>

            <div class="treks-grid-user" style="margin-top: 1rem;">
              <div v-for="p in communityPosts" :key="p.id" class="pin-card" style="background:#fff; border:1px solid rgba(26,46,26,0.07); border-radius:var(--radius); overflow:hidden; box-shadow:0 4px 16px var(--shadow); transition:var(--transition); display:flex; flex-direction:column;">
                <div class="pin-img-container" style="height:135px; overflow:hidden; position:relative;">
                  <img :src="p.img" :alt="p.title" style="width:100%; height:100%; object-fit:cover; display:block;" />
                </div>
                <div class="pin-content" style="padding:1.1rem; flex-grow:1; display:flex; flex-direction:column; gap:0.5rem;">
                  <div class="pin-author" style="display:flex; align-items:center; gap:8px;">
                    <span class="pin-avatar" style="width:24px; height:24px; border-radius:50%; background:var(--gold); color:var(--forest); font-size:0.65rem; font-weight:700; display:flex; align-items:center; justify-content:center; font-family:'Playfair Display',serif;">{{ p.avatar }}</span>
                    <span class="pin-author-name" style="font-size:0.8rem; font-weight:600; color:var(--forest);">{{ p.author }}</span>
                  </div>
                  <h4 class="pin-card-title" style="font-family:'Playfair Display',serif; font-size:1.1rem; font-weight:700; color:var(--forest); margin:0;">{{ p.title }}</h4>
                  <div class="pin-trek-tag" style="font-family:'Space Mono',monospace; font-size:0.65rem; color:var(--gold); font-weight:600;"><i class="bi bi-geo-alt-fill"></i> {{ p.trekName }}</div>

                  <!-- CSS stylized quotes on start and end of story -->
                  <div class="story-text-container" style="position:relative; padding:0.5rem 1rem 0.5rem; margin-top:0.25rem; flex-grow:1;">
                    <span class="quote-mark quote-start" style="font-family:'Playfair Display',serif; font-size:2.5rem; color:var(--gold-light); line-height:1; position:absolute; left:-0.2rem; top:-0.3rem; user-select:none; opacity:0.8;">“</span>
                    <p class="pin-text" style="font-size:0.8rem; color:var(--stone); line-height:1.45; margin:0; font-style:italic;">{{ p.text }}</p>
                    <span class="quote-mark quote-end" style="font-family:'Playfair Display',serif; font-size:2.5rem; color:var(--gold-light); line-height:1; position:absolute; right:-0.2rem; bottom:-1.2rem; user-select:none; opacity:0.8;">”</span>
                  </div>
                </div>
                <!-- Card footer with action button -->
                <div class="pin-footer" style="padding:0.75rem 1.1rem; border-top:1px solid var(--stone-light); display:flex; justify-content:flex-end; align-items:center;">
                  <button class="btn-pin-static-action" @click="navigateToTrek(p.trekName)" style="border:none; background:none; color:var(--gold); font-weight:700; font-size:0.75rem; cursor:pointer; padding:0; display:flex; align-items:center; gap:4px; transition:color 0.2s ease;">
                    Go to Trek →
                  </button>
                </div>
              </div>
            </div>
          </div>

        </section>

        <!-- ════════ EXPLORE TREKS TAB ════════ -->
        <section v-if="activeTab === 'explore'" class="tab-section-content">
          <div class="page-header">
            <div class="page-header-left">
              <div class="page-eyebrow">Open Adventures</div>
              <div class="page-title">Explore <em>Treks</em></div>
            </div>
            <button class="btn-back-home" @click="goTab('dashboard')">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
              Back to Home
            </button>
          </div>

          <!-- Search & Filters -->
          <div class="ts-card" style="margin-bottom:1.5rem; padding:1.25rem 1.5rem; overflow:visible;">
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
                <div class="custom-select-wrapper" :class="{ 'is-open': showDiffFilterDropdown }">
                  <div class="custom-select-trigger" @click.stop="toggleFilterDropdown('showDiffFilterDropdown')">
                    <span>{{ difficultyFilter || 'All Levels' }}</span>
                    <svg viewBox="0 0 24 24" class="custom-select-arrow" :class="{ open: showDiffFilterDropdown }"><polyline points="6 9 12 15 18 9"/></svg>
                  </div>
                  <div v-if="showDiffFilterDropdown" class="custom-select-dropdown">
                    <div class="custom-select-options">
                      <div class="custom-select-option" :class="{ selected: difficultyFilter === '' }" @click="difficultyFilter = ''; showDiffFilterDropdown = false;">All Levels</div>
                      <div v-for="opt in ['Easy', 'Moderate', 'Hard']" :key="opt" class="custom-select-option" :class="{ selected: difficultyFilter === opt }" @click="difficultyFilter = opt; showDiffFilterDropdown = false;">{{ opt }}</div>
                    </div>
                  </div>
                </div>
              </div>
              <div style="min-width:160px">
                <label style="font-size:0.72rem; font-weight:600; color:var(--forest); text-transform:uppercase; letter-spacing:0.06em; display:block; margin-bottom:5px">Location</label>
                <div class="custom-select-wrapper" :class="{ 'is-open': showLocFilterDropdown }">
                  <div class="custom-select-trigger" @click.stop="toggleFilterDropdown('showLocFilterDropdown')">
                    <span>{{ locationFilter || 'All Locations' }}</span>
                    <svg viewBox="0 0 24 24" class="custom-select-arrow" :class="{ open: showLocFilterDropdown }"><polyline points="6 9 12 15 18 9"/></svg>
                  </div>
                  <div v-if="showLocFilterDropdown" class="custom-select-dropdown">
                    <div class="custom-select-options">
                      <div class="custom-select-option" :class="{ selected: locationFilter === '' }" @click="locationFilter = ''; showLocFilterDropdown = false;">All Locations</div>
                      <div v-for="loc in uniqueLocations" :key="loc" class="custom-select-option" :class="{ selected: locationFilter === loc }" @click="locationFilter = loc; showLocFilterDropdown = false;">{{ loc }}</div>
                    </div>
                  </div>
                </div>
              </div>
              <div style="min-width:160px">
                <label style="font-size:0.72rem; font-weight:600; color:var(--forest); text-transform:uppercase; letter-spacing:0.06em; display:block; margin-bottom:5px">Duration</label>
                <div class="custom-select-wrapper" :class="{ 'is-open': showDurFilterDropdown }">
                  <div class="custom-select-trigger" @click.stop="toggleFilterDropdown('showDurFilterDropdown')">
                    <span>{{ durationFilter === '1-5' ? '1–5 days' : durationFilter === '6-9' ? '6–9 days' : durationFilter === '10+' ? '10+ days' : 'Any Duration' }}</span>
                    <svg viewBox="0 0 24 24" class="custom-select-arrow" :class="{ open: showDurFilterDropdown }"><polyline points="6 9 12 15 18 9"/></svg>
                  </div>
                  <div v-if="showDurFilterDropdown" class="custom-select-dropdown">
                    <div class="custom-select-options">
                      <div class="custom-select-option" :class="{ selected: durationFilter === '' }" @click="durationFilter = ''; showDurFilterDropdown = false;">Any Duration</div>
                      <div class="custom-select-option" :class="{ selected: durationFilter === '1-5' }" @click="durationFilter = '1-5'; showDurFilterDropdown = false;">1–5 days</div>
                      <div class="custom-select-option" :class="{ selected: durationFilter === '6-9' }" @click="durationFilter = '6-9'; showDurFilterDropdown = false;">6–9 days</div>
                      <div class="custom-select-option" :class="{ selected: durationFilter === '10+' }" @click="durationFilter = '10+'; showDurFilterDropdown = false;">10+ days</div>
                    </div>
                  </div>
                </div>
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

          <div v-if="filteredTreks.length === 0" class="empty-state" style="margin-top:1rem">
            <svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <p>No treks match your filters.</p>
            <p><a @click="searchQuery=''; difficultyFilter=''; locationFilter=''; durationFilter=''; quickFilter='All'">Clear all filters</a></p>
          </div>
        </section>

        <!-- ════════ MY BOOKINGS TAB ════════ -->
        <section v-if="activeTab === 'bookings'" class="tab-section-content">
          <div class="page-header">
            <div class="page-header-left">
              <div class="page-eyebrow">Your Adventures</div>
              <div class="page-title">My <em>Bookings</em></div>
            </div>
            <button class="btn-back-home" @click="goTab('dashboard')">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
              Back to Home
            </button>
          </div>
          <div class="ts-card" style="max-width: 900px;">
            <div class="ts-card-body">
              <div v-if="myBookings.filter(b=>b.status==='Booked').length === 0" class="empty-state">
                <svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                <p>You have no active bookings.</p>
                <button class="btn-book" style="margin-top: 1rem" @click="goTab('explore')">Find a Trek</button>
              </div>
              <div class="bookings-stack">
                <div v-for="b in myBookings.filter(b=>b.status==='Booked')" :key="b.id" class="booking-row">
                  <div class="booking-accent" :class="'ba-' + b.difficulty.toLowerCase()"></div>
                  <div class="booking-main">
                    <div class="booking-trek-name">{{ b.trekName }}</div>
                    <div class="booking-loc"><span class="css-loc-pin"></span>{{ b.location }}</div>
                    <div class="booking-dates mono">{{ formatDate(b.startDate) }} → {{ formatDate(b.endDate) }}</div>
                    <div v-if="b.guide" class="booking-guide-info" style="font-size: 0.78rem; color: var(--stone); margin-top: 6px; display: flex; align-items: center; gap: 8px;">
                      <span>👤 Guide: <strong>{{ b.guide.name }}</strong> ({{ b.guide.phone }})</span>
                      <button style="color: var(--forest); font-weight: 600; cursor: pointer; border: none; background: none; padding: 0; font-size: 0.78rem; text-decoration: underline;" @click="openGuideModal(b.guide)">View Profile</button>
                    </div>
                  </div>
                  <div class="booking-meta">
                    <div class="bm-row">
                      <span class="bm-label">Payment</span>
                      <span :class="['status-pill', 
                        b.paymentStatus === 'Paid' ? 'status-open' : 
                        b.paymentStatus === 'Pending' ? 'status-closed' : 'status-closed'
                      ]" style="font-size:0.75rem; padding: 2px 8px; font-weight:700;">
                        {{ b.paymentStatus }}
                      </span>
                    </div>
                    <div class="bm-row">
                      <span class="bm-label">Amount</span>
                      <span class="bm-price">₹{{ (b.bookingPrice || b.price).toLocaleString() }}</span>
                    </div>
                    <div v-if="b.paymentStatus !== 'Paid'" class="bm-row">
                      <span class="bm-label">Paid</span>
                      <span style="font-weight:600; color:var(--red);">₹{{ (b.amountPaid || 0).toLocaleString() }}</span>
                    </div>
                    <div class="bm-row">
                      <span class="bm-label">Difficulty</span>
                      <span :class="'diff-pill pill-'+b.difficulty.toLowerCase()">{{b.difficulty}}</span>
                    </div>
                    <div style="display: flex; flex-direction: column; gap: 0.5rem; margin-top: 0.5rem; width: 100%;">
                      <div style="display: flex; gap: 0.5rem; width: 100%;">
                        <button class="btn-cancel" @click="cancelBooking(b)" style="flex: 1;">Cancel</button>
                        <button class="btn-outline" @click="openChecklistModal(b)" style="flex: 1.5; padding: 0.35rem 0.5rem; font-size: 0.72rem; border-radius: 4px; border: 1px solid var(--forest); color: var(--forest); background: transparent; cursor: pointer; font-weight: 600; display: flex; align-items: center; justify-content: center; gap: 2px;"><i class="bi bi-list-check"></i> Checklist</button>
                      </div>
                      <button v-if="b.paymentStatus === 'Pending'" class="btn-book" @click="payPendingBooking(b)" style="width: 100%; padding: 6px; font-size: 0.78rem; background: var(--gold); border-radius: 4px; border: none; font-weight: 700; color: var(--forest); cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 4px;">
                        <i class="bi bi-credit-card"></i> Pay Now
                      </button>
                      <button v-else-if="b.paymentStatus === 'Failed'" class="btn-book" @click="payPendingBooking(b)" style="width: 100%; padding: 6px; font-size: 0.78rem; background: var(--red); border-radius: 4px; border: none; font-weight: 700; color: white; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 4px;">
                        <i class="bi bi-arrow-repeat"></i> Retry Payment
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- ════════ TREK HISTORY TAB ════════ -->
        <section v-if="activeTab === 'history'" class="tab-section-content">
          <div class="page-header">
            <div class="page-header-left">
              <div class="page-eyebrow">Past Journeys</div>
              <div class="page-title">Trek <em>History</em></div>
            </div>
          </div>

          <div style="max-width: 900px;">
            <div class="ts-card">
              <div class="ts-card-header">
                <div class="ts-card-title">Completed Treks</div>
              </div>
              <div class="ts-card-body">
                <div v-if="trekHistory.length === 0" class="empty-state">
                  <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                  <p>No past treks found.</p>
                </div>
                <div class="bookings-stack">
                  <div v-for="h in trekHistory" :key="h.id" class="booking-row" style="opacity: 0.85">
                    <div class="booking-accent" style="background: var(--stone)"></div>
                    <div class="booking-main">
                      <div class="booking-trek-name">{{ h.trekName }}</div>
                      <div class="booking-loc"><span class="css-loc-pin"></span>{{ h.location }}</div>
                      <div class="booking-dates mono">{{ formatDate(h.startDate) }} → {{ formatDate(h.endDate) }}</div>
                    </div>
                    <div class="booking-meta">
                      <div class="bm-row"><span class="bm-label">Status</span><span class="status-pill status-completed" style="background: var(--mist); color: var(--forest)">{{ h.status }}</span></div>
                      <div class="bm-row"><span class="bm-label">Amount</span><span class="bm-price">₹{{ h.price.toLocaleString() }}</span></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>



        <!-- ════════ PROFILE TAB ════════ -->
        <section v-if="activeTab === 'profile'" class="tab-section-content">
          <div class="page-header">
            <div class="page-header-left">
              <div class="page-eyebrow">Account Details</div>
              <div class="page-title">My <em>Profile</em></div>
            </div>
          </div>

          <div class="dashboard-grid">
            <div class="dashboard-main">
              <div class="ts-card">
                <div class="ts-card-header" style="display: flex; justify-content: space-between; align-items: center;">
                  <div class="ts-card-title">Personal Information</div>
                  <button class="btn-outline" @click="isEditingProfile = !isEditingProfile" style="padding: 0.3rem 0.8rem; font-size: 0.8rem;">
                    {{ isEditingProfile ? 'Cancel Edit' : 'Edit Profile' }}
                  </button>
                </div>
                
                <div class="ts-card-body">
                  <!-- VIEW MODE -->
                  <div v-if="!isEditingProfile" style="display: flex; flex-direction: column; gap: 1.5rem">
                    <div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 1rem">
                      <div style="width: 80px; height: 80px; border-radius: 50%; background: var(--forest); color: white; display: flex; align-items: center; justify-content: center; font-size: 2rem; overflow: hidden; flex-shrink: 0;">
                        <img v-if="profile.profile_image_url" :src="profile.profile_image_url" style="width: 100%; height: 100%; object-fit: cover;" />
                        <span v-else>{{ profile.name ? profile.name[0].toUpperCase() : 'T' }}</span>
                      </div>
                      <div>
                        <div style="font-family: 'Playfair Display', serif; font-size: 1.5rem; font-weight: 700; color: var(--forest)">{{ profile.name }}</div>
                        <div style="font-size: 0.85rem; color: var(--stone)">{{ profile.email }}</div>
                      </div>
                    </div>
                    
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1.25rem; background: var(--snow); padding: 1.5rem; border-radius: 8px;">
                      <div>
                        <div style="font-size: 0.75rem; font-weight: 600; color: var(--stone); text-transform: uppercase; margin-bottom: 0.2rem">Phone</div>
                        <div style="color: var(--forest); font-weight: 500">{{ profile.phone || '—' }}</div>
                      </div>
                      <div>
                        <div style="font-size: 0.75rem; font-weight: 600; color: var(--stone); text-transform: uppercase; margin-bottom: 0.2rem">DOB</div>
                        <div style="color: var(--forest); font-weight: 500">{{ profile.dob || '—' }}</div>
                      </div>
                      <div>
                        <div style="font-size: 0.75rem; font-weight: 600; color: var(--stone); text-transform: uppercase; margin-bottom: 0.2rem">Blood Group</div>
                        <div style="color: var(--forest); font-weight: 500">{{ profile.blood_group || '—' }}</div>
                      </div>
                      <div>
                        <div style="font-size: 0.75rem; font-weight: 600; color: var(--stone); text-transform: uppercase; margin-bottom: 0.2rem">Location</div>
                        <div style="color: var(--forest); font-weight: 500">{{ profile.city || '—' }}</div>
                      </div>
                    </div>
                    
                    <div style="background: var(--snow); padding: 1.5rem; border-radius: 8px;">
                      <h4 style="font-size: 0.85rem; font-weight: 700; color: var(--forest); margin-bottom: 0.8rem">Safety & Medical</h4>
                      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1.25rem;">
                        <div>
                          <div style="font-size: 0.75rem; font-weight: 600; color: var(--stone); text-transform: uppercase; margin-bottom: 0.2rem">Emergency Contact</div>
                          <div style="color: var(--forest); font-weight: 500">{{ profile.emergency || '—' }}</div>
                        </div>
                        <div>
                          <div style="font-size: 0.75rem; font-weight: 600; color: var(--stone); text-transform: uppercase; margin-bottom: 0.2rem">Medical Info</div>
                          <div style="color: var(--forest); font-weight: 500">{{ profile.medical_info || 'None' }}</div>
                        </div>
                      </div>
                    </div>
                    
                    <div style="background: var(--snow); padding: 1.5rem; border-radius: 8px;">
                      <h4 style="font-size: 0.85rem; font-weight: 700; color: var(--forest); margin-bottom: 0.8rem">Trek Preferences</h4>
                      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 1.25rem;">
                        <div>
                          <div style="font-size: 0.75rem; font-weight: 600; color: var(--stone); text-transform: uppercase; margin-bottom: 0.2rem">Fitness Level</div>
                          <div style="color: var(--forest); font-weight: 500" style="text-transform: capitalize">{{ profile.fitness_level || '—' }}</div>
                        </div>
                        <div>
                          <div style="font-size: 0.75rem; font-weight: 600; color: var(--stone); text-transform: uppercase; margin-bottom: 0.2rem">Treks Done</div>
                          <div style="color: var(--forest); font-weight: 500">{{ profile.treks_done || 0 }}</div>
                        </div>
                        <div>
                          <div style="font-size: 0.75rem; font-weight: 600; color: var(--stone); text-transform: uppercase; margin-bottom: 0.2rem">Pref. Difficulty</div>
                          <div style="color: var(--forest); font-weight: 500" style="text-transform: capitalize">{{ profile.preferred_difficulty || '—' }}</div>
                        </div>
                        <div>
                          <div style="font-size: 0.75rem; font-weight: 600; color: var(--stone); text-transform: uppercase; margin-bottom: 0.2rem">Pref. Duration</div>
                          <div style="color: var(--forest); font-weight: 500" style="text-transform: capitalize">{{ profile.preferred_duration || '—' }}</div>
                        </div>
                        <div style="grid-column: 1 / -1;">
                          <div style="font-size: 0.75rem; font-weight: 600; color: var(--stone); text-transform: uppercase; margin-bottom: 0.2rem">Bio</div>
                          <div style="color: var(--forest); font-weight: 500">{{ profile.bio || 'No bio provided.' }}</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- EDIT MODE -->
                  <form v-else @submit.prevent="saveProfile" style="display: flex; flex-direction: column; gap: 1.25rem">
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                      <div style="grid-column: 1 / -1; margin-bottom: 0.5rem">
                        <label style="display: block; font-size: 0.8rem; font-weight: 600; color: var(--forest); margin-bottom: 0.4rem">Profile Image</label>
                        <input type="file" accept="image/*" @change="handleProfileImageChange" style="width: 100%; padding: 0.6rem; border: 1px solid rgba(26,46,26,0.15); border-radius: 6px; background: #fff" />
                      </div>
                      
                      <div>
                        <label style="display: block; font-size: 0.8rem; font-weight: 600; color: var(--forest); margin-bottom: 0.4rem">Full Name</label>
                        <input type="text" v-model="editProfile.name" style="width: 100%; padding: 0.75rem; border: 1px solid rgba(26,46,26,0.15); border-radius: 6px; background: #fff" required />
                      </div>
                      <div>
                        <label style="display: block; font-size: 0.8rem; font-weight: 600; color: var(--forest); margin-bottom: 0.4rem">Email Address</label>
                        <input type="email" v-model="editProfile.email" style="width: 100%; padding: 0.75rem; border: 1px solid rgba(26,46,26,0.15); border-radius: 6px; background: #f0f0f0" disabled />
                      </div>
                      <div>
                        <label style="display: block; font-size: 0.8rem; font-weight: 600; color: var(--forest); margin-bottom: 0.4rem">Phone Number</label>
                        <input type="tel" v-model="editProfile.phone" style="width: 100%; padding: 0.75rem; border: 1px solid rgba(26,46,26,0.15); border-radius: 6px; background: #fff" />
                      </div>
                      <div>
                        <label style="display: block; font-size: 0.8rem; font-weight: 600; color: var(--forest); margin-bottom: 0.4rem">Date of Birth</label>
                        <input type="date" v-model="editProfile.dob" style="width: 100%; padding: 0.75rem; border: 1px solid rgba(26,46,26,0.15); border-radius: 6px; background: #fff" />
                      </div>
                      <div>
                        <label style="display: block; font-size: 0.8rem; font-weight: 600; color: var(--forest); margin-bottom: 0.4rem">Blood Group</label>
                        <select v-model="editProfile.blood_group" style="width: 100%; padding: 0.75rem; border: 1px solid rgba(26,46,26,0.15); border-radius: 6px; background: #fff">
                          <option value="A+">A+</option><option value="A-">A-</option>
                          <option value="B+">B+</option><option value="B-">B-</option>
                          <option value="AB+">AB+</option><option value="AB-">AB-</option>
                          <option value="O+">O+</option><option value="O-">O-</option>
                        </select>
                      </div>
                      <div>
                        <label style="display: block; font-size: 0.8rem; font-weight: 600; color: var(--forest); margin-bottom: 0.4rem">City / State</label>
                        <input type="text" v-model="editProfile.city" style="width: 100%; padding: 0.75rem; border: 1px solid rgba(26,46,26,0.15); border-radius: 6px; background: #fff" />
                      </div>
                      <div style="grid-column: 1 / -1">
                        <label style="display: block; font-size: 0.8rem; font-weight: 600; color: var(--forest); margin-bottom: 0.4rem">Emergency Contact (Name & Phone)</label>
                        <input type="text" v-model="editProfile.emergency" style="width: 100%; padding: 0.75rem; border: 1px solid rgba(26,46,26,0.15); border-radius: 6px; background: #fff" />
                      </div>
                      <div style="grid-column: 1 / -1">
                        <label style="display: block; font-size: 0.8rem; font-weight: 600; color: var(--forest); margin-bottom: 0.4rem">Medical Conditions / Allergies</label>
                        <textarea v-model="editProfile.medical_info" rows="2" style="width: 100%; padding: 0.75rem; border: 1px solid rgba(26,46,26,0.15); border-radius: 6px; background: #fff"></textarea>
                      </div>
                      <div>
                        <label style="display: block; font-size: 0.8rem; font-weight: 600; color: var(--forest); margin-bottom: 0.4rem">Fitness Level</label>
                        <select v-model="editProfile.fitness_level" style="width: 100%; padding: 0.75rem; border: 1px solid rgba(26,46,26,0.15); border-radius: 6px; background: #fff">
                          <option value="beginner">Beginner</option>
                          <option value="intermediate">Intermediate</option>
                          <option value="experienced">Experienced</option>
                        </select>
                      </div>
                      <div>
                        <label style="display: block; font-size: 0.8rem; font-weight: 600; color: var(--forest); margin-bottom: 0.4rem">Treks Done</label>
                        <input type="number" v-model="editProfile.treks_done" min="0" style="width: 100%; padding: 0.75rem; border: 1px solid rgba(26,46,26,0.15); border-radius: 6px; background: #fff" />
                      </div>
                      <div style="grid-column: 1 / -1">
                        <label style="display: block; font-size: 0.8rem; font-weight: 600; color: var(--forest); margin-bottom: 0.4rem">Bio</label>
                        <textarea v-model="editProfile.bio" rows="2" style="width: 100%; padding: 0.75rem; border: 1px solid rgba(26,46,26,0.15); border-radius: 6px; background: #fff"></textarea>
                      </div>
                    </div>
                    <button type="submit" class="btn-book" style="align-self: flex-start; padding: 0.75rem 1.5rem">Save Changes</button>
                  </form>
                </div>
              </div>
            </div>

            <div class="dashboard-sidebar-panel">
              <div class="ts-card">
                <div class="ts-card-header">
                  <div class="ts-card-title">Security</div>
                </div>
                <div class="ts-card-body">
                  <form @submit.prevent="changePassword" style="display: flex; flex-direction: column; gap: 1rem">
                    <div>
                      <label style="display: block; font-size: 0.8rem; font-weight: 600; color: var(--forest); margin-bottom: 0.4rem">Current Password</label>
                      <input type="password" v-model="pwForm.current" style="width: 100%; padding: 0.6rem; border: 1px solid rgba(26,46,26,0.15); border-radius: 6px; background: #fff" />
                    </div>
                    <div>
                      <label style="display: block; font-size: 0.8rem; font-weight: 600; color: var(--forest); margin-bottom: 0.4rem">New Password</label>
                      <input type="password" v-model="pwForm.new" style="width: 100%; padding: 0.6rem; border: 1px solid rgba(26,46,26,0.15); border-radius: 6px; background: #fff" />
                    </div>
                    <div>
                      <label style="display: block; font-size: 0.8rem; font-weight: 600; color: var(--forest); margin-bottom: 0.4rem">Confirm New Password</label>
                      <input type="password" v-model="pwForm.confirm" style="width: 100%; padding: 0.6rem; border: 1px solid rgba(26,46,26,0.15); border-radius: 6px; background: #fff" />
                    </div>
                    <button type="submit" class="btn-outline" style="width: 100%; margin-top: 0.5rem">Update Password</button>
                  </form>
                </div>
              </div>

              <div class="ts-card" style="margin-top: 1.5rem">
                <div class="ts-card-body">
                  <h4 style="font-size: 1rem; font-weight: 700; color: var(--forest); margin-bottom: 0.5rem">Export Data</h4>
                  <p style="font-size: 0.8rem; color: var(--stone); margin-bottom: 1rem">Download a copy of your trekking history and bookings.</p>
                  <button @click="requestExport" class="btn-outline" style="width: 100%; display: flex; align-items: center; justify-content: center; gap: 0.5rem" :disabled="exportPending">
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                    {{ exportPending ? 'Exporting...' : 'Export as CSV' }}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- Support Tickets Section -->
        <section v-if="activeTab === 'support'" class="tab-section-content">
          <div class="explore-header" style="margin-bottom: 2rem">
            <div>
              <h2 class="explore-title" style="font-family:'Playfair Display',serif; font-size: 2rem; color: var(--forest)">Support & Help</h2>
              <p class="explore-subtitle" style="font-size: 0.9rem; color: var(--stone)">Raise issues, ask questions, or check the status of your tickets.</p>
            </div>
          </div>

          <div style="display: grid; grid-template-columns: 1fr; gap: 2rem; align-items: start;">
            <!-- Submit Ticket Form & History List container -->
            <div style="display: grid; grid-template-columns: 1.2fr 1.8fr; gap: 2rem; align-items: start;">
              <!-- Left: Submit Ticket -->
              <div class="ts-card">
                <div class="ts-card-body" style="padding: 2rem">
                  <h3 style="font-family:'Playfair Display',serif; font-size: 1.4rem; color: var(--forest); margin-bottom: 1.5rem; border-bottom: 1px solid rgba(26,46,26,0.08); padding-bottom: 0.75rem">Submit a Ticket</h3>
                  <form @submit.prevent="submitSupportTicket" style="display: flex; flex-direction: column; gap: 1.25rem">
                    <div>
                      <label style="display: block; font-size: 0.85rem; font-weight: 600; color: var(--forest); margin-bottom: 0.5rem">Subject</label>
                      <input type="text" v-model="supportForm.subject" placeholder="Summarize your issue..." style="width: 100%; padding: 0.75rem; border: 1px solid rgba(26,46,26,0.15); border-radius: 6px; background: #fff" required />
                    </div>
                    <div>
                      <label style="display: block; font-size: 0.85rem; font-weight: 600; color: var(--forest); margin-bottom: 0.5rem">Category</label>
                      <div class="custom-select-wrapper" :class="{ 'is-open': showCategoryDropdown }">
                        <div class="custom-select-trigger" @click.stop="showCategoryDropdown = !showCategoryDropdown" style="padding: 0.75rem; border: 1px solid rgba(26,46,26,0.15); border-radius: 6px; background: #fff; display: flex; justify-content: space-between; align-items: center; cursor: pointer; font-size: 0.9rem;">
                          <span>
                            {{
                              supportForm.category === 'General' ? 'General Inquiry' :
                              supportForm.category === 'Booking' ? 'Booking & Reservation' :
                              supportForm.category === 'Payment' ? 'Payments & Refunds' :
                              supportForm.category === 'Profile' ? 'Profile & Account Settings' :
                              supportForm.category === 'Bug' ? 'Technical Issue / Bug' :
                              supportForm.category === 'Feedback' ? 'Feedback & Suggestions' : 'General Inquiry'
                            }}
                          </span>
                          <svg viewBox="0 0 24 24" class="custom-select-arrow" :class="{ open: showCategoryDropdown }" style="width: 16px; height: 16px; transition: transform 0.2s;"><polyline points="6 9 12 15 18 9"/></svg>
                        </div>
                        <div v-show="showCategoryDropdown" class="custom-select-dropdown" style="z-index: 2000;">
                          <div class="custom-select-options">
                            <div class="custom-select-option" :class="{ selected: supportForm.category === 'General' }" @click="supportForm.category = 'General'; showCategoryDropdown = false;">General Inquiry</div>
                            <div class="custom-select-option" :class="{ selected: supportForm.category === 'Booking' }" @click="supportForm.category = 'Booking'; showCategoryDropdown = false;">Booking & Reservation</div>
                            <div class="custom-select-option" :class="{ selected: supportForm.category === 'Payment' }" @click="supportForm.category = 'Payment'; showCategoryDropdown = false;">Payments & Refunds</div>
                            <div class="custom-select-option" :class="{ selected: supportForm.category === 'Profile' }" @click="supportForm.category = 'Profile'; showCategoryDropdown = false;">Profile & Account Settings</div>
                            <div class="custom-select-option" :class="{ selected: supportForm.category === 'Bug' }" @click="supportForm.category = 'Bug'; showCategoryDropdown = false;">Technical Issue / Bug</div>
                            <div class="custom-select-option" :class="{ selected: supportForm.category === 'Feedback' }" @click="supportForm.category = 'Feedback'; showCategoryDropdown = false;">Feedback & Suggestions</div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div>
                      <label style="display: block; font-size: 0.85rem; font-weight: 600; color: var(--forest); margin-bottom: 0.5rem">Message Details</label>
                      <textarea v-model="supportForm.message" rows="5" placeholder="Describe the issue in detail..." style="width: 100%; padding: 0.75rem; border: 1px solid rgba(26,46,26,0.15); border-radius: 6px; background: #fff; resize: vertical" required></textarea>
                    </div>
                    <button type="submit" class="btn-primary" style="width: 100%; padding: 0.85rem; display: flex; align-items: center; justify-content: center; gap: 0.5rem" :disabled="submittingSupport">
                      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" v-if="!submittingSupport"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
                      {{ submittingSupport ? 'Submitting...' : 'Send Ticket' }}
                    </button>
                  </form>
                </div>
              </div>

              <!-- Right: Ticket History -->
              <div class="ts-card" style="min-height: 400px">
                <div class="ts-card-body" style="padding: 2rem">
                  <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; border-bottom: 1px solid rgba(26,46,26,0.08); padding-bottom: 0.75rem">
                    <h3 style="font-family:'Playfair Display',serif; font-size: 1.4rem; color: var(--forest)">Ticket History</h3>
                    <div style="display: flex; align-items: center; gap: 0.5rem">
                      <span style="font-size: 0.8rem; background: rgba(26,46,26,0.05); color: var(--forest); padding: 4px 10px; border-radius: 30px; font-weight: 600">
                        {{ supportTickets.length }} {{ supportTickets.length === 1 ? 'ticket' : 'tickets' }}
                      </span>
                    </div>
                  </div>

                  <!-- Loading State -->
                  <div v-if="loadingSupport" style="display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 4rem 0; gap: 1rem">
                    <div style="width: 32px; height: 32px; border: 3px solid rgba(26,46,26,0.1); border-top-color: var(--forest); border-radius: 50%; animation: spin 1s linear infinite;"></div>
                    <span style="font-size: 0.85rem; color: var(--stone)">Loading your support tickets...</span>
                  </div>

                  <!-- Empty State -->
                  <div v-else-if="!supportTickets.length" style="text-align: center; padding: 4rem 1rem">
                    <svg viewBox="0 0 24 24" width="48" height="48" style="stroke: var(--stone); opacity: 0.5; margin-bottom: 1rem" fill="none" stroke-width="1.5"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                    <h4 style="font-size: 1rem; color: var(--forest); font-weight: 600; margin-bottom: 0.25rem">No Tickets Found</h4>
                    <p style="font-size: 0.8rem; color: var(--stone)">Submit a ticket on the left to raise a concern or query.</p>
                  </div>

                  <!-- Ticket List -->
                  <div v-else style="display: flex; flex-direction: column; gap: 1rem; max-height: 600px; overflow-y: auto; padding-right: 4px">
                    <div v-for="ticket in supportTickets" :key="ticket.id" class="ts-card" style="border: 1px solid rgba(26,46,26,0.08); background: #fdfdfd">
                      <div class="ts-card-body" style="padding: 1.25rem">
                        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.75rem">
                          <div>
                            <span style="font-size: 0.75rem; font-weight: 700; color: var(--forest); margin-right: 8px; font-family: monospace;">{{ ticket.ticketId || ('TS26#' + String(ticket.id).padStart(3, '0')) }}</span>
                            <span class="category-tag" :class="getCategoryClass(ticket.category)" style="padding: 1px 6px; font-size: 0.65rem;">
                              {{ ticket.category || 'General Inquiry' }}
                            </span>
                          </div>
                          <span :style="{
                            fontSize: '0.75rem',
                            fontWeight: '700',
                            padding: '3px 10px',
                            borderRadius: '30px',
                            background: ticket.status === 'Resolved' ? 'rgba(40,167,69,0.1)' : 'rgba(255,193,7,0.15)',
                            color: ticket.status === 'Resolved' ? '#28a745' : '#d39e00'
                          }">
                            {{ ticket.status }}
                          </span>
                        </div>
                        <h4 style="font-weight: 700; color: var(--forest); font-size: 0.95rem; margin-bottom: 0.5rem">{{ ticket.cleanSubject || ticket.subject }}</h4>
                        <p style="font-size: 0.85rem; color: var(--stone); line-height: 1.4; white-space: pre-wrap">{{ ticket.message }}</p>
                        <div style="margin-top: 0.75rem; border-top: 1px solid rgba(0,0,0,0.04); padding-top: 0.5rem; display: flex; justify-content: space-between; align-items: center; font-size: 0.75rem; color: var(--stone)">
                          <span>Submitted on {{ ticket.createdAt }}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Frequently Asked Questions (FAQ) Section -->
            <div class="ts-card" style="margin-top: 1rem">
              <div class="ts-card-body" style="padding: 2.5rem">
                <h3 style="font-family:'Playfair Display',serif; font-size: 1.5rem; color: var(--forest); margin-bottom: 0.5rem">Frequently Asked Questions</h3>
                <p style="font-size: 0.85rem; color: var(--stone); margin-bottom: 2rem">Quick answers to common questions about bookings, refunds, guides, and preparedness.</p>
                
                <div style="display: flex; flex-direction: column; gap: 1rem">
                  <!-- FAQ Item 1 -->
                  <div style="border: 1px solid rgba(26,46,26,0.08); border-radius: 8px; overflow: hidden; background: #fafafa">
                    <button @click="expandedFaq = (expandedFaq === 0 ? null : 0)" style="width: 100%; text-align: left; padding: 1.25rem; background: #fff; border: none; display: flex; justify-content: space-between; align-items: center; cursor: pointer">
                      <span style="font-weight: 700; color: var(--forest); font-size: 0.95rem">How do I cancel my booking and get a refund?</span>
                      <span style="font-size: 1rem; color: var(--stone)">{{ expandedFaq === 0 ? '−' : '+' }}</span>
                    </button>
                    <div v-show="expandedFaq === 0" style="padding: 1.25rem; background: #fafafa; border-top: 1px solid rgba(26,46,26,0.05); font-size: 0.85rem; color: var(--stone); line-height: 1.5">
                      Treks can be cancelled from the <strong>My Bookings</strong> tab up to 48 hours prior to start. Refunds are processed automatically back to your original payment method within 5-7 business days.
                    </div>
                  </div>

                  <!-- FAQ Item 2 -->
                  <div style="border: 1px solid rgba(26,46,26,0.08); border-radius: 8px; overflow: hidden; background: #fafafa">
                    <button @click="expandedFaq = (expandedFaq === 1 ? null : 1)" style="width: 100%; text-align: left; padding: 1.25rem; background: #fff; border: none; display: flex; justify-content: space-between; align-items: center; cursor: pointer">
                      <span style="font-weight: 700; color: var(--forest); font-size: 0.95rem">What gear is required for my trek?</span>
                      <span style="font-size: 1rem; color: var(--stone)">{{ expandedFaq === 1 ? '−' : '+' }}</span>
                    </button>
                    <div v-show="expandedFaq === 1" style="padding: 1.25rem; background: #fafafa; border-top: 1px solid rgba(26,46,26,0.05); font-size: 0.85rem; color: var(--stone); line-height: 1.5">
                      A detailed gear checklist is provided for each booking under the <strong>Trek Checklist</strong> button in your bookings tab. Standard gear usually includes sturdy trekking shoes, water bottles, high-calorie snacks, appropriate seasonal layers, and a rain cover.
                    </div>
                  </div>

                  <!-- FAQ Item 3 -->
                  <div style="border: 1px solid rgba(26,46,26,0.08); border-radius: 8px; overflow: hidden; background: #fafafa">
                    <button @click="expandedFaq = (expandedFaq === 2 ? null : 2)" style="width: 100%; text-align: left; padding: 1.25rem; background: #fff; border: none; display: flex; justify-content: space-between; align-items: center; cursor: pointer">
                      <span style="font-weight: 700; color: var(--forest); font-size: 0.95rem">Can I change my batch start date?</span>
                      <span style="font-size: 1rem; color: var(--stone)">{{ expandedFaq === 2 ? '−' : '+' }}</span>
                    </button>
                    <div v-show="expandedFaq === 2" style="padding: 1.25rem; background: #fafafa; border-top: 1px solid rgba(26,46,26,0.05); font-size: 0.85rem; color: var(--stone); line-height: 1.5">
                      Rescheduling is permitted up to 7 days before departure. Please submit a support ticket above under the <strong>Booking & Reservation</strong> category, stating your booking ID and preferred batch dates, and our team will assist you.
                    </div>
                  </div>

                  <!-- FAQ Item 4 -->
                  <div style="border: 1px solid rgba(26,46,26,0.08); border-radius: 8px; overflow: hidden; background: #fafafa">
                    <button @click="expandedFaq = (expandedFaq === 3 ? null : 3)" style="width: 100%; text-align: left; padding: 1.25rem; background: #fff; border: none; display: flex; justify-content: space-between; align-items: center; cursor: pointer">
                      <span style="font-weight: 700; color: var(--forest); font-size: 0.95rem">How do I contact my trek guide?</span>
                      <span style="font-size: 1rem; color: var(--stone)">{{ expandedFaq === 3 ? '−' : '+' }}</span>
                    </button>
                    <div v-show="expandedFaq === 3" style="padding: 1.25rem; background: #fafafa; border-top: 1px solid rgba(26,46,26,0.05); font-size: 0.85rem; color: var(--stone); line-height: 1.5">
                      Once a guide is assigned to your batch (usually 3 days before start), their designation, certifications, languages, and contact details will appear directly on your booking card under <strong>My Bookings</strong>.
                    </div>
                  </div>

                  <!-- FAQ Item 5 -->
                  <div style="border: 1px solid rgba(26,46,26,0.08); border-radius: 8px; overflow: hidden; background: #fafafa">
                    <button @click="expandedFaq = (expandedFaq === 4 ? null : 4)" style="width: 100%; text-align: left; padding: 1.25rem; background: #fff; border: none; display: flex; justify-content: space-between; align-items: center; cursor: pointer">
                      <span style="font-weight: 700; color: var(--forest); font-size: 0.95rem">What fitness level is required?</span>
                      <span style="font-size: 1rem; color: var(--stone)">{{ expandedFaq === 4 ? '−' : '+' }}</span>
                    </button>
                    <div v-show="expandedFaq === 4" style="padding: 1.25rem; background: #fafafa; border-top: 1px solid rgba(26,46,26,0.05); font-size: 0.85rem; color: var(--stone); line-height: 1.5">
                      Each trek route lists its difficulty level (Easy, Moderate, Hard). Easy treks require basic walking stamina. Moderate and Hard treks require standard fitness preparation, cardiovascular endurance, and leg strength, which you can log and track under your <strong>My Profile</strong> page.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- ════════════════════════════════════════════
             TRAILSYNC SOCIAL TAB
        ════════════════════════════════════════════ -->
        <section v-if="activeTab === 'social'" class="tab-content social-tab-container" style="display: flex; flex-direction: column; gap: 0; height: calc(100vh - 120px); min-height: 500px; padding: 0;">
          <!-- Social tab header -->
          <div class="page-header" style="flex-shrink: 0; margin-bottom: 1rem;">
            <div>
              <div class="page-eyebrow">Communication</div>
              <div class="page-title">TrailSync <em>Social</em></div>
            </div>
            <button class="btn-back-home" @click="goTab('dashboard')"><i class="bi bi-house-door-fill me-1"></i>Back to Home</button>
          </div>

          <!-- Social content row -->
          <div style="display: flex; gap: 1.5rem; flex: 1; min-height: 0;">
            
            <!-- Channels list (left) -->
            <div class="social-channels-panel ts-card" style="width: 280px; display: flex; flex-direction: column; flex-shrink: 0;">
              <div class="ts-card-header">
                <div class="ts-card-title"><i class="bi bi-people-fill"></i> Social Groups</div>
              </div>
              <div class="social-channels-list" style="flex: 1; overflow-y: auto; padding: 0.75rem;">
                <div v-for="g in socialGroups" :key="g.id"
                     :class="['social-channel-item', { active: selectedSocialTrekId === g.id }]"
                     @click="selectSocialGroup(g.id)"
                     style="padding: 0.75rem; border-radius: 6px; cursor: pointer; margin-bottom: 0.5rem; transition: var(--transition);">
                  <div class="d-flex justify-content-between align-items-start mb-1">
                    <span class="channel-name fw-bold" style="font-size: 0.85rem; color: var(--forest); display: flex; align-items: center; gap: 4px;">
                      <i class="bi bi-hash"></i> {{ g.name }}
                      <i v-if="g.isLocked" class="bi bi-lock-fill text-danger" style="font-size: 0.75rem;" title="Chat is Locked"></i>
                    </span>
                    <span :class="'status-pill status-' + g.status.toLowerCase()" style="font-size: 0.6rem; padding: 2px 6px;">{{ g.status }}</span>
                  </div>
                  <div class="channel-sub text-muted d-flex justify-content-between" style="font-size: 0.7rem;">
                    <span>Batch {{ g.batchCode }}</span>
                    <span>{{ g.memberCount }} members</span>
                  </div>
                </div>
                <div v-if="!socialGroups.length" class="text-center py-4 text-muted" style="font-size: 0.8rem;">
                  No active trekking groups found.
                </div>
              </div>
            </div>

            <!-- Middle: Chat Area + Right Panel (Announcements & Members) -->
            <div v-if="!selectedSocialTrekId" class="ts-card d-flex flex-column align-items-center justify-content-center text-center p-5" style="flex: 1; background: #ffffff; min-height: 400px; border: 1px solid rgba(26,46,26,0.08);">
              <i class="bi bi-chat-left-dots-fill" style="font-size: 3.5rem; color: var(--gold); opacity: 0.6; margin-bottom: 1rem;"></i>
              <h3 style="font-family: 'Playfair Display', serif; font-size: 1.5rem; color: var(--forest); font-weight: 700; margin-bottom: 0.5rem;">Select group to start chat</h3>
              <p class="text-muted" style="max-width: 380px; font-size: 0.9rem; line-height: 1.5;">
                Please select a trekking group from the list on the left to start communicating with fellow travelers, view guide announcements, and see traveler profiles.
              </p>
            </div>

            <template v-else>
              <!-- Middle: Chat Area -->
              <div class="ts-card d-flex flex-column" style="flex: 2; min-width: 0;">
                <div class="ts-card-header d-flex justify-content-between align-items-center">
                  <div>
                    <div class="ts-card-title m-0" v-if="selectedSocialGroupTrek">
                      <i class="bi bi-chat-left-dots-fill"></i> Group Chat: {{ selectedSocialGroupTrek.name }}
                    </div>
                    <div class="text-muted" style="font-size: 0.72rem; margin-top: 2px;" v-if="selectedSocialGroupTrek">
                      Batch Code: {{ selectedSocialGroupTrek.batchCode }} | Status: {{ selectedSocialGroupTrek.status }}
                    </div>
                  </div>
                </div>

                <!-- Chat messages feed -->
                <div class="social-chat-feed" style="flex: 1; overflow-y: auto; padding: 1.25rem; background: var(--snow);">
                  <!-- Sticky latest announcement if any -->
                  <div v-if="currentGroupAnnouncements.length > 0" class="announcement-banner p-3 mb-3 d-flex align-items-center gap-3" style="background: #fef2f2; border: 1px solid #fca5a5; border-left: 5px solid #ef4444; border-radius: 6px; color: #991b1b; font-size: 0.85rem;">
                    <i class="bi bi-megaphone-fill fs-5" style="color: #ef4444;"></i>
                    <div style="flex: 1;">
                      <strong style="font-weight: 700;">Announcement: {{ currentGroupAnnouncements[0].title }}</strong>
                      <div style="font-size: 0.78rem; opacity: 0.9; margin-top: 2px;">{{ currentGroupAnnouncements[0].content }}</div>
                    </div>
                  </div>

                  <!-- Messages -->
                  <div v-for="m in currentGroupMessages" :key="m.id" 
                       :class="['chat-bubble-wrap', m.sender === 'guide' ? 'guide-message' : 'trekker-message']"
                       style="margin-bottom: 1rem; display: flex; flex-direction: column;">
                    <div class="chat-meta d-flex align-items-center mb-1" style="font-size: 0.7rem; gap: 6px;">
                      <span class="chat-sender-name fw-bold" :style="{ color: m.sender === 'guide' ? 'var(--gold)' : 'var(--forest)' }">
                        {{ m.name }}
                      </span>
                      <span class="badge bg-gold text-dark" style="font-size:0.58rem; padding: 2px 4px;" v-if="m.sender === 'guide'">Guide</span>
                      <span class="badge bg-danger text-white" style="font-size:0.58rem; padding: 2px 4px;" v-if="m.isAnnouncement">Announcement</span>
                      <span class="chat-time text-muted">{{ m.timestamp }}</span>
                    </div>
                    <div class="chat-bubble" 
                         :style="getChatBubbleStyle(m)"
                         style="padding: 0.75rem; border-radius: 8px; max-width: 80%; font-size: 0.83rem; line-height: 1.5;">
                      {{ m.text }}
                    </div>
                  </div>
                  <div v-if="!currentGroupMessages.length" class="text-center py-5 text-muted" style="font-size: 0.85rem;">
                    <i class="bi bi-chat-dots fs-3 mb-2 d-block"></i>
                    No messages yet. Send a message to start the conversation!
                  </div>
                </div>

                <!-- Chat input bar -->
                <div class="social-chat-input-bar border-top" style="padding: 1rem; background: var(--cream);">
                  <!-- If Locked -->
                  <div v-if="selectedSocialGroupTrek && selectedSocialGroupTrek.isLocked" class="text-center p-3 text-danger fw-bold" style="background: rgba(220,53,69,0.06); border: 1px solid rgba(220,53,69,0.15); border-radius: 6px; font-size: 0.8rem; display: flex; align-items: center; justify-content: center; gap: 6px;">
                    <i class="bi bi-lock-fill"></i> This group chat has been locked by the guide. Only guides can post messages.
                  </div>
                  <!-- Standard Input Form -->
                  <form v-else @submit.prevent="sendSocialMessage" class="d-flex gap-2">
                    <input v-model="newSocialMessageText" type="text" class="form-control" placeholder="Type a message to the group..." style="font-size: 0.85rem; border-radius: 6px;" required />
                    <button type="submit" class="btn btn-primary-ts px-4" style="font-size: 0.85rem;">
                      <i class="bi bi-send-fill"></i> Send
                    </button>
                  </form>
                </div>
              </div>

              <!-- Sidebar: Announcements + Members (rightmost) -->
              <div class="d-flex flex-column gap-3" style="width: 320px; flex-shrink: 0;">
                
                <!-- Pinned Announcements -->
                <div class="ts-card d-flex flex-column" style="flex: 1; min-height: 0; border: 1px solid var(--stone-light);">
                  <div class="ts-card-header bg-gold-subtle" style="padding: 0.75rem 1rem;">
                    <div class="ts-card-title" style="color: var(--bark); font-weight: 700; font-size: 0.82rem; margin: 0;">
                      <i class="bi bi-pin-angle-fill text-gold"></i> Pinned Announcements
                    </div>
                  </div>
                  <div class="ts-card-body" style="padding: 0.75rem; overflow-y: auto; flex: 1;">
                    <div class="announcements-list d-flex flex-column" style="gap: 0.6rem; display: flex; flex-direction: column;">
                      <div v-for="a in currentGroupAnnouncements" :key="a.id" 
                           class="announcement-item p-2 border-start border-3 border-gold" 
                           style="background: var(--snow); border-radius: 0 4px 4px 0; font-size: 0.74rem;">
                        <div class="d-flex justify-content-between align-items-center mb-1">
                          <span class="fw-bold" style="color: var(--forest);">{{ a.title }}</span>
                          <span class="text-muted" style="font-size: 0.62rem;">{{ a.date }}</span>
                        </div>
                        <div class="text-muted" style="line-height: 1.35;">{{ a.content }}</div>
                      </div>
                      <div v-if="!currentGroupAnnouncements.length" class="text-center py-4 text-muted" style="font-size: 0.72rem;">
                        No announcements posted.
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Group Members directory -->
                <div class="ts-card d-flex flex-column" style="flex: 1; min-height: 0; border: 1px solid var(--stone-light);">
                  <div class="ts-card-header" style="padding: 0.75rem 1rem;">
                    <div class="ts-card-title" style="font-size: 0.82rem; margin: 0;"><i class="bi bi-people"></i> Group Members</div>
                  </div>
                  <div class="ts-card-body" style="padding: 0.5rem; overflow-y: auto; flex: 1;">
                    <div style="display: flex; flex-direction: column; gap: 0.4rem;">
                      <div v-for="p in socialGroupMembersList" :key="p.id" 
                           @click="openSocialProfileModal(p)"
                           class="member-dir-item d-flex align-items-center justify-content-between p-2" 
                           style="border-radius: 6px; cursor: pointer; transition: var(--transition); background: p.role === 'guide' ? 'var(--cream)' : 'transparent'; border: 1px solid transparent;">
                        <div class="d-flex align-items-center gap-2">
                          <div class="member-avatar d-flex align-items-center justify-content-center fw-bold" 
                               :style="{ background: p.role === 'guide' ? 'var(--gold)' : 'var(--stone-light)', color: p.role === 'guide' ? '#fff' : 'var(--forest)' }"
                               style="width: 26px; height: 26px; border-radius: 50%; font-size: 0.72rem;">
                            {{ p.name[0] }}
                          </div>
                          <div>
                            <div class="fw-bold" style="font-size: 0.76rem; color: var(--forest);">{{ p.name }}</div>
                            <div class="text-muted" style="font-size: 0.62rem; text-transform: capitalize;">
                              {{ p.role === 'guide' ? 'Lead Guide' : 'Trekker' }}
                            </div>
                          </div>
                        </div>
                        <span v-if="p.role === 'guide'" class="badge bg-gold text-dark" style="font-size: 0.55rem; font-weight: 700; padding: 2px 4px;">Guide</span>
                        <i v-else class="bi bi-chevron-right text-muted" style="font-size: 0.65rem;"></i>
                      </div>
                      <div v-if="!socialGroupMembersList.length" class="text-center py-4 text-muted" style="font-size: 0.72rem;">
                        No members list loaded.
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </template>
          </div>
        </section>

      </div><!-- /page-content -->
    </div><!-- /ts-main-content -->

    <!-- ── FELLOW TREKKER/GUIDE PROFILE MODAL ──────────────────────── ── -->
    <transition name="toast">
      <div v-if="showSocialProfileModal && socialProfileTarget" class="ts-modal-overlay" @click.self="showSocialProfileModal = false">
        <div class="ts-modal" style="max-width: 450px; width: 100%;">
          <div class="ts-modal-header" style="border-bottom: none; padding-bottom: 0.5rem;">
            <span class="ts-modal-title" style="font-family:'Playfair Display',serif;">Member Profile</span>
            <button class="modal-close" @click="showSocialProfileModal = false">✕</button>
          </div>
          <div class="ts-modal-body text-center" style="padding-top: 0;">
            <div style="margin-bottom: 1.5rem; display: flex; flex-direction: column; align-items: center;">
              <div style="width: 100px; height: 100px; border-radius: 50%; overflow: hidden; border: 3px solid var(--gold); box-shadow: 0 4px 12px rgba(0,0,0,0.1); margin-bottom: 0.75rem;">
                <img :src="socialProfileTarget.photoUrl" :alt="socialProfileTarget.name" style="width: 100%; height: 100%; object-fit: cover;" />
              </div>
              <h4 style="font-family: 'Playfair Display', serif; font-size: 1.3rem; font-weight: 700; color: var(--forest); margin: 0 0 4px 0;">
                {{ socialProfileTarget.name }}
              </h4>
              <span class="badge" :class="socialProfileTarget.role === 'guide' ? 'bg-gold text-dark' : 'bg-forest text-white'" style="font-size: 0.75rem; padding: 4px 10px; font-weight: 600;">
                {{ socialProfileTarget.role === 'guide' ? 'Trek Guide' : 'Trekker' }}
              </span>
            </div>

            <!-- Profile Details -->
            <div class="text-start" style="background: var(--snow); border: 1px solid var(--stone-light); border-radius: 8px; padding: 1rem; margin-bottom: 1rem; display: flex; flex-direction: column; gap: 0.5rem; font-size: 0.85rem;">
              <div style="display: flex; justify-content: space-between;"><span class="text-muted">Email:</span> <strong>{{ socialProfileTarget.email || '—' }}</strong></div>
              <div style="display: flex; justify-content: space-between;"><span class="text-muted">Contact:</span> <strong>{{ socialProfileTarget.phone || '—' }}</strong></div>
              <div v-if="socialProfileTarget.role !== 'guide'" style="display: flex; justify-content: space-between;"><span class="text-muted">Fitness Level:</span> <strong>{{ socialProfileTarget.fitnessLevel || 'Beginner' }}</strong></div>
              <div v-if="socialProfileTarget.role !== 'guide'" style="display: flex; justify-content: space-between;"><span class="text-muted">Emergency Contact:</span> <strong>{{ socialProfileTarget.emergencyPhone || '—' }}</strong></div>
              <div v-if="socialProfileTarget.role === 'guide'" style="display: flex; justify-content: space-between;"><span class="text-muted">Languages:</span> <strong>{{ socialProfileTarget.languages || 'English, Hindi' }}</strong></div>
              <div v-if="socialProfileTarget.role === 'guide'" style="display: flex; justify-content: space-between;"><span class="text-muted">Expertise:</span> <strong>{{ socialProfileTarget.expertise || 'First Aid, Navigation' }}</strong></div>
            </div>
            
            <button class="btn-primary-ts w-100" @click="showSocialProfileModal = false" style="padding: 10px; border-radius: 6px; font-weight: 600;">Close Profile</button>
          </div>
        </div>
      </div>
    </transition>

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
                <div style="font-size: 0.85rem; color: var(--stone); margin-bottom: 0.75rem;"><span class="css-loc-pin" style="background:var(--gold)"></span>{{ bookingTarget.location }}</div>

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

    <!-- ── SIMULATED PAYMENT MODAL ────────────────── -->
    <transition name="toast">
      <div v-if="showPaymentModal" class="ts-modal-overlay" @click.self="dismissPaymentModal(false)">
        <div class="ts-modal" style="max-width: 480px; border: none; box-shadow: 0 20px 50px rgba(0,0,0,0.3);">
          
          <!-- Header -->
          <div class="pay-sim-modal-header d-flex justify-content-between align-items-center">
            <div>
              <div class="ts-modal-title" style="margin-bottom: 2px;">Secure Checkout</div>
              <div class="pay-sim-badge">
                <svg viewBox="0 0 24 24" style="width: 10px; height: 10px; fill: none; stroke: currentColor; stroke-width: 3;"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                Sandbox Mode
              </div>
            </div>
            <button class="modal-close" @click="dismissPaymentModal(false)"><i class="bi bi-x-lg"></i></button>
          </div>

          <!-- Body -->
          <div class="ts-modal-body" style="padding: 1.5rem;" v-if="paymentTrekBatch">
            
            <!-- STATE 1: Interactive form -->
            <template v-if="!paymentProcessing && !paymentResultState">
              <!-- Itemized Receipt -->
              <div class="pay-sim-receipt">
                <div class="pay-sim-receipt-title">{{ paymentTrekBatch.name }}</div>
                <div class="pay-sim-row">
                  <span>Location</span>
                  <strong><i class="bi bi-geo-alt-fill"></i> {{ paymentTrekBatch.location }}</strong>
                </div>
                <div class="pay-sim-row" v-if="paymentTrekBatch.batchCode">
                  <span>Batch ID</span>
                  <strong class="mono" style="color: var(--gold-dark);">{{ paymentTrekBatch.batchCode }}</strong>
                </div>
                <div class="pay-sim-row">
                  <span>Booking Reference</span>
                  <span class="mono" style="font-size: 0.75rem;">TS-{{ Math.floor(100000 + Math.random() * 900000) }}</span>
                </div>
                <div class="pay-sim-row total">
                  <span>Total Amount</span>
                  <span>₹{{ paymentTrekBatch.price.toLocaleString() }}</span>
                </div>
              </div>

              <!-- Payment Method Tabs -->
              <div style="margin-bottom: 1.25rem;">
                <label style="font-weight: 700; font-size: 0.78rem; color: var(--forest); display: block; margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.03em;">Select Payment Method</label>
                <div class="pay-sim-methods">
                  <div class="pay-sim-method-card" :class="{ active: selectedPaymentMethod === 'UPI' }" @click="selectedPaymentMethod = 'UPI'">
                    <div style="font-size: 1.1rem; margin-bottom: 3px;"><i class="bi bi-lightning-charge-fill"></i></div>
                    <div>UPI</div>
                  </div>
                  <div class="pay-sim-method-card" :class="{ active: selectedPaymentMethod === 'Card' }" @click="selectedPaymentMethod = 'Card'">
                    <div style="font-size: 1.1rem; margin-bottom: 3px;"><i class="bi bi-credit-card-2-front-fill"></i></div>
                    <div>Card</div>
                  </div>
                  <div class="pay-sim-method-card" :class="{ active: selectedPaymentMethod === 'Netbanking' }" @click="selectedPaymentMethod = 'Netbanking'">
                    <div style="font-size: 1.1rem; margin-bottom: 3px;"><i class="bi bi-bank"></i></div>
                    <div>Bank</div>
                  </div>
                </div>
              </div>

              <!-- Interactive Fields: UPI -->
              <div v-if="selectedPaymentMethod === 'UPI'" class="pay-sim-card-view">
                <label style="font-size: 0.72rem; color: var(--stone); display: block; margin-bottom: 6px; font-weight: 600;">UPI Virtual Payment Address (VPA)</label>
                <div class="position-relative">
                  <input type="text" class="pay-sim-input" placeholder="e.g. trekker@upi" v-model="paymentDetails.upiId" style="padding-right: 6.5rem;" />
                  <div style="position: absolute; right: 8px; top: 50%; transform: translateY(-50%); display: flex; gap: 4px;">
                    <button class="btn btn-sm" @click="paymentDetails.upiId = 'trek@okaxis'" style="padding: 2px 6px; font-size: 0.65rem; background: var(--cream); color: var(--forest); border: 1px solid rgba(26,46,26,0.15); font-weight: 600; cursor: pointer;">Demo VPA</button>
                  </div>
                </div>
                <div style="font-size: 0.68rem; color: var(--stone); margin-top: 5px;">Enter any simulated UPI ID to authorize payments.</div>
              </div>

              <!-- Interactive Fields: Card -->
              <div v-if="selectedPaymentMethod === 'Card'" class="pay-sim-card-view">
                <div style="margin-bottom: 10px;">
                  <label style="font-size: 0.72rem; color: var(--stone); display: block; margin-bottom: 3px; font-weight: 600;">Cardholder Name</label>
                  <input type="text" class="pay-sim-input" placeholder="e.g. Priyavart Jakhar" v-model="paymentDetails.cardName" />
                </div>
                <div style="margin-bottom: 10px;">
                  <label style="font-size: 0.72rem; color: var(--stone); display: block; margin-bottom: 3px; font-weight: 600;">Card Number</label>
                  <input type="text" class="pay-sim-input" placeholder="4111 2222 3333 4444" :value="paymentDetails.cardNumber" @input="onCardNumberInput" />
                </div>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                  <div>
                    <label style="font-size: 0.72rem; color: var(--stone); display: block; margin-bottom: 3px; font-weight: 600;">Expiry Date</label>
                    <input type="text" class="pay-sim-input" placeholder="MM/YY" :value="paymentDetails.cardExpiry" @input="onCardExpiryInput" />
                  </div>
                  <div>
                    <label style="font-size: 0.72rem; color: var(--stone); display: block; margin-bottom: 3px; font-weight: 600;">CVV Code</label>
                    <input type="password" class="pay-sim-input" placeholder="•••" :value="paymentDetails.cardCvv" @input="onCardCvvInput" />
                  </div>
                </div>
              </div>

              <!-- Interactive Fields: Netbanking -->
              <div v-if="selectedPaymentMethod === 'Netbanking'" class="pay-sim-card-view">
                <label style="font-size: 0.72rem; color: var(--stone); display: block; margin-bottom: 6px; font-weight: 600;">Select Bank Account</label>
                <select class="pay-sim-input" v-model="paymentDetails.bank">
                  <option>State Bank of India</option>
                  <option>HDFC Bank</option>
                  <option>ICICI Bank</option>
                  <option>Axis Bank</option>
                  <option>Kotak Mahindra Bank</option>
                </select>
                <div style="font-size: 0.68rem; color: var(--stone); margin-top: 5px;">You will be redirected to a simulated bank login page.</div>
              </div>

              <!-- Action Buttons -->
              <div>
                <div style="font-size: 0.78rem; font-weight: 700; color: var(--stone); text-align: center; margin-bottom: 10px; text-transform: uppercase; letter-spacing: 0.03em;">Sandbox Testing Outcomes</div>
                <div class="pay-sim-btn-group">
                  <button @click="processSimulatedPayment('Paid')" class="pay-sim-btn success">
                    <span><i class="bi bi-check2-circle"></i></span> Authorize Payment (Simulation Success)
                  </button>
                  <button @click="processSimulatedPayment('Pending')" class="pay-sim-btn pending">
                    <span><i class="bi bi-hourglass-split"></i></span> Pay Later / Offline (Simulation Pending)
                  </button>
                  <button @click="processSimulatedPayment('Failed')" class="pay-sim-btn failure">
                    <span><i class="bi bi-x-circle"></i></span> Decline Transaction (Simulation Failure)
                  </button>
                </div>
              </div>
            </template>

            <!-- STATE 2: Processing Loader Screen -->
            <template v-if="paymentProcessing">
              <div class="pay-sim-loader-wrap">
                <div class="pay-sim-spinner"></div>
                <div style="font-weight: 700; color: var(--forest); font-size: 1.05rem; margin-bottom: 6px;">Processing Transaction</div>
                <div style="font-size: 0.82rem; color: var(--stone); height: 24px;">{{ paymentProcessingMsg }}</div>
                <div class="pay-sim-progress-track">
                  <div class="pay-sim-progress-fill" :style="{ width: paymentProcessingProgress + '%' }"></div>
                </div>
              </div>
            </template>

            <!-- STATE 3: Success Screen -->
            <template v-if="paymentResultState === 'Paid'">
              <div class="pay-sim-result-wrap">
                <div class="pay-sim-icon-circle success"><i class="bi bi-check-lg"></i></div>
                <div class="pay-sim-result-title">Payment Successful!</div>
                <div class="pay-sim-result-text">Your transaction has been processed securely. Your trek booking is confirmed, and your permit is being initialized.</div>
                
                <div class="pay-sim-receipt-summary">
                  <div class="pay-sim-row" style="margin-bottom: 4px;">
                    <span>Trek Booking</span>
                    <strong>{{ paymentTrekBatch.name }}</strong>
                  </div>
                  <div class="pay-sim-row" style="margin-bottom: 4px;">
                    <span>Transaction ID</span>
                    <span class="mono">TXN{{ Math.floor(100000000 + Math.random() * 900000000) }}</span>
                  </div>
                  <div class="pay-sim-row" style="margin-bottom: 4px;">
                    <span>Method</span>
                    <strong style="text-transform: uppercase;">{{ selectedPaymentMethod }}</strong>
                  </div>
                  <div class="pay-sim-row" style="margin-bottom: 4px; border-top: 1px dashed rgba(0,0,0,0.1); padding-top: 4px; margin-top: 4px;">
                    <span>Amount Charged</span>
                    <strong style="color: #10b981;">₹{{ paymentTrekBatch.price.toLocaleString() }}</strong>
                  </div>
                </div>

                <button class="btn-primary-ts w-100" @click="dismissPaymentModal(true)">Go to My Bookings</button>
              </div>
            </template>

            <!-- STATE 4: Pending Screen -->
            <template v-if="paymentResultState === 'Pending'">
              <div class="pay-sim-result-wrap">
                <div class="pay-sim-icon-circle pending"><i class="bi bi-hourglass-split"></i></div>
                <div class="pay-sim-result-title">Offline / Pending Booking</div>
                <div class="pay-sim-result-text">Your booking state has been saved as pending. You can complete the payment simulation later under the "Bookings" tab.</div>
                
                <div class="pay-sim-receipt-summary">
                  <div class="pay-sim-row" style="margin-bottom: 4px;">
                    <span>Trek Booking</span>
                    <strong>{{ paymentTrekBatch.name }}</strong>
                  </div>
                  <div class="pay-sim-row" style="margin-bottom: 4px;">
                    <span>Booking Status</span>
                    <strong style="color: #f59e0b;">Pending Payment</strong>
                  </div>
                  <div class="pay-sim-row" style="margin-bottom: 4px; border-top: 1px dashed rgba(0,0,0,0.1); padding-top: 4px; margin-top: 4px;">
                    <span>Amount Due</span>
                    <strong>₹{{ paymentTrekBatch.price.toLocaleString() }}</strong>
                  </div>
                </div>

                <button class="btn-primary-ts w-100" @click="dismissPaymentModal(true)">Go to My Bookings</button>
              </div>
            </template>

            <!-- STATE 5: Failure Screen -->
            <template v-if="paymentResultState === 'Failed'">
              <div class="pay-sim-result-wrap">
                <div class="pay-sim-icon-circle failure"><i class="bi bi-x-lg"></i></div>
                <div class="pay-sim-result-title">Transaction Declined</div>
                <div class="pay-sim-result-text">The card network or issuing bank declined the transaction. Check credit limits, card details, or try a different payment method.</div>
                
                <div class="w-100 d-flex gap-2" style="margin-top: 1rem;">
                  <button class="btn btn-outline flex-grow-1" @click="dismissPaymentModal(true)" style="padding: 10px; border-radius: 8px;">Cancel</button>
                  <button class="btn-primary-ts flex-grow-1" @click="resetPaymentForm" style="padding: 10px; border-radius: 8px; font-weight: 700;">Try Again</button>
                </div>
              </div>
            </template>

          </div>

          <!-- Footer (Only on selection state) -->
          <div class="ts-modal-footer" v-if="!paymentProcessing && !paymentResultState">
            <button class="btn-modal-cancel" @click="dismissPaymentModal(false)">Cancel Payment</button>
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
