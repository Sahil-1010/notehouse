import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { roomsApi } from '../api';
import { useRoom } from '../context/RoomContext';
import toast from 'react-hot-toast';
import { Hash, Plus, ArrowRight, Lock, Eye, EyeOff, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

function JoinForm({ onJoined }) {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);

  const handle = async e => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await roomsApi.join(code.trim());
      onJoined(res.data);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Room not found');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handle} className="space-y-4">
      <div className="relative">
        <Hash className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
        <input
          className="input-field pl-10"
          placeholder="Enter room code…"
          value={code}
          onChange={e => setCode(e.target.value)}
          required
          autoFocus
        />
      </div>
      <button type="submit" disabled={loading} className="btn-primary w-full">
        {loading
          ? <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
          : <><span>Enter Room</span><ArrowRight className="w-4 h-4" /></>}
      </button>
    </form>
  );
}

function CreateForm({ onCreated, onCancel }) {
  const [form, setForm] = useState({ name: '', code: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const handle = async e => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await roomsApi.create(form);
      toast.success(`"${res.data.name}" created!`);
      onCreated(res.data);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create room');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handle} className="space-y-4">
      <div className="space-y-2">
        <label className="text-xs font-medium text-slate-500 uppercase tracking-wider block">Room Name</label>
        <input className="input-field" placeholder="e.g. Sahil's Room"
          value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required autoFocus />
      </div>
      <div className="space-y-2">
        <label className="text-xs font-medium text-slate-500 uppercase tracking-wider block">Room Code</label>
        <div className="relative">
          <Hash className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
          <input className="input-field pl-10" placeholder="unique_code_123"
            value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value.replace(/\s/g, '') }))} required />
        </div>
        <p className="text-xs text-slate-600">Others use this to find the room. Letters, numbers, underscores only.</p>
      </div>
      <div className="space-y-2">
        <label className="text-xs font-medium text-slate-500 uppercase tracking-wider block">Room Password</label>
        <div className="relative">
          <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
          <input className="input-field pl-10 pr-11" type={showPass ? 'text' : 'password'}
            placeholder="For deleting & editing"
            value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} required />
          <button type="button" onClick={() => setShowPass(v => !v)} tabIndex={-1}
            className="absolute right-3 top-1/2 -translate-y-1/2 w-7 h-7 flex items-center justify-center rounded-lg text-slate-500 hover:text-slate-300 transition-all">
            {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        <p className="text-xs text-slate-600">Required for destructive actions. Share only with trusted members.</p>
      </div>
      <div className="flex gap-3 pt-1">
        <button type="button" onClick={onCancel} className="btn-ghost flex-1">Cancel</button>
        <button type="submit" disabled={loading} className="btn-primary flex-1">
          {loading
            ? <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
            : 'Create Room'}
        </button>
      </div>
    </form>
  );
}

export default function RoomsPage() {
  const { joinRoom } = useRoom();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState('join'); // 'join' | 'create'

  const handleEnter = room => {
    joinRoom(room);
    navigate('/');
  };

  return (
    <div className="min-h-screen mesh-bg flex items-center justify-center p-4">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full blur-3xl animate-pulse-slow"
          style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.1) 0%, transparent 70%)' }} />
        <div className="absolute bottom-1/3 right-1/4 w-80 h-80 rounded-full blur-3xl animate-pulse-slow"
          style={{ background: 'radial-gradient(circle, rgba(6,182,212,0.07) 0%, transparent 70%)', animationDelay: '1.5s' }} />
      </div>

      <div className="w-full max-w-md relative z-10 animate-slide-up">
        {/* Header */}
        <div className="text-center mb-8">
          <img src="/logo.png" alt="Sticky Notes" className="w-20 h-20 rounded-2xl mb-1 animate-float object-cover mx-auto block" />
          <h1 className="font-display text-4xl font-bold text-gradient tracking-tight">Sticky Notes</h1>
          <p className="text-slate-500 mt-1.5 text-sm">
            Hi <span className="text-slate-400 font-medium">{user?.username}</span> — enter or create a room to continue
          </p>
        </div>

        <div className="glass rounded-2xl p-8 glow-violet">
          {/* Tab toggle */}
          <div className="flex gap-1 p-1 rounded-xl mb-7"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
            {[{ key: 'join', label: 'Enter Room' }, { key: 'create', label: 'Create Room' }].map(t => (
              <button key={t.key} onClick={() => setMode(t.key)}
                className="flex-1 py-2 rounded-lg text-sm font-medium transition-all duration-200"
                style={mode === t.key
                  ? { background: 'rgba(139,92,246,0.2)', color: '#c4b5fd', border: '1px solid rgba(139,92,246,0.3)' }
                  : { color: '#64748b' }}>
                {t.key === 'join' ? <Hash className="w-3.5 h-3.5 inline mr-1.5" /> : <Plus className="w-3.5 h-3.5 inline mr-1.5" />}
                {t.label}
              </button>
            ))}
          </div>

          {mode === 'join'
            ? <JoinForm onJoined={handleEnter} />
            : <CreateForm onCreated={handleEnter} onCancel={() => setMode('join')} />}
        </div>

        {/* Logout link */}
        <button onClick={() => { logout(); navigate('/login'); }}
          className="mt-4 w-full text-center text-xs text-slate-600 hover:text-slate-400 transition-colors py-2">
          Sign out
        </button>
      </div>
    </div>
  );
}
