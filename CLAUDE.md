# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

MailCade is a cross-platform desktop email sandbox app (macOS, Windows, Linux) built with **Electron 28 + Vue 3 + TypeScript**. It bundles [Mailpit](https://github.com/axllent/mailpit) as a child process to catch SMTP emails during development. No cloud services — everything runs locally.

## Development Commands

```bash
npm install              # Install deps + auto-downloads Mailpit binaries (postinstall)
npm run dev              # Start Vite dev server + Electron with hot reload
npm run build            # Build Vue + Electron, package with electron-builder
npm run build:publish    # Build and publish to GitHub releases
npm run lint             # ESLint + Prettier fix
npm run format           # Prettier only
npm run download-mailpit # Manually re-download Mailpit binaries
npm run kill-mailpit     # Kill orphaned Mailpit processes (macOS/Linux)
```

No test framework is currently configured.

## Architecture

### Two-process Electron model

- **Main process** (`electron/`): App lifecycle, native APIs, spawns Mailpit child process, handles IPC
- **Renderer process** (`src/`): Vue 3 SPA with Pinia stores, Tailwind CSS, communicates via IPC bridge

### Key directories

- `electron/services/` — Singleton services: `mailpit-process.service.ts` (child process), `mailpit-api.service.ts` (REST client), `settings.service.ts` (electron-store), `auto-updater.service.ts`, `menu.service.ts`
- `electron/ipc/` — `channels.ts` (channel constants) + `handlers.ts` (message routing). All IPC channels are defined centrally.
- `electron/binaries/` — Platform-specific Mailpit executables (downloaded via `scripts/download-mailpit.js`)
- `src/stores/` — Pinia stores: `email.store.ts`, `server.store.ts`, `theme.store.ts`, `ui.store.ts`
- `src/api/ipc.ts` — Type-safe IPC wrapper used by renderer to call main process
- `src/api/mailpit.ts` — Direct Mailpit REST API client (used alongside IPC for performance)
- `src/composables/` — `useMailpitWebSocket.ts` (real-time email updates), `useToast.ts`
- `src/views/` — Page components: `InboxView.vue`, `EmailDetailView.vue`, `SettingsView.vue`

### Communication flow

Renderer → preload contextBridge → IPC handlers → Electron services → Mailpit REST API / child process

### Security model

- `nodeIntegration: false`, `contextIsolation: true`, sandbox enabled
- Preload script (`electron/preload.ts`) exposes only whitelisted APIs via `contextBridge`

### Settings persistence

Uses `electron-store` (JSON file). Defaults in `electron/config/defaults.ts`. Schema: `mailpit` (ports, hostname, maxMessages), `app` (autoStart, autoUpdate, closeToTray), `ui` (theme, notifications).

### Routes

- `/` — InboxView (main: email list + detail panel)
- `/email/:id` — EmailDetailView
- `/settings` — SettingsView (tabbed: General, Mailpit, Advanced, About)

## Build & Packaging

Configured in `package.json` under `build`. Outputs:
- macOS: `.dmg`, `.zip` (universal + arm64 + x64, with notarization)
- Windows: `.exe` (NSIS installer + portable)
- Linux: `.AppImage`, `.deb`, `.rpm`

Mailpit binaries are bundled as extraResources.

## Path Aliases (vite.config.ts / tsconfig.json)

- `@/` → `src/`
- `@electron/` → `electron/`

## Coding Rules (from rules/)

- **Vue**: Multi-word component names (PascalCase), typed props with required/default, key `v-for` lists, one component per file, `<template>` → `<script>` → `<style>` order, extract reusable logic to composables
- **Electron**: Keep main process lightweight, expose minimal bridge APIs, organized IPC channels with typed messages, don't mix UI and native logic
- **General**: One task per function, DRY, no magic values, modular files
