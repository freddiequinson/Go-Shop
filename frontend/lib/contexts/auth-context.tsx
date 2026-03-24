"use client"

/**
 * Authentication Context
 * Manages user authentication state across the application
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { authService } from '@/lib/api/services'
import type { UserResponse, UserLogin, UserCreate } from '@/lib/types'
import { handleApiError } from '@/lib/api/client'
import { useRouter } from 'next/navigation'

interface AuthContextType {
  user: UserResponse | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (credentials: UserLogin) => Promise<void>
  register: (data: UserCreate) => Promise<void>
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [hasInitialized, setHasInitialized] = useState(false)
  const router = useRouter()

  // Check if user is authenticated on mount (deferred to not block page load)
  useEffect(() => {
    // Prevent multiple initializations
    if (hasInitialized) return
    setHasInitialized(true)
    
    const initAuth = async () => {
      try {
        if (authService.isAuthenticated()) {
          // Try to get stored user first (instant, no API call)
          const storedUser = authService.getStoredUser()
          if (storedUser) {
            setUser(storedUser)
            setIsLoading(false) // Set loading false immediately with cached data
          } else {
            // Token exists but no stored user - fetch immediately
            try {
              const currentUser = await authService.getCurrentUser()
              setUser(currentUser)
            } catch (error) {
              console.error('Failed to fetch user:', error)
            }
            setIsLoading(false)
          }
          
          // Then fetch fresh user data in background (deferred) - only if we had cached data
          if (storedUser) {
            setTimeout(async () => {
              try {
                const currentUser = await authService.getCurrentUser()
                setUser(currentUser)
              } catch (error) {
                console.error('Background auth refresh error:', error)
              }
            }, 1500) // Wait 1.5 seconds to not block page load
          }
        } else {
          setIsLoading(false)
        }
      } catch (error) {
        console.error('Auth initialization error:', error)
        // Clear invalid token
        localStorage.removeItem('access_token')
        localStorage.removeItem('user')
        setIsLoading(false)
      }
    }

    initAuth()
  }, [hasInitialized])

  const login = async (credentials: UserLogin) => {
    try {
      setIsLoading(true)
      const loginResponse = await authService.login(credentials)
      const currentUser = await authService.getCurrentUser()
      setUser(currentUser)
      
      // Use redirect_to from backend if available, otherwise fallback to user type
      let redirectPath = '/'
      if (loginResponse.redirect_to) {
        redirectPath = loginResponse.redirect_to
      } else {
        // User type is now uppercase (ADMIN, SUPPLIER, SELLER, BUYER, RIDER)
        const userType = currentUser.user_type?.toUpperCase()
        if (userType === 'ADMIN') {
          redirectPath = '/admin'
        } else if (userType === 'SUPPLIER') {
          redirectPath = '/supplier/dashboard'
        } else if (userType === 'SELLER') {
          redirectPath = '/seller/dashboard'
        } else if (userType === 'RIDER') {
          redirectPath = '/rider'
        } else {
          redirectPath = '/shop'
        }
      }
      
      router.push(redirectPath)
    } catch (error) {
      const errorMessage = handleApiError(error)
      throw new Error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const register = async (data: UserCreate) => {
    try {
      setIsLoading(true)
      const newUser = await authService.register(data)
      
      // Auto-login after registration
      await login({ email: data.email, password: data.password })
    } catch (error) {
      const errorMessage = handleApiError(error)
      throw new Error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const logout = async () => {
    try {
      setIsLoading(true)
      await authService.logout()
      setUser(null)
      router.push('/login')
    } catch (error) {
      console.error('Logout error:', error)
      // Clear state even if API call fails
      setUser(null)
      router.push('/login')
    } finally {
      setIsLoading(false)
    }
  }

  const refreshUser = async () => {
    try {
      // First, try to get stored user from localStorage (instant)
      const storedUser = authService.getStoredUser()
      if (storedUser && !user) {
        setUser(storedUser)
        setIsLoading(false)
      }
      
      // Then fetch fresh user data from API
      const currentUser = await authService.getCurrentUser()
      setUser(currentUser)
      setIsLoading(false)
    } catch (error) {
      console.error('Refresh user error:', error)
      // If API fails but we have stored user, still use it
      const storedUser = authService.getStoredUser()
      if (storedUser) {
        setUser(storedUser)
        setIsLoading(false)
      }
    }
  }

  // isAuthenticated should be true if we have a user OR if we have a token in localStorage
  // This prevents race conditions where the user state hasn't loaded yet but the token exists
  const isAuthenticated = !!user || authService.isAuthenticated()

  const value: AuthContextType = {
    user,
    isAuthenticated,
    isLoading,
    login,
    register,
    logout,
    refreshUser,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
