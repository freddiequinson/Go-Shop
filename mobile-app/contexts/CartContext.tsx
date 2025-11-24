/**
 * Cart Context
 * Manages shopping cart state
 */

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import cartService from '@/services/cart.service';
import type { Cart, CartItem } from '@/types';

interface CartContextType {
  cart: Cart | null;
  items: CartItem[];
  totalItems: number;
  totalPrice: number;
  isLoading: boolean;
  addItem: (productId: number, quantity: number) => Promise<void>;
  updateQuantity: (itemId: number, quantity: number) => Promise<void>;
  removeItem: (itemId: number) => Promise<void>;
  clearCart: () => Promise<void>;
  refreshCart: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<Cart | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const items = cart?.items || [];
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = items.reduce((sum, item) => {
    const product = item.product;
    return product ? sum + (product.price_per_unit_cedis * item.quantity) : sum;
  }, 0);

  const refreshCart = async () => {
    try {
      setIsLoading(true);
      const data = await cartService.getCart();
      setCart(data);
    } catch (error) {
      console.error('Failed to fetch cart:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const addItem = async (productId: number, quantity: number = 1) => {
    try {
      await cartService.addItem(productId, quantity);
      await refreshCart();
    } catch (error) {
      console.error('Failed to add item:', error);
      throw error;
    }
  };

  const updateQuantity = async (itemId: number, quantity: number) => {
    try {
      await cartService.updateItem(itemId, quantity);
      await refreshCart();
    } catch (error) {
      console.error('Failed to update quantity:', error);
      throw error;
    }
  };

  const removeItem = async (itemId: number) => {
    try {
      await cartService.removeItem(itemId);
      await refreshCart();
    } catch (error) {
      console.error('Failed to remove item:', error);
      throw error;
    }
  };

  const clearCart = async () => {
    try {
      await cartService.clearCart();
      setCart(null);
    } catch (error) {
      console.error('Failed to clear cart:', error);
      throw error;
    }
  };

  useEffect(() => {
    refreshCart();
  }, []);

  return (
    <CartContext.Provider
      value={{
        cart,
        items,
        totalItems,
        totalPrice,
        isLoading,
        addItem,
        updateQuantity,
        removeItem,
        clearCart,
        refreshCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
