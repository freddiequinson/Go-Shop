"use client"

import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Package, Calendar, DollarSign, TrendingUp, Eye, Search } from "lucide-react"
import Link from "next/link"
import ProductSupplierSearch from "@/components/procurement/ProductSupplierSearch"

interface OpenRequest {
  id: string
  request_number: string
  product_name: string
  quantity_needed: string
  unit_type: string
  required_by_date: string
  max_budget?: string
  status: string
  offers_count: number
  lowest_offer_price?: string
  highest_offer_price?: string
  average_offer_price?: string
  deadline_remaining_hours?: number
}

export default function OpenMarketplace() {
  const [requests, setRequests] = useState<OpenRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<"marketplace" | "search">("marketplace")

  useEffect(() => {
    fetchOpenRequests()
  }, [])

  const fetchOpenRequests = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem("access_token")
      
      const response = await fetch(
        `${(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000') + '/api/v1'}/supply-requests/open`,
        {
          headers: { "Authorization": `Bearer ${token}` }
        }
      )

      if (response.ok) {
        const data = await response.json()
        setRequests(data)
      }
    } catch (error) {
      console.error("Failed to fetch open requests:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-[#303A4D] mb-2">Procurement Marketplace</h1>
        <p className="text-[#303A4D]/70">Manage open requests and find suppliers</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <Button
          onClick={() => setActiveTab("marketplace")}
          className={activeTab === "marketplace" 
            ? "bg-[#FED141] text-[#303A4D] hover:bg-[#FED141]/90" 
            : "bg-white text-[#303A4D] hover:bg-gray-100 border border-gray-200"
          }
        >
          <Package className="w-4 h-4 mr-2" />
          Open Requests
        </Button>
        <Button
          onClick={() => setActiveTab("search")}
          className={activeTab === "search" 
            ? "bg-[#FED141] text-[#303A4D] hover:bg-[#FED141]/90" 
            : "bg-white text-[#303A4D] hover:bg-gray-100 border border-gray-200"
          }
        >
          <Search className="w-4 h-4 mr-2" />
          Find Suppliers
        </Button>
      </div>

      {/* Tab Content */}
      {activeTab === "search" ? (
        <ProductSupplierSearch />
      ) : (
        <>
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="p-6 bg-white">
          <div className="flex items-center gap-3">
            <Package className="w-8 h-8 text-purple-600" />
            <div>
              <p className="text-sm text-gray-600">Open Requests</p>
              <p className="text-2xl font-bold text-[#303A4D]">{requests.length}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-white">
          <div className="flex items-center gap-3">
            <TrendingUp className="w-8 h-8 text-green-600" />
            <div>
              <p className="text-sm text-gray-600">Total Offers</p>
              <p className="text-2xl font-bold text-[#303A4D]">
                {requests.reduce((sum, r) => sum + r.offers_count, 0)}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-white">
          <div className="flex items-center gap-3">
            <DollarSign className="w-8 h-8 text-blue-600" />
            <div>
              <p className="text-sm text-gray-600">Avg Offers/Request</p>
              <p className="text-2xl font-bold text-[#303A4D]">
                {requests.length > 0
                  ? (requests.reduce((sum, r) => sum + r.offers_count, 0) / requests.length).toFixed(1)
                  : 0
                }
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-white">
          <div className="flex items-center gap-3">
            <Calendar className="w-8 h-8 text-orange-600" />
            <div>
              <p className="text-sm text-gray-600">Active</p>
              <p className="text-2xl font-bold text-[#303A4D]">
                {requests.filter(r => r.status === 'sent' || r.status === 'responded').length}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Requests Grid */}
      {loading ? (
        <div className="text-center py-12">Loading open requests...</div>
      ) : requests.length === 0 ? (
        <Card className="p-12 bg-white text-center">
          <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-[#303A4D] mb-2">No Open Requests</h3>
          <p className="text-gray-600">
            Create an open marketplace request to receive competitive offers
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {requests.map((request) => (
            <Card key={request.id} className="p-6 bg-white hover:shadow-lg transition-shadow">
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-xl font-bold text-[#303A4D] mb-1">
                    {request.product_name}
                  </h3>
                  <p className="text-sm text-gray-500">#{request.request_number}</p>
                </div>
                
                <span className="px-3 py-1 bg-purple-100 text-purple-700 text-xs font-medium rounded-full">
                  OPEN
                </span>
              </div>

              {/* Details */}
              <div className="space-y-3 mb-4">
                <div className="flex items-center gap-2 text-gray-700">
                  <Package className="w-4 h-4" />
                  <span className="text-sm">
                    {request.quantity_needed} {request.unit_type}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-gray-700">
                  <Calendar className="w-4 h-4" />
                  <span className="text-sm">
                    Required: {new Date(request.required_by_date).toLocaleDateString()}
                  </span>
                </div>

                {request.max_budget && (
                  <div className="flex items-center gap-2 text-gray-700">
                    <DollarSign className="w-4 h-4" />
                    <span className="text-sm">Budget: GH₵{request.max_budget}</span>
                  </div>
                )}

                {request.deadline_remaining_hours !== undefined && request.deadline_remaining_hours > 0 && (
                  <div className="p-2 bg-orange-50 rounded text-sm">
                    <strong className="text-orange-700">
                      ⏰ {request.deadline_remaining_hours}h remaining
                    </strong>
                  </div>
                )}
              </div>

              {/* Offer Statistics */}
              {request.offers_count > 0 && (
                <div className="p-4 bg-gray-50 rounded-lg mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">
                      {request.offers_count} Offer(s)
                    </span>
                  </div>
                  
                  {request.lowest_offer_price && request.highest_offer_price && (
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Lowest:</span>
                        <span className="font-bold text-green-600">
                          GH₵{request.lowest_offer_price}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Highest:</span>
                        <span className="font-bold text-orange-600">
                          GH₵{request.highest_offer_price}
                        </span>
                      </div>
                      {request.average_offer_price && (
                        <div className="flex justify-between pt-1 border-t">
                          <span className="text-gray-600">Average:</span>
                          <span className="font-bold text-[#303A4D]">
                            GH₵{request.average_offer_price}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {request.offers_count === 0 && (
                <div className="p-3 bg-blue-50 rounded-lg mb-4 text-center">
                  <p className="text-sm text-blue-700">
                    Waiting for supplier offers...
                  </p>
                </div>
              )}

              {/* View Button */}
              <Link href={`/admin/procurement/requests/${request.id}`}>
                <Button variant="outline" className="w-full">
                  <Eye className="w-4 h-4 mr-2" />
                  View Details & Offers
                </Button>
              </Link>
            </Card>
          ))}
        </div>
      )}
      </>
      )}
    </div>
  )
}
