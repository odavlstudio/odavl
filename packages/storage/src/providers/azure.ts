/**
 * Azure Blob Storage Provider
 */

import { BlobServiceClient, StorageSharedKeyCredential } from '@azure/storage-blob';
import type { StorageConfig } from '../types';

export class AzureBlobProvider {
  private client: BlobServiceClient;
  private containerName: string;

  constructor(config: StorageConfig) {
    if (!config.container) {
      throw new Error('Azure container is required');
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
      throw new Error('Azure credentials required');
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
