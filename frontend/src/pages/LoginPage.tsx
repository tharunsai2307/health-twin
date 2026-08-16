import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../components/ui/primitives'
import { api } from '../lib/api'

export function LoginPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('alex.johnson@demo.healthtwin')
  const [password, setPassword] = useState('demo1234')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await api.login(email, password)
      if (res.role === 'DOCTOR') {
        navigate('/doctor')
      } else {
        navigate('/app/dashboard')
      }
    } catch (err: any) {
      setError(err.message || 'Invalid credentials. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleDemoLogin = async (role: 'PATIENT' | 'DOCTOR') => {
    setLoading(true)
    setError('')
    const demoEmail = role === 'PATIENT' ? 'alex.johnson@demo.healthtwin' : 'arun.mehta@demo.healthtwin'
    const demoPass = role === 'PATIENT' ? 'demo1234' : 'doctor1234'
    try {
      const res = await api.login(demoEmail, demoPass)
      if (res.role === 'DOCTOR') {
        navigate('/doctor')
      } else {
        navigate('/app/dashboard')
      }
    } catch (err: any) {
      setError(err.message || 'Demo login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen">
      {/* Left brand panel */}
      <div className="hidden w-1/2 flex-col justify-between bg-gradient-to-br from-navy-900 via-navy-800 to-indigo-900 p-12 lg:flex">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10 text-lg backdrop-blur-sm">🧬</div>
            <div>
              <p className="text-lg font-bold text-white">HealthTwin</p>
              <p className="text-xs text-cyan-300">Universal Patient Information System</p>
            </div>
          </div>
        </div>
        <div>
          <h2 className="text-3xl font-bold leading-tight text-white">
            Your complete health story, in one place.
          </h2>
          <p className="mt-4 text-navy-300">
            From fragmented records to intelligent insights — patient-controlled, AI-powered, always explainable.
          </p>
          <div className="mt-8 flex gap-6">
            {['🧬 Digital Twin', '🛡️ Safety AI', '🔐 Your Control'].map((item) => (
              <span key={item} className="text-sm text-cyan-200">{item}</span>
            ))}
          </div>
        </div>
        <p className="text-xs text-navy-400">DEMO ENVIRONMENT — NOT REAL MEDICAL DATA</p>
      </div>

      {/* Right login card */}
      <div className="flex flex-1 items-center justify-center bg-surface p-6">
        <div className="w-full max-w-md">
          <div className="mb-8 lg:hidden">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-navy-900 to-indigo-600 text-sm">🧬</div>
              <span className="text-lg font-bold text-navy-900">HealthTwin</span>
            </div>
          </div>

          <div className="rounded-2xl border border-navy-100 bg-white p-8 shadow-lg shadow-navy-100/50">
            <h1 className="text-2xl font-bold text-navy-900">Welcome back</h1>
            <p className="mt-1 text-sm text-navy-500">Sign in to access your health profile</p>

            {error && (
              <div className="mt-4 rounded-lg bg-red-50 p-3.5 text-sm text-red-600 border border-red-100">
                {error}
              </div>
            )}

            <form className="mt-6 space-y-5" onSubmit={handleLogin}>
              <div>
                <label className="text-sm font-medium text-navy-700">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1.5 w-full rounded-lg border border-navy-200 px-4 py-2.5 text-sm text-navy-800 outline-none transition-colors focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium text-navy-700">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="mt-1.5 w-full rounded-lg border border-navy-200 px-4 py-2.5 text-sm text-navy-800 outline-none transition-colors focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                  required
                />
              </div>
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-sm text-navy-600">
                  <input type="checkbox" defaultChecked className="rounded border-navy-300" />
                  Remember me
                </label>
                <button type="button" className="text-sm font-medium text-indigo-600 hover:text-indigo-700">
                  Forgot Password
                </button>
              </div>
              <Button type="submit" className="w-full" size="lg" disabled={loading}>
                {loading ? 'Signing In...' : 'Sign In'}
              </Button>
            </form>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-navy-100" /></div>
              <div className="relative flex justify-center"><span className="bg-white px-3 text-xs text-navy-400">or continue as</span></div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="secondary"
                className="w-full"
                size="md"
                disabled={loading}
                onClick={() => handleDemoLogin('PATIENT')}
              >
                Demo Patient
              </Button>
              <Button
                variant="secondary"
                className="w-full"
                size="md"
                disabled={loading}
                onClick={() => handleDemoLogin('DOCTOR')}
              >
                Demo Doctor
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
