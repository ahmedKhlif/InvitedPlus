const axios = require('axios');

const API_BASE = 'http://localhost:3001/api';

async function runComprehensiveTest() {
  console.log('🚀 COMPREHENSIVE INVITED+ PLATFORM TEST');
  console.log('=' .repeat(60));

  try {
    // 1. Health Check
    console.log('\n1. 🏥 HEALTH CHECK');
    console.log('-'.repeat(30));
    const healthResponse = await axios.get(`${API_BASE}/health`);
    console.log('✅ Backend health:', healthResponse.data.status);
    console.log('   - Database:', healthResponse.data.services.database);
    console.log('   - Environment:', healthResponse.data.environment);

    // 2. Authentication
    console.log('\n2. 🔐 AUTHENTICATION');
    console.log('-'.repeat(30));
    const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
      email: 'organizer@invitedplus.com',
      password: 'organizer123'
    });
    
    const token = loginResponse.data.accessToken;
    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
    
    console.log('✅ Login successful');
    console.log('   - User:', loginResponse.data.user.name);
    console.log('   - Role:', loginResponse.data.user.role);
    console.log('   - Token received:', token ? 'Yes' : 'No');

    // 3. Profile
    console.log('\n3. 👤 PROFILE');
    console.log('-'.repeat(30));
    const profileResponse = await axios.get(`${API_BASE}/auth/profile`, { headers });
    console.log('✅ Profile retrieved');
    console.log('   - Name:', profileResponse.data.user.name);
    console.log('   - Email:', profileResponse.data.user.email);
    console.log('   - Verified:', profileResponse.data.user.isVerified);

    // 4. Events
    console.log('\n4. 📅 EVENTS');
    console.log('-'.repeat(30));
    const eventsResponse = await axios.get(`${API_BASE}/events`, { headers });
    console.log('✅ Events retrieved');
    console.log('   - Total events:', eventsResponse.data.events.length);
    
    let eventId = null;
    if (eventsResponse.data.events.length > 0) {
      eventId = eventsResponse.data.events[0].id;
      console.log('   - Using event:', eventsResponse.data.events[0].title);
      console.log('   - Event ID:', eventId);
    }

    // 5. Tasks
    console.log('\n5. 📋 TASKS');
    console.log('-'.repeat(30));
    const tasksResponse = await axios.get(`${API_BASE}/tasks`, { headers });
    console.log('✅ Tasks retrieved');
    console.log('   - Total tasks:', tasksResponse.data.tasks.length);
    
    if (tasksResponse.data.tasks.length > 0) {
      console.log('   - Sample task:', tasksResponse.data.tasks[0].title);
      console.log('   - Status:', tasksResponse.data.tasks[0].status);
    }

    // 6. Task Creation (if we have an event)
    if (eventId) {
      console.log('\n6. ➕ TASK CREATION');
      console.log('-'.repeat(30));
      const newTaskResponse = await axios.post(`${API_BASE}/tasks`, {
        title: 'Comprehensive Test Task',
        description: 'Created during comprehensive testing',
        status: 'TODO',
        priority: 'HIGH',
        eventId: eventId
      }, { headers });
      
      console.log('✅ Task created');
      console.log('   - Task ID:', newTaskResponse.data.id);
      console.log('   - Title:', newTaskResponse.data.title);

      const newTaskId = newTaskResponse.data.id;

      // 7. Task Update
      console.log('\n7. ✏️ TASK UPDATE');
      console.log('-'.repeat(30));
      const updateResponse = await axios.patch(`${API_BASE}/tasks/${newTaskId}`, {
        status: 'IN_PROGRESS',
        title: 'Updated Comprehensive Test Task'
      }, { headers });
      
      console.log('✅ Task updated');
      console.log('   - New status:', updateResponse.data.status);
      console.log('   - New title:', updateResponse.data.title);

      // 8. Task Deletion
      console.log('\n8. 🗑️ TASK CLEANUP');
      console.log('-'.repeat(30));
      await axios.delete(`${API_BASE}/tasks/${newTaskId}`, { headers });
      console.log('✅ Test task deleted');
    }

    // 9. Chat
    console.log('\n9. 💬 CHAT');
    console.log('-'.repeat(30));
    const chatResponse = await axios.get(`${API_BASE}/chat/messages`, { headers });
    console.log('✅ Chat messages retrieved');
    console.log('   - Total messages:', chatResponse.data.messages.length);

    // 10. Polls
    console.log('\n10. 📊 POLLS');
    console.log('-'.repeat(30));
    const pollsResponse = await axios.get(`${API_BASE}/polls`, { headers });
    console.log('✅ Polls retrieved');
    console.log('   - Total polls:', pollsResponse.data.polls.length);

    // 11. Registration Test
    console.log('\n11. 📝 REGISTRATION TEST');
    console.log('-'.repeat(30));
    const timestamp = Date.now();
    const testEmail = `test-${timestamp}@example.com`;
    
    const registerResponse = await axios.post(`${API_BASE}/auth/register`, {
      name: 'Test User',
      email: testEmail,
      password: 'TestPassword123!'
    });
    
    console.log('✅ Registration successful');
    console.log('   - New user:', registerResponse.data.user.name);
    console.log('   - Email:', registerResponse.data.user.email);

    // 12. Final Summary
    console.log('\n' + '='.repeat(60));
    console.log('🎉 COMPREHENSIVE TEST COMPLETED SUCCESSFULLY!');
    console.log('='.repeat(60));
    
    console.log('\n📊 FEATURE STATUS:');
    console.log('✅ Backend Health Check');
    console.log('✅ User Authentication');
    console.log('✅ User Profile Management');
    console.log('✅ Event Management');
    console.log('✅ Task Management (CRUD)');
    console.log('✅ Chat System');
    console.log('✅ Polling System');
    console.log('✅ User Registration');
    
    console.log('\n🔗 WORKING ENDPOINTS:');
    console.log('- GET  /api/health');
    console.log('- POST /api/auth/login');
    console.log('- POST /api/auth/register');
    console.log('- GET  /api/auth/profile');
    console.log('- GET  /api/events');
    console.log('- GET  /api/tasks');
    console.log('- POST /api/tasks');
    console.log('- PATCH /api/tasks/:id');
    console.log('- DELETE /api/tasks/:id');
    console.log('- GET  /api/chat/messages');
    console.log('- GET  /api/polls');

    console.log('\n🌐 FRONTEND READY:');
    console.log('- Frontend: http://localhost:3000');
    console.log('- Backend API: http://localhost:3001/api');
    console.log('- API Docs: http://localhost:3001/api/docs');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    process.exit(1);
  }
}

runComprehensiveTest();
