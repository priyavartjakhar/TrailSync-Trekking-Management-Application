/* ============================================================
   register.js — TrailSync Registration Page Vue 3 App (CDN)
   ============================================================ */

const { createApp, ref, computed, reactive } = Vue;

createApp({
  setup() {

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
      toggleRegion, nextStep, handleRegister
    };
  }
}).mount('#app');
