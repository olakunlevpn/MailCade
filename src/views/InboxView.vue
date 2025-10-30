<template>
  <div class="flex h-screen">
    <AppSidebar class="flex-shrink-0" />
    <main class="flex-1 flex flex-col overflow-hidden min-w-0">
      <AppHeader class="flex-shrink-0" />
      <div class="flex-1 flex overflow-hidden min-h-0">
        <!-- Email List - Fixed Width -->
        <div class="w-80 flex-shrink-0 border-r border-secondary-200 dark:border-secondary-700 overflow-hidden">
          <EmailList />
        </div>
        
        <!-- Email Detail - Flexible Width -->
        <div class="flex-1 min-w-0 overflow-hidden">
          <EmailDetail />
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import AppSidebar from '@/components/layout/AppSidebar.vue'
import AppHeader from '@/components/layout/AppHeader.vue'
import EmailList from '@/components/email/EmailList.vue'
import EmailDetail from '@/components/email/EmailDetail.vue'
import { useEmailStore } from '@/stores/email.store'
import { useServerStore } from '@/stores/server.store'
import { useMailpitWebSocket } from '@/composables/useMailpitWebSocket'

const emailStore = useEmailStore()
const serverStore = useServerStore()
const { requestNotificationPermission } = useMailpitWebSocket()

onMounted(async () => {
  // Refresh server status
  await serverStore.refreshStatus()
  
  // Fetch initial emails
  await emailStore.fetchEmails()
  
  // Request notification permission silently
  await requestNotificationPermission()
})
</script>
