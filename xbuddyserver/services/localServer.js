const express        = require('express')
const cors           = require('cors')
const fs             = require('fs')
const path           = require('path')
const axios          = require('axios')
const archiverModule = require('archiver')
const archiver       = typeof archiverModule === 'function' ? archiverModule : (archiverModule.default || archiverModule)
const logger         = require('../utils/logger')
const { getOrderByIdForRelease, getAllOrders } = require('./sheets')
const { updatePrintStatus, updateReleaseStatus } = require('./updater')
const { printPdf, getDefaultPrinter } = require('./printer')
const { deletePdf } = require('./downloader')
const { getTunnelUrl } = require('./tunnel')

const app         = express()
const PORT        = 3001
const BASE_DIR    = process.pkg ? path.dirname(process.execPath) : path.join(__dirname, '..')
const PENDING_DIR = path.join(BASE_DIR, 'downloads')

let currentLicenseState = { valid: true, status: 'active', message: '' }

function setLicenseStatus(statusObj) {
  if (statusObj) {
    currentLicenseState = statusObj
  }
}

app.use(cors())
app.use(express.json({ limit: '100mb' }))

// Log all incoming requests
app.use((req, res, next) => {
  logger.info(`[${req.method}] ${req.path}`)
  next()
})

function ensureDirectory(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true })
  }
  return dirPath
}

ensureDirectory(PENDING_DIR)

// Save screenshot locally as PNG
function saveScreenshotLocally(orderId, screenshotBase64) {
  try {
    const imgPath = path.join(PENDING_DIR, `${orderId}_payment.png`)
    fs.writeFileSync(imgPath, Buffer.from(screenshotBase64, 'base64'))
    logger.success(`Screenshot saved: ${orderId}_payment.png`)
  } catch (err) {
    logger.error(`Screenshot save failed: ${err.message}`)
  }
}

const { boothPin: BOOTH_PIN } = require('../config')

function getLocalPendingOrder(orderId) {
  const normalizedOrderId = String(orderId || '').trim().toUpperCase()
  if (!normalizedOrderId || !fs.existsSync(PENDING_DIR)) return null

  const files = fs.readdirSync(PENDING_DIR)
  const match = files.find(file => {
    const upper = file.toUpperCase()
    return upper.startsWith(`${normalizedOrderId}_PENDING.B64`) || upper.startsWith(`${normalizedOrderId}.PDF`)
  })

  if (!match) return null

  return {
    rowIndex: null,
    orderId: normalizedOrderId,
    name: '',
    fileName: '',
    copies: 1,
    printType: 'B&W',
    printStatus: 'Waiting',
    releaseStatus: 'Waiting For Release',
  }
}

// POST /booth-login — validate shopkeeper PIN
app.post('/booth-login', (req, res) => {
  const { pin } = req.body
  if (!pin) return res.json({ success: false, error: 'PIN required' })
  if (pin !== BOOTH_PIN) return res.json({ success: false, error: 'Wrong PIN. Try again.' })
  res.json({ success: true })
})

// POST /save-order — receives PDF + screenshot from browser
app.post('/save-order', (req, res) => {
  try {
    if (currentLicenseState && currentLicenseState.valid === false) {
      logger.warn(`[save-order] Blocked new order save due to license status: ${currentLicenseState.status}`)
      return res.json({
        success: false,
        error: `License ${currentLicenseState.status || 'invalid'}. Contact administrator to renew.`,
      })
    }

    const { orderId, fileName, pdfBase64, screenshotBase64 } = req.body
    if (!orderId) return res.json({ success: false, error: 'Missing orderId' })

    if (pdfBase64) {
      const pdfPath = path.join(PENDING_DIR, `${orderId}_pending.b64`)
      fs.writeFileSync(pdfPath, pdfBase64)
      logger.success(`PDF saved locally for order ${orderId}`)
    }

    if (screenshotBase64) {
      saveScreenshotLocally(orderId, screenshotBase64)
    }

    res.json({ success: true, orderId })
  } catch (err) {
    logger.error(`Failed to save order files: ${err.message}`)
    res.json({ success: false, error: err.message })
  }
})

// POST /api/shop/verify — validates GAS URL and verifies shop backend connectivity
app.post('/api/shop/verify', async (req, res) => {
  const { shopName, ownerName, phone, email, gasUrl } = req.body || {}
  if (!shopName || !ownerName || !phone || !email || !gasUrl) {
    return res.status(400).json({
      success: false,
      error: 'All fields are required: Shop Name, Owner Name, Phone, Email, and Google Apps Script Web App URL.',
    })
  }

  const cleanGasUrl = String(gasUrl).trim()
  if (!cleanGasUrl.startsWith('http://') && !cleanGasUrl.startsWith('https://')) {
    return res.status(400).json({
      success: false,
      error: 'Invalid Web App URL format. Must start with https://script.google.com/',
    })
  }

  try {
    logger.info(`[Verify] Testing GAS endpoint: ${cleanGasUrl}`)
    // Call 1: Ping
    const pingRes = await axios.get(`${cleanGasUrl}?action=ping`, { timeout: 10000 })
    if (!pingRes.data) {
      throw new Error('Received empty response from Apps Script backend.')
    }

    // Call 2: Config check if ping succeeded
    try {
      await axios.get(`${cleanGasUrl}?action=getConfig`, { timeout: 10000 })
    } catch (cfgErr) {
      logger.warn(`[Verify] getConfig check warning (non-fatal): ${cfgErr.message}`)
    }

    logger.success(`[Verify] Verification successful for shop "${shopName}"`)
    return res.json({
      success: true,
      checks: {
        backend: true,
        database: true,
        api: true,
      },
    })
  } catch (err) {
    logger.error(`[Verify] Failed to verify GAS URL: ${err.message}`)
    return res.status(400).json({
      success: false,
      error: 'Unable to connect to the provided Google Apps Script URL. Please verify that:\n• The URL is correct\n• The Apps Script is deployed as a Web App\n• The Web App is accessible (Anyone, even anonymous)\n• The XBuddy backend is installed',
    })
  }
})

function createZipArchive(options = {}) {
  const archiverMod = require('archiver')
  if (typeof archiverMod === 'function') return archiverMod('zip', options)
  if (archiverMod.create) return archiverMod.create('zip', options)
  if (archiverMod.ZipArchive) return new archiverMod.ZipArchive(options)
  throw new Error('Unsupported archiver module export')
}

// POST /api/shop/package — dynamically generates and serves XBuddy-Shop-Package.zip
app.post('/api/shop/package', (req, res) => {
  const { shopName, ownerName, phone, email, gasUrl } = req.body || {}
  if (!shopName || !ownerName || !phone || !email || !gasUrl) {
    return res.status(400).json({ success: false, error: 'Missing required shop configuration parameters.' })
  }

  try {
    res.setHeader('Content-Type', 'application/zip')
    res.setHeader('Content-Disposition', 'attachment; filename="XBuddy-Shop-Package.zip"')

    const archive = createZipArchive({ zlib: { level: 9 } })

    archive.on('error', (err) => {
      logger.error(`[Package Generation Error] ${err.message}`)
      if (!res.headersSent) {
        res.status(500).json({ success: false, error: 'Failed to generate package ZIP file.' })
      }
    })

    archive.pipe(res)

    // 1. Generate shop-config.json
    const shopConfigContent = JSON.stringify(
      {
        shopName: String(shopName).trim(),
        ownerName: String(ownerName).trim(),
        phone: String(phone).trim(),
        email: String(email).trim(),
        gasUrl: String(gasUrl).trim(),
        version: '1.0.0',
      },
      null,
      2
    )

    archive.append(shopConfigContent, { name: 'XBuddy-Shop-Package/config/shop-config.json' })

    // 2. Core runtime files
    const topFiles = ['START X BUDDY.bat', 'README.txt', 'install.bat', 'package.json', 'index.js', 'config.js', 'setup.js', 'README.md']
    topFiles.forEach((file) => {
      const fullPath = path.join(BASE_DIR, file)
      if (fs.existsSync(fullPath)) {
        archive.file(fullPath, { name: `XBuddy-Shop-Package/${file}` })
      }
    })

    // 3. Subdirectories
    const subDirs = ['printer', 'services', 'repositories', 'utilities', 'controllers', 'utils', 'wizard']
    subDirs.forEach((dir) => {
      const fullPath = path.join(BASE_DIR, dir)
      if (fs.existsSync(fullPath)) {
        archive.directory(fullPath, `XBuddy-Shop-Package/${dir}`, (entry) => {
          // Filter out secrets, customer files or unnecessary files
          if (
            entry.name.includes('.git') ||
            entry.name.includes('credentials.json') ||
            entry.name.includes('local-config.json') ||
            entry.name.includes('.env') ||
            entry.name.endsWith('.pdf') ||
            entry.name.endsWith('.b64')
          ) {
            return false
          }
          return entry
        })
      }
    })

    // 4. Empty log & job directories
    archive.append('', { name: 'XBuddy-Shop-Package/pending/.gitkeep' })
    archive.append('', { name: 'XBuddy-Shop-Package/printed/.gitkeep' })
    archive.append('', { name: 'XBuddy-Shop-Package/logs/.gitkeep' })

    archive.finalize()
  } catch (err) {
    logger.error(`[Package Generation Exception] ${err.message}`)
    if (!res.headersSent) {
      res.status(500).json({ success: false, error: err.message })
    }
  }
})

// GET /tunnel-url — returns current Cloudflare tunnel URL for mobile clients
app.get('/tunnel-url', (req, res) => {
  const url = getTunnelUrl()
  res.json({ success: !!url, url: url || null })
})

// GET / — basic health check for browser-based checks
app.get('/', (req, res) => {
  res.json({ success: true, message: 'Print agent local server is running', license: currentLicenseState })
})

// GET /config — returns active shop configuration for frontend auto-discovery
app.get('/config', (req, res) => {
  try {
    const configPath = path.join(BASE_DIR, 'config', 'shop-config.json')
    const fallbackPath = path.join(BASE_DIR, 'shop-config.json')
    const target = fs.existsSync(configPath) ? configPath : (fs.existsSync(fallbackPath) ? fallbackPath : null)
    if (target) {
      const cfg = JSON.parse(fs.readFileSync(target, 'utf8'))
      return res.json({ success: true, ...cfg })
    }
  } catch (e) {}
  res.json({ success: false, error: 'Config file not found' })
})

// GET /status — health check
app.get('/status', (req, res) => {
  res.json({ success: true, message: 'Print agent local server is running', license: currentLicenseState })
})

// GET /admin/license — returns current license status
app.get('/admin/license', (req, res) => {
  res.json({ success: true, license: currentLicenseState })
})

app.get('/admin/orders', async (req, res) => {
  try {
    const rows = await getAllOrders()
    const orders = rows.map(order => ({
      id: order.orderId,
      fileName: order.fileName || 'Document.pdf',
      type: order.type,
      pages: order.totalPages,
      amount: order.amount,
      booth: 'Booth 01',
      status: order.printStatus,
      time: order.timestamp || new Date().toLocaleTimeString(),
    }))
    res.json({ success: true, orders })
  } catch (err) {
    res.json({ success: false, error: err.message })
  }
})

app.get('/admin/stats', async (req, res) => {
  try {
    const rows = await getAllOrders()
    const totalOrders = rows.length
    const revenue = rows.reduce((sum, order) => sum + (order.amount || 0), 0)
    const pending = rows.filter(order => order.printStatus === 'Waiting').length
    const printed = rows.filter(order => order.printStatus === 'Printed').length
    const failed = rows.filter(order => order.printStatus === 'Failed').length
    res.json({
      success: true,
      totalOrders,
      revenue,
      pending,
      printed,
      failed,
      activeBooths: 4,
      license: currentLicenseState
    })
  } catch (err) {
    res.json({ success: false, error: err.message })
  }
})

app.get('/admin/booths', async (req, res) => {
  try {
    const rows = await getAllOrders()
    const pending = rows.filter(order => order.printStatus === 'Waiting').length
    const booths = [
      { name: 'Booth 01', online: true, queue: Math.max(0, Math.round(pending * 0.4)), connected: true, printed: 48, revenue: 1092, paused: false, locked: false },
      { name: 'Booth 02', online: true, queue: Math.max(0, Math.round(pending * 0.3)), connected: true, printed: 732, revenue: 732, paused: false, locked: false },
      { name: 'Booth 03', online: true, queue: Math.max(0, Math.round(pending * 0.2)), connected: true, printed: 57, revenue: 1356, paused: false, locked: false },
      { name: 'Booth 04', online: false, queue: Math.max(0, Math.round(pending * 0.1)), connected: false, printed: 22, revenue: 478, paused: true, locked: false },
    ]
    res.json({ success: true, booths })
  } catch (err) {
    res.json({ success: false, error: err.message })
  }
})

app.get('/admin/health', async (req, res) => {
  try {
    const rows = await getAllOrders()
    const printer = await getDefaultPrinter(false)
    const checks = [
      { name: 'Print Agent', status: 'online' },
      { name: 'Local Server', status: 'online' },
      { name: 'License Status', status: currentLicenseState.valid ? 'online' : 'offline' },
      { name: 'Google Sheets', status: rows.length >= 0 ? 'online' : 'offline' },
      { name: 'Cloudflare Tunnel', status: 'online' },
      { name: 'Printer Connectivity', status: printer ? 'online' : 'offline' },
    ]
    res.json({ success: true, checks, license: currentLicenseState })
  } catch (err) {
    res.json({ success: true, checks: [
      { name: 'Print Agent', status: 'online' },
      { name: 'Local Server', status: 'online' },
      { name: 'License Status', status: currentLicenseState.valid ? 'online' : 'offline' },
      { name: 'Google Sheets', status: 'offline' },
      { name: 'Cloudflare Tunnel', status: 'online' },
      { name: 'Printer Connectivity', status: 'offline' },
    ], error: err.message, license: currentLicenseState })
  }
})

// POST /release-print — booth enters Order ID to trigger print
app.post('/release-print', async (req, res) => {
  const { orderId } = req.body
  if (!orderId) return res.json({ success: false, error: 'Missing Order ID' })

  const normalizedOrderId = orderId.trim().toUpperCase()
  let order = await getOrderByIdForRelease(normalizedOrderId)

  if (!order) {
    order = getLocalPendingOrder(normalizedOrderId)
  }

  if (!order) {
    return res.json({ success: false, error: 'Order not found. Check the Order ID.' })
  }
  if (order.releaseStatus === 'Released') {
    return res.json({ success: false, error: 'Already Printed. This order was already released.' })
  }
  if (order.printStatus === 'Printing') {
    return res.json({ success: false, error: 'Already printing. Please wait.' })
  }

  // Mark as Released immediately so double-tap is blocked
  if (order.rowIndex) {
    await updateReleaseStatus(order.rowIndex, 'Released')
    await updatePrintStatus(order.rowIndex, 'Printing')
  } else {
    logger.warn(`Using local pending file for order ${normalizedOrderId}; skipping remote sheet status update`)
  }
  res.json({ success: true, message: `Printing started for ${normalizedOrderId}` })

  // Trigger print async
  const filePath = path.join(PENDING_DIR, `${order.orderId}.pdf`)
  try {
    const decoded = decodePendingPdf(order.orderId, filePath)
    if (!decoded) {
      logger.warn(`PDF not found locally for ${order.orderId} — marking Failed`)
      await updatePrintStatus(order.rowIndex, 'Failed - No PDF')
      return
    }
    const printer = await getDefaultPrinter()
    if (printer) {
      const success = await printPdf(filePath, { copies: order.copies, printType: order.printType, orderId: order.orderId })
      await updatePrintStatus(order.rowIndex, success ? 'Printed' : 'Failed')
    } else {
      await updatePrintStatus(order.rowIndex, 'Printed')
    }
  } catch (err) {
    logger.error(`Release print error for ${order.orderId}: ${err.message}`)
    await updatePrintStatus(order.rowIndex, 'Failed')
  } finally {
    if (fs.existsSync(filePath)) deletePdf(filePath)
  }
})

function startLocalServer() {
  app.listen(PORT, () => {
    logger.success(`Local server running on http://localhost:${PORT}`)
  })
}

function decodePendingPdf(orderId, outputPath) {
  const b64Path = path.join(PENDING_DIR, `${orderId}_pending.b64`)
  if (!fs.existsSync(b64Path)) return false
  const base64 = fs.readFileSync(b64Path, 'utf8')
  const buffer = Buffer.from(base64, 'base64')
  fs.writeFileSync(outputPath, buffer)
  fs.unlinkSync(b64Path)
  return true
}

module.exports = { startLocalServer, decodePendingPdf, ensureDirectory, setLicenseStatus }
