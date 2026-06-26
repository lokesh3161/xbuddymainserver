import { useEffect, useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const API_URL =
  'https://script.google.com/macros/s/AKfycby8ykWErzVD79TrafdArCmA6i9YipHVZOjw7zFWDjpL1e44HlKORx-GAnCuGGYgcmyB/exec'

const OFFLINE_TIMEOUT_MS = 30000
const POLL_INTERVAL_MS   = 5000

const STAGES = [
  { id: 'paid',     label: 'Payment Confirmed', icon: '✅', desc: 'Your payment has been verified'           },
  { id: 'queued',   label: 'Order Queued',       icon: '📋', desc: 'Your document is saved and ready'        },
  { id: 'printing', label: 'Printing',           icon: '🖨️', desc: 'Printing your document...'              },
  { id: 'done',     label: 'Completed',          icon: '🎉', desc: 'Collect your document from the printer!' },
]

function statusToStage(status) {
  switch (status) {
    case 'Printing': return 2
    case 'Printed':  return 3
    case 'Failed':   return 3
    default:         return 1
  }
}

export default function PrintStatus({ fileInfo, settings, orderId, onReset }) {
  const [stageIndex,    setStageIndex]    = useState(0)
  const [progress,      setProgress]      = useState(0)
  const [serverOffline, setServerOffline] = useState(false)
  const [printFailed,   setPrintFailed]   = useState(false)
  const [lastChecked,   setLastChecked]   = useState(null)

  const pollRef    = useRef(null)
  const offlineRef = useRef(null)
  const statusRef  = useRef('Waiting')

  // Poll Google Sheets for real print status
  useEffect(() => {
    if (!orderId) return

    // Show offline warning after 30s if still Waiting
    offlineRef.current = setTimeout(() => {
      if (statusRef.current === 'Waiting') {
        setServerOffline(true)
      }
    }, OFFLINE_TIMEOUT_MS)

    async function checkStatus() {
      try {
        const res  = await fetch(`${API_URL}?action=getOrderStatus&orderId=${orderId}`)
        const data = await res.json()

        if (data.success && data.printStatus) {
          const status = data.printStatus
          statusRef.current = status
          setLastChecked(new Date().toLocaleTimeString())
          setStageIndex(statusToStage(status))

          if (status !== 'Waiting') {
            setServerOffline(false)
            clearTimeout(offlineRef.current)
          }

          if (status === 'Failed') {
            setPrintFailed(true)
            clearInterval(pollRef.current)
            return
          }

          if (status === 'Printed') {
            clearInterval(pollRef.current)
          }
        }
      } catch {
        // wait for offline timeout
      }
    }

    checkStatus()
    pollRef.current = setInterval(checkStatus, POLL_INTERVAL_MS)

    return () => {
      clearInterval(pollRef.current)
      clearTimeout(offlineRef.current)
    }
  }, [orderId])

  // Animate progress bar
  useEffect(() => {
    const target = ((stageIndex + 1) / STAGES.length) * 100
    const step   = (target - progress) / 20
    let current  = progress
    const interval = setInterval(() => {
      current += step
      if (current >= target) {
        setProgress(target)
        clearInterval(interval)
      } else {
        setProgress(current)
      }
    }, 30)
    return () => clearInterval(interval)
  }, [stageIndex])

  const isDone = stageIndex === STAGES.length - 1

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-2xl mx-auto px-4 py-8"
    >
      {/* Header */}
      <div className="text-center mb-8">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', damping: 15 }}
          className="w-16 h-16 rounded-full bg-green-500/20 border border-green-500/30 flex items-center justify-center mx-auto mb-4"
        >
          <svg className="w-8 h-8 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </motion.div>
        <h2 className="text-2xl font-bold text-white">Order Confirmed!</h2>
        <p className="text-gray-500 text-sm mt-1">Go to the printer booth to release your print</p>
        {orderId && (
          <div className="inline-flex items-center gap-2 mt-3 px-4 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/20">
            <span className="text-gray-500 text-xs">Order ID:</span>
            <span className="text-purple-400 font-mono text-xs font-semibold">{orderId}</span>
          </div>
        )}
      </div>

      {/* Go to booth instruction */}
      <AnimatePresence>
        {stageIndex < 2 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mb-4 p-4 rounded-2xl bg-purple-500/10 border border-purple-500/30 flex items-start gap-3"
          >
            <span className="text-xl">🏪</span>
            <div>
              <p className="text-purple-300 font-semibold text-sm">Go to the Printer Booth</p>
              <p className="text-gray-400 text-xs mt-1">
                Show your Order ID at the booth. The shopkeeper will enter it to release your print.
              </p>
              <p className="text-gray-500 text-xs mt-1">
                Order ID: <span className="font-mono text-purple-400 font-bold">{orderId}</span>
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Server offline warning */}
      <AnimatePresence>
        {serverOffline && !isDone && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mb-4 p-4 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-start gap-3"
          >
            <span className="text-xl">⚠️</span>
            <div>
              <p className="text-red-400 font-semibold text-sm">Could not connect to print server</p>
              <p className="text-gray-500 text-xs mt-1">
                The print agent appears to be offline. Your order is saved and will print automatically once the server is back online.
              </p>
              <p className="text-gray-600 text-xs mt-1">
                Please inform the shopkeeper — Order ID: <span className="font-mono text-purple-400">{orderId}</span>
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Print failed warning */}
      <AnimatePresence>
        {printFailed && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mb-4 p-4 rounded-2xl bg-orange-500/10 border border-orange-500/30 flex items-start gap-3"
          >
            <span className="text-xl">🖨️</span>
            <div>
              <p className="text-orange-400 font-semibold text-sm">Print job failed</p>
              <p className="text-gray-500 text-xs mt-1">
                There was an issue with the printer. Please show your Order ID to the shopkeeper.
              </p>
              <p className="text-gray-600 text-xs mt-1">
                Order ID: <span className="font-mono text-purple-400">{orderId}</span>
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Print job card */}
      <div className="glass rounded-2xl p-6 mb-6">
        {/* File info */}
        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/10">
          <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
            <span className="text-lg">📄</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white font-medium truncate">{fileInfo.name}</p>
            <p className="text-gray-500 text-xs">
              {fileInfo.totalPages} pages · {settings.colorMode === 'color' ? 'Color' : 'B&W'} · {settings.sideMode === 'double' ? 'Double' : 'Single'} side · {settings.copies} {settings.copies > 1 ? 'copies' : 'copy'}
            </p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mb-6">
          <div className="flex justify-between text-xs text-gray-500 mb-2">
            <span>Print Progress</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="h-2 bg-white/10 rounded-full overflow-hidden">
            <motion.div
              className={`h-full rounded-full bg-gradient-to-r ${
                serverOffline && !isDone
                  ? 'from-red-600 to-red-400'
                  : 'from-purple-600 to-purple-400'
              }`}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>

        {/* Stages */}
        <div className="space-y-3">
          {STAGES.map((stage, i) => {
            const isActive   = i === stageIndex
            const isComplete = i < stageIndex
            return (
              <motion.div
                key={stage.id}
                initial={{ opacity: 0.4 }}
                animate={{ opacity: isActive || isComplete ? 1 : 0.3 }}
                className={`flex items-center gap-3 p-3 rounded-xl transition-all ${
                  isActive ? 'bg-purple-500/10 border border-purple-500/20' : ''
                }`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm flex-shrink-0 ${
                  isComplete ? 'bg-green-500/20 border border-green-500/30' :
                  isActive   ? 'bg-purple-500/20 border border-purple-500/30' :
                  'bg-white/5 border border-white/10'
                }`}>
                  {isComplete ? '✓' : stage.icon}
                </div>
                <div className="flex-1">
                  <p className={`text-sm font-medium ${
                    isComplete ? 'text-green-400' :
                    isActive   ? 'text-white' : 'text-gray-600'
                  }`}>
                    {stage.label}
                    {isActive && !isDone && (
                      <span className="ml-2 inline-flex gap-0.5">
                        {[0, 1, 2].map(d => (
                          <motion.span
                            key={d}
                            animate={{ opacity: [0.3, 1, 0.3] }}
                            transition={{ duration: 1, repeat: Infinity, delay: d * 0.2 }}
                            className="w-1 h-1 rounded-full bg-purple-400 inline-block"
                          />
                        ))}
                      </span>
                    )}
                  </p>
                  {isActive && (
                    <p className="text-xs text-gray-500 mt-0.5">{stage.desc}</p>
                  )}
                </div>
              </motion.div>
            )
          })}
        </div>

        {lastChecked && (
          <p className="text-gray-700 text-xs mt-4 text-right">Last checked: {lastChecked}</p>
        )}
      </div>

      {/* Done state */}
      <AnimatePresence>
        {isDone && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <p className="text-green-400 font-semibold text-lg mb-1">🎉 Printing Completed!</p>
            <p className="text-gray-500 text-sm mb-2">Please collect your document from the printer.</p>
            {orderId && (
              <p className="text-gray-600 text-xs mb-6 font-mono">Order ID: {orderId}</p>
            )}
            <button
              onClick={onReset}
              className="px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white font-semibold rounded-xl transition-all"
            >
              Print Another Document
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.section>
  )
}
