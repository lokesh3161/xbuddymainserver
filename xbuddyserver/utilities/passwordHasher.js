/**
 * passwordHasher.js
 * Zero-dependency password hashing and verification using Node.js built-in crypto.scrypt.
 */

const crypto = require('crypto')

/**
 * Hashes a plaintext password securely
 * @param {string} password 
 * @returns {string} salt:hash format
 */
function hashPassword(password) {
  if (!password || typeof password !== 'string') {
    throw new Error('Password must be a non-empty string')
  }
  const salt = crypto.randomBytes(16).toString('hex')
  const derivedKey = crypto.scryptSync(password, salt, 64)
  return `${salt}:${derivedKey.toString('hex')}`
}

/**
 * Verifies a plaintext password against a stored salt:hash string
 * @param {string} password 
 * @param {string} storedHash 
 * @returns {boolean}
 */
function verifyPassword(password, storedHash) {
  if (!password || !storedHash || !storedHash.includes(':')) {
    return false
  }
  const [salt, keyHex] = storedHash.split(':')
  const keyBuffer = Buffer.from(keyHex, 'hex')
  const derivedKey = crypto.scryptSync(password, salt, 64)
  return crypto.timingSafeEqual(keyBuffer, derivedKey)
}

module.exports = {
  hashPassword,
  verifyPassword
}
