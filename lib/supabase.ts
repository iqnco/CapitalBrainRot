import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export interface Profile {
  id: string;
  username: string;
  created_at: string;
}

export interface LeaderboardEntry {
  username: string;
  user_id: string;
  sessions: number;
  total_correct: number;
  total_answered: number;
  kd: number;
}
