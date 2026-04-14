'use client';

interface RankLadderProps {
  score: number;
  total: number;
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

const TOP_PCTS = RANKS.map((_, i) => 3 + ((7 - i) / 7) * 91);

export default function RankLadder({ score, total }: RankLadderProps) {
  const pct         = total > 0 ? score / total : 0;
  const rankIndex   = Math.min(7, Math.floor(pct * 8));
  const currentRank = RANKS[rankIndex];
  const gunTopPct   = 94 - pct * 91;

  return (
    <div
      className="flex-none flex flex-row"
      style={{
        width: '88px',
        background: 'rgba(5,5,10,0.75)',
        borderRight: '1px solid rgba(232,0,26,0.15)',
        flexShrink: 0,
        overflow: 'hidden',
      }}
    >
      {/* ── Left column: rank crest images ── */}
      <div className="flex flex-col items-center" style={{ width: '56px', flexShrink: 0 }}>

        {/* Score */}
        <div className="flex-none pt-2 pb-1 text-center">
          <p className="text-[9px] font-mono" style={{ color: currentRank.color }}>
            {score}/{total}
          </p>
        </div>

        {/* Crest ladder */}
        <div className="flex-1 relative w-full" style={{ minHeight: 0 }}>
          {/* Track */}
          <div className="absolute top-0 bottom-0"
               style={{ left: '50%', width: '1px', transform: 'translateX(-50%)', background: 'rgba(255,255,255,0.05)' }} />
          {/* Progress fill */}
          <div className="absolute bottom-0"
               style={{
                 left: '50%', width: '2px', transform: 'translateX(-50%)',
                 height: `${100 - gunTopPct}%`,
                 background: currentRank.color, opacity: 0.4,
                 transition: 'height 0.6s cubic-bezier(0.34,1.56,0.64,1)',
               }} />

          {RANKS.map((rank, i) => {
            const isActive = rankIndex === i;
            const isPassed = rankIndex > i;
            return (
              <div
                key={rank.id}
                className="absolute flex items-center justify-center"
                style={{
                  top: `${TOP_PCTS[i]}%`,
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  width: '44px', height: '44px',
                  zIndex: isActive ? 2 : 1,
                  opacity: isActive ? 1 : isPassed ? 0.85 : 0.22,
                  filter: isActive
                    ? `drop-shadow(0 0 7px ${rank.glow})`
                    : isPassed ? `drop-shadow(0 0 2px ${rank.glow})`
                    : 'brightness(0.35) saturate(0)',
                  transition: 'filter 0.4s ease, opacity 0.4s ease',
                }}
              >
                <img src={rank.img} alt={rank.id}
                     style={{ width: '42px', height: '42px', objectFit: 'contain' }} />
              </div>
            );
          })}
        </div>

        {/* Rank label */}
        <div className="flex-none pb-2 pt-1">
          <p className="text-[7px] font-mono uppercase tracking-wider text-center"
             style={{ color: currentRank.color }}>
            {currentRank.id.slice(0, 5)}
          </p>
        </div>
      </div>

      {/* ── Thin divider ── */}
      <div style={{ width: '1px', background: 'rgba(232,0,26,0.18)', flexShrink: 0 }} />

      {/* ── Right column: pistol indicator ── */}
      <div className="flex-1 relative" style={{ minWidth: 0 }}>
        <div
          className="absolute z-10"
          style={{
            top: `${gunTopPct}%`,
            left: '50%',
            transform: 'translate(-50%, -50%) rotate(-90deg)',
            transition: 'top 0.6s cubic-bezier(0.34,1.56,0.64,1)',
            filter: `drop-shadow(0 0 6px ${currentRank.glow})`,
          }}
        >
          <img
            src="/pistol.png"
            alt="pistol"
            style={{ width: '28px', height: '28px', objectFit: 'contain', imageRendering: 'pixelated' }}
          />
        </div>
      </div>
    </div>
  );
}
