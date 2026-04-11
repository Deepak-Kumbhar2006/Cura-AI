import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

export default function PredictionChart({ data }) {
  return (
    <div className="dashboard-glass rounded-2xl p-4">
      <h3 className="font-semibold dashboard-text mb-3">AI Prediction Graph</h3>
      <div className="h-56">
        <ResponsiveContainer>
          <LineChart data={data}>
            <CartesianGrid stroke="rgba(148,163,184,0.15)" />
            <XAxis dataKey="date" stroke="rgba(148,163,184,0.7)" />
            <YAxis stroke="rgba(148,163,184,0.7)" />
            <Tooltip />
            <Line type="monotone" dataKey="current" stroke="#22d3ee" strokeWidth={2.5} dot={false} />
            <Line type="monotone" dataKey="predicted" stroke="#d946ef" strokeWidth={2.5} strokeDasharray="7 4" dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
