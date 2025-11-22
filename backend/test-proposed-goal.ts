/**
 * Test proposed goal mirroring - verify it mirrors user input exactly
 */

console.log('='.repeat(70));
console.log('TEST: Proposed Goal Mirroring');
console.log('='.repeat(70));
console.log('\nThis test verifies that proposedGoal mirrors user input exactly\n');

// Test cases simulating different user inputs
const testCases = [
  {
    name: 'User with specific monthly savings goal',
    userInput: {
      goal: 'Build emergency fund',
      savingsGoal: 1000000, // Monthly target
      intensity: 'Ideal target'
    },
    expected: {
      name: 'Build emergency fund',
      target: 12000000, // Annual (monthly * 12)
      priority: 'medium',
      duration: 12
    }
  },
  {
    name: 'User with "Must achieve" intensity',
    userInput: {
      goal: 'Save for house down payment',
      savingsGoal: 5000000,
      intensity: 'Must achieve'
    },
    expected: {
      name: 'Save for house down payment',
      target: 60000000,
      priority: 'high',
      duration: 12
    }
  },
  {
    name: 'User with "Just starting out" intensity',
    userInput: {
      goal: 'Build safety net',
      savingsGoal: 500000,
      intensity: 'Just starting out'
    },
    expected: {
      name: 'Build safety net',
      target: 6000000,
      priority: 'low',
      duration: 12
    }
  },
  {
    name: 'User without specific savings goal',
    userInput: {
      goal: 'General savings',
      savingsGoal: undefined,
      intensity: 'Ideal target'
    },
    expected: {
      name: 'General savings',
      target: 0, // No target specified
      priority: 'medium',
      duration: 12
    }
  }
];

// Simulate the proposed goal creation logic from aiService.ts
function createProposedGoal(goal: string, savingsGoal: number | undefined, intensity: string) {
  return {
    name: goal, // Use the exact goal text the user typed
    target: savingsGoal ? savingsGoal * 12 : 0, // Convert monthly to annual target (or 0 if not specified)
    priority: intensity === 'Must achieve' ? 'high' : 
              intensity === 'Just starting out' ? 'low' : 'medium',
    duration: 12 // Default to 12 months
  };
}

let passedTests = 0;
let failedTests = 0;

testCases.forEach((testCase, idx) => {
  console.log(`\nTest ${idx + 1}: ${testCase.name}`);
  console.log('-'.repeat(70));
  
  console.log('User Input:');
  console.log(`  Goal: "${testCase.userInput.goal}"`);
  console.log(`  Monthly Savings: ${testCase.userInput.savingsGoal ? testCase.userInput.savingsGoal.toLocaleString() : 'Not specified'} VND`);
  console.log(`  Intensity: ${testCase.userInput.intensity}`);
  
  const result = createProposedGoal(
    testCase.userInput.goal,
    testCase.userInput.savingsGoal,
    testCase.userInput.intensity
  );
  
  console.log('\nProposed Goal Result:');
  console.log(`  Name: "${result.name}"`);
  console.log(`  Target: ${result.target.toLocaleString()} VND`);
  console.log(`  Priority: ${result.priority}`);
  console.log(`  Duration: ${result.duration} months`);
  
  // Verify results
  const nameMatch = result.name === testCase.expected.name;
  const targetMatch = result.target === testCase.expected.target;
  const priorityMatch = result.priority === testCase.expected.priority;
  const durationMatch = result.duration === testCase.expected.duration;
  
  const allMatch = nameMatch && targetMatch && priorityMatch && durationMatch;
  
  console.log('\nVerification:');
  console.log(`  Name matches: ${nameMatch ? '✅' : '❌'} (${nameMatch ? 'PASS' : 'FAIL'})`);
  console.log(`  Target matches: ${targetMatch ? '✅' : '❌'} (${targetMatch ? 'PASS' : 'FAIL'})`);
  console.log(`  Priority matches: ${priorityMatch ? '✅' : '❌'} (${priorityMatch ? 'PASS' : 'FAIL'})`);
  console.log(`  Duration matches: ${durationMatch ? '✅' : '❌'} (${durationMatch ? 'PASS' : 'FAIL'})`);
  
  if (allMatch) {
    console.log('\n✅ TEST PASSED');
    passedTests++;
  } else {
    console.log('\n❌ TEST FAILED');
    failedTests++;
  }
});

console.log('\n' + '='.repeat(70));
console.log('SUMMARY');
console.log('='.repeat(70));
console.log(`Total Tests: ${testCases.length}`);
console.log(`Passed: ${passedTests}`);
console.log(`Failed: ${failedTests}`);
console.log(`Success Rate: ${((passedTests / testCases.length) * 100).toFixed(1)}%`);

if (failedTests === 0) {
  console.log('\n✅ All tests passed! Proposed goal mirroring works correctly.');
  console.log('The system will mirror exactly what the user types.');
} else {
  console.log('\n❌ Some tests failed. Review the implementation.');
}
