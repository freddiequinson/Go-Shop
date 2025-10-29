/**
 * Orders Service
 * Handles order operations
 */

import apiClient from '../client'
import { API_ENDPOINTS } from '../config'
import type { OrderCreate, OrderResponse, OrderStatusUpdate, OrderStats } from '@/lib/types'

export const ordersService = {
  /**
   * Create new order from cart
   */
  async createOrder(data: OrderCreate): Promise<OrderResponse> {
    const response = await apiClient.post<OrderResponse>(API_ENDPOINTS.orders.create, data)
    return response.data
  },

  /**
   * Get user's orders
   */
  async getOrders(params?: { skip?: number; limit?: number; status?: string }): Promise<OrderResponse[]> {
    const response = await apiClient.get<OrderResponse[]>(API_ENDPOINTS.orders.list, { params })
    return response.data
  },

  /**
   * Get order by ID
   */
  async getOrder(id: number): Promise<OrderResponse> {
    const response = await apiClient.get<OrderResponse>(API_ENDPOINTS.orders.detail(id))
    return response.data
  },

  /**
   * Update order status (seller/admin only)
   */
  async updateOrderStatus(id: number, data: OrderStatusUpdate): Promise<OrderResponse> {
    const response = await apiClient.put<OrderResponse>(API_ENDPOINTS.orders.updateStatus(id), data)
    return response.data
  },

  /**
   * Get order statistics
   */
  async getOrderStats(): Promise<OrderStats> {
    const response = await apiClient.get<OrderStats>(API_ENDPOINTS.orders.stats)
    return response.data
  },
}
