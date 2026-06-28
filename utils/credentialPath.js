const fs = require('fs')
const path = require('path')

function getProjectRoot(startDir = __dirname) {
  let current = path.resolve(startDir)

  while (true) {
    if (fs.existsSync(path.join(current, 'package.json')) || fs.existsSync(path.join(current, 'index.js'))) {
      return current
    }

    const parent = path.dirname(current)
    if (parent === current) break
    current = parent
  }

  return process.pkg ? path.dirname(process.execPath) : path.resolve(startDir)
}

function getCredentialsPath(startDir = __dirname) {
  const candidates = []

  if (process.env.CREDENTIALS_PATH) {
    candidates.push(path.resolve(process.env.CREDENTIALS_PATH))
  }

  candidates.push(path.join(process.cwd(), 'credentials.json'))

  if (process.execPath) {
    candidates.push(path.join(path.dirname(process.execPath), 'credentials.json'))
  }

  let current = path.resolve(startDir)
  while (true) {
    candidates.push(path.join(current, 'credentials.json'))
    const parent = path.dirname(current)
    if (parent === current) break
    current = parent
  }

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) return candidate
  }

  return path.join(getProjectRoot(startDir), 'credentials.json')
}

module.exports = { getCredentialsPath, getProjectRoot }
