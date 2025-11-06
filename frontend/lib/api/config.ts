/**
 * API Configuration
 * Central configuration for API client
 */

// Determine base URL based on environment - must be a function to work at runtime
export const getBaseURL = (): string => {
  // If NEXT_PUBLIC_API_URL is set, use it
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL
  }
  
  // In browser, use same origin as the frontend (for production)
  if (typeof window !== 'undefined') {
    // Force HTTPS in production
    const origin = window.location.origin
    return origin.replace(/^http:/, 'https:')
  }
  
  // Fallback for local development
  return 'http://localhost:8000'
}

export const API_CONFIG = {
  get baseURL() {
    return getBaseURL()
  },
  apiVersion: '/api/v1',
  timeout: 30000, // 30 seconds
}

export const API_ENDPOINTS = {
  // Authentication
  auth: {
    register: '/auth/register',
    login: '/auth/login',
    logout: '/auth/logout',
    me: '/auth/me',
  },
  // Users
  users: {
    profile: '/users/profile',
  },
  // Addresses
  addresses: {
    list: '/user-addresses/',
    default: '/user-addresses/default',
    detail: (id: string) => `/user-addresses/${id}`,
    setDefault: (id: string) => `/user-addresses/${id}/set-default`,
  },
  // Products
  products: {
    list: '/products/',
    create: '/products/',
    search: '/products/search',
    myProducts: '/products/my-products',
    statistics: '/products/statistics',
    suggestions: '/products/suggestions',
    detail: (id: number) => `/products/${id}`,
    update: (id: number) => `/products/${id}`,
    delete: (id: number) => `/products/${id}`,
    categories: '/products/categories/',
    categoryDetail: (id: number) => `/products/categories/${id}`,
  },
  // Shopping Cart
  cart: {
    get: '/cart/',
    clear: '/cart/',
    summary: '/cart/summary',
    addItem: '/cart/items',
    updateItem: (productId: number) => `/cart/items/${productId}`,
    removeItem: (productId: number) => `/cart/items/${productId}`,
  },
  // Orders
  orders: {
    create: '/orders/',
    list: '/orders/',
    detail: (id: number) => `/orders/${id}`,
    updateStatus: (id: number) => `/orders/${id}/status`,
    stats: '/orders/stats/summary',
  },
  // Payments
  payments: {
    wallet: '/payments/wallet',
    transactions: '/payments/wallet/transactions',
    initialize: '/payments/initialize',
    verify: (reference: string) => `/payments/verify/${reference}`,
    credit: '/payments/wallet/credit',
    debit: '/payments/wallet/debit',
    stats: '/payments/stats',
    banks: '/payments/ghana/banks',
    fundWallet: '/payments/wallet/fund',
  },
  // Bubbles
  bubbles: {
    create: '/bubbles/',
    list: '/bubbles/',
    myBubbles: '/bubbles/my-bubbles',
    types: '/bubbles/types',
    stats: '/bubbles/stats',
    detail: (id: number) => `/bubbles/${id}`,
    update: (id: number) => `/bubbles/${id}`,
    delete: (id: number) => `/bubbles/${id}`,
    join: (id: number) => `/bubbles/${id}/join`,
    leave: (id: number) => `/bubbles/${id}/leave`,
    members: (id: number) => `/bubbles/${id}/members`,
    updateMemberRole: (bubbleId: number, userId: number) => `/bubbles/${bubbleId}/members/${userId}/role`,
    regions: '/bubbles/ghana/regions',
    popularLocations: '/bubbles/ghana/popular-locations',
    products: '/bubbles/ghana/products',
  },
  // Fund Transfers
  fundTransfers: {
    create: '/fund-transfers/',
    list: '/fund-transfers/',
    pendingApprovals: '/fund-transfers/pending-approvals',
    detail: (id: number) => `/fund-transfers/${id}`,
    approve: (id: number) => `/fund-transfers/${id}/approve`,
    cancel: (id: number) => `/fund-transfers/${id}/cancel`,
    bubbleTransfers: (bubbleId: number) => `/fund-transfers/bubble/${bubbleId}/transfers`,
    systemStats: '/fund-transfers/statistics/system',
    bubbleStats: (bubbleId: number) => `/fund-transfers/statistics/bubble/${bubbleId}`,
    transferTypes: '/fund-transfers/ghana/transfer-types',
    validate: '/fund-transfers/validate',
    userSummary: '/fund-transfers/summary/user',
  },
  // Messaging
  messages: {
    createConversation: '/messages/conversations',
    conversations: '/messages/conversations',
    conversationDetail: (id: number) => `/messages/conversations/${id}`,
    updateConversation: (id: number) => `/messages/conversations/${id}`,
    addParticipant: (id: number) => `/messages/conversations/${id}/participants`,
    removeParticipant: (conversationId: number, participantId: number) => 
      `/messages/conversations/${conversationId}/participants/${participantId}`,
    sendMessage: (id: number) => `/messages/conversations/${id}/messages`,
    getMessages: (id: number) => `/messages/conversations/${id}/messages`,
    markRead: (messageId: number) => `/messages/messages/${messageId}/read`,
    ghanaMarketMessage: (id: number) => `/messages/conversations/${id}/ghana-market-message`,
    bubbleMessage: (id: number) => `/messages/conversations/${id}/bubble-message`,
    unreadCount: '/messages/stats/unread-count',
    userStats: '/messages/stats/user',
    conversationStats: (id: number) => `/messages/conversations/${id}/stats`,
  },
  // Reviews
  reviews: {
    create: '/reviews/reviews',
    detail: (id: number) => `/reviews/reviews/${id}`,
    update: (id: number) => `/reviews/reviews/${id}`,
    delete: (id: number) => `/reviews/reviews/${id}`,
    productReviews: (productId: number) => `/reviews/products/${productId}/reviews`,
    sellerReviews: (sellerId: number) => `/reviews/sellers/${sellerId}/reviews`,
    myReviews: '/reviews/users/me/reviews',
    createResponse: (reviewId: number) => `/reviews/reviews/${reviewId}/responses`,
    vote: (reviewId: number) => `/reviews/reviews/${reviewId}/vote`,
    ghanaMarket: '/reviews/reviews/ghana-market',
    produce: '/reviews/reviews/produce',
    sellerRating: (sellerId: number) => `/reviews/sellers/${sellerId}/rating`,
    productRating: (productId: number) => `/reviews/products/${productId}/rating`,
    analytics: '/reviews/reviews/analytics',
    pendingReviews: '/reviews/admin/reviews/pending',
    approve: (reviewId: number) => `/reviews/admin/reviews/${reviewId}/approve`,
    reject: (reviewId: number) => `/reviews/admin/reviews/${reviewId}/reject`,
  },
} as const
