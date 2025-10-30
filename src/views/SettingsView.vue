<template>
  <div class="h-screen flex flex-col bg-white dark:bg-secondary-900">
    <!-- Header -->
    <div class="flex items-center justify-between p-4 border-b border-secondary-200 dark:border-secondary-700">
      <div class="flex items-center gap-4">
        <button
          @click="router.back()"
          class="p-2 hover:bg-secondary-100 dark:hover:bg-secondary-800 rounded-lg transition-colors"
        >
          ← Back
        </button>
        <h1 class="text-2xl font-semibold">Settings</h1>
      </div>
      
      <button
        @click="saveSettings"
        class="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-600 transition-colors"
        :disabled="saving"
      >
        {{ saving ? 'Saving...' : 'Save Changes' }}
      </button>
    </div>

    <div class="flex-1 flex overflow-hidden">
      <!-- Sidebar Tabs -->
      <div class="w-64 border-r border-secondary-200 dark:border-secondary-700 p-4">
        <nav class="space-y-1">
          <button
            v-for="tab in tabs"
            :key="tab.id"
            @click="activeTab = tab.id"
            :class="[
              'w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors',
              activeTab === tab.id
                ? 'bg-primary text-white'
                : 'hover:bg-secondary-100 dark:hover:bg-secondary-800 text-secondary-700 dark:text-secondary-300',
            ]"
          >
            <component :is="tab.icon" class="w-5 h-5" />
            <span>{{ tab.label }}</span>
          </button>
        </nav>
      </div>

      <!-- Settings Content -->
      <div class="flex-1 overflow-auto p-6">
        <div class="max-w-3xl mx-auto">
          <!-- General Settings -->
          <div v-if="activeTab === 'general'" class="space-y-6">
            <h2 class="text-xl font-semibold mb-4">General Settings</h2>
            
            <div class="space-y-4">
              <!-- Theme -->
              <div class="flex items-center justify-between p-4 bg-secondary-50 dark:bg-secondary-800 rounded-lg">
                <div>
                  <label class="font-medium">Theme</label>
                  <p class="text-sm text-secondary-600 dark:text-secondary-400">
                    Choose your preferred color theme
                  </p>
                </div>
                <select
                  v-model="settings.ui.theme"
                  class="px-4 py-2 rounded-lg border border-secondary-300 dark:border-secondary-600 bg-white dark:bg-secondary-700"
                >
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                  <option value="system">System</option>
                </select>
              </div>

              <!-- Auto Start -->
              <div class="flex items-center justify-between p-4 bg-secondary-50 dark:bg-secondary-800 rounded-lg">
                <div>
                  <label class="font-medium">Auto-start Server</label>
                  <p class="text-sm text-secondary-600 dark:text-secondary-400">
                    Start email server automatically when app launches
                  </p>
                </div>
                <input
                  type="checkbox"
                  v-model="settings.app.autoStart"
                  class="w-5 h-5 rounded border-secondary-300 dark:border-secondary-600"
                />
              </div>

              <!-- Notifications -->
              <div class="flex items-center justify-between p-4 bg-secondary-50 dark:bg-secondary-800 rounded-lg">
                <div>
                  <label class="font-medium">Desktop Notifications</label>
                  <p class="text-sm text-secondary-600 dark:text-secondary-400">
                    Show notifications when new emails arrive
                  </p>
                </div>
                <input
                  type="checkbox"
                  v-model="settings.ui.notifications"
                  class="w-5 h-5 rounded border-secondary-300 dark:border-secondary-600"
                />
              </div>
            </div>
          </div>

          <!-- Server Settings -->
          <div v-if="activeTab === 'mailpit'" id="mail-server" class="space-y-6">
            <h2 class="text-xl font-semibold mb-4">Server Configuration</h2>
            
            <div class="space-y-4">
              <!-- SMTP Port -->
              <div class="p-4 bg-secondary-50 dark:bg-secondary-800 rounded-lg">
                <label class="font-medium block mb-2">SMTP Port</label>
                <p class="text-sm text-secondary-600 dark:text-secondary-400 mb-3">
                  Port for incoming emails (requires restart)
                </p>
                <input
                  type="number"
                  v-model.number="settings.mailpit.smtpPort"
                  class="w-full px-4 py-2 rounded-lg border border-secondary-300 dark:border-secondary-600 bg-white dark:bg-secondary-700"
                  min="1"
                  max="65535"
                />
              </div>

              <!-- API Port -->
              <div class="p-4 bg-secondary-50 dark:bg-secondary-800 rounded-lg">
                <label class="font-medium block mb-2">API Port</label>
                <p class="text-sm text-secondary-600 dark:text-secondary-400 mb-3">
                  Port for email server API (requires restart)
                </p>
                <input
                  type="number"
                  v-model.number="settings.mailpit.webUIPort"
                  class="w-full px-4 py-2 rounded-lg border border-secondary-300 dark:border-secondary-600 bg-white dark:bg-secondary-700"
                  min="1"
                  max="65535"
                />
              </div>

              <!-- Max Messages -->
              <div class="p-4 bg-secondary-50 dark:bg-secondary-800 rounded-lg">
                <label class="font-medium block mb-2">Email Retention</label>
                <p class="text-sm text-secondary-600 dark:text-secondary-400 mb-3">
                  Maximum number of emails to keep (older emails are auto-deleted)
                </p>
                <input
                  type="number"
                  v-model.number="settings.mailpit.maxMessages"
                  class="w-full px-4 py-2 rounded-lg border border-secondary-300 dark:border-secondary-600 bg-white dark:bg-secondary-700"
                  min="10"
                  max="10000"
                  step="10"
                />
              </div>

              <!-- Server Status -->
              <div class="p-4 bg-secondary-50 dark:bg-secondary-800 rounded-lg">
                <div class="flex items-center justify-between mb-3">
                  <label class="font-medium">Server Status</label>
                  <span
                    :class="[
                      'px-3 py-1 rounded-full text-sm font-medium',
                      serverStore.status.running
                        ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                        : 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
                    ]"
                  >
                    {{ serverStore.status.running ? '● Running' : '● Stopped' }}
                  </span>
                </div>
                <div class="flex gap-2">
                  <button
                    v-if="!serverStore.status.running"
                    @click="serverStore.startMailpit()"
                    class="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                  >
                    Start Server
                  </button>
                  <button
                    v-else
                    @click="serverStore.stopMailpit()"
                    class="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                  >
                    Stop Server
                  </button>
                  <button
                    @click="serverStore.restartMailpit()"
                    class="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                  >
                    Restart Server
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Updates -->
          <div v-if="activeTab === 'updates'" class="space-y-6">
            <h2 class="text-xl font-semibold mb-4">Updates</h2>
            
            <div class="space-y-4">
              <!-- Auto Update Toggle -->
              <div class="flex items-center justify-between p-4 bg-secondary-50 dark:bg-secondary-800 rounded-lg">
                <div>
                  <label class="font-medium">Automatic Updates</label>
                  <p class="text-sm text-secondary-600 dark:text-secondary-400">
                    Download and install updates automatically
                  </p>
                </div>
                <input
                  type="checkbox"
                  v-model="settings.app.autoUpdate"
                  class="w-5 h-5 rounded border-secondary-300 dark:border-secondary-600"
                />
              </div>

              <!-- Update Status -->
              <div class="p-4 bg-secondary-50 dark:bg-secondary-800 rounded-lg">
                <div class="flex items-center justify-between mb-4">
                  <span class="font-medium">Update Status</span>
                  <span
                    :class="{
                      'text-green-500': updateStatus.downloaded,
                      'text-blue-500': updateStatus.available,
                      'text-secondary-500': !updateStatus.available && !updateStatus.downloaded,
                    }"
                    class="text-sm font-semibold"
                  >
                    {{
                      updateStatus.downloaded
                        ? '✓ Update Ready'
                        : updateStatus.available
                        ? '● Update Available'
                        : updateStatus.checking
                        ? '⟳ Checking...'
                        : '✓ Up to Date'
                    }}
                  </span>
                </div>

                <!-- Update Info -->
                <div v-if="updateStatus.info" class="mb-4 p-3 bg-white dark:bg-secondary-900 rounded">
                  <p class="font-medium mb-1">Version {{ updateStatus.info.version }}</p>
                  <p class="text-xs text-secondary-600 dark:text-secondary-400">
                    Released: {{ new Date(updateStatus.info.releaseDate).toLocaleDateString() }}
                  </p>
                  <p
                    v-if="updateStatus.info.releaseNotes"
                    class="text-sm mt-2 text-secondary-700 dark:text-secondary-300"
                  >
                    {{ updateStatus.info.releaseNotes }}
                  </p>
                </div>

                <!-- Download Progress -->
                <div v-if="updateStatus.downloading" class="mb-4">
                  <div class="flex justify-between text-sm mb-1">
                    <span>Downloading...</span>
                    <span>{{ Math.round(updateStatus.progress) }}%</span>
                  </div>
                  <div class="w-full bg-secondary-200 dark:bg-secondary-700 rounded-full h-2">
                    <div
                      class="bg-blue-500 h-2 rounded-full transition-all duration-300"
                      :style="{ width: updateStatus.progress + '%' }"
                    />
                  </div>
                </div>

                <!-- Error Message -->
                <div
                  v-if="updateStatus.error"
                  class="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded text-sm text-red-700 dark:text-red-400"
                >
                  {{ updateStatus.error }}
                </div>

                <!-- Action Buttons -->
                <div class="flex gap-2">
                  <button
                    v-if="!updateStatus.available && !updateStatus.checking"
                    @click="checkForUpdates"
                    :disabled="checking"
                    class="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {{ checking ? 'Checking...' : 'Check for Updates' }}
                  </button>

                  <button
                    v-if="updateStatus.available && !updateStatus.downloaded && !updateStatus.downloading"
                    @click="downloadUpdate"
                    :disabled="downloading"
                    class="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50"
                  >
                    {{ downloading ? 'Downloading...' : 'Download Update' }}
                  </button>

                  <button
                    v-if="updateStatus.downloaded"
                    @click="installUpdate"
                    class="flex-1 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
                  >
                    Install and Restart
                  </button>
                </div>

                <p class="text-xs text-secondary-500 mt-3 text-center">
                  Current version: {{ appVersion }}
                </p>
              </div>
            </div>
          </div>

          <!-- About -->
          <div v-if="activeTab === 'about'" class="space-y-6">
            <h2 class="text-xl font-semibold mb-4">About MailCade</h2>
            
            <div class="text-center py-8">
              <div class="text-6xl mb-4">📧</div>
              <h3 class="text-2xl font-bold mb-2">MailCade</h3>
              <p class="text-secondary-600 dark:text-secondary-400 mb-4">
                Developer Mail Sandbox
              </p>
              <p class="text-sm text-secondary-500 mb-6">Version {{ appVersion }}</p>
              
              <div class="max-w-md mx-auto text-left space-y-4 mt-8">
                <div class="p-4 bg-secondary-50 dark:bg-secondary-800 rounded-lg">
                  <p class="font-medium mb-2">SMTP Server</p>
                  <p class="text-sm text-secondary-600 dark:text-secondary-400">
                    localhost:{{ serverStore.status.smtpPort }}
                  </p>
                </div>
                
                <div class="p-4 bg-secondary-50 dark:bg-secondary-800 rounded-lg">
                  <p class="font-medium mb-3">Links</p>
                  <div class="space-y-2 text-sm">
                    <a
                      @click.prevent="openLink(websiteLink)"
                      href="#"
                      class="flex items-center gap-2 text-primary hover:underline cursor-pointer"
                    >
                      <span>🌐</span>
                      <span>Website</span>
                    </a>
                    <a
                      @click.prevent="openLink(docsLink)"
                      href="#"
                      class="flex items-center gap-2 text-primary hover:underline cursor-pointer"
                    >
                      <span>📚</span>
                      <span>Documentation</span>
                    </a>
                    <a
                      @click.prevent="openLink(githubRepo)"
                      href="#"
                      class="flex items-center gap-2 text-primary hover:underline cursor-pointer"
                    >
                      <span>💻</span>
                      <span>GitHub Repository</span>
                    </a>
                  </div>
                </div>
                
                <div class="p-4 bg-secondary-50 dark:bg-secondary-800 rounded-lg text-center">
                  <p class="text-sm text-secondary-600 dark:text-secondary-400 mb-2">
                    Built with ❤️ by
                  </p>
                  <a
                    @click.prevent="openLink(authorLink)"
                    href="#"
                    class="text-lg font-semibold text-primary hover:underline cursor-pointer"
                  >
                    {{ authorName }}
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, h, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useServerStore } from '@/stores/server.store'
import { useThemeStore } from '@/stores/theme.store'
import { useToast } from '@/composables/useToast'
import { ipcAPI } from '@/api/ipc'

const router = useRouter()
const serverStore = useServerStore()
const themeStore = useThemeStore()
const toast = useToast()

const activeTab = ref('general')
const saving = ref(false)
const checking = ref(false)
const downloading = ref(false)
const appVersion = ref('0.1.0')

// Check for query parameter to set active tab
const route = router.currentRoute
if (route.value.query.tab) {
  activeTab.value = route.value.query.tab as string
}

// Environment variables
const authorName = import.meta.env.VITE_AUTHOR_NAME || 'MailCade Team'
const authorLink = import.meta.env.VITE_AUTHOR_LINK || 'https://maylancer.org'
const websiteLink = import.meta.env.VITE_WEBSITE_LINK || 'https://maylancer.org/mailcade'
const docsLink = import.meta.env.VITE_DOCS_LINK || 'https://maylancer.org/mailcade/docs'
const githubRepo = import.meta.env.VITE_GITHUB_REPO || 'https://github.com/olakunlevpn/MailCade'

// Update status
const updateStatus = ref({
  checking: false,
  available: false,
  downloaded: false,
  downloading: false,
  progress: 0,
  error: null as string | null,
  info: null as { version: string; releaseDate: string; releaseNotes?: string } | null,
})

// Settings model
const settings = ref({
  ui: {
    theme: 'system' as 'light' | 'dark' | 'system',
    notifications: true,
  },
  app: {
    autoStart: true,
    autoUpdate: true,
  },
  mailpit: {
    smtpPort: 1025,
    webUIPort: 8025,
    maxMessages: 500,
  },
})

// Tab configuration
const tabs = [
  {
    id: 'general',
    label: 'General',
    icon: () =>
      h('svg', { class: 'w-5 h-5', fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24' }, [
        h('path', {
          'stroke-linecap': 'round',
          'stroke-linejoin': 'round',
          'stroke-width': '2',
          d: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z',
        }),
        h('path', {
          'stroke-linecap': 'round',
          'stroke-linejoin': 'round',
          'stroke-width': '2',
          d: 'M15 12a3 3 0 11-6 0 3 3 0 016 0z',
        }),
      ]),
  },
  {
    id: 'mailpit',
    label: 'Server',
    icon: () =>
      h('svg', { class: 'w-5 h-5', fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24' }, [
        h('path', {
          'stroke-linecap': 'round',
          'stroke-linejoin': 'round',
          'stroke-width': '2',
          d: 'M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01',
        }),
      ]),
  },
  {
    id: 'updates',
    label: 'Updates',
    icon: () =>
      h('svg', { class: 'w-5 h-5', fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24' }, [
        h('path', {
          'stroke-linecap': 'round',
          'stroke-linejoin': 'round',
          'stroke-width': '2',
          d: 'M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15',
        }),
      ]),
  },
  {
    id: 'about',
    label: 'About',
    icon: () =>
      h('svg', { class: 'w-5 h-5', fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24' }, [
        h('path', {
          'stroke-linecap': 'round',
          'stroke-linejoin': 'round',
          'stroke-width': '2',
          d: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
        }),
      ]),
  },
]

// Load settings on mount
onMounted(async () => {
  try {
    const allSettings = await ipcAPI.settings.getAll()
    
    if (allSettings.ui) {
      settings.value.ui = allSettings.ui as typeof settings.value.ui
      // Only set theme if it's different from current (to avoid unnecessary re-application)
      if (themeStore.theme !== settings.value.ui.theme) {
        themeStore.setTheme(settings.value.ui.theme)
      }
    }
    if (allSettings.app) {
      settings.value.app = {
        ...settings.value.app, // Keep defaults
        ...(allSettings.app as typeof settings.value.app), // Merge with saved settings
      }
    }
    if (allSettings.mailpit) {
      settings.value.mailpit = allSettings.mailpit as typeof settings.value.mailpit
    }
    
    // Get app version
    appVersion.value = await ipcAPI.getAppVersion()
  } catch (err) {
    console.error('Failed to load settings:', err)
    toast.error('Failed to load settings')
  }
  
  // Get initial update status
  try {
    const status = await window.electronAPI.updater.getStatus()
    updateStatus.value = { ...updateStatus.value, ...status }
  } catch (err) {
    console.error('Failed to get update status:', err)
  }
  
  // Subscribe to update status changes
  unsubscribeUpdateStatus = window.electronAPI.onUpdateStatusChange((status: any) => {
    updateStatus.value = { ...updateStatus.value, ...status }
    downloading.value = status.downloading || false
    
    if (status.downloaded) {
      toast.success('Update downloaded!', 'Ready to install')
    }
  })
})

onUnmounted(() => {
  if (unsubscribeUpdateStatus) {
    unsubscribeUpdateStatus()
  }
})

// Save settings
const saveSettings = async () => {
  saving.value = true
  
  try {
    // Create plain objects to avoid cloning issues
    const uiSettings = {
      theme: settings.value.ui.theme,
      notifications: settings.value.ui.notifications,
    }
    
    const appSettings = {
      autoStart: settings.value.app.autoStart,
      autoUpdate: settings.value.app.autoUpdate,
    }
    
    const mailpitSettings = {
      smtpPort: settings.value.mailpit.smtpPort,
      webUIPort: settings.value.mailpit.webUIPort,
      maxMessages: settings.value.mailpit.maxMessages,
    }
    
    // Save each setting
    await ipcAPI.settings.set('ui', uiSettings)
    await ipcAPI.settings.set('app', appSettings)
    await ipcAPI.settings.set('mailpit', mailpitSettings)
    
    // Apply theme
    themeStore.setTheme(settings.value.ui.theme)
    
    toast.success('Settings saved successfully')
    
    // Check if Mailpit needs restart
    if (
      settings.value.mailpit.smtpPort !== serverStore.status.smtpPort ||
      settings.value.mailpit.webUIPort !== serverStore.status.port
    ) {
      toast.info('Restart Mailpit for port changes to take effect')
    }
  } catch (err) {
    console.error('Failed to save settings:', err)
    toast.error('Failed to save settings')
  } finally {
    saving.value = false
  }
}

// Update functions
const checkForUpdates = async () => {
  checking.value = true
  try {
    const status = await window.electronAPI.updater.checkForUpdates()
    updateStatus.value = { ...updateStatus.value, ...status }
    
    if (status.available) {
      toast.info('Update available!', `Version ${status.info?.version}`)
    } else if (!status.error) {
      toast.success('You are up to date!')
    }
  } catch (err) {
    console.error('Failed to check for updates:', err)
    toast.error('Failed to check for updates')
  } finally {
    checking.value = false
  }
}

const downloadUpdate = async () => {
  downloading.value = true
  try {
    await window.electronAPI.updater.downloadUpdate()
    toast.info('Downloading update...')
  } catch (err) {
    console.error('Failed to download update:', err)
    toast.error('Failed to download update')
    downloading.value = false
  }
}

const installUpdate = () => {
  try {
    window.electronAPI.updater.installUpdate()
  } catch (err) {
    console.error('Failed to install update:', err)
    toast.error('Failed to install update')
  }
}

// Open external link in system browser
const openLink = async (url: string) => {
  try {
    await window.electronAPI.openExternal(url)
  } catch (err) {
    console.error('Failed to open link:', err)
    toast.error('Failed to open link')
  }
}

// Listen for update status changes
let unsubscribeUpdateStatus: (() => void) | null = null
</script>
