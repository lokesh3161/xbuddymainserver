/**
 * onboardingController.js
 * Controller layer for handling HTTP customer signup & pending onboarding requests.
 * Section 12 Clean Architecture.
 */

const onboardingService = require('../services/OnboardingService')
const { errorResponse }  = require('../utilities/responseFormatter')

class OnboardingController {
  /**
   * Handle POST /api/register
   */
  async handleRegister(req, res) {
    try {
      const { shopName, ownerName, phone, email, password, masterGasUrl } = req.body || {}

      // Controller input validation
      if (!shopName || !ownerName || !email || !password) {
        return res.status(400).json(errorResponse('Missing required fields: shopName, ownerName, email, password'))
      }

      const result = await onboardingService.registerShopOwner({
        shopName,
        ownerName,
        phone,
        email,
        password
      }, masterGasUrl)

      if (result.success) {
        return res.status(201).json(result)
      }
      return res.status(400).json(result)
    } catch (err) {
      return res.status(500).json(errorResponse(`Server error: ${err.message}`))
    }
  }

  /**
   * Handle GET /api/pending-signups
   */
  async handleGetPending(req, res) {
    try {
      const masterGasUrl = req.query?.masterGasUrl || ''
      const result = await onboardingService.getPendingSignups(masterGasUrl)
      return res.status(200).json(result)
    } catch (err) {
      return res.status(500).json(errorResponse(`Server error: ${err.message}`))
    }
  }
}

module.exports = new OnboardingController()
