import https from 'https';
import dotenv from 'dotenv';

dotenv.config();

const key = process.env.CLOVA_API_KEY;
const url = 'https://clovastudio.stream.ntruss.com/v1/openai/chat/completions';

async function testWithReasoning(reasoning: any) {
  console.log(`\n=== Testing with reasoning: ${JSON.stringify(reasoning)} ===`);
  
  const requestBody = JSON.stringify({
    messages: [
      { role: 'system', content: 'You are a helpful assistant.' },
      { role: 'user', content: 'Say hello in one sentence.' }
    ],
    stream: true,
    max_completion_tokens: 500,
    temperature: 0.7,
    model: 'HCX-007',
    reasoning: reasoning
  });

  const urlObj = new URL(url);
  const options = {
    hostname: urlObj.hostname,
    port: 443,
    path: urlObj.pathname,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(requestBody),
      'Authorization': `Bearer ${key}`
    }
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let reasoningTokens = 0;
      let contentTokens = 0;
      let actualContent = '';
      
      res.on('data', (chunk) => {
        const lines = chunk.toString().split('\n');
        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || !trimmed.startsWith('data: ') || trimmed === 'data: [DONE]') continue;
          
          try {
            const data = JSON.parse(trimmed.substring(6));
            if (data.choices && data.choices[0]?.delta) {
              const delta = data.choices[0].delta;
              if (delta.reasoning_content) reasoningTokens++;
              if (delta.content) {
                contentTokens++;
                actualContent += delta.content;
              }
            }
            if (data.choices && data.choices[0]?.finish_reason) {
              console.log(`Finish reason: ${data.choices[0].finish_reason}`);
              if (data.usage) {
                console.log(`Usage: ${JSON.stringify(data.usage.completion_tokens_details || {})}`);
              }
            }
          } catch (e) {
            // ignore
          }
        }
      });
      
      res.on('end', () => {
        console.log(`Reasoning tokens: ${reasoningTokens}`);
        console.log(`Content tokens: ${contentTokens}`);
        console.log(`Actual content: "${actualContent}"`);
        resolve({ reasoningTokens, contentTokens, actualContent });
      });
    });
    
    req.on('error', reject);
    req.write(requestBody);
    req.end();
  });
}

async function main() {
  await testWithReasoning({ effort: 'high' });
  await testWithReasoning({ effort: 'medium' });
  await testWithReasoning({ effort: 'low' });
}

main().catch(console.error);
