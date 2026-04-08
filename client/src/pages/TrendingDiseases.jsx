import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus, Globe, Skull, Heart, Activity, AlertTriangle, RefreshCw, BarChart3, Users, Shield } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell } from 'recharts';
import api from '../services/api';
import toast from 'react-hot-toast';

const trendIcons = { rising: TrendingUp, declining: TrendingDown, stable: Minus };
const trendColors = { rising: 'text-danger-500', declining: 'text-primary-500', stable: 'text-warning-500' };
const severityBadge = { High: 'badge-danger', Moderate: 'badge-warning', Low: 'badge-success' };
const pieColors = ['#43A047', '#F59E0B', '#E53E3E', '#3B82F6', '#8B5CF6', '#EC4899'];

function formatNum(n) {
  if (n >= 1e9) return (n / 1e9).toFixed(1) + 'B';
  if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M';
  if (n >= 1e3) return (n / 1e3).toFixed(1) + 'K';
  return String(n);
}

export default function TrendingDiseases() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('diseases');

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: res } = await api.get('/api/diseases/trending');
      setData(res);
    } catch {
      toast.error('Failed to load disease data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  if (loading || !data) return <DiseasesSkeleton />;

  const globalKpis = [
    { label: 'Total Cases', value: formatNum(data.global.cases), icon: Users, color: 'from-blue-500 to-blue-600', raw: data.global.cases },
    { label: 'Active Cases', value: formatNum(data.global.active), icon: Activity, color: 'from-warning-500 to-orange-500', raw: data.global.active },
    { label: 'Recovered', value: formatNum(data.global.recovered), icon: Heart, color: 'from-primary-500 to-emerald-500', raw: data.global.recovered },
    { label: 'Deaths', value: formatNum(data.global.deaths), icon: Skull, color: 'from-danger-500 to-red-600', raw: data.global.deaths },
  ];

  const barData = data.diseases.map((d) => ({ name: d.name.length > 10 ? d.name.slice(0, 10) + '...' : d.name, active: d.active, today: d.todayCases }));
  const pieData = data.diseases.map((d, i) => ({ name: d.name, value: d.active, fill: pieColors[i % pieColors.length] }));

  return (
    <div className="space-y-5 animate-fade-up">
      {/* Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-violet-600 via-purple-500 to-fuchsia-500 text-white p-6 shadow-glow">
        <div className="absolute top-0 right-0 w-72 h-72 bg-white/5 rounded-full -translate-y-36 translate-x-36" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-24 -translate-x-24" />
        <div className="relative z-10 flex items-center justify-between">
          <div>
            <p className="text-sm text-white/80 font-medium uppercase tracking-wider">Disease Intelligence</p>
            <h2 className="text-3xl font-display font-bold mt-1">Trending Diseases</h2>
            <p className="text-sm text-white/70 mt-1">Live data from disease.sh API — global pandemic tracking</p>
          </div>
          <button onClick={fetchData} className="p-3 rounded-2xl bg-white/20 hover:bg-white/30 transition backdrop-blur">
            <RefreshCw size={20} />
          </button>
        </div>
      </div>

      {/* Global KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {globalKpis.map((k, i) => (
          <motion.div key={k.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
            className="metric-card relative overflow-hidden group">
            <div className={`absolute top-0 right-0 h-20 w-20 rounded-full bg-gradient-to-br ${k.color} opacity-10 -translate-y-6 translate-x-6 group-hover:scale-150 transition-transform duration-500`} />
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">{k.label}</p>
                <div className={`h-8 w-8 rounded-xl bg-gradient-to-br ${k.color} text-white grid place-items-center`}>
                  <k.icon size={14} />
                </div>
              </div>
              <p className="text-3xl font-bold text-slate-800 dark:text-white">{k.value}</p>
              <p className="text-xs text-slate-400 mt-1">+{formatNum(data.global.todayCases)} today</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 bg-surface-100 dark:bg-slate-800 rounded-2xl p-1.5">
        {[{ id: 'diseases', label: 'Diseases', icon: Activity }, { id: 'countries', label: 'Top Countries', icon: Globe }, { id: 'charts', label: 'Analytics', icon: BarChart3 }].map((tab) => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${activeTab === tab.id ? 'bg-white dark:bg-slate-700 text-primary-700 dark:text-primary-400 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
            <tab.icon size={16} /> {tab.label}
          </button>
        ))}
      </div>

      {/* Diseases Tab */}
      {activeTab === 'diseases' && (
        <div className="grid gap-4">
          {data.diseases.map((disease, i) => {
            const TrendIcon = trendIcons[disease.trend];
            return (
              <motion.div key={disease.name} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                className="card p-5 hover:shadow-elevated transition-all duration-300">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 text-white grid place-items-center">
                      <AlertTriangle size={18} />
                    </div>
                    <div>
                      <h4 className="font-display font-semibold text-slate-800 dark:text-white">{disease.name}</h4>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className={`badge ${severityBadge[disease.severity]} text-[10px]`}>{disease.severity}</span>
                        <span className={`flex items-center gap-1 text-xs font-medium ${trendColors[disease.trend]}`}>
                          <TrendIcon size={12} /> {disease.trend}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-slate-800 dark:text-white">{formatNum(disease.active)}</p>
                    <p className="text-xs text-slate-400">active cases</p>
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-3">
                  <div className="rounded-xl bg-blue-50 dark:bg-blue-900/20 p-3 text-center">
                    <p className="text-lg font-bold text-blue-700 dark:text-blue-400">{formatNum(disease.cases)}</p>
                    <p className="text-[10px] text-slate-500 uppercase">Total</p>
                  </div>
                  <div className="rounded-xl bg-primary-50 dark:bg-primary-900/20 p-3 text-center">
                    <p className="text-lg font-bold text-primary-700 dark:text-primary-400">{formatNum(disease.recovered)}</p>
                    <p className="text-[10px] text-slate-500 uppercase">Recovered</p>
                  </div>
                  <div className="rounded-xl bg-danger-50 dark:bg-danger-900/20 p-3 text-center">
                    <p className="text-lg font-bold text-danger-600">{formatNum(disease.deaths)}</p>
                    <p className="text-[10px] text-slate-500 uppercase">Deaths</p>
                  </div>
                  <div className="rounded-xl bg-warning-50 dark:bg-warning-900/20 p-3 text-center">
                    <p className="text-lg font-bold text-warning-600">+{formatNum(disease.todayCases)}</p>
                    <p className="text-[10px] text-slate-500 uppercase">Today</p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Countries Tab */}
      {activeTab === 'countries' && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.topCountries.map((c, i) => (
            <motion.div key={c.country} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
              className="card p-5 hover:shadow-elevated transition-all duration-300">
              <div className="flex items-center gap-3 mb-4">
                {c.flag && <img src={c.flag} alt={c.country} className="h-8 w-12 rounded-lg object-cover shadow-sm" />}
                <div>
                  <h4 className="font-semibold text-slate-800 dark:text-white">{c.country}</h4>
                  <p className="text-xs text-slate-400">{formatNum(c.casesPerMillion)} per million</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 text-center">
                <div className="rounded-xl bg-surface-50 dark:bg-slate-700/50 p-2">
                  <p className="text-sm font-bold text-slate-800 dark:text-white">{formatNum(c.cases)}</p>
                  <p className="text-[10px] text-slate-400">Cases</p>
                </div>
                <div className="rounded-xl bg-surface-50 dark:bg-slate-700/50 p-2">
                  <p className="text-sm font-bold text-primary-600">{formatNum(c.recovered)}</p>
                  <p className="text-[10px] text-slate-400">Recovered</p>
                </div>
                <div className="rounded-xl bg-surface-50 dark:bg-slate-700/50 p-2">
                  <p className="text-sm font-bold text-warning-600">{formatNum(c.active)}</p>
                  <p className="text-[10px] text-slate-400">Active</p>
                </div>
                <div className="rounded-xl bg-surface-50 dark:bg-slate-700/50 p-2">
                  <p className="text-sm font-bold text-danger-600">{formatNum(c.deaths)}</p>
                  <p className="text-[10px] text-slate-400">Deaths</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Charts Tab */}
      {activeTab === 'charts' && (
        <div className="grid lg:grid-cols-2 gap-4">
          <div className="card p-5">
            <h3 className="font-display font-semibold text-slate-800 dark:text-white mb-4">Active Cases by Disease</h3>
            <div className="h-72">
              <ResponsiveContainer>
                <BarChart data={barData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="#94a3b8" />
                  <YAxis tick={{ fontSize: 11 }} stroke="#94a3b8" tickFormatter={formatNum} />
                  <Tooltip formatter={(v) => formatNum(v)} contentStyle={{ borderRadius: 16, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }} />
                  <Bar dataKey="active" fill="#8B5CF6" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="card p-5">
            <h3 className="font-display font-semibold text-slate-800 dark:text-white mb-4">Distribution of Active Cases</h3>
            <div className="h-72">
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={pieData} dataKey="value" cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={3}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                    {pieData.map((e) => <Cell key={e.name} fill={e.fill} stroke="none" />)}
                  </Pie>
                  <Tooltip formatter={(v) => formatNum(v)} contentStyle={{ borderRadius: 16, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function DiseasesSkeleton() {
  return (
    <div className="space-y-5 animate-pulse">
      <div className="h-40 rounded-3xl bg-slate-200 dark:bg-slate-700" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-28 rounded-2xl bg-slate-200 dark:bg-slate-700" />)}
      </div>
      <div className="h-12 rounded-2xl bg-slate-200 dark:bg-slate-700" />
      {Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-40 rounded-2xl bg-slate-200 dark:bg-slate-700" />)}
    </div>
  );
}
