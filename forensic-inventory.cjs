// ODAVL Forensic Scan Node.js Fallback Script
// Recursively lists all files and computes SHA256 checksums, sizes, and mtimes
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

function walk(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    let stat;
    try {
      stat = fs.statSync(filePath);
    } catch (e) {
      fileList.push({ path: filePath, error: e.message });
      continue;
    }
    if (stat.isDirectory()) {
      walk(filePath, fileList);
    } else if (stat.isFile()) {
      let hash = null;
      try {
        const fileBuffer = fs.readFileSync(filePath);
        hash = crypto.createHash('sha256').update(fileBuffer).digest('hex');
      } catch (e) {
        fileList.push({ path: filePath, error: e.message });
        continue;
      }
      fileList.push({
        path: filePath,
        size: stat.size,
        mtime: stat.mtime.toISOString(),
        sha256: hash
      });
    }
  }
  return fileList;
}

const root = process.argv[2] || process.cwd();
const outFile = process.argv[3] || 'reports/forensic-20251014/inventory/files-and-hashes.json';
if (!fs.existsSync(root)) {
  console.warn(`WARNING: Inventory root folder does not exist: ${root}`);
  fs.writeFileSync(outFile, JSON.stringify([{ error: `Missing folder: ${root}` }], null, 2));
  process.exit(0);
}
const result = walk(root);
fs.writeFileSync(outFile, JSON.stringify(result, null, 2));
console.log(`Inventory complete: ${result.length} files. Output: ${outFile}`);
