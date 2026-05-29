import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { Lock, User, ArrowRight, Home } from 'lucide-react';

export default function LoginPage() {
  const [form, setForm] = useState({ username: '', password: '' });
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handle = async e => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(form.username, form.password);
      toast.success('Welcome back!');
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen mesh-bg flex items-center justify-center p-4">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full blur-3xl animate-pulse-slow"
          style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.12) 0%, transparent 70%)' }} />
        <div className="absolute bottom-1/3 right-1/4 w-80 h-80 rounded-full blur-3xl animate-pulse-slow"
          style={{ background: 'radial-gradient(circle, rgba(6,182,212,0.08) 0%, transparent 70%)', animationDelay: '1.5s' }} />
      </div>

      <div className="w-full max-w-md relative z-10 animate-slide-up">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4 animate-float"
            style={{ background: 'linear-gradient(135deg,rgba(139,92,246,0.2),rgba(6,182,212,0.12))', border: '1px solid rgba(139,92,246,0.3)' }}>
            <Home className="w-7 h-7 text-violet-400" strokeWidth={1.5} />
          </div>
          <h1 className="font-display text-4xl font-bold text-gradient tracking-tight">NoteHouse</h1>
          <p className="text-slate-500 mt-1.5 text-sm">Your household tracker</p>
        </div>

        <div className="glass rounded-2xl p-8 glow-violet">
          <h2 className="font-display text-xl font-semibold text-white mb-6">Sign in</h2>
          <form onSubmit={handle} className="space-y-4">
            <div>
              <label className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1.5 block">Username</label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
                <input className="input-field pl-10" placeholder="your_username" value={form.username}
                  onChange={e => setForm(f => ({ ...f, username: e.target.value }))} required autoFocus />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1.5 block">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
                <input className="input-field pl-10" type="password" placeholder="••••••••" value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))} required />
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full mt-2">
              {loading
                ? <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                : <><span>Sign in</span><ArrowRight className="w-4 h-4" /></>}
            </button>
          </form>

          <p className="text-center text-slate-500 text-sm mt-6">
            No account?{' '}
            <Link to="/register" className="text-violet-400 hover:text-violet-300 transition-colors font-medium">
              Create one →
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
