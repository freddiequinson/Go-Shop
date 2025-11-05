"use client"

import { useState, useEffect } from 'react'
import { paymentsService } from '@/lib/api/services'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Wallet, Check } from 'lucide-react'
import Image from 'next/image'

type PaymentMethod = 'wallet' | 'card' | 'mtn-momo' | 'telecel-cash' | 'at-money'

interface PaymentMethodSelectorProps {
  selectedMethod: PaymentMethod | null
  onMethodSelect: (method: PaymentMethod) => void
  phoneNumber: string
  onPhoneNumberChange: (phone: string) => void
  totalAmount: number
}

export default function PaymentMethodSelector({
  selectedMethod,
  onMethodSelect,
  phoneNumber,
  onPhoneNumberChange,
  totalAmount,
}: PaymentMethodSelectorProps) {
  const [walletBalance, setWalletBalance] = useState<number>(0)
  const [isLoadingWallet, setIsLoadingWallet] = useState(true)

  useEffect(() => {
    loadWalletBalance()
  }, [])

  const loadWalletBalance = async () => {
    try {
      const wallet = await paymentsService.getWallet()
      setWalletBalance(wallet.balance)
    } catch (error) {
      console.error('Failed to load wallet:', error)
    } finally {
      setIsLoadingWallet(false)
    }
  }

  const paymentMethods = [
    {
      id: 'wallet' as PaymentMethod,
      name: 'Wallet Balance',
      description: `Available: GH₵${walletBalance.toFixed(2)}`,
      image: null, // No image for wallet, use icon
      requiresPhone: false,
      disabled: walletBalance < totalAmount,
      disabledReason: 'Insufficient balance',
    },
    {
      id: 'card' as PaymentMethod,
      name: 'Debit/Credit Card',
      description: 'Visa, Mastercard via Paystack',
      image: '/paystack.png',
      requiresPhone: false,
      disabled: false,
    },
    {
      id: 'mtn-momo' as PaymentMethod,
      name: 'MTN Mobile Money',
      description: 'Pay with MTN MoMo',
      image: '/mtnmomo.jpg',
      requiresPhone: true,
      disabled: false,
    },
    {
      id: 'telecel-cash' as PaymentMethod,
      name: 'Telecel Cash',
      description: 'Pay with Telecel Cash',
      image: '/tcash.jpg',
      requiresPhone: true,
      disabled: false,
    },
    {
      id: 'at-money' as PaymentMethod,
      name: 'AT Money',
      description: 'Pay with AirtelTigo Money',
      image: '/atmoney.webp',
      requiresPhone: true,
      disabled: false,
    },
  ]

  const selectedMethodData = paymentMethods.find(m => m.id === selectedMethod)

  return (
    <div className="space-y-6">
      <h3 className="text-xl font-bold text-[#303A4D]">Payment Method</h3>

      {/* Wallet Balance Alert */}
      {!isLoadingWallet && walletBalance < totalAmount && selectedMethod === 'wallet' && (
        <div className="p-4 bg-red-50 border-2 border-red-200 rounded-xl">
          <p className="text-sm text-red-800">
            <strong>Insufficient Balance:</strong> Your wallet balance (GH₵{walletBalance.toFixed(2)}) is less than the order total (GH₵{totalAmount.toFixed(2)}). 
            Please top up your wallet or choose another payment method.
          </p>
        </div>
      )}

      {/* Payment Methods Grid */}
      <div className="grid md:grid-cols-2 gap-4">
        {paymentMethods.map((method) => (
          <Card
            key={method.id}
            className={`p-4 cursor-pointer transition-all ${
              method.disabled
                ? 'opacity-50 cursor-not-allowed'
                : 'hover:shadow-md'
            } ${
              selectedMethod === method.id
                ? 'border-2 border-[#FED141] bg-[#FED141]/5'
                : 'border-2 border-transparent'
            }`}
            onClick={() => !method.disabled && onMethodSelect(method.id)}
          >
            <div className="flex items-start gap-3">
              <div
                className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 ${
                  selectedMethod === method.id
                    ? 'border-[#FED141] bg-[#FED141]'
                    : 'border-gray-300'
                }`}
              >
                {selectedMethod === method.id && <Check className="w-4 h-4 text-[#303A4D]" />}
              </div>

              {/* Payment Logo or Icon */}
              {method.image ? (
                <div className="w-12 h-12 relative flex items-center justify-center flex-shrink-0">
                  <Image
                    src={method.image}
                    alt={method.name}
                    width={48}
                    height={48}
                    className="object-contain"
                  />
                </div>
              ) : (
                <div className="w-12 h-12 rounded-full bg-[#FED141] flex items-center justify-center flex-shrink-0">
                  <Wallet className="w-6 h-6 text-[#303A4D]" />
                </div>
              )}

              <div className="flex-1">
                <h4 className="font-bold text-[#303A4D] mb-1">{method.name}</h4>
                <p className="text-sm text-gray-600">{method.description}</p>
                {method.disabled && method.disabledReason && (
                  <p className="text-xs text-red-600 mt-1">{method.disabledReason}</p>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Phone Number Input for Mobile Money */}
      {selectedMethodData?.requiresPhone && (
        <div className="space-y-2">
          <Label htmlFor="payment-phone">Mobile Money Number *</Label>
          <Input
            id="payment-phone"
            type="tel"
            placeholder="+233 XX XXX XXXX"
            value={phoneNumber}
            onChange={(e) => onPhoneNumberChange(e.target.value)}
            className="border-[#303A4D]/20"
            required
          />
          <p className="text-sm text-gray-600">
            Enter the mobile money number you want to use for this payment
          </p>
        </div>
      )}

      {/* Payment Info */}
      <div className="p-4 bg-blue-50 border-2 border-blue-200 rounded-xl">
        <p className="text-sm text-blue-800">
          <strong>Secure Payment:</strong> All transactions are encrypted and secure. 
          {selectedMethod === 'wallet' && ' Amount will be deducted from your wallet balance.'}
          {selectedMethod === 'card' && ' You will be redirected to Paystack for secure card payment.'}
          {selectedMethodData?.requiresPhone && ' You will receive a prompt on your phone to approve the payment.'}
        </p>
      </div>
    </div>
  )
}
