// scripts/generate-risk-token.js
// ODAVL 100/10 Wave 5: Risk Token & Undo System
// Generates risk token metadata for the current CI run

const fs = require('node:fs');
const path = require('node:path');

// Find latest undo snapshot
const undoDir = path.resolve(__dirname, '../.odavl/undo');
const files = fs.readdirSync(undoDir).filter(f => f.endsWith('.json'));
const latest = files.includes('latest.json') ? 'latest.json' : files.sort().reverse()[0];
const undo = JSON.parse(fs.readFileSync(path.join(undoDir, latest), 'utf8'));

const riskToken = {
    timestamp: undo.timestamp,
    filesChanged: undo.modifiedFiles ? undo.modifiedFiles.length : 0,
    files: undo.modifiedFiles || [],
    // Add more risk metrics as needed
};

const outPath = path.resolve(__dirname, '../reports/shadow/risk-token.json');
fs.writeFileSync(outPath, JSON.stringify(riskToken, null, 2));
console.log('Risk token metadata generated:', outPath);
