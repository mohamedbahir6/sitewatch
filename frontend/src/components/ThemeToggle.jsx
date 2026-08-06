import { useEffect, useState } from 'react'
import { Sun, Moon } from 'lucide-react'

export default function ThemeToggle() {
  const [dark, setDark] = useState(
    () => typeof document !== 'undefined' && document.documentElement.classList.contains('dark')
  )

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
    localStorage.setItem('sitewatch_theme', dark ? 'dark' : 'light')
  }, [dark])

  return (
    <button
      onClick={() => setDark((d) => !d)}
      className="w-8 h-8 rounded-lg flex items-center justify-center border border-border bg-panel text-inksoft hover:text-ink hover:border-orange transition-colors shrink-0"
      aria-label="Toggle dark mode"
    >
      {dark ? <Sun size={15} /> : <Moon size={15} />}
    </button>
  )
}