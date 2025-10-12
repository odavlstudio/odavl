#!/usr/bin/env tsx

/**
 * ODAVL Schema Validator CLI
 * Command-line interface for validating ODAVL configuration files
 */

import { SchemaValidator } from './schema-validator.js'
import * as fs from 'fs'
import * as path from 'path'

interface CLIOptions {
  config?: string
  json?: boolean
  help?: boolean
  all?: boolean
}

function parseArgs(): CLIOptions {
  const options: CLIOptions = {}
  const args = process.argv.slice(2)

  for (let i = 0; i < args.length; i++) {
    const arg = args[i]
    switch (arg) {
      case '--config':
      case '-c':
        options.config = args[++i]
        break
      case '--json':
      case '-j':
        options.json = true
        break
      case '--all':
      case '-a':
        options.all = true
        break
      case '--help':
      case '-h':
        options.help = true
        break
    }
  }

  return options
}

function showHelp() {
  console.log(`
ODAVL Schema Validator

USAGE:
  pnpm odavl:validate [OPTIONS]

OPTIONS:
  -c, --config <file>    Validate specific config file
  -a, --all             Validate all ODAVL config files
  -j, --json            Output results in JSON format
  -h, --help            Show this help message

EXAMPLES:
  pnpm odavl:validate --all
  pnpm odavl:validate --config .odavl/gates.yml
  pnpm odavl:validate --config .odavl/policy.yml --json

SUPPORTED FILES:
  .odavl/gates.yml      Quality gates configuration
  .odavl/policy.yml     Risk policy configuration
`)
}

function validateAllConfigs(validator: SchemaValidator, jsonOutput: boolean = false) {
  const configs = [
    { file: '.odavl/gates.yml', schema: 'gates' as const },
    { file: '.odavl/policy.yml', schema: 'policy' as const }
  ]

  let allValid = true
  const results = []

  for (const { file, schema } of configs) {
    if (fs.existsSync(file)) {
      console.log(`\n🔍 Validating ${file}...`)
      const result = validator.validateFile(file, schema)
      
      if (jsonOutput) {
        results.push({
          file,
          schema,
          result
        })
      } else {
        console.log(validator.formatErrors(result, file))
      }
      
      if (!result.valid) {
        allValid = false
      }
    } else {
      console.log(`⚠️  Config file not found: ${file}`)
      if (jsonOutput) {
        results.push({
          file,
          schema,
          result: {
            valid: false,
            errors: [{ path: 'file', message: 'File not found', value: file }],
            warnings: []
          }
        })
      }
      allValid = false
    }
  }

  if (jsonOutput) {
    console.log(JSON.stringify({
      summary: {
        valid: allValid,
        timestamp: new Date().toISOString(),
        totalConfigs: configs.length
      },
      results
    }, null, 2))
  } else {
    console.log(`\n${allValid ? '✅' : '❌'} Overall validation: ${allValid ? 'PASSED' : 'FAILED'}`)
  }

  return allValid
}

function validateSingleConfig(
  validator: SchemaValidator, 
  configPath: string, 
  jsonOutput: boolean = false
) {
  if (!fs.existsSync(configPath)) {
    console.error(`❌ Config file not found: ${configPath}`)
    process.exit(1)
  }

  // Determine schema type from file name
  const basename = path.basename(configPath)
  let schemaType: 'gates' | 'policy'
  
  if (basename.includes('gates')) {
    schemaType = 'gates'
  } else if (basename.includes('policy')) {
    schemaType = 'policy'
  } else {
    console.error(`❌ Cannot determine schema type for: ${configPath}`)
    console.error('File name must contain "gates" or "policy"')
    process.exit(1)
  }

  const result = validator.validateFile(configPath, schemaType)
  
  if (jsonOutput) {
    console.log(validator.formatJSON(result, configPath))
  } else {
    console.log(validator.formatErrors(result, configPath))
  }

  return result.valid
}

function main() {
  const options = parseArgs()

  if (options.help) {
    showHelp()
    return
  }

  const validator = new SchemaValidator()
  let success = false

  try {
    if (options.all) {
      success = validateAllConfigs(validator, options.json)
    } else if (options.config) {
      success = validateSingleConfig(validator, options.config, options.json)
    } else {
      // Default: validate all configs
      success = validateAllConfigs(validator, options.json)
    }
  } catch (error) {
    console.error(`❌ Validation failed: ${error}`)
    process.exit(1)
  }

  process.exit(success ? 0 : 1)
}

main()