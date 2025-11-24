/**
 * Product Service
 * Handles product-related API calls
 */

import apiClient, { handleApiError } from '@/lib/api/client';
import type { Product, Category, PaginatedResponse } from '@/types';

class ProductService {
  /**
   * Get all products with pagination
   */
  async getProducts(params?: {
    page?: number;
    size?: number;
    category_id?: number;
    search?: string;
  }): Promise<PaginatedResponse<Product>> {
    try {
      const response = await apiClient.get<PaginatedResponse<Product>>('/products/', {
        params,
      });
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Get product by ID
   */
  async getProduct(id: number): Promise<Product> {
    try {
      const response = await apiClient.get<Product>(`/products/${id}`);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Search products
   */
  async searchProducts(query: string): Promise<Product[]> {
    try {
      const response = await apiClient.get<Product[]>('/products/search', {
        params: { q: query },
      });
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Get product categories
   */
  async getCategories(): Promise<Category[]> {
    try {
      const response = await apiClient.get<Category[]>('/products/categories/');
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Get category by ID
   */
  async getCategory(id: number): Promise<Category> {
    try {
      const response = await apiClient.get<Category>(`/products/categories/${id}`);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }
}

export default new ProductService();
