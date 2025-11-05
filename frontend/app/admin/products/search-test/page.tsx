"use client"

import { useState } from "react"
import ProductSearchInput from "@/components/products/ProductSearchInput"
import { Package, CheckCircle } from "lucide-react"

interface Product {
  id: string
  name: string
  sku?: string
  barcode?: string
  price_per_unit: number
  unit_type: string
  stock_quantity?: number
  supplier_count?: number
}

export default function ProductSearchTestPage() {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [mode, setMode] = useState<"search" | "new">("search")

  const handleSelectProduct = (product: Product) => {
    setSelectedProduct(product)
    setMode("search")
  }

  const handleCreateNew = () => {
    setSelectedProduct(null)
    setMode("new")
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[#303A4D] mb-2">
          Product Search Test Page
        </h1>
        <p className="text-[#303A4D]/70">
          Test the product search component with duplicate detection
        </p>
      </div>

      {/* Search Component */}
      <div className="bg-white rounded-2xl border-2 border-gray-100 p-6 mb-6">
        <h2 className="text-xl font-bold text-[#303A4D] mb-4">
          Search for Products
        </h2>
        <ProductSearchInput
          onSelectProduct={handleSelectProduct}
          onCreateNew={handleCreateNew}
          placeholder="Type product name, SKU, or barcode..."
          autoFocus
        />
      </div>

      {/* Selected Product Display */}
      {selectedProduct && mode === "search" && (
        <div className="bg-green-50 border-2 border-green-200 rounded-2xl p-6 mb-6">
          <div className="flex items-start gap-4 mb-4">
            <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-green-900 mb-1">
                Existing Product Selected
              </h3>
              <p className="text-green-700">
                You've selected an existing product. You can now update its details or link it to your inventory.
              </p>
            </div>
          </div>

          <div className="bg-white rounded-lg p-4 space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-[#303A4D]/60 mb-1">Product Name</p>
                <p className="font-bold text-[#303A4D]">{selectedProduct.name}</p>
              </div>
              <div>
                <p className="text-sm text-[#303A4D]/60 mb-1">Product ID</p>
                <p className="font-mono text-sm text-[#303A4D]">{selectedProduct.id}</p>
              </div>
            </div>

            {selectedProduct.sku && (
              <div>
                <p className="text-sm text-[#303A4D]/60 mb-1">SKU</p>
                <p className="font-semibold text-[#303A4D]">{selectedProduct.sku}</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-[#303A4D]/60 mb-1">Price</p>
                <p className="font-bold text-[#303A4D]">
                  GH₵{Number(selectedProduct.price_per_unit).toFixed(2)} per {selectedProduct.unit_type}
                </p>
              </div>
              <div>
                <p className="text-sm text-[#303A4D]/60 mb-1">Current Stock</p>
                <p className="font-bold text-[#303A4D]">
                  {selectedProduct.stock_quantity || 0} {selectedProduct.unit_type}
                </p>
              </div>
            </div>

            {selectedProduct.supplier_count !== undefined && (
              <div>
                <p className="text-sm text-[#303A4D]/60 mb-1">Suppliers</p>
                <p className="font-bold text-[#303A4D]">
                  {selectedProduct.supplier_count} supplier{selectedProduct.supplier_count !== 1 ? 's' : ''} available
                </p>
              </div>
            )}
          </div>

          <div className="mt-4 flex gap-3">
            <button className="px-6 py-2 bg-[#303A4D] text-white rounded-lg font-semibold hover:bg-[#303A4D]/90 transition-colors">
              Update Product Details
            </button>
            <button className="px-6 py-2 bg-[#FED141] text-[#303A4D] rounded-lg font-semibold hover:bg-[#FED141]/90 transition-colors">
              Link to My Inventory
            </button>
            <button 
              onClick={() => setSelectedProduct(null)}
              className="px-6 py-2 bg-white border-2 border-gray-200 text-[#303A4D] rounded-lg font-semibold hover:bg-gray-50 transition-colors"
            >
              Clear Selection
            </button>
          </div>
        </div>
      )}

      {/* New Product Mode */}
      {mode === "new" && (
        <div className="bg-[#FED141]/10 border-2 border-[#FED141] rounded-2xl p-6">
          <div className="flex items-start gap-4 mb-4">
            <div className="w-12 h-12 bg-[#FED141] rounded-full flex items-center justify-center">
              <Package className="w-6 h-6 text-[#303A4D]" />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-[#303A4D] mb-1">
                Add New Product
              </h3>
              <p className="text-[#303A4D]/70">
                No existing products match your search. You can now add this as a new product.
              </p>
            </div>
          </div>

          <div className="bg-white rounded-lg p-4">
            <p className="text-[#303A4D] mb-4">
              The product addition form would appear here with the search query pre-filled.
            </p>
            <button 
              onClick={() => setMode("search")}
              className="px-6 py-2 bg-[#303A4D] text-white rounded-lg font-semibold hover:bg-[#303A4D]/90 transition-colors"
            >
              Back to Search
            </button>
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="bg-blue-50 border-2 border-blue-200 rounded-2xl p-6">
        <h3 className="text-lg font-bold text-blue-900 mb-3">
          How to Test
        </h3>
        <ol className="space-y-2 text-blue-800">
          <li className="flex gap-2">
            <span className="font-bold">1.</span>
            <span>Type a product name in the search box (e.g., "tomato", "rice", "oil")</span>
          </li>
          <li className="flex gap-2">
            <span className="font-bold">2.</span>
            <span>Wait for results to appear (searches after 300ms of typing)</span>
          </li>
          <li className="flex gap-2">
            <span className="font-bold">3.</span>
            <span>Click on a product to select it (shows existing product details)</span>
          </li>
          <li className="flex gap-2">
            <span className="font-bold">4.</span>
            <span>Or click "Add as New Product" if no matches found</span>
          </li>
          <li className="flex gap-2">
            <span className="font-bold">5.</span>
            <span>Notice the similarity scores (100% = exact match, 70%+ = close match)</span>
          </li>
        </ol>
      </div>
    </div>
  )
}
