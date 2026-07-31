/**
 * analyticsRepository.js
 * Computes daily summary & analytics rollups for shop owner reporting.
 */

const adapter = require('./adapters/GoogleSheetsAdapter')

class AnalyticsRepository {
  /**
   * Compute per-shop live analytics rollup
   */
  async getAnalytics() {
    const orders = await adapter.fetchAllOrders()
    const todayStr = new Date().toISOString().split('T')[0]

    let totalOrders = orders.length
    let todayOrders = 0
    let completedOrders = 0
    let pendingOrders = 0
    let cancelledOrders = 0
    let failedOrders = 0
    let totalRevenue = 0
    let todayRevenue = 0
    let totalPagesPrinted = 0
    const customerSet = new Set()

    orders.forEach(o => {
      const amt = o.totalAmount || o.amount || 0
      totalRevenue += amt

      const pStatus = o.printStatus || 'Waiting'
      if (pStatus === 'Printed' || pStatus === 'Completed') {
        completedOrders++
        totalPagesPrinted += (o.totalPages || 1) * (o.copies || 1)
      } else if (pStatus === 'Cancelled') {
        cancelledOrders++
      } else if (pStatus === 'Failed') {
        failedOrders++
      } else {
        pendingOrders++
      }

      if (o.phoneNumber || o.phone) {
        customerSet.add(o.phoneNumber || o.phone)
      }

      const created = o.createdTime || o.timestamp || ''
      if (created.startsWith(todayStr)) {
        todayOrders++
        todayRevenue += amt
      }
    })

    const avgOrderValue = totalOrders > 0 ? parseFloat((totalRevenue / totalOrders).toFixed(2)) : 0

    return {
      totalOrders,
      todayOrders,
      completedOrders,
      pendingOrders,
      cancelledOrders,
      failedOrders,
      totalRevenue,
      todayRevenue,
      averageOrderValue: avgOrderValue,
      totalCustomers: customerSet.size,
      totalPagesPrinted
    }
  }
}

module.exports = new AnalyticsRepository()
