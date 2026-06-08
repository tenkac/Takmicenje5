"use client";
import React, { useState, useEffect } from "react";
import { AllPlayersData, Match, BettingRow, EMPTY_MATCH } from "../types";
import LandingPage   from "../components/LandingPage";
import Leaderboard   from "../components/Leaderboard";
import PlayerTable   from "../components/PlayerTable";
import Login         from "../components/Login";
import PullToRefresh from "../components/PullToRefresh";
import WCPredictor   from "../components/WCPredictor"; // 👈 IMPORTED PREDICTOR
import dynamic       from "next/dynamic";
import { supabase }  from "../lib/supabase";

const Statistics = dynamic(() => import("../components/Statistics"), { ssr: false });

export default function BettingApp() {
  // 👇 ADDED "predictor" TO ALLOWED VIEWS
  const [currentView, setCurrentView] = useState<"landing" | "leaderboard" | "tables" | "statistics" | "predictor">("landing");
  const [activePlayer, setActivePlayer] = useState<string>("Vlado");
  const [allBets, setAllBets] = useState<AllPlayersData>({
    Vlado: [], Fika: [], Labud: [], Ilija: [], Dzoni: [],
  });
  const [session, setSession]     = useState<any>(null);
  const [appLoading, setAppLoading] = useState(true);

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

  // 👇 ADD THIS HELPER FUNCTION
  const getLoggedInPlayerName = () => {
    if (!session?.user?.email) return "Vlado"; // Fallback just in case
    const name = session.user.email.split('@')[0];
    return name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
  };

  // ── LOADING ──────────────────────────────────────────────────────────────────
  if (appLoading) return (
    <div
      className="h-screen flex flex-col items-center justify-center text-white font-sans p-6 text-center relative overflow-hidden"
      style={{ background: 'linear-gradient(165deg, #05091a 0%, #080d20 45%, #040810 100%)' }}
    >
      <div className="fixed inset-0 wc-jersey-bg pointer-events-none" />
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="wc-beam-l absolute" style={{ top: 0, left: '22%', width: '240px', height: '70vh', background: 'linear-gradient(178deg, rgba(250,204,21,0.18) 0%, transparent 80%)', transformOrigin: 'top center', filter: 'blur(38px)' }} />
        <div className="wc-beam-r absolute" style={{ top: 0, right: '22%', width: '240px', height: '70vh', background: 'linear-gradient(178deg, rgba(250,204,21,0.18) 0%, transparent 80%)', transformOrigin: 'top center', filter: 'blur(38px)' }} />
        <div style={{ position: 'absolute', top: '-80px', left: '50%', transform: 'translateX(-50%)', width: '600px', height: '450px', background: 'radial-gradient(ellipse at top, rgba(250,204,21,0.07) 0%, transparent 65%)' }} />
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
        <p className="mt-4 text-[10px] font-bold text-gray-600 uppercase tracking-[0.4em]">Authenticating</p>
      </div>
    </div>
  );

  // ── LOGIN ────────────────────────────────────────────────────────────────────
  if (!session) return <Login onLogin={() => {}} />;

  // ── VIEWS ────────────────────────────────────────────────────────────────────
  if (currentView === "landing") {
    return <LandingPage onNavigate={setCurrentView} />;
  }

  if (currentView === "leaderboard") {
    return (
      <PullToRefresh onRefresh={handleRefresh}>
        <div className="min-h-screen bg-black">
          <Leaderboard
            allBets={allBets}
            onBack={() => setCurrentView("landing")}
            onPlayerClick={name => { setActivePlayer(name); setCurrentView("tables"); }}
            onViewStats={() => setCurrentView("statistics")}
          />
        </div>
      </PullToRefresh>
    );
  }

  if (currentView === "statistics") {
    return (
      <PullToRefresh onRefresh={handleRefresh}>
        <div className="min-h-screen bg-black">
          <Statistics allBets={allBets} onBack={() => setCurrentView("leaderboard")} />
        </div>
      </PullToRefresh>
    );
  }

  // 👇 ADDED PREDICTOR VIEW ROUTING
  if (currentView === "predictor") {
    return (
      // 👇 REMOVE THE <PullToRefresh> WRAPPER FROM HERE
      <div className="min-h-screen bg-black">
        <WCPredictor 
          onBack={() => setCurrentView("landing")} 
          activePlayer={getLoggedInPlayerName()} 
        />
      </div>
    );
  }

  return (
    <PullToRefresh onRefresh={handleRefresh}>
      <div className="min-h-screen bg-black text-white">
        <PlayerTable
          allBets={allBets}
          activePlayer={activePlayer}
          setActivePlayer={setActivePlayer}
          onAddPick={addPick}
          onToggleStatus={toggleStatus}
          onBack={() => setCurrentView("landing")}
          userEmail={session.user.email}
        />
      </div>
    </PullToRefresh>
  );
}