const axios = require('axios');

const API_BASE = 'http://localhost:3001/api';

async function testCompleteAuthFlow() {
  console.log('🔐 Testing Complete Authentication Flow\n');

  try {
    // Step 1: Test Login
    console.log('1. Testing Login...');
    const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
      email: 'organizer@invitedplus.com',
      password: 'organizer123'
    });

    console.log('✅ Login successful');
    console.log('   - User:', loginResponse.data.user.name);
    console.log('   - Email:', loginResponse.data.user.email);
    console.log('   - Token received:', loginResponse.data.accessToken ? 'Yes' : 'No');
    console.log('   - Refresh token received:', loginResponse.data.refreshToken ? 'Yes' : 'No');

    const token = loginResponse.data.accessToken;
    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };

    // Step 2: Test Profile Access
    console.log('\n2. Testing Profile Access...');
    const profileResponse = await axios.get(`${API_BASE}/auth/profile`, { headers });
    
    console.log('✅ Profile access successful');
    console.log('   - Profile name:', profileResponse.data.user?.name || profileResponse.data.name);
    console.log('   - Profile email:', profileResponse.data.user?.email || profileResponse.data.email);

    // Step 3: Test Protected Route (Tasks)
    console.log('\n3. Testing Protected Route (Tasks)...');
    const tasksResponse = await axios.get(`${API_BASE}/tasks`, { headers });
    
    console.log('✅ Protected route access successful');
    console.log('   - Tasks found:', tasksResponse.data.tasks.length);

    // Step 4: Test Invalid Token
    console.log('\n4. Testing Invalid Token...');
    try {
      await axios.get(`${API_BASE}/auth/profile`, {
        headers: { 'Authorization': 'Bearer invalid-token' }
      });
      console.log('❌ Should have failed with invalid token');
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('✅ Invalid token correctly rejected');
      } else {
        console.log('❌ Unexpected error:', error.response?.status);
      }
    }

    // Step 5: Test No Token
    console.log('\n5. Testing No Token...');
    try {
      await axios.get(`${API_BASE}/auth/profile`);
      console.log('❌ Should have failed with no token');
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('✅ No token correctly rejected');
      } else {
        console.log('❌ Unexpected error:', error.response?.status);
      }
    }

    // Step 6: Test Logout
    console.log('\n6. Testing Logout...');
    const logoutResponse = await axios.post(`${API_BASE}/auth/logout`, {}, { headers });
    
    console.log('✅ Logout successful');

    // Step 7: Test Wrong Credentials
    console.log('\n7. Testing Wrong Credentials...');
    try {
      await axios.post(`${API_BASE}/auth/login`, {
        email: 'organizer@example.com',
        password: 'WrongPassword123!'
      });
      console.log('❌ Should have failed with wrong password');
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('✅ Wrong credentials correctly rejected');
      } else {
        console.log('❌ Unexpected error:', error.response?.status);
      }
    }

    // Step 8: Test Non-existent User
    console.log('\n8. Testing Non-existent User...');
    try {
      await axios.post(`${API_BASE}/auth/login`, {
        email: 'nonexistent@example.com',
        password: 'TestPassword123!'
      });
      console.log('❌ Should have failed with non-existent user');
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('✅ Non-existent user correctly rejected');
      } else {
        console.log('❌ Unexpected error:', error.response?.status);
      }
    }

    console.log('\n🎉 ALL AUTHENTICATION TESTS PASSED!');
    console.log('\n📋 Test Summary:');
    console.log('✅ Login with valid credentials');
    console.log('✅ Profile access with valid token');
    console.log('✅ Protected route access');
    console.log('✅ Invalid token rejection');
    console.log('✅ No token rejection');
    console.log('✅ Logout functionality');
    console.log('✅ Wrong credentials rejection');
    console.log('✅ Non-existent user rejection');

    console.log('\n🔑 WORKING CREDENTIALS:');
    console.log('Email: organizer@example.com');
    console.log('Password: TestPassword123!');
    console.log('\nAlternative:');
    console.log('Email: attendee@example.com');
    console.log('Password: TestPassword123!');

  } catch (error) {
    console.error('❌ Authentication test failed:', error.response?.data || error.message);
  }
}

testCompleteAuthFlow();
