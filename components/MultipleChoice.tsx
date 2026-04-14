'use client';

import { useState } from 'react';
import { MultipleChoiceQuestion } from '@/lib/types';

interface Props {
  question: MultipleChoiceQuestion;
  onAnswer: (correct: boolean, userAnswer: string) => void;
}

const LABELS = ['A', 'B', 'C', 'D', 'E'];

export default function MultipleChoice({ question, onAnswer }: Props) {
  const [selected, setSelected] = useState<number | null>(null);

  // i === 4 is the blank skip ONLY when the question has exactly 4 real options
  const handleSelect = (i: number) => {
    if (selected !== null) return;
    setSelected(i);
    if (i === 4 && question.options.length === 4) {
      onAnswer(false, '(skipped)');
    } else {
      onAnswer(i === question.correctIndex, question.options[i]);
    }
  };

  const getClass = (i: number) => {
    if (selected === null) return 'option-btn cursor-pointer';
    if (i === 4) return selected === 4 ? 'option-btn wrong' : 'option-btn dimmed';
    if (i === question.correctIndex) return 'option-btn correct';
    if (i === selected) return 'option-btn wrong';
    return 'option-btn dimmed';
  };

  return (
    <div className="space-y-2.5">
      {question.options.map((opt, i) => (
        <button
          key={i}
          onClick={() => handleSelect(i)}
          disabled={selected !== null}
          className={getClass(i)}
        >
          <span className="shrink-0 w-7 h-7 rounded flex items-center justify-center text-sm font-bold font-mono"
                style={{ background: 'rgba(247,148,29,0.12)', color: '#f7941d', border: '1px solid rgba(247,148,29,0.25)' }}>
            {LABELS[i]}
          </span>
          <span className="text-base leading-snug">{opt}</span>
        </button>
      ))}

      {/* Option E — blank skip (only when question has 4 real options) */}
      {question.options.length === 4 && (
        <button
          onClick={() => handleSelect(4)}
          disabled={selected !== null}
          className={getClass(4)}
          style={{ opacity: selected !== null && selected !== 4 ? 0.2 : undefined }}
        >
          <span className="shrink-0 w-7 h-7 rounded flex items-center justify-center text-sm font-bold font-mono"
                style={{ background: 'rgba(247,148,29,0.12)', color: '#f7941d', border: '1px solid rgba(247,148,29,0.25)' }}>
            E
          </span>
          <span className="text-base leading-snug" style={{ color: '#3a3a55' }}>—</span>
        </button>
      )}
    </div>
  );
}
