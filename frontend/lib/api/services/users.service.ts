/**
 * Users Service
 * Handles user profile operations
 */

import apiClient from '../client'
import { API_ENDPOINTS } from '../config'
import type { UserResponse, UserUpdate } from '@/lib/types'

export const usersService = {
  /**
   * Get user profile
   */
  async getProfile(): Promise<UserResponse> {
    const response = await apiClient.get<UserResponse>(API_ENDPOINTS.users.profile)
    return response.data
  },

  /**
   * Update user profile
   */
  async updateProfile(data: UserUpdate): Promise<UserResponse> {
    const response = await apiClient.put<UserResponse>(API_ENDPOINTS.users.profile, data)
    return response.data
  },

  /**
   * Deactivate user account
   */
  async deactivateAccount(): Promise<void> {
    await apiClient.delete(API_ENDPOINTS.users.profile)
  },
}
