"use client";
import React, { useState, useEffect, useRef } from "react";
import { AllPlayersData, Match, BettingRow, EMPTY_MATCH } from "../types";
import LandingPage from "../components/LandingPage";
import Leaderboard from "../components/Leaderboard";
import PlayerTable from "../components/PlayerTable";
import Login from "../components/Login";
import PullToRefresh from "../components/PullToRefresh";
import WCPredictor from "../components/WCPredictor";
import dynamic from "next/dynamic";
import { supabase } from "../lib/supabase";

const Statistics = dynamic(() => import("../components/Statistics"), { ssr: false });

type AppView = "landing" | "leaderboard" | "tables" | "statistics" | "predictor";

export default function BettingApp() {
  const [currentView, setCurrentView] = useState<AppView>("landing");
  const [activePlayer, setActivePlayer] = useState<string>("Vlado");
  const [allBets, setAllBets] = useState<AllPlayersData>({
    Vlado: [], Fika: [], Labud: [], Ilija: [], Dzoni: [],
  });
  const [session, setSession] = useState<any>(null);
  const [appLoading, setAppLoading] = useState(true);
  
  // ── ⏱️ SWR PASIVNI TAJMERI ZA ZAŠTITU HOSTA ──
  const lastFetched = useRef<number>(0);
  const REFRESH_THRESHOLD = 900000; // 15 minuta za parove (900,000 ms)

  const lastLeaderboardFetched = useRef<number>(0);
  const LEADERBOARD_REFRESH_THRESHOLD = 600000; // 10 minuta za podijum (600,000 ms)

  const viewHistory = useRef<AppView[]>(["landing"]);

  const navigateToView = (nextView: AppView) => {
    if (currentView !== nextView) {
      viewHistory.current.push(currentView);
      setCurrentView(nextView);
    }
  };

  // Provjera za Tabele/Parove (15 min)
  const refreshIfStale = async () => {
    const now = Date.now();
    const timePassed = now - lastFetched.current;

    console.log(`静态 Prošlo je ${Math.round(timePassed / 1000)}s od zadnjeg povlačenja parova.`);

    if (timePassed > REFRESH_THRESHOLD) {
      console.log("🚀 Parovi su stariji od 15 minuta! Pokrećem fetch ka Supabase bazi...");
      await fetchBetsData();
    } else {
      console.log("🔒 Parovi su svježi. Koristim keširane podatke iz memorije (0% troška baze).");
    }
  };

  // 👇 NOVA FUNKCIJA: Provjera za Podijum/Leaderboard (10 min)
  const refreshLeaderboardIfStale = async () => {
    const now = Date.now();
    const timePassed = now - lastLeaderboardFetched.current;

    console.log(`🏆 Prošlo je ${Math.round(timePassed / 1000)}s od zadnjeg povlačenja tabele.`);

    if (timePassed > LEADERBOARD_REFRESH_THRESHOLD) {
      console.log("🚀 Tabela je starija od 10 minuta! Pokrećem osvježavanje bodova...");
      await fetchBetsData();
      // Vrijeme se automatski upisuje unutar fetchBetsData, ali ovdje eksplicitno osiguravamo i ovaj tajmer
      lastLeaderboardFetched.current = Date.now();
    } else {
      console.log("🔒 Tabela je svježa. Koristim keširano stanje bodova (0% troška baze).");
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

      // Zapiši tačan timestamp za oba tajmera jer fetch povlači sve podatke odjednom
      const now = Date.now();
      lastFetched.current = now;
      lastLeaderboardFetched.current = now;
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
      const idx = rows.findIndex(r => r.date === date);
      if (idx !== -1) {
        const row = { ...rows[idx] };
        if (row.match1.status === "empty") row.match1 = newMatch;
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
          const s = row[matchKey].status;
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
    const emailPrefix = session.user.email.split('@')[0].toLowerCase();
    if (emailPrefix === "vladoadmin") {
      return "Vlado";
    }
    return emailPrefix.charAt(0).toUpperCase() + emailPrefix.slice(1).toLowerCase();
  };

  const handleMyPicksTabClick = async () => {
    const myName = getLoggedInPlayerName();
    setActivePlayer(myName);
    await refreshIfStale();
    navigateToView("tables");
  };

  // 👇 NOV HANDLER: Presreće klik na Podijum u navigaciji
  const handleLeaderboardTabClick = async () => {
    await refreshLeaderboardIfStale();
    navigateToView("leaderboard");
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
          <div className="w-2 h-2 rounded-full animate-bounce [animation-delay:-0.3s]" style={{ background: '#facc15' }} />
          <div className="w-2 h-2 rounded-full animate-bounce [animation-delay:-0.15s]" style={{ background: '#facc15' }} />
          <div className="w-2 h-2 rounded-full animate-bounce" style={{ background: '#facc15' }} />
        </div>
      </div>
    </div>
  );

  if (!session) return <Login onLogin={() => { }} />;

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
    <div className="min-h-screen bg-black text-white pb-20 md:pb-0 md:pl-60 relative overflow-x-hidden">
      <PullToRefresh onRefresh={handleRefresh}>
        <div className="w-full h-full">
          {renderTabShell()}
        </div>
      </PullToRefresh>

     {/* ── RESPONSIVE NAVIGATION BAR (MOBILE BOTTOM / DESKTOP SIDEBAR) ── */}
      <div className="fixed bottom-0 left-0 right-0 pt-2 pb-[calc(env(safe-area-inset-bottom)+20px)] bg-[#05091a]/90 border-t border-white/10 backdrop-blur-2xl flex justify-around items-center z-[999] shadow-[0_-12px_40px_rgba(0,0,0,0.8)] px-2 w-full max-w-full overflow-hidden touch-none md:top-0 md:bottom-0 md:left-0 md:right-auto md:w-60 md:h-screen md:flex-col md:justify-start md:items-stretch md:pt-10 md:px-4 md:gap-2 md:border-t-0 md:border-r md:pb-8 md:shadow-[12px_0_40px_rgba(0,0,0,0.5)]">

        {/* Desktop Sidebar Branding Header */}
        <div className="hidden md:flex flex-col items-center mb-8 px-2 text-center border-b border-white/5 pb-6">
          <span className="text-3xl mb-1.5 select-none animate-pulse">🏆</span>
          <h2 className="text-sm font-black uppercase tracking-[0.25em] text-yellow-400">WC 2026</h2>
          <span className="text-[9px] text-white/30 font-bold uppercase tracking-widest mt-0.5">Betting App</span>
        </div>

        {/* 1. PROGNOZA */}
        <button
          onClick={() => navigateToView("predictor")}
          className={`flex flex-col items-center justify-center flex-1 min-w-0 h-12 transition-all active:scale-90 md:flex-row md:justify-start md:flex-initial md:h-12 md:px-4 md:rounded-xl md:active:scale-95 ${
            currentView === "predictor" 
              ? "text-yellow-400 font-black scale-105 md:scale-100 md:bg-yellow-400/[0.08] md:text-yellow-400" 
              : "text-white/40 font-bold md:text-white/60 md:hover:bg-white/[0.03] md:hover:text-white"
          }`}
        >
          <span className="text-xl mb-0.5 shrink-0 md:mb-0 md:text-lg">🔮</span>
          <span className="text-[9px] uppercase tracking-wider truncate w-full text-center px-1 md:text-xs md:font-bold md:tracking-widest md:text-left md:px-0 md:ml-3.5">Prognoza</span>
        </button>

        {/* 2. TABELE */}
        <button
          onClick={handleMyPicksTabClick}
          className={`flex flex-col items-center justify-center flex-1 min-w-0 h-12 transition-all active:scale-90 md:flex-row md:justify-start md:flex-initial md:h-12 md:px-4 md:rounded-xl md:active:scale-95 ${
            currentView === "tables" 
              ? "text-yellow-400 font-black scale-105 md:scale-100 md:bg-yellow-400/[0.08] md:text-yellow-400" 
              : "text-white/40 font-bold md:text-white/60 md:hover:bg-white/[0.03] md:hover:text-white"
          }`}
        >
          <span className="text-xl mb-0.5 shrink-0 md:mb-0 md:text-lg">📝</span>
          <span className="text-[9px] uppercase tracking-wider truncate w-full text-center px-1 md:text-xs md:font-bold md:tracking-widest md:text-left md:px-0 md:ml-3.5">Tabele</span>
        </button>

        {/* 3. MENI */}
        <button
          onClick={() => navigateToView("landing")}
          className={`flex flex-col items-center justify-center flex-1 min-w-0 h-12 transition-all active:scale-90 md:flex-row md:justify-start md:flex-initial md:h-12 md:px-4 md:rounded-xl md:active:scale-95 ${
            currentView === "landing" 
              ? "text-yellow-400 font-black scale-105 md:scale-100 md:bg-yellow-400/[0.08] md:text-yellow-400" 
              : "text-white/40 font-bold md:text-white/60 md:hover:bg-white/[0.03] md:hover:text-white"
          }`}
        >
          <span className="text-xl mb-0.5 shrink-0 md:mb-0 md:text-lg">🏠</span>
          <span className="text-[9px] uppercase tracking-wider truncate w-full text-center px-1 md:text-xs md:font-bold md:tracking-widest md:text-left md:px-0 md:ml-3.5">Meni</span>
        </button>

        {/* 4. PODIJUM */}
        <button
          onClick={handleLeaderboardTabClick}
          className={`flex flex-col items-center justify-center flex-1 min-w-0 h-12 transition-all active:scale-90 md:flex-row md:justify-start md:flex-initial md:h-12 md:px-4 md:rounded-xl md:active:scale-95 ${
            currentView === "leaderboard" 
              ? "text-yellow-400 font-black scale-105 md:scale-100 md:bg-yellow-400/[0.08] md:text-yellow-400" 
              : "text-white/40 font-bold md:text-white/60 md:hover:bg-white/[0.03] md:hover:text-white"
          }`}
        >
          <span className="text-xl mb-0.5 shrink-0 md:mb-0 md:text-lg">🏆</span>
          <span className="text-[9px] uppercase tracking-wider truncate w-full text-center px-1 md:text-xs md:font-bold md:tracking-widest md:text-left md:px-0 md:ml-3.5">Podijum</span>
        </button>

        {/* 5. STATISTIKA */}
        <button
          onClick={() => navigateToView("statistics")}
          className={`flex flex-col items-center justify-center flex-1 min-w-0 h-12 transition-all active:scale-90 md:flex-row md:justify-start md:flex-initial md:h-12 md:px-4 md:rounded-xl md:active:scale-95 ${
            currentView === "statistics" 
              ? "text-yellow-400 font-black scale-105 md:scale-100 md:bg-yellow-400/[0.08] md:text-yellow-400" 
              : "text-white/40 font-bold md:text-white/60 md:hover:bg-white/[0.03] md:hover:text-white"
          }`}
        >
          <span className="text-xl mb-0.5 shrink-0 md:mb-0 md:text-lg">📊</span>
          <span className="text-[9px] uppercase tracking-wider truncate w-full text-center px-1 md:text-xs md:font-bold md:tracking-widest md:text-left md:px-0 md:ml-3.5">Statistika</span>
        </button>

      </div>
    </div>
  );
}