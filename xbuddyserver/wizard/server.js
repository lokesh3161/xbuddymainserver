const express  = require('express')
const cors     = require('cors')
const fs       = require('fs')
const path     = require('path')
const { execFile } = require('child_process')
const licenseRepository = require('../repositories/licenseRepository')

const BASE_DIR     = process.pkg ? path.dirname(process.execPath) : path.resolve(__dirname, '..')
const CONFIG_DIR   = path.join(BASE_DIR, 'config')
const CREDS_DIR    = path.join(BASE_DIR, 'credentials')
const CONFIG_FILE  = path.join(CONFIG_DIR, 'shop-config.json')

const app  = express()
const PORT = 3333

app.use(cors())
app.use(express.json({ limit: '10mb' }))
app.use(express.static(path.join(__dirname)))

const DEFAULT_MASTER_GAS_URL = 'https://script.google.com/macros/s/AKfycbz_Np3K34IPwNSvzq8aFMKwNHMXkLb-cNcaLmGrnROGuSczlHcwO9OQi4dCBkOo68E85Q/exec'

// ── Step 1: Validate Shop ID + License Key (Auto-Retrieves Sheet ID & GAS URL) ──
app.post('/wizard/verify-provisioning', async (req, res) => {
  try {
    const { shopId, licenseKey, masterGasUrl } = req.body || {}

    if (!shopId || !licenseKey) {
      return res.json({ ok: false, error: 'Shop ID and License Key are required.' })
    }

    const targetMasterUrl = (masterGasUrl && masterGasUrl.trim()) || DEFAULT_MASTER_GAS_URL
    const val = await licenseRepository.validateLicense(shopId.trim(), licenseKey.trim(), targetMasterUrl)

    if (val && val.valid) {
      return res.json({
        ok: true,
        data: {
          shopId: val.shopId || shopId.trim(),
          shopName: val.shopName || 'Xerox Shop',
          sheetId: val.sheetId || '',
          gasUrl: val.gasUrl || '',
          licenseStatus: val.licenseStatus || val.status || 'Active',
          masterGasUrl: targetMasterUrl
        }
      })
    }

    return res.json({ ok: false, error: val.message || 'Invalid Shop ID or License Key' })
  } catch (err) {
    return res.json({ ok: false, error: `Validation error: ${err.message}` })
  }
})

// ── Step 1 (Option B): Verify Direct GAS URL (Single Shop Direct Activation) ──
app.post('/wizard/verify-gas-url', async (req, res) => {
  try {
    const { gasUrl, shopName, ownerName, phone, email } = req.body || {}

    if (!gasUrl || !gasUrl.trim()) {
      return res.json({ ok: false, error: 'Google Apps Script Web App URL is required.' })
    }

    const trimmedUrl = gasUrl.trim()
    const axios = require('axios')

    // 1. Verify URL responds to action=ping
    const pingRes = await axios.get(`${trimmedUrl}?action=ping`, { timeout: 8000 }).catch(() => null)
    if (!pingRes || !pingRes.data) {
      return res.json({ ok: false, error: 'Could not connect to Google Apps Script URL. Please check deployment settings (Access: Anyone).' })
    }

    // 2. Fetch config via action=getConfig
    const configRes = await axios.get(`${trimmedUrl}?action=getConfig`, { timeout: 8000 }).catch(() => null)
    const remoteData = (configRes && configRes.data && configRes.data.data) ? configRes.data.data : {}

    return res.json({
      ok: true,
      data: {
        shopName: shopName || remoteData.shopName || 'Xerox Shop',
        ownerName: ownerName || remoteData.ownerName || 'Owner',
        phone: phone || '',
        email: email || '',
        gasUrl: trimmedUrl,
        sheetId: remoteData.sheetId || '',
        currency: remoteData.currency || 'INR',
        pricing: remoteData.pricing || { bwPrice: 2.00, colorPrice: 10.00, a3Extra: 5.00 },
        version: remoteData.version || '1.0.0'
      }
    })
  } catch (err) {
    return res.json({ ok: false, error: `Connection failed: ${err.message}` })
  }
})

// ── Detect printers ────────────────────────────────────────────────
app.get('/wizard/detect-printers', (req, res) => {
  const candidates = [
    { exec: 'C:\\Windows\\System32\\wbem\\wmic.exe', args: ['printer', 'get', 'name'] },
    { exec: 'C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe',
      args: ['-NoProfile', '-Command', 'Get-Printer | Select-Object -ExpandProperty Name'] },
  ]

  const tryNext = (i) => {
    if (i >= candidates.length) return res.json({ ok: false, printers: [], error: 'Could not detect printers.' })
    const { exec, args } = candidates[i]
    execFile(exec, args, (err, stdout) => {
      if (err) return tryNext(i + 1)
      const printers = stdout.split('\n')
        .map(l => l.trim())
        .filter(l => l && l !== 'Name')
      if (!printers.length) return tryNext(i + 1)
      res.json({ ok: true, printers })
    })
  }
  tryNext(0)
})

// ── Finish & Auto-write shop-config.json ──────────────────────────────
app.post('/wizard/finish', (req, res) => {
  const { shopName, shopId, licenseKey, masterGasUrl, sheetId, gasUrl, boothPin, printer } = req.body
  if (!shopId || !licenseKey)
    return res.json({ ok: false, error: 'Shop ID and License Key are required.' })

  try {
    fs.mkdirSync(CONFIG_DIR, { recursive: true })
    fs.mkdirSync(path.join(BASE_DIR, 'logs'),      { recursive: true })
    fs.mkdirSync(path.join(BASE_DIR, 'pending'),   { recursive: true })
    fs.mkdirSync(path.join(BASE_DIR, 'completed'), { recursive: true })
    fs.mkdirSync(path.join(BASE_DIR, 'temp'),      { recursive: true })

    const config = {
      shopName:     (shopName && shopName.trim()) || 'Xerox Shop',
      shopId:       shopId.trim(),
      licenseKey:   licenseKey.trim(),
      masterGasUrl: (masterGasUrl && masterGasUrl.trim()) || DEFAULT_MASTER_GAS_URL,
      sheetId:      (sheetId && sheetId.trim()) || '',
      gasUrl:       (gasUrl && gasUrl.trim()) || DEFAULT_MASTER_GAS_URL,
      boothPin:     (boothPin && boothPin.trim()) || '1234',
      printer:      printer || '',
      setupDone:    true,
      createdAt:    new Date().toISOString(),
    }
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2), 'utf8')
    res.json({ ok: true })
  } catch (err) {
    res.json({ ok: false, error: err.message })
  }
})

// ── Check if already configured ───────────────────────────────────────────
app.get('/wizard/status', (req, res) => {
  res.json({ configured: fs.existsSync(CONFIG_FILE) })
})

function startWizard(onDone) {
  const server = app.listen(PORT, () => {
    const url = `http://localhost:${PORT}`
    console.log(`\n  Setup Wizard running at ${url}\n`)
    execFile('cmd.exe', ['/c', 'start', '', url], () => {})
  })

  const poll = setInterval(() => {
    if (fs.existsSync(CONFIG_FILE)) {
      clearInterval(poll)
      setTimeout(() => {
        server.close()
        onDone()
      }, 1500)
    }
  }, 1000)
}

module.exports = { startWizard }
