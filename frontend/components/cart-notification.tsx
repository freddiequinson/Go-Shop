"use client"

import { Check } from "lucide-react"
import { useEffect, useState } from "react"

type CartNotificationProps = {
  show: boolean
  productName: string
}

export function CartNotification({ show, productName }: CartNotificationProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)

  useEffect(() => {
    if (show) {
      setIsVisible(true)
      const timer = setTimeout(() => {
        setIsAnimating(true)
        setTimeout(() => {
          setIsVisible(false)
          setIsAnimating(false)
        }, 600)
      }, 4000)
      return () => clearTimeout(timer)
    }
  }, [show])

  if (!isVisible) return null

  return (
    <div
      className={`fixed z-50 cursor-pointer transition-all duration-500 ${
        isAnimating ? "top-6 right-6 scale-50 opacity-0" : "top-24 right-6 animate-in slide-in-from-top-5 fade-in"
      }`}
      onClick={() => (window.location.href = "/cart")}
    >
      <div className="bg-[#303A4D] text-white rounded-2xl px-6 py-4 shadow-lg flex items-center gap-3 min-w-[300px] hover:bg-[#3B4559] transition-colors">
        <div className="w-10 h-10 rounded-full bg-[#FED141] flex items-center justify-center flex-shrink-0">
          <Check className="w-6 h-6 text-[#303A4D]" />
        </div>
        <div>
          <p className="font-bold">Added to cart!</p>
          <p className="text-sm text-white/80">{productName}</p>
        </div>
      </div>
    </div>
  )
}
