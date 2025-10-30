<template>
  <div class="flex flex-col h-full bg-white dark:bg-secondary-900">
    <div v-if="!emailStore.selectedEmail" class="flex-1 flex items-center justify-center">
      <div class="text-center text-secondary-500">
        <div class="text-6xl mb-4">📧</div>
        <p class="text-lg">Select an email to preview</p>
      </div>
    </div>

    <div v-else class="flex-1 flex flex-col overflow-hidden">
      <div class="p-6 border-b border-secondary-200 dark:border-secondary-700">
        <h1 class="text-2xl font-semibold mb-4">
          {{ emailStore.selectedEmail.Subject || '(No subject)' }}
        </h1>

        <div class="space-y-2 text-sm">
          <div class="flex">
            <span class="text-secondary-600 dark:text-secondary-400 w-20">From:</span>
            <span>
              {{ emailStore.selectedEmail.From.Name || emailStore.selectedEmail.From.Address }}
            </span>
          </div>

          <div class="flex">
            <span class="text-secondary-600 dark:text-secondary-400 w-20">To:</span>
            <span>
              {{ emailStore.selectedEmail.To.map((t) => t.Address).join(', ') }}
            </span>
          </div>

          <div class="flex">
            <span class="text-secondary-600 dark:text-secondary-400 w-20">Date:</span>
            <span>{{ formatDate(emailStore.selectedEmail.Date) }}</span>
          </div>
        </div>
      </div>

      <!-- Tabs -->
      <div class="border-b border-secondary-200 dark:border-secondary-700">
        <div class="flex gap-1 px-6">
          <button
            v-for="tab in tabs"
            :key="tab.id"
            @click="activeTab = tab.id"
            :class="[
              'px-4 py-2 text-sm font-medium transition-colors',
              activeTab === tab.id
                ? 'border-b-2 border-primary text-primary'
                : 'text-secondary-600 dark:text-secondary-400 hover:text-secondary-900 dark:hover:text-secondary-200',
            ]"
          >
            {{ tab.label }}
          </button>
        </div>
      </div>

      <!-- Tab Content -->
      <div class="flex-1 overflow-auto custom-scrollbar p-6">
        <!-- HTML View -->
        <div v-if="activeTab === 'html'" class="prose dark:prose-invert max-w-none">
          <div
            v-if="emailStore.selectedEmail.HTML"
            v-html="sanitizeHTML(emailStore.selectedEmail.HTML)"
          />
          <p v-else class="text-secondary-500">No HTML content available</p>
        </div>

        <!-- HTML Source -->
        <pre
          v-else-if="activeTab === 'html-source'"
          class="text-xs bg-secondary-50 dark:bg-secondary-800 p-4 rounded overflow-x-auto"
        ><code>{{ emailStore.selectedEmail.HTML || 'No HTML source available' }}</code></pre>

        <!-- Text View -->
        <pre
          v-else-if="activeTab === 'text'"
          class="whitespace-pre-wrap font-mono text-sm"
        >{{ emailStore.selectedEmail.Text || 'No plain text available' }}</pre>

        <!-- Raw View -->
        <pre
          v-else-if="activeTab === 'raw'"
          class="text-xs bg-secondary-50 dark:bg-secondary-800 p-4 rounded overflow-x-auto"
        ><code>{{ formatRaw() }}</code></pre>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import DOMPurify from 'dompurify'
import { useEmailStore } from '@/stores/email.store'

const emailStore = useEmailStore()

const activeTab = ref('html')

const tabs = [
  { id: 'html', label: 'HTML' },
  { id: 'html-source', label: 'HTML Source' },
  { id: 'text', label: 'Text' },
  { id: 'raw', label: 'Raw' },
]

const sanitizeHTML = (html: string) => {
  return DOMPurify.sanitize(html)
}

const formatDate = (dateString: string) => {
  try {
    const date = new Date(dateString)
    if (isNaN(date.getTime())) {
      return 'Unknown date'
    }
    return date.toLocaleString()
  } catch {
    return 'Unknown date'
  }
}

const formatRaw = () => {
  const email = emailStore.selectedEmail
  if (!email) return 'No email selected'

  // Format raw email with headers
  let raw = ''
  raw += `From: ${email.From?.Address || 'unknown'}\n`
  raw += `To: ${email.To?.map(t => t.Address).join(', ') || 'unknown'}\n`
  if (email.Cc && email.Cc.length > 0) {
    raw += `Cc: ${email.Cc.map(c => c.Address).join(', ')}\n`
  }
  if (email.Bcc && email.Bcc.length > 0) {
    raw += `Bcc: ${email.Bcc.map(b => b.Address).join(', ')}\n`
  }
  raw += `Subject: ${email.Subject || '(No subject)'}\n`
  raw += `Date: ${email.Date}\n`
  raw += `Message-ID: ${email.ID}\n`
  raw += `\n`
  
  // Add body
  if (email.HTML) {
    raw += `Content-Type: text/html; charset=utf-8\n\n`
    raw += email.HTML
  } else if (email.Text) {
    raw += `Content-Type: text/plain; charset=utf-8\n\n`
    raw += email.Text
  }

  return raw
}
</script>
