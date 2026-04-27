'use client';

import { useEffect, useRef, useState } from 'react';

export default function BackgroundMusic() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [muted, setMuted] = useState(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem('cbr-muted') === 'true';
  });

  useEffect(() => {
    const audio = new Audio('/audio/theme.mp3');
    audio.loop = true;
    audio.volume = 0.35;
    audio.muted = muted;
    audioRef.current = audio;

    // Try autoplay immediately; if browser blocks it, start on first interaction
    const start = () => audio.play().catch(() => {});
    start();

    const onInteract = () => { start(); };
    window.addEventListener('click',   onInteract, { once: true });
    window.addEventListener('keydown', onInteract, { once: true });

    return () => {
      audio.pause();
      window.removeEventListener('click',   onInteract);
      window.removeEventListener('keydown', onInteract);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation(); // don't trigger the window click → start listener
    const next = !muted;
    setMuted(next);
    localStorage.setItem('cbr-muted', String(next));
    if (audioRef.current) {
      audioRef.current.muted = next;
      // If they unmute and audio hasn't started yet, start now
      if (!next) audioRef.current.play().catch(() => {});
    }
  };

  return (
    <button
      onClick={toggleMute}
      title={muted ? 'Unmute music' : 'Mute music'}
      style={{
        position: 'fixed', bottom: 44, right: 16, zIndex: 50,
        width: 32, height: 32, borderRadius: '50%',
        background: 'rgba(10,5,0,0.85)',
        border: '1px solid rgba(212,160,23,0.3)',
        backdropFilter: 'blur(8px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 14, cursor: 'pointer',
        color: muted ? 'rgba(255,220,150,0.35)' : 'rgba(255,220,150,0.85)',
        transition: 'opacity 0.2s',
      }}
    >
      {muted ? '🔇' : '🎵'}
    </button>
  );
}
