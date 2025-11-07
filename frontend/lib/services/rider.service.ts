import { apiClient } from '../api/client'

export const riderService = {
  getAll: async (params?: any) => {
    const response = await apiClient.get('/admin/riders', { params })
    return response.data
  },

  getById: async (id: string) => {
    const response = await apiClient.get(`/admin/riders/${id}`)
    return response.data
  },

  create: async (data: any) => {
    const response = await apiClient.post('/admin/riders', data)
    return response.data
  },

  update: async (id: string, data: any) => {
    const response = await apiClient.put(`/admin/riders/${id}`, data)
    return response.data
  },

  delete: async (id: string) => {
    await apiClient.delete(`/admin/riders/${id}`)
  },

  verify: async (id: string) => {
    const response = await apiClient.post(`/admin/riders/${id}/verify`)
    return response.data
  },

  updateStatus: async (id: string, status: string) => {
    const response = await apiClient.put(`/admin/riders/${id}/status`, { current_status: status })
    return response.data
  },

  getPerformance: async (id: string) => {
    const response = await apiClient.get(`/admin/riders/${id}/performance`)
    return response.data
  },

  getDeliveries: async (id: string, params?: any) => {
    const response = await apiClient.get(`/admin/riders/${id}/deliveries`, { params })
    return response.data
  },

  getAvailable: async (coverageArea?: string) => {
    const response = await apiClient.get('/admin/riders/available', { 
      params: { coverage_area: coverageArea } 
    })
    return response.data
  },

  search: async (query: string) => {
    const response = await apiClient.get('/admin/riders/search', { params: { q: query } })
    return response.data
  },

  getTop: async (limit: number = 10) => {
    const response = await apiClient.get('/admin/riders/top', { params: { limit } })
    return response.data
  },

  // Deliveries
  createDelivery: async (data: any) => {
    const response = await apiClient.post('/admin/riders/deliveries', data)
    return response.data
  },

  getDeliveryById: async (id: string) => {
    const response = await apiClient.get(`/admin/riders/deliveries/${id}`)
    return response.data
  },

  updateDelivery: async (id: string, data: any) => {
    const response = await apiClient.put(`/admin/riders/deliveries/${id}`, data)
    return response.data
  },

  updateDeliveryStatus: async (id: string, status: string, notes?: string) => {
    const response = await apiClient.put(`/admin/riders/deliveries/${id}/status`, {
      status,
      notes
    })
    return response.data
  },

  getActiveDeliveries: async (limit: number = 50) => {
    const response = await apiClient.get('/admin/riders/deliveries/active', { params: { limit } })
    return response.data
  },

  // Location
  updateLocation: async (id: string, data: any) => {
    const response = await apiClient.post(`/admin/riders/${id}/location`, data)
    return response.data
  },

  getLocation: async (id: string) => {
    const response = await apiClient.get(`/admin/riders/${id}/location`)
    return response.data
  },

  getLocationHistory: async (id: string, hours: number = 24) => {
    const response = await apiClient.get(`/admin/riders/${id}/location/history`, {
      params: { hours }
    })
    return response.data
  }
}
