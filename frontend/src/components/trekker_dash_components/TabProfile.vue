<template>
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
                  <button class="btn-outline" @click="isEditingProfile = !isEditingProfile" style="padding: 0.3rem 0.8rem; font-size: 0.8rem;">
                    {{ isEditingProfile ? 'Cancel Edit' : 'Edit Profile' }}
                  </button>
                </div>
                
                <div class="ts-card-body">
                  <!-- VIEW MODE -->
                  <div v-if="!isEditingProfile" style="display: flex; flex-direction: column; gap: 1.5rem">
                    <div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 1rem">
                      <div style="width: 80px; height: 80px; border-radius: 50%; background: var(--forest); color: white; display: flex; align-items: center; justify-content: center; font-size: 2rem; overflow: hidden; flex-shrink: 0;">
                        <img v-if="profile.profile_image_url" :src="profile.profile_image_url" style="width: 100%; height: 100%; object-fit: cover;" />
                        <span v-else>{{ profile.name ? profile.name[0].toUpperCase() : 'T' }}</span>
                      </div>
                      <div>
                        <div style="font-family: 'Playfair Display', serif; font-size: 1.5rem; font-weight: 700; color: var(--forest)">{{ profile.name }}</div>
                        <div style="font-size: 0.85rem; color: var(--stone)">{{ profile.email }}</div>
                      </div>
                    </div>
                    
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

                  <!-- EDIT MODE -->
                  <form v-else @submit.prevent="saveProfile" style="display: flex; flex-direction: column; gap: 1.25rem">
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                      <div style="grid-column: 1 / -1; margin-bottom: 0.5rem">
                        <label style="display: block; font-size: 0.8rem; font-weight: 600; color: var(--forest); margin-bottom: 0.4rem">Profile Image</label>
                        <input type="file" accept="image/*" @change="handleProfileImageChange" style="width: 100%; padding: 0.6rem; border: 1px solid rgba(26,46,26,0.15); border-radius: 6px; background: #fff" />
                      </div>
                      
                      <div>
                        <label style="display: block; font-size: 0.8rem; font-weight: 600; color: var(--forest); margin-bottom: 0.4rem">Full Name</label>
                        <input type="text" v-model="editProfile.name" style="width: 100%; padding: 0.75rem; border: 1px solid rgba(26,46,26,0.15); border-radius: 6px; background: #fff" required />
                      </div>
                      <div>
                        <label style="display: block; font-size: 0.8rem; font-weight: 600; color: var(--forest); margin-bottom: 0.4rem">Email Address</label>
                        <input type="email" v-model="editProfile.email" style="width: 100%; padding: 0.75rem; border: 1px solid rgba(26,46,26,0.15); border-radius: 6px; background: #f0f0f0" disabled />
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

            <div class="dashboard-sidebar-panel">
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
            </div>
          </div>
        </section>
</template>

<script>
export default {
  name: 'TabProfile',
  props: {
    profile: { type: Object, required: true }
  },
  emits: ['update-profile', 'update-password', 'change-tab'],
  data() {
    return {
      isEditing: false,
      editProfile: { ...this.profile },
      pwForm: { current: '', new: '', confirm: '' }
    };
  },
  watch: {
    profile: {
      handler(val) {
        this.editProfile = { ...val };
      },
      deep: true
    }
  },
  methods: {
    goTab(tab) {
      this.$emit('change-tab', tab);
    },
    toggleEdit() {
      if (this.isEditing) {
        this.editProfile = { ...this.profile };
      }
      this.isEditing = !this.isEditing;
    },
    saveProfile() {
      this.$emit('update-profile', {
        updatedFields: this.editProfile,
        successCallback: () => {
          this.isEditing = false;
        }
      });
    },
    changePassword() {
      this.$emit('update-password', {
        pwForm: this.pwForm,
        successCallback: () => {
          this.pwForm = { current: '', new: '', confirm: '' };
        }
      });
    },
    handleFileChange(e) {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          this.editProfile.profile_image_url = event.target.result;
        };
        reader.readAsDataURL(file);
      }
    }
  }
};
</script>
