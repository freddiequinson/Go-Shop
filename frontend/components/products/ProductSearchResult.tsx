"use client"

import { Package, Tag, Boxes, TrendingUp, AlertTriangle, CheckCircle } from "lucide-react"
import Image from "next/image"

interface Product {
  id: string
  name: string
  sku?: string
  barcode?: string
  price_per_unit: number
  unit_type: string
  stock_quantity?: number
  category_id?: string
  images?: string[]
  supplier_count?: number
  is_active: boolean
  similarity?: number
}

interface ProductSearchResultProps {
  product: Product
  similarity: number
  onSelect: (product: Product) => void
}

export default function ProductSearchResult({
  product,
  similarity,
  onSelect
}: ProductSearchResultProps) {
  
  // Get similarity badge color and label
  const getSimilarityBadge = (score: number) => {
    if (score >= 90) {
      return {
        color: "bg-green-100 text-green-700 border-green-300",
        label: "Exact Match",
        icon: CheckCircle
      }
    } else if (score >= 70) {
      return {
        color: "bg-yellow-100 text-yellow-700 border-yellow-300",
        label: "Close Match",
        icon: TrendingUp
      }
    } else {
      return {
        color: "bg-gray-100 text-gray-700 border-gray-300",
        label: "Partial Match",
        icon: Package
      }
    }
  }

  // Get stock status
  const getStockStatus = () => {
    if (!product.stock_quantity || product.stock_quantity === 0) {
      return {
        color: "text-red-600",
        label: "Out of Stock",
        icon: AlertTriangle
      }
    } else if (product.stock_quantity < 10) {
      return {
        color: "text-yellow-600",
        label: "Low Stock",
        icon: AlertTriangle
      }
    } else {
      return {
        color: "text-green-600",
        label: "In Stock",
        icon: CheckCircle
      }
    }
  }

  const similarityBadge = getSimilarityBadge(similarity)
  const stockStatus = getStockStatus()
  const SimilarityIcon = similarityBadge.icon
  const StockIcon = stockStatus.icon

  // Get first image or placeholder
  const productImage = product.images && product.images.length > 0 
    ? product.images[0] 
    : null

  return (
    <button
      onClick={() => onSelect(product)}
      className="w-full p-4 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0 text-left"
    >
      <div className="flex items-start gap-4">
        {/* Product Image */}
        <div className="w-16 h-16 bg-gray-100 rounded-lg flex-shrink-0 overflow-hidden relative">
          {productImage ? (
            <Image
              src={productImage}
              alt={product.name}
              fill
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Package className="w-8 h-8 text-gray-400" />
            </div>
          )}
        </div>

        {/* Product Details */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="flex-1">
              <h4 className="font-bold text-[#303A4D] mb-1 line-clamp-1">
                {product.name}
              </h4>
              <div className="flex flex-wrap items-center gap-2 text-xs text-[#303A4D]/60">
                {product.sku && (
                  <span className="flex items-center gap-1">
                    <Tag className="w-3 h-3" />
                    SKU: {product.sku}
                  </span>
                )}
                {product.barcode && (
                  <span className="flex items-center gap-1">
                    <Tag className="w-3 h-3" />
                    Barcode: {product.barcode}
                  </span>
                )}
              </div>
            </div>

            {/* Similarity Badge */}
            <span className={`px-2 py-1 rounded-full text-xs font-bold border-2 flex items-center gap-1 whitespace-nowrap ${similarityBadge.color}`}>
              <SimilarityIcon className="w-3 h-3" />
              {similarity}%
            </span>
          </div>

          {/* Price and Stock Info */}
          <div className="flex flex-wrap items-center gap-3 mb-2">
            <div className="flex items-center gap-1">
              <span className="text-sm font-bold text-[#303A4D]">
                GH₵{Number(product.price_per_unit).toFixed(2)}
              </span>
              <span className="text-xs text-[#303A4D]/60">
                per {product.unit_type}
              </span>
            </div>

            <div className={`flex items-center gap-1 text-xs font-semibold ${stockStatus.color}`}>
              <StockIcon className="w-3 h-3" />
              {stockStatus.label}
              {product.stock_quantity && product.stock_quantity > 0 && (
                <span className="text-[#303A4D]/60">
                  ({product.stock_quantity} {product.unit_type})
                </span>
              )}
            </div>
          </div>

          {/* Supplier Count */}
          {product.supplier_count !== undefined && (
            <div className="flex items-center gap-1 text-xs text-[#303A4D]/60">
              <Boxes className="w-3 h-3" />
              <span>
                {product.supplier_count === 0 ? (
                  <span className="text-red-600 font-semibold">No suppliers</span>
                ) : (
                  <>
                    <span className="font-semibold text-[#303A4D]">{product.supplier_count}</span>
                    {' '}supplier{product.supplier_count !== 1 ? 's' : ''} available
                  </>
                )}
              </span>
            </div>
          )}

          {/* Status Badge */}
          {!product.is_active && (
            <div className="mt-2">
              <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-bold rounded">
                Inactive
              </span>
            </div>
          )}
        </div>
      </div>
    </button>
  )
}
