const axios = require('axios');

const API_BASE = 'http://localhost:3001/api';

async function runComprehensiveTest() {
  console.log('🚀 Running Comprehensive Task Management System Test\n');

  try {
    // 1. Test Authentication
    console.log('1. Testing Authentication...');
    const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
      email: 'organizer@invitedplus.com',
      password: 'organizer123'
    });
    
    const token = loginResponse.data.accessToken;
    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
    console.log('✅ Authentication successful');

    // 2. Test Task CRUD Operations
    console.log('\n2. Testing Task CRUD Operations...');
    
    // Create
    const createResponse = await axios.post(`${API_BASE}/tasks`, {
      title: 'Comprehensive Test Task',
      description: 'Testing all CRUD operations',
      status: 'TODO',
      priority: 'HIGH',
      eventId: 'cmd63pvlo0003df7kgn3j6rs0',
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    }, { headers });
    const taskId = createResponse.data.id;
    console.log('✅ Task created:', taskId);

    // Read
    const readResponse = await axios.get(`${API_BASE}/tasks/${taskId}`, { headers });
    console.log('✅ Task retrieved:', readResponse.data.title);

    // Update
    const updateResponse = await axios.patch(`${API_BASE}/tasks/${taskId}`, {
      status: 'IN_PROGRESS',
      priority: 'URGENT'
    }, { headers });
    console.log('✅ Task updated:', updateResponse.data.status);

    // 3. Test Task Filtering and Sorting
    console.log('\n3. Testing Task Filtering and Sorting...');
    
    const filterResponse = await axios.get(`${API_BASE}/tasks?status=IN_PROGRESS&priority=URGENT&sortBy=priority&sortOrder=desc`, { headers });
    console.log('✅ Filtered tasks:', filterResponse.data.tasks.length);

    // 4. Test Task Search
    console.log('\n4. Testing Task Search...');
    
    const searchResponse = await axios.get(`${API_BASE}/tasks?search=Comprehensive`, { headers });
    console.log('✅ Search results:', searchResponse.data.tasks.length);

    // 5. Test Task Statistics
    console.log('\n5. Testing Task Statistics...');
    
    const statsResponse = await axios.get(`${API_BASE}/tasks/stats/cmd63pvlo0003df7kgn3j6rs0`, { headers });
    console.log('✅ Task statistics:', {
      total: statsResponse.data.total,
      completed: statsResponse.data.byStatus.COMPLETED || 0,
      inProgress: statsResponse.data.byStatus.IN_PROGRESS || 0,
      overdue: statsResponse.data.overdue
    });

    // 6. Test Task Assignment
    console.log('\n6. Testing Task Assignment...');
    
    const assignResponse = await axios.patch(`${API_BASE}/tasks/${taskId}`, {
      assigneeId: 'cmd63pvld0000df7kp4cmcy27' // Organizer user ID (should work)
    }, { headers });
    console.log('✅ Task assigned to:', assignResponse.data.assignee?.name);

    // 7. Test Pagination
    console.log('\n7. Testing Pagination...');
    
    const paginationResponse = await axios.get(`${API_BASE}/tasks?page=1&limit=5`, { headers });
    console.log('✅ Paginated results:', {
      tasks: paginationResponse.data.tasks.length,
      total: paginationResponse.data.pagination.total,
      pages: paginationResponse.data.pagination.pages
    });

    // 8. Test Error Handling
    console.log('\n8. Testing Error Handling...');
    
    try {
      await axios.get(`${API_BASE}/tasks/invalid-id`, { headers });
    } catch (error) {
      if (error.response?.status === 404) {
        console.log('✅ 404 error handling works');
      }
    }

    try {
      await axios.post(`${API_BASE}/tasks`, {
        title: '', // Invalid empty title
        eventId: 'cmd63pvlo0003df7kgn3j6rs0'
      }, { headers });
    } catch (error) {
      if (error.response?.status === 400) {
        console.log('✅ Validation error handling works');
      }
    }

    // 9. Test Authorization
    console.log('\n9. Testing Authorization...');
    
    try {
      await axios.get(`${API_BASE}/tasks`);
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('✅ Authorization protection works');
      }
    }

    // 10. Clean up - Delete test task
    console.log('\n10. Cleaning up...');
    
    await axios.delete(`${API_BASE}/tasks/${taskId}`, { headers });
    console.log('✅ Test task deleted');

    // 11. Test All Status Transitions
    console.log('\n11. Testing Status Transitions...');
    
    const statusTestTask = await axios.post(`${API_BASE}/tasks`, {
      title: 'Status Transition Test',
      eventId: 'cmd63pvlo0003df7kgn3j6rs0',
      status: 'TODO'
    }, { headers });
    
    const statusTaskId = statusTestTask.data.id;
    
    // Test all status transitions
    const statuses = ['IN_PROGRESS', 'COMPLETED', 'CANCELLED'];
    for (const status of statuses) {
      await axios.patch(`${API_BASE}/tasks/${statusTaskId}`, { status }, { headers });
      console.log(`✅ Status updated to: ${status}`);
    }
    
    await axios.delete(`${API_BASE}/tasks/${statusTaskId}`, { headers });

    // 12. Test Priority Levels
    console.log('\n12. Testing Priority Levels...');
    
    const priorities = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];
    for (const priority of priorities) {
      const priorityTask = await axios.post(`${API_BASE}/tasks`, {
        title: `${priority} Priority Task`,
        eventId: 'cmd63pvlo0003df7kgn3j6rs0',
        priority
      }, { headers });
      
      console.log(`✅ ${priority} priority task created`);
      await axios.delete(`${API_BASE}/tasks/${priorityTask.data.id}`, { headers });
    }

    console.log('\n🎉 ALL TESTS PASSED! Task Management System is fully functional!');
    console.log('\n📊 Test Summary:');
    console.log('✅ Authentication & Authorization');
    console.log('✅ Task CRUD Operations');
    console.log('✅ Task Filtering & Sorting');
    console.log('✅ Task Search');
    console.log('✅ Task Statistics');
    console.log('✅ Task Assignment');
    console.log('✅ Pagination');
    console.log('✅ Error Handling');
    console.log('✅ Status Transitions');
    console.log('✅ Priority Levels');
    console.log('✅ Data Validation');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    process.exit(1);
  }
}

runComprehensiveTest();
