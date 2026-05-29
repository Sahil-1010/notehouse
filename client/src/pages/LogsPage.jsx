import { useState, useEffect } from 'react';
import { logsApi } from '../api';
import toast from 'react-hot-toast';
import { Activity, User, Clock, Database } from 'lucide-react';
import { format, parseISO } from 'date-fns';

export default function LogsPage() {
  const [logs, setLogs] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    logsApi.list({ limit: 200 })
      .then(res => { setLogs(res.data.logs); setTotal(res.data.total); })
      .catch(() => toast.error('Failed to load activity'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.25)' }}>
            <Activity className="w-4 h-4 text-violet-400" />
          </div>
          <h1 className="font-display text-2xl font-bold text-white">Activity Log</h1>
        </div>
        <p className="text-slate-500 text-sm ml-12">{total} total actions recorded</p>
      </div>

      {loading && (
        <div className="space-y-2">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="glass rounded-xl h-16 animate-pulse" style={{ animationDelay: `${i * 60}ms` }} />
          ))}
        </div>
      )}

      {!loading && logs.length === 0 && (
        <div className="text-center py-24 animate-fade-in">
          <Activity className="w-12 h-12 text-slate-700 mx-auto mb-3" />
          <p className="text-slate-500">No activity yet</p>
        </div>
      )}

      {!loading && logs.length > 0 && (
        <div className="space-y-2">
          {logs.map((log, i) => (
            <div key={log.id} className="glass glass-hover rounded-xl px-4 py-3.5 flex items-start gap-4 animate-fade-in group"
              style={{ animationDelay: `${Math.min(i * 30, 300)}ms` }}>
              {/* Avatar */}
              <div className="w-8 h-8 rounded-lg shrink-0 flex items-center justify-center text-xs font-bold mt-0.5"
                style={{ background: 'linear-gradient(135deg,rgba(139,92,246,0.25),rgba(79,70,229,0.2))', border: '1px solid rgba(139,92,246,0.2)', color: '#a78bfa' }}>
                {log.username[0]?.toUpperCase() || '?'}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                  <span className="text-sm font-medium text-violet-300">{log.username}</span>
                  <span className="text-sm text-slate-300 leading-snug">{log.action}</span>
                </div>
                {log.collection_name && (
                  <div className="flex items-center gap-1.5 mt-1">
                    <Database className="w-3 h-3 text-slate-600 shrink-0" />
                    <span className="text-xs text-slate-500 truncate">{log.collection_name}</span>
                  </div>
                )}
              </div>

              {/* Time */}
              <div className="shrink-0 flex items-center gap-1 text-xs text-slate-600">
                <Clock className="w-3 h-3" />
                <span className="hidden sm:block">
                  {format(parseISO(log.created_at), 'MMM d, HH:mm')}
                </span>
                <span className="sm:hidden">
                  {format(parseISO(log.created_at), 'HH:mm')}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
