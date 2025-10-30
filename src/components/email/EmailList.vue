<template>
  <div class="flex flex-col h-full bg-white dark:bg-secondary-900">
    <div class="p-4 border-b border-secondary-200 dark:border-secondary-700">
      <div class="flex items-center justify-between">
        <h2 class="text-lg font-semibold">Emails</h2>
        <span v-if="unreadCount > 0" class="px-2 py-1 bg-primary text-white text-xs font-semibold rounded-full">
          {{ unreadCount }} unread
        </span>
      </div>
    </div>

    <div class="flex-1 overflow-y-auto custom-scrollbar">
      <div v-if="emailStore.loading" class="p-4 text-center text-secondary-500">
        Loading emails...
      </div>

      <div v-else-if="emailStore.emails.length === 0" class="p-8 text-center text-secondary-500">
        <div class="text-4xl mb-4">📭</div>
        <p>No emails yet</p>
        <p class="text-sm mt-2">Send a test email to localhost:{{ serverStore.status.smtpPort }}</p>
      </div>

      <div v-else>
        <EmailListItem
          v-for="email in emailStore.emails"
          :key="email.ID"
          :email="email"
          :selected="emailStore.selectedEmail?.ID === email.ID"
          @click="handleEmailClick(email)"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Email } from '@/types/email.types'
import { useEmailStore } from '@/stores/email.store'
import { useServerStore } from '@/stores/server.store'
import EmailListItem from './EmailListItem.vue'

const emailStore = useEmailStore()
const serverStore = useServerStore()

// Compute unread count from emails that haven't been read
const unreadCount = computed(() => {
  return emailStore.emails.filter((email) => !email.Read).length
})

const handleEmailClick = async (email: Email) => {
  // Fetch full email details when clicked
  try {
    await emailStore.fetchEmailById(email.ID)
  } catch (error) {
    console.error('Failed to fetch email details:', error)
    // Fallback to just selecting the email from the list
    emailStore.selectEmail(email)
  }
}
</script>
