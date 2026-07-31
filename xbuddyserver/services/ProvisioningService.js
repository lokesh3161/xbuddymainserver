/**
 * ProvisioningService.js
 * Abstract interface for shop provisioning in XBuddy SaaS.
 * All provisioning workflows (Manual, Semi-Automated, Fully-Automated) implement this interface.
 */

class ProvisioningService {
  /**
   * Provision a new Xerox Shop
   * @param {object} provisioningParams 
   * @param {string} provisioningParams.shopName
   * @param {string} provisioningParams.ownerName
   * @param {string} provisioningParams.phone
   * @param {string} provisioningParams.email
   * @param {string} [provisioningParams.sheetId]
   * @param {string} [provisioningParams.gasUrl]
   * @param {string} [provisioningParams.plan]
   * @param {string} [provisioningParams.provisionedBy]
   * @returns {Promise<object>} Standard response envelope { success, data, error }
   */
  async provisionShop(provisioningParams) {
    throw new Error('ProvisioningService.provisionShop must be implemented by concrete subclass')
  }

  /**
   * Validate Shop ID & License Key
   * @param {string} shopId 
   * @param {string} licenseKey 
   * @returns {Promise<object>} Standard response envelope { success, data, error }
   */
  async validateLicense(shopId, licenseKey) {
    throw new Error('ProvisioningService.validateLicense must be implemented by concrete subclass')
  }
}

module.exports = ProvisioningService
