/**
 * Fetch Wrapper Utility
 *
 * Provides a robust fetch wrapper with:
 * - Automatic timeout configuration
 * - Response status validation
 * - Retry logic with exponential backoff
 * - Error handling
 * - Request/response logging
 */

import { logger } from '@/lib/logger';

export interface FetchOptions extends RequestInit {
  timeout?: number;
  retries?: number;
  retryDelay?: number;
  validateStatus?: (status: number) => boolean;
  logRequests?: boolean;
}

export interface FetchResponse<T = any> {
  data: T;
  status: number;
  statusText: string;
  headers: Headers;
  ok: boolean;
  json: () => Promise<any>;
  blob: () => Promise<Blob>;
  text: () => Promise<string>;
}

/**
 * Enhanced fetch with timeout, retries, and validation
 */
export async function fetchWithTimeout<T = any>(
  url: string,
  options: FetchOptions = {}
): Promise<FetchResponse<T>> {
  const {
    timeout = 10000, // 10s default
    retries = 3,
    retryDelay = 1000,
    validateStatus = (status) => status >= 200 && status < 300,
    logRequests = process.env.NODE_ENV === 'development',
    ...fetchOptions
  } = options;

  let lastError: Error | null = null;
  let attempt = 0;

  while (attempt < retries) {
    try {
      if (logRequests) {
        logger.debug('Fetch request', {
          url,
          method: fetchOptions.method || 'GET',
          attempt: attempt + 1,
          retries,
        });
      }

      // Create abort controller for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      try {
        const response = await fetch(url, {
          ...fetchOptions,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        // Validate response status
        if (!validateStatus(response.status)) {
          throw new Error(
            `HTTP ${response.status}: ${response.statusText}. URL: ${url}`
          );
        }

        // Parse response
        const contentType = response.headers.get('content-type');
        let data: T;

        if (contentType?.includes('application/json')) {
          data = await response.json();
        } else if (contentType?.includes('text/')) {
          data = (await response.text()) as T;
        } else {
          data = (await response.blob()) as T;
        }

        if (logRequests) {
          logger.debug('Fetch response', {
            url,
            status: response.status,
            attempt: attempt + 1,
          });
        }

        // Create a reference to the response for reusable methods
        const responseClone = response.clone();

        return {
          data,
          status: response.status,
          statusText: response.statusText,
          headers: response.headers,
          ok: response.ok,
          json: async () => responseClone.clone().json(),
          blob: async () => responseClone.clone().blob(),
          text: async () => responseClone.clone().text(),
        };
      } catch (error) {
        clearTimeout(timeoutId);

        if ((error as Error).name === 'AbortError') {
          throw new Error(`Request timeout after ${timeout}ms: ${url}`);
        }

        throw error;
      }
    } catch (error) {
      lastError = error as Error;
      attempt++;

      if (attempt < retries) {
        const delay = retryDelay * Math.pow(2, attempt - 1); // Exponential backoff
        logger.warn('Fetch retry', {
          url,
          attempt,
          retries,
          delay,
          error: lastError.message,
        });

        await new Promise((resolve) => setTimeout(resolve, delay));
      } else {
        logger.error('Fetch failed after retries', {
          url,
          attempts: attempt,
          error: lastError.message,
        });
      }
    }
  }

  throw lastError || new Error('Request failed');
}

/**
 * Convenience methods for common HTTP verbs
 */
export const http = {
  async get<T = any>(url: string, options: FetchOptions = {}): Promise<FetchResponse<T>> {
    return fetchWithTimeout<T>(url, { ...options, method: 'GET' });
  },

  async post<T = any>(
    url: string,
    body: any,
    options: FetchOptions = {}
  ): Promise<FetchResponse<T>> {
    return fetchWithTimeout<T>(url, {
      ...options,
      method: 'POST',
      body: JSON.stringify(body),
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });
  },

  async put<T = any>(
    url: string,
    body: any,
    options: FetchOptions = {}
  ): Promise<FetchResponse<T>> {
    return fetchWithTimeout<T>(url, {
      ...options,
      method: 'PUT',
      body: JSON.stringify(body),
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });
  },

  async delete<T = any>(url: string, options: FetchOptions = {}): Promise<FetchResponse<T>> {
    return fetchWithTimeout<T>(url, { ...options, method: 'DELETE' });
  },

  async patch<T = any>(
    url: string,
    body: any,
    options: FetchOptions = {}
  ): Promise<FetchResponse<T>> {
    return fetchWithTimeout<T>(url, {
      ...options,
      method: 'PATCH',
      body: JSON.stringify(body),
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });
  },
};

/**
 * Batch fetch utility (replaces N+1 fetch calls)
 */
export async function fetchBatch<T = any>(
  urls: string[],
  options: FetchOptions = {}
): Promise<FetchResponse<T>[]> {
  return Promise.all(urls.map((url) => fetchWithTimeout<T>(url, options)));
}

/**
 * Parallel fetch with concurrency limit
 */
export async function fetchParallel<T = any>(
  urls: string[],
  options: FetchOptions = {},
  concurrency = 5
): Promise<FetchResponse<T>[]> {
  const results: FetchResponse<T>[] = [];
  const queue = [...urls];

  async function processNext(): Promise<void> {
    const url = queue.shift();
    if (!url) return;

    const result = await fetchWithTimeout<T>(url, options);
    results.push(result);

    if (queue.length > 0) {
      await processNext();
    }
  }

  const workers = Array.from({ length: Math.min(concurrency, urls.length) }, () =>
    processNext()
  );

  await Promise.all(workers);

  return results;
}
