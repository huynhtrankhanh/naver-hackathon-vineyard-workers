/**
 * Script to take screenshots of the app for testing
 */

import puppeteer from 'puppeteer';

async function takeScreenshots() {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 375, height: 812 }); // iPhone X viewport
    
    // Navigate to the splash screen
    console.log('Navigating to splash screen...');
    await page.goto('http://localhost:5173/', { waitUntil: 'networkidle2' });
    await page.screenshot({ path: '/tmp/01-splash.png' });
    console.log('✓ Captured splash screen');
    
    // Click sign up
    await page.click('a[href="/signup"]');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: '/tmp/02-signup.png' });
    console.log('✓ Captured signup page');
    
    // Go to login instead
    await page.click('a[href="/login"]');
    await page.waitForTimeout(1000);
    
    // Register a new user first (via API)
    const timestamp = Date.now();
    const username = `test${timestamp}`;
    
    // Register
    await page.evaluate(async (user) => {
      const response = await fetch('http://localhost:3001/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: user, passwordHash: 'hash123' })
      });
      const data = await response.json();
      localStorage.setItem('authToken', data.token);
      localStorage.setItem('username', data.username);
    }, username);
    
    console.log(`✓ Registered user: ${username}`);
    
    // Navigate to dashboard
    await page.goto('http://localhost:5173/dashboard', { waitUntil: 'networkidle2' });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: '/tmp/03-dashboard.png' });
    console.log('✓ Captured dashboard');
    
    // Create a saving plan via API
    await page.evaluate(async () => {
      const token = localStorage.getItem('authToken');
      const response = await fetch('http://localhost:3001/api/ai/generate', {
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
      return await response.json();
    });
    
    console.log('✓ Created saving plan');
    
    // Navigate to Goals/Saving page
    await page.goto('http://localhost:5173/goals', { waitUntil: 'networkidle2' });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: '/tmp/04-saving-page.png', fullPage: true });
    console.log('✓ Captured Saving page with plans');
    
    // Check tab bar
    await page.waitForSelector('nav button');
    const tabs = await page.$$eval('nav button span', spans => spans.map(s => s.textContent));
    console.log('✓ Tab labels:', tabs);
    
    console.log('\n✅ All screenshots captured successfully!');
    console.log('Screenshots saved to:');
    console.log('  - /tmp/01-splash.png');
    console.log('  - /tmp/02-signup.png');
    console.log('  - /tmp/03-dashboard.png');
    console.log('  - /tmp/04-saving-page.png');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await browser.close();
  }
}

takeScreenshots();
