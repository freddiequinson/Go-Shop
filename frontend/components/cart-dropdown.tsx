"use client"

import { useCart } from "@/lib/cart-context"
import { ShoppingBag, X, ArrowRight } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export function CartDropdown() {
  const { items, removeItem, totalPrice } = useCart()

  if (items.length === 0) {
    return (
      <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl shadow-xl p-6 z-50">
        <div className="text-center py-8">
          <ShoppingBag className="w-12 h-12 text-[#303A4D]/30 mx-auto mb-3" />
          <p className="text-[#303A4D]/60 mb-4">Your cart is empty</p>
          <Link href="/shop">
            <Button className="bg-[#FED141] hover:bg-[#F1B424] text-[#303A4D] rounded-full">Start Shopping</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="absolute right-0 top-full mt-2 w-96 bg-white rounded-2xl shadow-xl z-50 overflow-hidden">
      <div className="p-4 border-b border-gray-200">
        <h3 className="font-bold text-lg text-[#303A4D]">Shopping Cart ({items.length})</h3>
      </div>

      <div className="max-h-96 overflow-y-auto p-4 space-y-3">
        {items.map((item) => (
          <div key={item.id} className="flex gap-3 bg-[#F4F2E6] rounded-xl p-3">
            <div className="relative w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
              <Image src={item.image || "/placeholder.svg"} alt={item.name} fill className="object-cover" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-sm text-[#303A4D] truncate">{item.name}</h4>
              <p className="text-xs text-[#303A4D]/60 truncate">{item.vendor}</p>
              <div className="flex items-center justify-between mt-1">
                <span className="font-bold text-sm text-[#303A4D]">
                  GH₵{item.price.toFixed(2)} × {item.quantity}
                </span>
                <button onClick={() => removeItem(item.id)} className="text-red-500 hover:text-red-700">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="p-4 border-t border-gray-200 bg-[#F4F2E6]">
        <div className="flex items-center justify-between mb-4">
          <span className="font-semibold text-[#303A4D]">Subtotal:</span>
          <span className="font-bold text-xl text-[#303A4D]">GH₵{totalPrice.toFixed(2)}</span>
        </div>
        <Link href="/cart">
          <Button className="w-full bg-[#303A4D] hover:bg-[#3B4559] text-white rounded-full py-6">
            Go to Cart
            <ArrowRight className="ml-2 w-5 h-5" />
          </Button>
        </Link>
      </div>
    </div>
  )
}
