'use client';

interface RankLadderProps {
  score: number;
  total: number;
}

const RANKS = [
  { id: 'copper',   label: 'Fresh Brain',   img: '/RankIcons/brain_copper.png',   color: '#a0522d', glow: 'rgba(160,82,45,0.9)'   },
  { id: 'bronze',   label: 'A Bit Rotten', img: '/RankIcons/brain_bronze.png',   color: '#cd7f32', glow: 'rgba(205,127,50,0.9)'  },
  { id: 'silver',   label: 'Dazed',        img: '/RankIcons/brain_silver.png',   color: '#9da8ba', glow: 'rgba(157,168,186,0.9)' },
  { id: 'gold',     label: 'Soggy',        img: '/RankIcons/brain_gold.png',     color: '#d4a017', glow: 'rgba(212,160,23,0.9)'  },
  { id: 'platinum', label: 'Moldy',        img: '/RankIcons/brain_platinum.png', color: '#00b4cc', glow: 'rgba(0,180,204,0.9)'   },
  { id: 'emerald',  label: 'Liquefied',    img: '/RankIcons/brain_emerald.png',  color: '#00c878', glow: 'rgba(0,200,120,0.9)'   },
  { id: 'diamond',  label: 'Totally Fried',img: '/RankIcons/brain_diamond.png',  color: '#8b7cf7', glow: 'rgba(139,124,247,0.9)' },
  { id: 'champion', label: 'Full Brainrot',img: '/RankIcons/brain_champion.png', color: '#008C45', glow: 'rgba(0,140,69,1.0)'    },
];

const TOP_PCTS = RANKS.map((_, i) => 3 + ((7 - i) / 7) * 91);

export default function RankLadder({ score, total }: RankLadderProps) {
  const pct         = total > 0 ? score / total : 0;
  const rankIndex   = Math.min(7, Math.floor(pct * 8));
  const currentRank = RANKS[rankIndex];
  const gunTopPct   = 3 + (1 - pct) * 91;

  return (
    <div
      className="flex-none flex flex-col"
      style={{
        width: '150px',
        background: 'rgba(255,249,240,0.85)',
        flexShrink: 0,
      }}
    >
      <div className="flex-none pt-2 pb-1 text-center px-1">
        <p className="text-[9px] font-bold leading-tight" style={{ color: currentRank.color, fontFamily: "'Fredoka One', sans-serif" }}>
          {currentRank.label}
        </p>
        <p className="text-[8px]" style={{ color: '#7A7A8C', fontFamily: "'Fredoka One', sans-serif" }}>
          {score}/{total}
        </p>
      </div>

      <div className="flex-1 relative w-full" style={{ minHeight: 0 }}>

        <div className="absolute top-0 bottom-0"
             style={{ left: '38px', width: '1px', background: 'rgba(0,0,0,0.08)' }} />

        <div className="absolute bottom-0"
             style={{
               left: '38px', width: '2px',
               height: `${100 - gunTopPct}%`,
               background: currentRank.color, opacity: 0.5,
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
                left: '38px',
                transform: 'translate(-50%, -50%)',
                width: '48px', height: '48px',
                zIndex: isActive ? 2 : 1,
                opacity: isActive ? 1 : isPassed ? 0.85 : 0.2,
                filter: isActive
                  ? `drop-shadow(0 0 7px ${rank.glow})`
                  : isPassed ? `drop-shadow(0 0 2px ${rank.glow})`
                  : 'brightness(0.5) saturate(0)',
                transition: 'filter 0.4s ease, opacity 0.4s ease',
              }}
            >
              <img src={rank.img} alt={rank.id}
                   style={{ width: '46px', height: '46px', objectFit: 'contain' }} />
            </div>
          );
        })}

        <div
          className="absolute z-10"
          style={{
            top: `${gunTopPct}%`,
            left: '62px',
            transform: 'translateY(-50%)',
            transition: 'top 0.6s cubic-bezier(0.34,1.56,0.64,1)',
          }}
        >
          <div style={{
            width: 0, height: 0,
            borderTop: '7px solid transparent',
            borderBottom: '7px solid transparent',
            borderLeft: `10px solid ${currentRank.color}`,
            filter: `drop-shadow(0 0 4px ${currentRank.glow})`,
            transition: 'border-left-color 0.4s ease',
          }} />
        </div>
      </div>

    </div>
  );
}
