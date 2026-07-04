<template>
      <section v-if="activeTab==='blacklist'" class="tab-content">
        <div v-if="blacklistedUsers.length === 0" class="empty-state">
          <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>
          <p>No blacklisted accounts.</p>
        </div>
        <div style="display:flex;flex-direction:column;gap:1rem">
          <div v-for="u in blacklistedUsers" :key="u.id" class="blacklist-card">
            <div class="bl-icon"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg></div>
            <div class="bl-info">
              <div class="bl-name">{{ u.name }}</div>
              <div class="bl-meta">Reason: {{ u.reason }} · Banned on {{ u.date }}</div>
            </div>
            <div class="action-btns">
              <button class="act-btn act-green" @click="restoreBlacklist(u)">Restore</button>
              <button class="act-btn act-del"   @click="blacklistedUsers = blacklistedUsers.filter(b=>b.id!==u.id); showToast(u.name+' permanently removed')">Remove</button>
            </div>
          </div>
        </div>
      </section>
</template>

<script>
import { adminDashComponent } from './adminDashProxy';

export default adminDashComponent('TabBlacklist');
</script>
