'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Loader2, CheckCircle, XCircle } from 'lucide-react'
import apiClient from '@/lib/api/client'
import { useToast } from '@/components/ui/use-toast'

export default function PaymentVerifyPage() {
  const router = useRouter()
  const params = useParams()
  const orderId = params.orderId as string
  const { toast } = useToast()
  const [status, setStatus] = useState<'verifying' | 'success' | 'failed'>('verifying')
  const [attemptNumber, setAttemptNumber] = useState(1)

  useEffect(() => {
    const verifyPayment = async () => {
      if (!orderId) return

      let attempts = 0
      const maxAttempts = 3
      const delays = [2000, 3000, 4000] // 2s, 3s, 4s

      while (attempts < maxAttempts) {
        try {
          attempts++
          setAttemptNumber(attempts)
          const delay = delays[attempts - 1]
          
          console.log(`⏳ Attempt ${attempts}/${maxAttempts}: Waiting ${delay/1000}s for Paystack to process...`)
          
          // Wait before checking
          await new Promise(resolve => setTimeout(resolve, delay))
          
          console.log(`🔍 Verifying payment for order: ${orderId}`)
          console.log(`   - API Endpoint: /orders/${orderId}/verify-payment`)
          console.log(`   - Timestamp: ${new Date().toISOString()}`)
          
          const response = await apiClient.post(`/orders/${orderId}/verify-payment`)
          
          console.log('   - ✅ API call successful')
          console.log('   - Response status:', response.status)
          console.log('   - Response data:', JSON.stringify(response.data, null, 2))

          if (response.data.status === 'success') {
            setStatus('success')
            toast({
              title: '✅ Payment Successful!',
              description: response.data.message || 'Your order has been confirmed',
            })

            // Redirect to order detail page after 2 seconds with verified flag
            setTimeout(() => {
              router.push(`/orders/${orderId}?verified=true`)
            }, 2000)
            return // Exit the retry loop
          } else if (response.data.status === 'processing' && attempts < maxAttempts) {
            // Payment still processing, retry
            console.log('⏳ Payment still processing, retrying...')
            continue
          } else {
            // Payment failed or max attempts reached
            setStatus('failed')
            toast({
              title: 'Payment Failed',
              description: response.data.message || 'Payment verification failed',
              variant: 'destructive',
            })

            // Redirect back to payment page
            setTimeout(() => {
              router.push(`/checkout/payment/${orderId}`)
            }, 3000)
            return
          }
        } catch (error: any) {
          console.error(`❌ Attempt ${attempts} failed:`, error)
          
          if (attempts >= maxAttempts) {
            // Max attempts reached
            setStatus('failed')
            toast({
              title: 'Verification Error',
              description: error.response?.data?.detail || 'Failed to verify payment after multiple attempts',
              variant: 'destructive',
            })

            // Redirect back to payment page
            setTimeout(() => {
              router.push(`/checkout/payment/${orderId}`)
            }, 3000)
            return
          }
          
          // Continue to next attempt
          console.log('🔄 Retrying...')
        }
      }
    }

    verifyPayment()
  }, [orderId, router, toast])

  return (
    <div className="min-h-screen bg-[#F4F2E6] flex items-center justify-center">
      <div className="text-center">
        {status === 'verifying' && (
          <>
            <Loader2 className="w-16 h-16 animate-spin text-[#303A4D] mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-[#303A4D] mb-2">Verifying Payment...</h2>
            <p className="text-[#303A4D]/60">Please wait while we confirm your payment</p>
            {attemptNumber > 1 && (
              <p className="text-sm text-[#303A4D]/40 mt-2">Attempt {attemptNumber} of 3</p>
            )}
          </>
        )}
        
        {status === 'success' && (
          <>
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-[#303A4D] mb-2">Payment Successful!</h2>
            <p className="text-[#303A4D]/60">Redirecting to your order...</p>
          </>
        )}
        
        {status === 'failed' && (
          <>
            <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-[#303A4D] mb-2">Verification Failed</h2>
            <p className="text-[#303A4D]/60">Redirecting back to payment page...</p>
          </>
        )}
      </div>
    </div>
  )
}
