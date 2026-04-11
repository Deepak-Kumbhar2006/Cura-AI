const toneMap = {
  Critical: 'border-rose-400/50 bg-rose-500/10 text-rose-300',
  Warning: 'border-amber-400/50 bg-amber-500/10 text-amber-300',
  Info: 'border-cyan-400/50 bg-cyan-500/10 text-cyan-300',
};

export default function Alerts() {
  const alerts = [
    { title: 'High Risk Zone Detected', severity: 'Critical', location: 'Mumbai, India · 2 min ago' },
    { title: 'Unusual Pattern Detected', severity: 'Warning', location: 'Delhi, India · 5 min ago' },
    { title: 'Resource Low', severity: 'Info', location: 'Andhra Pradesh · 12 min ago' },
  ];

  return (
    <aside className="dashboard-glass rounded-2xl p-4">
      <h3 className="font-semibold dashboard-text mb-3">Live Alerts</h3>
      <div className="space-y-3">
        {alerts.map((alert) => (
          <article key={alert.title} className={`rounded-xl border p-3 ${toneMap[alert.severity]}`}>
            <p className="font-semibold text-sm">{alert.title}</p>
            <p className="text-xs opacity-80 mt-1">{alert.location}</p>
            <p className="text-xs mt-2">{alert.severity}</p>
          </article>
        ))}
      </div>
    </aside>
  );
}
