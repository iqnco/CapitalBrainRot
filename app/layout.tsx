import type { Metadata } from 'next';
import './globals.css';
import WadieChat from '@/components/WadieChat';
import { Analytics } from '@vercel/analytics/react';

export const metadata: Metadata = {
  title: 'Rainbow Study Siege',
  description: 'Tactical Study Training — Powered by Claude',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
        <WadieChat />
        <Analytics />
      </body>
    </html>
  );
}
