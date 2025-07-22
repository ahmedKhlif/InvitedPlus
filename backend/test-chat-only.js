const axios = require('axios');

async function testChatOnly() {
  try {
    console.log('🔍 Testing chat endpoint only...');
    
    // Login first
    const loginResponse = await axios.post('http://localhost:3001/api/auth/login', {
      email: 'organizer@invitedplus.com',
      password: 'organizer123'
    });
    
    const token = loginResponse.data.accessToken;
    console.log('✅ Login successful, token received');
    
    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
    
    // Test sending a chat message
    console.log('\n🔍 Testing chat message sending...');
    const sendResponse = await axios.post('http://localhost:3001/api/chat/messages', {
      content: 'Test message from debug script',
      eventId: 'cmd83f0jr0003dfxshdclnm5n'
    }, { headers });
    
    console.log('✅ Chat message sent successfully');
    console.log('Response:', JSON.stringify(sendResponse.data, null, 2));
    
  } catch (error) {
    console.error('❌ Error:', error.response?.status, error.response?.data || error.message);
  }
}

testChatOnly();
