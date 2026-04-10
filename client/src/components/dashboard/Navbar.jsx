import { Bell, Moon, Search, Sun } from 'lucide-react';
import { NavLink } from 'react-router-dom';

const quickLinks = [
  { label: 'Dashboard', to: '/doctor/dashboard' },
  { label: 'Reports', to: '/doctor/reports' },
  { label: 'Alerts', to: '/doctor/alerts' },
  { label: 'Map', to: '/doctor/map' },
];

export default function Navbar({ theme, onToggleTheme }) {
  return (
    <header className="dashboard-glass rounded-3xl px-4 py-3 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
      <div className="w-full space-y-3">
        <nav className="flex flex-wrap items-center gap-2">
          {quickLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) => `px-3 py-1.5 rounded-full text-xs border transition ${
                isActive
                  ? 'bg-cyan-400/20 text-cyan-200 border-cyan-300/40'
                  : 'dashboard-chip'
              }`}
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="relative w-full max-w-xl">
        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 dashboard-muted" />
        <input
          className="w-full rounded-2xl bg-white/10 border border-white/15 pl-11 pr-4 py-2.5 text-sm dashboard-text placeholder:dashboard-muted outline-none focus:border-cyan-300/60 transition"
          placeholder="Search patients, regions, outbreaks..."
        />
      </div>
      </div>

      <div className="flex items-center gap-2">
        <button type="button" onClick={onToggleTheme} className="h-10 w-10 rounded-xl dashboard-chip grid place-items-center">
          {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
        </button>
        <button type="button" className="h-10 w-10 rounded-xl dashboard-chip grid place-items-center relative">
          <Bell size={16} />
          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-rose-500" />
        </button>
        <span className="px-3 py-1.5 rounded-full text-xs bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 animate-pulse">● Live</span>
        <img src="https://i.pravatar.cc/80?img=8" alt="avatar" className="h-10 w-10 rounded-xl object-cover border border-white/20" />
      </div>
    </header>
  );
}
