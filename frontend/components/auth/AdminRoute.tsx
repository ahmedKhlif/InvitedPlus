'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { authService } from '@/lib/services';

interface AdminRouteProps {
  children: React.ReactNode;
}

export default function AdminRoute({ children }: AdminRouteProps) {
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  const router = useRouter();

  useEffect(() => {
    const checkAdminAccess = async () => {
      try {
        // Check if user is authenticated
        if (!authService.isAuthenticated()) {
          console.log('❌ Not authenticated, redirecting to login');
          router.push('/auth/login');
          return;
        }

        // Get user profile to verify role
        const profileResponse = await authService.getProfile();
        
        if (profileResponse.success && profileResponse.user.role === 'ADMIN') {
          console.log('✅ Admin access granted');
          setIsAuthorized(true);
        } else {
          console.log('❌ Not admin, redirecting to dashboard');
          router.push('/dashboard');
        }
      } catch (error) {
        console.error('Error checking admin access:', error);
        router.push('/auth/login');
      }
    };

    checkAdminAccess();
  }, [router]);

  // Show loading while checking authorization
  if (isAuthorized === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Verifying admin access...</p>
        </div>
      </div>
    );
  }

  // Only render children if authorized
  return isAuthorized ? <>{children}</> : null;
}
