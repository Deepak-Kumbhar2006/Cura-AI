import { useEffect, useMemo, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, CartesianGrid, Legend } from 'recharts';
import { Brain, Siren, ShieldAlert, TrendingUp, TrendingDown, Search, Filter, ChevronUp, ChevronDown, AlertTriangle, Zap, MapPin, Users, Activity, ArrowUpRight, ArrowDownRight, Eye, ChevronLeft, ChevronRight } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';

const chartColors = ['#43A047', '#F59E0B', '#E53E3E', '#3B82F6', '#8B5CF6'];
const riskBadge = { High: 'badge-danger', Medium: 'badge-warning', Low: 'badge-success' };

function AnimatedNumber({ value, duration = 800 }) {
  const [display, setDisplay] = useState(0);
  const numVal = typeof value === 'string' ? parseInt(value) || 0 : value;
  useEffect(() => {
    let start = 0;
    const step = numVal / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= numVal) { setDisplay(numVal); clearInterval(timer); }
      else setDisplay(Math.floor(start));
    }, 16);
    return () => clearInterval(timer);
  }, [numVal, duration]);
  return <span>{display}</span>;
}

export default function DoctorDashboard() {
  const [stats, setStats] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [records, setRecords] = useState([]);
  const [sim, setSim] = useState({ region: 'Pune', symptoms: 'fever,cough', density: 7000 });
  const [simResult, setSimResult] = useState(null);
  const [search, setSearch] = useState('');
  const [riskFilter, setRiskFilter] = useState('All');
  const [sortKey, setSortKey] = useState('name');
  const [sortDir, setSortDir] = useState('asc');
  const [page, setPage] = useState(1);
  const pageSize = 6;

  useEffect(() => {
    Promise.all([api.get('/api/dashboard/stats'), api.get('/api/alerts'), api.get('/api/data/all')])
      .then(([s, a, r]) => { setStats(s.data); setAlerts(a.data); setRecords(r.data); })
      .catch(() => toast.error('Unable to load doctor dashboard'));
  }, []);

  const kpis = useMemo(() => {
    if (!stats) return [];
    return [
      { label: 'Total Patients', value: stats.totalCases, trend: '+12%', up: true, icon: Users, color: 'from-primary-500 to-primary-600' },
      { label: 'Active Cases', value: Math.max(stats.totalCases - 4, 0), trend: '+3%', up: true, icon: Activity, color: 'from-blue-500 to-blue-600' },
      { label: 'Critical Alerts', value: stats.activeAlerts, trend: 'Urgent', up: true, icon: ShieldAlert, color: 'from-danger-500 to-danger-600', danger: true },
      { label: 'Recovery Rate', value: 73, suffix: '%', trend: '+4.4%', up: true, icon: TrendingUp, color: 'from-emerald-500 to-emerald-600' },
      { label: 'AI Accuracy', value: stats.predictionAccuracy, suffix: '%', trend: '+1.8%', up: true, icon: Brain, color: 'from-violet-500 to-violet-600' },
    ];
  }, [stats]);

  const riskData = [
    { name: 'Low Risk', value: Math.max((stats?.totalCases || 1) - (stats?.highRiskRegions || 0) * 2, 1), fill: '#43A047' },
    { name: 'Medium Risk', value: Math.max(stats?.highRiskRegions || 1, 1), fill: '#F59E0B' },
    { name: 'High Risk', value: Math.max(stats?.activeAlerts || 1, 1), fill: '#E53E3E' },
  ];

  const ageRisk = [
    { age: '0-18', risk: 12, fill: '#A5D6A7' },
    { age: '19-35', risk: 35, fill: '#66BB6A' },
    { age: '36-55', risk: 47, fill: '#43A047' },
    { age: '56+', risk: 28, fill: '#2E7D32' },
  ];

  const regions = [
    { name: 'Pune', level: 'high', cases: 142 },
    { name: 'Mumbai', level: 'high', cases: 218 },
    { name: 'Delhi', level: 'medium', cases: 87 },
    { name: 'Bangalore', level: 'low', cases: 34 },
    { name: 'Hyderabad', level: 'medium', cases: 65 },
    { name: 'Nashik', level: 'high', cases: 98 },
    { name: 'Nagpur', level: 'low', cases: 22 },
    { name: 'Jaipur', level: 'medium', cases: 56 },
    { name: 'Surat', level: 'low', cases: 18 },
    { name: 'Indore', level: 'medium', cases: 44 },
  ];
  const heatColor = { high: 'bg-danger-500 hover:bg-danger-600', medium: 'bg-warning-500 hover:bg-warning-600', low: 'bg-primary-500 hover:bg-primary-600' };

  const filteredRecords = useMemo(() => {
    let data = [...records];
    if (search) {
      const q = search.toLowerCase();
      data = data.filter((r) => (r.personalDetails?.name || '').toLowerCase().includes(q) || (r.location?.city || '').toLowerCase().includes(q));
    }
    if (riskFilter !== 'All') data = data.filter((r) => r.risk === riskFilter);
    data.sort((a, b) => {
      let va, vb;
      if (sortKey === 'name') { va = a.personalDetails?.name || ''; vb = b.personalDetails?.name || ''; }
      else if (sortKey === 'risk') { const o = { High: 3, Medium: 2, Low: 1 }; va = o[a.risk] || 0; vb = o[b.risk] || 0; }
      else if (sortKey === 'age') { va = a.personalDetails?.age || 0; vb = b.personalDetails?.age || 0; }
      else { va = a.location?.city || ''; vb = b.location?.city || ''; }
      if (va < vb) return sortDir === 'asc' ? -1 : 1;
      if (va > vb) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
    return data;
  }, [records, search, riskFilter, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filteredRecords.length / pageSize));
  const paged = filteredRecords.slice((page - 1) * pageSize, page * pageSize);

  const toggleSort = (key) => {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortKey(key); setSortDir('asc'); }
  };
  const SortIcon = ({ col }) => sortKey === col ? (sortDir === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />) : null;

  const simulate = () => {
    const symptomsScore = sim.symptoms.toLowerCase().includes('fever') ? 0.25 : 0.1;
    const densityScore = Math.min(Number(sim.density) / 10000, 0.5);
    const riskPct = Math.round((symptomsScore + densityScore + 0.2) * 100);
    setSimResult({
      risk: riskPct,
      level: riskPct > 70 ? 'High' : riskPct > 40 ? 'Medium' : 'Low',
      precautions: riskPct > 70
        ? ['Deploy mobile clinics immediately', 'Issue local mask advisory', 'Increase rapid testing capacity', 'Alert nearby hospitals']
        : ['Continue monitoring trends', 'Run public awareness campaign', 'Prepare contingency supplies'],
    });
  };

  const aiInsights = [
    { text: 'Spike detected in flu cases (+28%)', confidence: 83, severity: 'medium', icon: TrendingUp },
    { text: 'Possible outbreak in Pune within 3 days', confidence: 84, severity: 'high', icon: AlertTriangle },
    { text: 'Critical humidity-driven cluster in Kothrud', confidence: 76, severity: 'high', icon: Zap },
    { text: 'Dengue transmission declining in South Mumbai', confidence: 91, severity: 'low', icon: TrendingDown },
  ];

  if (!stats) return <DashboardSkeleton />;

  return (
    <div className="space-y-5 animate-fade-up">
      {/* Outbreak Banner */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-primary-600 via-primary-500 to-emerald-500 text-white p-5 shadow-glow">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-32 translate-x-32" />
        <div className="relative z-10 flex items-center gap-4">
          <div className="h-12 w-12 rounded-2xl bg-white/20 backdrop-blur grid place-items-center flex-shrink-0">
            <AlertTriangle size={22} />
          </div>
          <div>
            <p className="font-display font-bold text-lg">AI Outbreak Prediction</p>
            <p className="text-sm text-white/90">AI suggests possible outbreak in Pune within the next 3 days — <span className="font-bold">84% confidence</span>. Preventive measures recommended.</p>
          </div>
        </div>
      </motion.div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
        {kpis.map((k, i) => (
          <motion.div key={k.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
            className={`metric-card relative overflow-hidden group ${k.danger ? 'border-danger-200 dark:border-danger-800' : ''}`}>
            <div className={`absolute top-0 right-0 h-20 w-20 rounded-full bg-gradient-to-br ${k.color} opacity-10 -translate-y-6 translate-x-6 group-hover:scale-150 transition-transform duration-500`} />
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">{k.label}</p>
                <div className={`h-8 w-8 rounded-xl bg-gradient-to-br ${k.color} text-white grid place-items-center`}>
                  <k.icon size={14} />
                </div>
              </div>
              <p className="text-3xl font-bold text-slate-800 dark:text-white">
                <AnimatedNumber value={k.value} />{k.suffix || ''}
              </p>
              <div className="flex items-center gap-1 mt-2">
                {k.danger
                  ? <span className="badge badge-danger text-[10px]">{k.trend}</span>
                  : <>
                      {k.up ? <ArrowUpRight size={14} className="text-primary-600" /> : <ArrowDownRight size={14} className="text-danger-500" />}
                      <span className={`text-xs font-semibold ${k.up ? 'text-primary-600' : 'text-danger-500'}`}>{k.trend}</span>
                    </>
                }
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid lg:grid-cols-2 gap-4">
        <div className="card p-5">
          <h3 className="font-display font-semibold text-slate-800 dark:text-white mb-4">Cases Over Time</h3>
          <div className="h-72">
            <ResponsiveContainer>
              <LineChart data={(stats.trends || []).map((x) => ({ day: x._id, cases: x.count }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="day" tick={{ fontSize: 12 }} stroke="#94a3b8" />
                <YAxis tick={{ fontSize: 12 }} stroke="#94a3b8" />
                <Tooltip contentStyle={{ borderRadius: 16, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }} />
                <Line dataKey="cases" stroke="#43A047" strokeWidth={3} dot={{ r: 4, fill: '#43A047' }} activeDot={{ r: 6, stroke: '#fff', strokeWidth: 2 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card p-5">
          <h3 className="font-display font-semibold text-slate-800 dark:text-white mb-4">Disease Distribution</h3>
          <div className="h-72">
            <ResponsiveContainer>
              <PieChart>
                <Pie data={riskData} dataKey="value" cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={4} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                  {riskData.map((e, i) => <Cell key={e.name} fill={e.fill} stroke="none" />)}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: 16, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Age Risk + Heatmap */}
      <div className="grid lg:grid-cols-3 gap-4">
        <div className="card p-5">
          <h3 className="font-display font-semibold text-slate-800 dark:text-white mb-4">Age Group vs Risk</h3>
          <div className="h-64">
            <ResponsiveContainer>
              <BarChart data={ageRisk}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="age" tick={{ fontSize: 12 }} stroke="#94a3b8" />
                <YAxis tick={{ fontSize: 12 }} stroke="#94a3b8" />
                <Tooltip contentStyle={{ borderRadius: 16, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }} />
                <Bar dataKey="risk" radius={[8, 8, 0, 0]}>
                  {ageRisk.map((e, i) => <Cell key={e.age} fill={e.fill} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card p-5 lg:col-span-2">
          <h3 className="font-display font-semibold text-slate-800 dark:text-white mb-4">Region-wise Heatmap</h3>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {regions.map((r) => (
              <motion.button key={r.name} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                className={`${heatColor[r.level]} rounded-2xl p-4 text-white transition-all duration-200 shadow-sm hover:shadow-md`}>
                <MapPin size={14} className="mb-1 opacity-80" />
                <p className="font-semibold text-sm">{r.name}</p>
                <p className="text-xs opacity-80 mt-0.5">{r.cases} cases</p>
              </motion.button>
            ))}
          </div>
          <div className="flex items-center gap-4 mt-4 text-xs text-slate-500">
            <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-full bg-danger-500" />High Risk</span>
            <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-full bg-warning-500" />Medium</span>
            <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-full bg-primary-500" />Safe</span>
          </div>
        </div>
      </div>

      {/* Patient Case Management Table */}
      <div className="card p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <h3 className="font-display font-semibold text-slate-800 dark:text-white">Patient Case Management</h3>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input className="input-field pl-9 py-2 text-sm w-48" placeholder="Search patients..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
            </div>
            <select className="input-field py-2 text-sm w-28" value={riskFilter} onChange={(e) => { setRiskFilter(e.target.value); setPage(1); }}>
              <option value="All">All Risks</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700">
                {[{ key: 'name', label: 'Patient' }, { key: 'age', label: 'Age' }, { key: 'city', label: 'Location' }, { key: 'risk', label: 'Risk Level' }].map((col) => (
                  <th key={col.key} className="text-left py-3 px-4 font-semibold text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider cursor-pointer hover:text-primary-600 transition select-none"
                    onClick={() => toggleSort(col.key)}>
                    <span className="flex items-center gap-1">{col.label}<SortIcon col={col.key} /></span>
                  </th>
                ))}
                <th className="text-left py-3 px-4 font-semibold text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider">Disease</th>
                <th className="text-left py-3 px-4 font-semibold text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider">Status</th>
                <th className="text-right py-3 px-4 font-semibold text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paged.map((r) => (
                <motion.tr key={r._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="border-b border-slate-100 dark:border-slate-700/50 hover:bg-primary-50/50 dark:hover:bg-slate-700/30 transition">
                  <td className="py-3 px-4">
                    <p className="font-medium text-slate-800 dark:text-slate-200">{r.personalDetails?.name || 'Unknown'}</p>
                    <p className="text-xs text-slate-500">{r.personalDetails?.gender || '-'}</p>
                  </td>
                  <td className="py-3 px-4 text-slate-600 dark:text-slate-400">{r.personalDetails?.age || '-'}</td>
                  <td className="py-3 px-4 text-slate-600 dark:text-slate-400">{r.location?.city || '-'}</td>
                  <td className="py-3 px-4"><span className={`badge ${riskBadge[r.risk] || 'badge-info'}`}>{r.risk}</span></td>
                  <td className="py-3 px-4 text-slate-600 dark:text-slate-400">{r.diagnosis?.diseaseName || 'Pending'}</td>
                  <td className="py-3 px-4"><span className={`badge ${r.diagnosis?.status === 'Confirmed' ? 'badge-danger' : r.diagnosis?.status === 'Recovered' ? 'badge-success' : 'badge-info'}`}>{r.diagnosis?.status || 'Suspected'}</span></td>
                  <td className="py-3 px-4 text-right">
                    <button className="btn-ghost py-1.5 px-3 text-xs"><Eye size={14} className="inline mr-1" />View</button>
                  </td>
                </motion.tr>
              ))}
              {!paged.length && (
                <tr><td colSpan={7} className="py-12 text-center text-slate-400">
                  <Users size={32} className="mx-auto mb-2 opacity-50" />
                  <p>No patient cases found</p>
                </td></tr>
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-100 dark:border-slate-700">
            <p className="text-sm text-slate-500">{filteredRecords.length} total patients</p>
            <div className="flex items-center gap-1">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="btn-ghost py-1.5 px-2 disabled:opacity-30"><ChevronLeft size={16} /></button>
              {Array.from({ length: totalPages }, (_, i) => (
                <button key={i + 1} onClick={() => setPage(i + 1)}
                  className={`h-8 w-8 rounded-xl text-sm font-medium transition ${page === i + 1 ? 'bg-primary-600 text-white' : 'hover:bg-primary-50 text-slate-600'}`}>{i + 1}</button>
              ))}
              <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="btn-ghost py-1.5 px-2 disabled:opacity-30"><ChevronRight size={16} /></button>
            </div>
          </div>
        )}
      </div>

      {/* AI Insights + Live Alerts */}
      <div className="grid lg:grid-cols-3 gap-4">
        <div className="card p-5 lg:col-span-2">
          <h3 className="font-display font-semibold text-slate-800 dark:text-white mb-4">AI Insights Panel</h3>
          <div className="space-y-3">
            {aiInsights.map((insight, i) => {
              const severityColors = { high: 'border-danger-200 bg-danger-50/50', medium: 'border-warning-200 bg-warning-50/50', low: 'border-primary-200 bg-primary-50/50' };
              const Icon = insight.icon;
              return (
                <motion.div key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }}
                  className={`flex items-center gap-4 p-4 rounded-2xl border ${severityColors[insight.severity]} transition-all hover:shadow-sm`}>
                  <div className={`h-10 w-10 rounded-xl grid place-items-center flex-shrink-0 ${
                    insight.severity === 'high' ? 'bg-danger-100 text-danger-600' : insight.severity === 'medium' ? 'bg-warning-100 text-warning-600' : 'bg-primary-100 text-primary-600'
                  }`}><Icon size={18} /></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{insight.text}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-lg font-bold text-slate-800 dark:text-white">{insight.confidence}%</p>
                    <p className="text-[10px] text-slate-400 uppercase">confidence</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-semibold text-slate-800 dark:text-white">Live Alerts</h3>
            <span className="badge badge-danger animate-pulse-soft">Live</span>
          </div>
          <div className="space-y-2 max-h-80 overflow-auto">
            {alerts.slice(0, 8).map((a, i) => (
              <motion.div key={a._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }}
                className="p-3 rounded-2xl bg-danger-50 dark:bg-danger-500/10 border border-danger-100 dark:border-danger-800/30 text-sm">
                <div className="flex items-start gap-2">
                  <AlertTriangle size={14} className="text-danger-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-slate-700 dark:text-slate-300">{a.message}</p>
                    <p className="text-xs text-slate-400 mt-1">{a.location} · {a.risk}</p>
                  </div>
                </div>
              </motion.div>
            ))}
            {!alerts.length && <p className="text-sm text-slate-400 text-center py-8">No active alerts</p>}
          </div>
        </div>
      </div>

      {/* Prediction Simulator */}
      <div className="card p-5">
        <h3 className="font-display font-semibold text-slate-800 dark:text-white mb-4">Prediction Simulator</h3>
        <div className="grid md:grid-cols-4 gap-4">
          <div>
            <label className="text-xs font-medium text-slate-500 mb-1.5 block uppercase tracking-wider">Region</label>
            <input className="input-field" placeholder="e.g. Pune" value={sim.region} onChange={(e) => setSim({ ...sim, region: e.target.value })} />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-500 mb-1.5 block uppercase tracking-wider">Symptoms</label>
            <input className="input-field" placeholder="fever,cough" value={sim.symptoms} onChange={(e) => setSim({ ...sim, symptoms: e.target.value })} />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-500 mb-1.5 block uppercase tracking-wider">Population Density</label>
            <input className="input-field" placeholder="7000" type="number" value={sim.density} onChange={(e) => setSim({ ...sim, density: e.target.value })} />
          </div>
          <div className="flex items-end">
            <button onClick={simulate} className="btn-primary w-full flex items-center justify-center gap-2">
              <Zap size={16} /> Run Simulation
            </button>
          </div>
        </div>

        <AnimatePresence>
          {simResult && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
              className="mt-5 overflow-hidden">
              <div className={`rounded-2xl p-5 ${simResult.level === 'High' ? 'bg-danger-50 border border-danger-200' : simResult.level === 'Medium' ? 'bg-warning-50 border border-warning-200' : 'bg-primary-50 border border-primary-200'}`}>
                <div className="flex items-center gap-4 mb-4">
                  <div className="text-center">
                    <p className="text-4xl font-bold text-slate-800">{simResult.risk}%</p>
                    <p className="text-xs text-slate-500 mt-1">Predicted Risk</p>
                  </div>
                  <div className="h-12 w-px bg-slate-200" />
                  <span className={`badge text-sm px-4 py-1.5 ${riskBadge[simResult.level]}`}>{simResult.level} Risk</span>
                </div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Suggested Precautions</p>
                <ul className="space-y-1.5">
                  {simResult.precautions.map((p, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-slate-700">
                      <span className="h-1.5 w-1.5 rounded-full bg-primary-500 flex-shrink-0" />{p}
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-5 animate-fade-up">
      <div className="skeleton h-20 rounded-3xl" />
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
        {Array.from({ length: 5 }).map((_, i) => <div key={i} className="skeleton h-32 rounded-2xl" />)}
      </div>
      <div className="grid lg:grid-cols-2 gap-4">
        <div className="skeleton h-80 rounded-2xl" />
        <div className="skeleton h-80 rounded-2xl" />
      </div>
    </div>
  );
}
