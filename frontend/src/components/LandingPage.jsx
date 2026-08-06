import {
  ShieldCheck, ScanEye, FileText, MessageCircle, Lock,
  UploadCloud, ScanSearch, FileCheck2, CheckCircle2,
  TrendingUp, TrendingDown, ShieldQuestion,
  AlertTriangle, Eye, Server, Cpu, Mail,
} from 'lucide-react'
import ThemeToggle from './ThemeToggle'
import BackgroundGlow from './BackgroundGlow'

const FEATURES = [
  { icon: ScanEye, title: 'Frame-level PPE detection', desc: 'Hardhat, mask, and vest tracking on every frame — not just spot checks.' },
  { icon: FileText, title: 'Auto PDF audit trail', desc: 'A polished compliance report generated the moment analysis finishes.' },
  { icon: MessageCircle, title: 'AI safety assistant', desc: 'Ask plain questions about any video and get answers grounded in the data.' },
  { icon: Lock, title: 'Your own trained model', desc: 'Runs on the YOLO model you trained — no shared cloud model, no guesswork.' },
]

const STEPS = [
  { icon: UploadCloud, title: 'Upload footage', desc: 'Drop in floor-camera video — MP4, MOV, or AVI.' },
  { icon: ScanSearch, title: 'AI analyzes every frame', desc: 'Your model scans for compliant and non-compliant PPE in real time.' },
  { icon: FileCheck2, title: 'Get your report', desc: 'A dashboard, a downloadable PDF, and an assistant to query the results.' },
]

function NavBar({ onAuthClick }) {
  return (
    <header className="border-b border-border sticky top-0 z-40 bg-bg/95 backdrop-blur-sm">
      <div className="hazard-bar-animated" />
      <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
        <span className="font-display text-xl tracking-wide flex items-center gap-2">
          <ShieldCheck size={20} className="text-orange" strokeWidth={2.4} /> SITEWATCH
        </span>
        <nav className="hidden md:flex items-center gap-8 text-sm text-inksoft font-medium">
          <a href="#about" className="hover:text-ink transition-colors">About</a>
          <a href="#features" className="hover:text-ink transition-colors">Product</a>
          <a href="#how-it-works" className="hover:text-ink transition-colors">How it works</a>
        </nav>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <button onClick={() => onAuthClick('login')} className="text-sm font-medium text-inksoft hover:text-ink transition-colors">
            Log in
          </button>
          <button
            onClick={() => onAuthClick('signup')}
            className="bg-chrome text-white text-sm font-display font-bold px-4 py-2 rounded-lg hover:bg-orange transition-colors hover-lift hover-glow shadow-sm"
          >
            Get started free
          </button>
        </div>
      </div>
    </header>
  )
}

export default function LandingPage({ onShowAuth }) {
  return (
    <div className="min-h-screen bg-bg font-body">
      <BackgroundGlow />
      <NavBar onAuthClick={onShowAuth} />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="max-w-6xl mx-auto px-6 pt-20 pb-20 grid lg:grid-cols-2 gap-14 items-center">
          <div>
            <div className="animate-fade-up inline-flex items-center gap-2 bg-panel border border-border rounded-full pl-2.5 pr-4 py-1.5 shadow-sm">
              <span className="w-5 h-5 rounded-full bg-orange/10 flex items-center justify-center">
                <span className="w-1.5 h-1.5 rounded-full bg-orange" />
              </span>
              <span className="text-xs font-mono uppercase tracking-widest text-inksoft">
                Built for industrial safety teams
              </span>
            </div>

            <h1 className="font-display text-5xl font-extrabold mt-6 leading-[1.08] text-ink">
              Every missing hardhat,<br /> caught on frame one.
            </h1>

            <p className="text-inksoft mt-5 text-lg max-w-lg animate-fade-up-1">
              Upload footage, get per-worker PPE detection, an auto-generated PDF
              audit trail, and an AI assistant your safety officers can just talk to.
            </p>

            <div className="flex flex-wrap gap-3 mt-8 animate-fade-up-2">
              <button
                onClick={() => onShowAuth('signup')}
                className="bg-chrome text-white font-display font-bold px-6 py-3 rounded-lg hover:bg-orange transition-colors hover-lift hover-glow shadow-sm"
              >
                Upload your first video
              </button>
              <a
                href="#how-it-works"
                className="bg-panel border border-border text-ink font-display font-bold px-6 py-3 rounded-lg hover:border-orange transition-colors hover-lift shadow-sm"
              >
                See how it works
              </a>
            </div>

            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mt-6 animate-fade-up-3">
              {['No credit card required', 'Runs on your own model', 'Your data stays local'].map((f) => (
                <span key={f} className="flex items-center gap-1.5 text-sm text-inksoft">
                  <CheckCircle2 size={15} className="text-success" /> {f}
                </span>
              ))}
            </div>
          </div>

          <div className="hidden lg:block relative animate-fade-up-2" style={{ perspective: '1400px' }}>
            <div
              className="relative bg-chrome rounded-2xl p-4 shadow-2xl border border-border/20 transition-transform duration-500 hover:[transform:perspective(1400px)_rotateY(0deg)_rotateX(0deg)_scale(1.01)]"
              style={{ transform: 'perspective(1400px) rotateY(-9deg) rotateX(5deg)', transformStyle: 'preserve-3d' }}
            >
              <div className="flex items-center gap-1.5 mb-3 px-1">
                <span className="w-2.5 h-2.5 rounded-full bg-white/15" />
                <span className="w-2.5 h-2.5 rounded-full bg-white/15" />
                <span className="w-2.5 h-2.5 rounded-full bg-white/15" />
                <span className="ml-auto flex items-center gap-1.5 text-white/40 text-[10px] font-mono uppercase tracking-widest">
                  <ShieldCheck size={12} /> Live Analysis
                </span>
              </div>
              <div className="aspect-video rounded-xl relative overflow-hidden bg-gradient-to-br from-slate-800 via-slate-800 to-slate-900">
                <div className="absolute inset-0 opacity-[0.07]" style={{
                  backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)',
                  backgroundSize: '28px 28px',
                }} />
                <div className="absolute top-10 left-10 w-24 h-28 border-2 border-success rounded-md">
                  <span className="absolute -top-6 left-0 bg-success text-white text-[10px] font-mono px-1.5 py-0.5 rounded">Hardhat 0.94</span>
                </div>
                <div className="absolute bottom-10 right-12 w-20 h-28 border-2 border-danger rounded-md">
                  <span className="absolute -top-6 left-0 bg-danger text-white text-[10px] font-mono px-1.5 py-0.5 rounded whitespace-nowrap">NO-Vest 0.88</span>
                </div>
              </div>
              <div className="absolute -bottom-6 left-6 right-6 bg-panel rounded-xl shadow-xl border border-border px-5 py-3 flex items-center gap-6">
                <div>
                  <p className="text-[10px] font-mono uppercase tracking-widest text-inksoft">Compliance</p>
                  <p className="font-display text-xl font-extrabold text-success flex items-center gap-1">78% <TrendingUp size={14} /></p>
                </div>
                <div className="w-px h-8 bg-border" />
                <div>
                  <p className="text-[10px] font-mono uppercase tracking-widest text-inksoft">Violations</p>
                  <p className="font-display text-xl font-extrabold text-danger flex items-center gap-1">23 <TrendingDown size={14} /></p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="max-w-6xl mx-auto px-6 py-16">
        <div className="text-center max-w-xl mx-auto mb-12">
          <span className="text-xs font-mono uppercase tracking-widest text-orange">Why teams switch</span>
          <h2 className="font-display text-3xl font-extrabold mt-2 text-ink">One upload, a complete safety picture</h2>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {FEATURES.map(({ icon: Icon, title, desc }, i) => (
            <div key={title} className={`bg-panel border border-border/70 rounded-xl p-5 shadow-sm hover-lift ${['animate-fade-up-1','animate-fade-up-2','animate-fade-up-3','animate-fade-up-4'][i]}`}>
              <div className="w-10 h-10 rounded-lg bg-orange/10 text-orange flex items-center justify-center mb-4">
                <Icon size={19} />
              </div>
              <h3 className="font-display font-bold text-ink">{title}</h3>
              <p className="text-sm text-inksoft mt-1.5 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="max-w-6xl mx-auto px-6 py-16">
        <div className="text-center max-w-xl mx-auto mb-12">
          <span className="text-xs font-mono uppercase tracking-widest text-orange">How it works</span>
          <h2 className="font-display text-3xl font-extrabold mt-2 text-ink">From footage to report in three steps</h2>
        </div>
        <div className="grid sm:grid-cols-3 gap-6">
          {STEPS.map(({ icon: Icon, title, desc }, i) => (
            <div key={title} className="relative bg-panel border border-border/70 rounded-xl p-6 shadow-sm hover-lift">
              <span className="font-display text-5xl font-extrabold text-orange/10 absolute top-3 right-4">{i + 1}</span>
              <div className="w-10 h-10 rounded-lg bg-chrome text-white flex items-center justify-center mb-4 relative">
                <Icon size={18} />
              </div>
              <h3 className="font-display font-bold text-ink relative">{title}</h3>
              <p className="text-sm text-inksoft mt-1.5 leading-relaxed relative">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="about" className="max-w-4xl mx-auto px-6 py-16">
        <div className="text-center max-w-xl mx-auto mb-10 animate-fade-up">
          <span className="text-xs font-mono uppercase tracking-widest text-orange">About SiteWatch</span>
          <h2 className="font-display text-3xl font-extrabold mt-2 text-ink">Built for real industrial safety teams</h2>
          <p className="text-inksoft text-sm mt-4 leading-relaxed">
            SiteWatch turns floor-camera footage into an actionable compliance record —
            combining a custom-trained detection model with Gemini's general video
            understanding, so no footage goes unreviewed.
          </p>
        </div>

        <div className="bg-panel border border-border/70 rounded-xl p-5 shadow-sm mb-4 animate-fade-up-1">
          <AlertTriangle size={18} className="text-danger" />
          <h3 className="font-display font-bold text-ink mt-2">The problem</h3>
          <p className="text-sm text-inksoft mt-1 leading-relaxed">
            Manual PPE walk-throughs are slow, inconsistent between shifts, and only catch
            what a human inspector happens to be looking at. Violations go unrecorded, with
            no audit trail when something goes wrong later.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 gap-4 mb-4">
          <div className="bg-panel border border-border/70 rounded-xl p-5 shadow-sm animate-fade-up-2">
            <ShieldCheck size={18} className="text-orange" />
            <h3 className="font-display font-bold text-ink mt-2">PPE detection</h3>
            <p className="text-sm text-inksoft mt-1 leading-relaxed">
              Your own trained model scans every frame for hardhats, vests, and masks,
              scoring compliance and flagging violations automatically — no manual review needed.
            </p>
          </div>
          <div className="bg-panel border border-border/70 rounded-xl p-5 shadow-sm animate-fade-up-3">
            <Eye size={18} className="text-orange" />
            <h3 className="font-display font-bold text-ink mt-2">General analysis</h3>
            <p className="text-sm text-inksoft mt-1 leading-relaxed">
              For footage outside PPE checks, Gemini watches the video directly and reports
              back on objects, activities, and any general safety concerns — no training required.
            </p>
          </div>
        </div>

        <div className="bg-panel border border-border/70 rounded-xl p-5 shadow-sm mb-8 animate-fade-up-4">
          <div className="flex items-center gap-2">
            <Server size={17} className="text-inksoft" />
            <h3 className="font-display font-bold text-ink">Why local-first</h3>
          </div>
          <p className="text-sm text-inksoft mt-1 leading-relaxed">
            Footage, reports, and account data live on your own machine — nothing is
            uploaded to a shared cloud model. You bring the model you trained, and you
            keep control of the data it produces.
          </p>
        </div>

        <div className="flex justify-around pt-6 border-t border-border/70">
          <div className="text-center">
            <Lock size={17} className="text-inksoft mx-auto" />
            <p className="text-xs text-inksoft mt-1.5">Local-first</p>
          </div>
          <div className="text-center">
            <Cpu size={17} className="text-inksoft mx-auto" />
            <p className="text-xs text-inksoft mt-1.5">Your own model</p>
          </div>
          <div className="text-center">
            <Mail size={17} className="text-inksoft mx-auto" />
            <p className="text-xs text-inksoft mt-1.5">Verified delivery</p>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="max-w-4xl mx-auto px-6 py-16 text-center">
        <div className="bg-chrome rounded-2xl px-10 py-14 shadow-xl relative overflow-hidden">
          <div className="absolute inset-0 opacity-10" style={{
            backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)',
            backgroundSize: '32px 32px',
          }} />
          <ShieldQuestion size={28} className="text-orange mx-auto mb-4 relative" />
          <h2 className="font-display text-3xl font-extrabold text-white relative">Ready to see your first report?</h2>
          <p className="text-white/60 mt-3 relative">Free to start. No credit card required.</p>
          <button
            onClick={() => onShowAuth('signup')}
            className="mt-7 bg-orange text-white font-display font-bold px-7 py-3 rounded-lg hover:brightness-110 transition-all hover-lift hover-glow relative"
          >
            Upload a video, free
          </button>
        </div>
      </section>
    </div>
  )
}