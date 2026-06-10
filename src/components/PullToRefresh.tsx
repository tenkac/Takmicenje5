"use client";
import React, { useRef, useState, useEffect, ReactNode } from 'react';

interface Props {
  onRefresh: () => Promise<void>;
  children: ReactNode;
}

// px of dampened travel needed to arm the refresh
const THRESHOLD = 58;
// max dampened visual travel (√ curve keeps it elastic, not rigid)
const MAX_DAMP = 88;

type Phase = 'idle' | 'pulling' | 'ready' | 'refreshing';

export default function PullToRefresh({ onRefresh, children }: Props) {
  const [progress, setProgress] = useState(0); // 0–1 normalised
  const [phase, setPhase]       = useState<Phase>('idle');

  const touchY0      = useRef<number | null>(null);
  const hasVibrated  = useRef(false);
  const busy         = useRef(false);
  // phaseRef so the async touchend closure always reads the latest phase
  const phaseRef     = useRef<Phase>('idle');

  useEffect(() => { phaseRef.current = phase; }, [phase]);

  useEffect(() => {
    const onStart = (e: TouchEvent) => {
      if (busy.current || window.scrollY > 1) return;
      touchY0.current = e.touches[0].clientY;
      hasVibrated.current = false;
    };

    const onMove = (e: TouchEvent) => {
      if (touchY0.current === null || busy.current) return;
      // If the user scrolled the page down mid-gesture, cancel
      if (window.scrollY > 1) { touchY0.current = null; return; }

      const dy = e.touches[0].clientY - touchY0.current;
      if (dy <= 0) {
        setProgress(0);
        setPhase('idle');
        return;
      }

      // Prevent the native overscroll/bounce — ONLY if the browser allows it
      if (e.cancelable) {
        e.preventDefault();
      }

      // √ dampening: feels elastic, not stiff
      const damp = Math.min(Math.sqrt(dy / 1.4) * 7, MAX_DAMP);
      const norm = damp / MAX_DAMP;
      setProgress(norm);

      const ready = damp >= THRESHOLD;
      setPhase(ready ? 'ready' : 'pulling');

      if (ready && !hasVibrated.current) {
        hasVibrated.current = true;
        if (navigator.vibrate) navigator.vibrate(12);
      }
    };

    const onEnd = async () => {
      if (touchY0.current === null) return;
      touchY0.current = null;

      if (phaseRef.current !== 'ready' || busy.current) {
        setPhase('idle');
        setProgress(0);
        return;
      }

      busy.current = true;
      setPhase('refreshing');
      setProgress(0.6);
      if (navigator.vibrate) navigator.vibrate([8, 12, 22]);

      try   { await onRefresh(); }
      catch { /* swallow refresh errors — caller handles them */ }
      finally {
        setPhase('idle');
        setProgress(0);
        busy.current = false;
      }
    };

    window.addEventListener('touchstart', onStart, { passive: true });
    window.addEventListener('touchmove',  onMove,  { passive: false });
    window.addEventListener('touchend',   onEnd);

    return () => {
      window.removeEventListener('touchstart', onStart);
      window.removeEventListener('touchmove',  onMove);
      window.removeEventListener('touchend',   onEnd);
    };
  }, [onRefresh]);

  // Slide the pill in from -52px (hidden above screen) to +14px (peeking below top)
  const pillY = phase === 'refreshing'
    ? 14
    : progress * MAX_DAMP * 0.75 - 52;

  const visible = phase !== 'idle';

  return (
    <>
      {/* ── PULL INDICATOR ── */}
      <div
        aria-hidden
        style={{
          position:  'fixed',
          top:       0,
          left:      '50%',
          transform: `translateX(-50%) translateY(${pillY}px)`,
          opacity:   visible ? 1 : 0,
          // spring snap-back when releasing or after refresh
          transition: phase === 'idle'
            ? 'transform 0.42s cubic-bezier(0.34,1.56,0.64,1), opacity 0.28s ease'
            : 'none',
          zIndex:       9999,
          pointerEvents: 'none',
        }}
      >
        <Pill phase={phase} progress={progress} />
      </div>

      {children}
    </>
  );
}

/* ── Glass pill ─────────────────────────────────────────────────────────── */
function Pill({ phase, progress }: { phase: Phase; progress: number }) {
  const isReady      = phase === 'ready';
  const isRefreshing = phase === 'refreshing';
  const labelColor   = isReady ? '#facc15' : 'rgba(255,255,255,0.45)';

  const label = isRefreshing ? 'Osvježava...' : isReady ? 'Pusti!' : 'Vuci dolje...';

  return (
    <div
      style={{
        display:        'flex',
        alignItems:     'center',
        gap:            '9px',
        padding:        '7px 14px 7px 10px',
        borderRadius:   '50px',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        background:     'rgba(8,12,28,0.88)',
        border:         `1px solid ${isReady ? 'rgba(250,204,21,0.25)' : 'rgba(255,255,255,0.07)'}`,
        boxShadow:      '0 6px 28px rgba(0,0,0,0.55)',
        transition:     'border-color 0.25s',
        whiteSpace:     'nowrap',
      }}
    >
      {isRefreshing ? <SpinRing /> : <ArcIcon progress={progress} ready={isReady} />}

      <span style={{
        fontSize:      '10px',
        fontWeight:    800,
        letterSpacing: '0.12em',
        textTransform: 'uppercase',
        color:         labelColor,
        transition:    'color 0.2s',
        fontFamily:    'system-ui, -apple-system, sans-serif',
      }}>
        {label}
      </span>
    </div>
  );
}

/* ── Filling arc + arrow icon ───────────────────────────────────────────── */
function ArcIcon({ progress, ready }: { progress: number; ready: boolean }) {
  const size  = 22;
  const r     = 8.5;
  const circ  = 2 * Math.PI * r;
  const dash  = circ * Math.min(progress, 1);
  const color = ready ? '#facc15' : 'rgba(255,255,255,0.35)';
  // Arrow rotates 180° (↓ → ↑) when ready to release
  const arrowRotate = ready ? 180 : 0;

  return (
    <div style={{ width: size, height: size, position: 'relative', flexShrink: 0 }}>
      <svg width={size} height={size} style={{ position: 'absolute', inset: 0 }}>
        {/* track */}
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={2.2} />
        {/* progress arc */}
        <circle
          cx={size/2} cy={size/2} r={r}
          fill="none"
          stroke={color}
          strokeWidth={2.2}
          strokeDasharray={`${dash} ${circ}`}
          strokeLinecap="round"
          transform={`rotate(-90 ${size/2} ${size/2})`}
          style={{ transition: 'stroke 0.22s' }}
        />
      </svg>
      {/* arrow */}
      <div style={{
        position:       'absolute',
        inset:          0,
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'center',
        color,
        fontSize:       9,
        fontWeight:     900,
        transform:      `rotate(${arrowRotate}deg)`,
        transition:     ready
          ? 'transform 0.28s cubic-bezier(0.34,1.56,0.64,1), color 0.22s'
          : 'color 0.22s',
      }}>
        ↓
      </div>
    </div>
  );
}

/* ── Spinning ring for the refreshing state ─────────────────────────────── */
function SpinRing() {
  return (
    <div style={{ width: 22, height: 22, flexShrink: 0, position: 'relative' }}>
      <svg
        width={22} height={22}
        style={{ position: 'absolute', inset: 0, animation: 'ptr-spin 0.75s linear infinite' }}
      >
        <style>{`@keyframes ptr-spin { to { transform: rotate(360deg); } }`}</style>
        <circle cx={11} cy={11} r={8.5} fill="none" stroke="rgba(250,204,21,0.15)" strokeWidth={2.2} />
        <circle
          cx={11} cy={11} r={8.5}
          fill="none"
          stroke="#facc15"
          strokeWidth={2.2}
          strokeDasharray="16 37"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}
