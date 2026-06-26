import { motion, AnimatePresence } from 'framer-motion'
import PaymentProofForm from './PaymentProofForm'

export default function PaymentModal({ total, orderMeta, onSuccess, onClose }) {
  return (
    <AnimatePresence>
      {/* Backdrop */}
      <motion.div
        key="backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40"
      />

      {/* Modal */}
      <motion.div
        key="modal"
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="glass rounded-3xl p-6 w-full max-w-sm border border-purple-500/30 glow-purple max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-xl font-bold text-white">Scan & Pay</h3>
              <p className="text-gray-500 text-sm">Use any UPI app to pay</p>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-gray-400 transition-all"
            >
              ✕
            </button>
          </div>

          {/* Amount badge */}
          <div className="text-center mb-4">
            <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-purple-500/20 border border-purple-500/30">
              <span className="text-gray-400 text-sm">Amount:</span>
              <span className="text-purple-400 font-extrabold text-2xl">₹{total}</span>
            </div>
          </div>

          {/* QR Code */}
          <div className="bg-white rounded-2xl p-3 mb-3 mx-auto w-fit">
            <img
              src="/qr-code.png"
              alt="PhonePe QR Code"
              className="w-44 h-44 object-contain"
              onError={(e) => {
                e.target.style.display = 'none'
                e.target.nextSibling.style.display = 'flex'
              }}
            />
            <div
              style={{ display: 'none' }}
              className="w-44 h-44 flex flex-col items-center justify-center bg-gray-100 rounded-xl text-gray-400 text-center p-4"
            >
              <p className="text-xs font-medium">Place QR image at</p>
              <p className="text-xs font-mono mt-1">public/qr-code.png</p>
            </div>
          </div>

          <p className="text-center text-gray-500 text-xs mb-2">
            Pay using PhonePe · GPay · Paytm · BHIM
          </p>

          {/* Payment proof form — shown below QR */}
          <PaymentProofForm
            orderMeta={orderMeta}
            onSuccess={onSuccess}
            onClose={onClose}
          />
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
