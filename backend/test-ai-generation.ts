/**
 * Test script to verify AI generation works with Clova API
 */
import dotenv from 'dotenv';
import { streamClovaAPI } from './src/utils/clovaClient.js';

dotenv.config();

async function testAIGeneration() {
  console.log('Testing Clova API with HCX-007...');
  console.log('API Key:', process.env.CLOVA_API_KEY ? '✓ Set' : '✗ Not set');
  console.log('API URL:', process.env.CLOVA_API_URL);
  console.log();

  const messages = [
    {
      role: 'system' as const,
      content: 'You are a helpful assistant.'
    },
    {
      role: 'user' as const,
      content: 'Hello! Please respond with a short greeting.'
    }
  ];

  try {
    console.log('Calling Clova API...');
    const stream = await streamClovaAPI(messages, []);
    
    let fullResponse = '';
    let chunkCount = 0;
    
    for await (const chunk of stream) {
      chunkCount++;
      console.log(`Chunk ${chunkCount}:`, JSON.stringify(chunk, null, 2));
      
      if (chunk.choices && chunk.choices[0]?.delta?.content) {
        const content = chunk.choices[0].delta.content;
        process.stdout.write(content);
        fullResponse += content;
      }
    }
    
    console.log('\n\n✓ Success! Full response length:', fullResponse.length);
    console.log('Total chunks received:', chunkCount);
    console.log('Response:', fullResponse);
  } catch (error) {
    console.error('✗ Error:', error);
    process.exit(1);
  }
}

testAIGeneration();
