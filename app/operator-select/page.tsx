'use client';

import { useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

interface Operator {
  id: string;
  name: string;
  role: 'ATTACKER' | 'DEFENDER';
  ctu: string;
}

// Sprites that face left and need mirroring so they look toward the enemy (right side)
const MIRROR_AS_PLAYER = new Set(['tachanka', 'thunderbird']);

const OPERATORS: Operator[] = [
  { id: 'ash',         name: 'ASH',         role: 'ATTACKER', ctu: 'FBI SWAT'   },
  { id: 'blitz',       name: 'BLITZ',       role: 'ATTACKER', ctu: 'GSG-9'      },
  { id: 'deimos',      name: 'DEIMOS',      role: 'ATTACKER', ctu: 'NIGHTHAVEN' },
  { id: 'caveira',     name: 'CAVEIRA',     role: 'DEFENDER', ctu: 'BOPE'       },
  { id: 'doc',         name: 'DOC',         role: 'DEFENDER', ctu: 'GIGN'       },
  { id: 'mozzie',      name: 'MOZZIE',      role: 'DEFENDER', ctu: 'SASR'       },
  { id: 'tachanka',    name: 'TACHANKA',    role: 'DEFENDER', ctu: 'SPETSNAZ'   },
  { id: 'thunderbird', name: 'THUNDERBIRD', role: 'DEFENDER', ctu: 'STAR-NET'   },
  { id: 'warden',      name: 'WARDEN',      role: 'DEFENDER', ctu: 'SECRET SVC' },
];

type Filter = 'ALL' | 'ATTACKER' | 'DEFENDER';

function OperatorCard({ op, selected, onSelect }: {
  op: Operator;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      onClick={onSelect}
      className="relative flex flex-col items-stretch transition-all duration-150 hover:scale-[1.04] active:scale-[0.96]"
      style={{
        background: selected ? 'rgba(247,148,29,0.07)' : 'rgba(13,13,20,0.85)',
        border: `1px solid ${selected ? '#f7941d' : '#242432'}`,
        boxShadow: selected ? '0 0 22px rgba(247,148,29,0.3)' : 'none',
        clipPath: 'polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 10px 100%, 0 calc(100% - 10px))',
        overflow: 'hidden',
      }}
    >
      {/* Role badge */}
      <div className="absolute top-2 left-2 z-10">
        <span
          className="text-[8px] font-mono uppercase tracking-widest px-1.5 py-0.5"
          style={{
            background: op.role === 'ATTACKER' ? 'rgba(247,148,29,0.18)' : 'rgba(34,197,94,0.15)',
            color: op.role === 'ATTACKER' ? '#f7941d' : '#22c55e',
            border: `1px solid ${op.role === 'ATTACKER' ? 'rgba(247,148,29,0.4)' : 'rgba(34,197,94,0.35)'}`,
          }}
        >
          {op.role === 'ATTACKER' ? 'ATK' : 'DEF'}
        </span>
      </div>

      {/* Chibi image area */}
      <div
        className="relative w-full flex items-end justify-center"
        style={{
          height: '130px',
          background: selected
            ? 'radial-gradient(ellipse at 50% 80%, rgba(247,148,29,0.1) 0%, transparent 65%)'
            : 'radial-gradient(ellipse at 50% 80%, rgba(20,20,30,0.5) 0%, transparent 65%)',
        }}
      >
        <img
          src={`/chibis/${op.id}.png`}
          alt={op.name}
          style={{
            height: '120px',
            width: 'auto',
            imageRendering: 'pixelated',
            objectFit: 'contain',
            transition: 'filter 0.15s',
            filter: selected ? 'drop-shadow(0 0 8px rgba(247,148,29,0.5))' : 'none',
            transform: MIRROR_AS_PLAYER.has(op.id) ? 'scaleX(-1)' : undefined,
          }}
          onError={(e) => { (e.currentTarget as HTMLImageElement).style.opacity = '0.2'; }}
        />
      </div>

      {/* Info strip */}
      <div
        className="text-center py-2 px-1"
        style={{
          background: 'rgba(5,5,10,0.9)',
          borderTop: `1px solid ${selected ? 'rgba(247,148,29,0.3)' : 'rgba(232,0,26,0.12)'}`,
        }}
      >
        <p
          className="text-xs font-bold uppercase tracking-wide leading-none mb-0.5"
          style={{ color: selected ? '#f7941d' : '#e8eaf2' }}
        >
          {op.name}
        </p>
        <p className="text-[8px] font-mono uppercase tracking-widest leading-none" style={{ color: '#6b7090' }}>
          {op.ctu}
        </p>
      </div>

      {/* Selected corner ticks */}
      {selected && (
        <>
          <span className="absolute top-1.5 left-1.5 w-3 h-3 border-t-2 border-l-2" style={{ borderColor: '#f7941d' }} />
          <span className="absolute bottom-1.5 right-1.5 w-3 h-3 border-b-2 border-r-2" style={{ borderColor: '#f7941d' }} />
        </>
      )}
    </button>
  );
}

function OperatorSelectContent() {
  const params  = useSearchParams();
  const router  = useRouter();
  const subject = params.get('subject') ?? '';

  const [selected, setSelected] = useState<string | null>(null);
  const [filter, setFilter]     = useState<Filter>('ALL');

  const visible = filter === 'ALL' ? OPERATORS : OPERATORS.filter(op => op.role === filter);
  const chosenOp = OPERATORS.find(op => op.id === selected) ?? null;

  const handleConfirm = () => {
    if (!selected) return;
    const enemies  = OPERATORS.filter(op => op.id !== selected);
    const shuffled = [...enemies].sort(() => Math.random() - 0.5);
    const questions: unknown[] = JSON.parse(localStorage.getItem('rts-questions') ?? '[]');
    const enemyIds = Array.from({ length: questions.length }, (_: unknown, i: number) =>
      shuffled[i % shuffled.length].id
    );
    localStorage.setItem('rts-player-operator', selected);
    localStorage.setItem('rts-operator-ids',    JSON.stringify(enemyIds));
    router.push(`/quiz?subject=${encodeURIComponent(subject)}`);
  };

  return (
    <main className="min-h-screen siege-bg flex flex-col">

      {/* Header */}
      <header
        className="flex-none flex items-center gap-4 px-5 h-12 border-b"
        style={{ background: 'rgba(5,5,10,0.95)', borderColor: 'rgba(232,0,26,0.2)' }}
      >
        <button
          onClick={() => router.back()}
          className="text-xs font-mono tracking-widest uppercase transition-colors hover:text-white"
          style={{ color: '#6b7090' }}
        >
          ← BACK
        </button>
        <div className="flex-1 text-center">
          <p className="text-xs font-mono uppercase tracking-[0.3em]" style={{ color: 'rgba(232,0,26,0.75)' }}>
            // Operator Selection
          </p>
        </div>
        <p className="text-xs font-mono uppercase tracking-widest truncate max-w-[130px]" style={{ color: '#6b7090' }}>
          {subject}
        </p>
      </header>

      <div className="flex-1 flex flex-col items-center px-4 py-6 max-w-2xl mx-auto w-full gap-5">

        {/* Title */}
        <div className="text-center">
          <h2
            className="font-black uppercase leading-none text-glow-white"
            style={{
              fontFamily: "'Barlow Condensed', sans-serif",
              fontSize: 'clamp(1.8rem, 6vw, 2.8rem)',
              letterSpacing: '0.1em',
              color: '#ffffff',
            }}
          >
            SELECT OPERATOR
          </h2>
          <div className="siege-divider my-2 mx-auto" style={{ width: '50%' }} />
          <p className="text-xs font-mono uppercase tracking-[0.35em]" style={{ color: '#6b7090' }}>
            Choose who you deploy as
          </p>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2">
          {(['ALL', 'ATTACKER', 'DEFENDER'] as Filter[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className="px-5 py-2 text-xs font-bold uppercase tracking-[0.2em] transition-all duration-150"
              style={{
                background: filter === f
                  ? (f === 'ATTACKER' ? 'rgba(247,148,29,0.15)' : f === 'DEFENDER' ? 'rgba(34,197,94,0.12)' : 'rgba(232,0,26,0.12)')
                  : 'rgba(13,13,20,0.8)',
                border: `1px solid ${filter === f
                  ? (f === 'ATTACKER' ? '#f7941d' : f === 'DEFENDER' ? '#22c55e' : '#e8001a')
                  : '#242432'}`,
                color: filter === f
                  ? (f === 'ATTACKER' ? '#f7941d' : f === 'DEFENDER' ? '#22c55e' : '#e8001a')
                  : '#6b7090',
                clipPath: 'polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 8px 100%, 0 calc(100% - 8px))',
              }}
            >
              {f === 'ATTACKER' ? '⚔ ATTACKER' : f === 'DEFENDER' ? '🛡 DEFENDER' : 'ALL OPS'}
            </button>
          ))}
        </div>

        {/* Operator grid */}
        <div
          className="w-full grid gap-3"
          style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))' }}
        >
          {visible.map((op) => (
            <OperatorCard
              key={op.id}
              op={op}
              selected={selected === op.id}
              onSelect={() => setSelected(op.id)}
            />
          ))}
        </div>

        {/* Selection indicator */}
        {chosenOp ? (
          <div
            className="w-full flex items-center gap-4 px-5 py-3"
            style={{
              background: 'rgba(247,148,29,0.07)',
              border: '1px solid rgba(247,148,29,0.35)',
              clipPath: 'polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 10px 100%, 0 calc(100% - 10px))',
            }}
          >
            <img
              src={`/chibis/${chosenOp.id}.png`}
              alt={chosenOp.name}
              style={{
                height: '48px', width: 'auto', imageRendering: 'pixelated',
                transform: MIRROR_AS_PLAYER.has(chosenOp.id) ? 'scaleX(-1)' : undefined,
              }}
            />
            <div>
              <p className="text-xs font-mono uppercase tracking-widest mb-0.5" style={{ color: '#6b7090' }}>
                Deploying as
              </p>
              <p
                className="font-black uppercase tracking-wide"
                style={{ color: '#f7941d', fontFamily: "'Barlow Condensed', sans-serif", fontSize: '1.2rem' }}
              >
                {chosenOp.name}
              </p>
              <p className="text-[9px] font-mono uppercase tracking-widest" style={{ color: '#6b7090' }}>
                {chosenOp.role} · {chosenOp.ctu}
              </p>
            </div>
            <span className="ml-auto text-xs font-mono tracking-widest animate-blink" style={{ color: '#f7941d' }}>
              ▶ READY
            </span>
          </div>
        ) : (
          <p className="text-xs font-mono uppercase tracking-[0.35em]" style={{ color: '#3a3a50' }}>
            No operator selected
          </p>
        )}

        {/* Confirm */}
        <button
          onClick={handleConfirm}
          disabled={!selected}
          className="siege-btn-primary"
          style={{ minWidth: '240px', fontSize: '1.05rem' }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style={{ opacity: 0.85 }}>
            <polygon points="5,3 19,12 5,21" />
          </svg>
          CONFIRM &amp; DEPLOY
        </button>

      </div>
    </main>
  );
}

export default function OperatorSelectPage() {
  return <Suspense><OperatorSelectContent /></Suspense>;
}
