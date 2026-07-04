<template>
  <div id="register-root">
<div class="register-bg"></div>

    
    <div class="auth-top-header">
      <a href="/" class="brand-name-link">Trail<span>Sync</span></a>
      <a href="/" class="ts-btn-home"><i class="bi bi-house-door"></i> Home</a>
    </div>

    
    <div class="login-page-wrap register-wrap d-flex align-items-center justify-content-center min-vh-100">

      <div class="auth-card-wrap auth-card-wide">
        <div class="auth-card theme-login-modal theme-trekker">

          
          <div class="mobile-brand text-center mb-4 d-lg-none">
            <a href="/" class="brand-name-link">Trail<span>Sync</span></a>
          </div>

          
          <div class="step-trail mb-5" role="progressbar" :aria-valuenow="step" aria-valuemin="1" aria-valuemax="4">
            <div v-for="(s, i) in steps" :key="i" class="step-node-wrap">
              <div class="step-node"
                   :class="{ 'done': step > i + 1, 'active': step === i + 1 }">
                <span v-if="step > i + 1" aria-hidden="true"><i class="bi bi-check-lg"></i></span>
                <span v-else>{{ i + 1 }}</span>
              </div>
              <span class="step-node-label">{{ s.label }}</span>
              <div v-if="i < steps.length - 1" class="step-connector" :class="{ 'done': step > i + 1 }"></div>
            </div>
          </div>

          
          <div v-show="step === 1">
            <div class="card-heading mb-4">
              <p class="auth-eyebrow">Step 1 of 4</p>
              <h1 class="auth-title">Create your account</h1>
              <p class="auth-subtitle">Your login credentials for TrailSync.</p>
            </div>

            <div style="background: rgba(212, 150, 42, 0.1); border: 1px solid rgba(212, 150, 42, 0.25); border-radius: 6px; padding: 0.5rem; margin-bottom: 1.25rem; font-size: 0.78rem; color: #e5a93c; text-align: center; font-weight: 500;">
              ⚠️ Note: Only trekkers can self-register. Staff accounts are created by the system administrator.
            </div>

            <div class="error-banner" v-if="error" role="alert">
              <span class="error-icon" aria-hidden="true"><i class="bi bi-exclamation-triangle"></i></span> {{ error }}
            </div>

            <div class="row g-3">
              <div class="col-12 col-md-6">
                <label for="r_first_name" class="field-label">First name <span class="req">*</span></label>
                <input id="r_first_name" type="text" class="ts-input" :class="{'is-invalid': v.first_name}" v-model="form.first_name" placeholder="Arjun" required />
                <div class="invalid-msg" v-if="v.first_name">{{ v.first_name }}</div>
              </div>
              <div class="col-12 col-md-6">
                <label for="r_last_name" class="field-label">Last name <span class="req">*</span></label>
                <input id="r_last_name" type="text" class="ts-input" :class="{'is-invalid': v.last_name}" v-model="form.last_name" placeholder="Sharma" required />
                <div class="invalid-msg" v-if="v.last_name">{{ v.last_name }}</div>
              </div>
              <div class="col-12">
                <label for="r_email" class="field-label">Email address <span class="req">*</span></label>
                <input id="r_email" type="email" class="ts-input" :class="{'is-invalid': v.email}" v-model="form.email" placeholder="arjun@email.com" required />
                <div class="invalid-msg" v-if="v.email">{{ v.email }}</div>
                <div class="availability-status mt-1 d-flex align-items-center gap-1" :class="{'text-success': emailAvailable === true, 'text-muted': emailChecking}" v-if="(emailChecking || emailAvailable === true) && !v.email" style="font-size: 0.8rem; font-weight: 500;">
                  <span v-if="emailChecking" class="spinner-border spinner-border-sm" role="status" style="width: 0.85rem; height: 0.85rem; border-width: 1.5px; display: inline-block;"></span>
                  <i v-else-if="emailAvailable === true" class="bi bi-check-circle-fill text-success"></i>
                  <span>{{ emailStatusMessage }}</span>
                </div>
              </div>
              <div class="col-12 col-md-6">
                <label for="r_password" class="field-label">Password <span class="req">*</span></label>
                <div class="password-wrap">
                  <input id="r_password" :type="showPass ? 'text' : 'password'" class="ts-input" :class="{'is-invalid': v.password}" v-model="form.password" placeholder="Min. 8 characters" required />
                  <button type="button" class="pass-toggle" @click="showPass = !showPass" :aria-label="showPass ? 'Hide' : 'Show'">
                    <i :class="showPass ? 'bi bi-eye-slash' : 'bi bi-eye'"></i>
                  </button>
                </div>
                <div class="password-strength mt-1" v-if="form.password">
                  <div class="strength-bar">
                    <span class="strength-fill" :class="'strength-' + passwordStrength" :style="{ width: (passwordStrength / 4 * 100) + '%' }"></span>
                  </div>
                  <span class="strength-label">{{ strengthLabel }}</span>
                </div>
                <div class="invalid-msg" v-if="v.password">{{ v.password }}</div>
              </div>
              <div class="col-12 col-md-6">
                <label for="r_confirm" class="field-label">Confirm password <span class="req">*</span></label>
                <div class="password-wrap">
                  <input id="r_confirm" :type="showConfirm ? 'text' : 'password'" class="ts-input" :class="{'is-invalid': v.confirm}" v-model="form.confirm" placeholder="Repeat password" required />
                  <button type="button" class="pass-toggle" @click="showConfirm = !showConfirm" :aria-label="showConfirm ? 'Hide' : 'Show'">
                    <i :class="showConfirm ? 'bi bi-eye-slash' : 'bi bi-eye'"></i>
                  </button>
                </div>
                <div class="invalid-msg" v-if="v.confirm">{{ v.confirm }}</div>
              </div>
              <div class="col-12">
                <label for="r_profile_image" class="field-label">Profile image <span class="field-hint-inline">(optional)</span></label>
                <input id="r_profile_image" type="file" class="ts-input" accept="image/*" @change="handleFileChange" />
              </div>
            </div>

            <button class="ts-btn-submit mt-4" @click="nextStep(1)">Continue →</button>
            <p class="footer-text text-center mt-3">Already have an account? <a href="/login" class="footer-link"><i class="bi bi-box-arrow-in-right"></i> Sign in</a></p>
          </div>

          
          <div v-show="step === 2">
            <div class="card-heading mb-4">
              <p class="auth-eyebrow">Step 2 of 4</p>
              <h1 class="auth-title">Personal details</h1>
              <p class="auth-subtitle">Helps us keep you safe on the trail.</p>
            </div>

            <div class="row g-3">
              <div class="col-12 col-md-6">
                <label for="r_dob" class="field-label">Date of birth <span class="req">*</span></label>
                <input id="r_dob" type="date" class="ts-input" :class="{'is-invalid': v.dob}" v-model="form.dob" required />
                <div class="field-hint">Must be 16+ to register</div>
                <div class="invalid-msg" v-if="v.dob">{{ v.dob }}</div>
              </div>
              <div class="col-12 col-md-6">
                <label for="r_phone" class="field-label">Phone number <span class="req">*</span></label>
                <input id="r_phone" type="tel" class="ts-input" :class="{'is-invalid': v.phone}" v-model="form.phone" placeholder="+91 98765 43210" required />
                <div class="invalid-msg" v-if="v.phone">{{ v.phone }}</div>
                <div class="availability-status mt-1 d-flex align-items-center gap-1" :class="{'text-success': phoneAvailable === true, 'text-muted': phoneChecking}" v-if="(phoneChecking || phoneAvailable === true) && !v.phone" style="font-size: 0.8rem; font-weight: 500;">
                  <span v-if="phoneChecking" class="spinner-border spinner-border-sm" role="status" style="width: 0.85rem; height: 0.85rem; border-width: 1.5px; display: inline-block;"></span>
                  <i v-else-if="phoneAvailable === true" class="bi bi-check-circle-fill text-success"></i>
                  <span>{{ phoneStatusMessage }}</span>
                </div>
              </div>
              <div class="col-12 col-md-6">
                <label for="r_blood" class="field-label">Blood group <span class="req">*</span></label>
                <select id="r_blood" class="ts-input ts-select" :class="{'is-invalid': v.blood_group}" v-model="form.blood_group" required>
                  <option value="">Select blood group</option>
                  <option v-for="bg in bloodGroups" :key="bg" :value="bg">{{ bg }}</option>
                </select>
                <div class="invalid-msg" v-if="v.blood_group">{{ v.blood_group }}</div>
              </div>
              <div class="col-12 col-md-6">
                <label for="r_city" class="field-label">City / State</label>
                <input id="r_city" type="text" class="ts-input" v-model="form.city" placeholder="Mumbai, Maharashtra" />
              </div>
              <div class="col-12">
                <label class="field-label">Emergency contact <span class="req">*</span></label>
                <div class="row g-2">
                  <div class="col-6">
                    <input type="text" class="ts-input" :class="{'is-invalid': v.emergency_name}" v-model="form.emergency_name" placeholder="Contact name" />
                  </div>
                  <div class="col-6">
                    <input type="tel" class="ts-input" :class="{'is-invalid': v.emergency_phone}" v-model="form.emergency_phone" placeholder="Contact phone" />
                  </div>
                </div>
                <div class="invalid-msg" v-if="v.emergency_name || v.emergency_phone">Emergency contact name and phone are required</div>
              </div>
              <div class="col-12">
                <label for="r_medical" class="field-label">Medical conditions or allergies</label>
                <textarea id="r_medical" class="ts-input ts-textarea" v-model="form.medical_info" placeholder="e.g. asthma, knee injury, nut allergy — leave blank if none" rows="2"></textarea>
                <div class="field-hint">Visible only to assigned trek staff</div>
              </div>
            </div>

            <div class="step-nav mt-4">
              <button class="ts-btn-ghost" @click="step = 1">← Back</button>
              <button class="ts-btn-submit flex-1" @click="nextStep(2)">Continue →</button>
            </div>
          </div>

          
          <div v-show="step === 3">
            <div class="card-heading mb-4">
              <p class="auth-eyebrow">Step 3 of 4</p>
              <h1 class="auth-title">Your trekking profile</h1>
              <p class="auth-subtitle">We'll tailor trek recommendations for you.</p>
            </div>

            <div class="row g-3">
              <div class="col-12 col-md-6">
                <label for="r_fitness" class="field-label">Fitness level</label>
                <select id="r_fitness" class="ts-input ts-select" v-model="form.fitness_level">
                  <option value="">Select your level</option>
                  <option value="beginner">Beginner — I'm just starting out</option>
                  <option value="intermediate">Intermediate — I hike regularly</option>
                  <option value="experienced">Experienced — Multi-day treks done</option>
                </select>
              </div>
              <div class="col-12 col-md-6">
                <label for="r_treks_done" class="field-label">Treks completed (approx.)</label>
                <input id="r_treks_done" type="number" class="ts-input" v-model="form.treks_done" placeholder="0" min="0" />
              </div>
              <div class="col-12">
                <label class="field-label mb-2">Preferred difficulty</label>
                <div class="chip-picker">
                  <button type="button"
                          v-for="d in difficulties" :key="d.value"
                          class="diff-chip"
                          :class="['chip-' + d.value, { active: form.preferred_difficulty === d.value }]"
                          @click="form.preferred_difficulty = form.preferred_difficulty === d.value ? '' : d.value">
                    <span class="chip-dot" aria-hidden="true"></span>
                    {{ d.label }}
                  </button>
                </div>
              </div>
              <div class="col-12">
                <label class="field-label mb-2">Preferred trek duration</label>
                <div class="chip-picker">
                  <button type="button"
                          v-for="dur in durations" :key="dur.value"
                          class="pref-chip"
                          :class="{ active: form.preferred_duration === dur.value }"
                          @click="form.preferred_duration = form.preferred_duration === dur.value ? '' : dur.value">
                    {{ dur.label }}
                  </button>
                </div>
              </div>
              <div class="col-12">
                <label class="field-label mb-2">Preferred regions <span class="field-hint-inline">(choose all that apply)</span></label>
                <div class="chip-picker chip-multi">
                  <button type="button"
                          v-for="region in regions" :key="region"
                          class="pref-chip"
                          :class="{ active: form.preferred_regions.includes(region) }"
                          @click="toggleRegion(region)">
                    {{ region }}
                  </button>
                </div>
              </div>
              <div class="col-12">
                <label for="r_bio" class="field-label">Short bio <span class="field-hint-inline">(optional)</span></label>
                <textarea id="r_bio" class="ts-input ts-textarea" v-model="form.bio" placeholder="Tell other trekkers about yourself..." rows="2"></textarea>
              </div>
            </div>

            <div class="step-nav mt-4">
              <button class="ts-btn-ghost" @click="step = 2">← Back</button>
              <button class="ts-btn-submit flex-1" @click="nextStep(3)">Continue →</button>
            </div>
          </div>

          
          <div v-show="step === 4">
            <div class="card-heading mb-4">
              <p class="auth-eyebrow">Step 4 of 4</p>
              <h1 class="auth-title">Almost there!</h1>
              <p class="auth-subtitle">Review your details before creating your account.</p>
            </div>

            
            <div class="review-grid mb-4">
              <div class="review-block">
                <div class="review-block-header">
                  <span class="review-icon" aria-hidden="true"><i class="bi bi-person-badge"></i></span>
                  <span>Account</span>
                  <button class="review-edit" @click="step = 1" aria-label="Edit account details">Edit</button>
                </div>
                <div class="review-row"><span>Name</span><strong>{{ form.first_name }} {{ form.last_name }}</strong></div>
                <div class="review-row"><span>Email</span><strong>{{ form.email }}</strong></div>
              </div>
              <div class="review-block">
                <div class="review-block-header">
                  <span class="review-icon" aria-hidden="true"><i class="bi bi-heart-pulse"></i></span>
                  <span>Safety</span>
                  <button class="review-edit" @click="step = 2" aria-label="Edit safety details">Edit</button>
                </div>
                <div class="review-row"><span>Phone</span><strong>{{ form.phone || '—' }}</strong></div>
                <div class="review-row"><span>Blood group</span><strong>{{ form.blood_group || '—' }}</strong></div>
                <div class="review-row"><span>Emergency contact</span><strong>{{ form.emergency_name || '—' }}</strong></div>
              </div>
              <div class="review-block">
                <div class="review-block-header">
                  <span class="review-icon" aria-hidden="true"><i class="bi bi-compass"></i></span>
                  <span>Trek profile</span>
                  <button class="review-edit" @click="step = 3" aria-label="Edit trek profile">Edit</button>
                </div>
                <div class="review-row"><span>Fitness</span><strong>{{ form.fitness_level || 'Not set' }}</strong></div>
                <div class="review-row"><span>Difficulty pref</span><strong>{{ form.preferred_difficulty || 'Any' }}</strong></div>
                <div class="review-row"><span>Regions</span><strong>{{ form.preferred_regions.join(', ') || 'Any' }}</strong></div>
              </div>
            </div>

            
            <div class="form-check mb-4">
              <input type="checkbox" class="form-check-input ts-check" id="r_terms" v-model="form.terms" />
              <label class="form-check-label check-label" for="r_terms">
                I agree to the <a href="/terms" class="footer-link">Terms of Service</a> and
                <a href="/privacy" class="footer-link">Privacy Policy</a>
              </label>
              <div class="invalid-msg" v-if="v.terms">{{ v.terms }}</div>
            </div>

            <div class="error-banner" v-if="error" role="alert">
              <span class="error-icon" aria-hidden="true"><i class="bi bi-exclamation-triangle"></i></span> {{ error }}
            </div>

            
            <div class="success-banner" v-if="success" role="status">
              <span class="success-icon" aria-hidden="true"><i class="bi bi-patch-check-fill"></i></span>
              Account created! Redirecting you to sign in…
            </div>

            <div class="step-nav mt-2" v-if="!success">
              <button class="ts-btn-ghost" @click="step = 3">← Back</button>
              <button class="ts-btn-submit flex-1" @click="handleRegister" :disabled="loading">
                <span v-if="!loading">Create my account</span>
                <span v-else class="loading-dots"><span></span><span></span><span></span></span>
              </button>
            </div>
          </div>

        </div>

        
        <div class="register-footer mt-4 text-center">
          <p class="brand-legal">© 2025 TrailSync. All rights reserved.</p>
        </div>
      </div>

    </div>
  </div>
</template>

<script>
import { ref, computed, reactive, watch } from 'vue';
import { useRouter } from 'vue-router';

export default {
  name: 'TsRegister',
  setup() {
    const router = useRouter();
/* ── Animated particles (same as login) ── */
    const particles = Array.from({ length: 18 }, (_, i) => ({
      id: i,
      x:    Math.random() * 100,
      dur:  8 + Math.random() * 14,
      delay: Math.random() * -20,
      size: 3 + Math.random() * 6,
    }));

    /* ── Step config ── */
    const steps = [
      { label: 'Account' },
      { label: 'Safety'  },
      { label: 'Profile' },
      { label: 'Review'  },
    ];

    const step    = ref(1);
    const loading = ref(false);
    const error   = ref('');
    const success = ref(false);

    /* ── Form data ── */
    const form = ref({
      first_name:           '',
      last_name:            '',
      email:                '',
      password:             '',
      confirm:              '',
      dob:                  '',
      phone:                '',
      blood_group:          '',
      city:                 '',
      emergency_name:       '',
      emergency_phone:      '',
      medical_info:         '',
      fitness_level:        '',
      treks_done:           0,
      preferred_difficulty: '',
      preferred_duration:   '',
      preferred_regions:    [],
      bio:                  '',
      terms:                false
    });

    const showPass    = ref(false);
    const showConfirm = ref(false);
    const profileImageFile = ref(null);

    function handleFileChange(event) {
      if (event.target.files && event.target.files.length > 0) {
        profileImageFile.value = event.target.files[0];
      } else {
        profileImageFile.value = null;
      }
    }

    /* ── Options for pickers ── */
    const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
    const difficulties = [
      { value: 'easy', label: 'Easy' },
      { value: 'moderate', label: 'Moderate' },
      { value: 'hard', label: 'Hard' }
    ];
    const durations = [
      { value: 'short', label: 'Short (1-4 Days)' },
      { value: 'medium', label: 'Medium (5-7 Days)' },
      { value: 'long', label: 'Long (7+ Days)' }
    ];
    const regions = [
      'Uttarakhand',
      'Himachal Pradesh',
      'Jammu & Kashmir',
      'Sikkim',
      'Maharashtra',
      'Karnataka'
    ];

    /* ── Validation errors ── */
    const v = reactive({
      first_name:      '',
      last_name:       '',
      email:           '',
      password:        '',
      confirm:         '',
      dob:             '',
      phone:           '',
      blood_group:     '',
      emergency_name:  '',
      emergency_phone: '',
      terms:           ''
    });

    /* ── Password Strength Calculation ── */
    const passwordStrength = computed(() => {
      const pw = form.value.password;
      if (!pw) return 0;
      let score = 0;
      if (pw.length >= 8) score++;
      if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++;
      if (/[0-9]/.test(pw)) score++;
      if (/[^A-Za-z0-9]/.test(pw)) score++;
      return Math.max(1, score);
    });

    const strengthLabel = computed(() => {
      const labels = ['', 'Weak', 'Fair', 'Good', 'Strong'];
      return labels[passwordStrength.value];
    });

    const emailStatusMessage = ref('');
    const emailAvailable = ref(null); // null, true, or false
    const emailChecking = ref(false);

    const phoneStatusMessage = ref('');
    const phoneAvailable = ref(null); // null, true, or false
    const phoneChecking = ref(false);

    let emailDebounceTimer = null;
    let phoneDebounceTimer = null;

    // Watchers for email and phone live availability checks
    watch(() => form.value.email, (newVal) => {
      if (emailDebounceTimer) clearTimeout(emailDebounceTimer);
      
      const emailVal = newVal.trim();
      if (!emailVal) {
        emailStatusMessage.value = '';
        emailAvailable.value = null;
        v.email = '';
        return;
      }
      
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailVal)) {
        emailStatusMessage.value = 'Invalid email format.';
        emailAvailable.value = false;
        return;
      }
      
      emailChecking.value = true;
      emailStatusMessage.value = 'Checking availability...';
      emailAvailable.value = null;
      
      emailDebounceTimer = setTimeout(async () => {
        try {
          const res = await fetch(`/api/auth/check-availability?email=${encodeURIComponent(emailVal)}`);
          if (res.ok) {
            const data = await res.json();
            if (data.email) {
              emailAvailable.value = data.email.available;
              emailStatusMessage.value = data.email.message;
              if (!data.email.available) {
                v.email = 'Email is already registered.';
              } else {
                v.email = '';
              }
            }
          } else {
            emailStatusMessage.value = 'Error checking availability.';
            emailAvailable.value = null;
          }
        } catch (err) {
          emailStatusMessage.value = 'Error connecting to server.';
          emailAvailable.value = null;
        } finally {
          emailChecking.value = false;
        }
      }, 500);
    });

    watch(() => form.value.phone, (newVal) => {
      if (phoneDebounceTimer) clearTimeout(phoneDebounceTimer);
      
      const phoneVal = newVal.trim();
      if (!phoneVal) {
        phoneStatusMessage.value = '';
        phoneAvailable.value = null;
        v.phone = '';
        return;
      }
      
      if (phoneVal.length < 8) {
        phoneStatusMessage.value = 'Phone number is too short.';
        phoneAvailable.value = false;
        return;
      }
      
      phoneChecking.value = true;
      phoneStatusMessage.value = 'Checking availability...';
      phoneAvailable.value = null;
      
      phoneDebounceTimer = setTimeout(async () => {
        try {
          const res = await fetch(`/api/auth/check-availability?phone=${encodeURIComponent(phoneVal)}`);
          if (res.ok) {
            const data = await res.json();
            if (data.phone) {
              phoneAvailable.value = data.phone.available;
              phoneStatusMessage.value = data.phone.message;
              if (!data.phone.available) {
                v.phone = 'Phone number is already registered.';
              } else {
                v.phone = '';
              }
            }
          } else {
            phoneStatusMessage.value = 'Error checking availability.';
            phoneAvailable.value = null;
          }
        } catch (err) {
          phoneStatusMessage.value = 'Error connecting to server.';
          phoneAvailable.value = null;
        } finally {
          phoneChecking.value = false;
        }
      }, 500);
    });

    function toggleRegion(region) {
      const idx = form.value.preferred_regions.indexOf(region);
      if (idx > -1) {
        form.value.preferred_regions.splice(idx, 1);
      } else {
        form.value.preferred_regions.push(region);
      }
    }

    /* ── Step Validation & Navigation ── */
    function validateStep(s) {
      let ok = true;
      error.value = '';

      if (s === 1) {
        v.first_name = form.value.first_name.trim() ? '' : 'First name is required.';
        v.last_name  = form.value.last_name.trim() ? '' : 'Last name is required.';
        
        if (!form.value.email.trim()) {
          v.email = 'Email is required.';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.value.email)) {
          v.email = 'Please enter a valid email address.';
        } else if (emailAvailable.value === false) {
          v.email = 'Email is already registered.';
        } else if (emailChecking.value) {
          v.email = 'Checking email availability, please wait...';
        } else {
          v.email = '';
        }

        if (!form.value.password) {
          v.password = 'Password is required.';
        } else if (form.value.password.length < 8) {
          v.password = 'Password must be at least 8 characters.';
        } else {
          v.password = '';
        }

        if (!form.value.confirm) {
          v.confirm = 'Please confirm your password.';
        } else if (form.value.password !== form.value.confirm) {
          v.confirm = 'Passwords do not match.';
        } else {
          v.confirm = '';
        }

        ok = !v.first_name && !v.last_name && !v.email && !v.password && !v.confirm;
      }

      else if (s === 2) {
        if (!form.value.dob) {
          v.dob = 'Date of birth is required.';
        } else {
          const dobDate = new Date(form.value.dob);
          const age = new Date().getFullYear() - dobDate.getFullYear();
          if (age < 16) {
            v.dob = 'You must be at least 16 years old to register.';
          } else {
            v.dob = '';
          }
        }

        v.phone = form.value.phone.trim() ? '' : 'Phone number is required.';
        if (!v.phone) {
          if (phoneAvailable.value === false) {
            v.phone = 'Phone number is already registered.';
          } else if (phoneChecking.value) {
            v.phone = 'Checking phone availability, please wait...';
          }
        }
        v.blood_group = form.value.blood_group ? '' : 'Please select your blood group.';
        
        v.emergency_name = form.value.emergency_name.trim() ? '' : 'Required.';
        v.emergency_phone = form.value.emergency_phone.trim() ? '' : 'Required.';

        ok = !v.dob && !v.phone && !v.blood_group && !v.emergency_name && !v.emergency_phone;
      }

      return ok;
    }

    function nextStep(s) {
      if (validateStep(s)) {
        step.value = s + 1;
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }

    /* ── Backend Register Trigger ── */
    async function handleRegister() {
      error.value = '';
      v.terms = form.value.terms ? '' : 'You must agree to the terms of service.';
      if (v.terms) return;

      loading.value = true;
      try {
        // Construct composite fields matching backend capabilities
        const fullName = `${form.value.first_name} ${form.value.last_name}`.trim();
        const emergencyContact = `${form.value.emergency_name} (${form.value.emergency_phone})`;
        const userBio = form.value.bio.trim() || '';

        const formData = new FormData();
        formData.append('email', form.value.email.trim().toLowerCase());
        formData.append('name', fullName);
        formData.append('phone', form.value.phone.trim());
        formData.append('password', form.value.password);
        formData.append('city', form.value.city.trim());
        formData.append('emergency', emergencyContact);
        formData.append('bio', userBio);
        formData.append('dob', form.value.dob);
        formData.append('blood_group', form.value.blood_group);
        formData.append('medical_info', form.value.medical_info);
        formData.append('fitness_level', form.value.fitness_level);
        formData.append('treks_done', form.value.treks_done);
        formData.append('preferred_difficulty', form.value.preferred_difficulty);
        formData.append('preferred_duration', form.value.preferred_duration);
        formData.append('preferred_regions', form.value.preferred_regions.join(', '));
        
        if (profileImageFile.value) {
          formData.append('profile_image', profileImageFile.value);
        }

        const res = await fetch('/api/auth/register', {
          method: 'POST',
          body: formData,
        });

        const data = await res.json();

        if (!res.ok) {
          error.value = data.error || 'Registration failed. Please try again.';
          return;
        }

        success.value = true;

        if (data.token) {
          localStorage.setItem('ts_token', data.token);
          localStorage.setItem('ts_role',  data.role || 'user');
          if ((data.role || 'user') === 'trekker' || (data.role || 'user') === 'user') { localStorage.setItem('userActiveTab', 'dashboard'); }
        }

        /* Redirect to the dashboard */
        setTimeout(() => {
          window.location.href = data.redirect || '/dashboard';
        }, 1500);

      } catch (err) {
        console.error('Registration error:', err);
        error.value = 'Unable to reach the server. Please try again.';
      } finally {
        loading.value = false;
      }
    }

    return {
      particles, steps, step, loading, error, success,
      form, showPass, showConfirm, profileImageFile, handleFileChange,
      bloodGroups, difficulties, durations, regions,
      v, passwordStrength, strengthLabel,
      toggleRegion, nextStep, handleRegister,
      emailStatusMessage, emailAvailable, emailChecking,
      phoneStatusMessage, phoneAvailable, phoneChecking
    };
  }
};
</script>
