'use client';

import { useState, useEffect, useCallback, useRef, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Question, QuizResults, AnswerRecord, MatchReport, ChapterSeenMap } from '@/lib/types';

const SEEN_KEY = 'rts-chapter-seen';

function markQuestionSeen(chapter: string | undefined, questionText: string) {
  if (!chapter) return;
  const raw = localStorage.getItem(SEEN_KEY);
  const map: ChapterSeenMap = raw ? JSON.parse(raw) : {};
  const key = questionText.slice(0, 100);
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

const MAX_HP = 5;

const OPERATOR_META: Record<string, { name: string; role: string }> = {
  ash:         { name: 'ASH',         role: 'ATTACKER' },
  doc:         { name: 'DOC',         role: 'DEFENDER' },
  blitz:       { name: 'BLITZ',       role: 'ATTACKER' },
  caveira:     { name: 'CAVEIRA',     role: 'DEFENDER' },
  tachanka:    { name: 'TACHANKA',    role: 'DEFENDER' },
  mozzie:      { name: 'MOZZIE',      role: 'DEFENDER' },
  deimos:      { name: 'DEIMOS',      role: 'ATTACKER' },
  thunderbird: { name: 'THUNDERBIRD', role: 'DEFENDER' },
  warden:      { name: 'WARDEN',      role: 'DEFENDER' },
};

type Phase = 'answering' | 'feedback';
interface Feedback { correct: boolean; explanation: string; correctAnswer?: string; }

const TYPE_LABELS: Record<string, string> = {
  'multiple-choice': 'MULTIPLE CHOICE',
  'type-answer':     'TYPE ANSWER',
  'fill-blank':      'FILL IN THE BLANK',
  'match-pairs':     'MATCH PAIRS',
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
  const subject = params.get('subject') ?? 'Unknown Subject';

  const [questions, setQuestions]       = useState<Question[]>([]);
  const [qIndex, setQIndex]             = useState(0);
  const [score, setScore]               = useState(0);
  const [hp, setHp]                     = useState(MAX_HP);
  const [wrongCount, setWrongCount]     = useState(0);
  const [phase, setPhase]               = useState<Phase>('answering');
  const [feedback, setFeedback]         = useState<Feedback | null>(null);
  const [enemyIds, setEnemyIds]         = useState<string[]>([]);
  const [playerOpId, setPlayerOpId]     = useState<string>('ash');
  const [isDying, setIsDying]           = useState(false);
  const [isDamaged, setIsDamaged]       = useState(false);
  const [isPlayerHit, setIsPlayerHit]   = useState(false);
  const answerLogRef = useRef<AnswerRecord[]>([]);

  useEffect(() => {
    const savedQ = localStorage.getItem('rts-questions');
    if (!savedQ) { router.push('/'); return; }
    setQuestions(JSON.parse(savedQ));
    setEnemyIds(JSON.parse(localStorage.getItem('rts-operator-ids') ?? '["caveira"]') as string[]);
    setPlayerOpId(localStorage.getItem('rts-player-operator') ?? 'ash');
  }, [router]);

  const total    = questions.length;
  const currentQ = questions[qIndex] ?? null;

  const handleAnswer = useCallback((correct: boolean, userAnswer: string = '') => {
    if (!currentQ) return;
    const newScore = correct ? score + 1 : score;
    const newHp    = correct ? hp : hp - 1;
    const newWrong = correct ? wrongCount : wrongCount + 1;
    setScore(newScore); setHp(newHp); setWrongCount(newWrong);

    if (correct) {
      // Enemy dies — animation plays alongside feedback
      setIsDying(true);
    } else {
      // Screen flash + player hit
      setIsDamaged(true);
      setIsPlayerHit(true);
      setTimeout(() => setIsDamaged(false), 450);
      setTimeout(() => setIsPlayerHit(false), 450);
    }

    setFeedback({ correct, explanation: currentQ.explanation, correctAnswer: getCorrectAnswer(currentQ) });

    if (currentQ.type === 'multiple-choice') markQuestionSeen(currentQ.chapter, currentQ.question);

    const record: AnswerRecord = {
      questionText: 'question' in currentQ ? currentQ.question
                  : 'sentence' in currentQ ? currentQ.sentence
                  : currentQ.instruction,
      questionType: currentQ.type,
      userAnswer: userAnswer || '(skipped)',
      correctAnswer: getCorrectAnswer(currentQ),
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
      localStorage.setItem('rts-results', JSON.stringify({
        subject, score: newScore, total,
        wrongCount: newWrong, armor: newHp,
      } as QuizResults));
    }
    setPhase('feedback');
  }, [currentQ, score, hp, wrongCount, qIndex, total, subject]);

  const handleNext = useCallback(() => {
    setIsDying(false);
    if (qIndex >= total - 1) { router.push('/results'); return; }
    setQIndex((i) => i + 1);
    setFeedback(null);
    setPhase('answering');
  }, [qIndex, total, router]);

  if (!questions.length) {
    return (
      <main className="h-screen siege-bg flex items-center justify-center">
        <div className="w-6 h-6 rounded-full border-2 animate-spin"
             style={{ borderColor: '#f7941d', borderTopColor: 'transparent' }} />
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

  const progressPct = total > 0 ? (qIndex / total) * 100 : 0;

  // Enemy for this question
  const enemyId   = enemyIds[qIndex] ?? 'caveira';
  const enemyMeta = OPERATOR_META[enemyId] ?? { name: enemyId.toUpperCase(), role: '' };

  // Operators whose sprites face left and need mirroring when shown as player
  const MIRROR_AS_PLAYER = new Set(['tachanka', 'thunderbird']);

  // Player
  const playerMeta = OPERATOR_META[playerOpId] ?? { name: playerOpId.toUpperCase(), role: '' };

  return (
    <main className="h-screen siege-bg flex flex-col overflow-hidden">

      {/* ── Screen damage overlay ── */}
      {isDamaged && <div className="screen-damage-overlay" />}

      {/* ── Top HUD ── */}
      <header
        className="flex-none flex items-center justify-between px-4 border-b"
        style={{ background: 'rgba(5,5,10,0.95)', borderColor: 'rgba(232,0,26,0.2)', height: '52px' }}
      >
        {/* Main menu button */}
        <button
          onClick={() => router.push('/')}
          className="flex-none text-[10px] font-mono uppercase tracking-widest transition-colors hover:text-white mr-3"
          style={{ color: '#3a3a55' }}
          title="Main Menu"
        >
          ⌂
        </button>

        {/* Player identity (text only — sprite shown in content area) */}
        <div className="flex items-center gap-2 mr-3 min-w-0">
          <div className="w-1.5 h-6 rounded-sm" style={{ background: '#f7941d', flexShrink: 0 }} />
          <div className="min-w-0">
            <p className="text-[9px] font-mono uppercase tracking-[0.25em] leading-none mb-0.5"
               style={{ color: 'rgba(232,0,26,0.7)' }}>You</p>
            <p className="font-bold uppercase leading-none truncate"
               style={{ fontSize: '0.8rem', color: '#e8eaf2', letterSpacing: '0.1em' }}>
              {playerMeta.name}
            </p>
          </div>
        </div>

        {/* Progress */}
        <div className="flex-1 max-w-xs mx-3 hidden sm:block">
          <div className="flex justify-between mb-1">
            <span className="text-[10px] font-mono" style={{ color: '#6b7090' }}>{qIndex}/{total}</span>
            <span className="text-[10px] font-mono font-bold" style={{ color: '#f7941d' }}>SCORE {score}</span>
          </div>
          <div className="h-1 overflow-hidden" style={{ background: '#1a1a28' }}>
            <div className="h-full progress-fill transition-all duration-500" style={{ width: `${progressPct}%` }} />
          </div>
        </div>

        <HealthHearts current={hp} max={MAX_HP} />
      </header>

      {/* ── Main content ── */}
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-2xl px-4 py-5 flex flex-col gap-5">

          {/* Type label + counter */}
          <div className="flex items-center justify-between">
            <p className="text-xs font-mono uppercase tracking-[0.25em]"
               style={{ color: 'rgba(232,0,26,0.7)' }}>
              // {qTypeLabel}
            </p>
            <p className="text-xs font-mono uppercase tracking-widest" style={{ color: '#6b7090' }}>
              Objective {qIndex + 1} / {total}
            </p>
          </div>

          {/* ── Player (left) + Speech bubble (middle) + Enemy (right) ── */}
          <div className="flex items-end gap-3">

            {/* Player sprite — left side, faces right (normal) */}
            <div className="flex-none flex flex-col items-center" style={{ width: '90px' }}>
              <div style={{
                height: '150px', width: '90px',
                display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
              }}>
                <img
                  key={`player-${playerOpId}`}
                  src={`/chibis/${playerOpId}.png`}
                  alt={playerMeta.name}
                  className={isPlayerHit ? 'player-hit' : 'animate-boxer'}
                  style={{
                    maxHeight: '150px', maxWidth: '90px',
                    width: 'auto', height: 'auto',
                    objectFit: 'contain', imageRendering: 'pixelated',
                    transform: MIRROR_AS_PLAYER.has(playerOpId) ? 'scaleX(-1)' : undefined,
                  }}
                  onError={(e) => { (e.currentTarget as HTMLImageElement).style.opacity = '0.1'; }}
                />
              </div>
              <div className="w-full text-center mt-1.5 pt-1.5 border-t"
                   style={{ borderColor: 'rgba(247,148,29,0.2)' }}>
                <p className="text-xs font-bold tracking-[0.15em] uppercase leading-none"
                   style={{ color: '#f7941d' }}>{playerMeta.name}</p>
                <p className="text-[9px] font-mono tracking-widest leading-snug" style={{ color: '#6b7090' }}>
                  {playerMeta.role}
                </p>
              </div>
            </div>

            {/* Speech bubble — tail points RIGHT toward enemy */}
            <div
              className="flex-1 relative p-4 op-card scanlines"
              style={{ borderColor: '#242432' }}
            >
              {/* Right-pointing tail — outer (border color) */}
              <div style={{
                position: 'absolute', right: -9, top: 22,
                width: 0, height: 0,
                borderTop: '8px solid transparent',
                borderBottom: '8px solid transparent',
                borderLeft: '9px solid #242432',
              }} />
              {/* Right-pointing tail — inner (fill) */}
              <div style={{
                position: 'absolute', right: -7, top: 23,
                width: 0, height: 0,
                borderTop: '7px solid transparent',
                borderBottom: '7px solid transparent',
                borderLeft: '8px solid #0d0d14',
              }} />
              <p className="text-base md:text-lg leading-relaxed font-semibold" style={{ color: '#e8eaf2' }}>
                {questionText}
              </p>
            </div>

            {/* Enemy sprite — right side, mirrored to face left */}
            <div className="flex-none flex flex-col items-center" style={{ width: '90px' }}>
              {/* Mirror wrapper — scaleX(-1) lives here so dying anim stays clean */}
              <div style={{
                height: '150px', width: '90px',
                display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
                position: 'relative',
                transform: 'scaleX(-1)',
                transformOrigin: 'center bottom',
              }}>
                <img
                  key={`enemy-${qIndex}`}
                  src={`/chibis/${enemyId}.png`}
                  alt={enemyMeta.name}
                  className={isDying ? 'enemy-dying' : 'animate-boxer-enemy'}
                  style={{
                    maxHeight: '150px',
                    maxWidth: '90px',
                    width: 'auto',
                    height: 'auto',
                    objectFit: 'contain',
                    imageRendering: 'pixelated',
                    // Wrapper already flips everything left. Sprites that naturally face
                    // left (tachanka/thunderbird) get double-flipped back to face left.
                    transform: MIRROR_AS_PLAYER.has(enemyId) ? 'scaleX(-1)' : undefined,
                  }}
                  onError={(e) => { (e.currentTarget as HTMLImageElement).style.opacity = '0.1'; }}
                />
              </div>

              {/* Enemy nameplate */}
              <div
                className="w-full text-center mt-1.5 pt-1.5 border-t"
                style={{ borderColor: 'rgba(232,0,26,0.25)' }}
              >
                <p className="text-xs font-bold tracking-[0.15em] uppercase leading-none"
                   style={{ color: '#e8001a' }}>
                  {enemyMeta.name}
                </p>
                <p className="text-[9px] font-mono tracking-widest leading-snug" style={{ color: '#6b7090' }}>
                  {enemyMeta.role}
                </p>
              </div>
            </div>

          </div>

          {/* ── Answer area ── */}
          {phase === 'answering' && currentQ?.type === 'multiple-choice' && (
            <MultipleChoice question={currentQ} onAnswer={handleAnswer} />
          )}
          {phase === 'answering' && currentQ?.type === 'type-answer' && (
            <TypeAnswer question={currentQ} onAnswer={handleAnswer} onSkip={() => handleAnswer(false, '(skipped)')} />
          )}
          {phase === 'answering' && currentQ?.type === 'fill-blank' && (
            <FillBlank question={currentQ} onAnswer={handleAnswer} onSkip={() => handleAnswer(false, '(skipped)')} />
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

      {/* Squad KIA warning — shown when all 5 lives lost but quiz continues */}
      {hp === 0 && phase === 'answering' && (
        <div
          className="fixed bottom-5 left-1/2 -translate-x-1/2 px-4 py-2 text-xs font-mono uppercase tracking-widest animate-blink"
          style={{
            background: 'rgba(232,0,26,0.1)',
            border: '1px solid rgba(232,0,26,0.45)',
            color: '#e8001a',
            clipPath: 'polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 8px 100%, 0 calc(100% - 8px))',
          }}
        >
          ⚠ SQUAD KIA — Mission failed, but finish the debrief
        </div>
      )}
    </main>
  );
}

export default function QuizPage() {
  return <Suspense><QuizContent /></Suspense>;
}
