// Shared XP + character unlock logic

// ── XP / Levels ──────────────────────────────────────────────────────────────

export const LEVELS = [
  { level: 1, name: 'Freshman',     xpRequired: 0    },
  { level: 2, name: 'Sophomore',    xpRequired: 100  },
  { level: 3, name: 'Junior',       xpRequired: 300  },
  { level: 4, name: 'Senior',       xpRequired: 600  },
  { level: 5, name: 'Laureato',     xpRequired: 1000 },
  { level: 6, name: 'Dottore',      xpRequired: 1500 },
  { level: 7, name: 'Professore',   xpRequired: 2200 },
  { level: 8, name: 'Full BrainRot',xpRequired: 3000 },
];

export interface LevelInfo {
  level: number;
  name: string;
  xpRequired: number;
  nextXp: number | null;
  nextName: string | null;
  xpIntoLevel: number;
  xpToNextLevel: number | null;
}

export function getLevel(xp: number): LevelInfo {
  const lvl  = [...LEVELS].reverse().find(l => xp >= l.xpRequired) ?? LEVELS[0];
  const next = LEVELS.find(l => l.xpRequired > xp) ?? null;
  return {
    ...lvl,
    nextXp:        next?.xpRequired ?? null,
    nextName:      next?.name       ?? null,
    xpIntoLevel:   xp - lvl.xpRequired,
    xpToNextLevel: next ? next.xpRequired - xp : null,
  };
}

export function loadXP(): number {
  if (typeof window === 'undefined') return 0;
  return parseInt(localStorage.getItem('rts-xp') ?? '0', 10);
}

export function awardXP(correct: number, maxStreakThisQuiz: number): number {
  let xp = correct * 10;
  if (maxStreakThisQuiz >= 3)  xp += 5;
  if (maxStreakThisQuiz >= 5)  xp += 10;
  if (maxStreakThisQuiz >= 7)  xp += 20;
  if (maxStreakThisQuiz >= 10) xp += 30;
  return xp;
}

// ── Player stats (localStorage) ──────────────────────────────────────────────

export interface PlayerStats {
  quizzesCompleted: number;
  maxStreak: number;
  bestPct: number;
}

export function loadStats(): PlayerStats {
  if (typeof window === 'undefined') return { quizzesCompleted: 0, maxStreak: 0, bestPct: 0 };
  return {
    quizzesCompleted: parseInt(localStorage.getItem('rts-quizzes-completed') ?? '0', 10),
    maxStreak:        parseInt(localStorage.getItem('rts-max-streak')        ?? '0', 10),
    bestPct:          parseFloat(localStorage.getItem('rts-best-pct')        ?? '0'),
  };
}

export function saveStats(s: PlayerStats) {
  localStorage.setItem('rts-quizzes-completed', String(s.quizzesCompleted));
  localStorage.setItem('rts-max-streak',        String(s.maxStreak));
  localStorage.setItem('rts-best-pct',          String(s.bestPct));
}

// ── Character unlock conditions ──────────────────────────────────────────────
// Campaign bosses unlock by completing their chapter (see lib/chapters.ts).
// Only non-campaign characters are listed here.

export interface UnlockDef {
  id:    string;
  label: string;
  check: (s: PlayerStats) => boolean;
}

export const UNLOCK_DEFS: UnlockDef[] = [
  { id: 'tralalero',              label: 'Starter — always unlocked',  check: () => true                    },
  { id: 'chimpanzinibananini',    label: 'Complete 10 quizzes',        check: s => s.quizzesCompleted >= 10 },
  { id: 'lavacasaturnosaturnita', label: 'Score 100% in a quiz',       check: s => s.bestPct >= 100         },
];

export function getUnlockedIds(stats: PlayerStats): string[] {
  return UNLOCK_DEFS.filter(d => d.check(stats)).map(d => d.id);
}

export function getNewUnlocks(before: PlayerStats, after: PlayerStats): string[] {
  const prev = new Set(getUnlockedIds(before));
  return getUnlockedIds(after).filter(id => !prev.has(id));
}

// Combines campaign-boss unlocks (from chapter completions) with achievement unlocks.
// Import getUnlockedCharacters from lib/chapters in the call site to avoid circular deps.
export function getCombinedUnlockedIds(
  stats: PlayerStats,
  campaignUnlocked: Set<string>,
): string[] {
  const achievement = new Set(getUnlockedIds(stats));
  return [...new Set([...campaignUnlocked, ...achievement])];
}
