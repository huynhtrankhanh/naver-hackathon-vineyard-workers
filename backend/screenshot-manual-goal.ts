import puppeteer from 'puppeteer';

async function takeScreenshots() {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 375, height: 812 });
    
    // Register user
    const regRes = await fetch('http://localhost:3001/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'screenshotuser' + Date.now(), passwordHash: 'hash123' })
    });
    const { token } = await regRes.json();
    
    // Navigate and set auth
    await page.goto('http://localhost:5173/', { waitUntil: 'domcontentloaded' });
    await page.evaluate((t) => {
      localStorage.setItem('authToken', t);
    }, token);
    
    // Go to goals page
    await page.goto('http://localhost:5173/goals', { waitUntil: 'networkidle2', timeout: 30000 });
    await new Promise(r => setTimeout(r, 3000));
    
    // Screenshot 1: Initial state with Create Goal Manually button
    await page.screenshot({ path: '/tmp/manual-goal-button.png', fullPage: true });
    console.log('Screenshot 1: Saved to /tmp/manual-goal-button.png');
    
    // Click the Create Goal Manually button
    await page.evaluate(() => {
      const button = Array.from(document.querySelectorAll('button')).find(b => 
        b.textContent?.includes('Create Goal Manually')
      );
      if (button) button.click();
    });
    
    await new Promise(r => setTimeout(r, 1000));
    
    // Screenshot 2: Form expanded
    await page.screenshot({ path: '/tmp/manual-goal-form.png', fullPage: true });
    console.log('Screenshot 2: Saved to /tmp/manual-goal-form.png');
    
    // Fill the form
    await page.evaluate(() => {
      const inputs = document.querySelectorAll('input');
      inputs[0].value = 'Vacation Fund';
      inputs[0].dispatchEvent(new Event('input', { bubbles: true }));
      inputs[1].value = '5000000';
      inputs[1].dispatchEvent(new Event('input', { bubbles: true }));
    });
    
    await new Promise(r => setTimeout(r, 500));
    
    // Screenshot 3: Form filled
    await page.screenshot({ path: '/tmp/manual-goal-filled.png', fullPage: true });
    console.log('Screenshot 3: Saved to /tmp/manual-goal-filled.png');
    
    console.log('\nAll screenshots saved successfully!');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await browser.close();
  }
}

takeScreenshots();
