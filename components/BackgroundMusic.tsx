'use client';

import { useEffect, useRef, useState } from 'react';

export default function BackgroundMusic() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [muted, setMuted] = useState(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem('cbr-muted') === 'true';
  });
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const audio = new Audio('/audio/theme.mp3');
    audio.loop = true;
    audio.volume = 0.35;
    audio.muted = muted;
    audioRef.current = audio;

    // Start on first user interaction (browser autoplay policy)
    const tryPlay = () => {
      audio.play().then(() => setReady(true)).catch(() => {});
    };

    window.addEventListener('click', tryPlay, { once: true });
    window.addEventListener('keydown', tryPlay, { once: true });

    return () => {
      audio.pause();
      window.removeEventListener('click', tryPlay);
      window.removeEventListener('keydown', tryPlay);
    };
  }, []);

  const toggleMute = () => {
    const next = !muted;
    setMuted(next);
    localStorage.setItem('cbr-muted', String(next));
    if (audioRef.current) audioRef.current.muted = next;
  };

  if (!ready && muted) return null;

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
      }}
    >
      {muted ? '🔇' : '🎵'}
    </button>
  );
}
