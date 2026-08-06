import { useEffect, useRef, useState } from 'react'
import { LayoutGrid, Upload, TrendingUp, Eye, Settings as SettingsIcon } from 'lucide-react'

const ITEMS = [
  { key: 'upload', label: 'Upload', icon: Upload, emoji: '📤' },
  { key: 'trends', label: 'Trends', icon: TrendingUp, emoji: '📈' },
  { key: 'general', label: 'General Analysis', icon: Eye, emoji: '📊' },
  { key: 'settings', label: 'Settings', icon: SettingsIcon, emoji: '⚙️' },
]

const ACTIVE_GROUPS = {
  upload: ['upload', 'processing', 'dashboard', 'error'],
  trends: ['trends'],
  general: ['general'],
  settings: ['settings'],
}

export default function NavMenu({ stage, onNavigate }) {
  const [open, setOpen] = useState(false)
  const wrapperRef = useRef(null)
  const closeTimer = useRef(null)

  useEffect(() => {
    function handleClickOutside(e) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  function openNow() {
    clearTimeout(closeTimer.current)
    setOpen(true)
  }

  function closeSoon() {
    closeTimer.current = setTimeout(() => setOpen(false), 180)
  }

  function isActive(key) {
    return ACTIVE_GROUPS[key].includes(stage)
  }

  return (
    <div
      className="relative"
      ref={wrapperRef}
      onMouseEnter={openNow}
      onMouseLeave={closeSoon}
    >
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-10 h-10 rounded-xl flex items-center justify-center bg-chrome text-white hover-glow-dark transition-transform hover:scale-105"
        aria-label="Open navigation menu"
        aria-expanded={open}
      >
        <LayoutGrid size={18} />
      </button>

      {open && (
        <div className="absolute left-0 top-full mt-3 w-64 bg-chrome border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50 animate-menu-in">
          <div className="py-2">
            {ITEMS.map(({ key, label, icon: Icon, emoji }) => (
              <button
                key={key}
                onClick={() => { onNavigate(key); setOpen(false) }}
                className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-display uppercase tracking-widest transition-all duration-200 hover:bg-white/10 hover:pl-5 ${
                  isActive(key) ? 'text-orange bg-white/5' : 'text-white/80'
                }`}
              >
                <span className="text-lg leading-none">{emoji}</span>
                <Icon size={15} />
                <span>{label}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}