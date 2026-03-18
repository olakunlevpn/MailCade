<template>
  <aside
    class="w-64 bg-secondary-50 dark:bg-secondary-800 border-r border-secondary-200 dark:border-secondary-700 flex flex-col"
  >
    <div class="p-4 border-b border-secondary-200 dark:border-secondary-700">
      <h1 class="text-xl font-bold text-primary">MailCade</h1>
      <p class="text-xs text-secondary-500">Developer Mail Sandbox</p>
    </div>

    <nav class="flex-1 p-4 space-y-2">
      <RouterLink
        to="/"
        class="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-secondary-100 dark:hover:bg-secondary-700 transition-colors"
        active-class="bg-primary text-white hover:bg-primary"
      >
        <span>📥</span>
        <span>Inbox</span>
      </RouterLink>

      <RouterLink
        to="/settings"
        class="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-secondary-100 dark:hover:bg-secondary-700 transition-colors"
        active-class="bg-primary text-white hover:bg-primary"
      >
        <span>⚙️</span>
        <span>Settings</span>
      </RouterLink>
    </nav>

    <div class="p-4 border-t border-secondary-200 dark:border-secondary-700">
      <div class="text-xs">
        <div class="flex items-center justify-between mb-2">
          <div class="flex items-center gap-2">
            <span class="text-secondary-600 dark:text-secondary-400">Email Server</span>
            <button
              @click="navigateToMailSettings"
              class="text-secondary-500 hover:text-primary transition-colors p-0.5"
              title="Mail Server Settings"
            >
              <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
          </div>
          <span :class="statusColor" class="font-semibold flex items-center gap-1" :title="serverStore.status.state === 'error' ? serverStore.status.error : undefined">
            <!-- Spinner for transitional states -->
            <svg
              v-if="isTransitioning"
              class="w-3 h-3 animate-spin"
              fill="none" viewBox="0 0 24 24"
            >
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <!-- Solid dot for stable states -->
            <span v-else>●</span>
            {{ statusText }}
          </span>
        </div>
        <div class="text-secondary-500">
          <span>SMTP: {{ serverStore.actualSmtpPort }}</span>
          <span
            v-if="serverStore.status.resolvedSmtpPort"
            class="text-yellow-500 ml-1"
          >(configured: {{ serverStore.status.smtpPort }})</span>
        </div>
      </div>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useServerStore } from '@/stores/server.store'

const router = useRouter()
const serverStore = useServerStore()

const isTransitioning = computed(() =>
  ['starting', 'stopping', 'restarting', 'reconnecting'].includes(serverStore.status.state)
)

const statusColor = computed(() => {
  const state = serverStore.status.state
  if (state === 'running') return 'text-green-500'
  if (state === 'error' || state === 'stopped') return 'text-red-500'
  return 'text-yellow-500'
})

const statusText = computed(() => {
  const state = serverStore.status.state
  switch (state) {
    case 'stopped': return 'Stopped'
    case 'starting': return 'Starting...'
    case 'running': return 'Running'
    case 'stopping': return 'Stopping...'
    case 'restarting': return 'Restarting...'
    case 'reconnecting': return 'Reconnecting...'
    case 'error': return 'Error'
    default: return 'Unknown'
  }
})

const navigateToMailSettings = () => {
  router.push({ path: '/settings', query: { tab: 'mailpit' }, hash: '#mail-server' })
}

onMounted(() => {
  serverStore.refreshStatus()
})
</script>
