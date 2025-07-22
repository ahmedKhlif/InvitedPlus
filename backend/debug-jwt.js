const axios = require('axios');

async function debugJWT() {
  try {
    console.log('🔍 Getting JWT token...');
    
    const loginResponse = await axios.post('http://localhost:3001/api/auth/login', {
      email: 'organizer@example.com',
      password: 'TestPassword123!'
    });
    
    const token = loginResponse.data.accessToken;
    console.log('✅ Token received:', token ? 'Yes' : 'No');
    console.log('Login response:', JSON.stringify(loginResponse.data, null, 2));

    if (token) {
      // Decode JWT payload (just for debugging - don't do this in production)
      const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
      console.log('🔍 JWT Payload structure:');
      console.log(JSON.stringify(payload, null, 2));
    }
    
    // Test profile endpoint to see what req.user contains
    console.log('\n🔍 Testing profile endpoint...');
    const profileResponse = await axios.get('http://localhost:3001/api/auth/profile', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('✅ Profile response:');
    console.log(JSON.stringify(profileResponse.data, null, 2));
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

debugJWT();
