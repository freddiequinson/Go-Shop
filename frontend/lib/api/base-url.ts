/**
 * API Base URL
 * Single source of truth for API URL across the application
 */

export const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000') + '/api/v1'
