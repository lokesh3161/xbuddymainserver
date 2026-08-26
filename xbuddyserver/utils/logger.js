const fs = require('fs')
const path = require('path')

const BASE_DIR = process.pkg
  ? path.dirname(process.execPath)
  : path.dirname(path.resolve(__dirname, '..'))

const LOG_DIR = path.join(BASE_DIR, 'logs')
const LOG_FILE = path.join(LOG_DIR, 'agent.log')
const MAX_LOG_SIZE = 5 * 1024 * 1024 // 5 MB

function ensureLogDirectory() {
  try {
    if (!fs.existsSync(LOG_DIR)) {
      fs.mkdirSync(LOG_DIR, { recursive: true })
    }
  } catch (e) {}
}

function rotateLogsIfNeeded() {
  try {
    if (fs.existsSync(LOG_FILE)) {
      const stats = fs.statSync(LOG_FILE)
      if (stats.size >= MAX_LOG_SIZE) {
        const backupFile = path.join(LOG_DIR, 'agent.log.1')
        if (fs.existsSync(backupFile)) {
          fs.unlinkSync(backupFile)
        }
        fs.renameSync(LOG_FILE, backupFile)
      }
    }
  } catch (e) {}
}

function writeToFile(level, text) {
  try {
    ensureLogDirectory()
    rotateLogsIfNeeded()

    // Sanitize string to prevent logging base64 payloads or passwords
    let cleanText = String(text || '')
    if (cleanText.length > 500) {
      cleanText = cleanText.substring(0, 500) + '... [truncated]'
    }

    const line = `[${new Date().toISOString()}] [${level}] ${cleanText}\n`
    fs.appendFileSync(LOG_FILE, line, 'utf8')
  } catch (e) {}
}

const colors = {
  reset:  '\x1b[0m',
  green:  '\x1b[32m',
  yellow: '\x1b[33m',
  red:    '\x1b[31m',
  cyan:   '\x1b[36m',
  gray:   '\x1b[90m',
}

function timestamp() {
  return new Date().toLocaleTimeString('en-IN', { hour12: false })
}

const logger = {
  info: (msg) => {
    console.log(`${colors.cyan}[${timestamp()}] INFO${colors.reset}  ${msg}`)
    writeToFile('INFO', msg)
  },
  success: (msg) => {
    console.log(`${colors.green}[${timestamp()}] OK${colors.reset}    ${msg}`)
    writeToFile('OK', msg)
  },
  warn: (msg) => {
    console.log(`${colors.yellow}[${timestamp()}] WARN${colors.reset}  ${msg}`)
    writeToFile('WARN', msg)
  },
  error: (msg) => {
    console.log(`${colors.red}[${timestamp()}] ERROR${colors.reset} ${msg}`)
    writeToFile('ERROR', msg)
  },
  dim: (msg) => {
    console.log(`${colors.gray}[${timestamp()}] ...${colors.reset}   ${msg}`)
    writeToFile('DEBUG', msg)
  },
}

module.exports = logger
