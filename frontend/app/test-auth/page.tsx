'use client';

import { useState } from 'react';
import { authService } from '@/lib/services';

export default function TestAuthPage() {
  const [result, setResult] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const testLogin = async () => {
    setLoading(true);
    setResult('Testing login...\n');
    
    try {
      // Test login
      const loginResponse = await authService.login({
        email: 'organizer@invitedplus.com',
        password: 'organizer123'
      });
      
      setResult(prev => prev + `✅ Login successful!\n`);
      setResult(prev => prev + `User: ${loginResponse.user.name}\n`);
      setResult(prev => prev + `Token: ${loginResponse.accessToken ? 'Received' : 'Missing'}\n`);
      
      // Store tokens
      authService.storeTokens(loginResponse.accessToken, loginResponse.refreshToken);
      setResult(prev => prev + `✅ Tokens stored\n`);
      
      // Test authentication check
      const isAuth = authService.isAuthenticated();
      setResult(prev => prev + `Auth check: ${isAuth ? 'Authenticated' : 'Not authenticated'}\n`);
      
      // Test profile fetch
      const profileResponse = await authService.getProfile();
      setResult(prev => prev + `✅ Profile fetched: ${profileResponse.user.name}\n`);
      
      setResult(prev => prev + `\n🎉 All tests passed! Authentication is working.\n`);
      
    } catch (error: any) {
      setResult(prev => prev + `❌ Error: ${error.message}\n`);
      setResult(prev => prev + `Response: ${JSON.stringify(error.response?.data, null, 2)}\n`);
    } finally {
      setLoading(false);
    }
  };

  const checkCurrentAuth = () => {
    const token = authService.getToken();
    const isAuth = authService.isAuthenticated();
    
    setResult(`Current authentication status:\n`);
    setResult(prev => prev + `Token exists: ${token ? 'Yes' : 'No'}\n`);
    setResult(prev => prev + `Is authenticated: ${isAuth ? 'Yes' : 'No'}\n`);
    
    if (token) {
      setResult(prev => prev + `Token preview: ${token.substring(0, 50)}...\n`);
    }
  };

  const clearAuth = () => {
    authService.clearTokens();
    setResult('✅ Authentication cleared\n');
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white shadow rounded-lg p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">
            Authentication Test Page
          </h1>
          
          <div className="space-y-4 mb-6">
            <button
              onClick={testLogin}
              disabled={loading}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Testing...' : 'Test Login Flow'}
            </button>
            
            <button
              onClick={checkCurrentAuth}
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 ml-2"
            >
              Check Current Auth
            </button>
            
            <button
              onClick={clearAuth}
              className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 ml-2"
            >
              Clear Auth
            </button>
          </div>
          
          <div className="bg-gray-100 p-4 rounded">
            <h2 className="text-lg font-semibold mb-2">Test Results:</h2>
            <pre className="whitespace-pre-wrap text-sm font-mono">
              {result || 'Click "Test Login Flow" to start testing...'}
            </pre>
          </div>
          
          <div className="mt-6 text-sm text-gray-600">
            <p><strong>Purpose:</strong> This page tests the authentication flow to debug login issues.</p>
            <p><strong>Test credentials:</strong> organizer@invitedplus.com / organizer123</p>
          </div>
        </div>
      </div>
    </div>
  );
}
