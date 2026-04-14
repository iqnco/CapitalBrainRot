'use client';

import { useState, useEffect } from 'react';
import { MatchPairsQuestion } from '@/lib/types';

interface Props {
  question: MatchPairsQuestion;
  onAnswer: (correct: boolean, userAnswer: string) => void;
}

export default function MatchPairs({ question, onAnswer }: Props) {
  const [shuffled, setShuffled] = useState<string[]>([]);
  const [selectedLeft, setSelectedLeft] = useState<number | null>(null);
  const [matched, setMatched] = useState<Record<number, number>>({});
  const [flashWrong, setFlashWrong] = useState<[number, number] | null>(null);
  const [mistakes, setMistakes] = useState(0);
  const [done, setDone] = useState(false);

  useEffect(() => {
    setShuffled([...question.pairs.map((p) => p.right)].sort(() => Math.random() - 0.5));
  }, [question]);

  const matchedRight = new Set(Object.values(matched));

  const leftClass = (i: number) => {
    if (matched[i] !== undefined)
      return 'option-btn correct cursor-default';
    if (flashWrong?.[0] === i)
      return 'option-btn wrong';
    if (selectedLeft === i)
      return 'option-btn cursor-pointer'
        + ' !border-r6-orange !bg-[rgba(247,148,29,0.08)] !text-r6-orange';
    return 'option-btn cursor-pointer';
  };

  const rightClass = (ri: number) => {
    if (matchedRight.has(ri))
      return 'option-btn correct cursor-default';
    if (flashWrong?.[1] === ri)
      return 'option-btn wrong';
    if (selectedLeft !== null)
      return 'option-btn cursor-pointer';
    return 'option-btn opacity-50 cursor-default';
  };

  const handleLeft = (i: number) => {
    if (done || matched[i] !== undefined) return;
    setSelectedLeft(i === selectedLeft ? null : i);
  };

  const handleRight = (ri: number) => {
    if (done || selectedLeft === null || matchedRight.has(ri)) return;
    const expected = question.pairs[selectedLeft].right;
    if (expected === shuffled[ri]) {
      const newM = { ...matched, [selectedLeft]: ri };
      setMatched(newM);
      setSelectedLeft(null);
      if (Object.keys(newM).length === question.pairs.length) {
        setDone(true);
        onAnswer(mistakes === 0, mistakes === 0 ? 'All pairs matched' : `Completed with ${mistakes} mistake(s)`);
      }
    } else {
      const m = mistakes + 1;
      setMistakes(m);
      setFlashWrong([selectedLeft, ri]);
      setTimeout(() => { setFlashWrong(null); setSelectedLeft(null); }, 700);
      if (m >= question.pairs.length) {
        setTimeout(() => { setDone(true); onAnswer(false, `Too many mistakes (${m})`); }, 900);
      }
    }
  };

  return (
    <div className="space-y-3">
      <p className="text-r6-muted text-sm tracking-wide">{question.instruction}</p>
      {selectedLeft === null && !done && (
        <p className="text-r6-muted/60 text-xs font-mono">← Select a term on the left to begin</p>
      )}
      {mistakes > 0 && (
        <p className="text-r6-red text-xs font-mono uppercase tracking-widest">Errors: {mistakes}</p>
      )}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          {question.pairs.map((pair, i) => (
            <button key={i} onClick={() => handleLeft(i)} className={leftClass(i)}>
              <span className="text-sm">{pair.left}</span>
            </button>
          ))}
        </div>
        <div className="space-y-2">
          {shuffled.map((item, ri) => (
            <button key={ri} onClick={() => handleRight(ri)} className={rightClass(ri)}>
              <span className="text-sm">{item}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
