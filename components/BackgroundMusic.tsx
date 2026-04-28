'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';

export default function BackgroundMusic() {
  const pathname = usePathname();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [muted, setMuted] = useState(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem('cbr-muted') === 'true';
  });

  const onMap = pathname === '/';

  useEffect(() => {
    const audio = new Audio('/audio/theme.mp3');
    audio.loop = true;
    audio.volume = 0.35;
    audio.muted = muted;
    audioRef.current = audio;

    const start = () => audio.play().catch(() => {});
    if (onMap) start();

    const onInteract = () => { if (onMap) start(); };
    window.addEventListener('click',   onInteract, { once: true });
    window.addEventListener('keydown', onInteract, { once: true });

    return () => {
      audio.pause();
      window.removeEventListener('click',   onInteract);
      window.removeEventListener('keydown', onInteract);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Pause/resume when navigating on/off the map
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (onMap) {
      audio.play().catch(() => {});
    } else {
      audio.pause();
    }
  }, [onMap]);

  // Listen for mute changes from the account page (same-tab custom event)
  useEffect(() => {
    const onMuteChange = (e: Event) => {
      const muted = (e as CustomEvent<boolean>).detail;
      setMuted(muted);
      if (audioRef.current) {
        audioRef.current.muted = muted;
        if (!muted) audioRef.current.play().catch(() => {});
      }
    };
    window.addEventListener('cbr-mute-change', onMuteChange);
    return () => window.removeEventListener('cbr-mute-change', onMuteChange);
  }, []);

  return null;
}
