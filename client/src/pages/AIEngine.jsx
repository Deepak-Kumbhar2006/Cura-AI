import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, AreaChart, Area, CartesianGrid } from 'recharts';

const anomaly = [
  { month: 'Jan', predicted: 20, actual: 25 },
  { month: 'Feb', predicted: 28, actual: 30 },
  { month: 'Mar', predicted: 35, actual: 38 },
  { month: 'Apr', predicted: 42, actual: 95 },
  { month: 'May', predicted: 36, actual: 34 },
];

const forecast = [
  { week: 'W1', dengue: 120, flu: 190 },
  { week: 'W2', dengue: 160, flu: 210 },
  { week: 'W3', dengue: 150, flu: 230 },
  { week: 'W4', dengue: 200, flu: 245 },
];

export default function AIEngine() {
  return (
    <div className="space-y-3">
      <h2 className="text-3xl font-bold">AI & Prediction Engine</h2>
      <div className="grid lg:grid-cols-3 gap-3">
        <div className="card p-4"><h3 className="font-semibold">Case Risk Analysis</h3><p className="text-sm mt-1">Risk of dengue: <b>88%</b>, flu: <b>45%</b>, covid-like: <b>12%</b></p></div>
        <div className="card p-4"><h3 className="font-semibold">Symptom Classification</h3><p className="text-sm mt-1">Suspected: Dengue (82%), Typhoid (10%), Other (8%).</p></div>
        <div className="card p-4"><h3 className="font-semibold">Pattern Signature</h3><p className="text-sm mt-1">Outbreak signature matches previous Kothrud cluster pattern.</p></div>
      </div>
      <div className="grid lg:grid-cols-2 gap-3">
        <div className="card p-4 h-72"><h3 className="font-semibold mb-2">Anomaly Detection & Case Spikes</h3><ResponsiveContainer><AreaChart data={anomaly}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="month" /><YAxis /><Tooltip /><Area dataKey="predicted" stroke="#34d399" fill="#a7f3d0" /><Area dataKey="actual" stroke="#ef4444" fill="#fecaca" /></AreaChart></ResponsiveContainer></div>
        <div className="card p-4 h-72"><h3 className="font-semibold mb-2">Time Series Forecasting</h3><ResponsiveContainer><LineChart data={forecast}><XAxis dataKey="week" /><YAxis /><Tooltip /><Line dataKey="dengue" stroke="#f59e0b" /><Line dataKey="flu" stroke="#10b981" /></LineChart></ResponsiveContainer></div>
      </div>
    </div>
  );
}
