const code = `
// Large file with potential security issue
const apiConfig = {
  apiKey: 'sk-real-api-key-not-placeholder',
  secret: 'my-secret-value-12345'
};
      `.repeat(80);

console.log('Total lines:', code.split('\n').length);
console.log('Should use AI (>500)?', code.split('\n').length > 500);
console.log('Should use Semantic (50-500)?', code.split('\n').length > 50 && code.split('\n').length < 500);
