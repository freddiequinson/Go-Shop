"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Package, AlertTriangle, TrendingDown, Search, Filter, Plus, Eye, EyeOff, CheckCircle } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import CreateSupplyRequestModal from "@/components/procurement/CreateSupplyRequestModal"
import { useToast } from "@/hooks/use-toast"
import OnboardingTour, { TourStep } from "@/components/onboarding/OnboardingTour"

interface InventoryItem {
  id: string
  product_id: string
  quantity_available: number
  quantity_reserved: number
  reorder_level: number
  zone: string
  cost_price: number
  total_value: number
  product_name?: string
  product_description?: string
  is_published?: boolean
  created_by_type?: string
}

export default function WarehousePage() {
  const router = useRouter()
  const [inventory, setInventory] = useState<InventoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState("all")
  const [searchTerm, setSearchTerm] = useState("")
  const [showRequestModal, setShowRequestModal] = useState(false)
  const [publishingId, setPublishingId] = useState<string | null>(null)
  const [syncing, setSyncing] = useState(false)
  const [pendingDeliveries, setPendingDeliveries] = useState<number>(0)
  const { toast } = useToast()

  useEffect(() => {
    fetchInventory()
    fetchPendingDeliveries()
  }, [filter])

  const fetchInventory = async () => {
    try {
      const token = localStorage.getItem("access_token")
      let url = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'}/warehouse/inventory?per_page=50`
      
      if (filter === "low_stock") {
        url += "&low_stock_only=true"
      } else if (filter === "out_of_stock") {
        url += "&out_of_stock_only=true"
      }

      const response = await fetch(url, {
        headers: { "Authorization": `Bearer ${token}` }
      })
      
      if (response.ok) {
        const data = await response.json()
        setInventory(data)
      }
    } catch (error) {
      console.error("Failed to fetch inventory:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchPendingDeliveries = async () => {
    try {
      const token = localStorage.getItem("access_token")
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'}/supply-offers/admin/all-offers`, {
        headers: { "Authorization": `Bearer ${token}` }
      })
      
      if (response.ok) {
        const data = await response.json()
        // Count accepted direct orders (waiting for delivery)
        const acceptedCount = data.filter((offer: any) => 
          offer.is_direct_order && offer.status === 'accepted'
        ).length
        setPendingDeliveries(acceptedCount)
      }
    } catch (error) {
      console.error("Failed to fetch pending deliveries:", error)
    }
  }

  const getStockStatus = (item: InventoryItem) => {
    if (item.quantity_available === 0) return { text: "Out of Stock", color: "bg-red-100 text-red-700" }
    if (item.quantity_available <= item.reorder_level) return { text: "Low Stock", color: "bg-yellow-100 text-yellow-700" }
    return { text: "In Stock", color: "bg-green-100 text-green-700" }
  }

  const handlePublish = async (productId: string) => {
    setPublishingId(productId)
    try {
      const token = localStorage.getItem("access_token")
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'}/warehouse/products/${productId}/publish`, {
        method: "PUT",
        headers: { "Authorization": `Bearer ${token}` }
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Product published to shop successfully!",
        })
        fetchInventory() // Refresh the list
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
      setPublishingId(null)
    }
  }

  const handleUnpublish = async (productId: string) => {
    setPublishingId(productId)
    try {
      const token = localStorage.getItem("access_token")
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'}/warehouse/products/${productId}/unpublish`, {
        method: "PUT",
        headers: { "Authorization": `Bearer ${token}` }
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Product removed from shop",
        })
        fetchInventory() // Refresh the list
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
      setPublishingId(null)
    }
  }

  const handleSyncProducts = async () => {
    setSyncing(true)
    try {
      const token = localStorage.getItem("access_token")
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'}/warehouse/inventory/sync-all-products`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` }
      })

      if (response.ok) {
        const data = await response.json()
        toast({
          title: "Success",
          description: `Synced ${data.synced_count} products to warehouse. ${data.existing_count} already existed.`,
        })
        fetchInventory() // Refresh the list
      } else {
        const error = await response.json()
        toast({
          title: "Error",
          description: error.detail || "Failed to sync products",
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to sync products",
        variant: "destructive"
      })
    } finally {
      setSyncing(false)
    }
  }

  if (loading) {
    return <div className="text-center py-12">Loading...</div>
  }

  const tourSteps: TourStep[] = [
    {
      target: '[data-tour="warehouse-header"]',
      title: 'Warehouse Inventory',
      description: 'This is your warehouse stock. IMPORTANT: Products here are NOT visible to customers until you publish them to the shop. This ensures quality control before items appear online.',
      position: 'bottom'
    },
    {
      target: '[data-tour="marketplace-link"]',
      title: 'Supplier Marketplace',
      description: 'Browse products from verified suppliers. Order directly from suppliers to stock your warehouse. Suppliers compete with pricing, ensuring you get the best deals.',
      position: 'left'
    },
    {
      target: '[data-tour="sync-products"]',
      title: 'Sync Products',
      description: 'Sync all your admin-created products to warehouse inventory. This ensures warehouse has the latest product data and stock levels.',
      position: 'left'
    },
    {
      target: '[data-tour="request-stock"]',
      title: 'Request Stock from Suppliers',
      description: 'Create a supply request to order products from suppliers. Choose Direct (specific supplier) or Open (marketplace - all suppliers can bid). Suppliers submit offers, you accept the best one.',
      position: 'left'
    },
    {
      target: '[data-tour="pending-deliveries"]',
      title: 'Pending Deliveries',
      description: 'Track orders you\'ve placed with suppliers that are awaiting delivery. When goods arrive, receive them to add to warehouse inventory automatically.',
      position: 'top'
    },
    {
      target: '[data-tour="inventory-list"]',
      title: 'Warehouse Inventory Items',
      description: 'All products in warehouse with stock levels. Green "Published" badge means customers can see it in shop. No badge means warehouse-only (not visible to customers).',
      position: 'top'
    },
    {
      target: '[data-tour="publish-button"]',
      title: 'Publish to Shop',
      description: 'Click to make product visible to customers on the website. Only published products appear in the shop. This is your quality control checkpoint before items go live.',
      position: 'left'
    }
  ]

  return (
    <>
      <OnboardingTour tourId="warehouse" steps={tourSteps} />
      <div>
      {/* Header */}
      <div data-tour="warehouse-header" className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-[#303A4D] mb-2">Warehouse Inventory</h1>
          <p className="text-lg text-[#303A4D]/70">Manage your warehouse stock and inventory</p>
        </div>
        <div className="flex gap-3">
          <Link href="/admin/warehouse/marketplace">
            <Button 
              data-tour="marketplace-link"
              variant="outline"
              className="border-blue-500 text-blue-600 hover:bg-blue-50"
            >
              <Package className="w-4 h-4 mr-2" />
              Supplier Marketplace
            </Button>
          </Link>
          <Button 
            data-tour="sync-products"
            onClick={handleSyncProducts}
            disabled={syncing}
            variant="outline"
            className="border-[#303A4D]/20 text-[#303A4D] hover:bg-[#F4F2E6]"
          >
            <Package className="w-4 h-4 mr-2" />
            {syncing ? "Syncing..." : "Sync Products"}
          </Button>
          <Button 
            data-tour="request-stock"
            onClick={() => setShowRequestModal(true)}
            className="bg-[#FED141] text-[#303A4D] hover:bg-[#FED141]/90"
          >
            <Plus className="w-4 h-4 mr-2" />
            Request Stock
          </Button>
        </div>
      </div>

      {/* Supply Request Modal */}
      <CreateSupplyRequestModal
        isOpen={showRequestModal}
        onClose={() => setShowRequestModal(false)}
        onSuccess={() => {
          setShowRequestModal(false)
          // Optionally refresh data
        }}
      />

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-3xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <Package className="w-5 h-5 text-blue-500" />
            <span className="text-sm text-[#303A4D]/60">Total Items</span>
          </div>
          <p className="text-3xl font-bold text-[#303A4D]">{inventory.length}</p>
        </div>
        <div className="bg-white rounded-3xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <AlertTriangle className="w-5 h-5 text-yellow-500" />
            <span className="text-sm text-[#303A4D]/60">Low Stock</span>
          </div>
          <p className="text-3xl font-bold text-[#303A4D]">
            {inventory.filter(i => i.quantity_available <= i.reorder_level && i.quantity_available > 0).length}
          </p>
        </div>
        <div className="bg-white rounded-3xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <TrendingDown className="w-5 h-5 text-red-500" />
            <span className="text-sm text-[#303A4D]/60">Out of Stock</span>
          </div>
          <p className="text-3xl font-bold text-[#303A4D]">
            {inventory.filter(i => i.quantity_available === 0).length}
          </p>
        </div>
        <Link href="/admin/procurement/direct-orders">
          <div data-tour="pending-deliveries" className="bg-green-500 rounded-3xl p-6 shadow-sm hover:shadow-lg transition-all cursor-pointer">
            <div className="flex items-center gap-3 mb-2">
              <CheckCircle className="w-5 h-5 text-white" />
              <span className="text-sm text-white/90">Pending Deliveries</span>
            </div>
            <p className="text-3xl font-bold text-white">{pendingDeliveries}</p>
            <p className="text-xs text-white/80 mt-1">Awaiting receipt</p>
          </div>
        </Link>
        <Link href="/admin/warehouse/restock">
          <div className="bg-[#FED141] rounded-3xl p-6 shadow-sm hover:shadow-lg transition-all cursor-pointer">
            <div className="flex items-center gap-3 mb-2">
              <Package className="w-5 h-5 text-[#303A4D]" />
              <span className="text-sm text-[#303A4D]/80">Restock Orders</span>
            </div>
            <p className="text-2xl font-bold text-[#303A4D]">Create New →</p>
          </div>
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-3xl p-6 shadow-sm mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-[#303A4D]/40 w-5 h-5" />
            <input
              type="text"
              placeholder="Search inventory..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border-2 border-[#303A4D]/20 rounded-full focus:border-[#FED141] outline-none"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setFilter("all")}
              className={`px-6 py-3 rounded-full font-bold transition-colors ${
                filter === "all" ? "bg-[#FED141] text-[#303A4D]" : "bg-white border-2 border-[#303A4D]/20 text-[#303A4D]"
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilter("low_stock")}
              className={`px-6 py-3 rounded-full font-bold transition-colors ${
                filter === "low_stock" ? "bg-[#FED141] text-[#303A4D]" : "bg-white border-2 border-[#303A4D]/20 text-[#303A4D]"
              }`}
            >
              Low Stock
            </button>
            <button
              onClick={() => setFilter("out_of_stock")}
              className={`px-6 py-3 rounded-full font-bold transition-colors ${
                filter === "out_of_stock" ? "bg-[#FED141] text-[#303A4D]" : "bg-white border-2 border-[#303A4D]/20 text-[#303A4D]"
              }`}
            >
              Out of Stock
            </button>
          </div>
        </div>
      </div>

      {/* Inventory Table */}
      <div data-tour="inventory-list" className="bg-white rounded-3xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#F4F2E6]">
              <tr>
                <th className="text-left py-4 px-6 text-[#303A4D] font-bold">Product Name</th>
                <th className="text-left py-4 px-6 text-[#303A4D] font-bold">Zone</th>
                <th className="text-left py-4 px-6 text-[#303A4D] font-bold">Available</th>
                <th className="text-left py-4 px-6 text-[#303A4D] font-bold">Reserved</th>
                <th className="text-left py-4 px-6 text-[#303A4D] font-bold">Reorder</th>
                <th className="text-left py-4 px-6 text-[#303A4D] font-bold">Status</th>
                <th className="text-left py-4 px-6 text-[#303A4D] font-bold">Value</th>
                <th className="text-left py-4 px-6 text-[#303A4D] font-bold">Shop Status</th>
                <th className="text-left py-4 px-6 text-[#303A4D] font-bold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {inventory.map((item) => {
                const status = getStockStatus(item)
                const isPublishing = publishingId === item.product_id
                return (
                  <tr key={item.id} className="border-b border-[#F4F2E6] hover:bg-[#F4F2E6]/50 transition-colors">
                    <td 
                      className="py-4 px-6 cursor-pointer"
                      onClick={() => router.push(`/admin/warehouse/inventory/${item.product_id}`)}
                    >
                      <div className="hover:text-[#FED141] transition-colors">
                        <p className="font-medium text-[#303A4D]">{item.product_name || "Unknown Product"}</p>
                        <p className="text-xs text-[#303A4D]/60">{item.product_id.substring(0, 8)}...</p>
                        {item.created_by_type === 'supplier' && (
                          <span className="inline-block mt-1 px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded-full">
                            Supplier Product
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-6 text-[#303A4D]">{item.zone || "N/A"}</td>
                    <td className="py-4 px-6 font-bold text-[#303A4D]">{item.quantity_available}</td>
                    <td className="py-4 px-6 text-[#303A4D]/60">{item.quantity_reserved}</td>
                    <td className="py-4 px-6 text-[#303A4D]/60">{item.reorder_level}</td>
                    <td className="py-4 px-6">
                      <span className={`px-3 py-1 rounded-full text-sm font-bold ${status.color}`}>
                        {status.text}
                      </span>
                    </td>
                    <td className="py-4 px-6 font-bold text-[#303A4D]">
                      GH₵{item.total_value ? Number(item.total_value).toFixed(2) : "0.00"}
                    </td>
                    <td className="py-4 px-6">
                      {item.is_published ? (
                        <span className="flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-bold">
                          <CheckCircle className="w-4 h-4" />
                          In Shop
                        </span>
                      ) : (
                        <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm font-bold">
                          Warehouse Only
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-6">
                      {!item.is_published ? (
                        <button
                          data-tour="publish-button"
                          onClick={() => handlePublish(item.product_id)}
                          disabled={isPublishing}
                          className="px-4 py-2 bg-[#FED141] text-[#303A4D] rounded-full font-bold hover:bg-[#FED141]/80 transition-colors disabled:opacity-50"
                        >
                          {isPublishing ? "Publishing..." : "Publish to Shop"}
                        </button>
                      ) : (
                        <button
                          onClick={() => handleUnpublish(item.product_id)}
                          disabled={isPublishing}
                          className="px-4 py-2 bg-red-100 text-red-700 rounded-full font-bold hover:bg-red-200 transition-colors disabled:opacity-50"
                        >
                          {isPublishing ? "Unpublishing..." : "Unpublish"}
                        </button>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
    </>
  )
}
