"use client"

import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { X, ChevronLeft, ChevronRight } from "lucide-react"
import Image from "next/image"
import { useState } from "react"

interface Product {
  id: number
  name: string
  price: number
  unit: string
  category: string
  image: string
  inStock: boolean
  images: string[]
  description: string
  isBundle: boolean
  onSale: boolean
  originalPrice?: number
  bundleItems?: string[]
}

interface ProductDetailModalProps {
  product: Product
  isOpen: boolean
  onClose: () => void
  onAddToCart: () => void
  similarProducts: Product[]
  onProductClick: (product: Product) => void
}

export function ProductDetailModal({
  product,
  isOpen,
  onClose,
  onAddToCart,
  similarProducts,
  onProductClick,
}: ProductDetailModalProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0)

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % product.images.length)
  }

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + product.images.length) % product.images.length)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto bg-[#F4F2E6] p-0">
        <div className="relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center hover:bg-white transition-colors"
          >
            <X className="w-5 h-5 text-[#303A4D]" />
          </button>

          <div className="grid md:grid-cols-2 gap-8 p-8">
            {/* Image Gallery */}
            <div className="space-y-4">
              <div className="relative h-96 bg-gradient-to-br from-[#FED141]/20 to-[#FED141]/5 rounded-3xl overflow-hidden">
                <Image
                  src={product.images[currentImageIndex] || "/placeholder.svg"}
                  alt={product.name}
                  fill
                  className="object-cover"
                />
                {product.images.length > 1 && (
                  <>
                    <button
                      onClick={prevImage}
                      className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center hover:bg-white transition-colors"
                    >
                      <ChevronLeft className="w-5 h-5 text-[#303A4D]" />
                    </button>
                    <button
                      onClick={nextImage}
                      className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center hover:bg-white transition-colors"
                    >
                      <ChevronRight className="w-5 h-5 text-[#303A4D]" />
                    </button>
                  </>
                )}
                <div className="absolute top-4 left-4 flex gap-2">
                  <span className="bg-white/90 backdrop-blur-sm text-[#303A4D] px-4 py-2 rounded-full text-sm font-medium">
                    {product.category}
                  </span>
                  {product.onSale && (
                    <span className="bg-[#C24628] text-white px-4 py-2 rounded-full text-sm font-bold">SALE</span>
                  )}
                  {product.isBundle && (
                    <span className="bg-[#93C90F] text-white px-4 py-2 rounded-full text-sm font-bold">BUNDLE</span>
                  )}
                </div>
              </div>

              {/* Thumbnail Gallery */}
              {product.images.length > 1 && (
                <div className="flex gap-2 overflow-x-auto">
                  {product.images.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentImageIndex(idx)}
                      className={`relative w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 ${
                        idx === currentImageIndex ? "ring-2 ring-[#FED141]" : ""
                      }`}
                    >
                      <Image
                        src={img || "/placeholder.svg"}
                        alt={`${product.name} ${idx + 1}`}
                        fill
                        className="object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Product Details */}
            <div className="space-y-6">
              <div>
                <h2 className="text-4xl font-bold text-[#303A4D] mb-2">{product.name}</h2>
                <p className="text-lg text-[#303A4D]/70">{product.description}</p>
              </div>

              <div className="flex items-baseline gap-3">
                <span className="text-5xl font-bold text-[#303A4D]">GH₵{product.price.toFixed(2)}</span>
                {product.onSale && product.originalPrice && (
                  <span className="text-2xl text-[#303A4D]/40 line-through">GH₵{product.originalPrice.toFixed(2)}</span>
                )}
                <span className="text-lg text-[#303A4D]/60 font-medium">{product.unit}</span>
              </div>

              {product.isBundle && product.bundleItems && (
                <div className="bg-white rounded-2xl p-6">
                  <h3 className="text-xl font-bold text-[#303A4D] mb-3">Bundle Includes:</h3>
                  <ul className="space-y-2">
                    {product.bundleItems.map((item, idx) => (
                      <li key={idx} className="flex items-center gap-2 text-[#303A4D]">
                        <span className="w-2 h-2 rounded-full bg-[#FED141]" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="bg-white rounded-2xl p-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[#303A4D] font-medium">Availability:</span>
                  <span className={`font-bold ${product.inStock ? "text-[#93C90F]" : "text-[#C24628]"}`}>
                    {product.inStock ? "In Stock" : "Out of Stock"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#303A4D] font-medium">Sold by:</span>
                  <span className="font-bold text-[#303A4D]">Go-Shop</span>
                </div>
              </div>

              <Button
                onClick={onAddToCart}
                disabled={!product.inStock}
                className="w-full bg-[#FED141] hover:bg-[#F1B424] text-[#303A4D] rounded-full py-6 font-bold text-xl shadow-sm hover:shadow-md transition-all"
              >
                {product.inStock ? "Add to Cart" : "Out of Stock"}
              </Button>
            </div>
          </div>

          {/* Similar Products */}
          {similarProducts.length > 0 && (
            <div className="px-8 pb-8">
              <h3 className="text-2xl font-bold text-[#303A4D] mb-6">Similar Products</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {similarProducts.map((similar) => (
                  <button
                    key={similar.id}
                    onClick={() => onProductClick(similar)}
                    className="bg-white rounded-2xl overflow-hidden hover:shadow-lg transition-shadow text-left"
                  >
                    <div className="relative h-40 bg-gradient-to-br from-[#FED141]/20 to-[#FED141]/5">
                      <Image
                        src={similar.image || "/placeholder.svg"}
                        alt={similar.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="p-4">
                      <h4 className="font-bold text-[#303A4D] mb-1 line-clamp-1">{similar.name}</h4>
                      <p className="text-lg font-bold text-[#303A4D]">GH₵{similar.price.toFixed(2)}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
