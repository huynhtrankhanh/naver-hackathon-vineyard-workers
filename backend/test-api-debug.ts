import https from 'https';
import dotenv from 'dotenv';

dotenv.config();

const key = process.env.CLOVA_API_KEY;
const url = 'https://clovastudio.stream.ntruss.com/v1/openai/chat/completions';

const requestBody = JSON.stringify({
  messages: [
    { role: 'system', content: 'You are a helpful assistant.' },
    { role: 'user', content: 'Say hello in one word.' }
  ],
  stream: true,
  max_completion_tokens: 100,
  temperature: 0.7,
  model: 'HCX-007',
  reasoning: { effort: 'high' }
});

console.log('API Key:', key?.substring(0, 10) + '...');
console.log('Request body:', requestBody);

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

const req = https.request(options, (res) => {
  console.log('\n=== RESPONSE ===');
  console.log('Status:', res.statusCode);
  console.log('Headers:', JSON.stringify(res.headers, null, 2));
  
  let rawData = '';
  
  res.on('data', (chunk) => {
    rawData += chunk.toString();
    process.stdout.write(chunk.toString());
  });
  
  res.on('end', () => {
    console.log('\n\n=== RAW DATA LENGTH:', rawData.length);
  });
});

req.on('error', (error) => {
  console.error('Error:', error);
});

req.write(requestBody);
req.end();
