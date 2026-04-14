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

function GunImg({ glow }: { glow: string }) {
  return (
    <img
      src="/ak12.svg"
      alt="AK-12"
      style={{
        width: '52px',
        height: 'auto',
        imageRendering: 'pixelated',
        filter: `drop-shadow(0 0 4px ${glow})`,
      }}
    />
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

        {/* AK-12 indicator — flush to right edge, barrel points into content */}
        <div
          className="absolute z-10"
          style={{
            top: `${gunTopPct}%`,
            right: '-4px',
            transform: 'translateY(-10px)',
            transition: 'top 0.6s cubic-bezier(0.34,1.56,0.64,1)',
          }}
        >
          <GunImg glow={currentRank.glow} />
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
