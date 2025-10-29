import { apiClient } from '../api/client'

export const imageLibraryService = {
  upload: async (data: any) => {
    const response = await apiClient.post('/admin/images', data)
    return response.data
  },

  bulkUpload: async (images: any[]) => {
    const response = await apiClient.post('/admin/images/bulk', { images })
    return response.data
  },

  getAll: async (params?: any) => {
    const response = await apiClient.get('/admin/images', { params })
    return response.data
  },

  getById: async (id: string) => {
    const response = await apiClient.get(`/admin/images/${id}`)
    return response.data
  },

  update: async (id: string, data: any) => {
    const response = await apiClient.put(`/admin/images/${id}`, data)
    return response.data
  },

  delete: async (id: string) => {
    await apiClient.delete(`/admin/images/${id}`)
  },

  getByCategory: async (categoryId: string, limit: number = 50) => {
    const response = await apiClient.get(`/admin/images/category/${categoryId}`, {
      params: { limit }
    })
    return response.data
  },

  searchByTags: async (tags: string[], limit: number = 50) => {
    const response = await apiClient.get('/admin/images/search/tags', {
      params: { tags, limit }
    })
    return response.data
  }
}
