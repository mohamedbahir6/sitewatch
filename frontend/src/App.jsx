import { useEffect, useRef, useState } from 'react'
import { LogOut } from 'lucide-react'
import LandingPage from './components/LandingPage'
import AuthPage from './components/AuthPage'
import ThemeToggle from './components/ThemeToggle'
import Sidebar from './components/Sidebar'
import BackgroundGlow from './components/BackgroundGlow'
import UploadPanel from './components/UploadPanel'
import MyVideos from './components/MyVideos'
import Dashboard from './components/Dashboard'
import TrendsPage from './components/TrendsPage'
import GeneralAnalysisPage from './components/GeneralAnalysisPage'
import SettingsPage from './components/SettingsPage'
import ChatBot from './components/ChatBot'
import { uploadVideo, startAnalysis, getStatus, getResults } from './lib/api'

export default function App() {
  const [token, setToken] = useState(() => localStorage.getItem('sitewatch_token'))
  const [email, setEmail] = useState(() => localStorage.getItem('sitewatch_email') || '')
  const [screen, setScreen] = useState(() => (localStorage.getItem('sitewatch_token') ? 'app' : 'landing')) // landing | auth | app
  const [showAuth, setShowAuth] = useState(null) // null | 'login' | 'signup' — which tab Auth opens on
  const [stage, setStage] = useState('upload') // upload | processing | dashboard | error | trends | general | settings
  const [videoId, setVideoId] = useState(null)
  const [progress, setProgress] = useState(0)
  const [report, setReport] = useState(null)
  const [errorMsg, setErrorMsg] = useState('')
  const [videosRefreshKey, setVideosRefreshKey] = useState(0)
  const pollRef = useRef(null)

  function goToAuth(mode) {
    window.history.pushState({ screen: 'auth', authMode: mode, stage }, '', `#auth-${mode}`)
    setScreen('auth')
    setShowAuth(mode)
  }

  function backToLanding() {
    window.history.back()
  }

  function handleAuthed(newToken, newEmail) {
    localStorage.setItem('sitewatch_token', newToken)
    localStorage.setItem('sitewatch_email', newEmail)
    setToken(newToken)
    setEmail(newEmail)
    setStage('upload')
    setScreen('app')
    window.history.pushState({ screen: 'app', stage: 'upload' }, '', '#upload')
  }

  function logout() {
    localStorage.removeItem('sitewatch_token')
    localStorage.removeItem('sitewatch_email')
    setToken(null)
    setEmail('')
    setStage('upload')
    setReport(null)
    setShowAuth(null)
    setScreen('landing')
    window.history.pushState({ screen: 'landing' }, '', '#home')
  }

  function navigateTo(newStage) {
    if (newStage !== stage) {
      window.history.pushState({ screen: 'app', stage: newStage }, '', `#${newStage}`)
      setStage(newStage)
    }
  }

  useEffect(() => {
    function handlePopState(e) {
      const s = e.state
      if (!s) {
        setScreen(token ? 'app' : 'landing')
        return
      }
      if (s.screen === 'app' && !token) {
        // can't show the app without a session (e.g. logged out, then navigated forward again)
        setScreen('landing')
        return
      }
      setScreen(s.screen)
      if (s.screen === 'auth') setShowAuth(s.authMode || 'login')
      if (s.screen === 'app') setStage(s.stage || 'upload')
    }
    const initial = token ? { screen: 'app', stage: 'upload' } : { screen: 'landing' }
    window.history.replaceState(initial, '', token ? '#upload' : '#home')
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  async function pollUntilDone(id) {
    pollRef.current = setInterval(async () => {
      try {
        const s = await getStatus(id, token)
        setProgress(s.progress || 0)
        if (s.status === 'done') {
          clearInterval(pollRef.current)
          const r = await getResults(id, token)
          setReport(r)
          setStage('dashboard')
        } else if (s.status === 'error') {
          clearInterval(pollRef.current)
          setErrorMsg(s.error || 'Analysis failed')
          setStage('error')
        }
      } catch (e) {
        clearInterval(pollRef.current)
        setErrorMsg(e.message)
        setStage('error')
      }
    }, 1500)
  }

  async function handleFile(file) {
    setStage('processing')
    setProgress(0)
    try {
      const { video_id } = await uploadVideo(file, token)
      setVideoId(video_id)
      setVideosRefreshKey((k) => k + 1)
      await startAnalysis(video_id, token)
      pollUntilDone(video_id)
    } catch (e) {
      setErrorMsg(e.message)
      setStage('error')
    }
  }

  async function reanalyze(conf) {
    setStage('processing')
    setProgress(0)
    try {
      await startAnalysis(videoId, token, conf)
      pollUntilDone(videoId)
    } catch (e) {
      setErrorMsg(e.message)
      setStage('error')
    }
  }

  async function openPastVideo(id) {
    setVideoId(id)
    try {
      const r = await getResults(id, token)
      setReport(r)
      setStage('dashboard')
    } catch {
      setStage('processing')
      pollUntilDone(id)
    }
  }

  useEffect(() => () => clearInterval(pollRef.current), [])

  if (screen === 'landing') {
    return <LandingPage onShowAuth={goToAuth} />
  }

  if (screen === 'auth') {
    return (
      <div className="min-h-screen bg-bg font-body">
        <BackgroundGlow />
        <div className="hazard-bar-animated" />
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-end">
          <ThemeToggle />
        </div>
        <AuthPage onAuthed={handleAuthed} initialMode={showAuth || 'login'} onBack={backToLanding} />
      </div>
    )
  }

  if (!token) {
    return <LandingPage onShowAuth={goToAuth} />
  }

  return (
    <div className="min-h-screen bg-bg font-body">
      <BackgroundGlow />
      <div className="hazard-bar-animated" />
      <div className="flex">
        <Sidebar stage={stage} onNavigate={navigateTo} />

        <div className="flex-1 min-w-0">
          <header className="border-b border-border sticky top-0 z-40 bg-bg/95 backdrop-blur-sm">
            <div className="px-6 py-4 flex items-center justify-end gap-4">
              <ThemeToggle />
              <span className="font-mono text-xs text-inksoft hidden sm:inline">{email}</span>
              <button
                onClick={logout}
                className="flex items-center gap-1.5 font-mono text-xs uppercase tracking-widest text-inksoft hover:text-orange transition-colors"
              >
                <LogOut size={13} /> Log out
              </button>
            </div>
          </header>

          {stage === 'upload' && (
            <>
              <UploadPanel onFileSelected={handleFile} busy={false} />
              <MyVideos token={token} onOpen={openPastVideo} refreshKey={videosRefreshKey} />
            </>
          )}

          {stage === 'processing' && (
            <section className="max-w-xl mx-auto px-6 pt-28 text-center animate-fade-up">
              <div className="mx-auto w-14 h-14 rounded-full border-4 border-border border-t-orange spin-slow mb-6" />
              <span className="font-mono text-xs tracking-[0.3em] uppercase text-orange">Scanning Footage</span>
              <h2 className="font-display text-3xl font-semibold mt-3">Running detection frame by frame…</h2>
              <div className="mt-8 h-2 bg-panel border border-border rounded-full overflow-hidden">
                <div className="h-full progress-shimmer transition-all duration-500" style={{ width: `${progress}%` }} />
              </div>
              <p className="font-mono text-sm text-inksoft mt-3">{progress}%</p>
            </section>
          )}

          {stage === 'dashboard' && report && (
            <>
              <Dashboard videoId={videoId} report={report} token={token} onReanalyze={reanalyze} />
              <ChatBot videoId={videoId} token={token} />
            </>
          )}

          {stage === 'trends' && <TrendsPage token={token} />}

          {stage === 'general' && <GeneralAnalysisPage token={token} />}

          {stage === 'settings' && <SettingsPage token={token} />}

          {stage === 'error' && (
            <section className="max-w-xl mx-auto px-6 pt-28 text-center">
              <span className="font-mono text-xs tracking-[0.3em] uppercase text-danger">Analysis Failed</span>
              <h2 className="font-display text-2xl font-semibold mt-3">{errorMsg}</h2>
              <button
                onClick={() => navigateTo('upload')}
                className="mt-6 bg-chrome text-white px-5 py-2 rounded-sm font-display uppercase tracking-widest text-sm hover:bg-orange transition-colors"
              >
                Try Again
              </button>
            </section>
          )}
        </div>
      </div>
    </div>
  )
}