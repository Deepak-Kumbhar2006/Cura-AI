import { Link, useLocation } from 'react-router-dom';
import {
  Activity,
  Bell,
  Brain,
  Database,
  Gauge,
  MapPin,
  Shield,
  Settings,
  Workflow,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: Activity },
  { to: '/data-sources', label: 'Data Sources', icon: Database },
  { to: '/real-time-monitoring', label: 'Real-Time Monitoring', icon: MapPin },
  { to: '/outbreak-prediction', label: 'Outbreak Prediction', icon: Brain },
  { to: '/alerts', label: 'Alerts', icon: Bell },
  { to: '/decision-support', label: 'Decision Support', icon: Workflow },
  { to: '/system-architecture', label: 'System Architecture', icon: Gauge },
  { to: '/settings-privacy', label: 'Settings & Privacy', icon: Settings },
];

export default function Layout({ children }) {
  const location = useLocation();
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="h-14 bg-[#1d1f24] text-white px-4 flex items-center justify-between border-b border-slate-700">
        <p className="text-sm font-semibold tracking-wide">AI Health Surveillance System</p>
        <button className="bg-indigo-600 px-4 py-1.5 rounded-lg text-sm">Share</button>
      </header>
      <div className="md:flex">
        <aside className="w-full md:w-72 bg-white border-r border-slate-200">
          <div className="p-6 border-b border-slate-200">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 grid place-items-center text-white">
                <Shield size={24} />
              </div>
              <div>
                <h1 className="text-3xl font-bold">Cura AI</h1>
                <p className="text-slate-500 text-sm">Disease Surveillance</p>
              </div>
            </div>
          </div>
          <nav className="p-4 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = location.pathname === item.to;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition ${active ? 'bg-indigo-50 text-indigo-700 font-semibold' : 'text-slate-700 hover:bg-slate-50'}`}
                >
                  <Icon size={19} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
          <div className="m-4 p-4 rounded-2xl bg-emerald-50 border border-emerald-100">
            <p className="text-sm font-semibold text-emerald-700">System Status</p>
            <p className="text-sm text-emerald-600 mt-1">All systems operational</p>
          </div>
        </aside>
        <main className="flex-1 p-4 md:p-7">
          <div className="mb-5 card px-5 py-4 flex flex-wrap gap-3 items-center justify-between">
            <input className="w-full md:max-w-xl rounded-xl border border-slate-200 px-4 py-2.5" placeholder="Search diseases, regions, alerts..." />
            <div className="flex items-center gap-3 text-sm">
              <span className="rounded-full bg-rose-500 text-white h-6 w-6 grid place-items-center">3</span>
              <div className="text-right">
                <p className="font-semibold">{user?.name || 'System User'}</p>
                <p className="text-slate-500">{user?.role || 'Health Officer'}</p>
              </div>
              <button onClick={logout} className="px-3 py-2 rounded-lg border border-slate-200 hover:bg-slate-50">Logout</button>
            </div>
          </div>
          {children}
        </main>
      </div>
    </div>
  );
}
