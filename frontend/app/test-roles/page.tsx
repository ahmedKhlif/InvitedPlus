'use client';

import { useState } from 'react';
import { authService } from '@/lib/services';
import { usePermissions } from '@/lib/hooks/usePermissions';

export default function TestRolesPage() {
  const [testResults, setTestResults] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const { user, isAdmin, isOrganizer, isGuest, canAccessAdmin, canCreateEvent } = usePermissions();

  const addResult = (message: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const testRoleSystem = async () => {
    setLoading(true);
    setTestResults([]);
    
    addResult('🔍 Starting role system test...');
    
    // Test 1: Check if user is authenticated
    const isAuth = authService.isAuthenticated();
    addResult(`Authentication status: ${isAuth ? '✅ Authenticated' : '❌ Not authenticated'}`);
    
    if (!isAuth) {
      addResult('❌ Please login first to test roles');
      setLoading(false);
      return;
    }

    // Test 2: Get current user
    const currentUser = authService.getCurrentUser();
    if (currentUser) {
      addResult(`✅ Current user: ${currentUser.name} (${currentUser.email})`);
      addResult(`✅ User role: ${currentUser.role}`);
    } else {
      addResult('❌ Failed to get current user');
    }

    // Test 3: Test JWT token
    const token = authService.getToken();
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        addResult(`✅ JWT payload role: ${payload.role}`);
        addResult(`✅ JWT payload email: ${payload.email}`);
      } catch (error) {
        addResult('❌ Failed to decode JWT token');
      }
    }

    // Test 4: Test permission hooks
    addResult(`🔍 Permission tests:`);
    addResult(`  - isAdmin(): ${isAdmin()}`);
    addResult(`  - isOrganizer(): ${isOrganizer()}`);
    addResult(`  - isGuest(): ${isGuest()}`);
    addResult(`  - canAccessAdmin(): ${canAccessAdmin()}`);
    addResult(`  - canCreateEvent(): ${canCreateEvent()}`);

    // Test 5: Test API call with role
    try {
      const profileResponse = await authService.getProfile();
      if (profileResponse.success) {
        addResult(`✅ Profile API call successful`);
        addResult(`✅ Profile role: ${profileResponse.user.role}`);
      } else {
        addResult('❌ Profile API call failed');
      }
    } catch (error) {
      addResult('❌ Profile API call error');
    }

    setLoading(false);
  };

  const testAdminAPI = async () => {
    setLoading(true);
    addResult('🔍 Testing admin API access...');

    const baseUrl = 'https://invitedplus-production.up.railway.app/api';
    const adminEndpoints = [
      { name: 'Stats', url: `${baseUrl}/admin/stats` },
      { name: 'Users', url: `${baseUrl}/admin/users` },
      { name: 'Events', url: `${baseUrl}/admin/events` },
      { name: 'Tasks', url: `${baseUrl}/admin/tasks` },
      { name: 'Analytics', url: `${baseUrl}/admin/analytics` },
    ];

    for (const endpoint of adminEndpoints) {
      try {
        const response = await fetch(endpoint.url, {
          headers: {
            'Authorization': `Bearer ${authService.getToken()}`,
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          const data = await response.json();
          addResult(`✅ ${endpoint.name} API: Success`);
          addResult(`   Data keys: ${Object.keys(data).join(', ')}`);
        } else {
          addResult(`❌ ${endpoint.name} API: ${response.status} ${response.statusText}`);
        }
      } catch (error) {
        addResult(`❌ ${endpoint.name} API: Error - ${error}`);
      }
    }

    setLoading(false);
  };

  const testFeatures = async () => {
    setLoading(true);
    addResult('🔍 Testing platform features...');

    const features = [
      { name: 'Events API', url: 'http://localhost:3001/api/events' },
      { name: 'Tasks API', url: 'http://localhost:3001/api/tasks' },
      { name: 'Polls API', url: 'http://localhost:3001/api/polls' },
      { name: 'Chat API', url: 'http://localhost:3001/api/chat' },
    ];

    for (const feature of features) {
      try {
        const response = await fetch(feature.url, {
          headers: {
            'Authorization': `Bearer ${authService.getToken()}`,
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          addResult(`✅ ${feature.name}: Available`);
        } else {
          addResult(`⚠️ ${feature.name}: ${response.status}`);
        }
      } catch (error) {
        addResult(`❌ ${feature.name}: Error`);
      }
    }

    setLoading(false);
  };

  const clearResults = () => {
    setTestResults([]);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Role System Testing</h1>
          
          {user && (
            <div className="mb-6 p-4 bg-blue-50 rounded-lg">
              <h2 className="text-lg font-semibold text-blue-900">Current User</h2>
              <p><strong>Name:</strong> {user.name}</p>
              <p><strong>Email:</strong> {user.email}</p>
              <p><strong>Role:</strong> <span className="font-bold text-blue-600">{user.role}</span></p>
            </div>
          )}

          <div className="space-y-4 mb-6">
            <button
              onClick={testRoleSystem}
              disabled={loading}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Testing...' : 'Test Role System'}
            </button>

            <button
              onClick={testAdminAPI}
              disabled={loading}
              className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 disabled:opacity-50 ml-4"
            >
              {loading ? 'Testing...' : 'Test Admin API'}
            </button>

            <button
              onClick={testFeatures}
              disabled={loading}
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50 ml-4"
            >
              {loading ? 'Testing...' : 'Test Features'}
            </button>

            <button
              onClick={clearResults}
              className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 ml-4"
            >
              Clear Results
            </button>
          </div>

          <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm max-h-96 overflow-y-auto">
            <h3 className="text-white font-bold mb-2">Test Results:</h3>
            {testResults.length === 0 ? (
              <p className="text-gray-400">No tests run yet. Click "Test Role System" to start.</p>
            ) : (
              testResults.map((result, index) => (
                <div key={index} className="mb-1">
                  {result}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
