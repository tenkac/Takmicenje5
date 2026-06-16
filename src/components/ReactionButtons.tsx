"use client";
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface ReactionProps {
  bettingRowId: number;
  matchKey: "match1" | "match2";
  loggedInPlayer: string;
  targetPlayer: string; // 👈 Safely tracked prop
}

interface ReactionCount {
  likes: number;
  dislikes: number;
  myReaction: 'like' | 'dislike' | null;
}

export default function ReactionButtons({ bettingRowId, matchKey, loggedInPlayer, targetPlayer }: ReactionProps) {
  const [counts, setCounts] = useState<ReactionCount>({ likes: 0, dislikes: 0, myReaction: null });
  const [activeAnim, setActiveAnim] = useState<'like' | 'dislike' | null>(null);

  useEffect(() => {
    const fetchReactions = async () => {
      const { data } = await supabase
        .from('pick_reactions')
        .select('player_name, reaction_type')
        .eq('betting_row_id', bettingRowId)
        .eq('match_key', matchKey);
      
      if (data) {
        const likes = data.filter(d => d.reaction_type === 'like').length;
        const dislikes = data.filter(d => d.reaction_type === 'dislike').length;
        const myReaction = data.find(d => d.player_name === loggedInPlayer)?.reaction_type || null;
        setCounts({ likes, dislikes, myReaction });
      }
    };
    fetchReactions();
  }, [bettingRowId, matchKey, loggedInPlayer]);

  const handleReaction = async (type: 'like' | 'dislike', e: React.MouseEvent) => {
    e.stopPropagation(); // Stops the match card from toggling win/loss status
    if (!loggedInPlayer) return;

    // Direct haptic rumble for mobile devices
    if (navigator.vibrate) navigator.vibrate(15);

    // Trigger instant layout pop animation
    setActiveAnim(type);
    setTimeout(() => setActiveAnim(null), 200);

    const isRemoving = counts.myReaction === type;
    const isSwitching = counts.myReaction !== null && counts.myReaction !== type;

    // Optimistic local state update for instant native responsiveness
    setCounts(prev => {
      let nextLikes = prev.likes;
      let nextDislikes = prev.dislikes;

      if (isRemoving) {
        if (type === 'like') nextLikes--; else nextDislikes--;
      } else {
        if (type === 'like') nextLikes++; else nextDislikes++;
        if (isSwitching) {
          if (type === 'like') nextDislikes--; else nextLikes--;
        }
      }

      return {
        likes: nextLikes,
        dislikes: nextDislikes,
        myReaction: isRemoving ? null : type
      };
    });

    // Database fallback sync execution
    if (isRemoving) {
      await supabase
        .from('pick_reactions')
        .delete()
        .match({ betting_row_id: bettingRowId, match_key: matchKey, player_name: loggedInPlayer });
    } else {
      await supabase
        .from('pick_reactions')
        .upsert({
          betting_row_id: bettingRowId,
          match_key: matchKey,
          target_player: targetPlayer, // 👈 Successfully maps data into database row
          player_name: loggedInPlayer,
          reaction_type: type
        });
    }
  };

  return (
    <div className="flex items-center bg-white/[0.04] border border-white/15 p-0.5 rounded-full backdrop-blur-md relative z-30 shadow-2xl select-none">
      
      {/* HEART LIKE BUTTON */}
      <button
        onClick={(e) => handleReaction('like', e)}
        className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full transition-all active:scale-75 ${
          counts.myReaction === 'like'
            ? 'bg-red-500/25 text-red-400 border border-red-500/40'
            : 'text-white/40 hover:text-red-400/90 active:bg-red-500/15'
        }`}
        style={{ minHeight: '34px' }}
      >
        <span className={`text-sm transition-transform block ${activeAnim === 'like' ? 'scale-150' : 'scale-100'}`}>
          {counts.myReaction === 'like' ? '❤️' : '🤍'}
        </span>
        {counts.likes > 0 && (
          <span className="font-black text-xs tracking-tight mb-[1px]">{counts.likes}</span>
        )}
      </button>

      {/* DIVIDER ACCENT */}
      <div className="w-[1px] h-4 bg-white/15 self-center mx-0.5" />

      {/* BROKEN HEART DISLIKE BUTTON */}
      <button
        onClick={(e) => handleReaction('dislike', e)}
        className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full transition-all active:scale-75 ${
          counts.myReaction === 'dislike'
            ? 'bg-purple-500/25 text-purple-400 border border-purple-500/40'
            : 'text-white/40 hover:text-purple-400/90 active:bg-purple-500/15'
        }`}
        style={{ minHeight: '34px' }}
      >
        <span className={`text-sm transition-transform block ${activeAnim === 'dislike' ? 'scale-150' : 'scale-100'}`}>
          💔
        </span>
        {counts.dislikes > 0 && (
          <span className="font-black text-xs tracking-tight mb-[1px]">{counts.dislikes}</span>
        )}
      </button>

    </div>
  );
}