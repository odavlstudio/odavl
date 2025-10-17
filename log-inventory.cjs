// ODAVL Log Inventory Script
// Recursively lists all files in logs/ and outputs to static/logs-inventory.txt
const fs = require('fs');
const path = require('path');

function walk(dir, fileList = []) {
    if (!fs.existsSync(dir)) {
        console.warn(`WARNING: logs folder does not exist: ${dir}`);
        return fileList;
    }
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const filePath = path.join(dir, file);
        let stat;
        try {
            stat = fs.statSync(filePath);
        } catch (e) {
            fileList.push(`${filePath} [ERROR: ${e.message}]`);
            continue;
        }
        if (stat.isDirectory()) {
            walk(filePath, fileList);
        } else if (stat.isFile()) {
            fileList.push(filePath);
        }
    }
    return fileList;
}

const logsDir = path.join(process.cwd(), 'logs');
const outFile = path.join(process.cwd(), 'static', 'logs-inventory.txt');
const result = walk(logsDir);
fs.writeFileSync(outFile, result.join('\n'));
console.log(`Log inventory complete: ${result.length} files. Output: ${outFile}`);
