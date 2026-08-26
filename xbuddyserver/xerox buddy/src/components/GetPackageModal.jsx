import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Download, Store, User, Phone, Mail, Link2, CheckCircle2, AlertCircle, X, ShieldCheck, RefreshCw } from 'lucide-react'
import { verifyShop, downloadShopPackage } from '../utils/api'

export default function GetPackageModal({ isOpen, onClose, onComplete }) {
  const [shopName, setShopName] = useState('')
  const [ownerName, setOwnerName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [gasUrl, setGasUrl] = useState('')

  const [isVerifying, setIsVerifying] = useState(false)
  const [isVerified, setIsVerified] = useState(false)
  const [checks, setChecks] = useState({ backend: false, database: false, api: false })
  const [verifyError, setVerifyError] = useState(null)

  const [isDownloading, setIsDownloading] = useState(false)
  const [downloadDone, setDownloadDone] = useState(false)

  if (!isOpen) return null

  const handleVerify = async (e) => {
    e.preventDefault()
    if (!shopName || !ownerName || !phone || !email || !gasUrl) return

    setIsVerifying(true)
    setVerifyError(null)
    setIsVerified(false)

    const res = await verifyShop({
      shopName: shopName.trim(),
      ownerName: ownerName.trim(),
      phone: phone.trim(),
      email: email.trim(),
      gasUrl: gasUrl.trim(),
    })

    setIsVerifying(false)

    if (res.success) {
      setIsVerified(true)
      setChecks(res.checks || { backend: true, database: true, api: true })
    } else {
      setIsVerified(false)
      setVerifyError(res.error || 'Failed to verify connection with the Apps Script URL.')
    }
  }

  const handleDownload = async () => {
    if (!isVerified) return

    setIsDownloading(true)
    const res = await downloadShopPackage({
      shopName: shopName.trim(),
      ownerName: ownerName.trim(),
      phone: phone.trim(),
      email: email.trim(),
      gasUrl: gasUrl.trim(),
    })

    setIsDownloading(false)

    if (res.success) {
      setDownloadDone(true)
      setTimeout(() => {
        if (onComplete) {
          onComplete({ shopName, ownerName, phone, email, gasUrl })
        }
      }, 1500)
    } else {
      setVerifyError(res.error || 'Download failed. Please try again.')
    }
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative w-full max-w-lg bg-[#0f1117] border border-white/10 rounded-2xl p-6 shadow-2xl text-slate-100 max-h-[90vh] overflow-y-auto"
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/5 transition"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3 mb-5">
            <div className="p-2.5 bg-purple-600/20 border border-purple-500/30 rounded-xl text-purple-400">
              <Download className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Create Your XBuddy Shop</h2>
              <p className="text-xs text-slate-400">Connect Google Apps Script backend & download Print Agent</p>
            </div>
          </div>

          {downloadDone ? (
            <div className="py-8 text-center space-y-4">
              <div className="w-16 h-16 bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 rounded-full flex items-center justify-center mx-auto text-2xl shadow-lg shadow-emerald-500/10">
                ✓
              </div>
              <h3 className="text-lg font-bold text-white">XBuddy Shop Package Downloaded!</h3>
              <div className="text-xs text-slate-300 bg-white/5 border border-white/10 rounded-xl p-4 text-left space-y-2 max-w-sm mx-auto">
                <p className="font-semibold text-purple-300">Next Steps to start your shop:</p>
                <ol className="list-decimal list-inside space-y-1 text-slate-400">
                  <li>Extract <strong>XBuddy-Shop-Package.zip</strong></li>
                  <li>Double-click <strong>START X BUDDY.bat</strong></li>
                  <li>Your agent auto-connects printer & shop backend!</li>
                </ol>
              </div>
            </div>
          ) : (
            <form onSubmit={handleVerify} className="space-y-3.5">
              <div>
                <label className="block text-xs text-slate-400 mb-1 font-medium">Shop Name *</label>
                <div className="relative">
                  <Store className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. ABC Xerox"
                    value={shopName}
                    onChange={(e) => { setShopName(e.target.value); setIsVerified(false); }}
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
                    placeholder="e.g. Ravi Kumar"
                    value={ownerName}
                    onChange={(e) => { setOwnerName(e.target.value); setIsVerified(false); }}
                    className="w-full bg-[#161822] border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 outline-none focus:border-purple-500 transition"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-1 font-medium">Phone Number *</label>
                  <div className="relative">
                    <Phone className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. 9876543210"
                      value={phone}
                      onChange={(e) => { setPhone(e.target.value); setIsVerified(false); }}
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
                      placeholder="e.g. ravi@example.com"
                      value={email}
                      onChange={(e) => { setEmail(e.target.value); setIsVerified(false); }}
                      className="w-full bg-[#161822] border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 outline-none focus:border-purple-500 transition"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1 font-medium">Google Apps Script Web App URL *</label>
                <div className="relative">
                  <Link2 className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                  <input
                    type="url"
                    required
                    placeholder="https://script.google.com/macros/s/XXXXX/exec"
                    value={gasUrl}
                    onChange={(e) => { setGasUrl(e.target.value); setIsVerified(false); }}
                    className="w-full bg-[#161822] border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 outline-none focus:border-purple-500 transition"
                  />
                </div>
              </div>

              {/* Verification checks feedback banner */}
              {isVerified && (
                <motion.div
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-3.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl space-y-1.5"
                >
                  <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400">
                    <ShieldCheck className="w-4 h-4" />
                    Connection Verified Successfully!
                  </div>
                  <div className="grid grid-cols-3 gap-1 text-[11px] text-emerald-300 font-medium">
                    <span className="flex items-center gap-1">✓ Shop backend connected</span>
                    <span className="flex items-center gap-1">✓ Database connected</span>
                    <span className="flex items-center gap-1">✓ XBuddy API verified</span>
                  </div>
                </motion.div>
              )}

              {/* Verification error message */}
              {verifyError && (
                <motion.div
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-300 space-y-1 whitespace-pre-line"
                >
                  <div className="flex items-center gap-1.5 font-semibold text-rose-400">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    Verification Failed
                  </div>
                  <p className="text-slate-300 leading-relaxed">{verifyError}</p>
                </motion.div>
              )}

              {/* Action Buttons */}
              {!isVerified ? (
                <button
                  type="submit"
                  disabled={isVerifying}
                  className="w-full mt-3 py-3 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white rounded-xl font-semibold text-sm transition flex items-center justify-center gap-2 shadow-lg shadow-purple-600/20"
                >
                  {isVerifying ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Verifying Connection...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      Verify Connection
                    </>
                  )}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleDownload}
                  disabled={isDownloading}
                  className="w-full mt-3 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl font-semibold text-sm transition flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20"
                >
                  {isDownloading ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Generating Shop Package ZIP...
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4" />
                      Download XBuddy Shop Package (.zip)
                    </>
                  )}
                </button>
              )}
            </form>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
