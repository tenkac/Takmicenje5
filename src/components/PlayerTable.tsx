"use client";
import React, { useState, useEffect, useCallback } from 'react';
import { AllPlayersData, PLAYERS, MatchStatus } from '../types';
import { betSchema } from '../utils/validation';

interface Props {
  allBets: AllPlayersData;
  activePlayer: string;
  setActivePlayer: (player: string) => void;
  onAddPick: (date: string, sport: string, matchName: string, tip: string, odds: number) => void;
  onToggleStatus: (date: string, matchKey: "match1" | "match2") => void;
  onBack: () => void;
  userEmail?: string;
}

const PLAYER_THEMES: Record<string, { text: string, border: string, icon: string, hex: string }> = {
  "Vlado":  { text: "text-blue-400",   border: "border-blue-500/50",   icon: "/Avatars/vlado.jpg",  hex: "#3b82f6" },
  "Fika":   { text: "text-red-400",    border: "border-red-500/50",    icon: "/Avatars/fika.jpg",   hex: "#ef4444" },
  "Labud":  { text: "text-green-400",  border: "border-green-500/50",  icon: "/Avatars/labud.jpg",  hex: "#22c55e" },
  "Ilija":  { text: "text-purple-400", border: "border-purple-500/50", icon: "/Avatars/ilija.jpg",  hex: "#a855f7" },
  "Dzoni":  { text: "text-yellow-400", border: "border-yellow-500/50", icon: "/Avatars/dzoni.jpg",  hex: "#eab308" },
};

export default function PlayerTable({ allBets, activePlayer, setActivePlayer, onAddPick, onToggleStatus, onBack, userEmail }: Props) {
  const [form, setForm] = useState({ date: new Date().toLocaleDateString('en-CA'), sport: "⚽", matchName: "", tip: "", odds: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [flashMap, setFlashMap] = useState<Record<string, 'win' | 'loss' | null>>({});
  const [springMap, setSpringMap] = useState<Record<string, boolean>>({});
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(false);
    setFlashMap({});
    setSpringMap({});
    const t = setTimeout(() => setMounted(true), 60);
    return () => clearTimeout(t);
  }, [activePlayer]);

  const ADMIN_EMAIL = "vlado@takmicenje.com";
  const isOwner =
    userEmail === ADMIN_EMAIL ||
    (userEmail && userEmail.split('@')[0].toLowerCase() === activePlayer.toLowerCase());

  const handleAdd = async () => {
    if (isSubmitting) return;
    const result = betSchema.safeParse(form);
    if (!result.success) { alert(result.error.issues[0].message); return; }
    setIsSubmitting(true);
    try {
      onAddPick(result.data.date, result.data.sport, result.data.matchName, result.data.tip, result.data.odds);
      setForm({ ...form, matchName: "", tip: "", odds: "" });
    } catch (e) { console.error(e); }
    finally { setTimeout(() => setIsSubmitting(false), 1000); }
  };

  const handleToggle = useCallback((date: string, matchKey: "match1" | "match2") => {
    const cardKey = `${date}-${matchKey}`;
    const row = allBets[activePlayer]?.find(r => r.date === date);
    const match = row?.[matchKey];
    if (!match || match.status === 'empty') return;

    const next = match.status === 'pending' ? 'win' : match.status === 'win' ? 'loss' : 'pending';

    if (navigator.vibrate) {
      if (next === 'win')       navigator.vibrate([25, 15, 55]);
      else if (next === 'loss') navigator.vibrate(70);
      else                      navigator.vibrate(12);
    }

    setSpringMap(prev => ({ ...prev, [cardKey]: true }));
    setTimeout(() => setSpringMap(prev => ({ ...prev, [cardKey]: false })), 380);

    if (next !== 'pending') {
      setFlashMap(prev => ({ ...prev, [cardKey]: next }));
      setTimeout(() => setFlashMap(prev => ({ ...prev, [cardKey]: null })), 520);
    }

    onToggleStatus(date, matchKey);
  }, [allBets, activePlayer, onToggleStatus]);

  const getStatusColor = (s: MatchStatus) => {
    if (s === "win")  return "bg-green-500/10 text-green-400 border-green-500/30";
    if (s === "loss") return "bg-red-500/10 text-red-400 border-red-500/30";
    return "bg-orange-500/5 text-orange-300 border-orange-500/20";
  };

  // Compute Quick Stats for the Active Player card
  const playerStats = React.useMemo(() => {
    const rows = allBets[activePlayer] || [];
    let wins = 0, pending = 0, totalOdds = 0;
    rows.flatMap(r => [r.match1, r.match2]).forEach(m => {
      if (m.status === 'win') { wins++; totalOdds += m.odds; }
      if (m.status === 'pending') pending++;
    });
    return { wins, pending, score: totalOdds.toFixed(2) };
  }, [allBets, activePlayer]);

  const today = new Date().toLocaleDateString('en-CA');
  const pt = PLAYER_THEMES[activePlayer];

  return (
    <>
      <style>{`
        @keyframes stagger-in {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes card-spring {
          0%   { transform: scale(1); }
          28%  { transform: scale(0.95); }
          65%  { transform: scale(1.03); }
          100% { transform: scale(1); }
        }
        @keyframes flash-overlay {
          0%   { opacity: 0; }
          25%  { opacity: 0.3 }
          100% { opacity: 0; }
        }
        @keyframes pending-glow {
          0%, 100% { box-shadow: 0 0 0 rgba(249,115,22,0); border-color: rgba(249,115,22,0.15); }
          50%       { box-shadow: 0 0 12px rgba(249,115,22,0.2); border-color: rgba(249,115,22,0.4); }
        }
        .spring-anim { animation: card-spring 0.38s cubic-bezier(0.36,0.07,0.19,0.97) both !important; }
        .pending-glow { animation: pending-glow 2s ease-in-out infinite; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      <div
        className="min-h-screen text-white font-sans relative overflow-y-auto"
        style={{ background: 'linear-gradient(165deg, #05091a 0%, #080d20 45%, #040810 100%)' }}
      >
        {/* WC Background Layers */}
        <div className="fixed inset-0 wc-jersey-bg pointer-events-none" />
        <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
          <div className="wc-beam-l absolute" style={{ top: 0, left: '25%', width: '250px', height: '60vh', background: 'linear-gradient(178deg, rgba(250,204,21,0.12) 0%, transparent 80%)', filter: 'blur(50px)' }} />
          <div className="wc-beam-r absolute" style={{ top: 0, right: '25%', width: '250px', height: '60vh', background: 'linear-gradient(178deg, rgba(250,204,21,0.12) 0%, transparent 80%)', filter: 'blur(50px)' }} />
        </div>

        {/* ── STICKY MODERN TOP BAR ── */}
        <div className="sticky top-0 z-50 backdrop-blur-md bg-[#05091a]/85 border-b border-white/5 px-4 py-3 flex flex-col gap-3">
          <div className="max-w-7xl w-full mx-auto flex justify-between items-center">
            <button onClick={onBack} className="bg-white/5 hover:bg-white/10 text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-full border border-white/10 transition-all active:scale-95">
              ← Meni
            </button>
            <div className="text-center">
              <div className="text-[8px] font-black text-yellow-400/60 uppercase tracking-[0.4em] mb-0.5">WORLD CUP 2026</div>
              <h1 className="text-sm md:text-xl font-black uppercase tracking-widest">TAKMIČENJE <span className="text-yellow-400">5.0</span></h1>
            </div>
            <div className="w-16" />
          </div>

          {/* 👇 LARGER CAROUSEL SELECTOR: Expanded for flawless touch mechanics on mobile */}
          <div 
            className="max-w-7xl w-full mx-auto flex gap-3 overflow-x-auto no-scrollbar py-2.5 px-4 -mx-4 scroll-smooth overscroll-contain touch-pan-x snap-x"
            onTouchMove={(e) => e.stopPropagation()} 
          >
            {PLAYERS.map(p => {
              const isActive = activePlayer === p;
              const theme = PLAYER_THEMES[p];
              return (
                <button
                  key={p}
                  onClick={() => setActivePlayer(p)}
                  className={`flex items-center gap-3 px-5 py-3 rounded-full border transition-all duration-300 relative shrink-0 snap-inline ${
                    isActive 
                      ? `${theme.border} bg-white/10 shadow-[0_0_20px_rgba(255,255,255,0.08)] scale-100` 
                      : 'border-white/5 bg-black/40 opacity-50 hover:opacity-100 active:scale-95'
                  }`}
                >
                  <div className="w-8 h-8 rounded-full overflow-hidden border border-white/20 relative pointer-events-none">
                    <img src={theme.icon} className="w-full h-full object-cover" alt={p} />
                  </div>
                  <span className="text-xs font-black uppercase tracking-widest pointer-events-none">{p}</span>
                  {isActive && (
                    <span className="w-2 h-2 rounded-full absolute -top-0.5 -right-0.5 animate-pulse" style={{ backgroundColor: theme.hex }} />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── TWO-COLUMN SPLIT ARENA ── */}
        <div className="max-w-7xl mx-auto p-4 md:p-8 grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-8 relative z-10">
          
          {/* COLUMN 1: SIDE PANEL (Sticky Control Tower) */}
          <div className="flex flex-col gap-6 lg:sticky lg:top-[140px] lg:h-[calc(100vh-180px)]">
            
            {/* ACTIVE PLAYER HERO DISPLAY CARD */}
            <div className="p-6 rounded-3xl bg-white/5 border border-white/5 relative overflow-hidden backdrop-blur-md">
              <div className="absolute top-0 left-0 w-full h-1" style={{ backgroundColor: pt.hex }} />
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-white/10">
                  <img src={pt.icon} className="w-full h-full object-cover" alt={activePlayer} />
                </div>
                <div>
                  <h2 className={`text-2xl font-black uppercase tracking-tight ${pt.text}`}>{activePlayer}</h2>
                  <span className="text-[9px] font-bold tracking-widest text-gray-400 uppercase">Profil Takmičara</span>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center pt-2 border-t border-white/5">
                <div className="bg-black/30 p-2.5 rounded-xl">
                  <span className="block text-xs font-black text-white">{playerStats.score}</span>
                  <span className="text-[8px] font-bold text-gray-500 uppercase">Skor</span>
                </div>
                <div className="bg-black/30 p-2.5 rounded-xl">
                  <span className="block text-xs font-black text-green-400">{playerStats.wins}</span>
                  <span className="text-[8px] font-bold text-gray-500 uppercase">Pogodaka</span>
                </div>
                <div className="bg-black/30 p-2.5 rounded-xl">
                  <span className="block text-xs font-black text-orange-400">{playerStats.pending}</span>
                  <span className="text-[8px] font-bold text-gray-500 uppercase">Čeka</span>
                </div>
              </div>
            </div>

            {/* ACTION PANEL (Form Box) */}
            {isOwner && (
              <div className="p-6 rounded-3xl bg-gradient-to-b from-white/[0.06] to-white/[0.02] border border-yellow-400/20 shadow-xl flex flex-col gap-3.5">
                <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-yellow-400/70 flex items-center gap-2">⚽ UNESI NOVI PAR</h3>
                
                <div className="flex flex-col gap-1.5">
                  <span className="text-[8px] font-black uppercase tracking-widest text-gray-500 pl-1">Datum utakmice</span>
                  <input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })}
                    className="w-full h-[46px] bg-black/50 border border-white/10 rounded-xl px-3 text-xs outline-none focus:border-yellow-400/50 text-white transition-colors" />
                </div>

                <div className="flex flex-col gap-1.5">
                  <span className="text-[8px] font-black uppercase tracking-widest text-gray-500 pl-1">Naziv meča</span>
                  <input placeholder="Npr. Francuska - Poljska" value={form.matchName} onChange={e => setForm({ ...form, matchName: e.target.value })}
                    className="w-full h-[46px] bg-black/50 border border-white/10 rounded-xl px-4 text-xs outline-none focus:border-yellow-400/50 text-white transition-colors" />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <span className="text-[8px] font-black uppercase tracking-widest text-gray-500 pl-1">Tip prognoze</span>
                    <input placeholder="Npr. GG" value={form.tip} onChange={e => setForm({ ...form, tip: e.target.value })}
                      className="w-full h-[46px] bg-black/50 border border-white/10 rounded-xl px-3 text-xs outline-none focus:border-yellow-400/50 text-center text-white transition-colors" />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <span className="text-[8px] font-black uppercase tracking-widest text-gray-500 pl-1">Kvota para</span>
                    <input type="number" placeholder="1.85" value={form.odds} onChange={e => setForm({ ...form, odds: e.target.value })}
                      className="w-full h-[46px] bg-black/50 border border-white/10 rounded-xl px-3 text-xs outline-none focus:border-yellow-400/50 text-center font-bold text-white transition-colors" />
                  </div>
                </div>

                <button
                  onClick={handleAdd} disabled={isSubmitting}
                  className={`w-full h-[48px] mt-2 font-black text-xs uppercase tracking-widest rounded-xl transition-all active:scale-95 ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                  style={{ background: 'linear-gradient(135deg, #eab308 0%, #ca8a04 100%)', color: '#000', boxShadow: '0 4px 15px rgba(234,179,8,0.15)' }}
                >
                  {isSubmitting ? "Slanje..." : "DODAJ PAR"}
                </button>
              </div>
            )}
          </div>

          {/* COLUMN 2: FEED GRID (The dynamic betting tickets waterfall) */}
          <div className="space-y-4 lg:max-h-[calc(100vh-140px)] overflow-y-auto no-scrollbar pr-1">
            {allBets[activePlayer] && allBets[activePlayer].length === 0 ? (
              <div className="p-12 text-center text-xs font-black uppercase tracking-widest text-gray-600 bg-white/5 border border-white/5 rounded-3xl">
                Ovaj profil trenutno nema unetih parova.
              </div>
            ) : (
              [...allBets[activePlayer]].reverse().map((row, rowIdx) => {
                const isToday = row.date === today;
                return (
                  <div
                    key={row.date}
                    className="rounded-2xl p-5 flex flex-col sm:flex-row gap-4 items-stretch bg-gradient-to-r from-white/[0.04] to-white/[0.01] border transition-all"
                    style={{
                      borderColor: isToday ? 'rgba(250,204,21,0.25)' : 'rgba(255,255,255,0.06)',
                      boxShadow: isToday ? '0 0 15px rgba(250,204,21,0.04)' : 'none',
                      animation: mounted ? `stagger-in 0.4s cubic-bezier(0.22,1,0.36,1) ${Math.min(rowIdx * 0.05, 0.45)}s both` : 'none',
                      opacity: mounted ? undefined : 0,
                    }}
                  >
                    {/* TICKET LEFT BLOCK: META INFO */}
                    <div className="flex sm:flex-col justify-between sm:justify-center items-center gap-1 sm:border-r border-white/5 sm:pr-5 shrink-0 min-w-[70px]">
                      <div className="text-center">
                        <span className="block text-[8px] font-bold text-gray-500 uppercase tracking-wider">TICKET</span>
                        <span className={`text-base font-black tracking-tighter ${isToday ? 'text-yellow-400' : 'text-gray-300'}`}>
                          {row.date.split('-').reverse().slice(0, 2).join('.')}
                        </span>
                      </div>
                      {isToday && (
                        <span className="text-[8px] font-black uppercase tracking-widest px-2 py-0.5 bg-yellow-400/10 border border-yellow-400/20 rounded text-yellow-400">
                          Danas
                        </span>
                      )}
                    </div>

                    {/* TICKET RIGHT BLOCK: DOUBLE MATCH STACKS */}
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3">
                      {[row.match1, row.match2].map((m, idx) => {
                        const matchKey = idx === 0 ? ("match1" as const) : ("match2" as const);
                        const cardKey = `${row.date}-${matchKey}`;
                        const isSpring = springMap[cardKey];
                        const flash = flashMap[cardKey];
                        const isPending = m.status === 'pending';

                        return (
                          <div
                            key={idx}
                            onClick={() => isOwner && m.status !== 'empty' && handleToggle(row.date, matchKey)}
                            className={[
                              'p-4 rounded-xl border transition-all relative overflow-hidden flex flex-col justify-between min-h-[92px]',
                              getStatusColor(m.status),
                              m.status === 'empty' ? 'opacity-20 grayscale select-none' : '',
                              isOwner && m.status !== 'empty' ? 'cursor-pointer hover:bg-white/[0.03]' : 'cursor-default',
                              isPending ? 'pending-glow' : '',
                              isSpring ? 'spring-anim' : '',
                            ].join(' ')}
                          >
                            {flash && (
                              <div className="absolute inset-0 rounded-xl pointer-events-none z-20"
                                style={{ background: flash === 'win' ? '#22c55e' : '#ef4444', animation: 'flash-overlay 0.52s ease-out both' }} />
                            )}
                            
                            <div className="flex justify-between items-start gap-2 mb-1 relative z-10">
                              <span className="text-[8px] font-black bg-white/5 border border-white/10 px-1.5 py-0.5 rounded text-white/50 tracking-wider uppercase">
                                {m.sport || "⚽"} PAR {idx + 1}
                              </span>
                              {m.status !== 'empty' && (
                                <span className="font-black text-sm tracking-tight text-white">{m.odds.toFixed(2)}</span>
                              )}
                            </div>

                            <div className="my-1.5">
                              <div className="text-xs font-black truncate uppercase text-white tracking-wide">{m.name || "---"}</div>
                            </div>

                            <div className="text-[9px] font-black uppercase text-white/40 tracking-widest relative z-10">
                              TIP: <span className="text-white font-bold">{m.tip || "---"}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* FOOTER TICKER */}
        <div className="w-full overflow-hidden py-2 mt-8" style={{ borderTop: '1px solid rgba(255,255,255,0.05)', background: 'rgba(0,0,0,0.3)' }}>
          <div className="wc-ticker whitespace-nowrap inline-block">
            {[0, 1].map(i => (
              <span key={i} className="text-[10px] font-black uppercase tracking-[0.3em] text-yellow-400/20 px-2">
                ⚽&nbsp; WORLD CUP 2026 &nbsp;·&nbsp; LIVE ARENA &nbsp;·&nbsp; UNESI PAR &nbsp;·&nbsp; SREĆNO &nbsp;·&nbsp; USA · CANADA · MEXICO 2026 &nbsp;·&nbsp;
              </span>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}