/**
 * Settings Service
 * Manages application settings persistence using electron-store
 */

import Store from 'electron-store'
import { DEFAULT_CONFIG } from '../config/defaults'
import { logger } from '../utils/logger'

export interface AppSettings {
  mailpit: {
    smtpPort: number
    webUIPort: number
    maxMessages: number
    hostname: string
  }
  app: {
    autoStart: boolean
    startMinimized: boolean
    closeToTray: boolean
    autoUpdate: boolean
  }
  ui: {
    theme: 'light' | 'dark' | 'system'
    notifications: boolean
  }
}

class SettingsService {
  private store: Store<AppSettings>

  constructor() {
    this.store = new Store<AppSettings>({
      name: 'settings',
      defaults: DEFAULT_CONFIG as AppSettings,
    })
    
    logger.info('Settings service initialized')
  }

  /**
   * Get a specific setting value
   */
  get(key: string): unknown {
    try {
      return this.store.get(key)
    } catch (error) {
      logger.error(`Failed to get setting: ${key}`, error)
      throw error
    }
  }

  /**
   * Set a specific setting value
   */
  set(key: string, value: unknown): void {
    try {
      this.store.set(key, value)
      logger.debug(`Setting updated: ${key}`)
    } catch (error) {
      logger.error(`Failed to set setting: ${key}`, error)
      throw error
    }
  }

  /**
   * Get all settings
   */
  getAll(): AppSettings {
    try {
      return this.store.store
    } catch (error) {
      logger.error('Failed to get all settings', error)
      throw error
    }
  }

  /**
   * Reset settings to defaults
   */
  reset(): void {
    try {
      this.store.clear()
      logger.info('Settings reset to defaults')
    } catch (error) {
      logger.error('Failed to reset settings', error)
      throw error
    }
  }

  /**
   * Check if a key exists
   */
  has(key: string): boolean {
    return this.store.has(key)
  }

  /**
   * Delete a specific setting
   */
  delete(key: string): void {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      this.store.delete(key as any)
      logger.debug(`Setting deleted: ${key}`)
    } catch (error) {
      logger.error(`Failed to delete setting: ${key}`, error)
      throw error
    }
  }
}

// Singleton instance
export const settingsService = new SettingsService()
