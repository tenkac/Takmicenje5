import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Debugging check
if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    `Supabase Keys missing! 
    URL: ${supabaseUrl ? "Found" : "Missing"}
    Key: ${supabaseKey ? "Found" : "Missing"}
    Make sure .env.local is in the root folder and you restarted the server.`
  );
}

export const supabase = createClient(supabaseUrl, supabaseKey);