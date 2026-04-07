import { Link, useLocation } from 'react-router-dom';
import { Activity, AlertTriangle, BrainCircuit, ChevronLeft, ChevronRight, ClipboardList, HeartPulse, Map, Menu, MessageCircle, MessageSquare, PlusCircle, Search, ShieldCheck, Upload, Bell, Moon, Sun, LogOut, User, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const doctorNav = [
  { to: '/doctor/dashboard', label: 'Overview', icon: Activity },
  { to: '/doctor/reports', label: 'Case Manager', icon: ClipboardList },
  { to: '/doctor/map', label: 'Risk Map', icon: Map },
  { to: '/doctor/alerts', label: 'Alerts', icon: AlertTriangle },
  { to: '/doctor/ai-engine', label: 'AI Engine', icon: BrainCircuit },
  { to: '/doctor/chat', label: 'Patient Chat', icon: MessageSquare },
];

const patientNav = [
  { to: '/patient/dashboard', label: 'Dashboard', icon: Activity },
  { to: '/patient/submit', label: 'Symptom Logger', icon: PlusCircle },
  { to: '/patient/vitals', label: 'Vitals', icon: HeartPulse },
  { to: '/patient/uploads', label: 'Uploads', icon: Upload },
  { to: '/patient/nearby', label: 'Nearby Risk', icon: Map },
  { to: '/patient/chat', label: 'Doctor Chat', icon: MessageSquare },
];

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const nav = user?.role === 'doctor' ? doctorNav : patientNav;
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dark, setDark] = useState(() => localStorage.getItem('theme') === 'dark');
  const [notifOpen, setNotifOpen] = useState(false);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
    localStorage.setItem('theme', dark ? 'dark' : 'light');
  }, [dark]);

  const closeMobile = useCallback(() => setMobileOpen(false), []);

  const sidebarContent = (
    <>
      <div className="p-5 border-b border-primary-100/50 dark:border-slate-700/50 flex items-center justify-between">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="h-11 w-11 rounded-2xl bg-gradient-to-br from-primary-600 to-primary-400 text-white grid place-items-center shadow-glow flex-shrink-0">
            <ShieldCheck size={20} />
          </div>
          {!collapsed && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-w-0">
              <h1 className="font-display font-bold text-lg tracking-tight">Cura</h1>
              <p className="text-xs text-primary-600 dark:text-primary-400 font-medium">AI Surveillance</p>
            </motion.div>
          )}
        </div>
        <button className="hidden md:flex items-center justify-center h-8 w-8 rounded-xl hover:bg-primary-50 dark:hover:bg-slate-700 transition" onClick={() => setCollapsed((v) => !v)}>
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
        <button className="md:hidden" onClick={closeMobile}><X size={18} /></button>
      </div>

      <nav className="p-3 space-y-1 flex-1">
        {nav.map((item) => {
          const Icon = item.icon;
          const active = location.pathname === item.to;
          return (
            <Link key={item.to} to={item.to} onClick={closeMobile}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-2xl text-sm transition-all duration-200
                ${active
                  ? 'bg-primary-100 dark:bg-primary-900/40 text-primary-800 dark:text-primary-300 font-semibold shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-primary-50 dark:hover:bg-slate-700/50 hover:text-primary-700'}
                ${collapsed ? 'justify-center px-3' : ''}`}>
              <Icon size={18} className={active ? 'text-primary-600' : ''} />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
        <Link to="/chat" onClick={closeMobile}
          className={`flex items-center gap-3 px-4 py-2.5 rounded-2xl text-sm transition-all duration-200
            ${location.pathname === '/chat'
              ? 'bg-primary-100 dark:bg-primary-900/40 text-primary-800 dark:text-primary-300 font-semibold shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:bg-primary-50 dark:hover:bg-slate-700/50'}
            ${collapsed ? 'justify-center px-3' : ''}`}>
          <MessageCircle size={18} /> {!collapsed && 'Assistant'}
        </Link>
      </nav>

      <div className="p-3 border-t border-primary-100/50 dark:border-slate-700/50">
        <button onClick={() => setDark((d) => !d)}
          className={`flex items-center gap-3 px-4 py-2.5 rounded-2xl text-sm text-slate-600 dark:text-slate-400 hover:bg-primary-50 dark:hover:bg-slate-700/50 w-full transition-all ${collapsed ? 'justify-center px-3' : ''}`}>
          {dark ? <Sun size={18} /> : <Moon size={18} />}
          {!collapsed && (dark ? 'Light Mode' : 'Dark Mode')}
        </button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen md:flex bg-surface-50 dark:bg-slate-900">
      {/* Desktop Sidebar */}
      <aside className={`hidden md:flex flex-col ${collapsed ? 'w-20' : 'w-72'} bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl border-r border-primary-100/50 dark:border-slate-700/50 transition-all duration-300 sticky top-0 h-screen`}>
        {sidebarContent}
      </aside>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 md:hidden" onClick={closeMobile} />
            <motion.aside initial={{ x: -280 }} animate={{ x: 0 }} exit={{ x: -280 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed left-0 top-0 bottom-0 w-72 bg-white dark:bg-slate-800 z-50 md:hidden flex flex-col shadow-elevated">
              {sidebarContent}
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="flex-1 min-h-screen">
        {/* Top Bar */}
        <div className="sticky top-0 z-30 bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border-b border-primary-100/30 dark:border-slate-700/30">
          <div className="px-4 md:px-6 py-3 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 flex-1">
              <button className="md:hidden p-2 rounded-xl hover:bg-primary-50 dark:hover:bg-slate-700 transition" onClick={() => setMobileOpen(true)}>
                <Menu size={20} />
              </button>
              <div className="hidden sm:flex items-center gap-2 flex-1 max-w-md bg-surface-100 dark:bg-slate-700 rounded-2xl px-4 py-2.5">
                <Search size={16} className="text-slate-400 flex-shrink-0" />
                <input className="w-full bg-transparent outline-none text-sm placeholder-slate-400 dark:text-slate-200" placeholder="Search patients, regions, outbreaks..." />
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Notification Bell */}
              <div className="relative">
                <button onClick={() => setNotifOpen((o) => !o)}
                  className="relative p-2.5 rounded-2xl hover:bg-primary-50 dark:hover:bg-slate-700 transition">
                  <Bell size={18} className="text-slate-600 dark:text-slate-400" />
                  <span className="absolute top-1.5 right-1.5 h-4 w-4 text-[10px] bg-danger-500 text-white rounded-full grid place-items-center font-bold animate-pulse-soft">3</span>
                </button>
                <AnimatePresence>
                  {notifOpen && (
                    <motion.div initial={{ opacity: 0, y: 8, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 8, scale: 0.95 }}
                      className="absolute right-0 top-12 w-80 bg-white dark:bg-slate-800 rounded-2xl shadow-elevated border border-slate-100 dark:border-slate-700 p-4 z-50">
                      <h3 className="font-semibold text-sm mb-3">Notifications</h3>
                      {['Critical alert in Pune region', 'New patient submission', 'AI prediction updated'].map((n, i) => (
                        <div key={i} className="py-2.5 px-3 rounded-xl hover:bg-primary-50 dark:hover:bg-slate-700 cursor-pointer text-sm transition mb-1">
                          <p className="text-slate-700 dark:text-slate-300">{n}</p>
                          <p className="text-xs text-slate-400 mt-0.5">{i + 1}m ago</p>
                        </div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* User Info */}
              <div className="hidden md:flex items-center gap-3 pl-2 border-l border-slate-200 dark:border-slate-600 ml-1">
                <div className="h-9 w-9 rounded-2xl bg-gradient-to-br from-primary-400 to-primary-600 text-white grid place-items-center text-sm font-bold">
                  {user?.name?.[0]?.toUpperCase() || <User size={16} />}
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{user?.name}</p>
                  <p className="text-xs text-primary-600 dark:text-primary-400 capitalize font-medium">{user?.role}</p>
                </div>
              </div>

              <button onClick={logout}
                className="p-2.5 rounded-2xl hover:bg-danger-50 dark:hover:bg-slate-700 text-slate-500 hover:text-danger-600 transition" title="Logout">
                <LogOut size={18} />
              </button>
            </div>
          </div>
        </div>

        {/* Page Content */}
        <div className="p-4 md:p-6 space-y-4">
          {children}
        </div>
      </main>
    </div>
  );
}
