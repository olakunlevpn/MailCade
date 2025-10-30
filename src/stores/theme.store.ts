/**
 * Theme Store
 * Manages application theme (light/dark/system)
 */

import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

export const useThemeStore = defineStore('theme', () => {
  const theme = ref<'light' | 'dark' | 'system'>('system')
  const isInitialized = ref(false)

  /**
   * Set the theme
   */
  const setTheme = (newTheme: 'light' | 'dark' | 'system') => {
    theme.value = newTheme
    applyTheme(newTheme)
  }

  /**
   * Apply the theme to the document
   */
  const applyTheme = (themeSetting: 'light' | 'dark' | 'system') => {
    const root = document.documentElement

    if (themeSetting === 'system') {
      // Use system preference
      const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      if (systemPrefersDark) {
        root.classList.add('dark')
      } else {
        root.classList.remove('dark')
      }
    } else if (themeSetting === 'dark') {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
  }

  /**
   * Initialize theme on app load
   */
  const initTheme = async () => {
    if (isInitialized.value) return

    try {
      // Load theme from settings
      const settings = await window.electronAPI.settings.getAll()
      if (settings.ui && typeof settings.ui === 'object' && 'theme' in settings.ui) {
        const savedTheme = (settings.ui as any).theme
        if (savedTheme === 'light' || savedTheme === 'dark' || savedTheme === 'system') {
          theme.value = savedTheme
        }
      }
    } catch (err) {
      console.error('Failed to load theme from settings:', err)
    }

    // Apply the theme
    applyTheme(theme.value)

    // Watch for system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    mediaQuery.addEventListener('change', () => {
      if (theme.value === 'system') {
        applyTheme('system')
      }
    })

    isInitialized.value = true
  }

  // Watch theme changes
  watch(theme, (newTheme) => {
    applyTheme(newTheme)
  })

  return {
    theme,
    setTheme,
    initTheme,
  }
})
