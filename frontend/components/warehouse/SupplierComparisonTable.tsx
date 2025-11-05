"use client"

import { Star, Clock, TrendingUp, Phone, Mail, CheckCircle, Award } from "lucide-react"

interface SupplierInfo {
  supplier_id: string
  supplier_name: string
  supplier_type: string
  unit_cost: number
  lead_time_days: number
  supply_capacity?: number
  minimum_order_quantity: number
  rating: number
  quality_rating: number
  on_time_delivery_rate: number
  is_preferred: boolean
  last_supply_date?: string
  phone: string
  email?: string
}

interface SupplierComparisonTableProps {
  suppliers: SupplierInfo[]
  unitType: string
  onSelectSupplier: (supplierId: string) => void
  selectedSupplierId?: string
}

export default function SupplierComparisonTable({
  suppliers,
  unitType,
  onSelectSupplier,
  selectedSupplierId
}: SupplierComparisonTableProps) {
  
  if (suppliers.length === 0) {
    return null
  }

  // Find best price
  const lowestPrice = Math.min(...suppliers.map(s => s.unit_cost))
  
  // Format date
  const formatDate = (dateString?: string) => {
    if (!dateString) return "Never"
    const date = new Date(dateString)
    return date.toLocaleDateString()
  }

  return (
    <div className="space-y-4">
      {/* Desktop Table View */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b-2 border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-semibold text-[#303A4D]">Supplier</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-[#303A4D]">Price</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-[#303A4D]">Lead Time</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-[#303A4D]">Min Order</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-[#303A4D]">Rating</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-[#303A4D]">Quality</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-[#303A4D]">On-Time</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-[#303A4D]">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {suppliers.map((supplier) => {
              const isBestPrice = supplier.unit_cost === lowestPrice
              const isSelected = selectedSupplierId === supplier.supplier_id
              
              return (
                <tr 
                  key={supplier.supplier_id}
                  className={`hover:bg-gray-50 transition-colors ${isSelected ? 'bg-[#FED141]/10' : ''}`}
                >
                  <td className="px-4 py-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-[#303A4D]">{supplier.supplier_name}</p>
                        {supplier.is_preferred && (
                          <span className="px-2 py-0.5 bg-[#FED141] text-[#303A4D] text-xs font-bold rounded-full flex items-center gap-1">
                            <Award className="w-3 h-3" />
                            Preferred
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-[#303A4D]/60 capitalize">{supplier.supplier_type}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Phone className="w-3 h-3 text-[#303A4D]/60" />
                        <span className="text-xs text-[#303A4D]/60">{supplier.phone}</span>
                      </div>
                    </div>
                  </td>
                  
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2">
                      <p className="text-lg font-bold text-[#303A4D]">
                        GH₵{supplier.unit_cost.toFixed(2)}
                      </p>
                      {isBestPrice && (
                        <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-bold rounded-full">
                          Best Price
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-[#303A4D]/60">per {unitType}</p>
                  </td>
                  
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-[#303A4D]/60" />
                      <span className="font-semibold text-[#303A4D]">{supplier.lead_time_days} days</span>
                    </div>
                  </td>
                  
                  <td className="px-4 py-4">
                    <p className="font-semibold text-[#303A4D]">
                      {supplier.minimum_order_quantity} {unitType}
                    </p>
                    {supplier.supply_capacity && (
                      <p className="text-xs text-[#303A4D]/60">
                        Max: {supplier.supply_capacity} {unitType}
                      </p>
                    )}
                  </td>
                  
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                      <span className="font-bold text-[#303A4D]">{supplier.rating.toFixed(1)}</span>
                      <span className="text-xs text-[#303A4D]/60">/5.0</span>
                    </div>
                  </td>
                  
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-1">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span className="font-bold text-[#303A4D]">{supplier.quality_rating.toFixed(1)}</span>
                      <span className="text-xs text-[#303A4D]/60">/5.0</span>
                    </div>
                  </td>
                  
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-1">
                      <TrendingUp className="w-4 h-4 text-blue-600" />
                      <span className="font-bold text-[#303A4D]">{supplier.on_time_delivery_rate.toFixed(0)}%</span>
                    </div>
                  </td>
                  
                  <td className="px-4 py-4">
                    <button
                      onClick={() => onSelectSupplier(supplier.supplier_id)}
                      className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                        isSelected
                          ? 'bg-[#303A4D] text-white'
                          : 'bg-[#FED141] text-[#303A4D] hover:bg-[#FED141]/90'
                      }`}
                    >
                      {isSelected ? 'Selected' : 'Select'}
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-4">
        {suppliers.map((supplier) => {
          const isBestPrice = supplier.unit_cost === lowestPrice
          const isSelected = selectedSupplierId === supplier.supplier_id
          
          return (
            <div
              key={supplier.supplier_id}
              className={`bg-white border-2 rounded-xl p-4 ${
                isSelected ? 'border-[#FED141] bg-[#FED141]/5' : 'border-gray-200'
              }`}
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-bold text-[#303A4D]">{supplier.supplier_name}</h4>
                    {supplier.is_preferred && (
                      <span className="px-2 py-0.5 bg-[#FED141] text-[#303A4D] text-xs font-bold rounded-full flex items-center gap-1">
                        <Award className="w-3 h-3" />
                        Preferred
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[#303A4D]/60 capitalize">{supplier.supplier_type}</p>
                </div>
                
                <div className="text-right">
                  <div className="flex items-center gap-1">
                    <p className="text-xl font-bold text-[#303A4D]">
                      GH₵{supplier.unit_cost.toFixed(2)}
                    </p>
                    {isBestPrice && (
                      <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-bold rounded-full">
                        Best
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[#303A4D]/60">per {unitType}</p>
                </div>
              </div>

              {/* Metrics Grid */}
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[#303A4D]/60" />
                  <div>
                    <p className="text-xs text-[#303A4D]/60">Lead Time</p>
                    <p className="font-semibold text-[#303A4D]">{supplier.lead_time_days} days</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                  <div>
                    <p className="text-xs text-[#303A4D]/60">Rating</p>
                    <p className="font-semibold text-[#303A4D]">{supplier.rating.toFixed(1)}/5.0</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <div>
                    <p className="text-xs text-[#303A4D]/60">Quality</p>
                    <p className="font-semibold text-[#303A4D]">{supplier.quality_rating.toFixed(1)}/5.0</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-blue-600" />
                  <div>
                    <p className="text-xs text-[#303A4D]/60">On-Time</p>
                    <p className="font-semibold text-[#303A4D]">{supplier.on_time_delivery_rate.toFixed(0)}%</p>
                  </div>
                </div>
              </div>

              {/* Min Order */}
              <div className="mb-3 p-2 bg-gray-50 rounded-lg">
                <p className="text-xs text-[#303A4D]/60">Minimum Order</p>
                <p className="font-semibold text-[#303A4D]">
                  {supplier.minimum_order_quantity} {unitType}
                  {supplier.supply_capacity && ` (Max: ${supplier.supply_capacity})`}
                </p>
              </div>

              {/* Contact */}
              <div className="flex items-center gap-2 mb-3 text-xs text-[#303A4D]/60">
                <Phone className="w-3 h-3" />
                <span>{supplier.phone}</span>
              </div>

              {/* Action Button */}
              <button
                onClick={() => onSelectSupplier(supplier.supplier_id)}
                className={`w-full px-4 py-2 rounded-lg font-semibold transition-colors ${
                  isSelected
                    ? 'bg-[#303A4D] text-white'
                    : 'bg-[#FED141] text-[#303A4D] hover:bg-[#FED141]/90'
                }`}
              >
                {isSelected ? 'Selected ✓' : 'Select Supplier'}
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
