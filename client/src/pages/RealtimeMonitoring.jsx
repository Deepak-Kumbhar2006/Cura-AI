import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import StatCard from '../components/StatCard';

const live = [
  { time: '00:00', cases: 64 },
  { time: '06:00', cases: 28 },
  { time: '12:00', cases: 61 },
  { time: '18:00', cases: 49 },
  { time: '23:00', cases: 35 },
];

export default function RealtimeMonitoring() {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-5xl font-bold">Real-Time Monitoring</h2>
        <p className="text-slate-500 text-2xl">Live surveillance of disease spread and environmental factors</p>
      </div>
      <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard title="Active Cases (Now)" value="1,131" subtitle="+47 in last hour" accent="text-rose-500" />
        <StatCard title="Avg Temperature" value="28.2°C" subtitle="Across all regions" />
        <StatCard title="Avg Humidity" value="71.6%" subtitle="High risk for vector diseases" />
        <StatCard title="Air Quality Index" value="63" subtitle="Moderate (Caution advised)" accent="text-orange-500" />
      </div>
      <div className="grid xl:grid-cols-2 gap-4">
        <div className="card p-5 h-[420px]">
          <h3 className="text-3xl font-semibold mb-4">Regional Risk Heatmap</h3>
          <div className="h-[320px] rounded-2xl bg-slate-200 grid place-items-center text-slate-500">
            Interactive regional heat layer integrated via map module.
          </div>
        </div>
        <div className="card p-5 h-[420px]">
          <h3 className="text-3xl font-semibold mb-4">Live Case Updates (Last 24 Hours)</h3>
          <ResponsiveContainer>
            <AreaChart data={live}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="time" /><YAxis /><Tooltip /><Area dataKey="cases" fill="#93c5fd" stroke="#3b82f6" /></AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
