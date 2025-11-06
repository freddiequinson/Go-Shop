"use client"

import type React from "react"

import { useToast } from "@/hooks/use-toast"
import { getApiBaseUrl } from "@/lib/api/url-helper"
import { Button } from "@/components/ui/button"
import { Upload, X, Star, Image as ImageIcon, Plus, AlertCircle, CheckCircle, Package } from "lucide-react"
import Link from "next/link"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import ProductSearchInput from "@/components/products/ProductSearchInput"

export default function NewProduct() {
  const router = useRouter()
  const [mode, setMode] = useState<"search" | "new" | "existing">("search")
  const [selectedProduct, setSelectedProduct] = useState<any>(null)
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category_id: "",
    price_per_unit: "",
    price_per_quantity: "",
    unit_type: "kg",
    stock_quantity: "",
    minimum_quantity: "1",
    is_perishable: false,
    shelf_life_days: "",
    cost_price: "",
    supplier_id: "",
    supplier_name: "",
    warehouse_location: "",
  })
  const [images, setImages] = useState<string[]>([])
  const [primaryImageIndex, setPrimaryImageIndex] = useState(0)
  const [loading, setLoading] = useState(false)
  const [showImageLibrary, setShowImageLibrary] = useState(false)
  const [systemImages, setSystemImages] = useState<any[]>([])
  const [suppliers, setSuppliers] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [locations, setLocations] = useState<any[]>([])
  const [showCategoryModal, setShowCategoryModal] = useState(false)
  const [newCategory, setNewCategory] = useState({ name: "", description: "", parent_id: "" })

  interface Category {
    id: string
    name: string
    description?: string
    parent_id?: string | null
    subcategories?: Category[]
  }

  // Product name to category mapping for auto-suggestion
  const productCategoryMap: { [key: string]: string } = {
    // Vegetables
    "lettuce": "Vegetables", "cabbage": "Vegetables", "spinach": "Vegetables",
    "red beat": "Vegetables", "cucumber": "Vegetables", "carrot": "Vegetables",
    "green pepper": "Vegetables", "hot pepper": "Vegetables", "onion": "Vegetables",
    "tomatoes": "Vegetables", "tomato": "Vegetables", "shallot": "Vegetables",
    "kontomire": "Vegetables", "garden egg": "Vegetables", "gboma": "Vegetables",
    "ademe": "Vegetables", "okro": "Vegetables", "okra": "Vegetables",
    
    // Fruits
    "pineapple": "Fruits", "orange": "Fruits", "banana": "Fruits",
    "lemon": "Fruits", "lime": "Fruits", "pear": "Fruits", "date": "Fruits",
    "apple": "Fruits", "grapes": "Fruits", "passion fruit": "Fruits",
    "tangerine": "Fruits", "water melon": "Fruits", "watermelon": "Fruits",
    "mango": "Fruits", "coconut": "Fruits", "kiwi": "Fruits", "avocado": "Fruits",
    
    // Tubers
    "yam": "Tubers", "sweet potatoes": "Tubers", "sweet potato": "Tubers",
    "cassava": "Tubers", "plantain": "Tubers", "irish potato": "Tubers",
    "potato": "Tubers", "cocoyam": "Tubers",
    
    // Spices
    "ginger": "Spices", "garlic": "Spices", "chilli pepper": "Spices",
    "black pepper": "Spices", "curry": "Spices", "rosemary": "Spices",
    "dawadawa": "Spices", "mormorni": "Spices", "shrimp powder": "Spices",
    "herring powder": "Spices", "turmeric": "Spices", "bay leaf": "Spices",
    "gloves": "Spices", "prekese": "Spices", "pepreh": "Spices", "cubes": "Spices",
    
    // Beverages
    "milk": "Beverages", "cocoa powder": "Beverages", "sugar": "Beverages",
    "canned fish": "Beverages", "canned meat": "Beverages", "cereal mix": "Beverages",
    "corn flakes": "Beverages", "granola": "Beverages", "coffee": "Beverages",
    "cappuccino": "Beverages", "soft drinks": "Beverages", "beer": "Beverages",
    "wine": "Beverages", "gin": "Beverages", "bitters": "Beverages",
    "cider": "Beverages", "spirits": "Beverages", "whisky": "Beverages",
    
    // Animal Protein
    "beef": "Animal Protein", "cow": "Animal Protein", "mutton": "Animal Protein",
    "goat meat": "Animal Protein", "pork": "Animal Protein", "lamb": "Animal Protein",
    "chicken": "Animal Protein", "turkey": "Animal Protein", "guinea fowl": "Animal Protein",
    "tilapia": "Animal Protein", "salmon": "Animal Protein", "kpanla": "Animal Protein",
    "cat fish": "Animal Protein", "catfish": "Animal Protein", "cassava fish": "Animal Protein",
    "red fish": "Animal Protein", "mud fish": "Animal Protein", "egg": "Animal Protein",
    
    // Seeds & Nuts
    "almond": "Seeds & Nuts", "groundnut": "Seeds & Nuts", "pistachio": "Seeds & Nuts",
    "walnuts": "Seeds & Nuts", "cashew": "Seeds & Nuts", "hazelnut": "Seeds & Nuts",
    "tiger nut": "Seeds & Nuts", "pumpkin seed": "Seeds & Nuts", "sunflower seed": "Seeds & Nuts",
    "sesame seed": "Seeds & Nuts",
    
    // Grains
    "rice": "Grains", "maize": "Grains", "beans": "Grains", "garri": "Grains",
    "bambara beans": "Grains", "millet": "Grains", "soya beans": "Grains",
    "sorghum": "Grains", "wheat": "Grains",
    
    // Water
    "water": "Water", "bottled water": "Water", "mineral water": "Water",
  }

  const getSuggestedCategory = (productName: string): { name: string, id: string } | null => {
    const nameLower = productName.toLowerCase()
    for (const [keyword, categoryName] of Object.entries(productCategoryMap)) {
      if (nameLower.includes(keyword)) {
        // Find the category in our categories list
        const category = categories.find(c => c.name === categoryName)
        if (category) {
          return { name: categoryName, id: category.id }
        }
      }
    }
    return null
  }

  const organizeCategories = () => {
    const mainCategories = categories.filter(c => !c.parent_id)
    return mainCategories.map(main => ({
      ...main,
      subcategories: categories.filter(sub => sub.parent_id === main.id)
    }))
  }

  const applySuggestedCategory = () => {
    const suggested = getSuggestedCategory(formData.name)
    if (suggested && suggested.id) {
      setFormData({ ...formData, category_id: suggested.id })
    }
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return

    Array.from(files).forEach(file => {
      const reader = new FileReader()
      reader.onloadend = () => {
        setImages(prev => [...prev, reader.result as string])
      }
      reader.readAsDataURL(file)
    })
  }

  useEffect(() => {
    fetchSystemImages()
    fetchSuppliers()
    fetchCategories()
    fetchLocations()
  }, [])

  const fetchSystemImages = async () => {
    try {
      const token = localStorage.getItem("access_token")
      const response = await fetch(`${getApiBaseUrl()}/admin/image-library?is_system=true`, {
        headers: { "Authorization": `Bearer ${token}` }
      })
      if (response.ok) {
        const data = await response.json()
        setSystemImages(Array.isArray(data) ? data : [])
      }
    } catch (error) {
      console.error("Failed to fetch system images:", error)
    }
  }

  const fetchSuppliers = async () => {
    try {
      const token = localStorage.getItem("access_token")
      const response = await fetch(`${getApiBaseUrl()}/suppliers/`, {
        headers: { "Authorization": `Bearer ${token}` }
      })
      if (response.ok) {
        const data = await response.json()
        setSuppliers(Array.isArray(data) ? data : [])
      }
    } catch (error) {
      console.error("Failed to fetch suppliers:", error)
    }
  }

  const fetchCategories = async () => {
    try {
      const token = localStorage.getItem("access_token")
      const response = await fetch(`${getApiBaseUrl()}/products/categories/`, {
        headers: { "Authorization": `Bearer ${token}` }
      })
      if (response.ok) {
        const data = await response.json()
        setCategories(Array.isArray(data) ? data : [])
      }
    } catch (error) {
      console.error("Failed to fetch categories:", error)
    }
  }

  const fetchLocations = async () => {
    try {
      const token = localStorage.getItem("access_token")
      const response = await fetch(`${getApiBaseUrl()}/warehouse/locations/`, {
        headers: { "Authorization": `Bearer ${token}` }
      })
      if (response.ok) {
        const data = await response.json()
        setLocations(Array.isArray(data) ? data : (data.items || []))
      }
    } catch (error) {
      console.error("Failed to fetch locations:", error)
    }
  }

  const handleCreateCategory = async () => {
    if (!newCategory.name.trim()) {
      alert("Category name is required")
      return
    }

    try {
      const token = localStorage.getItem("access_token")
      const response = await fetch(`${getApiBaseUrl()}/products/categories/`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ ...newCategory, is_active: true })
      })

      if (response.ok) {
        const createdCategory = await response.json()
        await fetchCategories()
        setFormData({ ...formData, category_id: createdCategory.id })
        setShowCategoryModal(false)
        setNewCategory({ name: "", description: "", parent_id: "" })
      } else {
        alert("Failed to create category")
      }
    } catch (error) {
      console.error("Error creating category:", error)
      alert("Error creating category")
    }
  }

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index))
    if (primaryImageIndex === index) {
      setPrimaryImageIndex(0)
    } else if (primaryImageIndex > index) {
      setPrimaryImageIndex(primaryImageIndex - 1)
    }
  }

  const selectSystemImage = (imageUrl: string) => {
    setImages(prev => [imageUrl, ...prev])
    setPrimaryImageIndex(0)
    setShowImageLibrary(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const token = localStorage.getItem("access_token")
      
      // Prepare the payload
      const payload = {
        name: formData.name,
        description: formData.description,
        category_id: formData.category_id || null,
        price_per_unit: parseFloat(formData.price_per_unit),
        price_per_quantity: formData.price_per_quantity ? parseFloat(formData.price_per_quantity) : null,
        unit_type: formData.unit_type,
        minimum_quantity: parseFloat(formData.minimum_quantity),
        stock_quantity: formData.stock_quantity ? parseFloat(formData.stock_quantity) : null,
        images: images.length > 0 ? [images[primaryImageIndex], ...images.filter((_, i) => i !== primaryImageIndex)] : [],
        supplier_id: formData.supplier_id || null,
        cost_price: formData.cost_price ? parseFloat(formData.cost_price) : null,
        is_perishable: formData.is_perishable,
        shelf_life_days: formData.shelf_life_days ? parseInt(formData.shelf_life_days) : null
      }
      
      console.log("Submitting product:", payload)
      
      const response = await fetch(`${getApiBaseUrl()}/products`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      })

      if (response.ok) {
        router.push("/admin/products")
      } else {
        const errorData = await response.json()
        console.error("Error response:", errorData)
        alert(`Failed to create product: ${JSON.stringify(errorData)}`)
      }
    } catch (error) {
      console.error("Error creating product:", error)
      alert("Error creating product")
    } finally {
      setLoading(false)
    }
  }

  const handleSelectProduct = (product: any) => {
    setSelectedProduct(product)
    setMode("existing")
    
    // Pre-fill form with existing product data
    setFormData({
      ...formData,
      name: product.name,
      description: product.description || "",
      category_id: product.category_id || "",
      price_per_unit: product.price_per_unit?.toString() || "",
      unit_type: product.unit_type || "kg",
      stock_quantity: product.stock_quantity?.toString() || "",
      cost_price: product.cost_price?.toString() || "",
      is_perishable: product.is_perishable || false,
      shelf_life_days: product.shelf_life_days?.toString() || "",
    })
    
    // Load existing images if available
    if (product.images && Array.isArray(product.images)) {
      setImages(product.images)
    }
  }

  const handleCreateNew = () => {
    setMode("new")
    setSelectedProduct(null)
  }

  const handleBackToSearch = () => {
    setMode("search")
    setSelectedProduct(null)
    // Reset form
    setFormData({
      name: "",
      description: "",
      category_id: "",
      price_per_unit: "",
      price_per_quantity: "",
      unit_type: "kg",
      stock_quantity: "",
      minimum_quantity: "1",
      is_perishable: false,
      shelf_life_days: "",
      cost_price: "",
      supplier_id: "",
      supplier_name: "",
      warehouse_location: "",
    })
    setImages([])
  }

  return (
    <div className="p-4 md:p-8">
      <div className="mb-6 md:mb-8">
        <h1 className="text-3xl md:text-5xl font-bold text-[#303A4D] mb-2 md:mb-4">Add New Product</h1>
        <p className="text-base md:text-xl text-[#303A4D]/70">Search for existing products or add a new one to your inventory</p>
      </div>

      {/* Product Search Section */}
      {mode === "search" && (
        <div className="bg-white rounded-2xl md:rounded-3xl p-6 md:p-8 shadow-sm mb-6">
          <div className="mb-6">
            <h2 className="text-xl md:text-2xl font-bold text-[#303A4D] mb-2">Search Existing Products</h2>
            <p className="text-sm md:text-base text-[#303A4D]/70">Check if the product already exists to avoid duplicates</p>
          </div>
          
          <ProductSearchInput
            onSelectProduct={handleSelectProduct}
            onCreateNew={handleCreateNew}
            placeholder="Search by product name, SKU, or barcode..."
            autoFocus
          />

          <div className="mt-6 p-4 bg-blue-50 border-2 border-blue-200 rounded-xl">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-800">
                <p className="font-semibold mb-1">Why search first?</p>
                <ul className="space-y-1 list-disc list-inside">
                  <li>Prevents duplicate products in the system</li>
                  <li>Shows existing supplier relationships</li>
                  <li>Maintains consistent pricing across suppliers</li>
                  <li>Helps with inventory tracking and reporting</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Existing Product Selected */}
      {mode === "existing" && selectedProduct && (
        <div className="bg-green-50 border-2 border-green-200 rounded-2xl md:rounded-3xl p-6 md:p-8 shadow-sm mb-6">
          <div className="flex items-start gap-4 mb-6">
            <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
              <CheckCircle className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-xl md:text-2xl font-bold text-green-900 mb-2">Existing Product Selected</h3>
              <p className="text-sm md:text-base text-green-700 mb-4">
                This product already exists in the system. You can update its details or link it to your supplier inventory.
              </p>
              
              <div className="bg-white rounded-xl p-4 space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-[#303A4D]/60 mb-1">Product Name</p>
                    <p className="font-bold text-[#303A4D]">{selectedProduct.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-[#303A4D]/60 mb-1">Product ID</p>
                    <p className="font-mono text-sm text-[#303A4D]">{selectedProduct.id}</p>
                  </div>
                  {selectedProduct.sku && (
                    <div>
                      <p className="text-sm text-[#303A4D]/60 mb-1">SKU</p>
                      <p className="font-semibold text-[#303A4D]">{selectedProduct.sku}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-sm text-[#303A4D]/60 mb-1">Current Price</p>
                    <p className="font-bold text-[#303A4D]">
                      GH₵{Number(selectedProduct.price_per_unit).toFixed(2)} per {selectedProduct.unit_type}
                    </p>
                  </div>
                </div>
                {selectedProduct.supplier_count !== undefined && (
                  <div className="pt-3 border-t border-gray-200">
                    <p className="text-sm text-[#303A4D]/60 mb-1">Suppliers</p>
                    <p className="font-bold text-[#303A4D]">
                      {selectedProduct.supplier_count} supplier{selectedProduct.supplier_count !== 1 ? 's' : ''} currently stock this product
                    </p>
                  </div>
                )}
              </div>

              <div className="mt-4 flex flex-col sm:flex-row gap-3">
                <button
                  type="button"
                  onClick={handleBackToSearch}
                  className="px-6 py-2 bg-white border-2 border-green-600 text-green-700 rounded-lg font-semibold hover:bg-green-50 transition-colors"
                >
                  ← Back to Search
                </button>
                <button
                  type="button"
                  onClick={handleCreateNew}
                  className="px-6 py-2 bg-white border-2 border-gray-300 text-[#303A4D] rounded-lg font-semibold hover:bg-gray-50 transition-colors"
                >
                  Add as New Product Anyway
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Product Form */}
      {(mode === "new" || mode === "existing") && (
        <>
          {mode === "new" && (
            <div className="bg-[#FED141]/10 border-2 border-[#FED141] rounded-2xl md:rounded-3xl p-6 md:p-8 shadow-sm mb-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-[#FED141] rounded-full flex items-center justify-center flex-shrink-0">
                  <Package className="w-6 h-6 text-[#303A4D]" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl md:text-2xl font-bold text-[#303A4D] mb-2">Adding New Product</h3>
                  <p className="text-sm md:text-base text-[#303A4D]/70 mb-4">
                    This product doesn't exist in the system yet. Fill in all the details below.
                  </p>
                  <button
                    type="button"
                    onClick={handleBackToSearch}
                    className="px-6 py-2 bg-[#303A4D] text-white rounded-lg font-semibold hover:bg-[#303A4D]/90 transition-colors"
                  >
                    ← Back to Search
                  </button>
                </div>
              </div>
            </div>
          )}

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl md:rounded-3xl p-6 md:p-8 shadow-sm">
        <div className="space-y-6">
          <div>
            <label className="block text-[#303A4D] font-bold mb-3">Product Images</label>
            <p className="text-sm text-[#303A4D]/60 mb-3">First image will be the primary image shown in listings. Click the star to set primary image.</p>
            
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="border-2 border-dashed border-[#FED141] rounded-3xl p-8 text-center hover:bg-[#FED141]/5 transition-colors cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageUpload}
                  className="hidden"
                  id="image-upload"
                />
                <label htmlFor="image-upload" className="cursor-pointer">
                  <Upload className="w-10 h-10 text-[#303A4D]/40 mx-auto mb-2" />
                  <p className="text-[#303A4D] font-medium text-sm">Upload Your Images</p>
                </label>
              </div>
              
              <button
                type="button"
                onClick={() => setShowImageLibrary(true)}
                className="border-2 border-dashed border-[#FED141] rounded-3xl p-8 text-center hover:bg-[#FED141]/5 transition-colors"
              >
                <ImageIcon className="w-10 h-10 text-[#303A4D]/40 mx-auto mb-2" />
                <p className="text-[#303A4D] font-medium text-sm">Choose from Library</p>
              </button>
            </div>

            {images.length > 0 && (
              <div className="grid grid-cols-4 gap-4">
                {images.map((img, idx) => (
                  <div key={idx} className="relative group">
                    <img src={img} alt="Preview" className={`w-full h-24 object-cover rounded-lg ${
                      idx === primaryImageIndex ? 'ring-4 ring-[#FED141]' : ''
                    }`} />
                    <button
                      type="button"
                      onClick={() => setPrimaryImageIndex(idx)}
                      className={`absolute top-2 left-2 p-1 rounded-full ${
                        idx === primaryImageIndex ? 'bg-[#FED141] text-[#303A4D]' : 'bg-black/50 text-white'
                      }`}
                      title="Set as primary image"
                    >
                      <Star className="w-4 h-4" fill={idx === primaryImageIndex ? 'currentColor' : 'none'} />
                    </button>
                    <button
                      type="button"
                      onClick={() => removeImage(idx)}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-4 h-4" />
                    </button>
                    {idx === primaryImageIndex && (
                      <div className="absolute bottom-0 left-0 right-0 bg-[#FED141] text-[#303A4D] text-xs font-bold py-1 text-center rounded-b-lg">
                        Primary
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="block text-[#303A4D] font-bold mb-3">Product Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full bg-[#F4F2E6] rounded-2xl px-6 py-4 text-[#303A4D] focus:outline-none focus:ring-2 focus:ring-[#FED141]"
              placeholder="e.g., Fresh Red Apples"
              required
            />
          </div>

          <div>
            <label className="block text-[#303A4D] font-bold mb-3">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full bg-[#F4F2E6] rounded-2xl px-6 py-4 text-[#303A4D] focus:outline-none focus:ring-2 focus:ring-[#FED141] min-h-32"
              placeholder="Describe your product..."
              required
            />
          </div>

          {/* Category Selection */}
          <div>
            <label className="block text-[#303A4D] font-bold mb-3">Category</label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <select
                value={formData.category_id}
                onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                className="md:col-span-2 bg-[#F4F2E6] rounded-2xl px-6 py-4 text-[#303A4D] focus:outline-none focus:ring-2 focus:ring-[#FED141]"
              >
                <option value="">Select Category (Optional)</option>
                {organizeCategories().map((parent: Category) => (
                  <optgroup key={parent.id} label={parent.name}>
                    {parent.subcategories && parent.subcategories.length > 0 ? (
                      parent.subcategories.map((sub: Category) => (
                        <option key={sub.id} value={sub.id}>
                          {sub.name}
                        </option>
                      ))
                    ) : (
                      <option key={parent.id} value={parent.id}>
                        {parent.name}
                      </option>
                    )}
                  </optgroup>
                ))}
              </select>
              <Button
                type="button"
                onClick={() => setShowCategoryModal(true)}
                className="bg-[#FED141] hover:bg-[#F1B424] text-[#303A4D] rounded-2xl px-6 py-4 font-bold whitespace-nowrap h-full"
              >
                <Plus className="w-5 h-5 mr-2" />
                New Category
              </Button>
            </div>
            {formData.name && getSuggestedCategory(formData.name) && (
              <div className="mt-2 flex items-center gap-2">
                <p className="text-sm text-blue-600">
                  💡 Suggested: <strong>{getSuggestedCategory(formData.name)?.name}</strong>
                </p>
                <button
                  type="button"
                  onClick={applySuggestedCategory}
                  className="text-xs bg-blue-100 hover:bg-blue-200 text-blue-700 px-3 py-1 rounded-full font-medium transition-colors"
                >
                  Apply
                </button>
              </div>
            )}
          </div>

          <div>
            <label className="block text-[#303A4D] font-bold mb-3">Unit Type</label>
            <select
              value={formData.unit_type}
              onChange={(e) => setFormData({ ...formData, unit_type: e.target.value })}
              className="w-full bg-[#F4F2E6] rounded-2xl px-6 py-4 text-[#303A4D] focus:outline-none focus:ring-2 focus:ring-[#FED141]"
            >
              <option value="kg">Kilogram (kg) - Price per kg</option>
              <option value="gram">Gram - Price per gram</option>
              <option value="liter">Liter - Price per liter</option>
              <option value="piece">Piece - Price per piece</option>
              <option value="pack">Pack - Price per pack</option>
            </select>
            <p className="text-sm text-[#303A4D]/60 mt-2">
              {formData.unit_type === 'kg' && 'Customers will buy by weight (e.g., 2.5 kg)'}
              {formData.unit_type === 'gram' && 'Customers will buy by weight (e.g., 500 grams)'}
              {formData.unit_type === 'liter' && 'Customers will buy by volume (e.g., 1.5 liters)'}
              {formData.unit_type === 'piece' && 'Customers will buy individual items (e.g., 3 pieces)'}
              {formData.unit_type === 'pack' && 'Customers will buy by pack (e.g., 2 packs)'}
            </p>
          </div>

          {/* Supplier Information */}
          <div className="bg-[#FED141]/10 rounded-2xl p-6 space-y-4">
            <h3 className="text-lg font-bold text-[#303A4D]">Supplier Information (Optional)</h3>
            
            <div>
              <label className="block text-[#303A4D] font-bold mb-3">Supplier</label>
              <select
                value={formData.supplier_id}
                onChange={(e) => {
                  const supplier = suppliers.find(s => s.id === e.target.value)
                  setFormData({ 
                    ...formData, 
                    supplier_id: e.target.value,
                    supplier_name: supplier?.name || ''
                  })
                }}
                className="w-full bg-[#F4F2E6] rounded-2xl px-6 py-4 text-[#303A4D] focus:outline-none focus:ring-2 focus:ring-[#FED141]"
              >
                <option value="">Select Supplier (Optional)</option>
                {suppliers.map(supplier => (
                  <option key={supplier.id} value={supplier.id}>{supplier.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[#303A4D] font-bold mb-3">Cost Price per {formData.unit_type} (GH₵)</label>
              <input
                type="number"
                step="0.01"
                value={formData.cost_price}
                onChange={(e) => setFormData({ ...formData, cost_price: e.target.value })}
                className="w-full bg-[#F4F2E6] rounded-2xl px-6 py-4 text-[#303A4D] focus:outline-none focus:ring-2 focus:ring-[#FED141]"
                placeholder="What you pay the supplier"
              />
              <p className="text-sm text-[#303A4D]/60 mt-2">Your purchase cost from supplier</p>
            </div>

            <div>
              <label className="block text-[#303A4D] font-bold mb-3">Warehouse Location</label>
              <select
                value={formData.warehouse_location}
                onChange={(e) => setFormData({ ...formData, warehouse_location: e.target.value })}
                className="w-full bg-[#F4F2E6] rounded-2xl px-6 py-4 text-[#303A4D] focus:outline-none focus:ring-2 focus:ring-[#FED141]"
              >
                <option value="">Select Location (Optional)</option>
                {locations.map(location => (
                  <option key={location.id} value={location.id}>
                    {location.name} {location.code ? `(${location.code})` : ''}
                  </option>
                ))}
              </select>
              <p className="text-sm text-[#303A4D]/60 mt-2">Where this product will be stored in the warehouse</p>
            </div>
          </div>

          {/* Pricing */}
          <div className="bg-blue-50 rounded-2xl p-6 space-y-4">
            <h3 className="text-lg font-bold text-[#303A4D]">Selling Price</h3>
            
            <div>
              <label className="block text-[#303A4D] font-bold mb-3">
                Price per {formData.unit_type} (GH₵)
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.price_per_unit}
                onChange={(e) => setFormData({ ...formData, price_per_unit: e.target.value })}
                className="w-full bg-white rounded-2xl px-6 py-4 text-[#303A4D] focus:outline-none focus:ring-2 focus:ring-[#FED141]"
                placeholder="Selling price to customers"
                required
              />
              <p className="text-sm text-[#303A4D]/60 mt-2">
                {formData.unit_type === 'kg' && 'e.g., GH₵5.00 per kg - Customer buying 2kg pays GH₵10.00'}
                {formData.unit_type === 'gram' && 'e.g., GH₵0.05 per gram - Customer buying 500g pays GH₵25.00'}
                {formData.unit_type === 'liter' && 'e.g., GH₵3.00 per liter - Customer buying 2L pays GH₵6.00'}
                {formData.unit_type === 'piece' && 'e.g., GH₵2.00 per piece - Customer buying 5 pieces pays GH₵10.00'}
                {formData.unit_type === 'pack' && 'e.g., GH₵15.00 per pack - Customer buying 3 packs pays GH₵45.00'}
              </p>
              {formData.cost_price && formData.price_per_unit && (
                <div className="mt-3 p-3 bg-green-100 rounded-lg">
                  <p className="text-sm font-bold text-green-700">
                    Profit Margin: GH₵{(parseFloat(formData.price_per_unit) - parseFloat(formData.cost_price)).toFixed(2)} per {formData.unit_type}
                    ({(((parseFloat(formData.price_per_unit) - parseFloat(formData.cost_price)) / parseFloat(formData.cost_price)) * 100).toFixed(1)}%)
                  </p>
                </div>
              )}
            </div>

            {/* Optional: Price per Quantity (Piece) */}
            <div className="bg-purple-50 border-2 border-purple-200 rounded-2xl p-4">
              <label className="block text-[#303A4D] font-bold mb-3">
                {(formData.unit_type === 'piece' || formData.unit_type === 'pack') 
                  ? 'Price per kg (GH₵) - Optional'
                  : 'Price per Piece/Unit (GH₵) - Optional'
                }
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.price_per_quantity}
                onChange={(e) => setFormData({ ...formData, price_per_quantity: e.target.value })}
                className="w-full bg-white rounded-2xl px-6 py-4 text-[#303A4D] focus:outline-none focus:ring-2 focus:ring-purple-400"
                placeholder="e.g., 2.50"
              />
              <p className="text-sm text-purple-900/70 mt-2">
                {(formData.unit_type === 'piece' || formData.unit_type === 'pack')
                  ? '💡 Set this if customers can also buy by weight (kg). Example: Tomatoes at GH₵2/piece OR GH₵8/kg'
                  : '💡 Set this if customers can also buy by individual pieces/units. Example: Rice at GH₵8/kg OR GH₵2/pack'
                }
              </p>
            </div>
          </div>

          {/* Stock Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-[#303A4D] font-bold mb-3">
                Stock Quantity ({formData.unit_type})
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.stock_quantity}
                onChange={(e) => setFormData({ ...formData, stock_quantity: e.target.value })}
                className="w-full bg-[#F4F2E6] rounded-2xl px-6 py-4 text-[#303A4D] focus:outline-none focus:ring-2 focus:ring-[#FED141]"
                placeholder="Total available stock"
                required
              />
              <p className="text-sm text-[#303A4D]/60 mt-2">
                {formData.unit_type === 'kg' && 'e.g., 100 (means 100kg in stock)'}
                {formData.unit_type === 'piece' && 'e.g., 50 (means 50 pieces in stock)'}
              </p>
            </div>

            <div>
              <label className="block text-[#303A4D] font-bold mb-3">
                Minimum Order Quantity ({formData.unit_type})
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.minimum_quantity}
                onChange={(e) => setFormData({ ...formData, minimum_quantity: e.target.value })}
                className="w-full bg-[#F4F2E6] rounded-2xl px-6 py-4 text-[#303A4D] focus:outline-none focus:ring-2 focus:ring-[#FED141]"
                placeholder="Minimum customers can buy"
                required
              />
              <p className="text-sm text-[#303A4D]/60 mt-2">
                {formData.unit_type === 'kg' && 'e.g., 0.5 (customers must buy at least 0.5kg)'}
                {formData.unit_type === 'piece' && 'e.g., 1 (customers must buy at least 1 piece)'}
              </p>
            </div>
          </div>

          <div>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.is_perishable}
                onChange={(e) => setFormData({ ...formData, is_perishable: e.target.checked })}
                className="w-6 h-6 rounded-lg border-2 border-[#303A4D] text-[#FED141] focus:ring-[#FED141]"
              />
              <span className="text-[#303A4D] font-medium">This is a perishable product</span>
            </label>
          </div>

          {/* Shelf Life for Perishable Products */}
          {formData.is_perishable && (
            <div className="bg-orange-50 rounded-2xl p-6 border-2 border-orange-200">
              <label className="block text-[#303A4D] font-bold mb-3">
                ⏰ Shelf Life (Days)
              </label>
              <input
                type="number"
                value={formData.shelf_life_days}
                onChange={(e) => setFormData({ ...formData, shelf_life_days: e.target.value })}
                className="w-full bg-white rounded-2xl px-6 py-4 text-[#303A4D] focus:outline-none focus:ring-2 focus:ring-orange-400"
                placeholder="e.g., 7 for 7 days"
              />
              <p className="text-sm text-orange-900/70 mt-2">
                💡 Set how many days this product stays fresh. You'll be alerted when products are nearing expiry.
              </p>
            </div>
          )}

          <div className="flex gap-4 pt-6">
            <Button
              type="submit"
              disabled={loading}
              className="flex-1 bg-[#FED141] hover:bg-[#F1B424] text-[#303A4D] rounded-full py-6 font-bold text-lg disabled:opacity-50"
            >
              {loading ? "Creating..." : "Add Product"}
            </Button>
            <Link href="/admin/products" className="flex-1">
              <Button
                type="button"
                className="w-full bg-white hover:bg-[#F4F2E6] text-[#303A4D] rounded-full py-6 font-bold text-lg border-2 border-[#303A4D]"
              >
                Cancel
              </Button>
            </Link>
          </div>
        </div>
      </form>
      </>
      )}

      {/* Image Library Modal */}
      {showImageLibrary && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-8 max-w-4xl w-full max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-[#303A4D]">Choose from Image Library</h2>
              <button
                onClick={() => setShowImageLibrary(false)}
                className="p-2 hover:bg-[#F4F2E6] rounded-full transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="grid grid-cols-3 md:grid-cols-4 gap-4">
              {systemImages.map((img) => (
                <button
                  key={img.id}
                  type="button"
                  onClick={() => selectSystemImage(img.image_url)}
                  className="relative group aspect-square rounded-lg overflow-hidden hover:ring-4 hover:ring-[#FED141] transition-all"
                >
                  <img src={img.image_url} alt={img.title} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="text-white font-bold">Select</span>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white text-xs p-2">
                    {img.title}
                  </div>
                </button>
              ))}
            </div>
            
            {systemImages.length === 0 && (
              <div className="text-center py-12">
                <ImageIcon className="w-16 h-16 text-[#303A4D]/20 mx-auto mb-4" />
                <p className="text-[#303A4D]/60">No system images available yet.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Category Creation Modal */}
      {showCategoryModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full">
            <h2 className="text-2xl font-bold text-[#303A4D] mb-6">Create New Category</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-[#303A4D] font-bold mb-2">Parent Category (Optional)</label>
                <select
                  value={newCategory.parent_id}
                  onChange={(e) => setNewCategory({ ...newCategory, parent_id: e.target.value })}
                  className="w-full bg-[#F4F2E6] rounded-2xl px-4 py-3 text-[#303A4D] focus:outline-none focus:ring-2 focus:ring-[#FED141]"
                >
                  <option value="">None (Main Category)</option>
                  {categories.filter(c => !c.parent_id).map(category => (
                    <option key={category.id} value={category.id}>{category.name}</option>
                  ))}
                </select>
                <p className="text-xs text-[#303A4D]/60 mt-1">
                  Select a parent to create a subcategory (e.g., "Vegetables" under "Groceries")
                </p>
              </div>

              <div>
                <label className="block text-[#303A4D] font-bold mb-2">Category Name</label>
                <input
                  type="text"
                  value={newCategory.name}
                  onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                  className="w-full bg-[#F4F2E6] rounded-2xl px-4 py-3 text-[#303A4D] focus:outline-none focus:ring-2 focus:ring-[#FED141]"
                  placeholder="e.g., Fruits, Vegetables, Grains"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-[#303A4D] font-bold mb-2">Description (Optional)</label>
                <textarea
                  value={newCategory.description}
                  onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
                  className="w-full bg-[#F4F2E6] rounded-2xl px-4 py-3 text-[#303A4D] focus:outline-none focus:ring-2 focus:ring-[#FED141] min-h-24"
                  placeholder="Describe this category..."
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  onClick={handleCreateCategory}
                  className="flex-1 bg-[#FED141] hover:bg-[#F1B424] text-[#303A4D] rounded-full py-3 font-bold"
                >
                  Create Category
                </Button>
                <Button
                  type="button"
                  onClick={() => {
                    setShowCategoryModal(false)
                    setNewCategory({ name: "", description: "", parent_id: "" })
                  }}
                  className="flex-1 bg-white hover:bg-[#F4F2E6] text-[#303A4D] rounded-full py-3 font-bold border-2 border-[#303A4D]"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
