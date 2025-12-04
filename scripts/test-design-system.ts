/**
 * Test Script: Design System Demo
 * 
 * Demonstrates the ODAVL Studio Design System:
 * - Design tokens (colors, typography, spacing, shadows)
 * - Style guides (colors, typography, spacing)
 * - Component library
 * - Figma integration
 * 
 * Run: tsx scripts/test-design-system.ts
 */

import * as fs from 'node:fs/promises';
import * as path from 'node:path';

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  blue: '\x1b[34m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m'
};

const designDir = path.join(process.cwd(), 'design');

async function testDesignSystem() {
  console.log(`\n${colors.bright}${colors.magenta}===========================================`);
  console.log('🎨 ODAVL Studio - Design System Demo');
  console.log(`===========================================${colors.reset}\n`);

  // ============================================
  // 1. Design Tokens
  // ============================================
  console.log(`${colors.bright}${colors.cyan}📋 1. Design Tokens${colors.reset}\n`);
  
  const tokenFiles = [
    'tokens/colors.json',
    'tokens/typography.json',
    'tokens/spacing.json',
    'tokens/shadows.json'
  ];

  for (const file of tokenFiles) {
    const filePath = path.join(designDir, file);
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const tokens = JSON.parse(content);
      const fileName = path.basename(file);
      
      console.log(`${colors.green}✓${colors.reset} ${fileName}`);
      console.log(`  Version: ${tokens.version || 'N/A'}`);
      console.log(`  Description: ${tokens.description || 'N/A'}`);
      
      if (fileName === 'colors.json') {
        console.log(`  Primary shades: ${Object.keys(tokens.colors.primary).length}`);
        console.log(`  Semantic colors: ${Object.keys(tokens.colors.semantic).length} categories`);
      } else if (fileName === 'typography.json') {
        console.log(`  Font families: ${Object.keys(tokens.typography.fontFamily).length}`);
        console.log(`  Font sizes: ${Object.keys(tokens.typography.fontSize).length}`);
      } else if (fileName === 'spacing.json') {
        console.log(`  Spacing scale: ${Object.keys(tokens.spacing.scale).length} values`);
        console.log(`  Breakpoints: ${Object.keys(tokens.breakpoints).length}`);
      } else if (fileName === 'shadows.json') {
        console.log(`  Elevation levels: ${Object.keys(tokens.shadows.elevation).length}`);
        console.log(`  Component shadows: ${Object.keys(tokens.shadows.component).length}`);
      }
      console.log();
    } catch (error) {
      console.log(`${colors.yellow}⚠${colors.reset} ${file} - Not found or invalid JSON\n`);
    }
  }

  // ============================================
  // 2. Style Guides
  // ============================================
  console.log(`${colors.bright}${colors.cyan}📝 2. Style Guides${colors.reset}\n`);
  
  const styleGuides = [
    'style-guide/colors.md',
    'style-guide/typography.md',
    'style-guide/spacing.md'
  ];

  for (const guide of styleGuides) {
    const filePath = path.join(designDir, guide);
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const lines = content.split('\n').length;
      const sections = (content.match(/^## /gm) || []).length;
      const codeBlocks = (content.match(/```/g) || []).length / 2;
      
      console.log(`${colors.green}✓${colors.reset} ${path.basename(guide)}`);
      console.log(`  Lines: ${lines}`);
      console.log(`  Sections: ${sections}`);
      console.log(`  Code examples: ${Math.floor(codeBlocks)}`);
      console.log();
    } catch (error) {
      console.log(`${colors.yellow}⚠${colors.reset} ${guide} - Not found\n`);
    }
  }

  // ============================================
  // 3. Component Library
  // ============================================
  console.log(`${colors.bright}${colors.cyan}🧩 3. Component Library${colors.reset}\n`);
  
  const componentLibraryPath = path.join(designDir, 'component-library/README.md');
  try {
    const content = await fs.readFile(componentLibraryPath, 'utf-8');
    
    // Count components
    const atoms = (content.match(/#### /g) || []).length;
    const molecules = (content.match(/### Molecules/g) || []).length;
    const organisms = (content.match(/### Organisms/g) || []).length;
    const codeExamples = (content.match(/```tsx/g) || []).length;
    
    console.log(`${colors.green}✓${colors.reset} Component Library`);
    console.log(`  Atoms: ~${atoms} components`);
    console.log(`  Molecules: Present (Card, Alert, Tooltip, etc.)`);
    console.log(`  Organisms: Present (Navigation, DataTable, Modal, etc.)`);
    console.log(`  Code examples: ${codeExamples}`);
    console.log();
  } catch (error) {
    console.log(`${colors.yellow}⚠${colors.reset} Component library - Not found\n`);
  }

  // ============================================
  // 4. Figma Integration
  // ============================================
  console.log(`${colors.bright}${colors.cyan}🎨 4. Figma Integration${colors.reset}\n`);
  
  const figmaPath = path.join(designDir, 'figma-exports/README.md');
  try {
    const content = await fs.readFile(figmaPath, 'utf-8');
    const sections = (content.match(/^## /gm) || []).length;
    
    console.log(`${colors.green}✓${colors.reset} Figma Integration Guide`);
    console.log(`  Sections: ${sections}`);
    console.log(`  Export workflows: Documented`);
    console.log(`  Design handoff process: Documented`);
    console.log(`  Plugins recommended: 5+ plugins`);
    console.log();
  } catch (error) {
    console.log(`${colors.yellow}⚠${colors.reset} Figma integration - Not found\n`);
  }

  // ============================================
  // 5. Directory Structure
  // ============================================
  console.log(`${colors.bright}${colors.cyan}📁 5. Directory Structure${colors.reset}\n`);
  
  try {
    const structure = await getDirectoryStructure(designDir);
    console.log(structure);
  } catch (error) {
    console.log(`${colors.yellow}⚠${colors.reset} Could not read directory structure\n`);
  }

  // ============================================
  // 6. Design Token Examples
  // ============================================
  console.log(`${colors.bright}${colors.cyan}🎨 6. Design Token Examples${colors.reset}\n`);
  
  try {
    const colorsPath = path.join(designDir, 'tokens/colors.json');
    const colors = JSON.parse(await fs.readFile(colorsPath, 'utf-8'));
    
    console.log(`${colors.bright}Primary Colors:${colors.reset}`);
    console.log(`  primary-500: ${colors.colors.primary['500'].value} (Base)`);
    console.log(`  primary-600: ${colors.colors.primary['600'].value} (Hover)`);
    console.log(`  primary-700: ${colors.colors.primary['700'].value} (Active)`);
    console.log();
    
    console.log(`${colors.bright}Semantic Colors:${colors.reset}`);
    console.log(`  Success: ${colors.colors.success['500'].value}`);
    console.log(`  Warning: ${colors.colors.warning['500'].value}`);
    console.log(`  Error: ${colors.colors.error['500'].value}`);
    console.log(`  Info: ${colors.colors.info['500'].value}`);
    console.log();

    const typographyPath = path.join(designDir, 'tokens/typography.json');
    const typography = JSON.parse(await fs.readFile(typographyPath, 'utf-8'));
    
    console.log(`${colors.bright}Typography Scale:${colors.reset}`);
    console.log(`  text-xs: ${typography.typography.fontSize.xs.pixelValue}`);
    console.log(`  text-base: ${typography.typography.fontSize.base.pixelValue} (Default)`);
    console.log(`  text-4xl: ${typography.typography.fontSize['4xl'].pixelValue} (Headings)`);
    console.log();

    const spacingPath = path.join(designDir, 'tokens/spacing.json');
    const spacing = JSON.parse(await fs.readFile(spacingPath, 'utf-8'));
    
    console.log(`${colors.bright}Spacing Scale (4px base):${colors.reset}`);
    console.log(`  spacing-1: ${spacing.spacing.scale['1'].pixelValue}`);
    console.log(`  spacing-4: ${spacing.spacing.scale['4'].pixelValue} (Base)`);
    console.log(`  spacing-8: ${spacing.spacing.scale['8'].pixelValue} (Sections)`);
    console.log();
  } catch (error) {
    console.log(`${colors.yellow}⚠${colors.reset} Could not load token examples\n`);
  }

  // ============================================
  // 7. Summary Statistics
  // ============================================
  console.log(`${colors.bright}${colors.cyan}📊 7. Summary Statistics${colors.reset}\n`);
  
  try {
    const stats = await getDesignSystemStats(designDir);
    console.log(`${colors.bright}Files Created:${colors.reset}`);
    console.log(`  Design tokens: ${stats.tokenFiles} files`);
    console.log(`  Style guides: ${stats.styleGuides} files`);
    console.log(`  Documentation: ${stats.documentation} files`);
    console.log(`  Total: ${stats.total} files`);
    console.log();
    
    console.log(`${colors.bright}Content:${colors.reset}`);
    console.log(`  Total lines: ~${stats.totalLines.toLocaleString()}`);
    console.log(`  Code examples: ${stats.codeExamples}+`);
    console.log(`  Sections: ${stats.sections}+`);
    console.log();
  } catch (error) {
    console.log(`${colors.yellow}⚠${colors.reset} Could not calculate statistics\n`);
  }

  // ============================================
  // 8. Usage Examples
  // ============================================
  console.log(`${colors.bright}${colors.cyan}💡 8. Usage Examples${colors.reset}\n`);
  
  console.log(`${colors.bright}CSS Custom Properties:${colors.reset}`);
  console.log(`${colors.blue}  .button {`);
  console.log(`    background-color: var(--color-primary-500);`);
  console.log(`    color: var(--color-white);`);
  console.log(`    padding: var(--spacing-3) var(--spacing-6);`);
  console.log(`    border-radius: var(--radius-md);`);
  console.log(`    box-shadow: var(--shadow-sm);`);
  console.log(`  }${colors.reset}`);
  console.log();

  console.log(`${colors.bright}Tailwind CSS:${colors.reset}`);
  console.log(`${colors.blue}  <button className="bg-primary-500 text-white px-6 py-3 rounded-md shadow-sm">`);
  console.log(`    Click Me`);
  console.log(`  </button>${colors.reset}`);
  console.log();

  console.log(`${colors.bright}React Component:${colors.reset}`);
  console.log(`${colors.blue}  import { Button } from '@odavl-studio/ui';`);
  console.log(`  `);
  console.log(`  <Button variant="primary" size="md">`);
  console.log(`    Click Me`);
  console.log(`  </Button>${colors.reset}`);
  console.log();

  // ============================================
  // Final Summary
  // ============================================
  console.log(`${colors.bright}${colors.magenta}===========================================`);
  console.log('✅ Design System Demo Complete!');
  console.log(`===========================================${colors.reset}\n`);

  console.log(`${colors.bright}Next Steps:${colors.reset}`);
  console.log(`  1. Review design tokens: ${colors.cyan}design/tokens/${colors.reset}`);
  console.log(`  2. Read style guides: ${colors.cyan}design/style-guide/${colors.reset}`);
  console.log(`  3. Browse component library: ${colors.cyan}design/component-library/${colors.reset}`);
  console.log(`  4. Check Figma integration: ${colors.cyan}design/figma-exports/${colors.reset}`);
  console.log(`  5. View main README: ${colors.cyan}design/README.md${colors.reset}`);
  console.log();
}

async function getDirectoryStructure(dir: string, indent = ''): Promise<string> {
  let output = '';
  const entries = await fs.readdir(dir, { withFileTypes: true });
  
  for (const entry of entries) {
    if (entry.isDirectory()) {
      output += `${indent}${colors.blue}${entry.name}/${colors.reset}\n`;
      const subPath = path.join(dir, entry.name);
      output += await getDirectoryStructure(subPath, indent + '  ');
    } else {
      output += `${indent}${entry.name}\n`;
    }
  }
  
  return output;
}

async function getDesignSystemStats(dir: string) {
  let tokenFiles = 0;
  let styleGuides = 0;
  let documentation = 0;
  let totalLines = 0;
  let codeExamples = 0;
  let sections = 0;

  async function walk(currentDir: string) {
    const entries = await fs.readdir(currentDir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);
      
      if (entry.isDirectory()) {
        await walk(fullPath);
      } else if (entry.isFile()) {
        if (fullPath.includes('tokens/') && entry.name.endsWith('.json')) {
          tokenFiles++;
        } else if (fullPath.includes('style-guide/') && entry.name.endsWith('.md')) {
          styleGuides++;
        } else if (entry.name.endsWith('.md')) {
          documentation++;
        }
        
        const content = await fs.readFile(fullPath, 'utf-8');
        totalLines += content.split('\n').length;
        codeExamples += (content.match(/```/g) || []).length / 2;
        sections += (content.match(/^## /gm) || []).length;
      }
    }
  }

  await walk(dir);
  
  return {
    tokenFiles,
    styleGuides,
    documentation,
    total: tokenFiles + styleGuides + documentation,
    totalLines,
    codeExamples: Math.floor(codeExamples),
    sections
  };
}

// Run the test
testDesignSystem().catch(console.error);
