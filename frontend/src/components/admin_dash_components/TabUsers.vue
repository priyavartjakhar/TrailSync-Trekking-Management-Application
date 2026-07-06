<template>
      <section v-if="activeTab==='users'" class="tab-content">
        <div class="filter-bar">
          <button v-for="f in ['All','Active','Blacklisted']" :key="f"
            class="filter-btn" :class="{ active: userFilter===f }" @click="userFilter=f">{{ f }}</button>
        </div>
        <div class="ts-table-wrap">
          <table class="ts-table">
            <thead>
              <tr>
                <th>User ID</th>
                <th>Name</th>
                <th class="col-hide-mobile">Email</th>
                <th class="col-hide-mobile">Contact</th>
                <th class="col-hide-mobile">Joined</th>
                <th class="col-hide-mobile">Treks</th>
                <th class="col-hide-mobile">Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="u in filteredUsers" :key="u.id">
                <td class="mono" style="font-size: 0.8rem;">{{ u.memberId || 'TS26T' + u.id }}</td>
                <td>
                  <span style="font-weight:600; color:var(--forest)">{{ u.name }}</span>
                </td>
                <td class="mono col-hide-mobile">{{ u.email }}</td>
                <td class="mono col-hide-mobile" style="font-size: 0.8rem;">{{ u.phone || '—' }}</td>
                <td class="mono col-hide-mobile">{{ formatDate(u.registered) }}</td>
                <td class="col-hide-mobile">{{ u.bookings }}</td>
                <td class="col-hide-mobile">
                  <span :class="['status-pill', u.blacklisted ? 'status-inactive' : 'status-active']">
                    {{ u.blacklisted ? 'Blacklisted' : 'Active' }}
                  </span>
                </td>
                <td>
                  <div class="action-btns" style="display:flex; gap:6px;">
                    <button class="act-btn act-view" @click="viewUserDetails(u)" title="View Details">
                      <svg viewBox="0 0 24 24" class="act-btn-icon"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                      <span class="btn-text-hide-mobile">View Details</span>
                    </button>
                    <button class="act-btn act-edit" @click="openTrekkerModal(u)" title="Edit">
                      <svg viewBox="0 0 24 24" class="act-btn-icon"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
                      <span class="btn-text-hide-mobile">Edit</span>
                    </button>
                    <button class="act-btn" :class="u.blacklisted ? 'act-open' : 'act-blacklist-btn'" @click="toggleBlacklist(u)" :title="u.blacklisted ? 'Restore' : 'Blacklist'">
                      <svg viewBox="0 0 24 24" class="act-btn-icon" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"></line></svg>
                      <span class="btn-text-hide-mobile">{{ u.blacklisted ? 'Restore' : 'Blacklist' }}</span>
                    </button>
                  </div>
                </td>
              </tr>
              <tr v-if="!filteredUsers.length">
                <td colspan="8" style="text-align:center; padding:2rem; color:var(--stone)">No users match this filter.</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- ════════ ADD/EDIT TREKKER MODAL (Extracted from SAdminModals) ════════ -->
        <div v-if="showTrekkerModal" class="ts-modal-overlay" @click.self="closeTrekkerModal">
          <div class="ts-modal">
            <div class="ts-modal-header">
              <h3 class="ts-modal-title">{{ editingTrekker ? 'Edit User Profile' : 'Add New Trekker' }}</h3>
              <button class="modal-close" @click="closeTrekkerModal">✕</button>
            </div>
            <div class="ts-modal-body">
              <div class="form-grid">
                <div class="form-group form-full">
                  <label>Full Name <span style="color: var(--red); font-weight: bold;">*</span></label>
                  <input v-model="trekkerForm.name" type="text" placeholder="e.g. John Doe" />
                </div>
                <div class="form-group form-full">
                  <label>Email <span style="color: var(--red); font-weight: bold;">*</span></label>
                  <input v-model="trekkerForm.email" type="email" placeholder="john.doe@example.com" />
                </div>
                <div class="form-group">
                  <label>Phone Number</label>
                  <input v-model="trekkerForm.phone" type="text" placeholder="e.g. +91 9876543210" />
                </div>
                <div class="form-group">
                  <label>Password (Default: Trekker@123)</label>
                  <input v-model="trekkerForm.password" type="text" placeholder="Leave blank to keep unchanged" />
                </div>
                <div class="form-group">
                  <label>City</label>
                  <input v-model="trekkerForm.city" type="text" placeholder="e.g. Delhi" />
                </div>
                <div class="form-group">
                  <label>Emergency Contact</label>
                  <input v-model="trekkerForm.emergency" type="text" placeholder="e.g. +91 9999988888" />
                </div>
                <div class="form-group form-full">
                  <label>Bio / Medical Info</label>
                  <textarea v-model="trekkerForm.bio" placeholder="e.g. Has previous experience trekking, no medical history." rows="3"></textarea>
                </div>
              </div>
            </div>
            <div class="ts-modal-footer">
              <button class="btn-ghost" @click="closeTrekkerModal">Cancel</button>
              <button class="btn-primary-ts" @click="saveTrekker">{{ editingTrekker ? 'Save Changes' : 'Add Trekker' }}</button>
            </div>
          </div>
        </div>

        <!-- ════════ USER DETAILS MODAL (Extracted from SAdminModals) ════════ -->
        <div v-if="showUserDetailsModal && selectedUserDetails" class="ts-modal-overlay" @click.self="closeUserDetails">
          <div class="ts-modal large">
            <div class="ts-modal-header">
              <h3 class="ts-modal-title">User Account Details</h3>
              <button class="modal-close" @click="closeUserDetails">✕</button>
            </div>
            <div class="ts-modal-body">
              <div class="details-modal-grid">
                <!-- Left Side: Profile Photo & Basic Details -->
                <div style="text-align: center; border-right: 1px solid var(--stone-light); padding-right: 1.5rem;">
                  <img :src="selectedUserDetails.photoUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&h=300&fit=crop'" style="width: 140px; height: 140px; border-radius: 50%; object-fit: cover; margin: 0 auto 1rem; border: 3px solid var(--forest); box-shadow: 0 4px 10px rgba(0,0,0,0.1);" />
                  <h4 style="font-weight: 700; color: var(--forest); margin-bottom: 0.25rem;">{{ selectedUserDetails.name }}</h4>
                  <div style="font-size: 0.85rem; color: var(--stone); font-family: monospace; margin-bottom: 1rem;">ID: {{ selectedUserDetails.memberId }}</div>
                  
                  <div class="staff-detail-info" style="text-align: left; background: var(--snow); padding: 1rem; border-radius: 6px; border: 1px solid var(--stone-light); font-size: 0.84rem;">
                    <div><strong>Email:</strong> {{ selectedUserDetails.email }}</div>
                    <div><strong>Phone:</strong> {{ selectedUserDetails.phone || '—' }}</div>
                    <div><strong>City:</strong> {{ selectedUserDetails.city || '—' }}</div>
                    <div><strong>Emergency Contact:</strong> {{ selectedUserDetails.emergency || '—' }}</div>
                    <div><strong>Joined:</strong> {{ formatDate(selectedUserDetails.registered) }}</div>
                    <div><strong>Bio:</strong> {{ selectedUserDetails.bio || 'No bio provided.' }}</div>
                  </div>
                </div>
                
                <!-- Right Side: Booking Details History Table -->
                <div>
                  <div class="timeline-section-title" style="font-weight: 700; color: var(--forest); font-size: 1.05rem; margin-bottom: 0.75rem;">
                    Trek Bookings History ({{ selectedUserDetails.bookingsList ? selectedUserDetails.bookingsList.length : 0 }})
                  </div>
                  <div class="ts-table-wrap" v-if="selectedUserDetails.bookingsList && selectedUserDetails.bookingsList.length" style="max-height: 360px; overflow-y: auto;">
                    <table class="ts-table">
                      <thead>
                        <tr>
                          <th>Batch ID</th>
                          <th>Trek Name</th>
                          <th>Paid Amount</th>
                          <th>Paid On</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr v-for="b in selectedUserDetails.bookingsList" :key="b.id">
                          <td class="mono font-bold">{{ b.batchCode }}</td>
                          <td style="font-weight: 600; color: var(--forest);">{{ b.trek }}</td>
                          <td class="mono">₹{{ (b.amountPaid || b.bookingPrice || 0).toLocaleString() }}</td>
                          <td class="mono" style="white-space: nowrap;">{{ b.paidOn === '—' ? '—' : formatDate(b.paidOn) }}</td>
                          <td>
                            <span :class="['status-pill', b.status === 'Booked' ? 'status-active' : (b.status === 'Completed' ? 'status-open' : 'status-inactive')]" style="font-size: 0.72rem; padding: 2px 6px;">
                              {{ b.status }}
                            </span>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  <div v-else style="font-size:0.8rem; color:var(--stone); font-style:italic; text-align:center; padding:3rem 1rem; background: var(--snow); border-radius: 6px; border: 1px dashed var(--stone);">
                    No booking history records found for this user.
                  </div>
                </div>
              </div>
            </div>
            <div class="ts-modal-footer">
              <button class="btn-primary-ts" @click="closeUserDetails">Close</button>
            </div>
          </div>
        </div>

        <!-- ════════ BLACKLIST REASON MODAL (Trekker specific) ════════ -->
        <div v-if="showBlacklistModal" class="ts-modal-overlay" @click.self="closeBlacklistModal" style="z-index: 3000;">
          <div class="ts-modal" style="max-width: 450px;">
            <div class="ts-modal-header" style="border-bottom: none; padding-bottom: 0;">
              <h3 class="ts-modal-title" style="color: var(--red); display: flex; align-items: center; gap: 8px;">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"></line></svg>
                <span>Blacklist User Account</span>
              </h3>
              <button class="modal-close" @click="closeBlacklistModal">✕</button>
            </div>
            <div class="ts-modal-body" style="padding-top: 1rem; padding-bottom: 1.5rem; font-size: 0.9rem;">
              <p style="margin-bottom: 0.75rem; color: var(--forest-mid);">
                Are you sure you want to blacklist <strong>{{ blacklistTargetUser ? blacklistTargetUser.name : '' }}</strong>? This will prevent them from logging in and accessing their dashboard.
              </p>
              <div class="form-group" style="margin-top: 1rem;">
                <label style="font-weight: 600; color: var(--forest); display: block; margin-bottom: 0.5rem;">Reason for Blacklisting:</label>
                <textarea 
                  v-model="blacklistReasonText" 
                  placeholder="Enter reason for blacklisting..." 
                  rows="4" 
                  style="width: 100%; padding: 0.5rem; border: 1px solid var(--stone); border-radius: var(--radius); font-size: 0.85rem; font-family: inherit; resize: vertical;"
                ></textarea>
              </div>
            </div>
            <div class="ts-modal-footer" style="background: var(--snow); border-top: 1px solid var(--stone-light);">
              <button class="btn-ghost" @click="closeBlacklistModal">Cancel</button>
              <button class="btn-primary-ts" style="background: var(--red); border-color: var(--red);" @click="submitBlacklist">Blacklist Account</button>
            </div>
          </div>
        </div>

      </section>
</template>

<script>
/**
 * =========================================================================
 * TabUsers.vue
 * =========================================================================
 * Trekkers (User) registry manager — handles registry viewing, profile detail
 * checks, trekker account registration (Add User), updating user details,
 * and blacklisting/restoration actions.
 *
 * Uses 'adminDashComponent' dynamic options proxying to link state/methods
 * reactivity directly with the parent 'AdminDashboard' coordinator.
 */
import { adminDashComponent } from './adminDashProxy';

export default adminDashComponent('TabUsers', {
  data() {
    return {
      userFilter: 'All'
    };
  },

  computed: {
    // Filter registry list based on active/blacklisted state and global search
    filteredUsers() {
      const usersList = this.users || [];
      let list = usersList;
      if (this.userFilter === 'Active') {
        list = list.filter(u => !u.blacklisted);
      } else if (this.userFilter === 'Blacklisted') {
        list = list.filter(u => u.blacklisted);
      }

      const q = (this.adminDash.searchQuery || '').toLowerCase().trim();
      if (q) {
        list = list.filter(u => {
          const memberIdStr = u.memberId ? u.memberId.toLowerCase() : ('ts26t' + u.id);
          const idStr = String(u.id);
          return u.name.toLowerCase().includes(q) ||
            u.email.toLowerCase().includes(q) ||
            memberIdStr.includes(q) ||
            idStr.includes(q);
        });
      }
      return list;
    }
  },

  methods: {
    // Format Date string for display on UI fields
    formatDate(dateStr) {
      if (!dateStr) return '';
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    },

    // Validates inputs and fires the save request to create/update trekker account
    async saveTrekker() {
      if (!this.trekkerForm.name || !this.trekkerForm.name.trim()) {
        this.showToast('Name is required');
        return;
      }
      if (!this.trekkerForm.email || !this.trekkerForm.email.trim()) {
        this.showToast('Email is required');
        return;
      }
      try {
        // Call backend API to save user details (creates if id is absent, updates if present)
        const res = await fetch('/api/admin/trekkers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(this.trekkerForm)
        });
        if (res.ok) {
          this.showToast(this.editingTrekker ? 'User profile updated' : 'User account created');
          this.loadData(); // Sync updated users lists from DB
          this.closeTrekkerModal();
        } else {
          const d = await res.json();
          this.showToast(d.error || 'Failed to save user');
        }
      } catch (_) {
        const uList = this.users;
        if (this.editingTrekker) {
          const idx = uList.findIndex(x => x.id === this.editingTrekker.id);
          if (idx !== -1) {
            uList[idx] = { ...uList[idx], ...this.trekkerForm };
          }
          this.showToast('User profile updated (offline)');
        } else {
          const newId = uList.length ? Math.max(...uList.map(x => x.id)) + 1 : 1;
          uList.push({
            id: newId,
            memberId: `TS26T${String(newId).padStart(3, '0')}`,
            name: this.trekkerForm.name,
            email: this.trekkerForm.email,
            phone: this.trekkerForm.phone || '9876543210',
            city: this.trekkerForm.city || 'Unknown',
            blacklisted: false,
            registeredAt: new Date().toLocaleDateString('en-CA')
          });
          this.showToast('User account created (offline)');
        }
        this.closeTrekkerModal();
      }
    },

    // Loads selected user profile details, attaches random avatars and filters user's bookings history
    viewUserDetails(u) {
      const photos = [
        "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&h=300&fit=crop",
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=300&fit=crop",
        "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&h=300&fit=crop",
        "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300&h=300&fit=crop",
        "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=300&h=300&fit=crop"
      ];
      // Attach a deterministic index photo so avatars don't randomly flip during view
      u.photoUrl = photos[u.id % photos.length];
      const bookingsList = this.allBookings || [];
      // Filter bookings belonging to this specific user
      u.bookingsList = bookingsList.filter(b => b.userId === u.id);
      this.selectedUserDetails = u;
      this.showUserDetailsModal = true;
    },
    // Dismisses the user details popup
    closeUserDetails() {
      this.showUserDetailsModal = false;
      this.selectedUserDetails = null;
    },

    // Restores user if already blacklisted, otherwise opens blacklist reason dialog
    async toggleBlacklist(u) {
      if (u.blacklisted) {
        try {
          // Immediately POST to restore API endpoint
          const res = await fetch(`/api/admin/users/restore/${u.id}`, { method: 'POST' });
          if (res.ok) {
            this.showToast(`${u.name} restored`);
            this.loadData(); // Synchronize listing
            return;
          }
        } catch (_) {}
        this.showToast('Failed to restore user.');
      } else {
        // Trigger dialog to request blacklisting reason statement
        this.blacklistTargetUser = u;
        this.blacklistReasonText = '';
        this.showBlacklistModal = true;
      }
    },
    // Closes blacklist target prompt
    closeBlacklistModal() {
      this.showBlacklistModal = false;
      this.blacklistTargetUser = null;
      this.blacklistReasonText = '';
    },
    // Submits the reason and invokes API to blacklist the trekker account
    async submitBlacklist() {
      if (!this.blacklistTargetUser) return;
      const u = this.blacklistTargetUser;
      const reason = this.blacklistReasonText.trim() || 'Policy violation';
      try {
        const res = await fetch(`/api/admin/users/blacklist/${u.id}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ reason: reason })
        });
        if (res.ok) {
          this.showToast(`${u.name} blacklisted`);
          this.closeBlacklistModal();
          this.loadData(); // Sync blacklists and listing UI
        } else {
          const d = await res.json();
          this.showToast(d.error || 'Failed to blacklist user.');
        }
      } catch (_) {
        this.showToast('Failed to blacklist user (error).');
      }
    }
  }
});
</script>
