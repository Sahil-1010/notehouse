import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { Lock, User, ArrowRight, Home } from 'lucide-react';

export default function RegisterPage() {
  const [form, setForm] = useState({ username: '', password: '', confirm: '' });
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handle = async e => {
    e.preventDefault();
    if (form.password !== form.confirm) return toast.error('Passwords do not match');
    setLoading(true);
    try {
      await register(form.username, form.password);
      toast.success('Account created! Welcome 🎉');
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen mesh-bg flex items-center justify-center p-4">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/3 right-1/4 w-96 h-96 rounded-full blur-3xl animate-pulse-slow"
          style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.1) 0%, transparent 70%)' }} />
        <div className="absolute bottom-1/4 left-1/3 w-72 h-72 rounded-full blur-3xl animate-pulse-slow"
          style={{ background: 'radial-gradient(circle, rgba(245,158,11,0.07) 0%, transparent 70%)', animationDelay: '2s' }} />
      </div>

      <div className="w-full max-w-md relative z-10 animate-slide-up">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4 animate-float"
            style={{ background: 'linear-gradient(135deg,rgba(139,92,246,0.2),rgba(245,158,11,0.12))', border: '1px solid rgba(139,92,246,0.3)' }}>
            <Home className="w-7 h-7 text-violet-400" strokeWidth={1.5} />
          </div>
          <h1 className="font-display text-4xl font-bold text-gradient tracking-tight">NoteHouse</h1>
          <p className="text-slate-500 mt-1.5 text-sm">Create your account</p>
        </div>

        <div className="glass rounded-2xl p-8 glow-violet">
          <h2 className="font-display text-xl font-semibold text-white mb-6">Get started</h2>
          <form onSubmit={handle} className="space-y-4">
            <div>
              <label className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1.5 block">Username</label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
                <input className="input-field pl-10" placeholder="choose_username" value={form.username}
                  onChange={e => setForm(f => ({ ...f, username: e.target.value }))} required autoFocus minLength={3} />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1.5 block">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
                <input className="input-field pl-10" type="password" placeholder="min 6 characters" value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))} required minLength={6} />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1.5 block">Confirm Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
                <input className="input-field pl-10" type="password" placeholder="repeat password" value={form.confirm}
                  onChange={e => setForm(f => ({ ...f, confirm: e.target.value }))} required />
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full mt-2">
              {loading
                ? <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                : <><span>Create account</span><ArrowRight className="w-4 h-4" /></>}
            </button>
          </form>

          <p className="text-center text-slate-500 text-sm mt-6">
            Already have one?{' '}
            <Link to="/login" className="text-violet-400 hover:text-violet-300 transition-colors font-medium">
              Sign in →
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
