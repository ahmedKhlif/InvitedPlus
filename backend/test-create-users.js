const axios = require('axios');

const API_BASE = 'http://localhost:3001/api';

async function createTestUsers() {
  console.log('🔧 Creating test users via API...\n');

  const testUsers = [
    {
      name: 'Admin User',
      email: 'admin@test.com',
      password: 'admin123',
      role: 'ADMIN'
    },
    {
      name: 'Organizer User', 
      email: 'organizer@test.com',
      password: 'organizer123',
      role: 'ORGANIZER'
    },
    {
      name: 'Guest User',
      email: 'guest@test.com', 
      password: 'guest123',
      role: 'GUEST'
    }
  ];

  for (const userData of testUsers) {
    try {
      console.log(`Creating ${userData.role} user: ${userData.email}`);
      
      const response = await axios.post(`${API_BASE}/auth/register`, {
        name: userData.name,
        email: userData.email,
        password: userData.password
      });

      console.log(`✅ Created user: ${response.data.user.name}`);
      console.log(`   Email: ${response.data.user.email}`);
      console.log(`   Role: ${response.data.user.role}`);
      console.log(`   Password: ${userData.password}\n`);

    } catch (error) {
      if (error.response?.status === 409) {
        console.log(`⚠️  User ${userData.email} already exists\n`);
      } else {
        console.error(`❌ Error creating ${userData.email}:`, error.response?.data?.message || error.message);
      }
    }
  }

  console.log('🎉 Test user creation completed!\n');
  console.log('📋 LOGIN CREDENTIALS:');
  console.log('👑 ADMIN:     admin@test.com     / admin123');
  console.log('🎯 ORGANIZER: organizer@test.com / organizer123');
  console.log('👤 GUEST:     guest@test.com     / guest123');
  console.log('\n🔥 You can now test role-based access control!');
}

createTestUsers();
