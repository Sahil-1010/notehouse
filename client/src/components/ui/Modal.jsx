import { useEffect } from 'react';
import { X } from 'lucide-react';

export default function Modal({ open, onClose, title, children, maxWidth = 'max-w-md' }) {
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      {/* Backdrop */}
      <div className="absolute inset-0 animate-fade-in"
        style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }} />

      {/* Panel */}
      <div className={`relative z-10 w-full ${maxWidth} animate-slide-up`}
        style={{ background: 'rgba(10,10,25,0.97)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: '20px 20px 0 0', padding: '24px 24px 32px' }}>
        {/* Handle (mobile) */}
        <div className="sm:hidden w-10 h-1 rounded-full mx-auto mb-4"
          style={{ background: 'rgba(255,255,255,0.15)' }} />

        <div className="flex items-center justify-between mb-6 sm:rounded-2xl">
          <h2 className="font-display text-lg font-semibold text-white">{title}</h2>
          <button onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/8 transition-all">
            <X className="w-4 h-4" />
          </button>
        </div>

        {children}
      </div>
    </div>
  );
}
