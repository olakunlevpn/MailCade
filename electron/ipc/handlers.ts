/**
 * IPC Handlers
 * Handle all IPC communication between main and renderer processes
 */

import { ipcMain, app, BrowserWindow, shell, Notification } from 'electron'
import { IPC_CHANNELS } from './channels'
import { mailpitProcessService } from '../services/mailpit-process.service'
import { mailpitAPIService } from '../services/mailpit-api.service'
import { settingsService } from '../services/settings.service'
import { autoUpdaterService } from '../services/auto-updater.service'
import { logger } from '../utils/logger'

/**
 * Register all IPC handlers
 */
export function registerIPCHandlers(): void {

  // App info handlers
  ipcMain.handle(IPC_CHANNELS.APP_GET_VERSION, () => {
    return app.getVersion()
  })

  // Mailpit process handlers
  ipcMain.handle(IPC_CHANNELS.MAILPIT_START, async () => {
    try {
      await mailpitProcessService.start()
      notifyStatusChange()
    } catch (error) {
      logger.error('IPC: Failed to start Mailpit', error)
      throw error
    }
  })

  ipcMain.handle(IPC_CHANNELS.MAILPIT_STOP, async () => {
    try {
      await mailpitProcessService.stop()
      notifyStatusChange()
    } catch (error) {
      logger.error('IPC: Failed to stop Mailpit', error)
      throw error
    }
  })

  ipcMain.handle(IPC_CHANNELS.MAILPIT_RESTART, async () => {
    try {
      await mailpitProcessService.restart()
      notifyStatusChange()
    } catch (error) {
      logger.error('IPC: Failed to restart Mailpit', error)
      throw error
    }
  })

  ipcMain.handle(IPC_CHANNELS.MAILPIT_GET_STATUS, () => {
    try {
      return mailpitProcessService.getStatus()
    } catch (error) {
      logger.error('IPC: Failed to get Mailpit status', error)
      throw error
    }
  })

  ipcMain.handle(IPC_CHANNELS.MAILPIT_GET_LOGS, () => {
    try {
      return mailpitProcessService.getLogs()
    } catch (error) {
      logger.error('IPC: Failed to get Mailpit logs', error)
      throw error
    }
  })

  // Mailpit API handlers (proxied to avoid CORS)
  ipcMain.handle(IPC_CHANNELS.MAILPIT_GET_MESSAGES, async (_event, params) => {
    try {
      return await mailpitAPIService.getMessages(params)
    } catch (error) {
      logger.error('IPC: Failed to get messages', error)
      throw error
    }
  })

  ipcMain.handle(IPC_CHANNELS.MAILPIT_GET_MESSAGE, async (_event, id: string) => {
    try {
      return await mailpitAPIService.getMessage(id)
    } catch (error) {
      logger.error(`IPC: Failed to get message ${id}`, error)
      throw error
    }
  })

  ipcMain.handle(IPC_CHANNELS.MAILPIT_DELETE_MESSAGE, async (_event, id: string) => {
    try {
      await mailpitAPIService.deleteMessage(id)
    } catch (error) {
      logger.error(`IPC: Failed to delete message ${id}`, error)
      throw error
    }
  })

  ipcMain.handle(IPC_CHANNELS.MAILPIT_DELETE_ALL, async () => {
    try {
      await mailpitAPIService.deleteAllMessages()
    } catch (error) {
      logger.error('IPC: Failed to delete all messages', error)
      throw error
    }
  })

  ipcMain.handle(IPC_CHANNELS.MAILPIT_SEARCH, async (_event, query: string) => {
    try {
      return await mailpitAPIService.getMessages({ search: query })
    } catch (error) {
      logger.error('IPC: Failed to search messages', error)
      throw error
    }
  })

  // Settings handlers
  ipcMain.handle(IPC_CHANNELS.SETTINGS_GET, (_event, key: string) => {
    try {
      return settingsService.get(key)
    } catch (error) {
      logger.error(`IPC: Failed to get setting: ${key}`, error)
      throw error
    }
  })

  ipcMain.handle(IPC_CHANNELS.SETTINGS_SET, async (_event, key: string, value: unknown) => {
    try {
      settingsService.set(key, value)
      
      // If Mailpit ports changed, restart the process
      if (key.includes('mailpit.')) {
        const status = mailpitProcessService.getStatus()
        if (status.running) {
          logger.info('Mailpit settings changed, restarting process')
          await mailpitProcessService.restart()
          notifyStatusChange()
        }
      }
    } catch (error) {
      logger.error(`IPC: Failed to set setting: ${key}`, error)
      throw error
    }
  })

  ipcMain.handle(IPC_CHANNELS.SETTINGS_GET_ALL, () => {
    try {
      return settingsService.getAll()
    } catch (error) {
      logger.error('IPC: Failed to get all settings', error)
      throw error
    }
  })

  ipcMain.handle(IPC_CHANNELS.SETTINGS_RESET, () => {
    try {
      settingsService.reset()
    } catch (error) {
      logger.error('IPC: Failed to reset settings', error)
      throw error
    }
  })

  // Auto-updater handlers
  ipcMain.handle(IPC_CHANNELS.UPDATE_CHECK, async () => {
    try {
      return await autoUpdaterService.checkForUpdates()
    } catch (error) {
      logger.error('IPC: Failed to check for updates', error)
      throw error
    }
  })

  ipcMain.handle(IPC_CHANNELS.UPDATE_DOWNLOAD, async () => {
    try {
      await autoUpdaterService.downloadUpdate()
    } catch (error) {
      logger.error('IPC: Failed to download update', error)
      throw error
    }
  })

  ipcMain.handle(IPC_CHANNELS.UPDATE_INSTALL, () => {
    try {
      autoUpdaterService.quitAndInstall()
    } catch (error) {
      logger.error('IPC: Failed to install update', error)
      throw error
    }
  })

  ipcMain.handle(IPC_CHANNELS.UPDATE_GET_STATUS, () => {
    try {
      return autoUpdaterService.getStatus()
    } catch (error) {
      logger.error('IPC: Failed to get update status', error)
      throw error
    }
  })

  // App badge handler
  ipcMain.handle(IPC_CHANNELS.APP_SET_BADGE_COUNT, (_event, count: number) => {
    try {
      app.setBadgeCount(count)
    } catch (error) {
      logger.error('IPC: Failed to set badge count', error)
      throw error
    }
  })

  // Open external link handler
  ipcMain.handle(IPC_CHANNELS.APP_OPEN_EXTERNAL, async (_event, url: string) => {
    try {
      await shell.openExternal(url)
    } catch (error) {
      logger.error('IPC: Failed to open external link', error)
      throw error
    }
  })

  // Show notification handler
  ipcMain.handle(IPC_CHANNELS.NOTIFICATION_SHOW, (_event, title: string, body: string) => {
    try {
      if (Notification.isSupported()) {
        const notification = new Notification({
          title,
          body,
          silent: false,
        })
        notification.show()
        logger.debug('Notification shown:', title)
      } else {
        logger.warn('Notifications not supported on this platform')
      }
    } catch (error) {
      logger.error('IPC: Failed to show notification', error)
      throw error
    }
  })

  logger.info('IPC handlers registered successfully')
}

/**
 * Notify all windows about Mailpit status change
 */
function notifyStatusChange(): void {
  const status = mailpitProcessService.getStatus()
  BrowserWindow.getAllWindows().forEach((window) => {
    window.webContents.send(IPC_CHANNELS.MAILPIT_STATUS_CHANGED, status)
  })
}

/**
 * Cleanup IPC handlers
 */
export function unregisterIPCHandlers(): void {
  logger.info('Unregistering IPC handlers')
  
  Object.values(IPC_CHANNELS).forEach((channel) => {
    ipcMain.removeHandler(channel)
  })
}
