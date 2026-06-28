const fs   = require('fs')
const path = require('path')

function findConfigPath() {
  const candidates = []

  if (process.pkg) {
    candidates.push(path.dirname(process.execPath))
  }

  if (require.main && require.main.filename) {
    candidates.push(path.dirname(path.resolve(require.main.filename)))
  }

  candidates.push(process.cwd())
  candidates.push(path.resolve(__dirname))

  for (const dir of candidates) {
    const configPath = path.join(dir, 'shop-config.json')
    if (fs.existsSync(configPath)) return configPath
  }

  return null
}

const CONFIG_CACHE = findConfigPath()

if (!CONFIG_CACHE) {
  console.error('\n  ERROR: shop-config.json not found!')
  console.error('  Please run setup first.\n')
  process.exit(1)
}

module.exports = JSON.parse(fs.readFileSync(CONFIG_CACHE, 'utf8'))
