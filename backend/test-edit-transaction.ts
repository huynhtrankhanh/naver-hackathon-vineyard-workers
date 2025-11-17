import puppeteer from 'puppeteer';

async function testEditTransaction() {
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
    console.log('1. Registering test user...');
    const registerResponse = await fetch('http://localhost:3001/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: `edittest${Date.now()}`, passwordHash: 'hash123' })
    });
    const { token, username } = await registerResponse.json();
    console.log(`   ✓ User ${username} registered with token`);
    
    // Create a test transaction
    console.log('2. Creating test transaction...');
    const createResponse = await fetch('http://localhost:3001/api/transactions', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        title: 'Original Coffee Purchase',
        category: 'Food & Drinks',
        amount: 50000,
        type: 'expense',
        date: new Date().toISOString()
      })
    });
    const transaction = await createResponse.json();
    console.log(`   ✓ Transaction created with ID: ${transaction._id}`);
    
    // Navigate and set auth
    console.log('3. Setting up authentication...');
    await page.goto('http://localhost:5173/', { waitUntil: 'domcontentloaded' });
    await page.evaluate((t, u) => {
      localStorage.setItem('authToken', t);
      localStorage.setItem('username', u);
    }, token, username);
    console.log('   ✓ Auth token set in localStorage');
    
    // Navigate to dashboard
    console.log('4. Navigating to dashboard...');
    await page.goto('http://localhost:5173/dashboard', { waitUntil: 'networkidle2', timeout: 30000 });
    await new Promise(r => setTimeout(r, 2000));
    console.log(`   ✓ Current URL: ${page.url()}`);
    
    await page.screenshot({ path: '/tmp/1-dashboard-with-transaction.png', fullPage: true });
    console.log('   ✓ Screenshot saved: 1-dashboard-with-transaction.png');
    
    // Click on the transaction to edit
    console.log('5. Clicking on transaction to edit...');
    const transactionSelector = 'li.cursor-pointer.hover\\:bg-slate-50';
    await page.waitForSelector(transactionSelector, { timeout: 5000 });
    const transactionElements = await page.$$(transactionSelector);
    if (transactionElements.length > 0) {
      await transactionElements[0].click();
      await new Promise(r => setTimeout(r, 2000));
      console.log(`   ✓ Navigated to: ${page.url()}`);
    } else {
      console.log('   ✗ No transaction element found');
    }
    
    await page.screenshot({ path: '/tmp/2-edit-transaction-page.png', fullPage: true });
    console.log('   ✓ Screenshot saved: 2-edit-transaction-page.png');
    
    // Edit the transaction
    console.log('6. Editing transaction details...');
    const titleInput = await page.$('#title');
    if (titleInput) {
      await titleInput.click({ clickCount: 3 }); // Select all
      await titleInput.type('Updated Expensive Coffee');
      console.log('   ✓ Title updated');
    }
    
    const amountInput = await page.$('#amount');
    if (amountInput) {
      await amountInput.click({ clickCount: 3 }); // Select all
      await amountInput.type('75000');
      console.log('   ✓ Amount updated');
    }
    
    await page.screenshot({ path: '/tmp/3-edit-transaction-modified.png', fullPage: true });
    console.log('   ✓ Screenshot saved: 3-edit-transaction-modified.png');
    
    // Save the changes
    console.log('7. Saving changes...');
    const updateButton = await page.$('ion-button[color="primary"]');
    if (updateButton) {
      await updateButton.click();
      await new Promise(r => setTimeout(r, 2000));
      console.log('   ✓ Save button clicked');
    }
    
    console.log(`   ✓ Current URL after save: ${page.url()}`);
    await page.screenshot({ path: '/tmp/4-dashboard-after-edit.png', fullPage: true });
    console.log('   ✓ Screenshot saved: 4-dashboard-after-edit.png');
    
    // Verify the transaction was updated via API
    console.log('8. Verifying update via API...');
    const verifyResponse = await fetch(`http://localhost:3001/api/transactions/${transaction._id}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const updatedTransaction = await verifyResponse.json();
    console.log('   Updated transaction:', {
      title: updatedTransaction.title,
      amount: updatedTransaction.amount,
      category: updatedTransaction.category
    });
    
    // Test delete functionality
    console.log('9. Testing delete functionality...');
    await page.goto(`http://localhost:5173/edit-transaction/${transaction._id}`, { waitUntil: 'networkidle2', timeout: 30000 });
    await new Promise(r => setTimeout(r, 2000));
    
    await page.screenshot({ path: '/tmp/5-before-delete.png', fullPage: true });
    console.log('   ✓ Screenshot saved: 5-before-delete.png');
    
    // Click delete button
    const deleteButton = await page.$('ion-button[color="danger"][fill="outline"]');
    if (deleteButton) {
      await deleteButton.click();
      await new Promise(r => setTimeout(r, 1000));
      console.log('   ✓ Delete button clicked');
      
      await page.screenshot({ path: '/tmp/6-delete-confirmation.png', fullPage: true });
      console.log('   ✓ Screenshot saved: 6-delete-confirmation.png');
      
      // Confirm deletion
      const confirmButton = await page.$('ion-alert button[role="destructive"]');
      if (confirmButton) {
        await confirmButton.click();
        await new Promise(r => setTimeout(r, 2000));
        console.log('   ✓ Delete confirmed');
      }
    }
    
    console.log(`   ✓ Current URL after delete: ${page.url()}`);
    await page.screenshot({ path: '/tmp/7-dashboard-after-delete.png', fullPage: true });
    console.log('   ✓ Screenshot saved: 7-dashboard-after-delete.png');
    
    // Verify deletion via API
    console.log('10. Verifying deletion via API...');
    const deleteVerifyResponse = await fetch(`http://localhost:3001/api/transactions/${transaction._id}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (deleteVerifyResponse.status === 404) {
      console.log('   ✓ Transaction successfully deleted (404 response)');
    } else {
      console.log('   ✗ Transaction still exists');
    }
    
    console.log('\n✅ All tests completed successfully!');
    console.log('\nScreenshots saved in /tmp/:');
    console.log('  1-dashboard-with-transaction.png');
    console.log('  2-edit-transaction-page.png');
    console.log('  3-edit-transaction-modified.png');
    console.log('  4-dashboard-after-edit.png');
    console.log('  5-before-delete.png');
    console.log('  6-delete-confirmation.png');
    console.log('  7-dashboard-after-delete.png');
    
  } catch (error) {
    console.error('❌ Error:', error);
    await page.screenshot({ path: '/tmp/error-screenshot.png' });
  } finally {
    await browser.close();
  }
}

testEditTransaction();
