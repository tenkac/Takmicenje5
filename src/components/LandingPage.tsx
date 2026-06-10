"use client";
import React from 'react';
import { supabase } from '../lib/supabase';

interface Props {
  onNavigate: (view: "landing" | "leaderboard" | "tables" | "statistics" | "predictor") => void;
}

export default function LandingPage({ onNavigate }: Props) {
  const handleLogout = async () => { 
    if (navigator.vibrate) navigator.vibrate([15, 30]);
    await supabase.auth.signOut(); 
  };

  return (
    // ── OUTER VIEWPORT WRAPPER (centers the app column on desktop) ──
    <div className="min-h-screen w-full bg-[#05091a] flex justify-center font-sans">

      {/* ── APP COLUMN (the "phone") ── */}
      <div className="relative w-full max-w-md min-h-screen flex flex-col overflow-hidden pb-6">

        {/* ── CINEMATIC BACKDROP ── */}
        <div className="absolute inset-x-0 top-0 h-[58vh] z-0 select-none pointer-events-none">
          <img 
            src="/grupnazivakropovana.webp" 
            alt="World Cup Backdrop" 
            className="w-full h-full object-cover object-top opacity-[0.55] scale-100" 
            loading="eager"
          />

          {/* ── THE GRADIENT FIX ── */}
          {/* A single clean transition: perfectly clear at the top to preserve faces, 
              then smoothly dissolving perfectly flush into solid #05091a starting at 65% down */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#05091a]/20 via-transparent via-[40%] to-[#05091a] to-[98%]" />
          
          {/* Side masks keep faces clean on narrow displays */}
          <div className="absolute inset-y-0 left-0 w-10 bg-gradient-to-r from-[#05091a] to-transparent" />
          <div className="absolute inset-y-0 right-0 w-10 bg-gradient-to-l from-[#05091a] to-transparent" />
        </div>

        {/* ── JERSEY STRIPE TEXTURE ── */}
        <div className="absolute inset-0 wc-jersey-bg pointer-events-none opacity-15 z-0" />

        {/* ── HERO: trophy + title, dropped down to the players' feet (~middle) ── */}
        <div className="relative z-10 flex flex-col items-center text-center px-5 pt-[40vh]">
          <div className="relative flex flex-col items-center">

            {/* Soft gold glow so the title lifts off the dark background */}
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 rounded-full bg-yellow-400/10 blur-3xl pointer-events-none" />

            {/* EYEBROW */}
            <div className="wc-slide-up-1 relative flex items-center justify-center gap-2 mb-5 w-full max-w-xs">
             
            </div>

            {/* TROPHY */}
            <div className="wc-slide-up-2 wc-gold-pulse relative text-6xl drop-shadow-[0_10px_30px_rgba(0,0,0,0.9)] mb-1 select-none">
              🏆
            </div>

            {/* TITLE */}
            <h1 className="wc-slide-up-2 relative font-black uppercase tracking-tight">
              <span className="block text-3xl text-white tracking-wider" style={{ textShadow: '0 4px 18px rgba(0,0,0,0.95)' }}>
                WORLD CUP
              </span>
              <span className="wc-shine-text block text-5xl tracking-tighter drop-shadow-[0_8px_20px_rgba(0,0,0,0.95)]">
                2026
              </span>
            </h1>

            {/* Thin gold accent under the title */}
            <div className="wc-slide-up-2 relative mt-3 h-px w-24 bg-gradient-to-r from-transparent via-yellow-400/50 to-transparent" />
          </div>
        </div>

        {/* Flexible gap pushes the content + footer to the bottom */}
        <div className="flex-1 min-h-[4vh]" />

        {/* ── CONTENT: host nations + stats ── */}
        <div className="relative z-10 w-full px-5 flex flex-col items-center">

          {/* HOST NATIONS PILL */}
          <div className="wc-slide-up-3 flex items-center justify-center gap-3 px-4 py-2 rounded-xl mb-6 bg-black/40 backdrop-blur-md border border-white/5 shadow-lg">
            <div className="flex items-center gap-1.5">
              <span className="text-base">🇺🇸</span>
              <span className="text-[9px] font-black text-gray-400 tracking-wider">USA</span>
            </div>
            <div className="w-px h-3 bg-white/10" />
            <div className="flex items-center gap-1.5">
              <span className="text-base">🇨🇦</span>
              <span className="text-[9px] font-black text-gray-400 tracking-wider">CAN</span>
            </div>
            <div className="w-px h-3 bg-white/10" />
            <div className="flex items-center gap-1.5">
              <span className="text-base">🇲🇽</span>
              <span className="text-[9px] font-black text-gray-400 tracking-wider">MEX</span>
            </div>
          </div>

          {/* STATS GRID */}
          <div className="wc-slide-up-4 w-full max-w-sm grid grid-cols-3 gap-0 bg-black/60 border border-white/10 rounded-2xl backdrop-blur-lg shadow-2xl divide-x divide-white/5 overflow-hidden">
            {[
              { value: '5',    label: 'Igrača' },
              { value: '48',   label: 'Nacija' },
              { value: '2026', label: 'Sezona' },
            ].map((s) => (
              <div key={s.label} className="text-center py-3.5 px-2 active:bg-white/5 transition-colors duration-150">
                <div className="text-lg font-black text-white tracking-wide">{s.value}</div>
                <div className="text-[9px] text-gray-400 uppercase font-bold tracking-widest mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── FOOTER & ACTIONS ── */}
        <div className="relative z-10 w-full flex flex-col items-center mt-6">

          {/* SCOREBOARD TICKER */}
          <div className="w-full overflow-hidden py-2 bg-black/40 border-y border-white/5 mb-4">
            <div className="wc-ticker whitespace-nowrap inline-block">
              {[0, 1].map(i => (
                <span key={i} className="text-[9px] font-bold uppercase tracking-[0.3em] text-yellow-400/20 px-2">
                  ⚽ WORLD CUP 2026 · TAKMIČENJE EDITION · JEDNA TITULA · 
                </span>
              ))}
            </div>
          </div>

          {/* LOGOUT BUTTON */}
          <div className="w-full px-5 max-w-sm flex justify-center">
            <button
              onClick={handleLogout}
              className="group w-full flex items-center justify-center gap-2.5 py-3.5 rounded-xl bg-black/30 hover:bg-red-500/10 active:bg-red-500/20 border border-white/5 active:scale-[0.98] transition-all duration-200 shadow-md"
            >
              <div className="w-1.5 h-1.5 rounded-full bg-red-500/60" />
              <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 transition-colors">
                Odjavi se sa profila
              </span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}