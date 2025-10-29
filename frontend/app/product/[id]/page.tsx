"use client"

import { Button } from "@/components/ui/button"
import { useCart } from "@/lib/cart-context"
import { User, ShoppingBag, Package } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useState, useEffect } from "react"
import { AddToCartModal } from "@/components/add-to-cart-modal"
import { CartNotification } from "@/components/cart-notification"
import { useParams } from "next/navigation"
import { ProductReviews } from "@/components/product-reviews"

interface Product {
  id: string
  name: string
  description: string
  price_per_unit: number | string
  unit_type: string
  stock_quantity: number | string
  category_id: string
  is_active: boolean
  images?: string[]
  inStock: boolean
  price: number
  unit: string
  category: string
  image: string
  onSale?: boolean
  originalPrice?: number
  isBundle?: boolean
  bundleItems?: string[]
  nutritionInfo?: any
}

const demoProducts = [
  {
    id: 1,
    name: "Fresh Red Apples",
    price: 12.99,
    unit: "per kg",
    category: "Fruits",
    image: "/images/apple-inhand.jpg",
    inStock: true,
    images: ["/images/apple-inhand.jpg", "/images/apple-inhand.jpg", "/images/apple-inhand.jpg"],
    description:
      "Crisp and sweet red apples, perfect for snacking or baking. Our apples are sourced from local farmers who use sustainable farming practices. Rich in fiber and vitamin C, these apples are a healthy addition to your diet.",
    isBundle: false,
    onSale: false,
    nutritionInfo: {
      calories: "52 per 100g",
      protein: "0.3g",
      carbs: "14g",
      fiber: "2.4g",
    },
  },
  {
    id: 2,
    name: "Organic Tomatoes",
    price: 8.5,
    unit: "per kg",
    category: "Vegetables",
    image: "/images/tomato.jpg",
    inStock: true,
    images: ["/images/tomato.jpg", "/images/tomato.jpg"],
    description: "Fresh organic tomatoes, locally sourced and bursting with flavor.",
    isBundle: false,
    onSale: true,
    originalPrice: 12.0,
  },
  {
    id: 9,
    name: "Family Grocery Bundle",
    price: 89.99,
    unit: "bundle",
    category: "Bundles",
    image: "/images/bags.jpg",
    inStock: true,
    images: ["/images/bags.jpg", "/images/bags.jpg"],
    description: "Complete family grocery bundle with rice, vegetables, fruits, and more!",
    isBundle: true,
    onSale: true,
    originalPrice: 120.0,
    bundleItems: ["5kg Rice", "2kg Tomatoes", "1kg Apples", "1kg Carrots", "Herbs Bundle"],
  },
]

export default function ProductPage() {
  const params = useParams()
  const productId = params.id as string

  const { addItem, totalItems } = useCart()
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedImage, setSelectedImage] = useState(0)
  const [showModal, setShowModal] = useState(false)
  const [showNotification, setShowNotification] = useState(false)
  const [similarProducts, setSimilarProducts] = useState<Product[]>([])

  useEffect(() => {
    if (productId) {
      fetchProduct()
    }
  }, [productId])

  const fetchProduct = async () => {
    try {
      const response = await fetch(`http://localhost:8000/api/v1/products/${productId}`)
      if (response.ok) {
        const data = await response.json()
        
        // Fetch category name
        let categoryName = "Uncategorized"
        if (data.category_id) {
          const catResponse = await fetch(`http://localhost:8000/api/v1/products/categories/${data.category_id}/`)
          if (catResponse.ok) {
            const catData = await catResponse.json()
            categoryName = catData.name
          }
        }
        
        const transformedProduct: Product = {
          id: data.id,
          name: data.name,
          description: data.description || "",
          price_per_unit: data.price_per_unit,
          unit_type: data.unit_type,
          stock_quantity: data.stock_quantity,
          category_id: data.category_id,
          is_active: data.is_active,
          images: data.images || [],
          inStock: data.stock_quantity > 0,
          price: typeof data.price_per_unit === 'string' ? parseFloat(data.price_per_unit) : data.price_per_unit,
          unit: `per ${data.unit_type}`,
          category: categoryName,
          image: data.images && data.images.length > 0 ? data.images[0] : "/placeholder.svg"
        }
        
        setProduct(transformedProduct)
        
        // Fetch similar products (same category)
        if (data.category_id) {
          fetchSimilarProducts(data.category_id, data.id)
        }
      }
    } catch (error) {
      console.error("Failed to fetch product:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchSimilarProducts = async (categoryId: string, currentProductId: string) => {
    try {
      const response = await fetch(`http://localhost:8000/api/v1/products?limit=100`)
      if (response.ok) {
        const data = await response.json()
        const productList = Array.isArray(data) ? data : data.products || data.items || []
        
        const similar = productList
          .filter((p: any) => p.category_id === categoryId && p.id !== currentProductId && p.is_active && p.stock_quantity > 0)
          .slice(0, 4)
          .map((p: any) => ({
            id: p.id,
            name: p.name,
            price: typeof p.price_per_unit === 'string' ? parseFloat(p.price_per_unit) : p.price_per_unit,
            unit: `per ${p.unit_type}`,
            image: p.images && p.images.length > 0 ? p.images[0] : "/placeholder.svg",
            inStock: p.stock_quantity > 0,
            category: "",
            description: p.description || "",
            price_per_unit: p.price_per_unit,
            unit_type: p.unit_type,
            stock_quantity: p.stock_quantity,
            category_id: p.category_id,
            is_active: p.is_active,
            images: p.images || []
          }))
        
        setSimilarProducts(similar)
      }
    } catch (error) {
      console.error("Failed to fetch similar products:", error)
    }
  }

  const handleAddToCart = (product: Product, quantity: number, purchaseType: "weight" | "quantity") => {
    addItem({
      id: String(product.id),
      name: product.name,
      price: product.price * quantity,
      unit: purchaseType === "weight" ? `${quantity}${product.unit_type}` : `x${quantity}`,
      vendor: "Go-Shop",
      image: product.image,
      quantity: 1
    })
    setShowNotification(true)
    setTimeout(() => setShowNotification(false), 5000)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F4F2E6] flex items-center justify-center">
        <Package className="w-16 h-16 text-[#303A4D]/40 animate-pulse" />
      </div>
    )
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-[#F4F2E6] flex items-center justify-center">
        <div className="text-center">
          <Package className="w-16 h-16 text-[#303A4D]/40 mx-auto mb-4" />
          <p className="text-2xl text-[#303A4D]/60">Product not found</p>
          <Link href="/shop">
            <Button className="mt-4 bg-[#FED141] hover:bg-[#F1B424] text-[#303A4D]">
              Back to Shop
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F4F2E6]">
      <nav className="bg-[#FED141] px-6 md:px-8 py-6">
        <div className="flex items-center justify-between">
          <Link href="/shop" className="text-lg font-medium text-[#303A4D] hover:opacity-80">
            ← Back to Shop
          </Link>

          <Link href="/" className="absolute left-1/2 -translate-x-1/2">
            <Image src="/images/logo.png" alt="go-shop" width={124} height={39} />
          </Link>

          <div className="flex items-center gap-4">
            <Link href="/login">
              <button className="w-12 h-12 rounded-full bg-[#303A4D] flex items-center justify-center hover:opacity-90 transition-opacity">
                <User className="w-5 h-5 text-white" />
              </button>
            </Link>
            <Link href="/cart">
              <button className="w-12 h-12 rounded-full bg-[#303A4D] flex items-center justify-center hover:opacity-90 transition-opacity relative">
                <ShoppingBag className="w-5 h-5 text-white" />
                {totalItems > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-[#C24628] text-white text-xs rounded-full flex items-center justify-center font-bold">
                    {totalItems}
                  </span>
                )}
              </button>
            </Link>
          </div>
        </div>
      </nav>

      <div className="w-full px-6 md:px-12 lg:px-16 py-12 max-w-[1600px] mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 mb-16">
          {/* Image Gallery */}
          <div>
            <div className="relative h-[500px] bg-white rounded-3xl overflow-hidden mb-4 p-8">
              <Image
                src={(product.images && product.images[selectedImage]) || product.image || "/placeholder.svg"}
                alt={product.name}
                fill
                className="object-contain p-4"
              />
              {product.onSale && (
                <div className="absolute top-6 left-6">
                  <span className="bg-[#C24628] text-white px-6 py-3 rounded-full text-lg font-bold">SALE</span>
                </div>
              )}
              {product.isBundle && (
                <div className="absolute top-6 right-6">
                  <span className="bg-[#93C90F] text-white px-6 py-3 rounded-full text-lg font-bold">BUNDLE</span>
                </div>
              )}
            </div>
            {product.images && product.images.length > 1 && (
              <div className="flex gap-4">
                {product.images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImage(idx)}
                    className={`relative h-24 w-24 rounded-2xl overflow-hidden bg-white ${
                      selectedImage === idx ? "ring-4 ring-[#FED141]" : "opacity-60 hover:opacity-100"
                    }`}
                  >
                    <Image
                      src={img || "/placeholder.svg"}
                      alt={`${product.name} ${idx + 1}`}
                      fill
                      className="object-contain p-2"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div>
            <div className="mb-4">
              <span className="bg-[#FED141] text-[#303A4D] px-4 py-2 rounded-full text-sm font-medium">
                {product.category}
              </span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-[#303A4D] mb-4">{product.name}</h1>
            <div className="flex items-baseline gap-3 mb-6">
              <span className="text-5xl font-bold text-[#303A4D]">GH₵{product.price.toFixed(2)}</span>
              {product.onSale && product.originalPrice && (
                <span className="text-2xl text-[#303A4D]/40 line-through">GH₵{product.originalPrice.toFixed(2)}</span>
              )}
              <span className="text-xl text-[#303A4D]/60 font-medium">{product.unit}</span>
            </div>

            <p className="text-lg text-[#303A4D]/80 mb-8 leading-relaxed">{product.description}</p>

            {product.isBundle && product.bundleItems && (
              <div className="bg-white rounded-2xl p-6 mb-8">
                <h3 className="text-xl font-bold text-[#303A4D] mb-4">Bundle Includes:</h3>
                <ul className="space-y-2">
                  {product.bundleItems.map((item, idx) => (
                    <li key={idx} className="flex items-center gap-3 text-[#303A4D]">
                      <div className="w-2 h-2 rounded-full bg-[#FED141]" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <Button
              onClick={() => setShowModal(true)}
              size="lg"
              className="w-full bg-[#303A4D] hover:bg-[#3B4559] text-white rounded-full py-8 text-xl font-bold h-auto mb-4"
              disabled={!product.inStock}
            >
              {product.inStock ? "Add to Cart" : "Out of Stock"}
            </Button>

            <div className="bg-white rounded-2xl p-6">
              <div className="grid grid-cols-2 gap-4 text-center">
                <div>
                  <p className="text-sm text-[#303A4D]/60 mb-1">Delivery</p>
                  <p className="font-bold text-[#303A4D]">Wed, Fri, Sun</p>
                </div>
                <div>
                  <p className="text-sm text-[#303A4D]/60 mb-1">Shipping</p>
                  <p className="font-bold text-[#93C90F]">FREE</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Similar Products */}
        {similarProducts.length > 0 && (
          <div className="mb-16">
            <h2 className="text-3xl font-bold text-[#303A4D] mb-8">Similar Products</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {similarProducts.map((similar) => (
                <Link key={similar.id} href={`/product/${similar.id}`}>
                  <div className="bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 group cursor-pointer">
                    <div className="relative h-64 bg-gradient-to-br from-[#FED141]/20 to-[#FED141]/5 overflow-hidden">
                      <Image
                        src={similar.image || "/placeholder.svg"}
                        alt={similar.name}
                        fill
                        className="object-cover group-hover:scale-110 transition-transform duration-300"
                      />
                    </div>
                    <div className="p-4">
                      <h3 className="text-lg font-bold text-[#303A4D] mb-2">{similar.name}</h3>
                      <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-bold text-[#303A4D]">GH₵{similar.price.toFixed(2)}</span>
                        <span className="text-sm text-[#303A4D]/60">{similar.unit}</span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Product Reviews */}
        <ProductReviews productId={product.id} productName={product.name} />
      </div>

      {showModal && (
        <AddToCartModal
          product={product}
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          onAddToCart={handleAddToCart}
        />
      )}

      <CartNotification show={showNotification} productName={product.name} />
    </div>
  )
}
