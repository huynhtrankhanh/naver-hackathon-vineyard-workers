/**
 * Test improved budget parsing with edge cases
 */

// Simulate the improved parsing function
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

// Test cases
const testCases = [
  {
    name: 'Standard format',
    input: '<BudgetLim_test>\n[{"category":"Food & Drinks","suggestedLimit":500000,"reasoning":"Test"}]\n</BudgetLim_test>',
    tag: 'BudgetLim_test',
    expectedCount: 1
  },
  {
    name: 'Extra text after array',
    input: '<BudgetLim_test>\n[{"category":"Food & Drinks","suggestedLimit":500000,"reasoning":"Test"}]\n\nNote: These are suggestions\n</BudgetLim_test>',
    tag: 'BudgetLim_test',
    expectedCount: 1
  },
  {
    name: 'Markdown code block',
    input: '<BudgetLim_test>\n```json\n[{"category":"Food & Drinks","suggestedLimit":500000,"reasoning":"Test"}]\n```\n</BudgetLim_test>',
    tag: 'BudgetLim_test',
    expectedCount: 1
  },
  {
    name: 'Multiple budgets with whitespace',
    input: '<BudgetLim_test>\n  \n[  \n  {"category":"Food & Drinks","suggestedLimit":500000,"reasoning":"Test"},\n  {"category":"Transport","suggestedLimit":300000,"reasoning":"Test2"}\n]\n  \n</BudgetLim_test>',
    tag: 'BudgetLim_test',
    expectedCount: 2
  },
  {
    name: 'No tags (pattern matching only)',
    input: 'Here are my recommendations: [{"category":"Food & Drinks","suggestedLimit":500000,"reasoning":"Test"}]',
    tag: 'BudgetLim_test',
    expectedCount: 1
  }
];

console.log('Testing improved budget parsing...\n');

testCases.forEach((testCase, idx) => {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`Test ${idx + 1}: ${testCase.name}`);
  console.log('='.repeat(60));
  
  const result = extractBudgetLimits(testCase.input, testCase.tag, testCase.tag);
  
  if (result.length === testCase.expectedCount) {
    console.log(`✅ SUCCESS: Extracted ${result.length} budget limit(s) as expected`);
  } else {
    console.log(`❌ FAILED: Expected ${testCase.expectedCount}, got ${result.length}`);
  }
});

console.log('\n\n=== SUMMARY ===');
console.log('The improved parsing uses 3 strategies:');
console.log('1. Regex matching (fastest, works with well-formatted responses)');
console.log('2. Manual indexOf extraction (handles extra text and whitespace)');
console.log('3. Pattern matching (finds budget arrays anywhere in response)');
console.log('\nThis should handle most edge cases from the AI.');
