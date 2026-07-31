const test = require('node:test')
const assert = require('node:assert/strict')
const path = require('path')
const { getCredentialsPath } = require('../utils/credentialPath')

test('uses the application directory for credentials.json', () => {
  const appDir = path.resolve(__dirname, '..')
  const result = getCredentialsPath(appDir)
  const expectedDefault = path.join(appDir, 'credentials', 'credentials.json')
  const expectedRoot = path.join(appDir, 'credentials.json')
  assert.ok(result === expectedDefault || result === expectedRoot, `Expected ${result} to be inside ${appDir}`)
})
