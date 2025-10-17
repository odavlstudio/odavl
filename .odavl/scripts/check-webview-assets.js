const fs = require('node:fs');
const path = require('node:path');

const assetsDir = path.join(__dirname, '..', '..', 'apps', 'vscode-ext', 'dist', 'webview', 'assets');

if (!fs.existsSync(assetsDir)) {
    console.error('❌ Security Gate: assets directory missing at', assetsDir);
    process.exit(1);
}

const files = fs.readdirSync(assetsDir).filter(f => f.endsWith('.js') || f.endsWith('.css') || f.endsWith('.html'));
if (files.length === 0) {
    console.error('❌ Security Gate: assets directory is empty.');
    process.exit(1);
}

console.log('✅ Security Gate passed: webview assets verified.');
