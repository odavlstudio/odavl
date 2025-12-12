/**
 * Azure Blob Storage Provider
 * Optional dependency - install @azure/storage-blob to use this provider
 */

// Azure SDK is optional - only required if user chooses Azure provider
let BlobServiceClient: any;
let StorageSharedKeyCredential: any;
let azureAvailable = false;

try {
  // Dynamic import to make @azure/storage-blob optional
  // webpack/tsup will not attempt to resolve this dependency at build time
  const azureModule = require('@azure/storage-blob');
  BlobServiceClient = azureModule.BlobServiceClient;
  StorageSharedKeyCredential = azureModule.StorageSharedKeyCredential;
  azureAvailable = true;
} catch (error) {
  // @azure/storage-blob not installed - this is OK unless Azure provider is actually used
  // No warning logged here to avoid build-time noise
}

import type { StorageConfig } from '../types';

export class AzureBlobProvider {
  private client: any; // BlobServiceClient (only available if @azure/storage-blob installed)
  private containerName: string;

  constructor(config: StorageConfig) {
    // Check if Azure SDK is available before proceeding
    if (!azureAvailable) {
      throw new Error(
        '[AzureBlobProvider] Azure Blob Storage SDK not installed. ' +
        'Install with: pnpm add @azure/storage-blob'
      );
    }

    if (!config.container) {
      throw new Error('[AzureBlobProvider] Azure container name is required');
    }

    this.containerName = config.container;

    if (config.credentials?.accountName && config.credentials?.accountKey) {
      const sharedKeyCredential = new StorageSharedKeyCredential(
        config.credentials.accountName,
        config.credentials.accountKey
      );

      this.client = new BlobServiceClient(
        `https://${config.credentials.accountName}.blob.core.windows.net`,
        sharedKeyCredential
      );
    } else {
      throw new Error(
        '[AzureBlobProvider] Azure credentials (accountName, accountKey) are required'
      );
    }
  }

  async upload(
    key: string,
    data: Buffer,
    metadata?: Record<string, string>
  ): Promise<void> {
    const containerClient = this.client.getContainerClient(this.containerName);
    const blockBlobClient = containerClient.getBlockBlobClient(key);

    await blockBlobClient.upload(data, data.length, {
      metadata,
    });
  }

  async download(key: string): Promise<Buffer> {
    const containerClient = this.client.getContainerClient(this.containerName);
    const blockBlobClient = containerClient.getBlockBlobClient(key);

    const downloadResponse = await blockBlobClient.download(0);
    
    if (!downloadResponse.readableStreamBody) {
      throw new Error(`File not found: ${key}`);
    }

    const chunks: Buffer[] = [];
    for await (const chunk of downloadResponse.readableStreamBody) {
      chunks.push(Buffer.from(chunk));
    }

    return Buffer.concat(chunks);
  }

  async delete(key: string): Promise<void> {
    const containerClient = this.client.getContainerClient(this.containerName);
    const blockBlobClient = containerClient.getBlockBlobClient(key);

    await blockBlobClient.delete();
  }

  async listKeys(prefix: string): Promise<string[]> {
    const containerClient = this.client.getContainerClient(this.containerName);
    const keys: string[] = [];

    for await (const blob of containerClient.listBlobsFlat({ prefix })) {
      keys.push(blob.name);
    }

    return keys;
  }

  async deletePrefix(prefix: string): Promise<void> {
    const keys = await this.listKeys(prefix);
    
    for (const key of keys) {
      await this.delete(key);
    }
  }
}
