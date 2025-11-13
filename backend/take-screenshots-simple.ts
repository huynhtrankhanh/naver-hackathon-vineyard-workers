/**
 * Simplified screenshot script
 */

import puppeteer from 'puppeteer';

async function takeScreenshots() {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 375, height: 812 });
    
    // Register user via API and get token
    const timestamp = Date.now();
    const username = `test${timestamp}`;
    
    const registerResponse = await fetch('http://localhost:3001/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, passwordHash: 'hash123' })
    });
    const { token } = await registerResponse.json();
    console.log(`✓ Registered user: ${username}`);
    
    // Create a saving plan
    await fetch('http://localhost:3001/api/ai/generate', {
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
    console.log('✓ Created saving plan');
    
    // Set auth in browser
    await page.evaluateOnNewDocument((authToken) => {
      localStorage.setItem('authToken', authToken);
    }, token);
    
    // Navigate to goals page
    console.log('Navigating to Saving page...');
    await page.goto('http://localhost:5173/goals', { waitUntil: 'networkidle2', timeout: 30000 });
    await new Promise(resolve => setTimeout(resolve, 3000));
    await page.screenshot({ path: '/tmp/saving-page-full.png', fullPage: true });
    console.log('✓ Captured Saving page (full)');
    
    // Take viewport screenshot
    await page.screenshot({ path: '/tmp/saving-page-viewport.png' });
    console.log('✓ Captured Saving page (viewport)');
    
    // Check tabs
    const tabText = await page.evaluate(() => {
      const tabs = Array.from(document.querySelectorAll('nav button span'));
      return tabs.map(t => t.textContent);
    });
    console.log('✓ Tab labels:', tabText);
    
    console.log('\n✅ Screenshots captured!');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await browser.close();
  }
}

takeScreenshots();
