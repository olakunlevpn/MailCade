/**
 * IPC Channel definitions
 * Centralized list of all IPC communication channels between main and renderer processes
 */

export const IPC_CHANNELS = {
  // App info
  APP_GET_VERSION: 'app:getVersion',
  
  // Mailpit process management
  MAILPIT_START: 'mailpit:start',
  MAILPIT_STOP: 'mailpit:stop',
  MAILPIT_RESTART: 'mailpit:restart',
  MAILPIT_GET_STATUS: 'mailpit:getStatus',
  MAILPIT_GET_LOGS: 'mailpit:getLogs',
  MAILPIT_STATUS_CHANGED: 'mailpit:statusChanged',
  
  // Mailpit API (proxied through main process to avoid CORS)
  MAILPIT_GET_MESSAGES: 'mailpit:getMessages',
  MAILPIT_GET_MESSAGE: 'mailpit:getMessage',
  MAILPIT_DELETE_MESSAGE: 'mailpit:deleteMessage',
  MAILPIT_DELETE_ALL: 'mailpit:deleteAllMessages',
  MAILPIT_SEARCH: 'mailpit:searchMessages',
  
  // Settings management
  SETTINGS_GET: 'settings:get',
  SETTINGS_SET: 'settings:set',
  SETTINGS_GET_ALL: 'settings:getAll',
  SETTINGS_RESET: 'settings:reset',
  
  // Auto-updater
  UPDATE_CHECK: 'update:check',
  UPDATE_DOWNLOAD: 'update:download',
  UPDATE_INSTALL: 'update:install',
  UPDATE_GET_STATUS: 'update:getStatus',
  UPDATE_STATUS_CHANGED: 'update:status',
  
  // App badge
  APP_SET_BADGE_COUNT: 'app:setBadgeCount',
  
  // External links
  APP_OPEN_EXTERNAL: 'app:openExternal',
  
  // Notifications
  NOTIFICATION_SHOW: 'notification:show',
} as const

export type IPCChannel = typeof IPC_CHANNELS[keyof typeof IPC_CHANNELS]
