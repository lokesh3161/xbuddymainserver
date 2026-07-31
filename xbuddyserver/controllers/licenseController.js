/**
 * licenseController.js
 * Controller layer for license validation HTTP endpoints.
 * Enforces generic anti-enumeration error responses and input validation.
 * Section 7 & 12 Clean Architecture.
 */

const manualProvisioningService = require('../services/ManualProvisioningService')
const { errorResponse }          = require('../utilities/responseFormatter')

class LicenseController {
  /**
   * Handle GET / POST /api/validate-license
   */
  async handleValidateLicense(req, res) {
    try {
      const p = req.method === 'POST' ? (req.body || {}) : (req.query || {})
      const shopId = (p.shopId || p.shop_id || '').trim()
      const licenseKey = (p.licenseKey || p.license_key || '').trim()
      const masterGasUrl = p.masterGasUrl || ''

      const genericError = "Invalid Shop ID or License Key"

      if (!shopId || !licenseKey) {
        return res.status(400).json(errorResponse(genericError))
      }

      const result = await manualProvisioningService.validateLicense(shopId, licenseKey, masterGasUrl)

      if (result.success && result.valid !== false) {
        return res.status(200).json(result)
      }

      // Return anti-enumeration generic error
      return res.status(400).json(errorResponse(result.error || genericError))
    } catch (err) {
      return res.status(500).json(errorResponse("Invalid Shop ID or License Key"))
    }
  }
}

module.exports = new LicenseController()
