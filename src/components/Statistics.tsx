"use client";
import { useState, useEffect, useMemo } from 'react';
import { AllPlayersData, PLAYERS } from '../types';
import { supabase } from '../lib/supabase'; // 👈 Imported Supabase connection
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend
} from 'recharts';

interface Props {
  allBets: AllPlayersData;
  onBack: () => void;
}

const PLAYER_THEMES: Record<string, { text: string; border: string; icon: string; gradient: string; hex: string }> = {
  "Vlado":  { text: "text-blue-500",   border: "border-blue-500/30",   icon: "/Avatars/vlado.webp",  gradient: "from-blue-600 to-blue-400",    hex: "#3b82f6" },
  "Fika":   { text: "text-red-500",    border: "border-red-500/30",    icon: "/Avatars/fika.webp",   gradient: "from-red-600 to-red-400",      hex: "#ef4444" },
  "Labud":  { text: "text-green-500",  border: "border-green-500/30",  icon: "/Avatars/labud.webp",  gradient: "from-green-600 to-green-400",  hex: "#22c55e" },
  "Ilija":  { text: "text-purple-500", border: "border-purple-500/30", icon: "/Avatars/ilija.webp",  gradient: "from-purple-600 to-purple-400",hex: "#a855f7" },
  "Dzoni":  { text: "text-yellow-500", border: "border-yellow-500/30", icon: "/Avatars/dzoni.webp",  gradient: "from-yellow-600 to-yellow-400",hex: "#eab308" },
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const sortedPayload = [...payload].sort((a, b) => b.value - a.value);

    return (
      <div className="p-2.5 rounded-2xl bg-[#05091a]/95 border border-white/10 shadow-2xl backdrop-blur-xl w-44 z-[100]">
        <p className="text-yellow-400 font-black text-[10px] uppercase tracking-[0.2em] mb-1.5 border-b border-white/10 pb-1">
          Date: {label}
        </p>
        <div className="space-y-2.5">
          {sortedPayload.map((entry: any) => {
            const player = entry.dataKey;
            const color = entry.color;
            const dailyData = entry.payload[`${player}_daily`];

            return (
              <div key={player} className="flex flex-col gap-0.5">
                <div className="flex justify-between items-end">
                  <span className="font-black text-[10px] uppercase tracking-wider" style={{ color }}>{player}</span>
                  <div className="flex items-center gap-1">
                    {dailyData.added > 0 && (
                      <span className="text-[8px] font-black text-green-400">+{dailyData.added}</span>
                    )}
                    <span className="font-black text-[10px] text-white bg-white/5 px-1 rounded">{entry.value.toFixed(2)}</span>
                  </div>
                </div>
                
                <div className="flex flex-col mt-0.5 border-l-[1.5px] pl-1.5" style={{ borderColor: `${color}40` }}>
                  {dailyData.details.map((detail: string, i: number) => (
                    <span key={i} className="text-[7.5px] leading-tight text-gray-400 font-bold truncate uppercase tracking-wide">
                      {detail}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }
  return null;
};

export default function Statistics({ allBets, onBack }: Props) {
  const [mounted, setMounted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // 👇 STATE FOR LIKES & DISLIKES LEADERBOARD
  const [reactionStats, setReactionStats] = useState({
    mostLiked: "Učitavanje...",
    mostDisliked: "Učitavanje...",
    maxLikes: 0,
    maxDislikes: 0
  });

  useEffect(() => { setMounted(true); }, []);

  // 👇 FETCH REACTION LEADERS FROM DB ON MOUNT
  useEffect(() => {
    async function fetchReactionLeaderboards() {
      const { data, error } = await supabase
        .from('pick_reactions')
        .select('target_player, reaction_type');

      if (error || !data) {
        console.error("Error fetching reaction stats:", error);
        setReactionStats({ mostLiked: "---", mostDisliked: "---", maxLikes: 0, maxDislikes: 0 });
        return;
      }

      const playerStats: Record<string, { likes: number; dislikes: number }> = {};

      data.forEach((row) => {
        if (!playerStats[row.target_player]) {
          playerStats[row.target_player] = { likes: 0, dislikes: 0 };
        }
        if (row.reaction_type === 'like') {
          playerStats[row.target_player].likes++;
        } else if (row.reaction_type === 'dislike') {
          playerStats[row.target_player].dislikes++;
        }
      });

      let mostLiked = "Niko još";
      let mostDisliked = "Niko još";
      let maxLikes = 0;
      let maxDislikes = 0;

      Object.entries(playerStats).forEach(([player, counts]) => {
        if (counts.likes > maxLikes) {
          maxLikes = counts.likes;
          mostLiked = player;
        }
        if (counts.dislikes > maxDislikes) {
          maxDislikes = counts.dislikes;
          mostDisliked = player;
        }
      });

      setReactionStats({ mostLiked, mostDisliked, maxLikes, maxDislikes });
    }
    
    fetchReactionLeaderboards();
  }, []);

  useEffect(() => {
    if (isFullscreen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isFullscreen]);

  // ── STATS & ALL-TIME HISTORICAL STREAKS CALCULATION ──
  const playerStats = useMemo(() => {
    const stats = PLAYERS.map(player => {
      const rows = allBets[player] || [];
      let totalResolved = 0, wins = 0, totalPlayedOdds = 0, totalPlayedCount = 0, totalWonOdds = 0;
      let perfectDays = 0;
      
      let maxWinStreak = 0;
      let maxLossStreak = 0;
      let currentWinCount = 0;
      let currentLossCount = 0;

      rows.forEach(row => {
        if (row.match1 && row.match2 && row.match1.status === 'win' && row.match2.status === 'win') {
          perfectDays++;
        }
      });

      const allMatches = rows.flatMap(r => [r.match1, r.match2]).filter(m => m.status !== 'empty');
      
      allMatches.forEach(m => {
        totalPlayedOdds += m.odds;
        totalPlayedCount++;
        if (m.status === 'win' || m.status === 'loss') {
          totalResolved++;
          if (m.status === 'win') { 
            wins++; 
            totalWonOdds += m.odds; 
          }
        }
      });

      const chronologicalMatches = allMatches.filter(m => m.status === 'win' || m.status === 'loss');
      
      chronologicalMatches.forEach(m => {
        if (m.status === 'win') {
          currentWinCount++;
          currentLossCount = 0;
          if (currentWinCount > maxWinStreak) maxWinStreak = currentWinCount;
        } else if (m.status === 'loss') {
          currentLossCount++;
          currentWinCount = 0;
          if (currentLossCount > maxLossStreak) maxLossStreak = currentLossCount;
        }
      });

      let activeCount = 0;
      let activeType: 'win' | 'loss' | null = null;
      const reversedMatches = [...chronologicalMatches].reverse();
      for (const m of reversedMatches) {
        if (activeType === null) { activeType = m.status as 'win' | 'loss'; activeCount = 1; }
        else if (m.status === activeType) activeCount++;
        else break;
      }

      return {
        player,
        hitRate:         totalResolved > 0    ? parseFloat(((wins / totalResolved) * 100).toFixed(1)) : 0,
        avgPlayed:       totalPlayedCount > 0 ? parseFloat((totalPlayedOdds / totalPlayedCount).toFixed(2)) : 0,
        avgWon:          wins > 0             ? parseFloat((totalWonOdds / wins).toFixed(2)) : 0,
        wins, totalResolved,
        totalScore:      parseFloat(totalWonOdds.toFixed(2)),
        maxWinStreak, maxLossStreak, activeCount, activeType,
        perfectDays
      };
    }).sort((a, b) => b.hitRate - a.hitRate);

    const historicalWinStreaks = stats.map(s => s.maxWinStreak);
    const allTimeHighWin = historicalWinStreaks.length > 0 ? Math.max(...historicalWinStreaks) : -1;

    const historicalLossStreaks = stats.map(s => s.maxLossStreak);
    const allTimeHighLoss = historicalLossStreaks.length > 0 ? Math.max(...historicalLossStreaks) : -1;

    const avgWonArr = stats.map(s => s.avgWon).filter(v => v > 0);
    const maxAvgWon = avgWonArr.length > 0 ? Math.max(...avgWonArr) : -1;

    const perfectDaysArr = stats.map(s => s.perfectDays);
    const maxPerfectDays = perfectDaysArr.length > 0 ? Math.max(...perfectDaysArr) : -1;

    return stats.map(s => ({
      ...s,
      isKamikaze: s.avgWon === maxAvgWon && maxAvgWon > 0,
      isRetard: s.maxWinStreak === allTimeHighWin && allTimeHighWin > 1,
      isJadnik: s.maxLossStreak === allTimeHighLoss && allTimeHighLoss > 1,
      isBoomMaster: s.perfectDays === maxPerfectDays && maxPerfectDays > 0
    }));
  }, [allBets]);

  const retardi = playerStats.filter(s => s.isRetard);
  const jadnici = playerStats.filter(s => s.isJadnik);
  const boomMasters = playerStats.filter(s => s.isBoomMaster);

  // ── TIMELINE DATA ──
  const timelineData = useMemo(() => {
    const allDates = [...new Set(PLAYERS.flatMap(p => (allBets[p] || []).map(r => r.date)))].sort();
    const running: Record<string, number> = {};
    PLAYERS.forEach(p => running[p] = 0);
    
    return allDates.map(date => {
      const point: any = { date: date.slice(5) }; 
      
      PLAYERS.forEach(player => {
        const row = allBets[player]?.find(r => r.date === date);
        let dailyWins = 0;
        let dailyDetails: string[] = [];

        if (row) {
          [row.match1, row.match2].forEach(m => {
            if (m.status === 'win') {
              running[player] += m.odds;
              dailyWins += m.odds;
              dailyDetails.push(`✅ ${m.name} (${m.odds.toFixed(2)})`);
            } else if (m.status === 'loss') {
              dailyDetails.push(`❌ ${m.name}`);
            } else if (m.status === 'pending') {
              dailyDetails.push(`⏳ ${m.name} (Wait)`);
            }
          });
        }

        point[player] = parseFloat(running[player].toFixed(2));
        point[`${player}_daily`] = {
          added: parseFloat(dailyWins.toFixed(2)),
          details: dailyDetails.length > 0 ? dailyDetails : ['No picks logged']
        };
      });
      return point;
    });
  }, [allBets]);

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
    if (!s.activeType || s.activeCount === 0) return <span className="text-gray-600 text-[10px] font-bold">–</span>;
    const isWin = s.activeType === 'win';
    return <span className={`text-[10px] font-black ${isWin ? 'text-green-400' : 'text-red-400'}`}>{isWin ? '🔥' : '❄️'} {s.activeCount}{isWin ? 'W' : 'L'}</span>;
  };

  const cardStyle = { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' };

  const renderRaceChart = (chartHeight: number) => (
    <ResponsiveContainer width="100%" height={chartHeight}>
      <AreaChart data={timelineData} margin={{ top: 10, right: 5, left: -25, bottom: 0 }}>
        <defs>
          {PLAYERS.map(p => (
            <linearGradient key={p} id={`color_${p}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={PLAYER_THEMES[p].hex} stopOpacity={0.4} />
              <stop offset="95%" stopColor={PLAYER_THEMES[p].hex} stopOpacity={0} />
            </linearGradient>
          ))}
        </defs>
        <XAxis dataKey="date" stroke="#333" tick={{ fontSize: 9, fill: '#666', fontWeight: 'bold' }} tickLine={false} axisLine={false} />
        <YAxis stroke="#333" tick={{ fontSize: 9, fill: '#666', fontWeight: 'bold' }} tickLine={false} axisLine={false} />
        <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 1.5, strokeDasharray: '4 4' }} />
        <Legend wrapperStyle={{ fontSize: '9px', fontWeight: 'black', textTransform: 'uppercase', letterSpacing: '0.05em', paddingTop: '10px' }} iconType="circle" />
        
        {PLAYERS.map(p => (
          <Area 
            key={p} 
            type="monotone" 
            dataKey={p} 
            stroke={PLAYER_THEMES[p].hex} 
            strokeWidth={2.5} 
            fill={`url(#color_${p})`}
            activeDot={{ r: 5, strokeWidth: 2, stroke: '#05091a', fill: PLAYER_THEMES[p].hex }} 
          />
        ))}
      </AreaChart>
    </ResponsiveContainer>
  );

  return (
    <div
      className="min-h-screen p-3 md:p-6 font-sans text-white relative overflow-x-hidden overflow-y-auto pb-6"
      style={{ background: 'linear-gradient(165deg, #05091a 0%, #080d20 45%, #040810 100%)' }}
    >
      <div className="fixed inset-0 wc-jersey-bg pointer-events-none" />
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="wc-beam-l absolute" style={{ top: 0, left: '10%', width: '150px', height: '60vh', background: 'linear-gradient(178deg, rgba(250,204,21,0.12) 0%, transparent 80%)', filter: 'blur(35px)' }} />
        <div className="wc-beam-r absolute" style={{ top: 0, right: '10%', width: '150px', height: '60vh', background: 'linear-gradient(178deg, rgba(250,204,21,0.12) 0%, transparent 80%)', filter: 'blur(35px)' }} />
      </div>

      {/* HEADER */}
      <div className="relative z-10 flex justify-center items-center mb-5 max-w-6xl mx-auto pt-2">
        <div className="text-center shrink-0">
          <h2 className="text-[9px] font-black text-yellow-400 uppercase tracking-widest">⚽ World Cup</h2>
          <h1 className="text-xl font-black italic uppercase tracking-tighter">Statistika</h1>
        </div>
      </div>

      <div className="relative z-10 max-w-6xl mx-auto space-y-4">

        {/* ── 1. COMPACT PLAYER CARDS ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {playerStats.map((stat, idx) => {
            const p = PLAYER_THEMES[stat.player];
            return (
              <div key={stat.player} className="p-4 rounded-3xl backdrop-blur-md relative overflow-hidden shadow-lg flex flex-col"
                style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${p.hex}30` }}>
                
                {idx === 0 && <div className={`absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r ${p.gradient}`} />}
                
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full border-2 border-white/20 overflow-hidden bg-gray-900 shadow-md shrink-0">
                      <img src={p.icon} alt={stat.player} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex flex-col justify-center">
                      <h2 className={`text-lg font-black uppercase tracking-widest ${p.text} leading-none mb-1`}>{stat.player}</h2>
                      <div className="flex flex-wrap gap-1 items-center">
                        <span className="text-[8px] font-black text-white/60 uppercase tracking-widest bg-white/5 px-1.5 py-0.5 rounded border border-white/5">
                          #{idx + 1}
                        </span>
                        {stat.isKamikaze && (
                          <span className="text-[8px] font-black text-amber-400 uppercase tracking-widest bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                            💥 Kamikaza
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-right pt-1">{streakLabel(stat)}</div>
                </div>

                <div className="space-y-2.5 p-3 rounded-2xl mt-auto" style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.04)' }}>
                  <div className="flex justify-between items-center border-b border-white/5 pb-1.5">
                    <span className="text-[9px] text-gray-400 uppercase font-bold tracking-widest">Hit %</span>
                    <span className={`font-black text-xs ${stat.hitRate >= 50 ? 'text-green-400' : 'text-red-400'}`}>
                      {stat.hitRate}% <span className="text-[8px] text-gray-500">({stat.wins}/{stat.totalResolved})</span>
                    </span>
                  </div>
                  <div className="flex justify-between items-center border-b border-white/5 pb-1.5">
                    <span className="text-[9px] text-gray-400 uppercase font-bold tracking-widest">pros. igrana kvota</span>
                    <span className="font-black text-xs text-white">{stat.avgPlayed}</span>
                  </div>
                  <div className="flex justify-between items-center border-b border-white/5 pb-1.5">
                    <span className="text-[9px] text-gray-400 uppercase font-bold tracking-widest">pros. pogođena kvota</span>
                    <span className="font-black text-xs text-white">{stat.avgWon}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[9px] text-gray-400 uppercase font-bold tracking-widest">Total Score</span>
                    <span className={`font-black text-sm ${idx === 0 ? 'text-yellow-400' : 'text-white'}`}>{stat.totalScore.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* ── 2. NEW POPULARITY REACTION LEADERBOARDS GRID ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* MOST LIKED (❤️) PLAYER PODIUM */}
          <div className="p-4 rounded-3xl backdrop-blur-md relative overflow-hidden shadow-xl"
            style={{ background: 'linear-gradient(135deg, rgba(239,68,68,0.1) 0%, rgba(0,0,0,0.3) 100%)', border: '1px solid rgba(239,68,68,0.15)' }}>
            <div className="absolute top-0 right-0 p-3 opacity-[0.04] text-6xl rotate-12 select-none">❤️</div>
            <div className="flex items-center gap-2 mb-3 relative z-10">
              <span className="text-2xl drop-shadow-lg">❤️</span>
              <div>
                <h3 className="text-sm font-black uppercase tracking-widest text-red-400 italic">Miljenik Grupe</h3>
                <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">Najviše lajkova na parovima</p>
              </div>
            </div>
            <div className="relative z-10">
              {reactionStats.maxLikes === 0 ? (
                <div className="text-center py-2 text-[9px] uppercase font-black tracking-widest text-gray-600">Nema lajkova</div>
              ) : (
                <div className="flex items-center gap-2 bg-black/40 border border-red-500/20 p-2 rounded-xl">
                  {PLAYER_THEMES[reactionStats.mostLiked] && (
                    <img src={PLAYER_THEMES[reactionStats.mostLiked].icon} alt={reactionStats.mostLiked} className="w-8 h-8 rounded-full border border-red-500/50 shrink-0" />
                  )}
                  <div className="flex flex-col">
                    <span className="text-xs font-black text-white uppercase leading-none">{reactionStats.mostLiked}</span>
                    <span className="text-[10px] font-black text-red-400 mt-0.5">🔥 {reactionStats.maxLikes} lajkova</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* MOST DISLIKED (💔) PLAYER PODIUM */}
          <div className="p-4 rounded-3xl backdrop-blur-md relative overflow-hidden shadow-xl"
            style={{ background: 'linear-gradient(135deg, rgba(168,85,247,0.1) 0%, rgba(0,0,0,0.3) 100%)', border: '1px solid rgba(168,85,247,0.15)' }}>
            <div className="absolute top-0 right-0 p-3 opacity-[0.04] text-6xl rotate-12 select-none">💔</div>
            <div className="flex items-center gap-2 mb-3 relative z-10">
              <span className="text-2xl drop-shadow-lg">💔</span>
              <div>
                <h3 className="text-sm font-black uppercase tracking-widest text-purple-400 italic">Dežurni Degenerik</h3>
                <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">Najviše dislajkovani tiketi</p>
              </div>
            </div>
            <div className="relative z-10">
              {reactionStats.maxDislikes === 0 ? (
                <div className="text-center py-2 text-[9px] uppercase font-black tracking-widest text-gray-600">Nema dislajkova</div>
              ) : (
                <div className="flex items-center gap-2 bg-black/40 border border-purple-500/20 p-2 rounded-xl">
                  {PLAYER_THEMES[reactionStats.mostDisliked] && (
                    <img src={PLAYER_THEMES[reactionStats.mostDisliked].icon} alt={reactionStats.mostDisliked} className="w-8 h-8 rounded-full border border-purple-500/50 shrink-0" />
                  )}
                  <div className="flex flex-col">
                    <span className="text-xs font-black text-white uppercase leading-none">{reactionStats.mostDisliked}</span>
                    <span className="text-[10px] font-black text-purple-400 mt-0.5">🤡 {reactionStats.maxDislikes} dislajkova</span>
                  </div>
                </div>
              )}
            </div>
          </div>

        </div>

        {/* ── 3. STANDARD INLINE VIEWPORT CHART CONTAINER ── */}
        {mounted && timelineData.length > 0 && (
          <div className="p-4 rounded-3xl backdrop-blur-md shadow-xl" style={cardStyle}>
            <div className="mb-4 flex justify-between items-center">
              <div>
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-yellow-400/50">⚽ Tok</h3>
                <p className="text-lg font-black uppercase italic tracking-tighter leading-none">Trka za titulu</p>
              </div>
              <button
                onClick={() => setIsFullscreen(true)}
                className="p-2 rounded-xl bg-white/5 border border-white/10 text-xs font-black hover:bg-white/10 active:scale-95 transition-all text-yellow-400"
                title="Fullscreen Mode"
              >
                ⛶ Fullscreen
              </button>
            </div>
            
            <div className="w-full -ml-4 pr-2">
              {renderRaceChart(260)}
            </div>
          </div>
        )}

        {/* ── 4. HISTORICAL ALL-TIME AWARDS SECTIONS ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          
          {/* ALL TIME WIN STREAK PODIUM */}
          <div className="p-4 rounded-3xl backdrop-blur-md relative overflow-hidden shadow-xl"
            style={{ background: 'linear-gradient(135deg, rgba(34,197,94,0.1) 0%, rgba(0,0,0,0.3) 100%)', border: '1px solid rgba(34,197,94,0.15)' }}>
            <div className="absolute top-0 right-0 p-3 opacity-[0.04] text-6xl rotate-12 select-none">🍀</div>
            <div className="flex items-center gap-2 mb-3 relative z-10">
              <span className="text-2xl drop-shadow-lg">🍀</span>
              <div>
                <h3 className="text-sm font-black uppercase tracking-widest text-green-400 italic">Retard</h3>
                <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">Najviše pogodaka zaredom.</p>
              </div>
            </div>
            <div className="relative z-10">
              {retardi.length === 0 ? (
                <div className="text-center py-2 text-[9px] uppercase font-black tracking-widest text-gray-600">Nema zaređanih</div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {retardi.map(r => (
                    <div key={r.player} className="flex items-center gap-2 bg-black/40 border border-green-500/20 p-2 rounded-xl flex-1 min-w-[120px]">
                      <img src={PLAYER_THEMES[r.player].icon} alt={r.player} className="w-8 h-8 rounded-full border border-green-500/50 shrink-0" />
                      <div className="flex flex-col">
                        <span className="text-xs font-black text-white uppercase leading-none">{r.player}</span>
                        <span className="text-[10px] font-black text-green-400 mt-0.5">🏆 {r.maxWinStreak} tipova</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ALL TIME LOSS STREAK PODIUM */}
          <div className="p-4 rounded-3xl backdrop-blur-md relative overflow-hidden shadow-xl"
            style={{ background: 'linear-gradient(135deg, rgba(168,85,247,0.1) 0%, rgba(0,0,0,0.3) 100%)', border: '1px solid rgba(168,85,247,0.15)' }}>
            <div className="absolute top-0 right-0 p-3 opacity-[0.04] text-6xl rotate-12 select-none">😭</div>
            <div className="flex items-center gap-2 mb-3 relative z-10">
              <span className="text-2xl drop-shadow-lg">😭</span>
              <div>
                <h3 className="text-sm font-black uppercase tracking-widest text-purple-400 italic">Najveći Jadnik</h3>
                <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">Najviše promašenih zaredom</p>
              </div>
            </div>
            <div className="relative z-10">
              {jadnici.length === 0 ? (
                <div className="text-center py-2 text-[9px] uppercase font-black tracking-widest text-gray-600">Nema losih streakova</div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {jadnici.map(j => (
                    <div key={j.player} className="flex items-center gap-2 bg-black/40 border border-purple-500/20 p-2 rounded-xl flex-1 min-w-[120px]">
                      <img src={PLAYER_THEMES[j.player].icon} alt={j.player} className="w-8 h-8 rounded-full border border-purple-500/50 grayscale shrink-0" />
                      <div className="flex flex-col">
                        <span className="text-xs font-black text-white uppercase leading-none">{j.player}</span>
                        <span className="text-[10px] font-black text-purple-400 mt-0.5">❌ {j.maxLossStreak} tipova</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* 🚀 MAX PERFECT DAYS (BOOM) PODIUM */}
          <div className="p-4 rounded-3xl backdrop-blur-md relative overflow-hidden shadow-xl"
            style={{ background: 'linear-gradient(135deg, rgba(234,179,8,0.1) 0%, rgba(0,0,0,0.3) 100%)', border: '1px solid rgba(234,179,8,0.15)' }}>
            <div className="absolute top-0 right-0 p-3 opacity-[0.04] text-6xl rotate-12 select-none">🚀</div>
            <div className="flex items-center gap-2 mb-3 relative z-10">
              <span className="text-2xl drop-shadow-lg">🚀</span>
              <div>
                <h3 className="text-sm font-black uppercase tracking-widest text-yellow-400 italic">Maher</h3>
                <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">Pogodio oba tipa u danu</p>
              </div>
            </div>
            <div className="relative z-10">
              {boomMasters.length === 0 ? (
                <div className="text-center py-2 text-[9px] uppercase font-black tracking-widest text-gray-600">Nema dobijenih dnevnih tiketa</div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {boomMasters.map(b => (
                    <div key={b.player} className="flex items-center gap-2 bg-black/40 border border-yellow-500/20 p-2 rounded-xl flex-1 min-w-[120px]">
                      <img src={PLAYER_THEMES[b.player].icon} alt={b.player} className="w-8 h-8 rounded-full border border-yellow-500/50 shrink-0" />
                      <div className="flex flex-col">
                        <span className="text-xs font-black text-white uppercase leading-none">{b.player}</span>
                        <span className="text-[10px] font-black text-yellow-400 mt-0.5">💥 {b.perfectDays} Puta</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

        </div>

        {/* ── 5. WALL OF SHAME ── */}
        <div className="p-4 rounded-3xl backdrop-blur-md relative overflow-hidden shadow-xl"
          style={{ background: 'linear-gradient(135deg, rgba(239,68,68,0.1) 0%, rgba(0,0,0,0.3) 100%)', border: '1px solid rgba(239,68,68,0.15)' }}>
          <div className="absolute top-0 right-0 p-3 opacity-[0.04] text-6xl rotate-12 select-none">🤡</div>
          <div className="flex items-center gap-2 mb-4 relative z-10">
            <span className="text-2xl drop-shadow-lg">🤡</span>
            <div>
              <h3 className="text-sm font-black uppercase tracking-wider text-red-500 italic">Zid Srama</h3>
              <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">Najmanja muda</p>
            </div>
          </div>
          <div className="space-y-2 relative z-10">
            {smallestOdds.length === 0 ? (
               <div className="text-center py-4 text-[9px] uppercase font-black tracking-widest text-gray-600">Nema jos tiketa</div>
            ) : (
              smallestOdds.map((match, idx) => {
                const pt = PLAYER_THEMES[match.player];
                return (
                  <div key={idx} className="flex items-center justify-between p-2.5 rounded-xl transition-colors"
                    style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(239,68,68,0.1)' }}>
                    <div className="flex items-center gap-3">
                      <span className="text-base font-black text-red-500 w-9 text-center drop-shadow-[0_0_8px_rgba(239,68,68,0.3)]">{match.odd.toFixed(2)}</span>
                      <div className="w-px h-6 bg-white/10 shrink-0" />
                      <div className="flex flex-col">
                        <span className="text-[11px] font-bold text-white uppercase truncate max-w-[140px] md:max-w-xs leading-tight">{match.name}</span>
                        <span className={`text-[8px] font-black uppercase tracking-widest mt-0.5 ${pt.text}`}>{match.player}</span>
                      </div>
                    </div>
                    <div className="text-lg px-2 shrink-0">
                      {match.status === 'loss' ? '❌' : match.status === 'win' ? '✅' : '⏳'}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>

      {/* ── 6. FULLSCREEN LANDSCAPE MODAL BACKDROP PORTAL ── */}
      {isFullscreen && (
        <div className="fixed inset-0 bg-[#040712] z-[9999] flex flex-col justify-center items-center p-4 animate-fadeIn">
          <button
            onClick={() => setIsFullscreen(false)}
            className="absolute top-3 right-4 z-[10000] bg-red-500/20 text-red-400 border border-red-500/40 px-3 py-1.5 rounded-full font-black text-[10px] uppercase tracking-widest active:scale-95 transition-all"
          >
            ✕ Close
          </button>
          
          <div className="w-full h-full max-h-[85vh] flex flex-col justify-center mt-6 pr-4 pl-2">
            {renderRaceChart(window.innerHeight * 0.7)}
          </div>
        </div>
      )}

      {/* TICKER */}
      <div className="relative z-10 w-full overflow-hidden py-1.5 mt-6" style={{ borderTop: '1px solid rgba(255,255,255,0.05)', background: 'rgba(0,0,0,0.3)', marginInline: '-12px', paddingInline: '12px', width: 'calc(100% + 24px)' }}>
        <div className="wc-ticker whitespace-nowrap inline-block">
          {[0, 1].map(i => (
            <span key={i} className="text-[9px] font-black uppercase tracking-[0.3em] text-yellow-400/20 px-2">
              📊&nbsp; WORLD CUP &nbsp;·&nbsp; STATISTICS &nbsp;·&nbsp; HIT RATE &nbsp;·&nbsp;
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}