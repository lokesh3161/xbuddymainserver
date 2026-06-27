const ptp    = require('pdf-to-printer')
const fs     = require('fs')
const path   = require('path')
const logger = require('../utils/logger')

const BASE_DIR = path.dirname(process.pkg ? process.execPath : __dirname)
const SUMATRA_SRC = path.join(__dirname, '..', 'node_modules', 'pdf-to-printer', 'dist', 'SumatraPDF-3.4.6-32.exe')
const SUMATRA_DST = path.join(BASE_DIR, 'SumatraPDF-3.4.6-32.exe')

// Extract SumatraPDF next to exe if running as pkg
if (process.pkg && !fs.existsSync(SUMATRA_DST)) {
  try {
    fs.copyFileSync(SUMATRA_SRC, SUMATRA_DST)
    logger.success('SumatraPDF extracted successfully')
  } catch (e) {
    logger.warn('Could not extract SumatraPDF: ' + e.message)
  }
}

/**
 * Get the default printer name on this Windows machine
 */
let printerCache = null
let lastPrinterCheck = 0
const PRINTER_CACHE_TTL = 15000

async function getDefaultPrinter(verbose = true) {
  try {
    const now = Date.now()
    if (printerCache && now - lastPrinterCheck < PRINTER_CACHE_TTL) {
      return printerCache.name
    }

    const printers = await ptp.getPrinters()
    if (printers.length === 0) {
      throw new Error('No printers found on this machine')
    }

    if (verbose) {
      logger.info(`Available printers (${printers.length}):`)
      printers.forEach((p, i) => {
        logger.dim(`  ${i + 1}. ${p.name}`)
      })
    }

    // Return the default printer — prefer real printers over virtual ones
    const realPrinter = printers.find(p => {
      const name = p.name.toLowerCase()
      return !name.includes('onenote') &&
             !name.includes('fax') &&
             !name.includes('xps') &&
             !name.includes('pdf')
    })

    const defaultPrinter = realPrinter || printers[0]
    printerCache = defaultPrinter
    lastPrinterCheck = Date.now()
    return defaultPrinter.name
  } catch (err) {
    logger.error(`Could not get printers: ${err.message}`)
    return null
  }
}

/**
 * Print a PDF file
 * @param {string} filePath  - Local path to the PDF
 * @param {object} options
 * @param {number} options.copies    - Number of copies
 * @param {string} options.printType - "B&W" or "Color"
 * @param {string} options.orderId   - For logging
 */
async function printPdf(filePath, options = {}) {
  const { copies = 1, printType = 'B&W', orderId = '' } = options

  try {
    const printerName = await getDefaultPrinter()
    if (!printerName) throw new Error('No printer available')

    logger.info(`Printing order ${orderId} → ${printerName}`)
    logger.info(`  Copies: ${copies} | Type: ${printType}`)

    const printOptions = {
      printer: printerName,
      copies:  copies,
      silent:  true,
      sumatraPath: fs.existsSync(SUMATRA_DST) ? SUMATRA_DST : undefined,
    }

    // Add grayscale for B&W printing
    if (printType === 'B&W' || printType === 'Black & White') {
      printOptions.monochrome = true
    }

    await ptp.print(filePath, printOptions)

    logger.success(`Print job sent for order ${orderId}`)
    return true
  } catch (err) {
    logger.error(`Print failed for order ${orderId}: ${err.message}`)
    return false
  }
}

module.exports = { printPdf, getDefaultPrinter }
