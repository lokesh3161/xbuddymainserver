import { useState } from 'react'
import { loginWithGoogle, loginWithEmail, registerWithEmail } from '../utils/firebase'

export default function Login({ onLogin }) {
  const [isRegister, setIsRegister] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleEmail(e) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const user = isRegister
        ? await registerWithEmail(email, password)
        : await loginWithEmail(email, password)
      onLogin(user)
    } catch (err) {
      setError(err.message.replace('Firebase: ', ''))
    }
    setLoading(false)
  }

  async function handleGoogle() {
    setLoading(true)
    setError('')
    try {
      const user = await loginWithGoogle()
      onLogin(user)
    } catch (err) {
      setError(err.message.replace('Firebase: ', ''))
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="bg-gray-900 rounded-2xl p-8 w-full max-w-md border border-gray-800">
        <h1 className="text-3xl font-bold text-white mb-2">X Buddy</h1>
        <p className="text-gray-400 mb-8">{isRegister ? 'Create your shop account' : 'Sign in to your shop'}</p>

        <button onClick={handleGoogle} disabled={loading}
          className="w-full bg-white text-gray-900 font-semibold py-3 rounded-xl mb-4 hover:bg-gray-100 transition">
          Continue with Google
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="flex-1 h-px bg-gray-700" />
          <span className="text-gray-500 text-sm">or</span>
          <div className="flex-1 h-px bg-gray-700" />
        </div>

        <form onSubmit={handleEmail} className="flex flex-col gap-3">
          <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)}
            className="bg-gray-800 text-white rounded-xl px-4 py-3 outline-none border border-gray-700 focus:border-blue-500" required />
          <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)}
            className="bg-gray-800 text-white rounded-xl px-4 py-3 outline-none border border-gray-700 focus:border-blue-500" required />
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <button type="submit" disabled={loading}
            className="bg-blue-600 text-white font-semibold py-3 rounded-xl hover:bg-blue-700 transition">
            {loading ? 'Please wait...' : isRegister ? 'Create Account' : 'Sign In'}
          </button>
        </form>

        <p className="text-gray-500 text-sm text-center mt-4">
          {isRegister ? 'Already have an account?' : "Don't have an account?"}
          <button onClick={() => setIsRegister(!isRegister)} className="text-blue-400 ml-1 hover:underline">
            {isRegister ? 'Sign In' : 'Register'}
          </button>
        </p>
      </div>
    </div>
  )
}
