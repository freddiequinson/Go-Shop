/**
 * Products Service
 * Handles product-related operations
 */

import apiClient from '../client'
import { API_ENDPOINTS } from '../config'
import type {
  ProductCreate,
  ProductResponse,
  ProductUpdate,
  ProductListResponse,
  CategoryCreate,
  CategoryResponse,
  CategoryUpdate,
} from '@/lib/types'

export const productsService = {
  /**
   * Get list of products
   */
  async getProducts(params?: {
    skip?: number
    limit?: number
    category_id?: number
    seller_id?: number
    ghana_region?: string
    is_organic?: boolean
  }): Promise<ProductListResponse> {
    const response = await apiClient.get<ProductListResponse>(API_ENDPOINTS.products.list, { params })
    return response.data
  },

  /**
   * Search products
   */
  async searchProducts(params: {
    query?: string
    category_id?: number
    min_price?: number
    max_price?: number
    ghana_region?: string
    is_organic?: boolean
    skip?: number
    limit?: number
  }): Promise<ProductListResponse> {
    const response = await apiClient.get<ProductListResponse>(API_ENDPOINTS.products.search, { params })
    return response.data
  },

  /**
   * Get product by ID
   */
  async getProduct(id: number): Promise<ProductResponse> {
    const response = await apiClient.get<ProductResponse>(API_ENDPOINTS.products.detail(id))
    return response.data
  },

  /**
   * Create new product (seller only)
   */
  async createProduct(data: ProductCreate): Promise<ProductResponse> {
    const response = await apiClient.post<ProductResponse>(API_ENDPOINTS.products.create, data)
    return response.data
  },

  /**
   * Update product (seller only)
   */
  async updateProduct(id: number, data: ProductUpdate): Promise<ProductResponse> {
    const response = await apiClient.put<ProductResponse>(API_ENDPOINTS.products.update(id), data)
    return response.data
  },

  /**
   * Delete product (seller only)
   */
  async deleteProduct(id: number): Promise<void> {
    await apiClient.delete(API_ENDPOINTS.products.delete(id))
  },

  /**
   * Get my products (seller only)
   */
  async getMyProducts(params?: { skip?: number; limit?: number }): Promise<ProductListResponse> {
    const response = await apiClient.get<ProductListResponse>(API_ENDPOINTS.products.myProducts, { params })
    return response.data
  },

  /**
   * Get product statistics
   */
  async getProductStatistics(): Promise<any> {
    const response = await apiClient.get(API_ENDPOINTS.products.statistics)
    return response.data
  },

  /**
   * Get Ghana product suggestions
   */
  async getGhanaSuggestions(): Promise<any> {
    const response = await apiClient.get(API_ENDPOINTS.products.suggestions)
    return response.data
  },

  // ============= CATEGORIES =============

  /**
   * Get all categories
   */
  async getCategories(): Promise<CategoryResponse[]> {
    const response = await apiClient.get<CategoryResponse[]>(API_ENDPOINTS.products.categories)
    return response.data
  },

  /**
   * Get category by ID
   */
  async getCategory(id: number): Promise<CategoryResponse> {
    const response = await apiClient.get<CategoryResponse>(API_ENDPOINTS.products.categoryDetail(id))
    return response.data
  },

  /**
   * Create category (admin only)
   */
  async createCategory(data: CategoryCreate): Promise<CategoryResponse> {
    const response = await apiClient.post<CategoryResponse>(API_ENDPOINTS.products.categories, data)
    return response.data
  },

  /**
   * Update category (admin only)
   */
  async updateCategory(id: number, data: CategoryUpdate): Promise<CategoryResponse> {
    const response = await apiClient.put<CategoryResponse>(API_ENDPOINTS.products.categoryDetail(id), data)
    return response.data
  },

  /**
   * Delete category (admin only)
   */
  async deleteCategory(id: number): Promise<void> {
    await apiClient.delete(API_ENDPOINTS.products.categoryDetail(id))
  },
}
