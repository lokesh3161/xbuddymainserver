import { auth, getShopConfig } from './firebase'

const LOCAL_API  = 'http://localhost:3001'
const DEFAULT_GAS_URL = 'https://script.google.com/macros/s/AKfycbz_Np3K34IPwNSvzq8aFMKwNHMXkLb-cNcaLmGrnROGuSczlHcwO9OQi4dCBkOo68E85Q/exec'

let _tunnelUrl = null
let _tunnelFetchedAt = 0
let _shopConfig = null
const TUNNEL_TTL = 30000

async function getConfig() {
  if (_shopConfig) return _shopConfig
  const user = auth.currentUser
  if (user) _shopConfig = await getShopConfig(user.uid)
  return _shopConfig
}

async function getGasUrl() {
  // 1. URL Query Parameter ?gasUrl=
  if (typeof window !== 'undefined') {
    try {
      const urlParams = new URLSearchParams(window.location.search)
      const paramGasUrl = urlParams.get('gasUrl') || urlParams.get('gas_url')
      if (paramGasUrl && paramGasUrl.startsWith('https://')) {
        localStorage.setItem('xbuddy_gas_url', paramGasUrl)
        return paramGasUrl
      }
    } catch (e) {}
  }

  // 2. Try Auto-Discovery from Local Agent running on http://localhost:3001/config
  try {
    const res = await fetch(`${LOCAL_API}/config`, { signal: AbortSignal.timeout(2000) })
    if (res.ok) {
      const data = await res.json()
      if (data?.gasUrl && data.gasUrl.startsWith('https://')) {
        if (typeof window !== 'undefined') {
          localStorage.setItem('xbuddy_gas_url', data.gasUrl)
        }
        return data.gasUrl
      }
    }
  } catch (e) {}

  // 3. Saved in LocalStorage
  if (typeof window !== 'undefined') {
    const savedGasUrl = localStorage.getItem('xbuddy_gas_url')
    if (savedGasUrl && savedGasUrl.startsWith('https://')) return savedGasUrl
  }

  // 4. Firebase Config or Default fallback
  const config = await getConfig()
  return config?.gasUrl || DEFAULT_GAS_URL
}

async function getTunnelUrl() {
  const now = Date.now()
  if (_tunnelUrl && now - _tunnelFetchedAt < TUNNEL_TTL) return _tunnelUrl

  // 1. Try local agent
  try {
    const res = await fetch(`${LOCAL_API}/tunnel-url`, { signal: AbortSignal.timeout(2000) })
    if (res.ok) {
      const data = await res.json()
      if (data?.url) { _tunnelUrl = data.url; _tunnelFetchedAt = now; return _tunnelUrl }
    }
  } catch {}

  // 2. Try GAS (tunnel.js publishes URL here on every agent start)
  try {
    const gasUrl = await getGasUrl()
    const res = await fetch(`${gasUrl}?action=getTunnelUrl`, { signal: AbortSignal.timeout(5000) })
    if (res.ok) {
      const data = await res.json()
      if (data?.url?.startsWith('https://')) {
        _tunnelUrl = data.url; _tunnelFetchedAt = now; return _tunnelUrl
      }
    }
  } catch {}

  return null
}

async function gasGet(params) {
  try {
    const gasUrl = await getGasUrl()
    const res = await fetch(`${gasUrl}?${new URLSearchParams(params).toString()}`)
    return await res.json()
  } catch {
    return null
  }
}

async function localGet(path) {
  try {
    const res = await fetch(`${LOCAL_API}${path}`, { signal: AbortSignal.timeout(2000) })
    if (!res.ok) return null
    return await res.json()
  } catch {
    return null
  }
}

// Send PDF + screenshot to print agent — tries local first, then tunnel
async function sendToLocalAgent(orderId, fileName, pdfBase64, screenshotBase64) {
  const tunnelUrl = await getTunnelUrl()

  // Build list of endpoints to try — local first, tunnel second
  const endpoints = [
    `${LOCAL_API}/save-order`,
    tunnelUrl ? `${tunnelUrl}/save-order` : null,
  ].filter(Boolean)

  for (const url of endpoints) {
    try {
      const res = await fetch(url, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ orderId, fileName, pdfBase64, screenshotBase64 }),
        signal:  AbortSignal.timeout(15000),
      })
      if (!res.ok) continue
      const data = await res.json()
      if (data?.success) {
        console.log(`[api] PDF saved via: ${url}`)
        return true
      }
    } catch {
      continue
    }
  }
  console.warn('[api] Could not reach print agent — PDF not saved locally')
  return false
}

export async function getOrderStatus(orderId) {
  return await gasGet({ action: 'getOrderStatus', orderId })
}

export async function fetchAdminOrders() {
  return await localGet('/admin/orders') ?? await gasGet({ action: 'listOrders' })
}

export async function fetchAdminStats() {
  return await localGet('/admin/stats') ?? await gasGet({ action: 'getDashboard' })
}

export async function fetchBoothStatus() {
  return await localGet('/admin/booths') ?? await gasGet({ action: 'getBooths' })
}

export async function fetchHealthStatus() {
  return await localGet('/admin/health') ?? await gasGet({ action: 'getHealth' })
}

export async function boothLogin(pin) {
  const tunnelUrl = await getTunnelUrl()
  const endpoints = [
    `${LOCAL_API}/booth-login`,
    tunnelUrl ? `${tunnelUrl}/booth-login` : null,
  ].filter(Boolean)

  for (const url of endpoints) {
    try {
      const res = await fetch(url, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ pin }),
        signal:  AbortSignal.timeout(5000),
      })
      if (res.ok) return await res.json()
    } catch { continue }
  }
  return { success: false, error: 'Could not connect to print agent.' }
}

export async function validateAndRelease(orderId) {
  const tunnelUrl = await getTunnelUrl()
  const endpoints = [
    `${LOCAL_API}/release-print`,
    tunnelUrl ? `${tunnelUrl}/release-print` : null,
  ].filter(Boolean)

  for (const url of endpoints) {
    try {
      const res = await fetch(url, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ orderId }),
        signal:  AbortSignal.timeout(10000),
      })
      if (res.ok) return await res.json()
    } catch { continue }
  }
  return { success: false, error: 'Could not connect to print agent. Is it running?' }
}

export async function submitOrder(orderData) {
  const orderId = 'XB' + (1000 + Math.floor(Math.random() * 9000))

  // Pre-fetch tunnel URL before submitting (so it's ready)
  await getTunnelUrl()

  await sendToLocalAgent(
    orderId,
    orderData.fileName,
    orderData.pdfBase64 || '',
    orderData.screenshotBase64 || ''
  )

  await gasGet({
    action:        'saveOrder',
    orderId,
    name:          orderData.name,
    fileName:      orderData.fileName,
    totalPages:    String(orderData.totalPages),
    copies:        String(orderData.copies),
    printType:     orderData.printType,
    printSide:     orderData.printSide || '',
    amount:        String(orderData.amount),
    transactionId: orderData.transactionId,
  })

  return { success: true, orderId }
}

export async function verifyShop(shopData) {
  const endpoints = [
    '/api/shop/verify',
    `${LOCAL_API}/api/shop/verify`,
  ]
  for (const url of endpoints) {
    try {
      const res = await fetch(url, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(shopData),
        signal:  AbortSignal.timeout(12000),
      })
      const data = await res.json()
      if (res.ok && data.success) {
        if (shopData?.gasUrl && typeof window !== 'undefined') {
          localStorage.setItem('xbuddy_gas_url', shopData.gasUrl)
        }
        return data
      }
      if (data && data.error) {
        return { success: false, error: data.error }
      }
    } catch {
      continue
    }
  }
  return {
    success: false,
    error: 'Unable to connect to the backend verification server. Please verify that the backend server is running.',
  }
}

export async function downloadShopPackage(shopData) {
  const endpoints = [
    '/api/shop/package',
    `${LOCAL_API}/api/shop/package`,
  ]
  for (const url of endpoints) {
    try {
      const res = await fetch(url, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(shopData),
      })
      if (res.ok) {
        const blob = await res.blob()
        const downloadUrl = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = downloadUrl
        a.download = 'XBuddy-Shop-Package.zip'
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(downloadUrl)
        a.remove()
        return { success: true }
      }
    } catch {
      continue
    }
  }
  return { success: false, error: 'Failed to generate and download shop package. Please try again.' }
}

