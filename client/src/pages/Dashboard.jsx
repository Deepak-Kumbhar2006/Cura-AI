import { Area, AreaChart, CartesianGrid, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Cell } from 'recharts';
import StatCard from '../components/StatCard';

const trend = [
  { date: '2026-01-01', influenza: 180, covid19: 90, dengue: 40, malaria: 10 },
  { date: '2026-02-01', influenza: 300, covid19: 140, dengue: 55, malaria: 20 },
  { date: '2026-03-01', influenza: 430, covid19: 210, dengue: 85, malaria: 35 },
  { date: '2026-04-07', influenza: 590, covid19: 260, dengue: 180, malaria: 50 },
];

const dist = [
  { name: 'Influenza', value: 51, color: '#3b82f6' },
  { name: 'COVID-19', value: 24, color: '#8b5cf6' },
  { name: 'Dengue', value: 16, color: '#ec4899' },
  { name: 'Malaria', value: 6, color: '#f59e0b' },
  { name: 'Tuberculosis', value: 4, color: '#10b981' },
];

export default function Dashboard() {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-5xl font-bold tracking-tight">Dashboard Overview</h2>
        <p className="text-slate-500 mt-1 text-2xl">Real-time health surveillance and disease outbreak monitoring</p>
      </div>
      <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard title="Total Active Cases" value="1,131" subtitle="↑ 12.5% from last week" accent="text-rose-500" />
        <StatCard title="Critical Alerts" value="1" subtitle="Require immediate attention" accent="text-rose-500" />
        <StatCard title="High-Risk Regions" value="2" subtitle="Out of 5 monitored regions" accent="text-orange-500" />
        <StatCard title="Prediction Accuracy" value="84.0%" subtitle="↑ 2.3% improvement" accent="text-emerald-600" />
      </div>
      <div className="grid xl:grid-cols-2 gap-4">
        <div className="card p-5 h-[420px]">
          <h3 className="text-3xl font-semibold mb-3">Disease Trends (Last 90 Days)</h3>
          <ResponsiveContainer>
            <AreaChart data={trend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" /><YAxis />
              <Tooltip />
              <Area dataKey="influenza" stackId="1" stroke="#3b82f6" fill="#93c5fd" />
              <Area dataKey="covid19" stackId="1" stroke="#8b5cf6" fill="#c4b5fd" />
              <Area dataKey="dengue" stackId="1" stroke="#ec4899" fill="#f9a8d4" />
              <Area dataKey="malaria" stackId="1" stroke="#f59e0b" fill="#fcd34d" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="card p-5 h-[420px]">
          <h3 className="text-3xl font-semibold mb-3">Current Disease Distribution</h3>
          <ResponsiveContainer>
            <PieChart>
              <Pie data={dist} dataKey="value" nameKey="name" outerRadius={140} label>
                {dist.map((entry) => <Cell key={entry.name} fill={entry.color} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
