import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, CartesianGrid } from 'recharts';
import { Brain, Siren, ShieldAlert, TrendingUp } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';

const colors = ['#10b981', '#f59e0b', '#ef4444', '#3b82f6'];

export default function DoctorDashboard() {
  const [stats, setStats] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [records, setRecords] = useState([]);
  const [sim, setSim] = useState({ region: 'Pune', symptoms: 'fever,cough', density: 7000 });
  const [simResult, setSimResult] = useState(null);

  useEffect(() => {
    Promise.all([api.get('/api/dashboard/stats'), api.get('/api/alerts'), api.get('/api/data/all')])
      .then(([s, a, r]) => {
        setStats(s.data);
        setAlerts(a.data);
        setRecords(r.data);
      })
      .catch(() => toast.error('Unable to load doctor dashboard'));
  }, []);

  const kpis = useMemo(() => {
    if (!stats) return [];
    return [
      { label: 'Total Patients', value: stats.totalCases, trend: '+12%', icon: TrendingUp },
      { label: 'Active Cases', value: Math.max(stats.totalCases - 4, 0), trend: '+3%', icon: Brain },
      { label: 'Critical Alerts', value: stats.activeAlerts, trend: 'Urgent', icon: ShieldAlert, danger: true },
      { label: 'AI Accuracy', value: `${stats.predictionAccuracy}%`, trend: '+1.8%', icon: Siren },
      { label: 'Recovery Rate', value: '73%', trend: '+4.4%', icon: TrendingUp },
    ];
  }, [stats]);

  const riskData = [
    { name: 'Low', value: Math.max((stats?.totalCases || 1) - (stats?.highRiskRegions || 0) * 2, 1) },
    { name: 'Medium', value: Math.max(stats?.highRiskRegions || 1, 1) },
    { name: 'High', value: Math.max(stats?.activeAlerts || 1, 1) },
  ];

  const ageRisk = [
    { age: '0-18', risk: 12 },
    { age: '19-35', risk: 35 },
    { age: '36-55', risk: 47 },
    { age: '56+', risk: 28 },
  ];

  const simulate = () => {
    const symptomsScore = sim.symptoms.toLowerCase().includes('fever') ? 0.25 : 0.1;
    const densityScore = Math.min(Number(sim.density) / 10000, 0.5);
    const riskPct = Math.round((symptomsScore + densityScore + 0.2) * 100);
    setSimResult({
      risk: `${riskPct}%`,
      precautions: riskPct > 70 ? 'Deploy mobile clinics, issue local mask advisory, increase testing.' : 'Monitor and run awareness campaign.',
    });
  };

  if (!stats) return <DashboardSkeleton />;

  return (
    <div className="space-y-4 fade-in">
      <div className="card p-4 bg-gradient-to-r from-emerald-500 to-teal-500 text-white">
        <p className="font-semibold">🔥 AI Outbreak Prediction Banner</p>
        <p className="text-sm">AI suggests possible outbreak in Pune in next 3 days (Confidence 84%).</p>
      </div>

      <div className="grid md:grid-cols-2 xl:grid-cols-5 gap-3">
        {kpis.map((k, i) => (
          <motion.div key={k.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className={`metric-card ${k.danger ? 'border border-rose-200 bg-rose-50/70' : ''}`}>
            <div className="flex items-center justify-between"><p className="text-sm text-slate-500">{k.label}</p><k.icon size={16} /></div>
            <p className="text-3xl font-bold mt-2">{k.value}</p>
            <p className="text-xs mt-1 text-emerald-700">{k.trend}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-3">
        <div className="card p-4 h-80"><h3 className="font-semibold mb-2">Cases over time</h3><ResponsiveContainer><LineChart data={stats.trends.map((x) => ({ day: x._id, cases: x.count }))}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="day" /><YAxis /><Tooltip /><Line dataKey="cases" stroke="#10b981" /></LineChart></ResponsiveContainer></div>
        <div className="card p-4 h-80"><h3 className="font-semibold mb-2">Disease distribution</h3><ResponsiveContainer><PieChart><Pie data={riskData} dataKey="value" label>{riskData.map((e, i) => <Cell key={e.name} fill={colors[i]} />)}</Pie></PieChart></ResponsiveContainer></div>
      </div>

      <div className="grid lg:grid-cols-3 gap-3">
        <div className="card p-4 h-72"><h3 className="font-semibold mb-2">Age Group vs Risk</h3><ResponsiveContainer><BarChart data={ageRisk}><XAxis dataKey="age" /><YAxis /><Tooltip /><Bar dataKey="risk" fill="#34d399" /></BarChart></ResponsiveContainer></div>
        <div className="card p-4 lg:col-span-2">
          <h3 className="font-semibold mb-2">Region-wise Heatmap</h3>
          <div className="grid grid-cols-5 gap-2">
            {['Pune', 'Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Nashik', 'Nagpur', 'Jaipur', 'Surat', 'Indore'].map((r, i) => (
              <button key={r} className={`rounded-xl p-3 text-xs text-white ${i % 3 === 0 ? 'bg-rose-500' : i % 2 ? 'bg-amber-500' : 'bg-emerald-500'}`}>{r}</button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-3">
        <div className="card p-4 lg:col-span-2">
          <h3 className="font-semibold mb-2">Patient Case Manager (Live Feed)</h3>
          <div className="max-h-64 overflow-auto space-y-2">
            {records.slice(0, 8).map((r) => (
              <div key={r._id} className="flex items-center justify-between p-2 rounded-lg bg-slate-50 hover:bg-emerald-50 transition cursor-pointer">
                <div>
                  <p className="font-medium text-sm">{r.personalDetails?.name || 'Unknown'} • {r.location?.city}</p>
                  <p className="text-xs text-slate-500">{r.diagnosis?.diseaseName || 'Awaiting diagnosis'} · {r.risk}</p>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full ${r.risk === 'High' ? 'bg-rose-100 text-rose-600' : r.risk === 'Medium' ? 'bg-amber-100 text-amber-600' : 'bg-emerald-100 text-emerald-600'}`}>{r.risk}</span>
              </div>
            ))}
            {!records.length && <p className="text-sm text-slate-500">No patient cases found.</p>}
          </div>
        </div>

        <div className="card p-4">
          <h3 className="font-semibold mb-2">AI Insights</h3>
          <div className="space-y-2 text-sm">
            <div className="p-2 rounded bg-emerald-50">🧠 Spike detected in flu cases (+28%) <span className="font-semibold">83% confidence</span></div>
            <div className="p-2 rounded bg-amber-50">🧠 Possible outbreak in Pune in next 3 days <span className="font-semibold">84%</span></div>
            <div className="p-2 rounded bg-rose-50">🧠 Critical humidity-driven cluster in Kothrud <span className="font-semibold">76%</span></div>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-3">
        <div className="card p-4">
          <h3 className="font-semibold mb-2">Prediction Simulator</h3>
          <div className="grid grid-cols-3 gap-2 text-sm">
            <input className="border rounded p-2" placeholder="Region" value={sim.region} onChange={(e) => setSim({ ...sim, region: e.target.value })} />
            <input className="border rounded p-2" placeholder="Symptoms" value={sim.symptoms} onChange={(e) => setSim({ ...sim, symptoms: e.target.value })} />
            <input className="border rounded p-2" placeholder="Population density" value={sim.density} onChange={(e) => setSim({ ...sim, density: e.target.value })} />
          </div>
          <button onClick={simulate} className="mt-3 px-3 py-2 rounded bg-emerald-600 text-white">Simulate</button>
          {simResult && <div className="mt-3 p-3 rounded bg-emerald-50 text-sm"><p>Predicted Risk: <b>{simResult.risk}</b></p><p>{simResult.precautions}</p></div>}
        </div>

        <div className="card p-4">
          <h3 className="font-semibold mb-2">Live Alert Feed</h3>
          <div className="space-y-2 max-h-48 overflow-auto">
            {alerts.slice(0, 6).map((a) => <div key={a._id} className="p-2 rounded bg-rose-50 border border-rose-100 text-sm">{a.message}</div>)}
          </div>
        </div>
      </div>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="grid md:grid-cols-3 gap-3">
      {Array.from({ length: 6 }).map((_, i) => <div key={i} className="skeleton h-24" />)}
    </div>
  );
}
