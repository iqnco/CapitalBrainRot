'use client';

import { useState } from 'react';
import { FillBlankQuestion } from '@/lib/types';

interface Props {
  question: FillBlankQuestion;
  onAnswer: (correct: boolean, userAnswer: string) => void;
  onSkip: () => void;
}

export default function FillBlank({ question, onAnswer, onSkip }: Props) {
  const [value, setValue] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

  const parts = question.sentence.split('___');

  const handleSubmit = () => {
    if (!value.trim() || submitted) return;
    setSubmitted(true);
    const correct = value.trim().toLowerCase() === question.correctAnswer.toLowerCase();
    setIsCorrect(correct);
    onAnswer(correct, value.trim());
  };

  const inputColor = submitted
    ? isCorrect ? '#22c55e' : '#ef4444'
    : '#f7941d';

  return (
    <div className="space-y-5">
      {/* Sentence with inline input */}
      <p className="text-r6-text text-lg leading-loose font-medium flex flex-wrap items-baseline gap-x-1.5 gap-y-2">
        {parts[0] && <span>{parts[0].trim()}</span>}
        <span className="inline-flex flex-col items-center">
          <input
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            disabled={submitted}
            placeholder="___"
            className="bg-transparent text-center outline-none font-semibold tracking-wide placeholder:text-r6-muted/60 transition-colors"
            style={{
              borderBottom: `2px solid ${inputColor}`,
              color: inputColor,
              width: `${Math.max(value.length + 4, 10)}ch`,
              minWidth: '80px',
              maxWidth: '220px',
            }}
          />
        </span>
        {parts[1] && <span>{parts[1].trim()}</span>}
      </p>

      {submitted && !isCorrect && (
        <p className="text-r6-muted text-sm font-mono">
          Correct: <span className="text-r6-orange font-semibold">{question.correctAnswer}</span>
        </p>
      )}

      {!submitted && (
        <div className="flex gap-4 items-center">
          <button
            onClick={handleSubmit}
            disabled={!value.trim()}
            className="px-6 py-2.5 rounded text-sm font-bold tracking-widest transition-colors disabled:opacity-40"
            style={{ background: '#f7941d', color: '#07090d' }}
          >
            CONFIRM
          </button>
          <button onClick={onSkip} className="text-r6-muted text-sm hover:text-r6-text transition-colors font-mono uppercase tracking-widest">
            Skip →
          </button>
        </div>
      )}
    </div>
  );
}
