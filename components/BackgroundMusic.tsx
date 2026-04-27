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
        position: 'fixed', top: '50%', right: 16, transform: 'translateY(-50%)', zIndex: 50,
        background: 'none', border: 'none', padding: 0,
        fontSize: 22, cursor: 'pointer',
        opacity: muted ? 0.3 : 0.75,
        transition: 'opacity 0.2s',
      }}
    >
      {muted ? '🔇' : '🎵'}
    </button>
  );
}
