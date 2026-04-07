import StatCard from '../components/StatCard';

const alerts = [
  { priority: 'CRITICAL', region: 'Metro North', message: 'Rapid increase in influenza cases detected. Cases increased by 47% in the last 7 days.', color: 'bg-rose-50 border-rose-200' },
  { priority: 'HIGH', region: 'Metro South', message: 'High pollution levels (AQI: 185) may contribute to respiratory infections.', color: 'bg-amber-50 border-amber-200' },
];

export default function AlertsPage() {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-5xl font-bold">Alerts & Notifications</h2>
        <p className="text-slate-500 text-2xl">Monitor and manage system-generated alerts</p>
      </div>
      <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard title="Total Alerts" value="5" subtitle="Active alerts" />
        <StatCard title="Critical" value="1" subtitle="Immediate action required" accent="text-rose-500" />
        <StatCard title="High Priority" value="2" subtitle="Needs attention" accent="text-orange-500" />
        <StatCard title="Unacknowledged" value="3" subtitle="Pending review" />
      </div>
      <div className="card p-5 space-y-4">
        <h3 className="text-3xl font-semibold">Alert Management</h3>
        {alerts.map((a, idx) => (
          <div key={idx} className={`rounded-2xl border p-5 flex flex-wrap items-start justify-between gap-4 ${a.color}`}>
            <div>
              <p><span className="font-bold">{a.priority}</span> · {a.region}</p>
              <p className="text-lg mt-2">{a.message}</p>
            </div>
            <button className="px-4 py-2 rounded-xl border border-slate-300 bg-white">Acknowledge</button>
          </div>
        ))}
      </div>
    </div>
  );
}
