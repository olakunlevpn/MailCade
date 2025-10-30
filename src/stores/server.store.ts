import { defineStore } from 'pinia'
import { ref } from 'vue'
import { ipcAPI } from '@/api/ipc'

export interface MailpitStatus {
  running: boolean
  port: number
  smtpPort: number
  pid?: number
}

export const useServerStore = defineStore('server', () => {
  const status = ref<MailpitStatus>({
    running: false,
    port: 8025,
    smtpPort: 1025,
  })
  const logs = ref<string[]>([])
  const error = ref<string | null>(null)

  // Listen for status changes
  let unsubscribe: (() => void) | null = null

  const setupStatusListener = () => {
    if (unsubscribe) {
      unsubscribe()
    }

    unsubscribe = ipcAPI.mailpit.onStatusChange((newStatus) => {
      status.value = newStatus
    })
  }

  const startMailpit = async () => {
    error.value = null
    try {
      await ipcAPI.mailpit.start()
      await refreshStatus()
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to start Mailpit'
      console.error('Failed to start Mailpit:', err)
      throw err
    }
  }

  const stopMailpit = async () => {
    error.value = null
    try {
      await ipcAPI.mailpit.stop()
      await refreshStatus()
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to stop Mailpit'
      console.error('Failed to stop Mailpit:', err)
      throw err
    }
  }

  const restartMailpit = async () => {
    error.value = null
    try {
      await ipcAPI.mailpit.restart()
      await refreshStatus()
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to restart Mailpit'
      console.error('Failed to restart Mailpit:', err)
      throw err
    }
  }

  const refreshStatus = async () => {
    try {
      const newStatus = await ipcAPI.mailpit.getStatus()
      status.value = newStatus
    } catch (err) {
      console.error('Failed to get Mailpit status:', err)
    }
  }

  const fetchLogs = async () => {
    error.value = null
    try {
      logs.value = await ipcAPI.mailpit.getLogs()
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch logs'
      console.error('Failed to fetch logs:', err)
      throw err
    }
  }

  const cleanup = () => {
    if (unsubscribe) {
      unsubscribe()
      unsubscribe = null
    }
  }

  // Setup listener when store is initialized
  setupStatusListener()

  return {
    status,
    logs,
    error,
    startMailpit,
    stopMailpit,
    restartMailpit,
    refreshStatus,
    fetchLogs,
    setupStatusListener,
    cleanup,
  }
})
