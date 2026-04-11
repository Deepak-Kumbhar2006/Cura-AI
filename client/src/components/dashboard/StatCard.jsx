import { motion } from 'framer-motion';

export default function StatCard({ title, value, trend, icon: Icon, ring = false }) {
  return (
    <motion.div
      whileHover={{ scale: 1.03 }}
      className="dashboard-glass rounded-2xl p-4 min-h-28"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs dashboard-muted">{title}</p>
          <p className="text-3xl font-bold dashboard-text mt-2">{value}</p>
          <p className={`text-xs mt-1 ${trend.startsWith('+') ? 'text-emerald-400' : 'text-rose-400'}`}>{trend}</p>
        </div>
        {ring ? (
          <div className="h-14 w-14 rounded-full border-[6px] border-emerald-400/25 border-t-emerald-400 shadow-[0_0_16px_rgba(16,185,129,0.5)]" />
        ) : (
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-fuchsia-500 via-purple-500 to-cyan-500 text-white grid place-items-center shadow-[0_0_20px_rgba(99,102,241,0.55)]">
            <Icon size={18} />
          </div>
        )}
      </div>
    </motion.div>
  );
}
