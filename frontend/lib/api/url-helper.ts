/**
 * URL Helper
 * Provides runtime API URL construction
 */

import { getBaseURL } from './config'

/**
 * Get the full API URL with /api/v1 prefix
 * This is evaluated at runtime to ensure HTTPS in production
 */
export const getApiBaseUrl = (): string => {
  return getBaseURL() + '/api/v1'
}

/**
 * Build a full API endpoint URL
 * @param endpoint - The endpoint path (e.g., '/products' or 'products')
 */
export const buildApiUrl = (endpoint: string): string => {
  const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`
  return getApiBaseUrl() + path
}
