import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
  TrendingUp,
  DollarSign,
  Printer,
  Clock3,
  ShieldCheck,
  Server,
  PauseCircle,
  RefreshCcw,
  PlusCircle,
  Key,
  Ban,
  CheckCircle2,
  AlertTriangle,
  Building2,
  Users,
  Calendar,
  UserCheck,
  Copy,
  ExternalLink,
  ShieldAlert,
} from 'lucide-react'
import {
  fetchAdminOrders,
  fetchAdminStats,
  fetchBoothStatus,
  fetchHealthStatus,
} from '../utils/api'

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('master') // 'master' | 'signups' | 'shop_ops'
  const [loading, setLoading] = useState(false)

  // Master SaaS State
  const [shops, setShops] = useState([])
  const [pendingSignups, setPendingSignups] = useState([])
  const [aggregateStats, setAggregateStats] = useState({ totalShops: 0, todayOrders: 0, todayRevenue: 0 })
  const [showGenerateModal, setShowGenerateModal] = useState(false)
  const [selectedSignup, setSelectedSignup] = useState(null)

  const [newShopForm, setNewShopForm] = useState({
    shopName: '',
    ownerName: '',
    phone: '',
    email: '',
    spreadsheetId: '',
    gasUrl: '',
    status: 'Active',
    plan: 'Standard',
    expiryDays: '30',
    provisionedBy: 'Founder Admin',
  })
  const [createdLicense, setCreatedLicense] = useState(null)

  // Single Shop Live State
  const [orders, setOrders] = useState([])
  const [stats, setStats] = useState({ totalOrders: 0, revenue: 0, pending: 0, printed: 0 })
  const [booths, setBooths] = useState([])
  const [health, setHealth] = useState([])

  const masterGasUrl = localStorage.getItem('xbuddy_master_gas_url') || 'https://script.google.com/macros/s/AKfycbz_Np3K34IPwNSvzq8aFMKwNHMXkLb-cNcaLmGrnROGuSczlHcwO9OQi4dCBkOo68E85Q/exec'

  const loadMasterData = async () => {
    setLoading(true)
    try {
      // 1. Fetch Shops
      const res = await fetch(`${masterGasUrl}?action=listShops`).then(r => r.json()).catch(() => null)
      if (res?.shops || res?.data?.shops) {
        setShops(res.shops || res.data.shops)
      } else {
        // Fallback demo mock if offline
        setShops([
          {
            shopId: 'SHOP0001',
            shopName: 'Sri Sai Xerox',
            ownerName: 'Ramesh Kumar',
            phone: '+91 9876543210',
            email: 'ramesh@srisai.com',
            licenseKey: 'XB-A1B2-C3D4-E5F6',
            status: 'Active',
            plan: 'Standard',
            sheetId: '1ylqiGtvtYfPtCOvKMzOLVETZxiNQ4IKAFaTmKBHH6Sk',
            gasUrl: masterGasUrl,
            activationDate: '2026-07-20',
            expiryDate: '2026-08-20',
            lastHeartbeat: new Date().toISOString(),
            provisionedDate: '2026-07-20T10:00:00Z',
            provisionedBy: 'Founder Admin',
          },
        ])
      }

      // 2. Fetch Pending Signups
      const signupsRes = await fetch(`${masterGasUrl}?action=getPendingSignups`).then(r => r.json()).catch(() => null)
      if (signupsRes?.signups || signupsRes?.data?.signups) {
        setPendingSignups(signupsRes.signups || signupsRes.data.signups)
      }

      // 3. Fetch Aggregate Stats
      const aggRes = await fetch(`${masterGasUrl}?action=getAggregateStats`).then(r => r.json()).catch(() => null)
      if (aggRes) {
        setAggregateStats({
          totalShops: aggRes.totalShops || aggRes.data?.totalShops || 0,
          todayOrders: aggRes.todayOrders || aggRes.data?.todayOrders || 0,
          todayRevenue: aggRes.todayRevenue || aggRes.data?.todayRevenue || 0,
        })
      }
    } catch (err) {
      console.error('Failed to load Master Registry:', err)
    } finally {
      setLoading(false)
    }
  }

  const loadShopOpsData = async () => {
    try {
      const [ordRes, statRes, bthRes, hltRes] = await Promise.all([
        fetchAdminOrders(),
        fetchAdminStats(),
        fetchBoothStatus(),
        fetchHealthStatus(),
      ])

      if (ordRes?.orders) setOrders(ordRes.orders)
      if (statRes) setStats(statRes)
      if (bthRes?.booths) setBooths(bthRes.booths)
      if (hltRes?.checks) setHealth(hltRes.checks)
    } catch (err) {
      console.error('Failed to load shop ops data:', err)
    }
  }

  useEffect(() => {
    loadMasterData()
    loadShopOpsData()
  }, [])

  const handleOpenProvisionModal = (signup = null) => {
    setSelectedSignup(signup)
    if (signup) {
      setNewShopForm({
        shopName: signup.shopName || '',
        ownerName: signup.ownerName || '',
        phone: signup.phone || '',
        email: signup.email || '',
        spreadsheetId: '',
        gasUrl: '',
        status: 'Active',
        plan: 'Standard',
        expiryDays: '30',
        provisionedBy: 'Founder Admin',
      })
    } else {
      setNewShopForm({
        shopName: '',
        ownerName: '',
        phone: '',
        email: '',
        spreadsheetId: '',
        gasUrl: '',
        status: 'Active',
        plan: 'Standard',
        expiryDays: '30',
        provisionedBy: 'Founder Admin',
      })
    }
    setShowGenerateModal(true)
  }

  const handleProvisionShop = async (e) => {
    e.preventDefault()
    try {
      setLoading(true)

      // Calculate sequential Shop ID & License Key
      const maxNum = shops.reduce((max, s) => {
        const m = String(s.shopId || '').match(/SHOP(\d+)/i)
        return m ? Math.max(max, parseInt(m[1], 10)) : max
      }, 0)
      const nextShopId = `SHOP${String(maxNum + 1).padStart(4, '0')}`

      const randSeg = (len) => Array.from({ length: len }, () => "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789".charAt(Math.floor(Math.random() * 36))).join('')
      const nextLicenseKey = `XB-${randSeg(4)}-${randSeg(4)}-${randSeg(4)}`

      const params = new URLSearchParams({
        action: 'provisionShop',
        shopId: nextShopId,
        licenseKey: nextLicenseKey,
        shopName: newShopForm.shopName || 'Xerox Shop',
        ownerName: newShopForm.ownerName || 'Owner',
        phone: newShopForm.phone || '',
        email: newShopForm.email || '',
        sheetId: newShopForm.spreadsheetId || '',
        gasUrl: newShopForm.gasUrl || masterGasUrl,
        plan: newShopForm.plan || 'Standard',
        status: newShopForm.status || 'Active',
        expiryDays: newShopForm.expiryDays || '30',
        provisionedBy: newShopForm.provisionedBy || 'Founder Admin',
      })

      const res = await fetch(`${masterGasUrl}?${params.toString()}`).then(r => r.json())
      if (res?.success || res?.shop || res?.data?.shop) {
        const shopData = res.shop || res.data?.shop || { shopId: nextShopId, licenseKey: nextLicenseKey }
        setCreatedLicense(shopData)
        loadMasterData()
        setShowGenerateModal(false)
      } else {
        alert(res?.error || 'Failed to provision shop in Master Registry.')
      }
    } catch (err) {
      alert('Provisioning error: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleDisableShop = async (shopId) => {
    if (!confirm(`Are you sure you want to suspend access for shop ${shopId}?`)) return
    try {
      setLoading(true)
      const params = new URLSearchParams({ action: 'updateShopStatus', shopId, status: 'Suspended' })
      const res = await fetch(`${masterGasUrl}?${params.toString()}`).then(r => r.json())
      if (res?.success) {
        loadMasterData()
      } else {
        alert('Could not update status: ' + (res?.error || 'Unknown error'))
      }
    } catch (err) {
      alert('Error updating status: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleActivateShop = async (shopId) => {
    try {
      setLoading(true)
      const params = new URLSearchParams({ action: 'updateShopStatus', shopId, status: 'Active' })
      const res = await fetch(`${masterGasUrl}?${params.toString()}`).then(r => r.json())
      if (res?.success) loadMasterData()
    } catch (err) {
      alert('Error: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text)
    alert(`${label} copied to clipboard!`)
  }

  return (
    <div className="min-h-screen bg-[#07070d] text-slate-100 p-6 md:p-10 font-sans">
      {/* Top Header */}
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2.5 bg-violet-600/20 border border-violet-500/30 rounded-xl text-violet-400">
              <Building2 className="w-6 h-6" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
              Founder Admin Dashboard
            </h1>
          </div>
          <p className="text-slate-400 text-sm">
            Multi-Tenant SaaS Master Registry & Provisioning Management
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center bg-slate-900 border border-slate-800 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab('master')}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition ${
              activeTab === 'master'
                ? 'bg-violet-600 text-white shadow-lg shadow-violet-600/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Master Registry ({shops.length})
          </button>
          <button
            onClick={() => setActiveTab('signups')}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition relative ${
              activeTab === 'signups'
                ? 'bg-violet-600 text-white shadow-lg shadow-violet-600/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Pending Signups
            {pendingSignups.length > 0 && (
              <span className="ml-2 px-1.5 py-0.5 text-[10px] bg-amber-500 text-black font-bold rounded-full">
                {pendingSignups.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('shop_ops')}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition ${
              activeTab === 'shop_ops'
                ? 'bg-violet-600 text-white shadow-lg shadow-violet-600/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Live Print Agent Ops
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto space-y-8">
        {/* Master Registry View */}
        {activeTab === 'master' && (
          <>
            {/* Aggregate Metrics (Pull from Rollups & Heartbeats) */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
              <div className="p-6 bg-slate-900/60 border border-slate-800 rounded-2xl backdrop-blur-md">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Total Shops</p>
                    <h3 className="text-3xl font-extrabold mt-2 text-white">{shops.length}</h3>
                  </div>
                  <div className="p-3 bg-violet-500/10 border border-violet-500/20 text-violet-400 rounded-xl">
                    <Building2 className="w-5 h-5" />
                  </div>
                </div>
                <div className="mt-3 text-xs flex items-center gap-2">
                  <span className="text-emerald-400 font-semibold">
                    {shops.filter(s => s.lastHeartbeat && (Date.now() - new Date(s.lastHeartbeat).getTime() < 300000)).length} Online
                  </span>
                  <span className="text-slate-600">•</span>
                  <span className="text-slate-400">
                    {shops.filter(s => !s.lastHeartbeat || (Date.now() - new Date(s.lastHeartbeat).getTime() >= 300000)).length} Offline
                  </span>
                </div>
              </div>

              <div className="p-6 bg-slate-900/60 border border-slate-800 rounded-2xl backdrop-blur-md">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Total Orders Today</p>
                    <h3 className="text-3xl font-extrabold mt-2 text-white">{aggregateStats.todayOrders}</h3>
                  </div>
                  <div className="p-3 bg-sky-500/10 border border-sky-500/20 text-sky-400 rounded-xl">
                    <Clock3 className="w-5 h-5" />
                  </div>
                </div>
                <p className="text-xs text-slate-500 mt-4">Aggregated from daily agent rollups</p>
              </div>

              <div className="p-6 bg-slate-900/60 border border-slate-800 rounded-2xl backdrop-blur-md">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Total Revenue Today</p>
                    <h3 className="text-3xl font-extrabold mt-2 text-emerald-400">₹{aggregateStats.todayRevenue}</h3>
                  </div>
                  <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl">
                    <DollarSign className="w-5 h-5" />
                  </div>
                </div>
                <p className="text-xs text-slate-500 mt-4">Master Registry daily rollups</p>
              </div>

              <div className="p-6 bg-slate-900/60 border border-slate-800 rounded-2xl backdrop-blur-md">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Pending Signups</p>
                    <h3 className="text-3xl font-extrabold mt-2 text-amber-400">{pendingSignups.length}</h3>
                  </div>
                  <div className="p-3 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-xl">
                    <UserCheck className="w-5 h-5" />
                  </div>
                </div>
                <p className="text-xs text-slate-500 mt-4">Awaiting 1-click provisioning</p>
              </div>
            </div>

            {/* Generated License Result Banner */}
            {createdLicense && (
              <div className="p-5 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                  <h4 className="font-bold text-emerald-400 text-sm flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5" />
                    New Shop Provisioned Successfully!
                  </h4>
                  <p className="text-xs text-emerald-300/80 mt-1">
                    Shop ID: <strong className="font-mono bg-emerald-950/60 px-2 py-0.5 rounded text-emerald-200">{createdLicense.shopId}</strong> | License Key: <strong className="font-mono bg-emerald-950/60 px-2 py-0.5 rounded text-emerald-200">{createdLicense.licenseKey}</strong>
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => copyToClipboard(createdLicense.shopId, 'Shop ID')}
                    className="px-3 py-1.5 bg-emerald-500/20 text-emerald-200 text-xs font-medium rounded-lg hover:bg-emerald-500/30"
                  >
                    Copy Shop ID
                  </button>
                  <button
                    onClick={() => copyToClipboard(createdLicense.licenseKey, 'License Key')}
                    className="px-3 py-1.5 bg-emerald-500/20 text-emerald-200 text-xs font-medium rounded-lg hover:bg-emerald-500/30"
                  >
                    Copy Key
                  </button>
                  <button
                    onClick={() => setCreatedLicense(null)}
                    className="px-2.5 py-1.5 text-slate-400 hover:text-white text-xs"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            )}

            {/* Master Registry Table */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 backdrop-blur-md">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <Users className="w-5 h-5 text-violet-400" />
                    Provisioned Xerox Shops
                  </h2>
                  <p className="text-xs text-slate-400">View licenses, setup details, and audit trails.</p>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={loadMasterData}
                    className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition"
                    title="Refresh Master Data"
                  >
                    <RefreshCcw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                  </button>
                  <button
                    onClick={() => handleOpenProvisionModal()}
                    className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-xl font-medium text-sm transition shadow-lg shadow-violet-600/20"
                  >
                    <PlusCircle className="w-4 h-4" />
                    Provision New Shop
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 text-xs font-semibold uppercase tracking-wider">
                      <th className="pb-3">Shop ID</th>
                      <th className="pb-3">Shop Name</th>
                      <th className="pb-3">Owner / Contact</th>
                      <th className="pb-3">License Key</th>
                      <th className="pb-3">Status</th>
                      <th className="pb-3">Audit Trail</th>
                      <th className="pb-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50">
                    {shops.length === 0 ? (
                      <tr>
                        <td colSpan="7" className="py-8 text-center text-slate-500">
                          No shops provisioned yet. Click "Provision New Shop" to get started.
                        </td>
                      </tr>
                    ) : (
                      shops.map(s => (
                        <tr key={s.shopId} className="hover:bg-slate-800/30 transition-colors">
                          <td className="py-3.5 font-mono font-semibold text-slate-200">{s.shopId}</td>
                          <td className="py-3.5 font-medium text-white">{s.shopName}</td>
                          <td className="py-3.5 text-slate-300">
                            <div>{s.ownerName || '-'}</div>
                            <div className="text-xs text-slate-500">{s.phone || s.email || '-'}</div>
                          </td>
                          <td className="py-3.5 font-mono text-xs text-violet-300">{s.licenseKey}</td>
                          <td className="py-3.5">
                            <span
                              className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                                s.status === 'Active' || s.status === 'active'
                                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                  : s.status === 'Trial' || s.status === 'trial'
                                  ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20'
                                  : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                              }`}
                            >
                              {s.status?.toUpperCase()}
                            </span>
                          </td>
                          <td className="py-3.5 text-xs text-slate-400">
                            <div>By: {s.provisionedBy || 'Admin'}</div>
                            <div className="text-[11px] text-slate-500">{s.provisionedDate ? new Date(s.provisionedDate).toLocaleDateString() : 'N/A'}</div>
                          </td>
                          <td className="py-3.5">
                            <div className="flex items-center gap-2">
                              {s.status === 'Suspended' || s.status === 'suspended' ? (
                                <button
                                  onClick={() => handleActivateShop(s.shopId)}
                                  className="px-2.5 py-1 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 rounded-lg text-xs font-medium transition"
                                >
                                  Activate
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleDisableShop(s.shopId)}
                                  className="px-2.5 py-1 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 rounded-lg text-xs font-medium transition flex items-center gap-1"
                                >
                                  <Ban className="w-3 h-3" />
                                  Suspend
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {/* Pending Signups View (Section 2 & 10) */}
        {activeTab === 'signups' && (
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 backdrop-blur-md">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <UserCheck className="w-5 h-5 text-amber-400" />
                  New Customer Registrations (Pending Setup)
                </h2>
                <p className="text-xs text-slate-400">Review web signups and provision their dedicated shop package.</p>
              </div>
              <button
                onClick={loadMasterData}
                className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition"
              >
                <RefreshCcw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 text-xs font-semibold uppercase tracking-wider">
                    <th className="pb-3">Signup ID</th>
                    <th className="pb-3">Shop Name</th>
                    <th className="pb-3">Owner Name</th>
                    <th className="pb-3">Contact</th>
                    <th className="pb-3">Status</th>
                    <th className="pb-3">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {pendingSignups.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="py-8 text-center text-slate-500">
                        No pending customer signups awaiting setup. All signups provisioned!
                      </td>
                    </tr>
                  ) : (
                    pendingSignups.map(su => (
                      <tr key={su.signupId} className="hover:bg-slate-800/30 transition-colors">
                        <td className="py-3.5 font-mono text-xs text-slate-400">{su.signupId}</td>
                        <td className="py-3.5 font-medium text-white">{su.shopName}</td>
                        <td className="py-3.5 text-slate-300">{su.ownerName}</td>
                        <td className="py-3.5 text-slate-300">
                          <div>{su.email}</div>
                          <div className="text-xs text-slate-500">{su.phone || '-'}</div>
                        </td>
                        <td className="py-3.5">
                          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                            {su.status}
                          </span>
                        </td>
                        <td className="py-3.5">
                          <button
                            onClick={() => handleOpenProvisionModal(su)}
                            className="px-3 py-1.5 bg-violet-600 hover:bg-violet-500 text-white rounded-lg text-xs font-medium transition shadow-md shadow-violet-600/20"
                          >
                            1-Click Provision
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Live Shop Ops View */}
        {activeTab === 'shop_ops' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
              <div className="p-5 bg-slate-900/60 border border-slate-800 rounded-2xl">
                <p className="text-xs text-slate-400 uppercase">Live Orders</p>
                <h3 className="text-2xl font-bold text-white mt-1">{stats.totalOrders || orders.length}</h3>
              </div>
              <div className="p-5 bg-slate-900/60 border border-slate-800 rounded-2xl">
                <p className="text-xs text-slate-400 uppercase">Live Revenue</p>
                <h3 className="text-2xl font-bold text-emerald-400 mt-1">₹{stats.revenue || 0}</h3>
              </div>
              <div className="p-5 bg-slate-900/60 border border-slate-800 rounded-2xl">
                <p className="text-xs text-slate-400 uppercase">Pending Queue</p>
                <h3 className="text-2xl font-bold text-amber-400 mt-1">{stats.pending || 0}</h3>
              </div>
              <div className="p-5 bg-slate-900/60 border border-slate-800 rounded-2xl">
                <p className="text-xs text-slate-400 uppercase">Booths Online</p>
                <h3 className="text-2xl font-bold text-sky-400 mt-1">{booths.filter(b => b.online).length} / 4</h3>
              </div>
            </div>

            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6">
              <h3 className="text-lg font-bold text-white mb-4">Live Agent Health Checks</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {health.map((h, i) => (
                  <div key={i} className="p-3.5 bg-slate-800/40 border border-slate-800 rounded-xl flex justify-between items-center text-sm">
                    <span className="text-slate-300">{h.name}</span>
                    <span className={`px-2 py-0.5 rounded text-xs font-semibold ${h.status === 'online' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                      {h.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Provision Shop Modal */}
      {showGenerateModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-[#0f1117] border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4"
          >
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Key className="w-5 h-5 text-violet-400" />
                {selectedSignup ? `Provision: ${selectedSignup.shopName}` : 'Provision New Shop'}
              </h3>
              <button onClick={() => setShowGenerateModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleProvisionShop} className="space-y-3 text-sm">
              <div>
                <label className="block text-slate-400 text-xs mb-1">Shop Name</label>
                <input
                  type="text"
                  required
                  value={newShopForm.shopName}
                  onChange={e => setNewShopForm({ ...newShopForm, shopName: e.target.value })}
                  placeholder="e.g. Sri Sai Xerox"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white outline-none focus:border-violet-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 text-xs mb-1">Owner Name</label>
                  <input
                    type="text"
                    required
                    value={newShopForm.ownerName}
                    onChange={e => setNewShopForm({ ...newShopForm, ownerName: e.target.value })}
                    placeholder="Ramesh Kumar"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white outline-none focus:border-violet-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 text-xs mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={newShopForm.phone}
                    onChange={e => setNewShopForm({ ...newShopForm, phone: e.target.value })}
                    placeholder="+91 9876543210"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white outline-none focus:border-violet-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 text-xs mb-1">Email Address</label>
                <input
                  type="email"
                  value={newShopForm.email}
                  onChange={e => setNewShopForm({ ...newShopForm, email: e.target.value })}
                  placeholder="owner@shop.com"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white outline-none focus:border-violet-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 text-xs mb-1">Google Sheet ID</label>
                  <input
                    type="text"
                    value={newShopForm.spreadsheetId}
                    onChange={e => setNewShopForm({ ...newShopForm, spreadsheetId: e.target.value })}
                    placeholder="1ylqiGtvtY..."
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white outline-none focus:border-violet-500 font-mono text-xs"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 text-xs mb-1">GAS Web App URL</label>
                  <input
                    type="text"
                    value={newShopForm.gasUrl}
                    onChange={e => setNewShopForm({ ...newShopForm, gasUrl: e.target.value })}
                    placeholder="https://script.google.com/..."
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white outline-none focus:border-violet-500 font-mono text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 text-xs mb-1">Initial Status</label>
                  <select
                    value={newShopForm.status}
                    onChange={e => setNewShopForm({ ...newShopForm, status: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white outline-none focus:border-violet-500"
                  >
                    <option value="Active">Active</option>
                    <option value="Trial">Trial</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 text-xs mb-1">Validity (Days)</label>
                  <input
                    type="number"
                    value={newShopForm.expiryDays}
                    onChange={e => setNewShopForm({ ...newShopForm, expiryDays: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white outline-none focus:border-violet-500"
                  />
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowGenerateModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 bg-violet-600 hover:bg-violet-500 text-white font-medium rounded-xl transition shadow-lg shadow-violet-600/20"
                >
                  {loading ? 'Provisioning...' : 'Provision & Generate Key'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  )
}
