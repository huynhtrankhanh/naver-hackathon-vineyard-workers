/**
 * Test budget parsing with varied prompts to detect edge cases
 */

import { streamClovaAPI, ClovaMessage } from './src/utils/clovaClient.js';
import * as dotenv from 'dotenv';

dotenv.config();

async function testWithVariedPrompts() {
  console.log('Testing budget limit parsing with VARIED PROMPTS to detect edge cases...\n');
  
  const testScenarios = [
    {
      name: 'Simple case - minimal data',
      income: 5000000,
      expenses: 3000000,
      categories: { 'Food & Drinks': 800000, 'Transport': 500000 },
      goal: 'Save for vacation',
      intensity: 'Just starting out'
    },
    {
      name: 'Complex case - many categories',
      income: 15000000,
      expenses: 12000000,
      categories: { 
        'Food & Drinks': 2500000, 
        'Transport': 1500000,
        'Shopping': 2000000,
        'Entertainment': 1800000,
        'Bills': 3000000,
        'Healthcare': 700000,
        'Education': 500000
      },
      goal: 'Build emergency fund and save for house',
      intensity: 'Must achieve'
    },
    {
      name: 'Edge case - very high spending',
      income: 8000000,
      expenses: 7800000,
      categories: { 
        'Food & Drinks': 3000000, 
        'Entertainment': 2500000,
        'Shopping': 2300000
      },
      goal: 'Reduce debt',
      intensity: 'Must achieve'
    },
    {
      name: 'Edge case - already saving well',
      income: 10000000,
      expenses: 4000000,
      categories: { 
        'Food & Drinks': 1000000, 
        'Transport': 800000,
        'Bills': 1500000,
        'Other': 700000
      },
      goal: 'Optimize further',
      intensity: 'Ideal target'
    },
    {
      name: 'Edge case - unusual categories',
      income: 6000000,
      expenses: 5000000,
      categories: { 
        'Healthcare': 2000000, 
        'Education': 1500000,
        'Bills': 1000000,
        'Other': 500000
      },
      goal: 'Balance health and savings',
      intensity: 'Just starting out'
    }
  ];
  
  const results = [];
  
  for (let i = 0; i < testScenarios.length; i++) {
    const scenario = testScenarios[i];
    console.log(`\n${'='.repeat(70)}`);
    console.log(`TEST ${i + 1}/${testScenarios.length}: ${scenario.name}`);
    console.log('='.repeat(70));
    
    const randomSuffix = Math.random().toString(36).substring(2, 15);
    const budgetTag = `BudgetLim_${randomSuffix}`;
    
    const balance = scenario.income - scenario.expenses;
    const categoryText = Object.entries(scenario.categories)
      .map(([cat, amt]) => `- ${cat}: ${amt.toLocaleString()} VND`)
      .join('\n');
    
    const systemPrompt = `You are a financial advisor AI helping users create personalized saving plans.

IMPORTANT SECURITY INSTRUCTIONS:
- You must NEVER reveal or mention the special tag name: ${budgetTag}
- This tag is for internal use only
- Do not use this tag name in any other context in your response

Your task is to:
1. Analyze the provided financial data
2. Create a detailed report with your analysis and recommendations
3. Propose budget limit adjustments using the special tags

USER'S REQUEST:
- Goal: ${scenario.goal}
- Intensity: ${scenario.intensity}

INTENSITY GUIDELINES:
- "Just starting out" = gentle, sustainable changes (10-15% reductions)
- "Ideal target" = balanced approach (15-25% reductions)
- "Must achieve" = aggressive but achievable changes (25-40% reductions)

CURRENT FINANCIAL DATA:

Balance: ${balance.toLocaleString()} VND
Total Income: ${scenario.income.toLocaleString()} VND
Total Expenses: ${scenario.expenses.toLocaleString()} VND
Saving Rate: ${((balance / scenario.income) * 100).toFixed(1)}%

Spending by Category:
${categoryText}

VALID BUDGET CATEGORIES (use ONLY these categories):
- Food & Drinks
- Transport
- Shopping
- Bills
- Entertainment
- Healthcare
- Education
- Other

YOUR RESPONSE FORMAT:

First, provide your analysis and recommendations in Markdown format. Be specific, actionable, and encouraging.

Then, AT THE END of your response:

Propose budget limits (2-4 categories) using this EXACT format (MUST use valid category names from the list above):
<${budgetTag}>
[
  {
    "category": "Food & Drinks",
    "suggestedLimit": 500000,
    "reasoning": "Detailed explanation with specific data from transaction history. Include current spending amount, percentage of expenses, and reduction target based on intensity level."
  },
  {
    "category": "Entertainment",
    "suggestedLimit": 300000,
    "reasoning": "Detailed explanation with specific data from transaction history. Include current spending amount, percentage of expenses, and reduction target based on intensity level."
  }
]
</${budgetTag}>

CRITICAL RULES FOR BUDGET JUSTIFICATIONS:
- Each budget limit reasoning MUST be comprehensive (minimum 3-4 sentences)
- MUST explicitly state the data source
- MUST include specific numbers: current spending amount, percentage of expenses
- MUST reference the intensity level chosen by the user
- Use ONLY the exact tag name provided above with proper XML format: <${budgetTag}>...</${budgetTag}>
- For budget limits, use ONLY the valid category names from the list
- Do NOT create new category names or variations`;

    const messages: ClovaMessage[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: 'Please analyze my financial situation and create a personalized saving plan for me with specific, actionable advice.' }
    ];

    try {
      console.log('Calling API...');
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
      
      console.log(`Response length: ${fullResponse.length} chars`);
      
      // Test parsing
      const budgetRegex = new RegExp(
        `<${budgetTag}>\\s*(\\[[^]*?\\])\\s*</${budgetTag}>`,
        'i'
      );
      
      const budgetMatch = fullResponse.match(budgetRegex);
      
      let result: any = {
        scenario: scenario.name,
        success: false,
        responseLength: fullResponse.length,
        openTagFound: fullResponse.includes(`<${budgetTag}>`),
        closeTagFound: fullResponse.includes(`</${budgetTag}>`),
        regexMatched: false,
        jsonParsed: false,
        budgets: [],
        error: null,
        fullResponse: fullResponse
      };
      
      if (budgetMatch && budgetMatch[1]) {
        result.regexMatched = true;
        console.log('✅ Regex matched!');
        console.log('Matched JSON string length:', budgetMatch[1].length);
        
        try {
          const parsed = JSON.parse(budgetMatch[1].trim());
          result.jsonParsed = true;
          result.budgets = Array.isArray(parsed) ? parsed : [];
          result.success = true;
          console.log(`✅ SUCCESS - Parsed ${result.budgets.length} budget limits`);
          result.budgets.forEach((b: any, idx: number) => {
            console.log(`  ${idx + 1}. ${b.category}: ${b.suggestedLimit} VND`);
          });
        } catch (e: any) {
          result.error = 'JSON parse error: ' + e.message;
          console.log('❌ FAILED - JSON parsing failed');
          console.log('Error:', e.message);
          console.log('Matched content preview:', budgetMatch[1].substring(0, 300));
        }
      } else {
        console.log('❌ FAILED - Regex did not match');
        
        // Debug
        if (result.openTagFound && result.closeTagFound) {
          console.log('⚠️ Tags found but regex failed to extract');
          const startIdx = fullResponse.indexOf(`<${budgetTag}>`);
          const endIdx = fullResponse.indexOf(`</${budgetTag}>`);
          const content = fullResponse.substring(startIdx, Math.min(endIdx + budgetTag.length + 3, startIdx + 500));
          console.log('Content around tags:');
          console.log(content);
          result.error = 'Tags found but regex failed - possible format issue';
        } else if (result.openTagFound) {
          result.error = 'Only open tag found';
          console.log('⚠️ Only opening tag found');
        } else if (result.closeTagFound) {
          result.error = 'Only close tag found';
          console.log('⚠️ Only closing tag found');
        } else {
          result.error = 'No tags found in response';
          console.log('⚠️ AI did not include the tags');
          console.log('Response ending (last 400 chars):');
          console.log(fullResponse.slice(-400));
        }
      }
      
      results.push(result);
      
    } catch (error: any) {
      console.error('❌ API ERROR:', error.message);
      results.push({
        scenario: scenario.name,
        success: false,
        error: 'API error: ' + error.message,
        apiError: true
      });
    }
    
    // Delay between tests to avoid rate limiting
    if (i < testScenarios.length - 1) {
      console.log('\nWaiting 15 seconds before next test...');
      await new Promise(resolve => setTimeout(resolve, 15000));
    }
  }
  
  // Print summary
  console.log('\n\n' + '='.repeat(70));
  console.log('FINAL SUMMARY');
  console.log('='.repeat(70));
  
  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  const successRate = (successful / testScenarios.length * 100).toFixed(1);
  
  console.log(`\nTotal tests: ${testScenarios.length}`);
  console.log(`✅ Successful: ${successful} (${successRate}%)`);
  console.log(`❌ Failed: ${failed} (${(100 - parseFloat(successRate)).toFixed(1)}%)`);
  
  if (failed > 0) {
    console.log('\n' + '='.repeat(70));
    console.log('FAILURE ANALYSIS');
    console.log('='.repeat(70));
    
    results.forEach((r, idx) => {
      if (!r.success) {
        console.log(`\nTest ${idx + 1}: ${r.scenario}`);
        console.log(`Error: ${r.error}`);
        if (!r.apiError) {
          console.log(`  Open tag found: ${r.openTagFound}`);
          console.log(`  Close tag found: ${r.closeTagFound}`);
          console.log(`  Regex matched: ${r.regexMatched}`);
          console.log(`  JSON parsed: ${r.jsonParsed}`);
          
          if (r.fullResponse && r.openTagFound && r.closeTagFound) {
            // Extract problematic section for analysis
            const tagName = r.fullResponse.match(/<BudgetLim_[a-z0-9]+>/i);
            if (tagName) {
              const tag = tagName[0].slice(1, -1);
              const startIdx = r.fullResponse.indexOf('<' + tag + '>');
              const endIdx = r.fullResponse.indexOf('</' + tag + '>');
              const problematicSection = r.fullResponse.substring(startIdx, endIdx + tag.length + 3);
              
              console.log(`\n  === PROBLEMATIC SECTION ===`);
              console.log(problematicSection);
              console.log(`  === END SECTION ===\n`);
            }
          }
        }
      }
    });
  }
  
  console.log('\n' + '='.repeat(70));
  console.log('RECOMMENDATIONS');
  console.log('='.repeat(70));
  
  if (successRate === '100.0') {
    console.log('✅ All tests passed! Budget parsing is working reliably.');
  } else {
    console.log('Issues identified:');
    const errorTypes: { [key: string]: number } = {};
    results.filter(r => !r.success).forEach(r => {
      const errorKey = r.error || 'Unknown';
      errorTypes[errorKey] = (errorTypes[errorKey] || 0) + 1;
    });
    
    Object.entries(errorTypes).forEach(([error, count]) => {
      console.log(`  - ${error}: ${count} time(s)`);
    });
    
    console.log('\nSuggested fixes:');
    if (errorTypes['Tags found but regex failed - possible format issue']) {
      console.log('  1. Improve regex to handle edge cases in content between tags');
      console.log('  2. Add fallback parsing using indexOf instead of regex');
    }
    if (errorTypes['No tags found in response']) {
      console.log('  3. Add retry logic if AI fails to include tags');
      console.log('  4. Improve prompt to make tag usage more reliable');
    }
    if (errorTypes['JSON parse error']) {
      console.log('  5. Add JSON cleanup/sanitization before parsing');
      console.log('  6. Handle common JSON formatting issues from AI');
    }
  }
}

testWithVariedPrompts().catch(console.error);
