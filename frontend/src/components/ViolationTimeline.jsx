import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

export default function ViolationTimeline({ timeline, onSeek }) {
  return (
    <div className="bg-panel border border-border/70 rounded-xl p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display text-sm uppercase tracking-widest text-inksoft">
          Violations Over Time
        </h3>
        {onSeek && <span className="text-[11px] text-inksoft font-mono">click a point to jump the video</span>}
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <AreaChart
          data={timeline}
          onClick={(e) => {
            if (onSeek && e && e.activeLabel != null) onSeek(e.activeLabel)
          }}
          style={{ cursor: onSeek ? 'pointer' : 'default' }}
        >
          <defs>
            <linearGradient id="violationFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#B91C1C" stopOpacity={0.55} />
              <stop offset="100%" stopColor="#B91C1C" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="#E2E8F0" vertical={false} />
          <XAxis
            dataKey="t"
            tickFormatter={(t) => `${t}s`}
            tick={{ fontFamily: 'JetBrains Mono', fontSize: 11, fill: '#64748B' }}
            axisLine={{ stroke: '#E2E8F0' }}
            tickLine={false}
          />
          <YAxis tick={{ fontFamily: 'JetBrains Mono', fontSize: 11, fill: '#64748B' }} axisLine={false} tickLine={false} allowDecimals={false} />
          <Tooltip
            labelFormatter={(t) => `t = ${t}s — click to jump`}
            contentStyle={{ fontFamily: 'Inter', border: '1px solid #E2E8F0', borderRadius: 8, boxShadow: '0 8px 24px -8px rgba(15,23,42,0.15)' }}
          />
          <Area type="monotone" dataKey="violations" stroke="#B91C1C" strokeWidth={2.5} fill="url(#violationFill)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}