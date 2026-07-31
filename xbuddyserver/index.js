const fs   = require('fs')
const path = require('path')

const BASE_DIR    = process.pkg
  ? path.dirname(process.execPath)
  : path.dirname(path.resolve(__filename))

const CONFIG_FILE = path.join(BASE_DIR, 'config', 'shop-config.json')
const CONFIG_OLD  = path.join(BASE_DIR, 'shop-config.json')

const isConfigured = fs.existsSync(CONFIG_FILE) || fs.existsSync(CONFIG_OLD)

if (!isConfigured) {
  // First launch — run setup wizard
  const { startWizard } = require('./wizard/server')
  console.log('\n  Welcome to XBuddy!')
  console.log('  No configuration found — launching Setup Wizard...\n')
  startWizard(startAgent)
} else {
  startAgent()
}

function startAgent() {
  const { updatePrintStatus }                  = require('./services/updater')
  const { deletePdf }                          = require('./services/downloader')
  const { printPdf, getDefaultPrinter }        = require('./services/printer')
  const { startLocalServer, decodePendingPdf, setLicenseStatus } = require('./services/localServer')
  const { watchForTunnelUrl }                  = require('./services/tunnel')
  const licenseRepository                      = require('./repositories/licenseRepository')
  const shopRepository                         = require('./repositories/shopRepository')
  const orderRepository                        = require('./repositories/orderRepository')
  const config                                 = require('./config')
  const logger                                 = require('./utils/logger')

  let lastRollupDate = ''

  async function checkLicense() {
    if (!config.shopId || !config.licenseKey) {
      logger.warn('[License] Unconfigured Shop ID or License Key.')
      setLicenseStatus({ valid: true, status: 'unconfigured' })
      return
    }

    try {
      const result = await licenseRepository.validateLicense(
        config.shopId,
        config.licenseKey,
        config.masterGasUrl
      )

      setLicenseStatus(result)

      if (result.valid) {
        if (result.isGracePeriod) {
          logger.warn(`[License] Running in Offline Grace Period (${result.graceTimeLeftHours}h remaining)`)
        } else {
          logger.success(`[License] Active (${result.status}) — Validated successfully`)
        }
      } else {
        logger.error(`[License] License check failed: ${result.message || result.status}`)
        logger.warn('[License] New order ingestion paused until license is renewed.')
      }
    } catch (err) {
      logger.error(`[License] Validation error: ${err.message}`)
    }
  }

  async function sendHeartbeat() {
    if (!config.shopId || !config.masterGasUrl) return
    try {
      const printer = await getDefaultPrinter(false)
      const statusStr = printer ? 'online' : 'no_printer'
      const waitingOrders = await orderRepository.getWaitingOrders()
      const pendingJobsCount = waitingOrders.length
      const currentVersion = '1.0.0'

      await shopRepository.postHeartbeat(
        config.shopId,
        statusStr,
        currentVersion,
        pendingJobsCount,
        config.masterGasUrl
      )
    } catch (e) {}
  }

  async function sendDailyRollup() {
    if (!config.shopId || !config.masterGasUrl) return
    const today = new Date().toISOString().split('T')[0]
    if (lastRollupDate === today) return

    try {
      const orders = await orderRepository.getOrders(config.shopId)
      const todayOrders = orders.filter(o => o.timestamp && o.timestamp.startsWith(today))
      const count = todayOrders.length
      const revenue = todayOrders.reduce((sum, o) => sum + (o.amount || 0), 0)

      const success = await shopRepository.postRollup(
        config.shopId,
        today,
        count,
        revenue,
        config.masterGasUrl
      )
      if (success) {
        logger.success(`[Rollup] Posted daily summary for ${today}: ${count} orders, ₹${revenue}`)
        lastRollupDate = today
      }
    } catch (err) {
      logger.error(`[Rollup] Error sending daily rollup: ${err.message}`)
    }
  }

  async function start() {
    console.log('\n  X Buddy Print Agent — SaaS Edition\n')
    logger.info('Starting in Secure Release Mode...')

    // Initialize License Check
    await checkLicense()

    startLocalServer()
    watchForTunnelUrl(30000)

    const printer = await getDefaultPrinter()
    if (printer) {
      logger.success(`Printer ready: ${printer}`)
    } else {
      logger.warn('No printer detected — orders will be marked Printed without printing')
    }

    logger.success('Waiting for booth release triggers on /release-print\n')

    // Periodic Heartbeat (every 5 mins)
    sendHeartbeat()
    setInterval(sendHeartbeat, 5 * 60 * 1000)

    // Periodic License Check (every 1 hour)
    setInterval(checkLicense, 60 * 60 * 1000)

    // Periodic Daily Rollup check (every 1 hour)
    sendDailyRollup()
    setInterval(sendDailyRollup, 60 * 60 * 1000)
  }

  process.on('SIGINT', () => { logger.warn('Stopped.'); process.exit(0) })
  start()
}
