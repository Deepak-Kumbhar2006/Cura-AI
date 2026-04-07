import { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import api from '../services/api';
import StatCard from '../components/StatCard';

const colors = ['#3b82f6', '#eab308', '#ef4444'];

export default function DoctorDashboard() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    api.get('/api/dashboard/stats').then((res) => setStats(res.data));
  }, []);

  if (!stats) return <p>Loading...</p>;

  const pieData = [
    { name: 'Low', value: Math.max(stats.totalCases - stats.highRiskRegions * 2, 1) },
    { name: 'Medium', value: Math.max(stats.highRiskRegions, 1) },
    { name: 'High', value: Math.max(stats.activeAlerts, 1) },
  ];

  return (
    <div className="space-y-4">
      <h2 className="text-3xl font-bold">Doctor Command Dashboard</h2>
      <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-3">
        <StatCard title="Total cases" value={stats.totalCases} subtitle="All submitted patient reports" />
        <StatCard title="Active alerts" value={stats.activeAlerts} subtitle="High-risk events" />
        <StatCard title="High-risk regions" value={stats.highRiskRegions} subtitle="Requires intervention" />
        <StatCard title="Prediction accuracy" value={`${stats.predictionAccuracy}%`} subtitle="Model performance" />
      </div>
      <div className="grid lg:grid-cols-2 gap-3">
        <div className="card p-4 bg-white rounded-2xl border h-80">
          <h3 className="font-semibold mb-2">Disease trend</h3>
          <ResponsiveContainer>
            <LineChart data={stats.trends.map((x) => ({ day: x._id, count: x.count }))}><XAxis dataKey="day" /><YAxis /><Tooltip /><Line dataKey="count" stroke="#2563eb" /></LineChart>
          </ResponsiveContainer>
        </div>
        <div className="card p-4 bg-white rounded-2xl border h-80">
          <h3 className="font-semibold mb-2">Risk distribution</h3>
          <ResponsiveContainer>
            <PieChart><Pie data={pieData} dataKey="value" label>{pieData.map((e, i) => <Cell key={e.name} fill={colors[i]} />)}</Pie></PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
