const LOCAL_API = 'http://localhost:3001'
const GAS_URL   = 'https://script.google.com/macros/s/AKfycbz_Np3K34IPwNSvzq8aFMKwNHMXkLb-cNcaLmGrnROGuSczlHcwO9OQi4dCBkOo68E85Q/exec'

let _tunnelUrl = null
let _lastFetch = 0
const CACHE_TTL = 30000 // re-fetch tunnel URL every 30s

export function isLocalPage() {
  const hostname = typeof window !== 'undefined' ? window.location.hostname : ''
  return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '[::1]' || (typeof window !== 'undefined' && window.location.protocol === 'http:')
}

export async function getTunnelUrl() {
  const now = Date.now()
  if (_tunnelUrl && now - _lastFetch < CACHE_TTL) return _tunnelUrl

  // 1. Try local agent (same-device)
  try {
    const res = await fetch(`${LOCAL_API}/tunnel-url`, { signal: AbortSignal.timeout(2000) })
    if (res.ok) {
      const data = await res.json()
      if (data?.url) { _tunnelUrl = data.url; _lastFetch = now; return _tunnelUrl }
    }
  } catch {}

  // 2. Try GAS (tunnel.js publishes URL here on every start)
  try {
    const res = await fetch(`${GAS_URL}?action=getTunnelUrl`, { signal: AbortSignal.timeout(5000) })
    if (res.ok) {
      const data = await res.json()
      if (data?.url?.startsWith('https://')) {
        _tunnelUrl = data.url; _lastFetch = now; return _tunnelUrl
      }
    }
  } catch {}

  return null
}

export async function getAgentEndpoints() {
  const tunnelUrl = await getTunnelUrl()
  const endpoints = []

  if (isLocalPage()) {
    endpoints.push(`${LOCAL_API}`)
  }

  if (tunnelUrl) {
    endpoints.push(tunnelUrl)
  }

  if (!isLocalPage() && !tunnelUrl) {
    endpoints.push(`${LOCAL_API}`)
  }

  return endpoints
}
