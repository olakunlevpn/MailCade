# Mailpit Process Management — Production-Grade Reliability

## Overview

Replace the simple running/stopped binary status with a full process lifecycle state machine. Adds auto-retry with escalation, port conflict detection with auto-resolve, auto-restart on crash with notification, and enhanced sidebar status display.

## Goals

- Mailpit starts reliably on both macOS and Windows without user intervention
- When something goes wrong, the user knows what happened and what they can do
- Crashes during a session are recovered automatically
- Port conflicts are resolved without manual troubleshooting

## Non-Goals

- Periodic health checks while running (only at startup)
- Persisting auto-resolved ports to settings
- New IPC channels or new files

---

## 1. Process Lifecycle State Machine

### States

| State | Meaning |
|-------|---------|
| `stopped` | Server is not running |
| `starting` | Spawn + health check in progress |
| `running` | Health check passed, process alive |
| `stopping` | SIGTERM sent, waiting for exit |
| `restarting` | Stop then start cycle in progress (atomic — no intermediate `stopping`/`starting` broadcasts) |
| `reconnecting` | Auto-restart in progress after unexpected crash |
| `error` | Failed to start or crashed, includes error detail |

### Transitions

```
stopped      → starting       (user clicks Start, or auto-start on launch)
starting     → running        (health check passes)
starting     → error          (health check fails after retries)
running      → stopping       (user clicks Stop)
running      → restarting     (user clicks Restart, or settings change triggers restart)
running      → reconnecting   (process exits unexpectedly)
stopping     → stopped        (process exits)
stopping     → error          (stop timed out — SIGKILL also failed)
error        → starting       (user clicks Retry)
reconnecting → running        (auto-restart succeeds)
reconnecting → error          (auto-restart fails after retries)
restarting   → running        (restart completes)
restarting   → error          (restart fails)
```

`restarting` is an atomic state. Internally it stops then starts, but only `restarting` is broadcast to the renderer — no intermediate `stopping`/`starting` flicker. The `restart()` method sets state to `restarting` first, then internally runs stop + start without broadcasting intermediate states. If `restart()` is called while already in `restarting`, the call is ignored (same guard pattern as `isStarting`).

The `error` field is cleared whenever the state leaves `error` (i.e., on entering `starting`).

### Status Interface

```typescript
interface MailpitStatus {
  state: 'stopped' | 'starting' | 'running' | 'stopping' | 'restarting' | 'reconnecting' | 'error'
  port: number              // configured HTTP port from settings
  smtpPort: number          // configured SMTP port from settings
  pid?: number
  error?: string            // error detail when state === 'error'
  retryAttempt?: number     // which retry we're on (0 = first try)
  resolvedSmtpPort?: number // actual SMTP port if auto-resolved (only set when differs from smtpPort)
  resolvedPort?: number     // actual HTTP port if auto-resolved (only set when differs from port)
}
```

Consumers that need the **actual running port** must use `resolvedPort ?? port` and `resolvedSmtpPort ?? smtpPort`.

### Migration

All code checking `status.running` changes to `status.state === 'running'`. The server store provides computed getters `isRunning` and `actualPort` / `actualSmtpPort` for convenience.

---

## 2. Retry with Escalation

### Startup Retry (2 attempts max)

**Phase 1 — Silent retry:**
- First start attempt fails
- Immediately retry once in background
- Status remains `starting` throughout — user sees "Starting..." in sidebar
- If silent retry succeeds, user never knows there was a problem
- If the failure was a port conflict and retry also gets a port conflict, the retry should attempt the next port (not blindly retry the same port)

**Phase 2 — Escalate to user:**
- Second attempt fails
- State transitions to `error` with the actual error detail
- Sidebar shows error state
- Toast appears with error message and guidance
- User gets three options:
  - Retry — resets to Phase 1
  - Settings — navigate to Mailpit settings tab
  - View Logs — show recent Mailpit process logs (existing `getLogs()` method)

No infinite retry loops. User must explicitly click Retry after escalation.

### Mid-Session Crash Recovery

When process exits unexpectedly while `state === 'running'`:
1. State transitions to `reconnecting`
2. Sidebar shows "Reconnecting..."
3. Same 2-attempt retry logic:
   - Silent first retry
   - If succeeds: toast "Mail server restarted after unexpected shutdown"
   - If both fail: `state: 'error'`, toast with error details

### Toast Trigger Mechanism

Toasts are renderer-side only (via `useToast`). The main process does NOT send toast-specific IPC messages. Instead, the renderer watches for state transitions on the `status` object and shows the appropriate toast reactively:
- `reconnecting → running`: show "Mail server restarted after unexpected shutdown"
- `starting → error` or `reconnecting → error`: show error detail with guidance
- Port auto-resolved: the status object includes `resolvedPort`/`resolvedSmtpPort`, renderer detects the difference and shows "Port X was in use, using Y instead"

Each crash recovery gets its own toast — no debouncing. If the process crashes repeatedly, the user should see each recovery notification since it signals an underlying problem.

---

## 3. Port Conflict Detection

### Detection Method

Use Node.js `net.createServer()` to attempt binding each port before spawning Mailpit. If `EADDRINUSE` is thrown, the port is taken.

Check both SMTP port and HTTP port before spawning.

**TOCTOU note:** There is a small race window between closing the test server and Mailpit binding the port. In practice this is milliseconds and unlikely on a desktop app. If Mailpit still fails to bind after the pre-check passed, the retry logic recognizes the error as a port conflict and attempts the next port rather than doing a blind retry.

### Auto-Resolve Behavior

- If a port is busy, increment by 1 and check again
- Up to 10 attempts per port (e.g., 1025 → 1034). This constant should be easy to adjust if needed.
- If available port found: use it for this session, renderer shows toast "Port 1025 was in use, using 1026 instead"
- If no port found after 10 attempts: fail with "Ports 1025-1034 are all in use"

### Session-Only Resolution

Auto-resolved ports are used for the current session only. They do NOT overwrite the user's saved settings. Next restart tries the preferred port first again.

The resolved ports are stored on the `MailpitStatus` object (`resolvedPort`, `resolvedSmtpPort`) so all consumers can access the actual running ports.

### Where It Runs

Inside `mailpit-process.service.ts`, as a new step between `killOrphanedProcesses()` and `spawn()` in the `start()` method. Only at startup — no periodic checks.

---

## 4. Enhanced Sidebar Status Display

### State-to-Visual Mapping

| State | Indicator | Text | Color |
|-------|-----------|------|-------|
| `stopped` | ● | Stopped | Red (`text-red-500`) |
| `starting` | Spinner | Starting... | Yellow (`text-yellow-500`) |
| `running` | ● | Running | Green (`text-green-500`) |
| `stopping` | Spinner | Stopping... | Yellow (`text-yellow-500`) |
| `restarting` | Spinner | Restarting... | Yellow (`text-yellow-500`) |
| `reconnecting` | Spinner | Reconnecting... | Yellow (`text-yellow-500`) |
| `error` | ● | Error: {short msg} | Red (`text-red-500`) |

### Spinner

Small CSS-animated spinning circle using Tailwind's `animate-spin` on a circular SVG icon. No custom CSS.

### Port Display

- Normal: `SMTP: 1025`
- Auto-resolved: `SMTP: 1026 (configured: 1025)`

Uses the `actualSmtpPort` computed getter from the server store.

### Error Display

- Error text truncated to one line in sidebar
- Full error in native tooltip (HTML `title` attribute)
- Settings gear icon remains for navigation

### Button States in SettingsView

| State | Start | Stop | Restart |
|-------|-------|------|---------|
| `stopped` | Enabled | Disabled | Disabled |
| `starting` | Disabled | Disabled | Disabled |
| `running` | Disabled | Enabled | Enabled |
| `stopping` | Disabled | Disabled | Disabled |
| `restarting` | Disabled | Disabled | Disabled |
| `reconnecting` | Disabled | Disabled | Disabled |
| `error` | Enabled (acts as Retry) | Disabled | Disabled |

### Layout

No changes to sidebar layout or structure. Same section, same position. Existing Tailwind classes cover all colors.

---

## 5. Files Changed

### Main Process (Electron)

| File | Change |
|------|--------|
| `electron/services/mailpit-process.service.ts` | State machine, retry logic, port detection, auto-restart on crash. Largest change. Stores resolved ports and exposes them on status. |
| `electron/services/mailpit-api.service.ts` | Must use resolved ports for API calls. Add method to update base URL from resolved port (not just settings). The process service calls this after port resolution. |
| `electron/ipc/channels.ts` | No changes. Existing `MAILPIT_STATUS_CHANGED` carries the richer status object. |
| `electron/ipc/handlers.ts` | Update `status.running` check to `status.state === 'running'` in the settings change handler that triggers auto-restart. The handler calls `restart()` which internally manages the `restarting` state atomically. |
| `electron/main.ts` | No changes. Already calls `start()` which handles everything internally. |
| `electron/preload.ts` | No changes needed. The bridge forwards the status object transparently regardless of shape. |

### Renderer (Vue)

| File | Change |
|------|--------|
| `src/stores/server.store.ts` | Update `MailpitStatus` interface. Add computed getters: `isRunning`, `actualPort`, `actualSmtpPort`. Add watcher for state transitions to trigger toasts. |
| `src/components/layout/AppSidebar.vue` | Display logic for all states: spinner, colors, error text, resolved port via `actualSmtpPort`. |
| `src/views/SettingsView.vue` | Replace `v-if="status.running"` / `v-else` toggle with individual buttons using `:disabled` bindings per state (see button states table in Section 4). About section uses `actualSmtpPort`. Remove misleading "Restart Mailpit for port changes" toast since auto-restart already handles it. Save button should be disabled while state is `restarting` to avoid conflicting settings changes mid-restart. |
| `src/composables/useMailpitWebSocket.ts` | Watch `status.state === 'running'` instead of `status.running`. Use `actualPort` (i.e., `resolvedPort ?? port`) for WebSocket URL. Reset reconnection attempts when state transitions to `reconnecting` (process service handles restart, not WebSocket). |
| `src/components/email/EmailList.vue` | Empty state hint uses `actualSmtpPort` from server store. |
| `src/api/ipc.ts` | Type update only. |
| `src/types/electron.d.ts` | Type update only. |

### No new files. No new dependencies. No new IPC channels.
