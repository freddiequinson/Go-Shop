"use client"

import { useState } from "react"
import { X, Edit, Plus, Minus, AlertTriangle, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"

interface AdjustInventoryModalProps {
  isOpen: boolean
  onClose: () => void
  productId: string
  productName: string
  currentQuantity: number
  onSuccess: () => void
}

const adjustmentTypes = [
  { value: 'in', label: 'Add Stock', icon: Plus, color: 'bg-green-100 text-green-900 border-green-200' },
  { value: 'out', label: 'Remove Stock', icon: Minus, color: 'bg-orange-100 text-orange-900 border-orange-200' },
  { value: 'damaged', label: 'Mark as Damaged', icon: AlertTriangle, color: 'bg-red-100 text-red-900 border-red-200' },
  { value: 'expired', label: 'Mark as Expired', icon: Trash2, color: 'bg-purple-100 text-purple-900 border-purple-200' },
]

export default function AdjustInventoryModal({
  isOpen,
  onClose,
  productId,
  productName,
  currentQuantity,
  onSuccess
}: AdjustInventoryModalProps) {
  const { toast } = useToast()
  const [adjustmentType, setAdjustmentType] = useState('in')
  const [quantity, setQuantity] = useState("")
  const [reason, setReason] = useState("")
  const [notes, setNotes] = useState("")
  const [loading, setLoading] = useState(false)

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const quantityNum = parseFloat(quantity)
    
    // Validation
    if (!quantity || quantityNum <= 0) {
      toast({
        title: "Invalid Quantity",
        description: "Please enter a valid quantity greater than 0",
        variant: "destructive"
      })
      return
    }

    if (!reason.trim()) {
      toast({
        title: "Reason Required",
        description: "Please provide a reason for this adjustment",
        variant: "destructive"
      })
      return
    }

    // For removal types, check if sufficient quantity
    if ((adjustmentType === 'out' || adjustmentType === 'damaged' || adjustmentType === 'expired') && quantityNum > currentQuantity) {
      toast({
        title: "Insufficient Quantity",
        description: `Cannot remove ${quantityNum} units. Only ${currentQuantity} available.`,
        variant: "destructive"
      })
      return
    }

    setLoading(true)
    try {
      const token = localStorage.getItem("access_token")
      const response = await fetch(
        `${(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000') + '/api/v1'}/warehouse/inventory/adjust`,
        {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            product_id: productId,
            quantity: adjustmentType === 'in' ? quantityNum : -quantityNum,
            movement_type: adjustmentType,
            reason: reason,
            notes: notes || undefined
          })
        }
      )

      if (response.ok) {
        const typeLabel = adjustmentTypes.find(t => t.value === adjustmentType)?.label || 'Adjustment'
        toast({
          title: "Success!",
          description: `${typeLabel} completed: ${quantityNum} units`,
        })
        onSuccess()
        onClose()
        // Reset form
        setQuantity("")
        setReason("")
        setNotes("")
        setAdjustmentType('in')
      } else {
        const error = await response.json()
        toast({
          title: "Adjustment Failed",
          description: error.detail || "Failed to adjust inventory",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error("Adjustment error:", error)
      toast({
        title: "Error",
        description: "Failed to adjust inventory",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const selectedType = adjustmentTypes.find(t => t.value === adjustmentType)
  const newQuantity = adjustmentType === 'in' 
    ? currentQuantity + (parseFloat(quantity) || 0)
    : currentQuantity - (parseFloat(quantity) || 0)

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl p-8 max-w-lg w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-purple-100 rounded-2xl flex items-center justify-center">
              <Edit className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-[#303A4D]">Adjust Inventory</h2>
              <p className="text-sm text-[#303A4D]/70">{productName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full hover:bg-[#F4F2E6] flex items-center justify-center transition-colors"
          >
            <X className="w-6 h-6 text-[#303A4D]" />
          </button>
        </div>

        {/* Current Quantity */}
        <div className="bg-blue-50 border-2 border-blue-200 rounded-2xl p-4 mb-6">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-blue-900">Current Quantity</span>
            <span className="text-2xl font-bold text-blue-900">{currentQuantity}</span>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Adjustment Type */}
          <div>
            <label className="block text-[#303A4D] font-bold mb-3">
              Adjustment Type *
            </label>
            <div className="grid grid-cols-2 gap-3">
              {adjustmentTypes.map((type) => {
                const Icon = type.icon
                const isSelected = adjustmentType === type.value
                
                return (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => setAdjustmentType(type.value)}
                    className={`p-4 rounded-2xl border-2 text-left transition-all ${
                      isSelected
                        ? `${type.color} ring-2 ring-offset-2`
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className={`w-5 h-5 ${isSelected ? '' : 'text-gray-600'}`} />
                      <span className={`font-bold text-sm ${isSelected ? '' : 'text-gray-900'}`}>
                        {type.label}
                      </span>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Quantity Input */}
          <div>
            <label className="block text-[#303A4D] font-bold mb-2">
              Quantity *
            </label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="w-full bg-[#F4F2E6] rounded-2xl px-4 py-3 text-[#303A4D] focus:outline-none focus:ring-2 focus:ring-[#FED141]"
              placeholder="Enter quantity"
              required
            />
          </div>

          {/* Preview */}
          {quantity && parseFloat(quantity) > 0 && (
            <div className={`rounded-2xl p-4 border-2 ${selectedType?.color || 'bg-gray-100 border-gray-200'}`}>
              <p className="font-bold mb-2">Preview:</p>
              <div className="flex items-center justify-between">
                <span>Current:</span>
                <span className="font-bold">{currentQuantity}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>{adjustmentType === 'in' ? 'Adding:' : 'Removing:'}</span>
                <span className="font-bold">{adjustmentType === 'in' ? '+' : '-'}{parseFloat(quantity)}</span>
              </div>
              <div className="border-t-2 border-current/20 my-2"></div>
              <div className="flex items-center justify-between">
                <span className="font-bold">New Quantity:</span>
                <span className="text-xl font-bold">{newQuantity.toFixed(2)}</span>
              </div>
            </div>
          )}

          {/* Reason */}
          <div>
            <label className="block text-[#303A4D] font-bold mb-2">
              Reason *
            </label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full bg-[#F4F2E6] rounded-2xl px-4 py-3 text-[#303A4D] focus:outline-none focus:ring-2 focus:ring-[#FED141]"
              placeholder="e.g., Stock count correction, Supplier delivery, Customer return"
              required
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-[#303A4D] font-bold mb-2">
              Additional Notes (Optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-[#F4F2E6] rounded-2xl px-4 py-3 text-[#303A4D] focus:outline-none focus:ring-2 focus:ring-[#FED141] min-h-[80px]"
              placeholder="Add any additional details..."
            />
          </div>

          {/* Warning for removal */}
          {(adjustmentType === 'damaged' || adjustmentType === 'expired') && (
            <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-4">
              <p className="text-sm text-red-900">
                <strong>Warning:</strong> This will mark the quantity as {adjustmentType} and remove it from available stock.
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              onClick={onClose}
              className="flex-1 bg-white hover:bg-[#F4F2E6] text-[#303A4D] rounded-full py-3 font-bold border-2 border-[#303A4D]"
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className={`flex-1 rounded-full py-3 font-bold text-white ${
                selectedType?.value === 'in' ? 'bg-green-600 hover:bg-green-700' :
                selectedType?.value === 'out' ? 'bg-orange-600 hover:bg-orange-700' :
                selectedType?.value === 'damaged' ? 'bg-red-600 hover:bg-red-700' :
                'bg-purple-600 hover:bg-purple-700'
              }`}
              disabled={loading}
            >
              {loading ? "Adjusting..." : "Confirm Adjustment"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
