interface Props {
  correct: boolean;
  explanation: string;
  correctAnswer?: string;
  onContinue: () => void;
  isGameOver?: boolean;
  isComplete?: boolean;
}

export default function FeedbackOverlay({ correct, explanation, correctAnswer, onContinue, isGameOver, isComplete }: Props) {
  const borderColor = correct ? 'border-r6-green/40' : 'border-r6-red/40';
  const bgColor     = correct ? 'bg-r6-green/5'      : 'bg-r6-red/5';
  const labelColor  = correct ? 'text-r6-green'       : 'text-r6-red';
  const label       = correct ? '✓  TARGET DOWN'       : '✗  OPERATIVE HIT';
  const nextLabel   = isGameOver || isComplete ? 'VIEW DEBRIEF' : 'NEXT OBJECTIVE →';

  // For match-pairs the correctAnswer is newline-separated "Term → Def" pairs
  const correctAnswerLines = correctAnswer?.split('\n') ?? [];
  const isMultiLine = correctAnswerLines.length > 1;

  return (
    <div className={`border rounded-lg p-5 animate-slide-up ${borderColor} ${bgColor}`}>
      <p className={`font-bold tracking-widest uppercase text-sm font-mono mb-3 ${labelColor}`}>
        {label}
      </p>

      {correctAnswer && (
        <div
          className="mb-4 rounded-md p-3"
          style={correct
            ? { background: 'rgba(34,197,94,0.07)',  border: '1px solid rgba(34,197,94,0.25)'  }
            : { background: 'rgba(247,148,29,0.07)', border: '1px solid rgba(247,148,29,0.25)' }
          }
        >
          <p className={`text-xs uppercase tracking-widest font-mono mb-1.5 ${correct ? 'text-r6-green' : 'text-r6-orange'}`}>
            {correct ? 'Confirmed Answer' : 'Correct Answer'}
          </p>
          {isMultiLine ? (
            <ul className="space-y-0.5">
              {correctAnswerLines.map((line, i) => (
                <li key={i} className="text-r6-text text-sm font-semibold font-mono">{line}</li>
              ))}
            </ul>
          ) : (
            <p className="text-r6-text text-base font-semibold">{correctAnswer}</p>
          )}
        </div>
      )}

      <div className="mb-5">
        <p className="text-r6-orange text-xs uppercase tracking-widest font-mono mb-2">Intel</p>
        <p className="text-r6-text text-base leading-relaxed">{explanation}</p>
      </div>

      <button
        onClick={onContinue}
        className="px-7 py-3 rounded-md text-sm font-bold tracking-widest transition-all duration-150 hover:scale-[1.02] active:scale-[0.98]"
        style={{ background: '#f7941d', color: '#07090d', boxShadow: '0 0 12px rgba(247,148,29,0.4)' }}
      >
        {nextLabel}
      </button>
    </div>
  );
}
