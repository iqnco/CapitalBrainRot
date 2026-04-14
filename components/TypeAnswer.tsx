'use client';

import { useState } from 'react';
import { TypeAnswerQuestion } from '@/lib/types';

interface Props {
  question: TypeAnswerQuestion;
  onAnswer: (correct: boolean, userAnswer: string) => void;
  onSkip: () => void;
}

export default function TypeAnswer({ question, onAnswer, onSkip }: Props) {
  const [value, setValue] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

  const handleSubmit = () => {
    if (!value.trim() || submitted) return;
    setSubmitted(true);
    const correct = question.acceptableAnswers.some(
      (a) => a.toLowerCase() === value.trim().toLowerCase()
    );
    setIsCorrect(correct);
    onAnswer(correct, value.trim());
  };

  const borderColor = submitted
    ? isCorrect ? 'border-r6-green' : 'border-r6-red'
    : 'border-r6-border focus-within:border-r6-orange';

  return (
    <div className="space-y-4">
      <div className={`flex gap-3 border-2 rounded-md p-1 pl-4 transition-colors ${borderColor}`}
           style={{ background: '#0f1218' }}>
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
          disabled={submitted}
          placeholder="Type your answer..."
          className="flex-1 bg-transparent text-r6-text text-base font-medium tracking-wide outline-none placeholder:text-r6-muted/60 py-2"
        />
        {!submitted && (
          <button
            onClick={handleSubmit}
            disabled={!value.trim()}
            className="px-5 py-2 rounded text-sm font-bold tracking-widest transition-colors disabled:opacity-40"
            style={{ background: '#f7941d', color: '#07090d' }}
          >
            CONFIRM
          </button>
        )}
      </div>

      {submitted && !isCorrect && (
        <p className="text-r6-muted text-sm font-mono">
          Correct answer: <span className="text-r6-orange font-semibold">{question.correctAnswer}</span>
        </p>
      )}

      {!submitted && (
        <button onClick={onSkip} className="text-r6-muted text-sm hover:text-r6-text transition-colors tracking-widest font-mono uppercase">
          Skip →
        </button>
      )}
    </div>
  );
}
