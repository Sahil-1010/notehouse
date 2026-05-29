import { useState } from 'react';
import { collectionsApi } from '../../api';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import { Plus, Trash2, BarChart2, Check, X } from 'lucide-react';
import { format, parseISO } from 'date-fns';

export default function PollCollection({ col, onUpdate }) {
  const { user } = useAuth();
  const [polls, setPolls] = useState(col.data?.polls || []);
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({ question: '', options: ['', ''] });
  const [creating, setCreating] = useState(false);

  const handleCreate = async e => {
    e.preventDefault();
    const options = form.options.filter(o => o.trim());
    if (options.length < 2) return toast.error('At least 2 options required');
    setCreating(true);
    try {
      const res = await collectionsApi.createPoll(col.id, { question: form.question, options });
      setPolls(p => [res.data, ...p]);
      setForm({ question: '', options: ['', ''] });
      setCreateOpen(false);
      toast.success('Poll created');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Create failed');
    } finally {
      setCreating(false);
    }
  };

  const handleVote = async (pollId, optionId) => {
    try {
      const res = await collectionsApi.vote(col.id, pollId, optionId);
      setPolls(p => p.map(poll => poll.id === pollId ? res.data : poll));
      toast.success('Vote recorded!');
    } catch {
      toast.error('Vote failed');
    }
  };

  const handleDelete = async pollId => {
    try {
      await collectionsApi.deletePoll(col.id, pollId);
      setPolls(p => p.filter(x => x.id !== pollId));
      toast.success('Poll deleted');
    } catch {
      toast.error('Delete failed');
    }
  };

  const addOption = () => setForm(f => ({ ...f, options: [...f.options, ''] }));
  const removeOption = i => setForm(f => ({ ...f, options: f.options.filter((_, j) => j !== i) }));
  const updateOption = (i, val) => setForm(f => ({ ...f, options: f.options.map((o, j) => j === i ? val : o) }));

  return (
    <div>
      <div className="flex justify-end mb-6">
        <button onClick={() => setCreateOpen(o => !o)} className="btn-primary gap-2">
          <Plus className="w-4 h-4" /> Create Poll
        </button>
      </div>

      {createOpen && (
        <div className="glass rounded-2xl p-5 mb-6 animate-scale-in">
          <form onSubmit={handleCreate} className="space-y-4">
            <input className="input-field" placeholder="Poll question *" value={form.question}
              onChange={e => setForm(f => ({ ...f, question: e.target.value }))} required autoFocus />

            <div className="space-y-2">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Options</p>
              {form.options.map((opt, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <input className="input-field flex-1" placeholder={`Option ${i + 1}`} value={opt}
                    onChange={e => updateOption(i, e.target.value)} />
                  {form.options.length > 2 && (
                    <button type="button" onClick={() => removeOption(i)}
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors shrink-0">
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
              {form.options.length < 6 && (
                <button type="button" onClick={addOption}
                  className="w-full py-2 rounded-xl text-sm text-slate-500 hover:text-slate-300 transition-colors flex items-center justify-center gap-1.5"
                  style={{ border: '1px dashed rgba(255,255,255,0.1)' }}>
                  <Plus className="w-3.5 h-3.5" /> Add option
                </button>
              )}
            </div>

            <div className="flex gap-2 justify-end">
              <button type="button" onClick={() => setCreateOpen(false)} className="btn-ghost py-2 px-3 text-xs">Cancel</button>
              <button type="submit" disabled={creating} className="btn-primary py-2 px-4 text-xs">
                {creating ? <div className="w-3.5 h-3.5 border border-white/30 border-t-white rounded-full animate-spin" /> : 'Create'}
              </button>
            </div>
          </form>
        </div>
      )}

      {polls.length === 0 ? (
        <div className="text-center py-20 animate-fade-in">
          <div className="w-14 h-14 rounded-2xl mx-auto mb-3 flex items-center justify-center"
            style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)' }}>
            <BarChart2 className="w-6 h-6 text-emerald-400" />
          </div>
          <p className="text-slate-400">No polls yet</p>
        </div>
      ) : (
        <div className="space-y-4">
          {polls.map((poll, i) => (
            <PollCard key={poll.id} poll={poll} userId={user?.id}
              onVote={optionId => handleVote(poll.id, optionId)}
              onDelete={() => handleDelete(poll.id)}
              style={{ animationDelay: `${i * 60}ms` }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function PollCard({ poll, userId, onVote, onDelete, style }) {
  const totalVotes = poll.options.reduce((s, o) => s + o.votes, 0);
  const hasVoted = poll.userVote !== null;

  return (
    <div className="glass rounded-2xl p-5 group animate-slide-up" style={style}>
      <div className="flex items-start justify-between gap-3 mb-4">
        <h3 className="font-display font-semibold text-white text-sm leading-snug flex-1">{poll.question}</h3>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs text-slate-500">{totalVotes} vote{totalVotes !== 1 ? 's' : ''}</span>
          <button onClick={onDelete}
            className="opacity-0 group-hover:opacity-100 w-6 h-6 rounded-md flex items-center justify-center text-slate-600 hover:text-red-400 hover:bg-red-500/12 transition-all">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="space-y-2">
        {poll.options.map(opt => {
          const pct = totalVotes > 0 ? Math.round((opt.votes / totalVotes) * 100) : 0;
          const isMyVote = poll.userVote === opt.id;
          return (
            <button key={opt.id} onClick={() => onVote(opt.id)}
              className="w-full text-left rounded-xl px-4 py-3 relative overflow-hidden group/opt transition-all duration-200 hover:scale-[1.01] active:scale-[0.99]"
              style={{
                background: isMyVote ? 'rgba(16,185,129,0.12)' : 'rgba(255,255,255,0.03)',
                border: `1px solid ${isMyVote ? 'rgba(16,185,129,0.28)' : 'rgba(255,255,255,0.07)'}`,
              }}>
              {/* Progress fill */}
              {hasVoted && pct > 0 && (
                <div className="absolute inset-y-0 left-0 rounded-xl transition-all duration-700"
                  style={{ width: `${pct}%`, background: isMyVote ? 'rgba(16,185,129,0.1)' : 'rgba(255,255,255,0.03)' }} />
              )}
              <div className="relative flex items-center justify-between">
                <span className="text-sm text-slate-300 flex items-center gap-2">
                  {isMyVote && <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
                  {opt.text}
                </span>
                {hasVoted && (
                  <span className="text-xs font-medium" style={{ color: isMyVote ? '#34d399' : '#64748b' }}>
                    {pct}%
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {!hasVoted && (
        <p className="text-xs text-slate-600 mt-3 text-center">Click an option to vote</p>
      )}

      <p className="text-xs text-slate-700 mt-3">
        {format(parseISO(poll.created_at), 'MMM d, yyyy')}
      </p>
    </div>
  );
}
