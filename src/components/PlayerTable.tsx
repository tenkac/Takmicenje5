import { useState, useEffect, useCallback } from 'react';
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
  const [form, setForm]           = useState({ date: new Date().toLocaleDateString('en-CA'), sport: "⚽", matchName: "", tip: "", odds: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [flashMap, setFlashMap]   = useState<Record<string, 'win' | 'loss' | null>>({});
  const [springMap, setSpringMap] = useState<Record<string, boolean>>({});
  const [, setConfettiKey]        = useState<string | null>(null);
  const [mounted, setMounted]     = useState(false);

  useEffect(() => {
    setMounted(false);
    setFlashMap({});
    setSpringMap({});
    setConfettiKey(null);
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
    const row   = allBets[activePlayer]?.find(r => r.date === date);
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

    if (next === 'win') setConfettiKey(cardKey);

    onToggleStatus(date, matchKey);
  }, [allBets, activePlayer, onToggleStatus]);

  const getStatusColor = (s: MatchStatus) => {
    if (s === "win")  return "bg-green-500/20 text-green-400 border-green-500/50";
    if (s === "loss") return "bg-red-500/20 text-red-400 border-red-500/50";
    return "bg-white/5 text-gray-400 border-white/10";
  };

  const today = new Date().toLocaleDateString('en-CA');
  const pt    = PLAYER_THEMES[activePlayer];

  return (
    <>
      <style>{`
        @keyframes stagger-in {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes card-spring {
          0%   { transform: scale(1); }
          28%  { transform: scale(0.94); }
          65%  { transform: scale(1.045); }
          100% { transform: scale(1); }
        }
        @keyframes flash-overlay {
          0%   { opacity: 0; }
          25%  { opacity: 0.38; }
          100% { opacity: 0; }
        }
        @keyframes pending-breathe {
          0%, 100% { box-shadow: 0 0 0 rgba(251,146,60,0);    border-color: rgba(255,255,255,0.1); }
          50%       { box-shadow: 0 0 16px rgba(251,146,60,0.3); border-color: rgba(251,146,60,0.5); }
        }
        .spring-anim     { animation: card-spring 0.38s cubic-bezier(0.36,0.07,0.19,0.97) both !important; }
        .pending-breathe { animation: pending-breathe 2.4s ease-in-out infinite; }
      `}</style>

      <div
        className="min-h-screen text-white font-sans selection:bg-orange-500/30 relative overflow-hidden"
        style={{ background: 'linear-gradient(165deg, #05091a 0%, #080d20 45%, #040810 100%)' }}
      >
        {/* WC background layers */}
        <div className="fixed inset-0 wc-jersey-bg pointer-events-none" />
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          <div className="wc-beam-l absolute" style={{ top: 0, left: '20%', width: '230px', height: '60vh', background: 'linear-gradient(178deg, rgba(250,204,21,0.12) 0%, transparent 80%)', transformOrigin: 'top center', filter: 'blur(44px)' }} />
          <div className="wc-beam-r absolute" style={{ top: 0, right: '20%', width: '230px', height: '60vh', background: 'linear-gradient(178deg, rgba(250,204,21,0.12) 0%, transparent 80%)', transformOrigin: 'top center', filter: 'blur(44px)' }} />
          <div style={{ position: 'absolute', top: '-60px', left: '50%', transform: 'translateX(-50%)', width: '600px', height: '380px', background: 'radial-gradient(ellipse at top, rgba(250,204,21,0.05) 0%, transparent 65%)' }} />
          <div style={{ position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '70vw', height: '25vh', background: `radial-gradient(ellipse at bottom, ${pt.hex}08 0%, transparent 70%)` }} />
        </div>
        <div className="fixed inset-0 pointer-events-none select-none overflow-hidden">
          <span className="wc-float-slow absolute text-7xl" style={{ opacity: 0.04, top: '30%',  left: '1%'  }}>⚽</span>
          <span className="wc-float      absolute text-4xl" style={{ opacity: 0.05, top: '60%',  right: '2%' }}>⚽</span>
        </div>

        <div className="relative z-10">

          {/* HEADER */}
          <div
            className="sticky top-0 z-50 backdrop-blur-xl border-b border-white/10 p-4 flex justify-between items-center"
            style={{ background: 'rgba(5,9,26,0.85)' }}
          >
            <button onClick={onBack} className="bg-white/5 hover:bg-white/10 px-4 py-2 rounded-xl border border-white/10 transition-all text-xs font-bold uppercase tracking-widest active:scale-95">
              ← Menu
            </button>
            <div className="text-center">
              <div className="text-[9px] font-black text-yellow-400/60 uppercase tracking-[0.3em]">WORLD CUP 2026</div>
              <h1 className="text-lg md:text-3xl font-black tracking-tighter uppercase text-white leading-none">
                TAKMIČENJE <span className="wc-shine-text">5.0</span>
              </h1>
            </div>
            <div className="w-20" />
          </div>

          <div className="max-w-7xl mx-auto p-4 lg:p-8 flex flex-col lg:flex-row gap-8">

            {/* PLAYER NAV */}
            <div className="w-full lg:w-80 flex lg:flex-col gap-3 overflow-x-auto lg:overflow-x-hidden p-4 lg:p-6 scrollbar-hide flex-shrink-0">
              {PLAYERS.map(p => {
                const isActive = activePlayer === p;
                const t = PLAYER_THEMES[p];
                return (
                  <button
                    key={p}
                    onClick={() => setActivePlayer(p)}
                    className={`flex-shrink-0 flex items-center gap-4 lg:gap-6 p-3 lg:p-5 rounded-2xl lg:rounded-[2.5rem] border transition-all duration-300 w-auto lg:w-full active:scale-95 ${
                      isActive
                        ? `${t.border} bg-white/10 backdrop-blur-md shadow-2xl scale-100 lg:scale-105`
                        : 'border-transparent opacity-40 hover:opacity-100 hover:bg-white/5'
                    }`}
                  >
                    <div className={`relative flex-shrink-0 rounded-full overflow-hidden border-2 border-white/20 shadow-lg w-10 h-10 lg:w-20 lg:h-20 ${isActive ? 'ring-4 ring-yellow-400/25' : ''}`}>
                      <img src={t.icon} className="w-full h-full object-cover" alt={p} />
                    </div>
                    <span className={`font-black uppercase tracking-widest whitespace-nowrap text-xs lg:text-xl ${isActive ? t.text : 'text-white'}`}>{p}</span>
                  </button>
                );
              })}
            </div>

            {/* MAIN ARENA */}
            <div className="flex-1 space-y-8">

              {isOwner ? (
                <div
                  className="p-6 rounded-3xl backdrop-blur-md shadow-xl relative z-40"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(250,204,21,0.15)' }}
                >
                  <h3 className="text-xs font-black uppercase tracking-[0.3em] mb-4 text-yellow-400/50">⚽ Dodaj Par</h3>
                  <div className="grid grid-cols-2 md:grid-cols-[1.2fr_2fr_1fr_1fr_auto] gap-3 items-stretch">
                    <input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })}
                      className="h-[52px] bg-black/40 border border-white/10 rounded-xl px-3 text-sm outline-none focus:border-yellow-400/50 text-white transition-colors" />
                    <input placeholder="Utakmica" value={form.matchName} onChange={e => setForm({ ...form, matchName: e.target.value })}
                      className="h-[52px] bg-black/40 border border-white/10 rounded-xl px-4 text-sm outline-none focus:border-yellow-400/50 text-white transition-colors" />
                    <input placeholder="Tip" value={form.tip} onChange={e => setForm({ ...form, tip: e.target.value })}
                      className="h-[52px] bg-black/40 border border-white/10 rounded-xl px-3 text-sm outline-none focus:border-yellow-400/50 text-center text-white transition-colors" />
                    <input type="number" placeholder="Kvota" value={form.odds} onChange={e => setForm({ ...form, odds: e.target.value })}
                      className="h-[52px] bg-black/40 border border-white/10 rounded-xl px-3 text-sm outline-none focus:border-yellow-400/50 text-center font-bold text-white transition-colors" />
                    <button
                      onClick={handleAdd} disabled={isSubmitting}
                      className={`h-[52px] font-black uppercase rounded-xl transition-all active:scale-95 px-8 whitespace-nowrap ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                      style={{ background: isSubmitting ? 'rgba(202,138,4,0.5)' : 'linear-gradient(135deg, #eab308 0%, #ca8a04 100%)', color: '#000', boxShadow: '0 4px 20px rgba(234,179,8,0.2)' }}
                    >
                      {isSubmitting ? "..." : "DODAJ"}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center rounded-3xl flex flex-col items-center justify-center gap-2"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <span className="text-3xl">🔒</span>
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                    View Only Mode • Log in as {activePlayer} to edit
                  </span>
                </div>
              )}

              {/* TABLE FEED */}
              <div className="space-y-4">
                {[...allBets[activePlayer]].reverse().map((row, rowIdx) => {
                  const isToday = row.date === today;
                  return (
                    <div
                      key={row.date}
                      className="rounded-3xl p-6 flex flex-col md:flex-row gap-6 items-center backdrop-blur-sm border transition-colors"
                      style={{
                        background: isToday ? 'rgba(250,204,21,0.04)' : 'rgba(255,255,255,0.04)',
                        border: isToday ? '1px solid rgba(250,204,21,0.3)' : '1px solid rgba(255,255,255,0.08)',
                        boxShadow: isToday ? '0 0 20px rgba(250,204,21,0.06)' : 'none',
                        animation: mounted ? `stagger-in 0.4s cubic-bezier(0.22,1,0.36,1) ${Math.min(rowIdx * 0.055, 0.45)}s both` : 'none',
                        opacity: mounted ? undefined : 0,
                      }}
                    >
                      {/* DATE */}
                      <div className="flex flex-col items-center justify-center md:border-r border-white/10 pr-6 shrink-0">
                        <span className="text-[10px] font-black uppercase text-gray-500 tracking-tighter">DATUM</span>
                        <span className={`text-lg font-black ${isToday ? 'text-yellow-400' : 'text-orange-500'}`}>
                          {row.date.split('-').reverse().slice(0, 2).join('.')}
                        </span>
                        {isToday && <span className="text-[8px] font-black uppercase tracking-widest text-yellow-400/60 mt-0.5">Danas</span>}
                      </div>

                      {/* PICKS */}
                      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
                        {[row.match1, row.match2].map((m, idx) => {
                          const matchKey = idx === 0 ? "match1" as const : "match2" as const;
                          const cardKey  = `${row.date}-${matchKey}`;
                          const isSpring = springMap[cardKey];
                          const flash    = flashMap[cardKey];
                          const isPending = m.status === 'pending';

                          return (
                            <div
                              key={idx}
                              onClick={() => isOwner && m.status !== 'empty' && handleToggle(row.date, matchKey)}
                              className={[
                                'p-4 rounded-2xl border transition-colors backdrop-blur-sm relative overflow-hidden',
                                getStatusColor(m.status),
                                m.status === 'empty'                     ? 'opacity-30 grayscale' : '',
                                isOwner && m.status !== 'empty'          ? 'cursor-pointer shadow-lg' : 'cursor-default',
                                isPending                                 ? 'pending-breathe' : '',
                                isSpring                                  ? 'spring-anim' : '',
                              ].join(' ')}
                            >
                              {flash && (
                                <div className="absolute inset-0 rounded-2xl pointer-events-none z-20"
                                  style={{ background: flash === 'win' ? '#22c55e' : '#ef4444', animation: 'flash-overlay 0.52s ease-out both' }} />
                              )}
                              <div className="flex justify-between items-center mb-1 relative z-10">
                                <span className="text-[10px] font-bold uppercase tracking-widest opacity-60">
                                  {m.sport || "⚽"} UTAKMICA {idx + 1}
                                </span>
                                {m.status !== 'empty' && <span className="font-black text-lg">{m.odds.toFixed(2)}</span>}
                              </div>
                              <div className="text-sm font-bold truncate uppercase relative z-10">{m.name || "---"}</div>
                              <div className="text-[10px] font-black text-white/40 uppercase relative z-10">
                                TIP: <span className="text-white">{m.tip || "---"}</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* TICKER */}
          <div className="w-full overflow-hidden py-2 mt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.05)', background: 'rgba(0,0,0,0.3)' }}>
            <div className="wc-ticker whitespace-nowrap inline-block">
              {[0, 1].map(i => (
                <span key={i} className="text-[10px] font-black uppercase tracking-[0.3em] text-yellow-400/20 px-2">
                  ⚽&nbsp; WORLD CUP 2026 &nbsp;·&nbsp; TABELE &nbsp;·&nbsp; UNESI PAR &nbsp;·&nbsp; SREĆNO &nbsp;·&nbsp; USA · CANADA · MEXICO &nbsp;·&nbsp; KICK OFF JUNI 2026 &nbsp;·&nbsp;
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
