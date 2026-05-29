import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Home, Activity, LogOut, Menu, X } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Navbar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    toast.success('Logged out');
    navigate('/login');
  };

  const links = [
    { to: '/', label: 'Dashboard', icon: Home },
    { to: '/logs', label: 'Activity', icon: Activity },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 h-16"
      style={{ background: 'rgba(6,6,15,0.85)', backdropFilter: 'blur(24px)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
      <div className="max-w-6xl mx-auto h-full px-4 flex items-center justify-between gap-4">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 shrink-0 group">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200 group-hover:scale-105"
            style={{ background: 'linear-gradient(135deg, rgba(139,92,246,0.3), rgba(6,182,212,0.2))', border: '1px solid rgba(139,92,246,0.4)' }}>
            <Home className="w-4 h-4 text-violet-300" strokeWidth={1.5} />
          </div>
          <span className="font-display font-bold text-lg tracking-tight text-gradient hidden sm:block">NoteHouse</span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-1">
          {links.map(({ to, label, icon: Icon }) => (
            <Link key={to} to={to}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                location.pathname === to
                  ? 'bg-violet-500/15 text-violet-300 border border-violet-500/25'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
              }`}>
              <Icon className="w-4 h-4" />
              {label}
            </Link>
          ))}
        </div>

        {/* Right: user + logout */}
        <div className="flex items-center gap-3">
          {user && (
            <>
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                  style={{ background: 'linear-gradient(135deg,#7c3aed,#4f46e5)', color: '#fff' }}>
                  {user.username[0].toUpperCase()}
                </div>
                <span className="text-sm font-medium text-slate-300">{user.username}</span>
              </div>
              <button onClick={handleLogout}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all duration-200">
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:block">Logout</span>
              </button>
            </>
          )}

          {/* Mobile menu toggle */}
          <button className="md:hidden p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-all"
            onClick={() => setMenuOpen(o => !o)}>
            {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden absolute top-16 left-0 right-0 animate-fade-in"
          style={{ background: 'rgba(6,6,15,0.97)', backdropFilter: 'blur(24px)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="p-4 space-y-1">
            {links.map(({ to, label, icon: Icon }) => (
              <Link key={to} to={to} onClick={() => setMenuOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                  location.pathname === to
                    ? 'bg-violet-500/15 text-violet-300'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}>
                <Icon className="w-4 h-4" />
                {label}
              </Link>
            ))}
            <button onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-red-400 hover:bg-red-500/10 transition-all duration-200">
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}
