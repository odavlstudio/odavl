import * as fs from 'fs'
import * as path from 'path'
import * as yaml from 'js-yaml'

/**
 * JSON Schema validator for ODAVL configuration files
 * Provides validation for gates.yml and policy.yml against their schemas
 */

 

interface ValidationError {
  path: string
  message: string
  value?: unknown
  schema?: string
}

interface ValidationResult {
  valid: boolean
  errors: ValidationError[]
  warnings: string[]
}



/**
 * Simple JSON Schema validator focused on ODAVL's specific needs
 * This is a lightweight implementation that covers the essential validation
 * without requiring heavy external dependencies
 */
class SchemaValidator {
  private readonly schemasDir: string

  constructor(schemasDir: string = '.odavl/schemas') {
    this.schemasDir = path.resolve(schemasDir)
  }

  /**
   * Validate a configuration file against its schema
   */
  validateFile(configPath: string, schemaName: 'gates' | 'policy'): ValidationResult {
    try {
      // Load the configuration file
      const configContent = fs.readFileSync(configPath, 'utf8')
      const config = yaml.load(configContent) as Record<string, unknown>

      // Load the schema
      const schemaPath = path.join(this.schemasDir, `${schemaName}.schema.json`)
      const schemaContent = fs.readFileSync(schemaPath, 'utf8')
      const schema = JSON.parse(schemaContent)

      // Validate against schema
      return this.validateObject(config, schema, schemaName)
    } catch (error) {
      return {
        valid: false,
        errors: [{
          path: 'file',
          message: `Failed to load or parse file: ${error}`,
          value: configPath
        }],
        warnings: []
      }
    }
  }

  /**
   * Validate an object against a schema definition
   */
   
  private validateObject(obj: unknown, schema: any, rootPath: string = ''): ValidationResult {
    const errors: ValidationError[] = []
    const warnings: string[] = []

    if (schema.type === 'object' && typeof obj === 'object' && obj !== null) {
      const objRecord = obj as Record<string, unknown>

      // Check required properties
      if (schema.required) {
        for (const requiredProp of schema.required) {
          if (!(requiredProp in objRecord)) {
            errors.push({
              path: `${rootPath}.${requiredProp}`,
              message: `Missing required property: ${requiredProp}`,
              schema: schema.title || 'unknown'
            })
          }
        }
      }

      // Validate existing properties
      if (schema.properties) {
        for (const [propName, propValue] of Object.entries(objRecord)) {
          const propSchema = schema.properties[propName]
          if (propSchema) {
            const propResult = this.validateValue(
              propValue, 
              propSchema, 
              `${rootPath}.${propName}`
            )
            errors.push(...propResult.errors)
            warnings.push(...propResult.warnings)
          } else if (schema.additionalProperties === false) {
            warnings.push(`Unknown property: ${rootPath}.${propName}`)
          }
        }
      }
    } else if (schema.type && typeof obj !== schema.type) {
      errors.push({
        path: rootPath,
        message: `Expected type ${schema.type}, got ${typeof obj}`,
        value: obj,
        schema: schema.title || 'unknown'
      })
    }

    return { valid: errors.length === 0, errors, warnings }
  }

  /**
   * Validate a single value against its schema
   */
   
  private validateValue(value: unknown, schema: any, path: string): ValidationResult {
    const errors: ValidationError[] = []
    const warnings: string[] = []

    // Type validation
    if (schema.type) {
      if (schema.type === 'number' && typeof value !== 'number') {
        errors.push({
          path,
          message: `Expected number, got ${typeof value}`,
          value,
          schema: schema.description || 'number'
        })
        return { valid: false, errors, warnings }
      }

      if (schema.type === 'boolean' && typeof value !== 'boolean') {
        errors.push({
          path,
          message: `Expected boolean, got ${typeof value}`,
          value,
          schema: schema.description || 'boolean'
        })
        return { valid: false, errors, warnings }
      }

      if (schema.type === 'string' && typeof value !== 'string') {
        errors.push({
          path,
          message: `Expected string, got ${typeof value}`,
          value,
          schema: schema.description || 'string'
        })
        return { valid: false, errors, warnings }
      }

      if (schema.type === 'array' && !Array.isArray(value)) {
        errors.push({
          path,
          message: `Expected array, got ${typeof value}`,
          value,
          schema: schema.description || 'array'
        })
        return { valid: false, errors, warnings }
      }

      if (schema.type === 'object' && (typeof value !== 'object' || value === null)) {
        errors.push({
          path,
          message: `Expected object, got ${typeof value}`,
          value,
          schema: schema.description || 'object'
        })
        return { valid: false, errors, warnings }
      }
    }

    // Number constraints
    if (typeof value === 'number') {
      if (schema.minimum !== undefined && value < schema.minimum) {
        errors.push({
          path,
          message: `Value ${value} is below minimum ${schema.minimum}`,
          value,
          schema: schema.description || 'number'
        })
      }
      if (schema.maximum !== undefined && value > schema.maximum) {
        errors.push({
          path,
          message: `Value ${value} is above maximum ${schema.maximum}`,
          value,
          schema: schema.description || 'number'
        })
      }
    }

    // String constraints
    if (typeof value === 'string') {
      if (schema.pattern) {
        const regex = new RegExp(schema.pattern)
        if (!regex.test(value)) {
          errors.push({
            path,
            message: `String "${value}" does not match pattern ${schema.pattern}`,
            value,
            schema: schema.description || 'string'
          })
        }
      }
      if (schema.enum && !schema.enum.includes(value)) {
        errors.push({
          path,
          message: `Value "${value}" is not in allowed values: ${schema.enum.join(', ')}`,
          value,
          schema: schema.description || 'enum'
        })
      }
    }

    // Array constraints
    if (Array.isArray(value)) {
      if (schema.uniqueItems) {
        const seen = new Set()
        for (const item of value) {
          const itemStr = JSON.stringify(item)
          if (seen.has(itemStr)) {
            warnings.push(`Duplicate item in array at ${path}: ${itemStr}`)
          }
          seen.add(itemStr)
        }
      }
      if (schema.items) {
        value.forEach((item, index) => {
          const itemResult = this.validateValue(item, schema.items, `${path}[${index}]`)
          errors.push(...itemResult.errors)
          warnings.push(...itemResult.warnings)
        })
      }
    }

    // Object validation (recursive)
    if (schema.type === 'object' && typeof value === 'object' && value !== null) {
      const objectResult = this.validateObject(value, schema, path)
      errors.push(...objectResult.errors)
      warnings.push(...objectResult.warnings)
    }

    return { valid: errors.length === 0, errors, warnings }
  }

  /**
   * Format validation errors for human-readable output
   */
  formatErrors(result: ValidationResult, configPath?: string): string {
    if (result.valid) return '✅ Configuration is valid'

    const lines: string[] = []
    if (configPath) {
      lines.push(`❌ Validation failed for: ${configPath}`)
    } else {
      lines.push('❌ Validation failed')
    }
    lines.push('')

    if (result.errors.length > 0) {
      lines.push('🔴 Errors:')
      for (const error of result.errors) {
        lines.push(`  • ${error.path}: ${error.message}`)
        if (error.value !== undefined) {
          lines.push(`    Value: ${JSON.stringify(error.value)}`)
        }
      }
      lines.push('')
    }

    if (result.warnings.length > 0) {
      lines.push('🟡 Warnings:')
      for (const warning of result.warnings) {
        lines.push(`  • ${warning}`)
      }
    }

    return lines.join('\n')
  }

  /**
   * Format validation result as JSON
   */
  formatJSON(result: ValidationResult, configPath?: string) {
    return JSON.stringify({
      valid: result.valid,
      file: configPath,
      errors: result.errors,
      warnings: result.warnings,
      timestamp: new Date().toISOString()
    }, null, 2)
  }
}

export { SchemaValidator, ValidationResult, ValidationError }