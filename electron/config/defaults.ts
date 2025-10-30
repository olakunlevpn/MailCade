/**
 * Default configuration values for the application
 */

export const DEFAULT_CONFIG = {
  // Mailpit configuration
  mailpit: {
    smtpPort: 1025,
    webUIPort: 8025,
    maxMessages: 500,
    hostname: 'localhost',
  },
  
  // Application settings
  app: {
    autoStart: true,
    autoUpdate: true,
    startMinimized: false,
    closeToTray: false,
  },
  
  // UI preferences
  ui: {
    theme: 'system' as 'light' | 'dark' | 'system',
    notifications: true,
  },
} as const

export type AppConfig = typeof DEFAULT_CONFIG
