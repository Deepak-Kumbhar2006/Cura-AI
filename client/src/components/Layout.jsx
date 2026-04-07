import { Link, useLocation } from 'react-router-dom';
import { Activity, AlertTriangle, ClipboardList, Map, MessageCircle, PlusCircle, ShieldCheck, BrainCircuit, Upload, HeartPulse } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const doctorNav = [
  { to: '/doctor/dashboard', label: 'Patient Overview', icon: Activity },
  { to: '/doctor/reports', label: 'Case Files', icon: ClipboardList },
  { to: '/doctor/map', label: 'Regional Insights', icon: Map },
  { to: '/doctor/alerts', label: 'System Alerts', icon: AlertTriangle },
  { to: '/doctor/ai-engine', label: 'AI & Prediction', icon: BrainCircuit },
];

const patientNav = [
  { to: '/patient/dashboard', label: 'Dashboard', icon: Activity },
  { to: '/patient/submit', label: 'Symptom Log', icon: PlusCircle },
  { to: '/patient/vitals', label: 'Vital Signs', icon: HeartPulse },
  { to: '/patient/uploads', label: 'Medical Uploads', icon: Upload },
  { to: '/patient/nearby', label: 'Disease Alerts', icon: Map },
];

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const nav = user?.role === 'doctor' ? doctorNav : patientNav;

  return (
    <div className="min-h-screen bg-emerald-50 md:flex">
      <aside className="w-full md:w-72 bg-white border-r border-emerald-100">
        <div className="p-5 border-b border-emerald-100">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-emerald-600 to-green-500 text-white grid place-items-center"><ShieldCheck /></div>
            <div>
              <h1 className="text-2xl font-bold">Cura</h1>
              <p className="text-sm text-emerald-700">AI Disease Surveillance</p>
            </div>
          </div>
        </div>
        <nav className="p-3 space-y-1">
          {nav.map((item) => {
            const Icon = item.icon;
            const active = location.pathname === item.to;
            return (
              <Link key={item.to} to={item.to} className={`flex items-center gap-3 px-3 py-2 rounded-xl transition ${active ? 'bg-emerald-100 text-emerald-700 font-semibold' : 'hover:bg-emerald-50 text-slate-700'}`}>
                <Icon size={18} /> {item.label}
              </Link>
            );
          })}
          <Link to="/chat" className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-emerald-50"><MessageCircle size={18} /> Chatbot</Link>
        </nav>
      </aside>

      <main className="flex-1 p-4 md:p-6 space-y-4">
        <div className="card px-4 py-3 flex flex-wrap items-center justify-between gap-3">
          <input className="w-full md:max-w-xl rounded-xl border border-emerald-100 px-3 py-2" placeholder="Search patient, region, case status..." />
          <div className="flex gap-2 items-center text-sm">
            <div className="text-right">
              <p className="font-semibold">{user?.name}</p>
              <p className="text-emerald-700 capitalize">{user?.role}</p>
            </div>
            <button className="px-3 py-2 rounded-lg border border-emerald-200 hover:bg-emerald-50" onClick={logout}>Logout</button>
          </div>
        </div>
        {children}
      </main>
    </div>
  );
}
