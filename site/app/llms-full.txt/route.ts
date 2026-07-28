import { getLLMText, source } from '@/lib/source';

export const revalidate = false;

export async function GET() {
  const scan = source.getPages().map(getLLMText);
  const scanned = await Promise.all(scan);

  const header = `# Primitives.org.ai — full documentation

Documented by The Org.AI Foundation: https://foundation.org.ai
Authored in MDXLD (https://mdx.org.ai), our extension of MDX (https://mdxjs.com, an open standard authored by the MDX community).
`;

  return new Response([header, ...scanned].join('\n\n'));
}
