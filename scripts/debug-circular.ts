#!/usr/bin/env tsx

/**
 * Debug script to check circular dependency detection
 */

import * as fs from 'node:fs/promises';

async function main() {
  const code = await fs.readFile('test-fixtures/java/ArchitectureSample.java', 'utf-8');
  
  const skipAfterLine = 230;
  
  // Build dependency graph by extracting each class individually
  const classDeps = new Map<string, { deps: string[], line: number }>();
  
  // Find all class declarations
  const classDeclarations: Array<{ name: string; line: number; startIdx: number }> = [];
  const classHeaderRegex = /class\s+(\w+)\s*\{/g;
  
  let match;
  while ((match = classHeaderRegex.exec(code)) !== null) {
    const className = match[1];
    const lineNumber = code.substring(0, match.index).split('\n').length;
    
    if (lineNumber > skipAfterLine) continue;
    if (className.startsWith('Good') || className === 'Order') continue;
    
    classDeclarations.push({
      name: className,
      line: lineNumber,
      startIdx: match.index,
    });
  }
  
  console.log(`Found ${classDeclarations.length} classes:\n`);
  
  // For each class, extract its body (next 500 chars) and find dependencies
  for (const classDecl of classDeclarations) {
    const classBody = code.substring(classDecl.startIdx, classDecl.startIdx + 500);
    
    // Find all private field dependencies
    const depMatches = classBody.matchAll(/private\s+(?:List<)?(\w+)(?:>)?\s+\w+;/g);
    const deps: string[] = [];
    
    for (const depMatch of depMatches) {
      const depType = depMatch[1];
      // Only track class dependencies (capitalize, not primitives)
      if (depType.match(/^[A-Z]/) && 
          depType !== 'String' && depType !== 'List' && depType !== 'Date') {
        deps.push(depType);
      }
    }
    
    classDeps.set(classDecl.name, { deps, line: classDecl.line });
    
    console.log(`Class: ${classDecl.name} (line ${classDecl.line})`);
    console.log(`  Dependencies: ${deps.length > 0 ? deps.join(', ') : 'none'}`);
  }
  
  console.log('\n\nChecking for circular dependencies:\n');
  
  // Pattern 3a: Direct circular dependency (A → B, B → A)
  const checkedPairs = new Set<string>();
  
  for (const [classA, { deps: depsA, line: lineA }] of classDeps.entries()) {
    for (const classB of depsA) {
      const pairKey = [classA, classB].sort().join('-');
      if (checkedPairs.has(pairKey)) continue;
      checkedPairs.add(pairKey);
      
      const classBInfo = classDeps.get(classB);
      if (classBInfo && classBInfo.deps.includes(classA)) {
        console.log(`✅ CIRCULAR: ${classA} ↔ ${classB}`);
      }
    }
  }
}

main();
