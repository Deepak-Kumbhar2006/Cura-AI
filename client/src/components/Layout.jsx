import { Link, useLocation } from 'react-router-dom';
import { Activity, AlertTriangle, BrainCircuit, ChevronLeft, ChevronRight, ClipboardList, HeartPulse, Map, Menu, MessageCircle, MessageSquare, PlusCircle, Search, ShieldCheck, Upload, Bell, LogOut, User, X, Cloud, Bug, Calendar, Pill, Database } from 'lucide-react';
import { Bot } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useState } from 'react';

const doctorNav = [
  { to: '/doctor/dashboard', label: 'Overview', icon: Activity },
  { to: '/doctor/reports', label: 'Case Manager', icon: ClipboardList },
  { to: '/doctor/map', label: 'Risk Map', icon: Map },
  { to: '/doctor/alerts', label: 'Alerts', icon: AlertTriangle },
  { to: '/doctor/ai-engine', label: 'AI Engine', icon: BrainCircuit },
  { to: '/healthbot', label: 'HealthBot', icon: Bot },
  { to: '/doctor/chat', label: 'Patient Chat', icon: MessageSquare },
  { to: '/doctor/weather', label: 'Weather', icon: Cloud },
  { to: '/doctor/diseases', label: 'Diseases', icon: Bug },
  { to: '/doctor/data-sources', label: 'Data Sources', icon: Database },
];

const patientNav = [
  { to: '/patient/dashboard', label: 'Dashboard', icon: Activity },
  { to: '/patient/submit', label: 'Symptom Logger', icon: PlusCircle },
  { to: '/patient/vitals', label: 'Vitals', icon: HeartPulse },
  { to: '/patient/uploads', label: 'Uploads', icon: Upload },
  { to: '/patient/nearby', label: 'Nearby Risk', icon: Map },
  { to: '/healthbot', label: 'HealthBot', icon: Bot },
  { to: '/patient/chat', label: 'Doctor Chat', icon: MessageSquare },
  { to: '/patient/appointments', label: 'Appointments', icon: Calendar },
  { to: '/patient/medications', label: 'Medications', icon: Pill },
  { to: '/patient/weather', label: 'Weather', icon: Cloud },
  { to: '/patient/diseases', label: 'Diseases', icon: Bug },
  { to: '/patient/data-sources', label: 'Data Sources', icon: Database },
];

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const nav = user?.role === 'doctor' ? doctorNav : patientNav;
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen md:flex">
      <aside className={`${mobileOpen ? 'block' : 'hidden'} md:block ${collapsed ? 'md:w-20' : 'md:w-72'} w-full bg-white/80 backdrop-blur-xl border-r border-emerald-100 transition-all duration-300`}>
        <div className="p-4 border-b border-emerald-100 flex items-center justify-between">
          <div className="flex items-center gap-2 overflow-hidden">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-600 to-green-500 text-white grid place-items-center"><ShieldCheck size={18} /></div>
            {!collapsed && <div><h1 className="font-bold">Cura</h1><p className="text-xs text-emerald-700">AI Surveillance</p></div>}
          </div>
          <button className="hidden md:block" onClick={() => setCollapsed((v) => !v)}>{collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}</button>
        </div>

        <nav className="p-3 space-y-1">
          {nav.map((item) => {
            const Icon = item.icon;
            const active = location.pathname === item.to;
            return (
              <Link key={item.to} to={item.to} className={`flex items-center gap-3 px-3 py-2 rounded-xl ${active ? 'bg-emerald-100 text-emerald-700 font-semibold' : 'hover:bg-emerald-50'} ${collapsed ? 'justify-center' : ''}`}>
                <Icon size={18} /> {!collapsed && item.label}
              </Link>
            );
          })}
          <Link to="/chat" className={`flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-emerald-50 ${collapsed ? 'justify-center' : ''}`}><MessageCircle size={18} /> {!collapsed && 'Assistant'}</Link>
        </nav>
      </aside>

      <main className="flex-1 p-4 md:p-6 space-y-4">
        <div className="card p-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 w-full">
            <button className="md:hidden" onClick={() => setMobileOpen((v) => !v)}><Menu size={18} /></button>
            <Search size={16} className="text-slate-400" />
            <input className="w-full bg-transparent outline-none" placeholder="Search patients, regions, outbreaks..." />
          </div>
          <div className="flex items-center gap-3 text-sm">
            <span className="relative"><Bell size={18} /><span className="absolute -top-1 -right-1 text-[10px] bg-rose-500 text-white rounded-full px-1">3</span></span>
            <div className="text-right hidden md:block"><p className="font-semibold">{user?.name}</p><p className="text-emerald-700 capitalize">{user?.role}</p></div>
            <button className="px-3 py-1.5 rounded-lg border border-emerald-200 hover:bg-emerald-50" onClick={logout}>Logout</button>
          </div>
        </div>
        {children}
      </main>
    </div>
  );
}
