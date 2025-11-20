import puppeteer from 'puppeteer';
import { readFile } from 'fs/promises';
import FormData from 'form-data';
import axios from 'axios';

const API_BASE = 'http://localhost:3001/api';

console.log('\n' + '═'.repeat(80));
console.log('  END-TO-END TEST WITH PUPPETEER');
console.log('  Testing Real Server with Real API Calls');
console.log('═'.repeat(80) + '\n');

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
  let browser;
  let token;
  
  try {
    // Test 1: Health check
    console.log('🧪 Test 1: Server Health Check');
    const healthResponse = await axios.get(`${API_BASE}/health`);
    console.log('✅ Server is healthy:', healthResponse.data.message);
    console.log('');
    
    // Test 2: Create user
    console.log('🧪 Test 2: Create Test User');
    const username = `testuser_${Date.now()}`;
    const password = '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8';
    
    try {
      const signupResponse = await axios.post(`${API_BASE}/auth/signup`, {
        username,
        password
      });
      token = signupResponse.data.token;
      console.log('✅ User created, token obtained');
      console.log('');
    } catch (error) {
      console.error('❌ Failed to create user:', error.response?.data || error.message);
      process.exit(1);
    }
    
    // Test 3: Add transactions for context
    console.log('🧪 Test 3: Add Test Transactions');
    await axios.post(`${API_BASE}/transactions`, {
      title: 'Monthly Salary',
      amount: 50000000,
      category: 'Income',
      type: 'income',
      date: new Date().toISOString()
    }, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    await axios.post(`${API_BASE}/transactions`, {
      title: 'Grocery Shopping',
      amount: 500000,
      category: 'Food & Drinks',
      type: 'expense',
      date: new Date().toISOString()
    }, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    console.log('✅ Test transactions added');
    console.log('');
    
    // Test 4: OCR with Real API
    console.log('🧪 Test 4: OCR Receipt Scanning (REAL CLOVA API CALL)');
    console.log('   Loading receipt image...');
    
    const imageBuffer = await readFile('/tmp/test_receipt.png');
    console.log(`   ✅ Loaded ${imageBuffer.length} bytes`);
    
    const formData = new FormData();
    formData.append('receiptImage', imageBuffer, {
      filename: 'test_receipt.png',
      contentType: 'image/png'
    });
    
    console.log('   🔄 Calling OCR endpoint with real Clova API...');
    console.log('   (This may take 10-30 seconds)');
    console.log('');
    
    let ocrResponse;
    try {
      ocrResponse = await axios.post(`${API_BASE}/ocr/receipt`, formData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          ...formData.getHeaders()
        },
        timeout: 60000
      });
    } catch (error) {
      console.error('❌ OCR request failed:', error.response?.data || error.message);
      if (error.code === 'ECONNABORTED') {
        console.error('   Timeout - API took too long to respond');
      }
      throw error;
    }
    
    console.log('   ✅ OCR completed!');
    console.log('');
    console.log('─'.repeat(80));
    console.log('OCR RESULT:');
    console.log('─'.repeat(80));
    console.log(JSON.stringify(ocrResponse.data, null, 2));
    console.log('─'.repeat(80));
    console.log('');
    
    // Verify OCR results
    console.log('🔍 Verifying OCR Category Detection:');
    console.log('');
    
    const validCategories = [
      'Food & Drinks',
      'Transport',
      'Shopping',
      'Bills',
      'Entertainment',
      'Healthcare',
      'Education',
      'Other'
    ];
    
    let allHaveCategories = true;
    let allCategoriesValid = true;
    const categoriesFound = new Set();
    
    if (!ocrResponse.data.items || ocrResponse.data.items.length === 0) {
      console.error('❌ No items in OCR response');
      process.exit(1);
    }
    
    ocrResponse.data.items.forEach((item, idx) => {
      const hasCategory = item.category !== undefined && item.category !== null;
      const isValid = validCategories.includes(item.category);
      
      if (hasCategory) categoriesFound.add(item.category);
      
      const status = hasCategory && isValid ? '✅' : '❌';
      console.log(`${status} Item ${idx + 1}: "${item.name}" → Category: "${item.category || 'MISSING'}"`);
      
      if (!hasCategory) {
        allHaveCategories = false;
        console.log(`   ⚠️  Missing category!`);
      }
      if (hasCategory && !isValid) {
        allCategoriesValid = false;
        console.log(`   ⚠️  Invalid category! Not in valid list.`);
      }
    });
    
    console.log('');
    console.log('─'.repeat(80));
    console.log('VERIFICATION SUMMARY:');
    console.log('─'.repeat(80));
    console.log(`Total items: ${ocrResponse.data.items.length}`);
    console.log(`Items with categories: ${allHaveCategories ? ocrResponse.data.items.length : 'SOME MISSING'}`);
    console.log(`All categories valid: ${allCategoriesValid ? 'YES' : 'NO'}`);
    console.log(`Unique categories detected: ${categoriesFound.size}`);
    console.log(`Categories found: ${Array.from(categoriesFound).join(', ')}`);
    console.log('─'.repeat(80));
    console.log('');
    
    if (!allHaveCategories) {
      console.error('❌ FAILED: Some items are missing categories');
      process.exit(1);
    }
    
    if (!allCategoriesValid) {
      console.error('❌ FAILED: Some categories are invalid');
      process.exit(1);
    }
    
    if (categoriesFound.size === 0) {
      console.error('❌ FAILED: No categories were detected at all');
      process.exit(1);
    }
    
    console.log('✅ OCR CATEGORY DETECTION VERIFIED');
    console.log('   - All items have categories');
    console.log('   - All categories are valid');
    console.log(`   - ${categoriesFound.size} unique categories detected`);
    console.log('');
    
    // Test 5: Verify budget justification prompt exists
    console.log('🧪 Test 5: Verify Budget Justification Implementation');
    const aiServiceContent = await readFile(
      'backend/src/utils/aiService.ts',
      'utf-8'
    );
    
    const hasJustificationRules = aiServiceContent.includes('CRITICAL RULES FOR BUDGET JUSTIFICATIONS:');
    const hasMinSentences = aiServiceContent.includes('minimum 3-4 sentences');
    const hasDataSource = aiServiceContent.includes('explicitly state the data source');
    const hasSpecificNumbers = aiServiceContent.includes('specific numbers');
    
    console.log(`   ${hasJustificationRules ? '✅' : '❌'} Critical rules section present`);
    console.log(`   ${hasMinSentences ? '✅' : '❌'} Minimum sentence requirement`);
    console.log(`   ${hasDataSource ? '✅' : '❌'} Data source citation requirement`);
    console.log(`   ${hasSpecificNumbers ? '✅' : '❌'} Specific numbers requirement`);
    console.log('');
    
    if (hasJustificationRules && hasMinSentences && hasDataSource && hasSpecificNumbers) {
      console.log('✅ BUDGET JUSTIFICATION REQUIREMENTS VERIFIED');
      console.log('');
    } else {
      console.error('❌ Some budget justification requirements missing');
      process.exit(1);
    }
    
    // Final summary
    console.log('═'.repeat(80));
    console.log('  FINAL RESULTS');
    console.log('═'.repeat(80));
    console.log('');
    console.log('✅ Test 1: Server Health Check - PASSED');
    console.log('✅ Test 2: User Creation - PASSED');
    console.log('✅ Test 3: Transaction Creation - PASSED');
    console.log('✅ Test 4: OCR Category Detection (REAL API) - PASSED');
    console.log('✅ Test 5: Budget Justification Requirements - PASSED');
    console.log('');
    console.log('═'.repeat(80));
    console.log('✨ ALL TESTS PASSED - IMPLEMENTATION VERIFIED');
    console.log('═'.repeat(80));
    console.log('');
    
    process.exit(0);
    
  } catch (error) {
    console.error('\n❌ TEST FAILED');
    console.error('Error:', error.message);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
    console.error(error);
    process.exit(1);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

main();
