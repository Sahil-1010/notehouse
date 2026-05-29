import { useState, useEffect, useMemo } from 'react';
import { logsApi } from '../api';
import { useRoom } from '../context/RoomContext';
import toast from 'react-hot-toast';
import { Activity, Clock, Database, ChevronDown, ChevronUp, Trash2, Lock, X } from 'lucide-react';
import { format, parseISO } from 'date-fns';

function groupByUser(logs) {
  const map = new Map();
  for (const log of logs) {
    if (!map.has(log.username)) map.set(log.username, []);
    map.get(log.username).push(log);
  }
  // Sort groups: user with the most recent action first
  return [...map.entries()]
    .sort((a, b) => new Date(b[1][0].created_at) - new Date(a[1][0].created_at))
    .map(([username, entries]) => ({ username, entries }));
}

function UserGroup({ username, entries, defaultOpen }) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="glass rounded-2xl overflow-hidden animate-slide-up">
      {/* Group header */}
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-white/4 transition-colors"
      >
        <div className="w-8 h-8 rounded-lg shrink-0 flex items-center justify-center text-xs font-bold"
          style={{ background: 'linear-gradient(135deg,rgba(139,92,246,0.3),rgba(79,70,229,0.25))', border: '1px solid rgba(139,92,246,0.25)', color: '#c4b5fd' }}>
          {username[0]?.toUpperCase()}
        </div>

        <div className="flex-1 text-left">
          <span className="font-display font-semibold text-sm text-violet-300">{username}</span>
          <span className="text-slate-600 text-xs ml-2">{entries.length} action{entries.length !== 1 ? 's' : ''}</span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs text-slate-600 hidden sm:block">
            {format(parseISO(entries[0].created_at), 'MMM d, HH:mm')}
          </span>
          {open
            ? <ChevronUp className="w-4 h-4 text-slate-500" />
            : <ChevronDown className="w-4 h-4 text-slate-500" />}
        </div>
      </button>

      {/* Log entries */}
      {open && (
        <div className="border-t border-white/5">
          {entries.map((log, i) => (
            <div key={log.id}
              className="flex items-start gap-3 px-4 py-3 hover:bg-white/3 transition-colors"
              style={{ borderBottom: i < entries.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>

              {/* Timeline dot */}
              <div className="flex flex-col items-center pt-1 shrink-0">
                <div className="w-1.5 h-1.5 rounded-full bg-violet-500/60" />
                {i < entries.length - 1 && (
                  <div className="w-px flex-1 mt-1.5" style={{ background: 'rgba(139,92,246,0.15)', minHeight: '16px' }} />
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0 pb-0.5">
                <p className="text-sm text-slate-300 leading-snug">{log.action}</p>
                {log.collection_name && (
                  <div className="flex items-center gap-1.5 mt-1">
                    <Database className="w-3 h-3 text-slate-600 shrink-0" />
                    <span className="text-xs text-slate-600 truncate">{log.collection_name}</span>
                  </div>
                )}
              </div>

              {/* Time */}
              <div className="shrink-0 flex items-center gap-1 text-xs text-slate-600 mt-0.5">
                <Clock className="w-3 h-3" />
                <span className="hidden sm:block">{format(parseISO(log.created_at), 'MMM d, HH:mm')}</span>
                <span className="sm:hidden">{format(parseISO(log.created_at), 'HH:mm')}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function CleanModal({ roomCode, onClose, onCleaned }) {
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const handle = async e => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await logsApi.clean(roomCode, password);
      toast.success(`Cleared ${res.data.deleted} old log${res.data.deleted !== 1 ? 's' : ''}`);
      onCleaned();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to clean logs');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)' }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="glass rounded-2xl p-6 w-full max-w-sm animate-slide-up"
        style={{ border: '1px solid rgba(239,68,68,0.2)', boxShadow: '0 0 40px rgba(239,68,68,0.08)' }}>
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.22)' }}>
              <Trash2 className="w-4 h-4 text-red-400" />
            </div>
            <h2 className="font-display font-semibold text-white">Clean Logs</h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-white/5 transition-all">
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-sm text-slate-400 mb-5 leading-relaxed">
          This will permanently delete all logs older than <span className="text-slate-200 font-medium">10 days</span>. Enter the room password to continue.
        </p>

        <form onSubmit={handle} className="space-y-4">
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
            <input
              className="input-field pl-10 pr-11"
              type={showPass ? 'text' : 'password'}
              placeholder="Room password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              autoFocus
            />
            <button type="button" onClick={() => setShowPass(v => !v)} tabIndex={-1}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-7 h-7 flex items-center justify-center rounded-lg text-slate-500 hover:text-slate-300 transition-all">
              {showPass
                ? <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                : <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>}
            </button>
          </div>

          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="btn-ghost flex-1">Cancel</button>
            <button type="submit" disabled={loading}
              className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 select-none"
              style={{ background: 'rgba(239,68,68,0.12)', color: '#f87171', border: '1px solid rgba(239,68,68,0.25)' }}>
              {loading
                ? <div className="w-4 h-4 rounded-full border-2 border-red-400/30 border-t-red-400 animate-spin" />
                : <><Trash2 className="w-4 h-4" /><span>Clean</span></>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function LogsPage() {
  const { room } = useRoom();
  const [logs, setLogs] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [cleanOpen, setCleanOpen] = useState(false);

  const fetchLogs = () => {
    if (!room) return;
    setLoading(true);
    logsApi.list(room.id, { limit: 200 })
      .then(res => { setLogs(res.data.logs); setTotal(res.data.total); })
      .catch(() => toast.error('Failed to load activity'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchLogs(); }, [room?.id]);

  const groups = useMemo(() => groupByUser(logs), [logs]);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {cleanOpen && <CleanModal roomCode={room?.code} onClose={() => setCleanOpen(false)} onCleaned={fetchLogs} />}

      <div className="mb-8">
        <div className="flex items-center justify-between gap-4 mb-1">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.25)' }}>
              <Activity className="w-4 h-4 text-violet-400" />
            </div>
            <h1 className="font-display text-2xl font-bold text-white">Activity Log</h1>
          </div>
          <button onClick={() => setCleanOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm text-red-400/70 hover:text-red-400 hover:bg-red-500/10 transition-all duration-200"
            style={{ border: '1px solid rgba(239,68,68,0.15)' }}>
            <Trash2 className="w-4 h-4" />
            <span className="hidden sm:block">Clean logs</span>
          </button>
        </div>
        <p className="text-slate-500 text-sm ml-12">
          {total} action{total !== 1 ? 's' : ''} across {groups.length} user{groups.length !== 1 ? 's' : ''}
        </p>
      </div>

      {loading && (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="glass rounded-2xl h-20 animate-pulse" style={{ animationDelay: `${i * 80}ms` }} />
          ))}
        </div>
      )}

      {!loading && logs.length === 0 && (
        <div className="text-center py-24 animate-fade-in">
          <Activity className="w-12 h-12 text-slate-700 mx-auto mb-3" />
          <p className="text-slate-500">No activity yet</p>
        </div>
      )}

      {!loading && groups.length > 0 && (
        <div className="space-y-3">
          {groups.map((g, i) => (
            <UserGroup
              key={g.username}
              username={g.username}
              entries={g.entries}
              defaultOpen={i === 0}
            />
          ))}
        </div>
      )}
    </div>
  );
}
