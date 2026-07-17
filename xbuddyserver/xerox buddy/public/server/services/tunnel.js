const fs     = require('fs')
const path   = require('path')
const logger = require('../utils/logger')

const BASE_DIR   = path.dirname(process.pkg ? process.execPath : path.join(__dirname, '..'))
const TUNNEL_LOG = path.join(BASE_DIR, 'tunnel.log')

function getGasUrl() {
  try { return require('../config').gasUrl } catch { return null }
}

let currentTunnelUrl = null

async function publishToGas(url) {
  const gasUrl = getGasUrl()
  if (!gasUrl) return
  try {
    const axios = require('axios')
    await axios.get(`${gasUrl}?action=setTunnelUrl&url=${encodeURIComponent(url)}`, { timeout: 8000 })
    logger.success(`Tunnel URL published to GAS: ${url}`)
  } catch (err) {
    logger.warn(`Could not publish tunnel URL to GAS: ${err.message}`)
  }
}

async function watchForTunnelUrl(maxWaitMs = 120000) {
  const start = Date.now()

  return new Promise((resolve) => {
    const interval = setInterval(async () => {
      try {
        if (!fs.existsSync(TUNNEL_LOG)) return
        const content = fs.readFileSync(TUNNEL_LOG)
        const match = content.toString().match(/https:\/\/[a-z0-9-]+\.trycloudflare\.com/)
        if (match) {
          clearInterval(interval)
          currentTunnelUrl = match[0]
          logger.success(`Cloudflare tunnel active: ${currentTunnelUrl}`)
          await publishToGas(currentTunnelUrl)
          resolve(currentTunnelUrl)
          return
        }
      } catch {}

      if (Date.now() - start > maxWaitMs) {
        clearInterval(interval)
        logger.warn('No tunnel URL found — mobile orders may not work')
        resolve(null)
      }
    }, 2000)
  })
}

function getTunnelUrl() {
  return currentTunnelUrl
}

module.exports = { watchForTunnelUrl, getTunnelUrl }
