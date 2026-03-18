import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import { ipcAPI } from '@/api/ipc'
import { useToast } from '@/composables/useToast'
import type { MailpitStatus, MailpitState } from '@/types/electron.d.ts'

export type { MailpitStatus, MailpitState }

export const useServerStore = defineStore('server', () => {
  const toast = useToast()
  const status = ref<MailpitStatus>({
    state: 'stopped',
    port: 8025,
    smtpPort: 1025,
  })
  const logs = ref<string[]>([])
  const error = ref<string | null>(null)
  const previousState = ref<MailpitState>('stopped')

  // Computed getters
  const isRunning = computed(() => status.value.state === 'running')
  const actualPort = computed(() => status.value.resolvedPort ?? status.value.port)
  const actualSmtpPort = computed(() => status.value.resolvedSmtpPort ?? status.value.smtpPort)
  const isTransitioning = computed(() =>
    ['starting', 'stopping', 'restarting', 'reconnecting'].includes(status.value.state)
  )

  // Watch for state transitions to show toasts
  watch(
    () => status.value.state,
    (newState, oldState) => {
      previousState.value = oldState

      // Crash recovery succeeded
      if (oldState === 'reconnecting' && newState === 'running') {
        toast.warning('Mail server restarted after unexpected shutdown')
      }

      // Error after starting or reconnecting
      if (newState === 'error' && status.value.error) {
        toast.error(status.value.error, 'Server Error')
      }

      // Port auto-resolved
      if (newState === 'running') {
        if (status.value.resolvedSmtpPort) {
          toast.info(`SMTP port ${status.value.smtpPort} was in use, using ${status.value.resolvedSmtpPort} instead`)
        }
        if (status.value.resolvedPort) {
          toast.info(`HTTP port ${status.value.port} was in use, using ${status.value.resolvedPort} instead`)
        }
      }
    }
  )

  // Listen for status changes from main process
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

  setupStatusListener()

  return {
    status,
    logs,
    error,
    isRunning,
    actualPort,
    actualSmtpPort,
    isTransitioning,
    startMailpit,
    stopMailpit,
    restartMailpit,
    refreshStatus,
    fetchLogs,
    setupStatusListener,
    cleanup,
  }
})
