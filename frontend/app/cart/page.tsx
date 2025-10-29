"use client"

import { Button } from "@/components/ui/button"
import { useCart } from "@/lib/cart-context"
import { ArrowRight, Minus, Plus, ShoppingBag, Trash2, User } from "lucide-react"
import Image from "next/image"
import Link from "next/link"

export default function CartPage() {
  const { items, removeItem, updateQuantity, totalItems, totalPrice, clearCart } = useCart()

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-[#F4F2E6]">
        {/* Navigation */}
        <nav className="bg-[#FED141] px-6 md:px-8 py-6">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <Link href="/shop" className="text-lg font-medium text-[#303A4D] hover:opacity-80">
              ← Continue Shopping
            </Link>

            <Link href="/" className="absolute left-1/2 -translate-x-1/2">
              <Image src="/images/logo.png" alt="go-shop" width={124} height={39} />
            </Link>

            <Link href="/login">
              <button className="w-12 h-12 rounded-full bg-[#303A4D] flex items-center justify-center hover:opacity-90 transition-opacity">
                <User className="w-5 h-5 text-white" />
              </button>
            </Link>
          </div>
        </nav>

        {/* Empty Cart */}
        <div className="flex flex-col items-center justify-center px-6 py-24">
          <div className="w-32 h-32 rounded-full bg-[#FED141]/20 flex items-center justify-center mb-6">
            <ShoppingBag className="w-16 h-16 text-[#303A4D]/40" />
          </div>
          <h1 className="text-4xl font-bold text-[#303A4D] mb-4">Your cart is empty</h1>
          <p className="text-xl text-[#303A4D]/70 mb-8">Add some fresh groceries to get started</p>
          <Link href="/shop">
            <Button
              size="lg"
              className="bg-[#303A4D] hover:bg-[#3B4559] text-white rounded-full px-8 py-6 text-lg font-bold h-auto"
            >
              Start Shopping
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F4F2E6]">
      {/* Navigation */}
      <nav className="bg-[#FED141] px-6 md:px-8 py-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/shop" className="text-lg font-medium text-[#303A4D] hover:opacity-80">
            ← Continue Shopping
          </Link>

          <Link href="/" className="absolute left-1/2 -translate-x-1/2">
            <Image src="/images/logo.png" alt="go-shop" width={124} height={39} />
          </Link>

          <Link href="/login">
            <button className="w-12 h-12 rounded-full bg-[#303A4D] flex items-center justify-center hover:opacity-90 transition-opacity">
              <User className="w-5 h-5 text-white" />
            </button>
          </Link>
        </div>
      </nav>

      {/* Cart Content */}
      <div className="max-w-7xl mx-auto px-6 md:px-8 py-12">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-[#303A4D]">Shopping Cart</h1>
          <button
            onClick={clearCart}
            className="text-[#303A4D] hover:text-[#C24628] font-medium flex items-center gap-2"
          >
            <Trash2 className="w-5 h-5" />
            Clear Cart
          </button>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {items.map((item) => (
              <div key={item.id} className="bg-white rounded-3xl p-6 flex gap-6">
                <div className="relative w-32 h-32 flex-shrink-0 rounded-2xl overflow-hidden bg-[#FED141]/20">
                  <Image src={item.image || "/placeholder.svg"} alt={item.name} fill className="object-cover" />
                </div>

                <div className="flex-1">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="text-xl font-bold text-[#303A4D] mb-1">{item.name}</h3>
                      <p className="text-sm text-[#303A4D]/60">{item.vendor}</p>
                    </div>
                    <button
                      onClick={() => removeItem(item.id)}
                      className="text-[#303A4D]/60 hover:text-[#C24628] transition-colors"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="flex items-center justify-between mt-4">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="w-10 h-10 rounded-full bg-[#F4F2E6] flex items-center justify-center hover:bg-[#FED141] transition-colors"
                      >
                        <Minus className="w-4 h-4 text-[#303A4D]" />
                      </button>
                      <span className="text-lg font-bold text-[#303A4D] w-8 text-center">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="w-10 h-10 rounded-full bg-[#F4F2E6] flex items-center justify-center hover:bg-[#FED141] transition-colors"
                      >
                        <Plus className="w-4 h-4 text-[#303A4D]" />
                      </button>
                    </div>

                    <div className="text-right">
                      <div className="text-2xl font-bold text-[#303A4D]">
                        GH₵{(item.price * item.quantity).toFixed(2)}
                      </div>
                      <div className="text-sm text-[#303A4D]/60">
                        GH₵{item.price.toFixed(2)} {item.unit}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-3xl p-8 sticky top-8">
              <h2 className="text-2xl font-bold text-[#303A4D] mb-6">Order Summary</h2>

              <div className="space-y-4 mb-6">
                <div className="flex justify-between text-[#303A4D]">
                  <span>Items ({totalItems})</span>
                  <span className="font-bold">GH₵{totalPrice.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-[#303A4D]">
                  <span>Delivery</span>
                  <span className="font-bold text-[#93C90F]">FREE</span>
                </div>
                <div className="border-t-2 border-[#F4F2E6] pt-4 flex justify-between text-[#303A4D]">
                  <span className="text-xl font-bold">Total</span>
                  <span className="text-2xl font-bold">GH₵{totalPrice.toFixed(2)}</span>
                </div>
              </div>

              <Link href="/checkout">
                <Button
                  size="lg"
                  className="w-full bg-[#303A4D] hover:bg-[#3B4559] text-white rounded-full py-6 text-lg font-bold h-auto mb-4"
                >
                  Proceed to Checkout
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>

              <div className="text-center text-sm text-[#303A4D]/60">
                <p>Free delivery on all orders</p>
                <p className="mt-2">100% satisfaction guaranteed</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
