// Add shebang to compiled output
const fs = require('fs');
const path = require('path');

const distPath = path.join(__dirname, '..', 'dist', 'index.js');
const content = fs.readFileSync(distPath, 'utf8');

if (!content.startsWith('#!')) {
    fs.writeFileSync(distPath, `#!/usr/bin/env node\n${content}`, 'utf8');
    console.log('✓ Shebang added to dist/index.js');
}
