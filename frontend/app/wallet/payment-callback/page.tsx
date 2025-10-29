"use client"

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useToast } from '@/hooks/use-toast'
import { paymentsService } from '@/lib/api/services'
import { CheckCircle, XCircle, Loader2 } from 'lucide-react'

export default function PaymentCallbackPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const [status, setStatus] = useState<'processing' | 'success' | 'failed'>('processing')
  const [message, setMessage] = useState('Verifying your payment...')

  useEffect(() => {
    let pollCount = 0
    const maxPolls = 20 // Poll for up to 2 minutes (20 * 6 seconds)
    let pollInterval: NodeJS.Timeout

    const verifyPayment = async () => {
      try {
        // Get reference from URL or localStorage
        const reference = searchParams.get('reference') || localStorage.getItem('pending_payment_reference')
        const amount = localStorage.getItem('pending_payment_amount')
        
        if (!reference) {
          setStatus('failed')
          setMessage('Payment reference not found')
          return
        }

        // Verify payment with backend
        const result = await paymentsService.verifyPaystackPayment(reference)
        
        if (result.status === 'success') {
          // Clear stored data
          localStorage.removeItem('pending_payment_reference')
          localStorage.removeItem('pending_payment_amount')
          
          // Stop polling
          if (pollInterval) clearInterval(pollInterval)
          
          setStatus('success')
          setMessage(`GH₵${amount || result.amount} has been added to your wallet!`)
          
          toast({
            title: "Payment Successful!",
            description: `Your wallet has been credited with GH₵${amount || result.amount}`,
          })
          
          // Redirect to wallet after 2 seconds
          setTimeout(() => {
            router.push('/wallet')
          }, 2000)
        } else if (result.status === 'failed' || result.status === 'cancelled') {
          // Clear stored data
          localStorage.removeItem('pending_payment_reference')
          localStorage.removeItem('pending_payment_amount')
          
          // Stop polling
          if (pollInterval) clearInterval(pollInterval)
          
          setStatus('failed')
          setMessage('Payment was not completed')
          
          toast({
            title: "Payment Failed",
            description: "Your payment could not be verified. Please try again.",
            variant: "destructive",
          })
        } else {
          // Payment still pending, continue polling
          pollCount++
          
          if (pollCount >= maxPolls) {
            // Timeout after max polls
            if (pollInterval) clearInterval(pollInterval)
            
            setStatus('failed')
            setMessage('Payment verification timed out. Please check your wallet or contact support.')
            
            toast({
              title: "Verification Timeout",
              description: "Payment is taking longer than expected. Please check your wallet.",
              variant: "destructive",
            })
          } else {
            setMessage(`Waiting for payment confirmation... (${pollCount}/${maxPolls})`)
          }
        }
      } catch (error) {
        pollCount++
        
        if (pollCount >= maxPolls) {
          if (pollInterval) clearInterval(pollInterval)
          
          setStatus('failed')
          setMessage('An error occurred while verifying your payment')
          
          toast({
            title: "Verification Error",
            description: error instanceof Error ? error.message : "Failed to verify payment",
            variant: "destructive",
          })
        }
      }
    }

    // Initial verification
    verifyPayment()
    
    // Poll every 6 seconds
    pollInterval = setInterval(verifyPayment, 6000)
    
    // Cleanup on unmount
    return () => {
      if (pollInterval) clearInterval(pollInterval)
    }
  }, [searchParams, router, toast])

  return (
    <div className="min-h-screen bg-[#F4F2E6] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        {status === 'processing' && (
          <>
            <Loader2 className="w-16 h-16 text-[#FED141] mx-auto mb-4 animate-spin" />
            <h2 className="text-2xl font-bold text-[#303A4D] mb-2">Processing Payment</h2>
            <p className="text-gray-600">{message}</p>
          </>
        )}
        
        {status === 'success' && (
          <>
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-[#303A4D] mb-2">Payment Successful!</h2>
            <p className="text-gray-600 mb-4">{message}</p>
            <p className="text-sm text-gray-500">Redirecting to your wallet...</p>
          </>
        )}
        
        {status === 'failed' && (
          <>
            <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-[#303A4D] mb-2">Payment Failed</h2>
            <p className="text-gray-600 mb-6">{message}</p>
            <button
              onClick={() => router.push('/wallet/add-funds')}
              className="px-6 py-3 bg-[#303A4D] text-white rounded-lg hover:opacity-90 transition-opacity"
            >
              Try Again
            </button>
          </>
        )}
      </div>
    </div>
  )
}
