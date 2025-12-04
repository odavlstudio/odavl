// Test file to generate stack trace for Guardian testing

function level3() {
  throw new Error('Test error with stack trace');
}

function level2() {
  level3();
}

function level1() {
  level2();
}

try {
  level1();
} catch (error) {
  console.error(error.stack);
}
