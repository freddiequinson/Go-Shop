/**
 * Fetch Helper
 * Centralized fetch wrapper that uses environment-aware API URL
 */

import { getBaseURL } from './config'

// Get API base URL from environment or fallback to localhost - runtime getter
const getApiBaseUrl = () => getBaseURL() + '/api/v1'

/**
 * Make an authenticated API request
 * @param endpoint - API endpoint (e.g., '/products' or '/products/123')
 * @param options - Fetch options (method, headers, body, etc.)
 * @returns Promise with the response
 */
export async function apiFetch(endpoint: string, options: RequestInit = {}) {
  // Ensure endpoint starts with /
  const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`
  
  // Get token from localStorage
  const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null
  
  // Build headers
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }
  
  // Add authorization header if token exists
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }
  
  // Merge with provided headers
  if (options.headers) {
    Object.assign(headers, options.headers)
  }
  
  // Make the request
  const response = await fetch(`${getApiBaseUrl()}${path}`, {
    ...options,
    headers,
  })
  
  return response
}

/**
 * Get the full API URL for a given endpoint
 * @param endpoint - API endpoint
 * @returns Full URL
 */
export function getApiUrl(endpoint: string): string {
  const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`
  return `${getApiBaseUrl()}${path}`
}

export const API_BASE_URL = getApiBaseUrl()
