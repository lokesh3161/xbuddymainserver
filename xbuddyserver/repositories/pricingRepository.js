/**
 * pricingRepository.js
 * Interface for fetching and updating per-shop print pricing rules.
 */

const path = require('path')
const fs = require('fs')

const BASE_DIR = process.pkg
  ? path.dirname(process.execPath)
  : path.dirname(path.resolve(__filename))

function getPricingConfigPath() {
  const configDir = path.join(BASE_DIR, 'config')
  if (!fs.existsSync(configDir)) {
    try { fs.mkdirSync(configDir, { recursive: true }) } catch (e) {}
  }
  return path.join(configDir, 'pricing.json')
}

class PricingRepository {
  /**
   * Get shop pricing details
   */
  async getPricing() {
    const pPath = getPricingConfigPath()
    if (fs.existsSync(pPath)) {
      try {
        return JSON.parse(fs.readFileSync(pPath, 'utf8'))
      } catch (e) {}
    }

    return {
      bwPrice: 2.00,
      colorPrice: 10.00,
      a3Extra: 5.00,
      gst: 0,
      currency: 'INR'
    }
  }

  /**
   * Update shop pricing details
   */
  async updatePricing(pricingData) {
    const pPath = getPricingConfigPath()
    try {
      fs.writeFileSync(pPath, JSON.stringify(pricingData, null, 2), 'utf8')
      return { success: true, pricing: pricingData }
    } catch (err) {
      return { success: false, error: err.message }
    }
  }
}

module.exports = new PricingRepository()
