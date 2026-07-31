/**
 * idGenerator.js
 * Collision-safe Shop ID & License Key generation utilities using Node.js crypto module.
 */

const crypto = require('crypto')

/**
 * Generate a sequential Shop ID from max existing ID
 * @param {Array<string>} existingShopIds 
 * @returns {string} e.g. "SHOP0001", "SHOP0002"
 */
function generateSequentialShopId(existingShopIds = []) {
  let maxNum = 0
  existingShopIds.forEach(idStr => {
    if (!idStr) return
    const match = String(idStr).match(/SHOP(\d+)/i) || String(idStr).match(/XB-(\d+)/i)
    if (match && match[1]) {
      const num = parseInt(match[1], 10)
      if (!isNaN(num) && num > maxNum) {
        maxNum = num
      }
    }
  })

  const nextNum = maxNum + 1
  return `SHOP${String(nextNum).padStart(4, '0')}`
}

/**
 * Generate a cryptographically random license key segment
 */
function randomSegment(length = 4) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  const bytes = crypto.randomBytes(length)
  let result = ''
  for (let i = 0; i < length; i++) {
    result += chars[bytes[i] % chars.length]
  }
  return result
}

/**
 * Generate a candidate license key: XB-XXXX-XXXX-XXXX
 */
function generateLicenseKeyCandidate() {
  return `XB-${randomSegment(4)}-${randomSegment(4)}-${randomSegment(4)}`
}

/**
 * Generate a unique License Key against an existing keys set (retry-on-collision loop)
 * @param {Array<string>|Set<string>} existingKeys 
 * @returns {string}
 */
function generateUniqueLicenseKey(existingKeys = []) {
  const keysSet = existingKeys instanceof Set ? existingKeys : new Set(existingKeys.map(k => String(k).toUpperCase()))
  let attempts = 0
  while (attempts < 100) {
    const candidate = generateLicenseKeyCandidate()
    if (!keysSet.has(candidate.toUpperCase())) {
      return candidate
    }
    attempts++
  }
  // Fallback with timestamp suffix if 100 collisions occur
  return `XB-${randomSegment(4)}-${randomSegment(4)}-${Date.now().toString(36).slice(-4).toUpperCase()}`
}

module.exports = {
  generateSequentialShopId,
  generateLicenseKeyCandidate,
  generateUniqueLicenseKey
}
