const fs = require('node:fs');
const path = require('node:path');

// Add shebang to the top of the CLI entrypoint (dist/index.js for CJS)
const cliPath = path.join(__dirname, '../dist/index.js');
const shebang = '#!/usr/bin/env node\n';

if (fs.existsSync(cliPath)) {
    const content = fs.readFileSync(cliPath, 'utf8');
    if (!content.startsWith(shebang)) {
        fs.writeFileSync(cliPath, shebang + content, 'utf8');
        console.log('Shebang added to CLI entrypoint.');
    } else {
        console.log('Shebang already present.');
    }
} else {
    console.error('CLI entrypoint not found:', cliPath);
    process.exit(1);
}
