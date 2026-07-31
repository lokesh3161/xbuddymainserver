/**
 * ManualProvisioningService.js
 * Concrete implementation of ProvisioningService (Option A: Founder Manual / Semi-Automated Provisioning).
 * Handles collision-safe Shop ID generation, License Key generation, and Master Registry enrollment.
 */

const ProvisioningService = require('./ProvisioningService')
const registryRepository  = require('../repositories/registryRepository')
const { generateSequentialShopId, generateUniqueLicenseKey } = require('../utilities/idGenerator')
const { successResponse, errorResponse } = require('../utilities/responseFormatter')

class ManualProvisioningService extends ProvisioningService {
  /**
   * Provisions a shop manually/semi-automatically for founder workflow
   * @param {object} params 
   */
  async provisionShop(params) {
    try {
      const {
        shopName,
        ownerName,
        phone,
        email,
        sheetId,
        gasUrl,
        plan = 'Standard',
        expiryDays = 30,
        provisionedBy = 'Founder Admin',
        masterGasUrl
      } = params

      if (!shopName || !ownerName) {
        return errorResponse('Shop Name and Owner Name are required for provisioning.')
      }

      // 1. Fetch existing shops to ensure collision-safe Shop ID & License Key
      const existingShops = await registryRepository.listShops(masterGasUrl)
      const existingShopIds = existingShops.map(s => s.shopId)
      const existingLicenseKeys = existingShops.map(s => s.licenseKey)

      // 2. Generate collision-safe sequential Shop ID (SHOP0001, SHOP0002...)
      const shopId = params.shopId || generateSequentialShopId(existingShopIds)

      // 3. Generate cryptographically random unique License Key
      const licenseKey = params.licenseKey || generateUniqueLicenseKey(existingLicenseKeys)

      // 4. Register shop in Master Registry
      const res = await registryRepository.provisionShop({
        shopId,
        licenseKey,
        shopName,
        ownerName,
        phone,
        email,
        sheetId: sheetId || '',
        gasUrl: gasUrl || '',
        plan,
        status: 'Active',
        expiryDays,
        provisionedBy
      }, masterGasUrl)

      if (res && res.success) {
        return successResponse({
          shopId,
          licenseKey,
          shopName,
          ownerName,
          email,
          phone,
          sheetId: sheetId || '',
          gasUrl: gasUrl || '',
          plan,
          status: 'Active',
          provisionedBy,
          provisionedDate: new Date().toISOString()
        })
      }

      return errorResponse(res?.error || 'Failed to record provisioned shop in Master Registry.')
    } catch (err) {
      return errorResponse(`Provisioning failed: ${err.message}`)
    }
  }

  /**
   * Validate Shop ID & License Key against Master Registry
   */
  async validateLicense(shopId, licenseKey, masterGasUrl) {
    try {
      const res = await registryRepository.validateLicense(shopId, licenseKey, masterGasUrl)
      if (res && res.success) {
        return res
      }
      return errorResponse(res?.error || 'Invalid Shop ID or License Key')
    } catch (err) {
      return errorResponse(`Validation failed: ${err.message}`)
    }
  }
}

module.exports = new ManualProvisioningService()
