"use client";
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { motion, AnimatePresence, Reorder } from 'framer-motion';

interface Props {
  // onBack REMOVED NATIVELY FOR THE BOTTOM NAVBAR LIFECYCLE
  activePlayer: string;
}

const PLAYER_THEMES: Record<string, { icon: string }> = {
  "Vlado": { icon: "/Avatars/vlado.webp" },
  "Fika": { icon: "/Avatars/fika.webp" },
  "Labud": { icon: "/Avatars/labud.webp" },
  "Ilija": { icon: "/Avatars/ilija.webp" },
  "Dzoni": { icon: "/Avatars/dzoni.webp" },
};

const SP2026_DRZAVE = [
  { name: "Alžir", emoji: "🇩🇿" },
  { name: "Argentina", emoji: "🇦🇷" },
  { name: "Australija", emoji: "🇦🇺" },
  { name: "Austrija", emoji: "🇦🇹" },
  { name: "Belgija", emoji: "🇧🇪" },
  { name: "Bosna i Hercegovina", emoji: "🇧🇦" },
  { name: "Brazil", emoji: "🇧🇷" },
  { name: "Češka", emoji: "🇨🇿" },
  { name: "DR Kongo", emoji: "🇨🇩" },
  { name: "Egipat", emoji: "🇪🇬" },
  { name: "Ekvador", emoji: "🇪🇨" },
  { name: "Engleska", emoji: "🏴󠁧󠁢󠁥󠁮󠁧󠁿" },
  { name: "Francuska", emoji: "🇫🇷" },
  { name: "Gana", emoji: "🇬🇭" },
  { name: "Haiti", emoji: "🇭🇹" },
  { name: "Holandija", emoji: "🇳🇱" },
  { name: "Hrvatska", emoji: "🇭🇷" },
  { name: "Irak", emoji: "🇮🇶" },
  { name: "Iran", emoji: "🇮🇷" },
  { name: "Japan", emoji: "🇯🇵" },
  { name: "Jordan", emoji: "🇯🇴" },
  { name: "Južna Afrika", emoji: "🇿🇦" },
  { name: "Južna Koreja", emoji: "🇰🇷" },
  { name: "Kanada", emoji: "🇨🇦" },
  { name: "Katar", emoji: "🇶🇦" },
  { name: "Kolumbija", emoji: "🇨🇴" },
  { name: "Kurasao", emoji: "🇨🇼" },
  { name: "Maroko", emoji: "🇲🇦" },
  { name: "Meksiko", emoji: "🇲🇽" },
  { name: "Njemačka", emoji: "🇩🇪" },
  { name: "Norveška", emoji: "🇳🇴" },
  { name: "Novi Zeland", emoji: "🇳🇿" },
  { name: "Obala Slonovače", emoji: "🇨🇮" },
  { name: "Panama", emoji: "🇵🇦" },
  { name: "Paragvaj", emoji: "🇵🇾" },
  { name: "Portugal", emoji: "🇵🇹" },
  { name: "SAD", emoji: "🇺🇸" },
  { name: "Saudijska Arabija", emoji: "🇸🇦" },
  { name: "Senegal", emoji: "🇸🇳" },
  { name: "Škotska", emoji: "🏴󠁧󠁢󠁳󠁣󠁴󠁿" },
  { name: "Španija", emoji: "🇪🇸" },
  { name: "Švedska", emoji: "🇸🇪" },
  { name: "Švajcarska", emoji: "🇨🇭" },
  { name: "Tunis", emoji: "🇹🇳" },
  { name: "Turska", emoji: "🇹🇷" },
  { name: "Urugvaj", emoji: "🇺🇾" },
  { name: "Uzbekistan", emoji: "🇺🇿" },
  { name: "Zelenortska Ostrva", emoji: "🇨🇻" }
].sort((a, b) => a.name.localeCompare(b.name));

const INITIAL_GROUPS: Record<string, string[]> = {
  A: ["🇲🇽 Meksiko", "🇿🇦 Južna Afrika", "🇰🇷 Južna Koreja", "🇨🇿 Češka"],
  B: ["🇨🇦 Kanada", "🇧🇦 Bosna i Hercegovina", "🇶🇦 Katar", "🇨🇭 Švajcarska"],
  C: ["🇧🇷 Brazil", "🇲🇦 Maroko", "🇭🇹 Haiti", "🏴󠁧󠁢󠁳󠁣󠁴󠁿 Škotska"],
  D: ["🇺🇸 SAD", "🇵🇾 Paragvaj", "🇦🇺 Australija", "🇹🇷 Turska"],
  E: ["🇩🇪 Njemačka", "🇨🇼 Kurasao", "🇨🇮 Obala Slonovače", "🇪🇨 Ekvador"],
  F: ["🇳🇱 Holandija", "🇯🇵 Japan", "🇸🇪 Švedska", "🇹🇳 Tunis"],
  G: ["🇧🇪 Belgija", "🇪🇬 Egipat", "🇮🇷 Iran", "🇳🇿 Novi Zeland"],
  H: ["🇪🇸 Španija", "🇨🇻 Zelenortska Ostrva", "🇸🇦 Saudijska Arabija", "🇺🇾 Urugvaj"],
  I: ["🇫🇷 Francuska", "🇸🇳 Senegal", "🇮🇶 Irak", "🇳🇴 Norveška"],
  J: ["🇦🇷 Argentina", "🇩🇿 Alžir", "🇦🇹 Austrija", "🇯🇴 Jordan"],
  K: ["🇵🇹 Portugal", "🇨🇩 DR Kongo", "🇺🇿 Uzbekistan", "🇨🇴 Kolumbija"],
  L: ["🏴󠁧󠁢󠁥󠁮󠁧󠁿 Engleska", "🇭🇷 Hrvatska", "🇬🇭 Gana", "🇵🇦 Panama"],
};

export default function WCPredictor({ activePlayer }: Props) {
  const [viewMode, setViewMode] = useState<"edit" | "radar">("edit");
  const [groups, setGroups] = useState(INITIAL_GROUPS);
  const [semis, setSemis] = useState(["", "", "", ""]);
  const [winner, setWinner] = useState("");
  const [goldenBoot, setGoldenBoot] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [allPlayersData, setAllPlayersData] = useState<any[]>([]);

  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  const showToast = (msg: string, type: "success" | "error") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const loadRadarData = async () => {
    const { data, error } = await supabase
      .from('wc_predictions')
      .select('player, predictions');

    if (data) setAllPlayersData(data);
    if (error) {
      console.error(error);
      showToast("Greška pri učitavanju radara.", "error");
    }
  };

  useEffect(() => {
    const fetchPredictions = async () => {
      setIsLoading(true);
      const { data } = await supabase
        .from('wc_predictions')
        .select('predictions')
        .eq('player', activePlayer)
        .maybeSingle();

      if (!data || !data.predictions) {
         setGroups(INITIAL_GROUPS); // Fallback ako nema podataka
      } else {
        setGroups(data.predictions.groups || INITIAL_GROUPS);
        setSemis(data.predictions.semis || ["", "", "", ""]);
        setWinner(data.predictions.winner || "");
        setGoldenBoot(data.predictions.goldenBoot || "");

        setHasSubmitted(true);
        await loadRadarData();
        setViewMode("radar");
      }
      setIsLoading(false);
    };
    fetchPredictions();
  }, [activePlayer]);

  const handleReorder = (groupLetter: string, newOrder: string[]) => {
    setGroups(prev => ({ ...prev, [groupLetter]: newOrder }));
  };

  const handleSubmit = async () => {
    if (!activePlayer) return showToast("Greška: Nije izabran igrač!", "error");

    setIsSubmitting(true);
    const cleanSemis = semis.filter(team => team.trim() !== "");
    const predictionData = { groups, semis: cleanSemis, winner, goldenBoot };

    try {
      const { error } = await supabase
        .from('wc_predictions')
        .upsert(
          { player: activePlayer, predictions: predictionData },
          { onConflict: 'player' }
        );

      if (error) throw error;

      showToast("Prognoza uspešno sačuvana i zaključana!", "success");
      setHasSubmitted(true);
      await loadRadarData();
      setViewMode("radar");

    } catch (error: any) {
      console.error(error);
      showToast("Greška pri čuvanju: " + error.message, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#05091a]">
        <div className="text-yellow-400 font-black tracking-widest uppercase animate-pulse flex flex-col items-center gap-4">
          <span className="text-4xl">⚽</span>
          Učitavanje baze...
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen flex flex-col relative overflow-y-auto font-sans text-white pb-24"
      style={{ background: 'linear-gradient(165deg, #05091a 0%, #080d20 45%, #040810 100%)' }}
    >
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-0 left-[22%] w-[280px] h-[72vh] blur-[38px] opacity-50" style={{ background: 'linear-gradient(178deg, rgba(250,204,21,0.15) 0%, transparent 85%)' }} />
        <div className="absolute top-0 right-[22%] w-[280px] h-[72vh] blur-[38px] opacity-50" style={{ background: 'linear-gradient(178deg, rgba(250,204,21,0.15) 0%, transparent 85%)' }} />
      </div>

      <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[200] pointer-events-none w-full max-w-sm px-4">
        <AnimatePresence>
          {toast && (
            <motion.div
              initial={{ opacity: 0, y: -50, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.9 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
              className={`flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-2xl border backdrop-blur-xl ${toast.type === "success" ? "bg-green-500/10 border-green-500/30 text-green-400" : "bg-red-500/10 border-red-500/30 text-red-400"
                }`}
            >
              <span className="text-2xl leading-none">{toast.type === "success" ? "🏆" : "❌"}</span>
              <span className="text-xs font-black uppercase tracking-widest leading-tight">{toast.msg}</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="relative z-10 w-full max-w-7xl mx-auto px-4 py-8 flex-1 flex flex-col">
        <AnimatePresence mode="wait">

          {viewMode === "edit" && !hasSubmitted && (
            <motion.div
              key="edit"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col w-full"
            >
              {/* CLEANED TITLE ZONE HEADER */}
              <div className="flex items-center justify-center mb-10 text-center w-full">
                <div>
                  <h1 className="text-2xl md:text-4xl font-black uppercase tracking-tighter text-yellow-400" style={{ textShadow: '0 0 20px rgba(250,204,21,0.3)' }}>WORLD CUP PREDICTOR</h1>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.3em] mt-1">48 Nacija · 12 Grupa</p>
                </div>
              </div>

              {/* FAZA PO GRUPAMA */}
              <div className="mb-12">
                <h2 className="text-xl font-black uppercase tracking-widest mb-6 flex items-center gap-3">
                  <span className="text-2xl">📋</span> Faza po Grupama
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {Object.keys(groups).map((groupLetter) => (
                    <div key={groupLetter} className="p-4 rounded-2xl flex flex-col bg-white/5 border border-white/5">
                      <div className="text-center mb-4">
                        <span className="inline-block px-3 py-1 rounded bg-yellow-400/10 border border-yellow-400/20 text-yellow-400 text-sm font-black uppercase tracking-widest">Grupa {groupLetter}</span>
                      </div>
                      <Reorder.Group axis="y" values={groups[groupLetter]} onReorder={(newOrder) => handleReorder(groupLetter, newOrder)} className="flex flex-col gap-2">
                        {groups[groupLetter].map((team, idx) => (
                          <Reorder.Item
                            key={team}
                            value={team}
                            className="touch-none flex items-center justify-between p-3 rounded-xl bg-black/60 border border-white/5 cursor-grab active:cursor-grabbing hover:bg-white/10 transition-colors shadow-sm"
                          >                            
                          <div className="flex items-center gap-3 pointer-events-none">
                              <span className={`text-sm font-black w-4 text-center ${idx === 0 ? 'text-yellow-400' :
                                idx === 1 ? 'text-gray-300' :
                                  idx === 2 ? 'text-amber-500' :
                                    'text-gray-600'
                                }`}>
                                {idx + 1}.
                              </span>
                              <span className="text-sm font-bold text-white uppercase truncate max-w-[150px]">{team}</span>
                            </div>
                            <div className="text-gray-500 opacity-50 pointer-events-none">
                              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="9" cy="5" r="1" /><circle cx="9" cy="12" r="1" /><circle cx="9" cy="19" r="1" /><circle cx="15" cy="5" r="1" /><circle cx="15" cy="12" r="1" /><circle cx="15" cy="19" r="1" /></svg>
                            </div>
                          </Reorder.Item>
                        ))}
                      </Reorder.Group>
                    </div>
                  ))}
                </div>
              </div>

              {/* ZAVRŠNICA */}
              <div className="mb-12">
                <h2 className="text-xl font-black uppercase tracking-widest mb-6 flex items-center gap-3">
                  <span className="text-2xl">⚔️</span> Završnica
                </h2>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                  <div className="p-6 rounded-3xl bg-white/5 border border-white/5">
                    <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-4">4 Polufinalista</h3>
                    <div className="grid grid-cols-2 gap-3">
                      {semis.map((team, i) => (
                        <select
                          key={i}
                          value={team}
                          onChange={(e) => {
                            const newSemis = [...semis];
                            newSemis[i] = e.target.value;
                            setSemis(newSemis);
                          }}
                          className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-3 text-sm font-bold text-white outline-none focus:border-yellow-400 uppercase transition-colors"
                        >
                          <option value="">Ekipa {i + 1}...</option>
                          {SP2026_DRZAVE.map(d => (
                            <option key={d.name} value={`${d.emoji} ${d.name}`}>{d.emoji} {d.name}</option>
                          ))}
                        </select>
                      ))}
                    </div>
                  </div>

                  <div className="p-6 rounded-3xl bg-gradient-to-b from-white/[0.06] to-white/[0.02] border border-yellow-400/20 shadow-xl flex flex-col gap-4">
                    <div>
                      <h3 className="text-sm font-black text-yellow-400 uppercase tracking-widest mb-2 flex items-center gap-2">🏆 Osvajač</h3>
                      <select
                        value={winner}
                        onChange={(e) => setWinner(e.target.value)}
                        className="w-full bg-black/40 border border-yellow-400/20 rounded-xl px-4 py-3 text-sm font-black text-white outline-none focus:border-yellow-400 uppercase transition-colors"
                      >
                        <option value="">Izaberi šampiona...</option>
                        {SP2026_DRZAVE.map(d => (
                          <option key={d.name} value={`${d.emoji} ${d.name}`}>{d.emoji} {d.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-yellow-400 uppercase tracking-widest mb-2 flex items-center gap-2">👟 Zlatna Kopačka</h3>
                      <input type="text" placeholder="Ime igrača (Kucaj ručno)" value={goldenBoot} onChange={(e) => setGoldenBoot(e.target.value)} className="w-full bg-black/40 border border-yellow-400/20 rounded-xl px-4 py-3 text-sm font-black text-white outline-none focus:border-yellow-400 uppercase transition-colors" />
                    </div>
                  </div>

                </div>
              </div>

              <div className="flex justify-center pb-12">
                <button onClick={handleSubmit} disabled={isSubmitting} className={`px-12 py-4 rounded-2xl bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-400 hover:to-yellow-500 text-black font-black text-lg uppercase tracking-widest transition-all shadow-[0_0_30px_rgba(250,204,21,0.3)] ${isSubmitting ? 'opacity-50 cursor-not-allowed grayscale' : 'hover:scale-105 active:scale-95'}`}>
                  {isSubmitting ? "ČUVAM..." : "Potvrdi Prognozu"}
                </button>
              </div>
            </motion.div>
          )}

          {/* SVE PROGNOZE (RADAR VIEW) */}
          {viewMode === "radar" && (
            <motion.div
              key="radar"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.4 }}
              className="flex flex-col w-full pb-16"
            >
              {/* CLEANED TITLE LOG ZAKLJUČANE PROGNOZE */}
              <div className="flex items-center justify-center mb-8 md:mb-12 text-center w-full">
                <h1 className="text-2xl md:text-3xl font-black italic uppercase tracking-tighter text-white">
                  ZAKLJUČANE <span className="text-yellow-400">PROGNOZE</span>
                </h1>
              </div>

              <div className="flex flex-col gap-6 md:gap-10">
                {allPlayersData.length === 0 ? (
                  <div className="text-center py-20 text-gray-500 uppercase font-black tracking-widest text-sm">
                    Još niko nije popunio prognozu.
                  </div>
                ) : (
                  allPlayersData.map(userData => (
                    <div key={userData.player} className="bg-white/5 border border-white/10 p-4 sm:p-6 md:p-8 rounded-3xl md:rounded-[2rem] relative overflow-hidden backdrop-blur-sm shadow-lg">
                      <div className="absolute top-0 left-0 w-1.5 md:w-2 h-full bg-gradient-to-b from-yellow-400 to-yellow-600" />

                      {/* HEADER CARD */}
                      <div className="flex items-center justify-between mb-5 md:mb-8 pl-3 md:pl-4 border-b border-white/10 pb-4 md:pb-6">
                        <div className="flex items-center gap-3 md:gap-4">
                          <div className="w-10 h-10 md:w-14 md:h-14 shrink-0 rounded-full border-2 border-yellow-400/30 overflow-hidden bg-gray-900 shadow-[0_0_15px_rgba(250,204,21,0.2)]">
                            <img src={PLAYER_THEMES[userData.player]?.icon || "/Avatars/default.webp"} className="w-full h-full object-cover" alt={userData.player} />
                          </div>
                          <div>
                            <h3 className="text-xl md:text-2xl font-black uppercase text-white tracking-widest leading-none mb-1">{userData.player}</h3>
                            <span className="text-[9px] md:text-[10px] text-green-400 font-bold uppercase tracking-widest bg-green-500/10 px-2 py-0.5 rounded border border-green-500/20">Zaključano</span>
                          </div>
                        </div>

                        {/* DESKTOP STATS */}
                        <div className="hidden md:flex items-center gap-6">
                          <div className="text-right">
                            <span className="text-[10px] text-gray-400 uppercase font-black tracking-widest block mb-1">🏆 Šampion</span>
                            <span className="text-lg font-black text-yellow-400 uppercase">{userData.predictions.winner || "---"}</span>
                          </div>
                          <div className="w-px h-8 bg-white/10" />
                          <div className="text-right">
                            <span className="text-[10px] text-gray-400 uppercase font-black tracking-widest block mb-1">👟 Zlatna Kopačka</span>
                            <span className="text-lg font-black text-white uppercase">{userData.predictions.goldenBoot || "---"}</span>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-5 md:space-y-6 pl-3 md:pl-0">

                        {/* MOBILE STATS (WINNER / BOOT) */}
                        <div className="grid grid-cols-2 gap-3 md:hidden">
                          <div className="bg-black/40 p-3 sm:p-4 rounded-xl border border-white/5">
                            <span className="text-[9px] sm:text-[10px] text-gray-400 uppercase font-black tracking-widest block mb-1">🏆 Šampion</span>
                            <span className="text-xs sm:text-sm font-black text-yellow-400 uppercase truncate block">{userData.predictions.winner || "---"}</span>
                          </div>
                          <div className="bg-black/40 p-3 sm:p-4 rounded-xl border border-white/5">
                            <span className="text-[9px] sm:text-[10px] text-gray-400 uppercase font-black tracking-widest block mb-1">👟 Zlatna Kopačka</span>
                            <span className="text-xs sm:text-sm font-black text-white uppercase truncate block">{userData.predictions.goldenBoot || "---"}</span>
                          </div>
                        </div>

                        {/* SEMI FINALISTS */}
                        <div className="bg-black/40 p-4 md:p-5 rounded-xl md:rounded-2xl border border-white/5 md:pl-4">
                          <span className="text-[9px] md:text-[10px] text-gray-400 uppercase font-black tracking-widest block mb-3">⚔️ 4 Polufinalista</span>
                          {/* 2x2 grid for mobile, flex wrap for desktop */}
                          <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2 md:gap-3">
                            {userData.predictions.semis?.map((s: string, i: number) => (
                              <span key={i} className="text-[11px] md:text-xs font-bold bg-white/10 px-3 py-2 rounded-lg text-white border border-white/10 uppercase shadow-sm truncate text-center sm:text-left">{s || "?"}</span>
                            ))}
                          </div>
                        </div>

                        {/* GROUPS - FULLY RESPONSIVE (MOBILE SWIPE / DESKTOP GRID) */}
                        <div className="md:pl-4">
                          <span className="text-[10px] md:text-[11px] text-gray-400 uppercase font-black tracking-[0.2em] block mb-4">
                            📋 Kompletne Grupe
                          </span>

                          <div>
                            {/* Container Architecture:
                                - Mobile: Horizontal flex layout with swipe snapping, touch-pan-y, and overscroll-x-none
                                - PC (md+): Switches to a crisp multi-column grid layout, restores default touch/overscroll behaviors
                            */}
                              <div className="flex overflow-x-auto pb-4 -mx-4 px-4 scroll-px-4 gap-3 snap-x snap-proximity scroll-smooth overscroll-x-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:grid md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 md:mx-0 md:px-0 md:pb-0 md:overflow-x-visible md:overscroll-auto md:touch-auto">
                                {Object.entries(userData.predictions.groups || {}).map(([gLetter, teams]) => (
                                <div
                                    key={gLetter}
                                    className="flex-none w-[165px] sm:w-[185px] md:w-full snap-start"
                                  >
                                  <div className="bg-black/60 p-3.5 rounded-2xl border border-white/5 hover:border-yellow-400/30 transition-all duration-300 h-full shadow-inner flex flex-col justify-between">
                                    <div>
                                      <div className="flex items-center justify-between border-b border-white/10 pb-2 mb-2.5">
                                        <span className="text-[11px] text-yellow-400 font-black tracking-tighter">GRUPA {gLetter}</span>
                                        <div className="w-1.5 h-1.5 rounded-full bg-yellow-400/20" />
                                      </div>

                                      <div className="flex flex-col gap-2">
                                        {(teams as string[]).map((team, idx) => (
                                          <div key={idx} className="flex items-center gap-2.5">
                                            <span className={`text-[10px] font-black w-3 shrink-0 ${idx === 0 ? 'text-yellow-400' :
                                                idx === 1 ? 'text-gray-300' :
                                                  idx === 2 ? 'text-amber-500' :
                                                    'text-gray-600'
                                              }`}>
                                              {idx + 1}
                                            </span>
                                            <span className="text-[11px] text-gray-100 font-bold truncate tracking-tight">
                                              {team}
                                            </span>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              ))}

                              {/* Invisible Spacer - Rendered only on mobile for visual end padding */}
                              <div className="flex-none w-1 h-full px-1 md:hidden" />
                            </div>
                          </div>

                          {/* Visual Progress Hint - Only visible on Mobile */}
                          <div className="flex items-center justify-center gap-1.5 mt-2 md:hidden">
                            <div className="w-1 h-1 rounded-full bg-yellow-400/40" />
                            <div className="w-1 h-1 rounded-full bg-yellow-400/40" />
                            <div className="w-1 h-1 rounded-full bg-yellow-400/40" />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}