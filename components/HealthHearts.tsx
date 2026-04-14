interface Props {
  current: number;
  max: number;
}

// Simple operator silhouette: head + shoulders
function SquadIcon({ alive }: { alive: boolean }) {
  return (
    <svg viewBox="0 0 20 22" width="14" height="16" style={{ display: 'block' }}>
      {alive ? (
        <>
          {/* Head */}
          <circle cx="10" cy="5" r="4" fill="#f7941d"
            style={{ filter: 'drop-shadow(0 0 4px rgba(247,148,29,0.75))' }} />
          {/* Body / shoulders */}
          <path d="M3 22 C3 15 5 13 10 13 C15 13 17 15 17 22Z" fill="#f7941d"
            style={{ filter: 'drop-shadow(0 0 4px rgba(247,148,29,0.75))' }} />
        </>
      ) : (
        <>
          {/* KIA — dark outline only */}
          <circle cx="10" cy="5" r="4" fill="none" stroke="#2a2a40" strokeWidth="1.5" />
          <path d="M3 22 C3 15 5 13 10 13 C15 13 17 15 17 22Z" fill="none" stroke="#2a2a40" strokeWidth="1.5" />
          {/* X over head */}
          <line x1="7.5" y1="2.5" x2="12.5" y2="7.5" stroke="#3a1a1a" strokeWidth="1.2" />
          <line x1="12.5" y1="2.5" x2="7.5" y2="7.5" stroke="#3a1a1a" strokeWidth="1.2" />
        </>
      )}
    </svg>
  );
}

export default function HealthHearts({ current, max }: Props) {
  return (
    <div className="flex items-center gap-1">
      <span className="text-r6-muted font-mono text-xs uppercase tracking-widest mr-1 hidden sm:block">
        Squad
      </span>
      {Array.from({ length: max }).map((_, i) => (
        <SquadIcon key={i} alive={i < current} />
      ))}
    </div>
  );
}
