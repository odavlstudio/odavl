/**
 * ODAVL Insight Test Project - Main Entry Point
 * 
 * This file intentionally contains detectable issues for testing:
 * 1. Unused variable (line 10)
 * 2. 'any' type usage (line 14)
 * 3. Missing return type annotation (line 18)
 * 4. Implicit any parameter (line 23)
 */

const UNUSED_CONSTANT = "This is never used"; // Issue: unused variable

// Issue: 'any' type - should be string
function greet(name: any): void {
  console.log(`Hello, ${name}!`);
}

// Issue: Missing return type annotation
function calculate(a: number, b: number) {
  return a + b;
}

// Issue: Implicit any parameter
function processData(data) {
  return data.toString();
}

// Actual usage (but with issues above)
const API_KEY = "test-api-key-1234"; // Detectable: hardcoded credential
greet("World");
console.log(calculate(5, 10));
console.log(processData(42));

export { greet, calculate };
