"use client"

import { useEffect, useState } from "react"
import { X, ArrowRight } from "lucide-react"
import { DotLottieReact } from "@lottiefiles/dotlottie-react"
import Link from "next/link"
import { getApiBaseUrl } from "@/lib/api/url-helper"

interface PackageData {
  id: string
  name: string
  description: string | null
  image_url: string | null
  package_price: number
  original_value: number | null
  savings: number | null
  items_count: number
}

interface SeasonalEvent {
  id: string
  name: string
  description: string | null
  color_code: string
  promo_image_url: string | null
  lottie_animation: string | null
  show_popup: boolean
  packages: PackageData[]
}

interface SeasonalPopupProps {
  onAddToCart?: (packageId: string) => void
}

export default function SeasonalPopup({ onAddToCart }: SeasonalPopupProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [event, setEvent] = useState<SeasonalEvent | null>(null)
  const [selectedPackage, setSelectedPackage] = useState<PackageData | null>(null)
  const [isAnimating, setIsAnimating] = useState(false)

  useEffect(() => {
    const checkAndShowPopup = async () => {
      const popupShown = sessionStorage.getItem("seasonal_popup_shown")
      if (popupShown) return

      try {
        const response = await fetch(`${getApiBaseUrl()}/packages/active`)
        if (response.ok) {
          const events: SeasonalEvent[] = await response.json()
          const popupEvent = events.find(e => e.show_popup && e.packages.length > 0)
          if (popupEvent) {
            setEvent(popupEvent)
            setSelectedPackage(popupEvent.packages[0])
            setTimeout(() => {
              setIsAnimating(true)
              setTimeout(() => setIsOpen(true), 50)
              sessionStorage.setItem("seasonal_popup_shown", "true")
            }, 2000)
          }
        }
      } catch (error) {
        console.error("Failed to fetch seasonal events:", error)
      }
    }

    checkAndShowPopup()
  }, [])

  const handleClose = () => {
    setIsOpen(false)
    setTimeout(() => setIsAnimating(false), 300)
  }

  const handleShopNow = () => {
    if (selectedPackage && onAddToCart) {
      onAddToCart(selectedPackage.id)
    }
    handleClose()
  }

  const formatPrice = (price: number | null | undefined) => {
    if (price === null || price === undefined) return "0.00"
    return Number(price).toFixed(2)
  }

  if (!isAnimating || !event || !selectedPackage) return null

  return (
    <div 
      className={`fixed bottom-4 right-4 z-50 transition-all duration-300 ease-out ${
        isOpen ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
      }`}
    >
      {/* Popup Card - Bottom Right Corner Style */}
      <div 
        className="flex bg-white rounded-lg shadow-2xl overflow-hidden max-w-md"
        style={{ boxShadow: "0 10px 40px rgba(0,0,0,0.15)" }}
      >
        {/* Left Side - Image with Lottie overlay */}
        <div 
          className="relative w-40 flex-shrink-0 overflow-hidden"
          style={{ backgroundColor: event.color_code }}
        >
          {/* Background Image */}
          {(selectedPackage.image_url || event.promo_image_url) && (
            <img
              src={selectedPackage.image_url || event.promo_image_url || ""}
              alt={event.name}
              className="absolute inset-0 w-full h-full object-cover"
            />
          )}
          
          {/* Lottie Animation Overlay */}
          {event.lottie_animation && (
            <div className="absolute inset-0 flex items-center justify-center">
              <DotLottieReact
                src={`/animations/${event.lottie_animation}`}
                loop
                autoplay
                style={{ width: "80%", height: "80%" }}
              />
            </div>
          )}
          
          {/* Color overlay for better text contrast if no image */}
          {!selectedPackage.image_url && !event.promo_image_url && (
            <div 
              className="absolute inset-0"
              style={{ backgroundColor: event.color_code }}
            />
          )}
        </div>

        {/* Right Side - Content */}
        <div className="flex-1 p-5 relative">
          {/* Close Button */}
          <button
            onClick={handleClose}
            className="absolute top-3 right-3 w-6 h-6 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Title */}
          <h3 className="text-lg font-bold text-gray-900 uppercase tracking-wide pr-6 mb-2">
            {event.name}
          </h3>

          {/* Description */}
          <p className="text-sm text-gray-600 mb-4 leading-relaxed">
            {event.description || `Special ${event.name} packages now available. Don't miss out!`}
          </p>

          {/* Price Tag */}
          {selectedPackage.savings && selectedPackage.savings > 0 && (
            <div className="mb-4">
              <span 
                className="inline-block px-3 py-1 text-xs font-semibold text-white rounded-full"
                style={{ backgroundColor: event.color_code }}
              >
                Save GH₵{formatPrice(selectedPackage.savings)}
              </span>
            </div>
          )}

          {/* CTA Button */}
          <Link
            href="/shop"
            onClick={handleShopNow}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-semibold text-white rounded transition-all hover:opacity-90"
            style={{ backgroundColor: event.color_code }}
          >
            SHOP NOW
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  )
}
