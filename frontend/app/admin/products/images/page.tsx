"use client"

import { useState, useEffect } from "react"
import { Upload, Search, X, Image as ImageIcon, Check } from "lucide-react"
import { Button } from "@/components/ui/button"

interface ImageLibraryItem {
  id: string
  image_url: string
  title: string
  tags: string[]
  category: string
  is_system_image: boolean
  created_at: string
}

export default function ImageLibraryPage() {
  const [images, setImages] = useState<ImageLibraryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [uploadData, setUploadData] = useState({
    title: "",
    category: "Fruits",
    tags: "",
    image_url: ""
  })

  useEffect(() => {
    fetchImages()
  }, [])

  const fetchImages = async () => {
    try {
      const token = localStorage.getItem("access_token")
      const response = await fetch(`${(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000') + '/api/v1'}/admin/image-library`, {
        headers: { "Authorization": `Bearer ${token}` }
      })
      
      if (response.ok) {
        const data = await response.json()
        setImages(Array.isArray(data) ? data : [])
      }
    } catch (error) {
      console.error("Failed to fetch images:", error)
      setImages([])
    } finally {
      setLoading(false)
    }
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onloadend = () => {
      setUploadData({ ...uploadData, image_url: reader.result as string })
    }
    reader.readAsDataURL(file)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const token = localStorage.getItem("access_token")
      const response = await fetch(`${(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000') + '/api/v1'}/admin/image-library`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          ...uploadData,
          tags: uploadData.tags.split(",").map(t => t.trim()),
          is_system_image: true
        })
      })

      if (response.ok) {
        fetchImages()
        setShowUploadModal(false)
        setUploadData({ title: "", category: "Fruits", tags: "", image_url: "" })
      }
    } catch (error) {
      console.error("Failed to upload image:", error)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this image?")) return

    try {
      const token = localStorage.getItem("access_token")
      const response = await fetch(`${(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000') + '/api/v1'}/admin/image-library/${id}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      })

      if (response.ok) {
        fetchImages()
      }
    } catch (error) {
      console.error("Failed to delete image:", error)
    }
  }

  const filteredImages = images.filter(img => {
    const matchesSearch = img.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         img.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesCategory = selectedCategory === "all" || img.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const categories = ["all", ...Array.from(new Set(images.map(img => img.category)))]

  if (loading) {
    return <div className="p-8 text-center">Loading...</div>
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold text-[#303A4D] mb-2">Image Library</h1>
          <p className="text-[#303A4D]/70">Manage product images for your store</p>
        </div>
        <Button
          onClick={() => setShowUploadModal(true)}
          className="bg-[#FED141] hover:bg-[#F1B424] text-[#303A4D] rounded-full px-6 py-3 font-bold"
        >
          <Upload className="w-5 h-5 mr-2" />
          Upload Image
        </Button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-3xl p-6 shadow-sm mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-[#303A4D]/40 w-5 h-5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search images by title or tags..."
              className="w-full bg-[#F4F2E6] rounded-2xl pl-12 pr-4 py-3 text-[#303A4D] focus:outline-none focus:ring-2 focus:ring-[#FED141]"
            />
          </div>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-[#F4F2E6] rounded-2xl px-4 py-3 text-[#303A4D] focus:outline-none focus:ring-2 focus:ring-[#FED141]"
          >
            {categories.map(cat => (
              <option key={cat} value={cat}>
                {cat === "all" ? "All Categories" : cat}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Image Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {filteredImages.map((image) => (
          <div key={image.id} className="group relative bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-shadow">
            <div className="aspect-square relative">
              <img 
                src={image.image_url} 
                alt={image.title}
                className="w-full h-full object-cover"
              />
              {image.is_system_image && (
                <div className="absolute top-2 left-2 bg-[#FED141] text-[#303A4D] px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                  <Check className="w-3 h-3" />
                  System
                </div>
              )}
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <button
                  onClick={() => handleDelete(image.id)}
                  className="bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="p-3">
              <h3 className="font-bold text-[#303A4D] text-sm truncate">{image.title}</h3>
              <p className="text-xs text-[#303A4D]/60">{image.category}</p>
              <div className="flex flex-wrap gap-1 mt-2">
                {image.tags.slice(0, 2).map((tag, idx) => (
                  <span key={idx} className="text-xs bg-[#FED141]/20 text-[#303A4D] px-2 py-1 rounded-full">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredImages.length === 0 && (
        <div className="text-center py-12">
          <ImageIcon className="w-16 h-16 text-[#303A4D]/20 mx-auto mb-4" />
          <p className="text-[#303A4D]/60 text-lg">No images found. Upload your first image!</p>
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold text-[#303A4D] mb-6">Upload New Image</h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-[#303A4D] font-bold mb-2">Image</label>
                <div className="border-2 border-dashed border-[#FED141] rounded-2xl p-8 text-center">
                  {uploadData.image_url ? (
                    <div className="relative">
                      <img src={uploadData.image_url} alt="Preview" className="w-full h-48 object-cover rounded-lg" />
                      <button
                        type="button"
                        onClick={() => setUploadData({ ...uploadData, image_url: "" })}
                        className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                        id="image-upload"
                      />
                      <label htmlFor="image-upload" className="cursor-pointer">
                        <Upload className="w-12 h-12 text-[#303A4D]/40 mx-auto mb-2" />
                        <p className="text-[#303A4D] font-medium">Click to upload</p>
                      </label>
                    </>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-[#303A4D] font-bold mb-2">Title</label>
                <input
                  type="text"
                  value={uploadData.title}
                  onChange={(e) => setUploadData({ ...uploadData, title: e.target.value })}
                  className="w-full bg-[#F4F2E6] rounded-2xl px-4 py-3 text-[#303A4D] focus:outline-none focus:ring-2 focus:ring-[#FED141]"
                  placeholder="e.g., Fresh Red Apples"
                  required
                />
              </div>

              <div>
                <label className="block text-[#303A4D] font-bold mb-2">Category</label>
                <select
                  value={uploadData.category}
                  onChange={(e) => setUploadData({ ...uploadData, category: e.target.value })}
                  className="w-full bg-[#F4F2E6] rounded-2xl px-4 py-3 text-[#303A4D] focus:outline-none focus:ring-2 focus:ring-[#FED141]"
                >
                  <option>Fruits</option>
                  <option>Vegetables</option>
                  <option>Grains</option>
                  <option>Dairy</option>
                  <option>Meat</option>
                  <option>Seafood</option>
                  <option>Beverages</option>
                  <option>Other</option>
                </select>
              </div>

              <div>
                <label className="block text-[#303A4D] font-bold mb-2">Tags (comma separated)</label>
                <input
                  type="text"
                  value={uploadData.tags}
                  onChange={(e) => setUploadData({ ...uploadData, tags: e.target.value })}
                  className="w-full bg-[#F4F2E6] rounded-2xl px-4 py-3 text-[#303A4D] focus:outline-none focus:ring-2 focus:ring-[#FED141]"
                  placeholder="e.g., fresh, organic, red"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  type="submit"
                  className="flex-1 bg-[#FED141] hover:bg-[#F1B424] text-[#303A4D] rounded-full py-3 font-bold"
                >
                  Upload
                </Button>
                <Button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="flex-1 bg-white hover:bg-[#F4F2E6] text-[#303A4D] rounded-full py-3 font-bold border-2 border-[#303A4D]"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
