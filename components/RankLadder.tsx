'use client';

interface RankLadderProps {
  score: number;
  total: number; // total questions in the set
}

const RANKS = [
  { id: 'copper',   img: '/RankIcons/Copper1.png',  color: '#a0522d', glow: 'rgba(160,82,45,0.9)'   },
  { id: 'bronze',   img: '/RankIcons/Bronze1.png',  color: '#cd7f32', glow: 'rgba(205,127,50,0.9)'  },
  { id: 'silver',   img: '/RankIcons/Silver1.png',  color: '#9da8ba', glow: 'rgba(157,168,186,0.9)' },
  { id: 'gold',     img: '/RankIcons/Gold1.png',    color: '#d4a017', glow: 'rgba(212,160,23,0.9)'  },
  { id: 'platinum', img: '/RankIcons/Plat1.png',    color: '#00b4cc', glow: 'rgba(0,180,204,0.9)'   },
  { id: 'emerald',  img: '/RankIcons/Emerald1.png', color: '#00c878', glow: 'rgba(0,200,120,0.9)'   },
  { id: 'diamond',  img: '/RankIcons/Diamons1.png', color: '#8b7cf7', glow: 'rgba(139,124,247,0.9)' },
  { id: 'champion', img: '/RankIcons/Champ1.png',   color: '#f7941d', glow: 'rgba(247,148,29,1.0)'  },
];

// Top % for each badge — Champion at 3%, Copper at 94%
const TOP_PCTS = RANKS.map((_, i) => 3 + ((7 - i) / 7) * 91);

function GunSVG({ color }: { color: string }) {
  return (
    <svg width="32" height="18" viewBox="0 0 32 18" fill="none">
      <rect x="0"  y="6"  width="6"  height="6"  fill={color} />
      <rect x="1"  y="11" width="7"  height="2"  fill={color} />
      <rect x="5"  y="4"  width="12" height="9"  fill={color} />
      <rect x="7"  y="2"  width="9"  height="3"  fill={color} opacity="0.7" />
      <rect x="16" y="6"  width="15" height="5"  fill={color} />
      <rect x="29" y="5"  width="3"  height="7"  fill={color} opacity="0.5" />
      <rect x="7"  y="12" width="6"  height="6"  fill={color} />
      <rect x="11" y="10" width="2"  height="4"  fill={color} opacity="0.6" />
      <rect x="15" y="1"  width="3"  height="3"  fill={color} />
    </svg>
  );
}

export default function RankLadder({ score, total }: RankLadderProps) {
  // Rank is based on score / total — so 1/25 = 4%, NOT 100%
  const pct        = total > 0 ? score / total : 0;
  const rankIndex  = Math.min(7, Math.floor(pct * 8));
  const currentRank = RANKS[rankIndex];

  // Gun top %: 94% at 0 (Copper bottom), 3% at 1.0 (Champion top)
  const gunTopPct = 94 - pct * 91;

  return (
    <div
      className="flex-none flex flex-col items-center"
      style={{
        width: '72px',
        background: 'rgba(5,5,10,0.75)',
        borderRight: '1px solid rgba(232,0,26,0.12)',
        flexShrink: 0,
      }}
    >
      {/* Score fraction */}
      <div className="flex-none pt-2 pb-1 text-center">
        <p className="text-[9px] font-mono leading-none"
           style={{ color: currentRank.color, letterSpacing: '0.04em' }}>
          {score}/{total}
        </p>
      </div>

      {/* Ladder track */}
      <div className="flex-1 relative w-full" style={{ minHeight: 0 }}>

        {/* Track line */}
        <div className="absolute top-0 bottom-0"
             style={{ left: '50%', width: '1px', transform: 'translateX(-50%)', background: 'rgba(255,255,255,0.05)' }} />

        {/* Filled progress */}
        <div
          className="absolute bottom-0"
          style={{
            left: '50%',
            width: '2px',
            transform: 'translateX(-50%)',
            height: `${(1 - pct) < 0.97 ? (100 - gunTopPct) : 0}%`,
            background: currentRank.color,
            opacity: 0.45,
            transition: 'height 0.6s cubic-bezier(0.34,1.56,0.64,1)',
          }}
        />

        {/* Rank badge images */}
        {RANKS.map((rank, i) => {
          const isActive = rankIndex === i;
          const isPassed = rankIndex > i;
          const topPct   = TOP_PCTS[i];

          return (
            <div
              key={rank.id}
              className="absolute"
              style={{
                top: `${topPct}%`,
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: '48px',
                height: '48px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: isActive ? 2 : 1,
                transition: 'filter 0.4s ease, opacity 0.4s ease',
                opacity: isActive ? 1 : isPassed ? 0.85 : 0.22,
                filter: isActive
                  ? `drop-shadow(0 0 7px ${rank.glow})`
                  : isPassed
                  ? `drop-shadow(0 0 2px ${rank.glow})`
                  : 'brightness(0.35) saturate(0)',
              }}
            >
              <img
                src={rank.img}
                alt={rank.id}
                style={{ width: '44px', height: '44px', objectFit: 'contain' }}
              />
            </div>
          );
        })}

        {/* Gun indicator */}
        <div
          className="absolute z-10"
          style={{
            top: `${gunTopPct}%`,
            left: '50%',
            transform: 'translate(-2px, -9px)',
            transition: 'top 0.6s cubic-bezier(0.34,1.56,0.64,1)',
            filter: `drop-shadow(0 0 5px ${currentRank.glow})`,
          }}
        >
          <GunSVG color={currentRank.color} />
        </div>
      </div>

      {/* Rank label */}
      <div className="flex-none pb-2 pt-1 text-center">
        <p className="text-[8px] font-mono uppercase tracking-wider leading-none"
           style={{ color: currentRank.color }}>
          {currentRank.id.slice(0, 5)}
        </p>
      </div>
    </div>
  );
}
