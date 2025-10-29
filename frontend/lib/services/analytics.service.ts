import { apiClient } from '../api/client'

export const analyticsService = {
  getDashboardStats: async () => {
    const response = await apiClient.get('/admin/dashboard')
    return response.data
  },

  getTopSelling: async (limit: number = 10, days: number = 30) => {
    const response = await apiClient.get('/admin/analytics/top-selling', {
      params: { limit, days }
    })
    return response.data
  },

  getMostViewed: async (limit: number = 10, days: number = 30) => {
    const response = await apiClient.get('/admin/analytics/most-viewed', {
      params: { limit, days }
    })
    return response.data
  },

  getCustomerAnalytics: async () => {
    const response = await apiClient.get('/admin/analytics/customers')
    return response.data
  },

  trackProductView: async (productId: string, data?: any) => {
    const response = await apiClient.post('/admin/analytics/track-view', null, {
      params: { product_id: productId, ...data }
    })
    return response.data
  },

  getActivityLogs: async (params?: any) => {
    const response = await apiClient.get('/admin/logs', { params })
    return response.data
  },

  exportActivityLogs: async (params?: any) => {
    const response = await apiClient.get('/admin/logs/export', { params })
    return response.data
  }
}
