"use client"

import { useState, useEffect } from "react"
import { Package } from "lucide-react"
import { getApiBaseUrl } from "@/lib/api/url-helper"

interface Product {
  id: string
  name: string
  price_per_unit: number
  unit_type: string
  stock_quantity: number
  primary_image_url?: string
}

export default function TestImagesPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const apiBaseUrl = getApiBaseUrl()
        const response = await fetch(`${apiBaseUrl}/products/shop?page=1&per_page=3`)
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`)
        }
        
        const data = await response.json()
        setProducts(data.products || [])
      } catch (err: any) {
        setError(err.message || "Unknown error")
      } finally {
        setLoading(false)
      }
    }

    fetchProducts()
  }, [])

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Image Test Page</h1>
        <p className="mb-4 text-gray-700">
          Testing if images cause the crash. Using plain HTML img tags (no Next.js Image).
        </p>

        {loading && <p>Loading...</p>}
        {error && <p className="text-red-600">Error: {error}</p>}

        {!loading && products.length > 0 && (
          <div className="grid grid-cols-2 gap-4">
            {products.map((product) => (
              <div key={product.id} className="bg-white p-4 rounded-lg">
                <div className="h-48 bg-gray-100 mb-2 flex items-center justify-center">
                  {product.primary_image_url ? (
                    <img
                      src={product.primary_image_url}
                      alt={product.name}
                      className="max-h-full max-w-full object-contain"
                      onError={(e) => {
                        console.error("Image failed to load:", product.primary_image_url)
                        e.currentTarget.style.display = 'none'
                      }}
                    />
                  ) : (
                    <Package className="w-16 h-16 text-gray-300" />
                  )}
                </div>
                <h3 className="font-bold">{product.name}</h3>
                <p>GH₵{Number(product.price_per_unit).toFixed(2)}</p>
              </div>
            ))}
          </div>
        )}

        <div className="mt-8 p-4 bg-yellow-100 rounded">
          <p className="text-sm">
            <strong>If this crashes:</strong> The image URLs are the problem<br />
            <strong>If this works:</strong> Next.js Image component is the problem
          </p>
        </div>
      </div>
    </div>
  )
}
