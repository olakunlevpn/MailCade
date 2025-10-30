/**
 * IPC API Client
 * Wrapper around electron API for type-safe communication
 */

import type { MailpitStatus } from '@/stores/server.store'

export const ipcAPI = {
  // App info
  async getAppVersion(): Promise<string> {
    return window.electronAPI.getAppVersion()
  },

  // Mailpit process management
  mailpit: {
    async start(): Promise<void> {
      return window.electronAPI.mailpit.start()
    },

    async stop(): Promise<void> {
      return window.electronAPI.mailpit.stop()
    },

    async restart(): Promise<void> {
      return window.electronAPI.mailpit.restart()
    },

    async getStatus(): Promise<MailpitStatus> {
      return window.electronAPI.mailpit.getStatus()
    },

    async getLogs(): Promise<string[]> {
      return window.electronAPI.mailpit.getLogs()
    },

    // API methods (proxied through main process)
    async getMessages(params?: unknown): Promise<unknown> {
      return window.electronAPI.mailpit.getMessages(params)
    },

    async getMessage(id: string): Promise<unknown> {
      return window.electronAPI.mailpit.getMessage(id)
    },

    async deleteMessage(id: string): Promise<void> {
      return window.electronAPI.mailpit.deleteMessage(id)
    },

    async deleteAllMessages(): Promise<void> {
      return window.electronAPI.mailpit.deleteAllMessages()
    },

    async searchMessages(query: string): Promise<unknown> {
      return window.electronAPI.mailpit.searchMessages(query)
    },

    onStatusChange(callback: (status: MailpitStatus) => void): () => void {
      return window.electronAPI.onMailpitStatusChange(callback)
    },
  },

  // Settings management
  settings: {
    async get(key: string): Promise<unknown> {
      return window.electronAPI.settings.get(key)
    },

    async set(key: string, value: unknown): Promise<void> {
      return window.electronAPI.settings.set(key, value)
    },

    async getAll(): Promise<Record<string, unknown>> {
      return window.electronAPI.settings.getAll()
    },
  },
}
