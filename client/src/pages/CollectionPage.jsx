import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { collectionsApi } from '../api';
import { useRoom } from '../context/RoomContext';
import toast from 'react-hot-toast';
import Modal from '../components/ui/Modal';
import CountCollection from '../components/collections/CountCollection';
import NoteCollection from '../components/collections/NoteCollection';
import DateCollection from '../components/collections/DateCollection';
import PollCollection from '../components/collections/PollCollection';
import { ArrowLeft, Trash2, Hash, FileText, CalendarDays, BarChart2, Pin } from 'lucide-react';

const TYPE_CFG = {
  count: { icon: Hash, badge: 'badge-count', label: 'Count', color: '#8b5cf6' },
  note:  { icon: FileText, badge: 'badge-note', label: 'Note', color: '#f59e0b' },
  date:  { icon: CalendarDays, badge: 'badge-date', label: 'Date', color: '#06b6d4' },
  poll:  { icon: BarChart2, badge: 'badge-poll', label: 'Poll', color: '#10b981' },
};

export default function CollectionPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { room } = useRoom();
  const [col, setCol] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletePass, setDeletePass] = useState('');
  const [deleting, setDeleting] = useState(false);

  const fetchCollection = async () => {
    try {
      const res = await collectionsApi.get(id);
      setCol(res.data);
    } catch {
      toast.error('Collection not found');
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCollection(); }, [id]);

  const handleDelete = async e => {
    e.preventDefault();
    setDeleting(true);
    try {
      await collectionsApi.delete(id, room.code, deletePass);
      toast.success(`"${col.name}" deleted`);
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Delete failed');
    } finally {
      setDeleting(false);
      setDeletePass('');
    }
  };

  const handlePin = async () => {
    const newPinned = col.pinned ? 0 : 1;
    try {
      await collectionsApi.update(id, { pinned: newPinned === 1 });
      setCol(c => ({ ...c, pinned: newPinned }));
      toast.success(newPinned ? 'Pinned!' : 'Unpinned');
    } catch {
      toast.error('Failed');
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="h-10 glass rounded-xl animate-pulse w-48 mb-8" />
        <div className="glass rounded-2xl h-64 animate-pulse" />
      </div>
    );
  }

  if (!col) return null;

  const cfg = TYPE_CFG[col.type] || TYPE_CFG.count;
  const Icon = cfg.icon;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-start gap-4 mb-8">
        <button onClick={() => navigate('/')}
          className="mt-0.5 w-9 h-9 rounded-xl flex items-center justify-center glass glass-hover transition-all shrink-0">
          <ArrowLeft className="w-4 h-4 text-slate-400" />
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5">
            <span className={`badge ${cfg.badge}`}><Icon className="w-3 h-3" />{cfg.label}</span>
            {col.pinned === 1 && <Pin className="w-3.5 h-3.5 fill-current" style={{ color: cfg.color }} />}
          </div>
          <h1 className="font-display text-2xl font-bold text-white leading-tight">{col.name}</h1>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button onClick={handlePin}
            className="w-9 h-9 rounded-xl flex items-center justify-center glass glass-hover transition-all"
            title={col.pinned ? 'Unpin' : 'Pin'}>
            <Pin className={`w-4 h-4 transition-colors ${col.pinned ? 'fill-current text-violet-400' : 'text-slate-500'}`} />
          </button>
          <button onClick={() => setDeleteOpen(true)}
            className="w-9 h-9 rounded-xl flex items-center justify-center transition-all"
            style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)' }}
            title="Delete collection">
            <Trash2 className="w-4 h-4 text-red-400" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="animate-slide-up">
        {col.type === 'count' && <CountCollection col={col} onUpdate={setCol} />}
        {col.type === 'note'  && <NoteCollection  col={col} onUpdate={setCol} />}
        {col.type === 'date'  && <DateCollection  col={col} onUpdate={setCol} />}
        {col.type === 'poll'  && <PollCollection  col={col} onUpdate={setCol} />}
      </div>

      {/* Delete modal */}
      <Modal open={deleteOpen} onClose={() => { setDeleteOpen(false); setDeletePass(''); }} title="Delete Collection">
        <form onSubmit={handleDelete} className="space-y-4">
          <div className="p-4 rounded-xl" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)' }}>
            <p className="text-sm text-red-300">
              You are about to permanently delete <strong className="text-white">"{col.name}"</strong> and all its data.
              This cannot be undone.
            </p>
          </div>
          <div>
            <label className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1.5 block">Confirmation Password</label>
            <input className="input-field" type="password" placeholder="Enter room password"
              value={deletePass} onChange={e => setDeletePass(e.target.value)} required autoFocus />
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={() => { setDeleteOpen(false); setDeletePass(''); }} className="btn-ghost flex-1">Cancel</button>
            <button type="submit" disabled={deleting} className="btn-danger flex-1">
              {deleting ? <div className="w-4 h-4 rounded-full border-2 border-red-300/30 border-t-red-300 animate-spin" /> : 'Delete'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
