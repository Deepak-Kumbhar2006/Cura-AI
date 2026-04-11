import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

export default function AgeBarChart({ data }) {
  return (
    <div className="dashboard-glass rounded-2xl p-4">
      <h3 className="font-semibold dashboard-text mb-3">Age Distribution</h3>
      <div className="h-56">
        <ResponsiveContainer>
          <BarChart data={data}>
            <defs>
              <linearGradient id="ageBar" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#22d3ee" />
                <stop offset="100%" stopColor="#ec4899" />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="rgba(148,163,184,0.15)" vertical={false} />
            <XAxis dataKey="group" stroke="rgba(148,163,184,0.7)" />
            <YAxis stroke="rgba(148,163,184,0.7)" />
            <Tooltip />
            <Bar dataKey="value" fill="url(#ageBar)" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
