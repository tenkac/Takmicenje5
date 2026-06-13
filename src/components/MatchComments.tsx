"use client";
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface CommentsProps {
  bettingRowId: number;
  matchKey: "match1" | "match2";
  targetPlayer: string;
  loggedInPlayer: string;
}

interface Comment {
  id: number;
  player_name: string;
  comment_text: string;
  created_at: string;
}

// 👇 1. DICTIONARY MAPPING PLAYERS TO THEIR TAILWIND COLOR THEMING
const COMMENT_PLAYER_COLORS: Record<string, string> = {
  "Vlado":  "text-blue-400",
  "Fika":   "text-red-400",
  "Labud":  "text-green-400",
  "Ilija":  "text-purple-400",
  "Dzoni":  "text-yellow-400",
  "Admin":  "text-red-500 tracking-wider font-extrabold" // Custom safety styling for the admin account
};

export default function MatchComments({ bettingRowId, matchKey, targetPlayer, loggedInPlayer }: CommentsProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(false);

  const fetchComments = async () => {
    const { data, error } = await supabase
      .from('pick_comments')
      .select('id, player_name, comment_text, created_at')
      .eq('betting_row_id', bettingRowId)
      .eq('match_key', matchKey)
      .order('created_at', { ascending: true });

    if (data) setComments(data);
    if (error) console.error("Error fetching comments:", error);
  };

  useEffect(() => {
    fetchComments();
  }, [bettingRowId, matchKey]);

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || loading) return;

    setLoading(true);
    const { error } = await supabase
      .from('pick_comments')
      .insert({
        player_name: loggedInPlayer,
        target_player: targetPlayer,
        betting_row_id: bettingRowId,
        match_key: matchKey,
        comment_text: newComment.trim()
      });

    if (!error) {
      setNewComment("");
      await fetchComments(); 
    } else {
      console.error("Error saving comment:", error);
    }
    setLoading(false);
  };

  return (
    <div className="mt-3 pt-3 border-t border-white/5 w-full">
      {/* Comments List */}
      <div className="space-y-2 max-h-40 overflow-y-auto mb-3 pr-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {comments.length === 0 ? (
          <p className="text-[10px] text-gray-500 italic uppercase tracking-wider pl-1">No comments yet. Call out his slip...</p>
        ) : (
          comments.map(c => {
            // 👇 2. RESOLVE DYNAMIC TAILWIND CLASS ACCORDING TO USERNAME
            const nameColorClass = COMMENT_PLAYER_COLORS[c.player_name] || "text-gray-400";

            return (
              <div key={c.id} className="text-xs bg-white/[0.02] border border-white/5 p-2 rounded-xl">
                <div className="flex items-center justify-between mb-0.5">
                  {/* 👇 3. INJECT CUSTOM THEMED COLOR CLASS DIRECTLY HERE */}
                  <span className={`font-black uppercase text-[10px] tracking-wide ${nameColorClass}`}>
                    {c.player_name}
                  </span>
                  <span className="text-[8px] text-gray-500">
                    {new Date(c.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p className="text-gray-300 font-medium text-[11px] leading-tight">{c.comment_text}</p>
              </div>
            );
          })
        )}
      </div>

      {/* Input Form */}
      <form onSubmit={handleSubmitComment} className="flex gap-2 items-center">
        <input
          type="text"
          placeholder="Type a comment or roast..."
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          className="flex-1 bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs font-medium text-white outline-none focus:border-yellow-400/50 placeholder:text-gray-600 transition-colors"
        />
        <button
          type="submit"
          disabled={loading || !newComment.trim()}
          className="px-3 py-2 bg-yellow-400 text-black font-black text-xs uppercase tracking-wider rounded-xl hover:bg-yellow-300 active:scale-95 transition-all disabled:opacity-40"
        >
          {loading ? "..." : "💬"}
        </button>
      </form>
    </div>
  );
}