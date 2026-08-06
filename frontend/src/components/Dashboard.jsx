import { useRef, useState } from 'react'
import { ShieldCheck, AlertTriangle, Users, Film, Download, Sparkles, SlidersHorizontal, RefreshCw } from 'lucide-react'
import StatCard from './StatCard'
import ComplianceChart from './ComplianceChart'
import ViolationTimeline from './ViolationTimeline'
import VideoPlayer from './VideoPlayer'
import { annotatedVideoUrl, pdfReportUrl } from '../lib/api'

export default function Dashboard({ videoId, report, token, onReanalyze }) {
  const videoRef = useRef(null)
  const [conf, setConf] = useState(report.confidence_threshold ?? 0.4)

  function seekTo(seconds) {
    if (videoRef.current) {
      videoRef.current.currentTime = seconds
      videoRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
      videoRef.current.play().catch(() => {})
    }
  }

  const rate = report.overall_compliance_rate
  const rateTone = rate == null ? 'default' : rate >= 90 ? 'success' : rate >= 70 ? 'default' : 'danger'
  const isGood = rate != null && rate >= 85
  const isCritical = rate != null && rate < 70

  return (
    <section className="max-w-6xl mx-auto px-6 py-12">
      <div className="flex items-baseline justify-between flex-wrap gap-2 mb-4 animate-fade-up">
        <div>
          <span className="font-mono text-xs tracking-[0.3em] uppercase text-orange">Analysis Complete</span>
          <h2 className="font-display text-3xl font-semibold mt-1">Compliance Report</h2>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs font-mono text-inksoft">
            {report.resolution} · {report.fps} fps · processed in {report.processing_seconds}s
          </span>
          
          <a
            href={pdfReportUrl(videoId, token)}
            className="flex items-center gap-1.5 bg-chrome text-white text-xs font-display uppercase tracking-widest px-4 py-2.5 rounded-lg hover:bg-orange transition-colors hover-lift shadow-sm"
          >
            <Download size={14} /> PDF Report
          </a>
        </div>
      </div>

      <div
        className={`animate-fade-up mb-8 flex items-center gap-3 rounded-xl px-5 py-4 border shadow-sm ${
          isCritical
            ? 'bg-danger/5 border-danger/25 text-danger'
            : isGood
              ? 'bg-success/5 border-success/25 text-success'
              : 'bg-amber/10 border-amber/30 text-ink'
        }`}
      >
        {isCritical ? <AlertTriangle size={22} /> : <ShieldCheck size={22} />}
        <div>
          <p className="font-display text-sm uppercase tracking-widest">
            {isCritical ? 'Action Required' : isGood ? 'Site Compliant' : 'Needs Review'}
          </p>
          <p className="text-sm mt-0.5 opacity-90">
            {report.total_violations} PPE violation{report.total_violations === 1 ? '' : 's'} detected across{' '}
            {report.total_frames.toLocaleString()} analyzed frames
            {rate != null ? ` — ${rate}% overall compliance.` : '.'}
          </p>
        </div>
      </div>

      {report.ai_summary && (
        <div className="animate-fade-up-1 mb-8 bg-panel border border-border/70 rounded-xl p-5 shadow-sm flex gap-3">
          <div className="w-9 h-9 rounded-lg bg-orange/10 text-orange flex items-center justify-center shrink-0">
            <Sparkles size={17} />
          </div>
          <div>
            <p className="font-display text-xs uppercase tracking-widest text-inksoft mb-1">AI Summary</p>
            <p className="text-sm text-ink leading-relaxed">{report.ai_summary}</p>
          </div>
        </div>
      )}

      {onReanalyze && (
        <div className="animate-fade-up-2 mb-8 bg-panel border border-border/70 rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <SlidersHorizontal size={16} className="text-orange" />
            <p className="font-display text-xs uppercase tracking-widest text-inksoft">Detection Sensitivity</p>
          </div>
          <p className="text-xs text-inksoft mb-4 leading-relaxed">
            Lower confidence catches more possible violations but risks false positives.
            Higher confidence is stricter and more precise. Re-run detection to see the tradeoff.
          </p>
          <div className="flex items-center gap-4">
            <span className="font-mono text-xs text-inksoft w-10">0.10</span>
            <input
              type="range"
              min="0.1"
              max="0.9"
              step="0.05"
              value={conf}
              onChange={(e) => setConf(parseFloat(e.target.value))}
              className="flex-1 accent-orange"
            />
            <span className="font-mono text-xs text-inksoft w-10">0.90</span>
            <span className="font-display font-bold text-ink w-14 text-center bg-bg border border-border rounded-md py-1">
              {conf.toFixed(2)}
            </span>
            <button
              onClick={() => onReanalyze(conf)}
              className="flex items-center gap-1.5 bg-chrome text-white text-xs font-display uppercase tracking-widest px-4 py-2 rounded-lg hover:bg-orange transition-colors hover-lift shrink-0"
            >
              <RefreshCw size={13} /> Re-analyze
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2 animate-fade-up">
          <VideoPlayer ref={videoRef} src={annotatedVideoUrl(videoId, token)} />
        </div>
        <div className="grid grid-cols-2 gap-4 content-start">
          <StatCard index={0} icon={ShieldCheck} label="Overall Compliance" value={rate != null ? `${rate}%` : '—'} tone={rateTone} />
          <StatCard index={1} icon={AlertTriangle} label="Total Violations" value={report.total_violations} tone={report.total_violations > 0 ? 'danger' : 'success'} />
          <StatCard index={2} icon={Users} label="Peak Persons / Frame" value={report.max_persons_in_frame} />
          <StatCard index={3} icon={Film} label="Frames Analyzed" value={report.total_frames.toLocaleString()} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 [&>div]:hover-lift">
        <ComplianceChart compliance={report.compliance} />
        <ViolationTimeline timeline={report.timeline} onSeek={seekTo} />
      </div>

      <details className="mt-8 bg-panel border border-border/70 rounded-xl p-5 shadow-sm">
        <summary className="font-display text-sm uppercase tracking-widest text-inksoft cursor-pointer">
          Raw Class Detection Totals
        </summary>
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-3 font-mono text-sm">
          {Object.entries(report.class_totals).map(([cls, count]) => (
            <div key={cls} className="flex justify-between border-b border-border/70 py-1">
              <span className="text-inksoft">{cls}</span>
              <span>{count}</span>
            </div>
          ))}
        </div>
      </details>
    </section>
  )
}