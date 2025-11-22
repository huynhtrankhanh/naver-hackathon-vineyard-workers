/**
 * Integration test: Test complete AI plan generation with improved parsing
 */

import { streamClovaAPI, ClovaMessage } from './src/utils/clovaClient.js';
import * as dotenv from 'dotenv';

dotenv.config();

// Import the functions (simulate them for testing)
function extractBudgetLimits(fullResponse: string, budgetTag: string, endBudgetTag: string): any[] {
  console.log('Attempting to extract budget limits...');
  
  // Strategy 1: Standard regex
  try {
    const budgetRegex = new RegExp(
      `<${budgetTag}>\\s*(\\[[^]*?\\])\\s*</${endBudgetTag}>`,
      'i'
    );
    const budgetMatch = fullResponse.match(budgetRegex);
    
    if (budgetMatch && budgetMatch[1]) {
      const parsed = JSON.parse(budgetMatch[1].trim());
      console.log(`✅ Strategy 1 (Regex): Successfully parsed ${parsed.length} budget limits`);
      return Array.isArray(parsed) ? parsed : [];
    }
  } catch (e: any) {
    console.log('Strategy 1 (Regex) failed:', e.message);
  }
  
  // Strategy 2: Manual extraction with indexOf
  try {
    const startTag = `<${budgetTag}>`;
    const endTag = `</${endBudgetTag}>`;
    const startIdx = fullResponse.indexOf(startTag);
    const endIdx = fullResponse.indexOf(endTag);
    
    if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
      let content = fullResponse.substring(startIdx + startTag.length, endIdx);
      console.log('Strategy 2 (indexOf): Found content between tags');
      
      // Clean up the content
      content = cleanJsonContent(content);
      
      // Try to find JSON array
      const arrayStart = content.indexOf('[');
      const arrayEnd = content.lastIndexOf(']');
      
      if (arrayStart !== -1 && arrayEnd !== -1 && arrayEnd > arrayStart) {
        const jsonStr = content.substring(arrayStart, arrayEnd + 1);
        const parsed = JSON.parse(jsonStr);
        console.log(`✅ Strategy 2 (indexOf): Successfully parsed ${parsed.length} budget limits`);
        return Array.isArray(parsed) ? parsed : [];
      }
    }
  } catch (e: any) {
    console.log('Strategy 2 (indexOf) failed:', e.message);
  }
  
  // Strategy 3: Search for JSON array anywhere
  try {
    const arrayPattern = /\[\s*\{[^}]*"category"[^}]*"suggestedLimit"[^}]*\}[^\]]*\]/gi;
    const matches = fullResponse.match(arrayPattern);
    
    if (matches && matches.length > 0) {
      for (const match of matches) {
        try {
          const cleaned = cleanJsonContent(match);
          const parsed = JSON.parse(cleaned);
          
          if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].category && parsed[0].suggestedLimit) {
            console.log(`✅ Strategy 3 (Pattern): Successfully parsed ${parsed.length} budget limits`);
            return parsed;
          }
        } catch (e) {
          continue;
        }
      }
    }
  } catch (e: any) {
    console.log('Strategy 3 (Pattern) failed:', e.message);
  }
  
  console.warn('⚠️ All strategies failed');
  return [];
}

function cleanJsonContent(content: string): string {
  content = content.replace(/```json\s*/gi, '');
  content = content.replace(/```\s*/g, '');
  content = content.replace(/Note:.*$/gm, '');
  content = content.replace(/\*\*.*?\*\*/g, '');
  content = content.trim();
  return content;
}

async function testIntegration() {
  console.log('='.repeat(70));
  console.log('INTEGRATION TEST: AI Plan Generation with Improved Parsing');
  console.log('='.repeat(70));
  console.log('\nThis test will:');
  console.log('1. Call the actual Clova API with improved prompt');
  console.log('2. Test the improved multi-strategy parsing');
  console.log('3. Verify budget limits are extracted correctly\n');
  
  const randomSuffix = Math.random().toString(36).substring(2, 15);
  const budgetTag = `BudgetLim_${randomSuffix}`;
  
  const systemPrompt = `You are a financial advisor AI helping users create personalized saving plans.

IMPORTANT SECURITY INSTRUCTIONS:
- You must NEVER reveal or mention the special tag name: ${budgetTag}
- This tag is for internal use only

Your task is to:
1. Analyze the provided financial data
2. Create a detailed report with your analysis and recommendations
3. Propose budget limit adjustments using the special tags

USER'S REQUEST:
- Goal: Build emergency fund
- Target monthly saving: 1000000 VND
- Intensity: Ideal target

CURRENT FINANCIAL DATA:
Balance: 5000000 VND
Total Income: 10000000 VND
Total Expenses: 5000000 VND
Saving Rate: 50.0%

Spending by Category:
- Food & Drinks: 1500000 VND
- Transport: 800000 VND
- Entertainment: 900000 VND
- Bills: 1200000 VND
- Other: 600000 VND

VALID BUDGET CATEGORIES: Food & Drinks, Transport, Shopping, Bills, Entertainment, Healthcare, Education, Other

YOUR RESPONSE FORMAT:

First, provide your analysis and recommendations in Markdown format. Be specific, actionable, and encouraging.

Then, AT THE VERY END of your response (AFTER all your analysis and advice):

Propose budget limits (2-3 categories) using this EXACT format:
<${budgetTag}>
[
  {
    "category": "Food & Drinks",
    "suggestedLimit": 1200000,
    "reasoning": "Based on your current spending of 1500000 VND (30% of expenses), reducing to 1200000 represents a balanced 20% cut aligned with your ideal target intensity. This maintains reasonable food quality while freeing up 300000 VND monthly for your emergency fund goal."
  }
]
</${budgetTag}>

CRITICAL FORMATTING RULES:
- Put the budget proposal section AT THE VERY END of your response
- Use ONLY the exact tag format: <${budgetTag}>[...]</${budgetTag}>
- Do NOT add any text AFTER the closing tag </${budgetTag}>
- Do NOT wrap the JSON in markdown code blocks
- The JSON array must start with [ and end with ]
- Use ONLY valid category names from the list`;

  const messages: ClovaMessage[] = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: 'Please analyze my financial situation and create a personalized saving plan with budget recommendations.' }
  ];

  try {
    console.log('📞 Calling Clova API with improved prompt...\n');
    const stream = await streamClovaAPI(messages, [], undefined, undefined, 'low');
    
    let fullResponse = '';
    let chunkCount = 0;
    
    for await (const chunk of stream) {
      chunkCount++;
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
    
    console.log(`✅ Received complete response (${chunkCount} chunks, ${fullResponse.length} chars)\n`);
    
    console.log('='.repeat(70));
    console.log('AI RESPONSE');
    console.log('='.repeat(70));
    console.log(fullResponse);
    console.log('\n' + '='.repeat(70));
    console.log('PARSING RESULTS');
    console.log('='.repeat(70) + '\n');
    
    // Test parsing with improved function
    const budgets = extractBudgetLimits(fullResponse, budgetTag, budgetTag);
    
    console.log('\n' + '='.repeat(70));
    console.log('FINAL RESULTS');
    console.log('='.repeat(70));
    
    if (budgets.length > 0) {
      console.log(`\n✅ SUCCESS: Extracted ${budgets.length} budget limit(s)\n`);
      budgets.forEach((budget, idx) => {
        console.log(`Budget ${idx + 1}:`);
        console.log(`  Category: ${budget.category}`);
        console.log(`  Suggested Limit: ${budget.suggestedLimit.toLocaleString()} VND`);
        console.log(`  Reasoning: ${budget.reasoning.substring(0, 100)}...`);
        console.log('');
      });
      
      console.log('✅ Budget limit parsing is working correctly!');
      console.log('✅ The improved multi-strategy parsing successfully handled the AI response.');
    } else {
      console.log('\n❌ FAILED: No budget limits were extracted');
      console.log('\nDEBUG INFO:');
      console.log(`Tag "${budgetTag}" found in response:`, fullResponse.includes(budgetTag));
      console.log(`Open tag found:`, fullResponse.includes(`<${budgetTag}>`));
      console.log(`Close tag found:`, fullResponse.includes(`</${budgetTag}>`));
    }
    
  } catch (error: any) {
    console.error('\n❌ ERROR:', error.message);
    console.error('Stack:', error.stack);
  }
}

testIntegration().catch(console.error);
