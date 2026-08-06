import { useEffect, useState } from 'react'
import { TrendingUp } from 'lucide-react'
import { LineChart, Line, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { getTrends } from '../lib/api'

export default function TrendsPage({ token }) {
  const [points, setPoints] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    getTrends(token).then(setPoints).catch((e) => setError(e.message))
  }, [token])

  return (
    <section className="max-w-6xl mx-auto px-6 py-12">
      <div className="animate-fade-up mb-8">
        <span className="font-mono text-xs tracking-[0.3em] uppercase text-orange">Across All Videos</span>
        <h2 className="font-display text-3xl font-semibold mt-1 flex items-center gap-2">
          <TrendingUp size={26} className="text-orange" /> Compliance Trends
        </h2>
        <p className="text-inksoft text-sm mt-1">
          Overall compliance rate for every video you've analyzed, in upload order.
        </p>
      </div>

      {error && <p className="text-danger text-sm">{error}</p>}

      {points && points.length === 0 && (
        <div className="bg-panel border border-border/70 rounded-xl p-8 text-center text-inksoft">
          No completed analyses yet — upload a video to start building your trend line.
        </div>
      )}

      {points && points.length > 0 && (
        <>
          <div className="bg-panel border border-border/70 rounded-xl p-5 shadow-sm animate-fade-up-1">
            <ResponsiveContainer width="100%" height={320}>
              <LineChart data={points}>
                <CartesianGrid stroke="#E2E8F0" vertical={false} />
                <XAxis
                  dataKey="filename"
                  tick={{ fontFamily: 'JetBrains Mono', fontSize: 11, fill: '#64748B' }}
                  axisLine={{ stroke: '#E2E8F0' }}
                  tickLine={false}
                  interval={0}
                  angle={-20}
                  textAnchor="end"
                  height={70}
                />
                <YAxis
                  domain={[0, 100]}
                  tickFormatter={(v) => `${v}%`}
                  tick={{ fontFamily: 'JetBrains Mono', fontSize: 11, fill: '#64748B' }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  formatter={(value, name) => [name === 'overall_compliance_rate' ? `${value}%` : value, name === 'overall_compliance_rate' ? 'Compliance' : 'Violations']}
                  contentStyle={{ fontFamily: 'Inter', border: '1px solid #E2E8F0', borderRadius: 8, boxShadow: '0 8px 24px -8px rgba(15,23,42,0.15)' }}
                />
                <Line type="monotone" dataKey="overall_compliance_rate" stroke="#1E3A8A" strokeWidth={2.5} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="grid gap-2 mt-6 animate-fade-up-2">
            {points.map((p) => (
              <div key={p.video_id} className="flex items-center justify-between bg-panel border border-border/70 rounded-lg px-4 py-3 text-sm">
                <span className="truncate">{p.filename || p.video_id}</span>
                <div className="flex items-center gap-4 shrink-0 font-mono text-xs">
                  <span className="text-inksoft">{new Date(p.uploaded_at * 1000).toLocaleDateString()}</span>
                  <span className={p.overall_compliance_rate >= 85 ? 'text-success' : p.overall_compliance_rate < 70 ? 'text-danger' : 'text-ink'}>
                    {p.overall_compliance_rate != null ? `${p.overall_compliance_rate}%` : '—'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </section>
  )
}