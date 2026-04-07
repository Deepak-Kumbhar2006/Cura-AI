import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const links = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/data-input', label: 'Data Input' },
  { to: '/map', label: 'Map' },
  { to: '/reports', label: 'Reports' },
  { to: '/assistant', label: 'AI Assistant' },
];

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const location = useLocation();

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 md:flex">
      <aside className="w-full md:w-64 bg-slate-900 text-white p-4">
        <h1 className="text-2xl font-bold mb-6">Cura AI</h1>
        <p className="text-xs text-slate-300 mb-6">Smart Health Surveillance</p>
        <nav className="space-y-2">
          {links.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={`block px-3 py-2 rounded ${location.pathname === link.to ? 'bg-cyan-500' : 'hover:bg-slate-700'}`}
            >
              {link.label}
            </Link>
          ))}
        </nav>
        {user && (
          <div className="mt-8 text-sm">
            <p>{user.name}</p>
            <p className="text-slate-300">{user.role}</p>
            <button onClick={logout} className="mt-3 bg-rose-500 px-3 py-1 rounded">Logout</button>
          </div>
        )}
      </aside>
      <main className="flex-1 p-4 md:p-8">{children}</main>
    </div>
  );
}
