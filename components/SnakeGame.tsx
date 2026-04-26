'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

const COLS    = 12;
const ROWS    = 12;
const CELL    = 30;
const W       = COLS * CELL;
const H       = ROWS * CELL;
const TICK_MS = 160; // logical step interval

type Dir = 'U' | 'D' | 'L' | 'R';
type Pt  = { x: number; y: number };

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

function rand(max: number) { return Math.floor(Math.random() * max); }
function newFood(snake: Pt[]): Pt {
  let f: Pt;
  do { f = { x: rand(COLS), y: rand(ROWS) }; }
  while (snake.some(s => s.x === f.x && s.y === f.y));
  return f;
}

const INIT_SNAKE: Pt[] = [{ x: 6, y: 6 }, { x: 5, y: 6 }, { x: 4, y: 6 }];
const INIT_DIR: Dir = 'R';

export default function SnakeGame() {
  const [open, setOpen]         = useState(false);
  const [score, setScore]       = useState(0);
  const [dead, setDead]         = useState(false);
  const [started, setStarted]   = useState(false);
  const [highScore, setHighScore] = useState(0);
  const [newBest, setNewBest]   = useState(false);
  const userIdRef               = useRef<string | null>(null);

  const canvasRef       = useRef<HTMLCanvasElement>(null);
  const currSnakeRef    = useRef<Pt[]>(INIT_SNAKE.map(p => ({...p})));
  const prevSnakeRef    = useRef<Pt[]>(INIT_SNAKE.map(p => ({...p})));
  const foodRef         = useRef<Pt>(newFood(INIT_SNAKE));
  const dirRef          = useRef<Dir>(INIT_DIR);
  const nextDirRef      = useRef<Dir>(INIT_DIR);
  const scoreRef        = useRef(0);
  const deadRef         = useRef(false);
  const startedRef      = useRef(false);
  const tickRef         = useRef<ReturnType<typeof setInterval> | null>(null);
  const rafRef          = useRef<number | null>(null);
  const lastTickTimeRef = useRef<number>(0);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // interpolation factor 0→1 between last tick and next tick
    const t = startedRef.current && !deadRef.current
      ? Math.min(1, (performance.now() - lastTickTimeRef.current) / TICK_MS)
      : 1;

    ctx.fillStyle = '#FFF9F0';
    ctx.fillRect(0, 0, W, H);

    // subtle grid lines
    ctx.strokeStyle = 'rgba(224,204,176,0.4)';
    ctx.lineWidth = 0.5;
    for (let x = 0; x <= COLS; x++) {
      ctx.beginPath(); ctx.moveTo(x * CELL, 0); ctx.lineTo(x * CELL, H); ctx.stroke();
    }
    for (let y = 0; y <= ROWS; y++) {
      ctx.beginPath(); ctx.moveTo(0, y * CELL); ctx.lineTo(W, y * CELL); ctx.stroke();
    }

    // food
    ctx.font = `${CELL - 2}px serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const f = foodRef.current;
    ctx.fillText('🍕', f.x * CELL + CELL / 2, f.y * CELL + CELL / 2);

    // snake — interpolated
    const curr = currSnakeRef.current;
    const prev = prevSnakeRef.current;

    curr.forEach((seg, i) => {
      const p   = prev[i] ?? seg;
      const px  = lerp(p.x, seg.x, t) * CELL;
      const py  = lerp(p.y, seg.y, t) * CELL;
      const isHead = i === 0;
      const alpha  = Math.max(0.25, 0.92 - i * 0.06);

      ctx.fillStyle = isHead ? '#008C45' : `rgba(0,140,69,${alpha})`;
      const pad = isHead ? 1 : 2;
      ctx.beginPath();
      (ctx as CanvasRenderingContext2D & { roundRect: Function }).roundRect(
        px + pad, py + pad, CELL - pad * 2, CELL - pad * 2, isHead ? 5 : 3
      );
      ctx.fill();

      if (isHead) {
        const ex = px + CELL / 2;
        const ey = py + CELL / 2;
        ctx.fillStyle = '#fff';
        ctx.beginPath(); ctx.arc(ex - 3, ey - 2, 2, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(ex + 3, ey - 2, 2, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#1A1A2E';
        ctx.beginPath(); ctx.arc(ex - 3, ey - 2, 1, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(ex + 3, ey - 2, 1, 0, Math.PI * 2); ctx.fill();
      }
    });
  }, []);

  // rAF loop — runs every frame while open
  const animLoop = useCallback(() => {
    draw();
    rafRef.current = requestAnimationFrame(animLoop);
  }, [draw]);

  const stopAnim = useCallback(() => {
    if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null; }
  }, []);

  // fetch high score on mount
  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session?.user) return;
      userIdRef.current = session.user.id;
      const { data } = await supabase
        .from('profiles')
        .select('snake_highscore')
        .eq('id', session.user.id)
        .single();
      if (data?.snake_highscore) setHighScore(data.snake_highscore);
    });
  }, []);

  const saveHighScore = useCallback(async (newScore: number) => {
    if (newScore <= highScore) return;
    setHighScore(newScore);
    setNewBest(true);
    if (!userIdRef.current) return;
    await supabase.from('profiles')
      .update({ snake_highscore: newScore })
      .eq('id', userIdRef.current);
  }, [highScore]);

  const reset = useCallback(() => {
    currSnakeRef.current  = INIT_SNAKE.map(p => ({...p}));
    prevSnakeRef.current  = INIT_SNAKE.map(p => ({...p}));
    foodRef.current       = newFood(INIT_SNAKE);
    dirRef.current        = INIT_DIR;
    nextDirRef.current    = INIT_DIR;
    scoreRef.current      = 0;
    deadRef.current       = false;
    startedRef.current    = false;
    setScore(0); setDead(false); setStarted(false); setNewBest(false);
  }, []);

  const tick = useCallback(() => {
    if (deadRef.current || !startedRef.current) return;
    dirRef.current = nextDirRef.current;
    const snake = currSnakeRef.current;
    const head  = snake[0];
    const dir   = dirRef.current;
    const next: Pt = {
      x: head.x + (dir === 'R' ? 1 : dir === 'L' ? -1 : 0),
      y: head.y + (dir === 'D' ? 1 : dir === 'U' ? -1 : 0),
    };
    if (next.x < 0 || next.x >= COLS || next.y < 0 || next.y >= ROWS ||
        snake.some(s => s.x === next.x && s.y === next.y)) {
      deadRef.current = true; setDead(true);
      saveHighScore(scoreRef.current);
      return;
    }
    const ate = next.x === foodRef.current.x && next.y === foodRef.current.y;
    prevSnakeRef.current = snake.map(p => ({...p}));
    const newSnake = [next, ...snake];
    if (!ate) newSnake.pop();
    else { foodRef.current = newFood(newSnake); scoreRef.current += 1; setScore(s => s + 1); }
    currSnakeRef.current  = newSnake;
    lastTickTimeRef.current = performance.now();
  }, [saveHighScore]);

  // start/stop tick interval
  useEffect(() => {
    if (!open || !started || dead) {
      if (tickRef.current) { clearInterval(tickRef.current); tickRef.current = null; }
      return;
    }
    lastTickTimeRef.current = performance.now();
    tickRef.current = setInterval(tick, TICK_MS);
    return () => { if (tickRef.current) clearInterval(tickRef.current); };
  }, [open, started, dead, tick]);

  // start/stop rAF loop when overlay opens/closes
  useEffect(() => {
    if (open) { rafRef.current = requestAnimationFrame(animLoop); }
    else { stopAnim(); }
    return () => stopAnim();
  }, [open, animLoop, stopAnim]);

  // lock body scroll when open
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  // keyboard
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      const map: Record<string, Dir> = {
        ArrowUp: 'U', ArrowDown: 'D', ArrowLeft: 'L', ArrowRight: 'R',
        w: 'U', s: 'D', a: 'L', d: 'R',
      };
      const newDir = map[e.key];
      if (!newDir) return;
      e.preventDefault();
      const cur = dirRef.current;
      if ((newDir === 'U' && cur === 'D') || (newDir === 'D' && cur === 'U')) return;
      if ((newDir === 'L' && cur === 'R') || (newDir === 'R' && cur === 'L')) return;
      nextDirRef.current = newDir;
      if (!startedRef.current && !deadRef.current) {
        startedRef.current = true;
        lastTickTimeRef.current = performance.now();
        setStarted(true);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  const arrowBtn = (label: string, dir: Dir) => {
    const trigger = () => {
      const cur = dirRef.current;
      if ((dir === 'U' && cur === 'D') || (dir === 'D' && cur === 'U')) return;
      if ((dir === 'L' && cur === 'R') || (dir === 'R' && cur === 'L')) return;
      nextDirRef.current = dir;
      if (!startedRef.current && !deadRef.current) {
        startedRef.current = true;
        lastTickTimeRef.current = performance.now();
        setStarted(true);
      }
    };
    return (
      <button
        onPointerDown={e => { e.preventDefault(); trigger(); }}
        className="w-10 h-10 rounded-xl flex items-center justify-center text-base select-none active:scale-95"
        style={{ background: 'rgba(0,140,69,0.12)', border: '1.5px solid #008C45', color: '#008C45',
                 fontFamily: "'Fredoka One', sans-serif", touchAction: 'none' }}
      >
        {label}
      </button>
    );
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="px-4 py-1.5 rounded-xl text-xs uppercase tracking-widest transition-all hover:scale-105 active:scale-95"
        style={{
          background: 'rgba(0,140,69,0.08)',
          border: '1.5px solid rgba(0,140,69,0.4)',
          color: '#008C45',
          fontFamily: "'Fredoka One', sans-serif",
        }}
      >
        🐍 Studio Break
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: 'rgba(26,26,46,0.55)', backdropFilter: 'blur(4px)' }}
          onClick={e => { if (e.target === e.currentTarget) setOpen(false); }}
        >
          <div
            className="flex flex-col items-center gap-3 p-5 rounded-2xl shadow-2xl"
            style={{ background: '#FFF9F0', border: '2px solid #E0CCB0', minWidth: `${W + 40}px` }}
          >
            <div className="flex items-center justify-between w-full">
              <span style={{ fontFamily: "'Fredoka One', sans-serif", color: '#008C45', fontSize: '1rem' }}>
                🐍 Studio Break
              </span>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <div style={{ fontFamily: "'Fredoka One', sans-serif", color: '#1A1A2E', fontSize: '0.9rem' }}>
                    🍕 {score}
                  </div>
                  <div style={{ fontFamily: "'Fredoka One', sans-serif", color: '#7A7A8C', fontSize: '0.65rem' }}>
                    BEST: {highScore}
                  </div>
                </div>
                <button
                  onClick={() => setOpen(false)}
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-sm"
                  style={{ background: 'rgba(206,43,55,0.1)', color: '#CE2B37',
                           fontFamily: "'Fredoka One', sans-serif" }}
                >
                  ✕
                </button>
              </div>
            </div>

            <div style={{ position: 'relative' }}>
              <canvas
                ref={canvasRef}
                width={W}
                height={H}
                style={{ display: 'block', borderRadius: '12px', border: '1.5px solid #E0CCB0' }}
              />
              {(!started || dead) && (
                <div style={{
                  position: 'absolute', inset: 0, borderRadius: '12px',
                  background: 'rgba(255,249,240,0.9)',
                  display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center', gap: 10,
                }}>
                  {dead ? (
                    <>
                      {newBest ? (
                        <p style={{ fontFamily: "'Fredoka One', sans-serif", color: '#008C45', fontSize: '1.2rem' }}>
                          🏆 NEW RECORD!
                        </p>
                      ) : (
                        <p style={{ fontFamily: "'Fredoka One', sans-serif", color: '#CE2B37', fontSize: '1.2rem' }}>
                          💀 DISGRAZIATO!
                        </p>
                      )}
                      <p style={{ fontFamily: "'Fredoka One', sans-serif", color: '#7A7A8C', fontSize: '0.85rem' }}>
                        Punteggio: {score} · Record: {highScore}
                      </p>
                      <button
                        onClick={reset}
                        className="px-5 py-2 rounded-xl"
                        style={{ background: '#008C45', color: '#fff',
                                 fontFamily: "'Fredoka One', sans-serif", fontSize: '0.9rem' }}
                      >
                        Try Again 🍕
                      </button>
                    </>
                  ) : (
                    <p style={{ fontFamily: "'Fredoka One', sans-serif", color: '#1A1A2E', fontSize: '0.85rem' }}>
                      Press an arrow key to start
                    </p>
                  )}
                </div>
              )}
            </div>

            <div className="grid gap-1.5" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
              <div />{arrowBtn('▲', 'U')}<div />
              {arrowBtn('◄', 'L')}{arrowBtn('▼', 'D')}{arrowBtn('►', 'R')}
            </div>

            <p style={{ color: '#B0A090', fontSize: '0.65rem', fontFamily: "'Fredoka One', sans-serif" }}>
              WASD or arrow keys · click outside to close
            </p>
          </div>
        </div>
      )}
    </>
  );
}
