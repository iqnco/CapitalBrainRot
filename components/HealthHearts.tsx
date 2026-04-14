interface Props {
  current: number;
  max: number;
}

export default function HealthHearts({ current, max }: Props) {
  return (
    <div className="flex items-center gap-1">
      <span className="text-r6-muted font-mono text-xs uppercase tracking-widest mr-1 hidden sm:block">
        Squad
      </span>
      {Array.from({ length: max }).map((_, i) => (
        <svg
          key={i}
          viewBox="0 0 20 18"
          width="16"
          height="15"
          style={{ display: 'block' }}
        >
          {i < current ? (
            <>
              {/* filled — orange with glow */}
              <path
                d="M10 16 C10 16 1 10 1 5 C1 2.2 3.2 1 5.5 1 C7.5 1 9 2.5 10 3.8 C11 2.5 12.5 1 14.5 1 C16.8 1 19 2.2 19 5 C19 10 10 16 10 16Z"
                fill="#f7941d"
                style={{ filter: 'drop-shadow(0 0 4px rgba(247,148,29,0.8))' }}
              />
              {/* shine */}
              <path d="M5.5 3 C4.5 3 3.5 3.8 3.5 5" stroke="rgba(255,200,130,0.6)" strokeWidth="1.2" strokeLinecap="round" fill="none"/>
            </>
          ) : (
            /* empty */
            <path
              d="M10 16 C10 16 1 10 1 5 C1 2.2 3.2 1 5.5 1 C7.5 1 9 2.5 10 3.8 C11 2.5 12.5 1 14.5 1 C16.8 1 19 2.2 19 5 C19 10 10 16 10 16Z"
              fill="none"
              stroke="#1e2738"
              strokeWidth="1.5"
            />
          )}
        </svg>
      ))}
    </div>
  );
}
