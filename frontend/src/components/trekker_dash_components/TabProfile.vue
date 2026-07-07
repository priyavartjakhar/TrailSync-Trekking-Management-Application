<template>
  <!-- ── PAGE WRAPPER ──────────────────────────────── -->
  <section  class="tab-section-content">
    <div class="page-header">
      <div class="page-header-left">
        <div class="page-eyebrow">Account Details</div>
        <div class="page-title">My <em>Profile</em></div>
      </div>
    </div>

    <div class="dashboard-grid">
      <div class="dashboard-main">
        <div class="ts-card">
          <div class="ts-card-header" style="display: flex; justify-content: space-between; align-items: center;">
            <div class="ts-card-title">Personal Information</div>
            <button class="btn-outline" @click="toggleEdit" style="padding: 0.3rem 0.8rem; font-size: 0.8rem;">
              {{ isEditing ? 'Cancel Edit' : 'Edit Profile' }}
            </button>
          </div>
          
          <div class="ts-card-body">
            <!-- ── VIEW MODE ───────────────────────────────── -->
            <!-- Read-only display of all profile fields grouped into logical sections -->
            <div v-if="!isEditing" style="display: flex; flex-direction: column; gap: 1.5rem">
              <!-- Avatar and identity summary row -->
              <div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 1rem">
                <div style="width: 80px; height: 80px; border-radius: 50%; background: var(--forest); color: white; display: flex; align-items: center; justify-content: center; font-size: 2rem; overflow: hidden; flex-shrink: 0;">
                  <img v-if="profile.profile_image_url" :src="profile.profile_image_url" style="width: 100%; height: 100%; object-fit: cover;" />
                  <!-- Fallback: show the first letter of the trekker's name when no image is set -->
                  <span v-else>{{ profile.name ? profile.name[0].toUpperCase() : 'T' }}</span>
                </div>
                <div>
                  <div style="font-family: 'Playfair Display', serif; font-size: 1.5rem; font-weight: 700; color: var(--forest)">{{ profile.name }}</div>
                  <div style="display: flex; gap: 8px; align-items: center; font-size: 0.85rem; color: var(--stone); margin-top: 2px;">
                    <span>ID: <strong>{{ profile.memberId }}</strong></span>
                    <span>•</span>
                    <span>{{ profile.email }}</span>
                  </div>
                </div>
              </div>
              
              <!-- Basic info grid: phone, DOB, blood group, city, total spend -->
              <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1.25rem; background: var(--snow); padding: 1.5rem; border-radius: 8px;">
                <div>
                  <div style="font-size: 0.75rem; font-weight: 600; color: var(--stone); text-transform: uppercase; margin-bottom: 0.2rem">Phone</div>
                  <div style="color: var(--forest); font-weight: 500">{{ profile.phone || '—' }}</div>
                </div>
                <div>
                  <div style="font-size: 0.75rem; font-weight: 600; color: var(--stone); text-transform: uppercase; margin-bottom: 0.2rem">DOB</div>
                  <div style="color: var(--forest); font-weight: 500">{{ profile.dob || '—' }}</div>
                </div>
                <div>
                  <div style="font-size: 0.75rem; font-weight: 600; color: var(--stone); text-transform: uppercase; margin-bottom: 0.2rem">Blood Group</div>
                  <div style="color: var(--forest); font-weight: 500">{{ profile.blood_group || '—' }}</div>
                </div>
                <div>
                  <div style="font-size: 0.75rem; font-weight: 600; color: var(--stone); text-transform: uppercase; margin-bottom: 0.2rem">Location</div>
                  <div style="color: var(--forest); font-weight: 500">{{ profile.city || '—' }}</div>
                </div>
                <div>
                  <div style="font-size: 0.75rem; font-weight: 600; color: var(--stone); text-transform: uppercase; margin-bottom: 0.2rem">Total Spent</div>
                  <div style="color: var(--forest); font-weight: 700">₹{{ (profile.totalSpent || 0).toLocaleString() }}</div>
                </div>
              </div>
              
              <!-- Safety & medical section: emergency contact and medical conditions -->
              <div style="background: var(--snow); padding: 1.5rem; border-radius: 8px;">
                <h4 style="font-size: 0.85rem; font-weight: 700; color: var(--forest); margin-bottom: 0.8rem">Safety & Medical</h4>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1.25rem;">
                  <div>
                    <div style="font-size: 0.75rem; font-weight: 600; color: var(--stone); text-transform: uppercase; margin-bottom: 0.2rem">Emergency Contact</div>
                    <div style="color: var(--forest); font-weight: 500">{{ profile.emergency || '—' }}</div>
                  </div>
                  <div>
                    <div style="font-size: 0.75rem; font-weight: 600; color: var(--stone); text-transform: uppercase; margin-bottom: 0.2rem">Medical Info</div>
                    <div style="color: var(--forest); font-weight: 500">{{ profile.medical_info || 'None' }}</div>
                  </div>
                </div>
              </div>
              
              <!-- Trek preferences section: fitness level, treks done, preferred difficulty/duration, bio -->
              <div style="background: var(--snow); padding: 1.5rem; border-radius: 8px;">
                <h4 style="font-size: 0.85rem; font-weight: 700; color: var(--forest); margin-bottom: 0.8rem">Trek Preferences</h4>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 1.25rem;">
                  <div>
                    <div style="font-size: 0.75rem; font-weight: 600; color: var(--stone); text-transform: uppercase; margin-bottom: 0.2rem">Fitness Level</div>
                    <div style="color: var(--forest); font-weight: 500; text-transform: capitalize">{{ profile.fitness_level || '—' }}</div>
                  </div>
                  <div>
                    <div style="font-size: 0.75rem; font-weight: 600; color: var(--stone); text-transform: uppercase; margin-bottom: 0.2rem">Treks Done</div>
                    <div style="color: var(--forest); font-weight: 500">{{ profile.treks_done || 0 }}</div>
                  </div>
                  <div>
                    <div style="font-size: 0.75rem; font-weight: 600; color: var(--stone); text-transform: uppercase; margin-bottom: 0.2rem">Pref. Difficulty</div>
                    <div style="color: var(--forest); font-weight: 500; text-transform: capitalize">{{ profile.preferred_difficulty || '—' }}</div>
                  </div>
                  <div>
                    <div style="font-size: 0.75rem; font-weight: 600; color: var(--stone); text-transform: uppercase; margin-bottom: 0.2rem">Pref. Duration</div>
                    <div style="color: var(--forest); font-weight: 500; text-transform: capitalize">{{ profile.preferred_duration || '—' }}</div>
                  </div>
                  <div style="grid-column: 1 / -1;">
                    <div style="font-size: 0.75rem; font-weight: 600; color: var(--stone); text-transform: uppercase; margin-bottom: 0.2rem">Bio</div>
                    <div style="color: var(--forest); font-weight: 500">{{ profile.bio || 'No bio provided.' }}</div>
                  </div>
                </div>
              </div>
            </div>

            <!-- ── EDIT MODE ───────────────────────────────── -->
            <!-- Full form for updating all editable profile fields -->
            <form v-else @submit.prevent="saveProfile" style="display: flex; flex-direction: column; gap: 1.25rem">
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                <!-- Profile image uploader -->
                <div style="grid-column: 1 / -1; margin-bottom: 0.5rem">
                  <label style="display: block; font-size: 0.8rem; font-weight: 600; color: var(--forest); margin-bottom: 0.4rem">Profile Image</label>
                  <input type="file" accept="image/*" @change="handleFileChange" style="width: 100%; padding: 0.6rem; border: 1px solid rgba(26,46,26,0.15); border-radius: 6px; background: #fff" />
                </div>
                
                <!-- Trekker ID is read-only and cannot be changed -->
                <div>
                  <label style="display: block; font-size: 0.8rem; font-weight: 600; color: var(--forest); margin-bottom: 0.4rem">Trekker ID</label>
                  <input type="text" :value="profile.memberId" style="width: 100%; padding: 0.75rem; border: 1px solid rgba(26,46,26,0.15); border-radius: 6px; background: #f0f0f0" disabled />
                </div>
                <div>
                  <label style="display: block; font-size: 0.8rem; font-weight: 600; color: var(--forest); margin-bottom: 0.4rem">Full Name</label>
                  <input type="text" v-model="editProfile.name" style="width: 100%; padding: 0.75rem; border: 1px solid rgba(26,46,26,0.15); border-radius: 6px; background: #fff" required />
                </div>
                <!-- Email is read-only; changes must be requested via the Support tab -->
                <div>
                  <label style="display: block; font-size: 0.8rem; font-weight: 600; color: var(--forest); margin-bottom: 0.4rem">Email Address</label>
                  <input type="email" v-model="editProfile.email" style="width: 100%; padding: 0.75rem; border: 1px solid rgba(26,46,26,0.15); border-radius: 6px; background: #f0f0f0" disabled />
                </div>
                <div style="grid-column: 1 / -1; margin-top: -0.5rem; margin-bottom: 0.5rem;">
                  <span style="font-size: 0.78rem; color: var(--stone); display: block;">
                    To change your email address, please <a href="#" @click.prevent="goTab('support')" style="color: var(--forest); text-decoration: underline; font-weight: 600;">raise a ticket on the Support tab</a>.
                  </span>
                </div>
                <div>
                  <label style="display: block; font-size: 0.8rem; font-weight: 600; color: var(--forest); margin-bottom: 0.4rem">Phone Number</label>
                  <input type="tel" v-model="editProfile.phone" style="width: 100%; padding: 0.75rem; border: 1px solid rgba(26,46,26,0.15); border-radius: 6px; background: #fff" />
                </div>
                <div>
                  <label style="display: block; font-size: 0.8rem; font-weight: 600; color: var(--forest); margin-bottom: 0.4rem">Date of Birth</label>
                  <input type="date" v-model="editProfile.dob" style="width: 100%; padding: 0.75rem; border: 1px solid rgba(26,46,26,0.15); border-radius: 6px; background: #fff" />
                </div>
                <div>
                  <label style="display: block; font-size: 0.8rem; font-weight: 600; color: var(--forest); margin-bottom: 0.4rem">Blood Group</label>
                  <select v-model="editProfile.blood_group" style="width: 100%; padding: 0.75rem; border: 1px solid rgba(26,46,26,0.15); border-radius: 6px; background: #fff">
                    <option value="A+">A+</option><option value="A-">A-</option>
                    <option value="B+">B+</option><option value="B-">B-</option>
                    <option value="AB+">AB+</option><option value="AB-">AB-</option>
                    <option value="O+">O+</option><option value="O-">O-</option>
                  </select>
                </div>
                <div>
                  <label style="display: block; font-size: 0.8rem; font-weight: 600; color: var(--forest); margin-bottom: 0.4rem">City / State</label>
                  <input type="text" v-model="editProfile.city" style="width: 100%; padding: 0.75rem; border: 1px solid rgba(26,46,26,0.15); border-radius: 6px; background: #fff" />
                </div>
                <div style="grid-column: 1 / -1">
                  <label style="display: block; font-size: 0.8rem; font-weight: 600; color: var(--forest); margin-bottom: 0.4rem">Emergency Contact (Name & Phone)</label>
                  <input type="text" v-model="editProfile.emergency" style="width: 100%; padding: 0.75rem; border: 1px solid rgba(26,46,26,0.15); border-radius: 6px; background: #fff" />
                </div>
                <div style="grid-column: 1 / -1">
                  <label style="display: block; font-size: 0.8rem; font-weight: 600; color: var(--forest); margin-bottom: 0.4rem">Medical Conditions / Allergies</label>
                  <textarea v-model="editProfile.medical_info" rows="2" style="width: 100%; padding: 0.75rem; border: 1px solid rgba(26,46,26,0.15); border-radius: 6px; background: #fff"></textarea>
                </div>
                <div>
                  <label style="display: block; font-size: 0.8rem; font-weight: 600; color: var(--forest); margin-bottom: 0.4rem">Fitness Level</label>
                  <select v-model="editProfile.fitness_level" style="width: 100%; padding: 0.75rem; border: 1px solid rgba(26,46,26,0.15); border-radius: 6px; background: #fff">
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="experienced">Experienced</option>
                  </select>
                </div>
                <div>
                  <label style="display: block; font-size: 0.8rem; font-weight: 600; color: var(--forest); margin-bottom: 0.4rem">Treks Done</label>
                  <input type="number" v-model="editProfile.treks_done" min="0" style="width: 100%; padding: 0.75rem; border: 1px solid rgba(26,46,26,0.15); border-radius: 6px; background: #fff" />
                </div>
                <div style="grid-column: 1 / -1">
                  <label style="display: block; font-size: 0.8rem; font-weight: 600; color: var(--forest); margin-bottom: 0.4rem">Bio</label>
                  <textarea v-model="editProfile.bio" rows="2" style="width: 100%; padding: 0.75rem; border: 1px solid rgba(26,46,26,0.15); border-radius: 6px; background: #fff"></textarea>
                </div>
              </div>
              <button type="submit" class="btn-book" style="align-self: flex-start; padding: 0.75rem 1.5rem">Save Changes</button>
            </form>
          </div>
        </div>
      </div>

      <!-- ── SIDEBAR PANEL ───────────────────────────── -->
      <div class="dashboard-sidebar-panel">

        <!-- Security: password change form -->
        <div class="ts-card">
          <div class="ts-card-header">
            <div class="ts-card-title">Security</div>
          </div>
          <div class="ts-card-body">
            <form @submit.prevent="changePassword" style="display: flex; flex-direction: column; gap: 1rem">
              <div>
                <label style="display: block; font-size: 0.8rem; font-weight: 600; color: var(--forest); margin-bottom: 0.4rem">Current Password</label>
                <input type="password" v-model="pwForm.current" style="width: 100%; padding: 0.6rem; border: 1px solid rgba(26,46,26,0.15); border-radius: 6px; background: #fff" />
              </div>
              <div>
                <label style="display: block; font-size: 0.8rem; font-weight: 600; color: var(--forest); margin-bottom: 0.4rem">New Password</label>
                <input type="password" v-model="pwForm.new" style="width: 100%; padding: 0.6rem; border: 1px solid rgba(26,46,26,0.15); border-radius: 6px; background: #fff" />
              </div>
              <div>
                <label style="display: block; font-size: 0.8rem; font-weight: 600; color: var(--forest); margin-bottom: 0.4rem">Confirm New Password</label>
                <input type="password" v-model="pwForm.confirm" style="width: 100%; padding: 0.6rem; border: 1px solid rgba(26,46,26,0.15); border-radius: 6px; background: #fff" />
              </div>
              <button type="submit" class="btn-outline" style="width: 100%; margin-top: 0.5rem">Update Password</button>
            </form>
          </div>
        </div>

        <!-- Export data card -->
        <div class="ts-card" style="margin-top: 1.5rem">
          <div class="ts-card-body">
            <h4 style="font-size: 1rem; font-weight: 700; color: var(--forest); margin-bottom: 0.5rem">Export Data</h4>
            <p style="font-size: 0.8rem; color: var(--stone); margin-bottom: 1rem">Download a copy of your trekking history and bookings.</p>
            <button @click="requestExport" class="btn-outline" style="width: 100%; display: flex; align-items: center; justify-content: center; gap: 0.5rem" :disabled="exportPending">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              {{ exportPending ? 'Exporting...' : 'Export as CSV' }}
            </button>
          </div>
        </div>

        <!-- ── DANGER ZONE ────────────────────────────── -->
        <!-- Irreversible account deletion — requires a typed confirmation to proceed -->
        <div class="ts-card" style="margin-top: 1.5rem; border: 1px solid rgba(220, 53, 69, 0.2); background: rgba(220, 53, 69, 0.02);">
          <div class="ts-card-body">
            <h4 style="font-size: 1rem; font-weight: 700; color: #dc3545; margin-bottom: 0.5rem">Danger Zone</h4>
            <p style="font-size: 0.8rem; color: var(--stone); margin-bottom: 1rem">Permanently delete your account and all associated data. This action is irreversible.</p>
            <button @click="confirmDeleteAccount" class="btn-outline" style="width: 100%; border-color: #dc3545; color: #dc3545; display: flex; align-items: center; justify-content: center; gap: 0.5rem">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-4"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
              Delete Account
            </button>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- ── DELETE ACCOUNT CONFIRMATION MODAL ─────────────── -->
  <!-- Animated overlay requiring the user to type "DELETE" before the action can proceed -->
  <Transition name="fade">
    <div v-if="showDeleteModal" class="modal-overlay" @click.self="closeDeleteModal">
      <div class="modal-card">
        <div class="modal-header-danger">
          <div class="warning-icon-wrapper">
            <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="warning-svg">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
              <line x1="12" y1="9" x2="12" y2="13"></line>
              <line x1="12" y1="17" x2="12.01" y2="17"></line>
            </svg>
          </div>
          <h3 class="modal-title">Delete Account?</h3>
        </div>
        
        <div class="modal-body">
          <p class="warning-text-primary">
            Are you absolutely sure you want to delete your account? This action is <strong>irreversible</strong> and will permanently purge:
          </p>
          <ul class="warning-list">
            <li>Your profile & personal details</li>
            <li>All your bookings & trekking history</li>
            <li>Support tickets & messages</li>
          </ul>
          
          <!-- Typed confirmation input: the submit button stays disabled until the user types "DELETE" exactly -->
          <div class="confirm-input-group">
            <label class="confirm-label">
              Please type <span class="delete-keyword">DELETE</span> below to confirm:
            </label>
            <input 
              type="text" 
              v-model="deleteConfirmText" 
              class="confirm-input" 
              placeholder="DELETE"
              @keyup.enter="submitDeleteAccount"
            />
            <div v-if="deleteError" class="confirm-error-message">{{ deleteError }}</div>
          </div>
        </div>
        
        <div class="modal-actions">
          <button @click="closeDeleteModal" class="btn-cancel">Cancel</button>
          <button 
            @click="submitDeleteAccount" 
            class="btn-confirm-delete" 
            :disabled="deleteConfirmText !== 'DELETE'"
          >
            Permanently Delete
          </button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script>
/**
 * =========================================================================
 * TabProfile.vue
 * =========================================================================
 * Trekker profile settings for details updates, blood groups, fitness specs, and emergency contacts.
 *
 * Provides two display modes — view and edit — for a trekker's personal information,
 * safety/medical data, and trek preferences. Also houses the security (password change),
 * data export, and account deletion (danger zone) panels in a sidebar layout.
 * All API calls are made directly within this component's methods.
 *
 * Communication Structure:
 * - Inputs (Props): `profile` — the trekker's current profile object from UserDashboard.
 * - Outputs (Events): `change-tab`, `profile-updated`, `logout`, `show-toast`.
 */

export default {
  name: 'TabProfile',
  props: {
    profile: { type: Object, required: true }
  },
  emits: ['change-tab', 'profile-updated', 'logout', 'show-toast'],
  data() {
    return {
      // ── EDIT MODE STATE ──────────────────────────────────
      /** True when the profile is in edit mode; false shows the read-only view. */
      isEditing: false,
      /** Shallow copy of `profile` that the edit form binds to, preventing live mutation. */
      editProfile: { ...this.profile },

      // ── PASSWORD CHANGE FORM ─────────────────────────────
      /** Holds the three password change fields: current, new, and confirm. */
      pwForm: { current: '', new: '', confirm: '' },

      // ── FILE UPLOAD STATE ────────────────────────────────
      /** The File object selected by the image picker; null if no new image chosen. */
      profileImageFile: null,

      // ── DELETE ACCOUNT MODAL STATE ───────────────────────
      /** Controls visibility of the account deletion confirmation modal. */
      showDeleteModal: false,
      /** Bound to the typed confirmation input; must equal 'DELETE' to enable the submit button. */
      deleteConfirmText: '',
      /** Inline validation error message shown inside the delete confirmation modal. */
      deleteError: '',

      // ── EXPORT STATE ─────────────────────────────────────
      /** True while a CSV export POST is in flight; disables the Export button. */
      exportPending: false
    };
  },
  watch: {
    // Sync the local editProfile copy whenever the parent updates the profile prop
    // (e.g., after a successful save and a parent-initiated data refresh).
    profile: {
      handler(val) {
        this.editProfile = { ...val };
      },
      deep: true
    }
  },
  methods: {
    /**
     * Emits 'change-tab' to navigate to another dashboard tab.
     * @param {string} tab - Target tab identifier (e.g., 'support').
     */
    goTab(tab) {
      this.$emit('change-tab', tab);
    },

    /**
     * Toggles between view and edit modes.
     * When cancelling edit, reverts `editProfile` to the current prop and clears any
     * pending file selection to avoid stale data being submitted.
     */
    toggleEdit() {
      if (this.isEditing) {
        this.editProfile = { ...this.profile };
        this.profileImageFile = null;
      }
      this.isEditing = !this.isEditing;
    },

    /**
     * Submits the profile edit form via multipart/form-data POST to `/api/user/profile`.
     * Appends all non-null editProfile fields plus an optional profile image file.
     * On success, exits edit mode and notifies the parent to re-fetch the profile.
     * Side effect: sets `isEditing` to false on success; emits 'profile-updated' and 'show-toast'.
     */
    async saveProfile() {
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
          this.isEditing = false;
          this.profileImageFile = null;
          this.$emit('show-toast', data.message || 'Profile saved.', 'success');
          this.$emit('profile-updated');
        } else {
          this.$emit('show-toast', data.error || 'Save failed.', 'error');
        }
      } catch (e) {
        console.error('Profile save error:', e);
        this.$emit('show-toast', 'Failed to contact server. Profile changes not saved.', 'error');
      }
    },

    /**
     * Validates and submits the password change form to `/api/user/password`.
     * Performs client-side checks: all fields required, new passwords must match,
     * and minimum length of 6 characters before sending the request.
     * Side effect: clears `pwForm` on success; emits 'show-toast'.
     */
    async changePassword() {
      if (!this.pwForm.current || !this.pwForm.new) {
        this.$emit('show-toast', 'Please fill all password fields', 'error');
        return;
      }
      if (this.pwForm.new !== this.pwForm.confirm) {
        this.$emit('show-toast', "New passwords don't match", 'error');
        return;
      }
      if (this.pwForm.new.length < 6) {
        this.$emit('show-toast', 'Password must be at least 6 characters', 'error');
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
          this.$emit('show-toast', data.message || 'Password updated.', 'success');
        } else {
          this.$emit('show-toast', data.error || 'Update failed.', 'error');
        }
      } catch (e) {
        console.error('Password change error:', e);
        this.$emit('show-toast', 'Failed to contact server. Password not updated.', 'error');
      }
    },

    /**
     * Handles the profile image file input change event.
     * Stores the selected File object and generates a local object URL preview
     * by reading it with FileReader, updating `editProfile.profile_image_url` for
     * an immediate visual preview in the form.
     * @param {Event} e - The native file input change event.
     */
    handleFileChange(e) {
      const file = e.target.files[0];
      if (file) {
        this.profileImageFile = file;
        const reader = new FileReader();
        reader.onload = (event) => {
          this.editProfile.profile_image_url = event.target.result;
        };
        reader.readAsDataURL(file);
      }
    },

    /**
     * Posts to `/api/user/export` to trigger server-side CSV generation of the user's
     * booking history. Sets `exportPending` for 8 seconds to prevent duplicate requests.
     * Side effect: updates `exportPending`; emits 'show-toast'.
     */
    async requestExport() {
      this.exportPending = true;
      try {
        const res = await fetch('/api/user/export', { method: 'POST' });
        const data = await res.json();
        if (res.ok) {
          this.$emit('show-toast', data.message || 'CSV export triggered.', 'success');
        } else {
          this.$emit('show-toast', data.error || 'Export failed.', 'error');
          this.exportPending = false;
        }
      } catch (e) {
        console.error('Export error:', e);
        this.$emit('show-toast', 'Failed to contact server. Export could not be completed.', 'error');
        this.exportPending = false;
      }
      setTimeout(() => { this.exportPending = false; }, 8000);
    },

    /**
     * Opens the account deletion confirmation modal and resets its internal state
     * (clears any previously typed text and error message).
     */
    confirmDeleteAccount() {
      this.showDeleteModal = true;
      this.deleteConfirmText = '';
      this.deleteError = '';
    },

    /**
     * Closes the account deletion confirmation modal and resets its input state.
     */
    closeDeleteModal() {
      this.showDeleteModal = false;
      this.deleteConfirmText = '';
      this.deleteError = '';
    },

    /**
     * Sends a DELETE request to `/api/user/delete` after verifying the typed confirmation
     * text equals 'DELETE' exactly. On success, emits 'logout' to log the user out.
     * If the confirmation text does not match, sets `deleteError` with a validation message.
     * Side effect: closes the modal; emits 'logout' and 'show-toast'.
     */
    async submitDeleteAccount() {
      if (this.deleteConfirmText === 'DELETE') {
        this.showDeleteModal = false;
        try {
          const res = await fetch('/api/user/delete', {
            method: 'DELETE'
          });
          const data = await res.json();
          if (res.ok) {
            this.$emit('show-toast', data.message || 'Account successfully deleted.', 'success');
            this.$emit('logout');
          } else {
            this.$emit('show-toast', data.error || 'Failed to delete account.', 'error');
          }
        } catch (e) {
          console.error('Delete account error:', e);
          this.$emit('show-toast', 'Failed to contact server. Account deletion failed.', 'error');
        }
      } else {
        this.deleteError = "Please type 'DELETE' exactly to confirm.";
      }
    }
  }
};
</script>


<style scoped>
/* Modal Overlay with glassmorphism backdrop */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(15, 23, 15, 0.4);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
}

/* Modal Card */
.modal-card {
  background: #ffffff;
  border-radius: 16px;
  width: 90%;
  max-width: 440px;
  padding: 2rem;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  border: 1px solid rgba(220, 53, 69, 0.1);
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  animation: modal-appear 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes modal-appear {
  from {
    opacity: 0;
    transform: scale(0.95) translateY(10px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

/* Header & Warning Icon */
.modal-header-danger {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 0.75rem;
}

.warning-icon-wrapper {
  background: #fff5f5;
  border-radius: 50%;
  padding: 0.75rem;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #dc3545;
  border: 1px solid #ffe3e3;
  animation: pulse-ring 2s infinite;
}

@keyframes pulse-ring {
  0% {
    box-shadow: 0 0 0 0 rgba(220, 53, 69, 0.2);
  }
  70% {
    box-shadow: 0 0 0 10px rgba(220, 53, 69, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(220, 53, 69, 0);
  }
}

.warning-svg {
  stroke-linecap: round;
  stroke-linejoin: round;
}

.modal-title {
  font-family: 'Playfair Display', serif;
  font-size: 1.5rem;
  font-weight: 700;
  color: #2c3e50;
  margin: 0;
}

/* Modal Body */
.modal-body {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  font-size: 0.9rem;
  line-height: 1.5;
  color: #4a5568;
}

.warning-text-primary {
  margin: 0;
}

.warning-list {
  margin: 0;
  padding-left: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  color: #718096;
}

.warning-list li {
  list-style-type: disc;
}

.confirm-input-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-top: 0.5rem;
}

.confirm-label {
  font-weight: 600;
  color: #4a5568;
}

.delete-keyword {
  color: #dc3545;
  background: #fff5f5;
  padding: 0.1rem 0.4rem;
  border-radius: 4px;
  font-family: monospace;
  font-weight: 700;
  border: 1px solid rgba(220, 53, 69, 0.15);
}

.confirm-input {
  width: 100%;
  padding: 0.75rem;
  border: 1.5px solid #e2e8f0;
  border-radius: 8px;
  font-size: 1rem;
  text-align: center;
  letter-spacing: 0.1em;
  font-family: monospace;
  transition: all 0.2s ease;
  background: #f8fafc;
}

.confirm-input:focus {
  outline: none;
  border-color: #dc3545;
  background: #ffffff;
  box-shadow: 0 0 0 3px rgba(220, 53, 69, 0.15);
}

.confirm-error-message {
  color: #dc3545;
  font-size: 0.8rem;
  font-weight: 500;
  margin-top: 0.25rem;
}

/* Actions */
.modal-actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem;
  margin-top: 0.5rem;
}

.btn-cancel {
  padding: 0.75rem;
  border-radius: 8px;
  font-weight: 600;
  font-size: 0.95rem;
  background: #f1f5f9;
  border: 1px solid #e2e8f0;
  color: #475569;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-cancel:hover {
  background: #e2e8f0;
  color: #1e293b;
}

.btn-confirm-delete {
  padding: 0.75rem;
  border-radius: 8px;
  font-weight: 600;
  font-size: 0.95rem;
  background: #dc3545;
  border: 1px solid #dc3545;
  color: #ffffff;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-confirm-delete:hover:not(:disabled) {
  background: #c82333;
  border-color: #bd2130;
}

.btn-confirm-delete:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  background: #e2e8f0;
  border-color: #e2e8f0;
  color: #94a3b8;
}

/* Transitions */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>


