import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/contexts/AuthContext';
import { PointsHeader } from '@/components/PointsHeader';
import { NavBar } from '@/components/NavBar';
import { PwaInstall } from '@/components/PwaInstall';

export const metadata: Metadata = {
  title: 'Aura',
  description: 'Glow up your vibe',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-screen bg-background text-foreground antialiased">
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', () => {
                  navigator.serviceWorker.register('/sw.js').catch(console.error);
                });
              }
            `,
          }}
        />
        <AuthProvider>
          <div className="mx-auto max-w-3xl px-4 py-6">
            <PointsHeader />
            <NavBar />
            <PwaInstall />
            {children}
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}

