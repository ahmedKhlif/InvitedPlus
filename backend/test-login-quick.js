const axios = require('axios');

async function testLogin() {
  try {
    console.log('🔍 Testing login with correct credentials...');
    
    const response = await axios.post('http://localhost:3001/api/auth/login', {
      email: 'organizer@invitedplus.com',
      password: 'organizer123'
    });
    
    console.log('✅ LOGIN SUCCESSFUL!');
    console.log('📧 User:', response.data.user.name);
    console.log('🔑 Token received:', response.data.accessToken ? 'YES' : 'NO');
    console.log('👤 Role:', response.data.user.role);
    
  } catch (error) {
    console.log('❌ LOGIN FAILED:');
    console.log('Status:', error.response?.status);
    console.log('Message:', error.response?.data?.message || error.message);
  }
}

testLogin();
