import { useState } from 'react'
import { saveShopConfig } from '../utils/firebase'

export default function ShopSetup({ user, onComplete }) {
  const [shopName, setShopName] = useState('')
  const [sheetId, setSheetId] = useState('')
  const [gasUrl, setGasUrl] = useState('')
  const [boothPin, setBoothPin] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    if (boothPin.length !== 4 || isNaN(boothPin)) return setError('PIN must be 4 digits')
    setLoading(true)
    try {
      await saveShopConfig(user.uid, {
        shopName,
        sheetId,
        gasUrl,
        boothPin,
        email: user.email,
        shopId: 'XB-' + user.uid.slice(0, 6).toUpperCase(),
        createdAt: new Date().toISOString()
      })
      onComplete()
    } catch (err) {
      setError(err.message)
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="bg-gray-900 rounded-2xl p-8 w-full max-w-md border border-gray-800">
        <h1 className="text-2xl font-bold text-white mb-1">Setup Your Shop</h1>
        <p className="text-gray-400 mb-6">Connect your Google Sheet to get started</p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <input placeholder="Shop Name" value={shopName} onChange={e => setShopName(e.target.value)}
            className="bg-gray-800 text-white rounded-xl px-4 py-3 outline-none border border-gray-700 focus:border-blue-500" required />
          <input placeholder="Google Sheet ID" value={sheetId} onChange={e => setSheetId(e.target.value)}
            className="bg-gray-800 text-white rounded-xl px-4 py-3 outline-none border border-gray-700 focus:border-blue-500" required />
          <input placeholder="GAS URL" value={gasUrl} onChange={e => setGasUrl(e.target.value)}
            className="bg-gray-800 text-white rounded-xl px-4 py-3 outline-none border border-gray-700 focus:border-blue-500" required />
          <input placeholder="4-digit Booth PIN" value={boothPin} onChange={e => setBoothPin(e.target.value)} maxLength={4}
            className="bg-gray-800 text-white rounded-xl px-4 py-3 outline-none border border-gray-700 focus:border-blue-500" required />
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <button type="submit" disabled={loading}
            className="bg-blue-600 text-white font-semibold py-3 rounded-xl hover:bg-blue-700 transition">
            {loading ? 'Saving...' : 'Complete Setup'}
          </button>
        </form>
      </div>
    </div>
  )
}
