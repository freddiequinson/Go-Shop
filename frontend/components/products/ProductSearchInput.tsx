"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { Search, X, Package, AlertCircle } from "lucide-react"
import ProductSearchResult from "./ProductSearchResult"

interface Product {
  id: string
  name: string
  sku?: string
  barcode?: string
  price_per_unit: number
  unit_type: string
  stock_quantity?: number
  category_id?: string
  images?: string[]
  supplier_count?: number
  is_active: boolean
}

interface ProductSearchInputProps {
  onSelectProduct?: (product: Product) => void
  onCreateNew?: () => void
  placeholder?: string
  autoFocus?: boolean
  excludeProductId?: string // Exclude a specific product from results
}

export default function ProductSearchInput({
  onSelectProduct,
  onCreateNew,
  placeholder = "Search for existing products...",
  autoFocus = false,
  excludeProductId
}: ProductSearchInputProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [isSearching, setIsSearching] = useState(false)
  const [searchResults, setSearchResults] = useState<Product[]>([])
  const [showResults, setShowResults] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const searchRef = useRef<HTMLDivElement>(null)
  const debounceTimer = useRef<NodeJS.Timeout>()

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  // Debounced search function
  const performSearch = useCallback(async (query: string) => {
    if (!query.trim() || query.length < 2) {
      setSearchResults([])
      setShowResults(false)
      return
    }

    setIsSearching(true)
    setError(null)

    try {
      const token = localStorage.getItem("access_token")
      const response = await fetch(
        `${(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000') + '/api/v1'}/products?search=${encodeURIComponent(query)}&per_page=10&page=1`,
        {
          headers: {
            "Authorization": `Bearer ${token}`
          }
        }
      )

      if (response.ok) {
        const data = await response.json()
        
        // Handle paginated response
        let products: Product[] = []
        if (data.products && Array.isArray(data.products)) {
          products = data.products
        } else if (Array.isArray(data)) {
          products = data
        } else if (data.items && Array.isArray(data.items)) {
          products = data.items
        }

        // Exclude specific product if needed
        if (excludeProductId) {
          products = products.filter(p => p.id !== excludeProductId)
        }

        // Fetch supplier count for each product
        const productsWithSuppliers = await Promise.all(
          products.map(async (product) => {
            try {
              const supplierResponse = await fetch(
                `${(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000') + '/api/v1'}/suppliers/by-product/${encodeURIComponent(product.name)}`,
                {
                  headers: { "Authorization": `Bearer ${token}` }
                }
              )
              
              if (supplierResponse.ok) {
                const suppliers = await supplierResponse.json()
                return {
                  ...product,
                  supplier_count: Array.isArray(suppliers) ? suppliers.length : 0
                }
              }
            } catch (err) {
              console.error("Failed to fetch supplier count:", err)
            }
            return { ...product, supplier_count: 0 }
          })
        )

        setSearchResults(productsWithSuppliers)
        setShowResults(true)
      } else {
        setError("Failed to search products")
      }
    } catch (err) {
      console.error("Search error:", err)
      setError("An error occurred while searching")
    } finally {
      setIsSearching(false)
    }
  }, [excludeProductId])

  // Handle input change with debouncing
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setSearchQuery(value)

    // Clear previous timer
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current)
    }

    // Set new timer for debounced search
    debounceTimer.current = setTimeout(() => {
      performSearch(value)
    }, 300) // 300ms debounce
  }

  const handleClearSearch = () => {
    setSearchQuery("")
    setSearchResults([])
    setShowResults(false)
    setError(null)
  }

  const handleSelectProduct = (product: Product) => {
    setShowResults(false)
    setSearchQuery(product.name)
    onSelectProduct?.(product)
  }

  const handleCreateNew = () => {
    setShowResults(false)
    onCreateNew?.()
  }

  // Calculate similarity score (simple implementation)
  const calculateSimilarity = (productName: string, query: string): number => {
    const lowerProduct = productName.toLowerCase()
    const lowerQuery = query.toLowerCase()
    
    // Exact match
    if (lowerProduct === lowerQuery) return 100
    
    // Starts with query
    if (lowerProduct.startsWith(lowerQuery)) return 90
    
    // Contains query
    if (lowerProduct.includes(lowerQuery)) return 70
    
    // Word match
    const productWords = lowerProduct.split(/\s+/)
    const queryWords = lowerQuery.split(/\s+/)
    const matchingWords = queryWords.filter(qw => 
      productWords.some(pw => pw.includes(qw) || qw.includes(pw))
    )
    
    if (matchingWords.length > 0) {
      return Math.floor((matchingWords.length / queryWords.length) * 60)
    }
    
    return 0
  }

  // Sort results by similarity
  const sortedResults = searchResults
    .map(product => ({
      ...product,
      similarity: calculateSimilarity(product.name, searchQuery)
    }))
    .sort((a, b) => b.similarity - a.similarity)

  return (
    <div ref={searchRef} className="relative w-full">
      {/* Search Input */}
      <div className="relative">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[#303A4D]/40">
          <Search className="w-5 h-5" />
        </div>
        
        <input
          type="text"
          value={searchQuery}
          onChange={handleInputChange}
          onFocus={() => searchQuery.length >= 2 && setShowResults(true)}
          placeholder={placeholder}
          autoFocus={autoFocus}
          className="w-full pl-10 pr-10 py-3 border-2 border-gray-200 rounded-lg focus:border-[#FED141] focus:outline-none text-[#303A4D] placeholder:text-[#303A4D]/40"
        />

        {searchQuery && (
          <button
            onClick={handleClearSearch}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#303A4D]/40 hover:text-[#303A4D] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        {isSearching && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <div className="w-5 h-5 border-2 border-[#FED141] border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}
      </div>

      {/* Search Results Dropdown */}
      {showResults && (
        <div className="absolute z-50 w-full mt-2 bg-white border-2 border-gray-200 rounded-lg shadow-xl max-h-96 overflow-y-auto">
          {error ? (
            <div className="p-4 flex items-center gap-3 text-red-600">
              <AlertCircle className="w-5 h-5" />
              <span>{error}</span>
            </div>
          ) : sortedResults.length > 0 ? (
            <>
              <div className="p-3 bg-gray-50 border-b border-gray-200">
                <p className="text-sm font-semibold text-[#303A4D]">
                  Found {sortedResults.length} matching product{sortedResults.length !== 1 ? 's' : ''}
                </p>
                <p className="text-xs text-[#303A4D]/60 mt-1">
                  Click to select existing product or create new below
                </p>
              </div>

              {sortedResults.map((product) => (
                <ProductSearchResult
                  key={product.id}
                  product={product}
                  similarity={product.similarity}
                  onSelect={handleSelectProduct}
                />
              ))}

              {onCreateNew && (
                <button
                  onClick={handleCreateNew}
                  className="w-full p-4 border-t-2 border-gray-200 bg-[#FED141]/10 hover:bg-[#FED141]/20 transition-colors text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-[#FED141] rounded-lg flex items-center justify-center">
                      <Package className="w-5 h-5 text-[#303A4D]" />
                    </div>
                    <div>
                      <p className="font-bold text-[#303A4D]">Add as New Product</p>
                      <p className="text-sm text-[#303A4D]/60">
                        "{searchQuery}" doesn't match any existing products
                      </p>
                    </div>
                  </div>
                </button>
              )}
            </>
          ) : searchQuery.length >= 2 ? (
            <div className="p-8 text-center">
              <Package className="w-12 h-12 text-[#303A4D]/20 mx-auto mb-3" />
              <p className="font-semibold text-[#303A4D] mb-1">No products found</p>
              <p className="text-sm text-[#303A4D]/60 mb-4">
                No existing products match "{searchQuery}"
              </p>
              {onCreateNew && (
                <button
                  onClick={handleCreateNew}
                  className="px-6 py-2 bg-[#FED141] text-[#303A4D] rounded-lg font-semibold hover:bg-[#FED141]/90 transition-colors"
                >
                  Add as New Product
                </button>
              )}
            </div>
          ) : (
            <div className="p-4 text-center text-sm text-[#303A4D]/60">
              Type at least 2 characters to search
            </div>
          )}
        </div>
      )}
    </div>
  )
}
