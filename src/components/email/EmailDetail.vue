<template>
  <div class="h-full flex flex-col bg-white dark:bg-secondary-900">
    <div v-if="!emailStore.selectedEmail" class="flex items-center justify-center h-full text-secondary-500">
      <p>No email selected</p>
    </div>

    <div v-else class="flex flex-col h-full">
      <!-- Header with Title and Actions -->
      <div class="flex items-center justify-between px-6 py-4 border-b border-secondary-200 dark:border-secondary-700">
        <h1 class="text-xl font-semibold truncate flex-1 mr-4">
          {{ emailStore.selectedEmail.Subject || '(No subject)' }}
        </h1>
        
        <div class="flex items-center gap-2">
          <button
            @click="deleteEmail"
            class="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm font-medium"
          >
            Delete
          </button>
          <button
            @click="shareEmail"
            class="px-4 py-2 bg-secondary-100 dark:bg-secondary-800 rounded-lg hover:bg-secondary-200 dark:hover:bg-secondary-700 transition-colors text-sm font-medium flex items-center gap-2"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
            Share
          </button>
          <button
            @click="forwardEmail"
            class="px-4 py-2 bg-secondary-100 dark:bg-secondary-800 rounded-lg hover:bg-secondary-200 dark:hover:bg-secondary-700 transition-colors text-sm font-medium flex items-center gap-2"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            Forward
          </button>
        </div>
      </div>

      <!-- Metadata Section -->
      <div class="px-6 py-4 bg-secondary-50 dark:bg-secondary-800/50 border-b border-secondary-200 dark:border-secondary-700">
        <div class="grid grid-cols-1 gap-3 text-sm">
          <div class="flex">
            <span class="text-secondary-600 dark:text-secondary-400 w-32 flex-shrink-0 font-medium">From</span>
            <span class="text-secondary-900 dark:text-secondary-100">
              {{ formatEmailAddress(emailStore.selectedEmail.From) }}
            </span>
          </div>
          
          <div class="flex">
            <span class="text-secondary-600 dark:text-secondary-400 w-32 flex-shrink-0 font-medium">To</span>
            <span class="text-secondary-900 dark:text-secondary-100">
              {{ emailStore.selectedEmail.To.map((t) => t.Address).join(', ') }}
            </span>
          </div>

          <div class="flex">
            <span class="text-secondary-600 dark:text-secondary-400 w-32 flex-shrink-0 font-medium">Sent at</span>
            <span class="text-secondary-900 dark:text-secondary-100">
              {{ formatDate(emailStore.selectedEmail.Date) }}
              <span class="text-secondary-500 ml-2">Size: {{ formatSize(emailStore.selectedEmail.Size) }}</span>
            </span>
          </div>

          <div v-if="emailStore.selectedEmail.ID" class="flex">
            <span class="text-secondary-600 dark:text-secondary-400 w-32 flex-shrink-0 font-medium">Message ID</span>
            <span class="text-secondary-500 font-mono text-xs break-all">
              {{ emailStore.selectedEmail.ID }}
            </span>
          </div>

          <div v-if="emailStore.selectedEmail.Attachments && emailStore.selectedEmail.Attachments.length" class="flex">
            <span class="text-secondary-600 dark:text-secondary-400 w-32 flex-shrink-0 font-medium">Attachments</span>
            <div class="flex flex-wrap gap-2">
              <span
                v-for="attachment in emailStore.selectedEmail.Attachments"
                :key="attachment.FileName"
                class="inline-flex items-center gap-1 px-2 py-1 bg-white dark:bg-secondary-700 rounded border border-secondary-200 dark:border-secondary-600 text-xs"
              >
                <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                </svg>
                {{ attachment.FileName }}
                <button class="text-primary hover:underline ml-1">Download</button>
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Tabs -->
      <div class="border-b border-secondary-200 dark:border-secondary-700 bg-white dark:bg-secondary-900">
        <div class="flex px-6 overflow-x-auto">
          <button
            v-for="tab in tabs"
            :key="tab.id"
            @click="activeTab = tab.id"
            :class="[
              'px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap',
              activeTab === tab.id
                ? 'border-primary text-primary'
                : 'border-transparent text-secondary-600 dark:text-secondary-400 hover:text-secondary-900 dark:hover:text-secondary-200'
            ]"
          >
            {{ tab.label }}
          </button>
        </div>
      </div>

      <!-- Content Area -->
      <div class="flex-1 overflow-auto p-6">
        <!-- HTML Tab -->
        <div v-if="activeTab === 'html'" class="prose dark:prose-invert max-w-none">
          <div
            v-if="emailStore.selectedEmail.HTML"
            v-html="sanitizeHTML(emailStore.selectedEmail.HTML)"
          />
          <pre v-else class="whitespace-pre-wrap text-sm">{{ emailStore.selectedEmail.Text }}</pre>
        </div>

        <!-- HTML Source Tab -->
        <div v-if="activeTab === 'html-source'">
          <pre class="bg-secondary-900 text-green-400 p-4 rounded-lg overflow-x-auto text-sm font-mono">{{ emailStore.selectedEmail.HTML || 'No HTML content' }}</pre>
        </div>

        <!-- Text Tab -->
        <div v-if="activeTab === 'text'">
          <pre class="whitespace-pre-wrap text-sm">{{ emailStore.selectedEmail.Text || 'No text content' }}</pre>
        </div>

        <!-- Headers Tab -->
        <div v-if="activeTab === 'headers'">
          <pre class="bg-secondary-50 dark:bg-secondary-800 p-4 rounded-lg overflow-x-auto text-xs font-mono">{{ formatHeaders(emailStore.selectedEmail) }}</pre>
        </div>

        <!-- Raw Tab -->
        <div v-if="activeTab === 'raw'">
          <pre class="bg-secondary-50 dark:bg-secondary-800 p-4 rounded-lg overflow-x-auto text-xs font-mono whitespace-pre-wrap">{{ JSON.stringify(emailStore.selectedEmail, null, 2) }}</pre>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import DOMPurify from 'dompurify'
import { format } from 'date-fns'
import { useEmailStore } from '@/stores/email.store'
import { useToast } from '@/composables/useToast'

const emailStore = useEmailStore()
const toast = useToast()

const activeTab = ref('html')

const tabs = [
  { id: 'html', label: 'HTML' },
  { id: 'html-source', label: 'HTML Source' },
  { id: 'text', label: 'Text' },
  { id: 'raw', label: 'Raw' },
  { id: 'headers', label: 'Headers' },
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
    return format(date, 'PPpp')
  } catch {
    return 'Unknown date'
  }
}

const formatEmailAddress = (from: any) => {
  if (!from) return 'Unknown'
  if (from.Name && from.Address) {
    return `${from.Name} <${from.Address}>`
  }
  return from.Address || from.Name || 'Unknown'
}

const formatSize = (bytes: number) => {
  if (!bytes) return '0 B'
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`
}

const formatHeaders = (email: any) => {
  const headers: string[] = []
  if (email.From) headers.push(`From: ${formatEmailAddress(email.From)}`)
  if (email.To) headers.push(`To: ${email.To.map((t: any) => t.Address).join(', ')}`)
  if (email.Subject) headers.push(`Subject: ${email.Subject}`)
  if (email.Date) headers.push(`Date: ${email.Date}`)
  if (email.ID) headers.push(`Message-ID: ${email.ID}`)
  return headers.join('\n')
}

const deleteEmail = async () => {
  if (!emailStore.selectedEmail) return
  
  const emailId = emailStore.selectedEmail.ID
  
  try {
    await emailStore.deleteEmail(emailId)
    toast.success('Email deleted')
  } catch (err) {
    console.error('Delete error:', err)
    toast.error('Failed to delete email')
  }
}

const shareEmail = () => {
  if (!emailStore.selectedEmail) return
  
  const subject = emailStore.selectedEmail.Subject || '(No subject)'
  const from = formatEmailAddress(emailStore.selectedEmail.From)
  const text = `Email from: ${from}\nSubject: ${subject}`
  
  if (navigator.share) {
    navigator.share({ title: subject, text })
  } else {
    navigator.clipboard.writeText(text)
    toast.success('Email details copied to clipboard')
  }
}

const forwardEmail = async () => {
  if (!emailStore.selectedEmail) return
  
  const subject = emailStore.selectedEmail.Subject || '(No subject)'
  const from = formatEmailAddress(emailStore.selectedEmail.From)
  const to = emailStore.selectedEmail.To.map((t: any) => t.Address).join(', ')
  const date = formatDate(emailStore.selectedEmail.Date)
  
  // Get body text (strip HTML tags if present)
  let body = emailStore.selectedEmail.Text || ''
  if (!body && emailStore.selectedEmail.HTML) {
    // Simple HTML to text conversion
    body = emailStore.selectedEmail.HTML.replace(/<[^>]*>/g, '').trim()
  }
  
  // Create forwarded message content
  const forwardedContent = `


------- Forwarded Message -------
From: ${from}
To: ${to}
Date: ${date}
Subject: ${subject}

${body}`
  
  // Create mailto link for forwarding
  const mailtoLink = `mailto:?subject=${encodeURIComponent('Fwd: ' + subject)}&body=${encodeURIComponent(forwardedContent)}`
  
  try {
    // Use Electron's shell.openExternal to open mailto link
    await window.electronAPI.openExternal(mailtoLink)
    toast.success('Opened in default email client')
  } catch (err) {
    console.error('Failed to open email client:', err)
    toast.error('Failed to open email client')
  }
}
</script>
