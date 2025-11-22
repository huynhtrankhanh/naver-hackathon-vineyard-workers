/**
 * Test script to understand streaming budget limit parsing issue
 */

import { streamClovaAPI, ClovaMessage } from './src/utils/clovaClient.js';
import * as dotenv from 'dotenv';

dotenv.config();

async function testStreamingParsing() {
  console.log('Testing budget limit parsing with STREAMING API...\n');

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
- Spending: Food & Drinks: 800000 VND, Entertainment: 600000 VND, Transport: 300000 VND
- Goal: Save more for vacation
- Intensity: Ideal target

Provide analysis and recommendations, then propose 3 budget limits using the tag format above.`;

  const messages: ClovaMessage[] = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: 'Please analyze my finances and propose budget limits.' }
  ];

  try {
    console.log('Calling Clova API with STREAMING...\n');
    const stream = await streamClovaAPI(messages, [], undefined, undefined, 'medium');
    
    let fullResponse = '';
    let chunkCount = 0;
    
    for await (const chunk of stream) {
      chunkCount++;
      if (chunk.choices && chunk.choices[0]) {
        const delta = chunk.choices[0].delta;
        
        if (delta?.content) {
          fullResponse += delta.content;
          // Show chunk details
          if (chunkCount <= 5 || delta.content.includes(budgetTag)) {
            console.log(`Chunk ${chunkCount}:`, JSON.stringify(delta.content).substring(0, 100));
          }
        }
        
        if (chunk.choices[0].finish_reason) {
          console.log(`\nFinish reason: ${chunk.choices[0].finish_reason}`);
          break;
        }
      }
    }
    
    console.log(`\n=== Total chunks: ${chunkCount} ===\n`);
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
      
      try {
        const parsed = JSON.parse(budgetMatch[1].trim());
        console.log('\n✅ Successfully parsed JSON:');
        console.log(JSON.stringify(parsed, null, 2));
      } catch (e: any) {
        console.log('\n❌ Failed to parse JSON:', e.message);
        console.log('Raw matched string for debugging:');
        console.log(JSON.stringify(budgetMatch[1]));
        
        // Try to identify the issue
        const trimmed = budgetMatch[1].trim();
        console.log('\nAttempting to identify JSON issue...');
        console.log('First char:', trimmed.charCodeAt(0), trimmed[0]);
        console.log('Last char:', trimmed.charCodeAt(trimmed.length-1), trimmed[trimmed.length-1]);
        
        // Try cleaning whitespace
        const cleaned = trimmed.replace(/\s+/g, ' ');
        console.log('\nTrying with normalized whitespace...');
        try {
          const parsed2 = JSON.parse(cleaned);
          console.log('✅ Parsing succeeded after whitespace normalization!');
        } catch (e2: any) {
          console.log('❌ Still failed:', e2.message);
        }
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
        console.log('Content between tags (first 500 chars):');
        console.log(content.substring(0, 500));
        console.log('\nContent length:', content.length);
      } else {
        console.log(`Start tag found: ${startIdx !== -1}`);
        console.log(`End tag found: ${endIdx !== -1}`);
      }
    }
    
  } catch (error: any) {
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
  }
}

testStreamingParsing().catch(console.error);
