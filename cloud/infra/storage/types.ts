/**
 * Storage types
 */

export interface StorageConfig {
  provider: 'local' | 's3' | 'azure' | 'gcs';
  basePath?: string;
  bucket?: string;
  region?: string;
}

export interface StorageResult {
  success: boolean;
  data?: string;
  error?: string;
}
