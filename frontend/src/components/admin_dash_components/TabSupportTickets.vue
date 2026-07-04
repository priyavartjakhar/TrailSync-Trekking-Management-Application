<template>
      <section v-if="activeTab==='support_tickets'" class="tab-content">
        <!-- Filter Tabs Bar -->
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1.25rem;">
          <div class="ticket-tabs" style="margin-bottom:0; border-bottom:none; padding-bottom:0;">
            <button class="ticket-tab-btn" :class="{ active: ticketStatusFilter === 'All' }" @click="ticketStatusFilter = 'All'">
              All
              <span class="ticket-tab-count">{{ supportTickets.length }}</span>
            </button>
            <button class="ticket-tab-btn" :class="{ active: ticketStatusFilter === 'Open' }" @click="ticketStatusFilter = 'Open'">
              Open
              <span class="ticket-tab-count">{{ supportTickets.filter(t => t.status === 'Open').length }}</span>
            </button>
            <button class="ticket-tab-btn" :class="{ active: ticketStatusFilter === 'Resolved' }" @click="ticketStatusFilter = 'Resolved'">
              Resolved
              <span class="ticket-tab-count">{{ supportTickets.filter(t => t.status === 'Resolved').length }}</span>
            </button>
          </div>
        </div>

        <div v-if="filteredTickets.length === 0" class="empty-state">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
          <p>No support tickets found.</p>
        </div>
        <div v-else class="ts-table-wrap">
          <table class="ts-table">
            <thead>
              <tr>
                <th class="col-hide-mobile">Ticket ID</th>
                <th>Date</th>
                <th>Sender</th>
                <th class="col-hide-mobile">Category</th>
                <th class="col-hide-mobile">Subject</th>
                <th class="col-hide-mobile">Status</th>
                <th style="text-align:right;">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="t in filteredTickets" :key="t.id">
                <td class="mono font-bold col-hide-mobile" style="color:var(--forest)">{{ t.ticketId || ('TS26AS' + String(t.id).padStart(3, '0')) }}</td>
                <td class="mono" style="font-size:0.78rem; white-space:nowrap;">{{ t.createdAt ? t.createdAt.split(' ')[0] : '—' }}</td>
                <td>
                  <div style="font-weight:600; color:var(--forest)">{{ t.name }}</div>
                  <div style="font-size:0.75rem; color:var(--stone)" class="col-hide-mobile">{{ t.email }}</div>
                </td>
                <td class="col-hide-mobile">
                  <span class="category-tag" :class="getCategoryClass(t.category)">
                    {{ t.category || 'General Inquiry' }}
                  </span>
                </td>
                <td class="col-hide-mobile" style="font-weight:600; font-size:0.85rem; max-width:260px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">
                  {{ t.cleanSubject || t.subject }}
                </td>
                <td class="col-hide-mobile">
                  <span class="status-pill" :class="t.status === 'Open' ? 'status-pending' : 'status-approved'">
                    {{ t.status }}
                  </span>
                </td>
                <td>
                  <div class="action-btns" style="justify-content:flex-end;">
                    <button class="act-btn act-view" style="border: 1px solid rgba(61,107,61,0.25); padding: 4px 10px; display: inline-flex; align-items: center; gap: 4px;" @click="openTicketDetails(t)" title="View Details">
                      <svg viewBox="0 0 24 24" class="act-btn-icon"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                      <span class="btn-text-hide-mobile">View</span>
                    </button>
                    <button class="act-btn act-assign" v-if="t.status === 'Open'" style="display: inline-flex; align-items: center; gap: 4px;" @click="resolveTicket(t)" title="Resolve Ticket">
                      <svg viewBox="0 0 24 24" class="act-btn-icon" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                      <span class="btn-text-hide-mobile">Resolve</span>
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
</template>

<script>
import { adminDashComponent } from './adminDashProxy';

export default adminDashComponent('TabSupportTickets');
</script>
