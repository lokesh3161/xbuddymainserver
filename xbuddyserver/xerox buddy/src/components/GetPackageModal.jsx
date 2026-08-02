import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Download, Store, User, Phone, Mail, CheckCircle, ArrowRight, X } from 'lucide-react'

export default function GetPackageModal({ isOpen, onClose, onComplete }) {
  const [shopName, setShopName] = useState('')
  const [ownerName, setOwnerName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [isDownloading, setIsDownloading] = useState(false)
  const [downloadDone, setDownloadDone] = useState(false)

  if (!isOpen) return null

  const handleDownload = (e) => {
    e.preventDefault()
    if (!shopName || !ownerName || !phone || !email) return

    setIsDownloading(true)

    // Simulate/Trigger download of XBuddy Shop Package
    setTimeout(() => {
      const link = document.createElement('a')
      link.href = 'https://github.com/lokesh3161/xbuddymainserver/releases/latest/download/XBuddy-ShopPackage.zip'
      link.download = 'XBuddy-ShopPackage.zip'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      setIsDownloading(false)
      setDownloadDone(true)

      // Automatically display Shop Owner Dashboard
      setTimeout(() => {
        onComplete({ shopName, ownerName, phone, email })
      }, 1200)
    }, 800)
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative w-full max-w-md bg-[#0f1117] border border-white/10 rounded-2xl p-6 shadow-2xl text-slate-100"
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/5 transition"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3 mb-4">
            <div className="p-2.5 bg-purple-600/20 border border-purple-500/30 rounded-xl text-purple-400">
              <Download className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Get XBuddy Shop Package</h2>
              <p className="text-xs text-slate-400">Enter essentials & download Desktop Print Agent</p>
            </div>
          </div>

          {downloadDone ? (
            <div className="py-8 text-center space-y-3">
              <div className="w-16 h-16 bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 rounded-full flex items-center justify-center mx-auto text-2xl">
                ✓
              </div>
              <h3 className="text-lg font-bold text-white">Package Download Started!</h3>
              <p className="text-xs text-slate-400 max-w-xs mx-auto">
                Unzip <strong>XBuddy-ShopPackage.zip</strong> and run <strong>START.bat</strong>. Opening your Shop Owner Dashboard...
              </p>
            </div>
          ) : (
            <form onSubmit={handleDownload} className="space-y-3">
              <div>
                <label className="block text-xs text-slate-400 mb-1 font-medium">Shop Name *</label>
                <div className="relative">
                  <Store className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Sri Sai Xerox"
                    value={shopName}
                    onChange={(e) => setShopName(e.target.value)}
                    className="w-full bg-[#161822] border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 outline-none focus:border-purple-500 transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1 font-medium">Owner Name *</label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ramesh Kumar"
                    value={ownerName}
                    onChange={(e) => setOwnerName(e.target.value)}
                    className="w-full bg-[#161822] border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 outline-none focus:border-purple-500 transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1 font-medium">Phone Number *</label>
                <div className="relative">
                  <Phone className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. +91 9876543210"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-[#161822] border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 outline-none focus:border-purple-500 transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1 font-medium">Email Address *</label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                  <input
                    type="email"
                    required
                    placeholder="e.g. owner@srisaixerox.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-[#161822] border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 outline-none focus:border-purple-500 transition"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isDownloading}
                className="w-full mt-4 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl font-semibold text-sm transition flex items-center justify-center gap-2 shadow-lg shadow-purple-600/20"
              >
                {isDownloading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Preparing Download...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    Download Shop Package (.zip) & View Dashboard
                  </>
                )}
              </button>
            </form>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
