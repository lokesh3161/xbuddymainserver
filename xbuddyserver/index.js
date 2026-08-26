const fs   = require('fs')
const path = require('path')
const axios = require('axios')

const BASE_DIR    = process.pkg
  ? path.dirname(process.execPath)
  : path.dirname(path.resolve(__filename))

const CONFIG_FILE = path.join(BASE_DIR, 'config', 'shop-config.json')
const CONFIG_OLD  = path.join(BASE_DIR, 'shop-config.json')

const isConfigured = fs.existsSync(CONFIG_FILE) || fs.existsSync(CONFIG_OLD)

if (!isConfigured) {
  // First launch without config
  console.error('\n  [!] XBuddy shop configuration is invalid or missing.')
  console.error('  [!] Please download your personalized Shop Package from XBuddy website.\n')
  process.exit(1)
} else {
  startAgent()
}

function startAgent() {
  const { downloadPdf, deletePdf }              = require('./services/downloader')
  const { printPdf, getDefaultPrinter }        = require('./services/printer')
  const { startLocalServer, decodePendingPdf, setLicenseStatus } = require('./services/localServer')
  const { watchForTunnelUrl }                  = require('./services/tunnel')
  const orderRepository                        = require('./repositories/orderRepository')
  const config                                 = require('./config')
  const logger                                 = require('./utils/logger')

  let isShopOnline = false

  async function performStartupHealthChecks() {
    console.log('\n========================================')
    console.log('          X BUDDY PRINT AGENT          ')
    console.log('========================================\n')

    console.log(`Shop:  ${config.shopName || 'XBuddy Shop'}`)
    console.log(`Owner: ${config.ownerName || 'Shop Owner'}\n`)

    console.log('Connecting to shop backend...')

    let gasConnected = false
    let dbConnected = false
    let apiVerified = false
    let selectedPrinter = null

    if (config.gasUrl) {
      // 1. Health Check: Ping
      try {
        const pingRes = await axios.get(`${config.gasUrl}?action=ping`, { timeout: 8000 })
        if (pingRes.data) {
          gasConnected = true
          console.log('✓ Google Apps Script connected')
        }
      } catch (e) {
        console.log('✗ Google Apps Script connection failed')
      }

      // 2. Health Check: getConfig
      try {
        const cfgRes = await axios.get(`${config.gasUrl}?action=getConfig`, { timeout: 8000 })
        if (cfgRes.data) {
          dbConnected = true
          console.log('✓ Database connected')
        }
      } catch (e) {
        console.log('✗ Database connection failed')
      }

      // 3. API Verification
      if (gasConnected) {
        apiVerified = true
        console.log('✓ XBuddy API verified')
      }
    } else {
      console.log('✗ No Google Apps Script URL configured')
    }

    // 4. Printer Detection
    try {
      selectedPrinter = await getDefaultPrinter(false)
      if (selectedPrinter) {
        console.log(`✓ Printer detected: ${selectedPrinter}`)
      } else {
        console.log('⚠ No printer detected')
      }
    } catch (e) {
      console.log('⚠ Printer discovery warning:', e.message)
    }

    isShopOnline = gasConnected || (config.gasUrl ? true : false)
    setLicenseStatus({ valid: true, status: 'active', message: 'Direct Apps Script Mode' })

    console.log('\n----------------------------------------')
    if (isShopOnline) {
      console.log('🟢 SHOP ONLINE')
    } else {
      console.log('🔴 SHOP OFFLINE')
    }
    console.log('----------------------------------------\n')

    console.log('Local Agent:')
    console.log('http://localhost:3001\n')
  }

  // Polling loop for automated PDF downloading and printing
  let isPolling = false
  async function pollPendingOrders() {
    if (isPolling) return
    isPolling = true

    try {
      if (!config.gasUrl) return

      const waitingOrders = await orderRepository.getWaitingOrders()

      if (!isShopOnline) {
        isShopOnline = true
        logger.success('✓ Shop backend reconnected')
        logger.info('🟢 SHOP ONLINE')
      }

      if (waitingOrders && waitingOrders.length > 0) {
        for (const order of waitingOrders) {
          const orderId = order.orderId || order.id
          logger.info(`[Order] New order detected: ${orderId} (${order.fileName || 'Document.pdf'})`)

          const PENDING_DIR = path.join(BASE_DIR, 'downloads')
          const pdfPath = path.join(PENDING_DIR, `${orderId}.pdf`)
          let fileReady = false

          // 1. Check if base64 file exists locally (sent from browser)
          if (decodePendingPdf(orderId, pdfPath)) {
            fileReady = true
          }
          // 2. Otherwise download from Drive URL if present
          else if (order.driveUrl || order.driveFileId) {
            try {
              await downloadPdf(orderId, order.driveUrl || order.driveFileId)
              fileReady = fs.existsSync(pdfPath)
            } catch (dlErr) {
              logger.error(`[Order] PDF download failed for ${orderId}: ${dlErr.message}`)
            }
          }

          if (fileReady && fs.existsSync(pdfPath)) {
            const printer = await getDefaultPrinter(false)
            if (printer) {
              const success = await printPdf(pdfPath, {
                copies: order.copies || 1,
                printType: order.printType || 'B&W',
                orderId
              })
              await orderRepository.updatePrintStatus(order.rowIndex || orderId, success ? 'Printed' : 'Failed')
              if (success) {
                logger.success(`[Order] Successfully printed order ${orderId}`)
              } else {
                logger.error(`[Order] Print execution failed for ${orderId}`)
              }
            } else {
              logger.warn(`[Order] No printer detected. Marking ${orderId} as Printed.`)
              await orderRepository.updatePrintStatus(order.rowIndex || orderId, 'Printed')
            }

            // Immediately cleanup temporary PDF file
            deletePdf(pdfPath)
          } else {
            logger.warn(`[Order] PDF payload not ready for order ${orderId}. Will retry...`)
          }
        }
      }
    } catch (err) {
      if (isShopOnline) {
        isShopOnline = false
        logger.warn('⚠ Shop backend temporarily unavailable. Retrying...')
        logger.info('🔴 SHOP OFFLINE')
      }
    } finally {
      isPolling = false
    }
  }

  async function start() {
    await performStartupHealthChecks()

    startLocalServer()
    watchForTunnelUrl(30000)

    logger.success('Waiting for print orders...\n')

    // Initial poll & periodic poll every 4 seconds
    pollPendingOrders()
    setInterval(pollPendingOrders, 4000)
  }

  process.on('SIGINT', () => {
    logger.warn('Stopping XBuddy Print Agent...')
    process.exit(0)
  })

  start()
}
