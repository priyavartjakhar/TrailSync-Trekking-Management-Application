/**
 * =========================================================================
 * staffDashProxy.js
 * =========================================================================
 * Reactivity and Method bridge for Staff Dashboard tab components.
 *
 * Mirrors the pattern used in adminDashProxy.js but scoped to the staff
 * dashboard. The parent `StaffDashboard.vue` provides itself under the
 * key 'staffDash' via Vue's provide/inject API, and each child tab
 * component receives it through inject: ['staffDash'].
 *
 * Architecture overview:
 *   StaffDashboard.vue (parent / "controller")
 *     ├── provides 'staffDash' (itself) via Vue's provide/inject API
 *     └── Tab components (children) receive it via inject: ['staffDash']
 *
 * Each child tab calls staffDashComponent() which:
 *   1. Injects the parent controller as 'staffDash'
 *   2. Exposes all parent reactive fields as computed getters/setters
 *      (via proxyFields) so the child can read/write parent state
 *   3. Delegates all parent methods to the controller via proxyMethods
 *      so the child can trigger centralised API calls and UI actions
 *   4. Supports merging local data, computed, lifecycle hooks, and watchers
 */

// ── COMMON_FIELDS ─────────────────────────────────────────────
// Reactive data properties from StaffDashboard.vue that all
// child tab components share via computed proxy getters/setters.
const COMMON_FIELDS = [
  'activeTab',                // Currently active dashboard tab slug
  'sidebarOpen',              // Whether the mobile sidebar drawer is open
  'sidebarCollapsed',         // Whether the sidebar is in icon-only collapsed mode
  'profileDropdownOpen',      // Whether the profile/avatar dropdown is open
  'staffProfile',             // The logged-in staff member's full profile object
  'assignedTreks',            // All treks assigned to this staff member
  'participants',             // Trekkers enrolled in the staff member's active treks
  'activityLog',              // Recent activity events for this staff member
  'toast',                    // Toast notification object { message, type, visible }
  'nextTrek',                 // The soonest upcoming assigned trek object
  'activeAssignedTreks',      // Subset of assignedTreks with status 'Active'/'Upcoming'
  'completedAssignedTreks',   // Subset of assignedTreks with status 'Completed'
  'participantTrekId',        // Selected trek ID in the participants tab
  'participantsInTreksTab',   // Flag to show participants view inline under treks tab
  'attendanceInTreksTab',      // Flag to show attendance view inline under treks tab
  'selectedTrekId',           // Selected trek ID in the attendance tab
  'staffInitial',             // Computed staff initial character
  'profilePhotoUrl',          // Computed profile picture URL
  'attendanceParticipants',   // Computed list of booked participants for selected trek
  'selectedTrek',             // Computed selected trek object for attendance
  'participantTrek'           // Computed selected trek object for participants roster
];

// ── COMMON_METHODS ────────────────────────────────────────────
// Methods defined on StaffDashboard.vue that child tab components
// are allowed to call through the proxy delegation layer.
const COMMON_METHODS = [
  'goTab',                    // Navigates to a specific dashboard tab by slug
  'formatDate',               // Formats a date string to the app's long display format
  'formatShortDate',          // Formats a date string to a compact display format
  'openTrekDetailModal',      // Opens the trek detail modal for a given trek
  'openSlotModal',            // Opens the slot management modal for a given trek
  'saveSlots',                // Persists updated slot count for a trek to the API
  'openStatusModal',          // Opens the trek status change modal
  'saveStatus',               // Saves the new trek status to the API
  'selectTrekForParticipants',// Sets the active trek in the participants tab
  'slotColor',                // Returns a CSS class based on remaining slot count
  'slotPct',                  // Calculates and returns the slot fill percentage
  'slotsLeft',                // Returns the number of remaining open slots
  'isStatusAllowed',          // Returns true if a status transition is permitted
  'selectTrekForAttendance',  // Sets the active trek in the attendance tab
  'markStarted',              // Marks a trek as 'Started' / in-progress
  'openCompletionModal',      // Opens the trek completion confirmation modal
  'confirmCompletion',        // Confirms and sends the trek completion to the API
  'openAddParticipantModal',  // Opens the manual add-participant modal
  'addParticipant',           // Submits a new participant to the API
  'displayTrekkerId',         // Formats a trekker's member ID for display
  'paymentStatusClass',       // Returns the CSS class for a payment status badge
  'paymentStatusLabel',       // Returns the display label for a payment status code
  'cancelParticipant',        // Cancels (removes) a participant from a trek
  'backFromParticipantTrek',  // Navigates back from the per-trek participants view
  'setAttendance',            // Records attendance status for a participant on a day
  'backFromAttendanceTrek'    // Navigates back from the per-trek attendance view
];

// ── unique ────────────────────────────────────────────────────
// Returns a deduplicated version of a string array using a Set.
// Prevents duplicate computed/method names when callers pass
// extra names that overlap with the baseline lists above.
function unique(names) {
  return [...new Set(names)];
}

/**
 * proxyFields
 * -----------
 * Creates Vue computed getter/setter pairs for every field in the
 * merged list of COMMON_FIELDS + caller-supplied names.
 *
 * Each computed property tunnels through to the injected 'staffDash'
 * parent instance, so child tab components can reactively read and
 * write parent state as if those fields were their own data properties.
 *
 * Usage inside a child component options object:
 *   computed: { ...proxyFields(['myExtraField']) }
 *
 * @param {string[]} names - Additional field names to include beyond the common set.
 * @returns {object} Vue computed definitions map.
 */
export function proxyFields(names = []) {
  return Object.fromEntries(unique([...COMMON_FIELDS, ...names]).map((field) => [
    field,
    {
      get() {
        return this.staffDash[field]; // Read from parent controller
      },
      set(value) {
        this.staffDash[field] = value; // Write back to parent controller
      }
    }
  ]));
}

/**
 * proxyMethods
 * ------------
 * Creates method wrappers delegated directly to the parent 'staffDash' methods,
 * enabling child components to trigger centralized operations transparently.
 *
 * Each wrapper:
 *   1. Checks that the method exists on the parent (guards against typos).
 *   2. Forwards all arguments and returns the result unchanged.
 *
 * Usage inside a child component options object:
 *   methods: { ...proxyMethods(['myExtraMethod']) }
 *
 * @param {string[]} names - Additional method names to include beyond the common set.
 * @returns {object} Vue methods map.
 */
export function proxyMethods(names = []) {
  return Object.fromEntries(unique([...COMMON_METHODS, ...names]).map((method) => [
    method,
    function (...args) {
      // Guard: return undefined gracefully if the method doesn't exist on the parent
      if (typeof this.staffDash[method] !== 'function') return undefined;
      return this.staffDash[method](...args); // Delegate to parent controller
    }
  ]));
}

/**
 * staffDashComponent
 * ------------------
 * Standard factory helper for staff sub-tab component option objects.
 *
 * Automates the boilerplate required to:
 *   • inject the parent 'staffDash' controller
 *   • expose all reactive fields as computed proxies  (proxyFields)
 *   • expose all controller methods as delegating wrappers (proxyMethods)
 *   • merge component-local data, computed, methods, and lifecycle hooks
 *
 * @param {string}  name    - Component name (used for Vue DevTools display).
 * @param {object}  options - Component options:
 *   @param {string[]} [options.fields]   - Extra field names to proxy.
 *   @param {object}   [options.methods]  - Local method implementations (object form)
 *                                          or extra method names to proxy (array form).
 *   @param {object}   [options.computed] - Local-only computed properties.
 *   @param {function|object} [options.data] - Local data factory or plain object.
 *   @param {string[]} [options.emits]    - Emitted event names.
 *   @param {*}        [...rest]          - Any other Vue options (watch, mounted, etc.)
 *                                          are spread directly onto the component.
 * @returns {object} Vue component options object ready for the options API.
 */
export function staffDashComponent(name, options = {}) {
  // Destructure known options; everything else (watchers, lifecycle hooks, etc.)
  // is collected in 'rest' and spread onto the returned component object.
  const { fields, methods, computed, data, emits, ...rest } = options;

  return {
    name,
    inject: ['staffDash'],  // Receive the parent controller via provide/inject

    emits: emits || [],

    // Local data: support both a factory function and a plain object
    data() {
      const localData = typeof data === 'function' ? data.call(this) : (data || {});
      return {
        ...localData
      };
    },

    computed: {
      ...proxyFields(fields || []),  // Proxy all common fields + caller extras
      ...(computed || {})            // Merge any local computed properties
    },

    methods: {
      // Proxy method names extracted from the methods option (works for both
      // array of names and object whose keys are the method names)
      ...proxyMethods(methods ? Object.keys(methods) : []),
      ...(methods || {})             // Merge local method implementations
    },

    // Spread remaining options (watch, mounted, beforeUnmount, etc.)
    ...rest
  };
}
