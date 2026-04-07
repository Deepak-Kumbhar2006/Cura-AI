import { useEffect, useState } from 'react';
import { Area, AreaChart, CartesianGrid, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Cell } from 'recharts';
import StatCard from '../components/StatCard';
import api from '../services/api';
import { TrendingUp, AlertTriangle, Target, BarChart3 } from 'lucide-react';

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const response = await api.get('/api/dashboard/stats');
        setData(response.data);
        setError(null);
      } catch (err) {
        console.error('Failed to fetch dashboard stats:', err);
        setError('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="space-y-5">
        <div>
          <h2 className="text-5xl font-bold tracking-tight">Dashboard Overview</h2>
          <p className="text-slate-500 mt-1 text-2xl">Real-time health surveillance and disease outbreak monitoring</p>
        </div>
        <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="card p-5 h-24 bg-slate-200 dark:bg-slate-700 animate-pulse"></div>
          ))}
        </div>
        <div className="grid xl:grid-cols-2 gap-4">
          <div className="card p-5 h-[420px] bg-slate-200 dark:bg-slate-700 animate-pulse"></div>
          <div className="card p-5 h-[420px] bg-slate-200 dark:bg-slate-700 animate-pulse"></div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="space-y-5">
        <div>
          <h2 className="text-5xl font-bold tracking-tight">Dashboard Overview</h2>
        </div>
        <div className="card p-8 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-6 h-6 text-red-500" />
            <div>
              <p className="text-red-700 dark:text-red-300 font-semibold">Error Loading Dashboard</p>
              <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-5xl font-bold tracking-tight">Dashboard Overview</h2>
        <p className="text-slate-500 mt-1 text-2xl">Real-time health surveillance and disease outbreak monitoring</p>
      </div>
      <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard 
          title="Total Active Cases" 
          value={data.totalActiveCases?.toLocaleString() || '0'} 
          subtitle="↑ 12.5% from last week" 
          accent="text-rose-500"
          icon={<BarChart3 className="w-5 h-5" />}
        />
        <StatCard 
          title="Critical Alerts" 
          value={data.criticalAlerts || '0'} 
          subtitle="Require immediate attention" 
          accent="text-rose-500"
          icon={<AlertTriangle className="w-5 h-5" />}
        />
        <StatCard 
          title="High-Risk Regions" 
          value={`${data.highRiskRegions || 0}/${data.monitoredRegions || 5}`} 
          subtitle="Out of monitored regions" 
          accent="text-orange-500"
          icon={<Target className="w-5 h-5" />}
        />
        <StatCard 
          title="Prediction Accuracy" 
          value={`${data.predictionAccuracy || 84}%`} 
          subtitle="↑ 2.3% improvement" 
          accent="text-emerald-600"
          icon={<TrendingUp className="w-5 h-5" />}
        />
      </div>
      <div className="grid xl:grid-cols-2 gap-4">
        <div className="card p-5 h-[420px] shadow-lg hover:shadow-xl transition-shadow">
          <h3 className="text-3xl font-semibold mb-3 flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-primary-500" />
            Disease Trends (Last 90 Days)
          </h3>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data.trend || []}>
              <defs>
                <linearGradient id="colorInfluenza" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorCovid" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(100, 100, 100, 0.1)" />
              <XAxis dataKey="date" stroke="rgba(100, 100, 100, 0.5)" />
              <YAxis stroke="rgba(100, 100, 100, 0.5)" />
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'rgba(30, 30, 30, 0.9)',
                  border: '1px solid rgba(100, 100, 100, 0.3)',
                  borderRadius: '8px'
                }}
              />
              <Area dataKey="influenza" stackId="1" stroke="#3b82f6" fill="url(#colorInfluenza)" />
              <Area dataKey="covid19" stackId="1" stroke="#8b5cf6" fill="url(#colorCovid)" />
              <Area dataKey="dengue" stackId="1" stroke="#ec4899" fill="#f9a8d4" />
              <Area dataKey="malaria" stackId="1" stroke="#f59e0b" fill="#fcd34d" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="card p-5 h-[420px] shadow-lg hover:shadow-xl transition-shadow">
          <h3 className="text-3xl font-semibold mb-3 flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-primary-500" />
            Current Disease Distribution
          </h3>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={data.distribution || []} dataKey="value" nameKey="name" outerRadius={120} label>
                {(data.distribution || []).map((entry) => <Cell key={entry.name} fill={entry.color} />)}
              </Pie>
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'rgba(30, 30, 30, 0.9)',
                  border: '1px solid rgba(100, 100, 100, 0.3)',
                  borderRadius: '8px'
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
