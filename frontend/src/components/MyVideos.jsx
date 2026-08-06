import { useEffect, useState } from 'react'
import { myVideos } from '../lib/api'

export default function MyVideos({ token, onOpen, refreshKey }) {
  const [videos, setVideos] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    myVideos(token).then(setVideos).catch(() => {}).finally(() => setLoading(false))
  }, [token, refreshKey])

  if (loading) return null
  if (videos.length === 0) return null

  return (
    <div className="max-w-3xl mx-auto px-6 pb-16">
      <h3 className="font-display text-sm uppercase tracking-widest text-inksoft mb-3">
        Your Past Videos
      </h3>
      <div className="grid gap-2">
        {videos.map((v) => (
          <button
            key={v.id}
            onClick={() => onOpen(v.id)}
            className="flex items-center justify-between bg-panel border border-border rounded-sm px-4 py-3 text-left hover:border-orange transition-colors"
          >
            <span className="text-sm truncate">{v.filename || v.id}</span>
            <span className="text-xs font-mono text-inksoft ml-4 shrink-0">
              {new Date(v.uploaded_at * 1000).toLocaleDateString()}
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}