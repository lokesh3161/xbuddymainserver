const adapter = require('./adapters/GoogleSheetsAdapter')
const path = require('path')
const fs = require('fs')
const logger = require('../utils/logger')

const BASE_DIR = process.pkg
  ? path.dirname(process.execPath)
  : path.dirname(path.resolve(__filename))

const GRACE_PERIOD_MS = 48 * 60 * 60 * 1000 // 48 Hours

function getCachePath() {
  const configDir = path.join(BASE_DIR, 'config')
  if (!fs.existsSync(configDir)) {
    try { fs.mkdirSync(configDir, { recursive: true }) } catch (e) {}
  }
  return path.join(configDir, 'license-cache.json')
}

class LicenseRepository {
  /**
   * Reads local cached license state
   */
  getCachedLicense() {
    const cachePath = getCachePath()
    if (!fs.existsSync(cachePath)) return null
    try {
      return JSON.parse(fs.readFileSync(cachePath, 'utf8'))
    } catch (e) {
      return null
    }
  }

  /**
   * Save successful validation result to cache
   */
  saveCachedLicense(data) {
    const cachePath = getCachePath()
    try {
      const cacheObj = {
        shopId: data.shopId,
        status: data.status || 'active',
        expiryDate: data.expiryDate || '',
        timestamp: Date.now(),
      }
      fs.writeFileSync(cachePath, JSON.stringify(cacheObj, null, 2), 'utf8')
    } catch (err) {
      logger.error(`[LicenseRepository] Failed to save license cache: ${err.message}`)
    }
  }

  /**
   * Validates license against Master Registry with offline grace period fallback
   */
  async validateLicense(shopId, licenseKey, masterGasUrl) {
    if (!shopId || !licenseKey) {
      return { valid: false, status: 'invalid', message: 'Missing shop ID or license key' }
    }

    // Attempt remote validation
    const res = await adapter.validateLicenseRemote(masterGasUrl, shopId, licenseKey)

    if (res && res.success && res.valid !== undefined) {
      if (res.valid) {
        // Cache success
        this.saveCachedLicense({
          shopId,
          status: res.status,
          expiryDate: res.expiryDate,
        })
        return {
          valid: true,
          status: res.status,
          expiryDate: res.expiryDate,
          isGracePeriod: false,
        }
      } else {
        // Explicit invalid / expired / suspended response from Master Registry
        return {
          valid: false,
          status: res.status || 'invalid',
          message: res.message || 'License validation failed',
          isGracePeriod: false,
        }
      }
    }

    // Remote server/network error — fallback to cached grace period
    logger.warn('[LicenseRepository] Unable to reach Master Registry. Checking local cache...')
    const cached = this.getCachedLicense()
    if (cached && cached.shopId === shopId) {
      const elapsed = Date.now() - (cached.timestamp || 0)
      if (elapsed <= GRACE_PERIOD_MS) {
        logger.success(`[LicenseRepository] Valid license found in local grace period cache (${Math.round((GRACE_PERIOD_MS - elapsed) / 3600000)}h remaining)`)
        return {
          valid: true,
          status: cached.status || 'active',
          expiryDate: cached.expiryDate || '',
          isGracePeriod: true,
          graceTimeLeftHours: Math.round((GRACE_PERIOD_MS - elapsed) / 3600000),
        }
      } else {
        logger.error('[LicenseRepository] Local license grace period expired (over 48 hours offline)')
        return {
          valid: false,
          status: 'expired',
          message: 'Offline grace period expired. Please connect to internet to validate license.',
          isGracePeriod: false,
        }
      }
    }

    return {
      valid: false,
      status: 'unreachable',
      message: 'Could not validate license and no valid local cache found.',
      isGracePeriod: false,
    }
  }

  /**
   * Helper to format license keys
   */
  generateLicenseKeyFormat() {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
    const seg = (len) => Array.from({ length: len }, () => chars.charAt(Math.floor(Math.random() * chars.length))).join('')
    return `XB-${seg(4)}-${seg(4)}-${seg(4)}`
  }
}

module.exports = new LicenseRepository()
