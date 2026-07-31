const { google } = require('googleapis')
const path = require('path')
const fs = require('fs')
const axios = require('axios')
const logger = require('../../utils/logger')
const { getCredentialsPath } = require('../../utils/credentialPath')

const BASE_DIR = process.pkg
  ? path.dirname(process.execPath)
  : path.dirname(path.resolve(__filename))

let _credsMissing = false

function getShopConfig() {
  const candidates = [
    path.join(BASE_DIR, 'config', 'shop-config.json'),
    path.join(BASE_DIR, 'shop-config.json'),
    path.join(process.cwd(), 'config', 'shop-config.json'),
    path.join(process.cwd(), 'shop-config.json'),
  ]
  const p = candidates.find(candidate => fs.existsSync(candidate))
  if (!p) return {}
  try {
    return JSON.parse(fs.readFileSync(p, 'utf8'))
  } catch (err) {
    return {}
  }
}

class GoogleSheetsAdapter {
  constructor() {
    this.COL = {
      ORDER_ID:       0,
      NAME:           1,
      PHONE:          2,
      EMAIL:          3,
      FILE_NAME:      4,
      DRIVE_FILE_ID:  5,
      DRIVE_URL:      6,
      TOTAL_PAGES:    7,
      SELECTED_PAGES: 8,
      COPIES:         9,
      PRINT_TYPE:     10,
      PAPER_SIZE:     11,
      DOUBLE_SIDE:    12,
      PRICE_PER_PAGE: 13,
      AMOUNT:         14,
      PAYMENT_METHOD: 15,
      TRANSACTION_ID: 16,
      PAYMENT_STATUS: 17,
      PRINT_STATUS:   18,
      ASSIGNED_PRINTER: 19,
      ORDER_SOURCE:   20,
      CREATED_TIME:   21,
      STARTED_PRINTING: 22,
      COMPLETED_TIME: 23,
      REMARKS:        24,
    }
  }

  // --- ORDER OPERATIONS ---

  async createOrder(orderData) {
    const config = getShopConfig()
    const gasUrl = config.gasUrl
    if (!gasUrl) return { success: false, error: 'No gasUrl configured' }

    try {
      const res = await axios.post(`${gasUrl}?action=createOrder`, orderData, { timeout: 10000 })
      return res.data
    } catch (err) {
      logger.error(`[GoogleSheetsAdapter] createOrder error: ${err.message}`)
      return { success: false, error: err.message }
    }
  }

  async fetchOrder(orderId) {
    const config = getShopConfig()
    const gasUrl = config.gasUrl
    if (!gasUrl) return null

    try {
      const res = await axios.get(`${gasUrl}?action=getOrder&orderId=${encodeURIComponent(orderId)}`, { timeout: 8000 })
      if (res.data && res.data.success) {
        return res.data.data?.order || res.data.order || null
      }
    } catch (err) {
      logger.error(`[GoogleSheetsAdapter] fetchOrder error: ${err.message}`)
    }
    return null
  }

  async fetchWaitingOrders() {
    const orders = await this.fetchAllOrders()
    return orders.filter(o => o.printStatus === 'Waiting')
  }

  async fetchAllOrders() {
    const config = getShopConfig()
    const gasUrl = config.gasUrl

    if (gasUrl) {
      try {
        const res = await axios.get(`${gasUrl}?action=getAllOrders`, { timeout: 10000 })
        if (res.data && res.data.success) {
          const list = res.data.data?.orders || res.data.orders || []
          return list
        }
      } catch (err) {
        logger.error(`[GoogleSheetsAdapter] GAS fetchAllOrders error: ${err.message}`)
      }
    }

    return []
  }

  async updatePrintStatus(orderId, printStatus, releaseStatus) {
    const config = getShopConfig()
    const gasUrl = config.gasUrl
    if (!gasUrl) return false

    try {
      const params = new URLSearchParams({
        action: 'updatePrintStatus',
        orderId,
        printStatus: printStatus || '',
        releaseStatus: releaseStatus || '',
      })
      const res = await axios.get(`${gasUrl}?${params.toString()}`, { timeout: 8000 })
      return res.data?.success || false
    } catch (err) {
      logger.error(`[GoogleSheetsAdapter] updatePrintStatus error: ${err.message}`)
      return false
    }
  }

  async updatePaymentStatus(orderId, paymentStatus) {
    const config = getShopConfig()
    const gasUrl = config.gasUrl
    if (!gasUrl) return false

    try {
      const params = new URLSearchParams({
        action: 'updatePaymentStatus',
        orderId,
        paymentStatus,
      })
      const res = await axios.get(`${gasUrl}?${params.toString()}`, { timeout: 8000 })
      return res.data?.success || false
    } catch (err) {
      logger.error(`[GoogleSheetsAdapter] updatePaymentStatus error: ${err.message}`)
      return false
    }
  }

  async cancelOrder(orderId, remarks) {
    const config = getShopConfig()
    const gasUrl = config.gasUrl
    if (!gasUrl) return false

    try {
      const params = new URLSearchParams({
        action: 'cancelOrder',
        orderId,
        remarks: remarks || '',
      })
      const res = await axios.get(`${gasUrl}?${params.toString()}`, { timeout: 8000 })
      return res.data?.success || false
    } catch (err) {
      logger.error(`[GoogleSheetsAdapter] cancelOrder error: ${err.message}`)
      return false
    }
  }

  // --- MASTER REGISTRY REMOTE OPERATIONS ---

  async registerCustomerRemote(masterGasUrl, customerData) {
    if (!masterGasUrl) return { success: false, error: 'No Master GAS URL configured' }
    try {
      const params = new URLSearchParams({
        action: 'registerCustomer',
        ...customerData,
      })
      const res = await axios.get(`${masterGasUrl}?${params.toString()}`, { timeout: 10000 })
      return res.data
    } catch (err) {
      logger.error(`[GoogleSheetsAdapter] registerCustomerRemote error: ${err.message}`)
      return { success: false, error: err.message }
    }
  }

  async getPendingSignupsRemote(masterGasUrl) {
    if (!masterGasUrl) return []
    try {
      const res = await axios.get(`${masterGasUrl}?action=getPendingSignups`, { timeout: 8000 })
      if (res.data && res.data.success) {
        return res.data.data?.signups || res.data.signups || []
      }
    } catch (err) {
      logger.error(`[GoogleSheetsAdapter] getPendingSignupsRemote error: ${err.message}`)
    }
    return []
  }

  async validateLicenseRemote(masterGasUrl, shopId, licenseKey) {
    if (!masterGasUrl) return { success: false, valid: false, error: 'No Master GAS URL configured' }
    try {
      const params = new URLSearchParams({
        action: 'validateLicense',
        shopId: shopId || '',
        licenseKey: licenseKey || '',
      })
      const res = await axios.get(`${masterGasUrl}?${params.toString()}`, { timeout: 8000 })
      return res.data
    } catch (err) {
      logger.error(`[GoogleSheetsAdapter] validateLicenseRemote error: ${err.message}`)
      return { success: false, valid: false, error: err.message }
    }
  }

  async getMasterShops(masterGasUrl) {
    if (!masterGasUrl) return []
    try {
      const res = await axios.get(`${masterGasUrl}?action=listShops`, { timeout: 8000 })
      if (res.data && res.data.success) {
        return res.data.data?.shops || res.data.shops || []
      }
    } catch (err) {
      logger.error(`[GoogleSheetsAdapter] getMasterShops error: ${err.message}`)
    }
    return []
  }

  async updateShopStatusRemote(masterGasUrl, shopId, status) {
    if (!masterGasUrl) return false
    try {
      const params = new URLSearchParams({
        action: 'updateShopStatus',
        shopId,
        status,
      })
      const res = await axios.get(`${masterGasUrl}?${params.toString()}`, { timeout: 8000 })
      return res.data?.success || false
    } catch (err) {
      logger.error(`[GoogleSheetsAdapter] updateShopStatusRemote error: ${err.message}`)
      return false
    }
  }

  async provisionShopRemote(masterGasUrl, shopData) {
    if (!masterGasUrl) return { success: false, error: 'No Master GAS URL' }
    try {
      const params = new URLSearchParams({
        action: 'provisionShop',
        ...shopData,
      })
      const res = await axios.get(`${masterGasUrl}?${params.toString()}`, { timeout: 10000 })
      return res.data
    } catch (err) {
      logger.error(`[GoogleSheetsAdapter] provisionShopRemote error: ${err.message}`)
      return { success: false, error: err.message }
    }
  }

  async createShopRemote(masterGasUrl, shopData) {
    return this.provisionShopRemote(masterGasUrl, shopData)
  }

  async postHeartbeatRemote(masterGasUrl, shopId, printerStatus, currentVersion, pendingJobs) {
    if (!masterGasUrl || !shopId) return false
    try {
      const params = new URLSearchParams({
        action: 'postHeartbeat',
        shopId,
        printerStatus: printerStatus || 'online',
        currentVersion: currentVersion || '1.0.0',
        pendingJobs: String(pendingJobs || 0)
      })
      const res = await axios.get(`${masterGasUrl}?${params.toString()}`, { timeout: 6000 })
      return res.data?.success || false
    } catch (err) {
      return false
    }
  }

  async postRollupRemote(masterGasUrl, shopId, date, orderCount, totalRevenue) {
    if (!masterGasUrl || !shopId) return false
    try {
      const params = new URLSearchParams({
        action: 'postRollup',
        shopId,
        date,
        orderCount: String(orderCount),
        totalRevenue: String(totalRevenue),
      })
      const res = await axios.get(`${masterGasUrl}?${params.toString()}`, { timeout: 8000 })
      return res.data?.success || false
    } catch (err) {
      return false
    }
  }

  async getAggregateStatsRemote(masterGasUrl) {
    if (!masterGasUrl) return null
    try {
      const res = await axios.get(`${masterGasUrl}?action=getAggregateStats`, { timeout: 8000 })
      if (res.data && res.data.success) {
        return res.data.data || res.data
      }
    } catch (err) {
      return null
    }
    return null
  }
}

module.exports = new GoogleSheetsAdapter()
