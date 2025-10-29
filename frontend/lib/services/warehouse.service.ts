import { apiClient } from '../api/client'

export const warehouseService = {
  // Inventory
  getInventory: async (params?: any) => {
    const response = await apiClient.get('/warehouse/inventory', { params })
    return response.data
  },

  getInventoryByProduct: async (productId: string) => {
    const response = await apiClient.get(`/warehouse/inventory/${productId}`)
    return response.data
  },

  updateInventory: async (productId: string, data: any) => {
    const response = await apiClient.put(`/warehouse/inventory/${productId}`, data)
    return response.data
  },

  adjustInventory: async (data: any) => {
    const response = await apiClient.post('/warehouse/inventory/adjust', data)
    return response.data
  },

  performStockTake: async (data: any) => {
    const response = await apiClient.post('/warehouse/inventory/stock-take', data)
    return response.data
  },

  getLowStock: async (limit: number = 50) => {
    const response = await apiClient.get('/warehouse/low-stock', { params: { limit } })
    return response.data
  },

  getExpiring: async (limit: number = 50) => {
    const response = await apiClient.get('/warehouse/expiring', { params: { limit } })
    return response.data
  },

  // Movements
  getMovements: async (params?: any) => {
    const response = await apiClient.get('/warehouse/movements', { params })
    return response.data
  },

  createMovement: async (data: any) => {
    const response = await apiClient.post('/warehouse/movements', data)
    return response.data
  },

  // Alerts
  getAlerts: async (params?: any) => {
    const response = await apiClient.get('/warehouse/alerts', { params })
    return response.data
  },

  resolveAlert: async (alertId: string, notes?: string) => {
    const response = await apiClient.put(`/warehouse/alerts/${alertId}/resolve`, null, {
      params: { resolution_notes: notes }
    })
    return response.data
  },

  // Restock Orders
  getRestockOrders: async (params?: any) => {
    const response = await apiClient.get('/warehouse/restock', { params })
    return response.data
  },

  createRestockOrder: async (data: any) => {
    const response = await apiClient.post('/warehouse/restock', data)
    return response.data
  },

  updateRestockOrder: async (orderId: string, data: any) => {
    const response = await apiClient.put(`/warehouse/restock/${orderId}`, data)
    return response.data
  },

  receiveRestockOrder: async (orderId: string, quantityReceived: number) => {
    const response = await apiClient.post(`/warehouse/restock/${orderId}/receive`, null, {
      params: { quantity_received: quantityReceived }
    })
    return response.data
  },

  // Analytics
  getAnalytics: async () => {
    const response = await apiClient.get('/warehouse/analytics')
    return response.data
  }
}
