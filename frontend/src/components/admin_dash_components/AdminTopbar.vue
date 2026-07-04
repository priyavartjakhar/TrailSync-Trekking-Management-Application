<template>

      <!-- Top Bar -->
      <header class="ts-topbar">
        <div class="topbar-title">
          <div class="section-tag">Admin Panel</div>
          <h1 class="topbar-heading">{{ tabTitles[activeTab] || activeTab }}</h1>
        </div>
        <div class="topbar-actions">
          <div v-if="activeTab !== 'dashboard'" class="search-box">
            <svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input v-model="searchQuery" type="text" :placeholder="searchPlaceholder" />
          </div>
          <button v-if="activeTab==='dashboard'" class="topbar-signout-btn" @click="$emit('logout')">
            <svg viewBox="0 0 24 24"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
            Sign Out
          </button>
          <button v-if="activeTab==='treks'" class="btn-primary-ts" @click="openRouteModal()">+ New Route</button>
          <button v-if="activeTab==='batches'" class="btn-primary-ts" @click="openTrekModal()">+ New Batch</button>
          <button v-if="activeTab==='staff'" class="btn-primary-ts" @click="openStaffModal()">+ Add Staff</button>
          <button v-if="activeTab==='users'" class="btn-primary-ts" @click="openTrekkerModal()">+ Add Trekker</button>
        </div>
      </header>
</template>

<script>
import { adminDashComponent } from './adminDashProxy';

export default adminDashComponent('AdminTopbar', { emits: ['logout'] });
</script>
