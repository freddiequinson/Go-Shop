"use client"

import { Card } from '@/components/ui/card'
import { ShoppingBag, MapPin, Calendar, CreditCard, Gift } from 'lucide-react'
import Image from 'next/image'
import type { UserAddressResponse } from '@/lib/types'

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

interface OrderSummaryProps {
  items: CartItem[]
  deliveryAddress: UserAddressResponse | null
  deliveryDate: string | null
  deliveryTimeSlot: string | null
  isExpress: boolean
  paymentMethod: string | null
  giftCardAmount: number
  giftWrapFee: number
  subtotal: number
}

export default function OrderSummary({
  items,
  deliveryAddress,
  deliveryDate,
  deliveryTimeSlot,
  isExpress,
  paymentMethod,
  giftCardAmount,
  giftWrapFee,
  subtotal,
}: OrderSummaryProps) {
  const expressDeliveryFee = isExpress ? 10 : 0
  const deliveryFee = 0 // Free delivery
  const total = subtotal + giftWrapFee + expressDeliveryFee - giftCardAmount

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })
  }

  const getTimeSlotLabel = (slot: string) => {
    const slots: Record<string, string> = {
      morning: '8:00 AM - 12:00 PM',
      afternoon: '12:00 PM - 4:00 PM',
      evening: '4:00 PM - 8:00 PM',
    }
    return slots[slot] || slot
  }

  const getPaymentMethodLabel = (method: string) => {
    const methods: Record<string, string> = {
      wallet: 'Wallet Balance',
      card: 'Debit/Credit Card',
      'mtn-momo': 'MTN Mobile Money',
      'telecel-cash': 'Telecel Cash',
      'at-money': 'AT Money',
    }
    return methods[method] || method
  }

  return (
    <Card className="p-6 sticky top-8">
      <h3 className="text-2xl font-bold text-[#303A4D] mb-6">Order Summary</h3>

      {/* Items */}
      <div className="space-y-4 mb-6">
        <div className="flex items-center gap-2 text-sm font-bold text-[#303A4D]">
          <ShoppingBag className="w-4 h-4" />
          <span>{items.length} Item{items.length !== 1 ? 's' : ''}</span>
        </div>
        <div className="space-y-3 max-h-64 overflow-y-auto">
          {items.map((item) => (
            <div key={item.id} className="flex gap-3">
              <div className="relative w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100">
                <Image
                  src={item.product.primary_image_url || item.product.image_url || '/placeholder.svg'}
                  alt={item.product.name}
                  fill
                  className="object-cover"
                />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-[#303A4D] text-sm truncate">{item.product.name}</h4>
                <p className="text-xs text-gray-600">
                  {item.quantity} × GH₵{(item.product.price_per_unit_cedis / 100).toFixed(2)}
                </p>
              </div>
              <div className="font-bold text-[#303A4D] text-sm">
                GH₵{((item.product.price_per_unit_cedis * item.quantity) / 100).toFixed(2)}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Delivery Address */}
      {deliveryAddress && (
        <div className="mb-6 pb-6 border-b-2 border-gray-100">
          <div className="flex items-center gap-2 text-sm font-bold text-[#303A4D] mb-2">
            <MapPin className="w-4 h-4" />
            <span>Delivery Address</span>
          </div>
          <div className="text-sm text-gray-600 space-y-1 pl-6">
            <p className="font-bold text-[#303A4D]">{deliveryAddress.label}</p>
            <p>{deliveryAddress.street}</p>
            <p>{deliveryAddress.area}, {deliveryAddress.city}</p>
            <p>{deliveryAddress.phone}</p>
          </div>
        </div>
      )}

      {/* Delivery Schedule */}
      {deliveryDate && deliveryTimeSlot && (
        <div className="mb-6 pb-6 border-b-2 border-gray-100">
          <div className="flex items-center gap-2 text-sm font-bold text-[#303A4D] mb-2">
            <Calendar className="w-4 h-4" />
            <span>Delivery Schedule</span>
          </div>
          <div className="text-sm text-gray-600 pl-6">
            <p>{formatDate(deliveryDate)}</p>
            <p>{getTimeSlotLabel(deliveryTimeSlot)}</p>
            {isExpress && (
              <p className="text-[#FED141] font-bold mt-1">⚡ Express Delivery</p>
            )}
          </div>
        </div>
      )}

      {/* Payment Method */}
      {paymentMethod && (
        <div className="mb-6 pb-6 border-b-2 border-gray-100">
          <div className="flex items-center gap-2 text-sm font-bold text-[#303A4D] mb-2">
            <CreditCard className="w-4 h-4" />
            <span>Payment Method</span>
          </div>
          <div className="text-sm text-gray-600 pl-6">
            <p>{getPaymentMethodLabel(paymentMethod)}</p>
          </div>
        </div>
      )}

      {/* Price Breakdown */}
      <div className="space-y-3 mb-6">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Subtotal</span>
          <span className="font-bold text-[#303A4D]">GH₵{subtotal.toFixed(2)}</span>
        </div>

        {giftWrapFee > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-600 flex items-center gap-1">
              <Gift className="w-3 h-3" />
              Gift Wrap
            </span>
            <span className="font-bold text-[#303A4D]">GH₵{giftWrapFee.toFixed(2)}</span>
          </div>
        )}

        {isExpress && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Express Delivery</span>
            <span className="font-bold text-[#303A4D]">GH₵{expressDeliveryFee.toFixed(2)}</span>
          </div>
        )}

        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Delivery Fee</span>
          <span className="font-bold text-green-600">FREE</span>
        </div>

        {giftCardAmount > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Gift Card Discount</span>
            <span className="font-bold text-green-600">-GH₵{giftCardAmount.toFixed(2)}</span>
          </div>
        )}
      </div>

      {/* Total */}
      <div className="pt-6 border-t-2 border-gray-200">
        <div className="flex justify-between items-center">
          <span className="text-xl font-bold text-[#303A4D]">Total</span>
          <span className="text-2xl font-bold text-[#303A4D]">GH₵{total.toFixed(2)}</span>
        </div>
      </div>
    </Card>
  )
}
