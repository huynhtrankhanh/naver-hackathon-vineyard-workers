import puppeteer from 'puppeteer';

async function testDashboard() {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 375, height: 812 });
    
    // Enable console logging
    page.on('console', msg => console.log('BROWSER:', msg.text()));
    page.on('pageerror', error => console.log('ERROR:', error.message));
    
    // Register user
    const registerResponse = await fetch('http://localhost:3001/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: `test${Date.now()}`, passwordHash: 'hash123' })
    });
    const { token, username } = await registerResponse.json();
    
    // Create plan
    await fetch('http://localhost:3001/api/ai/generate', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ goal: 'Emergency Fund', intensity: 'Ideal target', savingsGoal: 400, useMock: true })
    });
    
    // Navigate and set auth
    await page.goto('http://localhost:5173/', { waitUntil: 'domcontentloaded' });
    await page.evaluate((t, u) => {
      localStorage.setItem('authToken', t);
      localStorage.setItem('username', u);
    }, token, username);
    
    // Navigate to dashboard
    await page.goto('http://localhost:5173/dashboard', { waitUntil: 'networkidle2', timeout: 30000 });
    await new Promise(r => setTimeout(r, 3000));
    
    const url = page.url();
    console.log('Current URL:', url);
    
    await page.screenshot({ path: '/tmp/dashboard-test.png' });
    
    // Now try goals page
    await page.goto('http://localhost:5173/goals', { waitUntil: 'networkidle2', timeout: 30000 });
    await new Promise(r => setTimeout(r, 3000));
    
    const goalsUrl = page.url();
    console.log('Goals URL:', goalsUrl);
    
    const title = await page.evaluate(() => {
      const h = document.querySelector('h1, h2, header');
      return h ? h.textContent : 'No header';
    });
    console.log('Page title:', title);
    
    await page.screenshot({ path: '/tmp/goals-test.png', fullPage: true });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await browser.close();
  }
}

testDashboard();
