/**
 * Mailpit Process Service
 * Manages the Mailpit binary as a child process
 */

import { spawn, ChildProcess } from 'child_process'
import { app, BrowserWindow } from 'electron'
import path from 'path'
import fs from 'fs'
import http from 'http'
import net from 'net'
import { logger } from '../utils/logger'
import { settingsService } from './settings.service'
import { IPC_CHANNELS } from '../ipc/channels'
import { mailpitAPIService } from './mailpit-api.service'

export type MailpitState = 'stopped' | 'starting' | 'running' | 'stopping' | 'restarting' | 'reconnecting' | 'error'

export interface MailpitStatus {
  state: MailpitState
  port: number
  smtpPort: number
  pid?: number
  error?: string
  retryAttempt?: number
  resolvedSmtpPort?: number
  resolvedPort?: number
}

class MailpitProcessService {
  private process: ChildProcess | null = null
  private logs: string[] = []
  private readonly maxLogs = 500
  private isStarting = false
  private isRestarting = false
  private currentState: MailpitState = 'stopped'
  private stateError: string | undefined = undefined
  private retryAttempt: number = 0
  private resolvedSmtpPort: number | undefined = undefined
  private resolvedPort: number | undefined = undefined

  constructor() {
    logger.info('Mailpit process service initialized')
  }

  private setState(state: MailpitState, error?: string): void {
    this.currentState = state
    this.stateError = state === 'error' ? error : undefined
    this.broadcastStatusChange()
  }

  /**
   * Get the path to the Mailpit binary based on platform
   */
  private getMailpitBinaryPath(): string {
    const platform = process.platform
    const isDev = !app.isPackaged

    let binaryName: string

    if (platform === 'win32') {
      binaryName = 'mailpit-win.exe'
    } else if (platform === 'darwin') {
      // Detect ARM64 (Apple Silicon) vs x64
      const arch = process.arch
      binaryName = arch === 'arm64' ? 'mailpit-darwin-arm64' : 'mailpit-darwin-x64'
    } else {
      // Linux
      binaryName = 'mailpit-linux'
    }

    let binaryPath: string
    if (isDev) {
      // In development, look in the electron/binaries folder
      binaryPath = path.join(app.getAppPath(), 'electron', 'binaries', binaryName)
    } else {
      // In production, binaries are packaged in resources
      binaryPath = path.join(process.resourcesPath, 'binaries', binaryName)
    }

    logger.debug(`Mailpit binary path: ${binaryPath}`)

    // Check if binary exists
    if (!fs.existsSync(binaryPath)) {
      const error = `Mailpit binary not found at: ${binaryPath}`
      logger.error(error)
      this.addLog(`[ERROR] ${error}`)
      throw new Error(error)
    }

    return binaryPath
  }

  /**
   * Ensure the binary has execute permissions (macOS/Linux)
   * and remove macOS quarantine attribute if present
   */
  private ensureBinaryPermissions(binaryPath: string): void {
    if (process.platform === 'win32') return

    try {
      const stats = fs.statSync(binaryPath)
      const isExecutable = (stats.mode & 0o111) !== 0

      if (!isExecutable) {
        logger.info('Setting execute permission on Mailpit binary')
        fs.chmodSync(binaryPath, 0o755)
        this.addLog('[INFO] Set execute permission on Mailpit binary')
      }
    } catch (error) {
      logger.warn('Failed to check/set binary permissions:', error)
    }

    // Remove macOS quarantine attribute that blocks execution
    if (process.platform === 'darwin') {
      try {
        const { execSync } = require('child_process')
        execSync(`xattr -d com.apple.quarantine "${binaryPath}" 2>/dev/null || true`)
      } catch {
        // Attribute may not exist, that's fine
      }
    }
  }

  /**
   * Check if a port is available by attempting to bind it
   */
  private checkPortAvailable(port: number): Promise<boolean> {
    return new Promise((resolve) => {
      const server = net.createServer()
      server.once('error', () => resolve(false))
      server.once('listening', () => {
        server.close(() => resolve(true))
      })
      server.listen(port, '0.0.0.0')
    })
  }

  /**
   * Find an available port starting from the preferred port
   * Returns the preferred port if available, otherwise tries up to 10 increments
   */
  private async findAvailablePort(preferredPort: number): Promise<number> {
    const maxAttempts = 10
    for (let i = 0; i < maxAttempts; i++) {
      const port = preferredPort + i
      if (await this.checkPortAvailable(port)) {
        return port
      }
    }
    throw new Error(`Ports ${preferredPort}-${preferredPort + maxAttempts - 1} are all in use`)
  }

  /**
   * Wait for Mailpit HTTP API to become available
   */
  private waitForReady(port: number, timeoutMs: number = 10000): Promise<void> {
    return new Promise((resolve, reject) => {
      const startTime = Date.now()
      const interval = 300

      const check = () => {
        // If process died while waiting, fail immediately
        if (!this.process || this.process.killed) {
          reject(new Error('Mailpit process exited before becoming ready'))
          return
        }

        const req = http.get(`http://127.0.0.1:${port}/api/v1/messages?limit=1`, (res) => {
          if (res.statusCode === 200) {
            res.resume()
            resolve()
          } else {
            res.resume()
            retry()
          }
        })

        req.on('error', () => {
          retry()
        })

        req.setTimeout(2000, () => {
          req.destroy()
          retry()
        })
      }

      const retry = () => {
        if (Date.now() - startTime >= timeoutMs) {
          reject(new Error(`Mailpit did not become ready within ${timeoutMs / 1000}s`))
          return
        }
        setTimeout(check, interval)
      }

      check()
    })
  }

  /**
   * Broadcast status change to all renderer windows
   */
  private broadcastStatusChange(): void {
    const status = this.getStatus()
    BrowserWindow.getAllWindows().forEach((window) => {
      try {
        if (!window.isDestroyed()) {
          window.webContents.send(IPC_CHANNELS.MAILPIT_STATUS_CHANGED, status)
        }
      } catch {
        // Window may be closing, ignore
      }
    })
  }

  /**
   * Kill any orphaned Mailpit processes
   */
  private async killOrphanedProcesses(): Promise<void> {
    try {
      const { exec } = await import('child_process')
      const { promisify } = await import('util')
      const execAsync = promisify(exec)

      // Find and kill any existing Mailpit processes
      const platform = process.platform

      if (platform === 'win32') {
        // Windows: use tasklist to find exact process name, then taskkill
        try {
          await execAsync('taskkill /F /IM mailpit-win.exe')
        } catch {
          // No processes found, that's fine
        }
      } else {
        // macOS/Linux: use pkill with exact binary name match
        try {
          await execAsync('pkill -9 -f mailpit-darwin || pkill -9 -f mailpit-linux || true')
        } catch {
          // No processes found, that's fine
        }
      }

      // Wait a moment for ports to be released
      await new Promise(resolve => setTimeout(resolve, 500))

      logger.debug('Cleaned up any orphaned Mailpit processes')
    } catch (error) {
      logger.warn('Failed to clean up orphaned processes:', error)
    }
  }

  /**
   * Start the Mailpit process
   */
  async start(): Promise<void> {
    if (this.isStarting || this.isRestarting) {
      logger.warn('Mailpit is already starting, please wait')
      return
    }

    if (this.currentState === 'running') {
      logger.warn('Mailpit is already running')
      return
    }

    this.isStarting = true
    this.retryAttempt = 0
    this.resolvedSmtpPort = undefined
    this.resolvedPort = undefined

    // Only broadcast 'starting' if not already in 'restarting' or 'reconnecting'
    if (this.currentState !== 'restarting' && this.currentState !== 'reconnecting') {
      this.setState('starting')
    }

    try {
      await this.startWithRetry()
    } catch (error) {
      this.isStarting = false
      // Only set error state if not inside restart() — restart() handles its own error state
      if (!this.isRestarting) {
        const message = error instanceof Error ? error.message : 'Unknown error'
        this.setState('error', message)
      }
      throw error
    }

    this.isStarting = false
  }

  private async startWithRetry(): Promise<void> {
    const maxRetries = 2

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      this.retryAttempt = attempt
      try {
        await this.startOnce()
        return // success
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error'
        logger.warn(`Mailpit start attempt ${attempt + 1} failed: ${message}`)
        this.addLog(`[RETRY] Attempt ${attempt + 1} failed: ${message}`)

        if (attempt < maxRetries - 1) {
          // Silent retry — wait briefly then try again
          await new Promise(resolve => setTimeout(resolve, 1000))
        }
      }
    }

    throw new Error('Mailpit failed to start after 2 attempts')
  }

  private async startOnce(): Promise<void> {
    // Clean up any existing process
    if (this.process) {
      this.process = null
    }

    await this.killOrphanedProcesses()

    const binaryPath = this.getMailpitBinaryPath()
    this.ensureBinaryPermissions(binaryPath)

    const settings = settingsService.getAll()
    const preferredSmtpPort = settings.mailpit.smtpPort
    const preferredWebUIPort = settings.mailpit.webUIPort
    const maxMessages = settings.mailpit.maxMessages

    // Resolve available ports
    const smtpPort = await this.findAvailablePort(preferredSmtpPort)
    const webUIPort = await this.findAvailablePort(preferredWebUIPort)

    if (smtpPort !== preferredSmtpPort) {
      this.resolvedSmtpPort = smtpPort
      logger.info(`SMTP port ${preferredSmtpPort} in use, using ${smtpPort}`)
      this.addLog(`[INFO] SMTP port ${preferredSmtpPort} in use, using ${smtpPort}`)
    }
    if (webUIPort !== preferredWebUIPort) {
      this.resolvedPort = webUIPort
      logger.info(`HTTP port ${preferredWebUIPort} in use, using ${webUIPort}`)
      this.addLog(`[INFO] HTTP port ${preferredWebUIPort} in use, using ${webUIPort}`)
    }

    logger.info(`Starting Mailpit: ${binaryPath}`)
    logger.debug('Mailpit config:', { smtpPort, webUIPort, maxMessages })

    let earlyExit = false
    let earlyExitError = ''

    this.process = spawn(binaryPath, [
      '--smtp', `0.0.0.0:${smtpPort}`,
      '--listen', `0.0.0.0:${webUIPort}`,
      '--max', String(maxMessages),
      '--api-cors', '*',
      '--verbose',
    ])

    this.process.stdout?.on('data', (data: Buffer) => {
      const message = data.toString().trim()
      this.addLog(`[STDOUT] ${message}`)
      logger.debug(`Mailpit stdout: ${message}`)
    })

    this.process.stderr?.on('data', (data: Buffer) => {
      const message = data.toString().trim()
      this.addLog(`[STDERR] ${message}`)
      earlyExitError += message + '\n'
      logger.warn(`Mailpit stderr: ${message}`)
    })

    this.process.on('exit', (code, signal) => {
      logger.info(`Mailpit process exited with code ${code}, signal ${signal}`)
      this.addLog(`[EXIT] Process exited with code ${code}`)
      const wasRunning = this.currentState === 'running'
      this.process = null

      // If process was running and exited unexpectedly, trigger crash recovery
      if (wasRunning) {
        this.handleUnexpectedExit()
      }
    })

    this.process.on('error', (error) => {
      logger.error('Mailpit process error:', error)
      this.addLog(`[ERROR] ${error.message}`)
      earlyExit = true
      earlyExitError = error.message
      this.process = null
    })

    // Wait for Mailpit to be ready
    try {
      await this.waitForReady(webUIPort)
    } catch (waitError) {
      if (this.process && !this.process.killed) {
        this.process.kill('SIGKILL')
        this.process = null
      }
      const detail = earlyExitError.trim() || (waitError as Error).message
      throw new Error(`Mailpit failed to start: ${detail}`)
    }

    if (earlyExit || !this.process) {
      const detail = earlyExitError.trim() || 'process exited immediately'
      throw new Error(`Mailpit failed to start: ${detail}`)
    }

    // Update the API service with the actual running port
    mailpitAPIService.updateBaseURL(webUIPort)

    this.setState('running')
    logger.info(`Mailpit started successfully on SMTP:${smtpPort}, UI:${webUIPort}`)
    this.addLog(`[START] Mailpit started on SMTP:${smtpPort}, UI:${webUIPort}`)
  }

  private async handleUnexpectedExit(): Promise<void> {
    logger.warn('Mailpit exited unexpectedly, attempting recovery')
    this.addLog('[CRASH] Mailpit exited unexpectedly, attempting recovery')
    this.setState('reconnecting')

    this.isStarting = true
    this.retryAttempt = 0

    try {
      await this.startWithRetry()
      this.isStarting = false
      // Toast is triggered by renderer watching reconnecting → running transition
    } catch (error) {
      this.isStarting = false
      const message = error instanceof Error ? error.message : 'Recovery failed'
      this.setState('error', message)
      logger.error('Mailpit crash recovery failed:', error)
    }
  }

  /**
   * Stop the Mailpit process
   */
  async stop(): Promise<void> {
    if (!this.process) {
      logger.warn('Mailpit is not running')
      return
    }

    // Don't broadcast stopping if we're inside a restart
    if (!this.isRestarting) {
      this.setState('stopping')
    }

    try {
      logger.info('Stopping Mailpit process')
      this.process.kill('SIGTERM')

      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          if (this.process) {
            logger.warn('Force killing Mailpit process')
            this.process.kill('SIGKILL')
          }
          // Give SIGKILL a moment
          setTimeout(() => {
            if (this.process && !this.process.killed) {
              reject(new Error('Failed to stop Mailpit process'))
            } else {
              resolve()
            }
          }, 1000)
        }, 5000)

        this.process?.once('exit', () => {
          clearTimeout(timeout)
          resolve()
        })
      })

      this.process = null
      this.addLog('[STOP] Mailpit stopped')
      logger.info('Mailpit stopped successfully')

      if (!this.isRestarting) {
        this.resolvedSmtpPort = undefined
        this.resolvedPort = undefined
        this.setState('stopped')
      }
    } catch (error) {
      this.process = null
      if (!this.isRestarting) {
        const message = error instanceof Error ? error.message : 'Stop failed'
        this.setState('error', message)
      }
      logger.error('Failed to stop Mailpit', error)
      throw error
    }
  }

  /**
   * Restart the Mailpit process
   */
  async restart(): Promise<void> {
    if (this.isRestarting) {
      logger.warn('Mailpit is already restarting')
      return
    }

    this.isRestarting = true
    this.setState('restarting')
    logger.info('Restarting Mailpit')

    try {
      await this.stop()
      await new Promise((resolve) => setTimeout(resolve, 1000))
      await this.start()
      // start() sets state to 'running' on success
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Restart failed'
      this.setState('error', message)
      logger.error('Failed to restart Mailpit', error)
      throw error
    } finally {
      this.isRestarting = false
    }
  }

  /**
   * Get the current status of Mailpit
   */
  getStatus(): MailpitStatus {
    const settings = settingsService.getAll()

    return {
      state: this.currentState,
      port: settings.mailpit.webUIPort,
      smtpPort: settings.mailpit.smtpPort,
      pid: this.process?.pid,
      error: this.stateError,
      retryAttempt: this.retryAttempt,
      resolvedSmtpPort: this.resolvedSmtpPort,
      resolvedPort: this.resolvedPort,
    }
  }

  /**
   * Get recent logs
   */
  getLogs(): string[] {
    return [...this.logs]
  }

  /**
   * Clear logs
   */
  clearLogs(): void {
    this.logs = []
    logger.debug('Mailpit logs cleared')
  }

  /**
   * Add a log entry
   */
  private addLog(message: string): void {
    const timestamp = new Date().toISOString()
    this.logs.push(`[${timestamp}] ${message}`)

    // Keep only the most recent logs
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs)
    }
  }

  /**
   * Cleanup on app quit
   */
  async cleanup(): Promise<void> {
    if (this.process) {
      // Set state to stopping so the exit handler doesn't trigger crash recovery
      this.currentState = 'stopping'
      logger.info('Cleaning up Mailpit process')
      await this.stop()
    }
  }
}

// Singleton instance
export const mailpitProcessService = new MailpitProcessService()
