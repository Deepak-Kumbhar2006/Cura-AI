import { Activity, Bot, BrainCircuit, LayoutDashboard, MapPinned, ShieldAlert } from 'lucide-react';
import { motion } from 'framer-motion';
import { NavLink } from 'react-router-dom';

const navItems = [
  { key: 'overview', label: 'Overview', icon: LayoutDashboard, to: '/doctor/dashboard' },
  { key: 'case-manager', label: 'Case Manager', icon: Activity, to: '/doctor/reports' },
  { key: 'risk-map', label: 'Risk Map', icon: MapPinned, to: '/doctor/map' },
  { key: 'analytics', label: 'Analytics', icon: ShieldAlert, to: '/doctor/alerts' },
  { key: 'ai-engine', label: 'AI Engine', icon: BrainCircuit, to: '/doctor/ai-engine' },
];

export default function Sidebar({ active = 'overview' }) {
  return (
    <aside className="dashboard-glass rounded-3xl p-4 lg:p-5 h-full">
      <div className="mb-8 flex items-center gap-3">
        <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-emerald-400 to-cyan-500 grid place-items-center text-white shadow-[0_0_20px_rgba(16,185,129,0.55)]">
          <Bot size={20} />
        </div>
        <div>
          <p className="font-semibold text-base dashboard-text">CuraAi</p>
          <p className="text-xs dashboard-muted">Health Surveillance</p>
        </div>
      </div>

      <nav className="space-y-2">
        {navItems.map((item, idx) => {
          const Icon = item.icon;
          const isActive = active === item.key;
          return (
            <motion.div
              key={item.key}
              initial={{ opacity: 0, x: -14 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.05 }}
            >
              <NavLink
                to={item.to}
                className={`w-full relative px-3 py-3 rounded-2xl flex items-center gap-3 text-sm transition-all duration-300 ${
                  isActive
                    ? 'dashboard-nav-active dashboard-text'
                    : 'dashboard-muted hover:dashboard-text hover:bg-white/5'
                }`}
              >
                {isActive && <span className="absolute inset-y-2 left-0 w-1 rounded-r-full bg-cyan-300 shadow-[0_0_16px_rgba(34,211,238,0.8)]" />}
                <Icon size={17} />
                <span>{item.label}</span>
              </NavLink>
            </motion.div>
          );
        })}
      </nav>
    </aside>
  );
}
