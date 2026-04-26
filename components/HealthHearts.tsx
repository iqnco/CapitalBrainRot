interface Props {
  current: number;
  max: number;
}

function PizzaHeart({ alive }: { alive: boolean }) {
  return (
    <svg viewBox="0 0 20 20" width="20" height="20" style={{ display: 'block' }}>
      {alive ? (
        <text x="1" y="17" fontSize="16" style={{ filter: 'drop-shadow(0 0 3px rgba(206,43,55,0.7))' }}>🍕</text>
      ) : (
        <text x="1" y="17" fontSize="16" style={{ opacity: 0.2 }}>🍕</text>
      )}
    </svg>
  );
}

export default function HealthHearts({ current, max }: Props) {
  return (
    <div className="flex items-center gap-1">
      <span className="text-r6-muted text-xs uppercase tracking-widest mr-1 hidden sm:block"
            style={{ fontFamily: "'Fredoka One', sans-serif" }}>
        Lives
      </span>
      {Array.from({ length: max }).map((_, i) => (
        <PizzaHeart key={i} alive={i < current} />
      ))}
    </div>
  );
}
