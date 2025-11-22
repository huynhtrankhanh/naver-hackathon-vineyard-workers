/**
 * Test script to understand budget limit parsing issue
 */

import { callClovaAPI, ClovaMessage } from './src/utils/clovaClient.js';
import * as dotenv from 'dotenv';

dotenv.config();

async function testBudgetParsing() {
  console.log('Testing budget limit parsing with actual API...\n');

  const randomSuffix = Math.random().toString(36).substring(2, 15);
  const budgetTag = `BudgetLim_${randomSuffix}`;
  
  const systemPrompt = `You are a financial advisor AI. 

IMPORTANT: You must propose budget limits using this EXACT format:
<${budgetTag}>
[
  {
    "category": "Food & Drinks",
    "suggestedLimit": 500000,
    "reasoning": "Based on your transaction history showing 15 purchases totaling 800000 VND in this category..."
  }
]
</${budgetTag}>

VALID CATEGORIES: Food & Drinks, Transport, Shopping, Bills, Entertainment, Healthcare, Education, Other

USER DATA:
- Balance: 5000000 VND
- Total Income: 10000000 VND
- Total Expenses: 5000000 VND
- Spending: Food & Drinks: 800000 VND, Entertainment: 600000 VND
- Goal: Save more for vacation
- Intensity: Ideal target

Provide analysis and recommendations, then propose 2 budget limits using the tag format above.`;

  const messages: ClovaMessage[] = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: 'Please analyze my finances and propose budget limits.' }
  ];

  try {
    console.log('Calling Clova API...\n');
    const response = await callClovaAPI(messages, [], undefined, undefined, 'medium');
    
    const fullResponse = response.choices[0].message.content;
    console.log('=== FULL AI RESPONSE ===');
    console.log(fullResponse);
    console.log('\n=== END RESPONSE ===\n');
    
    // Test parsing
    console.log('Testing regex parsing...\n');
    const budgetRegex = new RegExp(
      `<${budgetTag}>\\s*(\\[[^]*?\\])\\s*</${budgetTag}>`,
      'i'
    );
    
    console.log('Regex pattern:', budgetRegex.toString());
    const budgetMatch = fullResponse.match(budgetRegex);
    
    if (budgetMatch && budgetMatch[1]) {
      console.log('✅ Match found!');
      console.log('Matched text:', budgetMatch[0]);
      console.log('\nJSON string:', budgetMatch[1]);
      
      try {
        const parsed = JSON.parse(budgetMatch[1].trim());
        console.log('\n✅ Successfully parsed JSON:');
        console.log(JSON.stringify(parsed, null, 2));
      } catch (e) {
        console.log('\n❌ Failed to parse JSON:', e);
        console.log('Raw matched string for debugging:');
        console.log(JSON.stringify(budgetMatch[1]));
      }
    } else {
      console.log('❌ No match found!');
      console.log('\nSearching for tag manually...');
      
      const startTag = `<${budgetTag}>`;
      const endTag = `</${budgetTag}>`;
      const startIdx = fullResponse.indexOf(startTag);
      const endIdx = fullResponse.indexOf(endTag);
      
      if (startIdx !== -1 && endIdx !== -1) {
        console.log(`Found start tag at index: ${startIdx}`);
        console.log(`Found end tag at index: ${endIdx}`);
        const content = fullResponse.substring(startIdx + startTag.length, endIdx);
        console.log('Content between tags:');
        console.log(content);
      } else {
        console.log(`Start tag found: ${startIdx !== -1}`);
        console.log(`End tag found: ${endIdx !== -1}`);
        
        // Check if tag appears anywhere
        if (fullResponse.includes(budgetTag)) {
          console.log(`\nTag "${budgetTag}" appears in response but not in expected format`);
          const lines = fullResponse.split('\n');
          lines.forEach((line, idx) => {
            if (line.includes(budgetTag)) {
              console.log(`Line ${idx}: ${line}`);
            }
          });
        }
      }
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

testBudgetParsing().catch(console.error);
