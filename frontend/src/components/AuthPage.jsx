import { useEffect, useRef, useState } from 'react'
import { ShieldCheck, CheckCircle2, ArrowLeft } from 'lucide-react'
import { login, signup } from '../lib/api'

const FEATURES = ['Your own trained model', 'Auto PDF reports', 'AI safety assistant']

export default function AuthPage({ onAuthed, initialMode = 'login', onBack }) {
  const [mode, setMode] = useState(initialMode)
  useEffect(() => setMode(initialMode), [initialMode])

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const cardRef = useRef(null)
  const [tilt, setTilt] = useState({ x: 0, y: 0 })

  function handleMouseMove(e) {
    const rect = cardRef.current.getBoundingClientRect()
    const x = (e.clientX - rect.left) / rect.width - 0.5
    const y = (e.clientY - rect.top) / rect.height - 0.5
    setTilt({ x: x * 6, y: -y * 6 })
  }
  function resetTilt() {
    setTilt({ x: 0, y: 0 })
  }

  async function submit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const fn = mode === 'login' ? login : signup
      const { token } = await fn(email, password)
      onAuthed(token, email)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="max-w-3xl mx-auto px-6 pt-16 pb-16">
      {onBack && (
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-sm text-inksoft hover:text-ink transition-colors mb-6"
        >
          <ArrowLeft size={15} /> Back to home
        </button>
      )}
      <div
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={resetTilt}
        className="flex flex-col sm:flex-row rounded-2xl overflow-hidden shadow-2xl transition-transform duration-150 ease-out"
        style={{ transform: `perspective(1200px) rotateY(${tilt.x}deg) rotateX(${tilt.y}deg)` }}
      >
        <div className="sm:w-[42%] bg-chrome px-7 py-8 flex flex-col justify-between">
          <div className="flex items-center gap-2.5">
            <ShieldCheck size={22} className="text-orange" strokeWidth={2.4} />
            <span className="text-white font-display text-sm tracking-wide">SITEWATCH</span>
          </div>
          <div>
            <p className="text-white font-display text-xl font-semibold leading-snug mb-5">
              Every missing hardhat,<br /> caught on frame one.
            </p>
            <div className="flex flex-col gap-2.5">
              {FEATURES.map((f) => (
                <div key={f} className="flex items-center gap-2">
                  <CheckCircle2 size={15} className="text-orange shrink-0" />
                  <span className="text-white/75 text-xs">{f}</span>
                </div>
              ))}
            </div>
          </div>
          <span className="text-white/40 text-[11px]">Your data stays local</span>
        </div>

        <div className="flex-1 bg-panel px-8 sm:px-11 py-10 flex flex-col justify-center">
          <div className="relative flex bg-bg rounded-xl p-1 mb-6" style={{ boxShadow: 'inset 0 1px 4px rgba(0,0,0,0.12)' }}>
            <div
              className="absolute top-1 left-1 w-[calc(50%-4px)] h-[calc(100%-8px)] bg-chrome rounded-lg transition-transform duration-300"
              style={{
                transform: mode === 'signup' ? 'translateX(100%)' : 'translateX(0)',
                boxShadow: '0 3px 8px rgba(0,0,0,0.3), 0 0 0 1px rgba(96,165,250,0.35)',
              }}
            />
            <button
              type="button"
              onClick={() => { setMode('login'); setError('') }}
              className={`relative flex-1 text-center py-2.5 text-xs font-display uppercase tracking-widest transition-colors ${mode === 'login' ? 'text-white' : 'text-inksoft'}`}
            >
              Log in
            </button>
            <button
              type="button"
              onClick={() => { setMode('signup'); setError('') }}
              className={`relative flex-1 text-center py-2.5 text-xs font-display uppercase tracking-widest transition-colors ${mode === 'signup' ? 'text-white' : 'text-inksoft'}`}
            >
              Sign up
            </button>
          </div>

          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="text-xs font-mono uppercase tracking-widest text-inksoft">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full mt-1 px-3 py-2 border border-border rounded-lg outline-none focus:border-orange bg-panel text-ink"
                placeholder="you@plant.com"
              />
            </div>
            <div>
              <label className="text-xs font-mono uppercase tracking-widest text-inksoft">Password</label>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full mt-1 px-3 py-2 border border-border rounded-lg outline-none focus:border-orange bg-panel text-ink"
                placeholder="At least 6 characters"
              />
            </div>

            {error && <p className="text-danger text-sm">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-chrome text-white py-2.5 rounded-lg font-display uppercase tracking-widest text-sm hover:bg-orange transition-colors hover-lift disabled:opacity-60"
            >
              {loading ? 'Please wait…' : mode === 'login' ? 'Log in' : 'Sign up'}
            </button>
          </form>

          <p className="text-center text-sm text-inksoft mt-6">
            {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
            <button
              type="button"
              onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError('') }}
              className="text-orange font-medium hover:underline"
            >
              {mode === 'login' ? 'Sign up' : 'Log in'}
            </button>
          </p>
        </div>
      </div>
    </section>
  )
}