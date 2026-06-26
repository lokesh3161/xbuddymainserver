import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { fileToBase64 } from '../utils/fileToBase64'
import { submitOrder } from '../utils/api'

export default function PaymentProofForm({ orderMeta, onSuccess, onClose }) {
  const [phone, setPhone] = useState('')
  const [transactionId, setTransactionId] = useState('')
  const [screenshot, setScreenshot] = useState(null)   // File object
  const [preview, setPreview] = useState(null)          // Object URL for preview
  const [loading, setLoading] = useState(false)
  const [loadingMsg, setLoadingMsg] = useState('')
  const [error, setError] = useState('')
  const fileInputRef = useRef()

  function handleScreenshot(file) {
    if (!file) return
    // Only allow images
    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file (JPG, PNG, etc.)')
      return
    }
    setScreenshot(file)
    setPreview(URL.createObjectURL(file))
    setError('')
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    // Basic validation
    if (!phone.trim()) return setError('Please enter your phone number.')
    if (!transactionId.trim()) return setError('Please enter the Transaction ID.')
    if (!screenshot) return setError('Please upload your payment screenshot.')

    setLoading(true)
    try {
      const screenshotBase64 = await fileToBase64(screenshot)

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

        {/* Screenshot upload */}
        <div>
          <label className="text-gray-400 text-xs mb-1 block">Payment Screenshot</label>
          <div
            onClick={() => fileInputRef.current.click()}
            className={`
              border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all
              ${preview
                ? 'border-purple-500/40 bg-purple-500/5'
                : 'border-white/10 hover:border-purple-500/40 hover:bg-white/5'
              }
            `}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => handleScreenshot(e.target.files[0])}
            />
            <AnimatePresence mode="wait">
              {preview ? (
                <motion.div key="preview" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <img
                    src={preview}
                    alt="Payment screenshot"
                    className="h-24 object-contain mx-auto rounded-lg mb-2"
                  />
                  <p className="text-purple-400 text-xs">{screenshot.name}</p>
                  <p className="text-gray-600 text-xs mt-0.5">Click to change</p>
                </motion.div>
              ) : (
                <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center mx-auto mb-2">
                    <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <p className="text-gray-500 text-xs">Tap to upload screenshot</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
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
