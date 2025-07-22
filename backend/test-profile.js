const axios = require('axios');

async function testProfile() {
  try {
    console.log('🔍 Testing Profile Endpoint...');
    
    // First login to get token
    const loginResponse = await axios.post('http://localhost:3001/api/auth/login', {
      email: 'organizer@example.com',
      password: 'TestPassword123!'
    });
    
    const token = loginResponse.data.accessToken;
    console.log('✅ Login successful, token received');
    
    // Test profile endpoint
    const profileResponse = await axios.get('http://localhost:3001/api/auth/profile', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Profile endpoint response:');
    console.log(JSON.stringify(profileResponse.data, null, 2));
    
    // Check if user data is properly structured
    if (profileResponse.data.user) {
      console.log('\n📋 User Details:');
      console.log('- ID:', profileResponse.data.user.id);
      console.log('- Name:', profileResponse.data.user.name);
      console.log('- Email:', profileResponse.data.user.email);
      console.log('- Role:', profileResponse.data.user.role);
      console.log('- Verified:', profileResponse.data.user.isVerified);
    } else {
      console.log('❌ User data not found in response');
    }
    
  } catch (error) {
    console.error('❌ Profile test failed:', error.response?.data || error.message);
  }
}

testProfile();
