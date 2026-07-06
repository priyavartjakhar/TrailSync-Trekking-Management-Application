<template>
  <section class="tab-content social-tab-container" style="display: flex; flex-direction: column; gap: 0; height: calc(100vh - 120px); min-height: 500px; padding: 0;">
    <div class="page-header" style="flex-shrink: 0; margin-bottom: 1rem;">
      <div>
        <div class="page-eyebrow">Communication</div>
        <div class="page-title">TrailSync <em>Social</em></div>
      </div>
      <button class="btn-back-home" @click="goTab('dashboard')"><i class="bi bi-house-door-fill me-1"></i>Back to Home</button>
    </div>

    <div class="social-tab-shell">
      <div v-if="isMobileView && !selectedSocialTrekId" class="social-channels-panel ts-card">
        <div class="ts-card-header">
          <div class="ts-card-title"><i class="bi bi-people-fill"></i> Social Groups</div>
        </div>
        <div class="social-channels-list" style="flex: 1; overflow-y: auto; padding: 0.75rem;">
          <div v-for="g in socialGroups" :key="g.id"
               :class="['social-channel-item', { active: selectedSocialTrekId === g.id }]"
               @click="selectGroup(g.id)"
               style="padding: 0.75rem; border-radius: 6px; cursor: pointer; margin-bottom: 0.5rem; transition: var(--transition);">
            <div class="d-flex justify-content-between align-items-start mb-1">
              <span class="channel-name fw-bold" style="font-size: 0.85rem; color: var(--forest); display: flex; align-items: center; gap: 4px;">
                <i class="bi bi-hash"></i> {{ g.name }}
                <i v-if="g.isLocked" class="bi bi-lock-fill text-danger" style="font-size: 0.75rem;" title="Chat is Locked"></i>
              </span>
              <span :class="'status-pill status-' + g.status.toLowerCase()" style="font-size: 0.6rem; padding: 2px 6px;">{{ g.status }}</span>
            </div>
            <div class="channel-sub text-muted d-flex justify-content-between" style="font-size: 0.7rem;">
              <span>Batch {{ g.batchCode }}</span>
              <span>{{ g.memberCount }} members</span>
            </div>
          </div>
          <div v-if="!socialGroups.length" class="text-center py-4 text-muted" style="font-size: 0.8rem;">
            No active trekking groups found.
          </div>
        </div>
      </div>

      <div v-else-if="isMobileView && selectedSocialTrekId" class="social-mobile-chat-shell">
        <div class="ts-card social-mobile-chat-card">
          <div class="ts-card-header d-flex justify-content-between align-items-center">
            <div>
              <div class="ts-card-title m-0 d-flex align-items-center" v-if="selectedSocialGroupTrek">
                <i class="bi bi-chat-left-dots-fill"></i>
                <span style="margin-left:8px">{{ selectedSocialGroupTrek.name }}</span>
              </div>
              <div class="text-muted" style="font-size: 0.72rem; margin-top: 2px;" v-if="selectedSocialGroupTrek">
                Batch {{ selectedSocialGroupTrek.batchCode }} · {{ selectedSocialGroupTrek.status }}
              </div>
            </div>
            <div class="social-mobile-actions">
              <button class="btn btn-sm btn-outline-forest" @click="backToGroups">Back</button>
              <button class="btn btn-sm btn-outline-secondary" @click="closeChat">Close</button>
              <button class="btn btn-sm btn-outline-forest" @click="toggleMembers">{{ showMobileMembers ? 'Hide Members' : 'View Members' }}</button>
            </div>
          </div>

          <div class="social-chat-feed" style="flex: 1; overflow-y: auto; padding: 1.25rem; background: var(--snow);">
            <div v-if="currentGroupAnnouncements.length > 0" class="announcement-banner p-3 mb-3 d-flex align-items-center gap-3" style="background: #fef2f2; border: 1px solid #fca5a5; border-left: 5px solid #ef4444; border-radius: 6px; color: #991b1b; font-size: 0.85rem;">
              <i class="bi bi-megaphone-fill fs-5" style="color: #ef4444;"></i>
              <div style="flex: 1;">
                <strong style="font-weight: 700;">Announcement: {{ currentGroupAnnouncements[0].title }}</strong>
                <div style="font-size: 0.78rem; opacity: 0.9; margin-top: 2px;">{{ currentGroupAnnouncements[0].content }}</div>
              </div>
            </div>

            <div v-for="m in currentGroupMessages" :key="m.id"
                 :class="['chat-bubble-wrap', m.sender === 'guide' ? 'guide-message' : 'trekker-message']"
                 :style="{
                   marginBottom: '1rem',
                   display: 'flex',
                   flexDirection: 'column',
                   alignItems: m.isAnnouncement ? 'center' : m.sender === 'guide' ? 'flex-start' : 'flex-end'
                 }">
              <div v-if="!m.isAnnouncement" class="chat-meta d-flex align-items-center mb-1" style="font-size: 0.7rem; gap: 6px;">
                <span class="chat-sender-name fw-bold" :style="{ color: m.sender === 'guide' ? 'var(--gold)' : 'var(--forest)' }">{{ m.name }}</span>
                <span class="badge bg-gold text-dark" style="font-size:0.58rem; padding: 2px 4px;" v-if="m.sender === 'guide'">Guide</span>
                <span class="chat-time text-muted">{{ m.timestamp }}</span>
              </div>
              <div class="chat-bubble"
                   :style="getChatBubbleStyle(m)"
                   style="padding: 0.75rem; border-radius: 8px; max-width: 80%; font-size: 0.83rem; line-height: 1.5; width: fit-content;">
                {{ m.text }}
              </div>
            </div>
            <div v-if="!currentGroupMessages.length" class="text-center py-5 text-muted" style="font-size: 0.85rem;">
              <i class="bi bi-chat-dots fs-3 mb-2 d-block"></i>
              No messages yet. Send a message to start the conversation!
            </div>
          </div>

          <div class="social-chat-input-bar border-top" style="padding: 1rem; background: var(--cream);">
            <div v-if="selectedSocialGroupTrek && selectedSocialGroupTrek.isLocked" class="text-center p-3 text-danger fw-bold" style="background: rgba(220,53,69,0.06); border: 1px solid rgba(220,53,69,0.15); border-radius: 6px; font-size: 0.8rem; display: flex; align-items: center; justify-content: center; gap: 6px;">
              <i class="bi bi-lock-fill"></i> This group chat has been locked by the guide. Only guides can post messages.
            </div>
            <form v-else @submit.prevent="sendMessage" class="d-flex gap-2">
              <input v-model="newMessage" type="text" class="form-control" placeholder="Type a message to the group..." style="font-size: 0.85rem; border-radius: 6px;" required />
              <button type="submit" class="btn btn-primary-ts px-4" style="font-size: 0.85rem;">
                <i class="bi bi-send-fill"></i> Send
              </button>
            </form>
          </div>

          <div v-if="showMobileMembers" class="social-mobile-members-panel ts-card">
            <div class="ts-card-header" style="padding: 0.75rem 1rem;">
              <div class="ts-card-title" style="font-size: 0.82rem; margin: 0;"><i class="bi bi-people"></i> Group Members</div>
            </div>
            <div class="ts-card-body" style="padding: 0.5rem; overflow-y: auto; flex: 1;">
              <div style="display: flex; flex-direction: column; gap: 0.4rem;">
                <div v-for="p in socialGroupMembersList" :key="p.id"
                     @click="viewFellowProfile(p)"
                     class="member-dir-item d-flex align-items-center justify-content-between p-2"
                     style="border-radius: 6px; cursor: pointer; transition: var(--transition); background: p.role === 'guide' ? 'var(--cream)' : 'transparent'; border: 1px solid transparent;">
                  <div class="d-flex align-items-center gap-2">
                    <div class="member-avatar d-flex align-items-center justify-content-center fw-bold"
                         :style="{ background: p.role === 'guide' ? 'var(--gold)' : 'var(--stone-light)', color: p.role === 'guide' ? '#fff' : 'var(--forest)' }"
                         style="width: 26px; height: 26px; border-radius: 50%; font-size: 0.72rem;">
                      {{ p.name[0] }}
                    </div>
                    <div>
                      <div class="fw-bold" style="font-size: 0.76rem; color: var(--forest);">{{ p.name }}</div>
                      <div class="text-muted" style="font-size: 0.62rem; text-transform: capitalize;">
                        {{ p.role === 'guide' ? 'Lead Guide' : 'Trekker' }}
                      </div>
                    </div>
                  </div>
                  <span v-if="p.role === 'guide'" class="badge bg-gold text-dark" style="font-size: 0.55rem; font-weight: 700; padding: 2px 4px;">Guide</span>
                  <i v-else class="bi bi-chevron-right text-muted" style="font-size: 0.65rem;"></i>
                </div>
                <div v-if="!socialGroupMembersList.length" class="text-center py-4 text-muted" style="font-size: 0.72rem;">
                  No members list loaded.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div v-else class="social-desktop-layout">
        <div class="social-channels-panel ts-card" style="width: 280px; display: flex; flex-direction: column; flex-shrink: 0;">
          <div class="ts-card-header">
            <div class="ts-card-title"><i class="bi bi-people-fill"></i> Social Groups</div>
          </div>
          <div class="social-channels-list" style="flex: 1; overflow-y: auto; padding: 0.75rem;">
            <div v-for="g in socialGroups" :key="g.id"
                 :class="['social-channel-item', { active: selectedSocialTrekId === g.id }]"
                 @click="selectGroup(g.id)"
                 style="padding: 0.75rem; border-radius: 6px; cursor: pointer; margin-bottom: 0.5rem; transition: var(--transition);">
              <div class="d-flex justify-content-between align-items-start mb-1">
                <span class="channel-name fw-bold" style="font-size: 0.85rem; color: var(--forest); display: flex; align-items: center; gap: 4px;">
                  <i class="bi bi-hash"></i> {{ g.name }}
                  <i v-if="g.isLocked" class="bi bi-lock-fill text-danger" style="font-size: 0.75rem;" title="Chat is Locked"></i>
                </span>
                <span :class="'status-pill status-' + g.status.toLowerCase()" style="font-size: 0.6rem; padding: 2px 6px;">{{ g.status }}</span>
              </div>
              <div class="channel-sub text-muted d-flex justify-content-between" style="font-size: 0.7rem;">
                <span>Batch {{ g.batchCode }}</span>
                <span>{{ g.memberCount }} members</span>
              </div>
            </div>
            <div v-if="!socialGroups.length" class="text-center py-4 text-muted" style="font-size: 0.8rem;">
              No active trekking groups found.
            </div>
          </div>
        </div>

        <div v-if="!selectedSocialTrekId" class="ts-card d-flex flex-column align-items-center justify-content-center text-center p-5" style="flex: 1; background: #ffffff; min-height: 400px; border: 1px solid rgba(26,46,26,0.08);">
          <i class="bi bi-chat-left-dots-fill" style="font-size: 3.5rem; color: var(--gold); opacity: 0.6; margin-bottom: 1rem;"></i>
          <h3 style="font-family: 'Playfair Display', serif; font-size: 1.5rem; color: var(--forest); font-weight: 700; margin-bottom: 0.5rem;">Select group to start chat</h3>
          <p class="text-muted" style="max-width: 380px; font-size: 0.9rem; line-height: 1.5;">
            Please select a trekking group from the list on the left to start communicating with fellow travelers, view guide announcements, and see traveler profiles.
          </p>
        </div>

        <template v-else>
          <div class="ts-card d-flex flex-column" style="flex: 2; min-width: 0;">
            <div class="ts-card-header d-flex justify-content-between align-items-center">
              <div>
                <div class="ts-card-title m-0 d-flex align-items-center" v-if="selectedSocialGroupTrek">
                  <i class="bi bi-chat-left-dots-fill"></i>
                  <span style="margin-left:8px">Group Chat: {{ selectedSocialGroupTrek.name }}</span>
                </div>
                <div class="text-muted" style="font-size: 0.72rem; margin-top: 2px;" v-if="selectedSocialGroupTrek">
                  Batch Code: {{ selectedSocialGroupTrek.batchCode }} | Status: {{ selectedSocialGroupTrek.status }}
                </div>
              </div>
              <div>
                <button class="btn btn-sm btn-outline-secondary" @click="closeChat" title="Close chat" style="font-size:0.78rem; padding:4px 8px;">
                  <i class="bi bi-x-lg"></i>
                </button>
              </div>
            </div>

            <div class="social-chat-feed" style="flex: 1; overflow-y: auto; padding: 1.25rem; background: var(--snow);">
              <div v-if="currentGroupAnnouncements.length > 0" class="announcement-banner p-3 mb-3 d-flex align-items-center gap-3" style="background: #fef2f2; border: 1px solid #fca5a5; border-left: 5px solid #ef4444; border-radius: 6px; color: #991b1b; font-size: 0.85rem;">
                <i class="bi bi-megaphone-fill fs-5" style="color: #ef4444;"></i>
                <div style="flex: 1;">
                  <strong style="font-weight: 700;">Announcement: {{ currentGroupAnnouncements[0].title }}</strong>
                  <div style="font-size: 0.78rem; opacity: 0.9; margin-top: 2px;">{{ currentGroupAnnouncements[0].content }}</div>
                </div>
              </div>

              <div v-for="m in currentGroupMessages" :key="m.id"
                   :class="['chat-bubble-wrap', m.sender === 'guide' ? 'guide-message' : 'trekker-message']"
                   :style="{
                     marginBottom: '1rem',
                     display: 'flex',
                     flexDirection: 'column',
                     alignItems: m.isAnnouncement ? 'center' : m.sender === 'guide' ? 'flex-start' : 'flex-end'
                   }">
                <div v-if="!m.isAnnouncement" class="chat-meta d-flex align-items-center mb-1" style="font-size: 0.7rem; gap: 6px;">
                  <span class="chat-sender-name fw-bold" :style="{ color: m.sender === 'guide' ? 'var(--gold)' : 'var(--forest)' }">{{ m.name }}</span>
                  <span class="badge bg-gold text-dark" style="font-size:0.58rem; padding: 2px 4px;" v-if="m.sender === 'guide'">Guide</span>
                  <span class="chat-time text-muted">{{ m.timestamp }}</span>
                </div>
                <div class="chat-bubble"
                     :style="getChatBubbleStyle(m)"
                     style="padding: 0.75rem; border-radius: 8px; max-width: 80%; font-size: 0.83rem; line-height: 1.5; width: fit-content;">
                  {{ m.text }}
                </div>
              </div>
              <div v-if="!currentGroupMessages.length" class="text-center py-5 text-muted" style="font-size: 0.85rem;">
                <i class="bi bi-chat-dots fs-3 mb-2 d-block"></i>
                No messages yet. Send a message to start the conversation!
              </div>
            </div>

            <div class="social-chat-input-bar border-top" style="padding: 1rem; background: var(--cream);">
              <div v-if="selectedSocialGroupTrek && selectedSocialGroupTrek.isLocked" class="text-center p-3 text-danger fw-bold" style="background: rgba(220,53,69,0.06); border: 1px solid rgba(220,53,69,0.15); border-radius: 6px; font-size: 0.8rem; display: flex; align-items: center; justify-content: center; gap: 6px;">
                <i class="bi bi-lock-fill"></i> This group chat has been locked by the guide. Only guides can post messages.
              </div>
              <form v-else @submit.prevent="sendMessage" class="d-flex gap-2">
                <input v-model="newMessage" type="text" class="form-control" placeholder="Type a message to the group..." style="font-size: 0.85rem; border-radius: 6px;" required />
                <button type="submit" class="btn btn-primary-ts px-4" style="font-size: 0.85rem;">
                  <i class="bi bi-send-fill"></i> Send
                </button>
              </form>
            </div>
          </div>

          <div class="d-flex flex-column gap-3" style="width: 320px; flex-shrink: 0;">
            <div class="ts-card d-flex flex-column" style="flex: 1; min-height: 0; border: 1px solid var(--stone-light);">
              <div class="ts-card-header" style="padding: 0.75rem 1rem;">
                <div class="ts-card-title" style="font-size: 0.82rem; margin: 0;"><i class="bi bi-people"></i> Group Members</div>
              </div>
              <div class="ts-card-body" style="padding: 0.5rem; overflow-y: auto; flex: 1;">
                <div style="display: flex; flex-direction: column; gap: 0.4rem;">
                  <div v-for="p in socialGroupMembersList" :key="p.id"
                       @click="viewFellowProfile(p)"
                       class="member-dir-item d-flex align-items-center justify-content-between p-2"
                       style="border-radius: 6px; cursor: pointer; transition: var(--transition); background: p.role === 'guide' ? 'var(--cream)' : 'transparent'; border: 1px solid transparent;">
                    <div class="d-flex align-items-center gap-2">
                      <div class="member-avatar d-flex align-items-center justify-content-center fw-bold"
                           :style="{ background: p.role === 'guide' ? 'var(--gold)' : 'var(--stone-light)', color: p.role === 'guide' ? '#fff' : 'var(--forest)' }"
                           style="width: 26px; height: 26px; border-radius: 50%; font-size: 0.72rem;">
                        {{ p.name[0] }}
                      </div>
                      <div>
                        <div class="fw-bold" style="font-size: 0.76rem; color: var(--forest);">{{ p.name }}</div>
                        <div class="text-muted" style="font-size: 0.62rem; text-transform: capitalize;">
                          {{ p.role === 'guide' ? 'Lead Guide' : 'Trekker' }}
                        </div>
                      </div>
                    </div>
                    <span v-if="p.role === 'guide'" class="badge bg-gold text-dark" style="font-size: 0.55rem; font-weight: 700; padding: 2px 4px;">Guide</span>
                    <i v-else class="bi bi-chevron-right text-muted" style="font-size: 0.65rem;"></i>
                  </div>
                  <div v-if="!socialGroupMembersList.length" class="text-center py-4 text-muted" style="font-size: 0.72rem;">
                    No members list loaded.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </template>
      </div>
    </div>
  </section>
</template>

<script>
/**
 * =========================================================================
 * TabSocial.vue
 * =========================================================================
 * Coordinated chat view enabling hikers to text their assigned guide and view group announcements.
 * Refactored to handle chat messaging state and API requests locally.
 */

export default {
  name: 'TabSocial',
  props: {
    profile: { type: Object, required: true },
    socialGroups: { type: Array, default: () => [] }
  },
  emits: ['view-fellow-profile', 'change-tab', 'show-toast', 'refresh-groups'],
  data() {
    return {
      newMessage: '',
      isMobileView: false,
      showMobileMembers: false,
      selectedSocialTrekId: null,
      socialMessages: [],
      socialGroupMembersList: [],
      loadingSocial: false,
      socialPollInterval: null
    };
  },
  computed: {
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
    }
  },
  watch: {
    selectedSocialTrekId(newTrekId) {
      if (newTrekId) {
        this.fetchSocialGroupMessages(newTrekId);
        this.fetchSocialGroupMembers(newTrekId);
      } else {
        this.socialMessages = [];
        this.socialGroupMembersList = [];
      }
    }
  },
  mounted() {
    this.handleViewport();
    window.addEventListener('resize', this.handleViewport);
    this.hashListener = this.handleHashChange.bind(this);
    window.addEventListener('hashchange', this.hashListener);

    // Initial check for hash
    this.handleHashChange();

    // Start silent polling
    this.startPolling();
  },
  beforeUnmount() {
    window.removeEventListener('resize', this.handleViewport);
    window.removeEventListener('hashchange', this.hashListener);
    this.stopPolling();
  },
  methods: {
    handleViewport() {
      this.isMobileView = window.innerWidth <= 900;
      if (!this.isMobileView) {
        this.showMobileMembers = false;
      }
    },
    handleHashChange() {
      const hash = window.location.hash.slice(1);
      if (hash.startsWith('social/group/')) {
        const trekId = parseInt(hash.replace('social/group/', ''), 10);
        this.selectedSocialTrekId = isNaN(trekId) ? null : trekId;
      } else if (hash === 'social') {
        this.selectedSocialTrekId = null;
      }
    },
    goTab(tab) {
      this.$emit('change-tab', tab);
    },
    selectGroup(groupId) {
      this.showMobileMembers = false;
      this.selectedSocialTrekId = groupId;
      window.location.hash = `social/group/${groupId}`;
    },
    closeChat() {
      this.showMobileMembers = false;
      this.selectedSocialTrekId = null;
      window.location.hash = 'social';
    },
    backToGroups() {
      this.showMobileMembers = false;
      this.selectedSocialTrekId = null;
      window.location.hash = 'social';
    },
    toggleMembers() {
      this.showMobileMembers = !this.showMobileMembers;
    },
    async sendMessage() {
      if (!this.newMessage.trim() || !this.selectedSocialTrekId) return;
      const text = this.newMessage.trim();
      this.newMessage = '';
      try {
        const res = await fetch(`/api/social/group/${this.selectedSocialTrekId}/messages`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messageText: text })
        });
        if (res.ok) {
          await this.fetchSocialGroupMessages(this.selectedSocialTrekId);
        } else {
          const errData = await res.json();
          this.$emit('show-toast', errData.error || 'Failed to send message.', 'error');
        }
      } catch (e) {
        console.error("Error sending message:", e);
      }
    },
    viewFellowProfile(member) {
      this.$emit('view-fellow-profile', member);
    },
    async fetchSocialGroupMessages(trekId, options = {}) {
      if (!options.silent) this.loadingSocial = true;
      try {
        const res = await fetch(`/api/social/group/${trekId}/messages`);
        if (res.ok) {
          this.socialMessages = await res.json();
          if (!options.silent) {
            this.$nextTick(() => {
              const feed = this.$el.querySelector('.social-chat-feed');
              if (feed) feed.scrollTop = feed.scrollHeight;
            });
          }
          this.$emit('refresh-groups');
        }
      } catch (e) {
        console.error("Error fetching messages:", e);
      } finally {
        if (!options.silent) this.loadingSocial = false;
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
    startPolling() {
      this.stopPolling();
      this.socialPollInterval = setInterval(() => {
        if (this.selectedSocialTrekId) {
          this.fetchSocialGroupMessages(this.selectedSocialTrekId, { silent: true });
        }
      }, 15000);
    },
    stopPolling() {
      if (this.socialPollInterval) {
        clearInterval(this.socialPollInterval);
        this.socialPollInterval = null;
      }
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
          borderTopLeftRadius: '0px',
          borderTopRightRadius: '8px'
        };
      }
      return {
        background: '#ffffff',
        border: '1px solid rgba(26, 46, 26, 0.08)',
        color: 'var(--bark)',
        borderTopLeftRadius: '8px',
        borderTopRightRadius: '0px'
      };
    }
  }
};
</script>
