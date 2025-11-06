"use client"

import { useState, useEffect } from "react"
import { Plus, Edit, Trash2, Package, LayoutGrid, List, ChevronDown, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"

interface Category {
  id: string
  name: string
  description: string
  parent_id?: string | null
  product_count?: number
  is_active: boolean
  subcategories?: Category[]
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [viewMode, setViewMode] = useState<'card' | 'table'>('card')
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    parent_id: "",
    is_active: true
  })

  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    try {
      const token = localStorage.getItem("access_token")
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'}/products/categories/`, {
        headers: { "Authorization": `Bearer ${token}` }
      })
      
      if (response.ok) {
        const data = await response.json()
        console.log("Categories data:", data)
        const organized = organizeCategories(Array.isArray(data) ? data : [])
        setCategories(organized)
      } else {
        console.error("Failed to fetch categories:", response.status, response.statusText)
      }
    } catch (error) {
      console.error("Failed to fetch categories:", error)
      setCategories([])
    } finally {
      setLoading(false)
    }
  }

  const organizeCategories = (cats: Category[]): Category[] => {
    const mainCategories = cats.filter(c => !c.parent_id)
    const subCategories = cats.filter(c => c.parent_id)
    
    return mainCategories.map(main => ({
      ...main,
      subcategories: subCategories.filter(sub => sub.parent_id === main.id)
    }))
  }

  const toggleExpand = (categoryId: string) => {
    const newExpanded = new Set(expandedCategories)
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId)
    } else {
      newExpanded.add(categoryId)
    }
    setExpandedCategories(newExpanded)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const token = localStorage.getItem("access_token")
      const url = editingCategory 
        ? `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'}/products/categories/${editingCategory.id}/`
        : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'}/products/categories/`
      
      const payload = {
        ...formData,
        parent_id: formData.parent_id || null
      }
      
      const response = await fetch(url, {
        method: editingCategory ? "PUT" : "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      })

      if (response.ok) {
        fetchCategories()
        setShowModal(false)
        setEditingCategory(null)
        setFormData({ name: "", description: "", parent_id: "", is_active: true })
      }
    } catch (error) {
      console.error("Failed to save category:", error)
    }
  }

  const handleEdit = (category: Category) => {
    setEditingCategory(category)
    setFormData({
      name: category.name,
      description: category.description,
      parent_id: category.parent_id || "",
      is_active: category.is_active
    })
    setShowModal(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this category?")) return

    try {
      const token = localStorage.getItem("access_token")
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'}/products/categories/${id}/`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      })

      if (response.ok) {
        fetchCategories()
      }
    } catch (error) {
      console.error("Failed to delete category:", error)
    }
  }

  const getMainCategories = () => categories.filter(c => !c.parent_id)

  if (loading) {
    return <div className="p-8 text-center">Loading...</div>
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold text-[#303A4D] mb-2">Product Categories</h1>
          <p className="text-[#303A4D]/70">Manage categories and subcategories</p>
        </div>
        <div className="flex gap-3">
          {/* View Toggle */}
          <div className="flex bg-white rounded-full p-1 shadow-sm">
            <button
              onClick={() => setViewMode('card')}
              className={`p-2 rounded-full transition-colors cursor-pointer ${
                viewMode === 'card' ? 'bg-[#FED141] text-[#303A4D]' : 'text-[#303A4D]/60 hover:text-[#303A4D]'
              }`}
            >
              <LayoutGrid className="w-5 h-5" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-2 rounded-full transition-colors cursor-pointer ${
                viewMode === 'table' ? 'bg-[#FED141] text-[#303A4D]' : 'text-[#303A4D]/60 hover:text-[#303A4D]'
              }`}
            >
              <List className="w-5 h-5" />
            </button>
          </div>
          
          <Button
            onClick={() => {
              setEditingCategory(null)
              setFormData({ name: "", description: "", parent_id: "", is_active: true })
              setShowModal(true)
            }}
            className="bg-[#FED141] hover:bg-[#F1B424] text-[#303A4D] rounded-full px-6 py-3 font-bold"
          >
            <Plus className="w-5 h-5 mr-2" />
            Add Category
          </Button>
        </div>
      </div>

      {/* Card View */}
      {viewMode === 'card' && (
        <div className="space-y-6">
          {categories.map((category) => (
            <div key={category.id} className="bg-white rounded-3xl p-6 shadow-sm border-2 border-[#303A4D]/10">
              {/* Main Category */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3 flex-1">
                  {category.subcategories && category.subcategories.length > 0 && (
                    <button
                      onClick={() => toggleExpand(category.id)}
                      className="p-1 hover:bg-[#F4F2E6] rounded-lg transition-colors cursor-pointer"
                    >
                      {expandedCategories.has(category.id) ? (
                        <ChevronDown className="w-5 h-5 text-[#303A4D]" />
                      ) : (
                        <ChevronRight className="w-5 h-5 text-[#303A4D]" />
                      )}
                    </button>
                  )}
                  <div className="bg-[#FED141] p-3 rounded-2xl">
                    <Package className="w-6 h-6 text-[#303A4D]" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-[#303A4D]">{category.name}</h3>
                    <p className="text-sm text-[#303A4D]/60">
                      {category.subcategories?.length || 0} subcategories • {category.product_count || 0} products
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                    category.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                  }`}>
                    {category.is_active ? 'Active' : 'Inactive'}
                  </span>
                  <button
                    onClick={() => handleEdit(category)}
                    className="p-2 bg-[#FED141]/20 hover:bg-[#FED141]/30 text-[#303A4D] rounded-lg transition-colors cursor-pointer"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(category.id)}
                    className="p-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              
              <p className="text-[#303A4D]/70 mb-4">{category.description}</p>

              {/* Subcategories */}
              {expandedCategories.has(category.id) && category.subcategories && category.subcategories.length > 0 && (
                <div className="mt-4 pl-12 space-y-3 border-l-2 border-[#FED141]">
                  {category.subcategories.map((sub) => (
                    <div key={sub.id} className="bg-[#F4F2E6] rounded-2xl p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="bg-white p-2 rounded-lg">
                          <Package className="w-4 h-4 text-[#303A4D]" />
                        </div>
                        <div>
                          <h4 className="font-bold text-[#303A4D]">{sub.name}</h4>
                          <p className="text-xs text-[#303A4D]/60">{sub.product_count || 0} products</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                          sub.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                        }`}>
                          {sub.is_active ? 'Active' : 'Inactive'}
                        </span>
                        <button
                          onClick={() => handleEdit(sub)}
                          className="p-1.5 bg-white hover:bg-[#FED141]/20 text-[#303A4D] rounded-lg transition-colors cursor-pointer"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(sub.id)}
                          className="p-1.5 bg-white hover:bg-red-100 text-red-600 rounded-lg transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Table View */}
      {viewMode === 'table' && (
        <div className="bg-white rounded-3xl shadow-sm overflow-hidden">
          <table className="w-full">
            <thead className="bg-[#F4F2E6]">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-bold text-[#303A4D]">Category</th>
                <th className="px-6 py-4 text-left text-sm font-bold text-[#303A4D]">Description</th>
                <th className="px-6 py-4 text-left text-sm font-bold text-[#303A4D]">Type</th>
                <th className="px-6 py-4 text-left text-sm font-bold text-[#303A4D]">Products</th>
                <th className="px-6 py-4 text-left text-sm font-bold text-[#303A4D]">Status</th>
                <th className="px-6 py-4 text-left text-sm font-bold text-[#303A4D]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#303A4D]/10">
              {categories.map((category) => (
                <>
                  {/* Main Category Row */}
                  <tr key={category.id} className="hover:bg-[#F4F2E6]/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {category.subcategories && category.subcategories.length > 0 && (
                          <button
                            onClick={() => toggleExpand(category.id)}
                            className="p-1 hover:bg-[#F4F2E6] rounded-lg cursor-pointer"
                          >
                            {expandedCategories.has(category.id) ? (
                              <ChevronDown className="w-4 h-4" />
                            ) : (
                              <ChevronRight className="w-4 h-4" />
                            )}
                          </button>
                        )}
                        <Package className="w-5 h-5 text-[#FED141]" />
                        <span className="font-bold text-[#303A4D]">{category.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-[#303A4D]/70">{category.description}</td>
                    <td className="px-6 py-4">
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-700">
                        Main
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-[#303A4D]">{category.product_count || 0}</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                        category.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                      }`}>
                        {category.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(category)}
                          className="p-2 bg-[#FED141]/20 hover:bg-[#FED141]/30 rounded-lg cursor-pointer"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(category.id)}
                          className="p-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                  
                  {/* Subcategory Rows */}
                  {expandedCategories.has(category.id) && category.subcategories?.map((sub) => (
                    <tr key={sub.id} className="hover:bg-[#F4F2E6]/50 transition-colors bg-[#F4F2E6]/30">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3 pl-12">
                          <Package className="w-4 h-4 text-[#303A4D]/60" />
                          <span className="font-medium text-[#303A4D]">{sub.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-[#303A4D]/70">{sub.description}</td>
                      <td className="px-6 py-4">
                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-700">
                          Sub
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-[#303A4D]">{sub.product_count || 0}</td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                          sub.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                        }`}>
                          {sub.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEdit(sub)}
                            className="p-2 bg-white hover:bg-[#FED141]/20 rounded-lg cursor-pointer"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(sub.id)}
                            className="p-2 bg-white hover:bg-red-100 text-red-600 rounded-lg cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {categories.length === 0 && (
        <div className="text-center py-12">
          <Package className="w-16 h-16 text-[#303A4D]/20 mx-auto mb-4" />
          <p className="text-[#303A4D]/60 text-lg">No categories yet. Create your first category!</p>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full">
            <h2 className="text-2xl font-bold text-[#303A4D] mb-6">
              {editingCategory ? 'Edit Category' : 'Add New Category'}
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-[#303A4D] font-bold mb-2">Parent Category (Optional)</label>
                <select
                  value={formData.parent_id}
                  onChange={(e) => setFormData({ ...formData, parent_id: e.target.value })}
                  className="w-full bg-[#F4F2E6] rounded-2xl px-4 py-3 text-[#303A4D] focus:outline-none focus:ring-2 focus:ring-[#FED141]"
                >
                  <option value="">None (Main Category)</option>
                  {getMainCategories().map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
                <p className="text-xs text-[#303A4D]/60 mt-1">
                  Leave empty to create a main category, or select a parent to create a subcategory
                </p>
              </div>

              <div>
                <label className="block text-[#303A4D] font-bold mb-2">Category Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-[#F4F2E6] rounded-2xl px-4 py-3 text-[#303A4D] focus:outline-none focus:ring-2 focus:ring-[#FED141]"
                  placeholder="e.g., Fruits, Vegetables"
                  required
                />
              </div>

              <div>
                <label className="block text-[#303A4D] font-bold mb-2">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full bg-[#F4F2E6] rounded-2xl px-4 py-3 text-[#303A4D] focus:outline-none focus:ring-2 focus:ring-[#FED141] min-h-24"
                  placeholder="Describe this category..."
                  required
                />
              </div>

              <div>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="w-5 h-5 rounded border-2 border-[#303A4D]"
                  />
                  <span className="text-[#303A4D] font-medium">Active</span>
                </label>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  type="submit"
                  className="flex-1 bg-[#FED141] hover:bg-[#F1B424] text-[#303A4D] rounded-full py-3 font-bold"
                >
                  {editingCategory ? 'Update' : 'Create'}
                </Button>
                <Button
                  type="button"
                  onClick={() => {
                    setShowModal(false)
                    setEditingCategory(null)
                  }}
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
