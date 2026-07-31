const test = require('node:test')
const assert = require('node:assert/strict')
const { hashPassword, verifyPassword } = require('../utilities/passwordHasher')

test('hashes and verifies password correctly', () => {
  const password = 'SecretPassword123!'
  const hash = hashPassword(password)
  assert.ok(hash.includes(':'))
  assert.ok(verifyPassword(password, hash))
  assert.ok(!verifyPassword('WrongPassword', hash))
})
