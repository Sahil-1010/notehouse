import { useNavigate } from 'react-router-dom';
import { Pin, Hash, FileText, CalendarDays, BarChart2 } from 'lucide-react';
import { format, parseISO, differenceInDays } from 'date-fns';

const TYPE_CONFIG = {
  count: { icon: Hash, label: 'Count', badge: 'badge-count', color: '#8b5cf6', glow: 'rgba(139,92,246,0.12)' },
  note: { icon: FileText, label: 'Note', badge: 'badge-note', color: '#f59e0b', glow: 'rgba(245,158,11,0.1)' },
  date: { icon: CalendarDays, label: 'Date', badge: 'badge-date', color: '#06b6d4', glow: 'rgba(6,182,212,0.1)' },
  poll: { icon: BarChart2, label: 'Poll', badge: 'badge-poll', color: '#10b981', glow: 'rgba(16,185,129,0.1)' },
};

function Preview({ type, preview }) {
  if (type === 'count') {
    return (
      <div className="mt-4 flex items-end gap-1">
        <span className="font-display text-5xl font-extrabold leading-none tracking-tight text-white">{preview.value}</span>
        <span className="text-slate-500 text-sm mb-1">total</span>
      </div>
    );
  }
  if (type === 'note') {
    return (
      <p className="mt-4 text-slate-400 text-sm">
        {preview.count === 0 ? 'No notes yet' : `${preview.count} note${preview.count !== 1 ? 's' : ''}`}
      </p>
    );
  }
  if (type === 'date') {
    if (!preview.nextEvent) return <p className="mt-4 text-slate-500 text-sm">No upcoming events</p>;
    const days = differenceInDays(parseISO(preview.nextEvent.event_date), new Date());
    return (
      <div className="mt-4 space-y-1">
        <p className="text-slate-200 text-sm font-medium truncate">{preview.nextEvent.title}</p>
        <p className="text-xs" style={{ color: days <= 1 ? '#f87171' : days <= 7 ? '#fbbf24' : '#22d3ee' }}>
          {days === 0 ? 'Today!' : days === 1 ? 'Tomorrow' : `In ${days} days`}
        </p>
      </div>
    );
  }
  if (type === 'poll') {
    return (
      <p className="mt-4 text-slate-400 text-sm">
        {preview.pollCount === 0 ? 'No polls yet' : `${preview.pollCount} poll${preview.pollCount !== 1 ? 's' : ''}`}
      </p>
    );
  }
  return null;
}

export default function CollectionCard({ col, onPin }) {
  const navigate = useNavigate();
  const cfg = TYPE_CONFIG[col.type] || TYPE_CONFIG.count;
  const Icon = cfg.icon;

  return (
    <div onClick={() => navigate(`/collection/${col.id}`)}
      className="glass glass-hover rounded-2xl p-5 cursor-pointer relative group transition-all duration-300 hover:-translate-y-0.5"
      style={{ '--hover-glow': cfg.glow }}>

      {/* Pin indicator */}
      {col.pinned === 1 && (
        <div className="absolute top-3 right-3">
          <Pin className="w-3.5 h-3.5 fill-current" style={{ color: cfg.color }} />
        </div>
      )}

      {/* Type badge + pin button */}
      <div className="flex items-center justify-between">
        <span className={`badge ${cfg.badge}`}>
          <Icon className="w-3 h-3" />
          {cfg.label}
        </span>

        <button
          onClick={e => { e.stopPropagation(); onPin(col.id, col.pinned === 0); }}
          className="opacity-0 group-hover:opacity-100 transition-opacity w-7 h-7 rounded-lg flex items-center justify-center hover:bg-white/8"
          title={col.pinned ? 'Unpin' : 'Pin'}>
          <Pin className={`w-3.5 h-3.5 transition-colors ${col.pinned ? 'fill-current text-violet-400' : 'text-slate-500 hover:text-slate-300'}`} />
        </button>
      </div>

      {/* Name */}
      <h3 className="font-display font-semibold text-white mt-3 leading-tight pr-4" style={{ fontSize: '15px' }}>
        {col.name}
      </h3>

      {/* Preview */}
      <Preview type={col.type} preview={col.preview || {}} />

      {/* Bottom accent line */}
      <div className="absolute bottom-0 left-4 right-4 h-px rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{ background: `linear-gradient(90deg, transparent, ${cfg.color}60, transparent)` }} />
    </div>
  );
}
