import type { Metadata } from 'next';
import { Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/lib/context/AuthContext';

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-plus-jakarta',
});

export const metadata: Metadata = {
  title: 'Status | Project Meeting Summaries & Monthly Status Reports',
  description:
    'The executive reporting workspace for Project Managers. Generate crisp Zoom meeting summaries, speaker breakdowns, and monthly status reports.',
  icons: {
    icon: [
      { url: '/icon.svg', type: 'image/svg+xml' },
      { url: '/favicon.svg', type: 'image/svg+xml' },
    ],
    apple: '/icon.svg',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={plusJakarta.variable}>
      <body className={`min-h-screen bg-white text-slate-900 antialiased selection:bg-blue-600 selection:text-white ${plusJakarta.className}`}>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
