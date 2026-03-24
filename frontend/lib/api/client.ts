/**
 * API Client
 * Axios instance with authentication and error handling
 */

import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios'
import { API_CONFIG } from './config'

// Create axios instance
const apiClient: AxiosInstance = axios.create({
  baseURL: `${API_CONFIG.baseURL}${API_CONFIG.apiVersion}`,
  timeout: API_CONFIG.timeout,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor - Add auth token to requests
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Get token from localStorage
    const token = localStorage.getItem('access_token')
    
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`
    }
    
    return config
  },
  (error: AxiosError) => {
    return Promise.reject(error)
  }
)

// Response interceptor - Handle errors globally
apiClient.interceptors.response.use(
  (response) => {
    return response
  },
  (error: AxiosError) => {
    // Handle 401 Unauthorized - Token expired or invalid
    if (error.response?.status === 401) {
      // Clear token and redirect to login
      localStorage.removeItem('access_token')
      localStorage.removeItem('user')
      
      // Only redirect if not already on login page
      if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
        window.location.href = '/login'
      }
    }
    
    // Handle 403 Forbidden
    if (error.response?.status === 403) {
      console.error('Access forbidden')
    }
    
    // Handle 404 Not Found
    if (error.response?.status === 404) {
      console.error('Resource not found')
    }
    
    // Handle 500 Server Error
    if (error.response?.status === 500) {
      console.error('Server error')
    }
    
    return Promise.reject(error)
  }
)

export default apiClient

// Helper function to handle API errors
export const handleApiError = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<{ detail: string | { msg: string }[] }>
    
    // Handle validation errors (422)
    if (axiosError.response?.status === 422 && Array.isArray(axiosError.response.data.detail)) {
      const messages = axiosError.response.data.detail.map((err) => err.msg).join(', ')
      return messages
    }
    
    // Handle other errors with detail message
    if (axiosError.response?.data?.detail) {
      if (typeof axiosError.response.data.detail === 'string') {
        return axiosError.response.data.detail
      }
    }
    
    // Handle network errors
    if (axiosError.message === 'Network Error') {
      return 'Network error. Please check your connection and try again.'
    }
    
    // Default error message
    return axiosError.message || 'An unexpected error occurred'
  }
  
  return 'An unexpected error occurred'
}

export { apiClient }
