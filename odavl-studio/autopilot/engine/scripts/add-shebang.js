// Ensures #!/usr/bin/env node is present at the top of dist/index.js
const fs = require('node:fs');
const path = require('node:path');
const distPath = path.join(__dirname, '..', 'dist', 'index.js');
const shebang = '#!/usr/bin/env node\n';
if (fs.existsSync(distPath)) {
    const content = fs.readFileSync(distPath, 'utf8');
    if (!content.startsWith(shebang)) {
        fs.writeFileSync(distPath, shebang + content, 'utf8');
        console.log('Shebang added to dist/index.js');
    }
}
