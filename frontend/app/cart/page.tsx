"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { useAuth } from '@/lib/contexts/auth-context'
import { cartService } from '@/lib/api/services'
import { useToast } from '@/hooks/use-toast'
import { ShoppingBag, User, Loader2, X, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import './cart.css'

interface CartItem {
  id: string
  product_id: string
  quantity: number
  product: {
    id: string
    name: string
    price_per_unit_cedis: number
    unit_type: string
    image_url?: string
    primary_image_url?: string
  }
  subtotal: number
}

export default function CartPage() {
  const router = useRouter()
  const { isAuthenticated, user } = useAuth()
  const { toast } = useToast()
  
  const [items, setItems] = useState<CartItem[]>([])
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set())
  const [isLoading, setIsLoading] = useState(true)
  const [couponCode, setCouponCode] = useState('')
  const [activeCoupons, setActiveCoupons] = useState<string[]>([])
  const [showGiftMessage, setShowGiftMessage] = useState(false)
  const [giftMessage, setGiftMessage] = useState('')
  const [isUpdating, setIsUpdating] = useState(false)

  useEffect(() => {
    if (isAuthenticated) {
      loadCart()
    } else {
      setIsLoading(false)
    }
  }, [isAuthenticated])

  const loadCart = async () => {
    try {
      const cartData = await cartService.getCart()
      console.log('Cart data received:', cartData)
      console.log('Cart items:', cartData.items)
      console.log('First item structure:', cartData.items?.[0])
      
      // Check if items have product data
      if (cartData.items && cartData.items.length > 0) {
        const firstItem = cartData.items[0]
        console.log('First item has product?', !!firstItem.product)
        console.log('First item product_id:', firstItem.product_id)
      }
      
      setItems(cartData.items || [])
      // Select all items by default
      setSelectedItems(new Set(cartData.items?.map((item: CartItem) => item.id) || []))
    } catch (error) {
      console.error('Failed to load cart:', error)
      toast({
        title: 'Error',
        description: 'Failed to load cart. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const updateQuantity = async (productId: string, newQuantity: number) => {
    if (newQuantity < 1) return
    
    setIsUpdating(true)
    try {
      await cartService.updateCartItem(productId, { quantity: newQuantity })
      await loadCart()
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update quantity',
        variant: 'destructive',
      })
    } finally {
      setIsUpdating(false)
    }
  }

  const removeItem = async (productId: string) => {
    setIsUpdating(true)
    try {
      await cartService.removeFromCart(productId)
      await loadCart()
      toast({
        title: 'Success',
        description: 'Item removed from cart',
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to remove item',
        variant: 'destructive',
      })
    } finally {
      setIsUpdating(false)
    }
  }

  const clearCart = async () => {
    if (!confirm('Are you sure you want to clear your cart?')) return
    
    setIsUpdating(true)
    try {
      await cartService.clearCart()
      setItems([])
      setSelectedItems(new Set())
      toast({
        title: 'Success',
        description: 'Cart cleared',
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to clear cart',
        variant: 'destructive',
      })
    } finally {
      setIsUpdating(false)
    }
  }

  const toggleSelectAll = () => {
    if (selectedItems.size === items.length) {
      setSelectedItems(new Set())
    } else {
      setSelectedItems(new Set(items.map(item => item.id)))
    }
  }

  const toggleSelectItem = (itemId: string) => {
    const newSelected = new Set(selectedItems)
    if (newSelected.has(itemId)) {
      newSelected.delete(itemId)
    } else {
      newSelected.add(itemId)
    }
    setSelectedItems(newSelected)
  }

  const applyCoupon = () => {
    if (!couponCode.trim()) return
    
    // TODO: Integrate with gift card API
    setActiveCoupons([...activeCoupons, couponCode])
    setCouponCode('')
    toast({
      title: 'Coupon Applied',
      description: `Coupon "${couponCode}" has been applied`,
    })
  }

  const removeCoupon = (coupon: string) => {
    setActiveCoupons(activeCoupons.filter(c => c !== coupon))
  }

  const calculateSubtotal = () => {
    return items
      .filter(item => selectedItems.has(item.id))
      .reduce((sum, item) => sum + (item.product.price_per_unit_cedis * item.quantity), 0) / 100
  }

  const calculateTotal = () => {
    const subtotal = calculateSubtotal()
    const giftWrapFee = showGiftMessage ? 20 : 0
    const couponDiscount = activeCoupons.length * 2.5 // ₵2.50 per coupon
    return subtotal + giftWrapFee - couponDiscount
  }

  const handleCheckout = () => {
    if (selectedItems.size === 0) {
      toast({
        title: 'No items selected',
        description: 'Please select at least one item to checkout',
        variant: 'destructive',
      })
      return
    }
    router.push('/checkout')
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F4F2E6] flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-[#303A4D]" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#F4F2E6]">
        <nav className="bg-[#FED141] px-4 md:px-8 py-4 md:py-6">
          <div className="max-w-7xl mx-auto flex items-center justify-between relative">
            <Link href="/shop" className="hidden md:block">
              <button className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#303A4D] text-white hover:bg-[#3B4559] transition-all duration-200 text-sm md:text-base font-medium shadow-sm hover:shadow-md">
                <ArrowLeft className="w-4 h-4" />
                <span>Continue Shopping</span>
              </button>
            </Link>
            <Link href="/" className="md:absolute md:left-1/2 md:-translate-x-1/2">
              <Image
                src="/images/logo.png"
                alt="go-shop"
                width={80}
                height={25}
                className="w-20 md:w-24 object-contain"
              />
            </Link>
            <Link href="/login">
              <button className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-[#303A4D] flex items-center justify-center hover:bg-[#3B4559] transition-all">
                <User className="w-4 h-4 md:w-5 md:h-5 text-white" />
              </button>
            </Link>
          </div>
        </nav>
        <div className="flex flex-col items-center justify-center px-6 py-16 md:py-24">
          <div className="max-w-md w-full bg-white rounded-3xl p-8 md:p-12 shadow-xl text-center">
            <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-[#FED141]/20 flex items-center justify-center">
              <ShoppingBag className="w-12 h-12 text-[#303A4D]" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-[#303A4D] mb-3">Sign in to view your cart</h1>
            <p className="text-lg text-[#303A4D]/70 mb-8">Access your saved items and checkout with ease</p>
            <Link href="/login" className="block">
              <Button className="w-full bg-[#303A4D] hover:bg-[#3B4559] text-white rounded-full py-6 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-200">
                Sign In
              </Button>
            </Link>
            <p className="mt-6 text-sm text-[#303A4D]/60">
              Don't have an account?{' '}
              <Link href="/signup" className="text-[#303A4D] font-semibold hover:text-[#FED141] transition-colors">
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-[#F4F2E6]">
        <nav className="bg-[#FED141] px-4 md:px-8 py-4 md:py-6">
          <div className="max-w-7xl mx-auto flex items-center justify-between relative">
            <Link href="/shop" className="hidden md:block">
              <button className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#303A4D] text-white hover:bg-[#3B4559] transition-all duration-200 text-sm md:text-base font-medium shadow-sm hover:shadow-md">
                <ArrowLeft className="w-4 h-4" />
                <span>Continue Shopping</span>
              </button>
            </Link>
            <Link href="/" className="md:absolute md:left-1/2 md:-translate-x-1/2">
              <Image
                src="/images/logo.png"
                alt="go-shop"
                width={80}
                height={25}
                className="w-20 md:w-24 object-contain"
              />
            </Link>
            <Link href={isAuthenticated ? "/profile" : "/login"}>
              <button className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-[#303A4D] flex items-center justify-center overflow-hidden relative cursor-pointer hover:bg-[#3B4559] transition-all">
                {isAuthenticated && user?.profile_picture_url ? (
                  <img
                    src={user.profile_picture_url}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="w-4 h-4 md:w-5 md:h-5 text-white" />
                )}
              </button>
            </Link>
          </div>
        </nav>
        <div className="flex flex-col items-center justify-center px-6 py-16 md:py-24">
          <div className="max-w-md w-full bg-white rounded-3xl p-8 md:p-12 shadow-xl text-center">
            <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-[#FED141]/20 flex items-center justify-center">
              <ShoppingBag className="w-12 h-12 text-[#303A4D]/60" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-[#303A4D] mb-3">Your cart is empty</h1>
            <p className="text-lg text-[#303A4D]/70 mb-8">Add some fresh groceries to get started</p>
            <Link href="/shop" className="block">
              <Button className="w-full bg-[#303A4D] hover:bg-[#3B4559] text-white rounded-full py-6 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-200">
                Start Shopping
              </Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F4F2E6]">
      {/* Navigation */}
      <nav className="bg-[#FED141] px-4 md:px-8 py-4 md:py-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between relative">
          <Link href="/shop" className="hidden md:block">
            <button className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#303A4D] text-white hover:bg-[#3B4559] transition-all duration-200 text-sm md:text-base font-medium shadow-sm hover:shadow-md">
              <ArrowLeft className="w-4 h-4" />
              <span>Continue Shopping</span>
            </button>
          </Link>
          <Link href="/" className="md:absolute md:left-1/2 md:-translate-x-1/2">
            <Image
              src="/images/logo.png"
              alt="go-shop"
              width={80}
              height={25}
              className="w-20 md:w-24 object-contain"
            />
          </Link>
          <Link href={isAuthenticated ? "/profile" : "/login"}>
            <button className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-[#303A4D] flex items-center justify-center overflow-hidden relative cursor-pointer">
              {isAuthenticated && user?.profile_picture_url ? (
                <img
                  src={user.profile_picture_url}
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              ) : (
                <User className="w-4 h-4 md:w-5 md:h-5 text-white" />
              )}
            </button>
          </Link>
        </div>
      </nav>

      {/* Page Title */}
      <div className="w-full mx-auto px-4 md:px-6 py-6 md:py-8">
        <h1 className="text-3xl md:text-5xl font-bold text-[#303A4D]">
          Your Cart. <span className="text-[#FED141]">Go-Shop</span>
        </h1>
        <p className="text-sm md:text-base text-[#303A4D]/60 mt-2">{items.length} {items.length === 1 ? 'item' : 'items'} in your cart</p>
      </div>

      {/* Cart Section */}
      <section className="cart-section">
        <div className="cart-container">
          {/* Cart Main */}
          <div className="cart-main">
            {/* Cart Header */}
            <div className="cart-header">
              <div className="cart-select-all">
                <input
                  type="checkbox"
                  id="select-all"
                  checked={selectedItems.size === items.length}
                  onChange={toggleSelectAll}
                />
                <label htmlFor="select-all">
                  {selectedItems.size}/{items.length} items selected
                </label>
              </div>
              <div className="cart-actions">
                <button className="link-btn" type="button" onClick={clearCart} disabled={isUpdating}>
                  Clear Cart
                </button>
              </div>
            </div>

            {/* Cart Items */}
            <ul className="cart-list">
              {items.map((item) => {
                // Safety check for product data
                if (!item.product) {
                  console.error('Cart item missing product data:', item)
                  return null
                }
                
                return (
                  <li key={item.id} className="cart-item">
                    <div className="ci-left">
                      <input
                        className="ci-check"
                        type="checkbox"
                        checked={selectedItems.has(item.id)}
                        onChange={() => toggleSelectItem(item.id)}
                      />
                      <div className="ci-thumb">
                        <img
                          src={item.product.primary_image_url || item.product.image_url || '/placeholder.svg'}
                          alt={item.product.name}
                        />
                      </div>
                      <div className="ci-info">
                        <div className="ci-title">{item.product.name}</div>
                        <div className="ci-meta">
                          <span>{item.product.unit_type}</span>
                          <span>Express delivery in <strong>3 days</strong></span>
                        </div>
                        <button
                          className="ci-remove"
                          type="button"
                          onClick={() => removeItem(item.product_id)}
                          disabled={isUpdating}
                        >
                          ×
                        </button>
                      </div>
                    </div>
                    <div className="ci-right">
                      <div className="ci-price">
                        GH₵{((item.product.price_per_unit_cedis * item.quantity) / 100).toFixed(2)}
                      </div>
                      <div className="ci-qty">
                        <button
                          type="button"
                          className="qty-btn"
                          onClick={() => updateQuantity(item.product_id, item.quantity - 1)}
                          disabled={isUpdating || item.quantity <= 1}
                        >
                          −
                        </button>
                        <input type="text" value={item.quantity} readOnly />
                        <button
                          type="button"
                          className="qty-btn"
                          onClick={() => updateQuantity(item.product_id, item.quantity + 1)}
                          disabled={isUpdating}
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </li>
                )
              })}
            </ul>
          </div>

          {/* Cart Summary */}
          <aside className="cart-summary">
            {/* Coupons */}
            <div className="cs-card cs-coupon">
              <div className="cs-row">
                <div className="cs-title">Coupons & Gift Cards</div>
                <div className="coupon-input-container">
                  <input
                    type="text"
                    id="coupon-input"
                    placeholder="Enter code"
                    className="coupon-input"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && applyCoupon()}
                  />
                  <button type="button" onClick={applyCoupon} className="link-btn">
                    Apply
                  </button>
                </div>
              </div>
              <div className="active-coupons">
                {activeCoupons.map((coupon) => (
                  <div key={coupon} className="active-coupon">
                    <span>{coupon}</span>
                    <button type="button" onClick={() => removeCoupon(coupon)} className="remove-coupon">
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Gift Wrapping */}
            <div className="cs-card cs-gift">
              <div className="cs-title">Gifting</div>
              <div className="cs-gift-row">
                <div className="cs-gift-text">
                  <div className="cs-gift-title">Buying for a loved one?</div>
                  <div className="cs-gift-sub">Send personalized message at ₵20</div>
                  <button
                    type="button"
                    onClick={() => setShowGiftMessage(!showGiftMessage)}
                    className="link-btn"
                  >
                    {showGiftMessage ? 'Remove gift wrap' : 'Add gift wrap'}
                  </button>
                </div>
                <div className="cs-gift-art">🎁</div>
              </div>
              {showGiftMessage && (
                <div className="gift-message-container">
                  <textarea
                    id="gift-message"
                    placeholder="Enter your gift message..."
                    maxLength={200}
                    value={giftMessage}
                    onChange={(e) => setGiftMessage(e.target.value)}
                  />
                  <div className="char-count">
                    <span id="char-count">{giftMessage.length}</span>/200
                  </div>
                </div>
              )}
            </div>

            {/* Price Details */}
            <div className="cs-card cs-price">
              <div className="cs-title">Price Details</div>
              <div className="cs-line">
                <span>{selectedItems.size} item{selectedItems.size !== 1 ? 's' : ''}</span>
                <span>GH₵{calculateSubtotal().toFixed(2)}</span>
              </div>
              {activeCoupons.length > 0 && (
                <div className="cs-line green">
                  <span>Coupon discount</span>
                  <span>−GH₵{(activeCoupons.length * 2.5).toFixed(2)}</span>
                </div>
              )}
              {showGiftMessage && (
                <div className="cs-line">
                  <span>Gift wrap</span>
                  <span>GH₵20.00</span>
                </div>
              )}
              <div className="cs-line">
                <span>Delivery Charges</span>
                <span className="text-gray-600 text-sm">Calculated at checkout</span>
              </div>
              <div className="cs-total">
                <span>Total Amount</span>
                <span>GH₵{calculateTotal().toFixed(2)}</span>
              </div>
              <button
                className="cs-place hover:shadow-lg transition-all duration-200"
                type="button"
                onClick={handleCheckout}
                disabled={selectedItems.size === 0 || isUpdating}
              >
                {isUpdating ? 'Processing...' : 'Place order →'}
              </button>
            </div>
          </aside>
        </div>
      </section>
    </div>
  )
}
