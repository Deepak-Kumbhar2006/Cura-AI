import { Link, useLocation } from 'react-router-dom';
import { Activity, AlertTriangle, BrainCircuit, Bot, ChevronLeft, ChevronRight, ClipboardList, HeartPulse, LogOut, Map, Menu, MessageCircle, PlusCircle, Search, ShieldCheck, Upload, Bell, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const doctorNav = [
  { to: '/doctor/dashboard', label: 'Overview', icon: Activity },
  { to: '/doctor/reports', label: 'Case Manager', icon: ClipboardList },
  { to: '/doctor/map', label: 'Risk Map', icon: Map },
  { to: '/doctor/alerts', label: 'Alerts', icon: AlertTriangle },
  { to: '/doctor/ai-engine', label: 'AI Engine', icon: BrainCircuit },
  { to: '/healthbot', label: 'HealthBot', icon: Bot },
  { to: '/messages', label: 'Messages', icon: MessageCircle },
];

const patientNav = [
  { to: '/patient/dashboard', label: 'Dashboard', icon: Activity },
  { to: '/patient/submit', label: 'Symptom Logger', icon: PlusCircle },
  { to: '/patient/vitals', label: 'Vitals', icon: HeartPulse },
  { to: '/patient/uploads', label: 'Uploads', icon: Upload },
  { to: '/patient/nearby', label: 'Nearby Risk', icon: Map },
  { to: '/healthbot', label: 'HealthBot', icon: Bot },
  { to: '/messages', label: 'Messages', icon: MessageCircle },
];

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const nav = user?.role === 'doctor' ? doctorNav : patientNav;
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen md:flex">
      {/* Mobile overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 md:hidden"
            onClick={() => setMobileOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside className={`
        fixed md:sticky top-0 left-0 z-50 h-screen
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0
        ${collapsed ? 'md:w-[72px]' : 'md:w-64'} w-64
        bg-white/90 backdrop-blur-2xl border-r border-emerald-100/80
        transition-all duration-300 ease-in-out flex flex-col
      `}>
        {/* Logo */}
        <div className="p-4 border-b border-emerald-100/60 flex items-center justify-between">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="h-10 w-10 min-w-[40px] rounded-xl bg-gradient-to-br from-emerald-500 to-green-400 text-white grid place-items-center shadow-soft">
              <ShieldCheck size={20} />
            </div>
            {!collapsed && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="whitespace-nowrap">
                <h1 className="font-display font-bold text-slate-800 tracking-tight">Cura<span className="text-emerald-500">AI</span></h1>
                <p className="text-[11px] text-emerald-600/80 font-medium">Health Surveillance</p>
              </motion.div>
            )}
          </div>
          <button className="hidden md:flex items-center justify-center h-7 w-7 rounded-lg hover:bg-emerald-50 text-slate-400 transition-colors" onClick={() => setCollapsed((v) => !v)}>
            {collapsed ? <ChevronRight size={15} /> : <ChevronLeft size={15} />}
          </button>
          <button className="md:hidden text-slate-400" onClick={() => setMobileOpen(false)}>
            <X size={18} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-auto p-3 space-y-1">
          {nav.map((item) => {
            const Icon = item.icon;
            const active = location.pathname === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setMobileOpen(false)}
                className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 relative
                  ${active
                    ? 'bg-gradient-to-r from-emerald-50 to-green-50 text-emerald-700 shadow-soft'
                    : 'text-slate-600 hover:bg-emerald-50/60 hover:text-emerald-700'
                  }
                  ${collapsed ? 'justify-center' : ''}
                `}
              >
                {active && (
                  <motion.div
                    layoutId="activeNav"
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-emerald-500"
                    transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                  />
                )}
                <Icon size={18} className={`min-w-[18px] transition-colors ${active ? 'text-emerald-600' : 'text-slate-400 group-hover:text-emerald-500'}`} />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* User section at bottom */}
        <div className="p-3 border-t border-emerald-100/60">
          {collapsed ? (
            <div className="flex flex-col items-center gap-2 py-1">
              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-emerald-400 to-green-300 text-white grid place-items-center text-xs font-bold shadow-sm">
                {user?.name?.charAt(0)?.toUpperCase() || 'U'}
              </div>
              <button
                onClick={logout}
                className="h-8 w-8 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-500 grid place-items-center transition-colors"
                title="Logout"
              >
                <LogOut size={15} />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3 px-3 py-2">
              <div className="h-8 w-8 min-w-[32px] rounded-full bg-gradient-to-br from-emerald-400 to-green-300 text-white grid place-items-center text-xs font-bold shadow-sm">
                {user?.name?.charAt(0)?.toUpperCase() || 'U'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-700 truncate">{user?.name}</p>
                <p className="text-[11px] text-emerald-600 capitalize">{user?.role}</p>
              </div>
              <button
                onClick={logout}
                className="h-8 w-8 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-500 grid place-items-center transition-colors"
                title="Logout"
              >
                <LogOut size={15} />
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 min-h-screen md:p-6 p-4">
        {/* Top bar */}
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-emerald-100/50 shadow-card px-4 py-3 mb-6 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 flex-1">
            <button className="md:hidden h-9 w-9 rounded-xl bg-emerald-50 text-emerald-600 grid place-items-center" onClick={() => setMobileOpen(true)}>
              <Menu size={18} />
            </button>
            <div className="relative flex-1 max-w-md">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-400" />
              <input
                className="w-full bg-emerald-50/50 border border-emerald-100 rounded-xl pl-10 pr-4 py-2 text-sm outline-none placeholder-slate-400 transition-all focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100 focus:bg-white"
                placeholder="Search patients, regions, outbreaks..."
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="relative h-9 w-9 rounded-xl hover:bg-emerald-50 grid place-items-center text-slate-500 transition-colors">
              <Bell size={18} />
              <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-rose-500 ring-2 ring-white" />
            </button>
            <div className="hidden md:flex items-center gap-2 pl-2 border-l border-emerald-100">
              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-emerald-400 to-green-300 text-white grid place-items-center text-xs font-bold shadow-sm">
                {user?.name?.charAt(0)?.toUpperCase() || 'U'}
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-slate-700">{user?.name}</p>
                <p className="text-[11px] text-emerald-600 capitalize">{user?.role}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Page content */}
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
        >
          {children}
        </motion.div>
      </main>
    </div>
  );
}
