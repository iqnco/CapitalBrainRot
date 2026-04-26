'use client';

import { useState, useEffect, useCallback, useRef, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Question, QuizResults, AnswerRecord, MatchReport, ChapterSeenMap } from '@/lib/types';
import { getChapterById } from '@/lib/chapters';

const SEEN_KEY = 'rts-chapter-seen';
const WEAK_KEY = 'rts-weak-questions';

function saveWrongQuestion(q: Question, correctAnswer: string, questionText: string) {
  const raw = localStorage.getItem(WEAK_KEY);
  const existing: Question[] = raw ? JSON.parse(raw) : [];
  const dedupKey = (questionText + '§' + correctAnswer).slice(0, 140);
  const filtered = existing.filter(eq => {
    const eText = 'question' in eq ? (eq as {question:string}).question
                : 'sentence' in eq ? (eq as {sentence:string}).sentence
                : (eq as {instruction:string}).instruction;
    const eKey = (eText + '§' + ('options' in eq ? (eq as {options:string[]; correctIndex:number}).options[(eq as {options:string[]; correctIndex:number}).correctIndex]
                              : (eq as {correctAnswer:string}).correctAnswer)).slice(0, 140);
    return eKey !== dedupKey;
  });
  filtered.unshift(q);
  localStorage.setItem(WEAK_KEY, JSON.stringify(filtered.slice(0, 50)));
}

function markQuestionSeen(chapter: string | undefined, questionText: string, correctAnswer: string) {
  if (!chapter) return;
  const raw = localStorage.getItem(SEEN_KEY);
  const map: ChapterSeenMap = raw ? JSON.parse(raw) : {};
  const key = (questionText + '§' + correctAnswer).slice(0, 140);
  if (!map[chapter]) map[chapter] = [];
  if (!map[chapter].includes(key)) map[chapter].push(key);
  localStorage.setItem(SEEN_KEY, JSON.stringify(map));
}

import MultipleChoice from '@/components/MultipleChoice';
import TypeAnswer from '@/components/TypeAnswer';
import FillBlank from '@/components/FillBlank';
import MatchPairs from '@/components/MatchPairs';
import FeedbackOverlay from '@/components/FeedbackOverlay';
import HealthHearts from '@/components/HealthHearts';
import RankLadder from '@/components/RankLadder';
import SnakeGame from '@/components/SnakeGame';
import { supabase } from '@/lib/supabase';
import { getCommentary, getTaunt } from '@/lib/commentary';
import PizzaTimer from '@/components/PizzaTimer';

const MAX_HP = 5;

const OPERATOR_META: Record<string, { name: string; role: string }> = {
  tralalero:             { name: 'TRALALERO',   role: '🦈 TRALALA'        },
  bombardilocrocodilo:   { name: 'BOMBARDILO',  role: '🐊 CROCODILO'      },
  bombardinigusini:      { name: 'BOMBARDINI',  role: '🪿 GUSINI'         },
  capuccinoasesino:      { name: 'CAPPUCCINO',  role: '☕ ASSASSINO'      },
  tungtungsahur:         { name: 'TUNG TUNG',   role: '🪵 SAHUR'          },
  lirililarila:          { name: 'LIRILI',      role: '🐘 LARILA'         },
  brrprrpatapim:         { name: 'BRR BRR',     role: '🌿 PATAPIM'        },
  trippitroppi:          { name: 'TRIPPI',      role: '🦐 TROPPI'         },
  chimpanzinibananini:   { name: 'CHIMPANZINI', role: '🍌 BANANINI'       },
  lavacasaturnosaturnita:{ name: 'LA VACA',      role: '🪐 SATURNITA'      },
};


// Explicit facing direction per sprite — 'L' = faces left, 'R' = faces right
const SPRITE_DIR: Record<string, 'L' | 'R'> = {
  tralalero:              'L',  // shark faces left
  bombardilocrocodilo:    'L',  // croc-plane faces left (mouth on left)
  bombardinigusini:       'L',  // goose faces left (beak on left)
  tungtungsahur:          'R',  // wooden figure faces right
  brrprrpatapim:          'R',  // moss creature faces right
  lavacasaturnosaturnita: 'L',  // saturn cow faces left (snout on left)
  chimpanzinibananini:    'R',  // monkey banana faces right
  lirililarila:           'R',  // elephant faces right
  trippitroppi:           'R',  // cat-shrimp faces right
  capuccinoasesino:       'R',  // ninja forward/right
};

// Enemy sits on the RIGHT → needs to face LEFT. Player sits on the LEFT → needs to face RIGHT.
function enemyFlip(id: string)  { return (SPRITE_DIR[id] ?? 'R') === 'R' ? 'scaleX(-1)' : 'none'; }
function playerFlip(id: string) { return (SPRITE_DIR[id] ?? 'R') === 'L' ? 'scaleX(-1)' : 'none'; }

type Phase = 'answering' | 'feedback';
interface Feedback { correct: boolean; explanation: string; correctAnswer?: string; }

const TYPE_LABELS: Record<string, string> = {
  'multiple-choice': 'MULTIPLE CHOICE',
  'type-answer':     'TYPE THE ANSWER',
  'fill-blank':      'FILL THE BLANK',
  'match-pairs':     'MATCH THE PAIRS',
};

function getCorrectAnswer(q: Question): string {
  switch (q.type) {
    case 'multiple-choice': return q.options[q.correctIndex];
    case 'type-answer':     return q.correctAnswer;
    case 'fill-blank':      return q.correctAnswer;
    case 'match-pairs':     return q.pairs.map(p => `${p.left} → ${p.right}`).join('\n');
  }
}

function QuizContent() {
  const params  = useSearchParams();
  const router  = useRouter();
  const subject = params.get('subject') ?? 'Materia Sconosciuta';

  const [questions, setQuestions]       = useState<Question[]>([]);
  const [qIndex, setQIndex]             = useState(0);
  const [score, setScore]               = useState(0);
  const [hp, setHp]                     = useState(MAX_HP);
  const [wrongCount, setWrongCount]     = useState(0);
  const [phase, setPhase]               = useState<Phase>('answering');
  const [feedback, setFeedback]         = useState<Feedback | null>(null);
  const [enemyIds, setEnemyIds]         = useState<string[]>([]);
  const [playerOpId, setPlayerOpId]     = useState<string>('ash');
  const [isDying, setIsDying]             = useState(false);
  const [isDamaged, setIsDamaged]         = useState(false);
  const [isPlayerHit, setIsPlayerHit]     = useState(false);
  const [isPlayerVictory, setIsPlayerVictory] = useState(false);
  const [isEnemyTaunt, setIsEnemyTaunt]   = useState(false);
  const [playerLine, setPlayerLine]       = useState<string | null>(null);
  const [enemyLine, setEnemyLine]         = useState<string | null>(null);
  const [streak, setStreak]               = useState(0);
  const [maxStreak, setMaxStreak]         = useState(0);
  const [streakBanner, setStreakBanner]   = useState<string | null>(null);
  const [tauntLine, setTauntLine]         = useState<string | null>(null);
  const [timePressure, setTimePressure]   = useState(false);
  const [timeLeft, setTimeLeft]           = useState(20);
  const [intruder, setIntruder]           = useState<{ id: string; line: string } | null>(null);
  const [regionBg, setRegionBg]           = useState<string | null>(null);
  const answerLogRef = useRef<AnswerRecord[]>([]);

  useEffect(() => {
    const savedQ = localStorage.getItem('rts-questions');
    if (!savedQ) { router.push('/'); return; }
    setQuestions(JSON.parse(savedQ));
    setEnemyIds(JSON.parse(localStorage.getItem('rts-operator-ids') ?? '["brrprrpatapim"]') as string[]);
    setPlayerOpId(localStorage.getItem('rts-player-operator') ?? 'tralalero');
    setTimePressure(localStorage.getItem('rts-time-pressure') === 'true');
    const chapterId = localStorage.getItem('rts-chapter-id');
    if (chapterId) setRegionBg(getChapterById(chapterId)?.bgImage ?? null);
  }, [router]);

  // Enemy taunt on each new question — stays for 5 seconds
  useEffect(() => {
    if (!enemyIds.length) return;
    const id = enemyIds[qIndex] ?? 'brrprrpatapim';
    setTauntLine(getTaunt(id));
    const t = setTimeout(() => setTauntLine(null), 5000);
    return () => clearTimeout(t);
  }, [qIndex, enemyIds]);

  // Random character intruder every 3rd question
  useEffect(() => {
    if (qIndex === 0 || qIndex % 3 !== 0 || !enemyIds.length) return;
    const currentEnemy = enemyIds[qIndex] ?? '';
    const others = Object.keys(OPERATOR_META).filter(id => id !== currentEnemy && id !== playerOpId);
    const intruderId = others[Math.floor(Math.random() * others.length)];
    const line = getTaunt(intruderId);
    setIntruder({ id: intruderId, line });
    const t = setTimeout(() => setIntruder(null), 3000);
    return () => clearTimeout(t);
  }, [qIndex, enemyIds, playerOpId]);

  // Time pressure countdown
  useEffect(() => {
    if (!timePressure || phase !== 'answering' || !questions.length) return;
    setTimeLeft(20);
    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) { clearInterval(interval); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [qIndex, phase, timePressure, questions.length]);

  // Auto-wrong when timer hits 0
  useEffect(() => {
    if (timePressure && timeLeft === 0 && phase === 'answering' && questions.length) {
      handleAnswer(false, '(time up)');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft]);

  const total    = questions.length;
  const currentQ = questions[qIndex] ?? null;

  const handleAnswer = useCallback((correct: boolean, userAnswer: string = '') => {
    if (!currentQ) return;
    const newScore = correct ? score + 1 : score;
    const newHp    = correct ? hp : hp - 1;
    const newWrong = correct ? wrongCount : wrongCount + 1;
    setScore(newScore); setHp(newHp); setWrongCount(newWrong);

    const enemyId   = enemyIds[qIndex] ?? 'brrprrpatapim';
    const newStreak = correct ? streak + 1 : 0;
    setStreak(newStreak);
    const newMax = Math.max(maxStreak, newStreak);
    setMaxStreak(newMax);

    if (correct) {
      setIsDying(true);
      setIsPlayerVictory(true);
      setPlayerLine(getCommentary(playerOpId, true));
      setEnemyLine(null);
      setTimeout(() => setIsPlayerVictory(false), 750);
      // Streak milestone banners
      if (newStreak === 3)  { setStreakBanner('🔥 3 IN A ROW!');      setTimeout(() => setStreakBanner(null), 1900); }
      if (newStreak === 5)  { setStreakBanner('🔥🔥 ON FIRE!');        setTimeout(() => setStreakBanner(null), 1900); }
      if (newStreak === 7)  { setStreakBanner('🔥🔥🔥 UNSTOPPABLE!'); setTimeout(() => setStreakBanner(null), 1900); }
      if (newStreak === 10) { setStreakBanner('🍕 FULL BRAINROT!');    setTimeout(() => setStreakBanner(null), 1900); }
    } else {
      setIsDamaged(true);
      setIsPlayerHit(true);
      setIsEnemyTaunt(true);
      setEnemyLine(getCommentary(enemyId, false));
      setPlayerLine(getCommentary(playerOpId, false));
      setTimeout(() => setIsDamaged(false), 450);
      setTimeout(() => setIsPlayerHit(false), 450);
      setTimeout(() => setIsEnemyTaunt(false), 750);
    }

    const correctAns = getCorrectAnswer(currentQ);
    const qText = 'question' in currentQ ? currentQ.question
                : 'sentence' in currentQ ? currentQ.sentence
                : currentQ.instruction;

    setFeedback({ correct, explanation: currentQ.explanation, correctAnswer: correctAns });

    if (currentQ.type === 'multiple-choice') markQuestionSeen(currentQ.chapter, currentQ.question, correctAns);
    if (!correct) saveWrongQuestion(currentQ, correctAns, qText);

    const record: AnswerRecord = {
      questionText: qText,
      questionType: currentQ.type,
      userAnswer: userAnswer || '(saltata)',
      correctAnswer: correctAns,
      correct,
      explanation: currentQ.explanation,
      options: currentQ.type === 'multiple-choice' ? currentQ.options : undefined,
    };
    const newLog = [...answerLogRef.current, record];
    answerLogRef.current = newLog;

    const isLast = qIndex >= total - 1;
    if (isLast) {
      const reportId = Date.now().toString();
      const report: MatchReport = {
        id: reportId, subject, date: new Date().toISOString(),
        score: newScore, total, answers: newLog,
      };
      localStorage.setItem('rts-match-report', JSON.stringify(report));
      const history: MatchReport[] = JSON.parse(localStorage.getItem('rts-history') ?? '[]');
      history.unshift(report);
      localStorage.setItem('rts-history', JSON.stringify(history.slice(0, 20)));
      localStorage.setItem('rts-last-max-streak', String(newMax));
      localStorage.setItem('rts-results', JSON.stringify({
        subject, score: newScore, total,
        wrongCount: newWrong, armor: newHp,
      } as QuizResults));

      supabase.auth.getSession().then(async ({ data: { session } }) => {
        if (!session?.user) return;
        const uid = session.user.id;
        const { data, error: selErr } = await supabase
          .from('profiles')
          .select('total_correct, total_answered, sessions')
          .eq('id', uid)
          .single();
        if (data) {
          await supabase.from('profiles').update({
            total_correct:  (data.total_correct  ?? 0) + newScore,
            total_answered: (data.total_answered ?? 0) + total,
            sessions:       (data.sessions       ?? 0) + 1,
          }).eq('id', uid);
        }
      });
    }
    setPhase('feedback');
  }, [currentQ, score, hp, wrongCount, qIndex, total, subject, enemyIds, playerOpId, streak, maxStreak]);

  const handleNext = useCallback(() => {
    setIsDying(false);
    setPlayerLine(null);
    setEnemyLine(null);
    setStreakBanner(null);
    if (qIndex >= total - 1) { router.push('/results'); return; }
    setQIndex((i) => i + 1);
    setFeedback(null);
    setPhase('answering');
  }, [qIndex, total, router]);

  if (!questions.length) {
    return (
      <main className="h-screen flex items-center justify-center" style={{ background: '#1A1A2E' }}>
        <div className="w-8 h-8 rounded-full border-4 animate-spin"
             style={{ borderColor: '#008C45', borderTopColor: 'transparent' }} />
      </main>
    );
  }

  const qTypeLabel   = currentQ ? (TYPE_LABELS[currentQ.type] ?? currentQ.type.toUpperCase()) : '';
  const questionText = currentQ
    ? ('question'     in currentQ ? currentQ.question
     : 'sentence'    in currentQ ? currentQ.sentence
     : 'instruction' in currentQ ? currentQ.instruction
     : '')
    : '';

  const progressPct  = total > 0 ? (qIndex / total) * 100 : 0;
  const enemyHpPct   = total > 0 ? Math.max(0, ((total - score) / total) * 100) : 100;
  const enemyId      = enemyIds[qIndex] ?? 'brrprrpatapim';
  const enemyMeta    = OPERATOR_META[enemyId] ?? { name: enemyId.toUpperCase(), role: '' };
  const playerMeta   = OPERATOR_META[playerOpId] ?? { name: playerOpId.toUpperCase(), role: '' };
  // All sprites face right — enemy must face left, player keeps right

  const battleBgStyle: React.CSSProperties = regionBg
    ? { backgroundImage: `url(${regionBg})`, backgroundSize: 'cover', backgroundPosition: 'center' }
    : { background: 'linear-gradient(180deg, #5ba3d9 0%, #87c1e8 40%, #6aad50 70%, #4a8a3c 100%)' };

  const streakTint = streak >= 7 ? 'rgba(139,124,247,0.3)' : streak >= 5 ? 'rgba(206,43,55,0.22)' : streak >= 3 ? 'rgba(247,148,29,0.18)' : null;

  // Shared HUD card style (Pokemon box)
  const hudCard: React.CSSProperties = {
    background: 'rgba(255,249,240,0.96)',
    border: '2.5px solid #1A1A2E',
    borderRadius: 10,
    padding: '7px 11px',
    boxShadow: '4px 4px 0 rgba(0,0,0,0.45)',
  };

  return (
    <main className="h-screen overflow-hidden flex flex-col" style={{ background: '#1A1A2E' }}>

      {isDamaged && <div className="screen-damage-overlay" />}

      {/* Intruder overlay */}
      {intruder && (
        <div key={intruder.id + qIndex} className="intruder-overlay">
          <div className="intruder-card">
            <img src={`/Characters/8bit/${intruder.id}.png`}
                 alt={OPERATOR_META[intruder.id]?.name ?? intruder.id}
                 style={{ height: 160, width: 'auto', imageRendering: 'pixelated', objectFit: 'contain' }}
                 onError={e => { (e.currentTarget as HTMLImageElement).style.opacity = '0.1'; }} />
            <div className="mt-2 px-4 py-2 rounded-2xl text-center"
                 style={{ background: 'rgba(206,43,55,0.12)', border: '2px solid rgba(206,43,55,0.5)', maxWidth: 220 }}>
              <p className="text-[10px] uppercase tracking-widest mb-1"
                 style={{ color: '#CE2B37', fontFamily: "'Fredoka One', sans-serif" }}>
                {OPERATOR_META[intruder.id]?.name ?? '???'} interrupts!
              </p>
              <p className="text-sm font-bold italic" style={{ color: '#1A1A2E' }}>"{intruder.line}"</p>
            </div>
          </div>
        </div>
      )}

      {/* Streak banner */}
      {streakBanner && (
        <div key={streakBanner} className="streak-banner">
          <div className="px-6 py-2.5 rounded-2xl text-lg font-bold uppercase tracking-widest"
               style={{ background: '#1A1A2E', color: '#FFF9F0', fontFamily: "'Fredoka One', sans-serif", boxShadow: '0 4px 24px rgba(0,0,0,0.35)' }}>
            {streakBanner}
          </div>
        </div>
      )}

      {/* ── Thin progress bar ── */}
      <div style={{ height: 4, background: 'rgba(255,255,255,0.1)', flexShrink: 0, position: 'relative', zIndex: 20 }}>
        <div style={{ height: '100%', width: `${progressPct}%`, background: 'linear-gradient(90deg, #008C45, #00c878)', transition: 'width 0.5s ease' }} />
      </div>

      {/* ── BATTLE SCENE ── */}
      {/*
        3-layer depth:
          1. Backdrop (region image) — the "wall" / scenery
          2. Ground plane — sandy arena floor painted over the bottom ~38%
          3. Characters standing ON the ground, sized by depth:
             enemy is further back (smaller, higher up), player is close (bigger, lower)
      */}
      <div className="relative flex-none" style={{ height: '50vh', overflow: 'hidden' }}>

        {/* Background — the stage image already contains wall + floor baked in */}
        <div style={{
          position: 'absolute', inset: 0, zIndex: 0,
          ...battleBgStyle,
          backgroundPosition: 'center center',
        }} />

        {/* Streak color tint */}
        {streakTint && <div style={{ position: 'absolute', inset: 0, background: streakTint, zIndex: 1, pointerEvents: 'none' }} />}

        {/* Fade into bottom panel */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, height: 44, zIndex: 15,
          background: 'linear-gradient(to bottom, transparent, #1A1A2E)',
          pointerEvents: 'none',
        }} />

        {/* ── Enemy HUD card — top RIGHT ── */}
        <div style={{ position: 'absolute', top: 10, right: 10, zIndex: 12, minWidth: 162 }}>
          <div style={hudCard}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 }}>
              <p style={{ fontFamily: "'Fredoka One',sans-serif", fontSize: 13, color: '#1A1A2E', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                {enemyMeta.name}
              </p>
              <p style={{ fontFamily: "'Fredoka One',sans-serif", fontSize: 9, color: '#7A7A8C' }}>{enemyMeta.role}</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <p style={{ fontFamily: "'Fredoka One',sans-serif", fontSize: 8, color: '#CE2B37', letterSpacing: '0.15em', flexShrink: 0 }}>HP</p>
              <div style={{ flex: 1, height: 10, background: '#E0CCB0', borderRadius: 4, border: '1px solid rgba(0,0,0,0.2)', overflow: 'hidden' }}>
                <div style={{ height: '100%', borderRadius: 4, transition: 'width 0.5s ease', width: `${enemyHpPct}%`,
                  background: enemyHpPct > 50 ? '#22c55e' : enemyHpPct > 25 ? '#f7941d' : '#CE2B37' }} />
              </div>
            </div>
            {enemyLine && (
              <p key={enemyLine} className="commentary-in" style={{ fontFamily: "'Nunito',sans-serif", fontSize: 9, color: '#CE2B37', fontStyle: 'italic', marginTop: 3, lineHeight: 1.3 }}>
                "{enemyLine}"
              </p>
            )}
          </div>
        </div>

        {/* ── Enemy sprite — RIGHT side, standing on the far part of the baked-in floor.
            The image floor starts ~65% from top, so enemy (further back) sits higher. */}
        <div style={{
          position: 'absolute',
          bottom: '14%',   // same ground level as player
          right: '8%',
          zIndex: 8,
          display: 'flex', flexDirection: 'column', alignItems: 'center',
        }}>
          {/* Taunt bubble floats above sprite */}
          {tauntLine && phase === 'answering' && (
            <div key={tauntLine} className="taunt-bubble" style={{
              background: 'rgba(255,249,240,0.95)', border: '2px solid rgba(206,43,55,0.65)',
              borderRadius: 10, padding: '5px 9px', marginBottom: 5, maxWidth: 138,
              boxShadow: '2px 2px 0 rgba(0,0,0,0.25)',
            }}>
              <p style={{ fontFamily: "'Nunito',sans-serif", fontSize: 10, color: '#CE2B37', fontStyle: 'italic', fontWeight: 700, lineHeight: 1.3, textAlign: 'center' }}>
                "{tauntLine}"
              </p>
            </div>
          )}
          {/* Flip wrapper — keeps scaleX separate from the CSS animation's transform */}
          <div style={{ transform: enemyFlip(enemyId) }}>
            <img
              key={`enemy-${qIndex}`}
              src={`/Characters/8bit/${enemyId}.png`}
              alt={enemyMeta.name}
              className={isDying ? 'enemy-dying' : isEnemyTaunt ? 'enemy-taunt' : 'animate-boxer-enemy'}
              style={{
                height: 116, width: 'auto',
                display: 'block', imageRendering: 'pixelated',
                outline: 'none', border: 'none',
                filter: isDying ? 'brightness(3) saturate(0)' : 'drop-shadow(2px 8px 0 rgba(0,0,0,0.55))',
              }}
              onError={e => { (e.currentTarget as HTMLImageElement).style.opacity = '0'; }}
            />
          </div>
          {/* Elliptical ground shadow */}
          <div style={{ width: 68, height: 9, background: 'rgba(0,0,0,0.28)', borderRadius: '50%', marginTop: -2, filter: 'blur(3px)' }} />
        </div>

        {/* ── Player sprite — LEFT side, near foreground of the baked-in floor. */}
        <div style={{
          position: 'absolute',
          bottom: '14%',   // near side of the arena floor — lower = closer
          left: '6%',
          zIndex: 9,       // in front of enemy
          display: 'flex', flexDirection: 'column', alignItems: 'center',
        }}>
          {/* Flip wrapper — keeps scaleX separate from the CSS animation's transform */}
          <div style={{ transform: playerFlip(playerOpId) }}>
            <img
              key={`player-${playerOpId}`}
              src={`/Characters/8bit/${playerOpId}.png`}
              alt={playerMeta.name}
              className={isPlayerVictory ? 'player-victory' : isPlayerHit ? 'player-hit' : streak >= 7 ? 'animate-boxer character-vibrate' : 'animate-boxer'}
              style={{
                height: 152, width: 'auto',
                display: 'block', imageRendering: 'pixelated',
                outline: 'none', border: 'none',
                filter: 'drop-shadow(3px 10px 0 rgba(0,0,0,0.65))',
              }}
              onError={e => { (e.currentTarget as HTMLImageElement).style.opacity = '0'; }}
            />
          </div>
          {/* Elliptical ground shadow — larger because player is closer */}
          <div style={{ width: 96, height: 13, background: 'rgba(0,0,0,0.32)', borderRadius: '50%', marginTop: -4, filter: 'blur(5px)' }} />
        </div>

        {/* ── Player HUD card — top LEFT ── */}
        <div style={{ position: 'absolute', top: 10, left: 10, zIndex: 12, minWidth: 170 }}>
          <div style={hudCard}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 }}>
              <p style={{ fontFamily: "'Fredoka One',sans-serif", fontSize: 13, color: '#1A1A2E', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                {playerMeta.name}
              </p>
              <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
                {streak >= 3 && <p style={{ fontFamily: "'Fredoka One',sans-serif", fontSize: 9, color: '#CE2B37' }}>🔥{streak}</p>}
                {timePressure && phase === 'answering' && (
                  <p style={{ fontFamily: "'Fredoka One',sans-serif", fontSize: 9, color: timeLeft <= 5 ? '#CE2B37' : '#7A7A8C' }}>⏱{timeLeft}s</p>
                )}
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 4 }}>
              <p style={{ fontFamily: "'Fredoka One',sans-serif", fontSize: 8, color: '#008C45', letterSpacing: '0.15em', flexShrink: 0 }}>HP</p>
              <div style={{ flex: 1, height: 10, background: '#E0CCB0', borderRadius: 4, border: '1px solid rgba(0,0,0,0.2)', overflow: 'hidden' }}>
                <div style={{ height: '100%', borderRadius: 4, transition: 'width 0.4s ease', width: `${(hp / MAX_HP) * 100}%`,
                  background: hp > 2 ? '#22c55e' : hp > 1 ? '#f7941d' : '#CE2B37' }} />
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <p style={{ fontFamily: "'Fredoka One',sans-serif", fontSize: 9, color: '#7A7A8C' }}>{score}/{total}</p>
              <div style={{ display: 'flex', gap: 2 }}>
                {Array.from({ length: MAX_HP }).map((_, i) => (
                  <span key={i} style={{ fontSize: 9 }}>{i < hp ? '❤️' : '🖤'}</span>
                ))}
              </div>
            </div>
            {playerLine && (
              <p key={playerLine} className="commentary-in" style={{ fontFamily: "'Nunito',sans-serif", fontSize: 9, color: feedback?.correct ? '#008C45' : '#CE2B37', fontStyle: 'italic', marginTop: 3, lineHeight: 1.3 }}>
                "{playerLine}"
              </p>
            )}
          </div>
        </div>

        {/* Quit — top center */}
        <button onClick={() => router.push('/')} style={{
          position: 'absolute', top: 10, left: '50%', transform: 'translateX(-50%)', zIndex: 20,
          background: 'rgba(26,26,46,0.72)', border: '1.5px solid rgba(255,249,240,0.2)',
          borderRadius: 8, padding: '5px 14px',
          fontFamily: "'Fredoka One',sans-serif", fontSize: 11,
          color: 'rgba(255,249,240,0.6)', textTransform: 'uppercase', letterSpacing: '0.15em', cursor: 'pointer',
        }}>
          ← RUN
        </button>
      </div>

      {/* ── BATTLE PANEL (bottom) ── */}
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', background: '#FFF9F0', borderTop: '3px solid #1A1A2E' }}>

        {/* Question text box */}
        {phase === 'answering' && (
          <div style={{ borderBottom: '2px solid #E0CCB0', padding: '10px 16px', flexShrink: 0, background: '#FFF9F0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
              <p style={{ fontFamily: "'Fredoka One',sans-serif", fontSize: 9, color: 'rgba(206,43,55,0.75)', textTransform: 'uppercase', letterSpacing: '0.3em' }}>
                🍕 {qTypeLabel}
              </p>
              <p style={{ fontFamily: "'Fredoka One',sans-serif", fontSize: 9, color: '#7A7A8C', textTransform: 'uppercase', letterSpacing: '0.2em' }}>
                {qIndex + 1} / {total}
              </p>
            </div>
            <p style={{ fontFamily: "'Nunito',sans-serif", fontSize: '0.92rem', color: '#1A1A2E', lineHeight: 1.45, fontWeight: 600 }}>
              {questionText}
            </p>
          </div>
        )}

        {/* Answer choices / feedback */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '10px 14px' }}>
          {phase === 'answering' && currentQ?.type === 'multiple-choice' && (
            <MultipleChoice question={currentQ} onAnswer={handleAnswer} />
          )}
          {phase === 'answering' && currentQ?.type === 'type-answer' && (
            <TypeAnswer question={currentQ} onAnswer={handleAnswer} onSkip={() => handleAnswer(false, '(saltata)')} />
          )}
          {phase === 'answering' && currentQ?.type === 'fill-blank' && (
            <FillBlank question={currentQ} onAnswer={handleAnswer} onSkip={() => handleAnswer(false, '(saltata)')} />
          )}
          {phase === 'answering' && currentQ?.type === 'match-pairs' && (
            <MatchPairs question={currentQ} onAnswer={handleAnswer} />
          )}
          {phase === 'feedback' && feedback && (
            <FeedbackOverlay
              correct={feedback.correct}
              explanation={feedback.explanation}
              correctAnswer={feedback.correctAnswer}
              onContinue={handleNext}
              isGameOver={false}
              isComplete={qIndex >= total - 1}
            />
          )}
        </div>
      </div>

      {hp === 0 && phase === 'answering' && (
        <div style={{
          position: 'fixed', bottom: 8, left: '50%', transform: 'translateX(-50%)',
          background: 'rgba(206,43,55,0.08)', border: '2px solid rgba(206,43,55,0.45)',
          color: '#CE2B37', borderRadius: 999, padding: '7px 18px', zIndex: 50,
          fontFamily: "'Fredoka One',sans-serif", fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.2em',
        }}>
          🍕 No lives — keep going!
        </div>
      )}
    </main>
  );
}

export default function QuizPage() {
  return <Suspense><QuizContent /></Suspense>;
}
