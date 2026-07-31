const orderRepository = require('../repositories/orderRepository')
const logger = require('../utils/logger')

/**
 * Legacy interface delegate wrapper using orderRepository
 */
async function getWaitingOrders() {
  return await orderRepository.getWaitingOrders()
}

async function getAllOrders() {
  return await orderRepository.getOrders()
}

async function getOrderByIdForRelease(orderId) {
  const normalized = normalizeOrderId(orderId)
  const orders = await orderRepository.getOrders()
  const found = orders.find(o => normalizeOrderId(o.orderId) === normalized)
  if (found) {
    return {
      rowIndex:      found.rowIndex || 0,
      orderId:       found.orderId,
      name:          found.name,
      fileName:      found.fileName,
      copies:        found.copies,
      printType:     found.printType,
      printStatus:   found.printStatus,
      releaseStatus: found.releaseStatus || 'Waiting For Release',
    }
  }
  return null
}

function normalizeOrderId(orderId) {
  return String(orderId || '')
    .trim()
    .toUpperCase()
    .replace(/\s+/g, '')
}

async function getPdfUrlFromGas(orderId, fileName) {
  const { gasUrl } = require('../config')
  if (!gasUrl) return null
  try {
    const axios  = require('axios')
    const params = new URLSearchParams({
      action:   'assemblePdf',
      fileId:   orderId,
      fileName: orderId + '_' + fileName,
      mimeType: 'application/pdf',
    })
    const res  = await axios.get(`${gasUrl}?${params.toString()}`)
    const data = res.data
    if (data.success && data.fileUrl) {
      logger.success(`Got PDF URL from GAS: ${data.fileUrl}`)
      return data.fileUrl
    }
  } catch (err) {
    logger.error(`Could not get PDF URL from GAS: ${err.message}`)
  }
  return null
}

module.exports = {
  getWaitingOrders,
  getPdfUrlFromGas,
  getOrderByIdForRelease,
  getAllOrders,
  normalizeOrderId
}
