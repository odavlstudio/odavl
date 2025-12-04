// Vitest setup file
// Configures testing environment for Next.js + React 19

import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { afterEach, beforeAll, afterAll, vi } from 'vitest';

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
    pathname: '/',
    query: {},
    asPath: '/',
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
  useParams: () => ({}),
}));

// Mock Next.js server actions
vi.mock('next/server', () => ({
  NextResponse: {
    json: (data: unknown, init?: ResponseInit) => new Response(JSON.stringify(data), {
      ...init,
      headers: {
        'content-type': 'application/json',
        ...init?.headers,
      },
    }),
    redirect: (url: string) => new Response(null, {
      status: 307,
      headers: { Location: url },
    }),
  },
  NextRequest: class NextRequest extends Request {},
}));

// Mock environment variables
process.env.NEXTAUTH_URL = 'http://localhost:3001';
process.env.NEXTAUTH_SECRET = 'test-secret';
process.env.DATABASE_URL = 'file:./test.db';

// Suppress console warnings in tests (optional)
const originalWarn = console.warn;
const originalError = console.error;

beforeAll(() => {
  console.warn = vi.fn();
  console.error = vi.fn();
});

afterAll(() => {
  console.warn = originalWarn;
  console.error = originalError;
});
