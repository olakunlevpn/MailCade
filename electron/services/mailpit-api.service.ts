/**
 * Mailpit API Service
 * Handles communication with Mailpit's REST API
 */

import axios, { AxiosInstance } from 'axios'
import { logger } from '../utils/logger'
import { settingsService } from './settings.service'

export interface MailpitMessage {
  ID: string
  MessageID: string
  From: { Name: string; Address: string }
  To: Array<{ Name: string; Address: string }>
  Cc?: Array<{ Name: string; Address: string }>
  Bcc?: Array<{ Name: string; Address: string }>
  Subject: string
  Date: string
  Text: string
  HTML: string
  Size: number
  Attachments?: Array<{
    PartID: string
    FileName: string
    ContentType: string
    Size: number
  }>
  Tags?: string[]
}

export interface MailpitMessagesResponse {
  total: number
  messages: MailpitMessage[]
  unread: number
  count: number
  start: number
  tags: string[]
}

class MailpitAPIService {
  private client: AxiosInstance

  constructor() {
    const settings = settingsService.getAll()
    const baseURL = `http://localhost:${settings.mailpit.webUIPort}`
    
    this.client = axios.create({
      baseURL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    })

    logger.info(`Mailpit API client initialized: ${baseURL}`)
  }

  /**
   * Update the base URL when settings change
   */
  updateBaseURL(): void {
    const settings = settingsService.getAll()
    const baseURL = `http://localhost:${settings.mailpit.webUIPort}`
    this.client.defaults.baseURL = baseURL
    logger.debug(`Mailpit API base URL updated: ${baseURL}`)
  }

  /**
   * Get list of messages
   */
  async getMessages(params?: {
    limit?: number
    start?: number
    search?: string
  }): Promise<MailpitMessagesResponse> {
    try {
      const response = await this.client.get<MailpitMessagesResponse>('/api/v1/messages', {
        params: {
          limit: params?.limit || 50,
          start: params?.start || 0,
          query: params?.search || '',
        },
      })
      
      logger.debug(`Fetched ${response.data.messages?.length || 0} messages`)
      return response.data
    } catch (error) {
      logger.error('Failed to fetch messages', error)
      throw error
    }
  }

  /**
   * Get a specific message by ID
   */
  async getMessage(id: string): Promise<MailpitMessage> {
    try {
      const response = await this.client.get<MailpitMessage>(`/api/v1/message/${id}`)
      logger.debug(`Fetched message: ${id}`)
      return response.data
    } catch (error) {
      logger.error(`Failed to fetch message: ${id}`, error)
      throw error
    }
  }

  /**
   * Delete a specific message
   */
  async deleteMessage(id: string): Promise<void> {
    try {
      await this.client.delete(`/api/v1/message/${id}`)
      logger.info(`Deleted message: ${id}`)
    } catch (error) {
      logger.error(`Failed to delete message: ${id}`, error)
      throw error
    }
  }

  /**
   * Delete all messages
   */
  async deleteAllMessages(): Promise<void> {
    try {
      await this.client.delete('/api/v1/messages')
      logger.info('Deleted all messages')
    } catch (error) {
      logger.error('Failed to delete all messages', error)
      throw error
    }
  }

  /**
   * Get message attachment
   */
  async getAttachment(messageId: string, partId: string): Promise<Buffer> {
    try {
      const response = await this.client.get(`/api/v1/message/${messageId}/part/${partId}`, {
        responseType: 'arraybuffer',
      })
      logger.debug(`Fetched attachment: ${messageId}/${partId}`)
      return Buffer.from(response.data)
    } catch (error) {
      logger.error(`Failed to fetch attachment: ${messageId}/${partId}`, error)
      throw error
    }
  }

  /**
   * Get HTML check results
   */
  async getHTMLCheck(id: string): Promise<unknown> {
    try {
      const response = await this.client.get(`/api/v1/message/${id}/html-check`)
      logger.debug(`HTML check for message: ${id}`)
      return response.data
    } catch (error) {
      logger.error(`Failed to get HTML check: ${id}`, error)
      throw error
    }
  }

  /**
   * Get link check results
   */
  async getLinkCheck(id: string): Promise<unknown> {
    try {
      const response = await this.client.get(`/api/v1/message/${id}/link-check`)
      logger.debug(`Link check for message: ${id}`)
      return response.data
    } catch (error) {
      logger.error(`Failed to get link check: ${id}`, error)
      throw error
    }
  }

  /**
   * Get all tags
   */
  async getTags(): Promise<string[]> {
    try {
      const response = await this.client.get<string[]>('/api/v1/tags')
      logger.debug(`Fetched ${response.data?.length || 0} tags`)
      return response.data
    } catch (error) {
      logger.error('Failed to fetch tags', error)
      throw error
    }
  }

  /**
   * Set message tags
   */
  async setTags(id: string, tags: string[]): Promise<void> {
    try {
      await this.client.put(`/api/v1/message/${id}/tags`, { tags })
      logger.debug(`Updated tags for message: ${id}`)
    } catch (error) {
      logger.error(`Failed to set tags: ${id}`, error)
      throw error
    }
  }

  /**
   * Check if Mailpit API is reachable
   */
  async healthCheck(): Promise<boolean> {
    try {
      await this.client.get('/api/v1/messages', {
        params: { limit: 1 },
        timeout: 3000,
      })
      return true
    } catch (error) {
      logger.warn('Mailpit API health check failed', error)
      return false
    }
  }
}

// Singleton instance
export const mailpitAPIService = new MailpitAPIService()
