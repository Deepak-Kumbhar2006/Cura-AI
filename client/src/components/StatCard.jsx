export default function StatCard({ title, value, subtitle, accent = 'text-slate-600', icon }) {
  return (
    <div className="metric-card group hover:shadow-lg transition-all duration-300 hover:scale-105">
      <div className="flex justify-between items-start mb-3">
        <p className="text-slate-600 dark:text-slate-400 text-sm font-medium">{title}</p>
        {icon && <div className={`${accent} opacity-60 group-hover:opacity-100 transition-opacity`}>{icon}</div>}
      </div>
      <p className="text-4xl font-bold mt-3 dark:text-white">{value}</p>
      <p className={`mt-2 text-sm ${accent}`}>{subtitle}</p>
      <div className="mt-4 h-2 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden">
        <div className={`h-full rounded-full bg-gradient-to-r ${accent.replace('text-', 'from-')} to-opacity-50 w-2/3 animate-pulse`} />
      </div>
    </div>
  );
}
