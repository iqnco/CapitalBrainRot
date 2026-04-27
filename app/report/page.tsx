'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { MatchReport, AnswerRecord } from '@/lib/types';

const TYPE_LABELS: Record<string, string> = {
  'multiple-choice': 'MC',
  'type-answer':     'TYPE',
  'fill-blank':      'FILL',
  'match-pairs':     'MATCH',
};

const OPTION_LABELS = ['A', 'B', 'C', 'D', 'E'];

function AnswerCard({ record, index }: { record: AnswerRecord; index: number }) {
  const correctAnswerLines = record.correctAnswer.split('\n');
  const isMultiLine = correctAnswerLines.length > 1;

  return (
    <div className="p-4" style={{
      background: 'rgba(255,255,255,0.04)',
      border: `1px solid ${record.correct ? 'rgba(34,197,94,0.25)' : 'rgba(206,43,55,0.25)'}`,
      borderRadius: 14,
    }}>
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <span className="font-mono text-xs" style={{ color: '#6b7090' }}>
          {String(index + 1).padStart(2, '0')}
        </span>
        <span className="text-[10px] font-mono uppercase tracking-widest px-1.5 py-0.5"
              style={{ background: 'rgba(247,148,29,0.1)', color: '#f7941d',
                       border: '1px solid rgba(247,148,29,0.2)',
                       clipPath: 'polygon(0 0, calc(100% - 4px) 0, 100% 4px, 100% 100%, 4px 100%, 0 calc(100% - 4px))' }}>
          {TYPE_LABELS[record.questionType] ?? record.questionType}
        </span>
        <span className="ml-auto text-xs font-bold font-mono uppercase tracking-widest"
              style={{ color: record.correct ? '#22c55e' : '#e8001a' }}>
          {record.correct ? '✓ CORRECT' : '✗ WRONG'}
        </span>
      </div>

      {/* Question */}
      <p className="text-sm leading-relaxed mb-3" style={{ color: '#e8eaf2' }}>{record.questionText}</p>

      {/* All answer options (MC questions) */}
      {record.options && record.options.length > 0 ? (
        <div className="space-y-1.5 mb-3">
          {record.options.map((opt, i) => {
            const isCorrect = opt === record.correctAnswer;
            const isUserWrong = !record.correct && opt === record.userAnswer;
            const isSkipped = !record.correct && record.userAnswer === '(skipped)' && isCorrect;

            let bg = 'rgba(255,255,255,0.03)';
            let border = 'rgba(255,255,255,0.06)';
            let textColor = '#6b7090';
            let labelBg = 'rgba(255,255,255,0.05)';
            let labelColor = '#4a4a65';

            if (isCorrect) {
              bg = 'rgba(34,197,94,0.08)';
              border = 'rgba(34,197,94,0.35)';
              textColor = '#e8eaf2';
              labelBg = 'rgba(34,197,94,0.15)';
              labelColor = '#22c55e';
            } else if (isUserWrong) {
              bg = 'rgba(232,0,26,0.08)';
              border = 'rgba(232,0,26,0.3)';
              textColor = '#e8001a';
              labelBg = 'rgba(232,0,26,0.12)';
              labelColor = '#e8001a';
            }

            return (
              <div key={i} className="flex items-start gap-2.5 px-3 py-2 rounded-sm"
                   style={{ background: bg, border: `1px solid ${border}` }}>
                <span className="shrink-0 w-5 h-5 rounded flex items-center justify-center text-[11px] font-bold font-mono mt-0.5"
                      style={{ background: labelBg, color: labelColor }}>
                  {OPTION_LABELS[i]}
                </span>
                <span className="text-sm leading-snug" style={{ color: textColor }}>
                  {opt}
                  {isCorrect && <span className="ml-2 text-[10px] font-mono uppercase tracking-widest" style={{ color: '#22c55e' }}>✓</span>}
                  {isUserWrong && <span className="ml-2 text-[10px] font-mono uppercase tracking-widest" style={{ color: '#e8001a' }}>✗ your answer</span>}
                  {isSkipped && <span className="ml-2 text-[10px] font-mono uppercase tracking-widest" style={{ color: '#6b7090' }}>(skipped)</span>}
                </span>
              </div>
            );
          })}
        </div>
      ) : (
        /* Non-MC fallback: show correct / wrong answer as plain text */
        <>
          {!record.correct && record.userAnswer && record.userAnswer !== '(skipped)' && (
            <div className="mb-2 flex gap-2 items-start">
              <span className="text-xs font-mono uppercase tracking-widest shrink-0 mt-0.5" style={{ color: '#e8001a' }}>You:</span>
              <span className="text-sm" style={{ color: '#e8001a' }}>{record.userAnswer}</span>
            </div>
          )}
          {!record.correct && record.userAnswer === '(skipped)' && (
            <p className="mb-2 text-xs font-mono uppercase tracking-widest" style={{ color: '#6b7090' }}>(skipped)</p>
          )}
          <div className="mb-2 flex gap-2 items-start">
            <span className="text-xs font-mono uppercase tracking-widest shrink-0 mt-0.5" style={{ color: '#22c55e' }}>
              {record.correct ? 'Answer:' : 'Correct:'}
            </span>
            {isMultiLine ? (
              <ul className="space-y-0.5">
                {correctAnswerLines.map((line, i) => (
                  <li key={i} className="text-sm font-mono" style={{ color: '#22c55e' }}>{line}</li>
                ))}
              </ul>
            ) : (
              <span className="text-sm font-semibold" style={{ color: '#22c55e' }}>{record.correctAnswer}</span>
            )}
          </div>
        </>
      )}

      {record.explanation && (
        <p className="text-xs leading-relaxed pt-2 border-t" style={{ color: '#6b7090', borderColor: '#242432' }}>
          {record.explanation}
        </p>
      )}
    </div>
  );
}

function ReportContent() {
  const router = useRouter();
  const params = useSearchParams();
  const id = params.get('id');
  const [report, setReport] = useState<MatchReport | null>(null);

  useEffect(() => {
    if (id) {
      const history: MatchReport[] = JSON.parse(localStorage.getItem('rts-history') ?? '[]');
      const found = history.find((r) => r.id === id);
      if (found) { setReport(found); return; }
    }
    const current = localStorage.getItem('rts-match-report');
    if (current) { setReport(JSON.parse(current)); return; }
    router.push('/');
  }, [id, router]);

  if (!report) return null;

  const date   = new Date(report.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  const wrongs = report.answers.filter(a => !a.correct);
  const rights = report.answers.filter(a =>  a.correct);

  const card: React.CSSProperties = {
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,220,100,0.12)',
    borderRadius: 16,
  };

  return (
    <main className="min-h-screen pb-16" style={{ background: '#0a0500', color: '#e8eaf2' }}>
      {/* Top bar */}
      <header className="sticky top-0 z-10 flex items-center gap-4 px-5 h-12 border-b"
              style={{ background: 'rgba(10,5,0,0.95)', borderColor: 'rgba(212,160,23,0.2)', backdropFilter: 'blur(8px)' }}>
        <button onClick={() => router.back()}
                className="text-xs font-mono tracking-widest uppercase"
                style={{ color: 'rgba(255,220,150,0.5)', background: 'none', border: 'none', cursor: 'pointer' }}>
          ← BACK
        </button>
        <div className="flex-1 text-center">
          <span className="text-xs font-mono uppercase tracking-[0.3em]"
                style={{ color: 'rgba(206,43,55,0.85)', fontFamily: "'Fredoka One', sans-serif" }}>// Match Report</span>
        </div>
        <button onClick={() => router.push('/history')}
                className="text-xs font-mono tracking-widest uppercase"
                style={{ color: 'rgba(255,220,150,0.5)', background: 'none', border: 'none', cursor: 'pointer' }}>
          HISTORY
        </button>
      </header>

      <div className="mx-auto max-w-4xl px-4 pt-5 space-y-4">
        {/* Summary card */}
        <div style={{ ...card, padding: '20px' }}>
          <p className="text-[10px] font-mono uppercase tracking-[0.3em] mb-0.5"
             style={{ color: 'rgba(206,43,55,0.8)' }}>Operation</p>
          <p className="font-bold text-lg uppercase tracking-wide leading-tight mb-0.5"
             style={{ color: 'white', fontFamily: "'Fredoka One', sans-serif" }}>{report.subject}</p>
          <p className="text-xs font-mono mb-4" style={{ color: 'rgba(255,220,150,0.35)' }}>{date}</p>

          <div className="grid grid-cols-3 gap-2">
            {[
              { label: 'Score',   value: `${report.score}/${report.total}`, color: '#f7941d' },
              { label: 'Correct', value: String(rights.length), color: '#22c55e' },
              { label: 'Wrong',   value: String(wrongs.length), color: '#CE2B37' },
            ].map(({ label, value, color }) => (
              <div key={label} className="text-center py-3" style={{ ...card }}>
                <p className="text-[9px] font-mono uppercase tracking-wider mb-1"
                   style={{ color: 'rgba(255,220,150,0.4)' }}>{label}</p>
                <p className="font-black text-xl" style={{ color, fontFamily: "'Fredoka One', sans-serif" }}>{value}</p>
              </div>
            ))}
          </div>
        </div>

        {wrongs.length > 0 && (
          <section>
            <p className="text-xs font-mono uppercase tracking-widest mb-2"
               style={{ color: '#CE2B37', fontFamily: "'Fredoka One', sans-serif" }}>// Missed Objectives ({wrongs.length})</p>
            <div className="space-y-2">
              {wrongs.map((r) => (
                <AnswerCard key={r.questionText} record={r} index={report.answers.indexOf(r)} />
              ))}
            </div>
          </section>
        )}

        {rights.length > 0 && (
          <section>
            <p className="text-xs font-mono uppercase tracking-widest mb-2"
               style={{ color: '#22c55e', fontFamily: "'Fredoka One', sans-serif" }}>// Confirmed Kills ({rights.length})</p>
            <div className="space-y-2">
              {rights.map((r) => (
                <AnswerCard key={r.questionText} record={r} index={report.answers.indexOf(r)} />
              ))}
            </div>
          </section>
        )}

        <div className="space-y-2 pt-2">
          <button
            onClick={() => { localStorage.removeItem('rts-results'); router.push('/'); }}
            style={{
              width: '100%', padding: '14px',
              borderRadius: 16, border: '2px solid rgba(0,140,69,0.5)',
              background: 'linear-gradient(135deg, #008C45, #00a852)',
              color: 'white', fontFamily: "'Fredoka One', sans-serif",
              fontSize: 16, letterSpacing: '0.12em', textTransform: 'uppercase',
              cursor: 'pointer', boxShadow: '0 4px 20px rgba(0,140,69,0.4)',
            }}>
            New Mission
          </button>
          <button onClick={() => router.push('/')}
            style={{
              width: '100%', padding: '14px',
              borderRadius: 16, border: '1px solid rgba(255,220,100,0.2)',
              background: 'rgba(255,255,255,0.04)',
              color: 'rgba(255,220,150,0.6)', fontFamily: "'Fredoka One', sans-serif",
              fontSize: 16, letterSpacing: '0.12em', textTransform: 'uppercase',
              cursor: 'pointer',
            }}>
            ← Main Menu
          </button>
        </div>
      </div>
    </main>
  );
}

export default function ReportPage() {
  return <Suspense><ReportContent /></Suspense>;
}
