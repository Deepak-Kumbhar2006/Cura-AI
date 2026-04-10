import { motion } from 'framer-motion';

export default function StatCard({ title, value, subtitle, accent = 'text-slate-600', icon: Icon, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: 'easeOut' }}
      className="metric-card group"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-slate-500 text-xs font-medium uppercase tracking-wider">{title}</p>
          <p className="text-3xl font-bold mt-2 text-slate-800 font-display">{value}</p>
          <p className={`mt-1.5 text-sm ${accent}`}>{subtitle}</p>
        </div>
        {Icon && (
          <div className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-500 grid place-items-center group-hover:bg-emerald-100 transition-colors">
            <Icon size={20} />
          </div>
        )}
      </div>
      <div className="mt-4 h-1.5 rounded-full bg-emerald-50">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-green-400"
          initial={{ width: 0 }}
          animate={{ width: '66%' }}
          transition={{ duration: 0.8, delay: delay + 0.2, ease: 'easeOut' }}
        />
      </div>
    </motion.div>
  );
}
