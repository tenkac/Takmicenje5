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

// ── 👆 IMPORTUJEMO SWIPER ──
import { Swiper, SwiperSlide } from 'swiper/react';
import type { Swiper as SwiperType } from 'swiper';
import 'swiper/css'; 

const Statistics = dynamic(() => import("../components/Statistics"), { ssr: false });

type AppView = "landing" | "leaderboard" | "tables" | "statistics" | "predictor";

const VIEW_ORDER: AppView[] = ["predictor", "tables", "landing", "leaderboard", "statistics"];

export default function BettingApp() {
  const [activeIndex, setActiveIndex] = useState<number>(2); 
  const currentView = VIEW_ORDER[activeIndex];
  
  // Čuvamo referencu na Swiper instancu kako bi Bottom Bar mogao da je kontroliše
  const [swiperInstance, setSwiperInstance] = useState<SwiperType | null>(null);

  const [activePlayer, setActivePlayer] = useState<string>("Vlado");
  const [allBets, setAllBets] = useState<AllPlayersData>({
    Vlado: [], Fika: [], Labud: [], Ilija: [], Dzoni: [],
  });
  const [session, setSession] = useState<any>(null);
  const [appLoading, setAppLoading] = useState(true);
  
  const lastFetched = useRef<number>(0);
  const REFRESH_THRESHOLD = 900000; 

  const lastLeaderboardFetched = useRef<number>(0);
  const LEADERBOARD_REFRESH_THRESHOLD = 600000; 

  const refreshIfStale = async () => {
    const now = Date.now();
    const timePassed = now - lastFetched.current;
    if (timePassed > REFRESH_THRESHOLD) await fetchBetsData();
  };

  const refreshLeaderboardIfStale = async () => {
    const now = Date.now();
    const timePassed = now - lastLeaderboardFetched.current;
    if (timePassed > LEADERBOARD_REFRESH_THRESHOLD) {
      await fetchBetsData();
      lastLeaderboardFetched.current = Date.now();
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
  }, []);

  const handleRefresh = async () => {
    if (navigator.vibrate) navigator.vibrate(50);
    await fetchBetsData();
  };

  const savePlayerToDb = async (playerName: string, rows: BettingRow[]) => {
    const { error } = await supabase.from('player_bets').update({ bets: rows }).eq('player_name', playerName);
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
    if (emailPrefix === "vladoadmin") return "Vlado";
    return emailPrefix.charAt(0).toUpperCase() + emailPrefix.slice(1).toLowerCase();
  };

  const handleMyPicksTabClick = async () => {
    const myName = getLoggedInPlayerName();
    setActivePlayer(myName);
    await refreshIfStale();
  };

  // ── FUNKCIJA KOJU ZOVE BOTTOM BAR ──
  const navigateToView = (nextView: AppView) => {
    const nextIndex = VIEW_ORDER.indexOf(nextView);
    if (swiperInstance) {
      // Swiper animira prelaz na taj slide
      swiperInstance.slideTo(nextIndex);
    }
  };

  const navigateBack = () => {
    if (swiperInstance) swiperInstance.slideTo(2); // Vraća na landing
  };

  if (appLoading) return (
    <div className="h-screen flex flex-col items-center justify-center text-white font-sans p-6 text-center relative overflow-hidden" style={{ background: 'linear-gradient(165deg, #05091a 0%, #080d20 45%, #040810 100%)' }}>
      <div className="fixed inset-0 wc-jersey-bg pointer-events-none" />
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="wc-beam-l absolute" style={{ top: 0, left: '22%', width: '240px', height: '70vh', background: 'linear-gradient(178deg, rgba(250,204,21,0.18) 0%, transparent 80%)', filter: 'blur(38px)' }} />
        <div className="wc-beam-r absolute" style={{ top: 0, right: '22%', width: '240px', height: '70vh', background: 'linear-gradient(178deg, rgba(250,204,21,0.18) 0%, transparent 80%)', filter: 'blur(38px)' }} />
      </div>
      <div className="relative z-10 text-center">
        <div className="wc-gold-pulse text-7xl mb-6 select-none">🏆</div>
        <h1 className="text-4xl md:text-7xl font-black uppercase tracking-tighter leading-none mb-2">WORLD CUP <span className="wc-shine-text">2026</span></h1>
        <div className="flex items-center justify-center gap-2 mt-6">
          <div className="w-2 h-2 rounded-full animate-bounce [animation-delay:-0.3s]" style={{ background: '#facc15' }} />
          <div className="w-2 h-2 rounded-full animate-bounce [animation-delay:-0.15s]" style={{ background: '#facc15' }} />
          <div className="w-2 h-2 rounded-full animate-bounce" style={{ background: '#facc15' }} />
        </div>
      </div>
    </div>
  );

  if (!session) return <Login onLogin={() => { }} />;

  const renderView = (view: AppView) => {
    switch (view) {
      case "predictor": return <WCPredictor activePlayer={getLoggedInPlayerName()} />;
      case "tables": return <PlayerTable allBets={allBets} activePlayer={activePlayer} setActivePlayer={setActivePlayer} onAddPick={addPick} onToggleStatus={toggleStatus} userEmail={session.user.email} />;
      case "landing": return <LandingPage onNavigate={navigateToView} />;
      case "leaderboard": return <Leaderboard allBets={allBets} onPlayerClick={name => { setActivePlayer(name); navigateToView("tables"); }} />;
      case "statistics": return <Statistics allBets={allBets} onBack={navigateBack} />;
    }
  };

  return (
    <div className="h-screen bg-black text-white relative overflow-hidden md:pl-60">
      <PullToRefresh onRefresh={handleRefresh}>
        
        <Swiper
          onSwiper={setSwiperInstance}
          initialSlide={2}
          
          // Uklonili smo onSlideChange. React ne radi NIŠTA dok prst vuče ekran.
          // Ovo garantuje čistih 60 FPS na mobilnom.

          // OVO SE DEŠAVA TEK KAD SE ANIMACIJA FIZIČKI ZAVRŠI I EKRAN UMIRI
          onSlideChangeTransitionEnd={(swiper) => {
            const newIndex = swiper.activeIndex;
            
            // 1. Ažuriraj Bottom Bar
            setActiveIndex(newIndex);
            
            // 2. Osveži bazu ako je potrebno
            if (VIEW_ORDER[newIndex] === "tables") handleMyPicksTabClick();
            if (VIEW_ORDER[newIndex] === "leaderboard") refreshLeaderboardIfStale();
          }}

          speed={450} 
          touchRatio={1.2} 
          resistanceRatio={0} 
          // Dodat transform-gpu za hardversko ubrzanje na mobilnom
          className="w-full h-full transform-gpu will-change-transform"
        >
          {VIEW_ORDER.map((view) => (
            <SwiperSlide key={view} className="w-full h-full transform-gpu">
              <div className="w-full h-full overflow-y-auto overflow-x-hidden pb-24 md:pb-0 overscroll-y-contain">
                {renderView(view)}
              </div>
            </SwiperSlide>
          ))}
        </Swiper>

      </PullToRefresh>

      {/* ── BOTTOM NAVIGATION ── */}
      <div className="fixed bottom-0 left-0 right-0 pt-2 pb-[calc(env(safe-area-inset-bottom)+20px)] bg-[#05091a]/90 border-t border-white/10 backdrop-blur-2xl flex justify-around items-center z-[999] shadow-[0_-12px_40px_rgba(0,0,0,0.8)] px-2 w-full max-w-full overflow-hidden touch-none md:top-0 md:bottom-0 md:left-0 md:right-auto md:w-60 md:h-screen md:flex-col md:justify-start md:items-stretch md:pt-10 md:px-4 md:gap-2 md:border-t-0 md:border-r md:pb-8 md:shadow-[12px_0_40px_rgba(0,0,0,0.5)]">
        <div className="hidden md:flex flex-col items-center mb-8 px-2 text-center border-b border-white/5 pb-6">
          <span className="text-3xl mb-1.5 select-none animate-pulse">🏆</span>
          <h2 className="text-sm font-black uppercase tracking-[0.25em] text-yellow-400">WC 2026</h2>
          <span className="text-[9px] text-white/30 font-bold uppercase tracking-widest mt-0.5">Betting App</span>
        </div>

        {VIEW_ORDER.map((view) => {
          const icons: Record<AppView, string> = { predictor: "🔮", tables: "📝", landing: "🏠", leaderboard: "🏆", statistics: "📊" };
          const labels: Record<AppView, string> = { predictor: "Prognoza", tables: "Tabele", landing: "Meni", leaderboard: "Podijum", statistics: "Statistika" };
          const isActive = currentView === view;

          return (
            <button key={view} onClick={() => navigateToView(view)} className={`flex flex-col items-center justify-center flex-1 min-w-0 h-12 transition-all active:scale-90 md:flex-row md:justify-start md:flex-initial md:h-12 md:px-4 md:rounded-xl md:active:scale-95 ${isActive ? "text-yellow-400 font-black scale-105 md:scale-100 md:bg-yellow-400/[0.08] md:text-yellow-400" : "text-white/40 font-bold md:text-white/60 md:hover:bg-white/[0.03] md:hover:text-white"}`}>
              <span className="text-xl mb-0.5 shrink-0 md:mb-0 md:text-lg">{icons[view]}</span>
              <span className="text-[9px] uppercase tracking-wider truncate w-full text-center px-1 md:text-xs md:font-bold md:tracking-widest md:text-left md:px-0 md:ml-3.5">{labels[view]}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}