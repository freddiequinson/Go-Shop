/**
 * Supplier Helper Utilities
 * Functions to format and display supplier data
 */

// Supplier Category Labels Mapping
export const SupplierCategoryLabels: Record<string, string> = {
  fruits: "Fruits",
  vegetables: "Vegetables",
  meat: "Meat & Livestock",
  poultry: "Poultry",
  seafood: "Seafood",
  dairy: "Dairy Products",
  grains: "Grains & Cereals",
  beverages: "Beverages",
  packaged_goods: "Packaged Goods",
  spices: "Spices & Herbs",
  bakery: "Bakery Items",
  frozen_foods: "Frozen Foods",
  snacks: "Snacks",
  condiments: "Condiments & Sauces",
  oil_fats: "Oils & Fats",
  other: "Other"
}

// Supplier Category Colors (for badges)
export const SupplierCategoryColors: Record<string, string> = {
  fruits: "bg-green-100 text-green-700 border-green-200",
  vegetables: "bg-emerald-100 text-emerald-700 border-emerald-200",
  meat: "bg-red-100 text-red-700 border-red-200",
  poultry: "bg-orange-100 text-orange-700 border-orange-200",
  seafood: "bg-blue-100 text-blue-700 border-blue-200",
  dairy: "bg-yellow-100 text-yellow-700 border-yellow-200",
  grains: "bg-amber-100 text-amber-700 border-amber-200",
  beverages: "bg-cyan-100 text-cyan-700 border-cyan-200",
  packaged_goods: "bg-purple-100 text-purple-700 border-purple-200",
  spices: "bg-rose-100 text-rose-700 border-rose-200",
  bakery: "bg-pink-100 text-pink-700 border-pink-200",
  frozen_foods: "bg-indigo-100 text-indigo-700 border-indigo-200",
  snacks: "bg-lime-100 text-lime-700 border-lime-200",
  condiments: "bg-teal-100 text-teal-700 border-teal-200",
  oil_fats: "bg-yellow-100 text-yellow-800 border-yellow-200",
  other: "bg-gray-100 text-gray-700 border-gray-200"
}

/**
 * Format specialization array to readable names
 * @param categories - Array of category codes (e.g., ["fruits", "vegetables"])
 * @returns Array of readable category names
 */
export const formatSpecialization = (categories: string[] | null | undefined): string[] => {
  if (!categories || !Array.isArray(categories)) {
    return []
  }
  
  return categories.map(cat => SupplierCategoryLabels[cat] || cat)
}

/**
 * Get color class for a category badge
 * @param category - Category code
 * @returns Tailwind CSS classes for badge styling
 */
export const getCategoryColor = (category: string): string => {
  return SupplierCategoryColors[category] || SupplierCategoryColors.other
}

/**
 * Format supplier type to readable name
 */
export const SupplierTypeLabels: Record<string, string> = {
  farmer: "Farmer",
  wholesaler: "Wholesaler",
  distributor: "Distributor",
  manufacturer: "Manufacturer"
}

export const formatSupplierType = (type: string): string => {
  return SupplierTypeLabels[type] || type
}

/**
 * Format supplier status to readable name
 */
export const SupplierStatusLabels: Record<string, string> = {
  pending: "Pending Verification",
  verified: "Verified",
  active: "Active",
  rejected: "Rejected",
  suspended: "Suspended"
}

export const formatSupplierStatus = (status: string): string => {
  return SupplierStatusLabels[status] || status
}

/**
 * Get status badge color
 */
export const getStatusColor = (status: string): string => {
  const colors: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-700 border-yellow-200",
    verified: "bg-green-100 text-green-700 border-green-200",
    active: "bg-green-100 text-green-700 border-green-200",
    rejected: "bg-red-100 text-red-700 border-red-200",
    suspended: "bg-gray-100 text-gray-700 border-gray-200"
  }
  return colors[status] || colors.pending
}
