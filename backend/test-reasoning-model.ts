import https from 'https';
import dotenv from 'dotenv';

dotenv.config();

const key = process.env.CLOVA_API_KEY;
const url = 'https://clovastudio.stream.ntruss.com/v1/openai/chat/completions';

const requestBody = JSON.stringify({
  messages: [
    { 
      role: 'system', 
      content: 'You are a financial advisor. Provide detailed, actionable advice.' 
    },
    { 
      role: 'user', 
      content: 'I have $1000 to save this month. How should I budget it? Give me specific advice in a structured format.'
    }
  ],
  stream: true,
  max_completion_tokens: 500,
  temperature: 0.7,
  model: 'HCX-007',
  reasoning: {
    effort: 'high'
  }
});

const urlObj = new URL(url);

const options = {
  hostname: urlObj.hostname,
  port: urlObj.port || 443,
  path: urlObj.pathname,
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(requestBody),
    'Authorization': `Bearer ${key}`
  }
};

console.log('Testing HCX-007 with reasoning...\n');

const req = https.request(options, (res) => {
  console.log('Status:', res.statusCode);
  
  let fullResponse = '';
  let reasoningContent = '';
  
  res.on('data', (chunk) => {
    const lines = chunk.toString().split('\n');
    
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed === 'data: [DONE]' || !trimmed.startsWith('data: ')) {
        continue;
      }
      
      try {
        const data = JSON.parse(trimmed.substring(6));
        
        if (data.choices && data.choices[0]?.delta) {
          const delta = data.choices[0].delta;
          
          if (delta.reasoning_content) {
            reasoningContent += delta.reasoning_content;
          }
          
          if (delta.content) {
            process.stdout.write(delta.content);
            fullResponse += delta.content;
          }
        }
      } catch (e) {
        // Ignore parse errors
      }
    }
  });
  
  res.on('end', () => {
    console.log('\n\n---');
    console.log('Reasoning tokens:', reasoningContent.length > 0 ? reasoningContent.split(' ').length : 0);
    console.log('Response tokens:', fullResponse.split(' ').length);
    console.log('Full response length:', fullResponse.length);
  });
});

req.on('error', (error) => {
  console.error('Error:', error);
});

req.write(requestBody);
req.end();
