const fs = require('node:fs');
const path = require('node:path');
const { execSync } = require('node:child_process');

let rootDir;
try {
    rootDir = execSync('git rev-parse --show-toplevel').toString().trim();
} catch {
    rootDir = path.resolve(__dirname, '../../');
}
const assetsDir = path.join(rootDir, 'apps', 'vscode-ext', 'dist', 'webview', 'assets');

console.log('🔍 Checking assets at:', assetsDir);

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
