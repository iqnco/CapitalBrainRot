export interface Chapter {
  id:               string;
  number:           number;
  name:             string;
  region:           string;
  topic:            string;
  topicHints:       string;   // 2–3 key concepts shown in drawer
  bossId:           string;
  bossName:         string;
  accentColor:      string;
  bgImage:          string;
  questionChapters: string[];
}

// Geographic story order: Piemonte → Lombardia → Veneto → Toscana → Lazio → Campania → Sicilia
// Each chapter maps 1-to-1 with a Barrondo course chapter (Bodie, Kane & Marcus)
export const CHAPTERS: Chapter[] = [
  {
    id: 'ch7', number: 1,
    name: 'Turinese Terror',
    region: 'Piemonte', topic: 'Investments: Background & Issues',
    topicHints: 'Real vs financial assets · Risk & return · Investment process',
    bossId: 'trippitroppi', bossName: 'Trippi Troppi',
    accentColor: '#e07b8a', bgImage: '/regions/piedmont.png',
    questionChapters: ['CH1'],
  },
  {
    id: 'ch5', number: 2,
    name: 'Milanese Madness',
    region: 'Lombardia', topic: 'Asset Classes & Financial Instruments',
    topicHints: 'Money markets · Bonds · Equity · Indices',
    bossId: 'capuccinoasesino', bossName: 'Cappuccino Assassino',
    accentColor: '#8b7cf7', bgImage: '/regions/lombardy.png',
    questionChapters: ['CH2'],
  },
  {
    id: 'ch6', number: 3,
    name: 'Venetian Delirio',
    region: 'Veneto', topic: 'How Securities Trade',
    topicHints: 'Market types · Order types · Short selling · Trading costs',
    bossId: 'lirililarila', bossName: 'Lirili Larila',
    accentColor: '#00b4cc', bgImage: '/regions/veneto.png',
    questionChapters: ['CH3'],
  },
  {
    id: 'ch4', number: 4,
    name: 'Florentine Fury',
    region: 'Toscana', topic: 'Macroeconomic & Industry Analysis',
    topicHints: 'GDP · Business cycles · Industry structure · Global macro',
    bossId: 'brrprrpatapim', bossName: 'Brr Brr Patapim',
    accentColor: '#4a90d9', bgImage: '/regions/tuscany.png',
    questionChapters: ['CH12'],
  },
  {
    id: 'ch1', number: 12,
    name: 'The Roman Siege',
    region: 'Lazio', topic: 'Equity Valuation',
    topicHints: 'DDM · P/E ratios · ROE · Intrinsic value',
    bossId: 'bombardilocrocodilo', bossName: 'Bombardilo Crocodilo',
    accentColor: '#CE2B37', bgImage: '/regions/lazio.png',
    questionChapters: ['CH13'],
  },
  {
    id: 'ch2', number: 13,
    name: 'Neapolitan Chaos',
    region: 'Campania', topic: 'Derivatives Markets',
    topicHints: 'Options · Put-call parity · Option strategies · Payoffs',
    bossId: 'bombardinigusini', bossName: 'Bombardini Gusini',
    accentColor: '#f7941d', bgImage: '/regions/campania.png',
    questionChapters: ['CH15'],
  },
  {
    id: 'ch3', number: 17,
    name: 'Sicilian Delirium',
    region: 'Sicilia', topic: 'Futures Markets & Risk Management',
    topicHints: 'Futures pricing · Hedging · Basis risk · Swaps',
    bossId: 'tungtungsahur', bossName: 'Tung Tung Sahur',
    accentColor: '#0096c7', bgImage: '/regions/sicily.png',
    questionChapters: ['CH17'],
  },
];

// ── Progress helpers ──────────────────────────────────────────────────────────

export function getCompletedChapters(): Set<string> {
  if (typeof window === 'undefined') return new Set();
  const raw = localStorage.getItem('rts-chapters-complete');
  return new Set(raw ? JSON.parse(raw) : []);
}

export function markChapterComplete(chapterId: string): void {
  const completed = getCompletedChapters();
  completed.add(chapterId);
  localStorage.setItem('rts-chapters-complete', JSON.stringify([...completed]));
}

export function getUnlockedCharacters(): Set<string> {
  const completed = getCompletedChapters();
  const chars = new Set<string>(['tralalero']);
  CHAPTERS.forEach(ch => { if (completed.has(ch.id)) chars.add(ch.bossId); });
  return chars;
}

export function isChapterAvailable(ch: Chapter): boolean {
  const idx = CHAPTERS.findIndex(c => c.id === ch.id);
  if (idx === 0) return true;
  const prev = CHAPTERS[idx - 1];
  return prev ? getCompletedChapters().has(prev.id) : true;
}

// Ranked unlocks after completing 5 of 7 chapters
export function isRankedUnlocked(): boolean {
  const completed = getCompletedChapters();
  return CHAPTERS.filter(ch => completed.has(ch.id)).length >= 5;
}

export function getChapterById(id: string): Chapter | undefined {
  return CHAPTERS.find(c => c.id === id);
}

// ── Star ratings (1–3 stars per chapter, never downgraded) ───────────────────

const STARS_KEY = 'rts-chapter-stars';

export function getChapterStars(id: string): number {
  if (typeof window === 'undefined') return 0;
  const raw = localStorage.getItem(STARS_KEY);
  const data: Record<string, number> = raw ? JSON.parse(raw) : {};
  return data[id] ?? 0;
}

export function setChapterStars(id: string, stars: number): void {
  if (typeof window === 'undefined') return;
  const raw = localStorage.getItem(STARS_KEY);
  const data: Record<string, number> = raw ? JSON.parse(raw) : {};
  if ((data[id] ?? 0) < stars) {
    data[id] = stars;
    localStorage.setItem(STARS_KEY, JSON.stringify(data));
  }
}

export function calcStars(score: number, total: number): number {
  const pct = total > 0 ? score / total : 0;
  if (pct >= 0.9) return 3;
  if (pct >= 0.8) return 2;
  if (pct >= 0.6) return 1;
  return 0;
}
