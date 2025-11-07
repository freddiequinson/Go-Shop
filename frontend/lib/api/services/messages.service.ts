/**
 * Messages Service
 * Handles messaging and conversation operations
 */

import apiClient from '../client'
import { API_ENDPOINTS } from '../config'
import type {
  ConversationCreate,
  ConversationResponse,
  ConversationListResponse,
  MessageCreate,
  MessageResponse,
  MessageListResponse,
} from '@/lib/types'

export const messagesService = {
  /**
   * Create support conversation with admin
   */
  async createSupportConversation(): Promise<ConversationResponse> {
    const response = await apiClient.post<ConversationResponse>('/messages/conversations/support')
    return response.data
  },

  /**
   * Create new conversation
   */
  async createConversation(data: ConversationCreate): Promise<ConversationResponse> {
    const response = await apiClient.post<ConversationResponse>(API_ENDPOINTS.messages.createConversation, data)
    return response.data
  },

  /**
   * Get user's conversations
   */
  async getConversations(params?: { skip?: number; limit?: number }): Promise<ConversationListResponse> {
    const response = await apiClient.get<ConversationListResponse>(API_ENDPOINTS.messages.conversations, { params })
    return response.data
  },

  /**
   * Get conversation by ID
   */
  async getConversation(id: number): Promise<ConversationResponse> {
    const response = await apiClient.get<ConversationResponse>(API_ENDPOINTS.messages.conversationDetail(id))
    return response.data
  },

  /**
   * Update conversation
   */
  async updateConversation(id: number, data: { title?: string }): Promise<ConversationResponse> {
    const response = await apiClient.put<ConversationResponse>(API_ENDPOINTS.messages.updateConversation(id), data)
    return response.data
  },

  /**
   * Add participant to conversation
   */
  async addParticipant(conversationId: number, userId: number): Promise<any> {
    const response = await apiClient.post(API_ENDPOINTS.messages.addParticipant(conversationId), {
      user_id: userId,
    })
    return response.data
  },

  /**
   * Remove participant from conversation
   */
  async removeParticipant(conversationId: number, participantId: number): Promise<void> {
    await apiClient.delete(API_ENDPOINTS.messages.removeParticipant(conversationId, participantId))
  },

  /**
   * Send message
   */
  async sendMessage(conversationId: number, data: MessageCreate): Promise<MessageResponse> {
    const response = await apiClient.post<MessageResponse>(API_ENDPOINTS.messages.sendMessage(conversationId), data)
    return response.data
  },

  /**
   * Get conversation messages
   */
  async getMessages(conversationId: number, params?: { skip?: number; limit?: number }): Promise<MessageListResponse> {
    const response = await apiClient.get<MessageListResponse>(API_ENDPOINTS.messages.getMessages(conversationId), {
      params,
    })
    return response.data
  },

  /**
   * Mark message as read
   */
  async markMessageAsRead(messageId: number): Promise<void> {
    await apiClient.post(API_ENDPOINTS.messages.markRead(messageId))
  },

  /**
   * Send Ghana market message
   */
  async sendGhanaMarketMessage(conversationId: number, data: any): Promise<MessageResponse> {
    const response = await apiClient.post<MessageResponse>(
      API_ENDPOINTS.messages.ghanaMarketMessage(conversationId),
      data
    )
    return response.data
  },

  /**
   * Send bubble group message
   */
  async sendBubbleMessage(conversationId: number, data: any): Promise<MessageResponse> {
    const response = await apiClient.post<MessageResponse>(API_ENDPOINTS.messages.bubbleMessage(conversationId), data)
    return response.data
  },

  /**
   * Get unread messages count
   */
  async getUnreadCount(): Promise<{ unread_count: number }> {
    const response = await apiClient.get<{ unread_count: number }>(API_ENDPOINTS.messages.unreadCount)
    return response.data
  },

  /**
   * Get user messaging stats
   */
  async getUserStats(): Promise<any> {
    const response = await apiClient.get(API_ENDPOINTS.messages.userStats)
    return response.data
  },

  /**
   * Get conversation stats
   */
  async getConversationStats(conversationId: number): Promise<any> {
    const response = await apiClient.get(API_ENDPOINTS.messages.conversationStats(conversationId))
    return response.data
  },
}
