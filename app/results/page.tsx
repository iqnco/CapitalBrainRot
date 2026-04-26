'use client';

import { useEffect, useState, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { QuizResults } from '@/lib/types';
import {
  loadXP, getLevel, awardXP,
  loadStats, saveStats, getNewUnlocks,
  type PlayerStats,
} from '@/lib/progression';
import { OPERATORS } from '@/lib/supabase';
import { getUnlockedRegions, REGIONS } from '@/lib/regions';
import { CHAPTERS, getChapterById, markChapterComplete, setChapterStars, calcStars } from '@/lib/chapters';

const CONFETTI_COLORS = ['#008C45','#CE2B37','#FFF9F0','#d4a017','#8b7cf7','#00c878'];

function Confetti() {
  const pieces = useMemo(() => Array.from({ length: 60 }, (_, i) => ({
    id: i,
    left: `${Math.random() * 100}%`,
    delay: `${Math.random() * 1.8}s`,
    duration: `${2.2 + Math.random() * 1.6}s`,
    color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
    size: `${6 + Math.random() * 8}px`,
    rotate: `${Math.random() * 360}deg`,
  })), []);
  return (
    <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 50, overflow: 'hidden' }}>
      {pieces.map(p => (
        <div key={p.id} className="confetti-piece" style={{
          left: p.left, animationDelay: p.delay, animationDuration: p.duration,
          background: p.color, width: p.size, height: p.size, transform: `rotate(${p.rotate})`,
        }} />
      ))}
    </div>
  );
}

const RANKS = [
  { name: 'FRESH BRAIN',    color: '#a0522d', img: '/RankIcons/brain_copper.png'   },
  { name: 'A BIT ROTTEN',  color: '#cd7f32', img: '/RankIcons/brain_bronze.png'   },
  { name: 'DAZED',         color: '#9da8ba', img: '/RankIcons/brain_silver.png'   },
  { name: 'SOGGY',         color: '#d4a017', img: '/RankIcons/brain_gold.png'     },
  { name: 'MOLDY',         color: '#00b4cc', img: '/RankIcons/brain_platinum.png' },
  { name: 'LIQUEFIED',     color: '#00c878', img: '/RankIcons/brain_emerald.png'  },
  { name: 'TOTALLY FRIED', color: '#8b7cf7', img: '/RankIcons/brain_diamond.png'  },
  { name: 'FULL BRAINROT', color: '#008C45', img: '/RankIcons/brain_champion.png' },
];

function getRank(score: number, total: number) {
  const pct = total > 0 ? score / total : 0;
  return RANKS[Math.min(7, Math.floor(pct * 8))];
}

function useCounter(target: number, duration = 1200) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    let start: number | null = null;
    const step = (ts: number) => {
      if (!start) start = ts;
      const progress = Math.min((ts - start) / duration, 1);
      setValue(Math.round(progress * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    const id = requestAnimationFrame(step);
    return () => cancelAnimationFrame(id);
  }, [target, duration]);
  return value;
}

export default function ResultsPage() {
  const router = useRouter();
  const [results, setResults]       = useState<QuizResults | null>(null);
  const [xpGained, setXpGained]     = useState(0);
  const [oldXP, setOldXP]           = useState(0);
  const [newXP, setNewXP]           = useState(0);
  const [leveledUp, setLeveledUp]   = useState<string | null>(null);
  const [newUnlocks, setNewUnlocks]       = useState<string[]>([]);
  const [newRegionId, setNewRegionId]     = useState<string | null>(null);
  const [bossId, setBossId]               = useState<string>('bombardilocrocodilo');
  const [chapterCleared, setChapterCleared] = useState<{ id: string; bossId: string; bossName: string; name: string; stars: number } | null>(null);
  const [chapterFailed,  setChapterFailed]  = useState<{ id: string; bossId: string; bossName: string; name: string } | null>(null);
  const [animReady, setAnimReady]   = useState(false);
  const initialized = useRef(false);

  useEffect(() => {
    const saved = localStorage.getItem('rts-results');
    if (!saved) { router.push('/'); return; }
    const r: QuizResults = JSON.parse(saved);
    setResults(r);

    const bossIds = JSON.parse(localStorage.getItem('rts-operator-ids') ?? '[]') as string[];
    setBossId(bossIds[bossIds.length - 1] ?? 'bombardilocrocodilo');

    const pct               = r.total > 0 ? Math.round((r.score / r.total) * 100) : 0;
    const maxStreakThisQuiz = parseInt(localStorage.getItem('rts-last-max-streak') ?? '0', 10);

    if (!initialized.current) {
      initialized.current = true;

      const prevXP = loadXP();
      const earned = awardXP(r.score, maxStreakThisQuiz);
      const nextXP = prevXP + earned;
      setOldXP(prevXP); setNewXP(nextXP); setXpGained(earned);
      localStorage.setItem('rts-xp', String(nextXP));

      const oldLvl = getLevel(prevXP);
      const newLvl = getLevel(nextXP);
      if (newLvl.level > oldLvl.level) {
        setLeveledUp(newLvl.name);
        const oldRegions = new Set(getUnlockedRegions(prevXP).map(r => r.id));
        const newRegion  = getUnlockedRegions(nextXP).find(r => !oldRegions.has(r.id));
        if (newRegion) setNewRegionId(newRegion.id);
      }

      const oldStats = loadStats();
      const newStats: PlayerStats = {
        quizzesCompleted: oldStats.quizzesCompleted + 1,
        maxStreak:        Math.max(oldStats.maxStreak, maxStreakThisQuiz),
        bestPct:          Math.max(oldStats.bestPct, pct),
      };
      saveStats(newStats);
      setNewUnlocks(getNewUnlocks(oldStats, newStats));

      const isDaily = localStorage.getItem('rts-daily-mode') === 'true';
      if (isDaily) {
        const today = new Date().toISOString().slice(0, 10);
        localStorage.setItem(`rts-daily-${today}`, JSON.stringify({ score: r.score, total: r.total }));
        localStorage.removeItem('rts-daily-mode');
      }

      // Chapter outcome — win requires ≥ 60% AND full HP (survived)
      const chapterId = localStorage.getItem('rts-chapter-id');
      const survived  = r.wrongCount < 5;
      const won       = survived && r.score / r.total >= 0.6;
      if (chapterId) {
        const ch = getChapterById(chapterId);
        if (ch) {
          if (won) {
            markChapterComplete(ch.id);
            const earnedStars = calcStars(r.score, r.total);
            setChapterStars(ch.id, earnedStars);
            setChapterCleared({ id: ch.id, bossId: ch.bossId, bossName: ch.bossName, name: ch.name, stars: earnedStars });
            localStorage.removeItem('rts-chapter-id');
          } else {
            setChapterFailed({ id: ch.id, bossId: ch.bossId, bossName: ch.bossName, name: ch.name });
            // Keep rts-chapter-id so retry button can use it
          }
        }
      }
    }

    setTimeout(() => setAnimReady(true), 200);
  }, [router]);

  const pct      = results ? (results.total > 0 ? Math.round((results.score / results.total) * 100) : 0) : 0;
  const survived = results ? (results.wrongCount < 5 && results.score / results.total >= 0.6) : false;
  const rank     = results ? getRank(results.score, results.total) : RANKS[0];

  const animScore     = useCounter(results?.score      ?? 0, 900);
  const animWrong     = useCounter(results?.wrongCount ?? 0, 900);
  const animArmor     = useCounter(results?.armor      ?? 0, 900);
  const animPct       = useCounter(pct, 1100);

  // XP bar animation
  const oldLvlInfo = getLevel(oldXP);
  const newLvlInfo = getLevel(newXP);
  const oldLvlTotal = (oldLvlInfo.xpToNextLevel ?? 0) + oldLvlInfo.xpIntoLevel;
  const newLvlTotal = (newLvlInfo.xpToNextLevel ?? 0) + newLvlInfo.xpIntoLevel;
  const xpBarPct = newLvlTotal > 0 ? Math.round((newLvlInfo.xpIntoLevel / newLvlTotal) * 100) : 100;

  if (!results) return null;

  return (
    <main className="min-h-screen siege-bg flex flex-col items-center justify-center p-5 pb-20">
      {pct === 100 && <Confetti />}

      {/* ── Chapter CLEARED banner ── */}
      {chapterCleared && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 px-6 py-4 rounded-2xl text-center"
             style={{ background: '#0d1117', border: '2px solid #d4a017', boxShadow: '0 4px 40px rgba(212,160,23,0.6)', minWidth: 290 }}>
          <p className="text-xs uppercase tracking-widest mb-2" style={{ color: '#d4a017', fontFamily: "'Fredoka One', sans-serif" }}>
            🏆 Boss Defeated!
          </p>
          <div className="flex items-center justify-center gap-3 mb-2">
            <img src={`/Characters/8bit/${chapterCleared.bossId}.png`} alt=""
                 style={{ height: 52, width: 'auto', imageRendering: 'pixelated', objectFit: 'contain' }} />
            <div className="text-left">
              <p className="font-black text-base uppercase" style={{ color: '#FFF9F0', fontFamily: "'Fredoka One', sans-serif" }}>
                {chapterCleared.bossName}
              </p>
              <p className="text-[10px]" style={{ color: 'rgba(255,220,150,0.6)', fontFamily: "'Fredoka One', sans-serif" }}>Now playable!</p>
            </div>
          </div>
          {/* Stars earned */}
          <div className="flex justify-center gap-2">
            {[1,2,3].map(i => (
              <span key={i}
                className={i <= chapterCleared.stars ? 'star-pop' : ''}
                style={{ fontSize: 24, color: i <= chapterCleared.stars ? '#d4a017' : 'rgba(255,255,255,0.12)',
                  filter: i <= chapterCleared.stars ? 'drop-shadow(0 0 8px #d4a017aa)' : 'none',
                  animationDelay: `${0.3 + i * 0.18}s` }}>★</span>
            ))}
          </div>
        </div>
      )}

      {/* ── Chapter FAILED banner ── */}
      {chapterFailed && !chapterCleared && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 px-6 py-4 rounded-2xl text-center"
             style={{ background: '#1a0505', border: '2px solid #CE2B37', boxShadow: '0 4px 40px rgba(206,43,55,0.5)', minWidth: 290 }}>
          <p className="text-xs uppercase tracking-widest mb-2" style={{ color: '#CE2B37', fontFamily: "'Fredoka One', sans-serif" }}>
            💀 The Boss Wins
          </p>
          <div className="flex items-center justify-center gap-3">
            <img src={`/Characters/8bit/${chapterFailed.bossId}.png`} alt=""
                 style={{ height: 52, width: 'auto', imageRendering: 'pixelated', objectFit: 'contain' }} />
            <div className="text-left">
              <p className="font-black text-base uppercase" style={{ color: '#FFF9F0', fontFamily: "'Fredoka One', sans-serif" }}>
                {chapterFailed.bossName}
              </p>
              <p className="text-[10px]" style={{ color: 'rgba(255,120,100,0.7)', fontFamily: "'Fredoka One', sans-serif" }}>Need 6/10 to conquer</p>
            </div>
          </div>
        </div>
      )}

      {/* Level-up banner */}
      {leveledUp && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-2xl text-center"
             style={{ background: '#1A1A2E', border: '2px solid #008C45', boxShadow: '0 4px 24px rgba(0,140,69,0.4)' }}>
          <p className="text-xs uppercase tracking-widest mb-0.5" style={{ color: '#008C45' }}>Level Up!</p>
          <p className="font-black text-lg uppercase" style={{ color: '#FFF9F0', fontFamily: "'Fredoka One', sans-serif" }}>
            🍕 {leveledUp}
          </p>
        </div>
      )}

      <div className="w-full max-w-xl">

        {/* ── BATTLE DEBRIEF header ── */}
        <p className="text-xs uppercase tracking-[0.45em] mb-5 text-center"
           style={{ color: 'rgba(206,43,55,0.7)', fontFamily: "'Fredoka One', sans-serif" }}>
          ⚔ Battle Debrief
        </p>

        {/* ── Boss reaction + result ── */}
        <div className="mb-5 flex items-center gap-4 op-card p-4"
             style={{
               borderColor: survived ? 'rgba(34,197,94,0.4)' : 'rgba(206,43,55,0.4)',
               background:  survived ? 'rgba(34,197,94,0.04)' : 'rgba(206,43,55,0.04)',
             }}>
          {/* Boss character — big, with mood */}
          <div className="flex-none flex flex-col items-center">
            <img
              src={`/Characters/8bit/${bossId}.png`}
              alt={bossId}
              className={survived ? 'enemy-taunt' : 'player-victory'}
              style={{
                height: 100, width: 'auto',
                imageRendering: 'pixelated', objectFit: 'contain',
                transform: survived ? 'scaleX(1)' : 'scaleX(-1)',
              }}
              onError={e => { (e.currentTarget as HTMLImageElement).style.opacity = '0.1'; }}
            />
            <p className="text-[9px] uppercase tracking-widest mt-1"
               style={{ color: '#B0A090', fontFamily: "'Fredoka One', sans-serif" }}>
              {survived ? '😤 Defeated' : '😂 Wins'}
            </p>
          </div>

          {/* Result text */}
          <div className="flex-1">
            <p className="text-[10px] uppercase tracking-[0.3em] mb-1" style={{ color: '#7A7A8C' }}>
              {results.subject}
            </p>
            <p className="font-black text-4xl leading-none mb-2"
               style={{ color: survived ? '#22c55e' : '#CE2B37', fontFamily: "'Fredoka One', sans-serif" }}>
              {animPct}%
            </p>
            <p className="text-sm uppercase tracking-widest"
               style={{ color: survived ? '#22c55e' : '#CE2B37', fontFamily: "'Fredoka One', sans-serif" }}>
              {survived ? '✓ MAGNIFICO!' : '✗ DISASTER!'}
            </p>
          </div>

          {/* Rank icon */}
          <div className="flex-none flex flex-col items-center gap-1">
            <img src={rank.img} alt={rank.name}
                 style={{ width: 52, height: 52, objectFit: 'contain' }}
                 onError={e => { (e.currentTarget as HTMLImageElement).style.opacity = '0.1'; }} />
            <p className="text-[9px] uppercase tracking-wide text-center"
               style={{ color: rank.color, fontFamily: "'Fredoka One', sans-serif" }}>
              {rank.name}
            </p>
          </div>
        </div>

        {/* ── Stats row ── */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          {[
            { label: 'Correct',    value: animScore, color: '#22c55e' },
            { label: 'Wrong',      value: animWrong,  color: '#CE2B37' },
            { label: 'Lives Left', value: animArmor,  color: '#008C45' },
          ].map(({ label, value, color }) => (
            <div key={label} className="text-center py-3 op-card">
              <p className="text-[9px] uppercase tracking-wider mb-1" style={{ color: '#7A7A8C' }}>{label}</p>
              <p className="font-black text-2xl" style={{ color, fontFamily: "'Fredoka One', sans-serif" }}>{value}</p>
            </div>
          ))}
        </div>

        {/* ── XP gained + bar ── */}
        {xpGained > 0 && (
          <div className="op-card p-4 mb-4">
            <div className="flex items-center justify-between mb-2">
              <div>
                <p className="text-xs uppercase tracking-widest" style={{ color: '#7A7A8C', fontFamily: "'Fredoka One', sans-serif" }}>
                  XP Earned
                </p>
                <p className="font-black text-xl" style={{ color: '#CE2B37', fontFamily: "'Fredoka One', sans-serif" }}>
                  +{xpGained} XP 🍕
                </p>
              </div>
              <div className="text-right">
                <p className="text-[9px] uppercase tracking-widest" style={{ color: '#7A7A8C', fontFamily: "'Fredoka One', sans-serif" }}>
                  Level {newLvlInfo.level}
                </p>
                <p className="text-xs font-bold uppercase" style={{ color: '#1A1A2E', fontFamily: "'Fredoka One', sans-serif" }}>
                  {newLvlInfo.name}
                </p>
              </div>
            </div>
            <div className="h-3 rounded-full overflow-hidden" style={{ background: '#F0E8D8' }}>
              <div
                className="h-full rounded-full"
                style={{
                  width: `${animReady ? xpBarPct : 0}%`,
                  background: 'linear-gradient(90deg, #CE2B37, #f7941d)',
                  transition: 'width 1.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
                }}
              />
            </div>
            {newLvlInfo.nextName && (
              <p className="text-[9px] mt-1 text-right" style={{ color: '#B0A090', fontFamily: "'Fredoka One', sans-serif" }}>
                {newLvlInfo.xpToNextLevel} XP to {newLvlInfo.nextName}
              </p>
            )}
          </div>
        )}

        {/* ── New character unlocks ── */}
        {newUnlocks.length > 0 && (
          <div className="op-card p-4 mb-4"
               style={{ border: '2px solid rgba(212,160,23,0.5)', background: 'rgba(212,160,23,0.05)' }}>
            <p className="text-[10px] uppercase tracking-widest mb-3 text-center"
               style={{ color: '#d4a017', fontFamily: "'Fredoka One', sans-serif" }}>
              🔓 New Character{newUnlocks.length > 1 ? 's' : ''} Unlocked!
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              {newUnlocks.map(id => {
                const op = OPERATORS.find(o => o.id === id);
                return (
                  <div key={id} className="flex flex-col items-center gap-1">
                    <img src={`/Characters/8bit/${id}.png`} alt={op?.name ?? id}
                         style={{ width: 48, height: 48, objectFit: 'contain', imageRendering: 'pixelated' }}
                         onError={e => { (e.currentTarget as HTMLImageElement).style.opacity = '0.2'; }} />
                    <p className="text-[9px] uppercase tracking-wide text-center"
                       style={{ color: '#d4a017', fontFamily: "'Fredoka One', sans-serif" }}>
                      {op?.name ?? id}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Buttons ── */}
        <div className="space-y-2">

          {/* Chapter CLEARED — march to next chapter */}
          {chapterCleared && (() => {
            const cleared = CHAPTERS.find(c => c.id === chapterCleared.id);
            const next    = cleared ? CHAPTERS.find(c => c.number === cleared.number + 1) : null;
            const goToMap = () => {
              if (cleared) localStorage.setItem('rts-move-from', cleared.id);
              if (next)    localStorage.setItem('rts-move-to',   next.id);
              localStorage.removeItem('rts-results');
              router.push('/');
            };
            return next ? (
              <button onClick={goToMap} className="w-full py-4 rounded-2xl font-black text-base uppercase tracking-wider"
                style={{ background: 'linear-gradient(135deg, #d4a017, #f7941d)', color: '#fff', border: 'none',
                  fontFamily: "'Fredoka One', sans-serif", letterSpacing: '0.15em', boxShadow: '0 6px 28px rgba(212,160,23,0.45)', cursor: 'pointer' }}>
                ⚔ March to {next.region} →
              </button>
            ) : (
              <button onClick={goToMap} className="w-full py-4 rounded-2xl font-black text-base uppercase tracking-wider"
                style={{ background: 'linear-gradient(135deg, #d4a017, #008C45)', color: '#fff', border: 'none',
                  fontFamily: "'Fredoka One', sans-serif", letterSpacing: '0.15em',
                  animation: 'pulse 2s ease-in-out infinite', cursor: 'pointer' }}>
                👑 Italy Conquered — Ranked Mode!
              </button>
            );
          })()}

          {/* Chapter FAILED — prominent retry */}
          {chapterFailed && !chapterCleared && (
            <button
              onClick={() => { localStorage.removeItem('rts-results'); router.push('/'); }}
              className="w-full py-4 rounded-2xl font-black text-base uppercase tracking-wider"
              style={{ background: 'linear-gradient(135deg, #CE2B37, #8b0000)', color: '#fff', border: '2px solid rgba(206,43,55,0.5)',
                fontFamily: "'Fredoka One', sans-serif", letterSpacing: '0.15em',
                boxShadow: '0 6px 28px rgba(206,43,55,0.4)', cursor: 'pointer' }}>
              ↩ Retry Battle
            </button>
          )}

          {/* Non-chapter quiz (daily/ranked) — back to map */}
          {!chapterCleared && !chapterFailed && (
            <button onClick={() => { localStorage.removeItem('rts-results'); router.push('/'); }}
              className="w-full py-4 rounded-2xl font-black text-base uppercase tracking-wider"
              style={{ background: 'linear-gradient(135deg, #d4a017, #f7941d)', color: '#fff', border: 'none',
                fontFamily: "'Fredoka One', sans-serif", letterSpacing: '0.15em',
                boxShadow: '0 6px 28px rgba(212,160,23,0.35)', cursor: 'pointer' }}>
              ← Campaign Map
            </button>
          )}

          <button onClick={() => router.push('/report')} className="w-full siege-btn-primary">
            Full Report
          </button>
          <button onClick={() => router.push('/history')} className="w-full siege-btn-ghost">
            History
          </button>
          {(chapterCleared || chapterFailed) && (
            <button onClick={() => { localStorage.removeItem('rts-results'); router.push('/'); }}
              className="w-full py-3 text-sm uppercase tracking-[0.2em]"
              style={{ color: '#7A7A8C', background: 'transparent', border: 'none', fontFamily: "'Fredoka One', sans-serif", cursor: 'pointer' }}>
              ← Campaign Map
            </button>
          )}
        </div>
      </div>
    </main>
  );
}
