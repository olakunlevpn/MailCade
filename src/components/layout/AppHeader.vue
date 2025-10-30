<template>
  <header
    class="h-16 px-6 border-b border-secondary-200 dark:border-secondary-700 flex items-center justify-between"
  >
    <div class="flex items-center gap-4 flex-1 max-w-2xl">
      <div class="relative flex-1">
        <input
          v-model="searchQuery"
          @input="onSearchInput"
          @keyup.enter="performSearch"
          type="text"
          placeholder="Search emails..."
          class="w-full px-4 py-2 pl-10 rounded-lg border border-secondary-300 dark:border-secondary-600 bg-white dark:bg-secondary-800 focus:outline-none focus:ring-2 focus:ring-primary"
        />
        <svg
          class="absolute left-3 top-2.5 w-5 h-5 text-secondary-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
        <button
          v-if="searchQuery"
          @click="clearSearch"
          class="absolute right-3 top-2.5 text-secondary-400 hover:text-secondary-600"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>
    </div>

    <div class="flex items-center gap-2">
      <button
        @click="toggleTheme"
        class="p-2 rounded-lg hover:bg-secondary-100 dark:hover:bg-secondary-700 transition-colors"
        title="Toggle theme"
      >
        <svg
          v-if="isDark"
          class="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
          />
        </svg>
        <svg v-else class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
          />
        </svg>
      </button>

      <button
        @click="handleRefresh"
        :disabled="emailStore.loading"
        class="p-2 rounded-lg hover:bg-secondary-100 dark:hover:bg-secondary-700 transition-colors disabled:opacity-50"
        title="Refresh emails"
      >
        <svg
          :class="['w-5 h-5', emailStore.loading && 'animate-spin']"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
          />
        </svg>
      </button>

      <button
        @click="emailStore.deleteAllEmails()"
        class="p-2 rounded-lg hover:bg-red-100 dark:hover:bg-red-900 text-red-600 dark:text-red-400 transition-colors"
        title="Delete all emails"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
          />
        </svg>
      </button>
    </div>
  </header>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useThemeStore } from '@/stores/theme.store'
import { useEmailStore } from '@/stores/email.store'
import { useToast } from '@/composables/useToast'

const themeStore = useThemeStore()
const emailStore = useEmailStore()
const toast = useToast()

// Computed property to check if dark mode is active
const isDark = computed(() => {
  if (themeStore.theme === 'dark') return true
  if (themeStore.theme === 'light') return false
  // If system, check actual applied theme
  return document.documentElement.classList.contains('dark')
})

const searchQuery = ref('')
let searchTimeout: NodeJS.Timeout | null = null

const onSearchInput = () => {
  // Debounce search
  if (searchTimeout) {
    clearTimeout(searchTimeout)
  }
  
  searchTimeout = setTimeout(() => {
    performSearch()
  }, 300)
}

const performSearch = async () => {
  if (searchQuery.value.trim()) {
    await emailStore.searchEmails(searchQuery.value)
  } else {
    await emailStore.fetchEmails()
  }
}

const clearSearch = async () => {
  searchQuery.value = ''
  await emailStore.fetchEmails()
}

const handleRefresh = async () => {
  if (searchQuery.value.trim()) {
    await performSearch()
  } else {
    await emailStore.fetchEmails()
  }
  toast.success('Emails refreshed')
}

const toggleTheme = async () => {
  // Toggle between light and dark (ignore system for quick toggle)
  const newTheme = isDark.value ? 'light' : 'dark'
  themeStore.setTheme(newTheme)
  
  // Save to settings
  try {
    const settings = await window.electronAPI.settings.getAll()
    const uiSettings = settings.ui as any || {}
    
    await window.electronAPI.settings.set('ui', {
      ...uiSettings,
      theme: newTheme,
    })
  } catch (err) {
    console.error('Failed to save theme:', err)
  }
}
</script>
