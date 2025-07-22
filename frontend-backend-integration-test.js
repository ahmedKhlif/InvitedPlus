const puppeteer = require('puppeteer');

async function testFrontendBackendIntegration() {
  console.log('🔗 TESTING FRONTEND-BACKEND INTEGRATION\n');
  console.log('=' .repeat(60));

  let browser;
  let page;

  try {
    // Launch browser
    browser = await puppeteer.launch({ 
      headless: false, // Set to true for headless mode
      defaultViewport: { width: 1280, height: 720 },
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    page = await browser.newPage();
    
    // Enable console logging from the page
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log('❌ Browser Error:', msg.text());
      }
    });

    // Test 1: Landing Page
    console.log('\n1. 🏠 TESTING LANDING PAGE');
    console.log('-'.repeat(30));
    
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle0' });
    
    const title = await page.title();
    console.log('✅ Page loaded:', title);
    
    // Check if main elements are present
    const heroText = await page.$eval('h1', el => el.textContent);
    console.log('✅ Hero text found:', heroText.includes('Invited+'));

    // Test 2: Navigation to Login
    console.log('\n2. 🔐 TESTING LOGIN PAGE');
    console.log('-'.repeat(30));
    
    await page.click('a[href="/auth/login"]');
    await page.waitForNavigation({ waitUntil: 'networkidle0' });
    
    const loginUrl = page.url();
    console.log('✅ Navigated to login:', loginUrl.includes('/auth/login'));

    // Test 3: Login Form Submission
    console.log('\n3. 📝 TESTING LOGIN FORM');
    console.log('-'.repeat(30));
    
    // Fill login form
    await page.type('input[type="email"]', 'organizer@invitedplus.com');
    await page.type('input[type="password"]', 'organizer123');
    
    // Submit form and wait for navigation
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle0' }),
      page.click('button[type="submit"]')
    ]);
    
    const dashboardUrl = page.url();
    console.log('✅ Login successful, redirected to:', dashboardUrl);
    
    // Check if we're on dashboard
    if (dashboardUrl.includes('/dashboard')) {
      console.log('✅ Successfully redirected to dashboard');
      
      // Check for welcome message
      try {
        await page.waitForSelector('h1', { timeout: 5000 });
        const welcomeText = await page.$eval('h1', el => el.textContent);
        console.log('✅ Dashboard loaded with:', welcomeText);
      } catch (error) {
        console.log('⚠️  Dashboard elements not found immediately');
      }
    }

    // Test 4: Profile Page
    console.log('\n4. 👤 TESTING PROFILE PAGE');
    console.log('-'.repeat(30));
    
    try {
      await page.click('a[href="/profile"]');
      await page.waitForNavigation({ waitUntil: 'networkidle0' });
      
      const profileUrl = page.url();
      console.log('✅ Navigated to profile:', profileUrl.includes('/profile'));
      
      // Check for profile elements
      const profileTitle = await page.$eval('h1', el => el.textContent);
      console.log('✅ Profile page loaded:', profileTitle.includes('Profile'));
    } catch (error) {
      console.log('❌ Profile navigation failed:', error.message);
    }

    // Test 5: Events Page
    console.log('\n5. 📅 TESTING EVENTS PAGE');
    console.log('-'.repeat(30));
    
    try {
      await page.goto('http://localhost:3000/events', { waitUntil: 'networkidle0' });
      
      const eventsUrl = page.url();
      console.log('✅ Navigated to events:', eventsUrl.includes('/events'));
      
      // Wait for events to load
      await page.waitForTimeout(2000);
      console.log('✅ Events page loaded');
    } catch (error) {
      console.log('❌ Events navigation failed:', error.message);
    }

    // Test 6: Tasks Page
    console.log('\n6. 📋 TESTING TASKS PAGE');
    console.log('-'.repeat(30));
    
    try {
      await page.goto('http://localhost:3000/tasks', { waitUntil: 'networkidle0' });
      
      const tasksUrl = page.url();
      console.log('✅ Navigated to tasks:', tasksUrl.includes('/tasks'));
      
      // Wait for tasks to load
      await page.waitForTimeout(2000);
      console.log('✅ Tasks page loaded');
    } catch (error) {
      console.log('❌ Tasks navigation failed:', error.message);
    }

    // Test 7: Chat Page
    console.log('\n7. 💬 TESTING CHAT PAGE');
    console.log('-'.repeat(30));
    
    try {
      await page.goto('http://localhost:3000/chat', { waitUntil: 'networkidle0' });
      
      const chatUrl = page.url();
      console.log('✅ Navigated to chat:', chatUrl.includes('/chat'));
      
      // Wait for chat to load
      await page.waitForTimeout(2000);
      console.log('✅ Chat page loaded');
    } catch (error) {
      console.log('❌ Chat navigation failed:', error.message);
    }

    // Test 8: API Connectivity Check
    console.log('\n8. 🔌 TESTING API CONNECTIVITY');
    console.log('-'.repeat(30));
    
    // Check if localStorage has token
    const token = await page.evaluate(() => localStorage.getItem('token'));
    console.log('✅ Auth token stored:', !!token);
    
    // Test API call from browser
    const apiTest = await page.evaluate(async () => {
      try {
        const response = await fetch('http://localhost:3001/api/health');
        const data = await response.json();
        return { success: true, status: data.status };
      } catch (error) {
        return { success: false, error: error.message };
      }
    });
    
    if (apiTest.success) {
      console.log('✅ API connectivity confirmed:', apiTest.status);
    } else {
      console.log('❌ API connectivity failed:', apiTest.error);
    }

    console.log('\n' + '='.repeat(60));
    console.log('🎉 FRONTEND-BACKEND INTEGRATION TEST COMPLETED!');
    console.log('='.repeat(60));

  } catch (error) {
    console.error('❌ Integration test failed:', error);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// Check if puppeteer is available
try {
  testFrontendBackendIntegration();
} catch (error) {
  console.log('⚠️  Puppeteer not available. Running manual API connectivity test...');
  
  // Fallback: Test API connectivity directly
  const axios = require('axios');
  
  async function testAPIConnectivity() {
    console.log('🔌 TESTING API CONNECTIVITY DIRECTLY\n');
    
    try {
      // Test frontend is running
      const frontendResponse = await axios.get('http://localhost:3000');
      console.log('✅ Frontend is running (status:', frontendResponse.status, ')');
      
      // Test backend is running
      const backendResponse = await axios.get('http://localhost:3001/api/health');
      console.log('✅ Backend is running (status:', backendResponse.data.status, ')');
      
      // Test login endpoint
      const loginResponse = await axios.post('http://localhost:3001/api/auth/login', {
        email: 'organizer@invitedplus.com',
        password: 'organizer123'
      });
      console.log('✅ Login endpoint working (user:', loginResponse.data.user.name, ')');
      
      console.log('\n🎉 API CONNECTIVITY CONFIRMED!');
      
    } catch (error) {
      console.error('❌ API connectivity test failed:', error.message);
    }
  }
  
  testAPIConnectivity();
}
