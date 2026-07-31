/**
 * orderRepository.js
 * Encapsulates order operations: createOrder, getOrder, getAllOrders, updatePrintStatus, updatePaymentStatus, cancelOrder
 */

const adapter = require('./adapters/GoogleSheetsAdapter')

class OrderRepository {
  /**
   * Create a new order
   */
  async createOrder(orderData) {
    return await adapter.createOrder(orderData)
  }

  /**
   * Get single order by ID
   */
  async getOrder(orderId) {
    return await adapter.fetchOrder(orderId)
  }

  /**
   * Get waiting orders for printing agent loop
   */
  async getWaitingOrders() {
    return await adapter.fetchWaitingOrders()
  }

  /**
   * Get all orders for reporting/dashboard
   */
  async getAllOrders() {
    return await adapter.fetchAllOrders()
  }

  /**
   * Alias for backward compatibility
   */
  async getOrders() {
    return await adapter.fetchAllOrders()
  }

  /**
   * Update print status of an order
   */
  async updatePrintStatus(orderId, printStatus, releaseStatus) {
    return await adapter.updatePrintStatus(orderId, printStatus, releaseStatus)
  }

  /**
   * Alias for backward compatibility
   */
  async updateStatus(orderId, printStatus, releaseStatus) {
    return await adapter.updatePrintStatus(orderId, printStatus, releaseStatus)
  }

  /**
   * Update payment status of an order
   */
  async updatePaymentStatus(orderId, paymentStatus) {
    return await adapter.updatePaymentStatus(orderId, paymentStatus)
  }

  /**
   * Cancel an order with optional remarks
   */
  async cancelOrder(orderId, remarks) {
    return await adapter.cancelOrder(orderId, remarks)
  }
}

module.exports = new OrderRepository()
