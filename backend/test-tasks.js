const axios = require('axios');

const API_BASE = 'http://localhost:3001/api';

async function testTaskSystem() {
  try {
    console.log('🧪 Testing Task Management System...\n');

    // 1. Login to get token
    console.log('1. Logging in...');
    const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
      email: 'organizer@invitedplus.com',
      password: 'organizer123'
    });

    console.log('Login response:', loginResponse.data);
    const token = loginResponse.data.access_token || loginResponse.data.accessToken;
    console.log('✅ Login successful, token:', token ? 'received' : 'missing');
    
    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };

    // 2. Get all tasks
    console.log('\n2. Getting all tasks...');
    const tasksResponse = await axios.get(`${API_BASE}/tasks`, { headers });
    console.log(`✅ Found ${tasksResponse.data.tasks.length} tasks`);
    console.log('Tasks:', tasksResponse.data.tasks.map(t => ({ id: t.id, title: t.title, status: t.status })));

    // 3. Get the first event ID from tasks (if any exist)
    let eventId = null;
    if (tasksResponse.data.tasks.length > 0) {
      eventId = tasksResponse.data.tasks[0].eventId;
      console.log(`📅 Using event ID: ${eventId}`);
    }

    // 4. Create a new task
    if (eventId) {
      console.log('\n3. Creating a new task...');
      const newTask = {
        title: 'Test Task from API',
        description: 'This is a test task created via API',
        status: 'TODO',
        priority: 'HIGH',
        eventId: eventId,
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      };

      const createResponse = await axios.post(`${API_BASE}/tasks`, newTask, { headers });
      console.log('✅ Task created successfully');
      console.log('New task:', { id: createResponse.data.id, title: createResponse.data.title });

      const newTaskId = createResponse.data.id;

      // 5. Get the specific task
      console.log('\n4. Getting specific task...');
      const taskResponse = await axios.get(`${API_BASE}/tasks/${newTaskId}`, { headers });
      console.log('✅ Task retrieved successfully');
      console.log('Task details:', { 
        title: taskResponse.data.title, 
        status: taskResponse.data.status,
        priority: taskResponse.data.priority 
      });

      // 6. Update the task
      console.log('\n5. Updating task status...');
      const updateResponse = await axios.patch(`${API_BASE}/tasks/${newTaskId}`, {
        status: 'IN_PROGRESS'
      }, { headers });
      console.log('✅ Task updated successfully');
      console.log('Updated status:', updateResponse.data.status);

      // 7. Get task statistics
      console.log('\n6. Getting task statistics...');
      const statsResponse = await axios.get(`${API_BASE}/tasks/stats/${eventId}`, { headers });
      console.log('✅ Task statistics retrieved');
      console.log('Stats:', statsResponse.data);

      // 8. Delete the test task
      console.log('\n7. Deleting test task...');
      await axios.delete(`${API_BASE}/tasks/${newTaskId}`, { headers });
      console.log('✅ Task deleted successfully');
    }

    console.log('\n🎉 All task management tests passed!');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

testTaskSystem();
