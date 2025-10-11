// ODAVL-WAVE-X8-INJECT: Jest Configuration Template - Unit & Integration Tests
// @odavl-governance: TESTING-SAFE mode active
// To activate: npm install --save-dev jest @testing-library/react @testing-library/jest-dom

export interface TestConfig {
  setupFilesAfterEnv: string[];
  testEnvironment: string;
  testMatch: string[];
  collectCoverageFrom: string[];
  coverageThreshold: {
    global: {
      branches: number;
      functions: number;
      lines: number;
      statements: number;
    };
  };
  moduleNameMapping: Record<string, string>;
  testPathIgnorePatterns: string[];
}

export const testConfig: TestConfig = {
  setupFilesAfterEnv: ['<rootDir>/config/tests/jest.setup.ts'],
  testEnvironment: 'jsdom',
  testMatch: [
    '<rootDir>/src/tests/**/*.test.{js,jsx,ts,tsx}',
    '<rootDir>/src/**/__tests__/**/*.{js,jsx,ts,tsx}',
  ],
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/tests/**/*',
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  testPathIgnorePatterns: [
    '<rootDir>/.next/',
    '<rootDir>/node_modules/',
  ],
};