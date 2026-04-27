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

// Shared card style
const card: React.CSSProperties = {
  background: 'rgba(255,220,100,0.04)',
  border: '1px solid rgba(212,160,23,0.18)',
  borderRadius: 16,
};

function AnswerCard({ record, index }: { record: AnswerRecord; index: number }) {
  const correctAnswerLines = record.correctAnswer.split('\n');
  const isMultiLine = correctAnswerLines.length > 1;

  return (
    <div style={{
      ...card,
      padding: 16,
      borderColor: record.correct ? 'rgba(34,197,94,0.3)' : 'rgba(206,43,55,0.3)',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <span style={{ fontFamily: "'Fredoka One', sans-serif", fontSize: 11, color: 'rgba(255,220,150,0.35)', letterSpacing: '0.1em' }}>
          {String(index + 1).padStart(2, '0')}
        </span>
        <span style={{
          fontSize: 9, fontFamily: "'Fredoka One', sans-serif", letterSpacing: '0.2em',
          textTransform: 'uppercase', padding: '2px 7px', borderRadius: 6,
          background: 'rgba(247,148,29,0.15)', color: '#f7941d',
          border: '1px solid rgba(247,148,29,0.3)',
        }}>
          {TYPE_LABELS[record.questionType] ?? record.questionType}
        </span>
        <span style={{
          marginLeft: 'auto', fontSize: 11, fontFamily: "'Fredoka One', sans-serif",
          letterSpacing: '0.15em', textTransform: 'uppercase',
          color: record.correct ? '#22c55e' : '#CE2B37',
        }}>
          {record.correct ? '✓ CORRECT' : '✗ WRONG'}
        </span>
      </div>

      {/* Question text */}
      <p style={{ fontSize: 14, lineHeight: 1.6, color: 'rgba(255,240,200,0.85)', marginBottom: 12, fontFamily: "'Nunito', sans-serif" }}>
        {record.questionText}
      </p>

      {/* MC options */}
      {record.options && record.options.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 12 }}>
          {record.options.map((opt, i) => {
            const isCorrect   = opt === record.correctAnswer;
            const isUserWrong = !record.correct && opt === record.userAnswer;

            const bg         = isCorrect   ? 'rgba(34,197,94,0.12)'
                             : isUserWrong ? 'rgba(206,43,55,0.12)'
                             :               'rgba(255,255,255,0.04)';
            const borderCol  = isCorrect   ? 'rgba(34,197,94,0.45)'
                             : isUserWrong ? 'rgba(206,43,55,0.45)'
                             :               'rgba(255,220,100,0.1)';
            const textCol    = isCorrect   ? '#86efac'
                             : isUserWrong ? '#fca5a5'
                             :               'rgba(255,230,180,0.55)';
            const labelBg    = isCorrect   ? 'rgba(34,197,94,0.2)'
                             : isUserWrong ? 'rgba(206,43,55,0.2)'
                             :               'rgba(255,220,100,0.08)';
            const labelCol   = isCorrect   ? '#22c55e'
                             : isUserWrong ? '#CE2B37'
                             :               'rgba(212,160,23,0.5)';

            return (
              <div key={i} style={{
                display: 'flex', alignItems: 'flex-start', gap: 10,
                padding: '8px 12px', borderRadius: 10,
                background: bg, border: `1px solid ${borderCol}`,
              }}>
                <span style={{
                  flexShrink: 0, width: 22, height: 22, borderRadius: 6,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 11, fontFamily: "'Fredoka One', sans-serif",
                  background: labelBg, color: labelCol, marginTop: 1,
                }}>
                  {OPTION_LABELS[i]}
                </span>
                <span style={{ fontSize: 13, lineHeight: 1.5, color: textCol, fontFamily: "'Nunito', sans-serif" }}>
                  {opt}
                  {isCorrect   && <span style={{ marginLeft: 8, fontSize: 10, color: '#22c55e', fontFamily: "'Fredoka One', sans-serif", letterSpacing: '0.1em' }}>✓</span>}
                  {isUserWrong && <span style={{ marginLeft: 8, fontSize: 10, color: '#CE2B37', fontFamily: "'Fredoka One', sans-serif", letterSpacing: '0.1em' }}>✗ your answer</span>}
                </span>
              </div>
            );
          })}
        </div>
      ) : (
        <div style={{ marginBottom: 12 }}>
          {!record.correct && record.userAnswer && record.userAnswer !== '(skipped)' && (
            <div style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
              <span style={{ fontSize: 10, fontFamily: "'Fredoka One', sans-serif", color: '#CE2B37', flexShrink: 0, marginTop: 2, letterSpacing: '0.1em' }}>YOU:</span>
              <span style={{ fontSize: 13, color: '#fca5a5', fontFamily: "'Nunito', sans-serif" }}>{record.userAnswer}</span>
            </div>
          )}
          <div style={{ display: 'flex', gap: 8 }}>
            <span style={{ fontSize: 10, fontFamily: "'Fredoka One', sans-serif", color: '#22c55e', flexShrink: 0, marginTop: 2, letterSpacing: '0.1em' }}>
              {record.correct ? 'ANSWER:' : 'CORRECT:'}
            </span>
            {isMultiLine ? (
              <ul style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {correctAnswerLines.map((line, i) => (
                  <li key={i} style={{ fontSize: 13, color: '#86efac', fontFamily: "'Nunito', sans-serif" }}>{line}</li>
                ))}
              </ul>
            ) : (
              <span style={{ fontSize: 13, fontWeight: 700, color: '#86efac', fontFamily: "'Nunito', sans-serif" }}>{record.correctAnswer}</span>
            )}
          </div>
        </div>
      )}

      {record.explanation && (
        <p style={{
          fontSize: 12, lineHeight: 1.6,
          color: 'rgba(255,220,150,0.4)',
          paddingTop: 10, borderTop: '1px solid rgba(212,160,23,0.12)',
          fontFamily: "'Nunito', sans-serif",
        }}>
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

  return (
    <main style={{ minHeight: '100vh', background: '#0a0500', paddingBottom: 64 }}>

      {/* Top bar */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 10,
        display: 'flex', alignItems: 'center', gap: 16,
        padding: '0 20px', height: 48,
        background: 'rgba(10,5,0,0.95)',
        borderBottom: '1px solid rgba(212,160,23,0.2)',
        backdropFilter: 'blur(8px)',
      }}>
        <button onClick={() => router.back()} style={{
          fontSize: 11, fontFamily: "'Fredoka One', sans-serif", letterSpacing: '0.15em',
          textTransform: 'uppercase', color: 'rgba(255,220,150,0.5)',
          background: 'none', border: 'none', cursor: 'pointer',
        }}>
          ← BACK
        </button>
        <div style={{ flex: 1, textAlign: 'center' }}>
          <span style={{
            fontSize: 11, fontFamily: "'Fredoka One', sans-serif",
            letterSpacing: '0.3em', textTransform: 'uppercase',
            color: 'rgba(206,43,55,0.85)',
          }}>// Match Report</span>
        </div>
        <button onClick={() => router.push('/history')} style={{
          fontSize: 11, fontFamily: "'Fredoka One', sans-serif", letterSpacing: '0.15em',
          textTransform: 'uppercase', color: 'rgba(255,220,150,0.5)',
          background: 'none', border: 'none', cursor: 'pointer',
        }}>
          HISTORY
        </button>
      </header>

      <div style={{ maxWidth: 800, margin: '0 auto', padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* Summary card */}
        <div style={{ ...card, padding: 20 }}>
          <p style={{ fontSize: 9, fontFamily: "'Fredoka One', sans-serif", letterSpacing: '0.3em', textTransform: 'uppercase', color: 'rgba(206,43,55,0.7)', marginBottom: 4 }}>
            Operation
          </p>
          <p style={{ fontSize: 18, fontFamily: "'Fredoka One', sans-serif", fontWeight: 900, color: 'white', textTransform: 'uppercase', letterSpacing: '0.05em', lineHeight: 1.2, marginBottom: 4 }}>
            {report.subject}
          </p>
          <p style={{ fontSize: 11, fontFamily: "'Fredoka One', sans-serif", color: 'rgba(255,220,150,0.3)', marginBottom: 16 }}>
            {date}
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
            {[
              { label: 'Score',   value: `${report.score}/${report.total}`, color: '#f7941d' },
              { label: 'Correct', value: String(rights.length),             color: '#22c55e' },
              { label: 'Wrong',   value: String(wrongs.length),             color: '#CE2B37' },
            ].map(({ label, value, color }) => (
              <div key={label} style={{ ...card, textAlign: 'center', padding: '12px 8px' }}>
                <p style={{ fontSize: 9, fontFamily: "'Fredoka One', sans-serif", letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(255,220,150,0.35)', marginBottom: 4 }}>{label}</p>
                <p style={{ fontSize: 24, fontFamily: "'Fredoka One', sans-serif", fontWeight: 900, color }}>{value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Missed */}
        {wrongs.length > 0 && (
          <section>
            <p style={{ fontSize: 11, fontFamily: "'Fredoka One', sans-serif", letterSpacing: '0.2em', textTransform: 'uppercase', color: '#CE2B37', marginBottom: 8 }}>
              // Missed Objectives ({wrongs.length})
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {wrongs.map((r) => (
                <AnswerCard key={r.questionText} record={r} index={report.answers.indexOf(r)} />
              ))}
            </div>
          </section>
        )}

        {/* Confirmed kills */}
        {rights.length > 0 && (
          <section>
            <p style={{ fontSize: 11, fontFamily: "'Fredoka One', sans-serif", letterSpacing: '0.2em', textTransform: 'uppercase', color: '#22c55e', marginBottom: 8 }}>
              // Confirmed Kills ({rights.length})
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {rights.map((r) => (
                <AnswerCard key={r.questionText} record={r} index={report.answers.indexOf(r)} />
              ))}
            </div>
          </section>
        )}

        {/* Buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingTop: 8 }}>
          <button
            onClick={() => { localStorage.removeItem('rts-results'); router.push('/'); }}
            style={{
              width: '100%', padding: 14, borderRadius: 16,
              border: '2px solid rgba(0,140,69,0.5)',
              background: 'linear-gradient(135deg, #008C45, #00a852)',
              color: 'white', fontFamily: "'Fredoka One', sans-serif",
              fontSize: 16, letterSpacing: '0.12em', textTransform: 'uppercase',
              cursor: 'pointer', boxShadow: '0 4px 20px rgba(0,140,69,0.35)',
            }}>
            New Mission
          </button>
          <button onClick={() => router.push('/')} style={{
            width: '100%', padding: 14, borderRadius: 16,
            border: '1px solid rgba(212,160,23,0.2)',
            background: 'rgba(255,255,255,0.04)',
            color: 'rgba(255,220,150,0.5)', fontFamily: "'Fredoka One', sans-serif",
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
