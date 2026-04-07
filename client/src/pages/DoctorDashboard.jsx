import { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar } from 'recharts';
import api from '../services/api';
import StatCard from '../components/StatCard';

const colors = ['#10b981', '#f59e0b', '#ef4444', '#3b82f6'];

export default function DoctorDashboard() {
  const [stats, setStats] = useState(null);
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    Promise.all([api.get('/api/dashboard/stats'), api.get('/api/alerts')]).then(([s, a]) => {
      setStats(s.data);
      setAlerts(a.data);
    });
  }, []);

  if (!stats) return <p>Loading...</p>;

  const riskData = [
    { name: 'Low', value: Math.max(stats.totalCases - stats.highRiskRegions * 2, 1) },
    { name: 'Medium', value: Math.max(stats.highRiskRegions, 1) },
    { name: 'High', value: Math.max(stats.activeAlerts, 1) },
  ];

  const diseaseData = (stats.diseaseDistribution || []).filter((d) => d._id).map((d) => ({ disease: d._id, count: d.count }));

  return (
    <div className="space-y-4">
      <h2 className="text-3xl font-bold">Doctor Dashboard</h2>
      <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-3">
        <StatCard title="Total cases" value={stats.totalCases} subtitle="All patient cases" />
        <StatCard title="Active alerts" value={stats.activeAlerts} subtitle="Spike notifications" />
        <StatCard title="High-risk regions" value={stats.highRiskRegions} subtitle="Regional watch" />
        <StatCard title="Prediction accuracy" value={`${stats.predictionAccuracy}%`} subtitle="Model benchmark" />
      </div>
      <div className="grid lg:grid-cols-2 gap-3">
        <div className="card p-4 h-80"><h3 className="font-semibold mb-2">Cases over time</h3><ResponsiveContainer><LineChart data={stats.trends.map((x) => ({ day: x._id, cases: x.count }))}><XAxis dataKey="day" /><YAxis /><Tooltip /><Line dataKey="cases" stroke="#10b981" /></LineChart></ResponsiveContainer></div>
        <div className="card p-4 h-80"><h3 className="font-semibold mb-2">Disease distribution</h3><ResponsiveContainer><PieChart><Pie data={riskData} dataKey="value" label>{riskData.map((e, i) => <Cell key={e.name} fill={colors[i]} />)}</Pie></PieChart></ResponsiveContainer></div>
      </div>
      <div className="grid lg:grid-cols-2 gap-3">
        <div className="card p-4 h-72"><h3 className="font-semibold mb-2">Disease trends</h3><ResponsiveContainer><BarChart data={diseaseData}><XAxis dataKey="disease" /><YAxis /><Tooltip /><Bar dataKey="count" fill="#34d399" /></BarChart></ResponsiveContainer></div>
        <div className="card p-4"><h3 className="font-semibold mb-2">Alerts Panel</h3><div className="max-h-56 overflow-auto space-y-2">{alerts.slice(0, 6).map((a) => <div key={a._id} className="p-2 rounded bg-rose-50 border border-rose-100 text-sm">{a.message}</div>)}</div></div>
      </div>
    </div>
  );
}
