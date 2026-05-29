import { useState, useEffect, useRef } from 'react';
import { collectionsApi } from '../../api';
import toast from 'react-hot-toast';
import { Plus, Minus } from 'lucide-react';

const COOLDOWN = 10;

export default function CountCollection({ col, onUpdate }) {
  const [value, setValue] = useState(col.data?.value ?? 0);
  const [inCooldown, setInCooldown] = useState({ increment: 0, decrement: 0 });
  const timers = useRef({});

  const startCooldown = action => {
    clearInterval(timers.current[action]);
    setInCooldown(c => ({ ...c, [action]: COOLDOWN }));
    timers.current[action] = setInterval(() => {
      setInCooldown(c => {
        const next = c[action] - 1;
        if (next <= 0) { clearInterval(timers.current[action]); return { ...c, [action]: 0 }; }
        return { ...c, [action]: next };
      });
    }, 1000);
  };

  useEffect(() => () => { Object.values(timers.current).forEach(clearInterval); }, []);

  const handleAction = async action => {
    if (inCooldown[action] > 0) return;
    startCooldown(action);
    try {
      const res = await collectionsApi.count(col.id, action);
      setValue(res.data.value);
      onUpdate(c => ({ ...c, data: { ...c.data, value: res.data.value } }));
    } catch {
      toast.error('Action failed');
    }
  };

  const pct = action => inCooldown[action] > 0 ? ((COOLDOWN - inCooldown[action]) / COOLDOWN) * 100 : 0;

  return (
    <div className="flex flex-col items-center">
      {/* Count display */}
      <div className="glass rounded-3xl w-full max-w-sm py-12 px-8 text-center mb-8 glow-violet relative overflow-hidden">
        <div className="absolute inset-0 opacity-30"
          style={{ background: 'radial-gradient(circle at 50% 0%, rgba(139,92,246,0.15) 0%, transparent 70%)' }} />
        <div className="relative">
          <p className="text-slate-500 text-xs uppercase tracking-widest mb-3 font-medium">Current Count</p>
          <span className="font-display font-extrabold text-white leading-none block"
            style={{ fontSize: 'clamp(72px,15vw,120px)', letterSpacing: '-0.04em' }}>
            {value}
          </span>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex gap-5 w-full max-w-xs">
        <CooldownButton
          action="decrement"
          label="-1"
          Icon={Minus}
          cooldown={inCooldown.decrement}
          progress={pct('decrement')}
          color="rgba(239,68,68"
          onClick={() => handleAction('decrement')}
        />
        <CooldownButton
          action="increment"
          label="+1"
          Icon={Plus}
          cooldown={inCooldown.increment}
          progress={pct('increment')}
          color="rgba(16,185,129"
          onClick={() => handleAction('increment')}
        />
      </div>

      {/* Hint */}
      <p className="text-slate-600 text-xs mt-6">10 second cooldown between actions</p>
    </div>
  );
}

function CooldownButton({ label, Icon, cooldown, progress, color, onClick }) {
  const active = cooldown > 0;
  const isIncrement = label === '+1';
  const radius = 30;
  const circ = 2 * Math.PI * radius;
  const offset = circ - (progress / 100) * circ;

  return (
    <button onClick={onClick} disabled={active}
      className="flex-1 relative flex flex-col items-center justify-center rounded-2xl py-5 font-display font-bold text-xl transition-all duration-200 select-none overflow-hidden"
      style={{
        background: active
          ? `${color},0.06)`
          : isIncrement ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
        border: `1px solid ${active ? `${color},0.15)` : isIncrement ? 'rgba(16,185,129,0.25)' : 'rgba(239,68,68,0.25)'}`,
        color: active ? 'rgba(255,255,255,0.35)' : isIncrement ? '#34d399' : '#f87171',
        transform: active ? 'none' : undefined,
        cursor: active ? 'not-allowed' : 'pointer',
        boxShadow: active ? 'none' : isIncrement ? '0 0 16px rgba(16,185,129,0.12)' : '0 0 16px rgba(239,68,68,0.12)',
      }}>

      {/* SVG ring */}
      {active && (
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 80 80" style={{ transform: 'rotate(-90deg)' }}>
          <circle cx="40" cy="40" r={radius} fill="none"
            stroke={isIncrement ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)'} strokeWidth="3" />
          <circle cx="40" cy="40" r={radius} fill="none"
            stroke={isIncrement ? 'rgba(16,185,129,0.6)' : 'rgba(239,68,68,0.6)'} strokeWidth="3"
            strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 1s linear' }} />
        </svg>
      )}

      <Icon className="w-6 h-6 mb-1 relative z-10" />
      <span className="relative z-10 text-lg">{label}</span>
      {active && <span className="relative z-10 text-xs font-body font-normal mt-0.5 opacity-60">{cooldown}s</span>}
    </button>
  );
}
