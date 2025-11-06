"use client"

import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, Package, Edit, Trash2, Power, PowerOff } from "lucide-react"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"
import { getApiBaseUrl } from "@/lib/api/url-helper"
import OnboardingTour, { TourStep } from "@/components/onboarding/OnboardingTour"

interface Product {
  id: string
  name: string
  description: string
  price_per_unit: number
  price_per_quantity: number | null
  unit_type: string
  stock_quantity: number | null
  is_active: boolean
  images: string[]
  category_name: string | null
}

export default function SupplierProducts() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    fetchProducts()
  }, [])

  const fetchProducts = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem("access_token")
      
      // Fetch all supplier products (including those with zero stock)
      const response = await fetch(`${getApiBaseUrl()}/supplier/products`, {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setProducts(data)
      } else {
        toast({
          title: "Error",
          description: "Failed to load products",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error("Failed to fetch products:", error)
      toast({
        title: "Error",
        description: "Failed to load products",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleToggleStatus = async (productId: string) => {
    try {
      const token = localStorage.getItem("access_token")
      
      const response = await fetch(
        `${getApiBaseUrl()}/supplier/products/${productId}/toggle-status`,
        {
          method: "PUT",
          headers: {
            "Authorization": `Bearer ${token}`
          }
        }
      )

      if (response.ok) {
        toast({
          title: "Success",
          description: "Product status updated"
        })
        fetchProducts()
      } else {
        toast({
          title: "Error",
          description: "Failed to update product status",
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update product status",
        variant: "destructive"
      })
    }
  }

  const handleDelete = async (productId: string) => {
    if (!confirm("Are you sure you want to delete this product?")) {
      return
    }

    try {
      const token = localStorage.getItem("access_token")
      
      const response = await fetch(
        `${getApiBaseUrl()}/supplier/products/${productId}`,
        {
          method: "DELETE",
          headers: {
            "Authorization": `Bearer ${token}`
          }
        }
      )

      if (response.ok) {
        toast({
          title: "Success",
          description: "Product deleted successfully"
        })
        fetchProducts()
      } else {
        toast({
          title: "Error",
          description: "Failed to delete product",
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete product",
        variant: "destructive"
      })
    }
  }

  if (loading) {
    return <div className="p-8 text-center">Loading products...</div>
  }

  const tourSteps: TourStep[] = [
    {
      target: '[data-tour="products-header"]',
      title: 'Your Product Catalog',
      description: 'Manage all your products here. Add new items, update pricing, manage stock levels, and toggle product availability.',
      position: 'bottom'
    },
    {
      target: '[data-tour="add-product"]',
      title: 'Add New Product',
      description: 'Click here to list a new product. Provide details like name, description, pricing, unit type, and upload images.',
      position: 'left'
    },
    {
      target: '[data-tour="product-list"]',
      title: 'Product List',
      description: 'View all your products with pricing, stock levels, and status. Edit, delete, or toggle product availability quickly.',
      position: 'top'
    }
  ]

  return (
    <>
      {!loading && <OnboardingTour tourId="supplier-products" steps={tourSteps} />}
      <div className="p-4 md:p-8 bg-[#F4F2E6] min-h-screen">
      <div className="max-w-full mx-auto">
        {/* Header */}
        <div data-tour="products-header" className="flex items-center justify-between mb-6 md:mb-8">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-[#303A4D] mb-2">My Products</h1>
          <p className="text-[#303A4D]/70">Manage your product catalog</p>
        </div>
        <Link href="/supplier/products/new">
          <Button data-tour="add-product" className="bg-[#FED141] text-[#303A4D] hover:bg-[#FED141]/90">
            <Plus className="w-4 h-4 mr-2" />
            Add Product
          </Button>
        </Link>
      </div>

      {/* Products Grid */}
      {products.length === 0 ? (
        <Card className="p-12 bg-white text-center">
          <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-[#303A4D] mb-2">No Products Yet</h3>
          <p className="text-gray-600 mb-6">
            Start by adding your first product to your catalog
          </p>
          <Link href="/supplier/products/new">
            <Button className="bg-[#FED141] text-[#303A4D] hover:bg-[#FED141]/90">
              <Plus className="w-4 h-4 mr-2" />
              Add Your First Product
            </Button>
          </Link>
        </Card>
      ) : (
        <div data-tour="product-list" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {products.map((product) => (
            <Card key={product.id} className="p-4 bg-white hover:shadow-lg transition-shadow">
              {/* Product Image - Clickable */}
              <Link href={`/supplier/products/${product.id}`}>
                <div className="relative mb-4 cursor-pointer">
                  {product.images && product.images.length > 0 ? (
                    <img
                      src={product.images[0]}
                      alt={product.name}
                      className="w-full h-48 object-cover rounded-lg"
                    />
                  ) : (
                    <div className="w-full h-48 bg-gray-200 rounded-lg flex items-center justify-center">
                      <Package className="w-12 h-12 text-gray-400" />
                    </div>
                  )}
                  
                  {/* Status Badge */}
                  <div className="absolute top-2 right-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      product.is_active 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-gray-100 text-gray-700'
                    }`}>
                      {product.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
              </Link>

              {/* Product Info */}
              <div className="mb-4">
                <h3 className="font-bold text-[#303A4D] mb-1 line-clamp-1">
                  {product.name}
                </h3>
                <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                  {product.description || "No description"}
                </p>
                
                {product.category_name && (
                  <span className="inline-block px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
                    {product.category_name}
                  </span>
                )}
              </div>

              {/* Pricing */}
              <div className="mb-4 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Price per {product.unit_type}:</span>
                  <span className="font-bold text-[#303A4D]">
                    GH₵{Number(product.price_per_unit).toFixed(2)}
                  </span>
                </div>
                {product.price_per_quantity && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Price per piece:</span>
                    <span className="font-bold text-[#303A4D]">
                      GH₵{Number(product.price_per_quantity).toFixed(2)}
                    </span>
                  </div>
                )}
                {product.stock_quantity !== null && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Stock:</span>
                    <span className="font-medium text-[#303A4D]">
                      {product.stock_quantity} {product.unit_type}
                    </span>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <Link href={`/supplier/products/${product.id}/edit`} className="flex-1">
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="w-full"
                  >
                    <Edit className="w-4 h-4 mr-1" />
                    Edit
                  </Button>
                </Link>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleToggleStatus(product.id)}
                  className={product.is_active ? "text-orange-600" : "text-green-600"}
                >
                  {product.is_active ? (
                    <PowerOff className="w-4 h-4" />
                  ) : (
                    <Power className="w-4 h-4" />
                  )}
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDelete(product.id)}
                  className="text-red-600"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
      </div>
      </div>
    </>
  )
}
