/**
 * Mailpit Process Service
 * Manages the Mailpit binary as a child process
 */

import { spawn, ChildProcess } from 'child_process'
import { app } from 'electron'
import path from 'path'
import { logger } from '../utils/logger'
import { settingsService } from './settings.service'

export interface MailpitStatus {
  running: boolean
  port: number
  smtpPort: number
  pid?: number
}

class MailpitProcessService {
  private process: ChildProcess | null = null
  private logs: string[] = []
  private readonly maxLogs = 500
  private isStarting = false

  constructor() {
    logger.info('Mailpit process service initialized')
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
    const fs = require('fs')
    if (!fs.existsSync(binaryPath)) {
      const error = `Mailpit binary not found at: ${binaryPath}`
      logger.error(error)
      this.addLog(`[ERROR] ${error}`)
      throw new Error(error)
    }
    
    return binaryPath
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
        // Windows
        try {
          await execAsync('taskkill /F /IM mailpit*.exe')
        } catch {
          // No processes found, that's fine
        }
      } else {
        // macOS/Linux
        try {
          await execAsync('pkill -9 mailpit')
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
    // Prevent multiple simultaneous starts
    if (this.isStarting) {
      logger.warn('Mailpit is already starting, please wait')
      return
    }

    if (this.process && !this.process.killed) {
      logger.warn('Mailpit is already running')
      return
    }

    this.isStarting = true

    try {
      // Clean up any existing process
      if (this.process) {
        this.process = null
      }

      // Kill any orphaned processes from previous crashes
      await this.killOrphanedProcesses()

      const binaryPath = this.getMailpitBinaryPath()
      const settings = settingsService.getAll()
      const smtpPort = settings.mailpit.smtpPort
      const webUIPort = settings.mailpit.webUIPort
      const maxMessages = settings.mailpit.maxMessages

      logger.info(`Starting Mailpit: ${binaryPath}`)
      logger.debug('Mailpit config:', { smtpPort, webUIPort, maxMessages })

      // Start Mailpit with arguments
      this.process = spawn(binaryPath, [
        '--smtp', `0.0.0.0:${smtpPort}`,
        '--listen', `0.0.0.0:${webUIPort}`,
        '--max', String(maxMessages),
        '--verbose',
      ])

      // Handle stdout
      this.process.stdout?.on('data', (data: Buffer) => {
        const message = data.toString().trim()
        this.addLog(`[STDOUT] ${message}`)
        logger.debug(`Mailpit stdout: ${message}`)
      })

      // Handle stderr
      this.process.stderr?.on('data', (data: Buffer) => {
        const message = data.toString().trim()
        this.addLog(`[STDERR] ${message}`)
        logger.warn(`Mailpit stderr: ${message}`)
      })

      // Handle process exit
      this.process.on('exit', (code, signal) => {
        logger.info(`Mailpit process exited with code ${code}, signal ${signal}`)
        this.addLog(`[EXIT] Process exited with code ${code}`)
        this.process = null
      })

      // Handle errors
      this.process.on('error', (error) => {
        logger.error('Mailpit process error:', error)
        this.addLog(`[ERROR] ${error.message}`)
        this.process = null
      })

      logger.info(`Mailpit started successfully on SMTP:${smtpPort}, UI:${webUIPort}`)
      this.addLog(`[START] Mailpit started on SMTP:${smtpPort}, UI:${webUIPort}`)
      
      this.isStarting = false
    } catch (error) {
      this.isStarting = false
      logger.error('Failed to start Mailpit', error)
      throw error
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

    try {
      logger.info('Stopping Mailpit process')
      this.process.kill('SIGTERM')
      
      // Wait for graceful shutdown
      await new Promise<void>((resolve) => {
        const timeout = setTimeout(() => {
          if (this.process) {
            logger.warn('Force killing Mailpit process')
            this.process.kill('SIGKILL')
          }
          resolve()
        }, 5000)

        this.process?.once('exit', () => {
          clearTimeout(timeout)
          resolve()
        })
      })

      this.process = null
      this.addLog('[STOP] Mailpit stopped')
      logger.info('Mailpit stopped successfully')
    } catch (error) {
      logger.error('Failed to stop Mailpit', error)
      throw error
    }
  }

  /**
   * Restart the Mailpit process
   */
  async restart(): Promise<void> {
    logger.info('Restarting Mailpit')
    await this.stop()
    await new Promise((resolve) => setTimeout(resolve, 1000))
    await this.start()
  }

  /**
   * Get the current status of Mailpit
   */
  getStatus(): MailpitStatus {
    const settings = settingsService.getAll()
    
    return {
      running: this.process !== null && !this.process.killed,
      port: settings.mailpit.webUIPort,
      smtpPort: settings.mailpit.smtpPort,
      pid: this.process?.pid,
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
      logger.info('Cleaning up Mailpit process')
      await this.stop()
    }
  }
}

// Singleton instance
export const mailpitProcessService = new MailpitProcessService()
