const { execFile } = require('child_process')
const fs     = require('fs')
const path   = require('path')
const logger = require('../utils/logger')
const { getCredentialsPath } = require('../utils/credentialPath')

const BASE_DIR    = path.dirname(process.pkg ? process.execPath : __dirname)
const SUMATRA_SRC = path.join(__dirname, '..', 'node_modules', 'pdf-to-printer', 'dist', 'SumatraPDF-3.4.6-32.exe')
const SUMATRA_DST = path.join(BASE_DIR, 'SumatraPDF-3.4.6-32.exe')

if (process.pkg && !fs.existsSync(getCredentialsPath(BASE_DIR))) {
  logger.warn('credentials.json was not found next to the executable. Place it beside the application to enable Google Sheets/Drive access.')
}

if (process.pkg && !fs.existsSync(SUMATRA_DST)) {
  try {
    fs.copyFileSync(SUMATRA_SRC, SUMATRA_DST)
    logger.success('SumatraPDF extracted successfully')
  } catch (e) {
    logger.warn('Could not extract SumatraPDF: ' + e.message)
  }
}

function getSumatraPath() {
  if (fs.existsSync(SUMATRA_DST)) return SUMATRA_DST
  if (fs.existsSync(SUMATRA_SRC)) return SUMATRA_SRC
  return null
}

let printerCache = null
let lastPrinterCheck = 0
const PRINTER_CACHE_TTL = 15000

async function getDefaultPrinter(verbose = true) {
  try {
    const now = Date.now()
    if (printerCache && now - lastPrinterCheck < PRINTER_CACHE_TTL) return printerCache

    const printers = await new Promise((resolve, reject) => {
      const wmicPath = 'C:\\Windows\\System32\\wbem\\wmic.exe'
      const fallbackPaths = [wmicPath, 'wmic.exe']
      const tryExec = (index) => {
        if (index >= fallbackPaths.length) return reject(new Error('wmic.exe not found'))
        const candidate = fallbackPaths[index]
        execFile(candidate, ['printer', 'get', 'name'], (err, stdout) => {
          if (err && index + 1 < fallbackPaths.length) return tryExec(index + 1)
          if (err) return reject(err)
          const names = stdout.split('\n')
            .map(l => l.trim())
            .filter(l => l && l !== 'Name')
          resolve(names)
        })
      }
      tryExec(0)
    })

    if (verbose) {
      logger.info(`Available printers (${printers.length}):`)
      printers.forEach((p, i) => logger.dim(`  ${i + 1}. ${p}`))
    }

    const real = printers.find(p => {
      const n = p.toLowerCase()
      return !n.includes('onenote') && !n.includes('fax') && !n.includes('xps') && !n.includes('pdf')
    })

    printerCache = real || printers[0]
    lastPrinterCheck = Date.now()
    return printerCache
  } catch (err) {
    logger.error(`Could not get printers: ${err.message}`)
    return null
  }
}

async function printPdf(filePath, options = {}) {
  const { copies = 1, printType = 'B&W', orderId = '' } = options
  try {
    const printerName = await getDefaultPrinter()
    if (!printerName) throw new Error('No printer available')

    const sumatraPath = getSumatraPath()
    if (!sumatraPath) throw new Error('SumatraPDF not found')

    logger.info(`Printing order ${orderId} → ${printerName}`)
    logger.info(`  Copies: ${copies} | Type: ${printType}`)

    const args = [
      '-print-to', printerName,
      '-print-settings', `${copies}x${printType === 'B&W' ? ',monochrome' : ''}`,
      '-silent',
      filePath
    ]

    await new Promise((resolve, reject) => {
      execFile(sumatraPath, args, { timeout: 30000 }, (err) => {
        if (err) return reject(err)
        resolve()
      })
    })

    logger.success(`Print job sent for order ${orderId}`)
    return true
  } catch (err) {
    logger.error(`Print failed for order ${orderId}: ${err.message}`)
    return false
  }
}

module.exports = { printPdf, getDefaultPrinter }
