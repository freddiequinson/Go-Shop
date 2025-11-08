"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { useAuth } from '@/lib/contexts/auth-context'
import { cartService, ordersService, paymentsService } from '@/lib/api/services'
import type { UserAddressResponse } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { ArrowRight, User, Loader2, AlertCircle } from 'lucide-react'
import DeliveryAddressSelector from '@/components/checkout/DeliveryAddressSelector'
import PaymentMethodSelector from '@/components/checkout/PaymentMethodSelector'
import DeliveryDatePicker from '@/components/checkout/DeliveryDatePicker'
import GiftCardInput from '@/components/checkout/GiftCardInput'
import OrderSummary from '@/components/checkout/OrderSummary'

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

interface AppliedGiftCard {
  code: string
  amount: number
  balance: number
}

type PaymentMethod = 'wallet' | 'card' | 'mtn-momo' | 'telecel-cash' | 'at-money'

export default function CheckoutPage() {
  const router = useRouter()
  const { user, isAuthenticated, isLoading: authLoading } = useAuth()
  const { toast } = useToast()

  // Cart state
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [isLoadingCart, setIsLoadingCart] = useState(true)

  // Checkout state
  const [currentStep, setCurrentStep] = useState(1)
  const [selectedAddress, setSelectedAddress] = useState<UserAddressResponse | null>(null)
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string | null>(null)
  const [isExpress, setIsExpress] = useState(false)
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod | null>(null)
  const [paymentPhone, setPaymentPhone] = useState('')
  const [appliedGiftCards, setAppliedGiftCards] = useState<AppliedGiftCard[]>([])
  const [giftWrapMessage, setGiftWrapMessage] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      toast({
        title: 'Authentication Required',
        description: 'Please sign in to continue with checkout',
        variant: 'destructive',
      })
      router.push('/login?redirect=/checkout')
      return
    }

    if (isAuthenticated) {
      loadCart()
    }
  }, [isAuthenticated, authLoading])

  const loadCart = async () => {
    try {
      const cartData = await cartService.getCart()
      if (!cartData.items || cartData.items.length === 0) {
        toast({
          title: 'Empty Cart',
          description: 'Your cart is empty. Add items to continue.',
        })
        router.push('/shop')
        return
      }
      setCartItems(cartData.items)
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load cart',
        variant: 'destructive',
      })
    } finally {
      setIsLoadingCart(false)
    }
  }

  const calculateSubtotal = () => {
    return cartItems.reduce((sum, item) => 
      sum + (item.product.price_per_unit_cedis * item.quantity), 0
    ) / 100
  }

  const calculateTotal = () => {
    const subtotal = calculateSubtotal()
    const giftWrapFee = giftWrapMessage ? 20 : 0
    const expressDeliveryFee = isExpress ? 10 : 0
    const giftCardAmount = appliedGiftCards.reduce((sum, card) => sum + card.amount, 0)
    return subtotal + giftWrapFee + expressDeliveryFee - giftCardAmount
  }

  const canProceedToNextStep = () => {
    switch (currentStep) {
      case 1:
        return selectedAddress !== null
      case 2:
        return selectedDate !== null && selectedTimeSlot !== null
      case 3:
        return selectedPaymentMethod !== null
      default:
        return false
    }
  }

  const handlePlaceOrder = async () => {
    if (!selectedAddress || !selectedDate || !selectedTimeSlot || !selectedPaymentMethod) {
      toast({
        title: 'Incomplete Information',
        description: 'Please complete all checkout steps',
        variant: 'destructive',
      })
      return
    }

    setIsProcessing(true)

    try {
      // Create order
      const orderData = {
        delivery_address: {
          street: selectedAddress.street,
          area: selectedAddress.area,
          city: selectedAddress.city,
          region: selectedAddress.region,
          phone: selectedAddress.phone,
          additional_info: selectedAddress.additional_info,
          latitude: selectedAddress.latitude,
          longitude: selectedAddress.longitude,
        },
        delivery_notes: giftWrapMessage || undefined,
        delivery_date: `${selectedDate}T${getTimeSlotHour(selectedTimeSlot)}:00:00`,
      }

      const order = await ordersService.createOrder(orderData)

      // Process payment based on method
      if (selectedPaymentMethod === 'wallet') {
        // Debit wallet
        await paymentsService.debitWallet({
          amount: calculateTotal(),
          description: `Order #${order.id}`,
        })

        // Show success and redirect
        toast({
          title: 'Order Placed Successfully!',
          description: 'Your order has been confirmed',
        })
        
        // Clear cart
        await cartService.clearCart()
        
        router.push(`/orders/${order.id}`)
      } else if (selectedPaymentMethod === 'card') {
        // Initialize Paystack payment
        const payment = await paymentsService.initializePayment({
          amount: calculateTotal(),
          email: user?.email || '',
          callback_url: `${window.location.origin}/orders/${order.id}/confirmation`,
        })

        // Redirect to Paystack
        window.location.href = payment.authorization_url
      } else {
        // Mobile money - initialize payment
        const payment = await paymentsService.fundWallet(
          calculateTotal(),
          selectedPaymentMethod,
          paymentPhone
        )

        if (payment.requires_approval) {
          toast({
            title: 'Approve Payment',
            description: 'Check your phone to approve the payment',
            duration: 15000,
          })

          // Redirect to confirmation page after delay
          setTimeout(() => {
            router.push(`/orders/${order.id}/confirmation`)
          }, 60000)
        }
      }
    } catch (error: any) {
      toast({
        title: 'Order Failed',
        description: error.response?.data?.detail || 'Failed to place order. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const getTimeSlotHour = (slot: string) => {
    const slots: Record<string, string> = {
      morning: '09',
      afternoon: '14',
      evening: '18',
    }
    return slots[slot] || '12'
  }

  if (authLoading || isLoadingCart) {
    return (
      <div className="min-h-screen bg-[#F4F2E6] flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-[#303A4D]" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  const subtotal = calculateSubtotal()
  const total = calculateTotal()
  const giftCardAmount = appliedGiftCards.reduce((sum, card) => sum + card.amount, 0)
  const giftWrapFee = giftWrapMessage ? 20 : 0

  return (
    <div className="min-h-screen bg-[#F4F2E6]">
      {/* Navigation */}
      <nav className="bg-[#FED141] px-6 md:px-8 py-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/cart" className="text-lg font-medium text-[#303A4D] hover:opacity-80">
            ← Back to Cart
          </Link>

          <Link href="/" className="absolute left-1/2 -translate-x-1/2">
            <Image src="/images/logo.png" alt="go-shop" width={124} height={39} />
          </Link>

          <Link href="/profile">
            <button className="w-12 h-12 rounded-full bg-[#303A4D] flex items-center justify-center hover:opacity-90 transition-opacity">
              <User className="w-5 h-5 text-white" />
            </button>
          </Link>
        </div>
      </nav>

      {/* Page Title */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <h1 className="text-5xl font-bold text-[#303A4D]">
          Checkout. <span className="text-[#FED141]">GoShop</span>
        </h1>
        <p className="text-lg text-[#303A4D]/70 mt-2">Complete your order in a few simple steps</p>
      </div>

      {/* Checkout Content */}
      <div className="max-w-7xl mx-auto px-6 pb-12">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Progress Steps */}
            <div className="flex items-center justify-between mb-8">
              {[1, 2, 3, 4].map((step) => (
                <div key={step} className="flex items-center">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                      currentStep >= step
                        ? 'bg-[#FED141] text-[#303A4D]'
                        : 'bg-gray-200 text-gray-500'
                    }`}
                  >
                    {step}
                  </div>
                  {step < 4 && (
                    <div
                      className={`w-16 h-1 mx-2 ${
                        currentStep > step ? 'bg-[#FED141]' : 'bg-gray-200'
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>

            {/* Step 1: Delivery Address */}
            {currentStep === 1 && (
              <div className="bg-white rounded-3xl p-8">
                <DeliveryAddressSelector
                  selectedAddressId={selectedAddress?.id || null}
                  onAddressSelect={setSelectedAddress}
                />
                <div className="mt-6 flex justify-end">
                  <Button
                    onClick={() => setCurrentStep(2)}
                    disabled={!canProceedToNextStep()}
                    className="bg-[#303A4D] hover:bg-[#3B4559]"
                  >
                    Continue to Delivery Schedule
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </Button>
                </div>
              </div>
            )}

            {/* Step 2: Delivery Schedule */}
            {currentStep === 2 && (
              <div className="bg-white rounded-3xl p-8">
                <DeliveryDatePicker
                  selectedDate={selectedDate}
                  selectedTimeSlot={selectedTimeSlot}
                  isExpress={isExpress}
                  onDateSelect={setSelectedDate}
                  onTimeSlotSelect={setSelectedTimeSlot}
                  onExpressToggle={setIsExpress}
                />
                <div className="mt-6 flex justify-between">
                  <Button variant="outline" onClick={() => setCurrentStep(1)}>
                    ← Back
                  </Button>
                  <Button
                    onClick={() => setCurrentStep(3)}
                    disabled={!canProceedToNextStep()}
                    className="bg-[#303A4D] hover:bg-[#3B4559]"
                  >
                    Continue to Payment
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </Button>
                </div>
              </div>
            )}

            {/* Step 3: Payment Method */}
            {currentStep === 3 && (
              <div className="bg-white rounded-3xl p-8 space-y-6">
                <PaymentMethodSelector
                  selectedMethod={selectedPaymentMethod}
                  onMethodSelect={setSelectedPaymentMethod}
                  phoneNumber={paymentPhone}
                  onPhoneNumberChange={setPaymentPhone}
                  totalAmount={total}
                />

                <GiftCardInput
                  appliedCards={appliedGiftCards}
                  onCardApply={(card) => setAppliedGiftCards([...appliedGiftCards, card])}
                  onCardRemove={(code) =>
                    setAppliedGiftCards(appliedGiftCards.filter((c) => c.code !== code))
                  }
                  orderTotal={total}
                />

                <div className="mt-6 flex justify-between">
                  <Button variant="outline" onClick={() => setCurrentStep(2)}>
                    ← Back
                  </Button>
                  <Button
                    onClick={() => setCurrentStep(4)}
                    disabled={!canProceedToNextStep()}
                    className="bg-[#303A4D] hover:bg-[#3B4559]"
                  >
                    Review Order
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </Button>
                </div>
              </div>
            )}

            {/* Step 4: Review & Place Order */}
            {currentStep === 4 && (
              <div className="bg-white rounded-3xl p-8">
                <div className="flex items-center gap-2 mb-6">
                  <AlertCircle className="w-6 h-6 text-[#FED141]" />
                  <h3 className="text-2xl font-bold text-[#303A4D]">Review Your Order</h3>
                </div>

                <p className="text-gray-600 mb-6">
                  Please review your order details before placing your order. Once confirmed, your order will be processed immediately.
                </p>

                <div className="flex gap-4">
                  <Button variant="outline" onClick={() => setCurrentStep(3)} className="flex-1">
                    ← Back to Payment
                  </Button>
                  <Button
                    onClick={handlePlaceOrder}
                    disabled={isProcessing}
                    className="flex-1 bg-[#303A4D] hover:bg-[#3B4559] text-lg py-6"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        Place Order (GH₵{total.toFixed(2)})
                        <ArrowRight className="ml-2 w-5 h-5" />
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Order Summary Sidebar */}
          <div className="lg:col-span-1">
            <OrderSummary
              items={cartItems}
              deliveryAddress={selectedAddress}
              deliveryDate={selectedDate}
              deliveryTimeSlot={selectedTimeSlot}
              isExpress={isExpress}
              paymentMethod={selectedPaymentMethod}
              giftCardAmount={giftCardAmount}
              giftWrapFee={giftWrapFee}
              subtotal={subtotal}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
