/**
 * Order Service
 * Handles order-related API calls
 */

import apiClient, { handleApiError } from '@/lib/api/client';
import type { Order, PaginatedResponse } from '@/types';

interface CreateOrderData {
  delivery_address_id?: string;
  delivery_date?: string;
  delivery_time_slot?: string;
  payment_method: 'WALLET' | 'CARD' | 'CASH';
  notes?: string;
}

class OrderService {
  /**
   * Create new order
   */
  async createOrder(data: CreateOrderData): Promise<Order> {
    try {
      const response = await apiClient.post<Order>('/orders/', data);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Get user's orders
   */
  async getOrders(params?: {
    page?: number;
    size?: number;
    status?: string;
  }): Promise<PaginatedResponse<Order>> {
    try {
      const response = await apiClient.get<PaginatedResponse<Order>>('/orders/', {
        params,
      });
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Get order by ID
   */
  async getOrder(id: number): Promise<Order> {
    try {
      const response = await apiClient.get<Order>(`/orders/${id}`);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Cancel order
   */
  async cancelOrder(id: number): Promise<Order> {
    try {
      const response = await apiClient.put<Order>(`/orders/${id}/status`, {
        status: 'CANCELLED',
      });
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }
}

export default new OrderService();
