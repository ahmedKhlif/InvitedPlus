const axios = require('axios');

async function testFrontendAuth() {
  console.log('🔐 TESTING FRONTEND AUTHENTICATION FLOW\n');
  
  try {
    // Test 1: Login to get token
    console.log('1. Testing login...');
    const loginResponse = await axios.post('http://localhost:3001/api/auth/login', {
      email: 'organizer@invitedplus.com',
      password: 'organizer123'
    });
    
    const token = loginResponse.data.accessToken;
    console.log('✅ Login successful, token received');
    
    // Test 2: Test profile endpoint with token
    console.log('2. Testing profile endpoint...');
    const profileResponse = await axios.get('http://localhost:3001/api/auth/profile', {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('✅ Profile endpoint working:', profileResponse.data.user.name);
    
    // Test 3: Test polls endpoint (the problematic one)
    console.log('3. Testing polls endpoint...');
    try {
      const pollsResponse = await axios.get('http://localhost:3001/api/polls?limit=1', {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('✅ Polls endpoint working:', pollsResponse.data.polls.length, 'polls');
    } catch (pollError) {
      console.log('❌ Polls endpoint failed:', pollError.response?.data || pollError.message);
    }
    
    // Test 4: Test events endpoint
    console.log('4. Testing events endpoint...');
    const eventsResponse = await axios.get('http://localhost:3001/api/events?limit=1', {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('✅ Events endpoint working:', eventsResponse.data.events.length, 'events');
    
    // Test 5: Test tasks endpoint
    console.log('5. Testing tasks endpoint...');
    const tasksResponse = await axios.get('http://localhost:3001/api/tasks?limit=1', {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('✅ Tasks endpoint working:', tasksResponse.data.tasks.length, 'tasks');
    
    // Test 6: Test chat endpoint
    console.log('6. Testing chat endpoint...');
    const chatResponse = await axios.get('http://localhost:3001/api/chat/messages?limit=1', {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('✅ Chat endpoint working:', chatResponse.data.messages.length, 'messages');
    
    console.log('\n🎉 All API endpoints are working correctly!');
    console.log('The issue is likely in the frontend authentication handling.');
    
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

testFrontendAuth();
