"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { ArrowLeft, Wallet, CreditCard } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/lib/contexts/auth-context"
import { paymentsService } from "@/lib/api/services"
import { useToast } from "@/hooks/use-toast"
import Script from "next/script"

export default function AddFundsPage() {
  const router = useRouter()
  const { user, isAuthenticated, isLoading: authLoading } = useAuth()
  const { toast } = useToast()
  const [amount, setAmount] = useState("")
  const [paymentMethod, setPaymentMethod] = useState("mtn-momo")
  const [phoneNumber, setPhoneNumber] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const [paystackLoaded, setPaystackLoaded] = useState(false)

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login')
    }
  }, [isAuthenticated, authLoading, router])

  const quickAmounts = [20, 50, 100, 200, 500]

  const paymentMethods = [
    { id: "mtn-momo", name: "MTN Mobile Money", image: "/mtnmomo.jpg", requiresPhone: true },
    { id: "telecel-cash", name: "Telecel Cash", image: "/tcash.jpg", requiresPhone: true },
    { id: "at-money", name: "AT Money", image: "/atmoney.webp", requiresPhone: true },
    { id: "card", name: "Debit/Credit Card", image: "/paystack.png", requiresPhone: false },
  ]

  const handlePayment = async () => {
    try {
      setIsProcessing(true)
      
      // Call backend to initialize payment
      const response = await paymentsService.fundWallet(
        parseFloat(amount),
        paymentMethod,
        phoneNumber
      )
      
      // Check if it requires approval (mobile money direct charge)
      if (response.requires_approval) {
        // Mobile money - user needs to approve on their phone
        toast({
          title: "Approve Payment",
          description: response.message || "Check your phone to approve the payment",
          duration: 15000,
        })
        
        // Store reference for verification
        localStorage.setItem('pending_payment_reference', response.reference)
        localStorage.setItem('pending_payment_amount', amount)
        
        // Wait longer for user to approve on phone (60 seconds)
        setTimeout(() => {
          router.push(`/wallet/payment-callback?reference=${response.reference}`)
        }, 60000)
      } else if (response.authorization_url) {
        // Card payment - redirect to Paystack
        localStorage.setItem('pending_payment_reference', response.reference)
        localStorage.setItem('pending_payment_amount', amount)
        
        window.location.href = response.authorization_url
      } else {
        throw new Error("Invalid payment response")
      }
    } catch (error) {
      setIsProcessing(false)
      toast({
        title: "Payment Error",
        description: error instanceof Error ? error.message : "Failed to initialize payment",
        variant: "destructive",
      })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!amount || parseFloat(amount) <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid amount.",
        variant: "destructive",
      })
      return
    }

    // Check if phone number is required for this payment method
    const selectedMethod = paymentMethods.find(m => m.id === paymentMethod)
    if (selectedMethod?.requiresPhone && !phoneNumber) {
      toast({
        title: "Phone Number Required",
        description: "Please enter your mobile money number.",
        variant: "destructive",
      })
      return
    }

    await handlePayment()
  }

  return (
    <>
      {/* Load Paystack Script */}
      <Script
        src="https://js.paystack.co/v1/inline.js"
        onLoad={() => setPaystackLoaded(true)}
      />
      
      <div className="min-h-screen bg-[#F4F2E6]">
        {/* Header */}
        <header className="bg-[#FED141] border-b border-[#303A4D]/10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/wallet" className="flex items-center gap-2 text-[#303A4D] hover:opacity-80">
              <ArrowLeft className="w-5 h-5" />
              <span className="font-semibold">Back to Wallet</span>
            </Link>
            <h1 className="text-2xl font-bold text-[#303A4D]">Add Funds</h1>
            <div className="w-24" />
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Card className="p-6 bg-white">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-full bg-[#FED141] flex items-center justify-center">
              <Wallet className="w-6 h-6 text-[#303A4D]" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-[#303A4D]">Top Up Your Wallet</h2>
              <p className="text-sm text-gray-600">Add funds to make faster checkouts</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Amount Input */}
            <div className="space-y-2">
              <Label htmlFor="amount">Amount (GH₵)</Label>
              <Input
                id="amount"
                type="number"
                min="1"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Enter amount"
                className="text-lg border-[#303A4D]/20"
                required
              />
            </div>

            {/* Quick Amount Buttons */}
            <div className="space-y-2">
              <Label>Quick Select</Label>
              <div className="grid grid-cols-5 gap-2">
                {quickAmounts.map((quickAmount) => (
                  <Button
                    key={quickAmount}
                    type="button"
                    variant="outline"
                    onClick={() => setAmount(quickAmount.toString())}
                    className={`border-[#303A4D]/20 ${amount === quickAmount.toString() ? "bg-[#FED141] border-[#FED141]" : "bg-transparent"}`}
                  >
                    {quickAmount}
                  </Button>
                ))}
              </div>
            </div>

            {/* Payment Method */}
            <div className="space-y-3">
              <Label>Payment Method</Label>
              <div className="grid gap-3">
                {paymentMethods.map((method) => (
                  <label
                    key={method.id}
                    className={`flex items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      paymentMethod === method.id
                        ? "border-[#FED141] bg-[#FED141]/10"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      value={method.id}
                      checked={paymentMethod === method.id}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="w-4 h-4"
                    />
                    <div className="w-12 h-12 relative flex items-center justify-center">
                      <Image
                        src={method.image}
                        alt={method.name}
                        width={48}
                        height={48}
                        className="object-contain"
                      />
                    </div>
                    <span className="font-medium text-[#303A4D]">{method.name}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Phone Number for Mobile Money */}
            {paymentMethods.find(m => m.id === paymentMethod)?.requiresPhone && (
              <div className="space-y-2">
                <Label htmlFor="phone">Mobile Money Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="+233 XX XXX XXXX"
                  className="border-[#303A4D]/20"
                  required
                />
                <p className="text-sm text-gray-600">
                  Enter the number you want to use for this transaction
                </p>
              </div>
            )}

            {/* Summary */}
            {amount && (
              <Card className="p-4 bg-[#FED141]/10 border-[#FED141]">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Amount to add:</span>
                  <span className="text-2xl font-bold text-[#303A4D]">GH₵{Number.parseFloat(amount).toFixed(2)}</span>
                </div>
              </Card>
            )}

            {/* Submit Button */}
            <Button 
              type="submit" 
              disabled={isProcessing}
              className="w-full bg-[#303A4D] hover:bg-[#303A4D]/90 text-white text-lg py-6"
            >
              {isProcessing ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Processing...
                </>
              ) : (
                <>
                  <CreditCard className="w-5 h-5 mr-2" />
                  Proceed to Payment
                </>
              )}
            </Button>
          </form>
        </Card>
      </div>
    </div>
    </>
  )
}
