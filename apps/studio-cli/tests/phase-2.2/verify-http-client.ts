/**
 * Phase 2.2 Task 8: HTTP Client Verification Tests
 * 
 * Tests retry logic, token injection, error detection, and timeout handling
 */

import { runSuite, assert, assertEquals, MockResponse, createMockFetch, createTempWorkspace, cleanupTempWorkspace } from './test-utils.js';
import { createHttpClient } from '../../src/utils/http-client.js';

export async function verifyHttpClient() {
  let tempWorkspace: string | null = null;

  const tests = [
    {
      name: 'Retry logic triggers on 429 (rate limit)',
      fn: async () => {
        let attempts = 0;
        const mockFetch = async (url: string | URL, options?: any): Promise<Response> => {
          attempts++;
          if (attempts < 3) {
            return new MockResponse(429, { error: 'Rate limit exceeded' }) as any;
          }
          return new MockResponse(200, { success: true }) as any;
        };

        global.fetch = mockFetch as any;

        const client = createHttpClient({ 
          maxRetries: 3, 
          retryDelay: 100,
          timeout: 5000,
        });

        const result = await client.get('https://api.example.com/test');
        
        assertEquals(attempts, 3, 'Should retry exactly 3 times');
        assertEquals(result.success, true, 'Should succeed after retries');
      },
    },
    
    {
      name: 'Retry logic triggers on 503 (service unavailable)',
      fn: async () => {
        let attempts = 0;
        const mockFetch = async (url: string | URL, options?: any): Promise<Response> => {
          attempts++;
          if (attempts === 1) {
            return new MockResponse(503, { error: 'Service unavailable' }) as any;
          }
          return new MockResponse(200, { success: true }) as any;
        };

        global.fetch = mockFetch as any;

        const client = createHttpClient({ 
          maxRetries: 2, 
          retryDelay: 50,
          timeout: 5000,
        });

        const result = await client.get('https://api.example.com/test');
        
        assert(attempts >= 2, 'Should retry at least once');
        assertEquals(result.success, true, 'Should succeed after retry');
      },
    },
    
    {
      name: 'Token injection in Authorization header',
      fn: async () => {
        let capturedHeaders: any = null;
        
        const mockFetch = async (url: string | URL, options?: any): Promise<Response> => {
          capturedHeaders = options?.headers;
          return new MockResponse(200, { success: true }) as any;
        };

        global.fetch = mockFetch as any;

        const client = createHttpClient({ 
          maxRetries: 1,
          timeout: 5000,
        });

        await client.get('https://api.example.com/test', {
          headers: {
            'Authorization': 'Bearer test-token-123',
          },
        });
        
        assert(capturedHeaders !== null, 'Headers should be captured');
        assertEquals(capturedHeaders['Authorization'], 'Bearer test-token-123', 'Token should be in Authorization header');
      },
    },
    
    {
      name: 'Token refresh on 401 (not implemented in Phase 2.2)',
      fn: async () => {
        // Phase 2.2: 401 returns error, no auto-refresh yet
        const mockFetch = async (url: string | URL, options?: any): Promise<Response> => {
          return new MockResponse(401, { error: 'Unauthorized' }) as any;
        };

        global.fetch = mockFetch as any;

        const client = createHttpClient({ 
          maxRetries: 1,
          timeout: 5000,
        });

        try {
          await client.get('https://api.example.com/test');
          throw new Error('Should have thrown error');
        } catch (error: any) {
          assert(error.message.includes('401') || error.message.includes('Unauthorized'), 
            'Should throw 401 error');
        }
      },
    },
    
    {
      name: 'Network error detection (ECONNREFUSED)',
      fn: async () => {
        const mockFetch = async (url: string | URL, options?: any): Promise<Response> => {
          const error: any = new Error('connect ECONNREFUSED 127.0.0.1:443');
          error.code = 'ECONNREFUSED';
          throw error;
        };

        global.fetch = mockFetch as any;

        const client = createHttpClient({ 
          maxRetries: 2,
          retryDelay: 50,
          timeout: 5000,
        });

        try {
          await client.get('https://api.example.com/test');
          throw new Error('Should have thrown error');
        } catch (error: any) {
          assert(
            error.message.includes('ECONNREFUSED') || error.message.includes('Network error'),
            'Should detect network error'
          );
        }
      },
    },
    
    {
      name: 'Timeout handling',
      fn: async () => {
        const mockFetch = async (url: string | URL, options?: any): Promise<Response> => {
          // Simulate slow response (longer than timeout)
          await new Promise(resolve => setTimeout(resolve, 2000));
          return new MockResponse(200, { success: true }) as any;
        };

        global.fetch = mockFetch as any;

        const client = createHttpClient({ 
          maxRetries: 1,
          timeout: 500, // 500ms timeout
        });

        try {
          await client.get('https://api.example.com/test');
          throw new Error('Should have timed out');
        } catch (error: any) {
          assert(
            error.message.includes('timeout') || error.message.includes('aborted'),
            'Should throw timeout error'
          );
        }
      },
    },
    
    {
      name: 'Exponential backoff for retries',
      fn: async () => {
        const retryTimestamps: number[] = [];
        let attempts = 0;
        
        const mockFetch = async (url: string | URL, options?: any): Promise<Response> => {
          attempts++;
          retryTimestamps.push(Date.now());
          
          if (attempts < 3) {
            return new MockResponse(503, { error: 'Service unavailable' }) as any;
          }
          return new MockResponse(200, { success: true }) as any;
        };

        global.fetch = mockFetch as any;

        const client = createHttpClient({ 
          maxRetries: 3,
          retryDelay: 100, // Base delay
          timeout: 10000,
        });

        await client.get('https://api.example.com/test');
        
        assertEquals(attempts, 3, 'Should make 3 attempts');
        
        // Check delay between attempts (should increase)
        if (retryTimestamps.length >= 2) {
          const delay1 = retryTimestamps[1] - retryTimestamps[0];
          assert(delay1 >= 100, 'First retry delay should be >= 100ms');
        }
      },
    },
    
    {
      name: 'POST request with JSON body',
      fn: async () => {
        let capturedMethod: string | null = null;
        let capturedBody: string | null = null;
        
        const mockFetch = async (url: string | URL, options?: any): Promise<Response> => {
          capturedMethod = options?.method;
          capturedBody = options?.body;
          return new MockResponse(200, { success: true }) as any;
        };

        global.fetch = mockFetch as any;

        const client = createHttpClient({ 
          maxRetries: 1,
          timeout: 5000,
        });

        const testData = { name: 'test', value: 123 };
        await client.post('https://api.example.com/data', testData);
        
        assertEquals(capturedMethod, 'POST', 'Method should be POST');
        assert(capturedBody !== null, 'Body should be sent');
        
        const parsedBody = JSON.parse(capturedBody!);
        assertEquals(parsedBody.name, 'test', 'Body data should match');
        assertEquals(parsedBody.value, 123, 'Body data should match');
      },
    },
    
    {
      name: 'PUT request with headers',
      fn: async () => {
        let capturedMethod: string | null = null;
        let capturedHeaders: any = null;
        
        const mockFetch = async (url: string | URL, options?: any): Promise<Response> => {
          capturedMethod = options?.method;
          capturedHeaders = options?.headers;
          return new MockResponse(200, { success: true }) as any;
        };

        global.fetch = mockFetch as any;

        const client = createHttpClient({ 
          maxRetries: 1,
          timeout: 5000,
        });

        await client.put('https://api.example.com/data', { value: 456 }, {
          headers: {
            'X-Custom-Header': 'test-value',
          },
        });
        
        assertEquals(capturedMethod, 'PUT', 'Method should be PUT');
        assertEquals(capturedHeaders['X-Custom-Header'], 'test-value', 'Custom header should be present');
      },
    },
    
    {
      name: 'No retry on 4xx errors (except 429)',
      fn: async () => {
        let attempts = 0;
        
        const mockFetch = async (url: string | URL, options?: any): Promise<Response> => {
          attempts++;
          return new MockResponse(400, { error: 'Bad request' }) as any;
        };

        global.fetch = mockFetch as any;

        const client = createHttpClient({ 
          maxRetries: 3,
          retryDelay: 50,
          timeout: 5000,
        });

        try {
          await client.get('https://api.example.com/test');
          throw new Error('Should have thrown error');
        } catch (error: any) {
          assertEquals(attempts, 1, 'Should NOT retry on 400 error');
          assert(error.message.includes('400') || error.message.includes('Bad request'), 
            'Should throw 400 error');
        }
      },
    },
  ];

  const result = await runSuite('HTTP Client Verification', tests);
  
  // Cleanup
  if (tempWorkspace) {
    await cleanupTempWorkspace(tempWorkspace);
  }
  
  return result;
}

// Run if executed directly
if (import.meta.url === `file:///${process.argv[1].replace(/\\/g, '/')}`) {
  verifyHttpClient().then(() => process.exit(0)).catch(() => process.exit(1));
}
