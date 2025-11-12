'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useAuth } from '@/lib/contexts/auth-context'
import { useToast } from '@/components/ui/use-toast'
import apiClient from '@/lib/api/client'
import { Loader2, CheckCircle, XCircle, CreditCard } from 'lucide-react'
import { Button } from '@/components/ui/button'

declare global {
  interface Window {
    PaystackPop: any
  }
}

export default function OrderPaymentPage() {
  const router = useRouter()
  const params = useParams()
  const orderId = params.orderId as string
  const { user, isAuthenticated, isLoading: isAuthLoading } = useAuth()
  const { toast } = useToast()

  const [order, setOrder] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isInitializing, setIsInitializing] = useState(false)
  const [isVerifying, setIsVerifying] = useState(false)
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'success' | 'failed'>('pending')

  useEffect(() => {
    if (!isAuthLoading && !isAuthenticated) {
      router.push('/login')
      return
    }

    if (isAuthenticated && orderId) {
      loadOrder()
    }
  }, [isAuthenticated, isAuthLoading, orderId])

  const loadOrder = async () => {
    try {
      setIsLoading(true)
      const response = await apiClient.get(`/orders/${orderId}`)
      setOrder(response.data)

      // Check if already paid
      if (response.data.payment_status === 'completed') {
        setPaymentStatus('success')
        toast({
          title: 'Already Paid',
          description: 'This order has already been paid for',
        })
        setTimeout(() => router.push('/profile/orders'), 2000)
      }
    } catch (error: any) {
      console.error('Failed to load order:', error)
      toast({
        title: 'Error',
        description: 'Failed to load order details',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const initializePayment = async () => {
    try {
      setIsInitializing(true)

      console.log('🚀 Initializing Paystack payment...')
      console.log('   - Order ID:', orderId)
      console.log('   - Amount:', order.total)
      
      // Initialize payment with redirect callback URL
      const response = await apiClient.post(`/orders/${orderId}/initialize-payment`, {
        callback_url: `${window.location.origin}/checkout/payment/${orderId}/verify`
      })
      
      console.log('   - ✅ Payment initialized')
      console.log('   - Payment reference:', response.data.payment_reference)
      console.log('   - Authorization URL:', response.data.authorization_url)

      const { authorization_url } = response.data

      // Show loading message
      toast({
        title: 'Redirecting to Paystack...',
        description: 'You will be redirected to complete your payment',
      })

      // Redirect to Paystack payment page
      console.log('   - 🔄 Redirecting to Paystack...')
      
      // Small delay to show the toast
      setTimeout(() => {
        window.location.href = authorization_url
      }, 500)

    } catch (error: any) {
      console.error('Payment initialization failed:', error)
      toast({
        title: 'Payment Failed',
        description: error.response?.data?.detail || 'Failed to initialize payment',
        variant: 'destructive',
      })
      setIsInitializing(false)
    }
  }

  const verifyPayment = async () => {
    try {
      console.log('\n📞 verifyPayment() function called')
      console.log('   - Order ID:', orderId)
      console.log('   - Setting isVerifying to true...')
      setIsVerifying(true)

      console.log('   - Making API call to verify payment...')
      const response = await apiClient.post(`/orders/${orderId}/verify-payment`)
      
      console.log('   - ✅ API Response received:')
      console.log('   - Status:', response.data.status)
      console.log('   - Message:', response.data.message)
      console.log('   - Full response:', response.data)

      if (response.data.status === 'success') {
        setPaymentStatus('success')
        toast({
          title: '✅ Payment Successful!',
          description: response.data.message,
        })

        // Redirect to orders page after 2 seconds
        setTimeout(() => {
          router.push('/profile/orders')
        }, 2000)
      } else if (response.data.status === 'failed') {
        setPaymentStatus('failed')
        toast({
          title: 'Payment Failed',
          description: response.data.message,
          variant: 'destructive',
        })
      }
    } catch (error: any) {
      console.error('Payment verification failed:', error)
      setPaymentStatus('failed')
      toast({
        title: 'Verification Failed',
        description: error.response?.data?.detail || 'Failed to verify payment',
        variant: 'destructive',
      })
    } finally {
      setIsVerifying(false)
    }
  }

  if (isLoading || isAuthLoading) {
    return (
      <div className="min-h-screen bg-[#F4F2E6] flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-[#303A4D]" />
      </div>
    )
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-[#F4F2E6] flex items-center justify-center">
        <div className="text-center">
          <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-[#303A4D] mb-2">Order Not Found</h2>
          <Button onClick={() => router.push('/')} className="mt-4">
            Go Home
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F4F2E6] py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h1 className="text-3xl font-bold text-[#303A4D] mb-2">Complete Payment</h1>
          <p className="text-gray-600">Order ID: {orderId.slice(0, 8)}...</p>
        </div>

        {/* Payment Status */}
        {paymentStatus === 'success' && (
          <div className="bg-green-50 border-2 border-green-500 rounded-lg p-6 mb-6">
            <div className="flex items-center gap-4">
              <CheckCircle className="w-12 h-12 text-green-500" />
              <div>
                <h2 className="text-2xl font-bold text-green-700">Payment Successful!</h2>
                <p className="text-green-600">Your order has been confirmed. Redirecting...</p>
              </div>
            </div>
          </div>
        )}

        {paymentStatus === 'failed' && (
          <div className="bg-red-50 border-2 border-red-500 rounded-lg p-6 mb-6">
            <div className="flex items-center gap-4">
              <XCircle className="w-12 h-12 text-red-500" />
              <div>
                <h2 className="text-2xl font-bold text-red-700">Payment Failed</h2>
                <p className="text-red-600">Please try again or contact support</p>
              </div>
            </div>
          </div>
        )}

        {/* Order Summary */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-bold text-[#303A4D] mb-4">Order Summary</h2>
          
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Subtotal</span>
              <span className="font-semibold">GH₵{order.subtotal?.toFixed(2)}</span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-gray-600">Delivery</span>
              <span className="font-semibold">
                {order.is_free_delivery === 'true' ? (
                  <span className="text-green-600">FREE</span>
                ) : (
                  `GH₵${order.delivery_fee?.toFixed(2)}`
                )}
              </span>
            </div>

            {order.coupon_code && (
              <div className="flex justify-between text-green-600">
                <span>Coupon ({order.coupon_code})</span>
                <span>-GH₵{order.coupon_discount?.toFixed(2)}</span>
              </div>
            )}

            <div className="flex justify-between">
              <span className="text-gray-600">Tax</span>
              <span className="font-semibold">GH₵{order.tax?.toFixed(2)}</span>
            </div>

            <div className="border-t pt-3 flex justify-between text-xl font-bold text-[#303A4D]">
              <span>Total</span>
              <span>GH₵{order.total?.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Payment Button */}
        {paymentStatus === 'pending' && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <Button
              onClick={initializePayment}
              disabled={isInitializing || isVerifying}
              className="w-full bg-[#FED141] hover:bg-[#FED141]/90 text-[#303A4D] text-lg py-6"
            >
              {isInitializing || isVerifying ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <CreditCard className="w-5 h-5 mr-2" />
                  Pay GH₵{order.total?.toFixed(2)}
                </>
              )}
            </Button>

            <p className="text-center text-sm text-gray-500 mt-4">
              Secure payment powered by Paystack
            </p>
          </div>
        )}

        {/* Retry Button for Failed Payments */}
        {paymentStatus === 'failed' && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <Button
              onClick={initializePayment}
              disabled={isInitializing}
              className="w-full bg-[#FED141] hover:bg-[#FED141]/90 text-[#303A4D] text-lg py-6"
            >
              {isInitializing ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <CreditCard className="w-5 h-5 mr-2" />
                  Retry Payment
                </>
              )}
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
