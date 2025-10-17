// scripts/postbuild.js
const fs = require('node:fs');
const path = require('node:path');

const rootDir = path.resolve(__dirname, '..');
const srcDir = path.join(rootDir, 'webview');
const destDir = path.join(rootDir, 'dist', 'webview', 'assets');

console.log('srcDir:', srcDir);
console.log('destDir:', destDir);
console.log('Current working dir:', process.cwd());

fs.mkdirSync(destDir, { recursive: true });

for (const file of fs.readdirSync(srcDir)) {
    if (file.endsWith('.js') || file.endsWith('.css') || file.endsWith('.html')) {
        fs.copyFileSync(path.join(srcDir, file), path.join(destDir, file));
        console.log(`Copied: ${file}`);
    }
}
if (fs.existsSync(destDir)) {
    console.log('✅ Assets copied successfully to', destDir);
} else {
    console.error('❌ Copy failed, destination not found');
}
