"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { 
  ArrowLeft, Package, MapPin, Thermometer, Eye, EyeOff, 
  TrendingUp, AlertCircle, Calendar, Truck, BarChart3,
  Edit, Trash2, ShoppingCart, DollarSign, Tag, CheckCircle, XCircle
} from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import AssignLocationModal from "@/components/warehouse/AssignLocationModal"
import AdjustInventoryModal from "@/components/warehouse/AdjustInventoryModal"

// Zone theme configuration
const zoneThemes = {
  COLD_ROOM: {
    primary: '#E0F2FE',      // Sky blue 50
    secondary: '#0EA5E9',    // Sky 500
    accent: '#0284C7',       // Sky 600
    text: '#075985',         // Sky 800
    border: '#BAE6FD',       // Sky 200
    name: 'Cold Room',
    icon: '❄️'
  },
  FREEZER: {
    primary: '#DBEAFE',      // Blue 50
    secondary: '#3B82F6',    // Blue 500
    accent: '#2563EB',       // Blue 600
    text: '#1E40AF',         // Blue 800
    border: '#BFDBFE',       // Blue 200
    name: 'Freezer',
    icon: '🧊'
  },
  REFRIGERATED: {
    primary: '#ECFEFF',      // Cyan 50
    secondary: '#06B6D4',    // Cyan 500
    accent: '#0891B2',       // Cyan 600
    text: '#155E75',         // Cyan 800
    border: '#A5F3FC',       // Cyan 200
    name: 'Refrigerated',
    icon: '🌡️'
  },
  DRY_STORAGE: {
    primary: '#FEF3C7',      // Amber 50
    secondary: '#F59E0B',    // Amber 500
    accent: '#D97706',       // Amber 600
    text: '#92400E',         // Amber 800
    border: '#FDE68A',       // Amber 200
    name: 'Dry Storage',
    icon: '📦'
  },
  AMBIENT: {
    primary: '#FEF9C3',      // Yellow 50
    secondary: '#EAB308',    // Yellow 500
    accent: '#CA8A04',       // Yellow 600
    text: '#854D0E',         // Yellow 800
    border: '#FEF08A',       // Yellow 200
    name: 'Ambient',
    icon: '🌤️'
  },
  DEFAULT: {
    primary: '#F4F2E6',
    secondary: '#FED141',
    accent: '#F1B424',
    text: '#303A4D',
    border: '#E5E3D8',
    name: 'Unassigned',
    icon: '📍'
  }
}

interface InventoryData {
  id: string
  product_id: string
  quantity_available: number
  quantity_reserved: number
  quantity_damaged: number
  reorder_level: number
  zone: string
  warehouse_location_id?: string
  location_in_warehouse?: string
  expiry_date?: string
  batch_number?: string
  total_value: number
  cost_price: number
  unit_cost?: number
  total_cost?: number
  
  // Product details
  product_name?: string
  product_description?: string
  is_published?: boolean
  created_by_type?: string
  price_per_unit?: number  // Selling price (what customers pay)
  product_cost_price?: number  // What we paid supplier
  
  // Location details
  location_name?: string
  location_code?: string
  zone_type?: string
  temperature_min?: number
  temperature_max?: number
  
  // Supplier
  supplier_id?: string
  supplier_name?: string
}

interface Movement {
  id: string
  movement_type: string
  quantity: number
  reason?: string
  notes?: string
  created_at: string
  created_by_name?: string
}

export default function WarehouseProductDetailPage() {
  const router = useRouter()
  const params = useParams()
  const productId = params?.productId as string
  const { toast } = useToast()

  const [inventory, setInventory] = useState<InventoryData | null>(null)
  const [movements, setMovements] = useState<Movement[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMovements, setLoadingMovements] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [showAssignModal, setShowAssignModal] = useState(false)
  const [showAdjustModal, setShowAdjustModal] = useState(false)

  // Get theme based on zone type
  const theme = inventory?.zone_type 
    ? zoneThemes[inventory.zone_type as keyof typeof zoneThemes] || zoneThemes.DEFAULT
    : zoneThemes.DEFAULT

  useEffect(() => {
    if (productId) {
      fetchInventoryDetails()
      fetchMovementHistory()
    }
  }, [productId])

  const fetchInventoryDetails = async () => {
    try {
      const token = localStorage.getItem("access_token")
      const response = await fetch(`${(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000') + '/api/v1'}/warehouse/inventory/${productId}`, {
        headers: { "Authorization": `Bearer ${token}` }
      })

      if (response.ok) {
        const data = await response.json()
        setInventory(data)
      } else {
        toast({
          title: "Error",
          description: "Failed to load inventory details",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error("Failed to fetch inventory:", error)
      toast({
        title: "Error",
        description: "Failed to load inventory details",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchMovementHistory = async () => {
    setLoadingMovements(true)
    try {
      const token = localStorage.getItem("access_token")
      const response = await fetch(`${(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000') + '/api/v1'}/warehouse/inventory/${productId}/movements`, {
        headers: { "Authorization": `Bearer ${token}` }
      })

      if (response.ok) {
        const data = await response.json()
        setMovements(data)
      }
    } catch (error) {
      console.error("Failed to fetch movements:", error)
    } finally {
      setLoadingMovements(false)
    }
  }

  const handlePublish = async () => {
    if (!inventory) return
    setPublishing(true)
    try {
      const token = localStorage.getItem("access_token")
      const response = await fetch(`${(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000') + '/api/v1'}/warehouse/products/${productId}/publish`, {
        method: "PUT",
        headers: { "Authorization": `Bearer ${token}` }
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Product published to shop successfully!",
        })
        fetchInventoryDetails()
      } else {
        const error = await response.json()
        toast({
          title: "Error",
          description: error.detail || "Failed to publish product",
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to publish product",
        variant: "destructive"
      })
    } finally {
      setPublishing(false)
    }
  }

  const handleUnpublish = async () => {
    if (!inventory) return
    setPublishing(true)
    try {
      const token = localStorage.getItem("access_token")
      const response = await fetch(`${(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000') + '/api/v1'}/warehouse/products/${productId}/unpublish`, {
        method: "PUT",
        headers: { "Authorization": `Bearer ${token}` }
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Product removed from shop",
        })
        fetchInventoryDetails()
      } else {
        const error = await response.json()
        toast({
          title: "Error",
          description: error.detail || "Failed to unpublish product",
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to unpublish product",
        variant: "destructive"
      })
    } finally {
      setPublishing(false)
    }
  }

  const formatNumber = (num: number | undefined) => {
    if (!num) return "0"
    return Number(num).toFixed(2)
  }

  if (loading) {
    return <div className="p-8 text-center">Loading inventory details...</div>
  }

  if (!inventory) {
    return (
      <div className="p-8 text-center">
        <Package className="w-16 h-16 text-[#303A4D]/20 mx-auto mb-4" />
        <p className="text-xl font-bold text-[#303A4D]">Product Not Found in Warehouse</p>
        <Link href="/admin/warehouse">
          <Button className="mt-4 bg-[#FED141] hover:bg-[#F1B424] text-[#303A4D]">
            Back to Warehouse
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F4F2E6]">
      {/* Header */}
      <div className="bg-white border-b border-[#303A4D]/10 px-8 py-6">
        <Link href="/admin/warehouse" className="inline-flex items-center text-[#303A4D]/70 hover:text-[#303A4D] mb-4">
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back to Warehouse
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-[#303A4D] mb-2">
              {inventory.product_name || "Unknown Product"}
            </h1>
            <p className="text-lg text-[#303A4D]/70">{inventory.product_description}</p>
            {inventory.created_by_type === 'supplier' && (
              <span className="inline-block mt-2 px-3 py-1 bg-purple-100 text-purple-700 text-sm rounded-full font-bold">
                Supplier Product
              </span>
            )}
          </div>
          <div className="flex gap-3">
            {inventory.is_published ? (
              <button
                onClick={handleUnpublish}
                disabled={publishing}
                className="flex items-center gap-2 px-6 py-3 bg-red-100 text-red-700 hover:bg-red-200 rounded-2xl font-bold transition-colors disabled:opacity-50"
              >
                <EyeOff className="w-5 h-5" />
                {publishing ? "Removing..." : "Remove from Shop"}
              </button>
            ) : (
              <button
                onClick={handlePublish}
                disabled={publishing}
                className="flex items-center gap-2 px-6 py-3 bg-[#FED141] text-[#303A4D] hover:bg-[#F1B424] rounded-2xl font-bold transition-colors disabled:opacity-50"
              >
                <Eye className="w-5 h-5" />
                {publishing ? "Publishing..." : "Publish to Shop"}
              </button>
            )}
            <Link href={`/admin/products/${productId}/edit`}>
              <Button className="bg-[#303A4D] hover:bg-[#303A4D]/90 text-white px-6 py-3 rounded-2xl">
                <Edit className="w-5 h-5 mr-2" />
                Edit Product
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Location Banner - Full Width with Theme */}
      <div 
        className="px-8 py-6 border-b"
        style={{ 
          backgroundColor: theme.primary,
          borderColor: theme.border
        }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div 
              className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl"
              style={{ backgroundColor: theme.secondary + '20' }}
            >
              {theme.icon}
            </div>
            <div>
              <p className="text-sm font-medium" style={{ color: theme.text + 'B3' }}>
                Storage Location
              </p>
              <h2 className="text-2xl font-bold" style={{ color: theme.text }}>
                {inventory.location_name || theme.name}
              </h2>
              {inventory.location_code && (
                <p className="text-sm font-medium" style={{ color: theme.text + '99' }}>
                  Code: {inventory.location_code}
                  {inventory.location_in_warehouse && ` • Shelf: ${inventory.location_in_warehouse}`}
                </p>
              )}
            </div>
          </div>
          {inventory.temperature_min !== undefined && inventory.temperature_max !== undefined && (
            <div 
              className="px-6 py-3 rounded-2xl"
              style={{ backgroundColor: 'white', borderColor: theme.border, borderWidth: '2px' }}
            >
              <div className="flex items-center gap-2">
                <Thermometer className="w-5 h-5" style={{ color: theme.secondary }} />
                <div>
                  <p className="text-xs font-medium" style={{ color: theme.text + '99' }}>Temperature Range</p>
                  <p className="text-lg font-bold" style={{ color: theme.text }}>
                    {inventory.temperature_min}°C - {inventory.temperature_max}°C
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="p-8">
        {/* Stock Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Warehouse Quantity */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border-2 border-[#303A4D]/20">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 bg-[#FED141]/20 rounded-2xl flex items-center justify-center">
                <Package className="w-6 h-6 text-[#303A4D]" />
              </div>
              <div>
                <p className="text-sm text-[#303A4D]/70 font-medium">Warehouse Stock</p>
                <p className="text-3xl font-bold text-[#303A4D]">
                  {formatNumber(inventory.quantity_available)}
                </p>
              </div>
            </div>
            <p className="text-xs text-[#303A4D]/60">
              {inventory.is_published ? 'Synced with shop' : 'Ready to publish'}
            </p>
          </div>

          {/* Damaged Quantity */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border-2 border-red-200">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 bg-red-100 rounded-2xl flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-red-900/70 font-medium">Damaged</p>
                <p className="text-3xl font-bold text-red-900">
                  {formatNumber(inventory.quantity_damaged)}
                </p>
              </div>
            </div>
            <p className="text-xs text-red-900/60">Needs attention</p>
          </div>

          {/* Total Value */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border-2 border-[#303A4D]/20">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 bg-[#FED141]/20 rounded-2xl flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-[#303A4D]" />
              </div>
              <div>
                <p className="text-sm text-[#303A4D]/70 font-medium">Total Value</p>
                <p className="text-3xl font-bold text-[#303A4D]">
                  GH₵{formatNumber(inventory.total_value)}
                </p>
              </div>
            </div>
            <p className="text-xs text-[#303A4D]/60">
              @ GH₵{formatNumber(inventory.cost_price)} per unit
            </p>
          </div>
        </div>

        {/* Additional Info */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Inventory Details */}
          <div className="bg-white rounded-3xl p-6 shadow-sm">
            <h3 className="text-xl font-bold text-[#303A4D] mb-4">Inventory Details</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-[#F4F2E6] rounded-2xl">
                <span className="text-[#303A4D]/70 font-medium">Reorder Level</span>
                <span className="font-bold text-[#303A4D]">{formatNumber(inventory.reorder_level)}</span>
              </div>
              {inventory.batch_number && (
                <div className="flex items-center justify-between p-3 bg-[#F4F2E6] rounded-2xl">
                  <span className="text-[#303A4D]/70 font-medium">Batch Number</span>
                  <span className="font-bold text-[#303A4D]">{inventory.batch_number}</span>
                </div>
              )}
              {inventory.expiry_date && (
                <div className="flex items-center justify-between p-3 bg-orange-50 rounded-2xl border-2 border-orange-200">
                  <span className="text-orange-900/70 font-medium">Expiry Date</span>
                  <span className="font-bold text-orange-900">
                    {new Date(inventory.expiry_date).toLocaleDateString()}
                  </span>
                </div>
              )}
              <div className="flex items-center justify-between p-3 bg-[#F4F2E6] rounded-2xl">
                <span className="text-[#303A4D]/70 font-medium">Shop Status</span>
                {inventory.is_published ? (
                  <span className="flex items-center gap-2 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-bold">
                    <CheckCircle className="w-4 h-4" />
                    Published
                  </span>
                ) : (
                  <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm font-bold">
                    Warehouse Only
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-3xl p-6 shadow-sm">
            <h3 className="text-xl font-bold text-[#303A4D] mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <button 
                onClick={() => setShowAssignModal(true)}
                className="w-full flex items-center gap-3 p-4 bg-white hover:bg-[#F4F2E6] border-2 border-[#303A4D]/20 rounded-2xl font-bold text-[#303A4D] transition-colors"
              >
                <MapPin className="w-5 h-5" />
                Assign Warehouse Location
              </button>
              <button 
                onClick={() => setShowAdjustModal(true)}
                className="w-full flex items-center gap-3 p-4 bg-white hover:bg-[#F4F2E6] border-2 border-[#303A4D]/20 rounded-2xl font-bold text-[#303A4D] transition-colors"
              >
                <Edit className="w-5 h-5" />
                Adjust Inventory
              </button>
            </div>
          </div>
        </div>

        {/* Financial Details */}
        <div className="bg-white rounded-3xl p-6 shadow-sm mt-6">
          <h3 className="text-xl font-bold text-[#303A4D] mb-4">Financial Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-white rounded-2xl border-2 border-[#303A4D]/20">
              <p className="text-sm text-[#303A4D]/70 font-medium mb-1">Supplier Cost</p>
              <p className="text-2xl font-bold text-[#303A4D]">
                GH₵{formatNumber(inventory.product_cost_price || inventory.unit_cost || inventory.cost_price)}
              </p>
              <p className="text-xs text-[#303A4D]/60 mt-1">What we paid supplier</p>
            </div>
            
            <div className="p-4 bg-white rounded-2xl border-2 border-[#303A4D]/20">
              <p className="text-sm text-[#303A4D]/70 font-medium mb-1">Selling Price</p>
              {inventory.price_per_unit ? (
                <>
                  <p className="text-2xl font-bold text-[#303A4D]">
                    GH₵{formatNumber(inventory.price_per_unit)}
                  </p>
                  <p className="text-xs text-[#303A4D]/60 mt-1">What customers pay</p>
                </>
              ) : (
                <>
                  <p className="text-2xl font-bold text-gray-400">Not Set</p>
                  <p className="text-xs text-gray-500 mt-1">Edit product to set price</p>
                </>
              )}
            </div>
            
            {inventory.price_per_unit ? (
              <div className="p-4 bg-white rounded-2xl border-2 border-[#303A4D]/20">
                <p className="text-sm text-[#303A4D]/70 font-medium mb-1">Profit Margin</p>
                <p className="text-2xl font-bold text-[#303A4D]">
                  {(() => {
                    const cost = inventory.product_cost_price || inventory.unit_cost || inventory.cost_price
                    const price = inventory.price_per_unit
                    const margin = ((price - cost) / cost * 100).toFixed(1)
                    return `${margin}%`
                  })()}
                </p>
                <p className="text-xs text-[#303A4D]/60 mt-1">
                  GH₵{formatNumber((inventory.price_per_unit - (inventory.product_cost_price || inventory.unit_cost || inventory.cost_price)))} profit per unit
                </p>
              </div>
            ) : (
              <div className="p-4 bg-white rounded-2xl border-2 border-[#303A4D]/20">
                <p className="text-sm text-[#303A4D]/70 font-medium mb-1">Profit Margin</p>
                <p className="text-2xl font-bold text-gray-400">N/A</p>
                <p className="text-xs text-gray-500 mt-1">Set selling price first</p>
              </div>
            )}
          </div>
        </div>

        {/* Movement History */}
        <div className="bg-white rounded-3xl p-6 shadow-sm mt-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-[#303A4D]">Movement History</h3>
            <button
              onClick={fetchMovementHistory}
              disabled={loadingMovements}
              className="px-4 py-2 bg-[#FED141] hover:bg-[#F1B424] rounded-full font-bold text-[#303A4D] transition-colors disabled:opacity-50"
            >
              {loadingMovements ? "Loading..." : "Refresh"}
            </button>
          </div>

          {loadingMovements ? (
            <div className="text-center py-8 text-[#303A4D]/60">Loading movements...</div>
          ) : movements.length === 0 ? (
            <div className="text-center py-8 text-[#303A4D]/60">No movement history yet</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-[#F4F2E6]">
                  <tr>
                    <th className="text-left py-3 px-4 text-[#303A4D] font-bold">Date</th>
                    <th className="text-left py-3 px-4 text-[#303A4D] font-bold">Type</th>
                    <th className="text-left py-3 px-4 text-[#303A4D] font-bold">Quantity</th>
                    <th className="text-left py-3 px-4 text-[#303A4D] font-bold">Reason</th>
                    <th className="text-left py-3 px-4 text-[#303A4D] font-bold">By</th>
                  </tr>
                </thead>
                <tbody>
                  {movements.map((movement) => {
                    const isIncrease = movement.quantity > 0
                    const typeColors = {
                      'in': 'bg-green-100 text-green-700',
                      'out': 'bg-orange-100 text-orange-700',
                      'damaged': 'bg-red-100 text-red-700',
                      'expired': 'bg-purple-100 text-purple-700',
                      'transfer': 'bg-blue-100 text-blue-700',
                      'adjustment': 'bg-yellow-100 text-yellow-700'
                    }
                    const typeColor = typeColors[movement.movement_type as keyof typeof typeColors] || 'bg-gray-100 text-gray-700'
                    
                    return (
                      <tr key={movement.id} className="border-b border-[#F4F2E6] hover:bg-[#F4F2E6]/50">
                        <td className="py-3 px-4 text-[#303A4D]">
                          {new Date(movement.created_at).toLocaleDateString()} {new Date(movement.created_at).toLocaleTimeString()}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-3 py-1 rounded-full text-sm font-bold ${typeColor}`}>
                            {movement.movement_type.toUpperCase()}
                          </span>
                        </td>
                        <td className={`py-3 px-4 font-bold ${isIncrease ? 'text-green-600' : 'text-red-600'}`}>
                          {isIncrease ? '+' : ''}{movement.quantity}
                        </td>
                        <td className="py-3 px-4 text-[#303A4D]">
                          <div>
                            <p className="font-medium">{movement.reason || 'N/A'}</p>
                            {movement.notes && (
                              <p className="text-xs text-[#303A4D]/60 mt-1">{movement.notes}</p>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-[#303A4D]/70">
                          {movement.created_by_name || 'System'}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {inventory && (
        <>
          <AssignLocationModal
            isOpen={showAssignModal}
            onClose={() => setShowAssignModal(false)}
            productId={productId}
            productName={inventory.product_name || "Unknown Product"}
            currentLocationId={inventory.warehouse_location_id}
            currentLocationName={inventory.location_name}
            onSuccess={fetchInventoryDetails}
          />

          <AdjustInventoryModal
            isOpen={showAdjustModal}
            onClose={() => setShowAdjustModal(false)}
            productId={productId}
            productName={inventory.product_name || "Unknown Product"}
            currentQuantity={inventory.quantity_available}
            onSuccess={fetchInventoryDetails}
          />
        </>
      )}
    </div>
  )
}
