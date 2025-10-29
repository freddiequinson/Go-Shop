"use client"

import { Button } from "@/components/ui/button"
import { useCart } from "@/lib/cart-context"
import { ArrowRight, User, CreditCard, Calendar } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useState } from "react"

export default function CheckoutPage() {
  const { items, totalPrice, clearCart } = useCart()
  const [isLoggedIn, setIsLoggedIn] = useState(false) // This would come from auth context
  const [showLoginAlert, setShowLoginAlert] = useState(false)
  const [selectedPayment, setSelectedPayment] = useState("")
  const [selectedDate, setSelectedDate] = useState("")
  const [guestInfo, setGuestInfo] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
  })

  const deliveryDates = [
    { day: "Wednesday", date: "Nov 1, 2025" },
    { day: "Friday", date: "Nov 3, 2025" },
    { day: "Sunday", date: "Nov 5, 2025" },
  ]

  const paymentMethods = [
    { id: "mtn", name: "MTN Mobile Money", icon: "📱" },
    { id: "telecel", name: "Telecel Cash", icon: "💳" },
    { id: "at", name: "AT Cash", icon: "💰" },
    { id: "paystack", name: "Paystack", icon: "🔒" },
  ]

  const handlePlaceOrder = () => {
    if (!isLoggedIn && (!guestInfo.name || !guestInfo.phone)) {
      setShowLoginAlert(true)
      return
    }
    if (!selectedPayment || !selectedDate) {
      alert("Please select payment method and delivery date")
      return
    }
    // Process order
    alert("Order placed successfully!")
    clearCart()
    window.location.href = "/"
  }

  return (
    <div className="min-h-screen bg-[#F4F2E6]">
      <nav className="bg-[#FED141] px-6 md:px-8 py-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/cart" className="text-lg font-medium text-[#303A4D] hover:opacity-80">
            ← Back to Cart
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

      <div className="max-w-7xl mx-auto px-6 md:px-8 py-12">
        <h1 className="text-4xl md:text-5xl font-bold text-[#303A4D] mb-8">Checkout</h1>

        {!isLoggedIn && (
          <div className="bg-[#FED141] rounded-3xl p-6 mb-8 flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-[#303A4D] flex items-center justify-center flex-shrink-0">
              <User className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-[#303A4D] mb-2">Track Your Order</h3>
              <p className="text-[#303A4D]/80 mb-4">
                Log in to track your order status and view order history. You can still checkout as a guest, but you
                won't be able to track your order.
              </p>
              <Link href="/login">
                <Button className="bg-[#303A4D] hover:bg-[#3B4559] text-white rounded-full px-6 py-3 font-bold">
                  Log In
                </Button>
              </Link>
            </div>
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            {/* Customer Information */}
            <div className="bg-white rounded-3xl p-8">
              <h2 className="text-2xl font-bold text-[#303A4D] mb-6 flex items-center gap-3">
                <User className="w-6 h-6" />
                Customer Information
              </h2>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#303A4D] mb-2">Full Name *</label>
                  <input
                    type="text"
                    value={guestInfo.name}
                    onChange={(e) => setGuestInfo({ ...guestInfo, name: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border-2 border-[#F4F2E6] focus:border-[#FED141] focus:outline-none"
                    placeholder="John Doe"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#303A4D] mb-2">Phone Number *</label>
                  <input
                    type="tel"
                    value={guestInfo.phone}
                    onChange={(e) => setGuestInfo({ ...guestInfo, phone: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border-2 border-[#F4F2E6] focus:border-[#FED141] focus:outline-none"
                    placeholder="0XX XXX XXXX"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#303A4D] mb-2">Email</label>
                  <input
                    type="email"
                    value={guestInfo.email}
                    onChange={(e) => setGuestInfo({ ...guestInfo, email: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border-2 border-[#F4F2E6] focus:border-[#FED141] focus:outline-none"
                    placeholder="john@example.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#303A4D] mb-2">Delivery Address *</label>
                  <input
                    type="text"
                    value={guestInfo.address}
                    onChange={(e) => setGuestInfo({ ...guestInfo, address: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border-2 border-[#F4F2E6] focus:border-[#FED141] focus:outline-none"
                    placeholder="House number, street, area"
                  />
                </div>
              </div>
            </div>

            {/* Delivery Date */}
            <div className="bg-white rounded-3xl p-8">
              <h2 className="text-2xl font-bold text-[#303A4D] mb-6 flex items-center gap-3">
                <Calendar className="w-6 h-6" />
                Select Delivery Date
              </h2>
              <div className="grid md:grid-cols-3 gap-4">
                {deliveryDates.map((delivery) => (
                  <button
                    key={delivery.day}
                    onClick={() => setSelectedDate(delivery.day)}
                    className={`p-6 rounded-2xl border-2 transition-all ${
                      selectedDate === delivery.day
                        ? "border-[#FED141] bg-[#FED141]/10"
                        : "border-[#F4F2E6] hover:border-[#FED141]/50"
                    }`}
                  >
                    <div className="text-xl font-bold text-[#303A4D] mb-1">{delivery.day}</div>
                    <div className="text-sm text-[#303A4D]/60">{delivery.date}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Payment Method */}
            <div className="bg-white rounded-3xl p-8">
              <h2 className="text-2xl font-bold text-[#303A4D] mb-6 flex items-center gap-3">
                <CreditCard className="w-6 h-6" />
                Payment Method
              </h2>
              <div className="grid md:grid-cols-2 gap-4">
                {paymentMethods.map((method) => (
                  <button
                    key={method.id}
                    onClick={() => setSelectedPayment(method.id)}
                    className={`p-6 rounded-2xl border-2 transition-all flex items-center gap-4 ${
                      selectedPayment === method.id
                        ? "border-[#FED141] bg-[#FED141]/10"
                        : "border-[#F4F2E6] hover:border-[#FED141]/50"
                    }`}
                  >
                    <span className="text-3xl">{method.icon}</span>
                    <span className="text-lg font-bold text-[#303A4D]">{method.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-3xl p-8 sticky top-8">
              <h2 className="text-2xl font-bold text-[#303A4D] mb-6">Order Summary</h2>

              <div className="space-y-4 mb-6 max-h-64 overflow-y-auto">
                {items.map((item) => (
                  <div key={item.id} className="flex gap-3">
                    <div className="relative w-16 h-16 flex-shrink-0 rounded-xl overflow-hidden">
                      <Image src={item.image || "/placeholder.svg"} alt={item.name} fill className="object-cover" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-[#303A4D] text-sm">{item.name}</h4>
                      <p className="text-xs text-[#303A4D]/60">
                        {item.quantity} × GH₵{item.price.toFixed(2)}
                      </p>
                    </div>
                    <div className="font-bold text-[#303A4D]">GH₵{(item.price * item.quantity).toFixed(2)}</div>
                  </div>
                ))}
              </div>

              <div className="space-y-3 mb-6 pt-6 border-t-2 border-[#F4F2E6]">
                <div className="flex justify-between text-[#303A4D]">
                  <span>Subtotal</span>
                  <span className="font-bold">GH₵{totalPrice.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-[#303A4D]">
                  <span>Delivery</span>
                  <span className="font-bold text-[#93C90F]">FREE</span>
                </div>
                <div className="border-t-2 border-[#F4F2E6] pt-3 flex justify-between text-[#303A4D]">
                  <span className="text-xl font-bold">Total</span>
                  <span className="text-2xl font-bold">GH₵{totalPrice.toFixed(2)}</span>
                </div>
              </div>

              <Button
                onClick={handlePlaceOrder}
                size="lg"
                className="w-full bg-[#303A4D] hover:bg-[#3B4559] text-white rounded-full py-6 text-lg font-bold h-auto"
              >
                Place Order
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>

              <div className="text-center text-xs text-[#303A4D]/60 mt-4">
                <p>By placing your order, you agree to our terms and conditions</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
