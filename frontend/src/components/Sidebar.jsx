import { ShieldCheck, Upload, TrendingUp, Eye, Settings as SettingsIcon } from 'lucide-react'

const ITEMS = [
  { key: 'upload', label: 'Upload', icon: Upload },
  { key: 'trends', label: 'Trends', icon: TrendingUp },
  { key: 'general', label: 'General Analysis', icon: Eye },
  { key: 'settings', label: 'Settings', icon: SettingsIcon },
]

const ACTIVE_GROUPS = {
  upload: ['upload', 'processing', 'dashboard', 'error'],
  trends: ['trends'],
  general: ['general'],
  settings: ['settings'],
}

export default function Sidebar({ stage, onNavigate }) {
  function isActive(key) {
    return ACTIVE_GROUPS[key].includes(stage)
  }

  return (
    <aside className="hidden md:flex w-56 shrink-0 bg-chrome sticky top-0 h-screen flex-col">
      <div className="px-4 py-5 border-b border-white/10 flex items-center gap-2.5">
        <ShieldCheck size={22} className="text-orange shrink-0" strokeWidth={2.4} />
        <span className="text-white font-display text-sm tracking-wide">SITEWATCH</span>
      </div>

      <nav className="p-2 flex flex-col gap-1 mt-2">
        {ITEMS.map(({ key, label, icon: Icon }) => {
          const active = isActive(key)
          return (
            <button
              key={key}
              onClick={() => onNavigate(key)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-display uppercase tracking-widest transition-all duration-200 hover:bg-white/10"
              style={
                active
                  ? {
                      color: '#60A5FA',
                      background: 'rgba(96,165,250,0.15)',
                      boxShadow:
                        '0 0 0 1px rgba(96,165,250,0.4), 0 0 14px rgba(96,165,250,0.25)',
                    }
                  : { color: 'rgba(255,255,255,0.75)' }
              }
            >
              <Icon size={17} />
              <span>{label}</span>
            </button>
          )
        })}
      </nav>
    </aside>
  )
}