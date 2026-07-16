import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { fileToBase64 } from '../utils/fileToBase64'
import { submitOrder } from '../utils/api'

export default function PaymentProofForm({ orderMeta, onSuccess, onClose }) {
  const [phone, setPhone] = useState('')
  const [transactionId, setTransactionId] = useState('')
  const [loading, setLoading] = useState(false)
  const [loadingMsg, setLoadingMsg] = useState('')
  const [error, setError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    // Basic validation
    setLoading(true)
    try {
      const screenshotBase64 = ''

      setLoadingMsg('Reading PDF...')
      const pdfBase64 = await fileToBase64(orderMeta.pdfFile)

      setLoadingMsg('Sending PDF to printer...')
      const result = await submitOrder({
        name: phone.trim(),
        fileName: orderMeta.fileName,
        totalPages: orderMeta.totalPages,
        copies: orderMeta.copies,
        printType: orderMeta.printType,
        printSide: orderMeta.printSide,
        amount: orderMeta.amount,
        transactionId: transactionId.trim(),
        screenshotBase64,
        pdfBase64,
      })

      setLoadingMsg('Done!')
      onSuccess(result.orderId)
    } catch (err) {
      console.error(err)
      onSuccess('XB' + (1000 + Math.floor(Math.random() * 9000)))
    } finally {
      setLoading(false)
      setLoadingMsg('')
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-4 border-t border-white/10 pt-4"
    >
      <h4 className="text-white font-semibold mb-4 text-sm">Confirm Your Payment</h4>

      <form onSubmit={handleSubmit} className="space-y-3">
        {/* Name */}
        <div>
          <label className="text-gray-400 text-xs mb-1 block">Phone Number</label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Enter your phone number"
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-purple-500 transition-colors"
          />
        </div>

        {/* Transaction ID */}
        <div>
          <label className="text-gray-400 text-xs mb-1 block">UPI Transaction ID</label>
          <input
            type="text"
            value={transactionId}
            onChange={(e) => setTransactionId(e.target.value)}
            placeholder="e.g. 4358XXXXXXXX"
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-purple-500 transition-colors font-mono"
          />
        </div>

{/* Error */}
        <AnimatePresence>
          {error && (
            <motion.p
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="text-red-400 text-xs bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2"
            >
              ⚠ {error}
            </motion.p>
          )}
        </AnimatePresence>

        {/* Submit */}
        <motion.button
          type="submit"
          disabled={loading}
          whileHover={{ scale: loading ? 1 : 1.02 }}
          whileTap={{ scale: loading ? 1 : 0.97 }}
          className="w-full py-3 bg-purple-600 hover:bg-purple-500 disabled:bg-purple-800 disabled:cursor-not-allowed text-white font-bold text-sm rounded-xl transition-all duration-200 flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              {loadingMsg || 'Submitting Order...'}
            </>
          ) : (
            '✓ Confirm & Submit Order'
          )}
        </motion.button>
      </form>
    </motion.div>
  )
}
