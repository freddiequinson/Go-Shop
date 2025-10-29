/**
 * Reviews Service
 * Handles review and rating operations
 */

import apiClient from '../client'
import { API_ENDPOINTS } from '../config'
import type {
  ReviewCreate,
  ReviewResponse,
  ReviewUpdate,
  ReviewListResponse,
  ProductRatingResponse,
  SellerRatingResponse,
} from '@/lib/types'

export const reviewsService = {
  /**
   * Create new review
   */
  async createReview(data: ReviewCreate): Promise<ReviewResponse> {
    const response = await apiClient.post<ReviewResponse>(API_ENDPOINTS.reviews.create, data)
    return response.data
  },

  /**
   * Get review by ID
   */
  async getReview(id: number): Promise<ReviewResponse> {
    const response = await apiClient.get<ReviewResponse>(API_ENDPOINTS.reviews.detail(id))
    return response.data
  },

  /**
   * Update review
   */
  async updateReview(id: number, data: ReviewUpdate): Promise<ReviewResponse> {
    const response = await apiClient.put<ReviewResponse>(API_ENDPOINTS.reviews.update(id), data)
    return response.data
  },

  /**
   * Delete review
   */
  async deleteReview(id: number): Promise<void> {
    await apiClient.delete(API_ENDPOINTS.reviews.delete(id))
  },

  /**
   * Get product reviews
   */
  async getProductReviews(
    productId: number,
    params?: { skip?: number; limit?: number }
  ): Promise<ReviewListResponse> {
    const response = await apiClient.get<ReviewListResponse>(API_ENDPOINTS.reviews.productReviews(productId), {
      params,
    })
    return response.data
  },

  /**
   * Get seller reviews
   */
  async getSellerReviews(sellerId: number, params?: { skip?: number; limit?: number }): Promise<ReviewListResponse> {
    const response = await apiClient.get<ReviewListResponse>(API_ENDPOINTS.reviews.sellerReviews(sellerId), { params })
    return response.data
  },

  /**
   * Get my reviews
   */
  async getMyReviews(params?: { skip?: number; limit?: number }): Promise<ReviewListResponse> {
    const response = await apiClient.get<ReviewListResponse>(API_ENDPOINTS.reviews.myReviews, { params })
    return response.data
  },

  /**
   * Create review response (seller only)
   */
  async createReviewResponse(reviewId: number, responseText: string): Promise<any> {
    const response = await apiClient.post(API_ENDPOINTS.reviews.createResponse(reviewId), {
      response_text: responseText,
    })
    return response.data
  },

  /**
   * Vote review helpfulness
   */
  async voteReview(reviewId: number, helpful: boolean): Promise<any> {
    const response = await apiClient.post(API_ENDPOINTS.reviews.vote(reviewId), {
      helpfulness: helpful ? 'helpful' : 'not_helpful',
    })
    return response.data
  },

  /**
   * Get product rating
   */
  async getProductRating(productId: number): Promise<ProductRatingResponse> {
    const response = await apiClient.get<ProductRatingResponse>(API_ENDPOINTS.reviews.productRating(productId))
    return response.data
  },

  /**
   * Get seller rating
   */
  async getSellerRating(sellerId: number): Promise<SellerRatingResponse> {
    const response = await apiClient.get<SellerRatingResponse>(API_ENDPOINTS.reviews.sellerRating(sellerId))
    return response.data
  },

  /**
   * Get review analytics
   */
  async getReviewAnalytics(): Promise<any> {
    const response = await apiClient.get(API_ENDPOINTS.reviews.analytics)
    return response.data
  },
}
