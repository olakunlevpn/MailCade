import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Email, EmailListQuery, EmailsResponse } from '@/types/email.types'
import { ipcAPI } from '@/api/ipc'

export const useEmailStore = defineStore('email', () => {
  const emails = ref<Email[]>([])
  const selectedEmail = ref<Email | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)
  const total = ref(0)
  const unread = ref(0)

  const fetchEmails = async (query?: EmailListQuery) => {
    loading.value = true
    error.value = null
    
    try {
      const response = await ipcAPI.mailpit.getMessages(query) as EmailsResponse
      emails.value = response.messages || []
      total.value = response.total || 0
      unread.value = response.unread || 0
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch emails'
      console.error('Error fetching emails:', err)
      emails.value = []
    } finally {
      loading.value = false
    }
  }

  const fetchEmailById = async (id: string) => {
    loading.value = true
    error.value = null
    
    try {
      const email = await ipcAPI.mailpit.getMessage(id) as Email
      selectedEmail.value = email
      
      // Update the email in the list (important for unread count and UI updates)
      const emailIndex = emails.value.findIndex((e) => e.ID === id)
      if (emailIndex !== -1) {
        // Update the email in place to maintain reactivity
        emails.value[emailIndex] = { ...emails.value[emailIndex], ...email, Read: true }
      }
      
      // Update unread count if the email was previously unread
      if (email.Read && unread.value > 0) {
        unread.value--
      }
      
      return email
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch email'
      console.error('Error fetching email:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  const deleteEmail = async (id: string) => {
    try {
      // Store the current email before deletion
      const emailToDelete = emails.value.find((email) => email.ID === id)
      
      if (!emailToDelete) {
        console.warn('Email not found in local store:', id)
        return
      }
      
      // Try to delete from server
      await ipcAPI.mailpit.deleteMessage(id)
      
      // Update local state only if server deletion succeeds
      emails.value = emails.value.filter((email) => email.ID !== id)
      if (selectedEmail.value?.ID === id) {
        selectedEmail.value = null
      }
      total.value = Math.max(0, total.value - 1)
    } catch (err: any) {
      // If 404, the email was already deleted on the server
      if (err.message?.includes('404')) {
        console.warn('Email already deleted on server, updating local state')
        emails.value = emails.value.filter((email) => email.ID !== id)
        if (selectedEmail.value?.ID === id) {
          selectedEmail.value = null
        }
        total.value = Math.max(0, total.value - 1)
        return // Don't throw error for 404
      }
      
      error.value = err instanceof Error ? err.message : 'Failed to delete email'
      console.error('Error deleting email:', err)
      throw err
    }
  }

  const deleteAllEmails = async () => {
    try {
      await ipcAPI.mailpit.deleteAllMessages()
      emails.value = []
      selectedEmail.value = null
      total.value = 0
      unread.value = 0
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to delete all emails'
      console.error('Error deleting all emails:', err)
      throw err
    }
  }

  const selectEmail = (email: Email) => {
    selectedEmail.value = email
  }

  const clearEmails = () => {
    emails.value = []
    selectedEmail.value = null
    total.value = 0
    unread.value = 0
  }

  const searchEmails = async (query: string) => {
    loading.value = true
    error.value = null
    
    try {
      const response = await ipcAPI.mailpit.searchMessages(query) as EmailsResponse
      emails.value = response.messages || []
      total.value = response.total || 0
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to search emails'
      console.error('Error searching emails:', err)
      emails.value = []
    } finally {
      loading.value = false
    }
  }

  return {
    emails,
    selectedEmail,
    loading,
    error,
    total,
    unread,
    fetchEmails,
    fetchEmailById,
    deleteEmail,
    deleteAllEmails,
    selectEmail,
    clearEmails,
    searchEmails,
  }
})
