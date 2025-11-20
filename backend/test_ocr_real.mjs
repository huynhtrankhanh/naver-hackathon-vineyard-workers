import { readFile } from 'fs/promises';
import FormData from 'form-data';
import axios from 'axios';
import crypto from 'crypto';

const API_BASE = 'http://localhost:3001/api';

console.log('\n' + '═'.repeat(80));
console.log('  REAL END-TO-END OCR TEST');
console.log('  Testing Actual Clova API Integration');
console.log('═'.repeat(80) + '\n');

async function main() {
  try {
    // Test 1: Server health
    console.log('🧪 Test 1: Server Health Check');
    const healthResponse = await axios.get(`${API_BASE}/health`);
    console.log('✅', healthResponse.data.message);
    console.log('');
    
    // Test 2: Create user
    console.log('🧪 Test 2: Create Test User');
    const username = `testuser${Date.now()}`;
    const passwordHash = crypto.createHash('sha256').update('testpassword123').digest('hex');
    
    let token;
    try {
      const registerResponse = await axios.post(`${API_BASE}/auth/register`, {
        username,
        passwordHash
      });
      token = registerResponse.data.token;
      console.log('✅ User created successfully');
    } catch (error) {
      if (error.response?.status === 409) {
        // User exists, try login
        console.log('   User exists, attempting login...');
        const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
          username,
          passwordHash
        });
        token = loginResponse.data.token;
        console.log('✅ Logged in successfully');
      } else {
        throw error;
      }
    }
    console.log('');
    
    // Test 3: OCR with REAL Clova API
    console.log('🧪 Test 3: OCR Receipt Scanning with REAL CLOVA API');
    console.log('');
    console.log('   📄 Loading test receipt...');
    const imageBuffer = await readFile('/tmp/test_receipt.png');
    console.log(`   ✅ Loaded ${imageBuffer.length} bytes`);
    console.log('');
    console.log('   🔄 Calling OCR endpoint...');
    console.log('   This will make a REAL API call to Clova HCX-005');
    console.log('   Expected wait time: 10-30 seconds');
    console.log('');
    
    const formData = new FormData();
    formData.append('receiptImage', imageBuffer, {
      filename: 'receipt.png',
      contentType: 'image/png'
    });
    
    const startTime = Date.now();
    let ocrResponse;
    
    try {
      ocrResponse = await axios.post(`${API_BASE}/ocr/receipt`, formData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          ...formData.getHeaders()
        },
        timeout: 60000,
        maxBodyLength: Infinity,
        maxContentLength: Infinity
      });
      
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
      console.log(`   ✅ OCR completed in ${elapsed}s`);
      
    } catch (error) {
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
      console.error(`\n   ❌ OCR failed after ${elapsed}s`);
      console.error('   Error:', error.response?.data || error.message);
      if (error.code === 'ECONNABORTED') {
        console.error('   Reason: Timeout (>60s)');
      }
      throw error;
    }
    
    console.log('');
    console.log('═'.repeat(80));
    console.log('OCR API RESPONSE:');
    console.log('═'.repeat(80));
    console.log(JSON.stringify(ocrResponse.data, null, 2));
    console.log('═'.repeat(80));
    console.log('');
    
    // Verify results
    console.log('�� VERIFICATION:');
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
    
    if (!ocrResponse.data.items || ocrResponse.data.items.length === 0) {
      console.error('❌ FAILED: No items in response');
      process.exit(1);
    }
    
    console.log(`Found ${ocrResponse.data.items.length} items:\n`);
    
    let allValid = true;
    const categoriesDetected = new Set();
    
    ocrResponse.data.items.forEach((item, idx) => {
      const hasCategory = item.category !== undefined && item.category !== null;
      const isValid = hasCategory && validCategories.includes(item.category);
      
      if (hasCategory) categoriesDetected.add(item.category);
      
      const status = isValid ? '✅' : '❌';
      const priceVND = item.price.toLocaleString();
      console.log(`${status} ${idx + 1}. ${item.name}`);
      console.log(`      Price: ${priceVND} VND`);
      console.log(`      Category: "${item.category || 'MISSING'}"`);
      
      if (!hasCategory) {
        console.log(`      ⚠️  No category detected!`);
        allValid = false;
      } else if (!isValid) {
        console.log(`      ⚠️  Invalid category (not in valid list)!`);
        allValid = false;
      }
      console.log('');
    });
    
    console.log('═'.repeat(80));
    console.log('TEST RESULTS:');
    console.log('═'.repeat(80));
    console.log(`Total items detected: ${ocrResponse.data.items.length}`);
    console.log(`Items with categories: ${allValid ? ocrResponse.data.items.length : 'SOME MISSING/INVALID'}`);
    console.log(`Unique categories: ${categoriesDetected.size}`);
    console.log(`Categories detected: ${Array.from(categoriesDetected).join(', ')}`);
    console.log('═'.repeat(80));
    console.log('');
    
    if (!allValid) {
      console.error('❌ TEST FAILED');
      console.error('   Some items missing categories or have invalid categories');
      console.error('');
      process.exit(1);
    }
    
    if (categoriesDetected.size === 0) {
      console.error('❌ TEST FAILED');
      console.error('   No categories were detected at all');
      console.error('');
      process.exit(1);
    }
    
    console.log('✅ TEST PASSED');
    console.log('');
    console.log('VERIFICATION COMPLETE:');
    console.log(`  ✅ All ${ocrResponse.data.items.length} items have valid categories`);
    console.log(`  ✅ ${categoriesDetected.size} different categories detected`);
    console.log(`  ✅ Real Clova API integration working`);
    console.log(`  ✅ Category detection implemented correctly`);
    console.log('');
    console.log('═'.repeat(80));
    console.log('✨ OCR CATEGORY DETECTION VERIFIED WITH REAL API');
    console.log('═'.repeat(80));
    console.log('');
    
    process.exit(0);
    
  } catch (error) {
    console.error('\n❌ TEST FAILED');
    console.error('Error:', error.message);
    if (error.response) {
      console.error('API Response:', error.response.data);
    }
    console.error('');
    process.exit(1);
  }
}

main();
