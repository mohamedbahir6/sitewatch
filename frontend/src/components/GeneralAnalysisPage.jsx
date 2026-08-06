import { useEffect, useRef, useState } from 'react'
import { Eye, Box, Activity, ShieldAlert, ShieldCheck, FileText, UploadCloud, Download, History } from 'lucide-react'
import { generalUpload, generalAnalyze, generalStatus, generalResults, generalPdfUrl, generalHistory } from '../lib/api'
import GeneralChatWidget from './GeneralChatWidget'
import StatCard from './StatCard'

export default function GeneralAnalysisPage({ token }) {
  const [stage, setStage] = useState('upload')
  const [jobId, setJobId] = useState(null)
  const [result, setResult] = useState(null)
  const [errorMsg, setErrorMsg] = useState('')
  const inputRef = useRef(null)
  const [dragOver, setDragOver] = useState(false)
  const [history, setHistory] = useState([])
  const [historyKey, setHistoryKey] = useState(0)

  useEffect(() => {
    generalHistory(token).then(setHistory).catch(() => {})
  }, [token, historyKey])

  async function handleFile(file) {
    setStage('processing')
    setErrorMsg('')
    try {
      const { job_id } = await generalUpload(file, token)
      setJobId(job_id)
      await generalAnalyze(job_id, token)
      poll(job_id)
    } catch (e) {
      setErrorMsg(e.message)
      setStage('error')
    }
  }

  function poll(id) {
    const interval = setInterval(async () => {
      try {
        const s = await generalStatus(id, token)
        if (s.status === 'done') {
          clearInterval(interval)
          const r = await generalResults(id, token)
          setResult(r)
          setStage('done')
          setHistoryKey((k) => k + 1)
        } else if (s.status === 'error') {
          clearInterval(interval)
          setErrorMsg(s.error || 'Analysis failed')
          setStage('error')
        }
      } catch (e) {
        clearInterval(interval)
        setErrorMsg(e.message)
        setStage('error')
      }
    }, 3000)
  }

  async function openPast(id) {
    try {
      const r = await generalResults(id, token)
      setJobId(id)
      setResult(r)
      setStage('done')
    } catch (e) {
      setErrorMsg(e.message)
      setStage('error')
    }
  }

  function handleDrop(e) {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files?.[0]
    if (file) handleFile(file)
  }

  const safetyCount = result?.safety_observations?.length || 0
  const objectCount = result?.objects_detected?.length || 0
  const activityCount = result?.activities?.length || 0

  return (
    <section className="max-w-5xl mx-auto px-6 py-12">
      <div className="animate-fade-up mb-8 flex items-start justify-between gap-4">
        <div>
          <span className="font-mono text-xs tracking-[0.3em] uppercase text-orange">analysis video here</span>
          <h2 className="font-display text-3xl font-semibold mt-1 flex items-center gap-2">
            <Eye size={26} className="text-orange" /> General Video Analysis
          </h2>
          <p className="text-inksoft text-sm mt-1">
            Upload any video — Gemini watches it directly and describes what's happening,
            no custom-trained model required.
          </p>
        </div>
        {stage === 'done' && jobId && (
           <a
            href={generalPdfUrl(jobId, token)}
            className="flex items-center gap-1.5 bg-chrome text-white text-xs font-display uppercase tracking-widest px-4 py-2.5 rounded-lg hover:bg-orange transition-colors hover-lift shadow-sm shrink-0"
          >
            <Download size={14} /> PDF Report
          </a>
        )}
      </div>

      {stage === 'upload' && (
        <>
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => inputRef.current?.click()}
            className={`upload-drop animate-fade-up-1 border-2 border-dashed rounded-2xl p-14 text-center cursor-pointer
              ${dragOver ? 'border-orange bg-orange/5' : 'border-border bg-panel'}`}
          >
            <input
              ref={inputRef}
              type="file"
              accept="video/*"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
            />
            <UploadCloud size={28} className="mx-auto text-inksoft mb-3" />
            <p className="font-display text-lg font-bold text-ink">Drop video here, or click to browse</p>
            <p className="text-xs text-inksoft mt-2 font-mono">MP4 · MOV · AVI</p>
          </div>

          {history.length > 0 && (
            <div className="mt-8 animate-fade-up-2">
              <h3 className="font-display text-sm uppercase tracking-widest text-inksoft mb-3 flex items-center gap-2">
                <History size={15} /> Your Past Analyses
              </h3>
              <div className="grid gap-2">
                {history.map((h) => (
                  <button
                    key={h.id}
                    onClick={() => openPast(h.id)}
                    className="flex items-center justify-between bg-panel border border-border/70 rounded-lg px-4 py-3 text-left hover:border-orange transition-colors"
                  >
                    <span className="text-sm truncate">{h.filename || h.id}</span>
                    <span className="text-xs font-mono text-inksoft ml-4 shrink-0">
                      {new Date(h.uploaded_at * 1000).toLocaleDateString()}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {stage === 'processing' && (
        <div className="animate-fade-up-1 bg-panel border border-border/70 rounded-xl p-12 text-center">
          <div className="mx-auto w-12 h-12 rounded-full border-4 border-border border-t-orange spin-slow mb-5" />
          <p className="font-display text-lg font-bold text-ink">Gemini is watching your video…</p>
          <p className="text-xs text-inksoft mt-2">This can take a minute or two depending on video length.</p>
        </div>
      )}

      {stage === 'error' && (
        <div className="animate-fade-up-1 bg-danger/5 border border-danger/25 rounded-xl p-8 text-center text-danger">
          <p className="font-display font-bold">Analysis failed</p>
          <p className="text-sm mt-1">{errorMsg}</p>
          <button
            onClick={() => setStage('upload')}
            className="mt-4 bg-chrome text-white text-xs font-display uppercase tracking-widest px-4 py-2 rounded-lg hover:bg-orange transition-colors"
          >
            Try Again
          </button>
        </div>
      )}

      {stage === 'done' && result && (
        <div className="space-y-6 animate-fade-up-1">
          <div
            className={`flex items-center gap-3 rounded-xl px-5 py-4 border shadow-sm ${
              safetyCount > 0
                ? 'bg-danger/5 border-danger/25 text-danger'
                : 'bg-success/5 border-success/25 text-success'
            }`}
          >
            {safetyCount > 0 ? <ShieldAlert size={22} /> : <ShieldCheck size={22} />}
            <div>
              <p className="font-display text-sm uppercase tracking-widest">
                {safetyCount > 0 ? 'Safety Concerns Noted' : 'No Safety Concerns'}
              </p>
              <p className="text-sm mt-0.5 opacity-90">
                {safetyCount > 0
                  ? `${safetyCount} safety-relevant observation${safetyCount === 1 ? '' : 's'} found in this video.`
                  : 'Gemini did not flag any safety-relevant issues in this video.'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatCard index={0} icon={Box} label="Objects Detected" value={objectCount} />
            <StatCard index={1} icon={Activity} label="Activities" value={activityCount} />
            <StatCard index={2} icon={ShieldAlert} label="Safety Observations" value={safetyCount} tone={safetyCount > 0 ? 'danger' : 'success'} />
          </div>

          <div className="bg-panel border border-border/70 rounded-xl p-5 shadow-sm flex gap-3">
            <FileText size={18} className="text-orange shrink-0 mt-0.5" />
            <div>
              <p className="font-display text-xs uppercase tracking-widest text-inksoft mb-1">Overall Summary</p>
              <p className="text-sm text-ink leading-relaxed">{result.overall_summary}</p>
            </div>
          </div>

          {result.scene_description && (
            <div className="bg-panel border border-border/70 rounded-xl p-5 shadow-sm">
              <p className="font-display text-xs uppercase tracking-widest text-inksoft mb-2">Scene</p>
              <p className="text-sm text-ink leading-relaxed">{result.scene_description}</p>
            </div>
          )}

          <div className="grid sm:grid-cols-2 gap-5">
            <div className="bg-panel border border-border/70 rounded-xl p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <Box size={16} className="text-orange" />
                <p className="font-display text-xs uppercase tracking-widest text-inksoft">Objects Detected</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {(result.objects_detected || []).map((o, i) => (
                  <span key={i} className="text-xs bg-bg border border-border rounded-full px-3 py-1 text-ink">{o}</span>
                ))}
                {objectCount === 0 && <span className="text-xs text-inksoft">None noted</span>}
              </div>
            </div>

            <div className="bg-panel border border-border/70 rounded-xl p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <Activity size={16} className="text-orange" />
                <p className="font-display text-xs uppercase tracking-widest text-inksoft">Activities</p>
              </div>
              <ul className="space-y-1.5">
                {(result.activities || []).map((a, i) => (
                  <li key={i} className="text-sm text-ink flex gap-2"><span className="text-orange">•</span>{a}</li>
                ))}
                {activityCount === 0 && <li className="text-xs text-inksoft">None noted</li>}
              </ul>
            </div>
          </div>

          <div className="bg-panel border border-border/70 rounded-xl p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <ShieldAlert size={16} className="text-danger" />
              <p className="font-display text-xs uppercase tracking-widest text-inksoft">Safety Observations</p>
            </div>
            {safetyCount > 0 ? (
              <ul className="space-y-1.5">
                {result.safety_observations.map((s, i) => (
                  <li key={i} className="text-sm text-ink flex gap-2"><span className="text-danger">•</span>{s}</li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-inksoft">No safety concerns noted.</p>
            )}
          </div>

          <button
            onClick={() => { setStage('upload'); setResult(null); setJobId(null) }}
            className="text-xs font-display uppercase tracking-widest text-inksoft hover:text-orange transition-colors"
          >
            Analyze another video
          </button>
        </div>
      )}

      {stage === 'done' && jobId && <GeneralChatWidget jobId={jobId} token={token} />}
    </section>
  )
}