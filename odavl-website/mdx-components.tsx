import type { MDXComponents } from 'mdx/types';
import { CodeBlock } from '@/components/docs/CodeBlock';

export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    ...components,
    pre: ({ children, ...props }) => {
      if (typeof children === 'object' && children && 'props' in children) {
        const code = children.props?.children || '';
        const language = children.props?.className?.replace('language-', '') || '';
        return <CodeBlock language={language}>{code}</CodeBlock>;
      }
      return <pre {...props}>{children}</pre>;
    },
  };
}