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
      toast: { show: false, msg: '', type: 'success' },

      // ── DATA ──────────────────────────────────────
      staffName: STAFF_INITIAL_NAME,
      staffProfile: { ...STAFF_PROFILE_INITIAL },
      assignedTreks: JSON.parse(JSON.stringify(STAFF_ASSIGNED_TREKS)),
      participants: JSON.parse(JSON.stringify(STAFF_PARTICIPANTS)),
      activityLog: JSON.parse(JSON.stringify(STAFF_ACTIVITY_LOG)),
      notifications: JSON.parse(JSON.stringify(STAFF_NOTIFICATIONS)),
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

    // Treks for today's priorities
    todayPriorities() {
      const priorities = [];
      this.assignedTreks.forEach(t => {
        const daysUntil = Math.ceil((new Date(t.startDate) - new Date()) / 86400000);
        if (daysUntil >= 0 && daysUntil <= 7) {
          priorities.push({
            type: 'warning',
            text: `<strong>${t.name}</strong> starts in ${daysUntil} day${daysUntil !== 1 ? 's' : ''}`,
            time: t.startDate,
            actionType: 'attendance',
            trekId: t.id
          });
        }
        const slotsLeft = t.slots - t.registered;
        if (slotsLeft === 0) {
          priorities.push({
            type: 'critical',
            text: `<strong>${t.name}</strong> is fully booked — consider adding slots`,
            time: 'Action needed',
            actionType: 'slots',
            trekId: t.id
          });
        } else if (slotsLeft <= 2) {
          priorities.push({
            type: 'warning',
            text: `Only <strong>${slotsLeft} slot${slotsLeft !== 1 ? 's' : ''} left</strong> for ${t.name}`,
            time: 'Monitor closely',
            actionType: 'slots',
            trekId: t.id
          });
        }
        if (t.status === 'Pending') {
          priorities.push({
            type: 'info',
            text: `<strong>${t.name}</strong> awaiting status update from admin`,
            time: 'Pending',
            actionType: 'status',
            trekId: t.id
          });
        }
      });
      const pendingParticipants = this.participants.filter(p => p.status === 'Booked' && !p.attendance).length;
      if (pendingParticipants > 0) {
        priorities.push({
          type: 'info',
          text: `<strong>${pendingParticipants} participant${pendingParticipants !== 1 ? 's' : ''}</strong> without confirmed attendance`,
          time: 'Mark attendance',
          actionType: 'attendance',
          trekId: this.assignedTreks[0]?.id || null
        });
      }
      return priorities.slice(0, 6);
    },

    // Upcoming timeline (sorted)
    upcomingTimeline() {
      return [...this.assignedTreks].sort((a, b) => new Date(a.startDate) - new Date(b.startDate));
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

    // Unread notification count
    unreadCount() {
      return this.notifications.filter(n => n.unread).length;
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
      return { treksManaged: this.assignedTreks.length + 12, participantsManaged: this.participants.length + 380, occupancy, completionRate };
    },

    monthlyRegistrations() {
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const now = new Date();
      const last6 = [];
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const yLabel = d.getFullYear();
        const mIdx = d.getMonth();
        const mKey = `${yLabel}-${String(mIdx + 1).padStart(2, '0')}`;
        const mLabel = months[mIdx];
        
        let count = 0;
        this.participants.forEach(p => {
          if (p.bookedOn && p.bookedOn.startsWith(mKey)) {
            count++;
          }
        });
        
        last6.push({ month: mLabel, count: count });
      }
      return last6;
    },

    maxMonthlyRegistrations() {
      const vals = this.monthlyRegistrations.map(m => m.count);
      return vals.length ? Math.max(...vals, 1) : 1;
    },

    occupancyBreakdown() {
      return this.assignedTreks.map(t => ({
        id: t.id,
        name: t.name,
        pct: t.slots > 0 ? Math.min(100, Math.round((t.registered / t.slots) * 100)) : 0,
        booked: t.registered,
        total: t.slots
      }));
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
  },

  methods: {
    // ── NAV ────────────────────────────────────────
    goTab(tab, options = {}) {
      const validTabs = ['dashboard', 'treks', 'participants', 'analytics', 'notifications', 'exports', 'performance', 'profile'];
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
      } else {
        const validTabs = ['dashboard', 'treks', 'participants', 'analytics', 'notifications', 'exports', 'performance', 'profile'];
        if (validTabs.includes(hash)) {
          this.activeTab = hash;
          this.participantsInTreksTab = false;
          this.attendanceInTreksTab = false;
          this.participantTrekId = null;
          this.selectedTrekId = null;
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

    // ── NOTIFICATIONS ─────────────────────────────
    markAllRead() {
      this.notifications.forEach(n => { n.unread = false; });
      this.showToast('All notifications marked as read');
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

    // ── CHART (Chart.js) ──────────────────────────
    initCharts() {
      this.$nextTick(() => {
        if (typeof Chart === 'undefined') return;

        // Registrations bar chart
        const barCtx = document.getElementById('registrationsChart');
        if (barCtx && !barCtx._chart) {
          barCtx._chart = new Chart(barCtx, {
            type: 'bar',
            data: {
              labels: this.assignedTreks.map(t => t.name),
              datasets: [{
                label: 'Registered', backgroundColor: 'rgba(200,146,42,0.7)', borderColor: '#c8922a', borderWidth: 1,
                data: this.assignedTreks.map(t => t.registered)
              }, {
                label: 'Total Slots', backgroundColor: 'rgba(26,46,26,0.12)', borderColor: '#2d4a2d', borderWidth: 1,
                data: this.assignedTreks.map(t => t.slots)
              }]
            },
            options: { responsive: true, plugins: { legend: { position: 'bottom' } }, scales: { y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.05)' } } } }
          });
        }

        // Difficulty pie chart
        const pieCtx = document.getElementById('difficultyChart');
        if (pieCtx && !pieCtx._chart) {
          const counts = { Easy: 0, Moderate: 0, Hard: 0 };
          this.assignedTreks.forEach(t => { counts[t.difficulty] = (counts[t.difficulty] || 0) + 1; });
          pieCtx._chart = new Chart(pieCtx, {
            type: 'doughnut',
            data: {
              labels: Object.keys(counts),
              datasets: [{ data: Object.values(counts), backgroundColor: ['rgba(34,197,94,0.75)', 'rgba(245,158,11,0.75)', 'rgba(239,68,68,0.75)'], borderWidth: 0 }]
            },
            options: { responsive: true, plugins: { legend: { position: 'bottom' } }, cutout: '65%' }
          });
        }

        // Monthly participation line chart
        const lineCtx = document.getElementById('monthlyChart');
        if (lineCtx && !lineCtx._chart) {
          lineCtx._chart = new Chart(lineCtx, {
            type: 'line',
            data: {
              labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct'],
              datasets: [{
                label: 'Participants', data: [12, 18, 24, 15, 30, 22, 28, 35, 20, 42],
                borderColor: '#c8922a', backgroundColor: 'rgba(200,146,42,0.1)',
                tension: 0.4, fill: true, pointBackgroundColor: '#c8922a', pointRadius: 4
              }]
            },
            options: { responsive: true, plugins: { legend: { position: 'bottom' } }, scales: { y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.05)' } } } }
          });
        }

        // Occupancy gauge (horizontal bar)
        const occCtx = document.getElementById('occupancyChart');
        if (occCtx && !occCtx._chart) {
          occCtx._chart = new Chart(occCtx, {
            type: 'bar',
            data: {
              labels: this.assignedTreks.map(t => t.name),
              datasets: [{
                label: 'Occupancy %',
                data: this.assignedTreks.map(t => Math.round((t.registered / t.slots) * 100)),
                backgroundColor: this.assignedTreks.map(t => {
                  const p = t.registered / t.slots;
                  return p >= 0.9 ? 'rgba(239,68,68,0.7)' : p >= 0.7 ? 'rgba(245,158,11,0.7)' : 'rgba(34,197,94,0.7)';
                }),
                borderRadius: 4,
              }]
            },
            options: {
              indexAxis: 'y', responsive: true,
              plugins: { legend: { display: false } },
              scales: { x: { max: 100, grid: { color: 'rgba(0,0,0,0.05)' } } }
            }
          });
        }
      });
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
  },

  watch: {
    activeTab(tab) {
      if (tab === 'analytics') { setTimeout(() => this.initCharts(), 100); }
    }
  },

  mounted() {
    this.fetchStaffData();
    this.startCountdown();

    this.hashListener = this.handleHashChange.bind(this);
    window.addEventListener('hashchange', this.hashListener);

    const hash = window.location.hash.slice(1);
    if (hash) {
      this.handleHashChange();
    } else {
      const savedTab = localStorage.getItem('staffActiveTab');
      const validTabs = ['dashboard', 'treks', 'participants', 'analytics', 'notifications', 'exports', 'performance', 'profile'];
      if (savedTab && validTabs.includes(savedTab)) {
        window.location.hash = savedTab === 'attendance' ? 'treks' : savedTab;
      } else {
        window.location.hash = 'dashboard';
      }
    }
  },

  beforeUnmount() {
    if (this.countdownTimer) clearInterval(this.countdownTimer);
    window.removeEventListener('hashchange', this.hashListener);
  },

  template: `
  <div class="ts-staff-layout">

    <!-- Mobile sidebar overlay -->
    <div class="sidebar-overlay" :class="{ visible: sidebarOpen }" @click="sidebarOpen = false"></div>
    <button class="mobile-toggle" @click="sidebarOpen = !sidebarOpen">
      <svg viewBox="0 0 24 24"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
    </button>

    <!-- ── SIDEBAR ────────────────────────────────── -->
    <aside class="ts-sidebar" :class="{ open: sidebarOpen }">
      <div class="sidebar-brand">
        <div class="sidebar-brand-icon">
          <svg viewBox="0 0 24 24"><path d="M3 17l4-8 4 4 4-6 4 10"/></svg>
        </div>
        <a class="brand-name" href="#">Trail<span>Sync</span></a>
      </div>

      <!-- Staff chip -->
      <div class="sidebar-staff-chip">
        <div class="staff-avatar">{{ staffInitial }}</div>
        <div class="staff-chip-info">
          <div class="staff-chip-name">{{ staffProfile.name }}</div>
          <div class="staff-chip-role">Trek Staff</div>
        </div>
      </div>

      <nav class="sidebar-nav">
        <div class="nav-section-label">Operations</div>
        <a class="nav-item" :class="{ active: activeTab === 'dashboard' }" @click="goTab('dashboard')">
          <svg viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>
          Dashboard
        </a>
        <a class="nav-item" :class="{ active: activeTab === 'treks' }" @click="goTab('treks')">
          <svg viewBox="0 0 24 24"><path d="M3 17l4-8 4 4 4-6 4 10"/><path d="M3 20h18"/></svg>
          Assigned Treks
          <span class="nav-badge">{{ assignedTreks.length }}</span>
        </a>
        <a class="nav-item" :class="{ active: activeTab === 'participants' }" @click="goTab('participants')">
          <svg viewBox="0 0 24 24"><circle cx="9" cy="8" r="3"/><path d="M2 19c0-3 3-5 7-5"/><circle cx="16" cy="10" r="3"/><path d="M13 19c0-3 2.7-5 6-5"/></svg>
          Participants
        </a>
        <a class="nav-item" :class="{ active: activeTab === 'analytics' }" @click="goTab('analytics')">
          <svg viewBox="0 0 24 24"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
          Analytics
        </a>
        <div class="nav-section-label">Management</div>
        <a class="nav-item" :class="{ active: activeTab === 'notifications' }" @click="goTab('notifications')">
          <svg viewBox="0 0 24 24"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
          Notifications
          <span v-if="unreadCount" class="nav-badge nav-badge-red">{{ unreadCount }}</span>
        </a>
        <a class="nav-item" :class="{ active: activeTab === 'exports' }" @click="goTab('exports')">
          <svg viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
          Exports
        </a>
        <a class="nav-item" :class="{ active: activeTab === 'performance' }" @click="goTab('performance')">
          <svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/></svg>
          Performance
        </a>
        <div class="nav-section-label">Account</div>
        <a class="nav-item" :class="{ active: activeTab === 'profile' }" @click="goTab('profile')">
          <svg viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
          My Profile
        </a>
      </nav>

      <div class="sidebar-footer">
        <button class="btn-logout-sidebar" @click="$emit('logout')">
          <svg viewBox="0 0 24 24"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
          Sign Out
        </button>
      </div>
    </aside>

    <!-- ── MAIN ───────────────────────────────────── -->
    <div class="ts-main">

      <!-- Topbar -->
      <div class="ts-topbar">
        <div class="topbar-breadcrumb">
          TrailSync / Staff / <span>{{ activeTab.charAt(0).toUpperCase() + activeTab.slice(1) }}</span>
        </div>
        <div class="topbar-spacer"></div>
        <div class="topbar-search">
          <svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input v-model="searchQuery" type="text" placeholder="Search treks…" />
        </div>
        <div class="topbar-notif" @click="goTab('notifications')" title="Notifications">
          <svg viewBox="0 0 24 24"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
          <span v-if="unreadCount" class="notif-dot"></span>
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
            <div class="hero-name">Hello, <em>{{ staffProfile.name.split(' ')[0] }}</em> 👋</div>
            <div class="hero-sub">You have {{ assignedTreks.filter(t=>t.status==='Open'||t.status==='Approved').length }} active trek{{ assignedTreks.filter(t=>t.status==='Open'||t.status==='Approved').length !== 1 ? 's' : '' }} — {{ participants.filter(p=>p.status==='Booked').length }} participants registered</div>
          </div>
          <div class="hero-right">
            <button class="btn-primary-ts" @click="goTab('treks')">Manage Treks</button>
            <button class="btn-ghost" @click="goTab('participants')">Participants</button>
          </div>
        </div>

        <!-- Stats row (Redesigned & Grouped) -->
        <div class="stats-grouped-container">
          <!-- Group 1: Trek Summary -->
          <div class="stats-group">
            <div class="stats-group-title">Trek Summary</div>
            <div class="stats-group-cards">
              <div class="stat-item-grouped">
                <div class="stat-card-header-row">
                  <div class="stat-num">{{ assignedTreks.length }}</div>
                  <div class="stat-icon-wrapper stat-icon-mountain">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 17l4-8 4 4 4-6 4 10"/></svg>
                  </div>
                </div>
                <div class="stat-label">Assigned Treks</div>
              </div>
              <div class="stat-item-grouped">
                <div class="stat-card-header-row">
                  <div class="stat-num">{{ assignedTreks.filter(t => t.status === 'Completed').length }}</div>
                  <div class="stat-icon-wrapper stat-icon-check">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
                  </div>
                </div>
                <div class="stat-label">Completed Treks</div>
              </div>
            </div>
          </div>

          <!-- Group 2: Trekker Stats -->
          <div class="stats-group">
            <div class="stats-group-title">Trekker Stats</div>
            <div class="stats-group-cards">
              <div class="stat-item-grouped">
                <div class="stat-card-header-row">
                  <div class="stat-num">{{ participants.filter(p => p.status === 'Booked' || p.status === 'Completed').length }}</div>
                  <div class="stat-icon-wrapper stat-icon-users">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="9" cy="8" r="3"/><path d="M2 19c0-3 3-5 7-5"/><circle cx="16" cy="10" r="3"/><path d="M13 19c0-3 2.7-5 6-5"/></svg>
                  </div>
                </div>
                <div class="stat-label">Total Led</div>
              </div>
              <div class="stat-item-grouped">
                <div class="stat-card-header-row">
                  <div class="stat-num">{{ participants.filter(p => p.status === 'Booked').length }}</div>
                  <div class="stat-icon-wrapper stat-icon-active">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                  </div>
                </div>
                <div class="stat-label">Active Booked</div>
              </div>
            </div>
          </div>

          <!-- Group 3: Operations Actions -->
          <div class="stats-group">
            <div class="stats-group-title">Actions & Tasks</div>
            <div class="stats-group-cards">
              <div class="stat-item-grouped">
                <div class="stat-card-header-row">
                  <div class="stat-num">{{ assignedTreks.filter(t => t.status === 'Pending').length }}</div>
                  <div class="stat-icon-wrapper stat-icon-cancel">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                  </div>
                </div>
                <div class="stat-label">Pending Actions</div>
              </div>
              <div class="stat-item-grouped">
                <div class="stat-card-header-row">
                  <div class="stat-num">{{ unreadCount }}</div>
                  <div class="stat-icon-wrapper stat-icon-alert">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
                  </div>
                </div>
                <div class="stat-label">Unread Alerts</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Custom SVG line chart + Occupancy Rate -->
        <div class="dashboard-grid-equal" style="margin-bottom:1.5rem">
          <!-- Left side: Monthly Registrations Trend -->
          <div class="dash-card">
            <div class="dash-card-header"><span class="dash-card-title">Monthly Registrations Trend</span></div>
            <div class="chart-svg-wrap">
              <svg viewBox="0 0 700 180" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:auto">
                <defs>
                  <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stop-color="#c8922a" stop-opacity="0.25"/>
                    <stop offset="100%" stop-color="#c8922a" stop-opacity="0.02"/>
                  </linearGradient>
                </defs>
                <!-- grid -->
                <line v-for="gi in 4" :key="'g'+gi" :x1="30" :y1="30 + (gi-1)*35" :x2="670" :y2="30+(gi-1)*35" class="chart-grid-line"/>
                <!-- area -->
                <path :d="buildAreaPath(monthlyRegistrations,'count',700,180,30)" class="chart-area-fill"/>
                <!-- line -->
                <path :d="buildLinePath(monthlyRegistrations,'count',700,180,30)" class="chart-line-path"/>
                <!-- dots & labels -->
                <g v-for="(m,idx) in monthlyRegistrations" :key="'dot'+idx">
                  <circle
                    :cx="30 + (idx/(monthlyRegistrations.length-1 || 1))*(700-60)"
                    :cy="180 - 30 - (m.count/maxMonthlyRegistrations)*(180-60)"
                    r="3.5" class="chart-dot"/>
                  <text
                    :x="30 + (idx/(monthlyRegistrations.length-1 || 1))*(700-60)"
                    y="172" text-anchor="middle" class="chart-axis-label">{{ m.month }}</text>
                </g>
              </svg>
            </div>
          </div>
          <!-- Right side: Trek Occupancy Rate -->
          <div class="dash-card">
            <div class="dash-card-header"><span class="dash-card-title">Trek Occupancy Rate</span></div>
            <div class="occ-list">
              <div v-for="s in occupancyBreakdown" :key="s.id" class="occ-item">
                <div class="occ-meta">
                  <span class="occ-trek" :title="s.name">{{ s.name }}</span>
                  <span class="occ-pct">{{ s.pct }}% ({{ s.booked }}/{{ s.total }})</span>
                </div>
                <div class="occ-bar-track">
                  <div class="occ-bar-fill" :class="s.pct >= 90 ? 'occ-full' : s.pct >= 70 ? 'occ-high' : s.pct >= 40 ? 'occ-mid' : 'occ-low'" :style="{ width: s.pct + '%' }"></div>
                </div>
              </div>
              <div v-if="!occupancyBreakdown.length" style="color:var(--stone); text-align:center; padding:2rem 0; font-size:0.88rem">
                No assigned treks to show occupancy.
              </div>
            </div>
          </div>
        </div>

        <!-- Main two-column layout -->
        <div class="dashboard-main-grid">
          <!-- Left column -->
          <div>
            <!-- Interactive Priorities & Alerts -->
            <div class="ts-card" style="margin-bottom:1.5rem">
              <div class="ts-card-header">
                <div>
                  <div class="ts-card-title">Priority Action Desk</div>
                  <div class="ts-card-sub">Action items requiring staff intervention</div>
                </div>
              </div>
              <div class="ts-card-body">
                <div v-if="!todayPriorities.length" class="empty-state" style="padding:2rem">
                  <svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
                  <p>No urgent actions — all treks are on track!</p>
                </div>
                <div class="alerts-tasks-dashboard-grid" v-else>
                  <div v-for="(p, idx) in todayPriorities" :key="idx" class="task-alert-card" :class="p.type === 'critical' ? 'urgent' : p.type === 'warning' ? 'warning' : 'info'">
                    <div class="task-card-icon-col">
                      <span v-if="p.type === 'critical'">🚨</span>
                      <span v-else-if="p.type === 'warning'">⚠️</span>
                      <span v-else>ℹ️</span>
                    </div>
                    <div class="task-card-body-col">
                      <div class="task-card-label" v-html="p.text"></div>
                      <div class="task-card-num" style="font-size:0.62rem; font-family:'Space Mono',monospace; color:var(--stone)">{{ p.time }}</div>
                    </div>
                    <button class="btn-primary-ts btn-sm task-resolve-btn" @click="resolvePriorityAction(p)">
                      Resolve →
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <!-- Grouped Operations Console -->
            <div class="ts-card" style="margin-bottom:1.5rem">
              <div class="ts-card-header">
                <div>
                  <div class="ts-card-title">Operations Console Deck</div>
                  <div class="ts-card-sub">Quick-access tools for trek and participant operations</div>
                </div>
              </div>
              <div class="ts-card-body">
                <div class="console-groups-container">
                  <!-- Group 1: Trek Management -->
                  <div class="console-group">
                    <div class="console-group-label">Trek Management</div>
                    <div class="console-group-buttons">
                      <button class="console-btn btn-primary-ts" @click="assignedTreks[0] && openSlotModal(assignedTreks[0])" :disabled="!assignedTreks.length">
                        <svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg> Update Slots
                      </button>
                      <button class="console-btn btn-forest" @click="assignedTreks[0] && openStatusModal(assignedTreks[0])" :disabled="!assignedTreks.length">
                        <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> Change Status
                      </button>
                      <button class="console-btn" @click="nextTrek && openCompletionModal(nextTrek)" :disabled="!nextTrek">
                        <svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg> Complete Trek
                      </button>
                    </div>
                  </div>

                  <!-- Group 2: Trekker Operations -->
                  <div class="console-group">
                    <div class="console-group-label">Trekker & Participant Ops</div>
                    <div class="console-group-buttons">
                      <button class="console-btn" @click="goTab('participants')">
                        <svg viewBox="0 0 24 24"><circle cx="9" cy="8" r="3"/><path d="M2 19c0-3 3-5 7-5"/></svg> View Participants
                      </button>
                      <button class="console-btn" @click="selectTrekForAttendance(nextTrek || assignedTreks[0])" :disabled="!assignedTreks.length">
                        <svg viewBox="0 0 24 24"><polyline points="9 11 12 14 22 4"/></svg> Mark Attendance
                      </button>
                      <button class="console-btn" @click="exportCSV(selectedTrekId)" :disabled="!assignedTreks.length">
                        <svg viewBox="0 0 24 24"><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg> Export CSV
                      </button>
                    </div>
                  </div>

                  <!-- Group 3: Preps & Checklist -->
                  <div class="console-group">
                    <div class="console-group-label">Checklists & Gear Setup</div>
                    <div class="console-group-buttons">
                      <button class="console-btn btn-primary-ts" @click="assignedTreks[0] && openChecklistModal(assignedTreks[0])" :disabled="!assignedTreks.length">
                        <svg viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/></svg> Gear Checklist
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Assigned Treks Quick View -->
            <div class="ts-card" style="margin-bottom:1.5rem">
              <div class="ts-card-header">
                <div class="ts-card-title">My Assigned Treks</div>
                <button class="ts-card-action" @click="goTab('treks')">Manage all →</button>
              </div>
              <div class="ts-card-body">
                <div class="trek-quick-list">
                  <div v-for="t in assignedTreks" :key="t.id" class="trek-quick-item">
                    <div>
                      <div class="tqi-name">{{ t.name }}</div>
                      <div class="tqi-meta">📍 {{ t.location }} · {{ t.startDate }}</div>
                    </div>
                    <div class="tqi-right">
                      <span :class="'diff-pill pill-' + t.difficulty.toLowerCase()">{{ t.difficulty }}</span>
                      <span :class="'status-pill status-' + t.status.toLowerCase()">{{ t.status }}</span>
                      <div class="tqi-actions">
                        <button class="act-btn act-view btn-sm" @click="selectTrekForParticipants(t)">Participants</button>
                        <button class="act-btn act-complete btn-sm" @click="openStatusModal(t)">Status</button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Recent Activity -->
            <div class="ts-card">
              <div class="ts-card-header">
                <div class="ts-card-title">Recent Activity</div>
                <button class="ts-card-action" @click="goTab('notifications')">All →</button>
              </div>
              <div class="ts-card-body" style="padding-top:0.5rem">
                <div class="activity-feed">
                  <div v-for="a in activityLog.slice(0,6)" :key="a.id" class="activity-item">
                    <div class="activity-dot" :class="a.type==='booking'?'ad-green':a.type==='cancel'?'ad-red':a.type==='status'?'ad-blue':'ad-gold'">
                      {{ a.type==='booking'?'✓':a.type==='cancel'?'✕':a.type==='status'?'S':'⚙' }}
                    </div>
                    <div>
                      <div class="activity-text" v-html="a.text"></div>
                      <div class="activity-time">{{ a.time }}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Right column -->
          <div>
            <!-- Upcoming Trek Countdown -->
            <div v-if="nextTrek" style="margin-bottom:1.25rem">
              <div class="upcoming-trek-card">
                <div class="utc-label-top">⏱ Next Trek</div>
                <div class="utc-name">{{ nextTrek.name }}</div>
                <div class="utc-loc">📍 {{ nextTrek.location }}</div>
                <div class="utc-rows">
                  <div class="utc-row"><span class="utc-row-label">Start Date</span><span class="utc-row-val">{{ nextTrek.startDate }}</span></div>
                  <div class="utc-row"><span class="utc-row-label">Participants</span><span class="utc-row-val">{{ nextTrek.registered }}/{{ nextTrek.slots }}</span></div>
                  <div class="utc-row"><span class="utc-row-label">Status</span><span :class="'status-pill status-' + nextTrek.status.toLowerCase()">{{ nextTrek.status }}</span></div>
                </div>
                <div class="utc-slot-bar">
                  <div class="slot-bar-wrap">
                    <div class="slot-bar-fill" :style="{ width: slotPct(nextTrek) + '%' }"></div>
                  </div>
                  <div class="slot-bar-label">{{ slotsLeft(nextTrek) }} of {{ nextTrek.slots }} slots remaining</div>
                </div>
                <div class="countdown-strip">
                  <div class="cd-unit"><span class="cd-val">{{ countdown.days }}</span><span class="cd-lbl">Days</span></div>
                  <div class="cd-unit"><span class="cd-val">{{ countdown.hours }}</span><span class="cd-lbl">Hrs</span></div>
                  <div class="cd-unit"><span class="cd-val">{{ countdown.minutes }}</span><span class="cd-lbl">Min</span></div>
                  <div class="cd-unit"><span class="cd-val">{{ countdown.seconds }}</span><span class="cd-lbl">Sec</span></div>
                </div>
              </div>
            </div>

            <!-- Upcoming timeline -->
            <div class="ts-card">
              <div class="ts-card-header"><div class="ts-card-title">Upcoming Timeline</div></div>
              <div class="ts-card-body">
                <div class="timeline">
                  <div v-for="(t, i) in upcomingTimeline" :key="t.id" class="timeline-item">
                    <div class="timeline-dot" :class="t.status==='Completed'?'completed':t.status==='Open'?'upcoming':''">
                      {{ i + 1 }}
                    </div>
                    <div class="timeline-info">
                      <div class="tl-name">{{ t.name }}</div>
                      <div class="tl-meta">{{ t.startDate }} · {{ t.location }}</div>
                    </div>
                    <span :class="'status-pill status-' + t.status.toLowerCase()" style="margin-left:auto">{{ t.status }}</span>
                  </div>
                </div>
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
          <button v-if="participantTrekId" class="btn-primary-ts btn-sm" @click="exportCSV(participantTrekId)" :disabled="exportPending && exportTrekId === participantTrekId">
            {{ exportPending && exportTrekId === participantTrekId ? '⏳ Exporting…' : '⬇ Export CSV' }}
          </button>
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
              <div class="ptab-tc-loc">📍 {{ t.location }}</div>
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
                <span>📍 {{ participantTrek.location }}</span>
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
              <span>📍 {{ selectedTrek.location }}</span>
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
           ANALYTICS TAB
      ════════════════════════════════════════════ -->
      <div v-if="activeTab === 'analytics'" class="tab-content">
        <div class="page-header">
          <div>
            <div class="section-eyebrow">Data Insights</div>
            <div class="section-title">Trek <em>Analytics</em></div>
          </div>
        </div>
        <div class="analytics-grid">
          <div class="ts-card">
            <div class="ts-card-header"><div class="ts-card-title">Registrations Per Trek</div></div>
            <div class="ts-card-body">
              <div class="chart-wrap"><canvas id="registrationsChart" height="220"></canvas></div>
            </div>
          </div>
          <div class="ts-card">
            <div class="ts-card-header"><div class="ts-card-title">Difficulty Distribution</div></div>
            <div class="ts-card-body">
              <div class="chart-wrap"><canvas id="difficultyChart" height="220"></canvas></div>
            </div>
          </div>
          <div class="ts-card">
            <div class="ts-card-header"><div class="ts-card-title">Monthly Participation</div></div>
            <div class="ts-card-body">
              <div class="chart-wrap"><canvas id="monthlyChart" height="220"></canvas></div>
            </div>
          </div>
          <div class="ts-card">
            <div class="ts-card-header"><div class="ts-card-title">Trek Occupancy Rate</div></div>
            <div class="ts-card-body">
              <div class="chart-wrap"><canvas id="occupancyChart" height="220"></canvas></div>
            </div>
          </div>
        </div>
      </div>

      <!-- ════════════════════════════════════════════
           NOTIFICATIONS TAB
      ════════════════════════════════════════════ -->
      <div v-if="activeTab === 'notifications'" class="tab-content">
        <div class="page-header">
          <div>
            <div class="section-eyebrow">Staff Panel</div>
            <div class="section-title">Notification <em>Centre</em></div>
          </div>
          <button class="btn-ghost" @click="markAllRead" v-if="unreadCount">Mark all read</button>
        </div>
        <div class="ts-card">
          <div class="notif-list">
            <div v-for="n in notifications" :key="n.id" class="notif-item" :class="{ unread: n.unread }" @click="n.unread = false">
              <div class="notif-icon" :class="n.type==='warning'?'ni-gold':n.type==='cancel'?'ni-red':n.type==='success'?'ni-green':'ni-blue'">
                <svg v-if="n.type==='warning'" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                <svg v-else-if="n.type==='cancel'" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
                <svg v-else viewBox="0 0 24 24"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
              </div>
              <div class="notif-body">
                <div class="notif-title">{{ n.title }}</div>
                <div class="notif-desc">{{ n.desc }}</div>
              </div>
              <div style="display:flex; flex-direction:column; align-items:flex-end; gap:4px">
                <div class="notif-time">{{ n.time }}</div>
                <div v-if="n.unread" class="unread-dot"></div>
              </div>
            </div>
          </div>
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
              <div style="display:flex; gap:0.5rem">
                <button class="btn-primary-ts btn-sm" @click="exportCSV(t.id)" :disabled="exportPending && exportTrekId === t.id">
                  {{ exportPending && exportTrekId === t.id ? '⏳ Exporting…' : '⬇ Export CSV' }}
                </button>
                <button class="btn-ghost btn-sm" @click="selectTrekForParticipants(t)">View List</button>
              </div>
              <div v-if="exportPending && exportTrekId === t.id" class="export-notice" style="margin-top:0.75rem; font-size:0.78rem">
                <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/></svg>
                CSV will be sent via email shortly.
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- ════════════════════════════════════════════
           PERFORMANCE TAB
      ════════════════════════════════════════════ -->
      <div v-if="activeTab === 'performance'" class="tab-content">
        <div class="page-header">
          <div>
            <div class="section-eyebrow">Staff Metrics</div>
            <div class="section-title">My <em>Performance</em></div>
          </div>
        </div>
        <div style="display:grid; grid-template-columns:1fr 2fr; gap:1.5rem; align-items:start">
          <div>
            <div class="ts-card" style="margin-bottom:1.25rem">
              <div class="ts-card-header"><div class="ts-card-title">Career Stats</div></div>
              <div class="ts-card-body">
                <div class="perf-grid">
                  <div class="perf-card">
                    <div class="perf-val">{{ perfMetrics.treksManaged }}</div>
                    <div class="perf-lbl">Treks Managed</div>
                  </div>
                  <div class="perf-card">
                    <div class="perf-val">{{ perfMetrics.participantsManaged }}</div>
                    <div class="perf-lbl">Participants Led</div>
                  </div>
                </div>
                <div class="perf-progress" style="margin-top:0.5rem">
                  <div class="perf-progress-label"><span>Average Occupancy</span><span>{{ perfMetrics.occupancy }}%</span></div>
                  <div class="progress-track"><div class="progress-fill" :style="{ width: perfMetrics.occupancy + '%' }"></div></div>
                </div>
                <div class="perf-progress" style="margin-top:0.75rem">
                  <div class="perf-progress-label"><span>Completion Rate</span><span>{{ perfMetrics.completionRate }}%</span></div>
                  <div class="progress-track"><div class="progress-fill" :style="{ width: perfMetrics.completionRate + '%' }"></div></div>
                </div>
              </div>
            </div>
            <div class="ts-card">
              <div class="ts-card-header"><div class="ts-card-title">Activity Log</div></div>
              <div class="ts-card-body" style="padding-top:0.35rem">
                <div class="activity-feed">
                  <div v-for="a in activityLog" :key="a.id" class="activity-item">
                    <div class="activity-dot" :class="a.type==='booking'?'ad-green':a.type==='cancel'?'ad-red':a.type==='status'?'ad-blue':'ad-gold'">
                      {{ a.type==='booking'?'✓':a.type==='cancel'?'✕':a.type==='status'?'S':'⚙' }}
                    </div>
                    <div>
                      <div class="activity-text" v-html="a.text"></div>
                      <div class="activity-time">{{ a.time }}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div class="ts-card">
            <div class="ts-card-header"><div class="ts-card-title">Trek Breakdown</div></div>
            <div class="ts-card-body">
              <div class="ts-table-wrap" style="box-shadow:none; border:none">
                <table class="ts-table">
                  <thead><tr><th>Trek</th><th>Status</th><th>Participants</th><th>Slots</th><th>Occupancy</th></tr></thead>
                  <tbody>
                    <tr v-for="t in assignedTreks" :key="t.id">
                      <td class="cell-name">{{ t.name }}</td>
                      <td><span :class="'status-pill status-' + t.status.toLowerCase()">{{ t.status }}</span></td>
                      <td class="mono">{{ t.registered }}</td>
                      <td class="mono">{{ t.slots }}</td>
                      <td>
                        <div style="display:flex; align-items:center; gap:8px">
                          <div class="progress-track" style="flex:1; max-width:80px"><div class="progress-fill" :style="{ width: slotPct(t) + '%' }"></div></div>
                          <span style="font-family:'Space Mono',monospace; font-size:0.68rem">{{ slotPct(t) }}%</span>
                        </div>
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
           PROFILE TAB
      ════════════════════════════════════════════ -->
      <div v-if="activeTab === 'profile'" class="tab-content">
        <div class="page-header">
          <div>
            <div class="section-eyebrow">Account</div>
            <div class="section-title">My <em>Profile</em></div>
          </div>
        </div>
        <div class="profile-layout">
          <div class="profile-card-left">
            <div class="profile-avatar-xl">{{ staffInitial }}</div>
            <div class="profile-name-xl">{{ staffProfile.name }}</div>
            <div class="profile-role-xl">Trek Staff</div>
            <div style="font-size:0.78rem; color:var(--stone); text-align:center; margin-bottom:1rem; font-family:'Space Mono',monospace">{{ staffProfile.email }}</div>
            <div style="width:100%; display:flex; flex-direction:column; gap:0.5rem">
              <div style="background:var(--cream); border-radius:6px; padding:0.55rem 0.85rem; font-size:0.78rem; display:flex; align-items:center; gap:8px">
                <svg width="14" height="14" viewBox="0 0 24 24" style="stroke:var(--gold);fill:none;stroke-width:2"><path d="M3 17l4-8 4 4 4-6 4 10"/></svg>
                Treks Assigned: <strong style="margin-left:auto">{{ assignedTreks.length }}</strong>
              </div>
              <div style="background:var(--cream); border-radius:6px; padding:0.55rem 0.85rem; font-size:0.78rem; display:flex; align-items:center; gap:8px">
                <svg width="14" height="14" viewBox="0 0 24 24" style="stroke:var(--gold);fill:none;stroke-width:2"><circle cx="9" cy="8" r="3"/><path d="M2 19c0-3 3-5 7-5"/></svg>
                Participants Led: <strong style="margin-left:auto">{{ perfMetrics.participantsManaged }}</strong>
              </div>
              <div style="background:var(--cream); border-radius:6px; padding:0.55rem 0.85rem; font-size:0.78rem; display:flex; align-items:center; gap:8px">
                <svg width="14" height="14" viewBox="0 0 24 24" style="stroke:var(--gold);fill:none;stroke-width:2"><polyline points="20 6 9 17 4 12"/></svg>
                Completion Rate: <strong style="margin-left:auto">{{ perfMetrics.completionRate }}%</strong>
              </div>
            </div>
          </div>
          <div>
            <div class="profile-form-section">
              <div class="form-section-title">Profile Details</div>
              <div class="form-row">
                <div class="form-group"><label>Full Name</label><input v-model="staffProfile.name" type="text" disabled style="background: var(--snow); color: var(--stone); cursor: not-allowed;" /></div>
                <div class="form-group"><label>Phone</label><input v-model="staffProfile.phone" type="tel" disabled style="background: var(--snow); color: var(--stone); cursor: not-allowed;" /></div>
              </div>
              <div class="form-row full">
                <div class="form-group"><label>Email</label><input v-model="staffProfile.email" type="email" disabled style="background: var(--snow); color: var(--stone); cursor: not-allowed;" /></div>
              </div>
              <div class="form-row">
                <div class="form-group"><label>City / Base</label><input v-model="staffProfile.city" type="text" disabled style="background: var(--snow); color: var(--stone); cursor: not-allowed;" /></div>
                <div class="form-group"><label>Certifications</label><input v-model="staffProfile.certifications" type="text" disabled style="background: var(--snow); color: var(--stone); cursor: not-allowed;" /></div>
              </div>
              <div class="form-row full">
                <div class="form-group"><label>Bio</label><textarea v-model="staffProfile.bio" rows="3" disabled style="background: var(--snow); color: var(--stone); cursor: not-allowed; resize: none;"></textarea></div>
              </div>
            </div>
            <div class="profile-form-section" style="margin-bottom:0">
              <div class="form-section-title">Change Password</div>
              <div class="form-row full"><div class="form-group"><label>Current Password</label><input v-model="pwForm.current" type="password" placeholder="••••••••" /></div></div>
              <div class="form-row">
                <div class="form-group"><label>New Password</label><input v-model="pwForm.new" type="password" placeholder="••••••••" /></div>
                <div class="form-group"><label>Confirm Password</label><input v-model="pwForm.confirm" type="password" placeholder="••••••••" /></div>
              </div>
              <div style="display:flex; justify-content:flex-end; margin-top:0.85rem">
                <button class="btn-forest" @click="changePassword">Update Password</button>
              </div>
            </div>
          </div>
        </div>
      </div>

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
          <h3 class="ts-modal-title">📋 Gear Checklist — {{ checklistTrek?.name }}</h3>
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

  </div>
  `
};
