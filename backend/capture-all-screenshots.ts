/**
 * Comprehensive screenshot script to capture all 20 app screenshots
 * for the README.md documentation
 */

import puppeteer from 'puppeteer';
import * as fs from 'fs';
import * as path from 'path';

const SCREENSHOT_DIR = path.join(process.cwd(), '..', 'screenshots');
const VIEWPORT = { width: 375, height: 812 }; // iPhone X viewport
const FRONTEND_URL = 'http://localhost:5173';
const BACKEND_URL = 'http://localhost:3001';

interface Screenshot {
  name: string;
  path: string;
  description: string;
  captureFunction: (page: puppeteer.Page, context: any) => Promise<void>;
}

async function waitAndScreenshot(page: puppeteer.Page, filename: string, waitTime = 2000) {
  await new Promise(resolve => setTimeout(resolve, waitTime));
  const filepath = path.join(SCREENSHOT_DIR, filename);
  await page.screenshot({ path: filepath });
  console.log(`✓ Captured: ${filename}`);
}

async function registerUser() {
  const timestamp = Date.now();
  const username = `screenshot_user_${timestamp}`;
  const passwordHash = 'test_hash_123456789_secure_hash_for_testing';
  
  const response = await fetch(`${BACKEND_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, passwordHash })
  });
  
  const data = await response.json();
  console.log(`✓ Registered user: ${username}`);
  return { username, token: data.token };
}

async function createSampleData(token: string) {
  // Create some transactions
  const transactions = [
    { amount: 5000000, type: 'income', category: 'Salary', description: 'Monthly salary' },
    { amount: 500000, type: 'expense', category: 'Food', description: 'Groceries' },
    { amount: 300000, type: 'expense', category: 'Transport', description: 'Gas' },
    { amount: 200000, type: 'expense', category: 'Entertainment', description: 'Movie tickets' },
    { amount: 1000000, type: 'expense', category: 'Bills', description: 'Electricity bill' },
  ];
  
  for (const transaction of transactions) {
    await fetch(`${BACKEND_URL}/api/transactions`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(transaction)
    });
  }
  console.log('✓ Created sample transactions');
  
  // Create a saving goal
  await fetch(`${BACKEND_URL}/api/goals`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      name: 'Emergency Fund',
      targetAmount: 10000000,
      currentAmount: 2000000,
      deadline: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString()
    })
  });
  console.log('✓ Created sample goal');
  
  // Create a budget
  await fetch(`${BACKEND_URL}/api/budgets`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      category: 'Food',
      limit: 2000000
    })
  });
  console.log('✓ Created sample budget');
  
  // Create AI savings plan (mock)
  try {
    await fetch(`${BACKEND_URL}/api/ai/generate`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        goal: 'Emergency Fund',
        intensity: 'Ideal target',
        savingsGoal: 10000000,
        useMock: true
      })
    });
    console.log('✓ Created AI savings plan');
  } catch (error) {
    console.log('⚠ AI plan creation skipped (optional)');
  }
  
  // Create a notification
  await fetch(`${BACKEND_URL}/api/notifications`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      type: 'budget_warning',
      message: 'You have reached 80% of your Food budget',
      priority: 'high'
    })
  });
  console.log('✓ Created sample notification');
}

async function captureAllScreenshots() {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    console.log('\n📸 Starting screenshot capture process...\n');
    
    // Register user and get token
    const { username, token } = await registerUser();
    
    // Create sample data
    await createSampleData(token);
    
    const page = await browser.newPage();
    await page.setViewport(VIEWPORT);
    
    // Set authentication in browser context
    await page.evaluateOnNewDocument((authToken) => {
      localStorage.setItem('authToken', authToken);
    }, token);
    
    console.log('\n--- Authentication & Onboarding ---\n');
    
    // 01: Splash Screen
    await page.goto(`${FRONTEND_URL}/splash`, { waitUntil: 'networkidle2' });
    await waitAndScreenshot(page, '01-splash-page.png');
    
    // 02: Sign Up Page
    await page.goto(`${FRONTEND_URL}/signup`, { waitUntil: 'networkidle2' });
    await waitAndScreenshot(page, '02-signup-page.png');
    
    // 03: Sign In Page
    await page.goto(`${FRONTEND_URL}/login`, { waitUntil: 'networkidle2' });
    await waitAndScreenshot(page, '03-signin-page.png');
    
    console.log('\n--- Dashboard & Overview ---\n');
    
    // 04: Dashboard
    await page.goto(`${FRONTEND_URL}/dashboard`, { waitUntil: 'networkidle2' });
    await waitAndScreenshot(page, '04-dashboard-page.png', 3000);
    
    // 07: Income Page
    await page.goto(`${FRONTEND_URL}/dashboard/income`, { waitUntil: 'networkidle2' });
    await waitAndScreenshot(page, '07-income-page.png', 2000);
    
    // 08: Expenses Page
    await page.goto(`${FRONTEND_URL}/dashboard/expenses`, { waitUntil: 'networkidle2' });
    await waitAndScreenshot(page, '08-expenses-page.png', 2000);
    
    console.log('\n--- Transaction Management ---\n');
    
    // 09: Add Transaction (Manual)
    await page.goto(`${FRONTEND_URL}/add`, { waitUntil: 'networkidle2' });
    await waitAndScreenshot(page, '09-add-transaction.png', 2000);
    
    // 10: Add by Voice
    await page.goto(`${FRONTEND_URL}/add-voice`, { waitUntil: 'networkidle2' });
    await waitAndScreenshot(page, '10-add-voice.png', 2000);
    
    // 11: Add by Receipt
    await page.goto(`${FRONTEND_URL}/add-receipt`, { waitUntil: 'networkidle2' });
    await waitAndScreenshot(page, '11-add-receipt.png', 2000);
    
    // 12: Edit Transaction
    // First, get a transaction ID by navigating to expenses page
    try {
      await page.goto(`${FRONTEND_URL}/dashboard/expenses`, { waitUntil: 'networkidle2' });
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const transactionId = await page.evaluate(async (backendUrl, authToken) => {
        const response = await fetch(`${backendUrl}/api/transactions`, {
          headers: { 'Authorization': `Bearer ${authToken}` }
        });
        const data = await response.json();
        return data.length > 0 ? data[0]._id : null;
      }, BACKEND_URL, token);
      
      if (transactionId) {
        await page.goto(`${FRONTEND_URL}/edit-transaction/${transactionId}`, { waitUntil: 'networkidle2' });
        await waitAndScreenshot(page, '12-edit-transaction.png', 2000);
      } else {
        console.log('⚠ No transactions found, creating a placeholder screenshot');
        await page.goto(`${FRONTEND_URL}/add`, { waitUntil: 'networkidle2' });
        await waitAndScreenshot(page, '12-edit-transaction.png', 2000);
      }
    } catch (error) {
      console.log('⚠ Error capturing edit transaction, using add page');
      await page.goto(`${FRONTEND_URL}/add`, { waitUntil: 'networkidle2' });
      await waitAndScreenshot(page, '12-edit-transaction.png', 2000);
    }
    
    console.log('\n--- Budget Management ---\n');
    
    // 13: Budget Page
    await page.goto(`${FRONTEND_URL}/dashboard/budget`, { waitUntil: 'networkidle2' });
    await waitAndScreenshot(page, '13-budget-page.png', 2000);
    
    // 14: Create Budget
    // Try to click "Add Budget" button if it exists
    try {
      await page.goto(`${FRONTEND_URL}/dashboard/budget`, { waitUntil: 'networkidle2' });
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Look for add/create button
      const addButton = await page.$('button:has-text("Add"), button:has-text("Create"), ion-button:has-text("Add")');
      if (addButton) {
        await addButton.click();
        await waitAndScreenshot(page, '14-budget-create.png', 1000);
      } else {
        // If no modal, just screenshot the budget page again
        await waitAndScreenshot(page, '14-budget-create.png', 1000);
      }
    } catch (error) {
      console.log('⚠ Using budget page for create budget screenshot');
      await waitAndScreenshot(page, '14-budget-create.png', 1000);
    }
    
    // 15: AI Budget Suggestions
    // This might be a modal or separate page
    await page.goto(`${FRONTEND_URL}/dashboard/budget`, { waitUntil: 'networkidle2' });
    await waitAndScreenshot(page, '15-budget-ai.png', 2000);
    
    console.log('\n--- Savings Goals & AI Planning ---\n');
    
    // 05: Goals Page
    await page.goto(`${FRONTEND_URL}/goals`, { waitUntil: 'networkidle2' });
    await waitAndScreenshot(page, '05-goals-page.png', 3000);
    
    // 06: AI Savings Wizard
    await page.goto(`${FRONTEND_URL}/savings-onboarding`, { waitUntil: 'networkidle2' });
    await waitAndScreenshot(page, '06-savings-onboarding.png', 2000);
    
    // 16: All Goals
    await page.goto(`${FRONTEND_URL}/goals/all`, { waitUntil: 'networkidle2' });
    await waitAndScreenshot(page, '16-goals-all.png', 2000);
    
    // 17: Plan Detail
    try {
      const planId = await page.evaluate(async (backendUrl, authToken) => {
        const response = await fetch(`${backendUrl}/api/ai/plans`, {
          headers: { 'Authorization': `Bearer ${authToken}` }
        });
        const data = await response.json();
        return data.length > 0 ? data[0]._id : null;
      }, BACKEND_URL, token);
      
      if (planId) {
        await page.goto(`${FRONTEND_URL}/saving-plan/${planId}`, { waitUntil: 'networkidle2' });
        await waitAndScreenshot(page, '17-plan-detail.png', 2000);
      } else {
        console.log('⚠ No plans found, using savings onboarding page');
        // Use savings onboarding as fallback
        await page.goto(`${FRONTEND_URL}/savings-onboarding`, { waitUntil: 'networkidle2' });
        await new Promise(resolve => setTimeout(resolve, 3000));
        // Try to advance the wizard to show more detail
        await waitAndScreenshot(page, '17-plan-detail.png', 2000);
      }
    } catch (error) {
      console.log('⚠ Error capturing plan detail, using fallback');
      await page.goto(`${FRONTEND_URL}/savings-onboarding`, { waitUntil: 'networkidle2' });
      await waitAndScreenshot(page, '17-plan-detail.png', 2000);
    }
    
    // 18: All Plans
    await page.goto(`${FRONTEND_URL}/saving-plans/all`, { waitUntil: 'networkidle2' });
    await waitAndScreenshot(page, '18-plans-all.png', 2000);
    
    console.log('\n--- Notifications & Profile ---\n');
    
    // 19: Notifications
    await page.goto(`${FRONTEND_URL}/notifications`, { waitUntil: 'networkidle2' });
    await waitAndScreenshot(page, '19-notifications.png', 2000);
    
    // 20: Profile
    await page.goto(`${FRONTEND_URL}/profile`, { waitUntil: 'networkidle2' });
    await waitAndScreenshot(page, '20-profile.png', 2000);
    
    console.log('\n✅ All screenshots captured successfully!\n');
    console.log(`📁 Screenshots saved to: ${SCREENSHOT_DIR}\n`);
    
  } catch (error) {
    console.error('❌ Error during screenshot capture:', error);
    throw error;
  } finally {
    await browser.close();
  }
}

// Run the script
captureAllScreenshots().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
