/**
 * Clova Studio API client for AI-powered saving plan generation
 * Uses OpenAI-compatible API with streaming support
 */

import https from 'https';
import { Readable } from 'stream';

export interface ClovaMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  name?: string;
  tool_call_id?: string;
  tool_calls?: Array<{
    id: string;
    type: 'function';
    function: {
      name: string;
      arguments: string;
    };
  }>;
}

export interface ClovaStreamChunk {
  choices?: Array<{
    delta?: {
      role?: string;
      content?: string;
      tool_calls?: Array<{
        index?: number;
        id?: string;
        type?: string;
        function?: {
          name?: string;
          arguments?: string;
        };
      }>;
    };
    finish_reason?: string | null;
  }>;
}

/**
 * Call Clova Studio API with streaming
 */
export async function* streamClovaAPI(
  messages: ClovaMessage[],
  tools?: any[],
  apiKey?: string,
  apiUrl?: string
): AsyncGenerator<ClovaStreamChunk> {
  const key = apiKey || process.env.CLOVA_API_KEY;
  const url = apiUrl || process.env.CLOVA_API_URL || 'https://clovastudio.stream.ntruss.com/v1/openai/chat/completions';
  
  if (!key) {
    throw new Error('CLOVA_API_KEY is not set');
  }
  
  const requestBody = JSON.stringify({
    messages,
    tools: tools && tools.length > 0 ? tools : undefined,
    stream: true,
    max_completion_tokens: 16000, // High limit to allow reasoning + content generation
    temperature: 0.7,
    top_p: 0.8,
    model: 'HCX-007', // Use HCX-007 model with reasoning capability
    reasoning: {
      effort: 'high' // Enable reasoning for better instruction adherence
    }
  });
  
  const urlObj = new URL(url);
  
  const options = {
    hostname: urlObj.hostname,
    port: urlObj.port || 443,
    path: urlObj.pathname + urlObj.search,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(requestBody),
      'Authorization': `Bearer ${key}`
    }
  };
  
  // Create a promise that will give us the response stream
  const res = await new Promise<any>((resolve, reject) => {
    const req = https.request(options, (response) => {
      if (response.statusCode !== 200) {
        let errorData = '';
        response.on('data', (chunk) => {
          errorData += chunk.toString();
        });
        response.on('end', () => {
          reject(new Error(`API request failed with status ${response.statusCode}: ${errorData}`));
        });
        return;
      }
      resolve(response);
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    req.write(requestBody);
    req.end();
  });
  
  // Now stream the response
  let buffer = '';
  
  for await (const chunk of res) {
    buffer += chunk.toString();
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';
    
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed === 'data: [DONE]') {
        continue;
      }
      
      if (trimmed.startsWith('data: ')) {
        try {
          const jsonStr = trimmed.substring(6);
          const data = JSON.parse(jsonStr);
          
          // Always yield the data - HCX-007 model outputs both reasoning_content and content
          // The consumer can choose which to use
          yield data;
        } catch (e) {
          console.error('Failed to parse SSE data:', trimmed, e);
        }
      }
    }
  }
  
  // Process any remaining buffer
  if (buffer.trim() && buffer.trim() !== 'data: [DONE]') {
    const trimmed = buffer.trim();
    if (trimmed.startsWith('data: ')) {
      try {
        const jsonStr = trimmed.substring(6);
        const data = JSON.parse(jsonStr);
        yield data;
      } catch (e) {
        console.error('Failed to parse final SSE data:', trimmed, e);
      }
    }
  }
}

/**
 * Non-streaming call to Clova Studio API
 */
export async function callClovaAPI(
  messages: ClovaMessage[],
  tools?: any[],
  apiKey?: string,
  apiUrl?: string
): Promise<any> {
  const key = apiKey || process.env.CLOVA_API_KEY;
  const url = apiUrl || process.env.CLOVA_API_URL || 'https://clovastudio.stream.ntruss.com/v1/openai/chat/completions';
  
  if (!key) {
    throw new Error('CLOVA_API_KEY is not set');
  }
  
  const requestBody = JSON.stringify({
    messages,
    tools: tools && tools.length > 0 ? tools : undefined,
    stream: false,
    max_completion_tokens: 16000, // High limit to allow reasoning + content generation
    temperature: 0.7,
    top_p: 0.8,
    model: 'HCX-007', // Use HCX-007 model with reasoning capability
    reasoning: {
      effort: 'high' // Enable reasoning for better instruction adherence
    }
  });
  
  const urlObj = new URL(url);
  
  const options = {
    hostname: urlObj.hostname,
    port: urlObj.port || 443,
    path: urlObj.pathname + urlObj.search,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(requestBody),
      'Authorization': `Bearer ${key}`
    }
  };
  
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk.toString();
      });
      
      res.on('end', () => {
        if (res.statusCode === 200) {
          try {
            resolve(JSON.parse(data));
          } catch (e) {
            reject(new Error(`Failed to parse response: ${data}`));
          }
        } else {
          reject(new Error(`API request failed with status ${res.statusCode}: ${data}`));
        }
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    req.write(requestBody);
    req.end();
  });
}
