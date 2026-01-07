/**
 * Storage Providers
 *
 * Concrete implementations for storage providers (S3, Google Cloud Storage, etc.)
 *
 * @packageDocumentation
 */
import { s3Provider, s3Info, createS3Provider } from './s3.js';
/**
 * All storage providers
 */
export const storageProviders = [s3Provider];
/**
 * Register all storage providers in the global registry
 */
export function registerStorageProviders() {
    for (const provider of storageProviders) {
        provider.register();
    }
}
/**
 * Re-export provider info and factories
 */
export { s3Provider, s3Info, createS3Provider };
