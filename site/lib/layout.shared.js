import Image from 'next/image';
export function baseOptions() {
    return {
        nav: {
            title: (<>
          <Image src="/org-ai.svg" alt="" width={24} height={24}/>
          Primitives.org.ai
        </>),
        },
        githubUrl: 'https://github.com/dot-org-ai/primitives.org.ai',
    };
}
