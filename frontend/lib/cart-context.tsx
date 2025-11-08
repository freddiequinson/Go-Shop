"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"
import { cartService } from "./api/services"

export interface CartItem {
  id: number
  name: string
  price: number
  unit: string
  vendor: string
  image: string
  quantity: number
}

interface CartContextType {
  items: CartItem[]
  addItem: (item: Omit<CartItem, "quantity">) => void
  removeItem: (id: number) => void
  updateQuantity: (id: number, quantity: number) => void
  clearCart: () => void
  totalItems: number
  totalPrice: number
  refreshCart: () => Promise<void>
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Fetch cart from backend on mount
  useEffect(() => {
    refreshCart()
  }, [])

  const refreshCart = async () => {
    try {
      // Check if user is authenticated by checking for token
      const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null
      if (!token) {
        setItems([])
        setIsLoading(false)
        return
      }

      const cartData = await cartService.getCart()
      
      // Transform backend cart items to match our CartItem interface
      const transformedItems: CartItem[] = cartData.items.map((item: any) => ({
        id: Number(item.product_id),
        name: item.product?.name || item.product_name || 'Unknown Product',
        price: Number(item.price_per_unit_cedis || item.price_per_unit || 0) / 100, // Convert from cents
        unit: item.product?.unit_type || 'kg',
        vendor: 'GoShop',
        image: item.product?.image_url || item.product?.primary_image_url || '/placeholder.svg',
        quantity: Number(item.quantity)
      }))
      
      setItems(transformedItems)
    } catch (error) {
      console.error('Failed to fetch cart:', error)
      setItems([])
    } finally {
      setIsLoading(false)
    }
  }

  const addItem = (item: Omit<CartItem, "quantity">) => {
    setItems((prevItems) => {
      const existingItem = prevItems.find((i) => i.id === item.id)
      if (existingItem) {
        return prevItems.map((i) => (i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i))
      }
      return [...prevItems, { ...item, quantity: 1 }]
    })
  }

  const removeItem = (id: number) => {
    setItems((prevItems) => prevItems.filter((item) => item.id !== id))
  }

  const updateQuantity = (id: number, quantity: number) => {
    if (quantity <= 0) {
      removeItem(id)
      return
    }
    setItems((prevItems) => prevItems.map((item) => (item.id === id ? { ...item, quantity } : item)))
  }

  const clearCart = () => {
    setItems([])
  }

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0)
  const totalPrice = items.reduce((sum, item) => sum + item.price * item.quantity, 0)

  return (
    <CartContext.Provider value={{ items, addItem, removeItem, updateQuantity, clearCart, totalItems, totalPrice, refreshCart }}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider")
  }
  return context
}
