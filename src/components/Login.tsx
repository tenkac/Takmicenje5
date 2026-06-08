import React, { useState } from 'react';
import { supabase } from '../lib/supabase';

export default function Login({ onLogin }: { onLogin: () => void }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const fakeEmail = `${username.trim().toLowerCase()}@takmicenje.com`;
    const { error } = await supabase.auth.signInWithPassword({ email: fakeEmail, password });

    if (error) { setError(error.message); setLoading(false); }
    else        { onLogin(); }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center relative overflow-hidden font-sans"
      style={{ background: 'linear-gradient(165deg, #05091a 0%, #080d20 55%, #040810 100%)' }}
    >
      {/* Jersey texture */}
      <div className="absolute inset-0 wc-jersey-bg pointer-events-none" />

      {/* Stadium beams */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="wc-beam-l absolute" style={{ top: 0, left: '15%', width: '260px', height: '80vh', background: 'linear-gradient(178deg, rgba(250,204,21,0.18) 0%, transparent 80%)', transformOrigin: 'top center', filter: 'blur(40px)' }} />
        <div className="wc-beam-r absolute" style={{ top: 0, right: '15%', width: '260px', height: '80vh', background: 'linear-gradient(178deg, rgba(250,204,21,0.18) 0%, transparent 80%)', transformOrigin: 'top center', filter: 'blur(40px)' }} />
        <div style={{ position: 'absolute', top: '-60px', left: '50%', transform: 'translateX(-50%)', width: '600px', height: '450px', background: 'radial-gradient(ellipse at top, rgba(250,204,21,0.06) 0%, transparent 65%)' }} />
      </div>

      {/* Floating balls */}
      <div className="absolute inset-0 pointer-events-none select-none overflow-hidden">
        <span className="wc-float      absolute text-6xl" style={{ opacity: 0.05, top: '8%',    left: '4%'  }}>⚽</span>
        <span className="wc-float-slow absolute text-8xl" style={{ opacity: 0.04, bottom: '12%', right: '3%' }}>⚽</span>
        <span className="wc-float-med  absolute text-4xl" style={{ opacity: 0.06, top: '45%',   right: '7%' }}>⚽</span>
      </div>

      {/* VIP PASS CARD */}
      <div className="relative z-10 w-full max-w-sm px-5">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="wc-gold-pulse text-6xl mb-3 select-none leading-none">🏆</div>
          <h1 className="text-3xl font-black uppercase tracking-tighter text-white leading-tight">
            WORLD CUP
            <span className="wc-shine-text block text-4xl">2026</span>
          </h1>
          <p className="text-[9px] font-black text-gray-600 uppercase tracking-[0.4em] mt-2">
            STADIUM ACCESS · AUTHORIZED ONLY
          </p>
        </div>

        {/* Pass card */}
        <form
          onSubmit={handleLogin}
          className="rounded-3xl backdrop-blur-xl p-7"
          style={{ background: 'linear-gradient(145deg, rgba(250,204,21,0.07) 0%, rgba(0,0,0,0.55) 100%)', border: '1px solid rgba(250,204,21,0.18)', boxShadow: 'inset 0 1px 0 rgba(250,204,21,0.08), 0 30px 60px rgba(0,0,0,0.6)' }}
        >
          {/* Pass strip */}
          <div className="flex items-center justify-between mb-6 pb-4" style={{ borderBottom: '1px solid rgba(250,204,21,0.1)' }}>
            <div>
              <div className="text-[8px] font-black uppercase tracking-widest text-yellow-400/50">VIP ACCESS PASS</div>
              <div className="text-[10px] font-black text-white/25 uppercase tracking-wider">TAKMIČENJE EDITION</div>
            </div>
            <div className="text-2xl opacity-30 select-none">⚽</div>
          </div>

          {error && (
            <div className="mb-5 p-3 rounded-xl text-red-300 text-xs font-bold text-center" style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.35)' }}>
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-[9px] font-black uppercase tracking-widest mb-1.5 ml-1 text-yellow-400/45">PLAYER NAME</label>
              <input
                type="text" value={username} onChange={e => setUsername(e.target.value)}
                className="w-full rounded-xl p-4 text-white outline-none transition-all font-bold uppercase text-sm placeholder-gray-700"
                style={{ background: 'rgba(0,0,0,0.45)', border: '1px solid rgba(250,204,21,0.12)' }}
                onFocus={e  => (e.target.style.borderColor = 'rgba(250,204,21,0.45)')}
                onBlur={e   => (e.target.style.borderColor = 'rgba(250,204,21,0.12)')}
                placeholder="VLADO" autoFocus
              />
            </div>
            <div>
              <label className="block text-[9px] font-black uppercase tracking-widest mb-1.5 ml-1 text-yellow-400/45">ACCESS CODE</label>
              <input
                type="password" value={password} onChange={e => setPassword(e.target.value)}
                className="w-full rounded-xl p-4 text-white outline-none transition-all font-bold text-sm placeholder-gray-700"
                style={{ background: 'rgba(0,0,0,0.45)', border: '1px solid rgba(250,204,21,0.12)' }}
                onFocus={e  => (e.target.style.borderColor = 'rgba(250,204,21,0.45)')}
                onBlur={e   => (e.target.style.borderColor = 'rgba(250,204,21,0.12)')}
                placeholder="••••••••"
              />
            </div>
            <button
              type="submit" disabled={loading}
              className="w-full font-black uppercase py-4 rounded-xl transition-all active:scale-[0.97] mt-2 text-sm tracking-[0.15em] disabled:opacity-50"
              style={{ background: loading ? 'rgba(202,138,4,0.6)' : 'linear-gradient(135deg, #eab308 0%, #ca8a04 100%)', color: '#000', boxShadow: loading ? 'none' : '0 8px 30px rgba(234,179,8,0.28)' }}
            >
              {loading ? 'Authenticating...' : '🏟️ ENTER STADIUM'}
            </button>
          </div>
        </form>

        {/* Ticker */}
        <div className="mt-4 overflow-hidden rounded-full py-1.5" style={{ background: 'rgba(0,0,0,0.3)' }}>
          <div className="wc-ticker whitespace-nowrap inline-block">
            {[0, 1].map(i => (
              <span key={i} className="text-[9px] font-black uppercase tracking-[0.3em] text-yellow-400/20 px-3">
                ⚽ WORLD CUP 2026 · USA · CANADA · MEXICO · KICK OFF JUNI 2026 ·
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
