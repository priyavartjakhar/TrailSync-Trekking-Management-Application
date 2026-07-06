<template>
  <transition name="toast">
    <div v-if="show" class="ts-modal-overlay" @click.self="dismissPaymentModal(false)">
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
</template>

<script>
export default {
  name: 'PaymentModal',
  props: {
    show: { type: Boolean, required: true },
    paymentTrekBatch: { type: Object, default: null },
    isPendingRetry: { type: Boolean, default: false },
    retryBookingId: { type: [Number, String], default: null }
  },
  emits: ['close', 'payment-success', 'show-toast'],
  data() {
    return {
      paymentProcessing: false,
      paymentProcessingMsg: '',
      paymentProcessingProgress: 0,
      paymentResultState: null,
      paymentResultBookingId: '',
      selectedPaymentMethod: '',
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
      }
    };
  },
  methods: {
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
    dismissPaymentModal(shouldFetch = true) {
      this.$emit('close', shouldFetch);
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
        this.$emit('show-toast', 'Select a payment method first.', 'warning');
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
          this.$emit('show-toast', data.message || 'Booking saved as pending. Pay at base camp.', 'warning');
        } else {
          this.paymentResultState = 'Failed';
          this.$emit('show-toast', data.error || 'Could not save pending booking', 'error');
        }
      } catch (e) {
        console.error('Payment error:', e);
        this.paymentResultState = 'Failed';
        this.$emit('show-toast', 'Failed to contact server. Booking could not be saved.', 'error');
      }
    },
    async processSimulatedPayment(status) {
      if (!this.paymentTrekBatch) return;

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
            this.$emit('show-toast', data.message || 'Payment successful! Trek booked.', 'success');
          } else if (status === 'Pending') {
            this.$emit('show-toast', data.message || 'Payment is pending. You can complete it later.', 'warning');
          } else {
            this.$emit('show-toast', data.message || 'Payment failed status simulated.', 'error');
          }
          this.$emit('payment-success');
        } else {
          this.paymentProcessing = false;
          this.paymentResultState = 'Failed';
          this.$emit('show-toast', data.error || 'Transaction failed', 'error');
        }
      } catch (e) {
        console.error('Payment error:', e);
        this.paymentProcessing = false;
        this.paymentResultState = 'Failed';
        this.$emit('show-toast', 'Failed to contact server. Payment could not be processed.', 'error');
      }
    }
  }
};
</script>
