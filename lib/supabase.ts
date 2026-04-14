import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export interface Profile {
  id: string;
  username: string;
  favorite_operator: string | null;
  country: string | null;
  created_at: string;
}

export interface LeaderboardEntry {
  username: string;
  user_id: string;
  sessions: number;
  total_correct: number;
  total_answered: number;
  kd: number;
  favorite_operator: string | null;
  country: string | null;
}

export const OPERATORS = [
  { id: 'ash',         name: 'ASH'         },
  { id: 'doc',         name: 'DOC'         },
  { id: 'blitz',       name: 'BLITZ'       },
  { id: 'caveira',     name: 'CAVEIRA'     },
  { id: 'tachanka',    name: 'TACHANKA'    },
  { id: 'mozzie',      name: 'MOZZIE'      },
  { id: 'deimos',      name: 'DEIMOS'      },
  { id: 'thunderbird', name: 'THUNDERBIRD' },
  { id: 'warden',      name: 'WARDEN'      },
];

export const COUNTRIES = [
  { code: 'US', name: 'United States' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'ES', name: 'Spain' },
  { code: 'FR', name: 'France' },
  { code: 'DE', name: 'Germany' },
  { code: 'IT', name: 'Italy' },
  { code: 'PT', name: 'Portugal' },
  { code: 'BR', name: 'Brazil' },
  { code: 'MX', name: 'Mexico' },
  { code: 'AR', name: 'Argentina' },
  { code: 'CO', name: 'Colombia' },
  { code: 'CL', name: 'Chile' },
  { code: 'CA', name: 'Canada' },
  { code: 'AU', name: 'Australia' },
  { code: 'NZ', name: 'New Zealand' },
  { code: 'JP', name: 'Japan' },
  { code: 'KR', name: 'South Korea' },
  { code: 'CN', name: 'China' },
  { code: 'RU', name: 'Russia' },
  { code: 'PL', name: 'Poland' },
  { code: 'SE', name: 'Sweden' },
  { code: 'NO', name: 'Norway' },
  { code: 'DK', name: 'Denmark' },
  { code: 'FI', name: 'Finland' },
  { code: 'NL', name: 'Netherlands' },
  { code: 'BE', name: 'Belgium' },
  { code: 'CH', name: 'Switzerland' },
  { code: 'AT', name: 'Austria' },
  { code: 'TR', name: 'Turkey' },
  { code: 'SA', name: 'Saudi Arabia' },
  { code: 'AE', name: 'UAE' },
  { code: 'ZA', name: 'South Africa' },
  { code: 'NG', name: 'Nigeria' },
  { code: 'IN', name: 'India' },
  { code: 'PK', name: 'Pakistan' },
  { code: 'MA', name: 'Morocco' },
];

export function flagEmoji(code: string): string {
  return code.toUpperCase().split('').map(c =>
    String.fromCodePoint(0x1F1E6 + c.charCodeAt(0) - 65)
  ).join('');
}

export function kdToRank(kd: number): { file: string; label: string } {
  if (kd >= 0.92) return { file: 'Champ1',    label: 'Champion' };
  if (kd >= 0.82) return { file: 'Diamons1',  label: 'Diamond'  };
  if (kd >= 0.72) return { file: 'Emerald1',  label: 'Emerald'  };
  if (kd >= 0.62) return { file: 'Plat1',     label: 'Platinum' };
  if (kd >= 0.50) return { file: 'Gold1',     label: 'Gold'     };
  if (kd >= 0.38) return { file: 'Silver1',   label: 'Silver'   };
  if (kd >= 0.25) return { file: 'Bronze1',   label: 'Bronze'   };
  return                  { file: 'Copper1',  label: 'Copper'   };
}
