import { useState } from 'react';
import { collectionsApi } from '../../api';
import toast from 'react-hot-toast';
import { Plus, Trash2, Edit3, Check, X } from 'lucide-react';
import { format, parseISO } from 'date-fns';

const COLORS = [
  { key: 'violet', dot: '#8b5cf6' },
  { key: 'amber',  dot: '#f59e0b' },
  { key: 'cyan',   dot: '#06b6d4' },
  { key: 'rose',   dot: '#f43f5e' },
  { key: 'emerald',dot: '#10b981' },
  { key: 'blue',   dot: '#3b82f6' },
];

function randomColor() {
  return COLORS[Math.floor(Math.random() * COLORS.length)].key;
}

export default function NoteCollection({ col, onUpdate }) {
  const [notes, setNotes] = useState(col.data?.notes || []);
  const [addOpen, setAddOpen] = useState(false);
  const [addForm, setAddForm] = useState({ content: '', color: randomColor() });
  const [adding, setAdding] = useState(false);
  const [editId, setEditId] = useState(null);
  const [editContent, setEditContent] = useState('');

  const handleAdd = async e => {
    e.preventDefault();
    if (!addForm.content.trim()) return;
    setAdding(true);
    try {
      const res = await collectionsApi.addNote(col.id, addForm);
      setNotes(n => [res.data, ...n]);
      setAddForm({ content: '', color: randomColor() });
      setAddOpen(false);
      toast.success('Note added');
    } catch {
      toast.error('Failed to add note');
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = async id => {
    try {
      await collectionsApi.deleteNote(col.id, id);
      setNotes(n => n.filter(x => x.id !== id));
      toast.success('Note deleted');
    } catch {
      toast.error('Delete failed');
    }
  };

  const startEdit = note => { setEditId(note.id); setEditContent(note.content); };

  const saveEdit = async id => {
    if (!editContent.trim()) return;
    try {
      const res = await collectionsApi.updateNote(col.id, id, { content: editContent });
      setNotes(n => n.map(x => x.id === id ? res.data : x));
      setEditId(null);
      toast.success('Updated');
    } catch {
      toast.error('Update failed');
    }
  };

  return (
    <div>
      {/* Add button */}
      <div className="flex justify-end mb-6">
        <button onClick={() => setAddOpen(o => !o)} className="btn-primary gap-2">
          <Plus className="w-4 h-4" /> Add Note
        </button>
      </div>

      {/* Add form */}
      {addOpen && (
        <div className="glass rounded-2xl p-5 mb-6 animate-scale-in">
          <form onSubmit={handleAdd} className="space-y-4">
            <textarea className="textarea-field h-28" placeholder="Write your note…"
              value={addForm.content} onChange={e => setAddForm(f => ({ ...f, content: e.target.value }))}
              autoFocus required />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-slate-500 mr-1">Color:</span>
                {COLORS.map(c => (
                  <button type="button" key={c.key}
                    onClick={() => setAddForm(f => ({ ...f, color: c.key }))}
                    className="w-5 h-5 rounded-full transition-all duration-150"
                    style={{
                      background: c.dot,
                      transform: addForm.color === c.key ? 'scale(1.35)' : 'scale(1)',
                      boxShadow: addForm.color === c.key ? `0 0 8px ${c.dot}80` : 'none',
                    }} />
                ))}
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={() => setAddOpen(false)} className="btn-ghost py-2 px-3 text-xs">Cancel</button>
                <button type="submit" disabled={adding} className="btn-primary py-2 px-4 text-xs">
                  {adding ? <div className="w-3.5 h-3.5 border border-white/30 border-t-white rounded-full animate-spin" /> : 'Save'}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* Notes grid */}
      {notes.length === 0 ? (
        <div className="text-center py-20 animate-fade-in">
          <div className="w-14 h-14 rounded-2xl mx-auto mb-3 flex items-center justify-center"
            style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)' }}>
            <Edit3 className="w-6 h-6 text-amber-400" />
          </div>
          <p className="text-slate-400">No notes yet</p>
          <p className="text-slate-600 text-sm mt-1">Click "Add Note" to get started</p>
        </div>
      ) : (
        <div className="columns-1 sm:columns-2 lg:columns-3 gap-4 space-y-4">
          {notes.map((note, i) => (
            <div key={note.id}
              className={`break-inside-avoid rounded-2xl border p-4 group relative transition-all duration-200 hover:-translate-y-0.5 animate-slide-up note-${note.color}`}
              style={{ animationDelay: `${Math.min(i * 50, 300)}ms` }}>

              {/* Actions */}
              <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                {editId !== note.id && (
                  <>
                    <button onClick={() => startEdit(note)}
                      className="w-6 h-6 rounded-md flex items-center justify-center hover:bg-white/10 transition-colors text-slate-400 hover:text-white">
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => handleDelete(note.id)}
                      className="w-6 h-6 rounded-md flex items-center justify-center hover:bg-red-500/20 transition-colors text-slate-500 hover:text-red-400">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </>
                )}
              </div>

              {editId === note.id ? (
                <div className="space-y-2">
                  <textarea className="textarea-field text-sm h-24" value={editContent}
                    onChange={e => setEditContent(e.target.value)} autoFocus />
                  <div className="flex gap-2">
                    <button onClick={() => saveEdit(note.id)} className="w-7 h-7 rounded-lg flex items-center justify-center text-emerald-400 hover:bg-emerald-500/15 transition-colors">
                      <Check className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => setEditId(null)} className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-500 hover:bg-white/8 transition-colors">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <p className="text-slate-200 text-sm leading-relaxed pr-8 whitespace-pre-wrap">{note.content}</p>
                  <p className="text-xs mt-3 text-slate-600">
                    {format(parseISO(note.updated_at), 'MMM d, HH:mm')}
                  </p>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
