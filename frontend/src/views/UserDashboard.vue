<template>
  <div class="ts-user-layout">

    <!-- ── LAYOUT BRANCH: WITH SIDEBAR ──────────────────────────────── -->
    <!-- Rendered when `showSidebar` is true (desktop / normal view). -->
    <!-- Sidebar component -->
    <template v-if="showSidebar">
      <UserSidebar
        :active-tab="activeTab"
        :sidebar-open="sidebarOpen"
        :sidebar-collapsed="sidebarCollapsed"
        :profile="profile"
        :my-bookings="myBookings"
        :unread-count="hasUnreadAnnouncements ? 1 : 0"
        @change-tab="goTab"
        @close-sidebar="closeSidebar"
        @logout="handleLogout"
      />

      <!-- ── MAIN CONTENT WRAPPER (SIDEBAR-AWARE) ──────────────────── -->
      <!-- Applies `.expanded` class when sidebar is collapsed to reclaim horizontal space. -->
      <div class="ts-main-content" :class="{ expanded: sidebarCollapsed }">
        <!-- Overlay for mobile drawer -->
        <div class="sidebar-overlay" :class="{ visible: sidebarOpen }" @click="closeSidebar"></div>

      <!-- ── TOPBAR ───────────────────────────────────────────────── -->
      <UserTopbar
        :active-tab="activeTab"
        :sidebar-collapsed="sidebarCollapsed"
        :show-sidebar-toggle="showSidebar"
        :profile="profile"
        v-model:search-query="searchQuery"
        @open-sidebar="openSidebar"
        @change-tab="goTab"
        @logout="handleLogout"
      />

      <!-- ── PAGE CONTENT / TAB ROUTER ─────────────────────────────── -->
      <!-- Each tab is conditionally rendered via v-if; only one is mounted at a time. -->
      <div class="page-content">
        <!-- Dashboard Tab -->
        <TabDashboard
          v-if="activeTab === 'dashboard'"
          :profile="profile"
          :my-bookings="myBookings"
          :trek-history="trekHistory"
          :available-treks="availableTreks"
          :achievements="achievements"
          :weather="weather"
          :countdown-vals="countdownVals"
          :community-posts="communityPosts"
          @view-guide="openGuideModal"
          @view-checklist="openChecklistModal"
          @change-tab="goTab"
          @update-search="searchQuery = $event"
          @cancel-booking="cancelBooking"
        />

        <!-- Explore Tab -->
        <TabExplore
          v-if="activeTab === 'explore'"
          :available-treks="availableTreks"
          :initial-search-query="searchQuery"
          @book-trek="openBookingModal"
          @change-tab="goTab"
        />

        <!-- Bookings Tab -->
        <TabBookings
          v-if="activeTab === 'bookings'"
          :my-bookings="myBookings"
          :trek-history="trekHistory"
          @view-checklist="openChecklistModal"
          @view-guide="openGuideModal"
          @cancel-booking="cancelBooking"
          @pay-booking="payPendingBooking"
          @change-tab="goTab"
        />

        <!-- History Tab -->
        <TabHistory
          v-if="activeTab === 'history'"
          :trek-history="trekHistory"
          @change-tab="goTab"
          @show-toast="showToast"
        />

        <!-- Profile Tab -->
        <TabProfile
          v-if="activeTab === 'profile'"
          :profile="profile"
          @profile-updated="fetchUserData"
          @logout="handleLogout"
          @change-tab="goTab"
          @show-toast="showToast"
        />


        <!-- Support Tab -->
        <TabSupport
          v-if="activeTab === 'support'"
          :profile="profile"
          @change-tab="goTab"
          @show-toast="showToast"
        />

        <!-- Social Tab -->
        <TabSocial
          v-if="activeTab === 'social'"
          :profile="profile"
          :social-groups="socialGroups"
          @change-tab="goTab"
          @view-fellow-profile="openSocialProfileModal"
          @refresh-groups="fetchSocialGroupsSilent"
          @show-toast="showToast"
        />
      </div>
      </div>
    </template>

    <!-- ── LAYOUT BRANCH: WITHOUT SIDEBAR ──────────────────────────── -->
    <!-- Shown when `showSidebar` is false (e.g., embedded mode or very small screens). -->
    <!-- Sidebar is omitted; content always uses the fully-expanded layout. -->
    <template v-else>
      <div class="ts-main-content" :class="{ expanded: true }">
        <UserTopbar
          :active-tab="activeTab"
          :sidebar-collapsed="true"
          :show-sidebar-toggle="false"
          :profile="profile"
          v-model:search-query="searchQuery"
          @change-tab="goTab"
          @logout="handleLogout"
        />

        <div class="page-content">
          <TabDashboard
            v-if="activeTab === 'dashboard'"
            :profile="profile"
            :my-bookings="myBookings"
            :trek-history="trekHistory"
            :available-treks="availableTreks"
            :achievements="achievements"
            :weather="weather"
            :countdown-vals="countdownVals"
            :community-posts="communityPosts"
            @view-guide="openGuideModal"
            @view-checklist="openChecklistModal"
            @change-tab="goTab"
            @update-search="searchQuery = $event"
            @cancel-booking="cancelBooking"
          />

          <TabExplore
            v-if="activeTab === 'explore'"
            :available-treks="availableTreks"
            :initial-search-query="searchQuery"
            @book-trek="openBookingModal"
            @change-tab="goTab"
          />

          <TabBookings
            v-if="activeTab === 'bookings'"
            :my-bookings="myBookings"
            :trek-history="trekHistory"
            @view-checklist="openChecklistModal"
            @view-guide="openGuideModal"
            @cancel-booking="cancelBooking"
            @pay-booking="payPendingBooking"
            @change-tab="goTab"
          />

          <TabHistory
            v-if="activeTab === 'history'"
            :trek-history="trekHistory"
            @change-tab="goTab"
            @show-toast="showToast"
          />

          <TabProfile
            v-if="activeTab === 'profile'"
            :profile="profile"
            @profile-updated="fetchUserData"
            @logout="handleLogout"
            @change-tab="goTab"
            @show-toast="showToast"
          />

          <TabSupport
            v-if="activeTab === 'support'"
            :profile="profile"
            @change-tab="goTab"
            @show-toast="showToast"
          />

          <TabSocial
            v-if="activeTab === 'social'"
            :profile="profile"
            :social-groups="socialGroups"
            @change-tab="goTab"
            @view-fellow-profile="openSocialProfileModal"
            @refresh-groups="fetchSocialGroupsSilent"
            @show-toast="showToast"
          />
        </div>
      </div>
    </template>

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
                <div style="font-size: 0.85rem; color: var(--stone); margin-bottom: 0.75rem;"><span class="css-loc-pin" style="background:var(--gold)"></span>{{ bookingTarget.place ? bookingTarget.place + ', ' : '' }}{{ bookingTarget.location }}</div>

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
                      <span style="font-size: 0.78rem; color: var(--stone);">👤 Guide: <strong>{{ b.staff || 'To be decided' }}</strong></span>
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
    <GuideModal :show="showGuideModal" :guide="guideTarget" @close="showGuideModal = false" />

    <!-- ── CHECKLIST MODAL ────────────────────────── -->
    <ChecklistModal :show="showChecklistModal" :booking="checklistTargetBooking" @close="showChecklistModal = false" @show-toast="showToast" />

    <!-- ── SIMULATED PAYMENT MODAL ────────────────── -->
    <PaymentModal
      :show="showPaymentModal"
      :payment-trek-batch="paymentTrekBatch"
      :is-pending-retry="isPendingRetry"
      :retry-booking-id="retryBookingId"
      @close="dismissPaymentModal"
      @payment-success="fetchUserData"
      @show-toast="showToast"
    />

    <!-- ── CANCEL BOOKING CONFIRMATION MODAL ─────────── -->
    <transition name="modal">
      <div v-if="showCancelConfirm" class="ts-modal-overlay" @click.self="showCancelConfirm = false">
        <div class="ts-confirm-dialog">
          <div class="ts-confirm-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width: 36px; height: 36px; color: #ef4444;">
              <circle cx="12" cy="12" r="10"/>
              <line x1="15" y1="9" x2="9" y2="15"/>
              <line x1="9" y1="9" x2="15" y2="15"/>
            </svg>
          </div>
          <div class="ts-confirm-title">Cancel Booking?</div>
          <div class="ts-confirm-text">
            Are you sure you want to cancel your booking for
            <strong>{{ cancelTarget ? cancelTarget.trekName : '' }}</strong>?
            This action cannot be undone.
          </div>
          <div class="ts-confirm-actions">
            <button class="ts-confirm-btn ts-confirm-btn--cancel" @click="showCancelConfirm = false">Keep Booking</button>
            <button class="ts-confirm-btn ts-confirm-btn--danger" @click="confirmCancelBooking">Yes, Cancel</button>
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
</template>

<script>
/**
 * =========================================================================
 * User (Trekker) Dashboard View Component
 * =========================================================================
 * This is the root wrapper for the Trekker dashboard. It handles all state
 * management, UI drawers, modals, countdown timers, API integration, and
 * passes down data to individual tab view components.
 */

import {
  USER_AVAILABLE_TREKS,
  USER_MY_BOOKINGS,
  USER_TREK_HISTORY,
  USER_INITIAL_PROFILE,
  USER_ACHIEVEMENTS
} from '../data/user_data.js';

import UserSidebar from '../components/trekker_dash_components/UserSidebar.vue';
import UserTopbar from '../components/trekker_dash_components/UserTopbar.vue';
import TabDashboard from '../components/trekker_dash_components/TabDashboard.vue';
import TabExplore from '../components/trekker_dash_components/TabExplore.vue';
import TabBookings from '../components/trekker_dash_components/TabBookings.vue';
import TabHistory from '../components/trekker_dash_components/TabHistory.vue';
import TabProfile from '../components/trekker_dash_components/TabProfile.vue';
import TabSupport from '../components/trekker_dash_components/TabSupport.vue';
import TabSocial from '../components/trekker_dash_components/TabSocial.vue';

import GuideModal from '../components/trekker_dash_components/GuideModal.vue';
import ChecklistModal from '../components/trekker_dash_components/ChecklistModal.vue';
import PaymentModal from '../components/trekker_dash_components/PaymentModal.vue';

export default {
  components: {
    UserSidebar,
    UserTopbar,
    TabDashboard,
    TabExplore,
    TabBookings,
    TabHistory,
    TabProfile,
    TabSupport,
    TabSocial,
    GuideModal,
    ChecklistModal,
    PaymentModal
  },

  name: 'TsUserLayout',
  emits: ['logout'],

  data() {
    return {
      // ── UI STATE ──────────────────────────────────────────────────────
      // Controls which dashboard tab is currently visible.
      activeTab: 'dashboard',
      // Whether the mobile drawer sidebar is slid open.
      sidebarOpen: false,
      // Whether the desktop sidebar is collapsed to icon-only mode.
      sidebarCollapsed: true,
      // Master flag: hides the entire sidebar (e.g., for embedded / no-nav mode).
      showSidebar: true,
      // Toast notification state: show flag, message text, and type ('success'|'error'|'info').
      toast: { show: false, msg: '', type: 'success' },
      // Controls visibility of the profile quick-access dropdown in the topbar.
      showProfileDropdown: false,

      // ── USER DATA ────────────────────────────────────────────────────
      // Logged-in trekker's profile (name, email, photo, fitness level, etc.).
      profile: { ...USER_INITIAL_PROFILE },
      // Full list of treks available for booking; deep-cloned to prevent mutation of the source.
      availableTreks: JSON.parse(JSON.stringify(USER_AVAILABLE_TREKS)),
      // Active and past (non-history) bookings made by this trekker.
      myBookings: JSON.parse(JSON.stringify(USER_MY_BOOKINGS)),
      // Completed trek records used for the History tab and analytics.
      trekHistory: JSON.parse(JSON.stringify(USER_TREK_HISTORY)),
      // Earned achievement/badge objects shown on the Dashboard.
      achievements: JSON.parse(JSON.stringify(USER_ACHIEVEMENTS)),

      // ── BOOKING MODAL STATE ──────────────────────────────────────────
      // Whether the trek-detail / batch-selection booking modal is open.
      showBookingModal: false,
      // The trek object currently being viewed inside the booking modal.
      bookingTarget: null,
      // User must accept terms before completing a booking (controlled inside modal).
      termsAccepted: false,

      // ── PAYMENT MODAL STATE ──────────────────────────────────────────
      // Whether the simulated payment flow modal is open.
      showPaymentModal: false,
      // Batch/trek metadata passed to PaymentModal to display order summary.
      paymentTrekBatch: null,
      // True when re-opening the payment modal for a previously pending booking.
      isPendingRetry: false,
      // The booking ID being retried so PaymentModal can PATCH the correct record.
      retryBookingId: null,

      // ── CANCEL BOOKING CONFIRM STATE ─────────────────────────────────
      // Whether the "Are you sure?" cancel-booking confirmation dialog is visible.
      showCancelConfirm: false,
      // The booking object staged for cancellation; cleared after confirmation or dismiss.
      cancelTarget: null,

      // ── FILTER STATE (Explore tab) ────────────────────────────────────
      // Live text typed into the global search bar.
      searchQuery: '',
      // Difficulty filter value: 'Easy' | 'Moderate' | 'Hard' | ''.
      difficultyFilter: '',
      // Free-text location filter string.
      locationFilter: '',
      // Duration-range filter string.
      durationFilter: '',
      // Quick-filter chip value: 'All' | 'Easy' | 'Moderate' | 'Hard' | 'Bookable'.
      quickFilter: 'All',
      // When true, only treks with at least one available slot are shown.
      showBookableOnly: false,
      // Dropdown open-states for each filter panel.
      showDiffFilterDropdown: false,
      showLocFilterDropdown: false,
      showDurFilterDropdown: false,

      // ── COUNTDOWN TIMER ──────────────────────────────────────────────
      // Reference to the setInterval handle for the next-trek countdown (cleared on unmount).
      countdownTimer: null,
      // Current decomposed time remaining until the next upcoming trek starts.
      countdownVals: { days: 0, hours: 0, minutes: 0, seconds: 0 },

      // ── GUIDE MODAL STATE ────────────────────────────────────────────
      // Whether the guide profile modal is open.
      showGuideModal: false,
      // The guide object to render inside GuideModal.
      guideTarget: null,

      // ── CHECKLIST MODAL STATE ────────────────────────────────────────
      // Whether the pre-trek packing checklist modal is open.
      showChecklistModal: false,
      // The booking associated with the checklist being viewed.
      checklistTargetBooking: null,

      // ── WEATHER WIDGET STATE ─────────────────────────────────────────
      // Real-time weather data fetched from Open-Meteo for the next trek's coordinates.
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

      // ── COMMUNITY FEED ───────────────────────────────────────────────
      // Static community story posts displayed on the Dashboard tab.
      // Each entry: { id, author, avatar (initials), title, trekName, text, likes, comments, img }.
      communityPosts: [
        { id: 1, author: 'Aarav Mehta', avatar: 'AM', title: 'Tada Falls Wonder', trekName: 'Tada Falls Trek', text: 'Navigating the rocky stream beds and slippery boulders of Tada Falls was challenging but incredibly rewarding. The final pool of crystal-clear water cascading down the red cliffs was the perfect reward. We spent hours swimming and enjoying the absolute tranquility of the deep forest.', likes: 24, comments: 5, img: 'https://images.unsplash.com/photo-1544644181-1484b3fdfc62?w=600&fit=crop' },
        { id: 2, author: 'Nisha Sharma', avatar: 'NS', title: 'Kedarkantha Summit!', trekName: 'Kedarkantha Trek', text: 'The summit climb started at 3 AM under a canopy of brilliant stars. The temperature dropped to -6°C, freezing our water bottles, but the final push to the top was magical. Watching the golden sun rise over the snow-capped Himalayan peaks was a deeply spiritual experience I will cherish forever.', likes: 142, comments: 18, img: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=600&fit=crop' },
        { id: 3, author: 'Kabir Dev', avatar: 'KD', title: 'Valley of Flowers Bloom', trekName: 'Valley of Flowers', text: 'Trekking through the valley in late July was like walking into a painting. Hundreds of varieties of wild alpine flowers carpeted the landscape as far as the eye could see. The gentle mist rolling over the mountains and the absolute silence made the journey feel like a dream.', likes: 89, comments: 12, img: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=600&fit=crop' },
        { id: 4, author: 'Priya Verma', avatar: 'PV', title: 'Crossing Hampta Pass', trekName: 'Hampta Pass', text: 'The dramatic transition of scenery on this trek is mind-blowing. One day you are walking through the lush green forests of Kullu, and the next you cross the pass into the cold, barren, rock-strewn desert of Spiti. Camping next to the turquoise waters of Chandratal lake was the highlight of our trip.', likes: 76, comments: 9, img: 'https://images.unsplash.com/photo-1454496522488-7a8e488e8606?w=600&fit=crop' },
        { id: 5, author: 'Rohan Sen', avatar: 'RS', title: 'Nagalapuram Ridge Climb', trekName: 'Nagalapuram Falls Trek', text: 'The trail started with dry deciduous scrubs but soon transitioned into a lush gorge filled with deep water pools. Climbing the steep ridges gave us panoramic views of the Andhra plains below. Jumping into the cool, deep freshwater pools at the end of the day made all the sweat worthwhile.', likes: 53, comments: 7, img: 'https://images.unsplash.com/photo-1501555088652-021faa106b9b?w=600&fit=crop' },
        { id: 6, author: 'Meera Joshi', avatar: 'MJ', title: 'Mystical Talle Valley', trekName: 'Talle Valley Trek', text: "Arunachal's dense bamboo and pine forests are unlike anything else in India. The trail was covered in rich moss and giant ferns, with occasional rains adding to the mystical atmosphere. Spotting a rare cloud leopard track in the soft mud made us realize how wild and untouched this sanctuary is.", likes: 110, comments: 14, img: 'https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?w=600&fit=crop' }
      ],

      // ── SOCIAL / GROUPS STATE ─────────────────────────────────────────
      // List of TrailSync Social groups the trekker belongs to; refreshed every 15 s.
      socialGroups: [],
      // True when any joined group has an unread announcement; drives the notification dot.
      hasUnreadAnnouncements: false,

      // ── SOCIAL PROFILE MODAL STATE ───────────────────────────────────
      // Whether the fellow-trekker / guide quick-profile modal is open.
      showSocialProfileModal: false,
      // The user or guide object being previewed in the social profile modal.
      socialProfileTarget: null
    };
  },

  computed: {
    /**
     * Returns the earliest upcoming confirmed booking whose end date has not yet passed.
     * Used to drive the countdown timer and the Dashboard hero card.
     * @returns {Object|null} The next booking object, or null if none are upcoming.
     */
    nextTrek() {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const booked = this.myBookings.filter(b => {
        if (b.status !== 'Booked') return false;
        if (!b.endDate) return true;
        const parts = b.endDate.split('-');
        if (parts.length !== 3) return true;
        const end = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
        return end >= today;
      });
      if (!booked.length) return null;
      return booked.sort((a, b) => new Date(a.startDate) - new Date(b.startDate))[0];
    },
    /**
     * Returns a Set of trek IDs that the trekker currently has an active 'Booked' booking for.
     * Used by `isBooked()` to quickly check batch/trek booking status in O(1).
     * @returns {Set<string|number>}
     */
    bookedTrekIds() {
      return new Set(this.myBookings.filter(b => b.status === 'Booked').map(b => b.trekId));
    }
  },

  methods: {
    /**
     * Adjusts sidebar visibility when the browser window is resized.
     * On desktop (>900 px) the mobile drawer is force-closed;
     * on mobile, the collapsed state mirrors whether the drawer is open.
     * Bound to the window `resize` event in `mounted()`.
     */
    handleViewportResize() {
      const isMobile = window.innerWidth <= 900;
      if (!isMobile) {
        this.sidebarOpen = false;
      } else if (this.sidebarOpen) {
        this.sidebarCollapsed = false;
      } else {
        this.sidebarCollapsed = true;
      }
    },
    /**
     * Opens the sidebar drawer (on mobile) or expands it (on desktop).
     */
    openSidebar() {
      if (window.innerWidth <= 900) {
        this.sidebarOpen = true;
        this.sidebarCollapsed = false;
      } else {
        this.sidebarCollapsed = false;
      }
    },
    /**
     * Closes the sidebar drawer (on mobile) or collapses it (on desktop).
     */
    closeSidebar() {
      this.sidebarOpen = false;
      this.sidebarCollapsed = true;
    },
    /**
     * Public navigation handler — updates the URL hash to trigger a tab change.
     * If the requested tab is already active (same hash), calls `activateTab` directly
     * to avoid a no-op hash-change event being swallowed by the browser.
     * @param {string} tab - One of the valid tab identifiers.
     */
    goTab(tab) {
      const validTabs = ['dashboard', 'explore', 'bookings', 'history', 'profile', 'support', 'social'];
      if (!validTabs.includes(tab)) return;
      let targetHash = tab;
      if (window.location.hash.slice(1) === targetHash) {
        this.activateTab(tab);
        return;
      }
      window.location.hash = targetHash;
    },
    /**
     * Internal method that actually switches the active tab, persists the choice to
     * localStorage, closes the mobile sidebar drawer, and resets scroll position.
     * Also triggers a fresh social groups fetch when switching to the Social tab.
     * @param {string} tab - Validated tab identifier.
     */
    activateTab(tab) {
      const validTabs = ['dashboard', 'explore', 'bookings', 'history', 'profile', 'support', 'social'];
      if (!tab || !validTabs.includes(tab)) return;
      if (tab !== 'explore') {
        this.searchQuery = '';
      }
      this.activeTab = tab;
      if (tab === 'social') this.fetchSocialGroups();
      if (window.innerWidth <= 900) {
        this.sidebarOpen = false;
        this.sidebarCollapsed = true;
      }
      localStorage.setItem('userActiveTab', tab);
      this.resetPageScroll();
    },
    /**
     * Responds to browser `hashchange` events (back/forward navigation or direct URL entry).
     * Handles the special `social/group/<id>` deep-link format by routing to the Social tab.
     */
    handleHashChange() {
      const hash = window.location.hash.slice(1);
      if (hash.startsWith('social/group/')) this.activeTab = 'social';
      else this.activateTab(hash);
    },
    /**
     * Scrolls both the window and the `.page-content` scroll container back to the top
     * after a tab switch. Uses `$nextTick` so the new tab's DOM is rendered first.
     */
    resetPageScroll() {
      this.$nextTick(() => {
        window.scrollTo(0, 0);
        const el = this.$el ? this.$el.querySelector('.page-content') : document.querySelector('.page-content');
        if (el) { el.scrollTop = 0; }
      });
    },
    /**
     * Returns true if the trekker already has an active 'Booked' booking for the given trek/batch ID.
     * @param {string|number} trekId - The trek or batch ID to check.
     * @returns {boolean}
     */
    isBooked(trekId) { return this.bookedTrekIds.has(trekId); },
    /**
     * Converts a raw date string (YYYY-MM-DD or YYYY-MM-DD HH:MM) into a human-readable
     * format like "14 Jun 2025" with optional time suffix.
     * @param {string} dateStr - ISO-style date string from the API or data file.
     * @returns {string} Formatted date, or '—' if input is falsy.
     */
    formatDate(dateStr) {
      if (!dateStr) return '—';
      const parts = dateStr.split(' ');
      const dParts = parts[0].split('-');
      if (dParts.length !== 3) return dateStr;
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      return `${parseInt(dParts[2])} ${monthNames[parseInt(dParts[1]) - 1]} ${dParts[0]}${parts[1] ? ' ' + parts[1] : ''}`;
    },
    /**
     * Initiates a fresh booking for a selected batch by opening the payment modal.
     * Clears any pending-retry state to ensure a new booking flow.
     * @param {Object} batch - The batch object selected from the booking modal's batch list.
     */
    bookBatch(batch) {
      this.paymentTrekBatch = batch;
      this.isPendingRetry = false;
      this.retryBookingId = null;
      this.showPaymentModal = true;
    },
    /**
     * Re-opens the payment modal for an existing booking whose payment is Pending or Failed.
     * Flags the flow as a retry so PaymentModal knows to PATCH rather than create a new booking.
     * @param {Object} b - The booking object with pending/failed payment.
     */
    payPendingBooking(b) {
      this.paymentTrekBatch = { id: b.trekId, name: b.trekName, location: b.location, price: b.price || b.bookingPrice || 5000, batchCode: b.batchCode || 'N/A', bookingId: b.bookingId };
      this.isPendingRetry = true;
      this.retryBookingId = b.id;
      this.showPaymentModal = true;
    },
    /**
     * Closes both the payment and booking modals. If `shouldFetch` is true (default),
     * re-fetches all user data from the API and redirects to the Bookings tab to show
     * the newly confirmed booking.
     * @param {boolean} [shouldFetch=true] - Whether to refresh dashboard data after closing.
     */
    async dismissPaymentModal(shouldFetch = true) {
      this.showPaymentModal = false;
      this.showBookingModal = false;
      if (shouldFetch) { await this.fetchUserData(); this.goTab('bookings'); }
    },
    /**
     * Opens the trek detail & batch-selection modal for the given trek.
     * Resets `termsAccepted` so the user must re-check terms for each new booking.
     * @param {Object} t - The trek object to display.
     */
    openBookingModal(t) { this.bookingTarget = t; this.termsAccepted = false; this.showBookingModal = true; },
    /**
     * Stages a booking for cancellation and shows the confirmation dialog.
     * The actual API call is deferred to `confirmCancelBooking()`.
     * @param {Object} b - The booking object the trekker wishes to cancel.
     */
    cancelBooking(b) { this.cancelTarget = b; this.showCancelConfirm = true; },
    /**
     * Sends a POST request to cancel the booking stored in `cancelTarget`.
     * Closes the confirmation dialog immediately, then shows a toast on success or failure.
     * Side effect: calls `fetchUserData()` on success to refresh the bookings list.
     */
    async confirmCancelBooking() {
      const b = this.cancelTarget;
      this.showCancelConfirm = false;
      this.cancelTarget = null;
      if (!b) return;
      try {
        const res = await fetch(`/api/bookings/cancel/${b.id}`, { method: 'POST' });
        const data = await res.json();
        if (res.ok) { this.showToast(data.message || 'Booking cancelled', 'info'); await this.fetchUserData(); }
        else { this.showToast(data.error || 'Cancel failed', 'error'); }
      } catch (e) { this.showToast('Failed to contact server.', 'error'); }
    },
    /**
     * Primary data-loader: fetches all personalised dashboard data from the server
     * in a single API call and hydrates `availableTreks`, `myBookings`, `trekHistory`,
     * and `profile`. Also triggers a weather refresh for the next trek's location.
     * Falls back to the existing local data if the request fails.
     */
    async fetchUserData() {
      try {
        const res = await fetch('/api/user/dashboard_data');
        if (res.ok) {
          const data = await res.json();
          this.availableTreks = data.available_treks || this.availableTreks;
          this.myBookings = data.my_bookings || this.myBookings;
          this.trekHistory = data.trek_history || this.trekHistory;
          this.profile = data.profile || this.profile;
          this.fetchWeather();
        }
      } catch (e) { console.error(e); }
    },
    /**
     * Fetches the trekker's joined social groups from the API and updates the
     * `hasUnreadAnnouncements` flag used to show the notification dot on the Social nav item.
     * Errors are logged to the console.
     */
    async fetchSocialGroups() {
      try {
        const res = await fetch('/api/social/groups');
        if (res.ok) { this.socialGroups = await res.json(); this.hasUnreadAnnouncements = this.socialGroups.some(g => g.hasUnreadAnnouncement); }
      } catch (e) { console.error(e); }
    },
    /**
     * Silent background refresh of social groups — identical to `fetchSocialGroups` but
     * swallows errors without logging. Called every 15 seconds by `socialPollInterval`
     * to keep the unread-announcement badge current without disrupting the UI.
     */
    async fetchSocialGroupsSilent() {
      try {
        const res = await fetch('/api/social/groups');
        if (res.ok) { this.socialGroups = await res.json(); this.hasUnreadAnnouncements = this.socialGroups.some(g => g.hasUnreadAnnouncement); }
      } catch (_) {}
    },
    /**
     * Opens the guide profile modal for the given guide object.
     * Guards against null/undefined so accidental clicks on bookings without a guide are safe.
     * @param {Object} guide - Guide profile object (name, phone, photo, etc.).
     */
    openGuideModal(guide) { if (guide) { this.guideTarget = guide; this.showGuideModal = true; } },
    /**
     * Opens the packing checklist modal pre-loaded with the specified booking context.
     * @param {Object} booking - The booking whose checklist should be displayed.
     */
    async openChecklistModal(booking) { this.checklistTargetBooking = booking; this.showChecklistModal = true; },
    /**
     * Fetches current weather conditions from the Open-Meteo API for the coordinates
     * of the trekker's next upcoming trek. Populates `weather.temp`, `humidity`, and
     * `windSpeed`. Sets `weather.error` on network failure.
     * Skips the call if there is no upcoming trek or coordinates are missing.
     */
    async fetchWeather() {
      const trek = this.nextTrek;
      if (!trek || trek.latitude === undefined) return;
      this.weather.loading = true;
      try {
        const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${trek.latitude}&longitude=${trek.longitude}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code`);
        if (res.ok) {
          const data = await res.json();
          this.weather.temp = Math.round(data.current.temperature_2m);
          this.weather.humidity = data.current.relative_humidity_2m;
          this.weather.windSpeed = data.current.wind_speed_10m;
        }
      } catch (e) { this.weather.error = true; } finally { this.weather.loading = false; }
    },
    /**
     * Starts (or restarts) a 1-second interval that decomposes the remaining time until
     * the next trek's start date into days, hours, minutes, and seconds, updating
     * `countdownVals` each tick. Stops updating once the diff reaches zero.
     * Side effect: clears any previously running timer before creating a new one.
     */
    startCountdown() {
      if (this.countdownTimer) clearInterval(this.countdownTimer);
      this.countdownTimer = setInterval(() => {
        const trek = this.nextTrek;
        if (!trek) return;
        const diff = new Date(trek.startDate).getTime() - Date.now();
        if (diff <= 0) return;
        this.countdownVals = { days: Math.floor(diff / 86400000), hours: Math.floor((diff % 86400000) / 3600000), minutes: Math.floor((diff % 3600000) / 60000), seconds: Math.floor((diff % 60000) / 1000) };
      }, 1000);
    },
    /**
     * Displays a transient toast notification for 4 seconds.
     * @param {string} msg - The message text to show.
     * @param {'success'|'error'|'info'} [type='success'] - Visual variant of the toast.
     */
    showToast(msg, type = 'success') { this.toast = { show: true, msg, type }; setTimeout(() => { this.toast.show = false; }, 4000); },
    /**
     * Handles user logout: stops the social polling interval, removes the persisted
     * active-tab key from localStorage, then emits 'logout' to the parent (App.vue)
     * which tears down the session and redirects to the login screen.
     */
    handleLogout() {
      if (this.socialPollInterval) clearInterval(this.socialPollInterval);
      localStorage.removeItem('userActiveTab');
      this.$emit('logout');
    },
    /**
     * Closes all open filter/profile dropdowns. Bound to `document` click events so that
     * clicking anywhere outside a dropdown dismisses it gracefully.
     */
    closeDropdowns() { this.showProfileDropdown = false; this.showDiffFilterDropdown = false; this.showLocFilterDropdown = false; this.showDurFilterDropdown = false; }
  },

  /**
   * Lifecycle hook — runs after the component is inserted into the DOM.
   * Registers viewport resize, hash-change, and global click listeners;
   * loads initial dashboard data; starts the countdown timer; resolves the
   * active tab from the URL hash or localStorage; and boots the 15-second
   * social-group polling interval.
   */
  mounted() {
    window.addEventListener('resize', this.handleViewportResize);
    this.handleViewportResize();
    this.fetchUserData();
    this.startCountdown();
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

    if (this.activeTab === 'social') {
      this.fetchSocialGroups();
    }

    // SILENT POLLING for social notification updates (checks for unread announcements)
    this.socialPollInterval = setInterval(() => {
      this.fetchSocialGroupsSilent();
    }, 15000);
  },

  /**
   * Lifecycle hook — runs just before the component is destroyed.
   * Removes all registered event listeners and clears both the countdown timer
   * and the social polling interval to prevent memory leaks.
   */
  beforeUnmount() {
    window.removeEventListener('resize', this.handleViewportResize);
    if (this.countdownTimer) clearInterval(this.countdownTimer);
    if (this.socialPollInterval) clearInterval(this.socialPollInterval);
    window.removeEventListener('hashchange', this.hashListener);
    document.removeEventListener('click', this.clickListener);
  },
};
</script>
