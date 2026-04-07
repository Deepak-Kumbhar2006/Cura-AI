import { motion } from 'framer-motion';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, AreaChart, Area, CartesianGrid } from 'recharts';
import { Brain, Zap, Target, TrendingUp, AlertTriangle, BarChart3 } from 'lucide-react';

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

const aiCards = [
  { title: 'Case Risk Analysis', desc: 'Dengue: 88% · Flu: 45% · Covid-like: 12%', icon: Target, color: 'from-danger-500 to-orange-500', confidence: 88 },
  { title: 'Symptom Classification', desc: 'Suspected: Dengue (82%), Typhoid (10%), Other (8%)', icon: Brain, color: 'from-violet-500 to-purple-500', confidence: 82 },
  { title: 'Pattern Signature', desc: 'Outbreak signature matches previous Kothrud cluster pattern', icon: Zap, color: 'from-primary-500 to-emerald-500', confidence: 91 },
];

export default function AIEngine() {
  return (
    <div className="space-y-5 animate-fade-up">
      <div>
        <h2 className="text-2xl font-display font-bold text-slate-800 dark:text-white">AI & Prediction Engine</h2>
        <p className="text-sm text-slate-500 mt-1">Machine learning-powered disease analysis and forecasting</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        {aiCards.map((card, i) => (
          <motion.div key={card.title} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
            className="card p-5 relative overflow-hidden group">
            <div className={`absolute top-0 right-0 h-24 w-24 rounded-full bg-gradient-to-br ${card.color} opacity-10 -translate-y-8 translate-x-8 group-hover:scale-150 transition-transform duration-500`} />
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-3">
                <div className={`h-10 w-10 rounded-2xl bg-gradient-to-br ${card.color} text-white grid place-items-center`}>
                  <card.icon size={18} />
                </div>
                <span className="text-lg font-bold text-slate-800 dark:text-white">{card.confidence}%</span>
              </div>
              <h3 className="font-display font-semibold text-slate-800 dark:text-white text-sm">{card.title}</h3>
              <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">{card.desc}</p>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle size={16} className="text-danger-500" />
            <h3 className="font-display font-semibold text-slate-800 dark:text-white">Anomaly Detection & Case Spikes</h3>
          </div>
          <div className="h-72">
            <ResponsiveContainer>
              <AreaChart data={anomaly}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="#94a3b8" />
                <YAxis tick={{ fontSize: 12 }} stroke="#94a3b8" />
                <Tooltip contentStyle={{ borderRadius: 16, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }} />
                <Area dataKey="predicted" stroke="#43A047" fill="#C8E6C9" strokeWidth={2} />
                <Area dataKey="actual" stroke="#E53E3E" fill="#FED7D7" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card p-5">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 size={16} className="text-primary-600" />
            <h3 className="font-display font-semibold text-slate-800 dark:text-white">Time Series Forecasting</h3>
          </div>
          <div className="h-72">
            <ResponsiveContainer>
              <LineChart data={forecast}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="week" tick={{ fontSize: 12 }} stroke="#94a3b8" />
                <YAxis tick={{ fontSize: 12 }} stroke="#94a3b8" />
                <Tooltip contentStyle={{ borderRadius: 16, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }} />
                <Line dataKey="dengue" stroke="#F59E0B" strokeWidth={3} dot={{ r: 4, fill: '#F59E0B' }} />
                <Line dataKey="flu" stroke="#43A047" strokeWidth={3} dot={{ r: 4, fill: '#43A047' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
