const test = require('node:test')
const assert = require('node:assert/strict')
const path = require('path')
const { getCredentialsPath } = require('../utils/credentialPath')

test('uses the application directory for credentials.json', () => {
  const appDir = path.resolve(__dirname, '..')
  assert.equal(getCredentialsPath(appDir), path.join(appDir, 'credentials.json'))
})
