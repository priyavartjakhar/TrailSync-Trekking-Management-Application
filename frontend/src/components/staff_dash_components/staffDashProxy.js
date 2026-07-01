const COMMON_FIELDS = [
  'activeTab',
  'sidebarOpen',
  'sidebarCollapsed',
  'profileDropdownOpen',
  'staffProfile',
  'assignedTreks',
  'participants',
  'countdown',
  'nextTrek',
  'filteredTreks',
  'participantTrekId',
  'participantsInTreksTab',
  'attendanceInTreksTab',
  'trekSearchQuery',
  'filteredTrekOptions',
  'participantTrek',
  'participantSearch',
  'filteredParticipants',
  'exportPending',
  'exportTrekId',
  'selectedTrek',
  'attendanceParticipants',
  'perfMetrics',
  'profilePhotoUrl',
  'staffInitial',
  'profileStatusLabel',
  'profileSkills',
  'profileCertifications',
  'profileLanguages',
  'pwForm',
  'newTicket',
  'leaveRequest',
  'supportTickets',
  'submittingSupport',
  'submittingLeave',
  'pendingGroups',
  'socialGroups',
  'selectedSocialTrekId',
  'selectedSocialGroupTrek',
  'currentGroupMessages',
  'newSocialMessageText',
  'socialGroupMembers'
];

const COMMON_METHODS = [
  'goTab',
  'formatDate',
  'formatShortDate',
  'getTrekWeather',
  'openTrekDetailModal',
  'openSlotModal',
  'selectTrekForParticipants',
  'slotColor',
  'slotPct',
  'isStatusAllowed',
  'selectTrekForAttendance',
  'openChecklistModal',
  'markStarted',
  'openCompletionModal',
  'exportCSV',
  'openAddParticipantModal',
  'displayTrekkerId',
  'paymentStatusClass',
  'paymentStatusLabel',
  'openParticipantModal',
  'openEmergencyModal',
  'cancelParticipant',
  'backFromParticipantTrek',
  'setAttendance',
  'backFromAttendanceTrek',
  'openExportDetailModal',
  'openDownloadPromptModal',
  'changePassword',
  'submitStaffTicket',
  'submitLeaveRequest',
  'getCategoryClass',
  'createGroup',
  'selectSocialGroup',
  'toggleSocialGroupLock',
  'closeSocialChat',
  'sendSocialMessage',
  'getChatBubbleStyle'
];

function unique(names) {
  return [...new Set(names)];
}

export function proxyFields(names = []) {
  return Object.fromEntries(unique([...COMMON_FIELDS, ...names]).map((field) => [
    field,
    {
      get() {
        return this.staffDash[field];
      },
      set(value) {
        this.staffDash[field] = value;
      }
    }
  ]));
}

export function proxyMethods(names = []) {
  return Object.fromEntries(unique([...COMMON_METHODS, ...names]).map((method) => [
    method,
    function (...args) {
      if (typeof this.staffDash[method] !== 'function') return undefined;
      return this.staffDash[method](...args);
    }
  ]));
}

export function staffDashComponent(name, options = {}) {
  return {
    name,
    inject: ['staffDash'],
    emits: options.emits || [],
    computed: proxyFields(options.fields || []),
    methods: proxyMethods(options.methods || [])
  };
}
