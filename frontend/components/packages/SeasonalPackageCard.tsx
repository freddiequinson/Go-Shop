"use client"

import { useState } from "react"
import { ShoppingBag, Package, ArrowRight } from "lucide-react"
import Link from "next/link"

interface PackageData {
  id: string
  name: string
  description: string | null
  image_url: string | null
  package_price: number
  original_value: number | null
  savings: number | null
  items_count: number
  is_active: boolean
  is_featured: boolean
}

interface SeasonalPackageCardProps {
  pkg: PackageData
  eventColor: string
  onAddToCart?: (packageId: string) => void
}

export default function SeasonalPackageCard({ pkg, eventColor, onAddToCart }: SeasonalPackageCardProps) {
  const [isHovered, setIsHovered] = useState(false)
  const [adding, setAdding] = useState(false)

  const formatPrice = (price: number | null | undefined) => {
    if (price === null || price === undefined) return "0.00"
    return Number(price).toFixed(2)
  }

  const handleAddToCart = async () => {
    if (adding) return
    setAdding(true)
    
    try {
      if (onAddToCart) {
        onAddToCart(pkg.id)
      }
    } finally {
      setTimeout(() => setAdding(false), 500)
    }
  }

  // Calculate discount percentage
  const discountPercent = pkg.original_value && pkg.package_price 
    ? Math.round((1 - pkg.package_price / pkg.original_value) * 100)
    : 0

  return (
    <div
      className="group relative bg-white rounded-xl overflow-hidden transition-all duration-500 hover:shadow-2xl"
      style={{ 
        boxShadow: isHovered 
          ? `0 20px 40px ${eventColor}25, 0 0 0 1px ${eventColor}30` 
          : '0 4px 20px rgba(0,0,0,0.08)'
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Package Image with Overlay */}
      <div className="relative h-52 overflow-hidden">
        {pkg.image_url ? (
          <img
            src={pkg.image_url}
            alt={pkg.name}
            className={`w-full h-full object-cover transition-transform duration-700 ${
              isHovered ? 'scale-110' : 'scale-100'
            }`}
          />
        ) : (
          <div 
            className="w-full h-full flex items-center justify-center"
            style={{ backgroundColor: `${eventColor}15` }}
          >
            <Package className="w-20 h-20" style={{ color: `${eventColor}40` }} />
          </div>
        )}
        
        {/* Gradient Overlay */}
        <div 
          className={`absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent transition-opacity duration-300 ${
            isHovered ? 'opacity-80' : 'opacity-60'
          }`}
        />

        {/* Discount Badge */}
        {discountPercent > 0 && (
          <div 
            className="absolute top-4 left-4 px-3 py-1.5 text-white text-sm font-bold rounded-lg"
            style={{ backgroundColor: eventColor }}
          >
            -{discountPercent}% OFF
          </div>
        )}

        {/* Items Count Badge */}
        <div className="absolute top-4 right-4 px-3 py-1.5 bg-white/90 backdrop-blur-sm text-gray-800 text-sm font-medium rounded-lg flex items-center gap-1.5">
          <ShoppingBag className="w-3.5 h-3.5" />
          {pkg.items_count} items
        </div>

        {/* Title Overlay on Image */}
        <div className="absolute bottom-0 left-0 right-0 p-5">
          <h3 className="text-xl font-bold text-white mb-1 drop-shadow-lg line-clamp-1">
            {pkg.name}
          </h3>
          {pkg.description && (
            <p className="text-white/80 text-sm line-clamp-1 drop-shadow">
              {pkg.description}
            </p>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-5">
        {/* Pricing Row */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-baseline gap-2">
            <span 
              className="text-2xl font-bold"
              style={{ color: eventColor }}
            >
              GH₵{formatPrice(pkg.package_price)}
            </span>
            {pkg.original_value && (
              <span className="text-sm text-gray-400 line-through">
                GH₵{formatPrice(pkg.original_value)}
              </span>
            )}
          </div>
          {pkg.savings && pkg.savings > 0 && (
            <span 
              className="text-sm font-semibold px-2 py-0.5 rounded"
              style={{ 
                backgroundColor: `${eventColor}15`,
                color: eventColor 
              }}
            >
              Save GH₵{formatPrice(pkg.savings)}
            </span>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={handleAddToCart}
            disabled={adding}
            className="flex-1 py-3 rounded-lg font-semibold text-white transition-all duration-300 hover:opacity-90 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
            style={{ backgroundColor: eventColor }}
          >
            {adding ? "Adding..." : "Add to Cart"}
          </button>
          <Link
            href={`/shop?package=${pkg.id}`}
            className="w-12 h-12 flex items-center justify-center rounded-lg border-2 transition-all duration-300 hover:scale-105"
            style={{ 
              borderColor: eventColor,
              color: eventColor
            }}
          >
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </div>
    </div>
  )
}
