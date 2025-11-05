'use client'

import { useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Loader2 } from 'lucide-react'

export default function PaymentVerifyPage() {
  const router = useRouter()
  const params = useParams()
  const orderId = params.orderId as string

  useEffect(() => {
    // Redirect back to payment page which will handle verification
    if (orderId) {
      router.push(`/checkout/payment/${orderId}`)
    }
  }, [orderId, router])

  return (
    <div className="min-h-screen bg-[#F4F2E6] flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="w-12 h-12 animate-spin text-[#303A4D] mx-auto mb-4" />
        <p className="text-[#303A4D] font-semibold">Verifying payment...</p>
      </div>
    </div>
  )
}
