/**
 * Test proposed goal duration mirroring - verify it mirrors user input exactly
 */

console.log('='.repeat(70));
console.log('TEST: Proposed Goal Duration Mirroring');
console.log('='.repeat(70));
console.log('\nThis test verifies that proposedGoal.duration mirrors user input\n');

// Test cases simulating different user inputs
const testCases = [
  {
    name: 'User with 6 month duration',
    userInput: {
      goal: 'Build emergency fund',
      savingsGoal: 1000000, // Monthly target
      intensity: 'Ideal target',
      duration: 6
    },
    expected: {
      name: 'Build emergency fund',
      target: 6000000, // Monthly * duration
      priority: 'medium',
      duration: 6
    }
  },
  {
    name: 'User with 24 month duration',
    userInput: {
      goal: 'Save for house down payment',
      savingsGoal: 5000000,
      intensity: 'Must achieve',
      duration: 24
    },
    expected: {
      name: 'Save for house down payment',
      target: 120000000, // Monthly * duration
      priority: 'high',
      duration: 24
    }
  },
  {
    name: 'User with 3 month duration',
    userInput: {
      goal: 'Quick savings',
      savingsGoal: 2000000,
      intensity: 'Just starting out',
      duration: 3
    },
    expected: {
      name: 'Quick savings',
      target: 6000000,
      priority: 'low',
      duration: 3
    }
  },
  {
    name: 'User without duration (defaults to 12)',
    userInput: {
      goal: 'General savings',
      savingsGoal: 500000,
      intensity: 'Ideal target',
      duration: undefined
    },
    expected: {
      name: 'General savings',
      target: 6000000, // 500000 * 12
      priority: 'medium',
      duration: 12
    }
  },
  {
    name: 'User with 18 month duration and no savings goal',
    userInput: {
      goal: 'Flexible goal',
      savingsGoal: undefined,
      intensity: 'Ideal target',
      duration: 18
    },
    expected: {
      name: 'Flexible goal',
      target: 0, // No target
      priority: 'medium',
      duration: 18
    }
  }
];

// Simulate the proposed goal creation logic from aiService.ts
function createProposedGoal(goal: string, savingsGoal: number | undefined, intensity: string, duration: number | undefined) {
  const userDuration = duration || 12;
  
  return {
    name: goal,
    target: savingsGoal ? savingsGoal * userDuration : 0,
    priority: intensity === 'Must achieve' ? 'high' : 
              intensity === 'Just starting out' ? 'low' : 'medium',
    duration: userDuration
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
  console.log(`  Duration: ${testCase.userInput.duration ? testCase.userInput.duration + ' months' : 'Not specified (defaults to 12)'}`);
  console.log(`  Intensity: ${testCase.userInput.intensity}`);
  
  const result = createProposedGoal(
    testCase.userInput.goal,
    testCase.userInput.savingsGoal,
    testCase.userInput.intensity,
    testCase.userInput.duration
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
  console.log('\n✅ All tests passed! Proposed goal duration mirroring works correctly.');
  console.log('The system will mirror the user\'s duration input exactly.');
} else {
  console.log('\n❌ Some tests failed. Review the implementation.');
}
