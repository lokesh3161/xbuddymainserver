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
const CREDS_FILE   = path.join(CREDS_DIR, 'credentials.json')

const app  = express()
const PORT = 3333

app.use(cors())
app.use(express.json({ limit: '10mb' }))
app.use(express.static(path.join(__dirname)))

// ── Step 1: validate shop details & license ─────────────────────────────────
app.post('/wizard/validate-shop', async (req, res) => {
  const { shopName, boothPin, shopId, licenseKey, masterGasUrl } = req.body
  if (!shopName || shopName.trim().length < 2)
    return res.json({ ok: false, error: 'Shop name must be at least 2 characters.' })
  if (!boothPin || !/^\d{4,8}$/.test(boothPin))
    return res.json({ ok: false, error: 'Booth PIN must be 4–8 digits.' })
  
  if (licenseKey && !/^XB-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/i.test(licenseKey.trim())) {
    return res.json({ ok: false, error: 'License Key format must be XB-XXXX-XXXX-XXXX.' })
  }

  // If Master Registry GAS URL is provided, validate license remotely
  if (masterGasUrl && shopId && licenseKey) {
    try {
      const val = await licenseRepository.validateLicense(shopId.trim(), licenseKey.trim(), masterGasUrl.trim())
      if (!val.valid && val.status !== 'unreachable') {
        return res.json({ ok: false, error: `License Validation Failed: ${val.message || val.status}` })
      }
    } catch (e) {
      // Degrade gracefully if network fails during wizard validation
    }
  }

  res.json({ ok: true })
})

// ── Step 2: receive credentials.json content ───────────────────────────────
app.post('/wizard/save-credentials', (req, res) => {
  const { content } = req.body
  try {
    const parsed = JSON.parse(content)
    if (!parsed.type || parsed.type !== 'service_account')
      return res.json({ ok: false, error: 'Not a valid service account credentials file.' })
    if (!parsed.client_email || !parsed.private_key)
      return res.json({ ok: false, error: 'Missing client_email or private_key in credentials.' })

    fs.mkdirSync(CREDS_DIR, { recursive: true })
    fs.writeFileSync(CREDS_FILE, content, 'utf8')
    res.json({ ok: true, email: parsed.client_email })
  } catch {
    res.json({ ok: false, error: 'Invalid JSON. Please upload the correct credentials.json file.' })
  }
})

// ── Step 3: validate Google Sheets access ──────────────────────────────────
app.post('/wizard/validate-sheets', async (req, res) => {
  const { sheetId, gasUrl } = req.body
  if (!sheetId || sheetId.trim().length < 20)
    return res.json({ ok: false, error: 'Invalid Spreadsheet ID.' })
  if (!gasUrl || !gasUrl.startsWith('https://script.google.com'))
    return res.json({ ok: false, error: 'Invalid GAS URL.' })

  if (!fs.existsSync(CREDS_FILE))
    return res.json({ ok: false, error: 'credentials.json not found. Complete Step 2 first.' })

  try {
    const { google } = require('googleapis')
    const auth = new google.auth.GoogleAuth({
      keyFile: CREDS_FILE,
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    })
    const sheets = google.sheets({ version: 'v4', auth })
    await sheets.spreadsheets.get({ spreadsheetId: sheetId.trim() })
    res.json({ ok: true })
  } catch (err) {
    const msg = err.message || ''
    if (msg.includes('not found') || msg.includes('404'))
      return res.json({ ok: false, error: 'Spreadsheet not found. Check the ID and share it with the service account.' })
    if (msg.includes('permission') || msg.includes('403'))
      return res.json({ ok: false, error: 'Permission denied. Share the sheet with the service account email.' })
    res.json({ ok: false, error: 'Could not connect to Google Sheets: ' + msg.split('\n')[0] })
  }
})

// ── Step 4: detect printers ────────────────────────────────────────────────
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

// ── Step 5: save final config ──────────────────────────────────────────────
app.post('/wizard/finish', (req, res) => {
  const { shopName, shopId, licenseKey, masterGasUrl, sheetId, gasUrl, boothPin, printer } = req.body
  if (!shopName || !sheetId || !gasUrl || !boothPin)
    return res.json({ ok: false, error: 'Missing required fields.' })

  try {
    fs.mkdirSync(CONFIG_DIR, { recursive: true })
    fs.mkdirSync(path.join(BASE_DIR, 'logs'),      { recursive: true })
    fs.mkdirSync(path.join(BASE_DIR, 'pending'),   { recursive: true })
    fs.mkdirSync(path.join(BASE_DIR, 'completed'), { recursive: true })
    fs.mkdirSync(path.join(BASE_DIR, 'temp'),      { recursive: true })

    const config = {
      shopName:     shopName.trim(),
      shopId:       (shopId && shopId.trim()) || ('XB-' + Date.now().toString(36).toUpperCase()),
      licenseKey:   (licenseKey && licenseKey.trim()) || licenseRepository.generateLicenseKeyFormat(),
      masterGasUrl: (masterGasUrl && masterGasUrl.trim()) || '',
      sheetId:      sheetId.trim(),
      gasUrl:       gasUrl.trim(),
      boothPin:     boothPin.trim(),
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
