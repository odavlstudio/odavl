/**
 * @fileoverview Terraform module exports
 * Centralized exports for all Terraform utilities
 */

export { AWSEKSModuleGenerator, type AWSEKSOptions } from './aws-eks-module';
export { AzureAKSModuleGenerator, type AzureAKSOptions } from './azure-aks-module';
export { GCPGKEModuleGenerator, type GCPGKEOptions } from './gcp-gke-module';
export {
  TerraformModuleGenerator,
  type TerraformModuleOptions,
  type TerraformResource,
  type TerraformVariable,
  type TerraformOutput,
  type TerraformBackend,
} from './module-generator';
