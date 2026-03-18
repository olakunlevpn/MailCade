# Mailpit Process Management Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the simple running/stopped Mailpit status with a full state machine that auto-retries, detects port conflicts, recovers from crashes, and gives users clear feedback.

**Architecture:** The state machine lives in `mailpit-process.service.ts` (main process). Status is broadcast to the renderer via existing `MAILPIT_STATUS_CHANGED` IPC channel. The renderer watches state transitions to show toasts reactively. No new IPC channels, no new files, no new dependencies.

**Tech Stack:** Electron (main process), Vue 3 + Pinia (renderer), TypeScript, Node.js `net` module (port checking)

**Spec:** `docs/superpowers/specs/2026-03-18-mailpit-process-management-design.md`

**Descoped:** The spec mentions error toast action buttons (Retry / Settings / View Logs). The current `useToast` composable only supports `type`, `title`, `message`, `duration` — no action buttons. Error toasts will show the error message only. Action buttons can be added in a follow-up if needed.

---

## File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `src/types/electron.d.ts` | Modify | Canonical `MailpitStatus` type definition |
| `electron/services/mailpit-process.service.ts` | Modify | State machine, retry, port detection, crash recovery |
| `electron/services/mailpit-api.service.ts` | Modify | Accept resolved port for base URL |
| `electron/ipc/handlers.ts` | Modify | Fix `status.running` → `status.state` |
| `src/stores/server.store.ts` | Modify | New status interface, computed getters, toast watcher |
| `src/api/ipc.ts` | Modify | Type import update |
| `src/components/layout/AppSidebar.vue` | Modify | State-aware status display |
| `src/views/SettingsView.vue` | Modify | Button states per state machine, remove stale toast |
| `src/composables/useMailpitWebSocket.ts` | Modify | Use `state` and `actualPort` |
| `src/components/email/EmailList.vue` | Modify | Use `actualSmtpPort` |

---

## Task 1: Update MailpitStatus Type Definition

**Files:**
- Modify: `src/types/electron.d.ts:6-11`

This is the foundation — every other task depends on this type.

- [ ] **Step 1: Update the MailpitStatus interface in electron.d.ts**

Replace lines 6-11 with:

```typescript
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
```

- [ ] **Step 2: Verify TypeScript catches all the breakage**

Run: `npx vue-tsc --noEmit 2>&1 | head -40`

Expected: Multiple type errors in files that reference `status.running`. This confirms the type change propagates correctly. Do NOT fix these yet — later tasks handle each file.

- [ ] **Step 3: Commit**

```bash
git add src/types/electron.d.ts
git commit -m "feat: update MailpitStatus type to state machine interface"
```

---

## Task 2: Rewrite Process Service — State Machine Core

**Files:**
- Modify: `electron/services/mailpit-process.service.ts`

This is the largest task. Replace the `MailpitStatus` interface, add state tracking, port checking, and update `getStatus()` and `broadcastStatusChange()`.

- [ ] **Step 1: Replace the MailpitStatus interface and add state + port fields**

Replace the existing interface (lines 15-20) and class fields (lines 22-25) with:

```typescript
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
```

- [ ] **Step 2: Add the port availability check method**

Add after `ensureBinaryPermissions()`, before `waitForReady()`. Add `import net from 'net'` to the top imports:

```typescript
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
```

- [ ] **Step 3: Update `getStatus()` to use the state machine**

Replace the existing `getStatus()` method:

```typescript
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
```

- [ ] **Step 4: Add state transition helper**

Add after constructor:

```typescript
private setState(state: MailpitState, error?: string): void {
  this.currentState = state
  this.stateError = state === 'error' ? error : undefined
  this.broadcastStatusChange()
}
```

- [ ] **Step 5: Commit**

```bash
git add electron/services/mailpit-process.service.ts
git commit -m "feat: add state machine core, port detection, and state helpers to process service"
```

---

## Task 3: Rewrite Process Service — Start with Retry and Port Resolution

**Files:**
- Modify: `electron/services/mailpit-process.service.ts`

Replace the `start()` method with retry-with-escalation and port auto-resolution.

- [ ] **Step 1: Rewrite the `start()` method**

Replace the existing `start()` method entirely:

```typescript
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
  const { mailpitAPIService } = await import('./mailpit-api.service')
  mailpitAPIService.updateBaseURL(webUIPort)

  this.setState('running')
  logger.info(`Mailpit started successfully on SMTP:${smtpPort}, UI:${webUIPort}`)
  this.addLog(`[START] Mailpit started on SMTP:${smtpPort}, UI:${webUIPort}`)
}
```

- [ ] **Step 2: Add the crash recovery handler**

Add after `startOnce()`:

```typescript
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
```

- [ ] **Step 3: Commit**

```bash
git add electron/services/mailpit-process.service.ts
git commit -m "feat: add retry-with-escalation, port resolution, and crash recovery to start flow"
```

---

## Task 4: Rewrite Process Service — Stop and Restart

**Files:**
- Modify: `electron/services/mailpit-process.service.ts`

- [ ] **Step 1: Update `stop()` to use state machine**

Replace the existing `stop()` method:

```typescript
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
```

- [ ] **Step 2: Update `restart()` to use atomic `restarting` state**

Replace the existing `restart()` method:

```typescript
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
```

- [ ] **Step 3: Update `cleanup()` to suppress crash recovery during quit**

Replace the existing `cleanup()`:

```typescript
async cleanup(): Promise<void> {
  if (this.process) {
    // Set state to stopping so the exit handler doesn't trigger crash recovery
    this.currentState = 'stopping'
    logger.info('Cleaning up Mailpit process')
    await this.stop()
  }
}
```

- [ ] **Step 4: Verify TypeScript compiles for main process**

Run: `npx vue-tsc --noEmit 2>&1 | grep "mailpit-process" | head -5`

Expected: No errors from this file (renderer files will still have errors).

- [ ] **Step 5: Commit**

```bash
git add electron/services/mailpit-process.service.ts
git commit -m "feat: update stop/restart/cleanup to use state machine with atomic restart"
```

---

## Task 5: Update Mailpit API Service

**Files:**
- Modify: `electron/services/mailpit-api.service.ts:61-66`

- [ ] **Step 1: Update `updateBaseURL()` to accept an explicit port**

Replace the existing `updateBaseURL()` method:

```typescript
updateBaseURL(port?: number): void {
  const settings = settingsService.getAll()
  const actualPort = port ?? settings.mailpit.webUIPort
  const baseURL = `http://localhost:${actualPort}`
  this.client.defaults.baseURL = baseURL
  logger.debug(`Mailpit API base URL updated: ${baseURL}`)
}
```

- [ ] **Step 2: Commit**

```bash
git add electron/services/mailpit-api.service.ts
git commit -m "feat: allow explicit port override in API service updateBaseURL"
```

---

## Task 6: Update IPC Handlers

**Files:**
- Modify: `electron/ipc/handlers.ts:132-137`

- [ ] **Step 1: Fix the settings change handler to use `status.state`**

Replace lines 132-137:

```typescript
      // If Mailpit ports changed, restart the process
      if (key.includes('mailpit.')) {
        const status = mailpitProcessService.getStatus()
        if (status.state === 'running') {
          logger.info('Mailpit settings changed, restarting process')
          await mailpitProcessService.restart()
        }
      }
```

- [ ] **Step 2: Commit**

```bash
git add electron/ipc/handlers.ts
git commit -m "fix: use status.state instead of status.running in settings handler"
```

---

## Task 7: Update Server Store

**Files:**
- Modify: `src/stores/server.store.ts`

- [ ] **Step 1: Rewrite the store with new interface, computed getters, and toast watcher**

Replace the entire file:

```typescript
import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import { ipcAPI } from '@/api/ipc'
import { useToast } from '@/composables/useToast'
import type { MailpitStatus, MailpitState } from '@/types/electron.d.ts'

export type { MailpitStatus, MailpitState }

export const useServerStore = defineStore('server', () => {
  const toast = useToast()
  const status = ref<MailpitStatus>({
    state: 'stopped',
    port: 8025,
    smtpPort: 1025,
  })
  const logs = ref<string[]>([])
  const error = ref<string | null>(null)
  const previousState = ref<MailpitState>('stopped')

  // Computed getters
  const isRunning = computed(() => status.value.state === 'running')
  const actualPort = computed(() => status.value.resolvedPort ?? status.value.port)
  const actualSmtpPort = computed(() => status.value.resolvedSmtpPort ?? status.value.smtpPort)
  const isTransitioning = computed(() =>
    ['starting', 'stopping', 'restarting', 'reconnecting'].includes(status.value.state)
  )

  // Watch for state transitions to show toasts
  watch(
    () => status.value.state,
    (newState, oldState) => {
      previousState.value = oldState

      // Crash recovery succeeded
      if (oldState === 'reconnecting' && newState === 'running') {
        toast.warning('Mail server restarted after unexpected shutdown')
      }

      // Error after starting or reconnecting
      if (newState === 'error' && status.value.error) {
        toast.error(status.value.error, 'Server Error')
      }

      // Port auto-resolved
      if (newState === 'running') {
        if (status.value.resolvedSmtpPort) {
          toast.info(`SMTP port ${status.value.smtpPort} was in use, using ${status.value.resolvedSmtpPort} instead`)
        }
        if (status.value.resolvedPort) {
          toast.info(`HTTP port ${status.value.port} was in use, using ${status.value.resolvedPort} instead`)
        }
      }
    }
  )

  // Listen for status changes from main process
  let unsubscribe: (() => void) | null = null

  const setupStatusListener = () => {
    if (unsubscribe) {
      unsubscribe()
    }

    unsubscribe = ipcAPI.mailpit.onStatusChange((newStatus) => {
      status.value = newStatus
    })
  }

  const startMailpit = async () => {
    error.value = null
    try {
      await ipcAPI.mailpit.start()
      await refreshStatus()
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to start Mailpit'
      console.error('Failed to start Mailpit:', err)
      throw err
    }
  }

  const stopMailpit = async () => {
    error.value = null
    try {
      await ipcAPI.mailpit.stop()
      await refreshStatus()
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to stop Mailpit'
      console.error('Failed to stop Mailpit:', err)
      throw err
    }
  }

  const restartMailpit = async () => {
    error.value = null
    try {
      await ipcAPI.mailpit.restart()
      await refreshStatus()
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to restart Mailpit'
      console.error('Failed to restart Mailpit:', err)
      throw err
    }
  }

  const refreshStatus = async () => {
    try {
      const newStatus = await ipcAPI.mailpit.getStatus()
      status.value = newStatus
    } catch (err) {
      console.error('Failed to get Mailpit status:', err)
    }
  }

  const fetchLogs = async () => {
    error.value = null
    try {
      logs.value = await ipcAPI.mailpit.getLogs()
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch logs'
      console.error('Failed to fetch logs:', err)
      throw err
    }
  }

  const cleanup = () => {
    if (unsubscribe) {
      unsubscribe()
      unsubscribe = null
    }
  }

  setupStatusListener()

  return {
    status,
    logs,
    error,
    isRunning,
    actualPort,
    actualSmtpPort,
    isTransitioning,
    startMailpit,
    stopMailpit,
    restartMailpit,
    refreshStatus,
    fetchLogs,
    setupStatusListener,
    cleanup,
  }
})
```

- [ ] **Step 2: Update the ipc.ts type import**

In `src/api/ipc.ts`, line 6, change:

```typescript
import type { MailpitStatus } from '@/stores/server.store'
```

No change needed — it already imports from the store. The store re-exports the same interface.

- [ ] **Step 3: Commit**

```bash
git add src/stores/server.store.ts src/api/ipc.ts
git commit -m "feat: add state machine getters and reactive toast watcher to server store"
```

---

## Task 8: Update AppSidebar

**Files:**
- Modify: `src/components/layout/AppSidebar.vue:30-57`

- [ ] **Step 1: Replace the status display section in the template**

Replace lines 30-57 (the `<div class="p-4 border-t ...">` section):

```vue
    <div class="p-4 border-t border-secondary-200 dark:border-secondary-700">
      <div class="text-xs">
        <div class="flex items-center justify-between mb-2">
          <div class="flex items-center gap-2">
            <span class="text-secondary-600 dark:text-secondary-400">Email Server</span>
            <button
              @click="navigateToMailSettings"
              class="text-secondary-500 hover:text-primary transition-colors p-0.5"
              title="Mail Server Settings"
            >
              <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
          </div>
          <span :class="statusColor" class="font-semibold flex items-center gap-1" :title="serverStore.status.state === 'error' ? serverStore.status.error : undefined">
            <!-- Spinner for transitional states -->
            <svg
              v-if="isTransitioning"
              class="w-3 h-3 animate-spin"
              fill="none" viewBox="0 0 24 24"
            >
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <!-- Solid dot for stable states -->
            <span v-else>●</span>
            {{ statusText }}
          </span>
        </div>
        <div class="text-secondary-500">
          <span>SMTP: {{ serverStore.actualSmtpPort }}</span>
          <span
            v-if="serverStore.status.resolvedSmtpPort"
            class="text-yellow-500 ml-1"
          >(configured: {{ serverStore.status.smtpPort }})</span>
        </div>
      </div>
    </div>
```

- [ ] **Step 2: Add computed properties in the script section**

Add after `const serverStore = useServerStore()`:

```typescript
const isTransitioning = computed(() =>
  ['starting', 'stopping', 'restarting', 'reconnecting'].includes(serverStore.status.state)
)

const statusColor = computed(() => {
  const state = serverStore.status.state
  if (state === 'running') return 'text-green-500'
  if (state === 'error' || state === 'stopped') return 'text-red-500'
  return 'text-yellow-500'
})

const statusText = computed(() => {
  const state = serverStore.status.state
  switch (state) {
    case 'stopped': return 'Stopped'
    case 'starting': return 'Starting...'
    case 'running': return 'Running'
    case 'stopping': return 'Stopping...'
    case 'restarting': return 'Restarting...'
    case 'reconnecting': return 'Reconnecting...'
    case 'error': return `Error`
    default: return 'Unknown'
  }
})
```

Add `computed` to the Vue import: `import { onMounted, computed } from 'vue'`

- [ ] **Step 3: Commit**

```bash
git add src/components/layout/AppSidebar.vue
git commit -m "feat: add state-aware status display with spinner and port resolution to sidebar"
```

---

## Task 9: Update SettingsView

**Files:**
- Modify: `src/views/SettingsView.vue`

- [ ] **Step 1: Replace the server control buttons section**

Replace lines 169-190 (the button `<div class="flex gap-2">` section):

```vue
              <div class="flex gap-2">
                <button
                  v-if="serverStore.status.state === 'stopped' || serverStore.status.state === 'error'"
                  @click="serverStore.startMailpit()"
                  :disabled="serverStore.isTransitioning"
                  class="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {{ serverStore.status.state === 'error' ? 'Retry' : 'Start Server' }}
                </button>
                <button
                  v-if="serverStore.status.state === 'running'"
                  @click="serverStore.stopMailpit()"
                  :disabled="serverStore.isTransitioning"
                  class="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Stop Server
                </button>
                <button
                  v-if="serverStore.status.state === 'running'"
                  @click="serverStore.restartMailpit()"
                  :disabled="serverStore.isTransitioning"
                  class="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Restart Server
                </button>
              </div>
```

- [ ] **Step 2: Update the status badge display**

Find the server status badge (around line 154-167) that shows `serverStore.status.running`. Replace the conditional class and text to use `serverStore.status.state`:

Change any `serverStore.status.running` references to `serverStore.isRunning`.

- [ ] **Step 3: Remove the misleading port change toast**

In `saveSettings()` (around lines 591-596), remove:

```typescript
    // Check if Mailpit needs restart
    if (
      settings.value.mailpit.smtpPort !== serverStore.status.smtpPort ||
      settings.value.mailpit.webUIPort !== serverStore.status.port
    ) {
      toast.info('Restart Mailpit for port changes to take effect')
    }
```

- [ ] **Step 4: Update About section to use actualSmtpPort**

Find the About section (around line 327) and change:
```
localhost:{{ serverStore.status.smtpPort }}
```
to:
```
localhost:{{ serverStore.actualSmtpPort }}
```

- [ ] **Step 5: Commit**

```bash
git add src/views/SettingsView.vue
git commit -m "feat: update settings buttons for state machine, remove stale port toast"
```

---

## Task 10: Update WebSocket Composable

**Files:**
- Modify: `src/composables/useMailpitWebSocket.ts`

- [ ] **Step 1: Update the WebSocket URL to use actualPort**

Replace the `connect()` function's port line (line 45-46):

```typescript
const port = serverStore.actualPort
```

- [ ] **Step 2: Update the `onclose` handler to use `status.state`**

In the `ws.onclose` handler (around line 78), replace:
```typescript
serverStore.status.running
```
with:
```typescript
serverStore.status.state === 'running'
```

- [ ] **Step 3: Update the status watcher to use `state`**

Replace the watcher (lines 236-247):

```typescript
watch(
  () => serverStore.status.state,
  (state) => {
    if (state === 'running') {
      // Give Mailpit a moment after state change
      setTimeout(connect, 1000)
    } else {
      disconnect()
    }
  },
  { immediate: true }
)
```

- [ ] **Step 4: Commit**

```bash
git add src/composables/useMailpitWebSocket.ts
git commit -m "feat: use actualPort and state watcher in WebSocket composable"
```

---

## Task 11: Update EmailList

**Files:**
- Modify: `src/components/email/EmailList.vue:20`

- [ ] **Step 1: Update the empty state hint**

Change line 20 from:
```vue
<p class="text-sm mt-2">Send a test email to localhost:{{ serverStore.status.smtpPort }}</p>
```
to:
```vue
<p class="text-sm mt-2">Send a test email to localhost:{{ serverStore.actualSmtpPort }}</p>
```

- [ ] **Step 2: Commit**

```bash
git add src/components/email/EmailList.vue
git commit -m "fix: use actualSmtpPort in email list empty state hint"
```

---

## Task 12: Verify Full Build and Test

- [ ] **Step 1: TypeScript check**

Run: `npx vue-tsc --noEmit`

Expected: Clean — no errors.

- [ ] **Step 2: Lint**

Run: `npm run lint`

Expected: Clean or only pre-existing warnings.

- [ ] **Step 3: Dev test**

Run: `npm run dev`

Verify:
1. App opens, sidebar shows "Starting..." with spinner
2. After a few seconds, sidebar shows "Running" with green dot
3. SMTP port displays correctly
4. Emails can be fetched (no API errors in console)

- [ ] **Step 4: Kill Mailpit to test crash recovery**

While dev is running, in another terminal:
```bash
pkill -9 -f mailpit-darwin
```

Verify:
1. Sidebar changes to "Reconnecting..." with spinner
2. After a few seconds, sidebar returns to "Running"
3. Toast appears: "Mail server restarted after unexpected shutdown"

- [ ] **Step 5: Packaged build test**

Run:
```bash
npx vue-tsc --noEmit && npx vite build && npx electron-builder --mac --dir
```

Then launch the packaged app and verify Mailpit starts.

- [ ] **Step 6: Final commit (only if there are uncommitted changes from lint fixes)**

```bash
git status
# If there are changes from lint auto-fixes:
git add src/ electron/
git commit -m "chore: lint fixes from state machine changes"
```
