import { apiClient } from '../api/client'

export interface Supplier {
  id: string
  supplier_code: string
  name: string
  supplier_type: string
  verification_status: string
  rating: number
  total_supplies: number
  on_time_delivery_rate: number
  is_active: boolean
  phone: string
  email: string
  location: any
}

export interface SupplierCreate {
  name: string
  supplier_type: string
  contact_person: string
  phone: string
  email: string
  location: any
  payment_terms?: string
  notes?: string
}

export const supplierService = {
  getAll: async (params?: any) => {
    const response = await apiClient.get('/suppliers', { params })
    return response.data
  },

  getById: async (id: string) => {
    const response = await apiClient.get(`/suppliers/${id}`)
    return response.data
  },

  create: async (data: SupplierCreate) => {
    const response = await apiClient.post('/suppliers', data)
    return response.data
  },

  update: async (id: string, data: Partial<SupplierCreate>) => {
    const response = await apiClient.put(`/suppliers/${id}`, data)
    return response.data
  },

  delete: async (id: string) => {
    await apiClient.delete(`/suppliers/${id}`)
  },

  verify: async (id: string) => {
    const response = await apiClient.post(`/suppliers/${id}/verify`)
    return response.data
  },

  getPerformance: async (id: string) => {
    const response = await apiClient.get(`/suppliers/${id}/performance`)
    return response.data
  },

  search: async (query: string) => {
    const response = await apiClient.get('/suppliers/search', { params: { q: query } })
    return response.data
  },

  getTop: async (limit: number = 10) => {
    const response = await apiClient.get('/suppliers/top', { params: { limit } })
    return response.data
  }
}
