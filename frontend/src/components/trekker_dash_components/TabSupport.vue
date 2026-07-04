<template>
  <section class="tab-section-content">
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
                      <span style="font-size: 0.75rem; font-weight: 700; color: var(--forest); margin-right: 8px; font-family: monospace;">{{ ticket.ticketId || ('TS26AS' + String(ticket.id).padStart(3, '0')) }}</span>
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
                  <!-- Resolution message -->
                  <div v-if="ticket.status === 'Resolved' && ticket.resolutionMessage" style="margin-top: 0.6rem; background: rgba(40,167,69,0.06); border: 1px solid rgba(40,167,69,0.2); border-radius: 6px; padding: 0.6rem 0.75rem;">
                    <div style="font-size: 0.65rem; font-weight: 700; color: #28a745; text-transform: uppercase; margin-bottom: 3px;">✓ Admin Response</div>
                    <div style="font-size: 0.85rem; color: var(--bark); line-height: 1.5; white-space: pre-wrap;">{{ ticket.resolutionMessage }}</div>
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
</template>

<script>
export default {
  name: 'TabSupport',
  props: {
    profile: { type: Object, required: true },
    supportTickets: { type: Array, default: () => [] },
    loadingSupport: { type: Boolean, default: false },
    submittingSupport: { type: Boolean, default: false }
  },
  emits: ['submit-ticket', 'change-tab'],
  data() {
    return {
      expandedFaq: null,
      showCategoryDropdown: false,
      supportForm: {
        subject: '',
        message: '',
        category: 'General'
      }
    };
  },
  mounted() {
    document.addEventListener('click', this.clickListener);
  },
  beforeUnmount() {
    document.removeEventListener('click', this.clickListener);
  },
  methods: {
    goTab(tab) {
      this.$emit('change-tab', tab);
    },
    submitSupportTicket() {
      this.$emit('submit-ticket', {
        form: this.supportForm,
        successCallback: () => {
          this.supportForm = { subject: '', message: '', category: 'General' };
        }
      });
    },
    clickListener(e) {
      if (!e.target.closest('.custom-select-wrapper')) {
        this.showCategoryDropdown = false;
      }
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
    }
  }
};
</script>
