const LOCAL_API = 'http://localhost:3001'
const GITHUB_RAW = 'https://raw.githubusercontent.com/xbuddy11-dev/xbuddyserver/main/xerox%20buddy/public/tunnel-url.txt'

let _tunnelUrl = null

export function isLocalPage() {
  const hostname = typeof window !== 'undefined' ? window.location.hostname : ''
  return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '[::1]' || (typeof window !== 'undefined' && window.location.protocol === 'http:')
}

export async function getTunnelUrl() {
  if (_tunnelUrl) return _tunnelUrl

  try {
    const res = await fetch(`${LOCAL_API}/tunnel-url`, { signal: AbortSignal.timeout(2000) })
    if (res.ok) {
      const data = await res.json()
      if (data?.url) {
        _tunnelUrl = data.url
        return _tunnelUrl
      }
    }
  } catch {}

  try {
    const res = await fetch(`${GITHUB_RAW}?t=${Date.now()}`, { signal: AbortSignal.timeout(5000) })
    if (res.ok) {
      const url = (await res.text()).trim()
      if (url.startsWith('https://')) {
        _tunnelUrl = url
        return _tunnelUrl
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
