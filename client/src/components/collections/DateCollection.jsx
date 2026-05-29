import { useState } from 'react';
import { collectionsApi } from '../../api';
import toast from 'react-hot-toast';
import { Plus, Trash2, CalendarDays, Clock } from 'lucide-react';
import { format, parseISO, differenceInDays, isPast, isToday } from 'date-fns';

function CountdownBadge({ dateStr }) {
  const date = parseISO(dateStr);
  const days = differenceInDays(date, new Date());

  if (isToday(date)) return (
    <span className="badge text-xs" style={{ background: 'rgba(239,68,68,0.15)', color: '#f87171', border: '1px solid rgba(239,68,68,0.25)' }}>
      Today!
    </span>
  );
  if (isPast(date)) return (
    <span className="badge text-xs" style={{ background: 'rgba(100,116,139,0.12)', color: '#64748b', border: '1px solid rgba(100,116,139,0.2)' }}>
      Passed
    </span>
  );
  if (days === 1) return (
    <span className="badge text-xs" style={{ background: 'rgba(245,158,11,0.15)', color: '#fbbf24', border: '1px solid rgba(245,158,11,0.25)' }}>
      Tomorrow
    </span>
  );
  if (days <= 7) return (
    <span className="badge text-xs" style={{ background: 'rgba(245,158,11,0.1)', color: '#fbbf24', border: '1px solid rgba(245,158,11,0.2)' }}>
      {days} days
    </span>
  );
  if (days <= 30) return (
    <span className="badge text-xs" style={{ background: 'rgba(6,182,212,0.12)', color: '#22d3ee', border: '1px solid rgba(6,182,212,0.2)' }}>
      {days} days
    </span>
  );
  return (
    <span className="badge text-xs" style={{ background: 'rgba(100,116,139,0.1)', color: '#94a3b8', border: '1px solid rgba(100,116,139,0.15)' }}>
      {days} days
    </span>
  );
}

export default function DateCollection({ col, onUpdate }) {
  const [dates, setDates] = useState(col.data?.dates || []);
  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState({ title: '', event_date: '', description: '' });
  const [adding, setAdding] = useState(false);

  const sorted = [...dates].sort((a, b) => new Date(a.event_date) - new Date(b.event_date));
  const upcoming = sorted.filter(d => !isPast(parseISO(d.event_date)) || isToday(parseISO(d.event_date)));
  const past = sorted.filter(d => isPast(parseISO(d.event_date)) && !isToday(parseISO(d.event_date)));

  const handleAdd = async e => {
    e.preventDefault();
    if (!form.title.trim() || !form.event_date) return;
    setAdding(true);
    try {
      const res = await collectionsApi.addDate(col.id, form);
      setDates(d => [...d, res.data]);
      setForm({ title: '', event_date: '', description: '' });
      setAddOpen(false);
      toast.success('Date added');
    } catch {
      toast.error('Failed to add date');
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = async id => {
    try {
      await collectionsApi.deleteDate(col.id, id);
      setDates(d => d.filter(x => x.id !== id));
      toast.success('Removed');
    } catch {
      toast.error('Delete failed');
    }
  };

  return (
    <div>
      <div className="flex justify-end mb-6">
        <button onClick={() => setAddOpen(o => !o)} className="btn-primary gap-2">
          <Plus className="w-4 h-4" /> Add Date
        </button>
      </div>

      {addOpen && (
        <div className="glass rounded-2xl p-5 mb-6 animate-scale-in">
          <form onSubmit={handleAdd} className="space-y-3">
            <input className="input-field" placeholder="Event title *" value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required autoFocus />
            <input className="input-field" type="date" value={form.event_date}
              onChange={e => setForm(f => ({ ...f, event_date: e.target.value }))} required />
            <textarea className="textarea-field h-20" placeholder="Description (optional)"
              value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
            <div className="flex gap-2 justify-end">
              <button type="button" onClick={() => setAddOpen(false)} className="btn-ghost py-2 px-3 text-xs">Cancel</button>
              <button type="submit" disabled={adding} className="btn-primary py-2 px-4 text-xs">
                {adding ? <div className="w-3.5 h-3.5 border border-white/30 border-t-white rounded-full animate-spin" /> : 'Add'}
              </button>
            </div>
          </form>
        </div>
      )}

      {dates.length === 0 ? (
        <div className="text-center py-20 animate-fade-in">
          <div className="w-14 h-14 rounded-2xl mx-auto mb-3 flex items-center justify-center"
            style={{ background: 'rgba(6,182,212,0.1)', border: '1px solid rgba(6,182,212,0.2)' }}>
            <CalendarDays className="w-6 h-6 text-cyan-400" />
          </div>
          <p className="text-slate-400">No dates added yet</p>
        </div>
      ) : (
        <div className="space-y-6">
          {upcoming.length > 0 && (
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-3">Upcoming</p>
              <div className="space-y-2">
                {upcoming.map((d, i) => (
                  <DateCard key={d.id} date={d} onDelete={handleDelete}
                    style={{ animationDelay: `${i * 50}ms` }} />
                ))}
              </div>
            </div>
          )}

          {past.length > 0 && (
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-3">Past</p>
              <div className="space-y-2 opacity-50">
                {past.map(d => (
                  <DateCard key={d.id} date={d} onDelete={handleDelete} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function DateCard({ date, onDelete, style }) {
  return (
    <div className="glass glass-hover rounded-xl px-4 py-3.5 flex items-center gap-4 group animate-slide-up" style={style}>
      <div className="w-10 h-10 rounded-xl flex flex-col items-center justify-center shrink-0 text-center"
        style={{ background: 'rgba(6,182,212,0.12)', border: '1px solid rgba(6,182,212,0.2)' }}>
        <span className="text-xs font-bold text-cyan-300 leading-none">{format(parseISO(date.event_date), 'MMM').toUpperCase()}</span>
        <span className="text-lg font-display font-bold text-cyan-100 leading-tight">{format(parseISO(date.event_date), 'd')}</span>
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-medium text-slate-200 text-sm">{date.title}</span>
          <CountdownBadge dateStr={date.event_date} />
        </div>
        {date.description && <p className="text-xs text-slate-500 mt-0.5 truncate">{date.description}</p>}
        <p className="text-xs text-slate-600 mt-0.5 flex items-center gap-1">
          <Clock className="w-3 h-3" />
          {format(parseISO(date.event_date), 'EEEE, MMMM d yyyy')}
        </p>
      </div>

      <button onClick={() => onDelete(date.id)}
        className="opacity-0 group-hover:opacity-100 w-7 h-7 rounded-lg flex items-center justify-center text-slate-600 hover:text-red-400 hover:bg-red-500/12 transition-all">
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
