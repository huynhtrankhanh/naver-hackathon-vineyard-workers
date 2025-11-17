import https from 'https';
import dotenv from 'dotenv';

dotenv.config();

const key = process.env.CLOVA_API_KEY;
const url = 'https://clovastudio.stream.ntruss.com/v1/openai/models';

const urlObj = new URL(url);

const options = {
  hostname: urlObj.hostname,
  port: urlObj.port || 443,
  path: urlObj.pathname,
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${key}`
  }
};

const req = https.request(options, (res) => {
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk.toString();
  });
  
  res.on('end', () => {
    console.log('Models:');
    console.log(data);
  });
});

req.on('error', (error) => {
  console.error('Error:', error);
});

req.end();
