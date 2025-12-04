/**
 * S3 Storage Provider
 */

import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';
import type { StorageConfig } from '../types';

export class S3Provider {
  private client: S3Client;
  private bucket: string;

  constructor(config: StorageConfig) {
    if (!config.bucket) {
      throw new Error('S3 bucket is required');
    }

    this.bucket = config.bucket;
    this.client = new S3Client({
      region: config.region || 'us-east-1',
      credentials: config.credentials ? {
        accessKeyId: config.credentials.accessKeyId!,
        secretAccessKey: config.credentials.secretAccessKey!,
      } : undefined,
    });
  }

  async upload(
    key: string,
    data: Buffer,
    metadata?: Record<string, string>
  ): Promise<void> {
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: data,
        Metadata: metadata,
      })
    );
  }

  async download(key: string): Promise<Buffer> {
    const response = await this.client.send(
      new GetObjectCommand({
        Bucket: this.bucket,
        Key: key,
      })
    );

    if (!response.Body) {
      throw new Error(`File not found: ${key}`);
    }

    return Buffer.from(await response.Body.transformToByteArray());
  }

  async delete(key: string): Promise<void> {
    await this.client.send(
      new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: key,
      })
    );
  }

  async listKeys(prefix: string): Promise<string[]> {
    const response = await this.client.send(
      new ListObjectsV2Command({
        Bucket: this.bucket,
        Prefix: prefix,
      })
    );

    return response.Contents?.map((obj) => obj.Key!) || [];
  }

  async deletePrefix(prefix: string): Promise<void> {
    const keys = await this.listKeys(prefix);
    
    for (const key of keys) {
      await this.delete(key);
    }
  }
}
