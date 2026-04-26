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
  const label       = correct ? '✓  BRAVISSIMO!'      : '✗  WRONG!';
  const nextLabel   = isGameOver || isComplete ? 'SEE RESULTS' : 'NEXT QUESTION →';

  const correctAnswerLines = correctAnswer?.split('\n') ?? [];
  const isMultiLine = correctAnswerLines.length > 1;

  return (
    <div className={`border-2 rounded-2xl p-5 animate-slide-up ${borderColor} ${bgColor}`}>
      <p className={`font-bold tracking-wide uppercase text-lg mb-3 ${labelColor}`}
         style={{ fontFamily: "'Fredoka One', sans-serif" }}>
        {label}
      </p>

      {correctAnswer && (
        <div
          className="mb-4 rounded-xl p-3"
          style={correct
            ? { background: 'rgba(34,197,94,0.07)',  border: '1px solid rgba(34,197,94,0.25)'  }
            : { background: 'rgba(0,140,69,0.06)',    border: '1px solid rgba(0,140,69,0.25)'  }
          }
        >
          <p className={`text-xs uppercase tracking-widest mb-1.5 ${correct ? 'text-r6-green' : 'text-r6-orange'}`}>
            {correct ? 'Confirmed Answer' : 'Correct Answer'}
          </p>
          {isMultiLine ? (
            <ul className="space-y-0.5">
              {correctAnswerLines.map((line, i) => (
                <li key={i} className="text-r6-text text-sm font-semibold">{line}</li>
              ))}
            </ul>
          ) : (
            <p className="text-r6-text text-base font-semibold">{correctAnswer}</p>
          )}
        </div>
      )}

      <div className="mb-5">
        <p className="text-r6-orange text-xs uppercase tracking-widest mb-2">Explanation</p>
        <p className="text-r6-text text-base leading-relaxed">{explanation}</p>
      </div>

      <button
        onClick={onContinue}
        className="px-7 py-3 rounded-xl text-sm font-bold tracking-wide transition-all duration-150 hover:scale-[1.02] active:scale-[0.98]"
        style={{ background: '#008C45', color: '#FFFFFF', boxShadow: '0 4px 14px rgba(0,140,69,0.4)',
                 fontFamily: "'Fredoka One', sans-serif", letterSpacing: '0.06em' }}
      >
        {nextLabel}
      </button>
    </div>
  );
}
