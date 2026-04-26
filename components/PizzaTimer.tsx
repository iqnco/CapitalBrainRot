'use client';

const TOTAL = 20;
const R = 16;
const CIRC = 2 * Math.PI * R;

export default function PizzaTimer({ timeLeft }: { timeLeft: number }) {
  const pct      = timeLeft / TOTAL;
  const offset   = CIRC * (1 - pct);
  const urgent   = timeLeft <= 5;
  const color    = timeLeft > 10 ? '#008C45' : timeLeft > 5 ? '#d4a017' : '#CE2B37';

  return (
    <div className={`relative flex items-center justify-center ${urgent ? 'timer-urgent' : ''}`}
         style={{ width: 44, height: 44 }}>
      <svg width="44" height="44" viewBox="0 0 44 44" style={{ transform: 'rotate(-90deg)' }}>
        <circle cx="22" cy="22" r={R} fill="none" stroke="#F0E8D8" strokeWidth="3.5" />
        <circle
          cx="22" cy="22" r={R}
          fill="none"
          stroke={color}
          strokeWidth="3.5"
          strokeDasharray={CIRC}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.9s linear, stroke 0.3s ease' }}
        />
      </svg>
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
      }}>
        <span style={{ fontSize: '0.95rem', lineHeight: 1 }}>🍕</span>
        <span style={{
          fontSize: '0.55rem', fontFamily: "'Fredoka One', sans-serif",
          color, lineHeight: 1, marginTop: 1,
          transition: 'color 0.3s ease',
        }}>
          {timeLeft}
        </span>
      </div>
    </div>
  );
}
