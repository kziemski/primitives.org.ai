import type { BaseLayoutProps } from 'fumadocs-ui/layouts/shared'
import Image from 'next/image'

export function baseOptions(): BaseLayoutProps {
  return {
    nav: {
      title: (
        <>
          <Image src="/org-ai.svg" alt="" width={24} height={24} />
          Primitives.org.ai
        </>
      ),
    },
    links: [
      { text: 'MDXLD', url: 'https://mdx.org.ai', external: true },
      { text: 'schema.org.ai', url: 'https://schema.org.ai', external: true },
      { text: 'The Org.AI Foundation', url: 'https://foundation.org.ai', external: true },
    ],
    githubUrl: 'https://github.com/dot-org-ai/primitives.org.ai',
  }
}
