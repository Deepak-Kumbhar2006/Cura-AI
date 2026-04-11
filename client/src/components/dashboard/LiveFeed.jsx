export default function LiveFeed() {
  const items = [
    { title: 'New cluster detected', place: 'Bengaluru, Karnataka', age: '2m' },
    { title: 'Cases declining', place: 'Chennai, Tamil Nadu', age: '6m' },
    { title: 'High recovery rate', place: 'Kerala', age: '15m' },
  ];

  return (
    <div className="dashboard-glass rounded-2xl p-4">
      <h3 className="font-semibold dashboard-text mb-3">Live Feed</h3>
      <div className="space-y-3">
        {items.map((item) => (
          <div key={item.title} className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 p-3">
            <div>
              <p className="text-sm font-medium dashboard-text">{item.title}</p>
              <p className="text-xs dashboard-muted">{item.place}</p>
            </div>
            <p className="text-xs dashboard-muted">{item.age}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
