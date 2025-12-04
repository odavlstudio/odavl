// Start Guardian API Server
require('dotenv').config();
const { startServer } = require('../dist/server.js');

console.log('Starting Guardian API Server...');
console.log('PORT:', process.env.PORT);
console.log('API_KEYS:', process.env.API_KEYS);

startServer();
