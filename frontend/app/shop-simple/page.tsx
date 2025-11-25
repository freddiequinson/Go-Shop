"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { ArrowLeft, Package } from "lucide-react"
import { getApiBaseUrl, buildApiUrl } from "@/lib/api/url-helper"

interface Product {
  id: string
  name: string
  price_per_unit: number
  unit_type: string
  stock_quantity: number
  primary_image_url?: string
}

export default function ShopSimplePage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const apiBaseUrl = getApiBaseUrl()
        console.log("Fetching from:", `${apiBaseUrl}/products/shop?page=1&per_page=6`)
        
        // Add timeout to prevent hanging
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout
        
        const response = await fetch(`${apiBaseUrl}/products/shop?page=1&per_page=6`, {
          signal: controller.signal
        })
        clearTimeout(timeoutId)
        
        console.log("Response status:", response.status)
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`)
        }
        
        const data = await response.json()
        console.log("Data received:", data)
        setProducts(data.products || [])
      } catch (err: any) {
        console.error("Fetch error:", err)
        setError(err.message || "Unknown error")
      } finally {
        setLoading(false)
      }
    }

    fetchProducts()
  }, [])

  return (
    <div className="min-h-screen bg-[#F4F2E6] p-4">
      {/* Simple Header */}
      <div className="max-w-6xl mx-auto mb-8">
        <Link href="/">
          <button className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#303A4D] text-white">
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </button>
        </Link>
        <h1 className="text-3xl font-bold text-[#303A4D] mt-4">Simple Shop Test</h1>
        <p className="text-sm text-gray-600 mt-2">
          Testing minimal shop page - No cart, no auth, no chatbot
        </p>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto">
        {loading && (
          <div className="text-center py-16">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#303A4D]"></div>
            <p className="mt-4 text-[#303A4D]">Loading products...</p>
          </div>
        )}

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            <strong>Error:</strong> {error}
          </div>
        )}

        {!loading && !error && products.length === 0 && (
          <div className="text-center py-16">
            <Package className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <p className="text-xl text-gray-600">No products found</p>
          </div>
        )}

        {!loading && products.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {products.map((product, index) => {
              // Convert relative image URLs to absolute URLs
              const imageUrl = product.primary_image_url 
                ? product.primary_image_url.startsWith('http') 
                  ? product.primary_image_url 
                  : buildApiUrl(product.primary_image_url)
                : null
              
              // Debug log
              if (index === 0) {
                console.log('Image URL for first product:', imageUrl)
                console.log('API Base URL:', getApiBaseUrl())
              }
              
              return (
              <div key={product.id} className="bg-white rounded-lg overflow-hidden shadow-sm">
                <div className="relative h-48 bg-gray-100">
                  {imageUrl ? (
                    <Image
                      src={imageUrl}
                      alt={product.name}
                      fill
                      loading={index < 4 ? "eager" : "lazy"}
                      unoptimized
                      className="object-contain p-4"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <Package className="w-16 h-16 text-gray-300" />
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="font-bold text-[#303A4D] mb-2 line-clamp-2">
                    {product.name}
                  </h3>
                  <p className="text-lg font-bold text-[#303A4D]">
                    GH₵{Number(product.price_per_unit).toFixed(2)}
                  </p>
                  <p className="text-sm text-gray-600">per {product.unit_type}</p>
                  <p className="text-xs text-gray-500 mt-2">
                    Stock: {product.stock_quantity}
                  </p>
                </div>
              </div>
              )
            })}
          </div>
        )}

        {/* Debug Info */}
        <div className="mt-8 p-4 bg-white rounded-lg">
          <h3 className="font-bold mb-2">Debug Info:</h3>
          <p className="text-sm">API URL: {getApiBaseUrl()}</p>
          <p className="text-sm">Products loaded: {products.length}</p>
          <p className="text-sm">Loading: {loading ? "Yes" : "No"}</p>
          <p className="text-sm">Error: {error || "None"}</p>
        </div>
      </div>
    </div>
  )
}
