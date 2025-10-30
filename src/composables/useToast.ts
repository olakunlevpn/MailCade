/**
 * Toast Notification Composable
 * Manages toast notifications throughout the app
 */

import { reactive } from 'vue'

export type ToastType = 'success' | 'error' | 'warning' | 'info'

export interface Toast {
  id: string
  type: ToastType
  title?: string
  message: string
  duration?: number
}

const toasts = reactive<Toast[]>([])

let idCounter = 0

export function useToast() {
  /**
   * Show a toast notification
   */
  const show = (
    message: string,
    type: ToastType = 'info',
    title?: string,
    duration = 5000
  ): string => {
    const id = `toast-${++idCounter}`
    
    const toast: Toast = {
      id,
      type,
      title,
      message,
      duration,
    }
    
    toasts.push(toast)
    
    // Auto-remove after duration
    if (duration > 0) {
      setTimeout(() => {
        remove(id)
      }, duration)
    }
    
    return id
  }

  /**
   * Remove a toast by ID
   */
  const remove = (id: string) => {
    const index = toasts.findIndex((t) => t.id === id)
    if (index > -1) {
      toasts.splice(index, 1)
    }
  }

  /**
   * Show success toast
   */
  const success = (message: string, title?: string) => {
    return show(message, 'success', title)
  }

  /**
   * Show error toast
   */
  const error = (message: string, title?: string) => {
    return show(message, 'error', title, 7000) // Errors stay longer
  }

  /**
   * Show warning toast
   */
  const warning = (message: string, title?: string) => {
    return show(message, 'warning', title)
  }

  /**
   * Show info toast
   */
  const info = (message: string, title?: string) => {
    return show(message, 'info', title)
  }

  /**
   * Clear all toasts
   */
  const clear = () => {
    toasts.splice(0, toasts.length)
  }

  return {
    toasts,
    show,
    remove,
    success,
    error,
    warning,
    info,
    clear,
  }
}
