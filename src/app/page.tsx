"use client";
import React, { useState, useEffect, useRef } from "react";
import { AllPlayersData, Match, BettingRow, EMPTY_MATCH } from "../types";
import LandingPage   from "../components/LandingPage";
import Leaderboard   from "../components/Leaderboard";
import PlayerTable   from "../components/PlayerTable";
import Login         from "../components/Login";
import PullToRefresh from "../components/PullToRefresh";
import WCPredictor   from "../components/WCPredictor"; 
import dynamic       from "next/dynamic";
import { supabase }  from "../lib/supabase";

const Statistics = dynamic(() => import("../components/Statistics"), { ssr: false });

type AppView = "landing" | "leaderboard" | "tables" | "statistics" | "predictor";

export default function BettingApp() {
  const [currentView, setCurrentView] = useState<AppView>("landing");
  const [activePlayer, setActivePlayer] = useState<string>("Vlado");
  const [allBets, setAllBets] = useState<AllPlayersData>({
    Vlado: [], Fika: [], Labud: [], Ilija: [], Dzoni: [],
  });
  const [session, setSession]     = useState<any>(null);
  const [appLoading, setAppLoading] = useState(true);

  const viewHistory = useRef<AppView[]>(["landing"]);

  const navigateToView = (nextView: AppView) => {
    if (currentView !== nextView) {
      viewHistory.current.push(currentView);
      setCurrentView(nextView);
    }
  };

  const navigateBack = () => {
    if (viewHistory.current.length > 0) {
      const prev = viewHistory.current.pop();
      if (prev) setCurrentView(prev);
    } else {
      setCurrentView("landing");
    }
  };

  const fetchBetsData = async () => {
    const { data: betsData } = await supabase
      .from('player_bets')
      .select('player_name, bets');

    if (betsData) {
      const next: AllPlayersData = { Vlado: [], Fika: [], Labud: [], Ilija: [], Dzoni: [] };
      betsData.forEach((row: any) => {
        if (next[row.player_name] !== undefined) next[row.player_name] = row.bets || [];
      });
      setAllBets(next);
    }
  };

  useEffect(() => {
    const init = async () => {
      setAppLoading(true);
      const { data: { session: existing } } = await supabase.auth.getSession();
      setSession(existing);
      await fetchBetsData();
      setAppLoading(false);
    };

    init();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => subscription.unsubscribe();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleRefresh = async () => {
    if (navigator.vibrate) navigator.vibrate(50);
    await fetchBetsData();
  };

  const savePlayerToDb = async (playerName: string, rows: BettingRow[]) => {
    const { error } = await supabase
      .from('player_bets')
      .update({ bets: rows })
      .eq('player_name', playerName);
    if (error) console.error("Error saving:", error);
  };

  const addPick = (date: string, sport: string, matchName: string, tip: string, odds: number) => {
    const newMatch: Match = { sport, name: matchName, tip, odds, status: "pending" };
    setAllBets(prev => {
      const rows = prev[activePlayer] ? [...prev[activePlayer]] : [];
      const idx  = rows.findIndex(r => r.date === date);
      if (idx !== -1) {
        const row = { ...rows[idx] };
        if      (row.match1.status === "empty") row.match1 = newMatch;
        else if (row.match2.status === "empty") row.match2 = newMatch;
        else { alert("Maximum 2 picks per day allowed!"); return prev; }
        rows[idx] = row;
      } else {
        rows.push({ id: Date.now(), date, match1: newMatch, match2: { ...EMPTY_MATCH } });
        rows.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      }
      savePlayerToDb(activePlayer, rows);
      return { ...prev, [activePlayer]: rows };
    });
  };

  const toggleStatus = (date: string, matchKey: "match1" | "match2") => {
    setAllBets(prev => {
      const rows = prev[activePlayer].map(row => {
        if (row.date === date && row[matchKey].status !== "empty") {
          const s    = row[matchKey].status;
          const next = s === "pending" ? "win" : s === "win" ? "loss" : "pending";
          return { ...row, [matchKey]: { ...row[matchKey], status: next } };
        }
        return row;
      });
      savePlayerToDb(activePlayer, rows);
      return { ...prev, [activePlayer]: rows };
    });
  };

  const getLoggedInPlayerName = () => {
    if (!session?.user?.email) return "Vlado"; 
    const name = session.user.email.split('@')[0];
    return name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
  };

  const handleMyPicksTabClick = () => {
    const myName = getLoggedInPlayerName();
    setActivePlayer(myName);
    navigateToView("tables");
  };

  // ── LOADING SCREEN ───────────────────────────────────────────────────────────
  if (appLoading) return (
    <div
      className="h-screen flex flex-col items-center justify-center text-white font-sans p-6 text-center relative overflow-hidden"
      style={{ background: 'linear-gradient(165deg, #05091a 0%, #080d20 45%, #040810 100%)' }}
    >
      <div className="fixed inset-0 wc-jersey-bg pointer-events-none" />
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="wc-beam-l absolute" style={{ top: 0, left: '22%', width: '240px', height: '70vh', background: 'linear-gradient(178deg, rgba(250,204,21,0.18) 0%, transparent 80%)', filter: 'blur(38px)' }} />
        <div className="wc-beam-r absolute" style={{ top: 0, right: '22%', width: '240px', height: '70vh', background: 'linear-gradient(178deg, rgba(250,204,21,0.18) 0%, transparent 80%)', filter: 'blur(38px)' }} />
      </div>
      <div className="relative z-10 text-center">
        <div className="wc-gold-pulse text-7xl mb-6 select-none">🏆</div>
        <h1 className="text-4xl md:text-7xl font-black uppercase tracking-tighter leading-none mb-2">
          WORLD CUP <span className="wc-shine-text">2026</span>
        </h1>
        <p className="text-white/20 text-xs font-black uppercase tracking-[0.4em] mb-6">TAKMIČENJE EDITION</p>
        <div className="flex items-center justify-center gap-2">
          <div className="w-2 h-2 rounded-full animate-bounce [animation-delay:-0.3s]"  style={{ background: '#facc15' }} />
          <div className="w-2 h-2 rounded-full animate-bounce [animation-delay:-0.15s]" style={{ background: '#facc15' }} />
          <div className="w-2 h-2 rounded-full animate-bounce"                            style={{ background: '#facc15' }} />
        </div>
      </div>
    </div>
  );

  if (!session) return <Login onLogin={() => {}} />;

  const renderTabShell = () => {
    switch (currentView) {
      case "landing":
        return <LandingPage onNavigate={navigateToView} />;
      case "leaderboard":
        return (
          <Leaderboard
            allBets={allBets}
            onPlayerClick={name => { setActivePlayer(name); navigateToView("tables"); }}
          />
        );
      case "statistics":
        return <Statistics allBets={allBets} onBack={navigateBack} />;
      case "predictor":
        // ✅ PROGNOZA FIX: Ovdje prosljeđujemo tačno izračunato ime ulogovanog korisnika iz baze
        return <WCPredictor activePlayer={getLoggedInPlayerName()} />;
      case "tables":
      default:
        return (
          <PlayerTable
            allBets={allBets}
            activePlayer={activePlayer}
            setActivePlayer={setActivePlayer}
            onAddPick={addPick}
            onToggleStatus={toggleStatus}
            userEmail={session.user.email}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-black text-white pb-20 relative overflow-x-hidden">
      
      <PullToRefresh onRefresh={handleRefresh}>
        <div className="w-full h-full">
          {renderTabShell()}
        </div>
      </PullToRefresh>

      {/* ── NOVI ERGONOMSKI NAVIGACIONI BAR SA PROMIJENJENIM MJESTIMA ── */}
      <div className="fixed bottom-0 left-0 right-0 pt-3 pb-[calc(env(safe-area-inset-bottom)+6px)] bg-[#05091a]/95 border-t border-white/10 backdrop-blur-xl flex justify-around items-center z-[999] shadow-[0_-8px_30px_rgba(0,0,0,0.6)] px-1">
        
        {/* 1. KRAJNJE LIJEVO: PROGNOZA (PROMIJENJENO MJESTO 🔁) */}
        <button 
          onClick={() => navigateToView("predictor")}
          className={`flex flex-col items-center justify-center flex-1 h-full transition-all active:scale-90 ${
            currentView === "predictor" ? "text-yellow-400 font-black" : "text-white/40 font-bold"
          }`}
        >
          <span className="text-xl mb-0.5">🔮</span>
          <span className="text-[9px] uppercase tracking-wider truncate">Prognoza</span>
        </button>

        {/* 2. LIJEVO CENTAR: MOJI PARI */}
        <button 
          onClick={handleMyPicksTabClick}
          className={`flex flex-col items-center justify-center flex-1 h-full transition-all active:scale-90 ${
            currentView === "tables" ? "text-yellow-400 font-black" : "text-white/40 font-bold"
          }`}
        >
          <span className="text-xl mb-0.5">📝</span>
          <span className="text-[9px] uppercase tracking-wider truncate">Tabele</span>
        </button>

        {/* 3. APSOLUTNI CENTAR: GLAVNI MENI */}
        <button 
          onClick={() => navigateToView("landing")}
          className={`flex flex-col items-center justify-center flex-1 h-full transition-all active:scale-90 ${
            currentView === "landing" ? "text-yellow-400 font-black" : "text-white/40 font-bold"
          }`}
        >
          <span className="text-xl mb-0.5">🏠</span>
          <span className="text-[9px] uppercase tracking-wider truncate">Meni</span>
        </button>

        {/* 4. DESNO CENTAR: PODIJUM */}
        <button 
          onClick={() => navigateToView("leaderboard")}
          className={`flex flex-col items-center justify-center flex-1 h-full transition-all active:scale-90 ${
            currentView === "leaderboard" ? "text-yellow-400 font-black" : "text-white/40 font-bold"
          }`}
        >
          <span className="text-xl mb-0.5">🏆</span>
          <span className="text-[9px] uppercase tracking-wider truncate">Podijum</span>
        </button>

        {/* 5. KRAJNJE DESNO: STATISTIKA (PROMIJENJENO MJESTO 🔁) */}
        <button 
          onClick={() => navigateToView("statistics")}
          className={`flex flex-col items-center justify-center flex-1 h-full transition-all active:scale-90 ${
            currentView === "statistics" ? "text-yellow-400 font-black" : "text-white/40 font-bold"
          }`}
        >
          <span className="text-xl mb-0.5">📊</span>
          <span className="text-[9px] uppercase tracking-wider truncate">Statistika</span>
        </button>

      </div>
    </div>
  );
}