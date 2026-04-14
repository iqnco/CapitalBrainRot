'use client';

interface RankLadderProps {
  score: number;
  answered: number; // questions answered so far (qIndex)
}

const RANKS = [
  { id: 'copper',   label: 'CU', color: '#a0522d', glow: 'rgba(160,82,45,0.9)'   },
  { id: 'bronze',   label: 'BR', color: '#cd7f32', glow: 'rgba(205,127,50,0.9)'  },
  { id: 'silver',   label: 'SI', color: '#9da8ba', glow: 'rgba(157,168,186,0.9)' },
  { id: 'gold',     label: 'GO', color: '#d4a017', glow: 'rgba(212,160,23,0.9)'  },
  { id: 'platinum', label: 'PL', color: '#00b4cc', glow: 'rgba(0,180,204,0.9)'   },
  { id: 'emerald',  label: 'EM', color: '#00c878', glow: 'rgba(0,200,120,0.9)'   },
  { id: 'diamond',  label: 'DI', color: '#8b7cf7', glow: 'rgba(139,124,247,0.9)' },
  { id: 'champion', label: '★',  color: '#f7941d', glow: 'rgba(247,148,29,1.0)'  },
];

// Top % for each rank badge — Champion near top, Copper near bottom
// Range: 3% (champion) to 94% (copper), evenly spaced
const TOP_PCTS = RANKS.map((_, i) => 3 + ((7 - i) / 7) * 91);

function GunSVG({ color }: { color: string }) {
  return (
    <svg width="28" height="16" viewBox="0 0 28 16" fill="none">
      {/* Stock */}
      <rect x="0" y="5" width="5" height="5" fill={color} />
      {/* Lower stock bevel */}
      <rect x="1" y="9" width="6" height="2" fill={color} />
      {/* Body */}
      <rect x="4" y="3" width="11" height="8" fill={color} />
      {/* Top rail */}
      <rect x="6" y="2" width="8" height="2" fill={color} opacity="0.7" />
      {/* Barrel */}
      <rect x="14" y="5" width="13" height="4" fill={color} />
      {/* Muzzle accent */}
      <rect x="26" y="4" width="2" height="6" fill={color} opacity="0.5" />
      {/* Grip */}
      <rect x="6" y="10" width="5" height="6" fill={color} />
      {/* Trigger */}
      <rect x="9" y="9" width="1" height="3" fill={color} opacity="0.6" />
      {/* Sight */}
      <rect x="13" y="1" width="2" height="2" fill={color} />
    </svg>
  );
}

export default function RankLadder({ score, answered }: RankLadderProps) {
  const accuracy   = answered > 0 ? score / answered : 0;
  const rankIndex  = Math.min(7, Math.floor(accuracy * 8));
  const currentRank = RANKS[rankIndex];

  // Gun top % — 94% at 0% accuracy (copper), 3% at 100% accuracy (champion)
  const gunTopPct = 94 - accuracy * 91;

  return (
    <div
      className="flex-none flex flex-col items-center"
      style={{
        width: '48px',
        background: 'rgba(5,5,10,0.7)',
        borderRight: '1px solid rgba(232,0,26,0.1)',
      }}
    >
      {/* Accuracy % */}
      <div className="flex-none pt-2 pb-1 text-center">
        <p className="text-[8px] font-mono leading-none"
           style={{ color: currentRank.color, letterSpacing: '0.04em' }}>
          {answered > 0 ? Math.round(accuracy * 100) : '--'}%
        </p>
      </div>

      {/* Ladder track */}
      <div className="flex-1 relative w-full overflow-hidden">

        {/* Vertical track line */}
        <div className="absolute top-0 bottom-0"
             style={{ left: '50%', width: '1px', transform: 'translateX(-50%)', background: 'rgba(255,255,255,0.04)' }} />

        {/* Filled track — progress from bottom up */}
        <div
          className="absolute bottom-0"
          style={{
            left: '50%',
            width: '1px',
            transform: 'translateX(-50%)',
            height: `${100 - gunTopPct}%`,
            background: currentRank.color,
            opacity: 0.35,
            transition: 'height 0.6s cubic-bezier(0.34,1.56,0.64,1)',
          }}
        />

        {/* Rank badges */}
        {RANKS.map((rank, i) => {
          const isActive = rankIndex === i;
          const isPassed = rankIndex > i;
          const topPct   = TOP_PCTS[i];

          return (
            <div
              key={rank.id}
              className="absolute flex items-center justify-center"
              style={{
                top: `${topPct}%`,
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: '30px',
                height: '30px',
                zIndex: isActive ? 2 : 1,
              }}
            >
              <svg width="30" height="30" viewBox="0 0 30 30">
                <polygon
                  points="15,2 27,8.5 27,21.5 15,28 3,21.5 3,8.5"
                  fill={isActive ? `${rank.color}28` : isPassed ? `${rank.color}14` : 'rgba(5,5,10,0.9)'}
                  stroke={isActive ? rank.color : isPassed ? `${rank.color}70` : 'rgba(255,255,255,0.07)'}
                  strokeWidth={isActive ? '1.8' : '1'}
                  style={isActive ? { filter: `drop-shadow(0 0 5px ${rank.glow})` } : undefined}
                />
                <text
                  x="15" y="16"
                  textAnchor="middle" dominantBaseline="middle"
                  fontSize={rank.label === '★' ? '13' : '7.5'}
                  fontWeight="900"
                  fontFamily="'Share Tech Mono', monospace"
                  fill={isActive ? rank.color : isPassed ? `${rank.color}90` : 'rgba(255,255,255,0.15)'}
                  style={isActive ? { filter: `drop-shadow(0 0 3px ${rank.glow})` } : undefined}
                >
                  {rank.label}
                </text>
              </svg>
            </div>
          );
        })}

        {/* Gun indicator */}
        <div
          className="absolute z-10"
          style={{
            top: `${gunTopPct}%`,
            left: '50%',
            transform: 'translate(-3px, -8px)',
            transition: 'top 0.6s cubic-bezier(0.34,1.56,0.64,1)',
            filter: `drop-shadow(0 0 5px ${currentRank.glow})`,
          }}
        >
          <GunSVG color={currentRank.color} />
        </div>
      </div>

      {/* Current rank label */}
      <div className="flex-none pb-2 pt-1 text-center">
        <p className="text-[7px] font-mono uppercase tracking-wider leading-none"
           style={{ color: currentRank.color }}>
          {currentRank.id.slice(0, 4)}
        </p>
      </div>
    </div>
  );
}
