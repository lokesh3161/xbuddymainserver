/**
 * customerRepository.js
 * Interface for fetching and updating customer records.
 */

const adapter = require('./adapters/GoogleSheetsAdapter')

class CustomerRepository {
  /**
   * Get all customer records
   */
  async getCustomers() {
    const orders = await adapter.fetchAllOrders()
    const customerMap = {}
    
    orders.forEach(o => {
      const phone = o.phoneNumber || o.phone || 'Unknown'
      if (!customerMap[phone]) {
        customerMap[phone] = {
          customerId: `CUST-${phone}`,
          name: o.customerName || o.name || 'Anonymous',
          phoneNumber: phone,
          email: o.email || '',
          totalOrders: 0,
          totalSpent: 0,
          lastOrderDate: o.createdTime || o.timestamp || '',
          notes: ''
        }
      }
      customerMap[phone].totalOrders += 1
      customerMap[phone].totalSpent += (o.totalAmount || o.amount || 0)
    })

    return Object.values(customerMap)
  }
}

module.exports = new CustomerRepository()
