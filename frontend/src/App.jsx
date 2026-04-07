import { Routes, Route, Link, useNavigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Chat from "./pages/Chat";
import Dashboard from "./pages/Dashboard";
import HealthInsights from "./pages/HealthInsights";
import Hospitals from "./pages/Hospitals";
import AISuite from "./pages/AISuite";

const NAV_LINKS = [
  { to: "/chat", label: "Chat", icon: "💬" },
  { to: "/dashboard", label: "Dashboard", icon: "🧑", authOnly: true },
  { to: "/hospitals", label: "Nearby Hospitals", icon: "🏥", authOnly: true },
  { to: "/health", label: "Health Insights", icon: "🧠", authOnly: true },
  { to: "/ai-suite", label: "AI Suite", icon: "✨", authOnly: true },
];

function NavLink({ to, icon, label, active }) {
  return (
    <Link
      to={to}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 6,
        padding: "6px 14px",
        borderRadius: 10,
        fontSize: 14,
        fontWeight: active ? 600 : 400,
        color: active ? "#0ea5e9" : "#64748b",
        background: active ? "#e0f2fe" : "transparent",
        textDecoration: "none",
        transition: "all 0.15s ease",
        fontFamily: "'DM Sans', sans-serif",
        whiteSpace: "nowrap",
      }}
      onMouseEnter={e => {
        if (!active) {
          e.currentTarget.style.color = "#0f172a";
          e.currentTarget.style.background = "#f1f5f9";
        }
      }}
      onMouseLeave={e => {
        if (!active) {
          e.currentTarget.style.color = "#64748b";
          e.currentTarget.style.background = "transparent";
        }
      }}
    >
      <span style={{ fontSize: 15 }}>{icon}</span>
      {label}
    </Link>
  );
}

function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const token = localStorage.getItem("token");
  const user = (() => { try { return JSON.parse(localStorage.getItem("user")); } catch { return null; } })();

  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    const timer = setTimeout(() => setMenuOpen(false), 0);
    return () => clearTimeout(timer);
  }, [location.pathname]);

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  const initials = user?.name
    ? user.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)
    : "?";

  const visibleLinks = NAV_LINKS.filter(l => !l.authOnly || token);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=DM+Serif+Display&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        body {
          font-family: 'DM Sans', sans-serif;
          background: #f8fafc;
          color: #1e293b;
          min-height: 100vh;
        }

        #hb-nav {
          position: sticky;
          top: 0;
          z-index: 200;
          height: 64px;
          display: flex;
          align-items: center;
          padding: 0 24px;
          gap: 8px;
          background: rgba(255, 255, 255, 0.92);
          backdrop-filter: blur(14px);
          -webkit-backdrop-filter: blur(14px);
          border-bottom: 1px solid transparent;
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        #hb-nav.scrolled {
          border-color: #e2e8f0;
          box-shadow: 0 1px 12px rgba(14, 165, 233, 0.06);
        }

        .hb-brand {
          display: flex;
          align-items: center;
          gap: 10px;
          text-decoration: none;
          flex-shrink: 0;
        }
        .hb-logo {
          width: 36px; height: 36px; border-radius: 11px;
          background: linear-gradient(135deg, #0ea5e9 0%, #06b6d4 100%);
          display: flex; align-items: center; justify-content: center;
          font-size: 18px;
          box-shadow: 0 2px 8px rgba(14, 165, 233, 0.3);
        }
        .hb-brand-text {
          display: flex; flex-direction: column; line-height: 1.1;
        }
        .hb-brand-name {
          font-family: 'DM Serif Display', serif;
          font-size: 17px; color: #0f172a; letter-spacing: -0.2px;
        }
        .hb-brand-sub {
          font-size: 10px; color: #94a3b8;
          letter-spacing: 0.06em; text-transform: uppercase; font-weight: 500;
        }

        .hb-divider {
          width: 1px; height: 28px; background: #e2e8f0; flex-shrink: 0; margin: 0 8px;
        }

        .hb-links {
          display: flex; align-items: center; gap: 2px; flex: 1;
        }

        .hb-spacer { flex: 1; }

        .hb-right {
          display: flex; align-items: center; gap: 10px; flex-shrink: 0;
        }

        .hb-avatar {
          width: 34px; height: 34px; border-radius: 50%;
          background: linear-gradient(135deg, #0ea5e9, #06b6d4);
          display: flex; align-items: center; justify-content: center;
          color: #fff; font-weight: 600; font-size: 13px;
          font-family: 'DM Sans', sans-serif;
          border: 2px solid #e0f2fe;
          flex-shrink: 0;
        }

        .hb-logout {
          padding: 7px 16px; border-radius: 10px;
          border: 1.5px solid #e2e8f0;
          background: transparent; color: #64748b;
          font-size: 13px; font-weight: 500; cursor: pointer;
          font-family: 'DM Sans', sans-serif;
          transition: all 0.15s;
        }
        .hb-logout:hover {
          border-color: #fca5a5; color: #dc2626; background: #fef2f2;
        }

        .hb-login {
          padding: 7px 18px; border-radius: 10px;
          border: none;
          background: linear-gradient(135deg, #0ea5e9, #06b6d4);
          color: #fff; font-size: 13px; font-weight: 600; cursor: pointer;
          font-family: 'DM Sans', sans-serif;
          text-decoration: none;
          display: inline-flex; align-items: center;
          box-shadow: 0 2px 8px rgba(14,165,233,0.25);
          transition: opacity 0.15s, transform 0.15s;
        }
        .hb-login:hover { opacity: 0.9; transform: translateY(-1px); }

        .hb-pulse {
          width: 8px; height: 8px; border-radius: 50%;
          background: #22c55e;
          box-shadow: 0 0 0 2px #dcfce7;
          animation: pulse 2s infinite;
        }
        @keyframes pulse {
          0%, 100% { box-shadow: 0 0 0 2px #dcfce7; }
          50% { box-shadow: 0 0 0 5px #bbf7d080; }
        }

        /* Mobile hamburger */
        .hb-hamburger {
          display: none;
          background: none; border: none; cursor: pointer;
          padding: 6px; border-radius: 8px;
          color: #64748b;
        }
        .hb-hamburger:hover { background: #f1f5f9; }

        .hb-mobile-menu {
          display: none;
          position: fixed;
          top: 64px; left: 0; right: 0;
          background: rgba(255,255,255,0.97);
          backdrop-filter: blur(12px);
          border-bottom: 1px solid #e2e8f0;
          padding: 12px 16px 16px;
          flex-direction: column;
          gap: 4px;
          z-index: 199;
          box-shadow: 0 8px 24px rgba(0,0,0,0.06);
        }
        .hb-mobile-menu.open { display: flex; }

        #hb-main { min-height: calc(100vh - 64px); }

        @media (max-width: 720px) {
          .hb-links, .hb-divider { display: none !important; }
          .hb-hamburger { display: flex !important; align-items: center; }
        }
      `}</style>

      <nav id="hb-nav" className={scrolled ? "scrolled" : ""}>
        {/* Brand */}
        <Link to="/" className="hb-brand">
          <div className="hb-logo">🩺</div>
          <div className="hb-brand-text">
            <span className="hb-brand-name">HealthBot</span>
            <span className="hb-brand-sub">AI Disease Awareness</span>
          </div>
        </Link>

        <div className="hb-divider" />

        {/* Desktop nav links */}
        <div className="hb-links">
          {visibleLinks.map(l => (
            <NavLink
              key={l.to}
              to={l.to}
              icon={l.icon}
              label={l.label}
              active={location.pathname === l.to}
            />
          ))}
        </div>

        <div className="hb-spacer" />

        {/* Right section */}
        <div className="hb-right">
          {token && (
            <>
              <div className="hb-pulse" title="Connected" />
              <div className="hb-avatar" title={user?.name || "Profile"}>
                {initials}
              </div>
            </>
          )}

          {token ? (
            <button className="hb-logout" onClick={logout}>
              Sign out
            </button>
          ) : (
            <Link className="hb-login" to="/login">
              Sign in →
            </Link>
          )}
        </div>

        {/* Mobile hamburger */}
        <button
          className="hb-hamburger"
          onClick={() => setMenuOpen(o => !o)}
          aria-label="Toggle menu"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            {menuOpen
              ? <><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></>
              : <><line x1="3" y1="7" x2="21" y2="7" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="17" x2="21" y2="17" /></>
            }
          </svg>
        </button>
      </nav>

      {/* Mobile dropdown menu */}
      <div className={`hb-mobile-menu ${menuOpen ? "open" : ""}`}>
        {visibleLinks.map(l => (
          <NavLink
            key={l.to}
            to={l.to}
            icon={l.icon}
            label={l.label}
            active={location.pathname === l.to}
          />
        ))}
        <div style={{ height: 1, background: "#f1f5f9", margin: "8px 0" }} />
        {token ? (
          <button
            onClick={logout}
            style={{
              padding: "9px 14px", borderRadius: 10, border: "1.5px solid #fca5a5",
              background: "#fef2f2", color: "#dc2626",
              fontSize: 14, fontWeight: 500, cursor: "pointer",
              fontFamily: "'DM Sans', sans-serif", textAlign: "left"
            }}
          >
            Sign out
          </button>
        ) : (
          <Link
            to="/login"
            style={{
              padding: "9px 14px", borderRadius: 10, border: "none",
              background: "linear-gradient(135deg, #0ea5e9, #06b6d4)",
              color: "#fff", fontSize: 14, fontWeight: 600,
              textDecoration: "none", display: "block",
              fontFamily: "'DM Sans', sans-serif"
            }}
          >
            Sign in →
          </Link>
        )}
      </div>

      <main id="hb-main">
        <Routes>
          <Route path="/" element={<Chat />} />
          <Route path="/chat" element={<Chat />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/health" element={<HealthInsights />} />
          <Route path="/hospitals" element={<Hospitals />} />
          <Route path="/ai-suite" element={<AISuite />} />
        </Routes>
      </main>
    </>
  );
}

export default App;
