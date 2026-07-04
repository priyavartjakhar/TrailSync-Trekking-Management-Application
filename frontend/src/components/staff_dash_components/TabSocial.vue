<template>
      <div class="tab-content social-tab-container" :class="{ 'chat-active': selectedSocialTrekId, 'info-active': showMobileMembers }" style="display: flex; flex-direction: column; gap: 0; height: calc(100vh - 80px); min-height: 500px;">
        <!-- Social tab header -->
        <div class="page-header" style="flex-shrink: 0; margin-bottom: 1rem;">
          <div>
            <div class="section-eyebrow">Communication</div>
            <div class="section-title">TrailSync <em>Social</em></div>
          </div>
          <button class="btn-back-home" @click="goTab('dashboard')"><i class="bi bi-house-door-fill me-1"></i>Back to Home</button>
        </div>
        <!-- Social content row -->
        <div class="social-content-row" style="display: flex; gap: 1.5rem; flex: 1; min-height: 0;">
        
        <!-- Left column: Channels list -->
        <div class="social-channels-panel ts-card" style="width: 280px; display: flex; flex-direction: column; flex-shrink: 0;">
          <div class="ts-card-header">
            <div class="ts-card-title"><i class="bi bi-people-fill"></i> Social Groups</div>
          </div>
          <div class="social-channels-list" style="flex: 1; overflow-y: auto; padding: 0.75rem;">
            <!-- Pending groups section -->
            <div v-if="pendingGroups.length">
              <div style="font-weight:700; font-size:0.75rem; color:var(--stone); text-transform:uppercase; padding:0.5rem 0; margin-bottom:0.5rem; border-bottom:1px solid var(--stone-light);">
                <i class="bi bi-hourglass-split"></i> Pending
              </div>
              <div v-for="p in pendingGroups" :key="'pending-' + p.id" 
                   style="padding: 0.75rem; border-radius: 6px; background:var(--cream); margin-bottom:0.5rem; border:1px dashed var(--gold);">
                <div class="d-flex justify-content-between align-items-start mb-2">
                  <div>
                    <div class="fw-bold" style="font-size: 0.84rem; color: var(--forest);">{{ p.name }}</div>
                    <div class="text-muted" style="font-size: 0.7rem;">Batch {{ p.batchCode }}</div>
                  </div>
                </div>
                <button class="btn btn-sm btn-success w-100" @click="createGroup(p.id)" style="font-size:0.75rem; padding:4px 8px;">
                  <i class="bi bi-plus-circle"></i> Create Group
                </button>
              </div>
              <div style="border-bottom:1px solid var(--stone-light); margin-bottom:0.75rem;"></div>
            </div>

            <!-- Created groups -->
            <div v-if="socialGroups.length">
              <div style="font-weight:700; font-size:0.75rem; color:var(--stone); text-transform:uppercase; padding:0.5rem 0; margin-bottom:0.5rem;" v-if="pendingGroups.length">
                <i class="bi bi-chat-dots-fill"></i> Active
              </div>
              <div v-for="t in socialGroups" :key="t.id" 
                   :class="['social-channel-item', { active: selectedSocialTrekId === t.id, 'completed-group-locked': isGroupCompleted(t) }]"
                   @click="isGroupCompleted(t) ? null : selectSocialGroup(t.id)"
                   :style="{
                     padding: '0.75rem',
                     borderRadius: '6px',
                     cursor: isGroupCompleted(t) ? 'not-allowed' : 'pointer',
                     marginBottom: '0.5rem',
                     opacity: isGroupCompleted(t) ? '0.7' : '1',
                     background: isGroupCompleted(t) ? '#f0ede6' : '',
                     transition: 'var(--transition)'
                   }">
                <div class="d-flex justify-content-between align-items-start mb-1">
                  <span class="channel-name fw-bold" style="font-size: 0.85rem; color: var(--forest); display: flex; align-items: center; gap: 4px;">
                    <i class="bi" :class="isGroupCompleted(t) ? 'bi-lock-fill text-muted' : 'bi-hash'"></i> {{ t.name }}
                    <i v-if="t.isLocked && !isGroupCompleted(t)" class="bi bi-lock-fill text-danger" style="font-size: 0.75rem;" title="Chat is Locked"></i>
                  </span>
                  <span :class="isGroupCompleted(t) ? 'status-pill status-completed' : 'status-pill status-' + t.status.toLowerCase()" style="font-size: 0.6rem; padding: 2px 6px;">{{ isGroupCompleted(t) ? 'Completed' : t.status }}</span>
                </div>
                <div class="channel-sub text-muted d-flex justify-content-between" style="font-size: 0.7rem;">
                  <span>Batch {{ t.batchCode }}</span>
                  <span>{{ t.memberCount }} members</span>
                </div>
              </div>
            </div>
            <div v-if="!socialGroups.length && !pendingGroups.length" class="text-center py-4 text-muted" style="font-size: 0.8rem;">
              No groups available.
            </div>
          </div>
        </div>

        <!-- Chat area (main) -->
        <div class="social-chat-area" style="flex: 1; min-width: 0; display: flex; flex-direction: column; min-height: 0;">
          
          <div v-if="!selectedSocialTrekId" class="ts-card d-flex flex-column align-items-center justify-content-center text-center p-5" style="flex: 1; background: #ffffff; min-height: 400px; border: 1px solid rgba(26,46,26,0.08);">
            <i class="bi bi-chat-left-dots-fill" style="font-size: 3.5rem; color: var(--gold); opacity: 0.6; margin-bottom: 1rem;"></i>
            <h3 style="font-family: 'Playfair Display', serif; font-size: 1.5rem; color: var(--forest); font-weight: 700; margin-bottom: 0.5rem;">Select group to start chat</h3>
            <p class="text-muted" style="max-width: 380px; font-size: 0.9rem; line-height: 1.5;">
              Please select a trekking group from the list on the left to start communicating with participants.
            </p>
          </div>

          <template v-else>
            <!-- Chat area (middle) -->
            <div class="ts-card d-flex flex-column" style="flex: 1; min-width: 0; min-height: 0; max-height: 100%;">
              <div class="ts-card-header d-flex justify-content-between align-items-center" style="gap: 0.5rem; flex-wrap: nowrap; padding: 0.75rem 1rem;">
                <div style="display: flex; align-items: center; gap: 8px; min-width: 0; flex: 1;">
                  <!-- Back button on mobile view -->
                  <button class="btn btn-sm btn-outline-secondary d-md-none me-1" @click="selectedSocialTrekId = null" style="padding: 4px 8px;">
                    <i class="bi bi-chevron-left"></i>
                  </button>
                  <div class="ts-card-title m-0 text-truncate" v-if="selectedSocialGroupTrek" style="display:flex; align-items:center; gap:6px; font-size: 1.05rem;">
                    <i class="bi bi-chat-left-dots-fill"></i> {{ selectedSocialGroupTrek.name }}
                  </div>
                </div>
                <div class="d-flex align-items-center gap-2" style="flex-shrink: 0;">
                  <!-- Info Toggle on mobile -->
                  <button class="btn btn-sm btn-outline-forest d-md-none" @click="showMobileMembers = true" style="font-size: 0.72rem; font-weight: 600; padding: 4px 8px; border-radius: 4px; display: flex; align-items: center; gap: 4px;">
                    <i class="bi bi-info-circle-fill"></i> Info
                  </button>
                  <div v-if="selectedSocialGroupTrek" class="d-none d-md-block">
                    <button class="btn btn-sm btn-outline-danger" @click="toggleSocialGroupLock(selectedSocialGroupTrek.id)" style="font-size: 0.72rem; font-weight: 600; padding: 4px 8px; border-radius: 4px; display: flex; align-items: center; gap: 4px;">
                      <i class="bi" :class="selectedSocialGroupTrek.isLocked ? 'bi-unlock-fill' : 'bi-lock-fill'"></i>
                      {{ selectedSocialGroupTrek.isLocked ? 'Unlock Group Chat' : 'Lock Group Chat' }}
                    </button>
                  </div>
                  <button class="btn btn-sm btn-outline-secondary" @click="closeSocialChat" title="Close chat" style="font-size:0.78rem; padding:4px 8px;">
                    <i class="bi bi-x-lg"></i>
                  </button>
                </div>
              </div>
              
              <!-- Chat messages feed -->
              <div ref="socialChatFeed" class="social-chat-feed" style="flex: 1 1 auto; overflow-y: auto; padding: 1.25rem; background: var(--cream); min-height: 0; max-height: calc(100vh - 320px);">

                <div v-for="m in currentGroupMessages" :key="m.id" 
                     :class="['chat-bubble-wrap', m.sender === 'guide' ? 'guide-message' : m.sender === 'system' || m.name === 'System' ? 'system-message' : 'trekker-message']"
                     :style="{
                       marginBottom: '0.85rem',
                       display: 'flex',
                       flexDirection: 'column',
                       alignItems: m.sender === 'system' || m.name === 'System' ? 'center' : m.sender === 'guide' ? 'flex-end' : 'flex-start'
                     }">
                  
                  <!-- Meta Header for regular messages -->
                  <div v-if="m.sender !== 'system' && m.name !== 'System'" class="chat-meta d-flex align-items-center mb-1" style="font-size: 0.72rem; gap: 6px;">
                    <span class="chat-sender-name fw-bold" :style="{ color: m.sender === 'guide' ? '#0b8043' : '#0288d1' }">
                      {{ m.name }}
                    </span>
                    <span class="badge bg-forest text-white" style="font-size:0.56rem; padding: 2px 4px;" v-if="m.sender === 'guide'">Guide</span>
                    <span class="chat-time text-muted" style="font-size:0.65rem;">{{ m.timestamp }}</span>
                  </div>

                  <!-- Chat Bubble -->
                  <div class="chat-bubble" 
                       :style="getChatBubbleStyle(m)"
                       style="padding: 0.6rem 0.8rem; max-width: 80%; width: fit-content; font-size: 0.83rem; line-height: 1.45; word-break: break-word;">
                    {{ m.text }}
                  </div>
                </div>
                <div v-if="!currentGroupMessages.length" class="text-center py-5 text-muted" style="font-size: 0.85rem;">
                  <i class="bi bi-chat-dots fs-3 mb-2 d-block"></i>
                  No messages yet. Send a message to start the conversation!
                </div>
              </div>

              <!-- Chat input bar -->
              <div class="social-chat-input-bar border-top" style="padding: 1rem; background: var(--cream);">
                <form @submit.prevent="sendSocialMessage" class="d-flex gap-2" style="align-items:center;">
                  <input v-model="newSocialMessageText" type="text" class="form-control" placeholder="Type a message to the group..." style="font-size: 0.85rem; border-radius: 6px;" />
                  <button type="submit" class="btn btn-primary-ts px-4" style="font-size: 0.85rem;">
                    <i class="bi bi-send-fill"></i> Send
                  </button>
                </form>
              </div>
            </div>
          </template>
        </div>

        <!-- Participants panel -->
        <div class="social-participants-panel ts-card d-flex flex-column" style="width: 320px; flex-shrink: 0; min-height: 0;">
          <div class="ts-card-header d-flex justify-content-between align-items-center">
            <div style="display:flex; align-items:center;">
              <!-- Back to chat button on mobile view -->
              <button class="btn btn-sm btn-outline-secondary d-md-none me-2" @click="showMobileMembers = false" style="padding: 4px 8px;">
                <i class="bi bi-chevron-left"></i> Back
              </button>
              <div class="ts-card-title m-0"><i class="bi bi-people-fill"></i> Participants</div>
            </div>
            <button class="btn btn-sm btn-outline-secondary" @click="openAddParticipantModal(selectedSocialTrekId)" :disabled="!selectedSocialTrekId" style="font-size:0.78rem; padding:4px 8px;">
              <i class="bi bi-person-plus-fill"></i> Add
            </button>
          </div>
          <div class="ts-card-body" style="padding: 1rem; overflow-y: auto; flex: 1; min-height: 0;">
            <div v-if="socialGroupMembers.length" class="d-flex flex-column gap-2">
              <div v-for="p in socialGroupMembers" :key="p.id" class="participant-item d-flex justify-content-between align-items-center p-2 rounded" style="background: var(--cream);">
                <div>
                  <div class="fw-bold" style="font-size: 0.95rem; color: var(--forest);">{{ p.name }}</div>
                  <div class="text-muted" style="font-size: 0.78rem;">Trekker ID {{ displayTrekkerId(p) }}</div>
                </div>
                <button type="button" class="btn btn-sm btn-outline-danger" style="font-size: 0.76rem; padding: 4px 8px;" @click="cancelParticipant(p)">
                  Remove
                </button>
              </div>
            </div>
            <div v-else class="text-center text-muted" style="font-size: 0.85rem; padding: 2rem 0;">
              No participants found for this group.
            </div>
          </div>
        </div>
      </div>

      </div><!-- /social-tab-container -->
</template>

<script>
import { staffDashComponent } from './staffDashProxy';

export default staffDashComponent('TabSocial');
</script>
