import { useState, useEffect, useMemo, useCallback } from 'react';
import { AllPlayersData, PLAYERS } from '../types';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
} from 'recharts';

interface Props {
  allBets: AllPlayersData;
  onBack: () => void;
}

const PLAYER_THEMES: Record<string, { text: string; border: string; icon: string; gradient: string; hex: string }> = {
  "Vlado":  { text: "text-blue-500",   border: "border-blue-500/30",   icon: "/Avatars/vlado.jpg",  gradient: "from-blue-600 to-blue-400",    hex: "#3b82f6" },
  "Fika":   { text: "text-red-500",    border: "border-red-500/30",    icon: "/Avatars/fika.jpg",   gradient: "from-red-600 to-red-400",      hex: "#ef4444" },
  "Labud":  { text: "text-green-500",  border: "border-green-500/30",  icon: "/Avatars/labud.jpg",  gradient: "from-green-600 to-green-400",  hex: "#22c55e" },
  "Ilija":  { text: "text-purple-500", border: "border-purple-500/30", icon: "/Avatars/ilija.jpg",  gradient: "from-purple-600 to-purple-400",hex: "#a855f7" },
  "Dzoni":  { text: "text-yellow-500", border: "border-yellow-500/30", icon: "/Avatars/dzoni.jpg",  gradient: "from-yellow-600 to-yellow-400",hex: "#eab308" },
};

const tooltipStyle = {
  contentStyle: { background: '#060c1a', border: '1px solid rgba(250,204,21,0.15)', borderRadius: '12px', fontSize: '11px', fontWeight: 'bold' },
  labelStyle: { color: '#888', textTransform: 'uppercase' as const, letterSpacing: '0.1em' },
};

export default function Statistics({ allBets, onBack }: Props) {
  const [activeRadarPlayer, setActiveRadarPlayer] = useState("Vlado");
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const playerStats = useMemo(() => PLAYERS.map(player => {
    const rows = allBets[player] || [];
    let totalResolved = 0, wins = 0, totalPlayedOdds = 0, totalPlayedCount = 0, totalWonOdds = 0;
    let currentStreak = 0;
    let streakType: 'win' | 'loss' | null = null;

    const allMatches = rows.flatMap(r => [r.match1, r.match2]).filter(m => m.status !== 'empty');
    allMatches.forEach(m => {
      totalPlayedOdds += m.odds;
      totalPlayedCount++;
      if (m.status === 'win' || m.status === 'loss') {
        totalResolved++;
        if (m.status === 'win') { wins++; totalWonOdds += m.odds; }
      }
    });

    const resolved = allMatches.filter(m => m.status === 'win' || m.status === 'loss').reverse();
    for (const m of resolved) {
      if (streakType === null) { streakType = m.status as 'win' | 'loss'; currentStreak = 1; }
      else if (m.status === streakType) currentStreak++;
      else break;
    }

    return {
      player,
      hitRate:         totalResolved > 0    ? parseFloat(((wins / totalResolved) * 100).toFixed(1)) : 0,
      avgPlayed:       totalPlayedCount > 0 ? parseFloat((totalPlayedOdds / totalPlayedCount).toFixed(2)) : 0,
      avgWon:          wins > 0             ? parseFloat((totalWonOdds / wins).toFixed(2)) : 0,
      wins, totalResolved,
      totalScore:      parseFloat(totalWonOdds.toFixed(2)),
      currentStreak, streakType, totalPlayedCount,
    };
  }).sort((a, b) => b.hitRate - a.hitRate), [allBets]);

  const timelineData = useMemo(() => {
    const allDates = [...new Set(PLAYERS.flatMap(p => (allBets[p] || []).map(r => r.date)))].sort();
    const running: Record<string, number> = {};
    PLAYERS.forEach(p => running[p] = 0);
    return allDates.map(date => {
      const point: any = { date: date.slice(5) };
      PLAYERS.forEach(player => {
        const row = allBets[player]?.find(r => r.date === date);
        if (row) [row.match1, row.match2].forEach(m => {
          if (m.status === 'win') running[player] = parseFloat((running[player] + m.odds).toFixed(2));
        });
        point[player] = running[player];
      });
      return point;
    });
  }, [allBets]);

  const buildRadarData = useCallback((player: string) => {
    const s = playerStats.find(x => x.player === player);
    if (!s) return [];
    const maxScore  = Math.max(...playerStats.map(x => x.totalScore), 1);
    const maxAvgOdd = Math.max(...playerStats.map(x => x.avgPlayed), 1);
    const maxWins   = Math.max(...playerStats.map(x => x.wins), 1);
    return [
      { metric: 'Hit Rate',    value: s.hitRate },
      { metric: 'Total Score', value: parseFloat(((s.totalScore / maxScore)  * 100).toFixed(1)) },
      { metric: 'Avg Odds',    value: parseFloat(((s.avgPlayed / maxAvgOdd)  * 100).toFixed(1)) },
      { metric: 'Wins',        value: parseFloat(((s.wins / maxWins)          * 100).toFixed(1)) },
    ];
  }, [playerStats]);

  const smallestOdds = useMemo(() => {
    const all: any[] = [];
    PLAYERS.forEach(player => {
      (allBets[player] || []).forEach(row => {
        [row.match1, row.match2].forEach(m => {
          if (m.status !== 'empty') all.push({ player, odd: m.odds, name: m.name, status: m.status });
        });
      });
    });
    return [...all].sort((a, b) => a.odd - b.odd).slice(0, 5);
  }, [allBets]);

  const streakLabel = (s: typeof playerStats[0]) => {
    if (!s.streakType || s.currentStreak === 0) return <span className="text-gray-600 text-xs font-bold">–</span>;
    const isWin = s.streakType === 'win';
    return <span className={`text-xs font-black ${isWin ? 'text-green-400' : 'text-red-400'}`}>{isWin ? '🔥' : '❄️'} {s.currentStreak}{isWin ? 'W' : 'L'}</span>;
  };

  const cardStyle = { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' };

  return (
    <div
      className="min-h-screen p-4 md:p-8 font-sans text-white relative overflow-hidden"
      style={{ background: 'linear-gradient(165deg, #05091a 0%, #080d20 45%, #040810 100%)' }}
    >
      {/* WC background layers */}
      <div className="fixed inset-0 wc-jersey-bg pointer-events-none" />
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="wc-beam-l absolute" style={{ top: 0, left: '16%', width: '220px', height: '60vh', background: 'linear-gradient(178deg, rgba(250,204,21,0.12) 0%, transparent 80%)', transformOrigin: 'top center', filter: 'blur(44px)' }} />
        <div className="wc-beam-r absolute" style={{ top: 0, right: '16%', width: '220px', height: '60vh', background: 'linear-gradient(178deg, rgba(250,204,21,0.12) 0%, transparent 80%)', transformOrigin: 'top center', filter: 'blur(44px)' }} />
        <div style={{ position: 'absolute', top: '-70px', left: '50%', transform: 'translateX(-50%)', width: '600px', height: '400px', background: 'radial-gradient(ellipse at top, rgba(250,204,21,0.06) 0%, transparent 65%)' }} />
      </div>
      <div className="fixed inset-0 pointer-events-none select-none overflow-hidden">
        <span className="wc-float      absolute text-5xl" style={{ opacity: 0.04, top: '20%',    left: '2%'  }}>⚽</span>
        <span className="wc-float-slow absolute text-7xl" style={{ opacity: 0.03, bottom: '18%', right: '1%' }}>⚽</span>
      </div>

      {/* HEADER */}
      <div className="relative z-10 flex justify-between items-center mb-8 max-w-5xl mx-auto">
        <button onClick={onBack} className="bg-white/10 hover:bg-white/20 px-4 py-2 rounded-xl border border-white/10 transition-all text-xs font-bold uppercase tracking-widest">
          ← Nazad
        </button>
        <div className="text-center">
          <h2 className="text-sm font-bold text-yellow-400 uppercase tracking-widest">⚽ World Cup 2026</h2>
          <h1 className="text-2xl md:text-4xl font-black italic uppercase tracking-tighter">Statistika</h1>
        </div>
        <div className="w-[88px]" />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto space-y-8">

        {/* PLAYER STAT CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {playerStats.map((stat, idx) => {
            const p = PLAYER_THEMES[stat.player];
            return (
              <div key={stat.player} className="p-6 rounded-3xl backdrop-blur-md relative overflow-hidden hover:scale-[1.02] transition-all shadow-xl"
                style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${p.hex}30` }}>
                {idx === 0 && <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${p.gradient}`} />}
                {idx === 0 && <div className="absolute top-0 right-0 text-5xl p-3 opacity-10 select-none">🏆</div>}
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 rounded-full border-2 border-white/20 overflow-hidden bg-gray-900 shadow-lg">
                    <img src={p.icon} alt={stat.player} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1">
                    <h2 className={`text-xl font-black uppercase tracking-widest ${p.text} leading-none`}>{stat.player}</h2>
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                      {idx === 0 ? '🏆 Najveći Hit Rate' : `Rank #${idx + 1}`}
                    </span>
                  </div>
                  <div className="text-right">{streakLabel(stat)}</div>
                </div>
                <div className="space-y-3 p-4 rounded-2xl" style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <div className="flex justify-between items-center border-b border-white/5 pb-2">
                    <span className="text-[10px] text-gray-400 uppercase font-bold tracking-widest">Hit %</span>
                    <span className={`font-black ${stat.hitRate >= 50 ? 'text-green-400' : 'text-red-400'}`}>
                      {stat.hitRate}% <span className="text-[10px] text-gray-500">({stat.wins}/{stat.totalResolved})</span>
                    </span>
                  </div>
                  <div className="flex justify-between items-center border-b border-white/5 pb-2">
                    <span className="text-[10px] text-gray-400 uppercase font-bold tracking-widest">Pros. Igrana Kvota</span>
                    <span className="font-black text-white">{stat.avgPlayed}</span>
                  </div>
                  <div className="flex justify-between items-center border-b border-white/5 pb-2">
                    <span className="text-[10px] text-gray-400 uppercase font-bold tracking-widest">Pros. Pogođena Kvota</span>
                    <span className={`font-black ${p.text}`}>{stat.avgWon}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] text-gray-400 uppercase font-bold tracking-widest">Ukupno Poena</span>
                    <span className={`font-black ${idx === 0 ? 'text-yellow-400' : 'text-white'}`}>{stat.totalScore.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* SCORE OVER TIME */}
        {mounted && timelineData.length > 0 && (
          <div className="p-6 rounded-3xl backdrop-blur-md shadow-xl" style={cardStyle}>
            <div className="mb-6">
              <h3 className="text-xs font-black uppercase tracking-[0.3em] text-yellow-400/50">⚽ Napredak Sezone</h3>
              <p className="text-xl font-black uppercase italic tracking-tighter">Score Kroz Vrijeme</p>
            </div>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={timelineData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                <XAxis dataKey="date" stroke="#333" tick={{ fontSize: 10, fill: '#555' }} tickLine={false} />
                <YAxis stroke="#333" tick={{ fontSize: 10, fill: '#555' }} tickLine={false} axisLine={false} />
                <Tooltip {...tooltipStyle} />
                <Legend wrapperStyle={{ fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.1em', paddingTop: '16px' }} />
                {PLAYERS.map(p => (
                  <Line key={p} type="monotone" dataKey={p} stroke={PLAYER_THEMES[p].hex} strokeWidth={2.5} dot={false} activeDot={{ r: 5, strokeWidth: 0 }} />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* RADAR PLAYER PROFILE */}
        {mounted && (
          <div className="p-6 rounded-3xl backdrop-blur-md shadow-xl" style={cardStyle}>
            <div className="mb-6">
              <h3 className="text-xs font-black uppercase tracking-[0.3em] text-yellow-400/50">⚽ DNA Igrača</h3>
              <p className="text-xl font-black uppercase italic tracking-tighter">Player Profile</p>
            </div>
            <div className="flex gap-2 flex-wrap mb-6">
              {PLAYERS.map(p => {
                const pt = PLAYER_THEMES[p];
                const isActive = activeRadarPlayer === p;
                return (
                  <button key={p} onClick={() => setActiveRadarPlayer(p)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-xs font-black uppercase tracking-widest transition-all ${
                      isActive ? `${pt.border} bg-white/10 ${pt.text}` : 'border-white/10 text-gray-500 hover:text-white hover:bg-white/5'
                    }`}>
                    <img src={pt.icon} className="w-5 h-5 rounded-full object-cover" alt={p} />
                    {p}
                  </button>
                );
              })}
            </div>
            <div className="flex flex-col md:flex-row items-center gap-8">
              <ResponsiveContainer width="100%" height={280}>
                <RadarChart data={buildRadarData(activeRadarPlayer)} margin={{ top: 10, right: 30, bottom: 10, left: 30 }}>
                  <PolarGrid stroke="#1a2040" />
                  <PolarAngleAxis dataKey="metric" tick={{ fontSize: 10, fill: '#888', fontWeight: 'bold' }} />
                  <PolarRadiusAxis angle={90} domain={[0, 100]} tick={false} axisLine={false} />
                  <Radar name={activeRadarPlayer} dataKey="value"
                    stroke={PLAYER_THEMES[activeRadarPlayer].hex} fill={PLAYER_THEMES[activeRadarPlayer].hex}
                    fillOpacity={0.25} strokeWidth={2} />
                  <Tooltip {...tooltipStyle} formatter={(val: any) => [`${val}`, 'Score (0–100)']} />
                </RadarChart>
              </ResponsiveContainer>
              <div className="w-full md:w-56 space-y-3 shrink-0">
                {buildRadarData(activeRadarPlayer).map(d => (
                  <div key={d.metric} className="flex justify-between items-center">
                    <span className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">{d.metric}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1.5 bg-white/10 rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${d.value}%`, background: PLAYER_THEMES[activeRadarPlayer].hex }} />
                      </div>
                      <span className="text-xs font-black text-white w-8 text-right">{d.value}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* WALL OF SHAME */}
        <div className="p-6 rounded-3xl backdrop-blur-md relative overflow-hidden shadow-xl"
          style={{ background: 'linear-gradient(135deg, rgba(239,68,68,0.12) 0%, rgba(0,0,0,0.5) 100%)', border: '1px solid rgba(239,68,68,0.25)' }}>
          <div className="absolute top-0 right-0 p-4 opacity-5 text-8xl rotate-12 select-none">🤡</div>
          <div className="flex items-center gap-3 mb-6 relative z-10">
            <span className="text-3xl drop-shadow-lg">🤡</span>
            <div>
              <h3 className="text-xl font-black uppercase tracking-widest text-red-500 italic">Zid Srama</h3>
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Najmanja muda</p>
            </div>
          </div>
          <div className="space-y-3 relative z-10">
            {smallestOdds.map((match, idx) => {
              const pt = PLAYER_THEMES[match.player];
              return (
                <div key={idx} className="flex items-center justify-between p-3 md:p-4 rounded-2xl transition-colors"
                  style={{ background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <div className="flex items-center gap-4">
                    <span className="text-xl font-black text-red-500 w-12 text-center drop-shadow-[0_0_10px_rgba(239,68,68,0.4)]">{match.odd.toFixed(2)}</span>
                    <div className="w-px h-8 bg-white/10 mx-2 hidden md:block" />
                    <div className="flex flex-col">
                      <span className="text-xs md:text-sm font-bold text-white uppercase truncate max-w-[150px] md:max-w-xs">{match.name}</span>
                      <span className={`text-[10px] font-black uppercase tracking-widest ${pt.text}`}>Igrao: {match.player}</span>
                    </div>
                  </div>
                  <div className="text-2xl px-2">
                    {match.status === 'loss' ? '❌' : match.status === 'win' ? '✅' : '⏳'}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* TICKER */}
      <div className="relative z-10 w-full overflow-hidden py-2 mt-8" style={{ borderTop: '1px solid rgba(255,255,255,0.05)', background: 'rgba(0,0,0,0.3)' }}>
        <div className="wc-ticker whitespace-nowrap inline-block">
          {[0, 1].map(i => (
            <span key={i} className="text-[10px] font-black uppercase tracking-[0.3em] text-yellow-400/20 px-2">
              📊&nbsp; WORLD CUP 2026 &nbsp;·&nbsp; STATISTIKA &nbsp;·&nbsp; BROJKE NE LAŽU &nbsp;·&nbsp; HIT RATE &nbsp;·&nbsp; SNIPER SEZONE &nbsp;·&nbsp; USA · CANADA · MEXICO &nbsp;·&nbsp;
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
