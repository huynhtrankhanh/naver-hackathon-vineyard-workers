import puppeteer from 'puppeteer';

async function testAuthFlow() {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 375, height: 812 });
    
    // Register user
    const timestamp = Date.now();
    const username = `test${timestamp}`;
    
    const registerResponse = await fetch('http://localhost:3001/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, passwordHash: 'hash123' })
    });
    const { token } = await registerResponse.json();
    console.log('✓ Token:', token.substring(0, 20) + '...');
    
    // Create a saving plan
    const planResponse = await fetch('http://localhost:3001/api/ai/generate', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        goal: 'Emergency Fund',
        intensity: 'Ideal target',
        savingsGoal: 400,
        useMock: true
      })
    });
    const plan = await planResponse.json();
    console.log('✓ Plan created:', plan._id);
    
    // Navigate to app first
    await page.goto('http://localhost:5173/', { waitUntil: 'networkidle2' });
    
    // Set localStorage
    await page.evaluate((authToken, user) => {
      localStorage.setItem('authToken', authToken);
      localStorage.setItem('username', user);
    }, token, username);
    
    console.log('✓ Set auth in browser');
    
    // Navigate to goals
    await page.goto('http://localhost:5173/goals', { waitUntil: 'networkidle2', timeout: 30000 });
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Check page content
    const bodyText = await page.evaluate(() => document.body.innerText);
    console.log('✓ Page text preview:', bodyText.substring(0, 200));
    
    // Check console errors
    page.on('console', msg => console.log('Browser console:', msg.text()));
    page.on('pageerror', error => console.log('Browser error:', error));
    
    // Take screenshots
    await page.screenshot({ path: '/tmp/goals-page-debug.png', fullPage: true });
    console.log('✓ Screenshot saved');
    
    // Check tab bar
    const tabs = await page.evaluate(() => {
      const nav = document.querySelector('nav');
      return nav ? nav.innerHTML : 'No nav found';
    });
    console.log('✓ Nav HTML:', tabs.substring(0, 300));
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await browser.close();
  }
}

testAuthFlow();
