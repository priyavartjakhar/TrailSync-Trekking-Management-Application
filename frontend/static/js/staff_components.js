// ============================================================
//  staff_components.js — TrailSync Staff Operations Dashboard
//  Full-featured Vue 3 component tree
// ============================================================

const TsStaffLayout = {
  name: 'TsStaffLayout',
  emits: ['logout'],

  data() {
    return {
      // ── UI STATE ──────────────────────────────────
      activeTab: 'dashboard',
      sidebarOpen: false,
      sidebarCollapsed: false,
      profileDropdownOpen: false,
      toast: { show: false, msg: '', type: 'success' },

      // ── DATA ──────────────────────────────────────
      staffName: STAFF_INITIAL_NAME,
      staffProfile: { ...STAFF_PROFILE_INITIAL },
      assignedTreks: JSON.parse(JSON.stringify(STAFF_ASSIGNED_TREKS)),
      participants: JSON.parse(JSON.stringify(STAFF_PARTICIPANTS)),
      activityLog: JSON.parse(JSON.stringify(STAFF_ACTIVITY_LOG)),
      checklistItems: [...CHECKLIST_DEFAULTS],
      newChecklistItem: '',

      // ── SEARCH / FILTER ───────────────────────────
      searchQuery: '',
      participantSearch: '',
      selectedTrekId: null,
      participantTrekId: null,
      participantsInTreksTab: false,
      attendanceInTreksTab: false,

      // ── COUNTDOWN ─────────────────────────────────
      countdownTimer: null,
      countdown: { days: 0, hours: 0, minutes: 0, seconds: 0 },

      // ── MODALS ────────────────────────────────────
      showSlotModal: false,
      showStatusModal: false,
      showParticipantModal: false,
      showChecklistModal: false,
      showEmergencyModal: false,
      showCompletionModal: false,
      showTrekDetailModal: false,
      showAddParticipantModal: false,
      showExportDetailModal: false,
      exportDetailTrek: null,
      showDownloadPromptModal: false,
      downloadPromptTrek: null,
      downloadPending: false,

      slotTarget: null,
      statusTarget: null,
      participantTarget: null,
      checklistTrek: null,
      completionTrek: null,
      detailTrek: null,

      newSlots: 0,
      newStatus: '',
      newParticipantEmail: '',
      newParticipantTrekId: null,
      newParticipantName: '',
      newParticipantPhone: '',
      newParticipantPayment: 'paid',

      // ── PARTICIPANTS TAB SEARCH ────────────────────
      trekSearchQuery: '',
      trekSearchFocused: false,

      // ── EXPORT ────────────────────────────────────
      exportPending: false,
      exportTrekId: null,

      // ── PASSWORD FORM ─────────────────────────────
      pwForm: { current: '', new: '', confirm: '' },

      // ── SOCIAL TAB STATE ──────────────────────────
      selectedSocialTrekId: null,
      socialMessages: [
        { id: 1, trekId: 1, sender: 'guide', name: 'Lead Guide', text: 'Hey trekkers! Please make sure you bring proper high-ankle trekking shoes. The weather at Kedarkantha is snowy right now.', timestamp: '10:00 AM' },
        { id: 2, trekId: 1, sender: 'trekker', name: 'Aarav Sharma', text: 'Thanks for the update, guide! Are microspikes provided at basecamp?', timestamp: '10:15 AM' },
        { id: 3, trekId: 1, sender: 'guide', name: 'Lead Guide', text: 'Yes, Aarav! We will distribute microspikes and gaiters at Sankri basecamp.', timestamp: '10:18 AM' },
        { id: 4, trekId: 1, sender: 'trekker', name: 'Neha Gupta', text: 'Awesome! Can we rent warm jackets too?', timestamp: '10:20 AM' },
        { id: 5, trekId: 1, sender: 'guide', name: 'Lead Guide', text: 'Yes, heavy down jackets are available for rent at Sankri. Make sure to pre-book.', timestamp: '10:22 AM' },

        { id: 6, trekId: 2, sender: 'guide', name: 'Lead Guide', text: 'Welcome to the Hampta Pass group chat! We start in 5 days. Ensure your physical prep matches the routine.', timestamp: '09:00 AM' },
        { id: 7, trekId: 2, sender: 'trekker', name: 'Rohan Mehta', text: 'Looking forward to it! How cold will it get at Balu ka Ghera camp?', timestamp: '09:12 AM' },
        { id: 8, trekId: 2, sender: 'guide', name: 'Lead Guide', text: 'It will dip to around 2°C at night, Rohan. Make sure you have at least 3 warm layers.', timestamp: '09:20 AM' }
      ],
      socialAnnouncements: [
        { id: 1, trekId: 1, title: 'Checklist Verification Due', content: 'Please upload or verify your medical certificate and photo ID by tomorrow evening so we can process forest permits.', date: '14 Jun' },
        { id: 2, trekId: 1, title: 'Assembly Point Sankri', content: 'Our shared transport starts from Dehradun Railway Station at 6:30 AM on Day 1. Look for the TrailSync banner.', date: '13 Jun' },
        { id: 3, trekId: 2, title: 'Permit Details Needed', content: 'Send your passport-sized photos and physical fitness certificates to the email desk.', date: '12 Jun' }
      ],
      newSocialMessageText: '',
      newSocialAnnouncementText: '',
      newSocialAnnouncementTitle: '',
      showSocialProfileModal: false,
      socialProfileTarget: null,

      // ── SUPPORT & LEAVE STATE ──────────────────────
      supportTickets: [],
      submittingSupport: false,
      newTicket: { subject: '', category: 'General', message: '' },
      leaveRequest: { startDate: '', endDate: '', reason: '' },
      submittingLeave: false,

      // ── SOCIAL DATABASE STATE ──────────────────────
      socialGroups: [],
      loadingSocial: false
    };
  },

  computed: {
    staffInitial() {
      return this.staffProfile.name ? this.staffProfile.name[0].toUpperCase() : 'S';
    },

    // Summary stats for topbar
    summaryStats() {
      const totalParticipants = this.participants.filter(p => p.status === 'Booked' || p.status === 'Completed').length;
      const upcoming = this.assignedTreks.filter(t => t.status === 'Open' || t.status === 'Approved').length;
      const completed = this.assignedTreks.filter(t => t.status === 'Completed').length;
      const pending = this.assignedTreks.filter(t => t.status === 'Pending').length;
      return [
        { label: 'Assigned Treks', value: this.assignedTreks.length, icon: 'mountain', color: 'si-gold' },
        { label: 'Total Participants', value: totalParticipants, icon: 'users', color: 'si-forest' },
        { label: 'Upcoming Treks', value: upcoming, icon: 'calendar', color: 'si-green' },
        { label: 'Completed', value: completed, icon: 'check', color: 'si-blue' },
        { label: 'Pending Actions', value: pending, icon: 'alert', color: 'si-red' },
      ];
    },

    // Next upcoming trek
    nextTrek() {
      const open = this.assignedTreks.filter(t => t.status === 'Open' || t.status === 'Approved');
      if (!open.length) return this.assignedTreks[0] || null;
      return open.sort((a, b) => new Date(a.startDate) - new Date(b.startDate))[0];
    },

    // Filtered treks for search
    filteredTreks() {
      if (!this.searchQuery) return this.assignedTreks;
      const q = this.searchQuery.toLowerCase();
      return this.assignedTreks.filter(t => t.name.toLowerCase().includes(q) || t.location.toLowerCase().includes(q));
    },

    // Selected trek object
    selectedTrek() {
      return this.assignedTreks.find(t => t.id === this.selectedTrekId) || null;
    },

    // Resolved trek for the participants tab
    participantTrek() {
      return this.assignedTreks.find(t => t.id === this.participantTrekId) || null;
    },

    // Filtered participants for selected trek
    filteredParticipants() {
      return this.participants.filter(p => {
        const matchTrek = p.trekId === this.participantTrekId;
        const q = this.participantSearch.toLowerCase();
        const trekkerId = this.displayTrekkerId(p).toLowerCase();
        const matchSearch = !q || p.name.toLowerCase().includes(q) || p.email.toLowerCase().includes(q) || trekkerId.includes(q);
        return matchTrek && matchSearch;
      });
    },

    // Attendance participants (booked only)
    attendanceParticipants() {
      return this.participants.filter(p => p.trekId === this.selectedTrekId && p.status === 'Booked');
    },

    // Trek progress steps
    trekProgressSteps() {
      return ['Planning', 'Approved', 'Open', 'Started', 'Completed'];
    },

    // Performance metrics
    perfMetrics() {
      const totalSlots = this.assignedTreks.reduce((a, t) => a + t.slots, 0);
      const totalRegistered = this.assignedTreks.reduce((a, t) => a + t.registered, 0);
      const occupancy = totalSlots > 0 ? Math.round((totalRegistered / totalSlots) * 100) : 0;
      const completionRate = this.assignedTreks.length > 0
        ? Math.round((this.assignedTreks.filter(t => t.status === 'Completed').length / this.assignedTreks.length) * 100)
        : 0;
      const completedTreks = Number(this.staffProfile.completedTreksCount || 0);
      const experienceYears = Number(this.staffProfile.experienceYears || 0);
      const activeTreks = this.assignedTreks.filter(t => ['Open', 'Approved', 'Started'].includes(t.status)).length;
      return {
        treksManaged: completedTreks + this.assignedTreks.length,
        completedTreks,
        assignedTreks: this.assignedTreks.length,
        activeTreks,
        participantsManaged: this.participants.length,
        occupancy,
        completionRate,
        experienceYears
      };
    },

    profilePhotoUrl() {
      return this.staffProfile.photoUrl || this.staffProfile.profile_image_url || '';
    },

    profileStatusLabel() {
      if (this.staffProfile.blacklisted) return 'Restricted';
      return this.staffProfile.status || (this.staffProfile.active === false ? 'Inactive' : 'Active');
    },

    profileSkills() {
      return this.splitProfileList(this.staffProfile.skills);
    },

    profileCertifications() {
      return this.splitProfileList(this.staffProfile.certifications);
    },

    profileLanguages() {
      return this.splitProfileList(this.staffProfile.languages);
    },

    // Trek options filtered by search query (name, location, batch code)
    filteredTrekOptions() {
      const q = this.trekSearchQuery.toLowerCase().trim();
      if (!q) return this.assignedTreks;
      return this.assignedTreks.filter(t =>
        t.name.toLowerCase().includes(q) ||
        (t.location && t.location.toLowerCase().includes(q)) ||
        (t.batchCode && t.batchCode.toLowerCase().includes(q))
      );
    },

    // ── SOCIAL COMPUTED ───────────────────────────
    selectedSocialGroupTrek() {
      return this.socialGroups.find(t => t.id === this.selectedSocialTrekId) || this.assignedTreks.find(t => t.id === this.selectedSocialTrekId) || null;
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
    socialGroupMembers() {
      if (!this.selectedSocialTrekId) return [];
      return this.participants.filter(p => p.trekId === this.selectedSocialTrekId && (p.status === 'Booked' || p.status === 'Completed'));
    },
  },

  methods: {
    // ── NAV ────────────────────────────────────────
    goTab(tab, options = {}) {
      const validTabs = ['dashboard', 'treks', 'participants', 'exports', 'profile', 'social', 'support'];
      if (!validTabs.includes(tab)) return;

      let targetHash = tab;
      if (tab === 'treks') {
        if (options.keepParticipantsInline && this.participantTrekId) {
          targetHash = `treks/participants/${this.participantTrekId}`;
        } else if (options.keepAttendanceInline && this.selectedTrekId) {
          targetHash = `treks/attendance/${this.selectedTrekId}`;
        }
      } else if (tab === 'participants' && this.participantTrekId) {
        targetHash = `participants/trek/${this.participantTrekId}`;
      } else if (tab === 'social') {
        this.selectedSocialTrekId = null;
        targetHash = 'social';
      }

      if (window.location.hash.slice(1) === targetHash) {
        this.handleHashChange();
      } else {
        window.location.hash = targetHash;
      }
    },

    handleHashChange() {
      const hash = window.location.hash.slice(1);
      if (!hash) {
        window.location.hash = 'dashboard';
        return;
      }

      // Check sub-routes for treks
      if (hash.startsWith('treks/participants/')) {
        const trekId = parseInt(hash.replace('treks/participants/', ''), 10);
        this.activeTab = 'treks';
        this.participantsInTreksTab = true;
        this.attendanceInTreksTab = false;
        this.participantTrekId = isNaN(trekId) ? null : trekId;
        this.selectedTrekId = null;
      } else if (hash.startsWith('treks/attendance/')) {
        const trekId = parseInt(hash.replace('treks/attendance/', ''), 10);
        this.activeTab = 'treks';
        this.participantsInTreksTab = false;
        this.attendanceInTreksTab = true;
        this.selectedTrekId = isNaN(trekId) ? null : trekId;
        this.participantTrekId = null;
      } else if (hash.startsWith('participants/trek/')) {
        const trekId = parseInt(hash.replace('participants/trek/', ''), 10);
        this.activeTab = 'participants';
        this.participantsInTreksTab = false;
        this.attendanceInTreksTab = false;
        this.participantTrekId = isNaN(trekId) ? null : trekId;
        this.selectedTrekId = null;
      } else if (hash.startsWith('social/group/')) {
        const trekId = parseInt(hash.replace('social/group/', ''), 10);
        this.activeTab = 'social';
        this.selectedSocialTrekId = isNaN(trekId) ? null : trekId;
      } else {
        const validTabs = ['dashboard', 'treks', 'participants', 'exports', 'profile', 'social', 'support'];
        if (validTabs.includes(hash)) {
          this.activeTab = hash;
          this.participantsInTreksTab = false;
          this.attendanceInTreksTab = false;
          this.participantTrekId = null;
          this.selectedTrekId = null;
          if (hash === 'social') {
            this.selectedSocialTrekId = null;
            this.fetchSocialGroups();
          }
        } else {
          window.location.hash = 'dashboard';
          return;
        }
      }

      this.sidebarOpen = false;
      if (this.activeTab) {
        localStorage.setItem('staffActiveTab', this.activeTab);
      }
      this.resetPageScroll();
    },

    resetPageScroll() {
      this.$nextTick(() => {
        window.scrollTo(0, 0);
        const el = this.$el ? this.$el.querySelector('.ts-main') : document.querySelector('.ts-main');
        if (el) {
          el.scrollTop = 0;
          requestAnimationFrame(() => { el.scrollTop = 0; });
        }
      });
    },

    // ── DATA FETCH ────────────────────────────────
    async fetchStaffData() {
      try {
        const res = await fetch('/api/staff/dashboard_data');
        if (res.ok) {
          const data = await res.json();
          this.staffName = data.staffName || this.staffName;
          if (data.staffProfile) {
            this.staffProfile = data.staffProfile;
          } else {
            this.staffProfile.name = data.staffName || this.staffProfile.name;
          }
          this.assignedTreks = data.assignedTreks || this.assignedTreks;
          this.participants = data.participants || this.participants;

          // Map mock social messages/announcements dynamically to active trek IDs
          if (this.assignedTreks.length > 0) {
            const firstId = this.assignedTreks[0].id;
            const secondId = this.assignedTreks[1] ? this.assignedTreks[1].id : firstId;
            
            this.socialMessages.forEach(m => {
              if (m.trekId === 1) m.trekId = firstId;
              else if (m.trekId === 2) m.trekId = secondId;
            });
            this.socialAnnouncements.forEach(a => {
              if (a.trekId === 1) a.trekId = firstId;
              else if (a.trekId === 2) a.trekId = secondId;
            });
            
            // Don't auto-open chat of group by default
          }
        }
      } catch (e) {
        console.error("Error fetching staff data:", e);
      }
    },

    // ── TREK HELPERS ──────────────────────────────
    slotColor(t) {
      const pct = t.registered / t.slots;
      return pct >= 0.9 ? '#ef4444' : pct >= 0.7 ? '#fbbf24' : '#4ade80';
    },
    slotPct(t) { return Math.min(100, Math.round((t.registered / t.slots) * 100)); },
    slotsLeft(t) { return t.slots - t.registered; },
    daysUntil(dateStr) { return Math.ceil((new Date(dateStr) - new Date()) / 86400000); },

    formatDate(dateStr) {
      if (!dateStr) return '';
      const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
      const d = new Date(dateStr);
      if (isNaN(d)) return dateStr;
      return String(d.getUTCDate()).padStart(2,'0') + ' ' + months[d.getUTCMonth()] + ' ' + d.getUTCFullYear();
    },
    formatShortDate(dateStr) {
      if (!dateStr) return '';
      const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
      const d = new Date(dateStr);
      if (isNaN(d)) return dateStr;
      return String(d.getUTCDate()).padStart(2,'0') + ' ' + months[d.getUTCMonth()];
    },
    getTrekWeather(trek) {
      if (!trek) return { temp: '—', condition: 'Sunny', icon: 'bi-sun', wind: '—', humidity: '—' };
      const name = trek.name.toLowerCase();
      if (name.includes('kedarkantha')) {
        return { temp: '4°C', condition: 'Snowy / Wind Chill', icon: 'bi-snow', wind: '18 km/h', humidity: '82%' };
      } else if (name.includes('hampta')) {
        return { temp: '12°C', condition: 'Rainy / Cloudy', icon: 'bi-cloud-rain-heavy', wind: '12 km/h', humidity: '90%' };
      } else if (name.includes('roopkund')) {
        return { temp: '-2°C', condition: 'Freezing / Snow', icon: 'bi-thermometer-snow', wind: '22 km/h', humidity: '85%' };
      }
      return { temp: '16°C', condition: 'Clear Skies', icon: 'bi-sun-fill', wind: '8 km/h', humidity: '45%' };
    },
    async fetchStaffTickets() {
      try {
        const res = await fetch('/api/staff/tickets');
        if (res.ok) {
          this.supportTickets = await res.json();
        }
      } catch (e) {
        console.error("Error fetching staff tickets:", e);
      }
    },
    async submitStaffTicket() {
      if (!this.newTicket.subject.trim() || !this.newTicket.message.trim()) {
        this.showToast('Please fill in both subject and description.', 'error');
        return;
      }
      this.submittingSupport = true;
      try {
        const res = await fetch('/api/staff/tickets', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            subject: this.newTicket.subject.trim(),
            category: this.newTicket.category,
            message: this.newTicket.message.trim()
          })
        });
        const data = await res.json();
        if (res.ok && data.success) {
          this.showToast(data.message || 'Support ticket submitted successfully!');
          this.newTicket = { subject: '', category: 'General', message: '' };
          await this.fetchStaffTickets();
        } else {
          this.showToast(data.error || 'Failed to submit support ticket.', 'error');
        }
      } catch (e) {
        console.error("Error submitting support ticket:", e);
        this.showToast('Server error while submitting support ticket.', 'error');
      } finally {
        this.submittingSupport = false;
      }
    },
    async submitLeaveRequest() {
      if (!this.leaveRequest.startDate || !this.leaveRequest.endDate || !this.leaveRequest.reason.trim()) {
        this.showToast('Please fill in start date, end date, and reason.', 'error');
        return;
      }
      const start = new Date(this.leaveRequest.startDate);
      const end = new Date(this.leaveRequest.endDate);
      if (start > end) {
        this.showToast('Start date must be before or equal to end date.', 'error');
        return;
      }
      this.submittingLeave = true;
      try {
        const dateRangeStr = `${this.leaveRequest.startDate} to ${this.leaveRequest.endDate}`;
        const subject = `Leave Request: ${dateRangeStr}`;
        const message = `Leave Dates: ${dateRangeStr}\nReason: ${this.leaveRequest.reason.trim()}`;
        
        const res = await fetch('/api/staff/tickets', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            subject: subject,
            category: 'Leave Request',
            message: message
          })
        });
        const data = await res.json();
        if (res.ok && data.success) {
          this.showToast('Leave request submitted successfully for approval!');
          this.leaveRequest = { startDate: '', endDate: '', reason: '' };
          await this.fetchStaffTickets();
        } else {
          this.showToast(data.error || 'Failed to submit leave request.', 'error');
        }
      } catch (e) {
        console.error("Error submitting leave request:", e);
        this.showToast('Server error while submitting leave request.', 'error');
      } finally {
        this.submittingLeave = false;
      }
    },
    async fetchSocialGroups() {
      try {
        const res = await fetch('/api/social/groups');
        if (res.ok) {
          this.socialGroups = await res.json();
          // Don't auto-open chat of group by default
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
        }
      } catch (e) {
        console.error("Error fetching social messages:", e);
      } finally {
        if (!options.silent) this.loadingSocial = false;
      }
    },
    async toggleSocialGroupLock(trekId) {
      try {
        const res = await fetch(`/api/social/group/${trekId}/toggle_lock`, { method: 'POST' });
        const data = await res.json();
        if (res.ok && data.success) {
          this.showToast(data.isLocked ? 'Group chat locked (view only for trekkers).' : 'Group chat unlocked successfully!');
          await this.fetchSocialGroups();
        } else {
          this.showToast(data.error || 'Failed to toggle group lock.', 'error');
        }
      } catch (e) {
        console.error("Error toggling group lock:", e);
      }
    },
    selectSocialGroup(trekId) {
      this.selectedSocialTrekId = trekId;
      window.location.hash = `social/group/${trekId}`;
      this.fetchSocialGroupMessages(trekId);
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
          const data = await res.json();
          await this.fetchSocialGroupMessages(this.selectedSocialTrekId);
        } else {
          const errData = await res.json();
          this.showToast(errData.error || 'Failed to send message.', 'error');
        }
      } catch (e) {
        console.error("Error sending message:", e);
      }
    },
    async postSocialAnnouncement() {
      if (!this.newSocialAnnouncementTitle.trim() || !this.newSocialAnnouncementText.trim()) {
        this.showToast('Please fill in announcement title and details.', 'error');
        return;
      }
      try {
        const title = this.newSocialAnnouncementTitle.trim();
        const content = this.newSocialAnnouncementText.trim();
        this.newSocialAnnouncementTitle = '';
        this.newSocialAnnouncementText = '';
        
        const res = await fetch(`/api/social/group/${this.selectedSocialTrekId}/messages`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messageText: content,
            isAnnouncement: true,
            announcementTitle: title
          })
        });
        if (res.ok) {
          this.showToast('Announcement posted & pinned!');
          await this.fetchSocialGroupMessages(this.selectedSocialTrekId);
        } else {
          const errData = await res.json();
          this.showToast(errData.error || 'Failed to post announcement.', 'error');
        }
      } catch (e) {
        console.error("Error posting announcement:", e);
      }
    },
    openSocialProfileModal(p) {
      this.socialProfileTarget = p;
      this.showSocialProfileModal = true;
    },
    getTrekkerCount(trekId) {
      const trekkers = this.participants.filter(p => p.trekId === trekId && (p.status === 'Booked' || p.status === 'Completed')).length;
      return trekkers + 1; // including guide
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

    displayTrekkerId(p) {
      if (!p) return '—';
      return p.trekkerId || (p.userId ? `#${p.userId}` : (p.id ? `#${p.id}` : '—'));
    },

    paymentStatusLabel(p) {
      const raw = (p && p.paymentStatus) || (p && p.paid === false ? 'Pending' : 'Paid');
      const normalized = String(raw).trim() || 'Paid';
      return normalized.charAt(0).toUpperCase() + normalized.slice(1).toLowerCase();
    },

    paymentStatusClass(p) {
      return 'pay-pill pay-' + this.paymentStatusLabel(p).toLowerCase();
    },

    getProgressStep(status) {
      const map = { Pending: 0, Approved: 1, Open: 2, Started: 3, Completed: 4 };
      return map[status] ?? 0;
    },

    // ── SLOT MODAL ────────────────────────────────
    openSlotModal(t) { this.slotTarget = t; this.newSlots = t.slots; this.showSlotModal = true; },
    async saveSlots() {
      if (this.newSlots < this.slotTarget.registered) { this.showToast('Slots cannot be less than registered count', 'error'); return; }
      try {
        const res = await fetch(`/api/staff/treks/slots/${this.slotTarget.id}`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ slots: this.newSlots })
        });
        if (res.ok) { this.showToast('Slots updated successfully'); this.fetchStaffData(); }
        else this.showToast('Failed to update slots', 'error');
      } catch {
        this.slotTarget.slots = parseInt(this.newSlots);
        this.activityLog.unshift({ id: Date.now(), text: `Updated <strong>${this.slotTarget.name}</strong> slots to ${this.newSlots}`, type: 'update', time: 'just now' });
        this.showToast('Slots updated successfully');
      }
      this.showSlotModal = false;
    },

    // ── STATUS MODAL ─────────────────────────────
    openStatusModal(t) { this.statusTarget = t; this.newStatus = t.status; this.showStatusModal = true; },
    async saveStatus() {
      try {
        const res = await fetch(`/api/staff/treks/status/${this.statusTarget.id}`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: this.newStatus })
        });
        if (res.ok) { this.showToast(`Trek status → ${this.newStatus}`); this.fetchStaffData(); }
        else this.showToast('Failed to update status', 'error');
      } catch {
        this.statusTarget.status = this.newStatus;
        this.activityLog.unshift({ id: Date.now(), text: `Changed <strong>${this.statusTarget.name}</strong> status to ${this.newStatus}`, type: 'status', time: 'just now' });
        this.showToast(`Status updated to ${this.newStatus}`);
      }
      this.showStatusModal = false;
    },

    // ── PARTICIPANT ACTIONS ────────────────────────
    openParticipantModal(p) { this.participantTarget = p; this.showParticipantModal = true; },
    openEmergencyModal(p) { this.participantTarget = p; this.showEmergencyModal = true; },

    async markParticipantComplete(p) {
      try {
        const res = await fetch(`/api/staff/participants/status/${p.id}`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'Completed' })
        });
        if (res.ok) { this.showToast(`${p.name} marked completed`); this.fetchStaffData(); }
      } catch {
        p.status = 'Completed';
        this.showToast(`${p.name} marked as completed`);
      }
    },
    async cancelParticipant(p) {
      if (!confirm(`Cancel booking for ${p.name}?`)) return;
      try {
        const res = await fetch(`/api/staff/participants/status/${p.id}`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'Cancelled' })
        });
        if (res.ok) { this.showToast(`${p.name}'s booking cancelled`); this.fetchStaffData(); }
      } catch {
        p.status = 'Cancelled';
        const trek = this.assignedTreks.find(t => t.id === p.trekId);
        if (trek && trek.registered > 0) trek.registered--;
        this.activityLog.unshift({ id: Date.now(), text: `<strong>${p.name}</strong> booking cancelled`, type: 'cancel', time: 'just now' });
        this.showToast(`${p.name}'s booking cancelled`);
      }
    },

    toggleAttendance(p) {
      this.setAttendance(p, !p.attendance);
    },

    setAttendance(p, present) {
      const alreadySet = p.attendance === present;
      p.attendance = present;
      const action = present ? 'marked present' : 'marked absent';
      if (alreadySet) {
        this.showToast(`${p.name} already ${present ? 'present' : 'absent'}`);
        return;
      }
      this.activityLog.unshift({ id: Date.now(), text: `<strong>${p.name}</strong> ${action} for ${this.selectedTrek?.name}`, type: 'attendance', time: 'just now' });
      this.showToast(`${p.name} ${action}`);
    },

    selectTrekForParticipants(t, options = {}) {
      if (!t) return;
      this.participantTrekId = t.id;
      this.participantSearch = '';
      this.trekSearchQuery = '';
      this.participantsInTreksTab = Boolean(options.inline);
      this.attendanceInTreksTab = false;
      this.goTab(options.inline ? 'treks' : 'participants', { keepParticipantsInline: options.inline });
    },

    backFromParticipantTrek() {
      this.participantSearch = '';
      this.trekSearchQuery = '';
      if (this.participantsInTreksTab) {
        window.location.hash = 'treks';
      } else {
        window.location.hash = 'participants';
      }
    },

    selectTrekForAttendance(t) {
      if (!t) return;
      this.selectedTrekId = t.id;
      this.participantsInTreksTab = false;
      this.attendanceInTreksTab = true;
      this.goTab('treks', { keepAttendanceInline: true });
    },

    backFromAttendanceTrek() {
      window.location.hash = 'treks';
    },

    // ── CHECKLIST MODAL ───────────────────────────
    async openChecklistModal(trek) {
      this.checklistTrek = trek;
      this.newChecklistItem = '';
      this.showChecklistModal = true;
      this.checklistItems = [];
      try {
        const res = await fetch(`/api/guide/treks/${trek.id}/checklist`);
        if (res.ok) {
          const data = await res.json();
          this.checklistItems = data.map(item => item.itemName);
        } else {
          this.showToast('Failed to load checklist', 'error');
        }
      } catch (e) {
        console.error(e);
        this.showToast('Error loading checklist', 'error');
      }
    },
    addChecklistItem() {
      const item = this.newChecklistItem.trim();
      if (!item) return;
      if (this.checklistItems.includes(item)) { this.showToast('Item already in list', 'error'); return; }
      this.checklistItems.push(item); this.newChecklistItem = '';
    },
    removeChecklistItem(i) { this.checklistItems.splice(i, 1); },
    async saveChecklist() {
      try {
        const res = await fetch(`/api/guide/treks/${this.checklistTrek.id}/checklist`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ items: this.checklistItems })
        });
        if (res.ok) {
          this.showToast('Checklist saved and synced to participants');
          this.showChecklistModal = false;
        } else {
          this.showToast('Failed to save checklist', 'error');
        }
      } catch (e) {
        console.error(e);
        this.showToast('Error saving checklist', 'error');
      }
    },

    // ── MARK AS STARTED ───────────────────────────
    async markStarted(t) {
      try {
        const res = await fetch(`/api/staff/treks/status/${t.id}`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'Started' })
        });
        if (res.ok) { this.showToast(`${t.name} marked as Started!`); this.fetchStaffData(); }
        else this.showToast('Failed to update status', 'error');
      } catch {
        t.status = 'Started';
        this.activityLog.unshift({ id: Date.now(), text: `Marked <strong>${t.name}</strong> as Started`, type: 'status', time: 'just now' });
        this.showToast(`${t.name} marked as Started!`);
      }
    },

    // ── TREK DETAIL MODAL ─────────────────────────
    openTrekDetailModal(t) { this.detailTrek = t; this.showTrekDetailModal = true; },

    // ── ADD PARTICIPANT MODAL ─────────────────────
    openAddParticipantModal(trekId) {
      this.newParticipantTrekId = trekId;
      this.newParticipantEmail = '';
      this.newParticipantName = '';
      this.newParticipantPhone = '';
      this.newParticipantPayment = 'paid';
      this.showAddParticipantModal = true;
    },
    async addParticipant() {
      if (!this.newParticipantName.trim()) { this.showToast('Please enter a name', 'error'); return; }
      if (!this.newParticipantEmail.trim()) { this.showToast('Please enter an email', 'error'); return; }
      try {
        const res = await fetch(`/api/staff/participants/add`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: this.newParticipantName.trim(),
            email: this.newParticipantEmail.trim(),
            phone: this.newParticipantPhone.trim(),
            paymentStatus: this.newParticipantPayment,
            trekId: this.newParticipantTrekId
          })
        });
        const data = await res.json();
        if (res.ok) {
          this.showToast(data.message || 'Participant added successfully');
          // Optimistic add
          this.participants.push({
            id: Date.now(), trekId: this.newParticipantTrekId,
            name: this.newParticipantName.trim(),
            email: this.newParticipantEmail.trim(),
            phone: this.newParticipantPhone.trim(),
            bookedOn: new Date().toISOString().slice(0,10),
            status: 'Booked', attendance: false,
            bloodGroup: '—', emergencyContact: '—', emergencyPhone: '—',
            paymentStatus: this.newParticipantPayment
          });
          const trek = this.assignedTreks.find(t => t.id === this.newParticipantTrekId);
          if (trek) trek.registered++;
        } else this.showToast(data.error || 'Failed to add participant', 'error');
      } catch {
        this.participants.push({
          id: Date.now(), trekId: this.newParticipantTrekId,
          name: this.newParticipantName.trim(),
          email: this.newParticipantEmail.trim(),
          phone: this.newParticipantPhone.trim(),
          bookedOn: new Date().toISOString().slice(0,10),
          status: 'Booked', attendance: false,
          bloodGroup: '—', emergencyContact: '—', emergencyPhone: '—',
          paymentStatus: this.newParticipantPayment
        });
        const trek = this.assignedTreks.find(t => t.id === this.newParticipantTrekId);
        if (trek) trek.registered++;
        this.showToast('Participant added successfully');
      }
      this.showAddParticipantModal = false;
    },

    // ── TREK COMPLETION ───────────────────────────
    openCompletionModal(t) { this.completionTrek = t; this.showCompletionModal = true; },
    async confirmCompletion() {
      const t = this.completionTrek;
      try {
        const res = await fetch(`/api/staff/treks/status/${t.id}`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'Completed' })
        });
        if (res.ok) { this.showToast(`${t.name} marked as Completed!`); this.fetchStaffData(); }
      } catch {
        t.status = 'Completed';
        this.participants.filter(p => p.trekId === t.id && p.status === 'Booked').forEach(p => { p.status = 'Completed'; });
        this.activityLog.unshift({ id: Date.now(), text: `Marked <strong>${t.name}</strong> as Completed`, type: 'status', time: 'just now' });
        this.showToast(`${t.name} marked as Completed!`);
      }
      this.showCompletionModal = false;
    },

    // ── EXPORT ───────────────────────────────────
    async exportCSV(trekId) {
      const tid = trekId || this.selectedTrekId;
      this.exportPending = true; this.exportTrekId = tid;
      const trek = this.assignedTreks.find(t => t.id === tid);
      try {
        const res = await fetch(`/api/staff/export/${tid}`, { method: 'POST' });
        const data = await res.json();
        this.showToast(data.message || 'CSV export triggered');
      } catch {
        this.showToast(`Participant list for ${trek?.name || 'trek'} — CSV sent via email`);
      }
      setTimeout(() => { this.exportPending = false; this.exportTrekId = null; }, 6000);
    },

    // ── PROFILE SAVE ─────────────────────────────
    async saveProfile() {
      this.showToast('Staff profiles can only be edited by administrators.', 'error');
    },

    splitProfileList(value) {
      return (value || '')
        .split(',')
        .map(v => v.trim())
        .filter(Boolean);
    },

    async changePassword() {
      if (!this.pwForm.current || !this.pwForm.new) { this.showToast('Fill all fields', 'error'); return; }
      if (this.pwForm.new !== this.pwForm.confirm) { this.showToast("Passwords don't match", 'error'); return; }
      try {
        const res = await fetch('/api/staff/password', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ current: this.pwForm.current, new: this.pwForm.new })
        });
        const data = await res.json();
        if (res.ok) { this.pwForm = { current: '', new: '', confirm: '' }; this.showToast(data.message || 'Password updated'); }
        else this.showToast(data.error || 'Update failed', 'error');
      } catch {
        this.pwForm = { current: '', new: '', confirm: '' };
        this.showToast('Password changed successfully');
      }
    },

    // ── COUNTDOWN ─────────────────────────────────
    startCountdown() {
      if (this.countdownTimer) clearInterval(this.countdownTimer);
      this.countdownTimer = setInterval(() => {
        const trek = this.nextTrek;
        if (!trek) return;
        const diff = new Date(trek.startDate).getTime() - Date.now();
        if (diff <= 0) { this.countdown = { days: 0, hours: 0, minutes: 0, seconds: 0 }; return; }
        this.countdown = {
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
      setTimeout(() => { this.toast.show = false; }, 3500);
    },

    buildLinePath(data, key, w, h, pad) {
      if (!data || !data.length) return '';
      const max = Math.max(...data.map(d => d[key]));
      const pts = data.map((d, i) => {
        const x = pad + (i / (data.length - 1)) * (w - pad * 2);
        const y = h - pad - (d[key] / (max || 1)) * (h - pad * 2);
        return `${x},${y}`;
      });
      return 'M' + pts.join('L');
    },

    buildAreaPath(data, key, w, h, pad) {
      if (!data || !data.length) return '';
      const line = this.buildLinePath(data, key, w, h, pad);
      const lastX = pad + (w - pad * 2);
      const firstX = pad;
      const baseY = h - pad;
      return line + `L${lastX},${baseY} L${firstX},${baseY}Z`;
    },

    resolvePriorityAction(p) {
      if (!p.actionType) return;
      if (p.trekId) {
        this.selectedTrekId = p.trekId;
      }
      if (p.actionType === 'slots') {
        const trek = this.assignedTreks.find(t => t.id === p.trekId);
        if (trek) this.openSlotModal(trek);
      } else if (p.actionType === 'status') {
        const trek = this.assignedTreks.find(t => t.id === p.trekId);
        if (trek) this.openStatusModal(trek);
      } else if (p.actionType === 'attendance') {
        const trek = this.assignedTreks.find(t => t.id === p.trekId) || this.assignedTreks[0];
        if (trek) this.selectTrekForAttendance(trek);
      } else if (p.actionType === 'participants') {
        this.goTab('participants');
      } else if (p.actionType === 'checklist') {
        const trek = this.assignedTreks.find(t => t.id === p.trekId);
        if (trek) this.openChecklistModal(trek);
      }
    },

    openExportDetailModal(t) {
      this.exportDetailTrek = t;
      this.showExportDetailModal = true;
    },

    openDownloadPromptModal(t) {
      this.downloadPromptTrek = t;
      this.showDownloadPromptModal = true;
    },

    async generatePDFReport(t, type) {
      this.downloadPending = true;
      let checklist = [];
      if (type === 'full') {
        try {
          const res = await fetch(`/api/guide/treks/${t.id}/checklist`);
          if (res.ok) {
            const data = await res.json();
            checklist = data.map(item => item.itemName);
          }
        } catch (e) {
          console.error(e);
        }
      }

      const trekParticipants = this.participants.filter(p => p.trekId === t.id);

      // Create PDF element container
      const container = document.createElement('div');
      container.style.padding = '30px';
      container.style.fontFamily = "'DM Sans', 'Helvetica Neue', sans-serif";
      container.style.color = '#4a3728'; 
      container.style.background = '#fff';

      let html = '';

      // PDF Header
      html += `
        <div style="border-bottom: 2px solid #1a2e1a; padding-bottom: 15px; margin-bottom: 25px; display: flex; justify-content: space-between; align-items: flex-end;">
          <div>
            <div style="font-size: 1.6rem; font-weight: 800; font-family: 'Playfair Display', serif; color: #1a2e1a; letter-spacing: -0.5px;">TrailSync <span style="color: #c8922a; font-weight: 400;">Reports</span></div>
            <div style="font-size: 0.75rem; color: #8c8070; text-transform: uppercase; letter-spacing: 1px; margin-top: 3px;">Trek Guide Operations panel</div>
          </div>
          <div style="text-align: right;">
            <div style="font-size: 0.72rem; font-family: 'Space Mono', monospace; font-weight: 700; color: #c8922a; background: rgba(200,146,42,0.1); padding: 3px 8px; border-radius: 4px; display: inline-block;">${t.batchCode}</div>
            <div style="font-size: 0.7rem; color: #8c8070; margin-top: 4px;">Generated on: ${new Date().toLocaleDateString()}</div>
          </div>
        </div>
      `;

      if (type === 'full') {
        // Full Summary Report
        html += `
          <div style="margin-bottom: 25px;">
            <h2 style="font-family: 'Playfair Display', serif; font-size: 1.4rem; color: #1a2e1a; margin-bottom: 12px; font-weight: 800;">Trek Batch Summary Report</h2>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; background: #fdfaf5; border: 1px solid rgba(26,46,26,0.08); padding: 15px; border-radius: 8px; margin-bottom: 20px;">
              <div>
                <div style="font-size: 0.72rem; color: #8c8070; text-transform: uppercase; font-weight: 600;">Adventure Name</div>
                <div style="font-size: 0.95rem; font-weight: 700; color: #1a2e1a; margin-top: 2px;">${t.name}</div>
              </div>
              <div>
                <div style="font-size: 0.72rem; color: #8c8070; text-transform: uppercase; font-weight: 600;">Location</div>
                <div style="font-size: 0.95rem; font-weight: 700; color: #1a2e1a; margin-top: 2px;">📍 ${t.location}</div>
              </div>
              <div style="margin-top: 10px;">
                <div style="font-size: 0.72rem; color: #8c8070; text-transform: uppercase; font-weight: 600;">Schedule Dates</div>
                <div style="font-size: 0.88rem; font-weight: 600; color: #1a2e1a; margin-top: 2px;">${this.formatDate(t.startDate)} — ${this.formatDate(t.endDate)}</div>
              </div>
              <div style="margin-top: 10px;">
                <div style="font-size: 0.72rem; color: #8c8070; text-transform: uppercase; font-weight: 600;">Base Price</div>
                <div style="font-size: 0.88rem; font-weight: 600; color: #1a2e1a; margin-top: 2px;">₹${t.price ? t.price.toLocaleString() : '5,000'}</div>
              </div>
            </div>

            <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 25px;">
              <div style="border: 1px solid rgba(26,46,26,0.07); padding: 10px; border-radius: 6px; text-align: center; background: #fff;">
                <div style="font-size: 1.4rem; font-family: 'Playfair Display', serif; font-weight: 800; color: #1a2e1a;">${t.registered}/${t.slots}</div>
                <div style="font-size: 0.62rem; color: #8c8070; font-weight: 700; text-transform: uppercase; margin-top: 4px;">Occupancy</div>
              </div>
              <div style="border: 1px solid rgba(26,46,26,0.07); padding: 10px; border-radius: 6px; text-align: center; background: #fff;">
                <div style="font-size: 1.4rem; font-family: 'Playfair Display', serif; font-weight: 800; color: #1a2e1a;">${t.registered > 0 ? Math.round((t.registered / t.slots) * 100) : 0}%</div>
                <div style="font-size: 0.62rem; color: #8c8070; font-weight: 700; text-transform: uppercase; margin-top: 4px;">Fill Rate</div>
              </div>
              <div style="border: 1px solid rgba(26,46,26,0.07); padding: 10px; border-radius: 6px; text-align: center; background: #fff;">
                <div style="font-size: 1.4rem; font-family: 'Playfair Display', serif; font-weight: 800; color: #1a2e1a;">${t.slots - t.registered}</div>
                <div style="font-size: 0.62rem; color: #8c8070; font-weight: 700; text-transform: uppercase; margin-top: 4px;">Slots Left</div>
              </div>
              <div style="border: 1px solid rgba(26,46,26,0.07); padding: 10px; border-radius: 6px; text-align: center; background: #fff;">
                <div style="font-size: 1.4rem; font-family: 'Playfair Display', serif; font-weight: 800; color: #c8922a;">${t.status}</div>
                <div style="font-size: 0.62rem; color: #8c8070; font-weight: 700; text-transform: uppercase; margin-top: 4px;">Batch Status</div>
              </div>
            </div>
          </div>
        `;

        if (checklist.length > 0) {
          html += `
            <div style="margin-bottom: 25px;">
              <h3 style="font-family: 'Playfair Display', serif; font-size: 1.1rem; color: #1a2e1a; margin-bottom: 8px; font-weight: 700;">Trek Checklist Items</h3>
              <div style="display: flex; flex-wrap: wrap; gap: 6px;">
                ${checklist.map(item => `<span style="font-size: 0.72rem; background: #f5f0e8; color: #1a2e1a; padding: 4px 10px; border-radius: 4px; border: 1px solid rgba(26,46,26,0.08);">${item}</span>`).join('')}
              </div>
            </div>
          `;
        }
      } else {
        // Participants List Only Header
        html += `
          <div style="margin-bottom: 20px;">
            <h2 style="font-family: 'Playfair Display', serif; font-size: 1.4rem; color: #1a2e1a; margin-bottom: 4px; font-weight: 800;">Trek Participant Directory</h2>
            <div style="font-size: 0.82rem; color: #8c8070;">Trek: <strong style="color: #1a2e1a;">${t.name}</strong> · Batch: <strong style="color: #1a2e1a;">${t.batchCode}</strong> · Location: <strong>📍 ${t.location}</strong></div>
          </div>
        `;
      }

      // Participant Table
      html += `
        <div>
          <h3 style="font-family: 'Playfair Display', serif; font-size: 1.1rem; color: #1a2e1a; margin-bottom: 10px; font-weight: 700; border-bottom: 1px solid rgba(26,46,26,0.1); padding-bottom: 5px;">Trekker Roster (${trekParticipants.length} registered)</h3>
          <table style="width: 100%; border-collapse: collapse; font-size: 0.74rem; text-align: left;">
            <thead>
              <tr style="background: #1a2e1a; color: #fff;">
                <th style="padding: 8px; border: 1px solid #1a2e1a;">Trekker ID</th>
                <th style="padding: 8px; border: 1px solid #1a2e1a;">Name</th>
                <th style="padding: 8px; border: 1px solid #1a2e1a;">Contact Information</th>
                <th style="padding: 8px; border: 1px solid #1a2e1a; text-align: center;">Blood</th>
                <th style="padding: 8px; border: 1px solid #1a2e1a; text-align: center;">Emergency Contact</th>
                <th style="padding: 8px; border: 1px solid #1a2e1a; text-align: center;">Payment</th>
              </tr>
            </thead>
            <tbody>
              ${trekParticipants.map((p, idx) => `
                <tr style="background: ${idx % 2 === 0 ? '#fff' : '#fdfaf5'}; border-bottom: 1px solid rgba(26,46,26,0.08);">
                  <td style="padding: 8px; font-family: 'Space Mono', monospace; font-weight: bold; color: #1a2e1a;">${this.displayTrekkerId(p)}</td>
                  <td style="padding: 8px; font-weight: 600; color: #1a2e1a;">${p.name}</td>
                  <td style="padding: 8px;">
                    <div>📧 ${p.email}</div>
                    <div style="margin-top: 2px;">📞 ${p.phone || '—'}</div>
                  </td>
                  <td style="padding: 8px; text-align: center; font-family: 'Space Mono', monospace; color: #dc2626; font-weight: bold;">${p.bloodGroup || '—'}</td>
                  <td style="padding: 8px; text-align: center;">
                    <div>${p.emergencyContactName || '—'}</div>
                    <div style="font-size: 0.66rem; color: #8c8070; margin-top: 1px;">${p.emergencyContactPhone || ''}</div>
                  </td>
                  <td style="padding: 8px; text-align: center;">
                    <span style="font-size: 0.64rem; padding: 2px 6px; border-radius: 4px; font-weight: bold; text-transform: uppercase; background: ${p.paymentStatus === 'Paid' ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.1)'}; color: ${p.paymentStatus === 'Paid' ? '#10b981' : '#d97706'}; border: 1px solid ${p.paymentStatus === 'Paid' ? 'rgba(16,185,129,0.2)' : 'rgba(245,158,11,0.2)'};">
                      ${p.paymentStatus || 'Paid'}
                    </span>
                  </td>
                </tr>
              `).join('')}
              ${trekParticipants.length === 0 ? `
                <tr>
                  <td colspan="6" style="padding: 20px; text-align: center; color: #8c8070; font-style: italic;">No trekkers are currently registered for this batch.</td>
                </tr>
              ` : ''}
            </tbody>
          </table>
        </div>
      `;

      container.innerHTML = html;
      document.body.appendChild(container);

      const opt = {
        margin:       0.4,
        filename:     `TrailSync_${t.batchCode}_${type === 'full' ? 'Full_Report' : 'Roster'}.pdf`,
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { scale: 2, useCORS: true },
        jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' }
      };

      try {
        await html2pdf().from(container).set(opt).save();
        this.showToast('PDF downloaded successfully!', 'success');
      } catch (err) {
        console.error(err);
        this.showToast('Failed to generate PDF. Please try again.', 'error');
      } finally {
        document.body.removeChild(container);
        this.downloadPending = false;
        this.showDownloadPromptModal = false;
      }
    },
  },

  mounted() {
    this.fetchStaffData();
    this.fetchSocialGroups();
    this.startCountdown();

    this.hashListener = this.handleHashChange.bind(this);
    window.addEventListener('hashchange', this.hashListener);

    const hash = window.location.hash.slice(1);
    if (hash) {
      this.handleHashChange();
    } else {
      const savedTab = localStorage.getItem('staffActiveTab');
      const validTabs = ['dashboard', 'treks', 'participants', 'exports', 'profile', 'social', 'support'];
      if (savedTab && validTabs.includes(savedTab)) {
        window.location.hash = savedTab === 'attendance' ? 'treks' : savedTab;
      } else {
        window.location.hash = 'dashboard';
      }
    }

    // Polling interval for social groups & messages
    this.socialPollInterval = setInterval(() => {
      this.fetchSocialGroups();
      if (this.activeTab === 'social' && this.selectedSocialTrekId) {
        this.fetchSocialGroupMessages(this.selectedSocialTrekId, { silent: true });
      }
    }, 15000);
  },

  beforeUnmount() {
    if (this.countdownTimer) clearInterval(this.countdownTimer);
    if (this.socialPollInterval) clearInterval(this.socialPollInterval);
    window.removeEventListener('hashchange', this.hashListener);
  },

  template: `
  <div class="ts-staff-layout" :class="{ 'sidebar-collapsed': sidebarCollapsed }">

    <!-- Mobile sidebar overlay -->
    <div class="sidebar-overlay" :class="{ visible: sidebarOpen }" @click="sidebarOpen = false"></div>

    <!-- ── SIDEBAR ────────────────────────────────── -->
    <aside class="ts-sidebar" :class="{ open: sidebarOpen, collapsed: sidebarCollapsed }">

      <!-- Sidebar header with toggle -->
      <div class="sidebar-header-row">
        <a class="brand-name" href="#">Trail<span>Sync</span></a>
        <button class="sidebar-toggle-btn" @click="sidebarCollapsed = !sidebarCollapsed; sidebarOpen = false" :title="sidebarCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'">
          <i v-if="!sidebarCollapsed" class="bi bi-x-lg"></i>
          <i v-else class="bi bi-list"></i>
        </button>
      </div>

      <!-- Staff chip (hidden when collapsed) -->
      <div class="sidebar-staff-chip" v-show="!sidebarCollapsed">
        <div class="staff-avatar">
          <img v-if="profilePhotoUrl" :src="profilePhotoUrl" :alt="staffProfile.name" />
          <span v-else>{{ staffInitial }}</span>
        </div>
        <div class="staff-chip-info">
          <div class="staff-chip-name">{{ staffProfile.name }}</div>
          <div class="staff-chip-role">{{ staffProfile.designation || 'Trek Staff' }}</div>
        </div>
      </div>

      <nav class="sidebar-nav">
        <div class="nav-section-label" v-show="!sidebarCollapsed">Operations</div>
        <a class="nav-item" :class="{ active: activeTab === 'dashboard' }" @click="goTab('dashboard')" :title="sidebarCollapsed ? 'Home' : ''">
          <i class="bi bi-house-door-fill nav-icon"></i>
          <span v-show="!sidebarCollapsed">Home</span>
        </a>
        <a class="nav-item" :class="{ active: activeTab === 'treks' }" @click="goTab('treks')" :title="sidebarCollapsed ? 'Assigned Treks' : ''">
          <i class="bi bi-map-fill nav-icon"></i>
          <span v-show="!sidebarCollapsed">Assigned Treks</span>
          <span class="nav-badge" v-show="!sidebarCollapsed">{{ assignedTreks.length }}</span>
        </a>
        <a class="nav-item" :class="{ active: activeTab === 'participants' }" @click="goTab('participants')" :title="sidebarCollapsed ? 'Participants' : ''">
          <i class="bi bi-people-fill nav-icon"></i>
          <span v-show="!sidebarCollapsed">Participants</span>
        </a>
        <div class="nav-section-label" v-show="!sidebarCollapsed">Management</div>
        <a class="nav-item" :class="{ active: activeTab === 'exports' }" @click="goTab('exports')" :title="sidebarCollapsed ? 'Exports' : ''">
          <i class="bi bi-download nav-icon"></i>
          <span v-show="!sidebarCollapsed">Exports</span>
        </a>
        <div class="nav-section-label" v-show="!sidebarCollapsed">Communication</div>
        <a class="nav-item" :class="{ active: activeTab === 'social' }" @click="goTab('social')" :title="sidebarCollapsed ? 'TrailSync Social' : ''">
          <i class="bi bi-chat-left-text-fill nav-icon"></i>
          <span v-show="!sidebarCollapsed">TrailSync Social</span>
        </a>
        <div class="nav-section-label" v-show="!sidebarCollapsed">Helpdesk</div>
        <a class="nav-item" :class="{ active: activeTab === 'support' }" @click="goTab('support')" :title="sidebarCollapsed ? 'Support & Leaves' : ''">
          <i class="bi bi-question-circle-fill nav-icon"></i>
          <span v-show="!sidebarCollapsed">Support & Leaves</span>
        </a>
        <div class="nav-section-label" v-show="!sidebarCollapsed">Account</div>
        <a class="nav-item" :class="{ active: activeTab === 'profile' }" @click="goTab('profile')" :title="sidebarCollapsed ? 'My Profile' : ''">
          <i class="bi bi-person-fill nav-icon"></i>
          <span v-show="!sidebarCollapsed">My Profile</span>
        </a>
      </nav>

      <div class="sidebar-footer">
        <button class="btn-logout-sidebar" @click="$emit('logout')" :title="sidebarCollapsed ? 'Sign Out' : ''">
          <i class="bi bi-box-arrow-right nav-icon"></i>
          <span v-show="!sidebarCollapsed">Sign Out</span>
        </button>
      </div>
    </aside>

    <!-- ── MAIN ───────────────────────────────────── -->
    <div class="ts-main">

      <!-- Topbar -->
      <div class="ts-topbar">
        <a v-if="sidebarCollapsed" class="topbar-brand-mini topbar-brand-left" href="#" @click.prevent="goTab('dashboard')">Trail<span>Sync</span></a>
        <div v-if="!sidebarCollapsed" class="topbar-breadcrumb">
          TrailSync / <span>{{ activeTab === 'dashboard' ? 'Home' : activeTab.charAt(0).toUpperCase() + activeTab.slice(1) }}</span>
        </div>
        <div class="topbar-spacer"></div>
        <!-- Profile dropdown -->
        <div class="topbar-profile" style="position: relative;">
          <button class="topbar-profile-btn" @click="profileDropdownOpen = !profileDropdownOpen">
            <div class="topbar-avatar">
              <img v-if="profilePhotoUrl" :src="profilePhotoUrl" :alt="staffProfile.name" />
              <span v-else>{{ staffInitial }}</span>
            </div>
            <span class="topbar-profile-name">{{ staffProfile.name ? staffProfile.name.split(' ')[0] : 'Staff' }}</span>
            <i class="bi bi-chevron-down" style="font-size: 0.7rem; margin-left: 4px; opacity: 0.7;"></i>
          </button>
          <!-- Dropdown overlay (closes on outside click) -->
          <div v-if="profileDropdownOpen" class="profile-dropdown-overlay" @click="profileDropdownOpen = false"></div>
          <!-- Dropdown -->
          <div v-if="profileDropdownOpen" class="profile-dropdown" @click.stop>
            <div class="profile-dropdown-header">
              <div class="pd-avatar">
                <img v-if="profilePhotoUrl" :src="profilePhotoUrl" :alt="staffProfile.name" />
                <span v-else>{{ staffInitial }}</span>
              </div>
              <div>
                <div class="pd-name">{{ staffProfile.name }}</div>
                <div class="pd-id">ID: {{ staffProfile.memberId || 'STF-001' }}</div>
              </div>
            </div>
            <div class="pd-email"><i class="bi bi-envelope-fill me-2"></i>{{ staffProfile.email || 'staff@trailsync.in' }}</div>
            <div class="pd-divider"></div>
            <a class="pd-item" @click="goTab('profile'); profileDropdownOpen = false">
              <i class="bi bi-person-fill me-2"></i>View Profile
            </a>
            <a class="pd-item pd-signout" @click="$emit('logout')">
              <i class="bi bi-box-arrow-right me-2"></i>Sign Out
            </a>
          </div>
        </div>
      </div>

      <div v-if="sidebarCollapsed" class="tab-context-bar">
        <div class="topbar-breadcrumb">
          TrailSync / <span>{{ activeTab === 'dashboard' ? 'Home' : activeTab.charAt(0).toUpperCase() + activeTab.slice(1) }}</span>
        </div>
      </div>

      <!-- ════════════════════════════════════════════
           DASHBOARD TAB
      ════════════════════════════════════════════ -->
      <div v-if="activeTab === 'dashboard'" class="tab-content">

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
              <div class="ts-card-title"><i class="bi bi-list-stars"></i> Assigned Treks Summary</div>
            </div>
            <div class="ts-card-body" style="padding: 1.25rem;">
              <div class="table-responsive">
                <table class="table ts-table align-middle" style="margin-bottom: 0;">
                  <thead>
                    <tr>
                      <th>Trek</th>
                      <th>Location</th>
                      <th>Date</th>
                      <th>Status</th>
                      <th>Slots</th>
                      <th class="text-end" style="width: 320px;">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="t in assignedTreks" :key="t.id">
                      <td class="fw-bold">{{ t.name }}</td>
                      <td>{{ t.location }}</td>
                      <td class="mono" style="font-size: 0.8rem;">{{ formatShortDate(t.startDate) }}</td>
                      <td>
                        <span :class="'status-pill status-' + t.status.toLowerCase()">{{ t.status }}</span>
                      </td>
                      <td class="mono" style="font-size: 0.8rem;">{{ t.registered }}/{{ t.slots }}</td>
                      <td class="text-end">
                        <div class="d-flex gap-1 justify-content-end">
                          <button class="btn btn-sm btn-outline-forest py-1 px-2" style="font-size: 0.72rem; font-weight: 600;" @click="openTrekDetailModal(t)">
                            <i class="bi bi-eye"></i> View Details
                          </button>
                          <button class="btn btn-sm btn-outline-gold py-1 px-2" style="font-size: 0.72rem; font-weight: 600;" @click="openSlotModal(t)">
                            <i class="bi bi-pencil-square"></i> Edit Slots
                          </button>
                          <button class="btn btn-sm btn-outline-primary-ts py-1 px-2" style="font-size: 0.72rem; font-weight: 600;" @click="selectTrekForParticipants(t, { inline: false })">
                            <i class="bi bi-people"></i> Manage Participants
                          </button>
                        </div>
                      </td>
                    </tr>
                    <tr v-if="!assignedTreks.length">
                      <td colspan="6" class="text-center py-4 text-muted" style="font-size: 0.85rem;">
                        No assigned treks found.
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

      </div>

      <!-- ════════════════════════════════════════════
           ASSIGNED TREKS TAB
      ════════════════════════════════════════════ -->
      <div v-if="activeTab === 'treks' && !participantsInTreksTab && !attendanceInTreksTab" class="tab-content">
        <div class="page-header">
          <div>
            <div class="section-eyebrow">Staff Panel</div>
            <div class="section-title">Assigned <em>Treks</em></div>
          </div>
          <button class="btn-back-home" @click="goTab('dashboard')"><i class="bi bi-house-door-fill me-1"></i>Back to Home</button>
        </div>

        <div v-if="!filteredTreks.length" class="empty-state">
          <svg viewBox="0 0 24 24"><path d="M3 17l4-8 4 4 4-6 4 10"/></svg>
          <p>No treks found.</p>
        </div>

        <div class="treks-grid-staff">
          <div v-for="t in filteredTreks" :key="t.id" class="trek-staff-card">
            <!-- Batch Badge above name -->
            <div class="tsc-batch-badge">Batch {{ t.batchCode }}</div>

            <!-- Header -->
            <div class="tsc-header">
              <div>
                <div class="tsc-name">{{ t.name }}</div>
                <div class="tsc-loc">
                  <svg viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                  {{ t.location }}
                </div>
              </div>
              <div style="display:flex;flex-direction:column;align-items:flex-end;gap:4px">
                <span :class="'status-pill status-' + t.status.toLowerCase()">{{ t.status }}</span>
                <span :class="'diff-pill pill-' + t.difficulty.toLowerCase()" style="font-size:0.68rem">{{ t.difficulty }}</span>
              </div>
            </div>

            <!-- Stats Row 1: Dates + Duration -->
            <div class="tsc-stats-row">
              <div class="tsc-stat-cell">
                <div class="tsc-stat-cell-label">Start Date</div>
                <div class="tsc-stat-cell-val">{{ formatDate(t.startDate) }}</div>
              </div>
              <div class="tsc-stat-divider"></div>
              <div class="tsc-stat-cell">
                <div class="tsc-stat-cell-label">End Date</div>
                <div class="tsc-stat-cell-val">{{ formatDate(t.endDate) }}</div>
              </div>
              <div class="tsc-stat-divider"></div>
              <div class="tsc-stat-cell">
                <div class="tsc-stat-cell-label">Duration</div>
                <div class="tsc-stat-cell-val">{{ t.duration }}d</div>
              </div>
            </div>

            <!-- Stats Row 2: Slots + Registered + Occupancy -->
            <div class="tsc-stats-row tsc-stats-row-2">
              <div class="tsc-stat-cell">
                <div class="tsc-stat-cell-label">Total Slots</div>
                <div class="tsc-stat-cell-val">{{ t.slots }}</div>
              </div>
              <div class="tsc-stat-divider"></div>
              <div class="tsc-stat-cell">
                <div class="tsc-stat-cell-label">Registered</div>
                <div class="tsc-stat-cell-val tsc-stat-registered">{{ t.registered }}</div>
              </div>
              <div class="tsc-stat-divider"></div>
              <div class="tsc-stat-cell">
                <div class="tsc-stat-cell-label">Occupancy</div>
                <div class="tsc-stat-cell-val" :style="{ color: slotColor(t) }">{{ slotPct(t) }}%</div>
              </div>
            </div>

            <!-- Slot bar -->
            <div class="slot-bar-wrap" style="margin:0.5rem 0 0.2rem">
              <div class="slot-bar-fill" :style="{ width: slotPct(t) + '%', background: slotColor(t) }"></div>
            </div>

            <!-- Actions -->
            <div class="tsc-actions-grid">
              <div class="tsc-btn-row tsc-btn-row-pair tsc-btn-row-manage">
                <button class="btn-ghost btn-sm tsc-icon-btn tsc-btn-participants" @click="selectTrekForParticipants(t, { inline: true })">
                  <svg viewBox="0 0 24 24"><circle cx="9" cy="8" r="3"/><path d="M2 19c0-3 3-5 7-5"/><circle cx="16" cy="10" r="3"/><path d="M13 19c0-3 2.7-5 6-5"/></svg>
                  Manage Participants
                </button>
                <button class="btn-ghost btn-sm tsc-icon-btn tsc-btn-attendance" @click="selectTrekForAttendance(t)">
                  <svg viewBox="0 0 24 24"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
                  Mark Attendance
                </button>
              </div>
              <div class="tsc-btn-row tsc-btn-row-pair tsc-btn-row-prep">
                <button class="btn-ghost btn-sm tsc-icon-btn tsc-btn-slots" @click="openSlotModal(t)">
                  <svg viewBox="0 0 24 24"><path d="M11 5H6a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2v-5m-1.414-9.414a2 2 0 1 1 2.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                  Edit Slots
                </button>
                <button class="btn-ghost btn-sm tsc-icon-btn tsc-btn-checklist" @click="openChecklistModal(t)">
                  <svg viewBox="0 0 24 24"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
                  Checklist
                </button>
              </div>
              <div class="tsc-btn-row tsc-btn-row-status tsc-btn-row-launch">
                <button v-if="t.status !== 'Started' && t.status !== 'Completed'" class="btn-forest btn-sm tsc-icon-btn tsc-btn-start" @click="markStarted(t)">
                  <svg viewBox="0 0 24 24"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                  Mark as Started
                </button>
                <button v-if="t.status === 'Started'" class="btn-primary-ts btn-sm tsc-icon-btn tsc-btn-complete" @click="openCompletionModal(t)">
                  <svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
                  Mark as Completed
                </button>
                <div v-if="t.status === 'Completed'" class="tsc-completed-chip">
                  <svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
                  Completed
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- ════════════════════════════════════════════
           PARTICIPANTS VIEW
      ════════════════════════════════════════════ -->
      <div v-if="activeTab === 'participants' || (activeTab === 'treks' && participantsInTreksTab)" class="tab-content">
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
              <p>No treks match your search.</p>
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
            <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            CSV export triggered — sent to your email shortly.
          </div>
        </template>
      </div>

      <!-- ════════════════════════════════════════════
           ATTENDANCE VIEW
      ════════════════════════════════════════════ -->
      <div v-if="activeTab === 'treks' && attendanceInTreksTab" class="tab-content">
        <div class="page-header">
          <div>
            <div class="section-eyebrow">Trek Management</div>
            <div class="section-title">Attendance <em>Tracker</em></div>
          </div>
        </div>

        <button class="ptab-back-btn" @click="backFromAttendanceTrek">
          <svg viewBox="0 0 24 24"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
          Assigned Treks
        </button>

        <div v-if="selectedTrek" class="ptab-trek-banner">
          <div class="ptab-banner-info">
            <div class="ptab-batch-label">{{ selectedTrek.batchCode }}</div>
            <div class="ptab-trek-name">{{ selectedTrek.name }}</div>
            <div class="ptab-trek-meta">
              <span><i class="bi bi-geo-alt-fill"></i> {{ selectedTrek.location }}</span>
              <span class="ptab-date-sep">·</span>
              <span>
                <svg viewBox="0 0 24 24" style="width:11px;height:11px;stroke:var(--gold);fill:none;stroke-width:2;vertical-align:middle;margin-right:2px"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                {{ formatDate(selectedTrek.startDate) }} — {{ formatDate(selectedTrek.endDate) }}
              </span>
            </div>
          </div>
          <div class="ptab-banner-right">
            <div class="ptab-occ-bar-wrap">
              <div class="ptab-occ-label">
                <span style="font-size:0.72rem;color:var(--gold-light);font-weight:600;letter-spacing:0.04em">Attendance</span>
                <span style="font-family:'Space Mono',monospace;font-size:0.72rem;color:var(--gold-light);font-weight:700">{{ attendanceParticipants.filter(p=>p.attendance).length }}/{{ attendanceParticipants.length }}</span>
              </div>
              <div class="slot-bar-wrap" style="height:8px;background:rgba(255,255,255,0.12)">
                <div class="slot-bar-fill" :style="{ width: (attendanceParticipants.length > 0 ? Math.round((attendanceParticipants.filter(p=>p.attendance).length / attendanceParticipants.length) * 100) : 0) + '%', background: 'var(--gold)' }"></div>
              </div>
            </div>
          </div>
        </div>

        <div v-if="!attendanceParticipants.length" class="empty-state">
          <svg viewBox="0 0 24 24"><polyline points="9 11 12 14 22 4"/></svg>
          <p>No participants to mark attendance for.</p>
        </div>

        <div class="ts-table-wrap">
          <table class="ts-table" v-if="attendanceParticipants.length">
            <thead>
              <tr>
                <th>Trekker ID</th>
                <th>Name</th>
                <th>Contact Number</th>
                <th>Attendance</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(p, i) in attendanceParticipants" :key="p.id">
                <td><span class="trekker-id-badge">{{ displayTrekkerId(p) }}</span></td>
                <td>
                  <div class="user-cell">
                    <div class="user-mini-avatar">{{ p.name[0] }}</div>
                    <span class="cell-name">{{ p.name }}</span>
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
                  <div class="attendance-choice-group">
                    <button class="att-choice-btn present" :class="{ active: p.attendance }" @click="setAttendance(p, true)">Present</button>
                    <button class="att-choice-btn absent" :class="{ active: !p.attendance }" @click="setAttendance(p, false)">Absent</button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- ════════════════════════════════════════════
           EXPORTS TAB
      ════════════════════════════════════════════ -->
      <div v-if="activeTab === 'exports'" class="tab-content">
        <div class="page-header">
          <div>
            <div class="section-eyebrow">Data Export</div>
            <div class="section-title">Export <em>Reports</em></div>
          </div>
          <button class="btn-back-home" @click="goTab('dashboard')"><i class="bi bi-house-door-fill me-1"></i>Back to Home</button>
        </div>
        <div style="display:grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap:1.25rem">
          <div v-for="t in assignedTreks" :key="t.id" class="ts-card">
            <div class="ts-card-header">
              <div>
                <div class="ts-card-title">{{ t.name }}</div>
                <div class="ts-card-sub">{{ t.location }} · {{ participants.filter(p=>p.trekId===t.id).length }} participants</div>
              </div>
              <span :class="'status-pill status-' + t.status.toLowerCase()">{{ t.status }}</span>
            </div>
            <div class="ts-card-body">
              <div style="font-size:0.78rem; color:var(--stone); margin-bottom:1rem; line-height:1.6">
                Export includes: participant name, email, phone, booking status, booking date, blood group, emergency contact.
              </div>
              <div style="display:flex; justify-content:space-between; gap:0.5rem; margin-top:0.5rem">
                <button class="btn-ghost btn-sm" @click="openExportDetailModal(t)" style="flex:1; text-align:center"><i class="bi bi-eye"></i> View</button>
                <button class="btn-primary-ts btn-sm" @click="openDownloadPromptModal(t)" style="flex:1; text-align:center"><i class="bi bi-download"></i> Download</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- ════════════════════════════════════════════
           PROFILE TAB
      ════════════════════════════════════════════ -->
      <div v-if="activeTab === 'profile'" class="tab-content">
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

      <!-- ════════════════════════════════════════════
           SUPPORT & LEAVES TAB
      ════════════════════════════════════════════ -->
      <div v-if="activeTab === 'support'" class="tab-content">
        <!-- Page Header -->
        <div class="page-header" style="margin-bottom: 1.5rem;">
          <div>
            <div class="section-eyebrow">Helpdesk</div>
            <div class="section-title">Support & <em>Leaves</em></div>
          </div>
          <button class="btn-back-home" @click="goTab('dashboard')"><i class="bi bi-house-door-fill me-1"></i>Back to Home</button>
        </div>

        <div class="row g-4">
          <!-- Left side: Forms -->
          <div class="col-lg-6">
            <!-- Support Ticket Card -->
            <div class="ts-card p-4 mb-4" style="border: 1px solid rgba(26,46,26,0.08); background: #ffffff;">
              <h3 style="font-family:'Playfair Display',serif; font-size: 1.3rem; color: var(--forest); margin-bottom: 1.25rem; border-bottom: 1px solid rgba(26,46,26,0.08); padding-bottom: 0.5rem">
                <i class="bi bi-envelope-paper-fill me-2" style="color: var(--gold)"></i>Raise a Support Ticket
              </h3>
              <form @submit.prevent="submitStaffTicket" style="display: flex; flex-direction: column; gap: 1rem;">
                <div class="form-group">
                  <label style="font-weight: 600; font-size: 0.82rem; margin-bottom: 0.25rem; display: block; color: var(--forest);">Category</label>
                  <select v-model="newTicket.category" class="form-select" style="font-size: 0.85rem; border: 1.5px solid var(--stone) !important; color: var(--bark) !important; background-color: #ffffff !important;">
                    <option value="General">General Inquiry</option>
                    <option value="Bug">Technical Issue / Bug</option>
                    <option value="Feedback">Feedback & Suggestions</option>
                  </select>
                </div>
                <div class="form-group">
                  <label style="font-weight: 600; font-size: 0.82rem; margin-bottom: 0.25rem; display: block; color: var(--forest);">Subject</label>
                  <input v-model="newTicket.subject" type="text" class="form-control" placeholder="What is the issue about?" style="font-size: 0.85rem; border: 1.5px solid var(--stone) !important; color: var(--bark) !important; background-color: #ffffff !important;" required />
                </div>
                <div class="form-group">
                  <label style="font-weight: 600; font-size: 0.82rem; margin-bottom: 0.25rem; display: block; color: var(--forest);">Description / Message</label>
                  <textarea v-model="newTicket.message" class="form-control" rows="4" placeholder="Describe your concern in detail..." style="font-size: 0.85rem; border: 1.5px solid var(--stone) !important; color: var(--bark) !important; background-color: #ffffff !important;" required></textarea>
                </div>
                <button type="submit" class="btn btn-primary-ts w-100" style="padding: 0.6rem; font-weight: 700;" :disabled="submittingSupport">
                  {{ submittingSupport ? 'Submitting...' : 'Submit Ticket' }}
                </button>
              </form>
            </div>

            <!-- Leave Request Card -->
            <div class="ts-card p-4" style="border: 1px solid rgba(26,46,26,0.08); background: #ffffff;">
              <h3 style="font-family:'Playfair Display',serif; font-size: 1.3rem; color: var(--forest); margin-bottom: 1.25rem; border-bottom: 1px solid rgba(26,46,26,0.08); padding-bottom: 0.5rem">
                <i class="bi bi-calendar-plus-fill me-2" style="color: var(--gold)"></i>Request Leave / Time Off
              </h3>
              <form @submit.prevent="submitLeaveRequest" style="display: flex; flex-direction: column; gap: 1rem;">
                <div class="row g-2">
                  <div class="col-md-6">
                    <div class="form-group">
                      <label style="font-weight: 600; font-size: 0.82rem; margin-bottom: 0.25rem; display: block; color: var(--forest);">Start Date</label>
                      <input v-model="leaveRequest.startDate" type="date" class="form-control" style="font-size: 0.85rem; border: 1.5px solid var(--stone) !important; color: var(--bark) !important; background-color: #ffffff !important;" required />
                    </div>
                  </div>
                  <div class="col-md-6">
                    <div class="form-group">
                      <label style="font-weight: 600; font-size: 0.82rem; margin-bottom: 0.25rem; display: block; color: var(--forest);">End Date</label>
                      <input v-model="leaveRequest.endDate" type="date" class="form-control" style="font-size: 0.85rem; border: 1.5px solid var(--stone) !important; color: var(--bark) !important; background-color: #ffffff !important;" required />
                    </div>
                  </div>
                </div>
                <div class="form-group">
                  <label style="font-weight: 600; font-size: 0.82rem; margin-bottom: 0.25rem; display: block; color: var(--forest);">Reason for Leave</label>
                  <textarea v-model="leaveRequest.reason" class="form-control" rows="3" placeholder="Provide reason for leave (medical, personal etc.)..." style="font-size: 0.85rem; border: 1.5px solid var(--stone) !important; color: var(--bark) !important; background-color: #ffffff !important;" required></textarea>
                </div>
                <div class="alert alert-info py-2 px-3 mb-0" style="font-size: 0.76rem; border-left: 3px solid #0dcaf0; color: #31708f; background: #d9edf7; border-color: #bce8f1;">
                  <strong>Note:</strong> Resolved leave requests will automatically mark your calendar as busy/unavailable.
                </div>
                <button type="submit" class="btn btn-primary-ts w-100" style="padding: 0.6rem; background: var(--forest); border-color: var(--forest); color: #ffffff !important; font-weight: 700;" :disabled="submittingLeave">
                  {{ submittingLeave ? 'Submitting...' : 'Request Leave' }}
                </button>
              </form>
            </div>
          </div>

          <!-- Right side: History -->
          <div class="col-lg-6">
            <div class="ts-card p-4 h-100" style="border: 1px solid rgba(26,46,26,0.08); background: #ffffff; display: flex; flex-direction: column;">
              <div class="d-flex justify-content-between align-items-center mb-3 border-bottom pb-2">
                <h3 style="font-family:'Playfair Display',serif; font-size: 1.3rem; color: var(--forest); margin: 0;">
                  <i class="bi bi-clock-history me-2" style="color: var(--gold)"></i>Request History
                </h3>
                <span class="badge bg-forest text-white" style="font-size: 0.75rem; padding: 4px 8px;">
                  {{ supportTickets.length }} requests
                </span>
              </div>

              <!-- List of tickets -->
              <div style="flex: 1; overflow-y: auto; max-height: 520px; padding-right: 4px;">
                <div v-if="!supportTickets.length" class="text-center py-5 text-muted">
                  <i class="bi bi-ticket-detailed fs-2 mb-2 d-block" style="color: var(--stone); opacity: 0.5;"></i>
                  No support tickets or leave requests submitted yet.
                </div>
                <div v-else class="d-flex flex-column gap-3">
                  <div v-for="t in supportTickets" :key="t.id" class="p-3 rounded" style="border: 1px solid var(--stone-light); background: var(--snow);">
                    <div class="d-flex justify-content-between align-items-center mb-2">
                      <span style="font-family: monospace; font-weight: bold; font-size: 0.8rem; color: var(--forest-light);">
                        {{ t.ticketId || ('TS26#' + String(t.id).padStart(3, '0')) }}
                      </span>
                      <div class="d-flex gap-2 align-items-center">
                        <span class="category-tag" :class="getCategoryClass(t.category)" style="font-size: 0.6rem; padding: 1px 6px;">
                          {{ t.category || 'General' }}
                        </span>
                        <span class="status-pill font-bold" :class="t.status === 'Resolved' ? 'status-completed' : 'status-pending'" style="font-size: 0.65rem; padding: 2px 6px; border-radius: 4px;">
                          {{ t.status }}
                        </span>
                      </div>
                    </div>
                    <h5 style="font-weight: 700; color: var(--forest); font-size: 0.9rem; margin-bottom: 0.25rem;">
                      {{ t.cleanSubject || t.subject }}
                    </h5>
                    <p class="text-muted mb-2" style="font-size: 0.8rem; white-space: pre-wrap; line-height: 1.4;">
                      {{ t.message }}
                    </p>
                    <div class="text-muted text-end" style="font-size: 0.68rem;">
                      Submitted on: {{ t.createdAt }}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- ════════════════════════════════════════════
           TRAILSYNC SOCIAL TAB
      ════════════════════════════════════════════ -->
      <div v-if="activeTab === 'social'" class="tab-content social-tab-container" style="display: flex; flex-direction: column; gap: 0; height: calc(100vh - 80px); min-height: 500px;">
        <!-- Social tab header -->
        <div class="page-header" style="flex-shrink: 0; margin-bottom: 1rem;">
          <div>
            <div class="section-eyebrow">Communication</div>
            <div class="section-title">TrailSync <em>Social</em></div>
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
            <div v-for="t in socialGroups" :key="t.id" 
                 :class="['social-channel-item', { active: selectedSocialTrekId === t.id }]"
                 @click="selectSocialGroup(t.id)"
                 style="padding: 0.75rem; border-radius: 6px; cursor: pointer; margin-bottom: 0.5rem; transition: var(--transition);">
              <div class="d-flex justify-content-between align-items-start mb-1">
                <span class="channel-name fw-bold" style="font-size: 0.85rem; color: var(--forest); display: flex; align-items: center; gap: 4px;">
                  <i class="bi bi-hash"></i> {{ t.name }}
                  <i v-if="t.isLocked" class="bi bi-lock-fill text-danger" style="font-size: 0.75rem;" title="Chat is Locked"></i>
                </span>
                <span :class="'status-pill status-' + t.status.toLowerCase()" style="font-size: 0.6rem; padding: 2px 6px;">{{ t.status }}</span>
              </div>
              <div class="channel-sub text-muted d-flex justify-content-between" style="font-size: 0.7rem;">
                <span>Batch {{ t.batchCode }}</span>
                <span>{{ t.memberCount }} members</span>
              </div>
            </div>
            <div v-if="!socialGroups.length" class="text-center py-4 text-muted" style="font-size: 0.8rem;">
              No channels available.
            </div>
          </div>
        </div>

        <!-- Main Chat + Pinned Announcements + Info (right) -->
        <div class="social-chat-panel d-flex" style="flex: 1; gap: 1.5rem; min-width: 0;">
          
          <div v-if="!selectedSocialTrekId" class="ts-card d-flex flex-column align-items-center justify-content-center text-center p-5" style="flex: 1; background: #ffffff; min-height: 400px; border: 1px solid rgba(26,46,26,0.08);">
            <i class="bi bi-chat-left-dots-fill" style="font-size: 3.5rem; color: var(--gold); opacity: 0.6; margin-bottom: 1rem;"></i>
            <h3 style="font-family: 'Playfair Display', serif; font-size: 1.5rem; color: var(--forest); font-weight: 700; margin-bottom: 0.5rem;">Select group to start chat</h3>
            <p class="text-muted" style="max-width: 380px; font-size: 0.9rem; line-height: 1.5;">
              Please select a trekking group from the list on the left to start communicating with participants, view pinned announcements, or publish notifications.
            </p>
          </div>

          <template v-else>
            <!-- Chat area (middle) -->
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
                <!-- Lock group toggle for guide -->
                <div v-if="selectedSocialGroupTrek">
                  <button class="btn btn-sm btn-outline-danger" @click="toggleSocialGroupLock(selectedSocialGroupTrek.id)" style="font-size: 0.72rem; font-weight: 600; padding: 4px 8px; border-radius: 4px; display: flex; align-items: center; gap: 4px;">
                    <i class="bi" :class="selectedSocialGroupTrek.isLocked ? 'bi-unlock-fill' : 'bi-lock-fill'"></i>
                    {{ selectedSocialGroupTrek.isLocked ? 'Unlock Group Chat' : 'Lock Group Chat' }}
                  </button>
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
                <form @submit.prevent="sendSocialMessage" class="d-flex gap-2">
                  <input v-model="newSocialMessageText" type="text" class="form-control" placeholder="Type a message to the group..." style="font-size: 0.85rem; border-radius: 6px;" />
                  <button type="submit" class="btn btn-primary-ts px-4" style="font-size: 0.85rem;">
                    <i class="bi bi-send-fill"></i> Send
                  </button>
                </form>
              </div>
            </div>

            <!-- Sidebar: Announcements + Members (rightmost) -->
            <div class="d-flex flex-column gap-3" style="width: 320px; flex-shrink: 0;">
              
              <!-- Pinned Announcements -->
              <div class="ts-card d-flex flex-column" style="flex: 1; min-height: 0;">
                <div class="ts-card-header bg-gold-subtle">
                  <div class="ts-card-title" style="color: var(--bark); font-weight: 700;">
                    <i class="bi bi-pin-angle-fill text-gold"></i> Pinned Announcements
                  </div>
                </div>
                <div class="ts-card-body" style="padding: 1rem; overflow-y: auto; flex: 1;">
                  
                  <!-- Post new announcement form (Guide only) -->
                  <div class="announcement-form border-bottom pb-3 mb-3">
                    <div class="fw-bold mb-2" style="font-size: 0.75rem; color: var(--forest);">
                      <i class="bi bi-plus-circle"></i> Post Announcement
                    </div>
                    <input v-model="newSocialAnnouncementTitle" type="text" class="form-control form-control-sm mb-2" placeholder="Announcement Title..." style="font-size: 0.75rem;" />
                    <textarea v-model="newSocialAnnouncementText" class="form-control form-control-sm mb-2" rows="2" placeholder="Write content details..." style="font-size: 0.75rem; resize: none;"></textarea>
                    <button type="button" class="btn btn-sm btn-gold w-100" @click="postSocialAnnouncement" style="font-size: 0.72rem; font-weight: 600;">
                      Post & Pin
                    </button>
                  </div>

                  <!-- Announcement items -->
                  <div class="announcements-list d-flex flex-direction-column" style="gap: 0.75rem; display: flex; flex-direction: column;">
                    <div v-for="a in currentGroupAnnouncements" :key="a.id" 
                         class="announcement-item p-2 border-start border-3 border-gold" 
                         style="background: var(--snow); border-radius: 0 4px 4px 0; font-size: 0.75rem;">
                      <div class="d-flex justify-content-between align-items-center mb-1">
                        <span class="fw-bold" style="color: var(--forest);">{{ a.title }}</span>
                        <span class="text-muted" style="font-size: 0.65rem;">{{ a.date }}</span>
                      </div>
                      <div class="text-muted" style="line-height: 1.4;">{{ a.content }}</div>
                    </div>
                    <div v-if="!currentGroupAnnouncements.length" class="text-center py-3 text-muted" style="font-size: 0.72rem;">
                      No announcements posted.
                    </div>
                  </div>
                </div>
              </div>

              <!-- Group Members directory -->
              <div class="ts-card d-flex flex-column" style="flex: 1; min-height: 0;">
                <div class="ts-card-header">
                  <div class="ts-card-title"><i class="bi bi-people"></i> Group Members</div>
                </div>
                <div class="ts-card-body" style="padding: 0.75rem; overflow-y: auto; flex: 1;">
                  <div class="members-directory-list" style="display: flex; flex-direction: column; gap: 0.5rem;">
                    
                    <!-- Guide Item -->
                    <div class="member-dir-item d-flex align-items-center justify-content-between p-2" 
                         style="background: var(--cream); border-radius: 6px;">
                      <div class="d-flex align-items-center gap-2">
                        <div class="member-avatar bg-gold text-dark d-flex align-items-center justify-content-center fw-bold" 
                             style="width: 28px; height: 28px; border-radius: 50%; font-size: 0.75rem;">
                          {{ (staffProfile.name || 'G')[0] }}
                        </div>
                        <div>
                          <div class="fw-bold" style="font-size: 0.78rem; color: var(--forest);">{{ staffProfile.name }}</div>
                          <div class="text-muted" style="font-size: 0.65rem;">Lead Guide (You)</div>
                        </div>
                      </div>
                      <span class="badge bg-gold text-dark" style="font-size: 0.6rem; font-weight: 700;">Guide</span>
                    </div>

                    <!-- Trekker Items -->
                    <div v-for="p in socialGroupMembers" :key="p.id" 
                         class="member-dir-item d-flex align-items-center justify-content-between p-2" 
                         @click="openSocialProfileModal(p)"
                         style="border-radius: 6px; cursor: pointer; transition: var(--transition);">
                      <div class="d-flex align-items-center gap-2">
                        <div class="member-avatar bg-secondary-subtle text-dark d-flex align-items-center justify-content-center fw-bold" 
                             style="width: 28px; height: 28px; border-radius: 50%; font-size: 0.75rem;">
                          {{ p.name[0] }}
                        </div>
                        <div>
                          <div class="fw-bold" style="font-size: 0.78rem; color: var(--forest);">{{ p.name }}</div>
                          <div class="text-muted" style="font-size: 0.65rem;">Trekker</div>
                        </div>
                      </div>
                      <i class="bi bi-chevron-right text-muted" style="font-size: 0.75rem;"></i>
                    </div>
                    
                    <div v-if="!socialGroupMembers.length" class="text-center py-3 text-muted" style="font-size: 0.72rem;">
                      No registered trekkers.
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </template>
        </div>

        </div><!-- /social content row -->

      </div><!-- /social-tab-container -->

    </div><!-- /ts-main -->


    <!-- ════════ MODALS ════════ -->

    <!-- Slot Edit Modal -->
    <div v-if="showSlotModal" class="ts-modal-overlay" @click.self="showSlotModal = false">
      <div class="ts-modal ts-modal-sm">
        <div class="ts-modal-header">
          <h3 class="ts-modal-title">Update Slots</h3>
          <button class="modal-close" @click="showSlotModal = false">✕</button>
        </div>
        <div class="ts-modal-body" v-if="slotTarget">
          <div class="modal-info-row"><span class="modal-info-label">Trek</span><span class="modal-info-val">{{ slotTarget.name }}</span></div>
          <div class="modal-info-row"><span class="modal-info-label">Currently Booked</span><span class="modal-info-val">{{ slotTarget.registered }}</span></div>
          <div class="modal-info-row"><span class="modal-info-label">Available</span><span class="modal-info-val">{{ slotTarget.slots - slotTarget.registered }}</span></div>
          <div class="form-group" style="margin-top:1rem">
            <label>New Total Slots (min: {{ slotTarget.registered }})</label>
            <input v-model.number="newSlots" type="number" :min="slotTarget.registered" style="padding:0.55rem 0.8rem; border:1px solid rgba(26,46,26,0.14); border-radius:4px; font-family:'DM Sans',sans-serif; font-size:0.87rem; outline:none; width:100%" />
          </div>
        </div>
        <div class="ts-modal-footer">
          <button class="btn-ghost" @click="showSlotModal = false">Cancel</button>
          <button class="btn-primary-ts" @click="saveSlots">Update Slots</button>
        </div>
      </div>
    </div>

    <!-- Status Change Modal -->
    <div v-if="showStatusModal" class="ts-modal-overlay" @click.self="showStatusModal = false">
      <div class="ts-modal ts-modal-sm">
        <div class="ts-modal-header">
          <h3 class="ts-modal-title">Change Trek Status</h3>
          <button class="modal-close" @click="showStatusModal = false">✕</button>
        </div>
        <div class="ts-modal-body" v-if="statusTarget">
          <div class="modal-info-row"><span class="modal-info-label">Trek</span><span class="modal-info-val">{{ statusTarget.name }}</span></div>
          <div class="modal-info-row"><span class="modal-info-label">Current</span><span :class="'status-pill status-' + statusTarget.status.toLowerCase()">{{ statusTarget.status }}</span></div>
          <div class="status-options">
            <label v-for="s in ['Pending','Approved','Open','Closed','Started','Completed']" :key="s" class="status-radio">
              <input type="radio" :value="s" v-model="newStatus" />
              <span :class="'status-pill status-' + s.toLowerCase()">{{ s }}</span>
            </label>
          </div>
        </div>
        <div class="ts-modal-footer">
          <button class="btn-ghost" @click="showStatusModal = false">Cancel</button>
          <button class="btn-primary-ts" @click="saveStatus">Apply</button>
        </div>
      </div>
    </div>

    <!-- Participant Detail Modal -->
    <div v-if="showParticipantModal && participantTarget" class="ts-modal-overlay" @click.self="showParticipantModal = false">
      <div class="ts-modal">
        <div class="ts-modal-header">
          <h3 class="ts-modal-title">Trekker Profile</h3>
          <button class="modal-close" @click="showParticipantModal = false">✕</button>
        </div>
        <div class="ts-modal-body">
          <!-- Avatar + Name -->
          <div class="pmodal-hero">
            <div class="pmodal-avatar">{{ participantTarget.name[0] }}</div>
            <div>
              <div class="pmodal-name">{{ participantTarget.name }}</div>
              <div class="pmodal-email">{{ participantTarget.email }}</div>
              <div class="pmodal-trekker-id">Trekker ID {{ displayTrekkerId(participantTarget) }}</div>
              <div style="margin-top:4px;display:flex;gap:6px;align-items:center">
                <span :class="'status-pill status-' + participantTarget.status.toLowerCase()">{{ participantTarget.status }}</span>
                <span :class="paymentStatusClass(participantTarget)">{{ paymentStatusLabel(participantTarget) }}</span>
              </div>
            </div>
          </div>
          <!-- Info grid -->
          <div class="pmodal-grid">
            <div class="pmodal-field">
              <div class="pmodal-field-label">Trekker ID</div>
              <div class="pmodal-field-val mono">{{ displayTrekkerId(participantTarget) }}</div>
            </div>
            <div class="pmodal-field">
              <div class="pmodal-field-label">Phone</div>
              <div class="pmodal-field-val">{{ participantTarget.phone || '—' }}</div>
            </div>
            <div class="pmodal-field">
              <div class="pmodal-field-label">Booked On</div>
              <div class="pmodal-field-val">{{ participantTarget.bookedOn }}</div>
            </div>
            <div class="pmodal-field">
              <div class="pmodal-field-label">Blood Group</div>
              <div class="pmodal-field-val" style="color:#dc2626;font-weight:700">{{ participantTarget.bloodGroup || '—' }}</div>
            </div>
            <div class="pmodal-field">
              <div class="pmodal-field-label">Attendance</div>
              <div class="pmodal-field-val">{{ participantTarget.attendance ? '✓ Present' : 'Not marked' }}</div>
            </div>
            <div class="pmodal-field">
              <div class="pmodal-field-label">Payment</div>
              <div class="pmodal-field-val">
                <span :class="paymentStatusClass(participantTarget)">{{ paymentStatusLabel(participantTarget) }}</span>
              </div>
            </div>
          </div>
          <!-- Emergency box -->
          <div class="pmodal-emergency">
            <div class="pmodal-emergency-title">🚑 Emergency Contact</div>
            <div class="pmodal-grid" style="margin-top:0.5rem">
              <div class="pmodal-field"><div class="pmodal-field-label">Name</div><div class="pmodal-field-val">{{ participantTarget.emergencyContact || '—' }}</div></div>
              <div class="pmodal-field"><div class="pmodal-field-label">Phone</div><div class="pmodal-field-val">{{ participantTarget.emergencyPhone || '—' }}</div></div>
            </div>
          </div>
        </div>
        <div class="ts-modal-footer">
          <button class="btn-ghost" @click="showParticipantModal = false">Close</button>
          <button v-if="participantTarget.status==='Booked'" class="btn-danger" @click="cancelParticipant(participantTarget); showParticipantModal = false">Remove</button>
          <button v-if="participantTarget.status==='Booked'" class="btn-primary-ts" @click="markParticipantComplete(participantTarget); showParticipantModal = false">Mark Completed</button>
        </div>
      </div>
    </div>

    <!-- Emergency Contacts Modal -->
    <div v-if="showEmergencyModal && participantTarget" class="ts-modal-overlay" @click.self="showEmergencyModal = false">
      <div class="ts-modal ts-modal-sm">
        <div class="ts-modal-header">
          <h3 class="ts-modal-title">🚑 Emergency Info</h3>
          <button class="modal-close" @click="showEmergencyModal = false">✕</button>
        </div>
        <div class="ts-modal-body">
          <div style="font-weight:600; color:var(--forest); margin-bottom:1rem">{{ participantTarget.name }}</div>
          <div class="emergency-row">
            <span class="emergency-icon">🏥</span>
            <div>
              <div class="ec-name">{{ participantTarget.emergencyContact }}</div>
              <div class="ec-phone">{{ participantTarget.emergencyPhone }}</div>
            </div>
            <span class="ec-blood">{{ participantTarget.bloodGroup }}</span>
          </div>
          <div style="font-size:0.78rem; color:var(--stone); margin-top:0.75rem; padding:0.65rem; background:rgba(239,68,68,0.04); border-radius:4px">
            In case of emergency, contact the above number. Blood type {{ participantTarget.bloodGroup }} noted.
          </div>
        </div>
        <div class="ts-modal-footer">
          <button class="btn-primary-ts" @click="showEmergencyModal = false">Close</button>
        </div>
      </div>
    </div>

    <!-- Checklist Modal -->
    <div v-if="showChecklistModal" class="ts-modal-overlay" @click.self="showChecklistModal = false">
      <div class="ts-modal ts-modal-lg">
        <div class="ts-modal-header">
          <h3 class="ts-modal-title"><i class="bi bi-list-check"></i> Gear Checklist — {{ checklistTrek?.name }}</h3>
          <button class="modal-close" @click="showChecklistModal = false">✕</button>
        </div>
        <div class="ts-modal-body">
          <p style="font-size:0.83rem; color:var(--stone); margin-bottom:1rem; line-height:1.5">
            Manage the recommended gear list for participants. Changes sync to all active bookings.
          </p>
          <div style="display:flex; gap:0.5rem; margin-bottom:1rem">
            <input v-model="newChecklistItem" @keyup.enter="addChecklistItem" type="text" placeholder="Add item (e.g. Thermal flask)…" style="flex:1; padding:0.55rem 0.85rem; border:1px solid rgba(26,46,26,0.14); border-radius:4px; font-family:'DM Sans',sans-serif; font-size:0.87rem; outline:none" />
            <button class="btn-primary-ts btn-sm" @click="addChecklistItem">+ Add</button>
          </div>
          <div style="max-height:260px; overflow-y:auto; border:1px solid rgba(26,46,26,0.08); border-radius:4px; padding:0.5rem">
            <div v-if="!checklistItems.length" style="text-align:center; padding:1.5rem; color:var(--stone); font-size:0.85rem">No items yet.</div>
            <div v-for="(item, idx) in checklistItems" :key="idx"
              style="display:flex; justify-content:space-between; align-items:center; padding:0.45rem 0.75rem; border-bottom:1px solid rgba(26,46,26,0.05)">
              <span style="font-size:0.85rem">{{ idx + 1 }}. {{ item }}</span>
              <button @click="removeChecklistItem(idx)" style="color:#ef4444; border:none; background:none; cursor:pointer; font-size:0.82rem; padding:2px 6px">✕</button>
            </div>
          </div>
        </div>
        <div class="ts-modal-footer">
          <button class="btn-ghost" @click="showChecklistModal = false">Cancel</button>
          <button class="btn-primary-ts" @click="saveChecklist">Save &amp; Sync</button>
        </div>
      </div>
    </div>

    <!-- Trek Detail Modal -->
    <div v-if="showTrekDetailModal && detailTrek" class="ts-modal-overlay" @click.self="showTrekDetailModal = false">
      <div class="ts-modal ts-modal-lg">
        <div class="ts-modal-header">
          <h3 class="ts-modal-title">Trek Details</h3>
          <button class="modal-close" @click="showTrekDetailModal = false">✕</button>
        </div>
        <div class="ts-modal-body">
          <!-- Trek name & status -->
          <div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:1.25rem;flex-wrap:wrap;gap:0.75rem">
            <div>
              <div style="font-family:'Playfair Display',serif;font-size:1.4rem;font-weight:800;color:var(--forest);line-height:1.2">{{ detailTrek.name }}</div>
              <div style="font-size:0.82rem;color:var(--stone);margin-top:4px;display:flex;align-items:center;gap:6px">
                <svg viewBox="0 0 24 24" style="width:13px;height:13px;stroke:var(--gold);fill:none;stroke-width:2"><path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                {{ detailTrek.location }}
              </div>
            </div>
            <div style="display:flex;gap:0.5rem;flex-wrap:wrap;align-items:center">
              <span :class="'diff-pill pill-' + detailTrek.difficulty.toLowerCase()">{{ detailTrek.difficulty }}</span>
              <span :class="'status-pill status-' + detailTrek.status.toLowerCase()">{{ detailTrek.status }}</span>
            </div>
          </div>

          <!-- Key details grid -->
          <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:0.85rem;margin-bottom:1.25rem">

            <!-- Trek ID / Batch -->
            <div class="trek-detail-stat">
              <div class="trek-detail-stat-icon">
                <svg viewBox="0 0 24 24"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/><line x1="12" y1="12" x2="12" y2="16"/><line x1="10" y1="14" x2="14" y2="14"/></svg>
              </div>
              <div class="trek-detail-stat-label">Trek ID</div>
              <div class="trek-detail-stat-val">#{{ detailTrek.id }}</div>
            </div>

            <!-- Start Date -->
            <div class="trek-detail-stat">
              <div class="trek-detail-stat-icon">
                <svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><line x1="8" y1="14" x2="8" y2="14"/></svg>
              </div>
              <div class="trek-detail-stat-label">Start Date</div>
              <div class="trek-detail-stat-val">{{ formatDate(detailTrek.startDate) }}</div>
            </div>

            <!-- End Date -->
            <div class="trek-detail-stat">
              <div class="trek-detail-stat-icon">
                <svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><polyline points="9 16 11 18 15 14"/></svg>
              </div>
              <div class="trek-detail-stat-label">End Date</div>
              <div class="trek-detail-stat-val">{{ formatDate(detailTrek.endDate) }}</div>
            </div>

            <!-- Duration -->
            <div class="trek-detail-stat">
              <div class="trek-detail-stat-icon">
                <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              </div>
              <div class="trek-detail-stat-label">Duration</div>
              <div class="trek-detail-stat-val">{{ detailTrek.duration }} Days</div>
            </div>

            <!-- Registered -->
            <div class="trek-detail-stat">
              <div class="trek-detail-stat-icon">
                <svg viewBox="0 0 24 24"><circle cx="9" cy="8" r="3"/><path d="M2 19c0-3 3-5 7-5"/><circle cx="16" cy="10" r="3"/><path d="M13 19c0-3 2.7-5 6-5"/></svg>
              </div>
              <div class="trek-detail-stat-label">Registered</div>
              <div class="trek-detail-stat-val">{{ detailTrek.registered }} / {{ detailTrek.slots }}</div>
            </div>

            <!-- Slots Left -->
            <div class="trek-detail-stat">
              <div class="trek-detail-stat-icon">
                <svg viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/><path d="M9 21V9"/></svg>
              </div>
              <div class="trek-detail-stat-label">Slots Left</div>
              <div class="trek-detail-stat-val">{{ slotsLeft(detailTrek) }}</div>
            </div>

            <!-- Occupancy -->
            <div class="trek-detail-stat">
              <div class="trek-detail-stat-icon">
                <svg viewBox="0 0 24 24"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
              </div>
              <div class="trek-detail-stat-label">Occupancy</div>
              <div class="trek-detail-stat-val">{{ slotPct(detailTrek) }}%</div>
            </div>

          </div>

          <!-- Slot fill bar -->
          <div style="margin-bottom:1.25rem">
            <div style="display:flex;justify-content:space-between;font-size:0.75rem;color:var(--stone);margin-bottom:5px">
              <span>Slot Occupancy</span>
              <span>{{ detailTrek.registered }}/{{ detailTrek.slots }} filled</span>
            </div>
            <div class="slot-bar-wrap" style="height:10px">
              <div class="slot-bar-fill" :style="{ width: slotPct(detailTrek) + '%', background: slotColor(detailTrek) }"></div>
            </div>
          </div>



          <!-- Description -->
          <div v-if="detailTrek.description" style="background:var(--cream);border-radius:6px;padding:0.85rem 1rem;font-size:0.83rem;color:var(--bark);line-height:1.6">
            <div style="font-size:0.68rem;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:var(--stone);margin-bottom:0.4rem">About this trek</div>
            {{ detailTrek.description }}
          </div>
        </div>
        <div class="ts-modal-footer">
          <button class="btn-ghost" @click="showTrekDetailModal = false">Close</button>
          <button class="btn-primary-ts" @click="selectTrekForParticipants(detailTrek, { inline: activeTab === 'treks' }); showTrekDetailModal = false">
            <svg viewBox="0 0 24 24" style="width:14px;height:14px"><circle cx="9" cy="8" r="3"/><path d="M2 19c0-3 3-5 7-5"/><circle cx="16" cy="10" r="3"/><path d="M13 19c0-3 2.7-5 6-5"/></svg>
            Manage Participants
          </button>
        </div>
      </div>
    </div>

    <!-- Add Participant Modal -->
    <div v-if="showAddParticipantModal" class="ts-modal-overlay" @click.self="showAddParticipantModal = false">
      <div class="ts-modal ts-modal-sm">
        <div class="ts-modal-header">
          <h3 class="ts-modal-title">Add Participant</h3>
          <button class="modal-close" @click="showAddParticipantModal = false">✕</button>
        </div>
        <div class="ts-modal-body">
          <div style="background:linear-gradient(120deg,var(--forest),var(--forest-mid));border-radius:8px;padding:0.85rem 1rem;margin-bottom:1.25rem;">
            <div style="font-family:'Space Mono',monospace;font-size:0.6rem;font-weight:700;color:var(--gold);letter-spacing:0.12em;text-transform:uppercase;margin-bottom:4px">
              {{ assignedTreks.find(t => t.id === newParticipantTrekId)?.batchCode || '—' }}
            </div>
            <div style="font-family:'Playfair Display',serif;font-size:0.95rem;font-weight:700;color:#fff">
              {{ assignedTreks.find(t => t.id === newParticipantTrekId)?.name || '—' }}
            </div>
          </div>
          <div class="add-p-form">
            <div class="form-group">
              <label>Full Name <span style="color:#ef4444">*</span></label>
              <input v-model="newParticipantName" type="text" placeholder="e.g. Rahul Sharma" />
            </div>
            <div class="form-group">
              <label>Email Address <span style="color:#ef4444">*</span></label>
              <input v-model="newParticipantEmail" type="email" placeholder="e.g. rahul@example.com" />
            </div>
            <div class="form-group">
              <label>Contact Number</label>
              <input v-model="newParticipantPhone" type="tel" placeholder="e.g. +91 98765 43210" />
            </div>
            <div class="form-group">
              <label>Payment Status</label>
              <div class="pay-toggle-row">
                <button :class="['pay-toggle-btn', newParticipantPayment === 'paid' ? 'active-paid' : '']" @click="newParticipantPayment = 'paid'">✓ Paid</button>
                <button :class="['pay-toggle-btn', newParticipantPayment === 'pending' ? 'active-pending' : '']" @click="newParticipantPayment = 'pending'">⏳ Pending</button>
              </div>
            </div>
          </div>
        </div>
        <div class="ts-modal-footer">
          <button class="btn-ghost" @click="showAddParticipantModal = false">Cancel</button>
          <button class="btn-primary-ts" @click="addParticipant">
            <svg viewBox="0 0 24 24" style="width:14px;height:14px;stroke:currentColor;fill:none;stroke-width:2;margin-right:4px;vertical-align:middle"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg>
            Add to Trek
          </button>
        </div>
      </div>
    </div>

    <!-- Trek Completion Modal -->
    <div v-if="showCompletionModal && completionTrek" class="ts-modal-overlay" @click.self="showCompletionModal = false">
      <div class="ts-modal ts-modal-sm">
        <div class="ts-modal-header">
          <h3 class="ts-modal-title">Mark Trek Complete</h3>
          <button class="modal-close" @click="showCompletionModal = false">✕</button>
        </div>
        <div class="ts-modal-body">
          <div style="text-align:center; padding:1rem 0">
            <div style="font-size:2.5rem; margin-bottom:0.75rem">🏆</div>
            <div style="font-family:'Playfair Display',serif; font-size:1.2rem; font-weight:700; color:var(--forest); margin-bottom:0.5rem">{{ completionTrek.name }}</div>
            <div style="font-size:0.85rem; color:var(--stone); line-height:1.6">
              This will mark the trek as <strong>Completed</strong> and update the status of all active participants to Completed.
            </div>
          </div>
        </div>
        <div class="ts-modal-footer">
          <button class="btn-ghost" @click="showCompletionModal = false">Cancel</button>
          <button class="btn-primary-ts" @click="confirmCompletion">✓ Confirm Completion</button>
        </div>
      </div>
    </div>

    <!-- ── BATCH EXPORT DETAIL MODAL ────────────────── -->
    <transition name="toast">
      <div v-if="showExportDetailModal" class="ts-modal-overlay" @click.self="showExportDetailModal = false">
        <div class="ts-modal" style="max-width: 800px; width: 95%;">
          <div class="ts-modal-header">
            <span class="ts-modal-title"><i class="bi bi-bar-chart-fill"></i> Batch Detailed Overview</span>
            <button class="modal-close" @click="showExportDetailModal = false">✕</button>
          </div>
          <div class="ts-modal-body" v-if="exportDetailTrek" style="padding: 1.5rem; max-height: 70vh; overflow-y: auto;">
            
            <!-- Trek Summary Header -->
            <div style="background: var(--snow); border: 1px solid rgba(26,46,26,0.08); padding: 1.25rem; border-radius: var(--radius); margin-bottom: 1.5rem; display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 10px;">
              <div>
                <span class="mono" style="background: rgba(200,146,42,0.13); color: var(--forest); font-size: 0.68rem; font-weight: 700; padding: 2px 8px; border-radius: 999px; text-transform: uppercase; letter-spacing: 0.05em; display: inline-block; margin-bottom: 4px;">{{ exportDetailTrek.batchCode }}</span>
                <h4 style="font-family: 'Playfair Display', serif; font-size: 1.3rem; font-weight: 800; color: var(--forest); margin: 0;">{{ exportDetailTrek.name }}</h4>
                <div style="font-size: 0.82rem; color: var(--stone); margin-top: 4px;"><i class="bi bi-geo-alt-fill"></i> {{ exportDetailTrek.location }}</div>
              </div>
              <div style="text-align: right;">
                <span :class="'status-pill status-' + exportDetailTrek.status.toLowerCase()">{{ exportDetailTrek.status }}</span>
                <div style="font-size: 0.8rem; color: var(--bark); font-weight: 600; margin-top: 6px;">{{ formatDate(exportDetailTrek.startDate) }} — {{ formatDate(exportDetailTrek.endDate) }}</div>
              </div>
            </div>

            <!-- Key Metrics Grid -->
            <div class="career-stat-grid" style="margin-bottom: 1.5rem; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));">
              <div class="career-stat">
                <span>{{ exportDetailTrek.registered }}/{{ exportDetailTrek.slots }}</span>
                <small>Occupancy</small>
              </div>
              <div class="career-stat">
                <span>{{ exportDetailTrek.registered > 0 ? Math.round((exportDetailTrek.registered / exportDetailTrek.slots) * 100) : 0 }}%</span>
                <small>Fill Rate</small>
              </div>
              <div class="career-stat">
                <span>{{ slotsLeft(exportDetailTrek) }}</span>
                <small>Slots Remaining</small>
              </div>
              <div class="career-stat">
                <span>₹{{ exportDetailTrek.price ? exportDetailTrek.price.toLocaleString() : '5,000' }}</span>
                <small>Base price</small>
              </div>
            </div>

            <!-- Participants List Table -->
            <h5 style="font-family: 'Playfair Display', serif; font-size: 1.05rem; font-weight: 700; color: var(--forest); margin-bottom: 0.85rem; border-bottom: 1px solid rgba(26,46,26,0.1); padding-bottom: 6px;">Registered Trekkers</h5>
            <div class="ts-table-wrap">
              <table class="ts-table">
                <thead>
                  <tr>
                    <th>Trekker ID</th>
                    <th>Name</th>
                    <th>Contact Info</th>
                    <th>Blood Group</th>
                    <th>Emergency Contact</th>
                    <th>Payment</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="p in participants.filter(p=>p.trekId===exportDetailTrek.id)" :key="p.id">
                    <td class="mono font-bold">{{ displayTrekkerId(p) }}</td>
                    <td>
                      <div class="user-cell">
                        <div class="user-mini-avatar">{{ p.name[0] }}</div>
                        <span class="cell-name">{{ p.name }}</span>
                      </div>
                    </td>
                    <td>
                      <div>📧 {{ p.email }}</div>
                      <div style="font-size:0.75rem; color:var(--stone); margin-top:2px;">📞 {{ p.phone || '—' }}</div>
                    </td>
                    <td class="mono font-bold" style="color: #ef4444;">{{ p.bloodGroup || '—' }}</td>
                    <td style="font-size:0.78rem;">
                      <div>{{ p.emergencyContactName || '—' }}</div>
                      <div style="color:var(--stone); margin-top:1px;">{{ p.emergencyContactPhone || '' }}</div>
                    </td>
                    <td>
                      <span :class="'status-pill pay-' + (p.paymentStatus || 'paid').toLowerCase()" style="font-size: 0.65rem; padding: 2px 6px;">{{ p.paymentStatus || 'Paid' }}</span>
                    </td>
                  </tr>
                  <tr v-if="!participants.filter(p=>p.trekId===exportDetailTrek.id).length">
                    <td colspan="6" style="text-align: center; color: var(--stone); font-style: italic; padding: 1.5rem;">No participants registered for this batch.</td>
                  </tr>
                </tbody>
              </table>
            </div>

          </div>
          <div class="ts-modal-footer">
            <button class="btn-ghost" @click="showExportDetailModal = false">Close</button>
            <button class="btn-primary-ts" @click="openDownloadPromptModal(exportDetailTrek)">Download Report</button>
          </div>
        </div>
      </div>
    </transition>

    <!-- ── DOWNLOAD REPORT PROMPT MODAL ────────────────── -->
    <transition name="toast">
      <div v-if="showDownloadPromptModal" class="ts-modal-overlay" @click.self="showDownloadPromptModal = false">
        <div class="ts-modal" style="max-width: 420px; width: 90%;">
          <div class="ts-modal-header">
            <span class="ts-modal-title"><i class="bi bi-file-earmark-arrow-down"></i> Export Document Report</span>
            <button class="modal-close" @click="showDownloadPromptModal = false">✕</button>
          </div>
          <div class="ts-modal-body" v-if="downloadPromptTrek" style="padding: 1.5rem; text-align: center;">
            <div style="margin-bottom: 0.85rem;"><i class="bi bi-file-earmark-pdf" style="font-size: 2.5rem; color: var(--gold);"></i></div>
            <h5 style="font-family: 'Playfair Display', serif; font-weight: 800; color: var(--forest); margin-bottom: 6px;">Download PDF Report</h5>
            <div style="font-size: 0.8rem; color: var(--stone); margin-bottom: 1.5rem; line-height: 1.5;">
              Select the type of report you want to export as a formatted PDF for <strong style="color: var(--forest);">{{ downloadPromptTrek.name }} ({{ downloadPromptTrek.batchCode }})</strong>.
            </div>

            <!-- Loading spinner -->
            <div v-if="downloadPending" class="d-flex flex-column align-items-center" style="margin-bottom: 1rem;">
              <div class="pay-sim-spinner" style="margin-bottom: 10px;"></div>
              <div style="font-size: 0.8rem; color: var(--stone); font-weight: 600;">Generating your PDF document...</div>
            </div>

            <!-- Options -->
            <div v-else style="display: flex; flex-direction: column; gap: 10px;">
              <button class="btn-primary-ts d-flex justify-content-between align-items-center" @click="generatePDFReport(downloadPromptTrek, 'list')" style="padding: 12px; font-size: 0.85rem; text-align: left; font-weight: 700; width: 100%;">
                <span><i class="bi bi-people-fill"></i> Participants List Only</span>
                <span style="font-size: 0.7rem; background: rgba(255,255,255,0.2); padding: 2px 6px; border-radius: 4px;">PDF</span>
              </button>
              <button class="btn-forest d-flex justify-content-between align-items-center" @click="generatePDFReport(downloadPromptTrek, 'full')" style="padding: 12px; font-size: 0.85rem; text-align: left; font-weight: 700; background: var(--forest); border: none; color: white; width: 100%;">
                <span><i class="bi bi-file-earmark-bar-graph"></i> Full Detailed Information</span>
                <span style="font-size: 0.7rem; background: rgba(255,255,255,0.2); padding: 2px 6px; border-radius: 4px;">PDF</span>
              </button>
            </div>
          </div>
          <div class="ts-modal-footer" v-if="!downloadPending">
            <button class="btn-modal-cancel" @click="showDownloadPromptModal = false" style="font-weight: 600;">Cancel</button>
          </div>
        </div>
      </div>
    </transition>

    <!-- Toast -->
    <transition name="toast">
      <div v-if="toast.show" class="ts-toast">
        <svg viewBox="0 0 24 24">
          <path v-if="toast.type==='success'" d="M20 6L9 17l-5-5"/>
          <circle v-else-if="toast.type==='error'" cx="12" cy="12" r="10"/>
          <circle v-else cx="12" cy="12" r="10"/>
        </svg>
        {{ toast.msg }}
      </div>
    </transition>

    <!-- Social Profile Detail Modal -->
    <div v-if="showSocialProfileModal && socialProfileTarget" class="ts-modal-overlay" @click.self="showSocialProfileModal = false">
      <div class="ts-modal" style="max-width: 460px; width: 90%;">
        <div class="ts-modal-header">
          <h3 class="ts-modal-title">Trekker Profile (Social)</h3>
          <button class="modal-close" @click="showSocialProfileModal = false">✕</button>
        </div>
        <div class="ts-modal-body">
          <div class="pmodal-hero">
            <div class="pmodal-avatar">{{ socialProfileTarget.name[0] }}</div>
            <div>
              <div class="pmodal-name">{{ socialProfileTarget.name }}</div>
              <div class="pmodal-email">{{ socialProfileTarget.email }}</div>
              <div class="pmodal-trekker-id">Trekker ID {{ displayTrekkerId(socialProfileTarget) }}</div>
              <div style="margin-top:4px;">
                <span :class="'status-pill status-' + socialProfileTarget.status.toLowerCase()">{{ socialProfileTarget.status }}</span>
              </div>
            </div>
          </div>
          <div class="pmodal-grid mt-3">
            <div class="pmodal-field">
              <div class="pmodal-field-label">Phone</div>
              <div class="pmodal-field-val">{{ socialProfileTarget.phone || '—' }}</div>
            </div>
            <div class="pmodal-field">
              <div class="pmodal-field-label">Blood Group</div>
              <div class="pmodal-field-val" style="color:#dc2626;font-weight:700">{{ socialProfileTarget.bloodGroup || '—' }}</div>
            </div>
          </div>
          <div class="pmodal-emergency mt-3">
            <div class="pmodal-emergency-title fw-bold" style="font-size: 0.82rem; color: var(--forest);"><i class="bi bi-exclamation-triangle-fill text-danger"></i> Emergency Contact</div>
            <div class="pmodal-grid mt-2">
              <div class="pmodal-field"><div class="pmodal-field-label">Name</div><div class="pmodal-field-val">{{ socialProfileTarget.emergencyContact || '—' }}</div></div>
              <div class="pmodal-field"><div class="pmodal-field-label">Phone</div><div class="pmodal-field-val">{{ socialProfileTarget.emergencyPhone || '—' }}</div></div>
            </div>
          </div>
        </div>
        <div class="ts-modal-footer">
          <button class="btn-ghost" @click="showSocialProfileModal = false">Close</button>
        </div>
      </div>
    </div>

  </div>
  `
};
