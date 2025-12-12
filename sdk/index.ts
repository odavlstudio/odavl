/**
 * ODAVL Marketplace SDK
 * Developer tools for publishing extensions
 * 
 * @example
 * ```typescript
 * import { Publisher, ManifestBuilder } from '@odavl-studio/sdk-marketplace';
 * 
 * const manifest = new ManifestBuilder()
 *   .setName('my-detector')
 *   .setType('detector')
 *   .setVersion('1.0.0')
 *   .build();
 * 
 * const publisher = new Publisher();
 * const result = await publisher.publishToRegistry(manifest);
 * ```
 */

export { Publisher } from './publisher.js';
export { ManifestValidator } from './validator.js';
export { ManifestBuilder } from './manifest-builder.js';

export type { PublishResult, PublishOptions } from './publisher.js';
export type { ValidationResult } from './validator.js';
