/**
 * registryRepository.js
 * Interface for founder Master Registry operations: heartbeat, revenue rollups, aggregate stats.
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
   * Post heartbeat ping to Master Registry
   */
  async postHeartbeat(shopId, printerStatus, masterGasUrl) {
    const url = masterGasUrl || getMasterGasUrl()
    return await adapter.postHeartbeatRemote(url, shopId, printerStatus)
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
