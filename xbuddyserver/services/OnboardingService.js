/**
 * OnboardingService.js
 * Business logic for customer registration and pending setup management.
 */

const registryRepository = require('../repositories/registryRepository')
const { hashPassword }     = require('../utilities/passwordHasher')
const { successResponse, errorResponse } = require('../utilities/responseFormatter')

class OnboardingService {
  /**
   * Registers a new shop owner account with password hashing
   * Status = 'Pending Setup'
   * @param {object} registrationData 
   * @param {string} masterGasUrl 
   */
  async registerShopOwner(registrationData, masterGasUrl) {
    try {
      const { shopName, ownerName, phone, email, password } = registrationData

      if (!shopName || !ownerName || !email || !password) {
        return errorResponse('Shop Name, Owner Name, Email, and Password are required.')
      }

      if (password.length < 6) {
        return errorResponse('Password must be at least 6 characters long.')
      }

      // Hash password securely before storage (scrypt)
      const hashedPassword = hashPassword(password)

      const res = await registryRepository.registerCustomer({
        shopName,
        ownerName,
        phone: phone || '',
        email,
        password: hashedPassword
      }, masterGasUrl)

      if (res && res.success) {
        return successResponse({
          signupId: res.data?.signupId || res.signupId,
          shopName,
          ownerName,
          email,
          status: 'Pending Setup',
          message: 'Registration successful! Your account is pending founder provisioning.'
        })
      }

      return errorResponse(res?.error || 'Registration failed.')
    } catch (err) {
      return errorResponse(`Registration error: ${err.message}`)
    }
  }

  /**
   * Get all pending customer signups awaiting founder provisioning
   */
  async getPendingSignups(masterGasUrl) {
    try {
      const signups = await registryRepository.getPendingSignups(masterGasUrl)
      return successResponse({ signups })
    } catch (err) {
      return errorResponse(`Failed to fetch pending signups: ${err.message}`)
    }
  }
}

module.exports = new OnboardingService()
