const points = [
  { top: '18%', left: '64%', color: '#f97316' },
  { top: '40%', left: '58%', color: '#22c55e' },
  { top: '52%', left: '72%', color: '#ef4444' },
  { top: '60%', left: '48%', color: '#06b6d4' },
  { top: '30%', left: '78%', color: '#eab308' },
];

export default function RiskMap() {
  return (
    <div className="dashboard-glass rounded-2xl p-4">
      <h3 className="font-semibold dashboard-text mb-3">Interactive Map</h3>
      <div className="relative h-56 rounded-2xl overflow-hidden border border-white/10 bg-[url('https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&w=1400&q=60')] bg-cover bg-center">
        <div className="absolute inset-0 bg-slate-900/45" />
        {points.map((point, i) => (
          <span
            key={i}
            className="absolute h-4 w-4 rounded-full animate-ping"
            style={{ top: point.top, left: point.left, backgroundColor: point.color, boxShadow: `0 0 20px ${point.color}` }}
          />
        ))}
      </div>
    </div>
  );
}
