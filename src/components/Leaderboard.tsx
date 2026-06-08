"use client";
import { useEffect, useState, useMemo } from 'react';
import { AllPlayersData, PLAYERS } from '../types';
// 👇 1. IMPORT SUPABASE TO FETCH PREDICTIONS
import { supabase } from '../lib/supabase';

interface Props {
  allBets: AllPlayersData;
  onBack: () => void;
  onPlayerClick: (playerName: string) => void;
  onViewStats: () => void;
}

const PLAYER_THEMES: Record<string, { text: string, border: string, icon: string, hex: string }> = {
  "Vlado":  { text: "text-blue-500",   border: "border-blue-500",   icon: "/Avatars/vlado.jpg",  hex: "#3b82f6" },
  "Fika":   { text: "text-red-500",    border: "border-red-500",    icon: "/Avatars/fika.jpg",   hex: "#ef4444" },
  "Labud":  { text: "text-green-500",  border: "border-green-500",  icon: "/Avatars/labud.jpg",  hex: "#22c55e" },
  "Ilija":  { text: "text-purple-500", border: "border-purple-500", icon: "/Avatars/ilija.jpg",  hex: "#a855f7" },
  "Dzoni":  { text: "text-yellow-500", border: "border-yellow-500", icon: "/Avatars/dzoni.jpg",  hex: "#eab308" },
};

export default function Leaderboard({ allBets, onBack, onPlayerClick, onViewStats }: Props) {
  const [mounted, setMounted] = useState(false);
  
  // 👇 2. STATE FOR PREDICTIONS
  const [predictionsData, setPredictionsData] = useState<any[]>([]);

  useEffect(() => {
    // Fetch all locked predictions for the leaderboard calculation
    const fetchPredictions = async () => {
      const { data } = await supabase.from('wc_predictions').select('player, predictions');
      if (data) setPredictionsData(data);
    };
    fetchPredictions();

    const t = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(t);
  }, []);

  const { playerStats, biggestOdd, mostWins } = useMemo(() => {
    // ========================================================================
    // 🏆 REAL RESULTS CONFIGURATION (UPDATE THIS WHEN THE TOURNAMENT HAPPENS)
    // ========================================================================
    const REAL_RESULTS = {
      // Grupe moraju biti EXACT string sa emojijem (npr: "🇲🇽 Meksiko") jer se to vuče iz Drag&Drop-a
      groups: {
        A: ["🇲🇽 Meksiko", "🇿🇦 Južna Afrika", "🇰🇷 Južna Koreja", "🇨🇿 Češka"],
        B: ["🇨🇦 Kanada", "🇧🇦 Bosna i Hercegovina", "🇶🇦 Katar", "🇨🇭 Švajcarska"],
        C: ["🇧🇷 Brazil", "🇲🇦 Maroko", "🇭🇹 Haiti", "🏴󠁧󠁢󠁳󠁣󠁴󠁿 Škotska"],
        D: ["🇺🇸 SAD", "🇵🇾 Paragvaj", "🇦🇺 Australija", "🇹🇷 Turska"],
        E: ["🇩🇪 Nemačka", "🇨🇼 Kurasao", "🇨🇮 Obala Slonovače", "🇪🇨 Ekvador"],
        F: ["🇳🇱 Holandija", "🇯🇵 Japan", "🇸🇪 Švedska", "🇹🇳 Tunis"],
        G: ["🇧🇪 Belgija", "🇪🇬 Egipat", "🇮🇷 Iran", "🇳🇿 Novi Zeland"],
        H: ["🇪🇸 Španija", "🇨🇻 Zelenortska Ostrva", "🇸🇦 Saudijska Arabija", "🇺🇾 Urugvaj"],
        I: ["🇫🇷 Francuska", "🇸🇳 Senegal", "🇮🇶 Irak", "🇳🇴 Norveška"],
        J: ["🇦🇷 Argentina", "🇩🇿 Alžir", "🇦🇹 Austrija", "🇯🇴 Jordan"],
        K: ["🇵🇹 Portugal", "🇨🇩 DR Kongo", "🇺🇿 Uzbekistan", "🇨🇴 Kolumbija"],
        L: ["🏴󠁧󠁢󠁥󠁮󠁧󠁿 Engleska", "🇭🇷 Hrvatska", "🇬🇭 Gana", "🇵🇦 Panama"],
      } as Record<string, string[]>,

      // Polufinalisti, pobednik i kopačka se unose slobodno, pa je provera CASE-INSENSITIVE
      semis: ["SAD","Brazil", "Francuska", "Holandija"] as string[], // npr: ["SAD", "Brazil", "Francuska", "Holandija"]
      winner: "Brazil",            // npr: "Brazil"
      goldenBoot: "Mbappe"         // npr: "Mbappe"
    };

    // Helper za ignorisanje velikih/malih slova kod ručno unesenih tekstova (Brazil == brazil)
    const normalize = (s: string) => s?.trim().toLowerCase() || "";

    // -- Korak A: Izračunaj ko ima najviše pogođenih pozicija u grupama --
    const playerGroupHits: Record<string, number> = {};
    let hasAnyGroupResults = false;

    predictionsData.forEach(user => {
      let hits = 0;
      Object.keys(REAL_RESULTS.groups).forEach(gLetter => {
        const realGroup = REAL_RESULTS.groups[gLetter];
        const predGroup = user.predictions.groups?.[gLetter] || [];
        // Ako smo uneli rezultate za ovu grupu (mora imati 4 tima)
        if (realGroup.length === 4) {
          hasAnyGroupResults = true;
          for(let i = 0; i < 4; i++) {
            if (predGroup[i] === realGroup[i]) hits++;
          }
        }
      });
      playerGroupHits[user.player] = hits;
    });

    const maxGroupHits = Math.max(0, ...Object.values(playerGroupHits));

    // -- Korak B: Kalkulacija tiketa i prognoza --
    let biggestOdd = { player: "---", odds: 0, match: "No Wins Yet" };
    let mostWins   = { player: "---", count: 0 };

    const playerStats = PLAYERS.map(player => {
      const rows = allBets[player] || [];
      let totalScore = 0, winCount = 0, pendingCount = 0;
      const allMatches = rows.flatMap(r => [r.match1, r.match2]);

      // 1. Dnevni Tiketi
      allMatches.forEach(m => {
        if (m.status === 'win') {
          totalScore += m.odds;
          winCount++;
          if (m.odds > biggestOdd.odds) biggestOdd = { player, odds: m.odds, match: m.name };
        }
        if (m.status === 'pending') pendingCount++;
      });

      // 2. Prognoze (Bonus Poeni)
      const userPredRow = predictionsData.find(p => p.player === player);
      let predictionPoints = 0;

      if (userPredRow && userPredRow.predictions) {
         const preds = userPredRow.predictions;
         
         // Polufinalisti (+0.5 ea)
         preds.semis?.forEach((team: string) => {
           if (team && REAL_RESULTS.semis.map(normalize).includes(normalize(team))) predictionPoints += 0.5;
         });
         
         // Osvajač (+2)
         if (preds.winner && normalize(preds.winner) === normalize(REAL_RESULTS.winner)) predictionPoints += 2;
         
         // Kopačka (+2)
         if (preds.goldenBoot && normalize(preds.goldenBoot) === normalize(REAL_RESULTS.goldenBoot)) predictionPoints += 2;

         // Grupe (+3 za najboljeg, +1 za ostale koji su učestvovali)
         if (hasAnyGroupResults) {
           if (playerGroupHits[player] === maxGroupHits && maxGroupHits > 0) {
             predictionPoints += 3;
           } else {
             predictionPoints += 1;
           }
         }
      }

      // Dodaj bonus poene na ukupan skor
      totalScore += predictionPoints;

      if (winCount > mostWins.count) mostWins = { player, count: winCount };

      const recentForm = allMatches
        .filter(m => m.status === 'win' || m.status === 'loss')
        .slice(-5).reverse();

      return { 
        name: player, 
        score: parseFloat(totalScore.toFixed(2)), 
        form: recentForm, 
        pendingCount, 
        predictionPoints // 👈 Passed down to UI
      };
    }).sort((a, b) => b.score - a.score);

    return { playerStats, biggestOdd, mostWins };
  }, [allBets, predictionsData]); // Re-run when bets OR predictions change

  const [first, second, third, ...chasers] = playerStats;

  const gapTo = (
    target:    typeof playerStats[0] | undefined,
    reference: typeof playerStats[0] | undefined,
  ) => {
    if (!target || !reference) return null;
    const diff = parseFloat((reference.score - target.score).toFixed(2));
    return diff > 0 ? diff : null;
  };

  return (
    <>
      <style>{`
        @keyframes podium-rise {
          from { transform: translateY(60px); opacity: 0; }
          to   { transform: translateY(0);    opacity: 1; }
        }
        @keyframes avatar-drop {
          0%   { transform: translateY(-40px) scale(0.8); opacity: 0; }
          70%  { transform: translateY(4px) scale(1.05);  opacity: 1; }
          100% { transform: translateY(0) scale(1);        opacity: 1; }
        }
        @keyframes crown-pulse {
          0%, 100% { transform: scale(1) rotate(-5deg);  filter: drop-shadow(0 0 4px rgba(250,204,21,0.4)); }
          50%       { transform: scale(1.25) rotate(5deg); filter: drop-shadow(0 0 12px rgba(250,204,21,0.9)); }
        }
        .crown-anim { animation: crown-pulse 2s ease-in-out infinite; display: inline-block; }
      `}</style>

      <div
        className="min-h-screen p-4 md:p-8 font-sans text-white relative overflow-hidden"
        style={{ background: 'linear-gradient(165deg, #05091a 0%, #080d20 45%, #040810 100%)' }}
      >
        {/* WC background layers */}
        <div className="fixed inset-0 wc-jersey-bg pointer-events-none" />
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          <div className="wc-beam-l absolute" style={{ top: 0, left: '18%', width: '240px', height: '65vh', background: 'linear-gradient(178deg, rgba(250,204,21,0.14) 0%, transparent 80%)', transformOrigin: 'top center', filter: 'blur(42px)' }} />
          <div className="wc-beam-r absolute" style={{ top: 0, right: '18%', width: '240px', height: '65vh', background: 'linear-gradient(178deg, rgba(250,204,21,0.14) 0%, transparent 80%)', transformOrigin: 'top center', filter: 'blur(42px)' }} />
          <div style={{ position: 'absolute', top: '-70px', left: '50%', transform: 'translateX(-50%)', width: '650px', height: '420px', background: 'radial-gradient(ellipse at top, rgba(250,204,21,0.06) 0%, transparent 65%)' }} />
          <div style={{ position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '80vw', height: '28vh', background: 'radial-gradient(ellipse at bottom, rgba(34,197,94,0.05) 0%, transparent 70%)' }} />
        </div>
        <div className="fixed inset-0 pointer-events-none select-none overflow-hidden">
          <span className="wc-float      absolute text-5xl" style={{ opacity: 0.05, top: '18%',    left: '2%'  }}>⚽</span>
          <span className="wc-float-slow absolute text-8xl" style={{ opacity: 0.04, bottom: '15%', right: '1%' }}>⚽</span>
          <span className="wc-float-med  absolute text-3xl" style={{ opacity: 0.06, top: '50%',    right: '4%' }}>⚽</span>
        </div>

        {/* HEADER */}
        <div className="relative z-10 flex justify-between items-center mb-8">
          <button onClick={onBack} className="bg-white/10 hover:bg-white/20 px-4 py-2 rounded-xl border border-white/10 transition-all text-xs font-bold uppercase tracking-widest">
            ← Menu
          </button>
          <div className="text-center">
            <h2 className="text-sm font-bold text-yellow-400 uppercase tracking-widest">WORLD CUP 2026</h2>
            <h1 className="text-2xl md:text-4xl font-black italic uppercase tracking-tighter">Podijum</h1>
          </div>
          <button
            onClick={onViewStats}
            className="bg-yellow-400/10 hover:bg-yellow-400/20 text-yellow-400 px-4 py-2 rounded-xl border border-yellow-400/30 transition-all text-xs font-bold uppercase tracking-widest shadow-[0_0_15px_rgba(250,204,21,0.1)]"
          >
            Stats →
          </button>
        </div>

        <div className="max-w-4xl mx-auto relative z-10">

          {/* PODIUM */}
          <div className="flex justify-center items-end gap-2 md:gap-6 mb-4 min-h-[350px] pb-4">
            {second && (
              <PodiumItem rank={2} data={second} theme={PLAYER_THEMES[second.name]}
                height="h-48 md:h-64" color="border-gray-300" badge="🥈"
                gapToAbove={gapTo(second, first)} mounted={mounted} delay="0.15s"
                onClick={() => onPlayerClick(second.name)} />
            )}
            {first && (
              <PodiumItem rank={1} data={first} theme={PLAYER_THEMES[first.name]}
                height="h-60 md:h-80" color="border-yellow-400" badge="👑" isWinner
                mounted={mounted} delay="0s" onClick={() => onPlayerClick(first.name)} />
            )}
            {third && (
              <PodiumItem rank={3} data={third} theme={PLAYER_THEMES[third.name]}
                height="h-40 md:h-52" color="border-orange-600" badge="🥉"
                gapToAbove={gapTo(third, second)} mounted={mounted} delay="0.25s"
                onClick={() => onPlayerClick(third.name)} />
            )}
          </div>

          {/* ACHIEVEMENTS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            <div className="flex items-center gap-4 p-4 rounded-2xl relative overflow-hidden flex-grow"
              style={{ background: 'linear-gradient(135deg, rgba(168,85,247,0.15) 0%, rgba(0,0,0,0.5) 100%)', border: '1px solid rgba(168,85,247,0.25)' }}>
              <div className="absolute top-0 right-0 p-4 opacity-10 text-6xl rotate-12 select-none">🎯</div>
              <div className="w-12 h-12 rounded-full border-2 border-purple-500 overflow-hidden shrink-0 z-10 bg-gray-900">
                {biggestOdd.player !== "---" && <img src={PLAYER_THEMES[biggestOdd.player].icon} className="w-full h-full object-cover" alt="" />}
              </div>
              <div className="z-10">
                <div className="text-[10px] font-bold text-purple-400 uppercase tracking-widest">Sniper Sezone</div>
                <div className="text-xl font-black uppercase italic">{biggestOdd.player}</div>
                <div className="text-xs text-gray-400 truncate max-w-[200px]">{biggestOdd.match}</div>
              </div>
              <div className="ml-auto text-right z-10">
                <div className="text-3xl font-black text-purple-400">{biggestOdd.odds.toFixed(2)}</div>
              </div>
            </div>

            <div className="flex items-center gap-4 p-4 rounded-2xl relative overflow-hidden"
              style={{ background: 'linear-gradient(135deg, rgba(34,197,94,0.15) 0%, rgba(0,0,0,0.5) 100%)', border: '1px solid rgba(34,197,94,0.25)' }}>
              <div className="absolute top-0 right-0 p-4 opacity-10 text-6xl rotate-12 select-none">🔥</div>
              <div className="w-12 h-12 rounded-full border-2 border-green-500 overflow-hidden shrink-0 z-10 bg-gray-900">
                {mostWins.player !== "---" && <img src={PLAYER_THEMES[mostWins.player].icon} className="w-full h-full object-cover" alt="" />}
              </div>
              <div className="z-10">
                <div className="text-[10px] font-bold text-green-400 uppercase tracking-widest">Hasler</div>
                <div className="text-xl font-black uppercase italic">{mostWins.player}</div>
                <div className="text-xs text-gray-400">Konstantni Performans</div>
              </div>
              <div className="ml-auto text-right z-10">
                <div className="text-3xl font-black text-green-400">{mostWins.count}</div>
                <div className="text-[8px] uppercase font-bold tracking-widest text-green-600">Ubodenih</div>
              </div>
            </div>
          </div>

          {/* CHASERS */}
          <div className="flex flex-col gap-3 pb-8">
            <div className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 pl-2">Jahači</div>
            {chasers.map((rank, index) => {
              const pt  = PLAYER_THEMES[rank.name];
              const gap = gapTo(rank, playerStats[index + 2]);
              return (
                <div
                  key={rank.name}
                  onClick={() => onPlayerClick(rank.name)}
                  className="flex items-center p-4 rounded-2xl hover:scale-[1.01] cursor-pointer transition-all"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
                >
                  <div className="w-8 text-xl font-black text-gray-500 italic">#{index + 4}</div>
                  <div className={`w-12 h-12 rounded-full border-2 ${pt.border} overflow-hidden mx-4 bg-gray-900`}>
                    <img src={pt.icon} alt={rank.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-grow">
                    <div className={`text-lg font-black uppercase tracking-tight ${pt.text}`}>{rank.name}</div>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex gap-1">
                        {rank.form.map((p: any, i: number) => (
                          <div key={i} className={`w-1.5 h-1.5 rounded-full ${p.status === 'win' ? 'bg-green-500' : 'bg-red-500'}`} />
                        ))}
                      </div>
                      {gap !== null && (
                        <span className="text-[9px] font-bold text-gray-600 uppercase tracking-wider">-{gap} pts</span>
                      )}
                    </div>
                  </div>
                  <div className="text-right flex flex-col items-end gap-1">
                    <span className="block text-2xl font-black text-white">{rank.score.toFixed(2)}</span>
                    <div className="flex items-center gap-2">
                      {rank.predictionPoints > 0 && (
                         <span className="text-[9px] font-bold text-purple-400 uppercase tracking-widest">+{rank.predictionPoints} Prognoze</span>
                      )}
                      {rank.pendingCount > 0 && (
                        <span className="text-[9px] font-bold text-orange-400 uppercase tracking-widest">{rank.pendingCount} pending</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* TICKER */}
        <div className="relative z-10 w-full overflow-hidden py-2" style={{ borderTop: '1px solid rgba(255,255,255,0.05)', background: 'rgba(0,0,0,0.3)' }}>
          <div className="wc-ticker whitespace-nowrap inline-block">
            {[0, 1].map(i => (
              <span key={i} className="text-[10px] font-black uppercase tracking-[0.3em] text-yellow-400/20 px-2">
                🏆&nbsp; WORLD CUP 2026 &nbsp;·&nbsp; PODIJUM &nbsp;·&nbsp; KO JE ŠAMPION &nbsp;·&nbsp; RANG LISTA &nbsp;·&nbsp; KICK OFF JUNI 2026 &nbsp;·&nbsp; TAKMIČENJE EDITION &nbsp;·&nbsp;
              </span>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

function PodiumItem({ rank, data, theme, height, color, badge, isWinner = false, gapToAbove, mounted, delay, onClick }: any) {
  return (
    <div
      onClick={onClick}
      className="flex flex-col items-center group w-1/3 max-w-[140px] md:max-w-none cursor-pointer"
      style={{ animation: mounted ? `podium-rise 0.6s cubic-bezier(0.22,1,0.36,1) ${delay} both` : 'none', opacity: mounted ? undefined : 0 }}
    >
      <div
        className={`flex flex-col items-center mb-8 md:mb-14 ${isWinner ? 'scale-110 md:scale-125' : 'scale-90 md:scale-100'}`}
        style={{ animation: mounted ? `avatar-drop 0.55s cubic-bezier(0.22,1,0.36,1) calc(${delay} + 0.2s) both` : 'none', opacity: mounted ? undefined : 0 }}
      >
        <div className={`text-2xl md:text-4xl mb-[-10px] z-20 drop-shadow-lg ${isWinner ? 'crown-anim' : ''}`}>{badge}</div>
        <div className={`w-16 h-16 md:w-24 md:h-24 rounded-full border-4 ${color} shadow-2xl overflow-hidden relative z-10 bg-gray-900`}>
          <img src={theme.icon} alt={data.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" />
        </div>
        <div className={`mt-3 text-sm md:text-xl font-black uppercase tracking-widest ${theme.text} bg-black/60 px-3 py-1 rounded-lg backdrop-blur-sm border border-white/10 shadow-lg`}>
          {data.name}
        </div>
      </div>

      <div
        className={`w-full ${height} rounded-t-2xl border-x border-t relative flex flex-col justify-start items-center pt-4 backdrop-blur-sm hover:scale-[1.02] transition-transform`}
        style={isWinner ? {
          background: 'linear-gradient(to top, rgba(161,120,6,0.2), rgba(234,179,8,0.05))',
          borderColor: 'rgba(234,179,8,0.5)',
          boxShadow: '0 0 30px rgba(234,179,8,0.1)',
        } : {
          background: `linear-gradient(to top, ${theme.hex}18, ${theme.hex}05)`,
          borderColor: `${theme.hex}40`,
          boxShadow: `0 0 25px ${theme.hex}15`,
        }}
      >
        <AnimatedScore target={data.score} isWinner={isWinner} mounted={mounted} delay={delay} />
        <span className="text-[10px] md:text-xs font-bold text-white/30 uppercase tracking-[0.2em] mb-2">Poena</span>
        
        {/* 👇 3. DISPLAY PREDICTION POINTS BADGE ON PODIUM */}
        {data.predictionPoints > 0 && (
          <div className="mb-2 px-2 py-0.5 bg-purple-500/20 border border-purple-500/30 rounded-full flex items-center shadow-[0_0_10px_rgba(168,85,247,0.2)]">
            <span className="text-[8px] md:text-[9px] font-black text-purple-300 uppercase tracking-widest">+{data.predictionPoints} Prognoze</span>
          </div>
        )}

        {gapToAbove !== null && gapToAbove !== undefined && (
          <div className="mb-2 px-2 py-0.5 bg-black/40 border border-white/10 rounded-full">
            <span className="text-[8px] md:text-[10px] font-black text-gray-500 uppercase tracking-widest">-{gapToAbove} pts</span>
          </div>
        )}

        <div className="flex gap-1.5 p-2 bg-black/40 rounded-full border border-white/5 mt-auto mb-4 z-10">
          {data.form.map((p: any, i: number) => (
            <div key={i} className={`w-2 h-2 md:w-3 md:h-3 rounded-full shadow-lg ${p.status === 'win' ? 'bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.6)]' : 'bg-red-500'}`} />
          ))}
          {data.form.length === 0 && <span className="text-[8px] text-gray-600 px-1">–</span>}
        </div>

        <div className="absolute inset-0 flex items-center justify-center text-7xl md:text-9xl font-black select-none pointer-events-none"
          style={{ opacity: 0.08, color: isWinner ? '#eab308' : theme.hex }}>
          {rank}
        </div>
      </div>
    </div>
  );
}

function AnimatedScore({ target, isWinner, mounted, delay }: { target: number, isWinner: boolean, mounted: boolean, delay: string }) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (!mounted) { setDisplay(0); return; }
    const delayMs = parseFloat(delay) * 1000 + 300;
    const timer = setTimeout(() => {
      const steps = 40, interval = 900 / steps;
      let step = 0;
      const id = setInterval(() => {
        step++;
        const eased = 1 - Math.pow(1 - step / steps, 3);
        setDisplay(parseFloat((target * eased).toFixed(2)));
        if (step >= steps) { setDisplay(target); clearInterval(id); }
      }, interval);
    }, delayMs);
    return () => clearTimeout(timer);
  }, [target, mounted, delay]);

  return (
    <span className={`text-3xl md:text-5xl font-black tracking-tighter tabular-nums ${isWinner ? 'text-yellow-400 drop-shadow-[0_0_10px_rgba(250,204,21,0.5)]' : 'text-white'}`}>
      {display.toFixed(2)}
    </span>
  );
}