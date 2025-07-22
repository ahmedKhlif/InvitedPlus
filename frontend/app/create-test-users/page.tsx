'use client';

import { useState } from 'react';
import { authService } from '@/lib/services';

export default function CreateTestUsersPage() {
  const [results, setResults] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const addResult = (message: string) => {
    setResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const testUsers = [
    {
      name: 'Admin User',
      email: 'admin@test.com',
      password: 'admin123',
      expectedRole: 'ADMIN'
    },
    {
      name: 'Organizer User',
      email: 'organizer@test.com',
      password: 'organizer123',
      expectedRole: 'ORGANIZER'
    },
    {
      name: 'Guest User',
      email: 'guest@test.com',
      password: 'guest123',
      expectedRole: 'GUEST'
    }
  ];

  const createAllTestUsers = async () => {
    setLoading(true);
    setResults([]);
    
    addResult('🔧 Creating test users...');

    for (const userData of testUsers) {
      try {
        addResult(`Creating ${userData.expectedRole}: ${userData.email}`);
        
        const response = await authService.register({
          name: userData.name,
          email: userData.email,
          password: userData.password
        });

        addResult(`✅ Created: ${response.user.name} (${response.user.role})`);
        addResult(`   Email: ${response.user.email}`);
        addResult(`   Password: ${userData.password}`);
        
      } catch (error: any) {
        if (error.response?.status === 409) {
          addResult(`⚠️  User ${userData.email} already exists`);
        } else {
          addResult(`❌ Error creating ${userData.email}: ${error.response?.data?.message || error.message}`);
        }
      }
    }

    addResult('');
    addResult('🎉 Test user creation completed!');
    addResult('');
    addResult('📋 LOGIN CREDENTIALS:');
    addResult('👑 ADMIN:     admin@test.com     / admin123');
    addResult('🎯 ORGANIZER: organizer@test.com / organizer123');
    addResult('👤 GUEST:     guest@test.com     / guest123');
    addResult('');
    addResult('🔥 You can now test role-based access control!');
    
    setLoading(false);
  };

  const testLogin = async (email: string, password: string) => {
    try {
      addResult(`🔍 Testing login for ${email}...`);
      
      const response = await authService.login({ email, password });
      
      addResult(`✅ Login successful!`);
      addResult(`   User: ${response.user.name}`);
      addResult(`   Role: ${response.user.role}`);
      addResult(`   Token: ${response.accessToken ? 'Received' : 'Missing'}`);
      
      // Test role detection
      const currentUser = authService.getCurrentUser();
      addResult(`   Role detection: ${currentUser?.role || 'Failed'}`);
      
    } catch (error: any) {
      addResult(`❌ Login failed: ${error.response?.data?.message || error.message}`);
    }
  };

  const clearResults = () => {
    setResults([]);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Create Test Users</h1>
          
          <div className="mb-6">
            <p className="text-gray-600 mb-4">
              This page helps you create test users for each role to test the role-based access control system.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              {testUsers.map((user, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <h3 className="font-semibold text-lg">{user.expectedRole}</h3>
                  <p className="text-sm text-gray-600">Email: {user.email}</p>
                  <p className="text-sm text-gray-600">Password: {user.password}</p>
                  <button
                    onClick={() => testLogin(user.email, user.password)}
                    disabled={loading}
                    className="mt-2 bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 disabled:opacity-50"
                  >
                    Test Login
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4 mb-6">
            <button
              onClick={createAllTestUsers}
              disabled={loading}
              className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700 disabled:opacity-50"
            >
              {loading ? 'Creating Users...' : 'Create All Test Users'}
            </button>

            <button
              onClick={clearResults}
              className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 ml-4"
            >
              Clear Results
            </button>
          </div>

          <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm max-h-96 overflow-y-auto">
            <h3 className="text-white font-bold mb-2">Results:</h3>
            {results.length === 0 ? (
              <p className="text-gray-400">No actions performed yet.</p>
            ) : (
              results.map((result, index) => (
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
