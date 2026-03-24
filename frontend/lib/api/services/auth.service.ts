/**
 * Authentication Service
 * Handles user authentication operations
 */

import apiClient from '../client'
import { API_ENDPOINTS } from '../config'
import type { UserCreate, UserLogin, Token, UserResponse } from '@/lib/types'

export const authService = {
  /**
   * Register a new user
   */
  async register(data: UserCreate): Promise<UserResponse> {
    const response = await apiClient.post<UserResponse>(API_ENDPOINTS.auth.register, data)
    return response.data
  },

  /**
   * Login user
   */
  async login(data: UserLogin): Promise<Token> {
    // FastAPI expects form data for OAuth2
    const formData = new URLSearchParams()
    formData.append('username', data.email)
    formData.append('password', data.password)

    const response = await apiClient.post<Token>(API_ENDPOINTS.auth.login, formData, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    })

    // Store token in localStorage and a JS-readable cookie for middleware route protection
    if (response.data.access_token) {
      localStorage.setItem('access_token', response.data.access_token)
      // Secure cookie for middleware to check (not httpOnly so JS can also clear it)
      const expires = new Date(Date.now() + 30 * 60 * 1000).toUTCString()
      document.cookie = `access_token=${response.data.access_token}; path=/; expires=${expires}; SameSite=Strict; Secure`
    }

    return response.data
  },

  /**
   * Logout user
   */
  async logout(): Promise<void> {
    try {
      await apiClient.post(API_ENDPOINTS.auth.logout)
    } finally {
      // Clear local storage and cookie regardless of API response
      localStorage.removeItem('access_token')
      localStorage.removeItem('user')
      document.cookie = 'access_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Strict; Secure'
    }
  },

  /**
   * Get current user profile
   */
  async getCurrentUser(): Promise<UserResponse> {
    const response = await apiClient.get<UserResponse>(API_ENDPOINTS.auth.me)
    
    // Store user in localStorage
    localStorage.setItem('user', JSON.stringify(response.data))
    
    return response.data
  },

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return !!localStorage.getItem('access_token')
  },

  /**
   * Get stored user from localStorage
   */
  getStoredUser(): UserResponse | null {
    const userStr = localStorage.getItem('user')
    if (userStr) {
      try {
        return JSON.parse(userStr)
      } catch {
        return null
      }
    }
    return null
  },

  /**
   * Get access token
   */
  getAccessToken(): string | null {
    return localStorage.getItem('access_token')
  },
}
