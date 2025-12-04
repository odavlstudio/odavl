// Test actual PR Review code detection
const code = `
export function login(password: string) {
  // Hardcoded secret
  const secret = 'my-secret-key';
  return verify(password, secret);
}
          `;

const secretRegex = /\b(secret|SECRET)\s*[:=]\s*['"]([^'"]+)['"]/gi;
const matches = Array.from(code.matchAll(secretRegex));

console.log('Code:', code);
console.log('Matches:', matches);
console.log('Match count:', matches.length);
