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

  const handleSelect = (i: number) => {
    if (selected !== null) return;
    setSelected(i);
    onAnswer(i === question.correctIndex, question.options[i]);
  };

  const getClass = (i: number) => {
    if (selected === null) return 'option-btn cursor-pointer';
    if (i === question.correctIndex) return 'option-btn correct';
    if (i === selected) return 'option-btn wrong';
    return 'option-btn dimmed';
  };

  return (
    <div className="space-y-3">
      {question.options.map((opt, i) => (
        <button
          key={i}
          onClick={() => handleSelect(i)}
          disabled={selected !== null}
          className={getClass(i)}
        >
          <span className="shrink-0 w-9 h-9 rounded flex items-center justify-center text-base font-bold font-mono"
                style={{ background: 'rgba(247,148,29,0.12)', color: '#f7941d', border: '1px solid rgba(247,148,29,0.25)' }}>
            {LABELS[i]}
          </span>
          <span className="text-lg leading-snug">{opt}</span>
        </button>
      ))}
    </div>
  );
}
