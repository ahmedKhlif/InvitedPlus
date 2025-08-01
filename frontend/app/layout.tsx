import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { ToastProvider } from '@/lib/contexts/ToastContext';
import { NotificationProvider } from '@/contexts/NotificationContext';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Invited+ | Smart Event Management',
  description: 'A smart, collaborative, invite-only event & task management platform',
  keywords: ['event management', 'task management', 'collaboration', 'real-time'],
  authors: [{ name: 'Invited+ Team' }],
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
    ],
    shortcut: '/favicon.svg',
    apple: '/favicon.svg',
  },

};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning={true}>

      <body className={inter.className} suppressHydrationWarning={true}>
        <ToastProvider>
          <NotificationProvider>
            <div className="min-h-screen bg-gray-50">
              {children}
            </div>
          </NotificationProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
