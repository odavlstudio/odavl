const http = require('http');

const options = {
  hostname: 'localhost',
  port: 3003,
  path: '/api/health',
  method: 'GET',
  timeout: 5000
};

console.log('Testing Guardian API...');

const req = http.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => {
    console.log('✅ Status:', res.statusCode);
    try {
      const json = JSON.parse(data);
      console.log('✅ Response:', JSON.stringify(json, null, 2));
    } catch (e) {
      console.log('⚠️ Raw Response:', data);
    }
  });
});

req.on('error', (e) => {
  console.error('❌ Error:', e.message);
  process.exit(1);
});

req.on('timeout', () => {
  console.error('❌ Timeout after 5s');
  req.destroy();
  process.exit(1);
});

req.end();
