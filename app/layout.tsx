import type { Metadata } from 'next';
import './globals.css';
import RotMeter from '@/components/RotMeter';
import BackgroundMusic from '@/components/BackgroundMusic';
import { Analytics } from '@vercel/analytics/react';
import { AuthProvider } from '@/components/AuthProvider';

export const metadata: Metadata = {
  title: 'Capital BrainRot 🍕',
  description: 'Studio Italiano — Powered by Claude',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased">
        <AuthProvider>
          {children}
          <RotMeter />
          <BackgroundMusic />
          <Analytics />
        </AuthProvider>
      </body>
    </html>
  );
}
