import { apiClient } from '../client'

export const adminService = {
  // Get all orders with pagination and filters
  async getOrders(params?: {
    page?: number
    per_page?: number
    status_filter?: string
    payment_status_filter?: string
    search?: string
  }) {
    const response = await apiClient.get('/admin/orders', { params })
    return response.data
  },

  // Get order statistics
  async getOrderStats() {
    const response = await apiClient.get('/admin/orders/stats')
    return response.data
  },

  // Get single order details
  async getOrderDetails(orderId: string) {
    const response = await apiClient.get(`/admin/orders/${orderId}`)
    return response.data
  },

  // Update order status
  async updateOrderStatus(orderId: string, status: string) {
    const response = await apiClient.put(`/admin/orders/${orderId}/status`, { status })
    return response.data
  },

  // Approve order
  async approveOrder(orderId: string) {
    const response = await apiClient.post(`/admin/orders/${orderId}/approve`)
    return response.data
  },

  // Bulk approve orders
  async bulkApproveOrders(orderIds: string[]) {
    const response = await apiClient.post('/admin/orders/bulk-approve', orderIds)
    return response.data
  },

  // Get orders grouped by products
  async getOrdersByProducts(params?: {
    status_filter?: string
    date_from?: string
    date_to?: string
  }) {
    const response = await apiClient.get('/admin/orders/by-products', { params })
    return response.data
  },

  // Get orders grouped by delivery dates
  async getOrdersByDeliveryDate(params?: {
    status_filter?: string
    date_from?: string
    date_to?: string
  }) {
    const response = await apiClient.get('/admin/orders/by-delivery-date', { params })
    return response.data
  },

  // Dispatch single order
  async dispatchOrder(orderId: string) {
    const response = await apiClient.post(`/admin/orders/${orderId}/dispatch`)
    return response.data
  },

  // Bulk dispatch orders
  async bulkDispatchOrders(orderIds: string[]) {
    const response = await apiClient.post('/admin/orders/bulk-dispatch', orderIds)
    return response.data
  },

  // Cancel order
  async cancelOrder(orderId: string) {
    const response = await apiClient.delete(`/admin/orders/${orderId}`)
    return response.data
  },

  // Database cleanup operations
  async getDatabaseStats() {
    const response = await apiClient.get('/admin/cleanup/stats')
    return response.data
  },

  async previewCleanup(targets: string[]) {
    const response = await apiClient.post('/admin/cleanup/preview', { targets })
    return response.data
  },

  async executeCleanup(targets: string[], confirmationCode: string) {
    const response = await apiClient.post('/admin/cleanup/execute', {
      targets,
      confirmation_code: confirmationCode
    })
    return response.data
  }
}
