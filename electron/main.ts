import { app, BrowserWindow } from 'electron'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { appConfig } from './config'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Set app name FIRST (removes Electron branding)
// This must be done before any other app configuration
process.title = appConfig.name
app.name = appConfig.name

// macOS specific - force app name
if (process.platform === 'darwin') {
  app.setName(appConfig.name)
}

// Set environment variable for app name
process.env.ELECTRON_APP_NAME = appConfig.name

import { registerIPCHandlers, unregisterIPCHandlers } from './ipc/handlers'
import { mailpitProcessService } from './services/mailpit-process.service'
import { settingsService } from './services/settings.service'
import { autoUpdaterService } from './services/auto-updater.service'
import { MenuService } from './services/menu.service'
import { logger } from './utils/logger'

// Single instance lock (only in production to avoid dev hot reload issues)
if (app.isPackaged) {
  const gotTheLock = app.requestSingleInstanceLock()
  
  if (!gotTheLock) {
    logger.warn('Another instance is already running, quitting')
    app.quit()
  } else {
    app.on('second-instance', () => {
      if (mainWindow) {
        if (mainWindow.isMinimized()) mainWindow.restore()
        mainWindow.focus()
      }
    })
  }
}

process.env.DIST = path.join(__dirname, '../dist')
process.env.VITE_PUBLIC = app.isPackaged
  ? process.env.DIST
  : path.join(process.env.DIST, '../public')

let mainWindow: BrowserWindow | null = null
let mailpitStarted = false // Track if Mailpit has been started

const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL']

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    icon: path.join(__dirname, '../build/icons/icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      // Security: Following Electron best practices
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
    },
    backgroundColor: '#ffffff',
    show: false, // Show window after ready-to-show
  })

  // Graceful show
  mainWindow.once('ready-to-show', () => {
    mainWindow?.show()
  })

  // Create custom menu
  MenuService.createMenu(mainWindow)

  // Load the app
  if (VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(VITE_DEV_SERVER_URL)
    mainWindow.webContents.openDevTools()
  } else {
    mainWindow.loadFile(path.join(process.env.DIST!, 'index.html'))
  }

  // Handle window close
  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

// Use environment variable to track Mailpit across hot reloads
const MAILPIT_STARTED_ENV = 'MAILCADE_MAILPIT_STARTED'

// App lifecycle events
app.whenReady().then(async () => {
  logger.info('App is ready')
  
  // Check if this is a hot reload (window already exists)
  if (BrowserWindow.getAllWindows().length > 0) {
    logger.info('Hot reload detected, skipping initialization')
    return
  }
  
  // Register IPC handlers
  registerIPCHandlers()
  
  // Initialize services
  const settings = settingsService.getAll()
  logger.info('Settings loaded:', settings)
  
  // Start Mailpit if autoStart is enabled (check both flag and env var)
  const envMailpitStarted = process.env[MAILPIT_STARTED_ENV] === 'true'
  
  if (settings.app.autoStart && !mailpitStarted && !envMailpitStarted) {
    try {
      logger.info('Auto-starting Mailpit')
      mailpitStarted = true
      process.env[MAILPIT_STARTED_ENV] = 'true'
      await mailpitProcessService.start()
    } catch (error) {
      mailpitStarted = false
      process.env[MAILPIT_STARTED_ENV] = 'false'
      logger.error('Failed to auto-start Mailpit', error)
    }
  } else if (envMailpitStarted) {
    logger.info('Mailpit already started (from previous instance)')
    mailpitStarted = true
  }
  
  // Create main window
  createWindow()
  
  // Set main window for auto-updater
  if (mainWindow) {
    autoUpdaterService.setMainWindow(mainWindow)
    
    // Check for updates on startup (if enabled in settings)
    autoUpdaterService.checkOnStartup()
  }

  app.on('activate', () => {
    // On macOS, re-create window when dock icon is clicked
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

// Quit when all windows are closed (except on macOS)
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// Cleanup before quit
let isQuitting = false
app.on('before-quit', async (event) => {
  if (isQuitting) return
  
  event.preventDefault()
  isQuitting = true
  
  logger.info('App is quitting, cleaning up')
  
  // Stop Mailpit process
  await mailpitProcessService.cleanup()
  
  // Reset flags and environment
  mailpitStarted = false
  process.env[MAILPIT_STARTED_ENV] = 'false'
  
  // Unregister IPC handlers
  unregisterIPCHandlers()
  
  logger.info('Cleanup complete')
  app.exit(0)
})

// Security: Prevent navigation to external URLs
app.on('web-contents-created', (_event, contents) => {
  contents.on('will-navigate', (event, navigationUrl) => {
    const parsedUrl = new URL(navigationUrl)
    
    // Allow navigation only to localhost in dev mode
    if (VITE_DEV_SERVER_URL && parsedUrl.origin === new URL(VITE_DEV_SERVER_URL).origin) {
      return
    }
    
    // Block all other navigation
    event.preventDefault()
    console.warn('Navigation blocked:', navigationUrl)
  })
})
