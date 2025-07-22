const axios = require('axios');

// Available Test Accounts
const TEST_ACCOUNTS = {
  admin: {
    email: 'admin@invitedplus.com',
    password: 'AdminPassword123!',
    role: 'ADMIN',
    description: 'Admin user with full access'
  },
  organizer1: {
    email: 'organizer@invitedplus.com', 
    password: 'OrganizerPassword123!',
    role: 'ORGANIZER',
    description: 'Event organizer with demo event'
  },
  organizer2: {
    email: 'organizer@example.com',
    password: 'TestPassword123!',
    role: 'GUEST',
    description: 'Event organizer with company retreat event'
  },
  guest: {
    email: 'guest@invitedplus.com',
    password: 'GuestPassword123!', 
    role: 'GUEST',
    description: 'Guest user attending demo event'
  },
  attendee: {
    email: 'attendee@example.com',
    password: 'TestPassword123!',
    role: 'GUEST', 
    description: 'Attendee of company retreat'
  }
};

// Available Invite Codes
const INVITE_CODES = {
  demo: 'DEMO2024',
  retreat: 'TEST-EVENT-001'
};

const API_BASE = 'http://localhost:3001/api';

async function testAccount(accountKey) {
  const account = TEST_ACCOUNTS[accountKey];
  if (!account) {
    console.log('❌ Account not found:', accountKey);
    return;
  }

  try {
    console.log(`\n🔍 Testing account: ${accountKey}`);
    console.log(`📧 Email: ${account.email}`);
    console.log(`👤 Role: ${account.role}`);
    console.log(`📝 Description: ${account.description}`);
    
    // Test login
    const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
      email: account.email,
      password: account.password
    });
    
    console.log('✅ Login successful!');
    const token = loginResponse.data.accessToken;
    
    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
    
    // Test profile
    const profileResponse = await axios.get(`${API_BASE}/auth/profile`, { headers });
    console.log(`👤 Profile: ${profileResponse.data.name}`);
    
    // Test events
    const eventsResponse = await axios.get(`${API_BASE}/events`, { headers });
    console.log(`📅 Events accessible: ${eventsResponse.data.events?.length || 0}`);
    
    // Test chat messages
    const chatResponse = await axios.get(`${API_BASE}/chat/messages`, { headers });
    console.log(`💬 Chat messages: ${chatResponse.data.messages?.length || 0}`);
    
    return { token, headers, account };
    
  } catch (error) {
    console.log('❌ Test failed:', error.response?.data?.message || error.message);
  }
}

async function testInviteCode(code) {
  try {
    console.log(`\n🔍 Testing invite code: ${code}`);
    
    const inviteResponse = await axios.get(`${API_BASE}/invites/${code}`);
    console.log('✅ Invite code valid!');
    console.log(`📅 Event: ${inviteResponse.data.event.title}`);
    console.log(`👤 Organizer: ${inviteResponse.data.event.organizer.name}`);
    console.log(`👥 Attendees: ${inviteResponse.data.event._count.attendees}`);
    
  } catch (error) {
    console.log('❌ Invite test failed:', error.response?.data?.message || error.message);
  }
}

async function runAllTests() {
  console.log('🧪 COMPREHENSIVE ACCOUNT TESTING');
  console.log('='.repeat(50));
  
  // Test all accounts
  for (const [key, account] of Object.entries(TEST_ACCOUNTS)) {
    await testAccount(key);
  }
  
  console.log('\n🎫 TESTING INVITE CODES');
  console.log('='.repeat(50));
  
  // Test invite codes
  for (const [key, code] of Object.entries(INVITE_CODES)) {
    await testInviteCode(code);
  }
  
  console.log('\n📋 QUICK REFERENCE');
  console.log('='.repeat(50));
  console.log('Available accounts:');
  Object.entries(TEST_ACCOUNTS).forEach(([key, account]) => {
    console.log(`  ${key}: ${account.email} (${account.role})`);
  });
  
  console.log('\nAvailable invite codes:');
  Object.entries(INVITE_CODES).forEach(([key, code]) => {
    console.log(`  ${key}: ${code}`);
  });
}

// Run specific test if argument provided
const testType = process.argv[2];
const testValue = process.argv[3];

if (testType === 'account' && testValue) {
  testAccount(testValue);
} else if (testType === 'invite' && testValue) {
  testInviteCode(testValue);
} else {
  runAllTests();
}
