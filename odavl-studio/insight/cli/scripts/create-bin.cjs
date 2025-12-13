/**
 * Create executable bin script for odavl-insight CLI
 */

const fs = require('fs');
const path = require('path');

const binDir = path.join(__dirname, '../bin');
const binPath = path.join(binDir, 'odavl-insight.js');

// Create bin directory if it doesn't exist
if (!fs.existsSync(binDir)) {
  fs.mkdirSync(binDir, { recursive: true });
}

// Create bin script that points to dist/index.js
const binScript = `#!/usr/bin/env node
import('../dist/index.js').catch((err) => {
  console.error('Failed to load CLI:', err);
  process.exit(1);
});
`;

fs.writeFileSync(binPath, binScript, 'utf8');

// Make executable (Unix permissions)
if (process.platform !== 'win32') {
  fs.chmodSync(binPath, '755');
}

console.log('✅ Created bin/odavl-insight.js');
