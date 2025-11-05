import { apiClient } from '../api/client'

export const ridersService = {
  // Get current rider profile
  getMyProfile: () => apiClient.get('/riders/me'),
  
  // Get rider stats
  getMyStats: () => apiClient.get('/riders/my-stats'),
  
  // Get my deliveries
  getMyDeliveries: (status?: string) => 
    apiClient.get(`/riders/my-deliveries${status ? `?status=${status}` : ''}`),
  
  // Update profile
  updateProfile: (data: any) => apiClient.put('/riders/me', data),
  
  // Accept delivery
  acceptDelivery: (orderId: string) => 
    apiClient.post(`/riders/deliveries/${orderId}/accept`),
  
  // Start delivery
  startDelivery: (orderId: string) => 
    apiClient.post(`/riders/deliveries/${orderId}/start`),
  
  // Complete delivery
  completeDelivery: (orderId: string, otpCode: string) => 
    apiClient.post(`/riders/deliveries/${orderId}/complete`, { otp_code: otpCode }),
  
  // Update location
  updateLocation: (lat: number, lng: number, orderId?: string, accuracy?: number) => 
    apiClient.post('/riders/location', { 
      latitude: lat, 
      longitude: lng,
      order_id: orderId,
      accuracy: accuracy
    }),
  
  // Get delivery map data
  getDeliveryMap: () => apiClient.get('/riders/delivery-map')
}
