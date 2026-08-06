import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

export default function ComplianceChart({ compliance }) {
  const data = Object.entries(compliance).map(([label, v]) => ({
    name: label,
    Compliant: v.compliant,
    Violations: v.violations,
  }))

  return (
    <div className="bg-panel border border-border/70 rounded-xl p-5 shadow-sm">
      <h3 className="font-display text-sm uppercase tracking-widest text-inksoft mb-4">
        PPE Compliance by Category
      </h3>
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={data} barGap={6}>
          <defs>
            <linearGradient id="compliantFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#16A34A" />
              <stop offset="100%" stopColor="#15803D" />
            </linearGradient>
            <linearGradient id="violationFillBar" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#DC2626" />
              <stop offset="100%" stopColor="#B91C1C" />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="#E2E8F0" vertical={false} />
          <XAxis dataKey="name" tick={{ fontFamily: 'JetBrains Mono', fontSize: 12, fill: '#64748B' }} axisLine={{ stroke: '#E2E8F0' }} tickLine={false} />
          <YAxis tick={{ fontFamily: 'JetBrains Mono', fontSize: 12, fill: '#64748B' }} axisLine={false} tickLine={false} />
          <Tooltip
            cursor={{ fill: 'rgba(15,23,42,0.03)' }}
            contentStyle={{ fontFamily: 'Inter', border: '1px solid #E2E8F0', borderRadius: 8, boxShadow: '0 8px 24px -8px rgba(15,23,42,0.15)' }}
          />
          <Legend wrapperStyle={{ fontFamily: 'Inter', fontSize: 13 }} />
          <Bar dataKey="Compliant" fill="url(#compliantFill)" radius={[6, 6, 0, 0]} maxBarSize={48} />
          <Bar dataKey="Violations" fill="url(#violationFillBar)" radius={[6, 6, 0, 0]} maxBarSize={48} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}