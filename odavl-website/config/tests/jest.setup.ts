// ODAVL-WAVE-X8-INJECT: Jest Setup Template - Testing Environment Configuration
// @odavl-governance: TESTING-SAFE mode active
// To activate: npm install --save-dev jest @testing-library/react @testing-library/jest-dom

export const testSetupInstructions = `
1. Install testing dependencies:
   npm install --save-dev jest @testing-library/react @testing-library/jest-dom @types/jest

2. Uncomment the mocks below and import '@testing-library/jest-dom'

3. Add to package.json:
   "test": "jest --config=config/tests/jest.config.ts",
   "test:watch": "jest --config=config/tests/jest.config.ts --watch"
`;

// Mock configurations will be added here when Jest dependencies are installed