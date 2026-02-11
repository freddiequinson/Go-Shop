"use client"

import { Button } from "@/components/ui/button"
import { ArrowRight, User, CreditCard, Calendar, MapPin, Loader2, Tag, X, Truck, Wallet, CheckCircle2 } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useState, useEffect } from "react"
import { useAuth } from '@/lib/contexts/auth-context'
import { useToast } from '@/components/ui/use-toast'
import apiClient from '@/lib/api/client'
import { couponService } from '@/lib/api/services/coupon.service'
import { giftCardService } from '@/lib/api/services/giftcard.service'
import OpenStreetMapAddressPicker from '@/components/OpenStreetMapAddressPicker'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useRouter } from "next/navigation"
import type { UserAddressResponse } from "@/lib/types"
import { cartService } from '@/lib/api/services/cart.service'
import { userAddressesService } from '@/lib/api/services/userAddresses.service'
import { paymentsService } from '@/lib/api/services/payments.service'

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

export default function CheckoutPage() {
  const { isAuthenticated, user } = useAuth()
  const { toast } = useToast()
  const router = useRouter()
  
  const [items, setItems] = useState<CartItem[]>([])
  const [addresses, setAddresses] = useState<UserAddressResponse[]>([])
  const [selectedAddressId, setSelectedAddressId] = useState<string>("")
  const [deliveryDates, setDeliveryDates] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isPlacingOrder, setIsPlacingOrder] = useState(false)
  const [orderCreated, setOrderCreated] = useState(false)
  const [createdOrderId, setCreatedOrderId] = useState<string | null>(null)
  const [orderTotal, setOrderTotal] = useState(0)
  const [paymentMethod, setPaymentMethod] = useState<'wallet' | 'paystack'>('wallet')
  const [walletBalance, setWalletBalance] = useState(0)
  const [isProcessingPayment, setIsProcessingPayment] = useState(false)
  const [selectedDateId, setSelectedDateId] = useState<string>('')
  const [showAddAddressModal, setShowAddAddressModal] = useState(false)
  const [newAddress, setNewAddress] = useState({
    label: '',
    street: '',
    area: '',
    city: '',
    region: '',
    phone: '',
    latitude: '',
    longitude: '',
    additional_info: ''
  })
  const [isSavingAddress, setIsSavingAddress] = useState(false)
  const [guestInfo, setGuestInfo] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
  })

  // Delivery pricing state
  const [deliveryPrice, setDeliveryPrice] = useState(0)
  const [deliveryDetails, setDeliveryDetails] = useState<any>(null)
  const [isFreeDelivery, setIsFreeDelivery] = useState(false)
  const [isCalculatingDelivery, setIsCalculatingDelivery] = useState(false)

  // Coupon state
  const [couponCode, setCouponCode] = useState("")
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null)
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false)
  const [couponDiscount, setCouponDiscount] = useState(0)

  useEffect(() => {
    loadCheckoutData()
  }, [isAuthenticated])

  // Calculate delivery when address changes
  useEffect(() => {
    if (selectedAddressId && isAuthenticated) {
      calculateDeliveryPrice(selectedAddressId)
    }
  }, [selectedAddressId])

  const loadCheckoutData = async () => {
    try {
      setIsLoading(true)
      
      // Load delivery dates (public endpoint)
      const datesResponse = await apiClient.get("/delivery-dates/available")
      setDeliveryDates(datesResponse.data || [])
      
      // Load cart items
      if (isAuthenticated) {
        const cartData = await cartService.getCart()
        setItems((cartData.items || []) as any)  // Type assertion for now
        
        // Load user addresses
        const addressesData = await userAddressesService.getAddresses()
        // addressesData is UserAddressListResponse which has addresses array
        const addressList = (addressesData as any).addresses || addressesData || []
        setAddresses(addressList)
        
        // Load wallet balance
        try {
          const wallet = await paymentsService.getWallet()
          setWalletBalance(Number(wallet?.balance || 0))
        } catch (error) {
          console.error('Failed to load wallet:', error)
        }
        
        // Auto-select default address
        const defaultAddr = addressList.find((addr: UserAddressResponse) => addr.is_default)
        if (defaultAddr) {
          setSelectedAddressId(defaultAddr.id)
        }
      }
    } catch (error) {
      console.error('Failed to load checkout data:', error)
      toast({
        title: 'Error',
        description: 'Failed to load checkout data',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const calculateDeliveryPrice = async (addressId: string) => {
    const address = addresses.find(a => a.id === addressId)
    if (!address || !address.latitude || !address.longitude) {
      setDeliveryPrice(10) // Default fallback
      return
    }
    
    try {
      setIsCalculatingDelivery(true)
      const response = await apiClient.post("/delivery-settings/calculate-price", {
        destination_latitude: address.latitude,
        destination_longitude: address.longitude,
        zone_name: null
      })
      
      setDeliveryDetails(response.data)
      
      // Check if coupon provides free delivery
      if (appliedCoupon?.benefits?.free_delivery) {
        setDeliveryPrice(0)
        setIsFreeDelivery(true)
      } else if (appliedCoupon?.benefits?.delivery_discount) {
        const discountedPrice = Math.max(0, response.data.price - appliedCoupon.benefits.delivery_discount)
        setDeliveryPrice(discountedPrice)
        setIsFreeDelivery(discountedPrice === 0)
      } else {
        setDeliveryPrice(response.data.is_free_delivery ? 0 : response.data.price)
        setIsFreeDelivery(response.data.is_free_delivery)
      }
      
      if (response.data.is_free_delivery && !appliedCoupon) {
        toast({
          title: "🎉 FREE DELIVERY!",
          description: "You're within the free delivery radius"
        })
      }
    } catch (error: any) {
      console.error('Delivery calculation failed:', error)
      setDeliveryPrice(10) // Fallback
    } finally {
      setIsCalculatingDelivery(false)
    }
  }

  const applyCoupon = async () => {
    if (!couponCode.trim()) {
      toast({
        title: "Empty Code",
        description: "Please enter a coupon or gift card code",
        variant: "destructive"
      })
      return
    }
    
    setIsApplyingCoupon(true)
    try {
      // First, try as a coupon
      const subtotal = calculateTotal()
      const couponResponse = await couponService.validateCoupon({
        code: couponCode.toUpperCase(),
        order_amount: subtotal,
        user_id: user?.id
      })
      
      if (couponResponse.valid && couponResponse.benefits) {
        // It's a valid coupon
        setAppliedCoupon(couponResponse)
        const benefits = couponResponse.benefits
        
        // Calculate discount
        if (benefits.discount_type === 'percentage') {
          let discount = (subtotal * benefits.discount_value) / 100
          if (benefits.max_discount && discount > benefits.max_discount) {
            discount = benefits.max_discount
          }
          setCouponDiscount(discount)
        } else if (benefits.discount_type === 'fixed') {
          setCouponDiscount(benefits.discount_value)
        }
        
        toast({
          title: "Coupon Applied! 🎉",
          description: couponResponse.message
        })
      } else {
        // Not a valid coupon, try as gift card
        const pin = prompt('This appears to be a gift card. Please enter the PIN:')
        
        if (!pin) {
          toast({
            title: "PIN Required",
            description: "Gift cards require a PIN to redeem",
            variant: "destructive"
          })
          setIsApplyingCoupon(false)
          return
        }
        
        try {
          const giftCardResponse = await giftCardService.redeemGiftCard({
            code: couponCode.toUpperCase(),
            pin: pin
          })
          
          if (giftCardResponse.success) {
            setCouponCode('')
            toast({
              title: "Gift Card Redeemed! 🎁",
              description: `GH₵${(giftCardResponse.amount_credited || 0) / 100} has been added to your wallet`,
            })
          } else {
            toast({
              title: "Invalid Gift Card",
              description: giftCardResponse.message || 'This gift card code is not valid',
              variant: "destructive"
            })
          }
        } catch (giftCardError: any) {
          console.error('Gift card redemption error:', giftCardError)
          let errorMessage = 'Invalid gift card code or PIN'
          
          // Handle Pydantic validation errors (array format)
          if (Array.isArray(giftCardError.response?.data?.detail)) {
            errorMessage = giftCardError.response.data.detail
              .map((err: any) => err.msg || err.message)
              .join(', ')
          } 
          // Handle string error messages
          else if (typeof giftCardError.response?.data?.detail === 'string') {
            errorMessage = giftCardError.response.data.detail
          }
          // Handle message field
          else if (giftCardError.response?.data?.message) {
            errorMessage = giftCardError.response.data.message
          }
          
          setIsApplyingCoupon(false)
          
          // Show toast immediately without setTimeout
          toast({
            title: "Gift Card Error",
            description: errorMessage,
            variant: "destructive"
          })
          
          console.log('Toast called with:', { title: "Gift Card Error", description: errorMessage })
          
          return // Exit early to prevent outer catch
        }
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.detail || "Failed to validate code. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsApplyingCoupon(false)
    }
  }

  const removeCoupon = () => {
    setAppliedCoupon(null)
    setCouponCode("")
    setCouponDiscount(0)
    
    // Recalculate delivery
    if (selectedAddressId) {
      calculateDeliveryPrice(selectedAddressId)
    }
    
    toast({
      title: "Coupon Removed",
      description: "Coupon has been removed from your order"
    })
  }

  const paymentMethods = [
    { id: "mtn-momo", name: "MTN Mobile Money", image: "/mtnmomo.jpg" },
    { id: "telecel-cash", name: "Telecel Cash", image: "/tcash.jpg" },
    { id: "at-money", name: "AT Money", image: "/atmoney.webp" },
    { id: "card", name: "Debit/Credit Card", image: "/paystack.png" },
  ]

  const calculateTotal = () => {
    return items.reduce((sum, item) => sum + (item.subtotal || 0), 0)
  }

  const calculateFinalTotal = () => {
    const subtotal = calculateTotal()
    const total = subtotal - couponDiscount + deliveryPrice
    return Math.max(0, total)
  }

  const getTotalSavings = () => {
    let savings = couponDiscount
    if (isFreeDelivery && deliveryDetails?.price) {
      savings += deliveryDetails.price
    }
    return savings
  }

  const handlePlaceOrder = async () => {
    // Validation with detailed error messages
    if (isAuthenticated && !selectedAddressId) {
      const message = 'Please select a delivery address before placing your order'
      toast({
        title: '❌ Address Required',
        description: message,
        variant: 'destructive',
      })
      // Scroll to address section
      document.getElementById('address-section')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      return
    }
    
    if (!isAuthenticated && (!guestInfo.name || !guestInfo.phone || !guestInfo.address)) {
      const missingFields = []
      if (!guestInfo.name) missingFields.push('Name')
      if (!guestInfo.phone) missingFields.push('Phone')
      if (!guestInfo.address) missingFields.push('Address')
      
      const message = `Please fill in: ${missingFields.join(', ')}`
      toast({
        title: '❌ Information Required',
        description: message,
        variant: 'destructive',
      })
      // Scroll to guest info section
      document.getElementById('guest-info-section')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      return
    }
    
    if (!selectedDateId) {
      const message = 'Please select a delivery date before placing your order'
      toast({
        title: '❌ Delivery Date Required',
        description: message,
        variant: 'destructive',
      })
      // Scroll to delivery date section
      document.getElementById('delivery-date-section')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      return
    }

    try {
      setIsPlacingOrder(true)
      
      // Show payment options immediately (optimistic UI)
      setOrderCreated(true)
      setOrderTotal(calculateFinalTotal())
      
      // Get selected address details
      const selectedAddress = addresses.find(a => a.id === selectedAddressId)
      
      const orderData = {
        delivery_address: selectedAddress ? {
          street: selectedAddress.street,
          area: selectedAddress.area,
          city: selectedAddress.city,
          region: selectedAddress.region,
          phone: selectedAddress.phone || '',
          latitude: selectedAddress.latitude || null,
          longitude: selectedAddress.longitude || null,
          additional_info: selectedAddress.additional_info
        } : null,
        delivery_notes: null,
        
        // Delivery info
        delivery_price: deliveryPrice,
        delivery_method: deliveryDetails?.pricing_method || 'flat',
        delivery_distance: deliveryDetails?.distance || null,
        is_free_delivery: isFreeDelivery,
        
        // Coupon info
        coupon_code: appliedCoupon?.code || null,
        coupon_discount: couponDiscount
      }
      
      // Create order in background (status will be PENDING_PAYMENT)
      const response = await apiClient.post("/orders/", orderData)
      const orderId = response.data.id
      
      // Update with actual order ID
      setCreatedOrderId(orderId)
      setOrderTotal(response.data.total || calculateFinalTotal())
      
    } catch (error: any) {
      console.error('Failed to place order:', error)
      // Revert optimistic UI
      setOrderCreated(false)
      toast({
        title: 'Error',
        description: error.response?.data?.detail || 'Failed to create order',
        variant: 'destructive',
      })
    } finally {
      setIsPlacingOrder(false)
    }
  }

  const handlePayment = async () => {
    if (!createdOrderId) return
    
    setIsProcessingPayment(true)
    
    try {
      if (paymentMethod === 'wallet') {
        await handleWalletPayment()
      } else {
        await handlePaystackPayment()
      }
    } catch (error: any) {
      toast({
        title: 'Payment Failed',
        description: error.message || 'Failed to process payment',
        variant: 'destructive'
      })
      setIsProcessingPayment(false)
    }
  }

  const handleWalletPayment = async () => {
    try {
      const response = await apiClient.post(`/orders/${createdOrderId}/pay-with-wallet`)
      
      toast({
        title: 'Payment Successful!',
        description: 'Your order has been confirmed',
      })
      
      // Redirect to order confirmation
      setTimeout(() => {
        router.push(`/orders/${createdOrderId}`)
      }, 1500)
    } catch (error: any) {
      throw new Error(error.response?.data?.detail || 'Wallet payment failed')
    }
  }

  const handlePaystackPayment = async () => {
    try {
      const response = await apiClient.post(`/orders/${createdOrderId}/initialize-payment`, {
        callback_url: `${window.location.origin}/checkout/payment/${createdOrderId}/verify`
      })
      
      if (response.data.authorization_url) {
        // Redirect to Paystack payment page (works better on mobile than window.open)
        window.location.href = response.data.authorization_url
      } else {
        throw new Error('Failed to initialize payment')
      }
    } catch (error: any) {
      throw new Error(error.response?.data?.detail || 'Payment initialization failed')
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F4F2E6] flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-[#303A4D]" />
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-[#F4F2E6]">
        <nav className="bg-[#FED141] px-6 md:px-8 py-6">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <Link href="/shop" className="text-lg font-medium text-[#303A4D] hover:opacity-80">
              ← Continue Shopping
            </Link>
            <Link href="/" className="absolute left-1/2 -translate-x-1/2">
              <Image src="/images/logo.png" alt="go-shop" width={124} height={39} className="w-[80px] h-auto md:w-[124px] object-contain" />
            </Link>
            <Link href={isAuthenticated ? "/profile" : "/login"}>
              <button className="w-12 h-12 rounded-full bg-[#303A4D] flex items-center justify-center overflow-hidden relative cursor-pointer">
                {isAuthenticated && user?.profile_picture_url ? (
                  <img src={user.profile_picture_url} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <User className="w-5 h-5 text-white" />
                )}
              </button>
            </Link>
          </div>
        </nav>
        <div className="flex flex-col items-center justify-center px-6 py-24">
          <h1 className="text-4xl font-bold text-[#303A4D] mb-4">Your cart is empty</h1>
          <p className="text-xl text-[#303A4D]/70 mb-8">Add some items to checkout</p>
          <Link href="/shop">
            <Button className="bg-[#303A4D] hover:bg-[#3B4559]">Start Shopping</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F4F2E6]">
      <nav className="bg-[#FED141] px-6 md:px-8 py-6">
        <div className="w-full mx-auto flex items-center justify-between">
          <Link href="/cart" className="text-lg font-medium text-[#303A4D] hover:opacity-80">
            ← Back to Cart
          </Link>

          <Link href="/" className="absolute left-1/2 -translate-x-1/2">
            <Image src="/images/logo.png" alt="go-shop" width={124} height={39} className="w-[80px] h-auto md:w-[124px] object-contain" />
          </Link>

          <Link href={isAuthenticated ? "/profile" : "/login"}>
            <button className="w-12 h-12 rounded-full bg-[#303A4D] flex items-center justify-center overflow-hidden relative cursor-pointer">
              {isAuthenticated && user?.profile_picture_url ? (
                <img src={user.profile_picture_url} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <User className="w-5 h-5 text-white" />
              )}
            </button>
          </Link>
        </div>
      </nav>

      <div className="w-full mx-auto px-6 md:px-8 py-12">
        <h1 className="text-4xl md:text-5xl font-bold text-[#303A4D] mb-8">Checkout</h1>

        {!isAuthenticated && (
          <div className="bg-[#FED141] rounded-3xl p-6 mb-8 flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-[#303A4D] flex items-center justify-center flex-shrink-0">
              <User className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-[#303A4D] mb-2">Track Your Order</h3>
              <p className="text-[#303A4D]/80 mb-4">
                Log in to track your order status and view order history. You can still checkout as a guest, but you
                won't be able to track your order.
              </p>
              <Link href="/login">
                <Button className="bg-[#303A4D] hover:bg-[#3B4559] text-white rounded-full px-6 py-3 font-bold">
                  Log In
                </Button>
              </Link>
            </div>
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            {/* Delivery Address Selection (Logged In) or Guest Info */}
            {isAuthenticated ? (
              <div id="address-section" className="bg-white rounded-3xl p-8">
                <h2 className="text-2xl font-bold text-[#303A4D] mb-6 flex items-center gap-3">
                  <MapPin className="w-6 h-6" />
                  Select Delivery Address
                </h2>
                <div className="space-y-4">
                  {addresses.length > 0 && (
                    <div className="space-y-3">
                      {addresses.map((address) => (
                        <button
                          key={address.id}
                          onClick={() => setSelectedAddressId(address.id)}
                          className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
                            selectedAddressId === address.id
                              ? "border-[#FED141] bg-[#FED141]/10"
                              : "border-[#F4F2E6] hover:border-[#FED141]/50"
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div>
                              <div className="font-bold text-[#303A4D] mb-1">{address.label}</div>
                              <div className="text-sm text-[#303A4D]/70">
                                {address.street}, {address.area}, {address.city}, {address.region}
                              </div>
                              <div className="text-sm text-[#303A4D]/70 mt-1">
                                Phone: {address.phone}
                              </div>
                            </div>
                            {address.is_default && (
                              <span className="text-xs bg-[#FED141] text-[#303A4D] px-2 py-1 rounded-full font-medium">
                                Default
                              </span>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                  
                  <Button
                    onClick={() => setShowAddAddressModal(true)}
                    variant="outline"
                    className="w-full border-2 border-dashed border-[#FED141] hover:bg-[#FED141]/10 text-[#303A4D]"
                  >
                    <MapPin className="w-4 h-4 mr-2" />
                    Add New Delivery Address
                  </Button>
                </div>
              </div>
            ) : (
              <div id="guest-info-section" className="bg-white rounded-3xl p-8">
                <h2 className="text-2xl font-bold text-[#303A4D] mb-6 flex items-center gap-3">
                  <User className="w-6 h-6" />
                  Customer Information
                </h2>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[#303A4D] mb-2">Full Name *</label>
                    <input
                      type="text"
                      value={guestInfo.name}
                      onChange={(e) => setGuestInfo({ ...guestInfo, name: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border-2 border-[#F4F2E6] focus:border-[#FED141] focus:outline-none"
                      placeholder="John Doe"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#303A4D] mb-2">Phone Number *</label>
                    <input
                      type="tel"
                      value={guestInfo.phone}
                      onChange={(e) => setGuestInfo({ ...guestInfo, phone: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border-2 border-[#F4F2E6] focus:border-[#FED141] focus:outline-none"
                      placeholder="0XX XXX XXXX"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#303A4D] mb-2">Email</label>
                    <input
                      type="email"
                      value={guestInfo.email}
                      onChange={(e) => setGuestInfo({ ...guestInfo, email: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border-2 border-[#F4F2E6] focus:border-[#FED141] focus:outline-none"
                      placeholder="john@example.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#303A4D] mb-2">Delivery Address *</label>
                    <input
                      type="text"
                      value={guestInfo.address}
                      onChange={(e) => setGuestInfo({ ...guestInfo, address: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border-2 border-[#F4F2E6] focus:border-[#FED141] focus:outline-none"
                      placeholder="House number, street, area"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Coupon Section */}
            <div className="bg-white rounded-3xl p-8">
              <h2 className="text-2xl font-bold text-[#303A4D] mb-6 flex items-center gap-3">
                <Tag className="w-6 h-6" />
                Have a Coupon?
              </h2>
              
              {!appliedCoupon ? (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    placeholder="Enter coupon code"
                    className="flex-1 px-4 py-3 rounded-xl border-2 border-[#F4F2E6] focus:border-[#FED141] focus:outline-none uppercase font-mono"
                    disabled={isApplyingCoupon}
                    onKeyPress={(e) => e.key === 'Enter' && applyCoupon()}
                  />
                  <Button
                    onClick={applyCoupon}
                    disabled={isApplyingCoupon || !couponCode.trim()}
                    className="bg-[#303A4D] hover:bg-[#3B4559] px-8"
                  >
                    {isApplyingCoupon ? "Applying..." : "Apply"}
                  </Button>
                </div>
              ) : (
                <div className="bg-green-50 border-2 border-green-200 rounded-xl p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <code className="px-3 py-1 bg-green-100 text-green-800 rounded-lg font-mono text-sm font-bold">
                          {appliedCoupon.benefits.coupon_code}
                        </code>
                        <span className="text-sm font-medium text-green-700">
                          {appliedCoupon.benefits.coupon_name}
                        </span>
                      </div>
                      <p className="text-sm text-green-700 mb-2">
                        {appliedCoupon.benefits.success_message}
                      </p>
                      
                      {appliedCoupon.benefits.free_delivery && (
                        <div className="flex items-center gap-1 text-sm font-bold text-green-800">
                          <Truck className="w-4 h-4" />
                          FREE DELIVERY!
                        </div>
                      )}
                      
                      {appliedCoupon.benefits.product_discount > 0 && (
                        <p className="text-sm text-green-700 mt-1">
                          Discount: GHS {appliedCoupon.benefits.product_discount.toFixed(2)}
                        </p>
                      )}
                    </div>
                    <Button
                      onClick={removeCoupon}
                      variant="ghost"
                      size="sm"
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Delivery Date */}
            <div id="delivery-date-section" className="bg-white rounded-3xl p-8">
              <h2 className="text-2xl font-bold text-[#303A4D] mb-6 flex items-center gap-3">
                <Calendar className="w-6 h-6" />
                Select Delivery Date
              </h2>
              <div className="grid md:grid-cols-3 gap-4">
                {deliveryDates.length === 0 ? (
                  <div className="col-span-3 text-center py-8 text-[#303A4D]/60">
                    No delivery dates available. Please contact support.
                  </div>
                ) : (
                  deliveryDates.map((delivery) => (
                    <button
                      key={delivery.id}
                      onClick={() => setSelectedDateId(delivery.id)}
                      className={`p-6 rounded-2xl border-2 transition-all ${
                        selectedDateId === delivery.id
                          ? "border-[#FED141] bg-[#FED141]/10"
                          : "border-[#F4F2E6] hover:border-[#FED141]/50"
                      }`}
                    >
                      <div className="text-xl font-bold text-[#303A4D] mb-1">{delivery.day_name}</div>
                      <div className="text-sm text-[#303A4D]/60">
                        {new Date(delivery.date).toLocaleDateString('en-US', { 
                          month: 'short', 
                          day: 'numeric', 
                          year: 'numeric' 
                        })}
                      </div>
                      {delivery.slots_remaining !== null && delivery.slots_remaining !== undefined && (
                        <div className="text-xs text-[#303A4D]/50 mt-2">
                          {delivery.slots_remaining} slots left
                        </div>
                      )}
                    </button>
                  ))
                )}
              </div>
            </div>

            {/* Payment Info */}
            <div className="bg-white rounded-3xl p-8">
              <h2 className="text-2xl font-bold text-[#303A4D] mb-6 flex items-center gap-3">
                <CreditCard className="w-6 h-6" />
                Payment
              </h2>
              <div className="bg-[#FED141]/10 border-2 border-[#FED141] rounded-2xl p-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-[#FED141] rounded-full flex items-center justify-center flex-shrink-0">
                    <CreditCard className="w-6 h-6 text-[#303A4D]" />
                  </div>
                  <div>
                    <h3 className="font-bold text-[#303A4D] mb-2">Secure Payment via Paystack</h3>
                    <p className="text-sm text-[#303A4D]/70 mb-3">
                      After placing your order, you'll be redirected to Paystack's secure payment page where you can pay with:
                    </p>
                    <ul className="text-sm text-[#303A4D]/70 space-y-1">
                      <li>• Card (Visa, Mastercard, Verve)</li>
                      <li>• Mobile Money (MTN, Vodafone, AirtelTigo)</li>
                      <li>• Bank Transfer</li>
                      <li>• USSD</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className={`bg-white rounded-3xl p-8 ${!orderCreated ? 'sticky top-8' : ''}`}>
              <h2 className="text-2xl font-bold text-[#303A4D] mb-6">Order Summary</h2>

              <div className="space-y-4 mb-6 max-h-64 overflow-y-auto">
                {items.map((item) => (
                  <div key={item.id} className="flex gap-3">
                    <div className="relative w-16 h-16 flex-shrink-0 rounded-xl overflow-hidden bg-[#F4F2E6]">
                      <Image 
                        src={item.product?.primary_image_url || item.product?.image_url || "/placeholder.svg"} 
                        alt={item.product?.name || "Product"} 
                        fill 
                        className="object-cover" 
                      />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-[#303A4D] text-sm">{item.product?.name}</h4>
                      <p className="text-xs text-[#303A4D]/60">
                        {item.quantity} × GH₵{((item.product?.price_per_unit_cedis || 0) / 100).toFixed(2)}
                      </p>
                    </div>
                    <div className="font-bold text-[#303A4D]">
                      GH₵{((item.subtotal || 0)).toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-3 mb-6 pt-6 border-t-2 border-[#F4F2E6]">
                {/* Subtotal */}
                <div className="flex justify-between text-[#303A4D]">
                  <span>Subtotal ({items.length} items)</span>
                  <span className="font-bold">GH₵{calculateTotal().toFixed(2)}</span>
                </div>
                
                {/* Coupon Discount */}
                {couponDiscount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Coupon Discount</span>
                    <span className="font-bold">-GH₵{couponDiscount.toFixed(2)}</span>
                  </div>
                )}
                
                {/* Delivery */}
                <div className="flex justify-between text-[#303A4D]">
                  <span className="flex items-center gap-2">
                    Delivery
                    {isCalculatingDelivery && (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    )}
                  </span>
                  {isFreeDelivery ? (
                    <span className="font-bold text-[#93C90F]">FREE</span>
                  ) : deliveryPrice > 0 ? (
                    <span className="font-bold">GH₵{deliveryPrice.toFixed(2)}</span>
                  ) : (
                    <span className="text-gray-400 text-sm">Select address</span>
                  )}
                </div>
                
                {deliveryDetails?.distance && (
                  <div className="text-xs text-gray-500 pl-4">
                    Distance: {deliveryDetails.distance.toFixed(1)}km
                  </div>
                )}
                
                {/* Total */}
                <div className="border-t-2 border-[#F4F2E6] pt-3 flex justify-between text-[#303A4D]">
                  <span className="text-xl font-bold">Total</span>
                  <span className="text-2xl font-bold">GH₵{calculateFinalTotal().toFixed(2)}</span>
                </div>
                
                {/* Savings */}
                {getTotalSavings() > 0 && (
                  <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-sm text-green-700 font-medium">
                    🎉 You're saving: GH₵{getTotalSavings().toFixed(2)}!
                  </div>
                )}
              </div>

              {!orderCreated && (
                <>
                  <Button
                    onClick={handlePlaceOrder}
                    disabled={isPlacingOrder}
                    size="lg"
                    className="w-full bg-[#303A4D] hover:bg-[#3B4559] text-white rounded-full py-6 text-lg font-bold h-auto disabled:opacity-50"
                  >
                    {isPlacingOrder ? (
                      <>
                        <Loader2 className="mr-2 w-5 h-5 animate-spin" />
                        Placing Order...
                      </>
                    ) : (
                      <>
                        Place Order
                        <ArrowRight className="ml-2 w-5 h-5" />
                      </>
                    )}
                  </Button>

                  <div className="text-center text-xs text-[#303A4D]/60 mt-4">
                    <p>By placing your order, you agree to our terms and conditions</p>
                  </div>
                </>
              )}
            </div>

            {/* Payment Method Selection - Shows after order is created */}
            {orderCreated && (
              <div className="bg-white rounded-2xl shadow-lg p-6 mt-6">
                <h3 className="text-xl font-bold text-[#303A4D] mb-4">Select Payment Method</h3>
                
                {/* Wallet Option */}
                <div 
                  className={`border-2 rounded-lg p-4 mb-4 cursor-pointer transition-all ${
                    paymentMethod === 'wallet' ? 'border-[#FED141] bg-[#FED141]/10' : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setPaymentMethod('wallet')}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Wallet className="w-6 h-6 text-[#303A4D]" />
                      <div>
                        <p className="font-semibold text-[#303A4D]">Pay from Wallet</p>
                        <p className="text-sm text-gray-600">Balance: GH₵{walletBalance.toFixed(2)}</p>
                      </div>
                    </div>
                    {walletBalance >= orderTotal && (
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                    )}
                  </div>
                  {walletBalance < orderTotal && (
                    <p className="text-sm text-red-600 mt-2">
                      Insufficient balance. Need GH₵{(orderTotal - walletBalance).toFixed(2)} more
                    </p>
                  )}
                </div>
                
                {/* Paystack Option */}
                <div 
                  className={`border-2 rounded-lg p-4 mb-4 cursor-pointer transition-all ${
                    paymentMethod === 'paystack' ? 'border-[#FED141] bg-[#FED141]/10' : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setPaymentMethod('paystack')}
                >
                  <div className="flex items-center gap-3">
                    <CreditCard className="w-6 h-6 text-[#303A4D]" />
                    <div>
                      <p className="font-semibold text-[#303A4D]">Pay with Mobile Money / Card</p>
                    </div>
                  </div>
                </div>
                
                <Button 
                  onClick={handlePayment}
                  disabled={isProcessingPayment || (paymentMethod === 'wallet' && walletBalance < orderTotal)}
                  size="lg"
                  className="w-full bg-[#FED141] hover:bg-[#FED141]/90 text-[#303A4D] rounded-full py-6 text-lg font-bold h-auto disabled:opacity-50"
                >
                  {isProcessingPayment ? (
                    <>
                      <Loader2 className="mr-2 w-5 h-5 animate-spin" />
                      Processing Payment...
                    </>
                  ) : (
                    <>
                      Pay GH₵{orderTotal.toFixed(2)}
                      <ArrowRight className="ml-2 w-5 h-5" />
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Address Modal */}
      <Dialog open={showAddAddressModal} onOpenChange={setShowAddAddressModal}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-[#303A4D]">Add New Delivery Address</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            {/* OpenStreetMap Address Picker */}
            <OpenStreetMapAddressPicker
              onAddressSelect={(addressData) => {
                setNewAddress({
                  ...newAddress,
                  street: addressData.street,
                  area: addressData.area,
                  city: addressData.city,
                  region: addressData.region,
                  latitude: addressData.latitude,
                  longitude: addressData.longitude,
                })
              }}
            />

            {/* Additional Fields */}
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#303A4D] mb-2">Address Label *</label>
                <input
                  type="text"
                  value={newAddress.label}
                  onChange={(e) => setNewAddress({ ...newAddress, label: e.target.value })}
                  placeholder="e.g., Home, Office"
                  className="w-full px-4 py-3 rounded-xl border-2 border-[#F4F2E6] focus:border-[#FED141] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#303A4D] mb-2">Phone Number *</label>
                <input
                  type="tel"
                  value={newAddress.phone}
                  onChange={(e) => setNewAddress({ ...newAddress, phone: e.target.value })}
                  placeholder="0XX XXX XXXX"
                  className="w-full px-4 py-3 rounded-xl border-2 border-[#F4F2E6] focus:border-[#FED141] focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#303A4D] mb-2">Additional Info (Optional)</label>
              <textarea
                value={newAddress.additional_info}
                onChange={(e) => setNewAddress({ ...newAddress, additional_info: e.target.value })}
                placeholder="Landmarks, special instructions, etc."
                rows={3}
                className="w-full px-4 py-3 rounded-xl border-2 border-[#F4F2E6] focus:border-[#FED141] focus:outline-none"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button
                onClick={() => {
                  setShowAddAddressModal(false)
                  setNewAddress({
                    label: '',
                    street: '',
                    area: '',
                    city: '',
                    region: '',
                    phone: '',
                    latitude: '',
                    longitude: '',
                    additional_info: ''
                  })
                }}
                variant="outline"
                className="flex-1"
                disabled={isSavingAddress}
              >
                Cancel
              </Button>
              <Button
                onClick={async () => {
                  if (!newAddress.label || !newAddress.phone || !newAddress.street) {
                    toast({
                      title: 'Missing Information',
                      description: 'Please fill in all required fields and select a location on the map',
                      variant: 'destructive',
                    })
                    return
                  }

                  try {
                    setIsSavingAddress(true)
                    const response = await apiClient.post('/user-addresses/', newAddress)
                    
                    // Add to addresses list
                    setAddresses([...addresses, response.data])
                    
                    // Select the new address
                    setSelectedAddressId(response.data.id)
                    
                    toast({
                      title: 'Success',
                      description: 'Address added successfully',
                    })
                    
                    // Close modal and reset form
                    setShowAddAddressModal(false)
                    setNewAddress({
                      label: '',
                      street: '',
                      area: '',
                      city: '',
                      region: '',
                      phone: '',
                      latitude: '',
                      longitude: '',
                      additional_info: ''
                    })
                  } catch (error: any) {
                    console.error('Failed to save address:', error)
                    toast({
                      title: 'Error',
                      description: error.response?.data?.detail || 'Failed to save address',
                      variant: 'destructive',
                    })
                  } finally {
                    setIsSavingAddress(false)
                  }
                }}
                className="flex-1 bg-[#FED141] hover:bg-[#FED141]/90 text-[#303A4D]"
                disabled={isSavingAddress}
              >
                {isSavingAddress ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Address'
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
