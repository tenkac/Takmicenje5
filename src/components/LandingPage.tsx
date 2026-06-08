"use client";
import React from 'react';
import { supabase } from '../lib/supabase';

interface Props {
  onNavigate: (view: "leaderboard" | "tables" | "predictor") => void;
}

export default function LandingPage({ onNavigate }: Props) {
  const handleLogout = async () => { await supabase.auth.signOut(); };

  return (
    <div
      className="min-h-screen flex flex-col relative overflow-hidden font-sans"
      style={{ background: 'linear-gradient(165deg, #05091a 0%, #080d20 45%, #040810 100%)' }}
    >

      {/* ── JERSEY DIAGONAL STRIPE TEXTURE ── */}
      <div className="fixed inset-0 wc-jersey-bg pointer-events-none" />

      {/* ── STADIUM FLOODLIGHTS ── */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div
          className="wc-beam-l absolute"
          style={{ top: 0, left: '22%', width: '280px', height: '72vh', background: 'linear-gradient(178deg, rgba(250,204,21,0.22) 0%, transparent 85%)', transformOrigin: 'top center', filter: 'blur(38px)' }}
        />
        <div
          className="wc-beam-r absolute"
          style={{ top: 0, right: '22%', width: '280px', height: '72vh', background: 'linear-gradient(178deg, rgba(250,204,21,0.22) 0%, transparent 85%)', transformOrigin: 'top center', filter: 'blur(38px)' }}
        />
        <div style={{ position: 'absolute', top: '-80px', left: '50%', transform: 'translateX(-50%)', width: '700px', height: '500px', background: 'radial-gradient(ellipse at top, rgba(250,204,21,0.07) 0%, transparent 65%)' }} />
        <div style={{ position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '90vw', height: '35vh', background: 'radial-gradient(ellipse at bottom, rgba(34,197,94,0.07) 0%, transparent 70%)' }} />
      </div>

      {/* ── CONFETTI CASCADE ── */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden select-none">
        <div className="wc-confetti-1  absolute w-2 h-3.5 rounded-sm bg-yellow-400"   style={{ left: '6%',  top: '-12px', rotate: '45deg' }} />
        <div className="wc-confetti-2  absolute w-3.5 h-2 rounded-sm bg-red-500"     style={{ left: '17%', top: '-12px', rotate: '30deg' }} />
        <div className="wc-confetti-3  absolute w-2.5 h-2.5 rounded-full bg-blue-500" style={{ left: '29%', top: '-12px' }} />
        <div className="wc-confetti-4  absolute w-2 h-3.5 rounded-sm bg-green-400"   style={{ left: '41%', top: '-12px', rotate: '-25deg' }} />
        <div className="wc-confetti-5  absolute w-3.5 h-2 rounded-sm bg-yellow-300"  style={{ left: '53%', top: '-12px', rotate: '60deg' }} />
        <div className="wc-confetti-6  absolute w-2.5 h-2.5 rounded-full bg-red-400" style={{ left: '64%', top: '-12px' }} />
        <div className="wc-confetti-7  absolute w-2 h-3.5 rounded-sm bg-white/50"    style={{ left: '75%', top: '-12px', rotate: '-45deg' }} />
        <div className="wc-confetti-8  absolute w-3.5 h-1.5 bg-yellow-500 rounded"   style={{ left: '87%', top: '-12px', rotate: '20deg' }} />
        <div className="wc-confetti-9  absolute w-2 h-2.5 rounded-sm bg-blue-400"    style={{ left: '11%', top: '-12px', rotate: '-30deg' }} />
        <div className="wc-confetti-10 absolute w-3 h-2 rounded-sm bg-green-300"     style={{ left: '94%', top: '-12px', rotate: '50deg' }} />
      </div>

      {/* ── FLOATING SOCCER BALLS ── */}
      <div className="fixed inset-0 pointer-events-none select-none overflow-hidden">
        <span className="wc-float      absolute text-6xl" style={{ opacity: 0.06, top: '12%',    left: '4%'  }}>⚽</span>
        <span className="wc-float-slow absolute text-9xl" style={{ opacity: 0.04, top: '55%',    right: '2%' }}>⚽</span>
        <span className="wc-float-med  absolute text-4xl" style={{ opacity: 0.07, top: '38%',    right: '6%' }}>⚽</span>
        <span className="wc-float      absolute text-5xl" style={{ opacity: 0.05, bottom: '22%', left: '7%'  }}>⚽</span>
        <span className="wc-float-slow absolute text-3xl" style={{ opacity: 0.08, top: '75%',    left: '88%' }}>⚽</span>
      </div>

      {/* ── MAIN CONTENT ── */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 sm:px-5 py-6 sm:py-10 w-full max-w-6xl mx-auto">

        {/* 👇 FIXED EYEBROW: Added justify-center, responsive tracking, and hid side lines on mobile */}
        <div className="wc-slide-up-1 flex items-center justify-center gap-2 sm:gap-3 mb-7 w-full max-w-full text-center">
          <div className="hidden sm:block h-px w-8 md:w-12 bg-gradient-to-r from-transparent to-yellow-400/50" />
          <div className="px-3 sm:px-4 py-1.5 rounded-full" style={{ border: '1px solid rgba(250,204,21,0.28)', background: 'rgba(250,204,21,0.06)' }}>
            <span className="text-yellow-400 text-[9px] sm:text-[10px] font-black uppercase tracking-[0.18em] sm:tracking-[0.35em] block">⚽ USA · CANADA · MEXICO 2026</span>
          </div>
          <div className="hidden sm:block h-px w-8 md:w-12 bg-gradient-to-l from-transparent to-yellow-400/50" />
        </div>

        {/* TROPHY + TITLE HERO */}
        <div className="wc-slide-up-2 text-center mb-6 sm:mb-7">
          <div className="wc-gold-pulse text-[5rem] md:text-[8rem] leading-none mb-3 select-none">🏆</div>
          <h1 className="font-black uppercase leading-none tracking-[-0.03em]">
            <span className="block text-4xl md:text-8xl text-white" style={{ textShadow: '0 0 60px rgba(255,255,255,0.08)' }}>
              WORLD CUP
            </span>
            <span className="wc-shine-text block text-6xl md:text-[9rem]">2026</span>
          </h1>
          <p className="mt-2 text-white/20 text-xs font-black uppercase tracking-[0.5em]">TAKMIČENJE EDITION</p>
          <p className="mt-3 text-gray-500 text-xs sm:text-sm max-w-xs mx-auto font-medium leading-relaxed px-4">
            48 nacija. Jedna titula. Tvoj trofej čeka.
          </p>
        </div>

        {/* UPDATED HOST NATIONS BAR: Using emojis for cleaner code and consistency */}
        <div
          className="wc-slide-up-3 flex items-center justify-center gap-2.5 sm:gap-3 mb-10 px-4 sm:px-5 py-2.5 sm:py-3 rounded-full max-w-full"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}
        >
          <div className="flex items-center gap-1.5 sm:gap-2">
            <span className="text-base sm:text-lg">🇺🇸</span>
            <span className="text-[9px] font-black uppercase tracking-widest text-gray-400">USA</span>
          </div>
          <div className="w-px h-4 sm:h-5 bg-white/10" />
          <div className="flex items-center gap-1.5 sm:gap-2">
            <span className="text-base sm:text-lg">🇨🇦</span>
            <span className="text-[9px] font-black uppercase tracking-widest text-gray-400">CANADA</span>
          </div>
          <div className="w-px h-4 sm:h-5 bg-white/10" />
          <div className="flex items-center gap-1.5 sm:gap-2">
            <span className="text-base sm:text-lg">🇲🇽</span>
            <span className="text-[9px] font-black uppercase tracking-widest text-gray-400">MEXICO</span>
          </div>
        </div>

        {/* NAVIGATION CARDS */}
        <div className="wc-slide-up-4 grid grid-cols-1 md:grid-cols-3 gap-5 w-full max-w-5xl mb-12">

          {/* PODIJUM */}
          <button
            onClick={() => onNavigate("leaderboard")}
            className="group relative overflow-hidden rounded-2xl text-left active:scale-[0.97] transition-transform duration-150"
            style={{ background: 'linear-gradient(140deg, rgba(250,204,21,0.13) 0%, rgba(180,130,0,0.05) 100%)', border: '1px solid rgba(250,204,21,0.22)', boxShadow: 'inset 0 1px 0 rgba(250,204,21,0.08)' }}
          >
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl" style={{ background: 'linear-gradient(140deg, rgba(250,204,21,0.18) 0%, transparent 60%)' }} />
            <div className="absolute right-3 top-3 text-[90px] opacity-[0.07] group-hover:opacity-[0.16] group-hover:scale-110 group-hover:rotate-12 transition-all duration-500 select-none leading-none">🏆</div>
            <div className="relative p-6 sm:p-8">
              <div className="text-3xl sm:text-4xl mb-3 sm:mb-4 leading-none">🥇</div>
              <h2 className="text-xl sm:text-2xl font-black text-white uppercase tracking-tight mb-1">Podijum</h2>
              <p className="text-gray-500 text-xs sm:text-sm mb-5 sm:mb-6">Ko je šampion sezone?</p>
              <div className="inline-flex items-center gap-2 text-yellow-400 font-black text-[10px] sm:text-[11px] uppercase tracking-[0.2em]">
                RANG LISTA <span className="group-hover:translate-x-1.5 transition-transform duration-200">→</span>
              </div>
            </div>
          </button>

          {/* TABELE */}
          <button
            onClick={() => onNavigate("tables")}
            className="group relative overflow-hidden rounded-2xl text-left active:scale-[0.97] transition-transform duration-150"
            style={{ background: 'linear-gradient(140deg, rgba(59,130,246,0.12) 0%, rgba(30,58,138,0.05) 100%)', border: '1px solid rgba(59,130,246,0.2)', boxShadow: 'inset 0 1px 0 rgba(59,130,246,0.08)' }}
          >
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl" style={{ background: 'linear-gradient(140deg, rgba(59,130,246,0.18) 0%, transparent 60%)' }} />
            <div className="absolute right-3 top-3 text-[90px] opacity-[0.07] group-hover:opacity-[0.16] group-hover:scale-110 group-hover:-rotate-12 transition-all duration-500 select-none leading-none">⚽</div>
            <div className="relative p-6 sm:p-8">
              <div className="text-3xl sm:text-4xl mb-3 sm:mb-4 leading-none">📋</div>
              <h2 className="text-xl sm:text-2xl font-black text-white uppercase tracking-tight mb-1">Tabele</h2>
              <p className="text-gray-500 text-xs sm:text-sm mb-5 sm:mb-6">Unesi parove i tikete.</p>
              <div className="inline-flex items-center gap-2 text-blue-400 font-black text-[10px] sm:text-[11px] uppercase tracking-[0.2em]">
                UNESI PAR <span className="group-hover:translate-x-1.5 transition-transform duration-200">→</span>
              </div>
            </div>
          </button>

          {/* PROGNOZE */}
          <button 
            onClick={() => onNavigate("predictor")}
            className="group relative overflow-hidden rounded-2xl text-left active:scale-[0.97] transition-transform duration-150"
            style={{ background: 'linear-gradient(140deg, rgba(34,197,94,0.12) 0%, rgba(21,128,61,0.05) 100%)', border: '1px solid rgba(34,197,94,0.2)', boxShadow: 'inset 0 1px 0 rgba(34,197,94,0.08)' }}
          >
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl" style={{ background: 'linear-gradient(140deg, rgba(34,197,94,0.18) 0%, transparent 60%)' }} />
            <div className="absolute right-3 top-3 text-[90px] opacity-[0.07] group-hover:opacity-[0.16] group-hover:scale-110 group-hover:rotate-12 transition-all duration-500 select-none leading-none">🔮</div>
            <div className="relative p-6 sm:p-8">
              <div className="text-3xl sm:text-4xl mb-3 sm:mb-4 leading-none">🔮</div>
              <h2 className="text-xl sm:text-2xl font-black text-white uppercase tracking-tight mb-1">Prognoze</h2>
              <p className="text-gray-500 text-xs sm:text-sm mb-5 sm:mb-6">Pogodi grupe i šampiona.</p>
              <div className="inline-flex items-center gap-2 text-green-400 font-black text-[10px] sm:text-[11px] uppercase tracking-[0.2em]">
                ZAPOČNI <span className="group-hover:translate-x-1.5 transition-transform duration-200">→</span>
              </div>
            </div>
          </button>
        </div>

        {/* QUICK STATS ROW */}
        <div className="wc-slide-up-5 flex gap-6 md:gap-14 opacity-40 hover:opacity-80 transition-opacity duration-500">
          {[
            { value: '5',    label: 'Igrača',  gold: false },
            { value: '48',   label: 'Nacija',  gold: false },
            { value: '2026', label: 'Season',  gold: false },
          ].map((s, i) => (
            <React.Fragment key={s.label}>
              {i > 0 && <div className="w-px h-6 sm:h-8 bg-white/10 self-center" />}
              <div className="text-center">
                <div className={`text-lg sm:text-xl font-black ${s.gold ? 'text-yellow-400' : 'text-white'}`}>{s.value}</div>
                <div className="text-[8px] sm:text-[9px] text-gray-600 uppercase font-bold tracking-widest">{s.label}</div>
              </div>
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* ── SCOREBOARD TICKER ── */}
      <div className="relative z-10 w-full overflow-hidden py-2.5" style={{ borderTop: '1px solid rgba(255,255,255,0.05)', background: 'rgba(0,0,0,0.3)' }}>
        <div className="wc-ticker whitespace-nowrap inline-block">
          {[0, 1].map(i => (
            <span key={i} className="text-[10px] font-black uppercase tracking-[0.35em] text-yellow-400/20 px-2">
              ⚽&nbsp; WORLD CUP 2026 &nbsp;·&nbsp; USA &nbsp;·&nbsp; CANADA &nbsp;·&nbsp; MEXICO &nbsp;·&nbsp; 48 NACIJA &nbsp;·&nbsp; JEDNA TITULA &nbsp;·&nbsp; KICK OFF JUN 2026 &nbsp;·&nbsp; TAKMIČENJE EDITION &nbsp;·&nbsp; PUT DO TROFEJA &nbsp;·&nbsp;
            </span>
          ))}
        </div>
      </div>

      {/* ── LOGOUT ── */}
      <div className="relative z-10 w-full flex justify-center py-5">
        <button
          onClick={handleLogout}
          className="group flex items-center gap-2 px-5 py-2.5 rounded-full hover:bg-red-500/10 hover:border-red-500/20 transition-all"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}
        >
          <div className="w-1.5 h-1.5 rounded-full bg-red-500/50 group-hover:animate-ping" />
          <span className="text-[9px] font-black uppercase tracking-widest text-gray-600 group-hover:text-red-400 transition-colors">Log Out</span>
        </button>
      </div>

    </div>
  );
}