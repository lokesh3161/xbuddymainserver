/**
 * registryRepository.js
 * Comprehensive interface for Master Registry communication:
 * customer registration, signups, license validation, provisioning, heartbeats, and rollups.
 */

const adapter = require('./adapters/GoogleSheetsAdapter')
const path = require('path')
const fs = require('fs')

const BASE_DIR = process.pkg
  ? path.dirname(process.execPath)
  : path.dirname(path.resolve(__filename))

function getMasterGasUrl() {
  const candidates = [
    path.join(BASE_DIR, 'config', 'shop-config.json'),
    path.join(BASE_DIR, 'shop-config.json'),
    path.join(process.cwd(), 'config', 'shop-config.json'),
    path.join(process.cwd(), 'shop-config.json'),
  ]
  const p = candidates.find(candidate => fs.existsSync(candidate))
  if (!p) return ''
  try {
    return JSON.parse(fs.readFileSync(p, 'utf8')).masterGasUrl || ''
  } catch (err) {
    return ''
  }
}

class RegistryRepository {
  /**
   * Register a new customer signup (Pending Setup)
   */
  async registerCustomer(customerData, masterGasUrl) {
    const url = masterGasUrl || getMasterGasUrl()
    return await adapter.registerCustomerRemote(url, customerData)
  }

  /**
   * Fetch all signups awaiting provisioning (Pending Setup)
   */
  async getPendingSignups(masterGasUrl) {
    const url = masterGasUrl || getMasterGasUrl()
    return await adapter.getPendingSignupsRemote(url)
  }

  /**
   * Validate Shop ID & License Key against Master Registry
   */
  async validateLicense(shopId, licenseKey, masterGasUrl) {
    const url = masterGasUrl || getMasterGasUrl()
    return await adapter.validateLicenseRemote(url, shopId, licenseKey)
  }

  /**
   * Provision a new shop record in Master Registry
   */
  async provisionShop(shopData, masterGasUrl) {
    const url = masterGasUrl || getMasterGasUrl()
    return await adapter.provisionShopRemote(url, shopData)
  }

  /**
   * Get all registered shops
   */
  async listShops(masterGasUrl) {
    const url = masterGasUrl || getMasterGasUrl()
    return await adapter.getMasterShops(url)
  }

  /**
   * Update shop license status (Active, Suspended, Expired)
   */
  async updateShopStatus(shopId, status, masterGasUrl) {
    const url = masterGasUrl || getMasterGasUrl()
    return await adapter.updateShopStatusRemote(url, shopId, status)
  }

  /**
   * Post heartbeat ping to Master Registry
   */
  async postHeartbeat(shopId, printerStatus, currentVersion, pendingJobs, masterGasUrl) {
    const url = masterGasUrl || getMasterGasUrl()
    return await adapter.postHeartbeatRemote(url, shopId, printerStatus, currentVersion, pendingJobs)
  }

  /**
   * Post daily rollup summary to Master Registry
   */
  async postRollup(shopId, date, orderCount, totalRevenue, masterGasUrl) {
    const url = masterGasUrl || getMasterGasUrl()
    return await adapter.postRollupRemote(url, shopId, date, orderCount, totalRevenue)
  }

  /**
   * Fetch aggregate platform statistics from Master Registry
   */
  async getAggregateStats(masterGasUrl) {
    const url = masterGasUrl || getMasterGasUrl()
    return await adapter.getAggregateStatsRemote(url)
  }
}

module.exports = new RegistryRepository()
