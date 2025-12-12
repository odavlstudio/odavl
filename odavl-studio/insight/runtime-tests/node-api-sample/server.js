const express = require('express');
const app = express();

// BAD: Hardcoded secret (security issue)
const API_KEY = 'sk-1234567890abcdef-HARDCODED-SECRET';
const unusedConfig = { timeout: 5000 }; // BAD: Unused variable

app.use(express.json());

app.get('/api/data', (req, res) => {
  // BAD: Blocking synchronous operation
  const start = Date.now();
  while (Date.now() - start < 1000) {
    // Intentional blocking for 1 second
  }
  
  res.json({ message: 'Data fetched', key: API_KEY });
});

app.post('/api/users', (req, res) => {
  const { name, email } = req.body;
  
  // BAD: No input validation
  res.json({ id: Math.random(), name, email });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;
