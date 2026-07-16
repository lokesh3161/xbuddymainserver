const fs   = require('fs')
const path = require('path')

function getCredentialsPath(baseDir) {
  const candidates = []

  if (process.env.CREDENTIALS_PATH)
    candidates.push(path.resolve(process.env.CREDENTIALS_PATH))

  if (baseDir) {
    candidates.push(path.join(baseDir, 'credentials', 'credentials.json'))
    candidates.push(path.join(baseDir, 'credentials.json'))
  }

  candidates.push(path.join(process.cwd(), 'credentials', 'credentials.json'))
  candidates.push(path.join(process.cwd(), 'credentials.json'))

  if (process.execPath)
    candidates.push(path.join(path.dirname(process.execPath), 'credentials', 'credentials.json'))

  for (const p of candidates) {
    if (fs.existsSync(p)) return p
  }

  // Return preferred path even if not found yet (will error at auth time with clear message)
  return baseDir
    ? path.join(baseDir, 'credentials', 'credentials.json')
    : path.join(process.cwd(), 'credentials', 'credentials.json')
}

module.exports = { getCredentialsPath }
