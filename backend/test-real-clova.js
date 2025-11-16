/**
 * Test real Clova API
 */

async function testRealClovaAPI() {
  console.log('Testing with REAL Clova Studio API...\n');
  
  // Register user
  const regRes = await fetch('http://localhost:3001/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username: 'clovareal' + Date.now(),
      passwordHash: 'test123'
    })
  });
  
  const { token } = await regRes.json();
  console.log('Registered user, token:', token.substring(0, 20) + '...');
  
  // Test with useMock=false to force real API
  console.log('\nCalling AI generation with useMock=false...');
  const startTime = Date.now();
  
  const genRes = await fetch('http://localhost:3001/api/ai/generate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + token
    },
    body: JSON.stringify({
      goal: 'Save for down payment on house',
      intensity: 'Must achieve',
      savingsGoal: 1000,
      useMock: false  // Force real API
    })
  });
  
  const elapsed = Date.now() - startTime;
  console.log('Response status:', genRes.status);
  console.log('Time elapsed:', elapsed + 'ms');
  
  if (!genRes.ok) {
    const errorText = await genRes.text();
    console.error('Error response:', errorText);
    return;
  }
  
  const result = await genRes.json();
  
  // Check if it's async (status 202) or sync (status 201)
  if (genRes.status === 202) {
    console.log('\nAsync generation started!');
    console.log('Plan ID:', result.planId);
    console.log('Stream URL:', result.streamUrl);
    
    // Wait and check progress
    console.log('\nWaiting 20 seconds for AI generation...');
    await new Promise(r => setTimeout(r, 20000));
    
    const checkRes = await fetch('http://localhost:3001/api/ai/' + result.planId, {
      headers: { 'Authorization': 'Bearer ' + token }
    });
    
    const plan = await checkRes.json();
    console.log('\nGeneration Status:', plan.streamingStatus);
    console.log('Progress:', plan.generationProgress);
    
    if (plan.streamingStatus === 'completed') {
      console.log('\nSUCCESS! AI generation completed!');
      console.log('Suggested Savings:', plan.suggestedSavings, 'd/month');
      if (plan.proposedGoal) {
        console.log('Proposed Goal:', plan.proposedGoal.name);
      }
      if (plan.markdownAdvice) {
        console.log('\nAdvice preview:', plan.markdownAdvice.substring(0, 150) + '...');
      }
    } else if (plan.streamingStatus === 'failed') {
      console.log('\nFAILED:', plan.generationProgress);
    } else {
      console.log('\nStill in progress...');
    }
  } else {
    console.log('\nSync response (probably using mock)');
    console.log('Status:', result.streamingStatus);
    console.log('Suggested Savings:', result.suggestedSavings, 'd/month');
  }
}

testRealClovaAPI().catch(err => {
  console.error('\nTest failed:', err.message);
  console.error(err.stack);
});
