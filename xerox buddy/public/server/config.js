const fs   = require('fs')
const path = require('path')

const BASE_DIR = process.pkg 
  ? path.dirname(process.execPath)
  : path.dirname(path.resolve(require.main ? require.main.filename : __filename))
const CONFIG_CACHE = path.join(BASE_DIR, 'shop-config.json')

if (!fs.existsSync(CONFIG_CACHE)) {
  console.error('\n  ERROR: shop-config.json not found!')
  console.error('  Please run setup first.\n')
  process.exit(1)
}

module.exports = JSON.parse(fs.readFileSync(CONFIG_CACHE, 'utf8'))
