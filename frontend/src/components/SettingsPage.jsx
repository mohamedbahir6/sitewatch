import { useEffect, useState } from 'react'
import { Settings as SettingsIcon, Mail, CheckCircle2, Clock, Send } from 'lucide-react'
import { getSettings, saveSettings } from '../lib/api'

export default function SettingsPage({ token }) {
  const [managerEmail, setManagerEmail] = useState('')
  const [verified, setVerified] = useState(false)
  const [savedEmail, setSavedEmail] = useState(null)
  const [status, setStatus] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    getSettings(token).then((s) => {
      setSavedEmail(s.manager_email)
      setVerified(s.verified)
      if (s.manager_email) setManagerEmail(s.manager_email)
    }).catch(() => {})
  }, [token])

  async function handleSave(e) {
    e.preventDefault()
    setError('')
    setStatus('')
    setSaving(true)
    try {
      await saveSettings(managerEmail, token)
      setSavedEmail(managerEmail)
      setVerified(false)
      setStatus(`Verification email sent to ${managerEmail} — reports will start sending once they confirm.`)
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="max-w-2xl mx-auto px-6 py-12">
      <div className="animate-fade-up mb-8">
        <span className="font-mono text-xs tracking-[0.3em] uppercase text-orange">Report Delivery</span>
        <h2 className="font-display text-3xl font-semibold mt-1 flex items-center gap-2">
          <SettingsIcon size={26} className="text-orange" /> Settings
        </h2>
        <p className="text-inksoft text-sm mt-1">
          Add a manager's email to automatically receive the PDF report every
          time a new PPE analysis finishes.
        </p>
      </div>

      {savedEmail && (
        <div
          className={`animate-fade-up-1 mb-6 flex items-center gap-3 rounded-xl px-5 py-4 border shadow-sm ${
            verified ? 'bg-success/5 border-success/25 text-success' : 'bg-amber/10 border-amber/30 text-ink'
          }`}
        >
          {verified ? <CheckCircle2 size={20} /> : <Clock size={20} />}
          <div>
            <p className="font-display text-sm uppercase tracking-widest">
              {verified ? 'Verified' : 'Pending Verification'}
            </p>
            <p className="text-sm mt-0.5 opacity-90">
              {savedEmail} {verified ? 'will receive future reports.' : '— waiting for them to click the confirmation link.'}
            </p>
          </div>
        </div>
      )}

      <form onSubmit={handleSave} className="animate-fade-up-2 bg-panel border border-border/70 rounded-xl p-6 shadow-sm space-y-5">
        <div>
          <label className="text-xs font-mono uppercase tracking-widest text-inksoft flex items-center gap-1.5 mb-1.5">
            <Mail size={13} /> Manager's Email
          </label>
          <input
            type="email"
            required
            value={managerEmail}
            onChange={(e) => setManagerEmail(e.target.value)}
            placeholder="manager@company.com"
            className="w-full px-3 py-2 border border-border rounded-lg outline-none focus:border-orange bg-panel text-ink"
          />
        </div>

        {error && <p className="text-danger text-sm">{error}</p>}
        {status && <p className="text-success text-sm">{status}</p>}

        <button
          type="submit"
          disabled={saving}
          className="flex items-center gap-1.5 bg-chrome text-white font-display uppercase tracking-widest text-sm px-5 py-2.5 rounded-lg hover:bg-orange transition-colors hover-lift disabled:opacity-60"
        >
          <Send size={14} /> {saving ? 'Saving…' : 'Save & Send Verification'}
        </button>
      </form>
    </section>
  )
}