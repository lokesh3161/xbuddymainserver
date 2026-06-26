import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import {
  TrendingUp,
  DollarSign,
  Printer,
  Clock3,
  ShieldCheck,
  Server,
  PauseCircle,
  RefreshCcw,
  Lock,
  CheckCircle,
  AlertTriangle,
  CircleDot,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react'
import {
  fetchAdminOrders,
  fetchAdminStats,
  fetchBoothStatus,
  fetchHealthStatus,
} from '../utils/api'

const STATUS_STYLES = {
  Waiting: 'bg-amber-500/10 text-amber-300',
  Released: 'bg-sky-500/10 text-sky-300',
  Printing: 'bg-violet-500/10 text-violet-300',
  Printed: 'bg-emerald-500/10 text-emerald-300',
  Failed: 'bg-rose-500/10 text-rose-300',
}

const INITIAL_ORDERS = [
  { id: 'XBD-1082', fileName: 'Resume_Design.pdf', type: 'Resume', pages: 4, amount: 72, booth: 'Booth 01', status: 'Printed', time: '09:18 AM' },
  { id: 'XBD-1083', fileName: 'Leave_Letter.pdf', type: 'Leave Letter', pages: 2, amount: 28, booth: 'Booth 03', status: 'Printing', time: '09:24 AM' },
  { id: 'XBD-1084', fileName: 'Bonafide.pdf', type: 'Bonafide', pages: 1, amount: 14, booth: 'Booth 02', status: 'Waiting', time: '09:26 AM' },
  { id: 'XBD-1085', fileName: 'Project_Assignment.pdf', type: 'Assignment', pages: 6, amount: 96, booth: 'Booth 01', status: 'Failed', time: '09:32 AM' },
  { id: 'XBD-1086', fileName: 'Research_Paper.pdf', type: 'Manual PDF', pages: 12, amount: 174, booth: 'Booth 04', status: 'Released', time: '09:45 AM' },
  { id: 'XBD-1087', fileName: 'Internship_Letter.pdf', type: 'Internship', pages: 3, amount: 45, booth: 'Booth 02', status: 'Waiting', time: '09:51 AM' },
  { id: 'XBD-1088', fileName: 'Lab_Report.pdf', type: 'Lab', pages: 5, amount: 75, booth: 'Booth 03', status: 'Printed', time: '10:02 AM' },
  { id: 'XBD-1089', fileName: 'Resume_Bio.pdf', type: 'Resume', pages: 2, amount: 30, booth: 'Booth 01', status: 'Printing', time: '10:08 AM' },
]

const INITIAL_BOOTHS = [
  { name: 'Booth 01', online: true, queue: 2, connected: true, printed: 48, revenue: 1092, paused: false, locked: false },
  { name: 'Booth 02', online: true, queue: 1, connected: true, printed: 33, revenue: 732, paused: false, locked: false },
  { name: 'Booth 03', online: true, queue: 3, connected: true, printed: 57, revenue: 1356, paused: false, locked: false },
  { name: 'Booth 04', online: false, queue: 0, connected: false, printed: 22, revenue: 478, paused: true, locked: false },
]

const DAY_REVENUE = [
  { day: 'Mon', revenue: 920 },
  { day: 'Tue', revenue: 1140 },
  { day: 'Wed', revenue: 980 },
  { day: 'Thu', revenue: 1190 },
  { day: 'Fri', revenue: 1340 },
  { day: 'Sat', revenue: 1560 },
  { day: 'Sun', revenue: 1820 },
]

const HOUR_ORDERS = [
  { hour: '6 AM', orders: 8 },
  { hour: '8 AM', orders: 12 },
  { hour: '10 AM', orders: 20 },
  { hour: '12 PM', orders: 18 },
  { hour: '2 PM', orders: 22 },
  { hour: '4 PM', orders: 26 },
  { hour: '6 PM', orders: 19 },
  { hour: '8 PM', orders: 14 },
]

const DOC_USAGE = [
  { name: 'Resume', value: 34, color: '#A855F7' },
  { name: 'Leave Letter', value: 22, color: '#22D3EE' },
  { name: 'Bonafide', value: 16, color: '#F59E0B' },
  { name: 'Assignments', value: 18, color: '#34D399' },
  { name: 'Manual PDFs', value: 10, color: '#F472B6' },
]

const PRINT_TYPE_DATA = [
  { name: 'B&W', value: 38, color: '#A78BFA' },
  { name: 'Color', value: 62, color: '#38BDF8' },
]

const HEALTH_CHECKS = [
  { name: 'Print Agent', status: 'online' },
  { name: 'Local Server', status: 'online' },
  { name: 'Google Sheets', status: 'online' },
  { name: 'Cloudflare Tunnel', status: 'online' },
  { name: 'Printer Connectivity', status: 'online' },
]

const getBadge = status => {
  if (status === 'online') return 'bg-emerald-500/15 text-emerald-300'
  if (status === 'offline') return 'bg-rose-500/15 text-rose-300'
  return 'bg-slate-500/15 text-slate-300'
}

const ADMIN_PASSWORD = '2580'
const formatCurrency = value => `₹${value.toLocaleString()}`

export default function AdminDashboard() {
  const [orders, setOrders] = useState(INITIAL_ORDERS)
  const [booths, setBooths] = useState(INITIAL_BOOTHS)
  const [health, setHealth] = useState(HEALTH_CHECKS)
  const [refreshTick, setRefreshTick] = useState(0)
  const [realConnected, setRealConnected] = useState(false)
  const [realError, setRealError] = useState('')
  const [adminPassword, setAdminPassword] = useState('')
  const [isAuthorized, setIsAuthorized] = useState(false)
  const [authError, setAuthError] = useState('')

  const stats = useMemo(() => {
    const total = orders.length
    const revenue = orders.reduce((sum, order) => sum + order.amount, 0)
    const pending = orders.filter(order => order.status === 'Waiting').length
    const printed = orders.filter(order => order.status === 'Printed').length
    const failed = orders.filter(order => order.status === 'Failed').length
    const active = booths.filter(booth => booth.online).length
    return { total, revenue, pending, printed, failed, active }
  }, [orders, booths])

  const busiestHours = useMemo(() => {
    return HOUR_ORDERS.slice().sort((a, b) => b.orders - a.orders).slice(0, 3)
  }, [])

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = window.localStorage.getItem('xbuddyAdminAuthorized')
      if (saved === 'true') {
        setIsAuthorized(true)
      }
    }
  }, [])

  const handleAdminLogin = (event) => {
    event.preventDefault()
    if (adminPassword === ADMIN_PASSWORD) {
      setIsAuthorized(true)
      setAuthError('')
      if (typeof window !== 'undefined') {
        window.localStorage.setItem('xbuddyAdminAuthorized', 'true')
      }
      return
    }
    setAuthError('Incorrect password. Please try again.')
  }

  const handleAdminPasswordChange = (event) => {
    setAdminPassword(event.target.value)
    if (authError) setAuthError('')
  }

  useEffect(() => {
    if (!isAuthorized) return
    let isMounted = true
    async function loadAdminData() {
      try {
        const [ordersRes, statsRes, boothsRes, healthRes] = await Promise.all([
          fetchAdminOrders(),
          fetchAdminStats(),
          fetchBoothStatus(),
          fetchHealthStatus(),
        ])

        if (!isMounted) return

        const hasOrders = ordersRes?.success && Array.isArray(ordersRes.orders)
        const hasStats = statsRes?.success && typeof statsRes.totalOrders === 'number'
        const hasBooths = boothsRes?.success && Array.isArray(boothsRes.booths)
        const hasHealth = healthRes?.success && Array.isArray(healthRes.checks)
        const hasAnyData = hasOrders || hasStats || hasBooths || hasHealth

        if (hasAnyData) {
          setRealConnected(true)
          setRealError('')
        } else {
          setRealConnected(false)
          setRealError('Connected backend did not return dashboard data. Confirm the admin service is available.')
        }

        if (hasOrders) setOrders(ordersRes.orders)
        if (hasStats) {
          // use dynamic stats if available
          setRealError('')
        }
        if (hasBooths) setBooths(boothsRes.booths)
        if (hasHealth) setHealth(healthRes.checks)
      } catch (error) {
        if (!isMounted) return
        setRealError('Unable to load admin data from backend. Using fallback mode.')
      }
    }

    loadAdminData()
    const adminInterval = setInterval(loadAdminData, 8000)
    return () => {
      isMounted = false
      clearInterval(adminInterval)
    }
  }, [isAuthorized])

  useEffect(() => {
    if (!isAuthorized) return
    const interval = setInterval(() => {
      setRefreshTick(t => t + 1)

      setOrders(prev => {
        const statusOrder = prev.map(order => {
          if (order.status === 'Printing' && Math.random() > 0.6) {
            return { ...order, status: 'Printed' }
          }
          if (order.status === 'Waiting' && Math.random() > 0.65) {
            return { ...order, status: 'Printing' }
          }
          if (order.status === 'Released' && Math.random() > 0.8) {
            return { ...order, status: 'Printing' }
          }
          return order
        })

        if (!realConnected && Math.random() > 0.7) {
          const nextId = `XBD-${Math.floor(1090 + Math.random() * 90)}`
          const types = ['Resume', 'Leave Letter', 'Bonafide', 'Assignment', 'Manual PDF']
          const type = types[Math.floor(Math.random() * types.length)]
          const pageCount = 1 + Math.floor(Math.random() * 8)
          const newest = {
            id: nextId,
            fileName: `${type.replace(' ', '_')}_${nextId}.pdf`,
            type,
            pages: pageCount,
            amount: pageCount * 14,
            booth: booths[Math.floor(Math.random() * booths.length)].name,
            status: 'Waiting',
            time: `${10 + Math.floor(Math.random() * 3)}:${10 + Math.floor(Math.random() * 50)} AM`,
          }
          return [newest, ...statusOrder].slice(0, 12)
        }

        return statusOrder
      })

      setBooths(prev => prev.map(booth => {
        const queue = Math.max(0, booth.queue + (Math.random() > 0.55 ? -1 : 1))
        return {
          ...booth,
          queue: Math.min(6, queue),
          connected: booth.online ? booth.connected : false,
        }
      }))

      setHealth(prev => prev.map(check => {
        if (!realConnected && Math.random() > 0.9) {
          const nextStatus = check.status === 'online' ? 'offline' : 'online'
          return { ...check, status: nextStatus }
        }
        return check
      }))
    }, 4500)

    return () => clearInterval(interval)
  }, [booths, realConnected])

  const handleRetry = id => {
    setOrders(prev => prev.map(order => order.id === id ? { ...order, status: 'Waiting' } : order))
  }

  const handleCancel = id => {
    setOrders(prev => prev.map(order => order.id === id ? { ...order, status: 'Failed' } : order))
  }

  const handleReprint = id => {
    setOrders(prev => prev.map(order => order.id === id ? { ...order, status: 'Printing' } : order))
  }

  const handlePauseBooth = name => {
    setBooths(prev => prev.map(booth => booth.name === name ? { ...booth, online: !booth.online, paused: !booth.paused } : booth))
  }

  const handleRestartBooth = name => {
    setBooths(prev => prev.map(booth => booth.name === name ? { ...booth, online: true, connected: true, paused: false } : booth))
  }

  const handleLockBooth = name => {
    setBooths(prev => prev.map(booth => booth.name === name ? { ...booth, locked: !booth.locked } : booth))
  }

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-[#07070d] text-white flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-md rounded-[2rem] border border-white/10 bg-slate-950/90 p-8 shadow-2xl shadow-black/40">
          <div className="mb-6">
            <p className="text-sm text-slate-400 uppercase tracking-[0.24em] mb-3">Admin Sign In</p>
            <h1 className="text-3xl font-semibold">Enter Admin Password</h1>
            <p className="mt-2 text-slate-500 text-sm">Access to the X Buddy admin dashboard is restricted.</p>
          </div>
          <form onSubmit={handleAdminLogin} className="space-y-4">
            <label className="block text-slate-400 text-sm">Password</label>
            <input
              type="password"
              value={adminPassword}
              onChange={handleAdminPasswordChange}
              placeholder="Enter admin password"
              className="w-full rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-3 text-white placeholder-slate-600 focus:border-purple-500 focus:outline-none"
            />
            {authError && <p className="text-rose-300 text-sm">{authError}</p>}
            <button
              type="submit"
              className="w-full rounded-2xl bg-purple-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-purple-500"
            >
              Unlock Dashboard
            </button>
          </form>
          <div className="mt-6 rounded-2xl bg-white/5 p-4 text-sm text-slate-400">
            Use the admin password provided by the operator.
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#07070d] text-white">
      <div className="max-w-[1480px] mx-auto px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="text-sm text-slate-400 uppercase tracking-[0.24em] mb-3">Premium Admin Dashboard</p>
            <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight">X Buddy Operations</h1>
            <p className="mt-3 text-slate-400 max-w-2xl">Monitor print queue flow, booth uptime, orders, and revenue from a startup-grade SaaS admin console.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <a href="/" className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-100 transition hover:border-purple-400/30 hover:bg-white/10">
              <RefreshCcw className="h-4 w-4 text-purple-300" />
              Back to User App
            </a>
          </div>
        </div>

        {realError ? (
          <div className="mb-6 rounded-3xl border border-rose-500/10 bg-rose-500/5 p-4 text-sm text-rose-100">
            <strong>Real data unavailable:</strong> {realError} The dashboard is currently using fallback sample values.
          </div>
        ) : realConnected ? (
          <div className="mb-6 rounded-3xl border border-emerald-500/10 bg-emerald-500/5 p-4 text-sm text-emerald-100">
            Connected to backend data source. Live order feed is active.
          </div>
        ) : (
          <div className="mb-6 rounded-3xl border border-slate-500/10 bg-slate-500/5 p-4 text-sm text-slate-200">
            Attempting to connect to the backend order feed...
          </div>
        )}

        <div className="mt-8 grid gap-4 xl:grid-cols-3">
          {[
            { label: 'Total Orders Today', value: stats.total, icon: <TrendingUp className="h-5 w-5" /> , trend: '+14%'},
            { label: 'Revenue Today', value: formatCurrency(stats.revenue), icon: <DollarSign className="h-5 w-5" /> , trend: '+11%' },
            { label: 'Pending Prints', value: stats.pending, icon: <Clock3 className="h-5 w-5" /> , trend: '-3%' },
            { label: 'Printed Orders', value: stats.printed, icon: <CheckCircle className="h-5 w-5" /> , trend: '+9%' },
            { label: 'Failed Orders', value: stats.failed, icon: <AlertTriangle className="h-5 w-5" /> , trend: '-2%' },
            { label: 'Active Booths', value: stats.active, icon: <Server className="h-5 w-5" /> , trend: '+4%' },
          ].map((card, index) => (
            <motion.div
              key={card.label}
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.04, duration: 0.35 }}
              className="rounded-3xl border border-white/10 bg-white/5 p-5 shadow-2xl shadow-black/5 backdrop-blur-xl"
            >
              <div className="flex items-start justify-between gap-6">
                <div>
                  <p className="text-sm text-slate-400">{card.label}</p>
                  <p className="mt-4 text-3xl font-semibold tracking-tight">{card.value}</p>
                </div>
                <div className="rounded-2xl bg-purple-500/10 p-3 text-purple-300">{card.icon}</div>
              </div>
              <div className="mt-4 flex items-center gap-2 text-sm text-slate-400">
                <ArrowUpRight className="h-4 w-4 text-emerald-400" />
                <span>{card.trend} vs last 24h</span>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="mt-8 grid gap-6 xl:grid-cols-[1.5fr_1fr]">
          <div className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-[2rem] border border-white/10 bg-white/5 p-6 shadow-2xl shadow-black/5 backdrop-blur-xl"
            >
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-sm text-slate-400">Live Order Monitoring</p>
                  <h2 className="mt-2 text-2xl font-semibold">Realtime Order Table</h2>
                </div>
                <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200">
                  <CircleDot className="h-3.5 w-3.5 text-emerald-300" /> Live updates
                </div>
              </div>
              <div className="mt-6 overflow-hidden rounded-[1.75rem] border border-white/10 bg-slate-950/80">
                <div className="grid grid-cols-[1.4fr_1fr_1fr_0.8fr_1fr_0.9fr_0.9fr_1.3fr] gap-4 px-5 py-4 text-xs uppercase tracking-[0.2em] text-slate-500 border-b border-white/10">
                  <span>Order ID</span>
                  <span>File Name</span>
                  <span>Type</span>
                  <span>Pages</span>
                  <span>Amount</span>
                  <span>Booth</span>
                  <span>Status</span>
                  <span>Actions</span>
                </div>
                <div className="max-h-[430px] overflow-y-auto">
                  {orders.map(order => (
                    <div key={order.id} className="grid grid-cols-[1.4fr_1fr_1fr_0.8fr_1fr_0.9fr_0.9fr_1.3fr] gap-4 px-5 py-4 text-sm text-slate-200 odd:bg-white/5 even:bg-white/2">
                      <span className="font-semibold text-slate-100">{order.id}</span>
                      <span className="truncate">{order.fileName}</span>
                      <span>{order.type}</span>
                      <span>{order.pages}</span>
                      <span>{formatCurrency(order.amount)}</span>
                      <span>{order.booth}</span>
                      <span className={`inline-flex items-center justify-center rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_STYLES[order.status] || 'bg-slate-500/10 text-slate-300'}`}>{order.status}</span>
                      <div className="flex flex-wrap gap-2">
                        <button onClick={() => handleRetry(order.id)} className="rounded-full bg-slate-800/90 px-3 py-1 text-[11px] uppercase tracking-[0.12em] text-slate-200 hover:bg-slate-700 transition">Retry</button>
                        <button onClick={() => handleCancel(order.id)} className="rounded-full bg-rose-500/10 px-3 py-1 text-[11px] uppercase tracking-[0.12em] text-rose-200 hover:bg-rose-500/15 transition">Cancel</button>
                        <button onClick={() => handleReprint(order.id)} className="rounded-full bg-violet-500/10 px-3 py-1 text-[11px] uppercase tracking-[0.12em] text-violet-200 hover:bg-violet-500/15 transition">Reprint</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-[2rem] border border-white/10 bg-white/5 p-6 shadow-2xl shadow-black/5 backdrop-blur-xl"
            >
              <div className="flex items-center justify-between gap-3 mb-5">
                <div>
                  <p className="text-sm text-slate-400">Revenue Performance</p>
                  <h2 className="text-2xl font-semibold">Revenue by Day</h2>
                </div>
                <span className="rounded-full bg-slate-900/80 px-3 py-2 text-xs uppercase tracking-[0.18em] text-slate-400">Last 7 days</span>
              </div>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={DAY_REVENUE} margin={{ top: 10, right: 24, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#A855F7" stopOpacity={0.7} />
                        <stop offset="95%" stopColor="#A855F7" stopOpacity={0.05} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
                    <XAxis dataKey="day" stroke="#94a3b8" axisLine={false} tickLine={false} />
                    <YAxis stroke="#94a3b8" axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ background: '#0b1220', border: '1px solid rgba(148,163,184,0.12)', borderRadius: '1rem' }} />
                    <Area type="monotone" dataKey="revenue" stroke="#A855F7" fill="url(#revenueGradient)" strokeWidth={3} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </motion.div>
          </div>

          <div className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-[2rem] border border-white/10 bg-white/5 p-6 shadow-2xl shadow-black/5 backdrop-blur-xl"
            >
              <div className="flex items-center justify-between gap-3 mb-5">
                <div>
                  <p className="text-sm text-slate-400">Hourly Load</p>
                  <h2 className="text-2xl font-semibold">Orders by Hour</h2>
                </div>
                <span className="rounded-full bg-slate-900/80 px-3 py-2 text-xs uppercase tracking-[0.18em] text-slate-400">Live feed</span>
              </div>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={HOUR_ORDERS} margin={{ top: 10, right: 12, left: -10, bottom: 10 }}>
                    <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
                    <XAxis dataKey="hour" stroke="#94a3b8" axisLine={false} tickLine={false} />
                    <YAxis stroke="#94a3b8" axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ background: '#0b1220', border: '1px solid rgba(148,163,184,0.12)', borderRadius: '1rem' }} />
                    <Bar dataKey="orders" fill="#38BDF8" radius={[10, 10, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-[2rem] border border-white/10 bg-white/5 p-6 shadow-2xl shadow-black/5 backdrop-blur-xl"
            >
              <div className="flex items-center justify-between gap-3 mb-5">
                <div>
                  <p className="text-sm text-slate-400">Document type demand</p>
                  <h2 className="text-2xl font-semibold">Most Used Documents</h2>
                </div>
                <span className="rounded-full bg-slate-900/80 px-3 py-2 text-xs uppercase tracking-[0.18em] text-slate-400">Usage</span>
              </div>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={DOC_USAGE} dataKey="value" nameKey="name" innerRadius={62} outerRadius={90} paddingAngle={4} stroke="transparent">
                      {DOC_USAGE.map(entry => (
                        <Cell key={entry.name} fill={entry.color} />
                      ))}
                    </Pie>
                    <Legend verticalAlign="bottom" align="center" iconType="circle" wrapperStyle={{ color: '#cbd5e1', fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-[2rem] border border-white/10 bg-white/5 p-6 shadow-2xl shadow-black/5 backdrop-blur-xl"
            >
              <div className="flex items-center justify-between gap-3 mb-5">
                <div>
                  <p className="text-sm text-slate-400">Hardware & uptime</p>
                  <h2 className="text-2xl font-semibold">Booth Management</h2>
                </div>
                <span className="rounded-full bg-slate-900/80 px-3 py-2 text-xs uppercase tracking-[0.18em] text-slate-400">Infrastructure</span>
              </div>
              <div className="space-y-4">
                {booths.map(booth => (
                  <div key={booth.name} className="rounded-3xl border border-white/10 bg-slate-950/80 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <div>
                        <h3 className="text-lg font-semibold">{booth.name}</h3>
                        <p className="text-sm text-slate-500">Printer {booth.connected ? 'Connected' : 'Disconnected'}</p>
                      </div>
                      <div className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium ${booth.online ? 'bg-emerald-500/10 text-emerald-300' : 'bg-rose-500/10 text-rose-300'}`}>
                        <span className={`h-2.5 w-2.5 rounded-full ${booth.online ? 'bg-emerald-300' : 'bg-rose-300'}`} />
                        {booth.online ? 'Online' : 'Offline'}
                      </div>
                    </div>
                    <div className="mt-4 grid grid-cols-2 gap-4 text-sm text-slate-400">
                      <div className="rounded-2xl bg-white/5 p-3">
                        <p className="text-slate-300">Queue</p>
                        <p className="mt-2 text-xl font-semibold">{booth.queue}</p>
                      </div>
                      <div className="rounded-2xl bg-white/5 p-3">
                        <p className="text-slate-300">Printed Today</p>
                        <p className="mt-2 text-xl font-semibold">{booth.printed}</p>
                      </div>
                      <div className="rounded-2xl bg-white/5 p-3">
                        <p className="text-slate-300">Rev Today</p>
                        <p className="mt-2 text-xl font-semibold">{formatCurrency(booth.revenue)}</p>
                      </div>
                      <div className="rounded-2xl bg-white/5 p-3">
                        <p className="text-slate-300">Locked</p>
                        <p className="mt-2 text-xl font-semibold">{booth.locked ? 'Yes' : 'No'}</p>
                      </div>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <button onClick={() => handlePauseBooth(booth.name)} className="inline-flex items-center gap-2 rounded-2xl bg-slate-900/90 px-3 py-2 text-sm text-slate-100 hover:bg-slate-800 transition">
                        <PauseCircle className="h-4 w-4" /> {booth.online ? 'Pause' : 'Resume'}
                      </button>
                      <button onClick={() => handleRestartBooth(booth.name)} className="inline-flex items-center gap-2 rounded-2xl bg-violet-500/10 px-3 py-2 text-sm text-violet-200 hover:bg-violet-500/15 transition">
                        <RefreshCcw className="h-4 w-4" /> Restart
                      </button>
                      <button onClick={() => handleLockBooth(booth.name)} className="inline-flex items-center gap-2 rounded-2xl bg-rose-500/10 px-3 py-2 text-sm text-rose-200 hover:bg-rose-500/15 transition">
                        <Lock className="h-4 w-4" /> {booth.locked ? 'Unlock' : 'Lock'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6 rounded-[2rem] border border-white/10 bg-white/5 p-6 shadow-2xl shadow-black/5 backdrop-blur-xl"
        >
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm text-slate-400">System health overview</p>
              <h2 className="text-2xl font-semibold">Infrastructure Status</h2>
            </div>
            <div className="rounded-full bg-slate-900/80 px-3 py-2 text-sm uppercase tracking-[0.18em] text-slate-400">Updated {refreshTick * 4}s ago</div>
          </div>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {health.map(check => (
              <div key={check.name} className="rounded-3xl border border-white/10 bg-slate-950/80 p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm text-slate-400">{check.name}</p>
                  <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${getBadge(check.status)}`}>{check.status}</span>
                </div>
                <p className="mt-3 text-lg font-semibold text-slate-100">{check.status === 'online' ? 'Healthy' : 'Needs attention'}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  )
}
