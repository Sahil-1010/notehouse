import { useState, useEffect, useMemo } from 'react';
import { collectionsApi } from '../api';
import CollectionCard from '../components/layout/CollectionCard';
import Modal from '../components/ui/Modal';
import toast from 'react-hot-toast';
import { Plus, Search, Hash, FileText, CalendarDays, BarChart2, X } from 'lucide-react';

const TYPES = [
  { key: 'count', label: 'Count', icon: Hash, desc: 'Track increments and decrements', color: '#8b5cf6' },
  { key: 'note', label: 'Note', icon: FileText, desc: 'Sticky note cards', color: '#f59e0b' },
  { key: 'date', label: 'Date', icon: CalendarDays, desc: 'Important dates & countdowns', color: '#06b6d4' },
  { key: 'poll', label: 'Poll', icon: BarChart2, desc: 'Polls and voting', color: '#10b981' },
];

export default function DashboardPage() {
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({ name: '', type: 'count' });
  const [creating, setCreating] = useState(false);

  const fetchCollections = async () => {
    try {
      const res = await collectionsApi.list();
      setCollections(res.data);
    } catch {
      toast.error('Failed to load collections');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCollections(); }, []);

  const filtered = useMemo(() => {
    if (!search.trim()) return collections;
    const q = search.toLowerCase();
    return collections.filter(c => c.name.toLowerCase().includes(q));
  }, [collections, search]);

  const pinned = filtered.filter(c => c.pinned);
  const unpinned = filtered.filter(c => !c.pinned);

  const handleCreate = async e => {
    e.preventDefault();
    if (!form.name.trim()) return toast.error('Name required');
    setCreating(true);
    try {
      const res = await collectionsApi.create({ name: form.name.trim(), type: form.type });
      setCollections(prev => [...prev, { ...res.data, preview: getDefaultPreview(res.data.type) }]);
      setCreateOpen(false);
      setForm({ name: '', type: 'count' });
      toast.success(`"${res.data.name}" created`);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Create failed');
    } finally {
      setCreating(false);
    }
  };

  const handlePin = async (id, pinned) => {
    try {
      await collectionsApi.update(id, { pinned });
      setCollections(prev => prev.map(c => c.id === id ? { ...c, pinned: pinned ? 1 : 0 } : c));
      toast.success(pinned ? 'Pinned!' : 'Unpinned');
    } catch {
      toast.error('Failed to update');
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex-1">
          <h1 className="font-display text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-slate-500 text-sm mt-0.5">{collections.length} collection{collections.length !== 1 ? 's' : ''}</p>
        </div>

        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input className="input-field pl-10 pr-10 w-full sm:w-64" placeholder="Search collections…"
            value={search} onChange={e => setSearch(e.target.value)} />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="glass rounded-2xl h-40 animate-pulse" style={{ animationDelay: `${i * 100}ms` }} />
          ))}
        </div>
      )}

      {/* Pinned */}
      {!loading && pinned.length > 0 && (
        <div className="mb-6">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
            <span className="w-4 h-px bg-slate-700" />Pinned<span className="flex-1 h-px bg-slate-700/50" />
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {pinned.map((c, i) => (
              <div key={c.id} className="animate-slide-up" style={{ animationDelay: `${i * 50}ms` }}>
                <CollectionCard col={c} onPin={handlePin} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* All collections */}
      {!loading && (
        <>
          {pinned.length > 0 && unpinned.length > 0 && (
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
              <span className="w-4 h-px bg-slate-700" />All<span className="flex-1 h-px bg-slate-700/50" />
            </p>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {unpinned.map((c, i) => (
              <div key={c.id} className="animate-slide-up" style={{ animationDelay: `${i * 40}ms` }}>
                <CollectionCard col={c} onPin={handlePin} />
              </div>
            ))}
          </div>
        </>
      )}

      {/* Empty state */}
      {!loading && filtered.length === 0 && (
        <div className="text-center py-24 animate-fade-in">
          <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center"
            style={{ background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.2)' }}>
            <Hash className="w-7 h-7 text-violet-400" />
          </div>
          <p className="text-slate-400 font-medium">
            {search ? `No collections matching "${search}"` : 'No collections yet'}
          </p>
          <p className="text-slate-600 text-sm mt-1">Click + to create your first one</p>
        </div>
      )}

      {/* FAB */}
      <button onClick={() => setCreateOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95 glow-violet-btn z-40"
        style={{ background: 'linear-gradient(135deg,#7c3aed,#6d28d9)', border: '1px solid rgba(167,139,250,0.3)' }}>
        <Plus className="w-6 h-6 text-white" />
      </button>

      {/* Create modal */}
      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="New Collection">
        <form onSubmit={handleCreate} className="space-y-5">
          <div>
            <label className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1.5 block">Name</label>
            <input className="input-field" placeholder="e.g. Grocery Notes" value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required autoFocus />
          </div>

          <div>
            <label className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2 block">Type</label>
            <div className="grid grid-cols-2 gap-2">
              {TYPES.map(t => {
                const Icon = t.icon;
                const active = form.type === t.key;
                return (
                  <button type="button" key={t.key} onClick={() => setForm(f => ({ ...f, type: t.key }))}
                    className="p-3 rounded-xl text-left transition-all duration-200"
                    style={{
                      background: active ? `${t.color}18` : 'rgba(255,255,255,0.03)',
                      border: `1px solid ${active ? `${t.color}40` : 'rgba(255,255,255,0.07)'}`,
                      boxShadow: active ? `0 0 14px ${t.color}20` : 'none',
                    }}>
                    <Icon className="w-4 h-4 mb-1.5" style={{ color: active ? t.color : '#64748b' }} />
                    <div className="text-sm font-medium" style={{ color: active ? '#f1f5f9' : '#94a3b8' }}>{t.label}</div>
                    <div className="text-xs mt-0.5 text-slate-600 leading-tight">{t.desc}</div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={() => setCreateOpen(false)} className="btn-ghost flex-1">Cancel</button>
            <button type="submit" disabled={creating} className="btn-primary flex-1">
              {creating ? <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" /> : 'Create'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

function getDefaultPreview(type) {
  if (type === 'count') return { value: 0 };
  if (type === 'note') return { count: 0 };
  if (type === 'date') return { nextEvent: null };
  if (type === 'poll') return { pollCount: 0 };
  return {};
}
