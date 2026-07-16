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
  const { startLocalServer, decodePendingPdf } = require('./services/localServer')
  const { watchForTunnelUrl }                  = require('./services/tunnel')
  const logger = require('./utils/logger')

  async function start() {
    console.log('\n  X Buddy Print Agent\n')
    logger.info('Starting in Secure Release Mode...')

    startLocalServer()
    watchForTunnelUrl(30000)

    const printer = await getDefaultPrinter()
    if (printer) {
      logger.success(`Printer ready: ${printer}`)
    } else {
      logger.warn('No printer detected — orders will be marked Printed without printing')
    }

    logger.success('Waiting for booth release triggers on /release-print\n')
  }

  process.on('SIGINT', () => { require('./utils/logger').warn('Stopped.'); process.exit(0) })
  start()
}
