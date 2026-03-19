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

      <div v-else-if="emailStore.emails.length === 0" class="flex items-center justify-center h-full p-6">
        <div class="max-w-sm w-full">
          <div class="text-center mb-6">
            <div class="text-4xl mb-3">📭</div>
            <h3 class="text-lg font-semibold text-secondary-300 mb-1">No emails yet</h3>
            <p class="text-sm text-secondary-500">Point your app's SMTP to this address</p>
          </div>

          <!-- SMTP Address -->
          <div class="mb-5">
            <label class="block text-xs font-medium text-secondary-400 mb-1.5">SMTP Server</label>
            <div class="flex items-center bg-secondary-800 rounded-lg border border-secondary-700">
              <code class="flex-1 px-3 py-2.5 text-sm font-mono text-green-400">localhost:{{ serverStore.actualSmtpPort }}</code>
              <button
                @click="copyToClipboard(`localhost:${serverStore.actualSmtpPort}`)"
                class="px-3 py-2.5 text-secondary-400 hover:text-white transition-colors border-l border-secondary-700"
                :title="copiedField === 'smtp' ? 'Copied!' : 'Copy'"
              >
                <svg v-if="copiedField === 'smtp'" class="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
                <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </button>
            </div>
          </div>

          <!-- Quick Setup Examples -->
          <div class="space-y-3">
            <label class="block text-xs font-medium text-secondary-400">Quick Setup</label>

            <!-- Laravel -->
            <div class="bg-secondary-800 rounded-lg border border-secondary-700 overflow-hidden">
              <div class="flex items-center justify-between px-3 py-1.5 border-b border-secondary-700">
                <span class="text-xs font-medium text-secondary-400">Laravel .env</span>
                <button
                  @click="copyToClipboard(laravelSnippet, 'laravel')"
                  class="text-secondary-500 hover:text-white transition-colors"
                  :title="copiedField === 'laravel' ? 'Copied!' : 'Copy'"
                >
                  <svg v-if="copiedField === 'laravel'" class="w-3.5 h-3.5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                  </svg>
                  <svg v-else class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </button>
              </div>
              <pre class="px-3 py-2 text-xs font-mono text-secondary-300 leading-relaxed">MAIL_HOST=localhost
MAIL_PORT={{ serverStore.actualSmtpPort }}</pre>
            </div>

            <!-- Node.js -->
            <div class="bg-secondary-800 rounded-lg border border-secondary-700 overflow-hidden">
              <div class="flex items-center justify-between px-3 py-1.5 border-b border-secondary-700">
                <span class="text-xs font-medium text-secondary-400">Node.js</span>
                <button
                  @click="copyToClipboard(nodejsSnippet, 'nodejs')"
                  class="text-secondary-500 hover:text-white transition-colors"
                  :title="copiedField === 'nodejs' ? 'Copied!' : 'Copy'"
                >
                  <svg v-if="copiedField === 'nodejs'" class="w-3.5 h-3.5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                  </svg>
                  <svg v-else class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </button>
              </div>
              <pre class="px-3 py-2 text-xs font-mono text-secondary-300 leading-relaxed">const transport = nodemailer.createTransport({
  host: 'localhost',
  port: {{ serverStore.actualSmtpPort }}
})</pre>
            </div>

            <!-- Django -->
            <div class="bg-secondary-800 rounded-lg border border-secondary-700 overflow-hidden">
              <div class="flex items-center justify-between px-3 py-1.5 border-b border-secondary-700">
                <span class="text-xs font-medium text-secondary-400">Django settings.py</span>
                <button
                  @click="copyToClipboard(djangoSnippet, 'django')"
                  class="text-secondary-500 hover:text-white transition-colors"
                  :title="copiedField === 'django' ? 'Copied!' : 'Copy'"
                >
                  <svg v-if="copiedField === 'django'" class="w-3.5 h-3.5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                  </svg>
                  <svg v-else class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </button>
              </div>
              <pre class="px-3 py-2 text-xs font-mono text-secondary-300 leading-relaxed">EMAIL_HOST = 'localhost'
EMAIL_PORT = {{ serverStore.actualSmtpPort }}</pre>
            </div>
          </div>
        </div>
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
import { computed, ref } from 'vue'
import type { Email } from '@/types/email.types'
import { useEmailStore } from '@/stores/email.store'
import { useServerStore } from '@/stores/server.store'
import EmailListItem from './EmailListItem.vue'

const emailStore = useEmailStore()
const serverStore = useServerStore()

const copiedField = ref<string | null>(null)

const laravelSnippet = computed(() => `MAIL_HOST=localhost\nMAIL_PORT=${serverStore.actualSmtpPort}`)
const nodejsSnippet = computed(() => `const transport = nodemailer.createTransport({\n  host: 'localhost',\n  port: ${serverStore.actualSmtpPort}\n})`)
const djangoSnippet = computed(() => `EMAIL_HOST = 'localhost'\nEMAIL_PORT = ${serverStore.actualSmtpPort}`)

const copyToClipboard = async (text: string, field: string = 'smtp') => {
  try {
    await navigator.clipboard.writeText(text)
    copiedField.value = field
    setTimeout(() => {
      copiedField.value = null
    }, 2000)
  } catch {
    // Fallback for older browsers
  }
}

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
