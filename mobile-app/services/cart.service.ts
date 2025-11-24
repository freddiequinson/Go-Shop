/**
 * Cart Service
 * Handles shopping cart operations
 */

import apiClient, { handleApiError } from '@/lib/api/client';
import type { Cart } from '@/types';

class CartService {
  /**
   * Get user's cart
   */
  async getCart(): Promise<Cart> {
    try {
      const response = await apiClient.get<Cart>('/cart/');
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Add item to cart
   */
  async addItem(productId: number, quantity: number): Promise<Cart> {
    try {
      const response = await apiClient.post<Cart>('/cart/items', {
        product_id: productId,
        quantity,
      });
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Update cart item quantity
   */
  async updateItem(productId: number, quantity: number): Promise<Cart> {
    try {
      const response = await apiClient.put<Cart>(`/cart/items/${productId}`, {
        quantity,
      });
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Remove item from cart
   */
  async removeItem(productId: number): Promise<Cart> {
    try {
      const response = await apiClient.delete<Cart>(`/cart/items/${productId}`);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Clear cart
   */
  async clearCart(): Promise<void> {
    try {
      await apiClient.delete('/cart/');
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }
}

export default new CartService();
