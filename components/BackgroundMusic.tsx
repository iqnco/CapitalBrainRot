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

  // Listen for mute changes from the account page
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'cbr-muted' && audioRef.current) {
        const next = e.newValue === 'true';
        setMuted(next);
        audioRef.current.muted = next;
        if (!next) audioRef.current.play().catch(() => {});
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  return null;
}
