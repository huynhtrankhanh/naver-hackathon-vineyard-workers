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
  const url = apiUrl || process.env.CLOVA_API_URL || 'https://clovastudio.stream.ntruss.com/testapp/v1/chat-completions/HCX-003';
  
  if (!key) {
    throw new Error('CLOVA_API_KEY is not set');
  }
  
  const requestBody = JSON.stringify({
    messages,
    tools: tools || [],
    stream: true,
    maxTokens: 2000,
    temperature: 0.7,
    topP: 0.8,
    repeatPenalty: 1.2
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
      'X-NCP-CLOVASTUDIO-API-KEY': key,
      'X-NCP-APIGW-API-KEY': key
    }
  };
  
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      if (res.statusCode !== 200) {
        let errorData = '';
        res.on('data', (chunk) => {
          errorData += chunk.toString();
        });
        res.on('end', () => {
          reject(new Error(`API request failed with status ${res.statusCode}: ${errorData}`));
        });
        return;
      }
      
      // Create async generator from the stream
      async function* generateChunks() {
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
      
      resolve(generateChunks());
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    req.write(requestBody);
    req.end();
  });
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
  const url = apiUrl || process.env.CLOVA_API_URL || 'https://clovastudio.stream.ntruss.com/testapp/v1/chat-completions/HCX-003';
  
  if (!key) {
    throw new Error('CLOVA_API_KEY is not set');
  }
  
  const requestBody = JSON.stringify({
    messages,
    tools: tools || [],
    stream: false,
    maxTokens: 2000,
    temperature: 0.7,
    topP: 0.8,
    repeatPenalty: 1.2
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
      'X-NCP-CLOVASTUDIO-API-KEY': key,
      'X-NCP-APIGW-API-KEY': key
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
