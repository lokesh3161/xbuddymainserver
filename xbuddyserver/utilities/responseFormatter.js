/**
 * responseFormatter.js
 * Standardized JSON envelope formatter for all XBuddy API responses.
 * Section 7 & 12 Compliant.
 */

/**
 * Format a successful API response
 * @param {any} data 
 * @returns {object} { success: true, data: data, error: null }
 */
function successResponse(data = {}) {
  return {
    success: true,
    data: data,
    error: null
  }
}

/**
 * Format an error API response
 * @param {string} errorMessage 
 * @param {any} [data=null] 
 * @returns {object} { success: false, data: data, error: errorMessage }
 */
function errorResponse(errorMessage = 'An error occurred', data = null) {
  return {
    success: false,
    data: data,
    error: String(errorMessage)
  }
}

module.exports = {
  successResponse,
  errorResponse
}
