const test = require('node:test')
const assert = require('node:assert')
const { normalizeOrderId } = require('../services/sheets')

test('normalizes order IDs case-insensitively and trims whitespace', () => {
  assert.equal(normalizeOrderId(' xb1587 '), 'XB1587')
  assert.equal(normalizeOrderId('xb1587'), 'XB1587')
  assert.equal(normalizeOrderId('XB-1587'), 'XB-1587')
})
