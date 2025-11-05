/**
 * User Addresses Service
 * Handles delivery address operations
 */

import apiClient from '../client'
import { API_ENDPOINTS } from '../config'
import type { 
  UserAddressCreate, 
  UserAddressUpdate, 
  UserAddressResponse,
  UserAddressListResponse 
} from '@/lib/types'

export const userAddressesService = {
  /**
   * Create a new delivery address
   */
  async createAddress(data: UserAddressCreate): Promise<UserAddressResponse> {
    const response = await apiClient.post<UserAddressResponse>(API_ENDPOINTS.addresses.list, data)
    return response.data
  },

  /**
   * Get all addresses for current user
   */
  async getAddresses(): Promise<UserAddressListResponse> {
    const response = await apiClient.get<UserAddressListResponse>(API_ENDPOINTS.addresses.list)
    return response.data
  },

  /**
   * Get default address
   */
  async getDefaultAddress(): Promise<UserAddressResponse> {
    const response = await apiClient.get<UserAddressResponse>(API_ENDPOINTS.addresses.default)
    return response.data
  },

  /**
   * Get address by ID
   */
  async getAddress(id: string): Promise<UserAddressResponse> {
    const response = await apiClient.get<UserAddressResponse>(`${API_ENDPOINTS.addresses.list}${id}`)
    return response.data
  },

  /**
   * Update an address
   */
  async updateAddress(id: string, data: UserAddressUpdate): Promise<UserAddressResponse> {
    const response = await apiClient.put<UserAddressResponse>(`${API_ENDPOINTS.addresses.list}${id}`, data)
    return response.data
  },

  /**
   * Set address as default
   */
  async setDefaultAddress(id: string): Promise<UserAddressResponse> {
    const response = await apiClient.put<UserAddressResponse>(`${API_ENDPOINTS.addresses.list}${id}/set-default`)
    return response.data
  },

  /**
   * Delete an address
   */
  async deleteAddress(id: string): Promise<void> {
    await apiClient.delete(`${API_ENDPOINTS.addresses.list}${id}`)
  },
}
