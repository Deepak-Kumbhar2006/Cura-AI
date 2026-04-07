import StatCard from '../components/StatCard';

const sources = [
  { name: 'Electronic Health Records (EHR)', tag: 'Healthcare', total: '2,847,563', quality: '95.7%', sync: '5:30 PM' },
  { name: 'Wearable Devices & IoT', tag: 'IoT', total: '1,234,567', quality: '97.1%', sync: '5:35 PM' },
  { name: 'Public Health Databases', tag: 'Government', total: '905,120', quality: '98.2%', sync: '5:40 PM' },
];

export default function DataSources() {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-5xl font-bold">Data Sources Integration</h2>
        <p className="text-slate-500 mt-1 text-2xl">Monitor and manage all connected data sources</p>
      </div>
      <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard title="Active Sources" value="6" subtitle="All systems operational" accent="text-emerald-600" />
        <StatCard title="Total Records" value="5.60M" subtitle="Across all sources" />
        <StatCard title="Sync Status" value="Real-time" subtitle="Avg latency: 1.2s" />
        <StatCard title="Data Quality" value="97.8%" subtitle="↑ 1.2% this month" accent="text-emerald-600" />
      </div>
      <div className="card p-5 space-y-4">
        <h3 className="text-3xl font-semibold">Connected Data Sources</h3>
        {sources.map((s) => (
          <div key={s.name} className="rounded-2xl border border-slate-200 p-5 bg-slate-50">
            <div className="flex flex-wrap justify-between gap-2">
              <div>
                <h4 className="text-2xl font-semibold">{s.name}</h4>
                <p className="text-sm text-slate-500">{s.tag} · Active</p>
              </div>
              <p className="text-slate-500">Last sync: {s.sync}</p>
            </div>
            <div className="grid md:grid-cols-3 gap-3 mt-4 text-sm">
              <p>Total Records <strong className="block text-2xl text-slate-900">{s.total}</strong></p>
              <p>Data Quality <strong className="block text-2xl text-emerald-600">{s.quality}</strong></p>
              <div className="flex gap-2 items-end">
                <button className="px-3 py-2 rounded-lg border border-indigo-300 text-indigo-700">Configure</button>
                <button className="px-3 py-2 rounded-lg border border-slate-300">View Logs</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
