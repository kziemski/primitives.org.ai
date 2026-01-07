/**
 * Dataset() - Define a dataset
 */
import { registerProduct } from './product.js';
/**
 * Create a dataset definition
 *
 * @example
 * ```ts
 * const movieDataset = Dataset({
 *   id: 'movies',
 *   name: 'Movie Database',
 *   description: 'Comprehensive movie information dataset',
 *   version: '2024.1',
 *   format: 'parquet',
 *   schema: {
 *     id: 'Movie ID',
 *     title: 'Movie title',
 *     year: 'Release year (number)',
 *     genres: ['Array of genre names'],
 *     rating: 'Average rating (number)',
 *     votes: 'Number of votes (number)',
 *   },
 *   source: 's3://datasets/movies.parquet',
 *   size: 1000000,
 *   license: 'CC-BY-4.0',
 *   updateFrequency: 'daily',
 * })
 * ```
 */
export function Dataset(config) {
    const dataset = {
        type: 'dataset',
        id: config.id,
        name: config.name,
        description: config.description,
        version: config.version,
        format: config.format || 'json',
        schema: config.schema,
        source: config.source,
        size: config.size,
        license: config.license,
        updateFrequency: config.updateFrequency || 'static',
        metadata: config.metadata,
        tags: config.tags,
        status: config.status || 'active',
    };
    return registerProduct(dataset);
}
