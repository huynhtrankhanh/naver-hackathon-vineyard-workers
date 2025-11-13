/**
 * Test script for Clova Studio API integration
 */

async function testClovaAPI() {
  console.log('Testing Clova Studio API Integration\n');
  
  // Register a test user
  console.log('1. Registering test user...');
  const registerResponse = await fetch('http://localhost:3001/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username: `clovatest${Date.now()}`,
      passwordHash: 'testHash123'
    })
  });
  
  const { token, username } = await registerResponse.json();
  console.log('Registered: ' + username);
  console.log('Token: ' + token.substring(0, 20) + '...');
  
  // Test with real Clova API (not mock)
  console.log('\n2. Testing AI generation WITH Clova Studio API...');
  console.log('   (This will use the real API key)');
  
  const startTime = Date.now();
  const generateResponse = await fetch('http://localhost:3001/api/ai/generate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `******
    },
    body: JSON.stringify({
      goal: 'Build an emergency fund',
      intensity: 'Ideal target',
      savingsGoal: 500,
      useMock: false // Use real API
    })
  });
  
  if (!generateResponse.ok) {
    console.error('API call failed: ' + generateResponse.status + ' ' + generateResponse.statusText);
    const errorText = await generateResponse.text();
    console.error('Error: ' + errorText);
    return;
  }
  
  const result = await generateResponse.json();
  const elapsed = Date.now() - startTime;
  
  console.log('Generation completed in ' + elapsed + 'ms');
  console.log('Status: ' + generateResponse.status);
  
  if (result.planId) {
    console.log('Plan ID: ' + result.planId);
    console.log('Stream URL: ' + result.streamUrl);
    console.log('\n3. Checking plan status...');
    
    // Give it a moment for async generation
    await new Promise(resolve => setTimeout(resolve, 10000));
    
    const planResponse = await fetch(`http://localhost:3001/api/ai/${result.planId}`, {
      headers: { 'Authorization': `******
    });
    
    const plan = await planResponse.json();
    console.log('Streaming Status: ' + plan.streamingStatus);
    console.log('Progress: ' + (plan.generationProgress || 'N/A'));
    
    if (plan.streamingStatus === 'completed') {
      console.log('Suggested Savings: ' + plan.suggestedSavings + ' d/month');
      console.log('Recommendations: ' + (plan.recommendations?.length || 0) + ' items');
      if (plan.proposedGoal) {
        console.log('Proposed Goal: ' + plan.proposedGoal.name);
      }
      if (plan.markdownAdvice) {
        console.log('\nAdvice excerpt: ' + plan.markdownAdvice.substring(0, 200) + '...');
      }
    } else if (plan.streamingStatus === 'failed') {
      console.log('Generation failed: ' + plan.generationProgress);
    } else {
      console.log('Still generating...');
    }
  } else {
    // Synchronous response (mock or immediate)
    console.log('Suggested Savings: ' + result.suggestedSavings + ' d/month');
    console.log('Recommendations: ' + (result.recommendations?.length || 0) + ' items');
    console.log('Status: ' + result.streamingStatus);
  }
  
  console.log('\nClova API test completed!');
}

testClovaAPI().catch(err => {
  console.error('\nTest failed:', err.message);
  console.error(err.stack);
  process.exit(1);
});
