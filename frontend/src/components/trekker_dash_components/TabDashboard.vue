<template>
        <section >

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
                  <div v-if="!nextTrek" class="empty-state">
                    <svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                    <p>No upcoming treks. <a @click="goTab('explore')">Browse open treks →</a></p>
                  </div>
                  <div v-else class="bookings-stack">
                    <div v-if="nextTrek" class="booking-row">
                      <div class="booking-accent" :class="'ba-' + nextTrek.difficulty.toLowerCase()"></div>
                      <div class="booking-main">
                        <div class="booking-trek-name">{{ nextTrek.trekName }}</div>
                        <div class="booking-loc"><span class="css-loc-pin"></span>{{ nextTrek.place ? nextTrek.place + ', ' : '' }}{{ nextTrek.location }}</div>
                        <div class="booking-dates mono">{{ formatDate(nextTrek.startDate) }} → {{ formatDate(nextTrek.endDate) }}</div>
                        <div v-if="nextTrek.guide" class="booking-guide-info" style="font-size: 0.78rem; color: var(--stone); margin-top: 6px; display: flex; align-items: center; gap: 8px;">
                          <span>👤 Guide: <strong>{{ nextTrek.guide.name }}</strong> ({{ nextTrek.guide.phone }})</span>
                          <button style="color: var(--forest); font-weight: 600; cursor: pointer; border: none; background: none; padding: 0; font-size: 0.78rem; text-decoration: underline;" @click="openGuideModal(nextTrek.guide)">View Profile</button>
                        </div>
                        <div class="booking-details-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 8px; margin-top: 10px; padding-top: 8px; border-top: 1px dashed rgba(26,46,26,0.08); font-size: 0.78rem; color: var(--stone);">
                          <div><strong>Booking ID:</strong> <span class="mono" style="color: var(--bark);">{{ nextTrek.bookingId || ('#' + nextTrek.id) }}</span></div>
                          <div><strong>Trek ID:</strong> <span class="mono" style="color: var(--bark);">{{ nextTrek.trekCode || ('TID' + String(nextTrek.trekId).padStart(3, '0')) }}</span></div>
                          <div><strong>Batch ID:</strong> <span class="mono" style="color: var(--bark);">{{ nextTrek.batchCode || nextTrek.batchId || '—' }}</span></div>
                          <div><strong>Payment Method:</strong> <span style="color: var(--bark);">{{ nextTrek.paymentMethod || 'Pending' }}</span></div>
                          <div><strong>Payment Details:</strong> <span style="color: var(--bark);">{{ nextTrek.paymentDetails || 'Pending' }}</span></div>
                        </div>
                      </div>
                      <div class="booking-meta">
                        <div class="bm-row"><span class="bm-label">Status</span><span class="status-pill status-booked">Booked</span></div>
                        <div class="bm-row"><span class="bm-label">Amount</span><span class="bm-price">₹{{ (nextTrek.amountPaid || nextTrek.bookingPrice || nextTrek.price || 0).toLocaleString() }}</span></div>
                        <div class="bm-row"><span class="bm-label">Difficulty</span><span :class="'diff-pill pill='+nextTrek.difficulty.toLowerCase()">{{nextTrek.difficulty}}</span></div>
                        <div style="display: flex; gap: 0.5rem; margin-top: 0.5rem; width: 100%;">
                          <button v-if="isTrekDateNotPassed(nextTrek.startDate)" class="btn-cancel" @click="cancelBooking(nextTrek)" style="flex: 1;">Cancel</button>
                          <button class="btn-outline" @click="openChecklistModal(nextTrek)" style="flex: 1.5; padding: 0.35rem 0.5rem; font-size: 0.72rem; border-radius: 4px; border: 1px solid var(--forest); color: var(--forest); background: transparent; cursor: pointer; font-weight: 600; display: flex; align-items: center; justify-content: center; gap: 2px;">📋 Checklist</button>
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
                  <div class="up-loc"><span class="css-loc-pin"></span>{{ nextTrek.place ? nextTrek.place + ', ' : '' }}{{ nextTrek.location }}</div>
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
                      {{ t.place ? t.place + ", " : "" }}{{ t.location }}
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
                      {{ t.place ? t.place + ", " : "" }}{{ t.location }}
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
                      {{ t.place ? t.place + ", " : "" }}{{ t.location }}
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
</template>

<script>
/**
 * =========================================================================
 * TabDashboard.vue
 * =========================================================================
 * Standard hiker dashboard showing stats (total treks completed, investment, active bookings), weather widgets, and next trek countdown.
 * Standard Vue component using custom props parameters input and events emitters
 * to communicate with parent 'UserDashboard'.
 */

export default {
  name: 'TabDashboard',
  props: {
    profile: { type: Object, required: true },
    myBookings: { type: Array, default: () => [] },
    trekHistory: { type: Array, default: () => [] },
    availableTreks: { type: Array, default: () => [] },
    achievements: { type: Array, default: () => [] },
    weather: { type: Object, required: true },
    countdownVals: { type: Object, required: true },
    communityPosts: { type: Array, default: () => [] }
  },
  emits: ['view-guide', 'view-checklist', 'change-tab', 'cancel-booking', 'update-search'],
  computed: {
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
        { label: 'Total Invested', value: '₹' + totalSpent.toLocaleString(), icon: 'rupee', color: 'si-bold', trend: '' }
      ];
    },
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
    dashboardEasyTreks() {
      return this.availableTreks.filter(t => t.difficulty === 'Easy').slice(0, 3);
    },
    dashboardModerateTreks() {
      return this.availableTreks.filter(t => t.difficulty === 'Moderate').slice(0, 3);
    },
    dashboardHardTreks() {
      return this.availableTreks.filter(t => t.difficulty === 'Hard').slice(0, 3);
    }
  },
  methods: {
    goTab(tab) {
      this.$emit('change-tab', tab);
    },
    openGuideModal(guide) {
      this.$emit('view-guide', guide);
    },
    openChecklistModal(booking) {
      this.$emit('view-checklist', booking);
    },
    cancelBooking(booking) {
      this.$emit('cancel-booking', booking);
    },
    navigateToTrek(trekName) {
      this.goTab('explore');
      this.$nextTick(() => {
        this.$emit('update-search', trekName);
      });
    },
    formatDate(dateStr) {
      if (!dateStr) return '';
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    },
    isTrekDateNotPassed(dateStr) {
      if (!dateStr || dateStr === '—') return false;
      const parts = dateStr.split('-');
      const start = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return start >= today;
    },
    getGradient(t) {
      const diff = t.difficulty.toLowerCase();
      if (diff === 'easy') return 'linear-gradient(135deg, #2e5c36, #162e1a)';
      if (diff === 'moderate') return 'linear-gradient(135deg, #1c355e, #0e1b30)';
      return 'linear-gradient(135deg, #6b2121, #300f0f)';
    },
    cleanDescription(t) {
      if (!t.description) return '';
      if (t.description.length > 90) return t.description.slice(0, 87) + '...';
      return t.description;
    }
  }
};
</script>
