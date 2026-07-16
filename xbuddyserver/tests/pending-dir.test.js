const test = require('node:test')
const assert = require('node:assert')
const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')
const { ensureDirectory } = require('../services/localServer')

test('creates a directory when it does not already exist', () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'xbuddy-pending-'))
  const target = path.join(tempDir, 'downloads')

  assert.equal(fs.existsSync(target), false)
  ensureDirectory(target)
  assert.equal(fs.existsSync(target), true)
})
