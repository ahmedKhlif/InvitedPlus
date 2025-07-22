'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { authService } from '@/lib/services';

function AuthCallbackContent() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Processing authentication...');
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const token = searchParams.get('token');
        const refreshToken = searchParams.get('refreshToken') || searchParams.get('refresh');
        const error = searchParams.get('error');

        if (error) {
          setStatus('error');
          setMessage(`Authentication failed: ${error}`);
          setTimeout(() => {
            router.push('/auth/login');
          }, 3000);
          return;
        }

        if (!token) {
          setStatus('error');
          setMessage('No authentication token received');
          setTimeout(() => {
            router.push('/auth/login');
          }, 3000);
          return;
        }

        // Store the tokens using authService
        authService.storeTokens(token, refreshToken || '');

        // Verify the authentication by fetching user profile
        const profileResponse = await authService.getProfile();

        if (profileResponse.success) {
          // Store user data
          authService.storeUser(profileResponse.user);

          setStatus('success');
          setMessage(`Welcome, ${profileResponse.user.name}! Redirecting...`);

          // Role-based redirect
          const redirectPath = profileResponse.user.role === 'ADMIN' ? '/admin' : '/dashboard';
          console.log('🎯 OAuth callback redirecting to:', redirectPath);

          setTimeout(() => {
            router.push(redirectPath);
          }, 2000);
        } else {
          throw new Error('Failed to fetch user profile');
        }

      } catch (error: any) {
        console.error('OAuth callback error:', error);
        setStatus('error');
        setMessage('Authentication failed. Please try again.');

        setTimeout(() => {
          router.push('/auth/login');
        }, 3000);
      }
    };

    handleCallback();
  }, [router, searchParams]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          {status === 'loading' && (
            <>
              <div className="mx-auto h-12 w-12 text-indigo-600">
                <svg className="animate-spin h-12 w-12" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </div>
              <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
                Authenticating...
              </h2>
              <p className="mt-2 text-sm text-gray-600">
                Please wait while we complete your sign-in
              </p>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="mx-auto h-12 w-12 text-green-600">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="h-12 w-12">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
              </div>
              <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
                Success!
              </h2>
              <p className="mt-2 text-sm text-gray-600">
                {message}
              </p>
            </>
          )}

          {status === 'error' && (
            <>
              <div className="mx-auto h-12 w-12 text-red-600">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="h-12 w-12">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </div>
              <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
                Authentication Failed
              </h2>
              <p className="mt-2 text-sm text-gray-600">
                {message}
              </p>
              <p className="mt-4 text-xs text-gray-500">
                Redirecting to login page...
              </p>
            </>
          )}
        </div>

        {status === 'loading' && (
          <div className="bg-white shadow rounded-lg p-6">
            <div className="space-y-3">
              <div className="h-2 bg-gray-200 rounded">
                <div className="h-2 bg-indigo-600 rounded animate-pulse" style={{ width: '60%' }}></div>
              </div>
              <p className="text-sm text-gray-500 text-center">
                Verifying your credentials...
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <AuthCallbackContent />
    </Suspense>
  );
}
