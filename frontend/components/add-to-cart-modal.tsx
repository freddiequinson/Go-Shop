"use client"

import { useState } from "react"
import { X, Minus, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import Image from "next/image"

type Product = {
  id: number | string
  name: string
  price: number
  price_per_unit?: number | string
  price_per_quantity?: number | string
  unit_type?: string
  unit: string
  vendor: string
  image: string
}

type AddToCartModalProps = {
  product: Product
  isOpen: boolean
  onClose: () => void
  onAddToCart: (product: Product, quantity: number, purchaseType: "weight" | "quantity") => void
}

export function AddToCartModal({ product, isOpen, onClose, onAddToCart }: AddToCartModalProps) {
  // Determine available purchase types - check for actual pricing fields
  const hasWeightPrice = product.price_per_unit !== undefined && 
                         product.price_per_unit !== null && 
                         product.price_per_unit !== '' &&
                         Number(product.price_per_unit) > 0
  
  const hasQuantityPrice = product.price_per_quantity !== undefined && 
                           product.price_per_quantity !== null && 
                           product.price_per_quantity !== '' &&
                           Number(product.price_per_quantity) > 0
  
  // Set default purchase type based on what's available
  const getDefaultPurchaseType = (): "weight" | "quantity" => {
    if (hasQuantityPrice && !hasWeightPrice) return "quantity"
    if (hasWeightPrice && !hasQuantityPrice) return "weight"
    if (hasQuantityPrice && hasWeightPrice) return "quantity"
    return "weight" // fallback
  }
  
  const [purchaseType, setPurchaseType] = useState<"weight" | "quantity">(getDefaultPurchaseType())
  const [quantity, setQuantity] = useState(1)

  if (!isOpen) return null

  const handleAdd = () => {
    onAddToCart(product, quantity, purchaseType)
    onClose()
    setQuantity(1)
  }

  // Calculate price based on purchase type
  const getCurrentPrice = (): number => {
    if (purchaseType === "weight" && hasWeightPrice) {
      const price = typeof product.price_per_unit === 'string' 
        ? parseFloat(product.price_per_unit) 
        : product.price_per_unit
      return price || product.price
    } else if (purchaseType === "quantity" && hasQuantityPrice) {
      const price = typeof product.price_per_quantity === 'string' 
        ? parseFloat(product.price_per_quantity) 
        : product.price_per_quantity
      return price || product.price
    }
    return product.price
  }

  const currentPrice = getCurrentPrice()
  const totalPrice = currentPrice * quantity
  
  // Show both options only if both prices are available
  const showBothOptions = hasWeightPrice && hasQuantityPrice

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 relative animate-in fade-in zoom-in duration-200">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-[#F4F2E6] flex items-center justify-center hover:bg-[#FED141] transition-colors"
        >
          <X className="w-4 h-4 text-[#303A4D]" />
        </button>

        <div className="flex gap-4 mb-6">
          <div className="relative w-24 h-24 rounded-2xl overflow-hidden bg-[#FED141]/20 flex-shrink-0">
            <Image src={product.image || "/placeholder.svg"} alt={product.name} fill className="object-cover" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-[#303A4D] mb-1">{product.name}</h3>
            <p className="text-sm text-[#303A4D]/60">{product.vendor}</p>
            <p className="text-lg font-bold text-[#303A4D] mt-2">
              GH₵{currentPrice.toFixed(2)}{" "}
              <span className="text-sm font-normal text-[#303A4D]/60">
                {purchaseType === "weight" ? `per ${product.unit_type || 'kg'}` : 'per piece'}
              </span>
            </p>
          </div>
        </div>

        {/* Purchase Type Selection - Only show if both options available */}
        {showBothOptions && (
          <div className="mb-6">
            <label className="block text-sm font-medium text-[#303A4D] mb-3">Purchase by:</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setPurchaseType("quantity")}
                className={`px-4 py-3 rounded-xl font-medium transition-all ${
                  purchaseType === "quantity"
                    ? "bg-[#FED141] text-[#303A4D] ring-2 ring-[#303A4D]"
                    : "bg-[#F4F2E6] text-[#303A4D]/60 hover:bg-[#FED141]/30"
                }`}
              >
                Quantity (Piece)
              </button>
              <button
                onClick={() => setPurchaseType("weight")}
                className={`px-4 py-3 rounded-xl font-medium transition-all ${
                  purchaseType === "weight"
                    ? "bg-[#FED141] text-[#303A4D] ring-2 ring-[#303A4D]"
                    : "bg-[#F4F2E6] text-[#303A4D]/60 hover:bg-[#FED141]/30"
                }`}
              >
                Weight ({product.unit_type || 'kg'})
              </button>
            </div>
          </div>
        )}

        {/* Quantity Selector */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-[#303A4D] mb-3">
            {purchaseType === "quantity" ? "Quantity (pieces):" : `Weight (${product.unit_type || 'kg'}):`}
          </label>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              className="w-12 h-12 rounded-full bg-[#F4F2E6] flex items-center justify-center hover:bg-[#FED141] transition-colors"
            >
              <Minus className="w-5 h-5 text-[#303A4D]" />
            </button>
            <input
              type="number"
              value={quantity}
              onChange={(e) => {
                const val = e.target.value
                if (val === '' || val === '0') {
                  setQuantity(1)
                } else {
                  const num = Number.parseInt(val)
                  if (!isNaN(num) && num > 0) {
                    setQuantity(num)
                  }
                }
              }}
              onBlur={(e) => {
                if (e.target.value === '' || Number.parseInt(e.target.value) < 1) {
                  setQuantity(1)
                }
              }}
              className="flex-1 text-center text-2xl font-bold text-[#303A4D] bg-[#F4F2E6] rounded-xl py-3 focus:outline-none focus:ring-2 focus:ring-[#FED141]"
              min="1"
            />
            <button
              onClick={() => setQuantity(quantity + 1)}
              className="w-12 h-12 rounded-full bg-[#F4F2E6] flex items-center justify-center hover:bg-[#FED141] transition-colors"
            >
              <Plus className="w-5 h-5 text-[#303A4D]" />
            </button>
          </div>
        </div>

        {/* Total Price */}
        <div className="bg-[#F4F2E6] rounded-xl p-4 mb-6">
          <div className="flex justify-between items-center">
            <span className="text-[#303A4D]/60">Total:</span>
            <span className="text-2xl font-bold text-[#303A4D]">GH₵{totalPrice.toFixed(2)}</span>
          </div>
        </div>

        {/* Add to Cart Button */}
        <Button
          onClick={handleAdd}
          className="w-full bg-[#303A4D] hover:bg-[#303A4D]/90 text-white rounded-full py-6 font-bold text-lg"
        >
          Add to Cart
        </Button>
      </div>
    </div>
  )
}
