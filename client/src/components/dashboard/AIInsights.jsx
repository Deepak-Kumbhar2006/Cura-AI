export default function AIInsights() {
  const insights = [
    '↑ 23% spike in southern zones compared to last week',
    '5 new clusters likely in Bengaluru, Pune, Hyderabad',
    'Resource optimization can improve recovery by 8%',
  ];

  return (
    <div className="dashboard-glass rounded-2xl p-4">
      <h3 className="font-semibold dashboard-text mb-3">AI Insights</h3>
      <div className="space-y-3">
        {insights.map((item) => (
          <div key={item} className="rounded-xl border border-white/10 bg-white/5 p-3 hover:-translate-y-0.5 transition duration-300">
            <p className="text-sm dashboard-text">{item}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
