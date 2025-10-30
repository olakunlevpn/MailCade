/**
 * Auto-Updater Service
 * Handles automatic updates using electron-updater
 */

import { autoUpdater } from 'electron-updater'
import { BrowserWindow } from 'electron'
import { logger } from '../utils/logger'
import { settingsService } from './settings.service'

export interface UpdateInfo {
  version: string
  releaseDate: string
  releaseNotes?: string
}

export interface UpdateStatus {
  checking: boolean
  available: boolean
  downloaded: boolean
  downloading: boolean
  progress: number
  error: string | null
  info: UpdateInfo | null
}

class AutoUpdaterService {
  private status: UpdateStatus = {
    checking: false,
    available: false,
    downloaded: false,
    downloading: false,
    progress: 0,
    error: null,
    info: null,
  }

  private mainWindow: BrowserWindow | null = null

  constructor() {
    this.setupAutoUpdater()
    logger.info('Auto-updater service initialized')
  }

  /**
   * Set the main window for sending events
   */
  setMainWindow(window: BrowserWindow) {
    this.mainWindow = window
  }

  /**
   * Setup auto-updater event listeners
   */
  private setupAutoUpdater() {
    // Configure auto-updater
    autoUpdater.autoDownload = false // Manual download control
    autoUpdater.autoInstallOnAppQuit = true

    // Checking for update
    autoUpdater.on('checking-for-update', () => {
      logger.info('Checking for updates...')
      this.status.checking = true
      this.status.error = null
      this.sendStatusToRenderer()
    })

    // Update available
    autoUpdater.on('update-available', (info) => {
      logger.info('Update available:', info.version)
      this.status.checking = false
      this.status.available = true
      this.status.info = {
        version: info.version,
        releaseDate: info.releaseDate,
        releaseNotes: info.releaseNotes as string | undefined,
      }
      this.sendStatusToRenderer()
    })

    // Update not available
    autoUpdater.on('update-not-available', (info) => {
      logger.info('Update not available, current version:', info.version)
      this.status.checking = false
      this.status.available = false
      this.sendStatusToRenderer()
    })

    // Download progress
    autoUpdater.on('download-progress', (progress) => {
      this.status.downloading = true
      this.status.progress = progress.percent
      this.sendStatusToRenderer()
      
      if (progress.percent % 10 === 0) {
        logger.info(`Download progress: ${progress.percent.toFixed(2)}%`)
      }
    })

    // Update downloaded
    autoUpdater.on('update-downloaded', (info) => {
      logger.info('Update downloaded:', info.version)
      this.status.downloading = false
      this.status.downloaded = true
      this.status.progress = 100
      this.sendStatusToRenderer()
    })

    // Error
    autoUpdater.on('error', (error) => {
      logger.error('Auto-updater error:', error)
      this.status.checking = false
      this.status.downloading = false
      this.status.error = error.message
      this.sendStatusToRenderer()
    })
  }

  /**
   * Send status update to renderer
   */
  private sendStatusToRenderer() {
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      this.mainWindow.webContents.send('update:status', this.status)
    }
  }

  /**
   * Check for updates
   */
  async checkForUpdates(): Promise<UpdateStatus> {
    try {
      logger.info('Manually checking for updates')
      await autoUpdater.checkForUpdates()
      return this.status
    } catch (error) {
      logger.error('Failed to check for updates:', error)
      this.status.error = error instanceof Error ? error.message : 'Unknown error'
      return this.status
    }
  }

  /**
   * Download available update
   */
  async downloadUpdate(): Promise<void> {
    try {
      if (!this.status.available) {
        throw new Error('No update available to download')
      }

      logger.info('Starting update download')
      await autoUpdater.downloadUpdate()
    } catch (error) {
      logger.error('Failed to download update:', error)
      throw error
    }
  }

  /**
   * Install downloaded update and restart
   */
  quitAndInstall(): void {
    if (!this.status.downloaded) {
      throw new Error('No update downloaded to install')
    }

    logger.info('Installing update and restarting')
    autoUpdater.quitAndInstall(false, true)
  }

  /**
   * Get current status
   */
  getStatus(): UpdateStatus {
    return { ...this.status }
  }

  /**
   * Check for updates on startup if auto-update is enabled
   */
  async checkOnStartup(): Promise<void> {
    const settings = settingsService.getAll()
    
    if (settings.app.autoUpdate !== false) {
      // Auto-update is enabled by default
      logger.info('Auto-update enabled, checking for updates on startup')
      setTimeout(() => {
        this.checkForUpdates().catch((error) => {
          logger.error('Startup update check failed:', error)
        })
      }, 5000) // Wait 5 seconds after startup
    } else {
      logger.info('Auto-update disabled')
    }
  }
}

export const autoUpdaterService = new AutoUpdaterService()
