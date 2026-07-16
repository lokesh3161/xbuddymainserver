const { google } = require('googleapis')
const path   = require('path')
const logger = require('../utils/logger')
const { getCredentialsPath } = require('../utils/credentialPath')
const { sheetId: SPREADSHEET_ID } = require('../config')

const SHEET_NAME = 'Sheet1'
const BASE_DIR = process.pkg
  ? path.dirname(process.execPath)
  : path.dirname(path.resolve(require.main ? require.main.filename : __filename))

let _credsMissing = false

function getAuth() {
  const keyFile = getCredentialsPath(BASE_DIR)
  if (!require('fs').existsSync(keyFile)) {
    if (!_credsMissing) {
      _credsMissing = true
      logger.warn('credentials.json not found — status updates disabled.')
    }
    return null
  }
  _credsMissing = false
  return new google.auth.GoogleAuth({
    keyFile,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  })
}

// Update Print Status column K
async function updatePrintStatus(rowIndex, status) {
  const auth = getAuth()
  if (!auth) return
  try {
    const sheets = google.sheets({ version: 'v4', auth })

    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_NAME}!K${rowIndex}`,
      valueInputOption: 'RAW',
      requestBody: { values: [[status]] },
    })

    logger.success(`Row ${rowIndex} → Print Status: "${status}"`)
  } catch (err) {
    logger.error(`Failed to update status row ${rowIndex}: ${err.message}`)
  }
}

// Update PDF URL column M
async function updatePdfUrl(rowIndex, pdfUrl) {
  const auth = getAuth()
  if (!auth) return
  try {
    const sheets = google.sheets({ version: 'v4', auth })

    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_NAME}!M${rowIndex}`,
      valueInputOption: 'RAW',
      requestBody: { values: [[pdfUrl]] },
    })

    logger.success(`Row ${rowIndex} → PDF URL saved to column M`)
  } catch (err) {
    logger.error(`Failed to update PDF URL row ${rowIndex}: ${err.message}`)
  }
}

// Update Screenshot URL column I
async function updateScreenshotUrl(rowIndex, url) {
  const auth = getAuth()
  if (!auth) return
  try {
    const sheets = google.sheets({ version: 'v4', auth })
    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_NAME}!I${rowIndex}`,
      valueInputOption: 'RAW',
      requestBody: { values: [[url]] },
    })
    logger.success(`Row ${rowIndex} → Screenshot URL saved to column I`)
  } catch (err) {
    logger.error(`Failed to update screenshot URL: ${err.message}`)
  }
}

// Update Release Status column N
async function updateReleaseStatus(rowIndex, status) {
  const auth = getAuth()
  if (!auth) return
  try {
    const sheets = google.sheets({ version: 'v4', auth })
    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_NAME}!N${rowIndex}`,
      valueInputOption: 'RAW',
      requestBody: { values: [[status]] },
    })
    logger.success(`Row ${rowIndex} → Release Status: "${status}"`)
  } catch (err) {
    logger.error(`Failed to update release status row ${rowIndex}: ${err.message}`)
  }
}

module.exports = { updatePrintStatus, updatePdfUrl, updateScreenshotUrl, updateReleaseStatus }
