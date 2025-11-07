/**
 * Utility functions for user-friendly error messages
 */

/**
 * Convert technical error messages to user-friendly ones
 */
export function getUserFriendlyErrorMessage(error: any): string {
  // Handle axios errors
  if (error?.response?.data?.detail) {
    const detail = error.response.data.detail
    
    // String error messages
    if (typeof detail === 'string') {
      return formatErrorDetail(detail)
    }
    
    // Array of validation errors
    if (Array.isArray(detail)) {
      const messages = detail.map((e: any) => {
        if (e.msg) return formatValidationError(e.msg)
        if (e.message) return formatValidationError(e.message)
        return 'Invalid input'
      })
      return messages.join('. ')
    }
  }
  
  // Handle error messages
  if (error?.message) {
    return formatErrorDetail(error.message)
  }
  
  // Default fallback
  return "Something went wrong. Please try again."
}

/**
 * Format specific error details to be user-friendly
 */
function formatErrorDetail(detail: string): string {
  const lowerDetail = detail.toLowerCase()
  
  // Authentication errors
  if (lowerDetail.includes('unauthorized') || lowerDetail.includes('not authenticated')) {
    return "Please sign in to continue"
  }
  
  if (lowerDetail.includes('invalid credentials') || lowerDetail.includes('incorrect password')) {
    return "The email or password you entered is incorrect. Please try again."
  }
  
  if (lowerDetail.includes('user not found') || lowerDetail.includes('account not found')) {
    return "We couldn't find an account with that email address."
  }
  
  if (lowerDetail.includes('email already exists') || lowerDetail.includes('already registered')) {
    return "An account with this email already exists. Try signing in instead."
  }
  
  // Review errors
  if (lowerDetail.includes('already reviewed') || lowerDetail.includes('lack purchase history')) {
    return "You can only review products you've purchased. Please buy this product first to leave a review."
  }
  
  // Validation errors
  if (lowerDetail.includes('at least 10 characters')) {
    return "Your input is too short. Please write at least 10 characters."
  }
  
  if (lowerDetail.includes('required field') || lowerDetail.includes('field required')) {
    return "Please fill in all required fields."
  }
  
  if (lowerDetail.includes('invalid email')) {
    return "Please enter a valid email address."
  }
  
  if (lowerDetail.includes('password too short')) {
    return "Your password must be at least 6 characters long."
  }
  
  // Network errors
  if (lowerDetail.includes('network error') || lowerDetail.includes('failed to fetch')) {
    return "Unable to connect to the server. Please check your internet connection."
  }
  
  if (lowerDetail.includes('timeout')) {
    return "The request took too long. Please try again."
  }
  
  // Permission errors
  if (lowerDetail.includes('forbidden') || lowerDetail.includes('access denied')) {
    return "You don't have permission to perform this action."
  }
  
  // Not found errors
  if (lowerDetail.includes('not found')) {
    return "The requested item could not be found."
  }
  
  // Server errors
  if (lowerDetail.includes('internal server error') || lowerDetail.includes('500')) {
    return "Something went wrong on our end. Please try again later."
  }
  
  // Payment errors
  if (lowerDetail.includes('payment failed') || lowerDetail.includes('transaction failed')) {
    return "Your payment could not be processed. Please check your payment details and try again."
  }
  
  if (lowerDetail.includes('insufficient funds')) {
    return "You don't have enough funds to complete this transaction."
  }
  
  // Inventory errors
  if (lowerDetail.includes('out of stock') || lowerDetail.includes('insufficient quantity')) {
    return "Sorry, this item is currently out of stock or doesn't have enough quantity available."
  }
  
  // If no specific match, return the original message if it's reasonably short and clear
  if (detail.length < 100 && !detail.includes('Error:') && !detail.includes('Exception')) {
    return detail
  }
  
  // Default fallback
  return "Something went wrong. Please try again."
}

/**
 * Format validation error messages
 */
function formatValidationError(msg: string): string {
  const lowerMsg = msg.toLowerCase()
  
  if (lowerMsg.includes('at least 10 characters')) {
    return 'Must be at least 10 characters'
  }
  
  if (lowerMsg.includes('required')) {
    return 'This field is required'
  }
  
  if (lowerMsg.includes('invalid email')) {
    return 'Invalid email address'
  }
  
  if (lowerMsg.includes('invalid')) {
    return 'Invalid input'
  }
  
  return msg
}

/**
 * Get user-friendly title for error toasts
 */
export function getErrorTitle(error: any): string {
  if (error?.response?.status === 401) {
    return "Authentication Required"
  }
  
  if (error?.response?.status === 403) {
    return "Access Denied"
  }
  
  if (error?.response?.status === 404) {
    return "Not Found"
  }
  
  if (error?.response?.status === 422 || error?.response?.status === 400) {
    return "Invalid Input"
  }
  
  if (error?.response?.status >= 500) {
    return "Server Error"
  }
  
  return "Error"
}
