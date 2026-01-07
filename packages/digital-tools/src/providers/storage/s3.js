/**
 * AWS S3 Storage Provider
 *
 * Concrete implementation of StorageProvider using AWS S3 REST API.
 *
 * @packageDocumentation
 */
import { defineProvider } from '../registry.js';
/**
 * S3 provider info
 */
export const s3Info = {
    id: 'storage.s3',
    name: 'AWS S3',
    description: 'Amazon S3 cloud object storage service',
    category: 'storage',
    website: 'https://aws.amazon.com/s3/',
    docsUrl: 'https://docs.aws.amazon.com/s3/',
    requiredConfig: ['accessKeyId', 'secretAccessKey', 'bucket', 'region'],
    optionalConfig: ['endpoint', 'baseUrl'],
};
/**
 * AWS Signature V4 helper
 */
class AwsSignatureV4 {
    accessKeyId;
    secretAccessKey;
    region;
    service;
    constructor(accessKeyId, secretAccessKey, region, service = 's3') {
        this.accessKeyId = accessKeyId;
        this.secretAccessKey = secretAccessKey;
        this.region = region;
        this.service = service;
    }
    async sha256(data) {
        const encoder = new TextEncoder();
        return await crypto.subtle.digest('SHA-256', encoder.encode(data));
    }
    async hmac(key, data) {
        const encoder = new TextEncoder();
        const cryptoKey = await crypto.subtle.importKey('raw', typeof key === 'string' ? encoder.encode(key) : key, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
        return await crypto.subtle.sign('HMAC', cryptoKey, encoder.encode(data));
    }
    toHex(buffer) {
        return Array.from(new Uint8Array(buffer))
            .map((b) => b.toString(16).padStart(2, '0'))
            .join('');
    }
    getCanonicalQueryString(params) {
        return Object.keys(params)
            .sort()
            .map((key) => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
            .join('&');
    }
    async sign(method, path, headers, body, queryParams = {}) {
        const now = new Date();
        const dateStamp = now.toISOString().slice(0, 10).replace(/-/g, '');
        const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, '');
        // Ensure required headers
        const signedHeaders = {
            ...headers,
            'x-amz-date': amzDate,
        };
        if (!signedHeaders['host']) {
            signedHeaders['host'] = `${this.service}.${this.region}.amazonaws.com`;
        }
        // Calculate payload hash
        const payloadHash = this.toHex(await this.sha256(body ? (typeof body === 'string' ? body : body.toString()) : ''));
        signedHeaders['x-amz-content-sha256'] = payloadHash;
        // Create canonical request
        const canonicalHeaders = Object.keys(signedHeaders)
            .sort()
            .map((key) => `${key.toLowerCase()}:${signedHeaders[key].trim()}`)
            .join('\n');
        const signedHeadersList = Object.keys(signedHeaders)
            .sort()
            .map((k) => k.toLowerCase())
            .join(';');
        const canonicalQueryString = this.getCanonicalQueryString(queryParams);
        const canonicalRequest = [
            method,
            path,
            canonicalQueryString,
            canonicalHeaders,
            '',
            signedHeadersList,
            payloadHash,
        ].join('\n');
        // Create string to sign
        const credentialScope = `${dateStamp}/${this.region}/${this.service}/aws4_request`;
        const stringToSign = [
            'AWS4-HMAC-SHA256',
            amzDate,
            credentialScope,
            this.toHex(await this.sha256(canonicalRequest)),
        ].join('\n');
        // Calculate signature
        let key = await this.hmac(`AWS4${this.secretAccessKey}`, dateStamp);
        key = await this.hmac(key, this.region);
        key = await this.hmac(key, this.service);
        key = await this.hmac(key, 'aws4_request');
        const signature = this.toHex(await this.hmac(key, stringToSign));
        // Add authorization header
        signedHeaders['Authorization'] =
            `AWS4-HMAC-SHA256 Credential=${this.accessKeyId}/${credentialScope}, ` +
                `SignedHeaders=${signedHeadersList}, Signature=${signature}`;
        return signedHeaders;
    }
}
/**
 * Create AWS S3 storage provider
 */
export function createS3Provider(config) {
    let accessKeyId;
    let secretAccessKey;
    let bucket;
    let region;
    let endpoint;
    let signer;
    return {
        info: s3Info,
        async initialize(cfg) {
            accessKeyId = cfg.accessKeyId;
            secretAccessKey = cfg.secretAccessKey;
            bucket = cfg.bucket;
            region = cfg.region;
            endpoint = cfg.endpoint || `https://${bucket}.s3.${region}.amazonaws.com`;
            if (!accessKeyId || !secretAccessKey || !bucket || !region) {
                throw new Error('S3 requires accessKeyId, secretAccessKey, bucket, and region');
            }
            signer = new AwsSignatureV4(accessKeyId, secretAccessKey, region, 's3');
        },
        async healthCheck() {
            const start = Date.now();
            try {
                const headers = await signer.sign('HEAD', '/', { host: `${bucket}.s3.${region}.amazonaws.com` }, null);
                const response = await fetch(`${endpoint}/`, {
                    method: 'HEAD',
                    headers,
                });
                return {
                    healthy: response.ok,
                    latencyMs: Date.now() - start,
                    message: response.ok ? 'Connected' : `HTTP ${response.status}`,
                    checkedAt: new Date(),
                };
            }
            catch (error) {
                return {
                    healthy: false,
                    latencyMs: Date.now() - start,
                    message: error instanceof Error ? error.message : 'Unknown error',
                    checkedAt: new Date(),
                };
            }
        },
        async dispose() {
            // No cleanup needed
        },
        async upload(path, content, options) {
            try {
                const buffer = typeof content === 'string' ? Buffer.from(content) : content;
                const headers = {
                    host: `${bucket}.s3.${region}.amazonaws.com`,
                    'content-type': options?.contentType || 'application/octet-stream',
                    'content-length': buffer.length.toString(),
                };
                if (options?.acl) {
                    headers['x-amz-acl'] = options.acl;
                }
                if (options?.metadata) {
                    Object.entries(options.metadata).forEach(([key, value]) => {
                        headers[`x-amz-meta-${key}`] = value;
                    });
                }
                const signedHeaders = await signer.sign('PUT', `/${path}`, headers, buffer);
                const response = await fetch(`${endpoint}/${path}`, {
                    method: 'PUT',
                    headers: signedHeaders,
                    body: buffer,
                });
                if (!response.ok) {
                    const errorText = await response.text();
                    throw new Error(`S3 upload failed: ${response.status} ${errorText}`);
                }
                const etag = response.headers.get('etag')?.replace(/"/g, '');
                return {
                    path,
                    name: path.split('/').pop() || path,
                    size: buffer.length,
                    contentType: options?.contentType,
                    etag,
                    lastModified: new Date(),
                    isFolder: false,
                    url: `${endpoint}/${path}`,
                };
            }
            catch (error) {
                throw new Error(`Failed to upload to S3: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
        },
        async download(path) {
            try {
                const headers = await signer.sign('GET', `/${path}`, { host: `${bucket}.s3.${region}.amazonaws.com` }, null);
                const response = await fetch(`${endpoint}/${path}`, {
                    method: 'GET',
                    headers,
                });
                if (!response.ok) {
                    throw new Error(`S3 download failed: ${response.status}`);
                }
                const arrayBuffer = await response.arrayBuffer();
                return Buffer.from(arrayBuffer);
            }
            catch (error) {
                throw new Error(`Failed to download from S3: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
        },
        async delete(path) {
            try {
                const headers = await signer.sign('DELETE', `/${path}`, { host: `${bucket}.s3.${region}.amazonaws.com` }, null);
                const response = await fetch(`${endpoint}/${path}`, {
                    method: 'DELETE',
                    headers,
                });
                return response.ok || response.status === 204;
            }
            catch (error) {
                throw new Error(`Failed to delete from S3: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
        },
        async list(prefix = '', options) {
            try {
                const queryParams = {
                    'list-type': '2',
                };
                if (prefix) {
                    queryParams.prefix = prefix;
                }
                if (options?.delimiter) {
                    queryParams.delimiter = options.delimiter;
                }
                if (options?.limit) {
                    queryParams['max-keys'] = options.limit.toString();
                }
                if (options?.cursor) {
                    queryParams['continuation-token'] = options.cursor;
                }
                const headers = await signer.sign('GET', '/', { host: `${bucket}.s3.${region}.amazonaws.com` }, null, queryParams);
                const queryString = Object.keys(queryParams)
                    .map((key) => `${key}=${encodeURIComponent(queryParams[key])}`)
                    .join('&');
                const response = await fetch(`${endpoint}/?${queryString}`, {
                    method: 'GET',
                    headers,
                });
                if (!response.ok) {
                    throw new Error(`S3 list failed: ${response.status}`);
                }
                const xmlText = await response.text();
                const items = [];
                // Parse XML response (simple regex-based parsing for now)
                const contentsMatches = xmlText.matchAll(/<Contents>(.*?)<\/Contents>/gs);
                for (const match of contentsMatches) {
                    const content = match[1];
                    const keyMatch = content.match(/<Key>(.*?)<\/Key>/);
                    const sizeMatch = content.match(/<Size>(.*?)<\/Size>/);
                    const lastModifiedMatch = content.match(/<LastModified>(.*?)<\/LastModified>/);
                    const etagMatch = content.match(/<ETag>(.*?)<\/ETag>/);
                    if (keyMatch) {
                        const path = keyMatch[1];
                        items.push({
                            path,
                            name: path.split('/').pop() || path,
                            size: sizeMatch ? parseInt(sizeMatch[1], 10) : 0,
                            etag: etagMatch ? etagMatch[1].replace(/"/g, '') : undefined,
                            lastModified: lastModifiedMatch ? new Date(lastModifiedMatch[1]) : new Date(),
                            isFolder: false,
                            url: `${endpoint}/${path}`,
                        });
                    }
                }
                // Parse common prefixes (folders)
                const prefixMatches = xmlText.matchAll(/<CommonPrefixes>.*?<Prefix>(.*?)<\/Prefix>.*?<\/CommonPrefixes>/gs);
                for (const match of prefixMatches) {
                    const folderPath = match[1];
                    items.push({
                        path: folderPath,
                        name: folderPath.split('/').filter(Boolean).pop() || folderPath,
                        size: 0,
                        lastModified: new Date(),
                        isFolder: true,
                    });
                }
                const isTruncated = xmlText.includes('<IsTruncated>true</IsTruncated>');
                const nextTokenMatch = xmlText.match(/<NextContinuationToken>(.*?)<\/NextContinuationToken>/);
                return {
                    items,
                    hasMore: isTruncated,
                    nextCursor: nextTokenMatch ? nextTokenMatch[1] : undefined,
                };
            }
            catch (error) {
                throw new Error(`Failed to list S3 objects: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
        },
        async getMetadata(path) {
            try {
                const headers = await signer.sign('HEAD', `/${path}`, { host: `${bucket}.s3.${region}.amazonaws.com` }, null);
                const response = await fetch(`${endpoint}/${path}`, {
                    method: 'HEAD',
                    headers,
                });
                if (!response.ok) {
                    if (response.status === 404) {
                        return null;
                    }
                    throw new Error(`S3 metadata fetch failed: ${response.status}`);
                }
                const contentLength = response.headers.get('content-length');
                const contentType = response.headers.get('content-type');
                const lastModified = response.headers.get('last-modified');
                const etag = response.headers.get('etag')?.replace(/"/g, '');
                return {
                    path,
                    name: path.split('/').pop() || path,
                    size: contentLength ? parseInt(contentLength, 10) : 0,
                    contentType: contentType || undefined,
                    etag,
                    lastModified: lastModified ? new Date(lastModified) : new Date(),
                    isFolder: false,
                    url: `${endpoint}/${path}`,
                };
            }
            catch (error) {
                throw new Error(`Failed to get S3 metadata: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
        },
        async copy(source, destination) {
            try {
                const headers = await signer.sign('PUT', `/${destination}`, {
                    host: `${bucket}.s3.${region}.amazonaws.com`,
                    'x-amz-copy-source': `/${bucket}/${source}`,
                }, null);
                const response = await fetch(`${endpoint}/${destination}`, {
                    method: 'PUT',
                    headers,
                });
                if (!response.ok) {
                    throw new Error(`S3 copy failed: ${response.status}`);
                }
                // Get metadata of the new file
                const metadata = await this.getMetadata(destination);
                if (!metadata) {
                    throw new Error('Failed to get metadata after copy');
                }
                return metadata;
            }
            catch (error) {
                throw new Error(`Failed to copy in S3: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
        },
        async move(source, destination) {
            try {
                // Copy to destination
                const metadata = await this.copy(source, destination);
                // Delete source
                await this.delete(source);
                return metadata;
            }
            catch (error) {
                throw new Error(`Failed to move in S3: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
        },
        async getSignedUrl(path, expiresIn = 3600) {
            try {
                const now = Math.floor(Date.now() / 1000);
                const expires = now + expiresIn;
                const queryParams = {
                    'X-Amz-Algorithm': 'AWS4-HMAC-SHA256',
                    'X-Amz-Credential': `${accessKeyId}/${new Date().toISOString().slice(0, 10).replace(/-/g, '')}/${region}/s3/aws4_request`,
                    'X-Amz-Date': new Date().toISOString().replace(/[:-]|\.\d{3}/g, ''),
                    'X-Amz-Expires': expiresIn.toString(),
                    'X-Amz-SignedHeaders': 'host',
                };
                const headers = await signer.sign('GET', `/${path}`, { host: `${bucket}.s3.${region}.amazonaws.com` }, null, queryParams);
                // Extract signature from Authorization header
                const authHeader = headers['Authorization'];
                const signatureMatch = authHeader.match(/Signature=([a-f0-9]+)/);
                if (signatureMatch) {
                    queryParams['X-Amz-Signature'] = signatureMatch[1];
                }
                const queryString = Object.keys(queryParams)
                    .map((key) => `${key}=${encodeURIComponent(queryParams[key])}`)
                    .join('&');
                return `${endpoint}/${path}?${queryString}`;
            }
            catch (error) {
                throw new Error(`Failed to generate signed URL: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
        },
        async createFolder(path) {
            try {
                // S3 doesn't have real folders, but we can create an empty object with trailing slash
                const folderPath = path.endsWith('/') ? path : `${path}/`;
                await this.upload(folderPath, Buffer.from(''), { contentType: 'application/x-directory' });
                return true;
            }
            catch (error) {
                throw new Error(`Failed to create folder in S3: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
        },
    };
}
/**
 * S3 provider definition
 */
export const s3Provider = defineProvider(s3Info, async (config) => createS3Provider(config));
