import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
  Printer,
  DollarSign,
  Clock3,
  CheckCircle,
  AlertCircle,
  FileText,
  Key,
  Store,
  RefreshCcw,
  ShieldCheck,
  ShieldAlert,
  Zap,
} from 'lucide-react'
import { fetchAdminOrders, fetchAdminStats, fetchHealthStatus } from '../utils/api'

export default function OwnerDashboard() {
  const [loading, setLoading] = useState(true)
  const [orders, setOrders] = useState([])
  const [stats, setStats] = useState({ totalOrders: 0, revenue: 0, pending: 0, printed: 0, failed: 0 })
  const [health, setHealth] = useState([])
  const [license, setLicense] = useState({ valid: true, status: 'active', message: '' })
  const [lastRefreshed, setLastRefreshed] = useState(new Date())

  const loadData = async () => {
    setLoading(true)
    try {
      const [ordersRes, statsRes, healthRes] = await Promise.all([
        fetchAdminOrders(),
        fetchAdminStats(),
        fetchHealthStatus(),
      ])

      if (ordersRes?.orders) setOrders(ordersRes.orders)
      if (statsRes) {
        setStats({
          totalOrders: statsRes.totalOrders || 0,
          revenue: statsRes.revenue || 0,
          pending: statsRes.pending || 0,
          printed: statsRes.printed || 0,
          failed: statsRes.failed || 0,
        })
        if (statsRes.license) setLicense(statsRes.license)
      }
      if (healthRes?.checks) setHealth(healthRes.checks)
      setLastRefreshed(new Date())
    } catch (err) {
      console.error('OwnerDashboard load error:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
    const interval = setInterval(loadData, 30000) // 30-second client-side polling rate limit
    return () => clearInterval(interval)
  }, [])

  const printerStatus = health.find(c => c.name === 'Printer Connectivity')?.status === 'online'
  const agentStatus = health.find(c => c.name === 'Print Agent')?.status === 'online'

  return (
    <div className="min-h-screen bg-[#090a0f] text-slate-100 p-6 md:p-10 font-sans">
      {/* Top Bar */}
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2.5 bg-violet-600/20 border border-violet-500/30 rounded-xl text-violet-400">
              <Store className="w-6 h-6" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
              Shop Owner Portal
            </h1>
          </div>
          <p className="text-slate-400 text-sm">
            Live overview of orders, revenue, printer status, and shop license.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Updated {lastRefreshed.toLocaleTimeString()}
          </div>
          <button
            onClick={loadData}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white rounded-xl font-medium text-sm transition shadow-lg shadow-violet-600/20"
          >
            <RefreshCcw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto space-y-8">
        {/* License Alert Banner if offline/grace/expired */}
        {!license.valid && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-2xl flex items-center justify-between gap-4 text-rose-300"
          >
            <div className="flex items-center gap-3">
              <ShieldAlert className="w-6 h-6 text-rose-400 flex-shrink-0" />
              <div>
                <h4 className="font-semibold text-sm">License Inactive / Expired</h4>
                <p className="text-xs text-rose-300/80">
                  {license.message || 'Your SaaS license needs attention. Order pulling is paused.'}
                </p>
              </div>
            </div>
            <span className="px-3 py-1 bg-rose-500/20 text-rose-200 text-xs font-semibold rounded-lg">
              {license.status?.toUpperCase() || 'EXPIRED'}
            </span>
          </motion.div>
        )}

        {license.isGracePeriod && (
          <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-center justify-between text-amber-300">
            <div className="flex items-center gap-3">
              <Zap className="w-6 h-6 text-amber-400 flex-shrink-0" />
              <div>
                <h4 className="font-semibold text-sm">Offline Grace Period Active</h4>
                <p className="text-xs text-amber-300/80">
                  Master Registry unverified. Grace period active ({license.graceTimeLeftHours} hours remaining).
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Top Metric Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          <motion.div
            whileHover={{ y: -3 }}
            className="p-6 bg-slate-900/60 border border-slate-800 rounded-2xl relative overflow-hidden backdrop-blur-md"
          >
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Today's Orders</p>
                <h3 className="text-3xl font-extrabold mt-2 text-white">{stats.totalOrders}</h3>
              </div>
              <div className="p-3 bg-violet-500/10 border border-violet-500/20 text-violet-400 rounded-xl">
                <FileText className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4 text-xs text-slate-400 flex items-center gap-2">
              <span className="text-emerald-400 font-semibold">{stats.printed} Completed</span>
              <span>•</span>
              <span className="text-amber-400 font-semibold">{stats.pending} Pending</span>
            </div>
          </motion.div>

          <motion.div
            whileHover={{ y: -3 }}
            className="p-6 bg-slate-900/60 border border-slate-800 rounded-2xl relative overflow-hidden backdrop-blur-md"
          >
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Today's Revenue</p>
                <h3 className="text-3xl font-extrabold mt-2 text-emerald-400">₹{stats.revenue}</h3>
              </div>
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl">
                <DollarSign className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4 text-xs text-slate-400">
              Filtered from shop order sheet
            </div>
          </motion.div>

          <motion.div
            whileHover={{ y: -3 }}
            className="p-6 bg-slate-900/60 border border-slate-800 rounded-2xl relative overflow-hidden backdrop-blur-md"
          >
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Printer Status</p>
                <h3 className="text-xl font-bold mt-2 text-white flex items-center gap-2">
                  {printerStatus ? (
                    <span className="text-emerald-400 flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                      Online
                    </span>
                  ) : (
                    <span className="text-amber-400 flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                      Virtual / Offline
                    </span>
                  )}
                </h3>
              </div>
              <div className="p-3 bg-sky-500/10 border border-sky-500/20 text-sky-400 rounded-xl">
                <Printer className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4 text-xs text-slate-400">
              Agent status: {agentStatus ? 'Connected' : 'Disconnected'}
            </div>
          </motion.div>

          <motion.div
            whileHover={{ y: -3 }}
            className="p-6 bg-slate-900/60 border border-slate-800 rounded-2xl relative overflow-hidden backdrop-blur-md"
          >
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">License Status</p>
                <h3 className="text-xl font-bold mt-2 text-white flex items-center gap-2">
                  {license.valid ? (
                    <span className="text-emerald-400 flex items-center gap-1">
                      <ShieldCheck className="w-5 h-5" />
                      Active ({license.status})
                    </span>
                  ) : (
                    <span className="text-rose-400 flex items-center gap-1">
                      <ShieldAlert className="w-5 h-5" />
                      {license.status}
                    </span>
                  )}
                </h3>
              </div>
              <div className="p-3 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-xl">
                <Key className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4 text-xs text-slate-400">
              {license.expiryDate ? `Expires: ${license.expiryDate}` : 'Master Registry Managed'}
            </div>
          </motion.div>
        </div>

        {/* Middle Section: Recent Orders & Read-only Settings */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Orders Table */}
          <div className="lg:col-span-2 bg-slate-900/60 border border-slate-800 rounded-2xl p-6 backdrop-blur-md">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Clock3 className="w-5 h-5 text-violet-400" />
                Recent Orders
              </h2>
              <span className="text-xs text-slate-400">{orders.length} total orders</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 text-xs font-semibold uppercase tracking-wider">
                    <th className="pb-3">Order ID</th>
                    <th className="pb-3">Document</th>
                    <th className="pb-3">Pages</th>
                    <th className="pb-3">Amount</th>
                    <th className="pb-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {orders.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="py-8 text-center text-slate-500">
                        No orders recorded today.
                      </td>
                    </tr>
                  ) : (
                    orders.slice(0, 8).map((ord, idx) => (
                      <tr key={ord.id || idx} className="hover:bg-slate-800/30 transition-colors">
                        <td className="py-3.5 font-mono font-semibold text-slate-200">{ord.id}</td>
                        <td className="py-3.5 text-slate-300 max-w-[160px] truncate">{ord.fileName}</td>
                        <td className="py-3.5 text-slate-400">{ord.pages || 1} pgs</td>
                        <td className="py-3.5 font-medium text-emerald-400">₹{ord.amount}</td>
                        <td className="py-3.5">
                          <span
                            className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                              ord.status === 'Printed'
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                : ord.status === 'Waiting'
                                ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                            }`}
                          >
                            {ord.status || 'Waiting'}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Read-only Pricing & Shop Settings */}
          <div className="space-y-6">
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 backdrop-blur-md">
              <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-emerald-400" />
                Pricing Configuration (Read-only)
              </h2>
              <div className="space-y-3">
                <div className="p-3.5 bg-slate-800/40 border border-slate-800 rounded-xl flex justify-between items-center">
                  <span className="text-sm text-slate-300">B&W Print (Single Side)</span>
                  <span className="font-semibold text-emerald-400">₹2.00 / page</span>
                </div>
                <div className="p-3.5 bg-slate-800/40 border border-slate-800 rounded-xl flex justify-between items-center">
                  <span className="text-sm text-slate-300">B&W Print (Double Side)</span>
                  <span className="font-semibold text-emerald-400">₹1.50 / page</span>
                </div>
                <div className="p-3.5 bg-slate-800/40 border border-slate-800 rounded-xl flex justify-between items-center">
                  <span className="text-sm text-slate-300">Color Print</span>
                  <span className="font-semibold text-emerald-400">₹10.00 / page</span>
                </div>
              </div>
              <p className="text-xs text-slate-500 mt-4">
                Pricing is read by customer app and local print agent.
              </p>
            </div>

            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 backdrop-blur-md">
              <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <Store className="w-5 h-5 text-violet-400" />
                Shop Information
              </h2>
              <div className="space-y-2 text-sm text-slate-300">
                <div className="flex justify-between py-1 border-b border-slate-800">
                  <span className="text-slate-500">Platform</span>
                  <span className="font-medium text-slate-200">XBuddy SaaS MVP</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800">
                  <span className="text-slate-500">Isolation</span>
                  <span className="font-medium text-emerald-400">Dedicated Sheet & Drive</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-500">Agent Mode</span>
                  <span className="font-medium text-slate-200">Auto-Print & Tunnel</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
