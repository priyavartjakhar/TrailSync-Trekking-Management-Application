/**
 * =========================================================================
 * adminDashProxy.js
 * =========================================================================
 * Reactivity and Method bridge for Admin Dashboard tab components.
 *
 * This utility provides field and method proxy definitions to link the parent
 * `AdminDashboard.vue` layout coordinator state with sub-tab components.
 * It manages sharing of collections (users, staff, bookings, tickets) and
 * proxying of asynchronous CRUD actions (fetch, save, delete, confirm).
 *
 * Architecture overview:
 *   AdminDashboard.vue (parent / "controller")
 *     ├── provides 'adminDash' (itself) via Vue's provide/inject API
 *     └── Tab components (children) receive it via inject: ['adminDash']
 *
 * Each child tab calls adminDashComponent() which:
 *   1. Injects the parent controller as 'adminDash'
 *   2. Exposes all parent reactive fields as computed getters/setters
 *      (via proxyFields) so the child can read/write parent state
 *   3. Delegates all parent methods to the controller via proxyMethods
 *      so the child can trigger centralised API calls and UI actions
 */

// ── ADMIN_FIELDS ──────────────────────────────────────────────
// Exhaustive list of reactive data properties defined on the
// AdminDashboard.vue controller that sub-tab components need
// to access. Each name is exposed as a computed getter/setter
// in every child component (see proxyFields below).
//
// Grouped conceptually (alphabetical within each group):
//   • Navigation/layout      — activeTab, sidebarCollapsed, notifOpen …
//   • Data collections       — users, staffList, treks, allBookings …
//   • Analytics/chart data   — monthlyBookings, revenueData, userGrowth …
//   • Form / editing state   — editingTrek, trekForm, staffForm …
//   • Filter / search state  — bookingFilter, staffSearchQuery …
//   • Modal visibility flags — showTrekModal, showUserDetailsModal …
//   • Calendar / scheduling  — calendarMonth, calendarYear …
//   • Tooltip / hover state  — hoveredDifficulty, calendarTooltip …
const ADMIN_FIELDS = [
  "activeTab",              // Currently active dashboard tab slug
  "activityFeed",           // Live activity events list
  "alerts",                 // System alert objects
  "alertsAndTasks",         // Combined alerts + task items
  "allBookings",            // Full bookings array (all statuses)
  "assignStaffObj",         // Staff object selected for trek assignment
  "assignTrekId",           // Trek ID targeted for staff assignment
  "assignTrekObj",          // Trek object targeted for staff assignment
  "auditFilter",            // Active filter string for the audit log
  "auditLogs",              // Immutable admin audit log entries
  "availabilityEnd",        // End date for staff availability range check
  "availabilityStart",      // Start date for staff availability range check
  "availableStaff",         // Staff available for the checked date range
  "averageOccupancy",       // Average slot occupancy % across all treks
  "batchTrekkers",          // Trekkers enrolled in a selected batch
  "blacklistReasonText",    // Reason text entered in the blacklist modal
  "blacklistTargetUser",    // User object being blacklisted/un-blacklisted
  "blacklistedUsers",       // Array of currently blacklisted user accounts
  "batchDateFilter",        // Filter value for batch date column
  "batchGuideFilter",       // Filter value for batch assigned guide
  "batchSortFilter",        // Sort order applied to the batches table
  "bookingFilter",          // Status filter applied to bookings table
  "bookingStatusDist",      // Booking counts grouped by status (for donut)
  "bookingsStats",          // KPI cards for the bookings tab
  "calendarMonth",          // Currently displayed calendar month (0-indexed)
  "calendarSearchQuery",    // Search term applied in the calendar view
  "calendarTooltip",        // Tooltip object shown on calendar day hover
  "calendarYear",           // Currently displayed calendar year
  "checkedEnd",             // Resolved end date after availability check
  "checkedStart",           // Resolved start date after availability check
  "completedTreks",         // Treks with status 'Completed'
  "confirmBtnLabel",        // Label for the confirm modal's confirm button
  "confirmCallback",        // Callback to run if the user confirms
  "confirmMessage",         // Body text of the confirmation modal
  "confirmTitle",           // Title of the confirmation modal
  "confirmedBookingRate",   // Percentage of bookings in 'Confirmed' status
  "daysInActiveMonth",      // Array of day objects for the active calendar month
  "diffDonutData",          // Data for the difficulty distribution donut chart
  "difficultyDist",         // Trek counts grouped by difficulty level
  "editingRoute",           // Trek route object currently being edited
  "editingStaff",           // Staff object currently being edited
  "editingTrek",            // Trek object currently being edited
  "editingTrekker",         // Trekker object currently being edited
  "enrichedUpcomingTreks",  // Upcoming treks augmented with staff names etc.
  "filteredAudit",          // Audit log rows after filter is applied
  "filteredBookings",       // Booking rows matching active filters
  "filteredCalendarStaff",  // Staff shown in the calendar after search
  "filteredRoutes",         // Trek routes matching active filters
  "filteredStaff",          // Staff rows matching active filters
  "filteredStatesForRoute", // Indian states matching the route state filter
  "filteredTickets",        // Support tickets matching the status filter
  "filteredTreks",          // Trek rows matching active filters
  "filteredUsers",          // User rows matching active filters
  "hasCheckedRange",        // Whether an availability range check was run
  "hoveredBookingStatus",   // Status slice hovered in the booking donut chart
  "hoveredDifficulty",      // Difficulty slice hovered in the difficulty donut
  "hoveredLossStatus",      // Loss/refund slice hovered in the revenue chart
  "hoveredMonthlyBooking",  // Month bar hovered in the monthly bookings chart
  "hoveredPaymentStatus",   // Payment slice hovered in the payment donut
  "hoveredRevDifficulty",   // Difficulty slice hovered in the revenue chart
  "hoveredRevenueGrowth",   // Month hovered in the revenue growth line chart
  "iframeSrcDoc",           // HTML blob used for in-dashboard report preview
  "imageMode",              // Trek image input mode ('url' | 'upload')
  "indianStates",           // Lookup list of all Indian state names
  "locationDemand",         // Booking counts grouped by trek location
  "matchingActiveRoutes",   // Routes that match the user's search/filter
  "matchingActiveTreks",    // Treks available for the assign-trek dropdown
  "matchingBatchTrekkers",  // Trekkers matching batch participant search
  "matchingStaff",          // Staff matching the assign-staff search query
  "matchingTrekkerSearchResults", // Users found by trekker search
  "maxBookings",            // Max bookings value (used to scale chart bars)
  "maxLocationDemand",      // Max demand across all locations (chart scale)
  "maxMonthly",             // Max monthly bookings (chart scale reference)
  "maxPopularBookings",     // Max booking count across popular treks
  "maxRevenueByLocation",   // Max revenue by location (chart scale)
  "maxRevenueByTrek",       // Max revenue by trek (chart scale)
  "maxRevenueGrowthAmount", // Max revenue growth value (chart scale)
  "maxUserGrowth",          // Max user growth value (chart scale)
  "maxWorkload",            // Max staff workload value (chart scale)
  "monthlyBookings",        // Month-by-month booking count time series
  "notifOpen",              // Whether the notifications panel is open
  "notifications",          // Array of notification objects for the admin
  "occupancyRatePerTrek",   // Per-trek slot occupancy percentages
  "paymentStatusDist",      // Booking counts grouped by payment status
  "peopleStats",            // User and staff KPI stats
  "popularTreks",           // Top treks ranked by booking count
  "popularTreksWithMock",   // Popular treks padded with mock data if needed
  "recentBookings",         // The N most recent booking records
  "refundAnalytics",        // Refund/loss breakdown data
  "showRefundModal",        // Whether the process-refund modal is open
  "refundTarget",           // Booking object targeted for refund
  "refundAmountInput",      // Amount entered by admin in the refund modal
  "reportEndDate",          // End date bound to the report date range picker
  "reportPreviewData",      // Generated report data shown in the preview modal
  "reportStartDate",        // Start date bound to the report date range picker
  "reportTypeOptions",      // Available report type options for the dropdown
  "reportsList",            // List of previously generated reports
  "revenueByLocation",      // Revenue totals grouped by trek location
  "revenueByTrek",          // Revenue totals grouped by trek name
  "revenueData",            // Top-level revenue KPI summary object
  "revenueGrowthData",      // Month-over-month revenue growth time series
  "revenueKPIs",            // Revenue-tab KPI card data
  "revenuePerDifficulty",   // Revenue totals grouped by difficulty level
  "routeActiveFilter",      // Applied 'active/inactive' filter for routes
  "routeDaysFilter",        // Applied duration filter for routes
  "routeDiffFilter",        // Applied difficulty filter for routes
  "routeDistFilter",        // Applied distance filter for routes
  "routeForm",              // Form model for adding/editing a trek route
  "routeSearchQuery",       // Free-text search applied to routes
  "routeStateFilter",       // State filter applied to routes
  "routeStateSearchQuery",  // Search within the state filter dropdown
  "routeStates",            // Distinct states extracted from all routes
  "routeViewMode",          // Routes display mode ('table' | 'card')
  "scheduledJobs",          // Celery Beat scheduled task list
  "searchPlaceholder",      // Placeholder text for the global search input
  "searchQuery",            // Global search term value
  "selectedAssignStaffName",  // Display name of the staff chosen for assignment
  "selectedAssignTrekCode",   // Trek code of the trek chosen for assignment
  "selectedBatchDetails",     // Full details of the batch opened in the modal
  "selectedBookingDetails",   // Full details of the booking opened in the modal
  "selectedHistoryTrek",      // Trek chosen to view full trek history
  "selectedReportBatch",      // Batch selected for the report generator
  "selectedReportMonth",      // Month selected for the report generator
  "selectedReportStaff",      // Staff member selected for the report generator
  "selectedReportStaffSubtype",  // Sub-type filter for staff reports
  "selectedReportTrek",       // Trek selected for the report generator
  "selectedReportTrekSubtype",   // Sub-type filter for trek reports
  "selectedReportType",       // Report type selection ('booking', 'revenue', …)
  "selectedReportUser",       // User selected for the report generator
  "selectedReportUserSubtype",   // Sub-type filter for user reports
  "selectedRouteDetails",     // Full details of the route opened in the modal
  "selectedRouteDuration",    // Duration of the selected route
  "selectedRouteName",        // Display name of the selected route
  "selectedStaffDetails",     // Full details of the staff member in the modal
  "selectedStaffName",        // Display name of the selected staff member
  "selectedTicketDetails",    // Full details of the support ticket in the modal
  "selectedUser",             // Currently selected user object
  "selectedUserDetails",      // Full details of the user opened in the modal
  "showActiveFilterDropdown",   // Whether the active/inactive filter dropdown is open
  "showAssignModal",          // Whether the assign-staff-to-trek modal is open
  "showAssignStaffDropdown",  // Whether the staff selection dropdown is open
  "showAssignTrekDropdown",   // Whether the trek selection dropdown is open
  "showAssignTrekModal",      // Whether the assign-trek-to-staff modal is open
  "showBatchDetailsModal",    // Whether the batch details modal is open
  "showBlacklistModal",       // Whether the blacklist/un-blacklist modal is open
  "showBookingDetailsModal",  // Whether the booking details modal is open
  "showConfirmModal",         // Whether the generic confirmation modal is open
  "showDaysFilterDropdown",   // Whether the duration filter dropdown is open
  "showDiffFilterDropdown",   // Whether the difficulty filter dropdown is open
  "showDistFilterDropdown",   // Whether the distance filter dropdown is open
  "showFormDiffDropdown",     // Whether the difficulty dropdown in a form is open
  "showHistoryModal",         // Whether the trek history modal is open
  "showReportBatchDropdown",  // Whether the batch report dropdown is open
  "showReportMonthDropdown",  // Whether the month report dropdown is open
  "showReportPreviewModal",   // Whether the generated report preview modal is open
  "showReportStaffSubtypeDropdown",  // Whether the staff sub-type dropdown is open
  "showReportTrekDropdown",   // Whether the trek report dropdown is open
  "showReportTrekSubtypeDropdown",   // Whether the trek sub-type dropdown is open
  "showReportTypeDropdown",   // Whether the report type dropdown is open
  "showReportUserSubtypeDropdown",   // Whether the user sub-type dropdown is open
  "showRouteDetailsModal",    // Whether the route details modal is open
  "showRouteDropdown",        // Whether the route selection dropdown is open
  "showRouteModal",           // Whether the add/edit route modal is open
  "showRouteStateDropdown",   // Whether the route state filter dropdown is open
  "showStaffDetailsModal",    // Whether the staff details modal is open
  "showStaffDropdown",        // Whether the staff selection dropdown is open
  "showStaffModal",           // Whether the add/edit staff modal is open
  "showStateFilterDropdown",  // Whether the state filter dropdown is open
  "showTicketDetailsModal",   // Whether the support ticket details modal is open
  "showTrekModal",            // Whether the add/edit trek modal is open
  "showTrekSearch",           // Whether the trek search panel is visible
  "showTrekkerModal",         // Whether the add/edit trekker modal is open
  "showUserDetailsModal",     // Whether the user details modal is open
  "showUserModal",            // Whether the add/edit user modal is open
  "sidebarCollapsed",         // Whether the sidebar is in collapsed (icon-only) mode
  "slotUtilization",          // Per-trek slot occupancy data for charts
  "staffForm",                // Form model for adding/editing a staff member
  "staffImageMode",           // Staff photo input mode ('url' | 'upload')
  "staffLeaderboard",         // Staff ranked by number of treks completed
  "staffList",                // Full array of staff / guide accounts
  "staffSearchQuery",         // Search term applied to the staff table
  "staffSubtypeOptions",      // Available sub-type options for staff reports
  "staffViewMode",            // Staff display mode ('table' | 'card')
  "staffWorkload",            // Per-staff workload (active assigned treks)
  "stats",                    // Top-level admin KPI card data
  "statusDonutData",          // Data for the booking status donut chart
  "supportTickets",           // All support / help tickets
  "systemHealth",             // Real-time health status of backend services
  "tabTitles",                // Human-readable titles for each dashboard tab
  "tempRouteActiveFilter",    // Pending active/inactive filter (before apply)
  "tempRouteDaysFilter",      // Pending duration filter (before apply)
  "tempRouteDiffFilter",      // Pending difficulty filter (before apply)
  "tempRouteDistFilter",      // Pending distance filter (before apply)
  "tempRouteStateFilter",     // Pending state filter (before apply)
  "tempStaffId",              // Temporary staff ID used during assignment flow
  "tempTrekId",               // Temporary trek ID used during assignment flow
  "testStaffEmail",           // Email used for sending staff welcome test
  "testUserEmail",            // Email used for sending user welcome test
  "ticketStatusFilter",       // Status filter applied to support tickets
  "toast",                    // Toast notification object { message, type }
  "topPayingUsers",           // Users ranked by total amount paid
  "trekFilter",               // Status filter applied to the treks table
  "trekForm",                 // Form model for adding/editing a trek
  "trekRoutes",               // All trek route definitions
  "trekSearchQuery",          // Search term applied to the treks table
  "trekStatusOverview",       // Trek counts grouped by status (for overview)
  "trekSubtypeOptions",       // Available sub-type options for trek reports
  "trekkerForm",              // Form model for adding/editing a trekker
  "trekkerManageMode",        // Trekker management mode ('view' | 'edit')
  "treks",                    // Full array of all treks (all statuses)
  "treksStats",               // KPI cards for the treks tab
  "unreadNotifCount",         // Count of unread notifications (badge number)
  "upcomingTreks",            // Treks departing within the next N days
  "userFilter",               // Status filter applied to the users table
  "userGrowth",               // Month-over-month new registration counts
  "userSubtypeOptions",       // Available sub-type options for user reports
  "users"                     // Full array of all registered trekker accounts
];

// ── ADMIN_METHODS ─────────────────────────────────────────────
// Exhaustive list of methods defined on the AdminDashboard.vue
// controller that child tab components are allowed to call.
// Each name is exposed as a delegating wrapper in every child
// (see proxyMethods below).
const ADMIN_METHODS = [
  "applyData",              // Applies fetched API data to reactive state
  "buildAreaPath",          // Builds SVG 'd' attribute for an area chart
  "buildLinePath",          // Builds SVG 'd' attribute for a line chart
  "changeCalendarMonth",    // Advances or retreats the calendar by one month
  "checkRangeStatus",       // Checks staff availability over a date range
  "closeConfirmModal",      // Dismisses the generic confirmation modal
  "exportCSV",              // Triggers a CSV download for a given dataset
  "getConflictTrekForDay",  // Returns the trek conflicting with a staff on a day
  "getMonthName",           // Converts a month index to its display name
  "getWeekdayLetter",       // Returns the single-letter abbreviation for a weekday
  "handleGlobalClick",      // Handles document-level clicks (closes dropdowns)
  "handleTaskAction",       // Handles action buttons for scheduled Celery tasks
  "hideTooltip",            // Hides the calendar day tooltip
  "isStaffBusyOnDay",       // Returns true if a staff member is assigned on a date
  "isWeekend",              // Returns true if the given date is Saturday or Sunday
  "loadData",               // Triggers a full data refresh from the API
  "markAllRead",            // Marks all notifications as read
  "occColor",               // Returns a colour class based on occupancy percentage
  "onConfirmYes",           // Executes the stored callback when the user confirms
  "showTooltip",            // Shows the calendar day tooltip with trek details
  "showToast",              // Displays a transient toast notification message
  "stateFromLocation",      // Extracts the state name from a location string
  "toggleDayAvailability",  // Toggles a staff member's custom blocked date
  "triggerCheckRange",      // Initiates the staff availability range check
  "triggerConfirm",         // Opens the confirmation modal with a given message and callback
  "triggerJob",             // Manually triggers a Celery Beat scheduled job
  "triggerReport",          // Generates and previews a selected report type
  "triggerWelcomeTest",     // Sends a test welcome email to the specified address
  "openRouteModal",         // Opens the add/edit route modal
  "closeRouteModal",        // Closes the add/edit route modal
  "openTrekModal",          // Opens the add/edit trek batch modal
  "closeTrekModal",         // Closes the add/edit trek batch modal
  "openStaffModal",         // Opens the add/edit staff modal
  "closeStaffModal",        // Closes the add/edit staff modal
  "openTrekkerModal",       // Opens the add/edit trekker modal
  "closeTrekkerModal",      // Closes the add/edit trekker modal
  "formatDate"              // Formats a date string
];

// ── unique ────────────────────────────────────────────────────
// Returns a deduplicated version of a string array using a Set.
// Prevents duplicate computed/method names when callers pass
// extra names that overlap with the baseline lists.
function unique(names) {
  return [...new Set(names)];
}

// ── asNameList ────────────────────────────────────────────────
// Normalises the 'names' argument so that callers may pass
// either an Array of strings or a plain object (whose keys
// are the method names, matching Vue's 'methods' option shape).
// Returns an empty array for any other input type.
function asNameList(names) {
  if (Array.isArray(names)) return names;
  if (names && typeof names === 'object') return Object.keys(names);
  return [];
}

/**
 * proxyFields
 * -----------
 * Creates Vue computed getter/setter pairs for every field in the
 * merged list of ADMIN_FIELDS + caller-supplied names.
 *
 * Each computed property tunnels through to the injected 'adminDash'
 * parent instance, so child tab components can reactively read and
 * write parent state as if those fields were their own data properties.
 *
 * Usage inside a child component options object:
 *   computed: { ...proxyFields(['myExtraField']) }
 *
 * @param {string[]|object} names - Additional field names to include.
 * @returns {object} Vue computed definitions map.
 */
export function proxyFields(names = []) {
  return Object.fromEntries(unique([...ADMIN_FIELDS, ...asNameList(names)]).map((field) => [
    field,
    {
      get() {
        return this.adminDash[field]; // Read from parent controller
      },
      set(value) {
        this.adminDash[field] = value; // Write back to parent controller
      }
    }
  ]));
}

/**
 * proxyMethods
 * ------------
 * Creates method wrappers delegated directly to the parent 'adminDash' methods,
 * enabling child components to trigger centralized operations transparently.
 *
 * Each wrapper:
 *   1. Checks that the method exists on the parent (guards against typos).
 *   2. Forwards all arguments and returns the result unchanged.
 *
 * Usage inside a child component options object:
 *   methods: { ...proxyMethods(['myExtraMethod']) }
 *
 * @param {string[]|object} names - Additional method names to include.
 * @returns {object} Vue methods map.
 */
export function proxyMethods(names = []) {
  return Object.fromEntries(unique([...ADMIN_METHODS, ...asNameList(names)]).map((method) => [
    method,
    function (...args) {
      // Guard: return undefined gracefully if the method doesn't exist
      if (typeof this.adminDash[method] !== 'function') return undefined;
      return this.adminDash[method](...args); // Delegate to parent controller
    }
  ]));
}

/**
 * adminDashComponent
 * ------------------
 * Standard factory helper for admin sub-tab component option objects.
 *
 * Automates the boilerplate required to:
 *   • inject the parent 'adminDash' controller
 *   • expose all reactive fields as computed proxies (proxyFields)
 *   • expose all controller methods as delegating wrappers (proxyMethods)
 *   • merge any component-local computed properties and methods
 *
 * @param {string}  name    - Component name (used for Vue DevTools display).
 * @param {object}  options - Component options:
 *   @param {object}   [options.components]  - Child component registrations.
 *   @param {string[]} [options.emits]       - Emitted event names.
 *   @param {string[]|object} [options.fields]   - Extra field names to proxy.
 *   @param {object}  [options.computed]    - Local-only computed properties.
 *   @param {string[]|object} [options.methods]  - Extra/local methods.
 * @returns {object} Vue component options object ready for defineComponent / options API.
 */
export function adminDashComponent(name, options = {}) {
  // Extract local methods so we can spread them separately from the proxy wrappers.
  // Array-style 'methods' (just names) have no local implementations to merge.
  const localMethods = options.methods && !Array.isArray(options.methods) ? options.methods : {};

  return {
    name,
    inject: ['adminDash'],          // Receive the parent controller via provide/inject
    components: options.components || {},
    emits: options.emits || [],
    computed: {
      ...proxyFields(options.fields || []),  // Proxy all admin fields + extras
      ...(options.computed || {})            // Merge any local computed properties
    },
    methods: {
      ...proxyMethods(options.methods || []), // Proxy all admin methods + extras
      ...localMethods                         // Merge any local method implementations
    }
  };
}
