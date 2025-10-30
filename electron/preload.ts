const { contextBridge, ipcRenderer } = require('electron')

// Expose protected methods that allow the renderer process to use
// ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // App info
  getAppVersion: () => ipcRenderer.invoke('app:getVersion'),
  
  // Mailpit process management
  mailpit: {
    start: () => ipcRenderer.invoke('mailpit:start'),
    stop: () => ipcRenderer.invoke('mailpit:stop'),
    restart: () => ipcRenderer.invoke('mailpit:restart'),
    getStatus: () => ipcRenderer.invoke('mailpit:getStatus'),
    getLogs: () => ipcRenderer.invoke('mailpit:getLogs'),
    // API methods (proxied through main process)
    getMessages: (params: any) => ipcRenderer.invoke('mailpit:getMessages', params),
    getMessage: (id: string) => ipcRenderer.invoke('mailpit:getMessage', id),
    deleteMessage: (id: string) => ipcRenderer.invoke('mailpit:deleteMessage', id),
    deleteAllMessages: () => ipcRenderer.invoke('mailpit:deleteAllMessages'),
    searchMessages: (query: string) => ipcRenderer.invoke('mailpit:searchMessages', query),
  },
  
  // Settings management
  settings: {
    get: (key: string) => ipcRenderer.invoke('settings:get', key),
    set: (key: string, value: unknown) => ipcRenderer.invoke('settings:set', key, value),
    getAll: () => ipcRenderer.invoke('settings:getAll'),
  },
  
  // Auto-updater
  updater: {
    checkForUpdates: () => ipcRenderer.invoke('update:check'),
    downloadUpdate: () => ipcRenderer.invoke('update:download'),
    installUpdate: () => ipcRenderer.invoke('update:install'),
    getStatus: () => ipcRenderer.invoke('update:getStatus'),
  },

  // App badge
  setBadgeCount: (count: number) => ipcRenderer.invoke('app:setBadgeCount', count),

  // External links
  openExternal: (url: string) => ipcRenderer.invoke('app:openExternal', url),

  // Notifications
  showNotification: (title: string, body: string) => ipcRenderer.invoke('notification:show', title, body),

  // Event listeners
  onMailpitStatusChange: (callback: (status: unknown) => void) => {
    const subscription = (_event: unknown, status: unknown) => callback(status)
    ipcRenderer.on('mailpit:statusChanged', subscription)
    
    // Return unsubscribe function
    return () => {
      ipcRenderer.removeListener('mailpit:statusChanged', subscription)
    }
  },

  onUpdateStatusChange: (callback: (status: unknown) => void) => {
    const subscription = (_event: unknown, status: unknown) => callback(status)
    ipcRenderer.on('update:status', subscription)
    
    // Return unsubscribe function
    return () => {
      ipcRenderer.removeListener('update:status', subscription)
    }
  },
})

// Type definitions are in src/types/electron.d.ts
