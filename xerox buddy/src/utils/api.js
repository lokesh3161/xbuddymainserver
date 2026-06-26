const API_URL    = 'https://script.google.com/macros/s/AKfycbwDcsGng774iNQ9zNdBt-bdkIFGSg7_lvr5MRvIzzqE6s9bGex7ej1U1WChrY-KgOM/exec'
const LOCAL_API  = 'http://localhost:3001'
const GITHUB_RAW = 'https://raw.githubusercontent.com/lokesh3161/X-buddy/main/public/tunnel-url.txt'

let _tunnelUrl = null

async function getTunnelUrl() {
  if (_tunnelUrl) return _tunnelUrl
  try {
    const res = await fetch(`${LOCAL_API}/tunnel-url`, { signal: AbortSignal.timeout(2000) })
    if (res.ok) {
      const data = await res.json()
      if (data?.url) { _tunnelUrl = data.url; return _tunnelUrl }
    }
  } catch {}
  try {
    const res = await fetch(`${GITHUB_RAW}?t=${Date.now()}`, { signal: AbortSignal.timeout(5000) })
    if (res.ok) {
      const url = (await res.text()).trim()
      if (url.startsWith('https://')) { _tunnelUrl = url; return _tunnelUrl }
    }
  } catch {}
  try {
    const res = await fetch(`${API_URL}?action=getTunnelUrl`, { signal: AbortSignal.timeout(4000) })
    if (res.ok) {
      const data = await res.json()
      if (data?.url) { _tunnelUrl = data.url; return _tunnelUrl }
    }
  } catch {}
  return null
}

async function gasGet(params) {
  try {
    const res = await fetch(`${API_URL}?${new URLSearchParams(params).toString()}`)
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
