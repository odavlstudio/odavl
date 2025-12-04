/**
 * S3 Storage Provider
 */

// Optional dependency - install @aws-sdk/client-s3 if using S3 provider
let S3Client: any;
let PutObjectCommand: any;
let GetObjectCommand: any;
let DeleteObjectCommand: any;
let ListObjectsV2Command: any;

try {
  const aws = require('@aws-sdk/client-s3');
  S3Client = aws.S3Client;
  PutObjectCommand = aws.PutObjectCommand;
  GetObjectCommand = aws.GetObjectCommand;
  DeleteObjectCommand = aws.DeleteObjectCommand;
  ListObjectsV2Command = aws.ListObjectsV2Command;
} catch {
  console.warn('[S3Provider] @aws-sdk/client-s3 not installed - S3 storage provider will not work');
}

import type { StorageConfig } from '../types';

export class S3Provider {
  private client: any; // S3Client not available without @aws-sdk/client-s3
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

    return response.Contents?.map((obj: any) => obj.Key!) || [];
  }

  async deletePrefix(prefix: string): Promise<void> {
    const keys = await this.listKeys(prefix);
    
    for (const key of keys) {
      await this.delete(key);
    }
  }
}
