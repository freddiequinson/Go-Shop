"use client"

/**
 * Cart Hook
 * Manages shopping cart state with backend integration
 */

import { useState, useEffect } from 'react'
import { cartService } from '@/lib/api/services'
import type { CartResponse, AddToCartRequest, UpdateCartItemRequest } from '@/lib/types'
import { handleApiError } from '@/lib/api/client'
import { useAuth } from '@/lib/contexts/auth-context'

export function useCart() {
  const [cart, setCart] = useState<CartResponse | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { isAuthenticated } = useAuth()

  // Fetch cart on mount if authenticated
  useEffect(() => {
    if (isAuthenticated) {
      fetchCart()
    }
  }, [isAuthenticated])

  const fetchCart = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const data = await cartService.getCart()
      setCart(data)
    } catch (err) {
      const errorMessage = handleApiError(err)
      setError(errorMessage)
      console.error('Fetch cart error:', errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const addToCart = async (productId: number, quantity: number) => {
    try {
      setIsLoading(true)
      setError(null)
      const data: AddToCartRequest = { product_id: productId, quantity }
      const updatedCart = await cartService.addToCart(data)
      setCart(updatedCart)
      return updatedCart
    } catch (err) {
      const errorMessage = handleApiError(err)
      setError(errorMessage)
      throw new Error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const updateCartItem = async (productId: number, quantity: number) => {
    try {
      setIsLoading(true)
      setError(null)
      const data: UpdateCartItemRequest = { quantity }
      const updatedCart = await cartService.updateCartItem(productId, data)
      setCart(updatedCart)
      return updatedCart
    } catch (err) {
      const errorMessage = handleApiError(err)
      setError(errorMessage)
      throw new Error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const removeFromCart = async (productId: number) => {
    try {
      setIsLoading(true)
      setError(null)
      const updatedCart = await cartService.removeFromCart(productId)
      setCart(updatedCart)
      return updatedCart
    } catch (err) {
      const errorMessage = handleApiError(err)
      setError(errorMessage)
      throw new Error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const clearCart = async () => {
    try {
      setIsLoading(true)
      setError(null)
      await cartService.clearCart()
      setCart(null)
    } catch (err) {
      const errorMessage = handleApiError(err)
      setError(errorMessage)
      throw new Error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  return {
    cart,
    items: cart?.items || [],
    totalItems: cart?.total_items || 0,
    totalAmount: cart?.total_amount || 0,
    isLoading,
    error,
    fetchCart,
    addToCart,
    updateCartItem,
    removeFromCart,
    clearCart,
  }
}
