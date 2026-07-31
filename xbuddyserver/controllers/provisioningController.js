/**
 * provisioningController.js
 * Controller layer for founder shop provisioning requests.
 * Uses ProvisioningService abstraction.
 * Section 12 Clean Architecture.
 */

const manualProvisioningService = require('../services/ManualProvisioningService')
const { errorResponse }          = require('../utilities/responseFormatter')

class ProvisioningController {
  /**
   * Handle POST /api/provision-shop
   */
  async handleProvisionShop(req, res) {
    try {
      const {
        shopName,
        ownerName,
        phone,
        email,
        sheetId,
        gasUrl,
        plan,
        expiryDays,
        provisionedBy,
        masterGasUrl
      } = req.body || {}

      if (!shopName || !ownerName) {
        return res.status(400).json(errorResponse('Shop Name and Owner Name are required'))
      }

      const result = await manualProvisioningService.provisionShop({
        shopName,
        ownerName,
        phone,
        email,
        sheetId,
        gasUrl,
        plan,
        expiryDays,
        provisionedBy,
        masterGasUrl
      })

      if (result.success) {
        return res.status(200).json(result)
      }
      return res.status(400).json(result)
    } catch (err) {
      return res.status(500).json(errorResponse(`Server error: ${err.message}`))
    }
  }
}

module.exports = new ProvisioningController()
