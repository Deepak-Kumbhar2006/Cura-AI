import { motion } from 'framer-motion';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, AreaChart, Area, CartesianGrid } from 'recharts';
import { BrainCircuit, TrendingUp, Activity, Fingerprint } from 'lucide-react';

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

const insightCards = [
  { title: 'Case Risk Analysis', desc: 'Risk of dengue: 88%, flu: 45%, covid-like: 12%', icon: Activity, accent: 'text-rose-500' },
  { title: 'Symptom Classification', desc: 'Suspected: Dengue (82%), Typhoid (10%), Other (8%).', icon: TrendingUp, accent: 'text-amber-500' },
  { title: 'Pattern Signature', desc: 'Outbreak signature matches previous Kothrud cluster pattern.', icon: Fingerprint, accent: 'text-emerald-500' },
];

export default function AIEngine() {
  return (
    <div className="space-y-5">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-500 to-green-400 grid place-items-center">
          <BrainCircuit size={20} className="text-white" />
        </div>
        <div>
          <h2 className="section-title">AI & Prediction Engine</h2>
          <p className="text-sm text-slate-500">Machine learning insights and anomaly detection</p>
        </div>
      </motion.div>

      <div className="grid lg:grid-cols-3 gap-4">
        {insightCards.map((card, idx) => (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.08 }}
            className="metric-card"
          >
            <div className="flex items-start gap-3">
              <div className="h-9 w-9 rounded-xl bg-emerald-50 grid place-items-center">
                <card.icon size={18} className={card.accent} />
              </div>
              <div>
                <h3 className="font-semibold text-slate-800">{card.title}</h3>
                <p className="text-sm mt-1 text-slate-600">{card.desc}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="card p-5 h-80">
          <h3 className="font-semibold text-slate-800 mb-3">Anomaly Detection & Case Spikes</h3>
          <ResponsiveContainer>
            <AreaChart data={anomaly}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="month" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip />
              <Area dataKey="predicted" stroke="#34d399" fill="#a7f3d0" strokeWidth={2} />
              <Area dataKey="actual" stroke="#ef4444" fill="#fecaca" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="card p-5 h-80">
          <h3 className="font-semibold text-slate-800 mb-3">Time Series Forecasting</h3>
          <ResponsiveContainer>
            <LineChart data={forecast}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="week" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip />
              <Line dataKey="dengue" stroke="#f59e0b" strokeWidth={2} dot={{ r: 4 }} />
              <Line dataKey="flu" stroke="#10b981" strokeWidth={2} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>
      </div>
    </div>
  );
}
