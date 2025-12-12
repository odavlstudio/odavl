/**
 * Manifest validator
 */

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export class ManifestValidator {
  validate(manifest: Record<string, unknown>): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!manifest.name) errors.push('Missing required field: name');
    if (!manifest.version) errors.push('Missing required field: version');
    if (!manifest.type) errors.push('Missing required field: type');
    if (!manifest.entry) warnings.push('Missing recommended field: entry');

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  checkSchema(manifest: Record<string, unknown>): boolean {
    const required = ['name', 'version', 'type'];
    return required.every((field) => field in manifest);
  }

  checkDependencies(dependencies?: Record<string, string>): string[] {
    if (!dependencies) return [];
    
    const errors: string[] = [];
    for (const [dep, version] of Object.entries(dependencies)) {
      if (!version) errors.push(`Missing version for dependency: ${dep}`);
    }
    return errors;
  }
}
