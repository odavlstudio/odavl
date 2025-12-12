/**
 * @fileoverview Terraform module file generator
 * Generates .tf files from TypeScript configurations
 */

export interface TerraformModuleOptions {
  name: string;
  provider: 'aws' | 'azure' | 'gcp';
  resources: TerraformResource[];
  variables?: TerraformVariable[];
  outputs?: TerraformOutput[];
  backend?: TerraformBackend;
}

export interface TerraformResource {
  type: string;
  name: string;
  config: Record<string, any>;
}

export interface TerraformVariable {
  name: string;
  type: string;
  description?: string;
  default?: any;
}

export interface TerraformOutput {
  name: string;
  value: string;
  description?: string;
  sensitive?: boolean;
}

export interface TerraformBackend {
  type: 's3' | 'azurerm' | 'gcs';
  config: Record<string, string>;
}

export class TerraformModuleGenerator {
  /**
   * Generate complete Terraform module
   */
  static generate(options: TerraformModuleOptions): Record<string, string> {
    return {
      'main.tf': this.generateMainTF(options),
      'variables.tf': this.generateVariablesTF(options),
      'outputs.tf': this.generateOutputsTF(options),
      'versions.tf': this.generateVersionsTF(options),
    };
  }

  /**
   * Generate main.tf
   */
  private static generateMainTF(options: TerraformModuleOptions): string {
    const { provider, resources, backend } = options;

    let content = 'terraform {\n';
    content += '  required_version = ">= 1.6"\n';
    content += '  required_providers {\n';

    switch (provider) {
      case 'aws':
        content += '    aws = {\n';
        content += '      source  = "hashicorp/aws"\n';
        content += '      version = "~> 5.0"\n';
        content += '    }\n';
        break;
      case 'azure':
        content += '    azurerm = {\n';
        content += '      source  = "hashicorp/azurerm"\n';
        content += '      version = "~> 3.0"\n';
        content += '    }\n';
        break;
      case 'gcp':
        content += '    google = {\n';
        content += '      source  = "hashicorp/google"\n';
        content += '      version = "~> 5.0"\n';
        content += '    }\n';
        break;
    }

    content += '  }\n';

    // Backend configuration
    if (backend) {
      content += `  backend "${backend.type}" {\n`;
      Object.entries(backend.config).forEach(([key, value]) => {
        content += `    ${key} = "${value}"\n`;
      });
      content += '  }\n';
    }

    content += '}\n\n';

    // Provider configuration
    content += `provider "${provider}" {\n`;
    switch (provider) {
      case 'aws':
        content += '  region = var.region\n';
        break;
      case 'azure':
        content += '  features {}\n';
        break;
      case 'gcp':
        content += '  project = var.project_id\n';
        content += '  region  = var.region\n';
        break;
    }
    content += '}\n\n';

    // Resources
    resources.forEach((resource) => {
      content += this.formatResource(resource);
    });

    return content;
  }

  /**
   * Generate variables.tf
   */
  private static generateVariablesTF(options: TerraformModuleOptions): string {
    const { variables = [] } = options;

    let content = '';

    variables.forEach((variable) => {
      content += `variable "${variable.name}" {\n`;
      if (variable.description) {
        content += `  description = "${variable.description}"\n`;
      }
      content += `  type        = ${variable.type}\n`;
      if (variable.default !== undefined) {
        content += `  default     = ${this.formatValue(variable.default)}\n`;
      }
      content += '}\n\n';
    });

    return content;
  }

  /**
   * Generate outputs.tf
   */
  private static generateOutputsTF(options: TerraformModuleOptions): string {
    const { outputs = [] } = options;

    let content = '';

    outputs.forEach((output) => {
      content += `output "${output.name}" {\n`;
      if (output.description) {
        content += `  description = "${output.description}"\n`;
      }
      content += `  value       = ${output.value}\n`;
      if (output.sensitive) {
        content += '  sensitive   = true\n';
      }
      content += '}\n\n';
    });

    return content;
  }

  /**
   * Generate versions.tf
   */
  private static generateVersionsTF(options: TerraformModuleOptions): string {
    const { provider } = options;

    let content = 'terraform {\n';
    content += '  required_version = ">= 1.6"\n\n';
    content += '  required_providers {\n';

    switch (provider) {
      case 'aws':
        content += '    aws = {\n';
        content += '      source  = "hashicorp/aws"\n';
        content += '      version = "~> 5.0"\n';
        content += '    }\n';
        break;
      case 'azure':
        content += '    azurerm = {\n';
        content += '      source  = "hashicorp/azurerm"\n';
        content += '      version = "~> 3.0"\n';
        content += '    }\n';
        break;
      case 'gcp':
        content += '    google = {\n';
        content += '      source  = "hashicorp/google"\n';
        content += '      version = "~> 5.0"\n';
        content += '    }\n';
        break;
    }

    content += '  }\n';
    content += '}\n';

    return content;
  }

  /**
   * Format Terraform resource
   */
  private static formatResource(resource: TerraformResource): string {
    let content = `resource "${resource.type}" "${resource.name}" {\n`;

    Object.entries(resource.config).forEach(([key, value]) => {
      content += this.formatAttribute(key, value, 2);
    });

    content += '}\n\n';
    return content;
  }

  /**
   * Format attribute with proper indentation
   */
  private static formatAttribute(key: string, value: any, indent: number): string {
    const spaces = ' '.repeat(indent);

    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      let result = `${spaces}${key} {\n`;
      Object.entries(value).forEach(([k, v]) => {
        result += this.formatAttribute(k, v, indent + 2);
      });
      result += `${spaces}}\n`;
      return result;
    } else if (Array.isArray(value)) {
      return `${spaces}${key} = ${this.formatArray(value)}\n`;
    } else {
      return `${spaces}${key} = ${this.formatValue(value)}\n`;
    }
  }

  /**
   * Format value for Terraform
   */
  private static formatValue(value: any): string {
    if (typeof value === 'string') {
      return `"${value}"`;
    } else if (typeof value === 'boolean') {
      return value ? 'true' : 'false';
    } else if (typeof value === 'number') {
      return value.toString();
    } else if (Array.isArray(value)) {
      return this.formatArray(value);
    } else if (typeof value === 'object' && value !== null) {
      return this.formatObject(value);
    }
    return 'null';
  }

  /**
   * Format array for Terraform
   */
  private static formatArray(arr: any[]): string {
    if (arr.length === 0) return '[]';
    if (arr.every((item) => typeof item === 'string')) {
      return `[${arr.map((item) => `"${item}"`).join(', ')}]`;
    }
    return `[\n${arr.map((item) => `  ${this.formatValue(item)}`).join(',\n')}\n]`;
  }

  /**
   * Format object for Terraform
   */
  private static formatObject(obj: Record<string, any>): string {
    const entries = Object.entries(obj);
    if (entries.length === 0) return '{}';

    return `{\n${entries.map(([key, value]) => `  ${key} = ${this.formatValue(value)}`).join('\n')}\n}`;
  }

  /**
   * Validate Terraform configuration
   */
  static validate(modulePath: string): { valid: boolean; errors: string[] } {
    // This would call `terraform validate` via child_process
    // For now, return placeholder
    return { valid: true, errors: [] };
  }

  /**
   * Format Terraform files
   */
  static format(modulePath: string): { success: boolean; errors: string[] } {
    // This would call `terraform fmt` via child_process
    // For now, return placeholder
    return { success: true, errors: [] };
  }

  /**
   * Generate Terraform plan
   */
  static plan(modulePath: string, variables?: Record<string, any>): { success: boolean; output: string } {
    // This would call `terraform plan` via child_process
    // For now, return placeholder
    return { success: true, output: 'Plan would show changes here' };
  }

  /**
   * Apply Terraform configuration
   */
  static apply(modulePath: string, autoApprove = false): { success: boolean; output: string } {
    // This would call `terraform apply` via child_process
    // For now, return placeholder
    return { success: true, output: 'Apply would execute changes here' };
  }
}
