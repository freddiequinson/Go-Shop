"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, Plus, Edit, Trash2, Package, DollarSign, ShoppingBag, Eye, EyeOff, GripVertical } from "lucide-react"
import Link from "next/link"
import { getApiBaseUrl } from "@/lib/api/url-helper"

interface PackageItem {
  id: string
  product_id: string
  quantity: number
  product_name: string | null
  product_image: string | null
  product_price: number | null
  product_unit: string | null
}

interface PackageData {
  id: string
  name: string
  description: string | null
  image_url: string | null
  package_price: number
  original_value: number | null
  savings: number | null
  stock_quantity: number | null
  is_active: boolean
  is_featured: boolean
  items: PackageItem[]
  items_count: number
}

interface SeasonalEvent {
  id: string
  name: string
  description: string | null
  color_code: string
  start_date: string
  end_date: string
  is_active: boolean
  packages: PackageData[]
}

export default function EventDetailPage() {
  const params = useParams()
  const router = useRouter()
  const eventId = params.eventId as string
  
  const [event, setEvent] = useState<SeasonalEvent | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (eventId) {
      fetchEvent()
    }
  }, [eventId])

  const fetchEvent = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem("access_token")
      const response = await fetch(`${getApiBaseUrl()}/packages/admin/events/${eventId}`, {
        headers: { "Authorization": `Bearer ${token}` }
      })
      
      if (response.ok) {
        const data = await response.json()
        setEvent(data)
      } else {
        router.push("/admin/packages")
      }
    } catch (error) {
      console.error("Failed to fetch event:", error)
    } finally {
      setLoading(false)
    }
  }

  const deletePackage = async (packageId: string) => {
    if (!confirm("Are you sure you want to delete this package?")) return
    
    try {
      const token = localStorage.getItem("access_token")
      const response = await fetch(`${getApiBaseUrl()}/packages/admin/packages/${packageId}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      })
      
      if (response.ok) {
        fetchEvent()
      }
    } catch (error) {
      console.error("Failed to delete package:", error)
    }
  }

  const togglePackageActive = async (pkg: PackageData) => {
    try {
      const token = localStorage.getItem("access_token")
      const response = await fetch(`${getApiBaseUrl()}/packages/admin/packages/${pkg.id}`, {
        method: "PUT",
        headers: { 
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ is_active: !pkg.is_active })
      })
      
      if (response.ok) {
        fetchEvent()
      }
    } catch (error) {
      console.error("Failed to toggle package:", error)
    }
  }

  const formatPrice = (price: number | null | undefined) => {
    if (price === null || price === undefined) return "0.00"
    return Number(price).toFixed(2)
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  if (!event) {
    return (
      <div className="p-6 text-center">
        <p className="text-gray-500">Event not found</p>
        <Link href="/admin/packages" className="text-[#93C90F] hover:underline mt-2 inline-block">
          Back to Events
        </Link>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <Link
            href="/admin/packages"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Events
          </Link>
          <div className="flex items-center gap-3">
            <div 
              className="w-4 h-4 rounded"
              style={{ backgroundColor: event.color_code }}
            />
            <h1 className="text-2xl font-bold text-gray-900">{event.name}</h1>
          </div>
          {event.description && (
            <p className="text-gray-500 mt-1">{event.description}</p>
          )}
        </div>
        <div className="flex items-center gap-3">
          <Link
            href={`/admin/packages/events/${eventId}/edit`}
            className="px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Edit Event
          </Link>
          <Link
            href={`/admin/packages/events/${eventId}/packages/new`}
            className="flex items-center gap-2 px-4 py-2 bg-[#93C90F] text-white rounded-lg hover:bg-[#7ab00d] transition-colors"
          >
            <Plus className="w-5 h-5" />
            Add Package
          </Link>
        </div>
      </div>

      {/* Packages List */}
      {event.packages.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-100">
          <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Packages Yet</h3>
          <p className="text-gray-500 mb-4">Create your first package for this event</p>
          <Link
            href={`/admin/packages/events/${eventId}/packages/new`}
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#93C90F] text-white rounded-lg hover:bg-[#7ab00d] transition-colors"
          >
            <Plus className="w-5 h-5" />
            Create Package
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {event.packages.map((pkg) => (
            <div
              key={pkg.id}
              className="bg-white rounded-xl border border-gray-100 overflow-hidden"
            >
              <div className="p-5">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    {/* Package Image */}
                    <div className="w-20 h-20 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                      {pkg.image_url ? (
                        <img 
                          src={pkg.image_url} 
                          alt={pkg.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package className="w-8 h-8 text-gray-300" />
                        </div>
                      )}
                    </div>
                    
                    {/* Package Info */}
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-lg font-semibold text-gray-900">{pkg.name}</h3>
                        {!pkg.is_active && (
                          <span className="px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-600 rounded-full">
                            Disabled
                          </span>
                        )}
                        {pkg.is_featured && (
                          <span className="px-2 py-0.5 text-xs font-medium bg-yellow-100 text-yellow-700 rounded-full">
                            Featured
                          </span>
                        )}
                      </div>
                      
                      {pkg.description && (
                        <p className="text-sm text-gray-500 mb-2">{pkg.description}</p>
                      )}
                      
                      {/* Price Info */}
                      <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-1">
                          <DollarSign className="w-4 h-4 text-gray-400" />
                          <span className="font-semibold text-gray-900">GH{formatPrice(pkg.package_price)}</span>
                          {pkg.original_value && (
                            <span className="text-gray-400 line-through ml-1">
                              GH{formatPrice(pkg.original_value)}
                            </span>
                          )}
                        </div>
                        {pkg.savings && pkg.savings > 0 && (
                          <span className="text-green-600 font-medium">
                            Save GH{formatPrice(pkg.savings)}
                          </span>
                        )}
                      </div>
                      
                      {/* Items Count */}
                      <div className="flex items-center gap-1 text-sm text-gray-500 mt-2">
                        <ShoppingBag className="w-4 h-4" />
                        <span>{pkg.items_count} item{pkg.items_count !== 1 ? 's' : ''}</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => togglePackageActive(pkg)}
                      className={`p-2 rounded-lg transition-colors ${
                        pkg.is_active 
                          ? 'text-green-600 hover:bg-green-50' 
                          : 'text-gray-400 hover:bg-gray-50'
                      }`}
                      title={pkg.is_active ? 'Disable' : 'Enable'}
                    >
                      {pkg.is_active ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
                    </button>
                    <Link
                      href={`/admin/packages/events/${eventId}/packages/${pkg.id}`}
                      className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                    >
                      <Edit className="w-5 h-5" />
                    </Link>
                    <button
                      onClick={() => deletePackage(pkg.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Items Preview */}
                {pkg.items && pkg.items.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <p className="text-xs text-gray-500 mb-2">Package Contents:</p>
                    <div className="flex flex-wrap gap-2">
                      {pkg.items.slice(0, 5).map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-lg text-sm"
                        >
                          {item.product_image && (
                            <img 
                              src={item.product_image.startsWith('http') ? item.product_image : `${getApiBaseUrl()}${item.product_image}`}
                              alt=""
                              className="w-6 h-6 rounded object-cover"
                            />
                          )}
                          <span className="text-gray-700">{item.product_name}</span>
                          {item.quantity > 1 && (
                            <span className="text-gray-400">x{item.quantity}</span>
                          )}
                        </div>
                      ))}
                      {pkg.items.length > 5 && (
                        <span className="px-3 py-1.5 text-sm text-gray-500">
                          +{pkg.items.length - 5} more
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
