#!/usr/bin/env node
/**
 * ODAVL i18n Integrity Checker
 * Ensures translation keys remain consistent across locales
 */

import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const WEBSITE_PATH = join(__dirname, '..', 'odavl-website');
const MESSAGES_PATH = join(WEBSITE_PATH, 'messages');
const PRIMARY_LOCALE = 'en';

function main() {
  try {
    console.log('🌍 Checking i18n integrity...');
    
    if (!existsSync(MESSAGES_PATH)) {
      console.log('✅ PASSED: No i18n files to check');
      return;
    }
    
    // Load primary locale (EN) as reference
    const primaryFile = join(MESSAGES_PATH, `${PRIMARY_LOCALE}.json`);
    if (!existsSync(primaryFile)) {
      console.log('❌ BLOCKED: Primary locale file missing');
      console.log(`   Expected: ${primaryFile}`);
      process.exit(1);
    }
    
    const primaryKeys = extractKeys(JSON.parse(readFileSync(primaryFile, 'utf8')));
    console.log(`📋 Primary locale (${PRIMARY_LOCALE}): ${primaryKeys.size} keys`);
    
    // Check other locales
    const locales = ['de', 'ar', 'fr', 'es', 'it', 'pt', 'ru', 'ja', 'zh'];
    let hasErrors = false;
    
    for (const locale of locales) {
      const localeFile = join(MESSAGES_PATH, `${locale}.json`);
      
      if (!existsSync(localeFile)) {
        console.log(`⚠️  WARNING: ${locale}.json not found`);
        continue;
      }
      
      const localeKeys = extractKeys(JSON.parse(readFileSync(localeFile, 'utf8')));
      const missingKeys = [...primaryKeys].filter(key => !localeKeys.has(key));
      const extraKeys = [...localeKeys].filter(key => !primaryKeys.has(key));
      
      if (missingKeys.length > 0 || extraKeys.length > 0) {
        console.log(`❌ BLOCKED: i18n inconsistency in ${locale}.json`);
        
        if (missingKeys.length > 0) {
          console.log(`   Missing keys (${missingKeys.length}):`);
          missingKeys.slice(0, 5).forEach(key => console.log(`     - ${key}`));
          if (missingKeys.length > 5) {
            console.log(`     ... and ${missingKeys.length - 5} more`);
          }
        }
        
        if (extraKeys.length > 0) {
          console.log(`   Extra keys (${extraKeys.length}):`);
          extraKeys.slice(0, 5).forEach(key => console.log(`     + ${key}`));
          if (extraKeys.length > 5) {
            console.log(`     ... and ${extraKeys.length - 5} more`);
          }
        }
        
        hasErrors = true;
      } else {
        console.log(`✅ PASSED: ${locale}.json (${localeKeys.size} keys)`);
      }
    }
    
    if (hasErrors) {
      console.log('\n💡 TIP: Update translation files to match primary locale keys');
      process.exit(1);
    }
    
    console.log('✅ PASSED: All i18n files are consistent');
    
  } catch (error) {
    console.error('❌ ERROR: Failed to check i18n integrity');
    console.error(error.message);
    process.exit(1);
  }
}

function extractKeys(obj, prefix = '') {
  const keys = new Set();
  
  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    
    if (typeof value === 'object' && value !== null) {
      // Recursively extract nested keys
      for (const nestedKey of extractKeys(value, fullKey)) {
        keys.add(nestedKey);
      }
    } else {
      keys.add(fullKey);
    }
  }
  
  return keys;
}

main();