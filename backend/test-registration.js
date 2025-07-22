const axios = require('axios');

async function testRegistration() {
  try {
    console.log('🧪 Testing registration with valid data...');
    
    const testUser = {
      name: 'Test User',
      email: `test-${Date.now()}@example.com`,
      password: 'TestPassword123!'
    };
    
    console.log('📝 Registration data:', testUser);
    
    const response = await axios.post('http://localhost:3001/api/auth/register', testUser);
    
    console.log('✅ REGISTRATION SUCCESSFUL!');
    console.log('📧 User:', response.data.user.name);
    console.log('🔑 Token received:', response.data.accessToken ? 'YES' : 'NO');
    console.log('👤 Role:', response.data.user.role);
    
  } catch (error) {
    console.log('❌ REGISTRATION FAILED:');
    console.log('Status:', error.response?.status);
    console.log('Error:', error.response?.data);
    
    if (error.response?.data?.message) {
      if (Array.isArray(error.response.data.message)) {
        console.log('Validation errors:');
        error.response.data.message.forEach(msg => console.log('  -', msg));
      } else {
        console.log('Message:', error.response.data.message);
      }
    }
  }
}

async function testWeakPassword() {
  try {
    console.log('\n🧪 Testing registration with weak password...');
    
    const testUser = {
      name: 'Test User 2',
      email: `test-weak-${Date.now()}@example.com`,
      password: 'weak'
    };
    
    const response = await axios.post('http://localhost:3001/api/auth/register', testUser);
    console.log('❌ This should have failed!');
    
  } catch (error) {
    console.log('✅ CORRECTLY REJECTED weak password');
    if (error.response?.data?.message) {
      if (Array.isArray(error.response.data.message)) {
        console.log('Validation errors:');
        error.response.data.message.forEach(msg => console.log('  -', msg));
      }
    }
  }
}

async function runTests() {
  await testRegistration();
  await testWeakPassword();
}

runTests();
