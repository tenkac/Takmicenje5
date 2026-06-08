// src/types.ts

export type MatchStatus = "pending" | "win" | "loss" | "empty";

export interface Match {
  sport: string; // <--- NEW FIELD
  name: string;
  tip: string;
  odds: number;
  status: MatchStatus;
}

export interface BettingRow {
  id: number;
  date: string;
  match1: Match;
  match2: Match;
}

export interface AllPlayersData {
  [playerName: string]: BettingRow[];
}

export const PLAYERS = ["Vlado", "Fika", "Labud", "Ilija", "Dzoni"];

// Update the empty match to include a default sport
export const EMPTY_MATCH: Match = {
  sport: "⚽", 
  name: "", 
  tip: "", 
  odds: 0, 
  status: "empty",
};