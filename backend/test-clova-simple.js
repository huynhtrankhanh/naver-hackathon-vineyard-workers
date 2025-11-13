/**
 * Simple test for Clova API
 */

async function testClova() {
  console.log('Testing Clova API...\n');
  
  // Register user
  const regRes = await fetch('http://localhost:3001/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username: 'clovatest' + Date.now(),
      passwordHash: 'test123'
    })
  });
  
  const { token } = await regRes.json();
  console.log('Got token:', token.substring(0, 20) + '...');
  
  // Test real API
  console.log('\nCalling Clova API (useMock=false)...');
  const genRes = await fetch('http://localhost:3001/api/ai/generate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + token
    },
    body: JSON.stringify({
      goal: 'Emergency fund',
      intensity: 'Ideal target',
      savingsGoal: 500,
      useMock: false
    })
  });
  
  console.log('Status:', genRes.status);
  
  if (!genRes.ok) {
    const err = await genRes.text();
    console.error('Error:', err);
    return;
  }
  
  const result = await genRes.json();
  console.log('Result:', JSON.stringify(result, null, 2));
  
  if (result.planId) {
    console.log('\nWaiting 15 seconds for generation...');
    await new Promise(r => setTimeout(r, 15000));
    
    const checkRes = await fetch('http://localhost:3001/api/ai/' + result.planId, {
      headers: { 'Authorization': 'Bearer ' + token }
    });
    
    const plan = await checkRes.json();
    console.log('\nFinal status:', plan.streamingStatus);
    console.log('Progress:', plan.generationProgress);
    
    if (plan.markdownAdvice) {
      console.log('Has advice:', plan.markdownAdvice.length, 'chars');
    }
  }
  
  console.log('\nTest complete!');
}

testClova().catch(err => {
  console.error('Failed:', err.message);
});
