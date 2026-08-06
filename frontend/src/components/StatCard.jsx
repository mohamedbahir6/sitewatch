export default function StatCard({ label, value, sub, tone = 'default', index = 0, icon: Icon }) {
  const toneStyles = {
    default: 'border-border/70 text-ink',
    danger: 'border-danger/30 text-danger',
    success: 'border-success/30 text-success',
  }[tone]

  const iconBg = {
    default: 'bg-ink/5 text-ink',
    danger: 'bg-danger/10 text-danger',
    success: 'bg-success/10 text-success',
  }[tone]

  const fadeClass = ['animate-fade-up-1', 'animate-fade-up-2', 'animate-fade-up-3', 'animate-fade-up-4'][index % 4]

  return (
    <div className={`bg-panel border ${toneStyles} rounded-xl p-5 flex flex-col gap-2 relative overflow-hidden hover-lift shadow-sm ${fadeClass}`}>
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-mono uppercase tracking-widest text-inksoft">{label}</span>
        {Icon && (
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${iconBg}`}>
            <Icon size={16} strokeWidth={2.2} />
          </div>
        )}
      </div>
      <span className="font-display text-4xl font-semibold leading-none">{value}</span>
      {sub && <span className="text-xs text-inksoft">{sub}</span>}
    </div>
  )
}