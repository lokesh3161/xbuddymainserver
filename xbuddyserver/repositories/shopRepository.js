/**
 * shopRepository.js
 * Interface for reading and updating shop metadata and local configuration.
 */

const adapter = require('./adapters/GoogleSheetsAdapter')
const path = require('path')
const fs = require('fs')

const BASE_DIR = process.pkg
  ? path.dirname(process.execPath)
  : path.dirname(path.resolve(__filename))

function getLocalConfigPath() {
  const candidates = [
    path.join(BASE_DIR, 'config', 'shop-config.json'),
    path.join(BASE_DIR, 'shop-config.json'),
    path.join(process.cwd(), 'config', 'shop-config.json'),
    path.join(process.cwd(), 'shop-config.json'),
  ]
  return candidates.find(p => fs.existsSync(p)) || path.join(BASE_DIR, 'config', 'shop-config.json')
}

class ShopRepository {
  /**
   * Get local shop configuration
   */
  getLocalShop() {
    const configPath = getLocalConfigPath()
    if (!fs.existsSync(configPath)) return null
    try {
      return JSON.parse(fs.readFileSync(configPath, 'utf8'))
    } catch (err) {
      return null
    }
  }

  /**
   * Save local shop configuration
   */
  saveLocalShop(configData) {
    const configPath = getLocalConfigPath()
    try {
      fs.writeFileSync(configPath, JSON.stringify(configData, null, 2), 'utf8')
      return true
    } catch (err) {
      return false
    }
  }

  /**
   * Get shop info from Master Registry
   */
  async getShop(shopId, masterGasUrl) {
    if (!masterGasUrl) {
      const config = this.getLocalShop()
      masterGasUrl = config?.masterGasUrl
    }
    const shops = await adapter.getMasterShops(masterGasUrl)
    return shops.find(s => s.shopId === shopId) || null
  }

  /**
   * Get all registered shops from Master Registry
   */
  async getAllShops(masterGasUrl) {
    if (!masterGasUrl) {
      const config = this.getLocalShop()
      masterGasUrl = config?.masterGasUrl
    }
    return await adapter.getMasterShops(masterGasUrl)
  }

  /**
   * Update shop status in Master Registry
   */
  async updateStatus(shopId, status, masterGasUrl) {
    if (!masterGasUrl) {
      const config = this.getLocalShop()
      masterGasUrl = config?.masterGasUrl
    }
    return await adapter.updateShopStatusRemote(masterGasUrl, shopId, status)
  }

  /**
   * Create a new shop in Master Registry
   */
  async createShop(shopData, masterGasUrl) {
    if (!masterGasUrl) {
      const config = this.getLocalShop()
      masterGasUrl = config?.masterGasUrl
    }
    return await adapter.createShopRemote(masterGasUrl, shopData)
  }

  /**
   * Post heartbeat ping to Master Registry
   */
  async postHeartbeat(shopId, printerStatus, currentVersion, pendingJobs, masterGasUrl) {
    if (!masterGasUrl) {
      const config = this.getLocalShop()
      masterGasUrl = config?.masterGasUrl
    }
    return await adapter.postHeartbeatRemote(masterGasUrl, shopId, printerStatus, currentVersion, pendingJobs)
  }

  /**
   * Post daily summary rollup
   */
  async postRollup(shopId, date, orderCount, totalRevenue, masterGasUrl) {
    if (!masterGasUrl) {
      const config = this.getLocalShop()
      masterGasUrl = config?.masterGasUrl
    }
    return await adapter.postRollupRemote(masterGasUrl, shopId, date, orderCount, totalRevenue)
  }
}

module.exports = new ShopRepository()
