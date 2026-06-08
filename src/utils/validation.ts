import { z } from 'zod';

export const betSchema = z.object({
  // Date must be YYYY-MM-DD
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format"),
  
  // Sport must be at least 1 character (emoji)
  sport: z.string().min(1, "Sport is required"), 
  
  // Match name: Allow letters, numbers, spaces, dots, dashes, and standard punctuation
  // We removed the strict regex to allow Serbian characters (č, ć, š, etc.)
  matchName: z.string().min(2, "Match name is too short").max(120, "Match name is too long"),
  
  // Tip: Just limit the length
  tip: z.string().min(1, "Tip is required").max(100, "Tip is too long"),
  
  // Odds: We use 'coerce' to turn the input string "1.50" into the number 1.50 automatically
  odds: z.coerce.number()
    .min(1.00, "Odds must be at least 1.00")
    .max(1000, "Odds are too high"),
});