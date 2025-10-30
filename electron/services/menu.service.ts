/**
 * Menu Service
 * Custom application menu with MailCade branding
 */

import { Menu, shell, dialog } from 'electron'
import type { BrowserWindow } from 'electron'
import { appConfig } from '../config'
import { logger } from '../utils/logger'

export class MenuService {
  /**
   * Create and set custom application menu
   */
  static createMenu(mainWindow: BrowserWindow): void {
    const isMac = process.platform === 'darwin'
    
    const template: any[] = [
      // App Menu (macOS only)
      ...(isMac ? [{
        label: appConfig.name,
        submenu: [
          {
            label: `About ${appConfig.name}`,
            click: () => this.showAboutDialog(mainWindow)
          },
          { type: 'separator' },
          {
            label: 'Preferences...',
            accelerator: 'CmdOrCtrl+,',
            click: () => {
              mainWindow.webContents.send('navigate-to-settings')
            }
          },
          { type: 'separator' },
          {
            label: 'Services',
            role: 'services',
          },
          { type: 'separator' },
          {
            label: `Hide ${appConfig.name}`,
            accelerator: 'Command+H',
            role: 'hide',
          },
          {
            label: 'Hide Others',
            accelerator: 'Command+Alt+H',
            role: 'hideOthers',
          },
          {
            label: 'Show All',
            role: 'unhide',
          },
          { type: 'separator' },
          {
            label: `Quit ${appConfig.name}`,
            accelerator: 'Command+Q',
            role: 'quit',
          },
        ],
      }] : []),

      // File Menu
      {
        label: 'File',
        submenu: [
          ...(isMac ? [] : [{
            label: 'Preferences...',
            accelerator: 'Ctrl+,',
            click: () => {
              mainWindow.webContents.send('navigate-to-settings')
            }
          }]),
          { type: 'separator' },
          isMac ? { role: 'close' } : { role: 'quit', label: 'Exit' },
        ],
      },

      // Edit Menu
      {
        label: 'Edit',
        submenu: [
          { role: 'undo' },
          { role: 'redo' },
          { type: 'separator' },
          { role: 'cut' },
          { role: 'copy' },
          { role: 'paste' },
          ...(isMac ? [
            { role: 'pasteAndMatchStyle' },
            { role: 'delete' },
            { role: 'selectAll' },
          ] : [
            { role: 'delete' },
            { type: 'separator' },
            { role: 'selectAll' },
          ]),
        ],
      },

      // View Menu
      {
        label: 'View',
        submenu: [
          { role: 'reload' },
          { role: 'forceReload' },
          { role: 'toggleDevTools' },
          { type: 'separator' },
          { role: 'resetZoom' },
          { role: 'zoomIn' },
          { role: 'zoomOut' },
          { type: 'separator' },
          { role: 'togglefullscreen' },
        ],
      },

      // Window Menu
      {
        label: 'Window',
        submenu: [
          { role: 'minimize' },
          { role: 'zoom' },
          ...(isMac ? [
            { type: 'separator' },
            { role: 'front' },
            { type: 'separator' },
            { role: 'window' },
          ] : [
            { role: 'close' },
          ]),
        ],
      },

      // Help Menu
      {
        role: 'help',
        submenu: [
          {
            label: 'Documentation',
            click: async () => {
              await shell.openExternal(appConfig.links.docs)
            },
          },
          {
            label: 'Website',
            click: async () => {
              await shell.openExternal(appConfig.links.website)
            },
          },
          {
            label: 'GitHub Repository',
            click: async () => {
              await shell.openExternal(appConfig.links.github)
            },
          },
          { type: 'separator' },
          ...(isMac ? [] : [{
            label: `About ${appConfig.name}`,
            click: () => this.showAboutDialog(mainWindow)
          }]),
        ],
      },
    ]

    const menu = Menu.buildFromTemplate(template)
    Menu.setApplicationMenu(menu)
    
    logger.info('Custom application menu created')
  }

  /**
   * Show custom About dialog
   */
  private static showAboutDialog(mainWindow: BrowserWindow): void {
    dialog.showMessageBox(mainWindow, {
      type: 'info',
      title: `About ${appConfig.name}`,
      message: appConfig.name,
      detail: `Version ${appConfig.version}

${appConfig.description}

Built with ❤️ by ${appConfig.author.name}
${appConfig.author.link}

A modern email testing tool for developers.`,
      buttons: ['OK'],
      noLink: true,
    })
  }
}
