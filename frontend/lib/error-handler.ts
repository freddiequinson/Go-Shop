/**
 * Utility functions for handling API errors
 */

/**
 * Extracts a user-friendly error message from API response
 * Handles both string errors and Pydantic validation error arrays
 */
export function getErrorMessage(error: any, fallback: string = "An error occurred"): string {
  if (!error) return fallback

  // Check if error has detail property
  if (error.detail) {
    // Handle array of validation errors (Pydantic)
    if (Array.isArray(error.detail)) {
      return error.detail
        .map((err: any) => {
          const field = err.loc ? err.loc.slice(1).join(" > ") : "field"
          return `${field}: ${err.msg}`
        })
        .join(", ")
    }
    
    // Handle string error message
    if (typeof error.detail === "string") {
      return error.detail
    }
  }

  // Handle error message property
  if (error.message && typeof error.message === "string") {
    return error.message
  }

  return fallback
}

/**
 * Formats validation errors for display
 */
export function formatValidationErrors(errors: any[]): string {
  return errors
    .map((err) => {
      const field = err.loc ? err.loc.slice(1).join(" > ") : "field"
      const message = err.msg || "Invalid value"
      return `${field}: ${message}`
    })
    .join("\n")
}
