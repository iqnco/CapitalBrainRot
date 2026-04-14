'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { MatchReport, AnswerRecord } from '@/lib/types';

const TYPE_LABELS: Record<string, string> = {
  'multiple-choice': 'MC',
  'type-answer':     'TYPE',
  'fill-blank':      'FILL',
  'match-pairs':     'MATCH',
};

function AnswerCard({ record, index }: { record: AnswerRecord; index: number }) {
  const correctAnswerLines = record.correctAnswer.split('\n');
  const isMultiLine = correctAnswerLines.length > 1;

  return (
    <div className="p-4 op-card"
         style={{ borderColor: record.correct ? 'rgba(34,197,94,0.2)' : 'rgba(232,0,26,0.2)' }}>
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

      <p className="text-sm leading-relaxed mb-3" style={{ color: '#e8eaf2' }}>{record.questionText}</p>

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

      {record.explanation && (
        <p className="text-xs leading-relaxed mt-2 pt-2 border-t" style={{ color: '#6b7090', borderColor: '#242432' }}>
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
    <main className="min-h-screen siege-bg pb-16">
      <header className="sticky top-0 z-10 flex items-center gap-4 px-5 h-12 border-b"
              style={{ background: 'rgba(5,5,10,0.95)', borderColor: 'rgba(232,0,26,0.2)' }}>
        <button onClick={() => router.back()}
                className="text-xs font-mono tracking-widest uppercase transition-colors hover:text-white"
                style={{ color: '#6b7090' }}>
          ← BACK
        </button>
        <div className="flex-1 text-center">
          <span className="text-xs font-mono uppercase tracking-[0.3em]"
                style={{ color: 'rgba(232,0,26,0.75)' }}>// Match Report</span>
        </div>
        <button onClick={() => router.push('/history')}
                className="text-xs font-mono tracking-widest uppercase transition-colors hover:text-white"
                style={{ color: '#6b7090' }}>
          HISTORY
        </button>
      </header>

      <div className="mx-auto max-w-2xl px-4 pt-5 space-y-4">
        {/* Summary */}
        <div className="op-card p-5">
          <p className="text-[10px] font-mono uppercase tracking-[0.3em] mb-0.5"
             style={{ color: 'rgba(232,0,26,0.7)' }}>Operation</p>
          <p className="font-bold text-lg uppercase tracking-wide leading-tight mb-0.5"
             style={{ color: '#e8eaf2' }}>{report.subject}</p>
          <p className="text-xs font-mono mb-4" style={{ color: '#6b7090' }}>{date}</p>

          <div className="grid grid-cols-3 gap-2">
            {[
              { label: 'Score',   value: `${report.score}/${report.total}`, color: '#f7941d' },
              { label: 'Correct', value: String(rights.length), color: '#22c55e' },
              { label: 'Wrong',   value: String(wrongs.length), color: '#e8001a' },
            ].map(({ label, value, color }) => (
              <div key={label} className="text-center py-3 op-card">
                <p className="text-[9px] font-mono uppercase tracking-wider mb-1" style={{ color: '#6b7090' }}>{label}</p>
                <p className="font-black text-xl" style={{ color, fontFamily: "'Barlow Condensed', sans-serif" }}>{value}</p>
              </div>
            ))}
          </div>
        </div>

        {wrongs.length > 0 && (
          <section>
            <p className="text-xs font-mono uppercase tracking-widest mb-2"
               style={{ color: '#e8001a' }}>// Missed Objectives ({wrongs.length})</p>
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
               style={{ color: '#22c55e' }}>// Confirmed Kills ({rights.length})</p>
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
            className="w-full siege-btn-primary"
          >
            New Mission
          </button>
          <button onClick={() => router.push('/')} className="w-full siege-btn-ghost">
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
