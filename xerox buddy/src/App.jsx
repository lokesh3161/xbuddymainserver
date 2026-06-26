import { useState, useRef } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import Hero from './components/Hero'
import UploadSection from './components/UploadSection'
import PrintSettings from './components/PrintSettings'
import PriceCard from './components/PriceCard'
import PaymentModal from './components/PaymentModal'
import PrintStatus from './components/PrintStatus'
import AcademicToolkit from './components/AcademicToolkit'
import { calcTotal } from './utils/pricing'
import * as pdfjsLib from 'pdfjs-dist'
// Use the same local bundled worker as UploadSection — avoids CDN version mismatch
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString()

import ResumeBuilder from './resume-builder/ResumeBuilder'
import AdminDashboard from './components/AdminDashboard'

const STEP = { HERO: 'hero', UPLOAD: 'upload', SETTINGS: 'settings', PRINTING: 'printing', RESUME: 'resume' }
const DEFAULT_SETTINGS = { colorMode: 'bw', sideMode: 'single', copies: 1 }

async function getPageCountFromFile(file) {
  const buffer = await file.arrayBuffer()
  const pdf    = await pdfjsLib.getDocument({ data: buffer }).promise
  return pdf.numPages
}

export default function App() {
  const [step, setStep]           = useState(STEP.HERO)
  const [fileInfo, setFileInfo]   = useState(null)
  const [settings, setSettings]   = useState(DEFAULT_SETTINGS)
  const [showPayment, setShowPayment] = useState(false)
  const [orderId, setOrderId]     = useState(null)
  const settingsRef = useRef(null)

  const total = fileInfo
    ? calcTotal({
        totalPages: fileInfo.totalPages,
        colorMode: settings.colorMode,
        isDoubleSide: settings.sideMode === 'double',
        copies: settings.copies,
      })
    : 0

  const orderMeta = fileInfo
    ? {
        fileName: fileInfo.name,
        totalPages: fileInfo.totalPages,
        copies: settings.copies,
        printType: settings.colorMode === 'color' ? 'Color' : 'B&W',
        printSide: settings.sideMode === 'double' ? 'Double' : 'Single',
        amount: total,
        pdfFile: fileInfo.file,
      }
    : null

  async function handleFileReady(info) {
    setFileInfo(info)
    setStep(STEP.SETTINGS)
    setTimeout(() => settingsRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
  }

  // Called when user clicks Print on a Quick Form (URL) or Letter Generator (File)
  async function handleExternalPrint(fileOrUrl, name) {
    let file
    if (typeof fileOrUrl === 'string') {
      // Quick Form — fetch PDF from public/forms/
      const res    = await fetch(fileOrUrl)
      const blob   = await res.blob()
      file = new File([blob], name + '.pdf', { type: 'application/pdf' })
    } else {
      file = fileOrUrl
    }
    const totalPages = await getPageCountFromFile(file)
    setFileInfo({ file, name: file.name, totalPages })
    setStep(STEP.SETTINGS)
    window.scrollTo({ top: 0, behavior: 'smooth' })
    setTimeout(() => settingsRef.current?.scrollIntoView({ behavior: 'smooth' }), 300)
  }

  function handleOrderSuccess(id) {
    setOrderId(id)
    setShowPayment(false)
    setStep(STEP.PRINTING)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function handleReset() {
    setStep(STEP.HERO)
    setFileInfo(null)
    setSettings(DEFAULT_SETTINGS)
    setShowPayment(false)
    setOrderId(null)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const isAdminRoute = typeof window !== 'undefined' && window.location.pathname.startsWith('/admin')
  if (isAdminRoute) return <AdminDashboard />

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-30 flex items-center justify-between px-6 py-4 border-b border-white/5 bg-[#0a0a0f]/80 backdrop-blur-md">
        <button onClick={handleReset} className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-purple-600 flex items-center justify-center">
            <span className="text-white font-bold text-sm">X</span>
          </div>
          <span className="text-white font-bold text-lg">X Buddy</span>
        </button>
        {step === STEP.HERO ? (
          <div className="hidden md:flex items-center gap-6 text-xs text-gray-500">
            <a href="#academic-toolkit" className="hover:text-purple-400 transition-colors">Academic Toolkit</a>
            <button
              onClick={() => setStep(STEP.RESUME)}
              className="hover:text-purple-400 transition-colors"
            >
              Resume Builder
            </button>
            <button
              onClick={() => setStep(STEP.UPLOAD)}
              className="px-4 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg font-semibold transition-all"
            >
              Print Now
            </button>
            <a
              href="/admin"
              className="px-4 py-1.5 rounded-lg border border-white/10 bg-white/5 text-white font-semibold transition hover:border-purple-400/30 hover:bg-white/10"
            >
              Admin
            </a>
          </div>
        ) : step === STEP.RESUME ? null : (
          <div className="flex items-center gap-2 text-xs text-gray-500">
            {['Upload', 'Settings', 'Pay & Print'].map((label, i) => {
              const stepKeys = [STEP.UPLOAD, STEP.SETTINGS, STEP.PRINTING]
              const isPast   = step === STEP.PRINTING && i < 2
              const isActive = step === stepKeys[i]
              return (
                <div key={label} className="flex items-center gap-2">
                  <span className={`${isPast ? 'text-green-400' : isActive ? 'text-purple-400' : 'text-gray-600'} font-medium`}>
                    {isPast ? '✓' : `${i + 1}.`} {label}
                  </span>
                  {i < 2 && <span className="text-gray-700">›</span>}
                </div>
              )
            })}
          </div>
        )}
      </nav>

      {/* Main content */}
      <main className="pt-16">
        <AnimatePresence mode="wait">
          {step === STEP.HERO && (
            <motion.div key="hero" exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.3 }}>
              <Hero onGetStarted={() => setStep(STEP.UPLOAD)} onResumeBuilder={() => setStep(STEP.RESUME)} />
              {/* Divider */}
              <div className="border-t border-white/5" />
              <div id="academic-toolkit">
                <AcademicToolkit onPrint={handleExternalPrint} />
              </div>
              {/* Footer */}
              <div className="border-t border-white/5 py-8 text-center">
                <p className="text-gray-700 text-xs">X Buddy — Smart Campus Utility Platform</p>
              </div>
            </motion.div>
          )}

          {(step === STEP.UPLOAD || step === STEP.SETTINGS) && (
            <motion.div key="main" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <UploadSection onFileReady={handleFileReady} />
              <AnimatePresence>
                {fileInfo && step === STEP.SETTINGS && (
                  <motion.div
                    ref={settingsRef}
                    key="settings"
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                  >
                    <PrintSettings fileInfo={fileInfo} settings={settings} onChange={setSettings} />
                    <PriceCard fileInfo={fileInfo} settings={settings} onPayAndPrint={() => setShowPayment(true)} />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}

          {step === STEP.RESUME && (
            <motion.div key="resume" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ height: 'calc(100vh - 4rem)' }}>
              <ResumeBuilder
                onPrint={handleExternalPrint}
                onBack={handleReset}
              />
            </motion.div>
          )}

          {step === STEP.PRINTING && (
            <motion.div key="printing" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <PrintStatus
                fileInfo={fileInfo}
                settings={settings}
                orderId={orderId}
                onReset={handleReset}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Payment Modal */}
      {showPayment && (
        <PaymentModal
          total={total}
          orderMeta={orderMeta}
          onSuccess={handleOrderSuccess}
          onClose={() => setShowPayment(false)}
        />
      )}
    </div>
  )
}
