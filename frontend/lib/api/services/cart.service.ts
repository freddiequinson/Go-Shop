/**
 * Cart Service
 * Handles shopping cart operations
 */

import apiClient from '../client'
import { API_ENDPOINTS } from '../config'
import type { AddToCartRequest, UpdateCartItemRequest, CartResponse, CartSummary } from '@/lib/types'

export const cartService = {
  /**
   * Get user's cart
   */
  async getCart(): Promise<CartResponse> {
    const response = await apiClient.get<CartResponse>(API_ENDPOINTS.cart.get)
    return response.data
  },

  /**
   * Add item to cart
   */
  async addToCart(data: AddToCartRequest): Promise<CartResponse> {
    const response = await apiClient.post<CartResponse>(API_ENDPOINTS.cart.addItem, data)
    return response.data
  },

  /**
   * Update cart item quantity
   */
  async updateCartItem(productId: number, data: UpdateCartItemRequest): Promise<CartResponse> {
    const response = await apiClient.put<CartResponse>(API_ENDPOINTS.cart.updateItem(productId), data)
    return response.data
  },

  /**
   * Remove item from cart
   */
  async removeFromCart(productId: number): Promise<CartResponse> {
    const response = await apiClient.delete<CartResponse>(API_ENDPOINTS.cart.removeItem(productId))
    return response.data
  },

  /**
   * Clear entire cart
   */
  async clearCart(): Promise<void> {
    await apiClient.delete(API_ENDPOINTS.cart.clear)
  },

  /**
   * Get cart summary
   */
  async getCartSummary(): Promise<CartSummary> {
    const response = await apiClient.get<CartSummary>(API_ENDPOINTS.cart.summary)
    return response.data
  },
}
