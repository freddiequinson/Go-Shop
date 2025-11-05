"use client"

import { TrendingDown, TrendingUp, Award, DollarSign } from "lucide-react"

interface SupplierPrice {
  supplier_id: string
  supplier_name: string
  unit_cost: number
  is_preferred: boolean
  rating: number
}

interface PriceComparisonChartProps {
  suppliers: SupplierPrice[]
  unitType: string
  currentPrice?: number
}

export default function PriceComparisonChart({
  suppliers,
  unitType,
  currentPrice
}: PriceComparisonChartProps) {
  
  if (suppliers.length === 0) return null

  // Calculate statistics
  const prices = suppliers.map(s => s.unit_cost)
  const minPrice = Math.min(...prices)
  const maxPrice = Math.max(...prices)
  const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length
  const priceRange = maxPrice - minPrice

  // Calculate potential savings
  const potentialSavings = currentPrice && currentPrice > minPrice 
    ? ((currentPrice - minPrice) / currentPrice * 100).toFixed(1)
    : null

  return (
    <div className="bg-white rounded-xl border-2 border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold text-[#303A4D] flex items-center gap-2">
          <DollarSign className="w-5 h-5 text-green-600" />
          Price Comparison
        </h3>
        {potentialSavings && (
          <div className="flex items-center gap-2 px-3 py-1 bg-green-100 text-green-700 rounded-full">
            <TrendingDown className="w-4 h-4" />
            <span className="text-sm font-bold">Save {potentialSavings}%</span>
          </div>
        )}
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-green-50 rounded-lg p-3 border-2 border-green-200">
          <p className="text-xs text-green-700 mb-1">Lowest Price</p>
          <p className="text-xl font-bold text-green-900">GH₵{minPrice.toFixed(2)}</p>
          <p className="text-xs text-green-600">per {unitType}</p>
        </div>
        
        <div className="bg-blue-50 rounded-lg p-3 border-2 border-blue-200">
          <p className="text-xs text-blue-700 mb-1">Average Price</p>
          <p className="text-xl font-bold text-blue-900">GH₵{avgPrice.toFixed(2)}</p>
          <p className="text-xs text-blue-600">per {unitType}</p>
        </div>
        
        <div className="bg-red-50 rounded-lg p-3 border-2 border-red-200">
          <p className="text-xs text-red-700 mb-1">Highest Price</p>
          <p className="text-xl font-bold text-red-900">GH₵{maxPrice.toFixed(2)}</p>
          <p className="text-xs text-red-600">per {unitType}</p>
        </div>
      </div>

      {/* Visual Bar Chart */}
      <div className="space-y-3">
        {suppliers
          .sort((a, b) => a.unit_cost - b.unit_cost)
          .map((supplier, index) => {
            const percentage = priceRange > 0 
              ? ((supplier.unit_cost - minPrice) / priceRange) * 100 
              : 100
            const isLowest = supplier.unit_cost === minPrice
            const isHighest = supplier.unit_cost === maxPrice
            
            return (
              <div key={supplier.supplier_id} className="relative">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-[#303A4D]">
                      {supplier.supplier_name}
                    </span>
                    {supplier.is_preferred && (
                      <Award className="w-4 h-4 text-[#FED141]" />
                    )}
                    {isLowest && (
                      <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-bold rounded-full">
                        Best Price
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold text-[#303A4D]">
                      GH₵{supplier.unit_cost.toFixed(2)}
                    </span>
                    {currentPrice && supplier.unit_cost < currentPrice && (
                      <TrendingDown className="w-4 h-4 text-green-600" />
                    )}
                    {currentPrice && supplier.unit_cost > currentPrice && (
                      <TrendingUp className="w-4 h-4 text-red-600" />
                    )}
                  </div>
                </div>
                
                {/* Price Bar */}
                <div className="relative h-8 bg-gray-100 rounded-lg overflow-hidden">
                  <div
                    className={`h-full transition-all duration-1000 ease-out flex items-center px-3 ${
                      isLowest
                        ? 'bg-gradient-to-r from-green-400 to-green-600'
                        : isHighest
                        ? 'bg-gradient-to-r from-red-400 to-red-600'
                        : 'bg-gradient-to-r from-blue-400 to-blue-600'
                    }`}
                    style={{ 
                      width: `${Math.max(percentage, 20)}%`,
                      animationDelay: `${index * 100}ms`
                    }}
                  >
                    <span className="text-xs font-bold text-white">
                      {supplier.rating.toFixed(1)} ⭐
                    </span>
                  </div>
                  
                  {/* Current price indicator */}
                  {currentPrice && (
                    <div
                      className="absolute top-0 bottom-0 w-0.5 bg-[#FED141]"
                      style={{
                        left: `${priceRange > 0 ? ((currentPrice - minPrice) / priceRange) * 100 : 50}%`
                      }}
                    >
                      <div className="absolute -top-6 left-1/2 -translate-x-1/2 whitespace-nowrap">
                        <span className="text-xs font-bold text-[#FED141]">Current</span>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Savings indicator */}
                {currentPrice && supplier.unit_cost < currentPrice && (
                  <div className="text-xs text-green-600 mt-1">
                    Save GH₵{(currentPrice - supplier.unit_cost).toFixed(2)} per {unitType}
                  </div>
                )}
              </div>
            )
          })}
      </div>

      {/* Summary */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <p className="text-sm text-[#303A4D]/70">
          <span className="font-bold">Price Range:</span> GH₵{priceRange.toFixed(2)} difference between lowest and highest
        </p>
        {potentialSavings && (
          <p className="text-sm text-green-700 font-semibold mt-1">
            💰 Choosing the lowest price could save you {potentialSavings}% on this order
          </p>
        )}
      </div>
    </div>
  )
}

// Compact version for smaller spaces
export function CompactPriceComparison({ 
  suppliers, 
  unitType 
}: { 
  suppliers: SupplierPrice[]
  unitType: string 
}) {
  if (suppliers.length === 0) return null

  const prices = suppliers.map(s => s.unit_cost)
  const minPrice = Math.min(...prices)
  const maxPrice = Math.max(...prices)

  return (
    <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
      <div className="flex-1">
        <p className="text-xs text-gray-600 mb-1">Price Range</p>
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-green-700">
            GH₵{minPrice.toFixed(2)}
          </span>
          <span className="text-xs text-gray-400">to</span>
          <span className="text-sm font-bold text-red-700">
            GH₵{maxPrice.toFixed(2)}
          </span>
        </div>
      </div>
      <div className="text-right">
        <p className="text-xs text-gray-600 mb-1">Suppliers</p>
        <p className="text-sm font-bold text-[#303A4D]">{suppliers.length}</p>
      </div>
    </div>
  )
}
