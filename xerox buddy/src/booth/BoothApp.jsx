import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const SESSION_KEY   = 'xbuddy_booth_auth'
const AGENT_URL     = 'http://localhost:3001'

function isAuthed() { return sessionStorage.getItem(SESSION_KEY) === 'true' }

async function apiPost(path, body) {
  try {
    const res = await fetch(`${AGENT_URL}${path}`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(body),
    })
    return await res.json()
  } catch {
    return { success: false, error: 'Cannot connect to print agent. Is it running?' }
  }
}

// ── PIN Login ─────────────────────────────────────────────────────────────────
function PinLogin({ onSuccess }) {
  const [pin,     setPin]     = useState('')
  const [error,   setError]   = useState('')
  const [loading, setLoading] = useState(false)
  const [shake,   setShake]   = useState(false)
  const inputRef = useRef()

  useEffect(() => { inputRef.current?.focus() }, [])

  async function handleSubmit(e) {
    e.preventDefault()
    if (pin.length < 4) return
    setLoading(true)
    const res = await apiPost('/booth-login', { pin })
    if (res.success) {
      sessionStorage.setItem(SESSION_KEY, 'true')
      onSuccess()
    } else {
      setError(res.error || 'Wrong PIN')
      setPin('')
      setShake(true)
      setTimeout(() => setShake(false), 500)
      inputRef.current?.focus()
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex flex-col items-center justify-center px-4">
      {/* Logo */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3 mb-12"
      >
        <div className="w-12 h-12 rounded-xl bg-purple-600 flex items-center justify-center">
          <span className="text-white font-bold text-xl">X</span>
        </div>
        <div>
          <p className="text-white font-bold text-2xl">X Buddy</p>
          <p className="text-gray-500 text-xs">Printer Booth Terminal</p>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-sm"
      >
        <div className="text-center mb-8">
          <div className="w-20 h-20 rounded-full bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mx-auto mb-4">
            <span className="text-4xl">🔐</span>
          </div>
          <h2 className="text-2xl font-bold text-white">Shopkeeper Access</h2>
          <p className="text-gray-500 text-sm mt-1">Enter your PIN to unlock the booth</p>
        </div>

        <motion.form
          onSubmit={handleSubmit}
          animate={shake ? { x: [-8, 8, -6, 6, 0] } : {}}
          transition={{ duration: 0.4 }}
          className="glass rounded-2xl p-6 space-y-4 border border-white/10"
        >
          <input
            ref={inputRef}
            type="password"
            value={pin}
            onChange={(e) => { setPin(e.target.value); setError('') }}
            placeholder="Enter PIN"
            maxLength={8}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-4 text-white text-2xl font-mono tracking-[0.5em] placeholder-gray-700 focus:outline-none focus:border-purple-500 transition-colors text-center"
          />

          <AnimatePresence>
            {error && (
              <motion.p
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2 text-center"
              >
                ⚠️ {error}
              </motion.p>
            )}
          </AnimatePresence>

          <button
            type="submit"
            disabled={loading || pin.length < 4}
            className="w-full py-4 bg-purple-600 hover:bg-purple-500 disabled:bg-purple-900 disabled:cursor-not-allowed text-white font-bold text-lg rounded-xl transition-all flex items-center justify-center gap-2"
          >
            {loading
              ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              : '🔓 Unlock Booth'
            }
          </button>
        </motion.form>
      </motion.div>
    </div>
  )
}

// ── Release Panel ─────────────────────────────────────────────────────────────
function ReleasePrint({ onLock }) {
  const [orderId,  setOrderId]  = useState('')
  const [loading,  setLoading]  = useState(false)
  const [result,   setResult]   = useState(null)
  const [lastPrint, setLastPrint] = useState(null)
  const [time,     setTime]     = useState(new Date())
  const inputRef  = useRef()

  // Clock
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  // Auto-focus input
  useEffect(() => { inputRef.current?.focus() }, [])

  async function handleRelease(e) {
    e.preventDefault()
    const id = orderId.trim().toUpperCase()
    if (!id) return
    setLoading(true)
    setResult(null)
    const res = await apiPost('/release-print', { orderId: id })
    setResult(res)
    setLoading(false)
    if (res.success) {
      setLastPrint({ orderId: id, time: new Date().toLocaleTimeString() })
      setOrderId('')
    }
    // Re-focus after result
    setTimeout(() => inputRef.current?.focus(), 300)
  }

  function handleLock() {
    sessionStorage.removeItem(SESSION_KEY)
    onLock()
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between px-8 py-4 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-purple-600 flex items-center justify-center">
            <span className="text-white font-bold">X</span>
          </div>
          <div>
            <p className="text-white font-bold text-sm">X Buddy Booth</p>
            <p className="text-gray-600 text-xs">Printer Terminal</p>
          </div>
        </div>
        <div className="flex items-center gap-6">
          <div className="text-right">
            <p className="text-white font-mono text-lg">{time.toLocaleTimeString()}</p>
            <p className="text-gray-600 text-xs">{time.toLocaleDateString()}</p>
          </div>
          <button
            onClick={handleLock}
            className="px-4 py-2 rounded-lg text-xs font-semibold bg-white/5 text-gray-400 hover:bg-red-500/20 hover:text-red-400 transition-all border border-white/10"
          >
            🔒 Lock
          </button>
        </div>
      </div>

      {/* Main */}
      <div className="flex-1 flex flex-col items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-lg"
        >
          {/* Title */}
          <div className="text-center mb-10">
            <div className="w-20 h-20 rounded-full bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mx-auto mb-4">
              <span className="text-4xl">🖨️</span>
            </div>
            <h1 className="text-3xl font-bold text-white">Release Print</h1>
            <p className="text-gray-500 mt-2">Enter the student's Order ID to start printing</p>
          </div>

          {/* Form */}
          <form onSubmit={handleRelease} className="space-y-4">
            <input
              ref={inputRef}
              type="text"
              value={orderId}
              onChange={(e) => { setOrderId(e.target.value.toUpperCase()); setResult(null) }}
              placeholder="XB0000"
              maxLength={8}
              className="w-full bg-white/5 border-2 border-white/10 rounded-2xl px-6 py-5 text-white text-4xl font-mono tracking-[0.3em] placeholder-gray-800 focus:outline-none focus:border-purple-500 transition-colors text-center uppercase"
            />

            <AnimatePresence mode="wait">
              {result && (
                <motion.div
                  key={result.success ? 'ok' : 'err'}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className={`p-4 rounded-2xl text-base font-semibold flex items-center justify-center gap-3 ${
                    result.success
                      ? 'bg-green-500/15 border border-green-500/30 text-green-400'
                      : 'bg-red-500/15 border border-red-500/30 text-red-400'
                  }`}
                >
                  <span className="text-2xl">{result.success ? '✅' : '⚠️'}</span>
                  <span>{result.success ? result.message : result.error}</span>
                </motion.div>
              )}
            </AnimatePresence>

            <motion.button
              type="submit"
              disabled={loading || !orderId.trim()}
              whileHover={{ scale: loading ? 1 : 1.02 }}
              whileTap={{ scale: loading ? 1 : 0.97 }}
              className="w-full py-5 bg-purple-600 hover:bg-purple-500 disabled:bg-purple-900 disabled:cursor-not-allowed text-white font-bold text-xl rounded-2xl transition-all flex items-center justify-center gap-3"
            >
              {loading ? (
                <>
                  <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Verifying & Printing...
                </>
              ) : '🖨️ Release Print'}
            </motion.button>
          </form>

          {/* Last printed */}
          <AnimatePresence>
            {lastPrint && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6 p-4 rounded-2xl bg-white/3 border border-white/5 flex items-center justify-between"
              >
                <div>
                  <p className="text-gray-500 text-xs">Last printed</p>
                  <p className="text-white font-mono font-semibold">{lastPrint.orderId}</p>
                </div>
                <p className="text-gray-600 text-xs">{lastPrint.time}</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Status legend */}
          <div className="mt-8 grid grid-cols-3 gap-3">
            {[
              ['✅', 'Valid Order', 'Prints immediately'],
              ['⚠️', 'Wrong ID',    'Rejected'],
              ['🔒', 'Duplicate',   'Blocked'],
            ].map(([icon, label, desc]) => (
              <div key={label} className="text-center p-3 rounded-xl bg-white/3 border border-white/5">
                <p className="text-xl mb-1">{icon}</p>
                <p className="text-white text-xs font-medium">{label}</p>
                <p className="text-gray-600 text-xs">{desc}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Footer */}
      <div className="text-center py-4 border-t border-white/5">
        <p className="text-gray-700 text-xs">X Buddy Booth Terminal</p>
      </div>
    </div>
  )
}

// ── Root ──────────────────────────────────────────────────────────────────────
export default function BoothApp() {
  const [authed, setAuthed] = useState(isAuthed)
  return authed
    ? <ReleasePrint onLock={() => setAuthed(false)} />
    : <PinLogin     onSuccess={() => setAuthed(true)} />
}
