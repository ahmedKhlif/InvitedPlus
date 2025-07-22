'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import MainNav from './MainNav';

interface AppLayoutProps {
  children: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const router = useRouter();
  const pathname = usePathname();

  // Pages that don't require authentication
  const publicPages = ['/auth/login', '/auth/signup', '/'];

  useEffect(() => {
    const token = localStorage.getItem('token');
    const isPublicPage = publicPages.includes(pathname);

    if (!token && !isPublicPage) {
      router.push('/auth/login');
      return;
    }

    if (token && (pathname === '/auth/login' || pathname === '/auth/signup')) {
      router.push('/dashboard');
      return;
    }

    setIsAuthenticated(!!token);
  }, [pathname, router]);

  // Show loading while checking authentication
  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  // Don't show navigation on public pages
  const showNavigation = isAuthenticated && !publicPages.includes(pathname);

  return (
    <div className="min-h-screen bg-gray-50">
      {showNavigation && <MainNav />}
      <main className={showNavigation ? '' : 'min-h-screen'}>
        {children}
      </main>
    </div>
  );
}
