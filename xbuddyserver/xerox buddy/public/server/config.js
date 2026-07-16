const fs   = require('fs')
const path = require('path')

const BASE_DIR = process.pkg
  ? path.dirname(process.execPath)
  : path.dirname(path.resolve(require.main ? require.main.filename : __filename))

// New structure: config/shop-config.json — fallback to root for legacy
const candidates = [
  path.join(BASE_DIR, 'config', 'shop-config.json'),
  path.join(BASE_DIR, 'shop-config.json'),
  path.join(process.cwd(), 'config', 'shop-config.json'),
  path.join(process.cwd(), 'shop-config.json'),
]

const configPath = candidates.find(p => fs.existsSync(p))

if (!configPath) {
  console.error('\n  ERROR: shop-config.json not found!')
  console.error('  Run XBuddy to complete setup first.\n')
  process.exit(1)
}

module.exports = JSON.parse(fs.readFileSync(configPath, 'utf8'))
