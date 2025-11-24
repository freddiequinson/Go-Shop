/**
 * User Service
 * Handles user profile and account operations
 */

import apiClient from '@/lib/api/client';
import type { UserResponse, APIResponse } from '@/types';

class UserService {
  /**
   * Get current user profile
   */
  async getCurrentUser(): Promise<UserResponse> {
    const response = await apiClient.get<APIResponse<UserResponse>>('/users/me');
    return response.data.data;
  }

  /**
   * Update user profile
   */
  async updateProfile(data: Partial<UserResponse>): Promise<UserResponse> {
    const response = await apiClient.put<APIResponse<UserResponse>>('/users/me', data);
    return response.data.data;
  }

  /**
   * Change password
   */
  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    await apiClient.post('/users/me/change-password', {
      current_password: currentPassword,
      new_password: newPassword,
    });
  }

  /**
   * Get user wallet balance
   */
  async getWalletBalance(): Promise<{ balance: number }> {
    const response = await apiClient.get<APIResponse<{ balance: number }>>('/users/me/wallet');
    return response.data.data;
  }

  /**
   * Get user addresses
   */
  async getAddresses(): Promise<any[]> {
    const response = await apiClient.get<APIResponse<any[]>>('/users/me/addresses');
    return response.data.data;
  }

  /**
   * Add new address
   */
  async addAddress(address: any): Promise<any> {
    const response = await apiClient.post<APIResponse<any>>('/users/me/addresses', address);
    return response.data.data;
  }

  /**
   * Update address
   */
  async updateAddress(addressId: number, address: any): Promise<any> {
    const response = await apiClient.put<APIResponse<any>>(
      `/users/me/addresses/${addressId}`,
      address
    );
    return response.data.data;
  }

  /**
   * Delete address
   */
  async deleteAddress(addressId: number): Promise<void> {
    await apiClient.delete(`/users/me/addresses/${addressId}`);
  }

  /**
   * Set default address
   */
  async setDefaultAddress(addressId: number): Promise<void> {
    await apiClient.post(`/users/me/addresses/${addressId}/set-default`);
  }
}

export default new UserService();
