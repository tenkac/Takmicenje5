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
    <div
      className="min-h-screen flex flex-col relative overflow-hidden font-sans pb-16"
      style={{ background: 'linear-gradient(165deg, #05091a 0%, #080d20 45%, #040810 100%)' }}
    >
      {/* ── JERSEY DIAGONAL STRIPE TEXTURE ── */}
      <div className="fixed inset-0 wc-jersey-bg pointer-events-none opacity-40" />

      {/* ── STADIUM FLOODLIGHTS ── */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div
          className="wc-beam-l absolute"
          style={{ top: 0, left: '15%', width: '320px', height: '75vh', background: 'linear-gradient(178deg, rgba(250,204,21,0.25) 0%, transparent 85%)', transformOrigin: 'top center', filter: 'blur(44px)' }}
        />
        <div
          className="wc-beam-r absolute"
          style={{ top: 0, right: '15%', width: '320px', height: '75vh', background: 'linear-gradient(178deg, rgba(250,204,21,0.25) 0%, transparent 85%)', transformOrigin: 'top center', filter: 'blur(44px)' }}
        />
        <div style={{ position: 'absolute', top: '-80px', left: '50%', transform: 'translateX(-50%)', width: '800px', height: '550px', background: 'radial-gradient(ellipse at top, rgba(250,204,21,0.09) 0%, transparent 65%)' }} />
        <div style={{ position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '90vw', height: '40vh', background: 'radial-gradient(ellipse at bottom, rgba(34,197,94,0.09) 0%, transparent 70%)' }} />
      </div>

      {/* ── CONFETTI CASCADE ── */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden select-none opacity-60">
        <div className="wc-confetti-1  absolute w-2.5 h-4 rounded-sm bg-yellow-400"   style={{ left: '6%',  top: '-12px', rotate: '45deg' }} />
        <div className="wc-confetti-2  absolute w-4 h-2.5 rounded-sm bg-red-500"     style={{ left: '17%', top: '-12px', rotate: '30deg' }} />
        <div className="wc-confetti-3  absolute w-3 h-3 rounded-full bg-blue-500"    style={{ left: '29%', top: '-12px' }} />
        <div className="wc-confetti-4  absolute w-2.5 h-4 rounded-sm bg-green-400"   style={{ left: '41%', top: '-12px', rotate: '-25deg' }} />
        <div className="wc-confetti-5  absolute w-4 h-2.5 rounded-sm bg-yellow-300"  style={{ left: '53%', top: '-12px', rotate: '60deg' }} />
        <div className="wc-confetti-6  absolute w-3 h-3 rounded-full bg-red-400"    style={{ left: '64%', top: '-12px' }} />
        <div className="wc-confetti-7  absolute w-2.5 h-4 rounded-sm bg-white/50"    style={{ left: '75%', top: '-12px', rotate: '-45deg' }} />
        <div className="wc-confetti-8  absolute w-4 h-2 bg-yellow-500 rounded"       style={{ left: '87%', top: '-12px', rotate: '20deg' }} />
        <div className="wc-confetti-9  absolute w-2.5 h-3.5 rounded-sm bg-blue-400"  style={{ left: '11%', top: '-12px', rotate: '-30deg' }} />
        <div className="wc-confetti-10 absolute w-3.5 h-2.5 rounded-sm bg-green-300" style={{ left: '94%', top: '-12px', rotate: '50deg' }} />
      </div>

      {/* ── FLOATING SOCCER BALLS ── */}
      <div className="fixed inset-0 pointer-events-none select-none overflow-hidden">
        <span className="wc-float      absolute text-7xl" style={{ opacity: 0.05, top: '15%',    left: '5%'  }}>⚽</span>
        <span className="wc-float-slow absolute text-[10rem]" style={{ opacity: 0.03, top: '50%',    right: '3%' }}>⚽</span>
        <span className="wc-float-med  absolute text-5xl" style={{ opacity: 0.06, top: '32%',    right: '8%' }}>⚽</span>
        <span className="wc-float      absolute text-6xl" style={{ opacity: 0.04, bottom: '25%', left: '8%'  }}>⚽</span>
      </div>

      {/* ── MAIN MASSIVE HERO CONTENT ── */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-5 py-12 w-full max-w-4xl mx-auto text-center">

        {/* EYEBROW */}
        <div className="wc-slide-up-1 flex items-center justify-center gap-3 mb-8 w-full max-w-full text-center">
          <div className="h-px w-10 bg-gradient-to-r from-transparent to-yellow-400/40" />
          <div className="px-5 py-2 rounded-full border border-yellow-400/30 bg-yellow-400/5 backdrop-blur-md">
            <span className="text-yellow-400 text-xs font-black uppercase tracking-[0.35em] block">⚽ USA · CANADA · MEXICO 2026</span>
          </div>
          <div className="h-px w-10 bg-gradient-to-l from-transparent to-yellow-400/40" />
        </div>

        {/* MASSIVE HERO CONTAINER */}
        <div className="wc-slide-up-2 text-center mb-8">
          <div className="wc-gold-pulse text-[7.5rem] md:text-[11rem] leading-none mb-4 select-none filter drop-shadow-[0_15px_30px_rgba(0,0,0,0.6)]">
            🏆
          </div>
          <h1 className="font-black uppercase leading-none tracking-tight">
            <span className="block text-5xl md:text-8xl text-white tracking-wide mb-1" style={{ textShadow: '0 0 70px rgba(255,255,255,0.1)' }}>
              WORLD CUP
            </span>
            <span className="wc-shine-text block text-7xl md:text-[10.5rem] tracking-tighter drop-shadow-[0_0_30px_rgba(250,204,21,0.2)]">
              2026
            </span>
          </h1>
          <p className="mt-4 text-white/30 text-sm font-black uppercase tracking-[0.6em] border-t border-b border-white/5 py-2 inline-block px-6">
            TAKMIČENJE EDITION
          </p>
        </div>

        {/* HOST NATIONS EMOJI BAR */}
        <div
          className="wc-slide-up-3 flex items-center justify-center gap-4 px-6 py-3 rounded-2xl mb-12 backdrop-blur-md"
          style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}
        >
          <div className="flex items-center gap-2">
            <span className="text-xl">🇺🇸</span>
            <span className="text-xs font-black uppercase tracking-widest text-gray-500">USA</span>
          </div>
          <div className="w-px h-5 bg-white/10" />
          <div className="flex items-center gap-2">
            <span className="text-xl">🇨🇦</span>
            <span className="text-xs font-black uppercase tracking-widest text-gray-500">CANADA</span>
          </div>
          <div className="w-px h-5 bg-white/10" />
          <div className="flex items-center gap-2">
            <span className="text-xl">🇲🇽</span>
            <span className="text-xs font-black uppercase tracking-widest text-gray-500">MEXICO</span>
          </div>
        </div>

        {/* QUICK STATS INFOGRAPHIC ROW */}
        <div className="wc-slide-up-4 flex gap-8 md:gap-16 opacity-50 hover:opacity-90 transition-opacity duration-300 bg-black/30 border border-white/5 px-8 py-4 rounded-2xl backdrop-blur-sm">
          {[
            { value: '5',    label: 'Igrača' },
            { value: '48',   label: 'Nacija' },
            { value: '2026', label: 'Sezona' },
          ].map((s, i) => (
            <React.Fragment key={s.label}>
              {i > 0 && <div className="w-px h-8 bg-white/10 self-center" />}
              <div className="text-center">
                <div className="text-xl sm:text-2xl font-black text-white">{s.value}</div>
                <div className="text-[9px] text-gray-500 uppercase font-black tracking-widest mt-0.5">{s.label}</div>
              </div>
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* ── SCOREBOARD TICKER ── */}
      <div className="relative z-10 w-full overflow-hidden py-3" style={{ borderTop: '1px solid rgba(255,255,255,0.05)', background: 'rgba(0,0,0,0.3)' }}>
        <div className="wc-ticker whitespace-nowrap inline-block">
          {[0, 1].map(i => (
            <span key={i} className="text-[10px] font-black uppercase tracking-[0.35em] text-yellow-400/20 px-2">
              ⚽&nbsp; WORLD CUP 2026 &nbsp;·&nbsp; SVE OPCIJE SU NA STICKY TRAZI ISPOD &nbsp;·&nbsp; 48 NACIJA &nbsp;·&nbsp; JEDNA TITULA &nbsp;·&nbsp; TAKMIČENJE EDITION &nbsp;·&nbsp;
            </span>
          ))}
        </div>
      </div>

      {/* ── SECURE LOGOUT FOOTER ZONE ── */}
      <div className="relative z-10 w-full flex justify-center py-6 pb-8">
        <button
          onClick={handleLogout}
          className="group flex items-center gap-2 px-6 py-3 rounded-full hover:bg-red-500/10 hover:border-red-500/20 transition-all duration-200 shadow-xl active:scale-95"
          style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}
        >
          <div className="w-2 h-2 rounded-full bg-red-500/60 group-hover:animate-ping" />
          <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 group-hover:text-red-400 transition-colors">
            Odjavi se sa profila
          </span>
        </button>
      </div>
    </div>
  );
}