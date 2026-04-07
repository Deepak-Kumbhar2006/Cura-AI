import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, LineChart, Line, ResponsiveContainer } from 'recharts';
import api from '../services/api';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      const [statsRes, alertsRes] = await Promise.all([
        api.get('/api/dashboard/stats'),
        api.get('/api/alerts'),
      ]);
      setStats(statsRes.data);
      setAlerts(alertsRes.data);
    };
    fetchData();
  }, []);

  if (!stats) return <p>Loading dashboard...</p>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Dashboard</h2>
        <p className="text-sm text-slate-500">Last updated: {new Date(stats.lastUpdated).toLocaleString()}</p>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        {[['Total Cases', stats.totalCases], ['Active Alerts', stats.activeAlerts], ['High-Risk Zones', stats.highRiskZones]].map(([label, value]) => (
          <div key={label} className="bg-white rounded-xl p-4 shadow">
            <p className="text-slate-500">{label}</p>
            <p className="text-3xl font-bold">{value}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl p-4 shadow h-72">
          <h3 className="font-semibold mb-2">Disease Trend</h3>
          <ResponsiveContainer>
            <LineChart data={stats.trends.map((t) => ({ date: t._id, cases: t.cases }))}>
              <XAxis dataKey="date" /><YAxis /><Tooltip /><Line type="monotone" dataKey="cases" stroke="#0891b2" />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-white rounded-xl p-4 shadow h-72">
          <h3 className="font-semibold mb-2">Region Cases</h3>
          <ResponsiveContainer>
            <BarChart data={stats.regionStats.map((r) => ({ region: r._id, cases: r.cases }))}>
              <XAxis dataKey="region" /><YAxis /><Tooltip /><Bar dataKey="cases" fill="#0e7490" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white rounded-xl p-4 shadow">
        <h3 className="font-semibold mb-2">Recent Alerts</h3>
        <div className="space-y-2">
          {alerts.length === 0 ? <p className="text-slate-500">No alerts</p> : alerts.map((alert) => (
            <div key={alert._id} className={`p-3 rounded ${alert.risk === 'High' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'}`}>
              {alert.message}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
