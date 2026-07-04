<template>
  <div class="ts-user-layout">
    <!-- Toast Notification -->
    <transition name="toast">
      <div v-if="toast.show" :class="['toast-notification', toast.type]">
        <div style="display: flex; align-items: center; gap: 8px;">
          <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" fill="none" stroke-width="2">
            <path v-if="toast.type === 'success'" d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline v-if="toast.type === 'success'" points="22 4 12 14.01 9 11.01" />
            <circle v-else cx="12" cy="12" r="10" />
            <line v-if="toast.type !== 'success'" x1="12" y1="8" x2="12" y2="12" />
            <line v-if="toast.type !== 'success'" x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          {{ toast.msg }}
        </div>
      </div>
    </transition>

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

      <!-- Main Content wrapper -->
      <div class="ts-main-content" :class="{ expanded: sidebarCollapsed }">
        <!-- Overlay for mobile drawer -->
        <div class="sidebar-overlay" :class="{ visible: sidebarOpen }" @click="closeSidebar"></div>

      <!-- Topbar component -->
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

      <!-- Page Content -->
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
          :export-pending="exportPending"
          @change-tab="goTab"
          @request-export="requestExport"
        />

        <!-- Profile Tab -->
        <TabProfile
          v-if="activeTab === 'profile'"
          :profile="profile"
          :export-pending="exportPending"
          @update-profile="saveProfile"
          @update-password="changePassword"
          @change-tab="goTab"
          @request-export="requestExport"
          @delete-account="deleteAccount"
        />


        <!-- Support Tab -->
        <TabSupport
          v-if="activeTab === 'support'"
          :profile="profile"
          :support-tickets="supportTickets"
          :loading-support="loadingSupport"
          :submitting-support="submittingSupport"
          @submit-ticket="submitSupportTicket"
          @change-tab="goTab"
        />

        <!-- Social Tab -->
        <TabSocial
          v-if="activeTab === 'social'"
          :profile="profile"
          :social-groups="socialGroups"
          :selected-social-trek-id="selectedSocialTrekId"
          :social-group-members-list="socialGroupMembersList"
          :current-group-messages="currentGroupMessages"
          :current-group-announcements="currentGroupAnnouncements"
          :selected-social-group-trek="selectedSocialGroupTrek"
          @change-tab="goTab"
          @select-group="selectSocialGroup"
          @close-chat="closeSocialChat"
          @send-message="sendSocialMessage"
          @view-fellow-profile="openSocialProfileModal"
        />
      </div>
      </div>
    </template>

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
            :export-pending="exportPending"
            @change-tab="goTab"
            @request-export="requestExport"
          />

          <TabProfile
            v-if="activeTab === 'profile'"
            :profile="profile"
            :export-pending="exportPending"
            @update-profile="saveProfile"
            @update-password="changePassword"
            @change-tab="goTab"
            @request-export="requestExport"
            @delete-account="deleteAccount"
          />

          <TabSupport
            v-if="activeTab === 'support'"
            :profile="profile"
            :support-tickets="supportTickets"
            :loading-support="loadingSupport"
            :submitting-support="submittingSupport"
            @submit-ticket="submitSupportTicket"
            @change-tab="goTab"
          />

          <TabSocial
            v-if="activeTab === 'social'"
            :profile="profile"
            :social-groups="socialGroups"
            :selected-social-trek-id="selectedSocialTrekId"
            :social-group-members-list="socialGroupMembersList"
            :current-group-messages="currentGroupMessages"
            :current-group-announcements="currentGroupAnnouncements"
            :selected-social-group-trek="selectedSocialGroupTrek"
            @change-tab="goTab"
            @select-group="selectSocialGroup"
            @close-chat="closeSocialChat"
            @send-message="sendSocialMessage"
            @view-fellow-profile="openSocialProfileModal"
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
        <div class="ts-modal" style="max-width: 520px; border: none; box-shadow: 0 20px 50px rgba(0,0,0,0.3);">
          
          <!-- Header -->
          <div class="pay-sim-modal-header d-flex justify-content-between align-items-center">
            <div>
              <div class="ts-modal-title pay-sim-title">Select Payment Method</div>
              <div class="pay-sim-subtitle">Choose how you want to confirm this trek booking.</div>
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
                  <strong><i class="bi bi-geo-alt-fill"></i> {{ paymentTrekBatch.place ? paymentTrekBatch.place + ', ' : '' }}{{ paymentTrekBatch.location }}</strong>
                </div>
                <div class="pay-sim-row" v-if="paymentTrekBatch.batchCode">
                  <span>Batch ID</span>
                  <strong class="mono" style="color: var(--gold-dark);">{{ paymentTrekBatch.batchCode }}</strong>
                </div>
                <div class="pay-sim-row">
                  <span>Booking ID</span>
                  <span class="mono" style="font-size: 0.75rem;">{{ isPendingRetry ? paymentTrekBatch.bookingId : 'Pending Generation' }}</span>
                </div>
                <div class="pay-sim-row total">
                  <span>Total Amount</span>
                  <span>₹{{ paymentTrekBatch.price.toLocaleString() }}</span>
                </div>
              </div>

              <!-- Payment Methods -->
              <div v-if="!selectedPaymentMethod" class="pay-sim-method-section">
                <label class="pay-sim-section-label">Select Payment Method</label>
                <div class="pay-sim-methods">
                  <button type="button" class="pay-sim-method-card" @click="selectedPaymentMethod = 'UPI'">
                    <span class="pay-sim-method-icon"><i class="bi bi-lightning-charge-fill"></i></span>
                    <span class="pay-sim-method-copy">
                      <strong>UPI</strong>
                      <small>Pay using any UPI ID</small>
                    </span>
                    <i class="bi bi-chevron-right"></i>
                  </button>
                  <button type="button" class="pay-sim-method-card" @click="selectedPaymentMethod = 'Netbanking'">
                    <span class="pay-sim-method-icon"><i class="bi bi-bank"></i></span>
                    <span class="pay-sim-method-copy">
                      <strong>Netbanking</strong>
                      <small>Select your bank account</small>
                    </span>
                    <i class="bi bi-chevron-right"></i>
                  </button>
                  <button type="button" class="pay-sim-method-card" @click="selectedPaymentMethod = 'EMI'">
                    <span class="pay-sim-method-icon"><i class="bi bi-calendar2-check"></i></span>
                    <span class="pay-sim-method-copy">
                      <strong>EMI Options</strong>
                      <small>Split the trek fee</small>
                    </span>
                    <i class="bi bi-chevron-right"></i>
                  </button>
                  <button type="button" class="pay-sim-method-card" @click="selectedPaymentMethod = 'Card'">
                    <span class="pay-sim-method-icon"><i class="bi bi-credit-card-2-front-fill"></i></span>
                    <span class="pay-sim-method-copy">
                      <strong>Card (Debit/Credit)</strong>
                      <small>Use card details</small>
                    </span>
                    <i class="bi bi-chevron-right"></i>
                  </button>
                  <button type="button" class="pay-sim-method-card" @click="selectedPaymentMethod = 'PayLater'">
                    <span class="pay-sim-method-icon"><i class="bi bi-cash-coin"></i></span>
                    <span class="pay-sim-method-copy">
                      <strong>Pay Later / Pay at Base Camp</strong>
                      <small>Reserve now, pay before trek</small>
                    </span>
                    <i class="bi bi-chevron-right"></i>
                  </button>
                </div>
              </div>

              <template v-else>
                <div class="pay-sim-selected-head">
                  <div>
                    <span class="pay-sim-selected-label">Selected Method</span>
                    <strong>{{ paymentMethodLabel(selectedPaymentMethod) }}</strong>
                  </div>
                  <button type="button" class="pay-sim-change-btn" @click="selectedPaymentMethod = ''">
                    <i class="bi bi-arrow-left"></i> Change Payment Method
                  </button>
                </div>

                <!-- Interactive Fields: UPI -->
                <div v-if="selectedPaymentMethod === 'UPI'" class="pay-sim-card-view">
                  <label class="pay-sim-field-label">UPI Virtual Payment Address (VPA)</label>
                  <div class="position-relative">
                    <input type="text" class="pay-sim-input has-action" placeholder="e.g. trekker@upi" v-model="paymentDetails.upiId" />
                    <div class="pay-sim-input-action">
                      <button type="button" class="pay-sim-mini-btn" @click="paymentDetails.upiId = 'trek@okaxis'">Use demo</button>
                    </div>
                  </div>
                  <div class="pay-sim-help">Enter any UPI ID to continue.</div>
                </div>

                <!-- Interactive Fields: Card -->
                <div v-if="selectedPaymentMethod === 'Card'" class="pay-sim-card-view">
                  <div class="pay-sim-field">
                    <label class="pay-sim-field-label">Cardholder Name</label>
                    <input type="text" class="pay-sim-input" placeholder="e.g. Priyavart Jakhar" v-model="paymentDetails.cardName" />
                  </div>
                  <div class="pay-sim-field">
                    <label class="pay-sim-field-label">Card Number</label>
                    <input type="text" class="pay-sim-input" placeholder="4111 2222 3333 4444" :value="paymentDetails.cardNumber" @input="onCardNumberInput" />
                  </div>
                  <div class="pay-sim-two-col">
                    <div>
                      <label class="pay-sim-field-label">Expiry Date</label>
                      <input type="text" class="pay-sim-input" placeholder="MM/YY" :value="paymentDetails.cardExpiry" @input="onCardExpiryInput" />
                    </div>
                    <div>
                      <label class="pay-sim-field-label">CVV Code</label>
                      <input type="password" class="pay-sim-input" placeholder="•••" :value="paymentDetails.cardCvv" @input="onCardCvvInput" />
                    </div>
                  </div>
                </div>

                <!-- Interactive Fields: Netbanking -->
                <div v-if="selectedPaymentMethod === 'Netbanking'" class="pay-sim-card-view">
                  <div class="pay-sim-field">
                    <label class="pay-sim-field-label">Select Bank</label>
                    <select class="pay-sim-input" v-model="paymentDetails.bank">
                      <option>State Bank of India</option>
                      <option>HDFC Bank</option>
                      <option>ICICI Bank</option>
                      <option>Axis Bank</option>
                      <option>Kotak Mahindra Bank</option>
                    </select>
                  </div>
                  <div class="pay-sim-field">
                    <label class="pay-sim-field-label">Customer ID / User ID</label>
                    <input type="text" class="pay-sim-input" placeholder="Enter bank user ID" v-model="paymentDetails.bankUserId" />
                  </div>
                  <div class="pay-sim-help">Your bank selection will be used for this payment.</div>
                </div>

                <!-- Interactive Fields: EMI -->
                <div v-if="selectedPaymentMethod === 'EMI'" class="pay-sim-card-view">
                  <div class="pay-sim-field">
                    <label class="pay-sim-field-label">EMI Provider</label>
                    <select class="pay-sim-input" v-model="paymentDetails.emiProvider">
                      <option>HDFC Bank</option>
                      <option>ICICI Bank</option>
                      <option>Axis Bank</option>
                      <option>Bajaj Finance</option>
                    </select>
                  </div>
                  <div class="pay-sim-field">
                    <label class="pay-sim-field-label">Tenure</label>
                    <select class="pay-sim-input" v-model="paymentDetails.emiTenure">
                      <option>3 months</option>
                      <option>6 months</option>
                      <option>9 months</option>
                      <option>12 months</option>
                    </select>
                  </div>
                  <div class="pay-sim-help">EMI approval is prepared for this booking flow.</div>
                </div>

                <!-- Interactive Fields: Pay Later -->
                <div v-if="selectedPaymentMethod === 'PayLater'" class="pay-sim-card-view pay-sim-offline-note">
                  <div class="pay-sim-offline-icon"><i class="bi bi-geo-alt-fill"></i></div>
                  <div>
                    <strong>Pay at Base Camp</strong>
                    <p>Your seat will be reserved now and the booking will stay pending until payment is collected at base camp.</p>
                  </div>
                </div>

                <!-- Action Buttons -->
                <div class="pay-sim-actions">
                  <button type="button" @click="processSelectedPayment" class="pay-sim-btn success">
                    <span><i class="bi bi-shield-check"></i></span>
                    {{ selectedPaymentMethod === 'PayLater' ? 'Pay Later' : 'Pay' }} (₹{{ paymentTrekBatch.price.toLocaleString() }})
                  </button>
                  <button type="button" class="pay-sim-btn cancel" @click="dismissPaymentModal(false)">
                    Cancel Payment
                  </button>
                </div>
              </template>
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
                    <span>Booking ID</span>
                    <strong class="mono">{{ paymentResultBookingId }}</strong>
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

                <button class="pay-sim-bookings-btn" @click="dismissPaymentModal(true)">
                  Go to My Bookings <i class="bi bi-arrow-right"></i>
                </button>
              </div>
            </template>

            <!-- STATE 4: Pending Screen -->
            <template v-if="paymentResultState === 'Pending'">
              <div class="pay-sim-result-wrap">
                <div class="pay-sim-icon-circle pending"><i class="bi bi-hourglass-split"></i></div>
                <div class="pay-sim-result-title">Offline / Pending Booking</div>
                <div class="pay-sim-result-text">Your booking has been reserved. The payment is marked pending and can be completed at base camp.</div>
                
                <div class="pay-sim-receipt-summary">
                  <div class="pay-sim-row" style="margin-bottom: 4px;">
                    <span>Trek Booking</span>
                    <strong>{{ paymentTrekBatch.name }}</strong>
                  </div>
                  <div class="pay-sim-row" style="margin-bottom: 4px;">
                    <span>Booking ID</span>
                    <strong class="mono">{{ paymentResultBookingId }}</strong>
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

                <button class="pay-sim-bookings-btn" @click="dismissPaymentModal(true)">
                  Go to My Bookings <i class="bi bi-arrow-right"></i>
                </button>
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

        </div>
      </div>
    </transition>

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

import {
  USER_INITIAL_NAME,
  USER_AVAILABLE_TREKS,
  USER_MY_BOOKINGS,
  USER_TREK_HISTORY,
  USER_INITIAL_PROFILE,
  USER_ACHIEVEMENTS
} from '../user_data.js';

import UserSidebar from '../components/trekker_dash_components/UserSidebar.vue';
import UserTopbar from '../components/trekker_dash_components/UserTopbar.vue';
import TabDashboard from '../components/trekker_dash_components/TabDashboard.vue';
import TabExplore from '../components/trekker_dash_components/TabExplore.vue';
import TabBookings from '../components/trekker_dash_components/TabBookings.vue';
import TabHistory from '../components/trekker_dash_components/TabHistory.vue';
import TabProfile from '../components/trekker_dash_components/TabProfile.vue';
import TabSupport from '../components/trekker_dash_components/TabSupport.vue';
import TabSocial from '../components/trekker_dash_components/TabSocial.vue';

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
    TabSocial
  },

  name: 'TsUserLayout',
  emits: ['logout'],

  data() {
    return {
      // ── UI STATE ──────────────────────────────────
      activeTab: 'dashboard',
      sidebarOpen: false,
      sidebarCollapsed: false,
      showSidebar: false,
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
      selectedPaymentMethod: '',
      isPendingRetry: false,
      retryBookingId: null,

      // ── CANCEL CONFIRMATION MODAL ──────────────────
      showCancelConfirm: false,
      cancelTarget: null,

      // ── SIMULATED PAYMENT GATEWAY STATE ───────────
      paymentProcessing: false,
      paymentProcessingMsg: '',
      paymentProcessingProgress: 0,
      paymentResultState: null,
      paymentResultBookingId: '',
      paymentDetails: {
        cardNumber: '',
        cardName: '',
        cardExpiry: '',
        cardCvv: '',
        upiId: '',
        bank: 'State Bank of India',
        bankUserId: '',
        emiProvider: 'HDFC Bank',
        emiTenure: '3 months'
      },

      // ── SEARCH / FILTERS ─────────────────────────
      searchQuery: '',
      difficultyFilter: '',
      locationFilter: '',
      durationFilter: '',
      quickFilter: 'All',
      showBookableOnly: false,
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
        .reduce((a, h) => a + (h.amountPaid || h.bookingPrice || h.price || 0), 0)
        + this.myBookings
          .filter(b => b.status === 'Booked')
          .reduce((a, b) => a + (b.amountPaid || b.bookingPrice || b.price || 0), 0);
      return [
        { label: 'Active Bookings', value: active, icon: 'calendar', color: 'si-gold', trend: '' },
        { label: 'Treks Completed', value: completed, icon: 'check', color: 'si-forest', trend: '' },
        { label: 'Available Treks', value: this.availableTreks.length, icon: 'map', color: 'si-green', trend: '' },
        { label: 'Total Invested', value: '₹' + totalSpent.toLocaleString(), icon: 'rupee', color: 'si-blue', trend: '' },
      ];
    },

    // Next upcoming booked trek
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
        const matchBookable = !this.showBookableOnly || this.hasBookableSlots(t);
        return matchSearch && matchDiff && matchLoc && matchDur && matchQuick && matchBookable;
      });
    },

    bookableTreksCount() {
      return this.availableTreks.filter(t => this.hasBookableSlots(t)).length;
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
    handleViewportResize() {
      const isMobile = window.innerWidth <= 900;
      if (!isMobile) {
        this.sidebarOpen = false;
        this.sidebarCollapsed = false;
      } else if (this.sidebarOpen) {
        this.sidebarCollapsed = false;
      } else {
        this.sidebarCollapsed = true;
      }
    },
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
      if (window.innerWidth <= 900) {
        this.sidebarOpen = true;
        this.sidebarCollapsed = false;
      } else {
        this.sidebarOpen = false;
        this.sidebarCollapsed = false;
      }
    },
    closeSidebar() {
      this.sidebarOpen = false;
      this.sidebarCollapsed = true;
    },
    toggleMobileSidebar() {
      if (window.innerWidth <= 900) {
        this.sidebarOpen = !this.sidebarOpen;
        this.sidebarCollapsed = !this.sidebarOpen;
      } else {
        this.sidebarOpen = false;
        this.sidebarCollapsed = false;
      }
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
    hasBookableSlots(t) {
      if (Array.isArray(t.batches) && t.batches.length) {
        return t.batches.some(b => this.slotsLeft(b) > 0);
      }
      return this.slotsLeft(t) > 0;
    },
    slotsLeft(t) { return Math.max(0, Number(t?.slots || 0) - Number(t?.booked || 0)); },
    slotsPct(t) { return Math.min(100, Math.round((Number(t.booked || 0) / Number(t.slots || 1)) * 100)); },
    slotsClass(t) {
      const p = Number(t.booked || 0) / Number(t.slots || 1);
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
        batchCode: b.batchCode || 'N/A',
        bookingId: b.bookingId
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
      this.selectedPaymentMethod = '';
      this.paymentDetails = {
        cardNumber: '',
        cardName: '',
        cardExpiry: '',
        cardCvv: '',
        upiId: '',
        bank: 'State Bank of India',
        bankUserId: '',
        emiProvider: 'HDFC Bank',
        emiTenure: '3 months'
      };
    },
    async dismissPaymentModal(shouldFetch = true) {
      this.showPaymentModal = false;
      this.showBookingModal = false;
      this.paymentResultState = null;
      if (shouldFetch) {
        await this.fetchUserData();
        this.goTab('bookings');
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
    paymentMethodLabel(method) {
      const labels = {
        UPI: 'UPI',
        Netbanking: 'Netbanking',
        EMI: 'EMI Options',
        Card: 'Card (Debit/Credit)',
        PayLater: 'Pay Later / Pay at Base Camp'
      };
      return labels[method] || 'Payment Method';
    },
    processSelectedPayment() {
      if (!this.selectedPaymentMethod) {
        this.showToast('Select a payment method first.', 'warning');
        return;
      }
      if (this.selectedPaymentMethod === 'PayLater') {
        this.processOfflinePayment();
        return;
      }
      this.processSimulatedPayment('Paid');
    },
    async submitPaymentStatus(status) {
      let res, data;
      const payment_method = this.selectedPaymentMethod || 'Direct Booking (Auto-Paid)';
      let details = {};
      if (this.selectedPaymentMethod === 'Card') {
        details = { cardName: this.paymentDetails.cardName, cardNumber: this.paymentDetails.cardNumber };
      } else if (this.selectedPaymentMethod === 'UPI') {
        details = { upiId: this.paymentDetails.upiId };
      } else if (this.selectedPaymentMethod === 'Netbanking') {
        details = { bank: this.paymentDetails.bank, bankUserId: this.paymentDetails.bankUserId };
      } else if (this.selectedPaymentMethod === 'EMI') {
        details = { emiProvider: this.paymentDetails.emiProvider, emiTenure: this.paymentDetails.emiTenure };
      }
      if (this.isPendingRetry) {
        res = await fetch(`/api/bookings/pay/${this.retryBookingId}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            payment_status: status,
            payment_method: payment_method,
            payment_details: details
          })
        });
        data = await res.json();
      } else {
        res = await fetch('/api/bookings/book', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            trek_id: this.paymentTrekBatch.id,
            payment_status: status,
            payment_method: payment_method,
            payment_details: details
          })
        });
        data = await res.json();
      }
      return { res, data };
    },
    async processOfflinePayment() {
      if (!this.paymentTrekBatch) return;
      try {
        const { res, data } = await this.submitPaymentStatus('Pending');
        if (res.ok) {
          this.paymentResultBookingId = data.unique_booking_id || ('#' + data.booking_id) || '—';
          this.paymentResultState = 'Pending';
          this.showToast(data.message || 'Booking saved as pending. Pay at base camp.', 'warning');
        } else {
          this.paymentResultState = 'Failed';
          this.showToast(data.error || 'Could not save pending booking', 'error');
        }
      } catch (e) {
        console.error('Payment error:', e);
        this.paymentResultState = 'Failed';
        this.showToast('Failed to contact server. Booking could not be saved.', 'error');
      }
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
        const { res, data } = await this.submitPaymentStatus(status);

        this.paymentProcessingProgress = 100;
        await sleep(350);

        if (res.ok) {
          this.paymentResultBookingId = data.unique_booking_id || ('#' + data.booking_id) || '—';
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
          body: JSON.stringify({
            trek_id: t.id,
            payment_status: 'Paid',
            payment_method: 'Direct Booking (Auto-Paid)',
            payment_details: {}
          })
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

    cancelBooking(b) {
      this.cancelTarget = b;
      this.showCancelConfirm = true;
    },
    async confirmCancelBooking() {
      const b = this.cancelTarget;
      this.showCancelConfirm = false;
      this.cancelTarget = null;
      if (!b) return;
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
    async saveProfile(payload) {
      if (payload) {
        const fields = payload.updatedFields || payload;
        this.editProfile = { ...this.editProfile, ...fields };
        if (payload.profileImageFile) {
          this.profileImageFile = payload.profileImageFile;
        }
      }
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
          if (payload && typeof payload.successCallback === 'function') {
            payload.successCallback();
          }
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

    async changePassword(payload) {
      if (payload && payload.pwForm) {
        this.pwForm = payload.pwForm;
      }
      if (!this.pwForm.current || !this.pwForm.new) {
        this.showToast('Please fill all password fields', 'error');
        if (payload && payload.errorCallback) payload.errorCallback();
        return;
      }
      if (this.pwForm.new !== this.pwForm.confirm) {
        this.showToast("New passwords don't match", 'error');
        if (payload && payload.errorCallback) payload.errorCallback();
        return;
      }
      if (this.pwForm.new.length < 6) {
        this.showToast('Password must be at least 6 characters', 'error');
        if (payload && payload.errorCallback) payload.errorCallback();
        return;
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
          if (payload && payload.successCallback) payload.successCallback();
        } else {
          this.showToast(data.error || 'Update failed.', 'error');
          if (payload && payload.errorCallback) payload.errorCallback();
        }
      } catch (e) {
        console.error('Password change error:', e);
        this.showToast('Failed to contact server. Password not updated.', 'error');
      }
    },

    async deleteAccount() {
      try {
        const res = await fetch('/api/user/delete', {
          method: 'DELETE'
        });
        const data = await res.json();
        if (res.ok) {
          this.showToast(data.message || 'Account successfully deleted.', 'success');
          this.$emit('logout');
        } else {
          this.showToast(data.error || 'Failed to delete account.', 'error');
        }
      } catch (e) {
        console.error('Delete account error:', e);
        this.showToast('Failed to contact server. Account deletion failed.', 'error');
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
    async submitSupportTicket(payload) {
      if (payload && payload.form) {
        this.supportForm = payload.form;
      }
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
          if (payload && payload.successCallback) payload.successCallback();
          await this.fetchUserTickets();
        } else {
          const data = await res.json();
          this.showToast(data.error || 'Failed to submit ticket.', 'error');
          if (payload && payload.errorCallback) payload.errorCallback();
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
    async sendSocialMessage(messageText) {
      const text = messageText || this.newSocialMessageText;
      if (!text || !text.trim()) return;
      if (!messageText) {
        this.newSocialMessageText = '';
      }
      try {
        const cleanedText = text.trim();
        const res = await fetch(`/api/social/group/${this.selectedSocialTrekId}/messages`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messageText: cleanedText })
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
    closeSocialChat() {
      this.selectedSocialTrekId = null;
      this.newSocialMessageText = '';
      this.socialGroupMembersList = [];
      window.location.hash = 'social';
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
    window.addEventListener('resize', this.handleViewportResize);
    this.handleViewportResize();
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
    window.removeEventListener('resize', this.handleViewportResize);
    if (this.countdownTimer) clearInterval(this.countdownTimer);
    if (this.socialPollInterval) clearInterval(this.socialPollInterval);
    window.removeEventListener('hashchange', this.hashListener);
    document.removeEventListener('click', this.clickListener);
  },
};
</script>
