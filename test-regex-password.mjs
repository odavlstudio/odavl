const code = `const secret = 'my-secret-key';`;

const secretRegex = /\b(secret|SECRET)\s*[:=]\s*['"]([^'"]+)['"]/gi;

console.log('=== Test: Secret detection ===');
console.log('Code:', code);
console.log('Secret matches:', Array.from(code.matchAll(secretRegex)));

