import https from 'https';
import dotenv from 'dotenv';

dotenv.config();

const key = process.env.CLOVA_API_KEY;
const url = 'https://clovastudio.stream.ntruss.com/v1/openai/chat/completions';

const requestBody = JSON.stringify({
  messages: [
    { role: 'system', content: 'You are a helpful assistant.' },
    { role: 'user', content: 'Say "Hello world!"' }
  ],
  stream: true,
  max_completion_tokens: 100,
  temperature: 0.7,
  model: 'HCX-007'
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

console.log('Making request...');
console.log('Body:', requestBody);

const req = https.request(options, (res) => {
  console.log('Status:', res.statusCode);
  console.log('Headers:', res.headers);
  console.log('\n--- Stream data ---');
  
  res.on('data', (chunk) => {
    const str = chunk.toString();
    console.log('CHUNK:', str);
  });
  
  res.on('end', () => {
    console.log('\n--- End of stream ---');
  });
});

req.on('error', (error) => {
  console.error('Error:', error);
});

req.write(requestBody);
req.end();
