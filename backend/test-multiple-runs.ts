/**
 * Test budget parsing multiple times with actual API to detect failures
 */

import { streamClovaAPI, ClovaMessage } from './src/utils/clovaClient.js';
import * as dotenv from 'dotenv';

dotenv.config();

async function testMultipleTimes() {
  console.log('Testing budget limit parsing MULTIPLE TIMES with actual API...\n');
  console.log('This will help identify intermittent failures\n');
  
  const numTests = 10;
  const results = [];
  
  for (let i = 1; i <= numTests; i++) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`TEST RUN ${i}/${numTests}`);
    console.log('='.repeat(60));
    
    const randomSuffix = Math.random().toString(36).substring(2, 15);
    const budgetTag = `BudgetLim_${randomSuffix}`;
    
    const systemPrompt = `You are a financial advisor AI. 

IMPORTANT: You must propose budget limits using this EXACT format at the END of your response:
<${budgetTag}>
[
  {
    "category": "Food & Drinks",
    "suggestedLimit": 500000,
    "reasoning": "Based on your transaction history showing 15 purchases totaling 800000 VND in this category, reducing to 500000 represents a 20% cut while maintaining reasonable spending. This aligns with your ideal target intensity level."
  }
]
</${budgetTag}>

VALID CATEGORIES: Food & Drinks, Transport, Shopping, Bills, Entertainment, Healthcare, Education, Other

USER DATA:
- Balance: 5000000 VND
- Total Income: 10000000 VND  
- Total Expenses: 5000000 VND
- Spending by category: Food & Drinks: 800000 VND, Entertainment: 600000 VND, Transport: 400000 VND
- Goal: Save more for emergency fund
- Intensity: Ideal target

Provide your analysis and recommendations in 2-3 paragraphs, then propose 2-3 budget limits using the EXACT tag format shown above.`;

    const messages: ClovaMessage[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: 'Please analyze my finances and propose budget limits.' }
    ];

    try {
      const stream = await streamClovaAPI(messages, [], undefined, undefined, 'low');
      
      let fullResponse = '';
      
      for await (const chunk of stream) {
        if (chunk.choices && chunk.choices[0]) {
          const delta = chunk.choices[0].delta;
          
          if (delta?.content) {
            fullResponse += delta.content;
          }
          
          if (chunk.choices[0].finish_reason) {
            break;
          }
        }
      }
      
      // Test parsing
      const budgetRegex = new RegExp(
        `<${budgetTag}>\\s*(\\[[^]*?\\])\\s*</${budgetTag}>`,
        'i'
      );
      
      const budgetMatch = fullResponse.match(budgetRegex);
      
      let result: any = {
        testNum: i,
        success: false,
        responseLength: fullResponse.length,
        tagFound: fullResponse.includes(budgetTag),
        openTagFound: fullResponse.includes(`<${budgetTag}>`),
        closeTagFound: fullResponse.includes(`</${budgetTag}>`),
        regexMatched: false,
        jsonParsed: false,
        numBudgets: 0,
        error: null
      };
      
      if (budgetMatch && budgetMatch[1]) {
        result.regexMatched = true;
        try {
          const parsed = JSON.parse(budgetMatch[1].trim());
          result.jsonParsed = true;
          result.numBudgets = Array.isArray(parsed) ? parsed.length : 0;
          result.success = true;
          console.log(`✅ SUCCESS - Parsed ${result.numBudgets} budget limits`);
        } catch (e: any) {
          result.error = 'JSON parse error: ' + e.message;
          console.log('❌ FAILED - Regex matched but JSON parsing failed');
          console.log('Error:', e.message);
          console.log('Matched content:', budgetMatch[1].substring(0, 200));
        }
      } else {
        console.log('❌ FAILED - Regex did not match');
        
        // Debug why it failed
        if (result.openTagFound && result.closeTagFound) {
          console.log('⚠️ Tags found but regex failed to extract content');
          const startIdx = fullResponse.indexOf(`<${budgetTag}>`);
          const endIdx = fullResponse.indexOf(`</${budgetTag}>`);
          const content = fullResponse.substring(startIdx, endIdx + budgetTag.length + 3);
          console.log('Content around tags (first 300 chars):');
          console.log(content.substring(0, 300));
          result.error = 'Tags found but regex failed';
        } else if (result.openTagFound) {
          result.error = 'Only open tag found';
          console.log('⚠️ Found opening tag but not closing tag');
        } else if (result.closeTagFound) {
          result.error = 'Only close tag found';
          console.log('⚠️ Found closing tag but not opening tag');
        } else {
          result.error = 'No tags found in response';
          console.log('⚠️ AI did not include the tags at all');
          console.log('Response preview (last 500 chars):');
          console.log(fullResponse.slice(-500));
        }
      }
      
      results.push(result);
      
    } catch (error: any) {
      console.error('❌ API ERROR:', error.message);
      results.push({
        testNum: i,
        success: false,
        error: 'API error: ' + error.message,
        apiError: true
      });
    }
    
    // Small delay between tests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  // Print summary
  console.log('\n\n' + '='.repeat(60));
  console.log('SUMMARY');
  console.log('='.repeat(60));
  
  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  const successRate = (successful / numTests * 100).toFixed(1);
  
  console.log(`\nTotal tests: ${numTests}`);
  console.log(`✅ Successful: ${successful} (${successRate}%)`);
  console.log(`❌ Failed: ${failed} (${(100 - parseFloat(successRate)).toFixed(1)}%)`);
  
  if (failed > 0) {
    console.log('\nFailure breakdown:');
    const errorTypes: { [key: string]: number } = {};
    results.filter(r => !r.success).forEach(r => {
      const errorKey = r.error || 'Unknown';
      errorTypes[errorKey] = (errorTypes[errorKey] || 0) + 1;
    });
    
    Object.entries(errorTypes).forEach(([error, count]) => {
      console.log(`  - ${error}: ${count} times`);
    });
    
    console.log('\nDetailed failures:');
    results.forEach(r => {
      if (!r.success) {
        console.log(`  Test ${r.testNum}: ${r.error}`);
        if (r.openTagFound !== undefined) {
          console.log(`    Open tag: ${r.openTagFound}, Close tag: ${r.closeTagFound}, Regex: ${r.regexMatched}`);
        }
      }
    });
  }
  
  console.log('\n=== CONCLUSION ===');
  if (successRate === '100.0') {
    console.log('✅ All tests passed! Budget parsing is working reliably.');
  } else if (parseFloat(successRate) >= 90) {
    console.log('⚠️ Most tests passed but there are occasional failures.');
    console.log('The parsing logic needs improvement for edge cases.');
  } else {
    console.log('❌ High failure rate detected! Budget parsing has significant issues.');
    console.log('Major fixes needed to the parsing logic.');
  }
}

testMultipleTimes().catch(console.error);
