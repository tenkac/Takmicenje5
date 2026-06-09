"use client";
import React, { useState, useEffect, useCallback } from 'react';
import { AllPlayersData, PLAYERS, MatchStatus } from '../types';
import { betSchema } from '../utils/validation';
import { motion, AnimatePresence } from 'framer-motion';
// 👇 IMPORT SUPABASE INSTANCE
import { supabase } from '../lib/supabase';

interface Props {
  allBets: AllPlayersData;
  activePlayer: string;
  setActivePlayer: (player: string) => void;
  onAddPick: (date: string, sport: string, matchName: string, tip: string, odds: number) => void;
  onToggleStatus: (date: string, matchKey: "match1" | "match2") => void;
  onBack: () => void;
  userEmail?: string;
  onDeletePick?: (date: string, playerName: string, matchKey: "match1" | "match2") => void;
}

const PLAYER_THEMES: Record<string, { text: string, border: string, icon: string, hex: string }> = {
  "Vlado":  { text: "text-blue-400",   border: "border-blue-500/50",   icon: "/Avatars/vlado.jpg",  hex: "#3b82f6" },
  "Fika":   { text: "text-red-400",    border: "border-red-500/50",    icon: "/Avatars/fika.jpg",   hex: "#ef4444" },
  "Labud":  { text: "text-green-400",  border: "border-green-500/50",  icon: "/Avatars/labud.jpg",  hex: "#22c55e" },
  "Ilija":  { text: "text-purple-400", border: "border-purple-500/50", icon: "/Avatars/ilija.jpg",  hex: "#a855f7" },
  "Dzoni":  { text: "text-yellow-400", border: "border-yellow-500/50", icon: "/Avatars/dzoni.jpg",  hex: "#eab308" },
};

export default function PlayerTable({ allBets, activePlayer, setActivePlayer, onAddPick, onToggleStatus, onBack, userEmail, onDeletePick }: Props) {
  const [form, setForm] = useState({ date: new Date().toLocaleDateString('en-CA'), sport: "⚽", matchName: "", tip: "", odds: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [flashMap, setFlashMap] = useState<Record<string, 'win' | 'loss' | null>>({});
  const [springMap, setSpringMap] = useState<Record<string, boolean>>({});
  const [mounted, setMounted] = useState(false);
  const [subTab, setSubTab] = useState<"individual" | "matchday">("individual");

  // ADMIN INLINE EDITING STATE HOOKS
  const [editingCardKey, setEditingCardKey] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ name: "", tip: "", odds: "" });

  useEffect(() => {
    setMounted(false);
    setFlashMap({});
    setSpringMap({});
    setEditingCardKey(null);
    const t = setTimeout(() => setMounted(true), 60);
    return () => clearTimeout(t);
  }, [activePlayer, subTab]);

  const ADMIN_EMAIL = "vladoadmin@takmicenje.com";
  const today = new Date().toLocaleDateString('en-CA');
  const isAdmin = userEmail === ADMIN_EMAIL;

  const loggedInPlayerName = React.useMemo(() => {
    if (!userEmail) return "";
    if (userEmail === ADMIN_EMAIL) return "Admin";
    return PLAYERS.find(p => p.toLowerCase() === userEmail.split('@')[0].toLowerCase()) || "";
  }, [userEmail]);

  const isOwner =
    userEmail === ADMIN_EMAIL ||
    (userEmail && userEmail.split('@')[0].toLowerCase() === activePlayer.toLowerCase());

  const hasUserUnlockedDate = useCallback((targetDate: string) => {
    if (userEmail === ADMIN_EMAIL) return true;
    if (!loggedInPlayerName) return false;

    const userRowForDate = allBets[loggedInPlayerName]?.find(r => r.date === targetDate);
    if (!userRowForDate) return false;

    return userRowForDate.match1.status !== 'empty' && userRowForDate.match2.status !== 'empty';
  }, [allBets, loggedInPlayerName, userEmail]);

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

  const handleToggle = useCallback((date: string, playerKey: string, matchKey: "match1" | "match2") => {
    if (editingCardKey) return;

    const cardKey = `${date}-${playerKey}-${matchKey}`;
    const row = allBets[playerKey]?.find(r => r.date === date);
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
  }, [allBets, onToggleStatus, editingCardKey]);

  // 👇 BUFFED SYSTEM DB ENGINE: Očvršćena pretraga imena pomoću `.ilike` i `.trim()`
  const executeDirectDbUpdate = async (date: string, matchKey: "match1" | "match2", customValueObj: any) => {
    const cleanPlayerName = activePlayer.trim();
    try {
      // 1. Povuci red koristeći fleksibilni ILIKE filter (rešava problem sa malim/velikim slovima i razmacima)
      const { data, error: fetchErr } = await supabase
        .from('player_bets') 
        .select('bets')
        .ilike('player_name', cleanPlayerName) 
        .maybeSingle();

      if (fetchErr || !data) {
        throw new Error(`Korisnik "${cleanPlayerName}" nije pronađen u bazi podataka.`);
      }

      const currentBetsArray = Array.isArray(data.bets) ? data.bets : [];

      // 2. Mapiraj niz i izmeni ciljanu utakmicu za prosleđeni datum
      const updatedBetsArray = currentBetsArray.map((ticket: any) => {
        if (ticket.date === date) {
          return {
            ...ticket,
            [matchKey]: {
              ...ticket[matchKey],
              ...customValueObj
            }
          };
        }
        return ticket;
      });

      // 3. Upiši nazad ceo izmenjeni JSON niz u bazu
      const { data: updateCheck, error: updateErr } = await supabase
        .from('player_bets')
        .update({ bets: updatedBetsArray })
        .ilike('player_name', cleanPlayerName)
        .select();

      if (updateErr) throw updateErr;
      
      if (!updateCheck || updateCheck.length === 0) {
        alert("⚠️ Greška: Supabase nije uspeo da izvrši izmenu! Osveži stranicu pa pokušaj ponovo.");
        return;
      }
      
      window.location.reload(); 
    } catch (err: any) {
      console.error(err);
      alert("Greška pri sinhronizaciji baze: " + err.message);
    }
  };

  const handleDeleteClick = async (e: React.MouseEvent, date: string, matchKey: "match1" | "match2") => {
    e.stopPropagation();
    const confirmed = window.confirm(`Da li sigurno želiš da obrišeš ovaj par (${activePlayer} - ${date})?`);
    if (!confirmed) return;

    if (onDeletePick) {
      onDeletePick(date, activePlayer, matchKey);
    } else {
      const emptyPayload = { name: "", tip: "", odds: 0, status: "empty", sport: "⚽" };
      await executeDirectDbUpdate(date, matchKey, emptyPayload);
    }
  };

  const handleEditClick = (e: React.MouseEvent, date: string, matchKey: "match1" | "match2", matchObject: any) => {
    e.stopPropagation();
    setEditingCardKey(`${date}-${matchKey}`);
    setEditForm({
      name: matchObject.name,
      tip: matchObject.tip,
      odds: matchObject.odds.toString()
    });
  };

  const handleSaveEdit = async (e: React.FormEvent, date: string, matchKey: "match1" | "match2") => {
    e.stopPropagation();
    const parsedOdds = parseFloat(editForm.odds);
    if (isNaN(parsedOdds) || parsedOdds <= 0) return alert("Unesite ispravnu kvotu!");

    const editPayload = {
      name: editForm.name,
      tip: editForm.tip,
      odds: parsedOdds
    };

    await executeDirectDbUpdate(date, matchKey, editPayload);
    setEditingCardKey(null);
  };

  const getStatusColor = (s: MatchStatus) => {
    if (s === "win")  return "bg-green-500/10 text-green-400 border-green-500/30";
    if (s === "loss") return "bg-red-500/10 text-red-400 border-red-500/30";
    return "bg-orange-500/5 text-orange-300 border-orange-500/20";
  };

  const getOddsRiskStyle = (odds: number) => {
    if (odds < 1.50) return "text-gray-400 border-white/5 bg-white/5"; 
    if (odds <= 2.50) return "text-blue-400 border-blue-500/20 bg-blue-500/5"; 
    return "text-amber-400 border-amber-500/30 bg-amber-500/10 shadow-[0_0_10px_rgba(245,158,11,0.1)]"; 
  };

  const playerStats = React.useMemo(() => {
    const rows = allBets[activePlayer] || [];
    let wins = 0, pending = 0, totalOdds = 0;
    rows.flatMap(r => [r.match1, r.match2]).forEach(m => {
      if (m.status === 'win') { wins++; totalOdds += m.odds; }
      if (m.status === 'pending') pending++;
    });
    return { wins, pending, score: totalOdds.toFixed(2) };
  }, [allBets, activePlayer]);

  const groupedMatchdayPicks = React.useMemo(() => {
    const groups: Record<string, any[]> = {};
    let totalCount = 0;

    PLAYERS.forEach(player => {
      const todayRow = allBets[player]?.find(r => r.date === today);
      if (todayRow) {
        const picks: any[] = [];
        if (todayRow.match1.status !== 'empty') picks.push({ match: todayRow.match1, matchKey: 'match1' });
        if (todayRow.match2.status !== 'empty') picks.push({ match: todayRow.match2, matchKey: 'match2' });
        
        if (picks.length > 0) {
          groups[player] = picks;
          totalCount += picks.length;
        }
      }
    });
    return { groups, totalCount };
  }, [allBets, today]);

  const pt = PLAYER_THEMES[activePlayer] || { text: "text-white", border: "border-white/10", icon: "/Avatars/default.jpg", hex: "#ffffff" };

  return (
    <>
      <style>{`
        @keyframes stagger-in {
          from { opacity: 0; transform: translateY(12px); }
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
        {/* Background Layers */}
        <div className="fixed inset-0 wc-jersey-bg pointer-events-none" />
        <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
          <div className="wc-beam-l absolute" style={{ top: 0, left: '25%', width: '250px', height: '60vh', background: 'linear-gradient(178deg, rgba(250,204,21,0.12) 0%, transparent 80%)', filter: 'blur(50px)' }} />
          <div className="wc-beam-r absolute" style={{ top: 0, right: '25%', width: '250px', height: '60vh', background: 'linear-gradient(178deg, rgba(250,204,21,0.12) 0%, transparent 80%)', filter: 'blur(50px)' }} />
        </div>

        {/* ── STICKY TOP BAR ── */}
        <div className="sticky top-0 z-50 backdrop-blur-md bg-[#05091a]/85 border-b border-white/5 px-4 py-3 flex flex-col gap-3">
          <div className="max-w-7xl w-full mx-auto flex justify-between items-center">
            <button onClick={onBack} className="bg-white/5 hover:bg-white/10 text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-full border border-white/10 transition-all active:scale-95">
              ← Meni
            </button>
            <div className="text-center">
              <div className="text-[8px] font-black text-yellow-400/60 uppercase tracking-[0.4em] mb-0.5">WORLD CUP 2026</div>
              <h1 className="text-sm md:text-xl font-black uppercase tracking-widest">TAKMIČENJE <span className="text-yellow-400">5.0</span></h1>
            </div>
            {isAdmin && (
              <span className="bg-red-500/20 text-red-400 border border-red-500/30 text-[8px] font-black uppercase px-2 py-1 rounded-full tracking-widest animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.2)]">
                Admin Režim
              </span>
            )}
            {!isAdmin && <div className="w-16" />}
          </div>

          {/* SUB-TAB TOGGLE */}
          <div className="max-w-7xl w-full mx-auto grid grid-cols-2 bg-black/40 border border-white/5 p-1 rounded-xl">
            <button 
              onClick={() => setSubTab("individual")}
              className={`py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${subTab === "individual" ? "bg-white/10 text-white shadow-md" : "text-gray-500 hover:text-white"}`}
            >
              👤 PO PROFILIMA
            </button>
            <button 
              onClick={() => setSubTab("matchday")}
              className={`py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all relative ${subTab === "matchday" ? "bg-white/10 text-white shadow-md" : "text-gray-500 hover:text-white"}`}
            >
              ⚡ SVI DANAS
              {groupedMatchdayPicks.totalCount > 0 && (
                <span className="absolute top-1 right-2 bg-yellow-500 text-black font-black font-sans text-[8px] px-1.5 py-0.5 rounded-full leading-none">
                  {groupedMatchdayPicks.totalCount}
                </span>
              )}
            </button>
          </div>

          {/* HORIZONTAL CAROUSEL SELECTOR */}
          {subTab === "individual" && (
            <div 
              className="max-w-7xl w-full mx-auto flex gap-3 overflow-x-auto no-scrollbar py-1 px-4 -mx-4 scroll-smooth overscroll-contain touch-pan-x snap-x animate-[stagger-in_0.2s_ease-out]"
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
          )}
        </div>

        {/* ── MAIN LAYOUT HUB ── */}
        <div className="max-w-7xl mx-auto p-4 md:p-8 relative z-10">
          <AnimatePresence mode="wait">
            
            {/* ─────────────── TAB 1: INDIVIDUAL PROFILES ─────────────── */}
            {subTab === "individual" ? (
              <div key="individual" className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-8">
                <div className="flex flex-col gap-6 lg:sticky lg:top-[190px] lg:h-[calc(100vh-230px)]">
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

                  {isOwner && (
                    <div className="p-6 rounded-3xl bg-gradient-to-b from-white/[0.06] to-white/[0.02] border border-yellow-400/20 shadow-xl flex flex-col gap-3.5">
                      <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-yellow-400/70 flex items-center gap-2">⚽ UNESI NOVI PAR</h3>
                      <div className="flex flex-col gap-1.5">
                        <input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} className="w-full h-[46px] bg-black/50 border border-white/10 rounded-xl px-3 text-xs text-white" />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <input placeholder="Naziv meča" value={form.matchName} onChange={e => setForm({ ...form, matchName: e.target.value })} className="w-full h-[46px] bg-black/50 border border-white/10 rounded-xl px-4 text-xs text-white" />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <input placeholder="Tip (Npr. GG)" value={form.tip} onChange={e => setForm({ ...form, tip: e.target.value })} className="w-full h-[46px] bg-black/50 border border-white/10 rounded-xl px-3 text-xs text-center text-white" />
                        <input type="number" placeholder="Kvota" value={form.odds} onChange={e => setForm({ ...form, odds: e.target.value })} className="w-full h-[46px] bg-black/50 border border-white/10 rounded-xl px-3 text-xs text-center font-bold text-white" />
                      </div>
                      <button onClick={handleAdd} disabled={isSubmitting} className="w-full h-[48px] font-black text-xs uppercase tracking-widest rounded-xl text-black" style={{ background: 'linear-gradient(135deg, #eab308 0%, #ca8a04 100%)' }}>
                        {isSubmitting ? "Slanje..." : "DODAJ PAR"}
                      </button>
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  {allBets[activePlayer] && allBets[activePlayer].length === 0 ? (
                    <div className="p-12 text-center text-xs font-black uppercase tracking-widest text-gray-600 bg-white/5 border border-white/5 rounded-3xl">Nema parova.</div>
                  ) : (
                    [...allBets[activePlayer]].reverse().map((row, rowIdx) => {
                      const isToday = row.date === today;
                      const isFuture = row.date > today;
                      const isRowHidden = !isOwner && !hasUserUnlockedDate(row.date);

                      return (
                        <div key={row.date} className="rounded-2xl p-5 flex flex-col sm:flex-row gap-4 items-stretch bg-gradient-to-r from-white/[0.04] to-white/[0.01] border" style={{ borderColor: isToday ? 'rgba(250,204,21,0.25)' : 'rgba(255,255,255,0.06)', animation: mounted ? `stagger-in 0.3s ease-out ${Math.min(rowIdx * 0.04, 0.4)}s both` : 'none' }}>
                          <div className="flex sm:flex-col justify-between sm:justify-center items-center gap-1 sm:border-r border-white/5 sm:pr-5 shrink-0 min-w-[70px]">
                            <div className="text-center">
                              <span className="block text-[8px] font-bold text-gray-500 uppercase">TICKET</span>
                              <span className="text-base font-black text-gray-300">{row.date.split('-').reverse().slice(0, 2).join('.')}</span>
                            </div>
                            {isToday && <span className="text-[8px] font-black uppercase tracking-widest px-2 py-0.5 bg-yellow-400/10 text-yellow-400 rounded border border-yellow-400/20">Danas</span>}
                            {isFuture && <span className="text-[8px] font-black uppercase tracking-widest px-2 py-0.5 bg-purple-500/10 text-purple-400 rounded border border-purple-500/20">Uskoro</span>}
                          </div>
                          
                          <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3">
                            {isRowHidden ? (
                              <div className="col-span-1 md:col-span-2 flex items-center justify-center p-6 bg-black/40 border border-white/5 rounded-xl border-dashed">
                                <span className="text-[10px] font-black text-gray-500 uppercase tracking-[0.25em] flex items-center gap-2">
                                  🔒 Zaključano dok ne popuniš svoj tiket za ovaj datum
                                </span>
                              </div>
                            ) : (
                              [row.match1, row.match2].map((m, idx) => {
                                const mKey = idx === 0 ? "match1" : "match2";
                                const currentCardId = `${row.date}-${mKey}`;
                                const isCurrentCardEditing = editingCardKey === currentCardId;

                                return (
                                  <div 
                                    key={idx} 
                                    onClick={() => isOwner && m.status !== 'empty' && handleToggle(row.date, activePlayer, mKey)} 
                                    className={`p-4 rounded-xl border flex flex-col justify-between min-h-[92px] relative overflow-hidden transition-all ${getStatusColor(m.status)} ${isOwner && m.status !== 'empty' ? 'cursor-pointer hover:bg-white/[0.02]' : 'cursor-default'} ${m.status === 'pending' ? 'pending-glow' : ''} ${springMap[`${row.date}-${activePlayer}-${mKey}`] ? 'spring-anim' : ''}`}
                                  >
                                    {flashMap[`${row.date}-${activePlayer}-${mKey}`] && <div className="absolute inset-0 pointer-events-none z-20" style={{ background: flashMap[`${row.date}-${activePlayer}-${mKey}`] === 'win' ? '#22c55e' : '#ef4444', animation: 'flash-overlay 0.5s ease-out both' }} />}
                                    
                                    {isCurrentCardEditing ? (
                                      <div className="flex flex-col gap-1.5 w-full z-40 relative bg-black/90 p-1.5 rounded-lg" onClick={e => e.stopPropagation()}>
                                        <input type="text" value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} className="bg-white/10 text-[11px] px-2 py-1 rounded text-white outline-none w-full uppercase font-bold" placeholder="Naziv Meča" />
                                        <div className="grid grid-cols-2 gap-1.5">
                                          <input type="text" value={editForm.tip} onChange={e => setEditForm({...editForm, tip: e.target.value})} className="bg-white/10 text-[11px] px-2 py-1 rounded text-white outline-none text-center font-black" placeholder="Tip" />
                                          <input type="number" step="0.01" value={editForm.odds} onChange={e => setEditForm({...editForm, odds: e.target.value})} className="bg-white/10 text-[11px] px-2 py-1 rounded text-white outline-none text-center font-black" placeholder="Kvota" />
                                        </div>
                                        <div className="flex gap-2 mt-1">
                                          <button onClick={() => setEditingCardKey(null)} className="w-1/2 py-1 bg-white/10 text-[10px] font-black uppercase rounded text-gray-400">Poništi</button>
                                          <button onClick={(e) => handleSaveEdit(e, row.date, mKey)} className="w-1/2 py-1 bg-yellow-500 text-[10px] font-black uppercase rounded text-black shadow-md">Sačuvaj</button>
                                        </div>
                                      </div>
                                    ) : (
                                      <>
                                        <div className="flex justify-between items-start gap-2 mb-1 relative z-10">
                                          <span className="text-[8px] font-black text-white/40 uppercase">{m.sport || "⚽"} PAR {idx + 1}</span>
                                          
                                          <div className="flex items-center gap-1.5 relative z-30">
                                            {m.status !== 'empty' && <span className={`font-black text-xs px-2 py-0.5 border rounded-md ${getOddsRiskStyle(m.odds)}`}>{m.odds.toFixed(2)}</span>}
                                            
                                            {/* ADMIN ACTION TOOLBOX PANEL */}
                                            {isAdmin && m.status !== 'empty' && (
                                              <div className="flex items-center gap-1">
                                                <button 
                                                  onClick={(e) => handleEditClick(e, row.date, mKey, m)}
                                                  className="p-1 rounded bg-blue-500/10 border border-blue-500/30 text-blue-400 hover:bg-blue-500 hover:text-white transition-all text-[10px]"
                                                >
                                                  ✏️
                                                </button>
                                                <button 
                                                  onClick={(e) => handleDeleteClick(e, row.date, mKey)}
                                                  className="p-1 rounded bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500 hover:text-white transition-all text-[10px]"
                                                >
                                                  🗑️
                                                </button>
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                        <div className="my-1.5 text-xs font-black truncate uppercase text-white">{m.name || "---"}</div>
                                        <div className="text-[9px] font-black uppercase text-white/40">TIP: <span className="text-white">{m.tip || "---"}</span></div>
                                      </>
                                    )}
                                  </div>
                                );
                              })
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            ) : (
              
              /* ─────────────── TAB 2: GROUPED LIVE MATCHDAY FEED ─────────────── */
              <div key="matchday" className="max-w-3xl mx-auto space-y-6 animate-[stagger-in_0.3s_ease-out]">
                <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/5 text-center backdrop-blur-md">
                  <h2 className="text-base font-black text-yellow-400 uppercase tracking-widest">DANAŠNJI OKRŠAJI ⚔️</h2>
                  <p className="text-[9px] font-bold text-gray-500 uppercase tracking-[0.18em] mt-0.5">Hronološki pregled po igračima za datum: {today.split('-').reverse().join('.')}</p>
                </div>

                <div className="space-y-6">
                  {!hasUserUnlockedDate(today) ? (
                    <div className="p-12 text-center rounded-3xl bg-black/40 border border-white/5 flex flex-col items-center justify-center py-16 gap-3 border-dashed">
                      <span className="text-3xl">🔒</span>
                      <h3 className="text-sm font-black text-gray-300 uppercase tracking-wider">Pregled je zaključan!</h3>
                      <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest leading-relaxed max-w-sm mx-auto">
                        Moraš unijeti **oba svoja para** za danas prije nego što dobiješ dozvolu da vidiš šta igra ostatak grupe.
                      </p>
                    </div>
                  ) : Object.keys(groupedMatchdayPicks.groups).length === 0 ? (
                    <div className="p-16 text-center text-xs font-black uppercase tracking-widest text-gray-600 bg-white/5 border border-white/5 rounded-3xl">
                      Niko još nije unio parove za danas.
                    </div>
                  ) : (
                    Object.entries(groupedMatchdayPicks.groups).map(([player, picks]) => {
                      const userTheme = PLAYER_THEMES[player];
                      return (
                        <div key={player} className="p-5 rounded-2xl bg-black/40 border border-white/5 backdrop-blur-sm space-y-4">
                          <div className="flex items-center gap-3 border-b border-white/5 pb-3">
                            <div className="w-10 h-10 rounded-full border border-white/20 overflow-hidden shrink-0 shadow-sm">
                              <img src={userTheme.icon} className="w-full h-full object-cover" alt={player} />
                            </div>
                            <div>
                              <h3 className={`text-sm font-black uppercase tracking-wider ${userTheme.text}`}>{player}</h3>
                              <span className="text-[8px] font-bold text-gray-500 uppercase tracking-widest block mt-0.5">
                                Današnjih parova: {picks.length}
                              </span>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {picks.map((item, idx) => {
                              return (
                                <div 
                                  key={idx}
                                  className={`p-4 rounded-xl border bg-black/40 relative overflow-hidden flex flex-col justify-between min-h-[92px] transition-all cursor-default ${getStatusColor(item.match.status)} ${item.match.status === 'pending' ? 'pending-glow' : ''}`}
                                >
                                  <div className="flex justify-between items-start gap-2 mb-1">
                                    <span className="text-[8px] font-black text-white/40 uppercase">
                                      {item.match.sport || "⚽"} PAR {item.matchKey === 'match1' ? '1' : '2'}
                                    </span>
                                    <span className={`font-black text-xs px-2 py-0.5 border rounded-md tracking-tight block ${getOddsRiskStyle(item.match.odds)}`}>
                                      {item.match.odds.toFixed(2)}
                                    </span>
                                  </div>

                                  <div className="my-1 text-xs font-black uppercase truncate text-white tracking-wide">
                                    {item.match.name}
                                  </div>

                                  <div className="text-[9px] font-black uppercase tracking-widest text-white/40">
                                    TIP: <span className="text-white font-bold">{item.match.tip}</span>
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
            )}
          </AnimatePresence>
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