#!/usr/bin/env node
/**
 * ODAVL Diff Limit Checker
 * Enforces ≤40 lines changed, ≤10 files modified per PR
 */

import { execSync } from 'child_process';

const MAX_LINES = 40;
const MAX_FILES = 10;

function main() {
  try {
    console.log('🔍 Checking ODAVL diff constraints...');
    
    // Get diff stats
    const diffOutput = execSync('git diff --numstat origin/main...HEAD', { 
      encoding: 'utf8' 
    }).trim();
    
    if (!diffOutput) {
      console.log('✅ PASSED: No changes detected');
      return;
    }
    
    const files = diffOutput.split('\n');
    const fileCount = files.length;
    
    let totalLinesChanged = 0;
    const fileDetails = [];
    
    for (const line of files) {
      const [added, deleted, filename] = line.split('\t');
      const linesChanged = parseInt(added || 0) + parseInt(deleted || 0);
      totalLinesChanged += linesChanged;
      
      fileDetails.push({
        filename,
        added: parseInt(added || 0),
        deleted: parseInt(deleted || 0),
        total: linesChanged
      });
    }
    
    // Check file limit
    if (fileCount > MAX_FILES) {
      console.log(`❌ BLOCKED: Too many files modified`);
      console.log(`   Limit: ${MAX_FILES} files`);
      console.log(`   Actual: ${fileCount} files`);
      console.log('\nFiles modified:');
      fileDetails.forEach(f => console.log(`   ${f.filename} (+${f.added}/-${f.deleted})`));
      process.exit(1);
    }
    
    // Check line limit
    if (totalLinesChanged > MAX_LINES) {
      console.log(`❌ BLOCKED: Too many lines changed`);
      console.log(`   Limit: ${MAX_LINES} lines`);
      console.log(`   Actual: ${totalLinesChanged} lines`);
      console.log('\nBreakdown by file:');
      fileDetails
        .sort((a, b) => b.total - a.total)
        .forEach(f => console.log(`   ${f.total} lines: ${f.filename} (+${f.added}/-${f.deleted})`));
      process.exit(1);
    }
    
    // Success
    console.log(`✅ PASSED: Diff constraints satisfied`);
    console.log(`   Files: ${fileCount}/${MAX_FILES}`);
    console.log(`   Lines: ${totalLinesChanged}/${MAX_LINES}`);
    console.log('\nFiles modified:');
    fileDetails.forEach(f => console.log(`   ${f.filename}: +${f.added}/-${f.deleted} (${f.total} total)`));
    
  } catch (error) {
    console.error('❌ ERROR: Failed to check diff constraints');
    console.error(error.message);
    process.exit(1);
  }
}

main();