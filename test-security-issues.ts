// Test file with security vulnerabilities
const API_KEY = "sk-1234567890abcdef"; // Hardcoded secret
const PASSWORD = "admin123"; // Weak password

function queryDatabase(userInput: string) {
  // SQL Injection vulnerability
  const query = `SELECT * FROM users WHERE name = '${userInput}'`;
  return query;
}

function renderHTML(data: string) {
  // XSS vulnerability
  document.innerHTML = data;
}

// Eval usage
eval("console.log('dangerous')");

// Unsafe redirect
window.location.href = userProvidedUrl;
