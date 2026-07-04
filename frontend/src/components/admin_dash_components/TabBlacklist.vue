<template>
      <section v-if="activeTab==='blacklist'" class="tab-content">
        <div v-if="blacklistedUsers.length === 0" class="empty-state">
          <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>
          <p>No blacklisted accounts.</p>
        </div>
        <div style="display:flex;flex-direction:column;gap:1rem">
          <div v-for="u in blacklistedUsers" :key="u.id" class="blacklist-card">
            <div class="bl-icon col-hide-mobile"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg></div>
            <div class="bl-info">
              <div class="bl-name">{{ u.name }}</div>
              <div class="bl-meta"><span class="col-hide-mobile">Banned on {{ u.date }} · </span>Reason: {{ u.reason }}</div>
            </div>
            <div class="action-btns">
              <button class="act-btn act-green" @click="restoreBlacklist(u)" title="Restore User">
                <svg viewBox="0 0 24 24" class="act-btn-icon" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><polyline points="16 3 21 3 21 8"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><polyline points="8 21 3 21 3 16"/></svg>
                <span class="btn-text-hide-mobile">Restore</span>
              </button>
              <button class="act-btn act-del" @click="blacklistedUsers = blacklistedUsers.filter(b=>b.id!==u.id); showToast(u.name+' permanently removed')" title="Permanently Remove">
                <svg viewBox="0 0 24 24" class="act-btn-icon" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                <span class="btn-text-hide-mobile">Remove</span>
              </button>
            </div>
          </div>
        </div>
      </section>
</template>

<script>
import { adminDashComponent } from './adminDashProxy';

export default adminDashComponent('TabBlacklist');
</script>
