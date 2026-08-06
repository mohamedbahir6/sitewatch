import { useRef, useState } from 'react'
import { UploadCloud } from 'lucide-react'

export default function UploadPanel({ onFileSelected, busy }) {
  const inputRef = useRef(null)
  const [dragOver, setDragOver] = useState(false)

  function handleDrop(e) {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files?.[0]
    if (file) onFileSelected(file)
  }

  return (
    <section className="max-w-2xl mx-auto px-6 pt-14 pb-10">
      <span className="font-mono text-xs tracking-[0.3em] uppercase text-orange block animate-fade-up">
        PPE Detection Analysis
      </span>
      <h1 className="font-display text-3xl font-semibold mt-1 animate-fade-up-1">
        Analyze a new video
      </h1>
      <p className="text-inksoft mt-2 text-sm animate-fade-up-2">
        Drop floor-camera footage below to run PPE detection.
      </p>

      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`upload-drop animate-fade-up-3 mt-8 border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer
          ${dragOver ? 'border-orange bg-orange/5 scale-[1.005]' : 'border-border bg-panel'}
          ${busy ? 'opacity-60 pointer-events-none' : ''}`}
      >
        <input
          ref={inputRef}
          type="file"
          accept="video/*"
          className="hidden"
          onChange={(e) => e.target.files?.[0] && onFileSelected(e.target.files[0])}
        />
        <UploadCloud size={26} className="mx-auto text-inksoft mb-3" />
        <p className="font-display text-lg font-bold text-ink">
          {busy ? 'Uploading…' : 'Drop video here, or click to browse'}
        </p>
        <p className="text-xs text-inksoft mt-2 font-mono">MP4 · MOV · AVI</p>
      </div>
    </section>
  )
}