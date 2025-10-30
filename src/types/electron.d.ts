/**
 * Electron API type definitions
 * This file declares the global window.electronAPI interface
 */

export interface MailpitStatus {
  running: boolean
  port: number
  smtpPort: number
  pid?: number
}

export interface UpdateStatus {
  checking: boolean
  available: boolean
  downloaded: boolean
  downloading: boolean
  progress: number
  error: string | null
  info: {
    version: string
    releaseDate: string
    releaseNotes?: string
  } | null
}

export interface ElectronAPI {
  getAppVersion: () => Promise<string>
  mailpit: {
    start: () => Promise<void>
    stop: () => Promise<void>
    restart: () => Promise<void>
    getStatus: () => Promise<MailpitStatus>
    getLogs: () => Promise<string[]>
    getMessages: (params?: unknown) => Promise<unknown>
    getMessage: (id: string) => Promise<unknown>
    deleteMessage: (id: string) => Promise<void>
    deleteAllMessages: () => Promise<void>
    searchMessages: (query: string) => Promise<unknown>
  }
  updater: {
    checkForUpdates: () => Promise<UpdateStatus>
    downloadUpdate: () => Promise<void>
    installUpdate: () => void
    getStatus: () => Promise<UpdateStatus>
  }
  settings: {
    get: (key: string) => Promise<unknown>
    set: (key: string, value: unknown) => Promise<void>
    getAll: () => Promise<Record<string, unknown>>
  }
  setBadgeCount: (count: number) => Promise<void>
  openExternal: (url: string) => Promise<void>
  showNotification: (title: string, body: string) => Promise<void>
  onMailpitStatusChange: (callback: (status: MailpitStatus) => void) => () => void
  onUpdateStatusChange: (callback: (status: UpdateStatus) => void) => () => void
}

declare global {
  interface Window {
    electronAPI: ElectronAPI
  }
}
