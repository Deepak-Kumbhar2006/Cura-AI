export default function StatCard({ title, value, subtitle, accent = 'text-slate-600' }) {
  return (
    <div className="metric-card">
      <p className="text-slate-600 text-sm">{title}</p>
      <p className="text-4xl font-bold mt-3">{value}</p>
      <p className={`mt-2 text-sm ${accent}`}>{subtitle}</p>
      <div className="mt-4 h-2 rounded-full bg-slate-100">
        <div className="h-full rounded-full bg-indigo-600 w-2/3" />
      </div>
    </div>
  );
}
