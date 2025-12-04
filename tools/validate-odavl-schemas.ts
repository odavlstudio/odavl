#!/usr/bin/env tsx
/**
 * ODAVL Schema Validator
 * Validates all .odavl configuration files against JSON schemas
 * 
 * Usage:
 *   pnpm validate:odavl
 *   tsx tools/validate-odavl-schemas.ts
 */

import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import * as fs from 'fs/promises';
import * as path from 'path';
import yaml from 'yaml';
import { glob } from 'glob';

const ajv = new Ajv({ 
  allErrors: true,
  verbose: true,
  strict: false
});
addFormats(ajv);

interface ValidationResult {
  filePath: string;
  valid: boolean;
  errors?: string[];
}

async function loadSchema(schemaPath: string): Promise<any> {
  const content = await fs.readFile(schemaPath, 'utf8');
  return JSON.parse(content);
}

async function loadYaml(filePath: string): Promise<any> {
  const content = await fs.readFile(filePath, 'utf8');
  return yaml.parse(content);
}

async function loadJson(filePath: string): Promise<any> {
  const content = await fs.readFile(filePath, 'utf8');
  return JSON.parse(content);
}

async function validateFile(
  filePath: string,
  schemaPath: string
): Promise<ValidationResult> {
  try {
    const schema = await loadSchema(schemaPath);
    const validate = ajv.compile(schema);

    let data: any;
    const ext = path.extname(filePath);
    
    if (ext === '.yml' || ext === '.yaml') {
      data = await loadYaml(filePath);
    } else if (ext === '.json') {
      data = await loadJson(filePath);
    } else {
      throw new Error(`Unsupported file extension: ${ext}`);
    }

    const valid = validate(data);

    if (!valid && validate.errors) {
      const errors = validate.errors.map(err => {
        const path = err.instancePath || '/';
        return `  ${path}: ${err.message}`;
      });
      return { filePath, valid: false, errors };
    }

    return { filePath, valid: true };
  } catch (error) {
    return {
      filePath,
      valid: false,
      errors: [`Error: ${error instanceof Error ? error.message : String(error)}`]
    };
  }
}

async function validateAll(): Promise<void> {
  console.log('🔍 ODAVL Schema Validation\n');

  const validations: ValidationResult[] = [];

  // Validate gates.yml
  const gatesPath = path.join(process.cwd(), '.odavl/gates.yml');
  const gatesSchemaPath = path.join(process.cwd(), '.odavl/schemas/gates.schema.json');
  
  if (await fileExists(gatesPath)) {
    console.log('📄 Validating gates.yml...');
    const result = await validateFile(gatesPath, gatesSchemaPath);
    validations.push(result);
    printResult(result);
  }

  // Validate history.json
  const historyPath = path.join(process.cwd(), '.odavl/history.json');
  const historySchemaPath = path.join(process.cwd(), '.odavl/schemas/history.schema.json');
  
  if (await fileExists(historyPath)) {
    console.log('📄 Validating history.json...');
    const result = await validateFile(historyPath, historySchemaPath);
    validations.push(result);
    printResult(result);
  }

  // Validate recipes-trust.json
  const trustPath = path.join(process.cwd(), '.odavl/recipes-trust.json');
  const trustSchemaPath = path.join(process.cwd(), '.odavl/schemas/recipes-trust.schema.json');
  
  if (await fileExists(trustPath)) {
    console.log('📄 Validating recipes-trust.json...');
    const result = await validateFile(trustPath, trustSchemaPath);
    validations.push(result);
    printResult(result);
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  const failed = validations.filter(v => !v.valid);
  
  if (failed.length === 0) {
    console.log('✅ All ODAVL configuration files are valid!');
    console.log(`📊 Validated ${validations.length} file(s)`);
    process.exit(0);
  } else {
    console.error(`❌ ${failed.length} file(s) failed validation:`);
    failed.forEach(f => {
      console.error(`   - ${path.basename(f.filePath)}`);
    });
    process.exit(1);
  }
}

function printResult(result: ValidationResult): void {
  if (result.valid) {
    console.log(`   ✅ Valid\n`);
  } else {
    console.error(`   ❌ Invalid`);
    if (result.errors) {
      result.errors.forEach(err => console.error(err));
    }
    console.log('');
  }
}

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

// Run validation
validateAll().catch(error => {
  console.error('💥 Validation failed:', error);
  process.exit(1);
});
