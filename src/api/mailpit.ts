/**
 * Mailpit API Client (Renderer)
 * Direct HTTP communication with Mailpit REST API from renderer process
 */

import axios, { AxiosInstance } from 'axios'
import type { Email, EmailsResponse, EmailListQuery } from '@/types/email.types'

class MailpitAPIClient {
  private client: AxiosInstance
  private basePort = 8025

  constructor() {
    this.client = axios.create({
      baseURL: `http://localhost:${this.basePort}`,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    })
  }

  /**
   * Update base URL when port changes
   */
  updatePort(port: number): void {
    this.basePort = port
    this.client.defaults.baseURL = `http://localhost:${port}`
  }

  /**
   * Get list of messages
   */
  async getMessages(query?: EmailListQuery): Promise<EmailsResponse> {
    const response = await this.client.get<EmailsResponse>('/api/v1/messages', {
      params: {
        limit: query?.limit || 50,
        start: query?.start || 0,
        query: query?.search || '',
      },
    })
    return response.data
  }

  /**
   * Get a specific message by ID
   */
  async getMessage(id: string): Promise<Email> {
    const response = await this.client.get<Email>(`/api/v1/message/${id}`)
    return response.data
  }

  /**
   * Delete a specific message
   */
  async deleteMessage(id: string): Promise<void> {
    await this.client.delete(`/api/v1/message/${id}`)
  }

  /**
   * Delete all messages
   */
  async deleteAllMessages(): Promise<void> {
    await this.client.delete('/api/v1/messages')
  }

  /**
   * Get message raw source
   */
  async getMessageSource(id: string): Promise<string> {
    const response = await this.client.get<string>(`/api/v1/message/${id}/raw`)
    return response.data
  }

  /**
   * Get message attachment
   */
  async getAttachment(messageId: string, partId: string): Promise<Blob> {
    const response = await this.client.get(
      `/api/v1/message/${messageId}/part/${partId}`,
      {
        responseType: 'blob',
      }
    )
    return response.data
  }

  /**
   * Get HTML check results
   */
  async getHTMLCheck(id: string): Promise<unknown> {
    const response = await this.client.get(`/api/v1/message/${id}/html-check`)
    return response.data
  }

  /**
   * Get link check results
   */
  async getLinkCheck(id: string): Promise<unknown> {
    const response = await this.client.get(`/api/v1/message/${id}/link-check`)
    return response.data
  }

  /**
   * Get all tags
   */
  async getTags(): Promise<string[]> {
    const response = await this.client.get<string[]>('/api/v1/tags')
    return response.data
  }

  /**
   * Set message tags
   */
  async setTags(id: string, tags: string[]): Promise<void> {
    await this.client.put(`/api/v1/message/${id}/tags`, { tags })
  }

  /**
   * Search messages
   */
  async searchMessages(query: string, limit = 50): Promise<EmailsResponse> {
    const response = await this.client.get<EmailsResponse>('/api/v1/search', {
      params: { query, limit },
    })
    return response.data
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<boolean> {
    try {
      await this.client.get('/api/v1/messages', {
        params: { limit: 1 },
        timeout: 3000,
      })
      return true
    } catch {
      return false
    }
  }
}

export const mailpitAPI = new MailpitAPIClient()
