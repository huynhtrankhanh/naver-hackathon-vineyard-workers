/**
 * Test edge cases for budget limit parsing
 */

import * as dotenv from 'dotenv';
dotenv.config();

function testRegexPatterns() {
  console.log('Testing various edge cases for budget limit parsing...\n');
  
  const randomSuffix = 'test123';
  const budgetTag = 'BudgetLim_' + randomSuffix;
  
  // Standard regex from aiService.ts
  const budgetRegex = new RegExp(
    '<' + budgetTag + '>\\s*(\\[[^]*?\\])\\s*</' + budgetTag + '>',
    'i'
  );
  
  const testCases = [
    {
      name: 'Standard format with whitespace',
      input: '<BudgetLim_test123>\n[\n  {\n    "category": "Food & Drinks",\n    "suggestedLimit": 500000,\n    "reasoning": "Test"\n  }\n]\n</BudgetLim_test123>',
      shouldMatch: true
    },
    {
      name: 'Compact format (no extra whitespace)',
      input: '<BudgetLim_test123>[{"category":"Food & Drinks","suggestedLimit":500000,"reasoning":"Test"}]</BudgetLim_test123>',
      shouldMatch: true
    },
    {
      name: 'AI puts extra text before closing tag',
      input: '<BudgetLim_test123>\n[\n  {\n    "category": "Food & Drinks",\n    "suggestedLimit": 500000,\n    "reasoning": "Test"\n  }\n]\nNote: These are suggestions\n</BudgetLim_test123>',
      shouldMatch: false // Current regex won't match this
    },
    {
      name: 'Nested objects with complex strings',
      input: '<BudgetLim_test123>\n[\n  {\n    "category": "Food & Drinks",\n    "suggestedLimit": 500000,\n    "reasoning": "Based on your history [showing 15 purchases]"\n  }\n]\n</BudgetLim_test123>',
      shouldMatch: true
    },
    {
      name: 'AI forgets closing bracket',
      input: '<BudgetLim_test123>\n[\n  {\n    "category": "Food & Drinks",\n    "suggestedLimit": 500000,\n    "reasoning": "Test"\n  }\n</BudgetLim_test123>',
      shouldMatch: false
    },
    {
      name: 'AI uses different case for tag',
      input: '<budgetlim_test123>\n[\n  {\n    "category": "Food & Drinks",\n    "suggestedLimit": 500000,\n    "reasoning": "Test"\n  }\n]\n</budgetlim_test123>',
      shouldMatch: true // Regex has 'i' flag
    },
    {
      name: 'Unicode characters in reasoning',
      input: '<BudgetLim_test123>\n[\n  {\n    "category": "Food & Drinks",\n    "suggestedLimit": 500000,\n    "reasoning": "Your spending is 800K → reduce to 500K (saves 300K/month)"\n  }\n]\n</BudgetLim_test123>',
      shouldMatch: true
    }
  ];
  
  testCases.forEach(({name, input, shouldMatch}) => {
    console.log('\n📝 Test: ' + name);
    console.log('Expected: ' + (shouldMatch ? '✅ Match' : '❌ No match'));
    
    const match = input.match(budgetRegex);
    const actuallyMatched = !!(match && match[1]);
    
    console.log('Actual: ' + (actuallyMatched ? '✅ Match' : '❌ No match'));
    
    if (actuallyMatched) {
      console.log('Matched content:', match![1].substring(0, 100) + '...');
      try {
        const parsed = JSON.parse(match![1].trim());
        console.log('✅ JSON parsing: SUCCESS');
      } catch (e: any) {
        console.log('❌ JSON parsing FAILED:', e.message);
      }
    } else if (shouldMatch) {
      console.log('⚠️ Expected to match but did not!');
      // Try to find why
      if (input.includes('<' + budgetTag + '>') && input.includes('</' + budgetTag + '>')) {
        console.log('Tags are present, regex might be too strict');
        const startIdx = input.indexOf('<' + budgetTag + '>');
        const endIdx = input.indexOf('</' + budgetTag + '>');
        const content = input.substring(startIdx + budgetTag.length + 2, endIdx);
        console.log('Content between tags:', content.substring(0, 100));
      }
    }
    
    console.log('---');
  });
  
  console.log('\n\n=== SUMMARY ===');
  console.log('The regex pattern \\[^]*?\\] expects:');
  console.log('1. Opening [');
  console.log('2. Any content (non-greedy)');
  console.log('3. Closing ]');
  console.log('\nThis will fail if:');
  console.log('- AI adds text after the JSON array');
  console.log('- AI wraps JSON in markdown code blocks');
  console.log('- AI forgets brackets');
  console.log('\n=== RECOMMENDATION ===');
  console.log('Make regex more robust to handle these edge cases');
}

testRegexPatterns();
