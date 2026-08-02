/**
 * printer/index.js
 * Printer service export for XBuddy Shop Package
 */

const { printPdf, getDefaultPrinter } = require('../services/printer')

module.exports = {
  printPdf,
  getDefaultPrinter
}
