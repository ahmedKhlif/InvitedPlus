const axios = require('axios');

const API_BASE = 'http://localhost:3001/api';

async function testEmailInvite() {
  try {
    console.log('🧪 Testing Email Invite Functionality');
    console.log('=====================================');

    // First, login to get a token (using seeded organizer account)
    console.log('\n1. 🔐 Logging in...');
    const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
      email: 'organizer@invitedplus.com',
      password: 'organizer123'
    });

    if (!loginResponse.data.success) {
      throw new Error('Login failed');
    }

    const token = loginResponse.data.access_token;
    console.log('✅ Login successful');

    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };

    // Get events to find an event ID
    console.log('\n2. 📅 Getting events...');
    const eventsResponse = await axios.get(`${API_BASE}/events`, { headers });
    
    if (!eventsResponse.data.success || eventsResponse.data.events.length === 0) {
      throw new Error('No events found');
    }

    const eventId = eventsResponse.data.events[0].id;
    const eventTitle = eventsResponse.data.events[0].title;
    console.log(`✅ Found event: ${eventTitle} (ID: ${eventId})`);

    // Test sending an invite
    console.log('\n3. 📧 Sending email invite...');
    const inviteResponse = await axios.post(`${API_BASE}/events/${eventId}/invites`, {
      email: 'khlifahmed1@gmail.com'  // Your test email
    }, { headers });

    if (inviteResponse.data.success) {
      console.log('✅ Invite sent successfully!');
      console.log('📧 Check your email at: khlifahmed1@gmail.com');
      console.log('📋 Invite details:', inviteResponse.data.invite);
    } else {
      console.log('❌ Invite failed:', inviteResponse.data.message);
    }

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data?.message || error.message);
    if (error.response?.data) {
      console.error('📋 Error details:', error.response.data);
    }
  }
}

// Run the test
testEmailInvite();
