/**
 * Mailpit WebSocket Composable
 * Connects to Mailpit's WebSocket for real-time email notifications
 */

import { ref, onUnmounted, watch } from 'vue'
import { useServerStore } from '@/stores/server.store'
import { useEmailStore } from '@/stores/email.store'
import { useToast } from './useToast'

export interface WebSocketMessage {
  Type: 'new' | 'prune' | 'stats'
  Data?: {
    id?: string
    total?: number
    [key: string]: unknown
  }
}

export function useMailpitWebSocket() {
  const serverStore = useServerStore()
  const emailStore = useEmailStore()
  const toast = useToast()
  
  const isConnected = ref(false)
  const error = ref<string | null>(null)
  
  let ws: WebSocket | null = null
  let reconnectTimeout: NodeJS.Timeout | null = null
  let reconnectAttempts = 0
  const maxReconnectAttempts = 5
  const reconnectDelay = 3000
  
  // Track notified emails to prevent duplicates
  const notifiedEmails = new Set<string>()

  /**
   * Connect to Mailpit WebSocket
   */
  const connect = () => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      return
    }

    const port = serverStore.status.port
    const url = `ws://localhost:${port}/api/events`

    try {
      ws = new WebSocket(url)

      ws.onopen = () => {
        console.log('✓ WebSocket connected to Mailpit')
        isConnected.value = true
        error.value = null
        reconnectAttempts = 0
      }

      ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data)
          handleMessage(message)
        } catch (err) {
          console.error('Failed to parse WebSocket message:', err)
        }
      }

      ws.onerror = (event) => {
        console.error('WebSocket error:', event)
        error.value = 'WebSocket connection error'
      }

      ws.onclose = () => {
        console.log('WebSocket disconnected')
        isConnected.value = false
        
        // Attempt to reconnect
        if (
          serverStore.status.running &&
          reconnectAttempts < maxReconnectAttempts
        ) {
          reconnectAttempts++
          console.log(`Reconnecting in ${reconnectDelay}ms (attempt ${reconnectAttempts})...`)
          reconnectTimeout = setTimeout(connect, reconnectDelay)
        }
      }
    } catch (err) {
      console.error('Failed to create WebSocket:', err)
      error.value = err instanceof Error ? err.message : 'Connection failed'
    }
  }

  /**
   * Disconnect WebSocket
   */
  const disconnect = () => {
    if (reconnectTimeout) {
      clearTimeout(reconnectTimeout)
      reconnectTimeout = null
    }

    if (ws) {
      ws.close()
      ws = null
    }

    isConnected.value = false
    reconnectAttempts = 0
  }

  /**
   * Handle incoming WebSocket messages
   */
  const handleMessage = async (message: WebSocketMessage) => {
    switch (message.Type) {
      case 'new':
        const emailId = message.Data?.id
        console.log('📧 New email received:', emailId)
        
        // Check if we already notified about this email
        if (emailId && notifiedEmails.has(emailId)) {
          console.log('Skipping duplicate notification for:', emailId)
          return
        }
        
        // Add to notified set
        if (emailId) {
          notifiedEmails.add(emailId)
          // Clear from set after 5 minutes
          setTimeout(() => notifiedEmails.delete(emailId), 5 * 60 * 1000)
        }
        
        // Refresh email list
        await emailStore.fetchEmails()
        
        // Update badge count
        updateBadgeCount()
        
        // Get the newest email details for notification
        const latestEmail = emailStore.emails[0]
        const from = latestEmail?.From?.Address || 'Unknown sender'
        const subject = latestEmail?.Subject || 'No subject'
        
        // Show toast notification
        toast.info('New email received', `From: ${from}`)
        
        // Show system notification if permitted (async, don't await to avoid blocking)
        showNotification('New Email', `From: ${from}\n${subject}`).catch(err => {
          console.error('Failed to show notification:', err)
        })
        break

      case 'prune':
        console.log('🗑️  Emails pruned, total:', message.Data?.total)
        // Refresh email list after prune
        await emailStore.fetchEmails()
        updateBadgeCount()
        const total = message.Data?.total || 0
        toast.warning('Old emails removed', `Kept ${total} most recent`)
        break

      case 'stats':
        // Stats updates - ignore silently
        break

      default:
        console.log('Unknown WebSocket message type:', message)
    }
  }

  /**
   * Update app badge count with total emails
   */
  const updateBadgeCount = () => {
    const count = emailStore.emails.length
    
    // Update Electron app badge (macOS/Windows)
    if (window.electronAPI) {
      window.electronAPI.setBadgeCount?.(count)
    }
  }

  /**
   * Show notification (respects user settings, uses native Electron notifications)
   */
  const showNotification = async (title: string, body: string) => {
    // Check if user has enabled notifications in settings
    try {
      const settings = await window.electronAPI.settings.getAll()
      const notificationsEnabled = settings.ui && (settings.ui as any).notifications !== false
      
      if (!notificationsEnabled) {
        console.log('📭 Notifications disabled in settings')
        return
      }
    } catch (err) {
      console.error('Failed to check notification settings:', err)
    }
    
    // Use native Electron notification
    try {
      await window.electronAPI.showNotification(title, body)
      console.log('✅ Desktop notification shown:', title)
    } catch (error) {
      console.error('❌ Failed to show notification:', error)
      
      // Fallback to web Notification API
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(title, {
          body,
          silent: false,
        })
        console.log('✅ Fallback notification shown')
      } else if ('Notification' in window && Notification.permission === 'default') {
        const permission = await Notification.requestPermission()
        if (permission === 'granted') {
          new Notification(title, { body })
        }
      }
    }
  }

  /**
   * Request notification permission
   */
  const requestNotificationPermission = async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      const permission = await Notification.requestPermission()
      return permission === 'granted'
    }
    return Notification.permission === 'granted'
  }

  /**
   * Watch server status and connect/disconnect accordingly
   */
  watch(
    () => serverStore.status.running,
    (running) => {
      if (running) {
        // Give Mailpit a moment to start up
        setTimeout(connect, 1000)
      } else {
        disconnect()
      }
    },
    { immediate: true }
  )

  /**
   * Cleanup on component unmount
   */
  onUnmounted(() => {
    disconnect()
  })

  return {
    isConnected,
    error,
    connect,
    disconnect,
    requestNotificationPermission,
  }
}
