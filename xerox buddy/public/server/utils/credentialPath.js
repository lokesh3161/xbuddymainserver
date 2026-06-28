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
  const projectRoot = getProjectRoot(startDir)
  return path.join(projectRoot, 'credentials.json')
}

module.exports = { getCredentialsPath, getProjectRoot }
