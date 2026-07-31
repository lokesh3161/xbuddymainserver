const test = require('node:test')
const assert = require('node:assert/strict')
const { generateSequentialShopId, generateUniqueLicenseKey } = require('../utilities/idGenerator')

test('generates sequential shop ID correctly', () => {
  const existing = ['SHOP0001', 'SHOP0002', 'SHOP0003']
  const nextId = generateSequentialShopId(existing)
  assert.equal(nextId, 'SHOP0004')
})

test('generates SHOP0001 when list is empty', () => {
  const nextId = generateSequentialShopId([])
  assert.equal(nextId, 'SHOP0001')
})

test('generates unique XB-XXXX-XXXX-XXXX license key', () => {
  const existing = ['XB-AAAA-BBBB-CCCC']
  const key = generateUniqueLicenseKey(existing)
  assert.match(key, /^XB-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/)
  assert.notEqual(key, 'XB-AAAA-BBBB-CCCC')
})
