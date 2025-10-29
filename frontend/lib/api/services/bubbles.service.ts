/**
 * Bubbles Service
 * Handles bubble (social groups) operations
 */

import apiClient from '../client'
import { API_ENDPOINTS } from '../config'
import type { BubbleCreate, BubbleResponse, BubbleUpdate, BubbleMemberResponse, BubbleStats } from '@/lib/types'

export const bubblesService = {
  /**
   * Create new bubble
   */
  async createBubble(data: BubbleCreate): Promise<BubbleResponse> {
    const response = await apiClient.post<BubbleResponse>(API_ENDPOINTS.bubbles.create, data)
    return response.data
  },

  /**
   * Get all bubbles
   */
  async getBubbles(params?: {
    skip?: number
    limit?: number
    bubble_type?: string
    location?: string
  }): Promise<BubbleResponse[]> {
    const response = await apiClient.get<BubbleResponse[]>(API_ENDPOINTS.bubbles.list, { params })
    return response.data
  },

  /**
   * Get user's bubbles
   */
  async getMyBubbles(): Promise<BubbleResponse[]> {
    const response = await apiClient.get<BubbleResponse[]>(API_ENDPOINTS.bubbles.myBubbles)
    return response.data
  },

  /**
   * Get bubble by ID
   */
  async getBubble(id: number): Promise<BubbleResponse> {
    const response = await apiClient.get<BubbleResponse>(API_ENDPOINTS.bubbles.detail(id))
    return response.data
  },

  /**
   * Update bubble
   */
  async updateBubble(id: number, data: BubbleUpdate): Promise<BubbleResponse> {
    const response = await apiClient.put<BubbleResponse>(API_ENDPOINTS.bubbles.update(id), data)
    return response.data
  },

  /**
   * Delete bubble
   */
  async deleteBubble(id: number): Promise<void> {
    await apiClient.delete(API_ENDPOINTS.bubbles.delete(id))
  },

  /**
   * Join bubble
   */
  async joinBubble(id: number): Promise<BubbleMemberResponse> {
    const response = await apiClient.post<BubbleMemberResponse>(API_ENDPOINTS.bubbles.join(id))
    return response.data
  },

  /**
   * Leave bubble
   */
  async leaveBubble(id: number): Promise<void> {
    await apiClient.post(API_ENDPOINTS.bubbles.leave(id))
  },

  /**
   * Get bubble members
   */
  async getBubbleMembers(id: number): Promise<BubbleMemberResponse[]> {
    const response = await apiClient.get<BubbleMemberResponse[]>(API_ENDPOINTS.bubbles.members(id))
    return response.data
  },

  /**
   * Update member role
   */
  async updateMemberRole(bubbleId: number, userId: number, role: string): Promise<BubbleMemberResponse> {
    const response = await apiClient.put<BubbleMemberResponse>(
      API_ENDPOINTS.bubbles.updateMemberRole(bubbleId, userId),
      { role }
    )
    return response.data
  },

  /**
   * Get bubble statistics
   */
  async getBubbleStats(): Promise<BubbleStats> {
    const response = await apiClient.get<BubbleStats>(API_ENDPOINTS.bubbles.stats)
    return response.data
  },

  /**
   * Get Ghana bubble types
   */
  async getBubbleTypes(): Promise<any> {
    const response = await apiClient.get(API_ENDPOINTS.bubbles.types)
    return response.data
  },

  /**
   * Get Ghana regions
   */
  async getGhanaRegions(): Promise<any> {
    const response = await apiClient.get(API_ENDPOINTS.bubbles.regions)
    return response.data
  },

  /**
   * Get popular locations
   */
  async getPopularLocations(): Promise<any> {
    const response = await apiClient.get(API_ENDPOINTS.bubbles.popularLocations)
    return response.data
  },

  /**
   * Get Ghana products
   */
  async getGhanaProducts(): Promise<any> {
    const response = await apiClient.get(API_ENDPOINTS.bubbles.products)
    return response.data
  },
}
